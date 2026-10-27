<?php
// Menampilkan foto KTP. Hanya admin atau pemilik pesanan yang boleh melihat.
session_name('SICAMP_SESSION');
session_start();

require_once __DIR__ . '/koneksi.php';
require_once __DIR__ . '/ktp_helper.php';

if (empty($_SESSION['sicamp_authenticated'])) {
    http_response_code(401);
    exit('Silakan login terlebih dahulu.');
}

$user = $_SESSION['sicamp_user'] ?? [];
$id   = (int) ($_GET['id'] ?? 0);

$stmt = mysqli_prepare($conn, 'SELECT id_pelanggan, ktp FROM penyewaan WHERE id_penyewaan = ? LIMIT 1');
mysqli_stmt_bind_param($stmt, 'i', $id);
mysqli_stmt_execute($stmt);
$row = mysqli_fetch_assoc(mysqli_stmt_get_result($stmt));
mysqli_stmt_close($stmt);

if (!$row || empty($row['ktp'])) {
    http_response_code(404);
    exit;
}

$isAdmin = ($user['role'] ?? '') === 'admin';
$isOwner = (int) $row['id_pelanggan'] === (int) ($user['id_pelanggan'] ?? 0);
if (!$isAdmin && !$isOwner) {
    http_response_code(403);
    exit('Akses ditolak.');
}

// Cek folder baru dulu, lalu folder uploads lama (untuk data lama sebelum perbaikan ini)
$file = basename($row['ktp']);
$path = is_file(KTP_DIR . $file) ? KTP_DIR . $file : dirname(__DIR__) . '/uploads/' . $file;

if (!is_file($path)) {
    http_response_code(404);
    exit;
}

header('Content-Type: ' . (new finfo(FILEINFO_MIME_TYPE))->file($path));
header('Content-Length: ' . filesize($path));
header('Cache-Control: private, no-store');
header('X-Content-Type-Options: nosniff');
readfile($path);