<?php
require_once 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Ambil semua transaksi
    $query = "SELECT * FROM penyewaan ORDER BY id_penyewaan DESC";
    $result = mysqli_query($conn, $query);
    
    $penyewaan = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // Ambil detail items per transaksi
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
    
    echo json_encode($penyewaan);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $kode_trx = "TRX-" . substr(time(), -6);
    $nama = mysqli_real_escape_string($conn, $data['nama_pelanggan']);
    $no_wa = mysqli_real_escape_string($conn, $data['no_wa']);
    $kontak_darurat = mysqli_real_escape_string($conn, $data['kontak_darurat']);
    $alamat = mysqli_real_escape_string($conn, $data['alamat']);
    $total_harga = $data['total_harga'];
    $durasi_hari = $data['durasi_hari'];
    $tgl_sewa = $data['tgl_sewa'];
    $tgl_kembali = $data['tgl_kembali_rencana'];
    $status = 'Menunggu Verifikasi';

    // Insert Transaksi Penyewaan
    $query = "INSERT INTO penyewaan (kode_transaksi, nama_pelanggan, no_wa, kontak_darurat, alamat, total_harga, durasi_hari, tgl_sewa, tgl_kembali_rencana, status) 
              VALUES ('$kode_trx', '$nama', '$no_wa', '$kontak_darurat', '$alamat', '$total_harga', '$durasi_hari', '$tgl_sewa', '$tgl_kembali', '$status')";

    if (mysqli_query($conn, $query)) {
        $id_sewa = mysqli_insert_id($conn);

        // Insert Detail Barang & Potong Stok MySQL
        if (isset($data['detail_items']) && is_array($data['detail_items'])) {
            foreach ($data['detail_items'] as $item) {
                $id_alat = $item['id_peralatan'];
                $qty = $item['qty'];
                $harga = $item['harga_sewa'];

                mysqli_query($conn, "INSERT INTO detail_penyewaan (id_penyewaan, id_peralatan, qty, harga_sewa) VALUES ('$id_sewa', '$id_alat', '$qty', '$harga')");
                mysqli_query($conn, "UPDATE peralatan SET stok = GREATEST(0, stok - $qty) WHERE id_peralatan = '$id_alat'");
            }
        }

        echo json_encode(["status" => "success", "message" => "Penyewaan berhasil disimpan!"]);
    } else {
        echo json_encode(["status" => "error", "message" => mysqli_error($conn)]);
    }
}
?>