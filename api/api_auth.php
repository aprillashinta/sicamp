<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'koneksi.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true) ?? $_POST;

if ($action === 'login') {
    $username = mysqli_real_escape_string($conn, $data['username'] ?? '');
    $password = mysqli_real_escape_string($conn, $data['password'] ?? '');

    // 1. Cek Login Admin di Database MySQL (Tabel admin)
    $queryAdmin = "SELECT * FROM admin WHERE username='$username' AND password='$password'";
    $resultAdmin = mysqli_query($conn, $queryAdmin);

    if (mysqli_num_rows($resultAdmin) > 0) {
        $rowAdmin = mysqli_fetch_assoc($resultAdmin);
        echo json_encode([
            "status" => "success",
            "user" => [
                "id" => $rowAdmin['id_admin'],
                "nama" => $rowAdmin['nama_admin'],
                "role" => "admin"
            ]
        ]);
        exit();
    }

    // 2. Cek Login Pelanggan di Database MySQL (Tabel pelanggan)
    $queryPelanggan = "SELECT * FROM pelanggan WHERE (email='$username' OR nama_pelanggan='$username') AND password='$password'";
    $resultPelanggan = mysqli_query($conn, $queryPelanggan);

    if (mysqli_num_rows($resultPelanggan) > 0) {
        $rowPelanggan = mysqli_fetch_assoc($resultPelanggan);
        echo json_encode([
            "status" => "success",
            "user" => [
                "id" => $rowPelanggan['id_pelanggan'],
                "nama" => $rowPelanggan['nama_pelanggan'],
                "email" => $rowPelanggan['email'],
                "role" => "pelanggan"
            ]
        ]);
    } else {
        echo json_encode([
            "status" => "error", 
            "message" => "Username/Email atau Password salah!"
        ]);
    }
} elseif ($action === 'register') {
    $nama = mysqli_real_escape_string($conn, $data['nama'] ?? '');
    $email = mysqli_real_escape_string($conn, $data['email'] ?? '');
    $password = mysqli_real_escape_string($conn, $data['password'] ?? '');

    $check = mysqli_query($conn, "SELECT * FROM pelanggan WHERE email='$email'");
    if (mysqli_num_rows($check) > 0) {
        echo json_encode(["status" => "error", "message" => "Email sudah terdaftar!"]);
        exit();
    }

    $query = "INSERT INTO pelanggan (nama_pelanggan, email, password) VALUES ('$nama', '$email', '$password')";
    if (mysqli_query($conn, $query)) {
        echo json_encode(["status" => "success", "message" => "Pendaftaran berhasil!"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Gagal mendaftar: " . mysqli_error($conn)]);
    }
}
?>