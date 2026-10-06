-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 05, 2026 at 04:11 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_penyewaan_camping`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id_admin` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama_admin` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id_admin`, `username`, `password`, `nama_admin`) VALUES
(1, 'admin', 'admin123', 'Administrator Utama');

-- --------------------------------------------------------

--
-- Table structure for table `detail_pengembalian`
--

CREATE TABLE `detail_pengembalian` (
  `id_detail_pengembalian` int(11) NOT NULL,
  `id_pengembalian` int(11) NOT NULL,
  `id_peralatan` int(11) NOT NULL,
  `jumlah_kembali` int(11) NOT NULL,
  `kondisi` varchar(50) NOT NULL,
  `denda` decimal(12,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `detail_penyewaan`
--

CREATE TABLE `detail_penyewaan` (
  `id_detail` int(11) NOT NULL,
  `id_penyewaan` int(11) NOT NULL,
  `id_peralatan` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL,
  `harga_satuan` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori_peralatan`
--

CREATE TABLE `kategori_peralatan` (
  `id_kategori` int(11) NOT NULL,
  `nama_kategori` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kategori_peralatan`
--

INSERT INTO `kategori_peralatan` (`id_kategori`, `nama_kategori`) VALUES
(1, 'Tenda & Shelter'),
(2, 'Tas & Carrier'),
(3, 'Perlengkap Tidur'),
(4, 'Alat Masak & Makan');

-- --------------------------------------------------------

--
-- Table structure for table `pelanggan`
--

CREATE TABLE `pelanggan` (
  `id_pelanggan` int(11) NOT NULL,
  `nama_pelanggan` varchar(100) NOT NULL,
  `no_telepon` varchar(20) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `alamat` text NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pelanggan`
--

INSERT INTO `pelanggan` (`id_pelanggan`, `nama_pelanggan`, `no_telepon`, `email`, `alamat`, `password`) VALUES
(1, 'Budi Santoso', '081234567890', 'budi@gmail.com', 'Jl. Merdeka No. 12, Surakarta', 'user123');

-- --------------------------------------------------------

--
-- Table structure for table `pembayaran`
--

CREATE TABLE `pembayaran` (
  `id_pembayaran` int(11) NOT NULL,
  `id_penyewaan` int(11) NOT NULL,
  `tanggal_pembayaran` datetime DEFAULT NULL,
  `jumlah_bayar` decimal(12,2) NOT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `status` enum('Menunggu','Terverifikasi','Ditolak') NOT NULL,
  `catatan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pengembalian`
--

CREATE TABLE `pengembalian` (
  `id_pengembalian` int(11) NOT NULL,
  `id_penyewaan` int(11) NOT NULL,
  `tanggal_pengembalian` datetime NOT NULL,
  `total_denda` decimal(12,2) NOT NULL DEFAULT 0.00,
  `catatan` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `penyewaan`
--

CREATE TABLE `penyewaan` (
  `id_penyewaan` int(11) NOT NULL,
  `id_pelanggan` int(11) NOT NULL,
  `kode_transaksi` varchar(20) NOT NULL,
  `tanggal_penyewaan` date NOT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_kembali_rencana` date NOT NULL,
  `total_harga` decimal(12,2) NOT NULL,
  `status` enum('Menunggu Pembayaran','Menunggu Verifikasi','Disetujui','Sedang Disewa','Selesai','Dibatalkan') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `peralatan`
--

CREATE TABLE `peralatan` (
  `id_peralatan` int(11) NOT NULL,
  `id_kategori` int(11) NOT NULL,
  `nama_peralatan` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `stok` int(11) NOT NULL,
  `harga_sewa` decimal(12,2) NOT NULL,
  `kondisi` varchar(50) NOT NULL,
  `status` enum('Aktif','Tidak Aktif') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `peralatan`
--

INSERT INTO `peralatan` (`id_peralatan`, `id_kategori`, `nama_peralatan`, `deskripsi`, `stok`, `harga_sewa`, `kondisi`, `status`) VALUES
(1, 1, 'Tenda Dome Kapasitas 4 Person', 'Tenda waterproof double layer lengkap dengan pasak dan frame.', 10, 50000.00, 'Bagus', 'Aktif'),
(2, 2, 'Carrier Eiger 60 Liter', 'Tas gunung dengan ransel ergonomis dan raincover.', 8, 35000.00, 'Bagus', 'Aktif'),
(3, 3, 'Sleeping Bag Premium', 'Bahan dalam dacron hangat cocok untuk suhu ekstrem.', 15, 15000.00, 'Bagus', 'Aktif'),
(4, 4, 'Kompor Portable & Nesting Set', 'Satu paket kompor mawar mini dan cooking set alumunium.', 12, 20000.00, 'Bagus', 'Aktif');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id_admin`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `detail_pengembalian`
--
ALTER TABLE `detail_pengembalian`
  ADD PRIMARY KEY (`id_detail_pengembalian`),
  ADD KEY `fk_detail_pengembalian` (`id_pengembalian`),
  ADD KEY `fk_detail_pengembalian_peralatan` (`id_peralatan`);

--
-- Indexes for table `detail_penyewaan`
--
ALTER TABLE `detail_penyewaan`
  ADD PRIMARY KEY (`id_detail`),
  ADD KEY `fk_detail_penyewaan` (`id_penyewaan`),
  ADD KEY `fk_detail_peralatan` (`id_peralatan`);

--
-- Indexes for table `kategori_peralatan`
--
ALTER TABLE `kategori_peralatan`
  ADD PRIMARY KEY (`id_kategori`);

--
-- Indexes for table `pelanggan`
--
ALTER TABLE `pelanggan`
  ADD PRIMARY KEY (`id_pelanggan`);

--
-- Indexes for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD PRIMARY KEY (`id_pembayaran`),
  ADD UNIQUE KEY `id_penyewaan` (`id_penyewaan`);

--
-- Indexes for table `pengembalian`
--
ALTER TABLE `pengembalian`
  ADD PRIMARY KEY (`id_pengembalian`),
  ADD UNIQUE KEY `id_penyewaan` (`id_penyewaan`);

--
-- Indexes for table `penyewaan`
--
ALTER TABLE `penyewaan`
  ADD PRIMARY KEY (`id_penyewaan`),
  ADD UNIQUE KEY `kode_transaksi` (`kode_transaksi`),
  ADD KEY `fk_penyewaan_pelanggan` (`id_pelanggan`);

--
-- Indexes for table `peralatan`
--
ALTER TABLE `peralatan`
  ADD PRIMARY KEY (`id_peralatan`),
  ADD KEY `fk_peralatan_kategori` (`id_kategori`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id_admin` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `detail_pengembalian`
--
ALTER TABLE `detail_pengembalian`
  MODIFY `id_detail_pengembalian` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `detail_penyewaan`
--
ALTER TABLE `detail_penyewaan`
  MODIFY `id_detail` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori_peralatan`
--
ALTER TABLE `kategori_peralatan`
  MODIFY `id_kategori` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pelanggan`
--
ALTER TABLE `pelanggan`
  MODIFY `id_pelanggan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `pembayaran`
--
ALTER TABLE `pembayaran`
  MODIFY `id_pembayaran` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pengembalian`
--
ALTER TABLE `pengembalian`
  MODIFY `id_pengembalian` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `penyewaan`
--
ALTER TABLE `penyewaan`
  MODIFY `id_penyewaan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `peralatan`
--
ALTER TABLE `peralatan`
  MODIFY `id_peralatan` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `detail_pengembalian`
--
ALTER TABLE `detail_pengembalian`
  ADD CONSTRAINT `fk_detail_pengembalian` FOREIGN KEY (`id_pengembalian`) REFERENCES `pengembalian` (`id_pengembalian`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_pengembalian_peralatan` FOREIGN KEY (`id_peralatan`) REFERENCES `peralatan` (`id_peralatan`) ON UPDATE CASCADE;

--
-- Constraints for table `detail_penyewaan`
--
ALTER TABLE `detail_penyewaan`
  ADD CONSTRAINT `fk_detail_penyewaan` FOREIGN KEY (`id_penyewaan`) REFERENCES `penyewaan` (`id_penyewaan`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detail_peralatan` FOREIGN KEY (`id_peralatan`) REFERENCES `peralatan` (`id_peralatan`) ON UPDATE CASCADE;

--
-- Constraints for table `pembayaran`
--
ALTER TABLE `pembayaran`
  ADD CONSTRAINT `fk_pembayaran_penyewaan` FOREIGN KEY (`id_penyewaan`) REFERENCES `penyewaan` (`id_penyewaan`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pengembalian`
--
ALTER TABLE `pengembalian`
  ADD CONSTRAINT `fk_pengembalian_penyewaan` FOREIGN KEY (`id_penyewaan`) REFERENCES `penyewaan` (`id_penyewaan`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `penyewaan`
--
ALTER TABLE `penyewaan`
  ADD CONSTRAINT `fk_penyewaan_pelanggan` FOREIGN KEY (`id_pelanggan`) REFERENCES `pelanggan` (`id_pelanggan`) ON UPDATE CASCADE;

--
-- Constraints for table `peralatan`
--
ALTER TABLE `peralatan`
  ADD CONSTRAINT `fk_peralatan_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori_peralatan` (`id_kategori`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
