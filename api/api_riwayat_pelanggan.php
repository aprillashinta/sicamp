<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', '0');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');

function respond(array $data, int $code = 200): void {
    http_response_code($code);
    if (ob_get_length()) ob_clean();
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $candidates = [__DIR__ . '/koneksi.php', dirname(__DIR__) . '/koneksi.php'];
    $connectionFile = null;
    foreach ($candidates as $file) {
        if (is_file($file)) { $connectionFile = $file; break; }
    }
    if (!$connectionFile) throw new RuntimeException('File koneksi.php tidak ditemukan.');
    require_once $connectionFile;
    if (!isset($conn) || !($conn instanceof mysqli)) throw new RuntimeException('Koneksi database $conn tidak tersedia.');
    $conn->set_charset('utf8mb4');

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
        respond(['status' => 'error', 'message' => 'Metode request tidak didukung.'], 405);
    }

    // ID pelanggan berasal dari sesi login yang dibaca halaman pelanggan.
    $customerId = filter_input(INPUT_GET, 'id_pelanggan', FILTER_VALIDATE_INT);
    if (!$customerId || $customerId < 1) {
        respond(['status' => 'error', 'message' => 'ID pelanggan tidak ditemukan. Silakan login kembali.'], 401);
    }

    $sql = "SELECT p.id_penyewaan, p.id_pelanggan, p.kode_transaksi,
                p.tanggal_penyewaan, p.tanggal_mulai, p.tanggal_kembali_rencana,
                p.total_harga, p.status AS status_penyewaan, p.ktp,
                pb.id_pembayaran, pb.tanggal_pembayaran, pb.jumlah_bayar,
                pb.bukti_pembayaran, pb.status AS status_pembayaran, pb.catatan
            FROM penyewaan p
            LEFT JOIN pembayaran pb ON pb.id_pembayaran = (
                SELECT MAX(pb2.id_pembayaran) FROM pembayaran pb2
                WHERE pb2.id_penyewaan = p.id_penyewaan
            )
            WHERE p.id_pelanggan = ?
            ORDER BY p.id_penyewaan DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $customerId);
    $stmt->execute();
    $result = $stmt->get_result();
    $transactions = [];

    $detailStmt = $conn->prepare(
        "SELECT dp.id_detail, dp.id_peralatan, dp.jumlah, dp.harga_satuan,
                dp.subtotal, COALESCE(pr.nama_peralatan, 'Paket/Peralatan') AS nama_peralatan,
                pr.gambar
         FROM detail_penyewaan dp
         LEFT JOIN peralatan pr ON pr.id_peralatan = dp.id_peralatan
         WHERE dp.id_penyewaan = ?
         ORDER BY dp.id_detail ASC"
    );

    while ($row = $result->fetch_assoc()) {
        $rentalId = (int)$row['id_penyewaan'];
        $detailStmt->bind_param('i', $rentalId);
        $detailStmt->execute();
        $detailResult = $detailStmt->get_result();
        $items = [];
        while ($item = $detailResult->fetch_assoc()) $items[] = $item;
        $row['detail_items'] = $items;
        $row['ktp'] = !empty($row['ktp']) ? 'api/api_ktp.php?id=' . $rentalId : '';
        // Status utama menampilkan status penyewaan, status pembayaran disediakan terpisah.
        $row['status'] = $row['status_penyewaan'] ?? 'Menunggu Pembayaran';
        $transactions[] = $row;
    }
    $detailStmt->close();
    $stmt->close();
    respond(['status' => 'success', 'data' => $transactions]);
} catch (Throwable $e) {
    error_log('API riwayat pelanggan: ' . $e->getMessage());
    respond(['status' => 'error', 'message' => 'Riwayat penyewaan gagal dimuat. Periksa koneksi database.'], 500);
}
