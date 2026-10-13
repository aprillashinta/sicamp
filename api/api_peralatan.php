<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT p.*, k.nama_kategori 
              FROM peralatan p 
              LEFT JOIN kategori_peralatan k ON p.id_kategori = k.id_kategori 
              ORDER BY p.id_peralatan ASC";
    $result = mysqli_query($conn, $query);
    
    $peralatan = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $peralatan[] = $row;
        }
    }
    echo json_encode($peralatan);
    exit();
} 

elseif ($method === 'POST') {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);

    $id_kategori    = mysqli_real_escape_string($conn, $data['id_kategori'] ?? '');
    $nama_peralatan = mysqli_real_escape_string($conn, $data['nama_peralatan'] ?? '');
    $harga_sewa     = floatval($data['harga_sewa'] ?? 0);
    $stok           = intval($data['stok'] ?? 0);
    $gambar         = mysqli_real_escape_string($conn, $data['gambar'] ?? '');
    $deskripsi      = mysqli_real_escape_string($conn, $data['deskripsi'] ?? '');

    if (empty($id_kategori) || empty($nama_peralatan)) {
        echo json_encode(["status" => "error", "message" => "Kategori dan Nama Alat wajib diisi!"]);
        exit();
    }

    // Ambil ID Alat tertinggi untuk generate ID otomatis
    $resMax = mysqli_query($conn, "SELECT MAX(CAST(id_peralatan AS UNSIGNED)) as max_id FROM peralatan WHERE id_kategori = '$id_kategori'");
    $rowMax = mysqli_fetch_assoc($resMax);

    if ($rowMax && $rowMax['max_id']) {
        $next_id = intval($rowMax['max_id']) + 1;
    } else {
        $next_id = (intval($id_kategori) * 1000) + 1;
    }

    $queryInsert = "INSERT INTO peralatan (id_peralatan, id_kategori, nama_peralatan, deskripsi, gambar, stok, harga_sewa, kondisi, status) 
                    VALUES ('$next_id', '$id_kategori', '$nama_peralatan', '$deskripsi', '$gambar', $stok, $harga_sewa, 'Bagus', 'Aktif')";

    if (mysqli_query($conn, $queryInsert)) {
        echo json_encode([
            "status" => "success", 
            "message" => "Alat berhasil ditambahkan!", 
            "id_peralatan" => $next_id
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal Insert: " . mysqli_error($conn)]);
    }
    exit();
} 

elseif ($method === 'DELETE') {
    $id = mysqli_real_escape_string($conn, $_GET['id'] ?? '');

    if (!empty($id)) {
        $queryDelete = "DELETE FROM peralatan WHERE id_peralatan = '$id'";
        if (mysqli_query($conn, $queryDelete)) {
            echo json_encode(["status" => "success", "message" => "Alat berhasil dihapus!"]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal menghapus alat!"]);
        }
    } else {
        echo json_encode(["status" => "error", "message" => "ID Peralatan tidak valid!"]);
    }
    exit();
}
?>