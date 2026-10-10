<?php
require_once 'koneksi.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';
$data = json_decode(file_get_contents("php://input"), true);

if ($action === 'login') {
    $username = mysqli_real_escape_string($conn, $data['username']);
    $password = mysqli_real_escape_string($conn, $data['password']);

    if ($username === 'admin' && $password === 'admin123') {
        echo json_encode([
            "status" => "success",
            "user" => ["nama" => "Administrator", "role" => "admin"]
        ]);
        exit();
    }

    $query = "SELECT * FROM pelanggan WHERE (email='$username' OR nama_pelanggan='$username') AND password='$password'";
    $result = mysqli_query($conn, $query);

    if (mysqli_num_rows($result) > 0) {
        $row = mysqli_fetch_assoc($result);
        echo json_encode([
            "status" => "success",
            "user" => [
                "id" => $row['id_pelanggan'],
                "nama" => $row['nama_pelanggan'],
                "email" => $row['email'],
                "role" => "pelanggan"
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Email/Username atau Password salah!"]);
    }
} elseif ($action === 'register') {
    $nama = mysqli_real_escape_string($conn, $data['nama']);
    $email = mysqli_real_escape_string($conn, $data['email']);
    $password = mysqli_real_escape_string($conn, $data['password']);

    // Cek email
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