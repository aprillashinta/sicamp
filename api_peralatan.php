<?php
require_once 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT p.*, k.nama_kategori 
              FROM peralatan p 
              LEFT JOIN kategori_peralatan k ON p.id_kategori = k.id_kategori";
    $result = mysqli_query($conn, $query);
    
    $peralatan = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $peralatan[] = $row;
    }
    
    echo json_encode($peralatan);
}
?>