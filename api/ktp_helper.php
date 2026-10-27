<?php
// Foto KTP disimpan di luar folder yang bisa dibuka lewat URL: <root proyek>/storage/ktp/
define('KTP_DIR', dirname(__DIR__) . '/storage/ktp/');
const KTP_MAX_BYTES = 2 * 1024 * 1024; // 2 MB

/** Simpan upload KTP, kembalikan nama file acak. Lempar RuntimeException jika tidak valid. */
function saveKtpUpload(array $file): string
{
    if (!isset($file['error']) || is_array($file['error']) || $file['error'] === UPLOAD_ERR_NO_FILE) {
        throw new RuntimeException('Foto KTP/KTM wajib diunggah.');
    }
    if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
        throw new RuntimeException('Ukuran foto KTP maksimal 2 MB.');
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Gagal mengunggah foto KTP.');
    }
    if ($file['size'] > KTP_MAX_BYTES) {
        throw new RuntimeException('Ukuran foto KTP maksimal 2 MB.');
    }
    if (!is_uploaded_file($file['tmp_name'])) {
        throw new RuntimeException('Upload tidak valid.');
    }

    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    $allowed = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!isset($allowed[$mime]) || @getimagesize($file['tmp_name']) === false) {
        throw new RuntimeException('Foto KTP harus berformat JPG, PNG, atau WEBP.');
    }

    if (!is_dir(KTP_DIR) && !mkdir(KTP_DIR, 0755, true)) {
        throw new RuntimeException('Folder penyimpanan KTP tidak dapat dibuat.');
    }
    // Lapisan pengaman tambahan: blokir akses langsung lewat Apache
    $ht = KTP_DIR . '.htaccess';
    if (!is_file($ht)) { @file_put_contents($ht, "Require all denied\n"); }

    $name = bin2hex(random_bytes(16)) . '.' . $allowed[$mime];
    if (!move_uploaded_file($file['tmp_name'], KTP_DIR . $name)) {
        throw new RuntimeException('Gagal menyimpan foto KTP.');
    }
    return $name;
}