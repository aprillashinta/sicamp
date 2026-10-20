<?php
require_once __DIR__ . '/koneksi.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

include 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

function kirimJSON($data, $kode = 200) {
    http_response_code($kode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function ambilInputJSON() {
    $input = json_decode(file_get_contents('php://input'), true);
    return is_array($input) ? $input : [];
}

if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($method === 'GET') {
    $sql = "SELECT * FROM kategori_peralatan ORDER BY id_kategori ASC";
    $result = $conn->query($sql);

    if (!$result) {
        kirimJSON([
            'status' => 'error',
            'message' => 'Gagal mengambil data kategori.'
        ], 500);
    }

    $data = [];

    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    kirimJSON($data);
}

if ($method === 'POST') {
    $input = ambilInputJSON();
    $nama = trim($input['nama_kategori'] ?? '');

    if ($nama === '') {
        kirimJSON([
            'status' => 'error',
            'message' => 'Nama kategori wajib diisi.'
        ], 400);
    }

    $stmt = $conn->prepare(
        "INSERT INTO kategori_peralatan (nama_kategori) VALUES (?)"
    );

    if (!$stmt) {
        kirimJSON([
            'status' => 'error',
            'message' => 'Gagal menyiapkan penambahan kategori.'
        ], 500);
    }

    $stmt->bind_param('s', $nama);

    if ($stmt->execute()) {
        kirimJSON([
            'status' => 'success',
            'message' => 'Kategori berhasil ditambahkan.',
            'id' => $stmt->insert_id
        ], 201);
    }

    $stmt->close();

    kirimJSON([
        'status' => 'error',
        'message' => 'Kategori gagal ditambahkan.'
    ], 500);
}

if ($method === 'PUT') {
    $input = ambilInputJSON();

    $id = $input['id_kategori'] ?? $_GET['id'] ?? null;
    $nama = trim($input['nama_kategori'] ?? '');

    if (!$id || !is_numeric($id) || $nama === '') {
        kirimJSON([
            'status' => 'error',
            'message' => 'ID dan nama kategori wajib diisi dengan benar.'
        ], 400);
    }

    $id = (int) $id;

    $stmt = $conn->prepare(
        "UPDATE kategori_peralatan SET nama_kategori = ? WHERE id_kategori = ?"
    );

    if (!$stmt) {
        kirimJSON([
            'status' => 'error',
            'message' => 'Gagal menyiapkan perubahan kategori.'
        ], 500);
    }

    $stmt->bind_param('si', $nama, $id);

    if (!$stmt->execute()) {
        $stmt->close();

        kirimJSON([
            'status' => 'error',
            'message' => 'Kategori gagal diperbarui.'
        ], 500);
    }

    $jumlahBerubah = $stmt->affected_rows;
    $stmt->close();

    if ($jumlahBerubah === 0) {
        $cek = $conn->prepare(
            "SELECT id_kategori FROM kategori_peralatan WHERE id_kategori = ?"
        );

        $cek->bind_param('i', $id);
        $cek->execute();
        $hasil = $cek->get_result();
        $ada = $hasil->num_rows > 0;
        $cek->close();

        if (!$ada) {
            kirimJSON([
                'status' => 'error',
                'message' => 'Kategori tidak ditemukan.'
            ], 404);
        }
    }

    kirimJSON([
        'status' => 'success',
        'message' => 'Kategori berhasil diperbarui.'
    ]);
}

if ($method === 'DELETE') {
    $input = ambilInputJSON();

    $id = $_GET['id'] ?? $input['id_kategori'] ?? null;

    if (!$id || !is_numeric($id)) {
        kirimJSON([
            'status' => 'error',
            'message' => 'ID kategori tidak valid.'
        ], 400);
    }

    $id = (int) $id;

    $cek = $conn->prepare(
        "SELECT id_kategori FROM kategori_peralatan WHERE id_kategori = ?"
    );

    $cek->bind_param('i', $id);
    $cek->execute();
    $hasil = $cek->get_result();
    $ada = $hasil->num_rows > 0;
    $cek->close();

    if (!$ada) {
        kirimJSON([
            'status' => 'error',
            'message' => 'Kategori tidak ditemukan.'
        ], 404);
    }

    $stmt = $conn->prepare(
        "DELETE FROM kategori_peralatan WHERE id_kategori = ?"
    );

    if (!$stmt) {
        kirimJSON([
            'status' => 'error',
            'message' => 'Gagal menyiapkan penghapusan kategori.'
        ], 500);
    }

    $stmt->bind_param('i', $id);

    if ($stmt->execute()) {
        $stmt->close();

        kirimJSON([
            'status' => 'success',
            'message' => 'Kategori berhasil dihapus.'
        ]);
    }

    $stmt->close();

    kirimJSON([
        'status' => 'error',
        'message' => 'Kategori gagal dihapus. Kategori mungkin masih digunakan oleh data peralatan.'
    ], 409);
}

kirimJSON([
    'status' => 'error',
    'message' => 'Metode request tidak didukung.'
], 405);
?>
