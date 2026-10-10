<?php
header('Content-Type: application/json');
include 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Ambil semua kategori dari MySQL
    $sql = "SELECT * FROM kategori_peralatan ORDER BY id_kategori ASC";
    $result = $conn->query($sql);
    $data = [];
    while($row = $result->fetch_assoc()){
        $data[] = $row;
    }
    echo json_encode($data);

} else if ($method === 'POST') {
    // Tambah kategori baru ke MySQL
    $input = json_decode(file_get_contents('php://input'), true);
    $nama = $input['nama_kategori'];
    
    $stmt = $conn->prepare("INSERT INTO kategori_peralatan (nama_kategori) VALUES (?)");
    $stmt->bind_param("s", $nama);
    if($stmt->execute()){
        echo json_encode(["status" => "success", "id" => $stmt->insert_id]);
    } else {
        echo json_encode(["status" => "error"]);
    }
}
?>