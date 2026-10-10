<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Handle Request Preflight dari Browser
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$user = "root";
$pass = "";
$db   = "db_penyewaan_camping";
$port = 3307;

// Matikan exception otomatis agar error dapat ditangkap secara bersih oleh script
mysqli_report(MYSQLI_REPORT_OFF);

$conn = @mysqli_connect($host, $user, $pass, $db, $port);

if (!$conn) {
    echo json_encode([
        "status" => "error",
        "message" => "Koneksi Database Gagal: " . mysqli_connect_error()
    ]);
    exit();
}
?>