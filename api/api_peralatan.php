<?php

require_once __DIR__ . '/koneksi.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

mysqli_set_charset($conn, "utf8mb4");

$method = $_SERVER['REQUEST_METHOD'];

function responseJSON($status, $message, $extra = [], $httpCode = 200)
{
    http_response_code($httpCode);

    echo json_encode(
        array_merge([
            "status" => $status,
            "message" => $message
        ], $extra),
        JSON_UNESCAPED_UNICODE
    );

    exit();
}

function getRequestData()
{
    $rawInput = file_get_contents("php://input");
    $json = json_decode($rawInput, true);

    if (is_array($json)) {
        return $json;
    }

    if (!empty($_POST)) {
        return $_POST;
    }

    return [];
}

function isNonNegativeInteger($value)
{
    return filter_var(
        $value,
        FILTER_VALIDATE_INT,
        ["options" => ["min_range" => 0]]
    ) !== false;
}

/*
|--------------------------------------------------------------------------
| GET: Mengambil data peralatan
|--------------------------------------------------------------------------
*/

if ($method === 'GET') {

    $query = "
        SELECT
            p.*,
            k.nama_kategori
        FROM peralatan p
        LEFT JOIN kategori_peralatan k
            ON p.id_kategori = k.id_kategori
        ORDER BY p.id_peralatan ASC
    ";

    $result = mysqli_query($conn, $query);

    if (!$result) {
        responseJSON(
            "error",
            "Gagal mengambil data peralatan.",
            [],
            500
        );
    }

    $peralatan = [];

    while ($row = mysqli_fetch_assoc($result)) {
        $peralatan[] = $row;
    }

    echo json_encode(
        $peralatan,
        JSON_UNESCAPED_UNICODE
    );

    exit();
}

/*
|--------------------------------------------------------------------------
| POST / PUT: Tambah atau edit peralatan
|--------------------------------------------------------------------------
*/

elseif ($method === 'POST' || $method === 'PUT') {

    $data = getRequestData();

    $uploadDir = dirname(__DIR__)
        . DIRECTORY_SEPARATOR . 'uploads'
        . DIRECTORY_SEPARATOR . 'peralatan'
        . DIRECTORY_SEPARATOR;

    $publicUploadPath = 'uploads/peralatan/';

    $newUploadedImage = null;

    /*
    |--------------------------------------------------------------------------
    | Upload dan validasi gambar
    |--------------------------------------------------------------------------
    */

    if (
        isset($_FILES['gambar_file']) &&
        $_FILES['gambar_file']['error'] !== UPLOAD_ERR_NO_FILE
    ) {

        $file = $_FILES['gambar_file'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            responseJSON(
                "error",
                "Gagal mengunggah gambar.",
                [],
                422
            );
        }

        if ($file['size'] > 2 * 1024 * 1024) {
            responseJSON(
                "error",
                "Ukuran gambar maksimal 2 MB.",
                [],
                422
            );
        }

        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);

        $allowedMime = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp'
        ];

        if (!isset($allowedMime[$mime])) {
            responseJSON(
                "error",
                "Format gambar harus JPG, PNG, atau WEBP.",
                [],
                422
            );
        }

        if (
            !is_dir($uploadDir) &&
            !mkdir($uploadDir, 0755, true) &&
            !is_dir($uploadDir)
        ) {
            responseJSON(
                "error",
                "Folder penyimpanan gambar tidak dapat dibuat.",
                [],
                500
            );
        }

        $fileName = bin2hex(random_bytes(16))
            . '.'
            . $allowedMime[$mime];

        if (
            !move_uploaded_file(
                $file['tmp_name'],
                $uploadDir . $fileName
            )
        ) {
            responseJSON(
                "error",
                "Gambar gagal disimpan ke server.",
                [],
                500
            );
        }

        $newUploadedImage = $publicUploadPath . $fileName;
    }

    /*
    |--------------------------------------------------------------------------
    | Mengambil data form
    |--------------------------------------------------------------------------
    */

    $id_peralatan = trim(
        (string) (
            $data['id_peralatan']
            ?? $data['id']
            ?? ''
        )
    );

    $id_kategori = $data['id_kategori'] ?? '';

    $nama_peralatan = trim(
        (string) ($data['nama_peralatan'] ?? '')
    );

    $deskripsi = trim(
        (string) ($data['deskripsi'] ?? '')
    );

    $gambar = $newUploadedImage
        ?? ($data['gambar'] ?? null);

    if (($data['hapus_gambar'] ?? '') === '1') {
        $gambar = '';
    }

    $harga_sewa = $data['harga_sewa'] ?? null;

    $stok = $data['stok'] ?? null;

    $kondisi = trim(
        (string) ($data['kondisi'] ?? 'Bagus')
    );

    $status = trim(
        (string) ($data['status'] ?? 'Aktif')
    );

    /*
    |--------------------------------------------------------------------------
    | Validasi input
    |--------------------------------------------------------------------------
    */

    if (
        !is_scalar($id_kategori) ||
        !isNonNegativeInteger($id_kategori) ||
        (int) $id_kategori < 1
    ) {
        responseJSON(
            "error",
            "Kategori peralatan wajib dipilih.",
            [],
            422
        );
    }

    if ($nama_peralatan === '') {
        responseJSON(
            "error",
            "Nama peralatan wajib diisi.",
            [],
            422
        );
    }

    if (mb_strlen($nama_peralatan) > 100) {
        responseJSON(
            "error",
            "Nama peralatan maksimal 100 karakter.",
            [],
            422
        );
    }

    if (
        !is_numeric($harga_sewa) ||
        (float) $harga_sewa < 0
    ) {
        responseJSON(
            "error",
            "Harga sewa harus berupa angka nol atau lebih.",
            [],
            422
        );
    }

    if (!isNonNegativeInteger($stok)) {
        responseJSON(
            "error",
            "Stok harus berupa bilangan bulat nol atau lebih.",
            [],
            422
        );
    }

    if (!in_array($status, ['Aktif', 'Tidak Aktif'], true)) {
        responseJSON(
            "error",
            "Status harus Aktif atau Tidak Aktif.",
            [],
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Memeriksa kategori
    |--------------------------------------------------------------------------
    */

    $stmtKategori = mysqli_prepare(
        $conn,
        "SELECT id_kategori
         FROM kategori_peralatan
         WHERE id_kategori = ?
         LIMIT 1"
    );

    if (!$stmtKategori) {
        responseJSON(
            "error",
            "Gagal menyiapkan pemeriksaan kategori.",
            [],
            500
        );
    }

    $kategoriInt = (int) $id_kategori;

    mysqli_stmt_bind_param(
        $stmtKategori,
        "i",
        $kategoriInt
    );

    mysqli_stmt_execute($stmtKategori);

    $resultKategori = mysqli_stmt_get_result($stmtKategori);

    $kategoriAda = mysqli_fetch_assoc($resultKategori);

    mysqli_stmt_close($stmtKategori);

    if (!$kategoriAda) {
        responseJSON(
            "error",
            "Kategori peralatan tidak ditemukan.",
            [],
            422
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Menambahkan peralatan
    |--------------------------------------------------------------------------
    */

    if ($id_peralatan === '') {

        $query = "
            INSERT INTO peralatan (
                id_kategori,
                nama_peralatan,
                deskripsi,
                gambar,
                stok,
                harga_sewa,
                kondisi,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ";

        $stmt = mysqli_prepare($conn, $query);

        if (!$stmt) {
            responseJSON(
                "error",
                "Gagal menyiapkan penyimpanan peralatan.",
                [],
                500
            );
        }

        $kategoriInt = (int) $id_kategori;
        $stokInt = (int) $stok;
        $hargaFloat = (float) $harga_sewa;

        mysqli_stmt_bind_param(
            $stmt,
            "isssidss",
            $kategoriInt,
            $nama_peralatan,
            $deskripsi,
            $gambar,
            $stokInt,
            $hargaFloat,
            $kondisi,
            $status
        );

        if (!mysqli_stmt_execute($stmt)) {
            $error = mysqli_stmt_error($stmt);

            mysqli_stmt_close($stmt);

            responseJSON(
                "error",
                "Gagal menambahkan peralatan: " . $error,
                [],
                500
            );
        }

        $newId = mysqli_insert_id($conn);

        mysqli_stmt_close($stmt);

        responseJSON(
            "success",
            "Peralatan berhasil ditambahkan.",
            [
                "id_peralatan" => $newId
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Mengedit peralatan
    |--------------------------------------------------------------------------
    */

    else {

        if (
            !ctype_digit($id_peralatan) ||
            (int) $id_peralatan < 1
        ) {
            responseJSON(
                "error",
                "ID peralatan tidak valid.",
                [],
                422
            );
        }

        $idInt = (int) $id_peralatan;
        $kategoriInt = (int) $id_kategori;
        $stokInt = (int) $stok;
        $hargaFloat = (float) $harga_sewa;

        /*
         * Jika tidak ada gambar baru, gambar lama dipertahankan.
         */

        if ($gambar === null) {

            $query = "
                UPDATE peralatan
                SET
                    id_kategori = ?,
                    nama_peralatan = ?,
                    deskripsi = ?,
                    stok = ?,
                    harga_sewa = ?,
                    kondisi = ?,
                    status = ?
                WHERE id_peralatan = ?
            ";

            $stmt = mysqli_prepare($conn, $query);

            if (!$stmt) {
                responseJSON(
                    "error",
                    "Gagal menyiapkan perubahan peralatan.",
                    [],
                    500
                );
            }

            mysqli_stmt_bind_param(
                $stmt,
                "issidssi",
                $kategoriInt,
                $nama_peralatan,
                $deskripsi,
                $stokInt,
                $hargaFloat,
                $kondisi,
                $status,
                $idInt
            );
        }

        /*
         * Jika gambar baru tersedia, simpan path gambar baru.
         */

        else {

            $query = "
                UPDATE peralatan
                SET
                    id_kategori = ?,
                    nama_peralatan = ?,
                    deskripsi = ?,
                    gambar = ?,
                    stok = ?,
                    harga_sewa = ?,
                    kondisi = ?,
                    status = ?
                WHERE id_peralatan = ?
            ";

            $stmt = mysqli_prepare($conn, $query);

            if (!$stmt) {
                responseJSON(
                    "error",
                    "Gagal menyiapkan perubahan peralatan.",
                    [],
                    500
                );
            }

            mysqli_stmt_bind_param(
                $stmt,
                "isssidssi",
                $kategoriInt,
                $nama_peralatan,
                $deskripsi,
                $gambar,
                $stokInt,
                $hargaFloat,
                $kondisi,
                $status,
                $idInt
            );
        }

        if (!mysqli_stmt_execute($stmt)) {
            $error = mysqli_stmt_error($stmt);

            mysqli_stmt_close($stmt);

            responseJSON(
                "error",
                "Gagal memperbarui peralatan: " . $error,
                [],
                500
            );
        }

        $affectedRows = mysqli_stmt_affected_rows($stmt);

        mysqli_stmt_close($stmt);

        $stmtCheck = mysqli_prepare(
            $conn,
            "SELECT id_peralatan
             FROM peralatan
             WHERE id_peralatan = ?
             LIMIT 1"
        );

        mysqli_stmt_bind_param(
            $stmtCheck,
            "i",
            $idInt
        );

        mysqli_stmt_execute($stmtCheck);

        $resultCheck = mysqli_stmt_get_result($stmtCheck);

        $dataAda = mysqli_fetch_assoc($resultCheck);

        mysqli_stmt_close($stmtCheck);

        if (!$dataAda) {
            responseJSON(
                "error",
                "Peralatan tidak ditemukan.",
                [],
                404
            );
        }

        responseJSON(
            "success",
            "Peralatan berhasil diperbarui.",
            [
                "id_peralatan" => $idInt,
                "changed" => $affectedRows > 0
            ]
        );
    }
}

/*
|--------------------------------------------------------------------------
| DELETE: Menghapus peralatan
|--------------------------------------------------------------------------
*/

elseif ($method === 'DELETE') {

    $id = trim(
        (string) (
            $_GET['id']
            ?? $_GET['id_peralatan']
            ?? ''
        )
    );

    if (
        $id === '' ||
        !ctype_digit($id) ||
        (int) $id < 1
    ) {
        responseJSON(
            "error",
            "ID peralatan tidak valid.",
            [],
            422
        );
    }

    $idInt = (int) $id;

    $stmt = mysqli_prepare(
        $conn,
        "DELETE FROM peralatan
         WHERE id_peralatan = ?"
    );

    if (!$stmt) {
        responseJSON(
            "error",
            "Gagal menyiapkan penghapusan peralatan.",
            [],
            500
        );
    }

    mysqli_stmt_bind_param(
        $stmt,
        "i",
        $idInt
    );

    if (!mysqli_stmt_execute($stmt)) {
        $error = mysqli_stmt_error($stmt);

        mysqli_stmt_close($stmt);

        responseJSON(
            "error",
            "Gagal menghapus peralatan: " . $error,
            [],
            500
        );
    }

    $deletedRows = mysqli_stmt_affected_rows($stmt);

    mysqli_stmt_close($stmt);

    if ($deletedRows === 0) {
        responseJSON(
            "error",
            "Peralatan tidak ditemukan atau sudah dihapus.",
            [],
            404
        );
    }

    responseJSON(
        "success",
        "Peralatan berhasil dihapus."
    );
}

/*
|--------------------------------------------------------------------------
| Metode HTTP tidak didukung
|--------------------------------------------------------------------------
*/

else {

    header("Allow: GET, POST, PUT, DELETE, OPTIONS");

    responseJSON(
        "error",
        "Metode HTTP tidak didukung.",
        [],
        405
    );
}