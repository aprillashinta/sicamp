<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', '0');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
header('Content-Type: application/json; charset=utf-8');

/*
 * SiCamp API penyewaan disesuaikan dengan db_penyewaan_camping:
 * penyewaan(id_penyewaan,id_pelanggan,kode_transaksi,tanggal_penyewaan,
 * tanggal_mulai,tanggal_kembali_rencana,total_harga,status)
 * detail_penyewaan(id_detail,id_penyewaan,id_peralatan,jumlah,harga_satuan,subtotal)
 * pembayaran(id_pembayaran,id_penyewaan,tanggal_pembayaran,jumlah_bayar,
 * bukti_pembayaran,status,catatan)
 */

try {
    $connectionCandidates = [__DIR__ . '/koneksi.php', dirname(__DIR__) . '/koneksi.php'];
    $connectionFile = null;
    foreach ($connectionCandidates as $candidate) {
        if (is_file($candidate)) {
            $connectionFile = $candidate;
            break;
        }
    }
    if (!$connectionFile) {
        throw new RuntimeException('File koneksi.php tidak ditemukan.');
    }
    require_once $connectionFile;

    if (!isset($conn) || !($conn instanceof mysqli)) {
        throw new RuntimeException('Variabel koneksi $conn tidak tersedia. Periksa koneksi.php.');
    }
    $conn->set_charset('utf8mb4');

    function respond(array $payload, int $httpCode = 200): void {
        http_response_code($httpCode);
        if (ob_get_length()) ob_clean();
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    function readInput(): array {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw ?: '[]', true);
        return is_array($data) ? $data : [];
    }

    function fetchTransactions(mysqli $conn): array {
        $sql = "SELECT p.id_penyewaan, p.id_pelanggan, p.kode_transaksi,
                       p.tanggal_penyewaan, p.tanggal_mulai,
                       p.tanggal_kembali_rencana, p.total_harga,
                       p.status AS status_transaksi,
                       pl.nama_pelanggan, pl.no_telepon,
                       pb.id_pembayaran, pb.tanggal_pembayaran,
                       pb.jumlah_bayar, pb.bukti_pembayaran,
                       pb.status AS status_pembayaran, pb.catatan AS catatan_pembayaran
                FROM penyewaan p
                LEFT JOIN pelanggan pl ON pl.id_pelanggan = p.id_pelanggan
                LEFT JOIN pembayaran pb ON pb.id_pembayaran = (
                    SELECT MAX(pb2.id_pembayaran)
                    FROM pembayaran pb2
                    WHERE pb2.id_penyewaan = p.id_penyewaan
                )
                ORDER BY p.id_penyewaan DESC";
        $result = $conn->query($sql);
        $transactions = [];
        while ($row = $result->fetch_assoc()) {
            $id = (int)$row['id_penyewaan'];
            $detailStmt = $conn->prepare(
                "SELECT dp.id_detail, dp.id_penyewaan, dp.id_peralatan,
                        dp.jumlah AS qty, dp.harga_satuan AS harga_sewa,
                        dp.subtotal, pr.nama_peralatan, pr.gambar
                 FROM detail_penyewaan dp
                 LEFT JOIN peralatan pr ON pr.id_peralatan = dp.id_peralatan
                 WHERE dp.id_penyewaan = ?"
            );
            $detailStmt->bind_param('i', $id);
            $detailStmt->execute();
            $detailsResult = $detailStmt->get_result();
            $details = [];
            while ($detail = $detailsResult->fetch_assoc()) {
                $details[] = $detail;
            }
            $detailStmt->close();

            // Alias ini menjaga kompatibilitas dengan halaman verifikasi yang sudah ada.
            $row['id'] = $row['id_penyewaan'];
            $row['kode_booking'] = $row['kode_transaksi'];
            $row['nama'] = $row['nama_pelanggan'] ?? 'Pelanggan';
            $row['no_wa'] = $row['no_telepon'] ?? '';
            $row['tgl_sewa'] = $row['tanggal_mulai'];
            $row['tgl_kembali_rencana'] = $row['tanggal_kembali_rencana'];
            $row['status'] = $row['status_pembayaran'] ?: $row['status_transaksi'];
            $row['bukti_transfer'] = $row['bukti_pembayaran'] ?? '';
            $row['catatan'] = $row['catatan_pembayaran'] ?? '';
            $row['detail_items'] = $details;
            $transactions[] = $row;
        }
        return $transactions;
    }

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        respond(['status' => 'success', 'data' => fetchTransactions($conn)]);
    }

    if ($method === 'POST') {
        $data = readInput();
        $action = $_GET['action'] ?? ($data['action'] ?? '');

        if (in_array($action, ['update_status', 'verify', 'reject'], true) || isset($data['status_only'])) {
            $id = filter_var($data['id_penyewaan'] ?? $data['id'] ?? '', FILTER_VALIDATE_INT);
            $code = trim((string)($data['kode_transaksi'] ?? $data['kode'] ?? ''));
            $requestedStatus = trim((string)($data['status'] ?? ''));
            $note = trim((string)($data['catatan'] ?? $data['catatan_pembayaran'] ?? $data['alasan_penolakan'] ?? ''));

            if (!$id && $code === '') {
                respond(['status' => 'error', 'message' => 'ID penyewaan atau kode transaksi wajib diisi.'], 422);
            }
            $paymentStatus = match (strtolower($requestedStatus)) {
                'terverifikasi', 'disetujui', 'approved' => 'Terverifikasi',
                'ditolak', 'reject', 'rejected', 'batal', 'gagal' => 'Ditolak',
                'menunggu', 'menunggu verifikasi', 'menunggu pembayaran', 'pending' => 'Menunggu',
                default => null,
            };
            if ($paymentStatus === null) {
                respond(['status' => 'error', 'message' => 'Status pembayaran tidak valid.'], 422);
            }

            $conn->begin_transaction();
            try {
                if ($id) {
                    $stmt = $conn->prepare('SELECT id_penyewaan, kode_transaksi FROM penyewaan WHERE id_penyewaan = ? FOR UPDATE');
                    $stmt->bind_param('i', $id);
                } else {
                    $stmt = $conn->prepare('SELECT id_penyewaan, kode_transaksi FROM penyewaan WHERE kode_transaksi = ? FOR UPDATE');
                    $stmt->bind_param('s', $code);
                }
                $stmt->execute();
                $rental = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                if (!$rental) {
                    $conn->rollback();
                    respond(['status' => 'error', 'message' => 'Transaksi penyewaan tidak ditemukan.'], 404);
                }
                $rentalId = (int)$rental['id_penyewaan'];

                $findPayment = $conn->prepare('SELECT id_pembayaran FROM pembayaran WHERE id_penyewaan = ? ORDER BY id_pembayaran DESC LIMIT 1 FOR UPDATE');
                $findPayment->bind_param('i', $rentalId);
                $findPayment->execute();
                $payment = $findPayment->get_result()->fetch_assoc();
                $findPayment->close();

                if ($payment) {
                    $paymentId = (int)$payment['id_pembayaran'];
                    $updatePayment = $conn->prepare('UPDATE pembayaran SET status = ?, catatan = ? WHERE id_pembayaran = ?');
                    $updatePayment->bind_param('ssi', $paymentStatus, $note, $paymentId);
                    $updatePayment->execute();
                    $updatePayment->close();
                } else {
                    // Membuat catatan pembayaran jika transaksi belum memiliki baris pembayaran.
                    $amountStmt = $conn->prepare('SELECT total_harga FROM penyewaan WHERE id_penyewaan = ?');
                    $amountStmt->bind_param('i', $rentalId);
                    $amountStmt->execute();
                    $amount = (float)($amountStmt->get_result()->fetch_assoc()['total_harga'] ?? 0);
                    $amountStmt->close();
                    $insertPayment = $conn->prepare('INSERT INTO pembayaran (id_penyewaan, tanggal_pembayaran, jumlah_bayar, bukti_pembayaran, status, catatan) VALUES (?, NOW(), ?, NULL, ?, ?)');
                    $insertPayment->bind_param('idss', $rentalId, $amount, $paymentStatus, $note);
                    $insertPayment->execute();
                    $insertPayment->close();
                }

                // Kolom status penyewaan memakai ENUM yang berbeda dari status pembayaran.
                if ($paymentStatus === 'Terverifikasi') {
                    $rentalStatus = 'Disetujui';
                } elseif ($paymentStatus === 'Ditolak') {
                    $rentalStatus = 'Dibatalkan';
                } else {
                    $rentalStatus = 'Menunggu Verifikasi';
                }
                $updateRental = $conn->prepare('UPDATE penyewaan SET status = ? WHERE id_penyewaan = ?');
                $updateRental->bind_param('si', $rentalStatus, $rentalId);
                $updateRental->execute();
                $updateRental->close();

                $conn->commit();
                respond(['status' => 'success', 'message' => 'Status pembayaran berhasil diperbarui.']);
            } catch (Throwable $e) {
                $conn->rollback();
                throw $e;
            }
        }

        // Pembuatan transaksi menggunakan struktur database aktual.
        $customerId = filter_var($data['id_pelanggan'] ?? '', FILTER_VALIDATE_INT);
        $details = $data['detail_items'] ?? [];
        if (!$customerId) {
            respond(['status' => 'error', 'message' => 'id_pelanggan wajib diisi dan harus terdaftar.'], 422);
        }
        if (!is_array($details) || count($details) === 0) {
            respond(['status' => 'error', 'message' => 'Detail peralatan penyewaan wajib diisi.'], 422);
        }

        $startDate = (string)($data['tanggal_mulai'] ?? $data['tgl_sewa'] ?? date('Y-m-d'));
        $returnDate = (string)($data['tanggal_kembali_rencana'] ?? $data['tgl_kembali_rencana'] ?? date('Y-m-d', strtotime($startDate . ' +1 day')));
        $transactionDate = date('Y-m-d');
        $code = 'SC-' . date('ymdHis') . random_int(10, 99);
        $total = 0.0;
        foreach ($details as $detail) {
            $qty = (int)($detail['jumlah'] ?? $detail['qty'] ?? 0);
            $price = (float)($detail['harga_satuan'] ?? $detail['harga_sewa'] ?? 0);
            if ((int)($detail['id_peralatan'] ?? 0) < 1 || $qty < 1 || $price < 0) {
                respond(['status' => 'error', 'message' => 'Data detail peralatan tidak valid.'], 422);
            }
            $total += $qty * $price;
        }

        $conn->begin_transaction();
        try {
            $customerStmt = $conn->prepare('SELECT id_pelanggan FROM pelanggan WHERE id_pelanggan = ?');
            $customerStmt->bind_param('i', $customerId);
            $customerStmt->execute();
            $customerExists = $customerStmt->get_result()->fetch_assoc();
            $customerStmt->close();
            if (!$customerExists) {
                throw new RuntimeException('Pelanggan tidak ditemukan.');
            }

            $rentalStatus = 'Menunggu Verifikasi';
            $insertRental = $conn->prepare('INSERT INTO penyewaan (id_pelanggan, kode_transaksi, tanggal_penyewaan, tanggal_mulai, tanggal_kembali_rencana, total_harga, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $insertRental->bind_param('issssds', $customerId, $code, $transactionDate, $startDate, $returnDate, $total, $rentalStatus);
            $insertRental->execute();
            $rentalId = (int)$conn->insert_id;
            $insertRental->close();

            foreach ($details as $detail) {
                $equipmentId = (int)$detail['id_peralatan'];
                $qty = (int)($detail['jumlah'] ?? $detail['qty'] ?? 0);
                $price = (float)($detail['harga_satuan'] ?? $detail['harga_sewa'] ?? 0);
                $subtotal = $qty * $price;
                $stockStmt = $conn->prepare('SELECT stok FROM peralatan WHERE id_peralatan = ? FOR UPDATE');
                $stockStmt->bind_param('i', $equipmentId);
                $stockStmt->execute();
                $equipment = $stockStmt->get_result()->fetch_assoc();
                $stockStmt->close();
                if (!$equipment || (int)$equipment['stok'] < $qty) {
                    throw new RuntimeException('Peralatan tidak ditemukan atau stok tidak mencukupi (ID ' . $equipmentId . ').');
                }
                $insertDetail = $conn->prepare('INSERT INTO detail_penyewaan (id_penyewaan, id_peralatan, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)');
                $insertDetail->bind_param('iiidd', $rentalId, $equipmentId, $qty, $price, $subtotal);
                $insertDetail->execute();
                $insertDetail->close();

                $stockUpdate = $conn->prepare('UPDATE peralatan SET stok = stok - ? WHERE id_peralatan = ?');
                $stockUpdate->bind_param('ii', $qty, $equipmentId);
                $stockUpdate->execute();
                $stockUpdate->close();
            }

            $paymentStatus = 'Menunggu';
            $paymentNote = '';
            $insertPayment = $conn->prepare('INSERT INTO pembayaran (id_penyewaan, tanggal_pembayaran, jumlah_bayar, bukti_pembayaran, status, catatan) VALUES (?, NULL, ?, NULL, ?, ?)');
            $insertPayment->bind_param('idss', $rentalId, $total, $paymentStatus, $paymentNote);
            $insertPayment->execute();
            $insertPayment->close();

            $conn->commit();
            respond(['status' => 'success', 'message' => 'Penyewaan berhasil disimpan.', 'id_penyewaan' => $rentalId, 'kode_transaksi' => $code]);
        } catch (Throwable $e) {
            $conn->rollback();
            throw $e;
        }
    }

    if ($method === 'PUT') {
        $data = readInput();
        $id = filter_var($data['id_penyewaan'] ?? $data['id'] ?? '', FILTER_VALIDATE_INT);
        $status = trim((string)($data['status'] ?? ''));
        if (!$id || !in_array($status, ['Menunggu Pembayaran', 'Menunggu Verifikasi', 'Disetujui', 'Sedang Disewa', 'Selesai', 'Dibatalkan'], true)) {
            respond(['status' => 'error', 'message' => 'ID penyewaan atau status tidak valid.'], 422);
        }
        $stmt = $conn->prepare('UPDATE penyewaan SET status = ? WHERE id_penyewaan = ?');
        $stmt->bind_param('si', $status, $id);
        $stmt->execute();
        $stmt->close();
        respond(['status' => 'success', 'message' => 'Status penyewaan berhasil diperbarui.']);
    }

    respond(['status' => 'error', 'message' => 'Metode HTTP tidak didukung.'], 405);
} catch (Throwable $e) {
    error_log('api_penyewaan.php: ' . $e->getMessage());
    respond(['status' => 'error', 'message' => 'Terjadi kesalahan pada API. Periksa struktur database dan log PHP.'], 500);
}
