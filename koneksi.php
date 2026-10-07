<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Content-Type: application/json; charset=UTF-8");

$host = "localhost";
$user = "root";
$pass = "";
$db   = "db_penyewaan_camping"; // Sesuaikan dengan nama database di phpMyAdmin Anda

$conn = mysqli_connect($host, $user, $pass, $db);

if (!$conn) {
    echo json_encode([
        "status" => "error",
        "message" => "Koneksi Database Gagal: " . mysqli_connect_error()
    ]);
    exit();
}
?>