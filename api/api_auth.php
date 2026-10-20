<?php

header('Content-Type: application/json; charset=utf-8');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/koneksi.php';

/*
|--------------------------------------------------------------------------
| Helper Response
|--------------------------------------------------------------------------
*/

function sendResponse($status, $message, $data = [], $httpCode = 200)
{
    http_response_code($httpCode);

    echo json_encode(
        array_merge(
            [
                'status' => $status,
                'message' => $message
            ],
            $data
        ),
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

/*
|--------------------------------------------------------------------------
| Read JSON Request
|--------------------------------------------------------------------------
*/

$input = json_decode(
    file_get_contents('php://input'),
    true
);

if (!is_array($input)) {
    $input = [];
}

$action = $_GET['action'] ?? $input['action'] ?? '';

/*
|--------------------------------------------------------------------------
| Verify Password
|--------------------------------------------------------------------------
|
| Mendukung password_hash() dan password lama berupa teks biasa.
| Password lama akan diubah menjadi hash setelah login berhasil.
|
*/

function verifyAndUpgradePassword(
    mysqli $conn,
    string $table,
    string $idColumn,
    int $id,
    string $storedPassword,
    string $inputPassword
): bool {
    $passwordInfo = password_get_info($storedPassword);

    $isHashed = isset($passwordInfo['algoName'])
        && $passwordInfo['algoName'] !== 'unknown';

    if ($isHashed) {
        if (!password_verify($inputPassword, $storedPassword)) {
            return false;
        }

        if (password_needs_rehash(
            $storedPassword,
            PASSWORD_DEFAULT
        )) {
            $newHash = password_hash(
                $inputPassword,
                PASSWORD_DEFAULT
            );

            $sql = "UPDATE `$table`
                    SET `password` = ?
                    WHERE `$idColumn` = ?";

            $stmt = $conn->prepare($sql);

            if ($stmt) {
                $stmt->bind_param('si', $newHash, $id);
                $stmt->execute();
                $stmt->close();
            }
        }

        return true;
    }

    /*
     * Dukungan sementara untuk data lama yang belum di-hash.
     */

    if (!hash_equals($storedPassword, $inputPassword)) {
        return false;
    }

    $newHash = password_hash(
        $inputPassword,
        PASSWORD_DEFAULT
    );

    $sql = "UPDATE `$table`
            SET `password` = ?
            WHERE `$idColumn` = ?";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        return false;
    }

    $stmt->bind_param('si', $newHash, $id);

    $updated = $stmt->execute();

    $stmt->close();

    /*
     * Login tetap berhasil jika kredensial benar.
     * Jika pembaruan hash gagal, perbaiki database
     * sebelum menggunakannya pada lingkungan produksi.
     */

    return true;
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(
            'error',
            'Metode permintaan tidak diizinkan.',
            [],
            405
        );
    }

    $usernameOrEmail = trim(
        (string) ($input['username'] ?? '')
    );

    $password = (string) ($input['password'] ?? '');

    if ($usernameOrEmail === '' || $password === '') {
        sendResponse(
            'error',
            'Username atau email dan kata sandi wajib diisi.',
            [],
            400
        );
    }

    /*
    |--------------------------------------------------------------------------
    | 1. LOGIN ADMIN: USERNAME SAJA
    |--------------------------------------------------------------------------
    */

    $sqlAdmin = "
        SELECT
            id_admin,
            username,
            password,
            nama_admin
        FROM admin
        WHERE username = ?
        LIMIT 1
    ";

    $stmtAdmin = $conn->prepare($sqlAdmin);

    if (!$stmtAdmin) {
        error_log('Prepare admin login gagal: ' . $conn->error);

        sendResponse(
            'error',
            'Terjadi kendala pada layanan autentikasi.',
            [],
            500
        );
    }

    $stmtAdmin->bind_param('s', $usernameOrEmail);
    $stmtAdmin->execute();

    $resultAdmin = $stmtAdmin->get_result();
    $admin = $resultAdmin->fetch_assoc();

    $stmtAdmin->close();

    if ($admin) {
        $adminId = (int) $admin['id_admin'];

        $validPassword = verifyAndUpgradePassword(
            $conn,
            'admin',
            'id_admin',
            $adminId,
            (string) $admin['password'],
            $password
        );

        if ($validPassword) {
            sendResponse(
                'success',
                'Login berhasil.',
                [
                    'user' => [
                        'id' => $adminId,
                        'id_admin' => $adminId,
                        'username' => $admin['username'],
                        'nama' => $admin['nama_admin'],
                        'nama_admin' => $admin['nama_admin'],
                        'role' => 'admin'
                    ]
                ]
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | 2. LOGIN PELANGGAN: EMAIL SAJA
    |--------------------------------------------------------------------------
    */

    $sqlPelanggan = "
        SELECT
            id_pelanggan,
            nama_pelanggan,
            email,
            alamat,
            password
        FROM pelanggan
        WHERE email = ?
        LIMIT 1
    ";

    $stmtPelanggan = $conn->prepare($sqlPelanggan);

    if (!$stmtPelanggan) {
        error_log(
            'Prepare customer login gagal: ' . $conn->error
        );

        sendResponse(
            'error',
            'Terjadi kendala pada layanan autentikasi.',
            [],
            500
        );
    }

    $stmtPelanggan->bind_param(
        's',
        $usernameOrEmail
    );

    $stmtPelanggan->execute();

    $resultPelanggan = $stmtPelanggan->get_result();

    $pelanggan = $resultPelanggan->fetch_assoc();

    $stmtPelanggan->close();

    if ($pelanggan) {
        $pelangganId = (int) $pelanggan['id_pelanggan'];

        $validPassword = verifyAndUpgradePassword(
            $conn,
            'pelanggan',
            'id_pelanggan',
            $pelangganId,
            (string) $pelanggan['password'],
            $password
        );

        if ($validPassword) {
            sendResponse(
                'success',
                'Login berhasil.',
                [
                    'user' => [
                        'id' => $pelangganId,
                        'id_pelanggan' => $pelangganId,
                        'nama' => $pelanggan['nama_pelanggan'],
                        'nama_pelanggan' => $pelanggan['nama_pelanggan'],
                        'email' => $pelanggan['email'],
                        'alamat' => $pelanggan['alamat'],
                        'role' => 'pelanggan'
                    ]
                ]
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | KREDENSIAL TIDAK VALID
    |--------------------------------------------------------------------------
    */

    sendResponse(
        'error',
        'Username atau email dan kata sandi tidak sesuai.',
        [],
        401
    );
}

/*
|--------------------------------------------------------------------------
| REGISTER PELANGGAN
|--------------------------------------------------------------------------
|
| Registrasi tetap mendukung nama, email, nomor telepon,
| alamat, dan kata sandi sebagai data profil.
| Nomor telepon bukan identitas untuk login.
|
*/

if ($action === 'register') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(
            'error',
            'Metode permintaan tidak diizinkan.',
            [],
            405
        );
    }

    $nama = trim(
        (string) (
            $input['nama_pelanggan']
            ?? $input['nama']
            ?? ''
        )
    );

    $email = trim(
        (string) ($input['email'] ?? '')
    );

    $telepon = trim(
        (string) (
            $input['no_telepon']
            ?? $input['telepon']
            ?? ''
        )
    );

    $alamat = trim(
        (string) ($input['alamat'] ?? '')
    );

    $password = (string) ($input['password'] ?? '');

    if (
        $nama === '' ||
        $email === '' ||
        $password === ''
    ) {
        sendResponse(
            'error',
            'Nama, email, dan kata sandi wajib diisi.',
            [],
            400
        );
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(
            'error',
            'Format email tidak valid.',
            [],
            400
        );
    }

    if (strlen($password) < 8) {
        sendResponse(
            'error',
            'Kata sandi harus terdiri dari minimal 8 karakter.',
            [],
            400
        );
    }

    /*
     * Periksa email yang sudah terdaftar.
     */

    $stmtCheckEmail = $conn->prepare(
        'SELECT id_pelanggan
         FROM pelanggan
         WHERE email = ?
         LIMIT 1'
    );

    if (!$stmtCheckEmail) {
        error_log('Prepare check email gagal: ' . $conn->error);

        sendResponse(
            'error',
            'Terjadi kendala saat memeriksa data akun.',
            [],
            500
        );
    }

    $stmtCheckEmail->bind_param('s', $email);
    $stmtCheckEmail->execute();

    $emailExists = $stmtCheckEmail->get_result()->num_rows > 0;

    $stmtCheckEmail->close();

    if ($emailExists) {
        sendResponse(
            'error',
            'Email sudah terdaftar. Silakan gunakan email lain.',
            [],
            409
        );
    }

    /*
     * Periksa nomor telepon jika diisi.
     * Nomor telepon tetap menjadi data profil, bukan login.
     */

    if ($telepon !== '') {
        $stmtCheckPhone = $conn->prepare(
            'SELECT id_pelanggan
             FROM pelanggan
             WHERE no_telepon = ?
             LIMIT 1'
        );

        if (!$stmtCheckPhone) {
            error_log(
                'Prepare check telepon gagal: ' . $conn->error
            );

            sendResponse(
                'error',
                'Terjadi kendala saat memeriksa data akun.',
                [],
                500
            );
        }

        $stmtCheckPhone->bind_param('s', $telepon);
        $stmtCheckPhone->execute();

        $phoneExists =
            $stmtCheckPhone->get_result()->num_rows > 0;

        $stmtCheckPhone->close();

        if ($phoneExists) {
            sendResponse(
                'error',
                'Nomor telepon sudah digunakan pada akun lain.',
                [],
                409
            );
        }
    }

    /*
     * Hash kata sandi sebelum disimpan.
     */

    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    $sqlRegister = "
        INSERT INTO pelanggan (
            nama_pelanggan,
            no_telepon,
            email,
            alamat,
            password
        )
        VALUES (?, ?, ?, ?, ?)
    ";

    $stmtRegister = $conn->prepare($sqlRegister);

    if (!$stmtRegister) {
        error_log('Prepare register gagal: ' . $conn->error);

        sendResponse(
            'error',
            'Terjadi kendala saat menyiapkan pendaftaran.',
            [],
            500
        );
    }

    $stmtRegister->bind_param(
        'sssss',
        $nama,
        $telepon,
        $email,
        $alamat,
        $passwordHash
    );

    if (!$stmtRegister->execute()) {
        error_log(
            'Register gagal: ' . $stmtRegister->error
        );

        $stmtRegister->close();

        sendResponse(
            'error',
            'Akun belum berhasil dibuat. Silakan coba kembali.',
            [],
            500
        );
    }

    $newId = (int) $conn->insert_id;

    $stmtRegister->close();

    sendResponse(
        'success',
        'Pendaftaran akun berhasil.',
        [
            'user' => [
                'id' => $newId,
                'id_pelanggan' => $newId,
                'nama' => $nama,
                'nama_pelanggan' => $nama,
                'email' => $email,
                'alamat' => $alamat,
                'role' => 'pelanggan'
            ]
        ],
        201
    );
}

/*
|--------------------------------------------------------------------------
| ACTION TIDAK DIKENAL
|--------------------------------------------------------------------------
*/

sendResponse(
    'error',
    'Permintaan autentikasi tidak dikenali.',
    [],
    400
);