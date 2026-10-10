<?php
require_once 'koneksi.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $query = "SELECT p.*, k.nama_kategori 
              FROM peralatan p 
              LEFT JOIN kategori_peralatan k ON p.id_kategori = k.id_kategori
              ORDER BY p.id_peralatan ASC";
    $result = mysqli_query($conn, $query);
    
    $peralatan = [];
    if ($result) {
        while ($row = mysqli_fetch_assoc($result)) {
            $peralatan[] = $row;
        }
    }
    echo json_encode($peralatan);

} elseif ($method === 'POST') {
    try {
        // Ambil data dari $_POST (karena dikirim via FormData)
        $id_kategori = mysqli_real_escape_string($conn, $_POST['id_kategori'] ?? '');
        $nama        = mysqli_real_escape_string($conn, $_POST['nama_peralatan'] ?? '');
        $harga       = (float)($_POST['harga_sewa'] ?? 0);
        $stok        = (int)($_POST['stok'] ?? 0);
        $deskripsi   = mysqli_real_escape_string($conn, $_POST['deskripsi'] ?? '');

        if (empty($id_kategori) || empty($nama)) {
            echo json_encode(["status" => "error", "message" => "Kategori dan Nama Alat wajib diisi!"]);
            exit();
        }

        // Gambar default jika tidak upload foto
        $gambar = 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80';

        // Proses Unggah Gambar jika ada file dipilih
        if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['gambar']['tmp_name'];
            $fileName    = $_FILES['gambar']['name'];
            $ext         = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

            $allowedExts = ['jpg', 'jpeg', 'png', 'webp'];
            if (in_array($ext, $allowedExts)) {
                $newFileName   = time() . '_' . uniqid() . '.' . $ext;
                $uploadFileDir = '../uploads/';

                if (!is_dir($uploadFileDir)) {
                    mkdir($uploadFileDir, 0755, true);
                }

                $destPath = $uploadFileDir . $newFileName;
                if (move_uploaded_file($fileTmpPath, $destPath)) {
                    $gambar = 'uploads/' . $newFileName;
                }
            }
        }

        // Auto-Generate ID berdasarkan Kategori
        $queryMax = "SELECT MAX(CAST(id_peralatan AS UNSIGNED)) as max_id FROM peralatan WHERE id_kategori = '$id_kategori'";
        $resMax   = mysqli_query($conn, $queryMax);
        $rowMax   = $resMax ? mysqli_fetch_assoc($resMax) : null;

        if ($rowMax && $rowMax['max_id']) {
            $next_id = $rowMax['max_id'] + 1;
        } else {
            $next_id = ((int)$id_kategori * 1000) + 1;
        }

        $queryInsert = "INSERT INTO peralatan (id_peralatan, id_kategori, nama_peralatan, harga_sewa, stok, deskripsi, gambar) 
                        VALUES ('$next_id', '$id_kategori', '$nama', '$harga', '$stok', '$deskripsi', '$gambar')";

        if (mysqli_query($conn, $queryInsert)) {
            echo json_encode(["status" => "success", "message" => "Alat berhasil ditambahkan!", "id_peralatan" => $next_id]);
        } else {
            echo json_encode(["status" => "error", "message" => "Gagal Insert: " . mysqli_error($conn)]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "error", "message" => "Server Error: " . $e->getMessage()]);
    }
}
?>