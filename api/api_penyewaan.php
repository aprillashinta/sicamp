<?php
require_once 'koneksi.php';

global $conn;

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    $query = "SELECT * FROM penyewaan ORDER BY id_penyewaan DESC";
    $result = mysqli_query($conn, $query);
    
    $penyewaan = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $id_sewa = $row['id_penyewaan'];
            $detailQuery = "SELECT dp.*, p.nama_peralatan, p.gambar 
                           FROM detail_penyewaan dp 
                           LEFT JOIN peralatan p ON dp.id_peralatan = p.id_peralatan 
                           WHERE dp.id_penyewaan = '$id_sewa'";
            $detailRes = mysqli_query($conn, $detailQuery);
            
            $items = [];
            if ($detailRes) {
                while ($d = mysqli_fetch_assoc($detailRes)) {
                    $items[] = $d;
                }
            }
            $row['detail_items'] = $items;
            $penyewaan[] = $row;
        }
    }

    echo json_encode([
        "status" => "success",
        "data" => $penyewaan
    ]);
    exit();

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = isset($_GET['action']) ? $_GET['action'] : ($data['action'] ?? '');

    // Action Update Status (Verifikasi Pembayaran Admin)
    if ($action === 'update_status' || isset($data['status_only'])) {
        $id_sewa = mysqli_real_escape_string($conn, $data['id_penyewaan']);
        $status_baru = mysqli_real_escape_string($conn, $data['status']);

        $updateQuery = "UPDATE penyewaan SET status = '$status_baru' WHERE id_penyewaan = '$id_sewa'";
        
        if (mysqli_query($conn, $updateQuery)) {
            echo json_encode(["status" => "success", "message" => "Status berhasil diperbarui!"]);
        } else {
            echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
        }
        exit();
    }

    // Insert Transaksi Penyewaan Baru
    $kode_trx = "TRX-" . substr(time(), -6);
    $nama = mysqli_real_escape_string($conn, $data['nama_pelanggan'] ?? '');
    $no_wa = mysqli_real_escape_string($conn, $data['no_wa'] ?? '');
    $kontak_darurat = mysqli_real_escape_string($conn, $data['kontak_darurat'] ?? '');
    $alamat = mysqli_real_escape_string($conn, $data['alamat'] ?? '');
    $total_harga = floatval($data['total_harga'] ?? 0);
    $durasi_hari = intval($data['durasi_hari'] ?? 1);
    $tgl_sewa = mysqli_real_escape_string($conn, $data['tgl_sewa'] ?? date('Y-m-d'));
    $tgl_kembali = mysqli_real_escape_string($conn, $data['tgl_kembali_rencana'] ?? date('Y-m-d'));
    $status = 'Menunggu Verifikasi';

    $query = "INSERT INTO penyewaan (kode_transaksi, nama_pelanggan, no_wa, kontak_darurat, alamat, total_harga, durasi_hari, tgl_sewa, tgl_kembali_rencana, status) 
              VALUES ('$kode_trx', '$nama', '$no_wa', '$kontak_darurat', '$alamat', '$total_harga', '$durasi_hari', '$tgl_sewa', '$tgl_kembali', '$status')";

    if (mysqli_query($conn, $query)) {
        $id_sewa = mysqli_insert_id($conn);

        if (isset($data['detail_items']) && is_array($data['detail_items'])) {
            foreach ($data['detail_items'] as $item) {
                $id_alat = mysqli_real_escape_string($conn, $item['id_peralatan']);
                $qty = intval($item['qty']);
                $harga = floatval($item['harga_sewa']);

                mysqli_query($conn, "INSERT INTO detail_penyewaan (id_penyewaan, id_peralatan, qty, harga_sewa) VALUES ('$id_sewa', '$id_alat', '$qty', '$harga')");
                mysqli_query($conn, "UPDATE peralatan SET stok = GREATEST(0, stok - $qty) WHERE id_peralatan = '$id_alat'");
            }
        }

        echo json_encode(["status" => "success", "message" => "Penyewaan berhasil disimpan!", "id_penyewaan" => $id_sewa, "kode_transaksi" => $kode_trx]);
    } else {
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
    }
    exit();

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id_sewa = mysqli_real_escape_string($conn, $data['id_penyewaan']);
    $status_baru = mysqli_real_escape_string($conn, $data['status']);

    $updateQuery = "UPDATE penyewaan SET status = '$status_baru' WHERE id_penyewaan = '$id_sewa'";
    
    if (mysqli_query($conn, $updateQuery)) {
        echo json_encode(["status" => "success", "message" => "Status berhasil diperbarui!"]);
    } else {
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
    }
    exit();
}
?>