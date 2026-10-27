<?php

$isHttps = (
    isset($_SERVER['HTTPS']) &&
    $_SERVER['HTTPS'] !== '' &&
    strtolower($_SERVER['HTTPS']) !== 'off'
);

ini_set('session.use_only_cookies', '1');
ini_set('session.use_strict_mode', '1');
ini_set('session.cookie_httponly', '1');

session_name('SICAMP_SESSION');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => $isHttps,
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');

header('Access-Control-Allow-Origin: ' . (
    isset($_SERVER['HTTP_ORIGIN']) &&
    in_array($_SERVER['HTTP_ORIGIN'], [
        'http://localhost:8000',
        'http://127.0.0.1:8000',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ], true)
        ? $_SERVER['HTTP_ORIGIN']
        : 'null'
));

header('Vary: Origin');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

require_once __DIR__ . '/koneksi.php';

mysqli_set_charset($conn, 'utf8mb4');

function sendResponse(
    int $httpCode,
    string $status,
    string $message,
    array $data = []
): void {
    http_response_code($httpCode);

    echo json_encode(
        array_merge([
            'status' => $status,
            'message' => $message
        ], $data),
        JSON_UNESCAPED_UNICODE |
        JSON_INVALID_UTF8_SUBSTITUTE
    );

    exit;
}

function getInput(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $rawInput = file_get_contents('php://input');
        $input = json_decode($rawInput, true);

        if (!is_array($input)) {
            sendResponse(
                400,
                'error',
                'Format data permintaan tidak valid.'
            );
        }

        return $input;
    }

    return $_POST;
}

function cleanString($value): string
{
    return is_string($value) ? trim($value) : '';
}

function updatePasswordHash(
    mysqli $conn,
    string $table,
    string $idColumn,
    int $id,
    string $inputPassword
): void {
    try {
        $newHash = password_hash($inputPassword, PASSWORD_DEFAULT);

        if ($newHash === false) {
            return;
        }

        $sql = "UPDATE `$table` SET `password` = ? WHERE `$idColumn` = ?";
        $stmt = mysqli_prepare($conn, $sql);
        mysqli_stmt_bind_param($stmt, 'si', $newHash, $id);
        mysqli_stmt_execute($stmt);
        mysqli_stmt_close($stmt);
    } catch (Throwable $e) {
        // Login tetap berhasil walaupun hash gagal diperbarui.
        error_log('Gagal memperbarui hash password: ' . $e->getMessage());
    }
}

function verifyPassword(
    mysqli $conn,
    string $table,
    string $idColumn,
    int $id,
    string $storedPassword,
    string $inputPassword
): bool {
    if ($storedPassword === '' || $inputPassword === '') {
        return false;
    }

    // Password yang sudah berupa hash.
    if (password_verify($inputPassword, $storedPassword)) {
        if (password_needs_rehash($storedPassword, PASSWORD_DEFAULT)) {
            updatePasswordHash($conn, $table, $idColumn, $id, $inputPassword);
        }

        return true;
    }

    // Password lama yang masih teks biasa.
    if (hash_equals($storedPassword, $inputPassword)) {
        updatePasswordHash($conn, $table, $idColumn, $id, $inputPassword);

        return true;
    }

    return false;
}

function createUserSession(array $user): void
{
    session_regenerate_id(true);

    $_SESSION['sicamp_user'] = $user;
    $_SESSION['sicamp_authenticated'] = true;
    $_SESSION['sicamp_login_time'] = time();
    $_SESSION['sicamp_last_activity'] = time();
}

function login(mysqli $conn, array $input): void
{
    $username = cleanString(
        $input['username'] ?? $input['email'] ?? ''
    );

    $password = $input['password'] ?? '';

    if (
        $username === '' ||
        !is_string($password) ||
        $password === ''
    ) {
        sendResponse(
            400,
            'error',
            'Username atau email dan kata sandi wajib diisi.'
        );
    }

    if (
        strlen($username) > 254 ||
        strlen($password) > 4096
    ) {
        sendResponse(
            400,
            'error',
            'Data login tidak valid.'
        );
    }

    $sqlAdmin = "
        SELECT *
        FROM admin
        WHERE username = ?
        LIMIT 1
    ";

    $stmtAdmin = mysqli_prepare($conn, $sqlAdmin);

    if (!$stmtAdmin) {
        sendResponse(
            500,
            'error',
            'Layanan login sedang mengalami kendala.'
        );
    }

    mysqli_stmt_bind_param(
        $stmtAdmin,
        's',
        $username
    );

    mysqli_stmt_execute($stmtAdmin);

    $resultAdmin = mysqli_stmt_get_result($stmtAdmin);
    $admin = mysqli_fetch_assoc($resultAdmin);

    mysqli_stmt_close($stmtAdmin);

    if ($admin) {
        $validPassword = verifyPassword(
            $conn,
            'admin',
            'id_admin',
            (int) $admin['id_admin'],
            (string) $admin['password'],
            $password
        );

        if ($validPassword) {
            $user = [
                'id_admin' => (int) $admin['id_admin'],
                'nama_admin' => ($admin['nama_admin'] ?? '')
                    ?: $admin['username'],
                'username' => $admin['username'],
                'role' => 'admin'
            ];

            createUserSession($user);

            sendResponse(
                200,
                'success',
                'Login berhasil.',
                ['user' => $user]
            );
        }

        sendResponse(
            401,
            'error',
            'Username atau email dan kata sandi tidak sesuai.'
        );
    }

    $sqlPelanggan = "
        SELECT
            id_pelanggan,
            nama_pelanggan,
            no_telepon,
            email,
            alamat,
            password
        FROM pelanggan
        WHERE email = ?
        LIMIT 1
    ";

    $stmtPelanggan = mysqli_prepare(
        $conn,
        $sqlPelanggan
    );

    if (!$stmtPelanggan) {
        sendResponse(
            500,
            'error',
            'Layanan login sedang mengalami kendala.'
        );
    }

    mysqli_stmt_bind_param(
        $stmtPelanggan,
        's',
        $username
    );

    mysqli_stmt_execute($stmtPelanggan);

    $resultPelanggan = mysqli_stmt_get_result(
        $stmtPelanggan
    );

    $pelanggan = mysqli_fetch_assoc($resultPelanggan);

    mysqli_stmt_close($stmtPelanggan);

    if (!$pelanggan) {
        sendResponse(
            401,
            'error',
            'Username atau email dan kata sandi tidak sesuai.'
        );
    }

    $validPassword = verifyPassword(
        $conn,
        'pelanggan',
        'id_pelanggan',
        (int) $pelanggan['id_pelanggan'],
        (string) $pelanggan['password'],
        $password
    );

    if (!$validPassword) {
        sendResponse(
            401,
            'error',
            'Username atau email dan kata sandi tidak sesuai.'
        );
    }

    $user = [
        'id_pelanggan' => (int) $pelanggan['id_pelanggan'],
        'nama_pelanggan' => $pelanggan['nama_pelanggan'],
        'nama' => $pelanggan['nama_pelanggan'],
        'no_telepon' => $pelanggan['no_telepon'],
        'email' => $pelanggan['email'],
        'alamat' => $pelanggan['alamat'],
        'role' => 'pelanggan'
    ];

    createUserSession($user);

    sendResponse(
        200,
        'success',
        'Login berhasil.',
        ['user' => $user]
    );
}

function register(mysqli $conn, array $input): void
{
    $nama = cleanString(
        $input['nama_pelanggan'] ?? $input['nama'] ?? ''
    );

    $email = strtolower(
        cleanString($input['email'] ?? '')
    );

    $telepon = cleanString(
        $input['no_telepon'] ?? $input['telepon'] ?? ''
    );

    $alamat = cleanString(
        $input['alamat'] ?? ''
    );

    $password = $input['password'] ?? '';

    if (
        $nama === '' ||
        $email === '' ||
        $telepon === '' ||
        $alamat === '' ||
        !is_string($password) ||
        $password === ''
    ) {
        sendResponse(
            400,
            'error',
            'Semua kolom wajib diisi.'
        );
    }

    if (
        strlen($nama) > 100 ||
        strlen($email) > 254 ||
        strlen($telepon) > 20 ||
        strlen($alamat) > 1000 ||
        strlen($password) > 4096
    ) {
        sendResponse(
            400,
            'error',
            'Terdapat data yang melebihi batas karakter.'
        );
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendResponse(
            400,
            'error',
            'Format email tidak valid.'
        );
    }

    if (strlen($password) < 8) {
        sendResponse(
            400,
            'error',
            'Kata sandi minimal 8 karakter.'
        );
    }

    $sqlCheck = "
        SELECT id_pelanggan
        FROM pelanggan
        WHERE email = ? OR no_telepon = ?
        LIMIT 1
    ";

    $stmtCheck = mysqli_prepare($conn, $sqlCheck);

    if (!$stmtCheck) {
        sendResponse(
            500,
            'error',
            'Registrasi belum dapat diproses.'
        );
    }

    mysqli_stmt_bind_param(
        $stmtCheck,
        'ss',
        $email,
        $telepon
    );

    mysqli_stmt_execute($stmtCheck);

    $resultCheck = mysqli_stmt_get_result($stmtCheck);
    $existingUser = mysqli_fetch_assoc($resultCheck);

    mysqli_stmt_close($stmtCheck);

    if ($existingUser) {
        sendResponse(
            409,
            'error',
            'Email atau nomor telepon sudah terdaftar.'
        );
    }

    $passwordHash = password_hash(
        $password,
        PASSWORD_DEFAULT
    );

    if ($passwordHash === false) {
        sendResponse(
            500,
            'error',
            'Registrasi belum dapat diproses.'
        );
    }

    $sqlInsert = "
        INSERT INTO pelanggan (
            nama_pelanggan,
            no_telepon,
            email,
            alamat,
            password
        )
        VALUES (?, ?, ?, ?, ?)
    ";

    $stmtInsert = mysqli_prepare($conn, $sqlInsert);

    if (!$stmtInsert) {
        sendResponse(
            500,
            'error',
            'Registrasi belum dapat diproses.'
        );
    }

    mysqli_stmt_bind_param(
        $stmtInsert,
        'sssss',
        $nama,
        $telepon,
        $email,
        $alamat,
        $passwordHash
    );

    $success = mysqli_stmt_execute($stmtInsert);
    $newId = mysqli_insert_id($conn);
    $errorCode = mysqli_stmt_errno($stmtInsert);

    mysqli_stmt_close($stmtInsert);

    if (!$success) {
        if ($errorCode === 1062) {
            sendResponse(
                409,
                'error',
                'Email atau nomor telepon sudah terdaftar.'
            );
        }

        sendResponse(
            500,
            'error',
            'Registrasi belum dapat diproses.'
        );
    }

    sendResponse(
        201,
        'success',
        'Registrasi berhasil. Silakan masuk menggunakan akun kamu.',
        [
            'user' => [
                'id_pelanggan' => (int) $newId,
                'nama_pelanggan' => $nama,
                'nama' => $nama,
                'no_telepon' => $telepon,
                'email' => $email,
                'alamat' => $alamat,
                'role' => 'pelanggan'
            ]
        ]
    );
}

function logout(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();

        setcookie(
            session_name(),
            '',
            [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax'
            ]
        );
    }

    session_destroy();

    sendResponse(
        200,
        'success',
        'Logout berhasil.'
    );
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST, OPTIONS');

    sendResponse(
        405,
        'error',
        'Metode permintaan tidak diizinkan.'
    );
}

$input = getInput();

$action = cleanString(
    $_GET['action'] ?? $input['action'] ?? ''
);

try {
    switch ($action) {
        case 'login':
            login($conn, $input);
            break;

        case 'register':
            register($conn, $input);
            break;

        case 'logout':
            logout();
            break;

        default:
            sendResponse(
                400,
                'error',
                'Aksi tidak dikenali.'
            );
    }
} catch (Throwable $e) {
    error_log(
        'SiCamp API Auth Error: ' . $e->getMessage()
    );

    sendResponse(
        500,
        'error',
        'Terjadi kesalahan pada server. Silakan coba kembali.'
    );
}