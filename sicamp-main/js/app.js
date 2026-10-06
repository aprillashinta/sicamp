function initDatabase() {
    if (!localStorage.getItem('kategori_peralatan')) {
        const defaultKategori = [
            { id_kategori: 1, nama_kategori: 'Tenda & Shelter' },
            { id_kategori: 2, nama_kategori: 'Tas & Carrier' },
            { id_kategori: 3, nama_kategori: 'Alat Tenda & Tidur' }
        ];
        localStorage.setItem('kategori_peralatan', JSON.stringify(defaultKategori));
    }

    if (!localStorage.getItem('peralatan')) {
        const defaultPeralatan = [
            { id_peralatan: 1, id_kategori: 1, nama_peralatan: 'Tenda Dome 4P', harga_sewa: 50000, stok: 5, kondisi: 'Bagus', status: 'Aktif', deskripsi: 'Tenda waterproof double layer.' },
            { id_peralatan: 2, id_kategori: 2, nama_peralatan: 'Carrier Eiger 60L', harga_sewa: 35000, stok: 8, kondisi: 'Bagus', status: 'Aktif', deskripsi: 'Tas gunung ergonomis.' },
            { id_peralatan: 3, id_kategori: 3, nama_peralatan: 'Sleeping Bag Dacron', harga_sewa: 15000, stok: 12, kondisi: 'Bagus', status: 'Aktif', deskripsi: 'Sleeping bag hangat.' }
        ];
        localStorage.setItem('peralatan', JSON.stringify(defaultPeralatan));
    }

    if (!localStorage.getItem('pelanggan')) {
        localStorage.setItem('pelanggan', JSON.stringify([]));
    }

    if (!localStorage.getItem('penyewaan')) {
        const defaultSewa = [
            {
                id_penyewaan: 101,
                kode_transaksi: 'TRX-20261001',
                nama_pelanggan: 'Budi Santoso',
                total_harga: 100000,
                tgl_kembali_rencana: '2026-10-05',
                status: 'Menunggu Pembayaran',
                bukti: null
            }
        ];
        localStorage.setItem('penyewaan', JSON.stringify(defaultSewa));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    renderUserNavigation();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('loginUser').value.trim();
            const passInput = document.getElementById('loginPass').value.trim();

            if (usernameInput === 'admin' && passInput === 'admin123') {
                localStorage.setItem('session_user', JSON.stringify({ nama: 'Administrator', role: 'admin' }));
                alert('Login Berhasil sebagai Admin!');
                window.location.href = 'dashboard.html';
                return;
            }

            const pelangganList = JSON.parse(localStorage.getItem('pelanggan')) || [];
            
            const user = pelangganList.find(p => {
                const emailMatch = p.email && p.email.toLowerCase() === usernameInput.toLowerCase();
                const namaMatch = p.nama_pelanggan && p.nama_pelanggan.toLowerCase() === usernameInput.toLowerCase();
                return (emailMatch || namaMatch) && p.password === passInput;
            });

            if (user) {
                localStorage.setItem('session_user', JSON.stringify({ 
                    id: user.id_pelanggan,
                    nama: user.nama_pelanggan, 
                    email: user.email,
                    role: 'pelanggan' 
                }));
                alert(`Selamat Datang, ${user.nama_pelanggan}!`);
                window.location.href = 'index.html';
            } else {
                alert('Username/Email atau Password salah!');
            }
        });
    }

    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nama = document.getElementById('regNama').value.trim();
            const email = document.getElementById('regEmail').value.trim();
            const pass = document.getElementById('regPass').value.trim();

            if (!nama || !email || !pass) {
                alert('Harap isi semua bidang pendaftaran!');
                return;
            }

            const pelangganList = JSON.parse(localStorage.getItem('pelanggan')) || [];
            
            const emailExists = pelangganList.some(p => p.email && p.email.toLowerCase() === email.toLowerCase());
            if (emailExists) {
                alert('Email sudah terdaftar! Gunakan email lain.');
                return;
            }

            pelangganList.push({ 
                id_pelanggan: Date.now(), 
                nama_pelanggan: nama, 
                email: email, 
                password: pass 
            });
            
            localStorage.setItem('pelanggan', JSON.stringify(pelangganList));

            alert('Pendaftaran Berhasil! Silakan Login.');
            window.location.href = 'login.html';
        });
    }

    const formP = document.getElementById('formPeralatan');
    if (formP) {
        formP.addEventListener('submit', (e) => {
            e.preventDefault();
            const editId = document.getElementById('editAlatId').value;
            const peralatan = JSON.parse(localStorage.getItem('peralatan')) || [];

            const dataAlat = {
                id_peralatan: editId ? parseInt(editId) : Date.now(),
                nama_peralatan: document.getElementById('pNama').value,
                id_kategori: parseInt(document.getElementById('pKategori').value),
                harga_sewa: parseInt(document.getElementById('pHarga').value),
                stok: parseInt(document.getElementById('pStok').value),
                kondisi: document.getElementById('pKondisi').value,
                status: document.getElementById('pStatus').value,
                deskripsi: document.getElementById('pDeskripsi').value
            };

            if (editId) {
                const idx = peralatan.findIndex(p => p.id_peralatan == editId);
                if (idx !== -1) peralatan[idx] = dataAlat;
                alert('Data peralatan berhasil diperbarui!');
            } else {
                peralatan.push(dataAlat);
                alert('Peralatan baru berhasil ditambahkan!');
            }

            localStorage.setItem('peralatan', JSON.stringify(peralatan));
            resetFormPeralatan();
            renderPeralatanAdmin();
        });
    }

    if (document.getElementById('equipmentGrid')) renderKatalog();
    if (document.getElementById('tblKategori')) renderKategoriAdmin();
    if (document.getElementById('tblRiwayat')) renderRiwayatPelanggan();
    if (document.getElementById('tblVerifikasi')) renderVerifikasiAdmin();
    if (document.getElementById('tblPengembalian')) renderPengembalianAdmin();
    if (document.getElementById('statCards')) renderDashboardStats();
});

function renderUserNavigation() {
    const navPelanggan = document.getElementById('navPelanggan');
    const userIndicator = document.getElementById('userIndicator');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const userInfo = document.getElementById('userInfo');

    const session = JSON.parse(localStorage.getItem('session_user'));

    if (userIndicator) {
        if (!session) {
            if (navPelanggan) navPelanggan.innerHTML = '';
            userIndicator.innerHTML = `
                <span>Status: <strong>Tamu</strong></span>
                <a href="login.html" class="btn btn-secondary" style="padding:0.3rem 0.8rem; font-size:0.85rem;">Login</a>
                <a href="register.html" class="btn" style="padding:0.3rem 0.8rem; font-size:0.85rem;">Register</a>
            `;
        } else if (session.role === 'pelanggan') {
            if (navPelanggan) navPelanggan.innerHTML = `<a href="riwayat-sewa.html">Riwayat Penyewaan</a>`;
            userIndicator.innerHTML = `
                <span>Halo, <strong>${session.nama}</strong></span>
                <a href="#" onclick="logout()" class="btn btn-danger" style="padding:0.3rem 0.8rem; font-size:0.85rem;">Logout</a>
            `;
        } else if (session.role === 'admin') {
            if (navPelanggan) navPelanggan.innerHTML = `<a href="dashboard.html" style="color:#ffb703;">Panel Admin</a>`;
            userIndicator.innerHTML = `
                <span>Mode: <strong>ADMIN</strong></span>
                <a href="dashboard.html" class="btn btn-secondary" style="padding:0.3rem 0.8rem; font-size:0.85rem;">Dashboard Admin</a>
            `;
        }
    }

    if (sidebarMenu && session && session.role === 'admin') {
        sidebarMenu.innerHTML = `
            <li><a href="dashboard.html">Dashboard Utama</a></li>
            <li><a href="index.html">Lihat Landing Page</a></li>
            <li><a href="admin-dashboard.html">Data Master</a></li>
            <li><a href="verifikasi-pembayaran.html">Verifikasi Pembayaran</a></li>
            <li><a href="pengembalian.html">Kelola Pengembalian</a></li>
            <li><a href="#" onclick="logout()">Logout</a></li>
        `;
        if (userInfo) userInfo.innerHTML = `User: <strong>${session.nama}</strong><br>Role: <strong>ADMIN</strong>`;
    }
}

function logout() {
    localStorage.removeItem('session_user');
    alert('Anda telah logout.');
    window.location.href = 'index.html';
}

function renderKatalog() {
    const grid = document.getElementById('equipmentGrid');
    const items = JSON.parse(localStorage.getItem('peralatan')) || [];
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];

    grid.innerHTML = '';
    items.forEach(item => {
        const kat = kategoris.find(k => k.id_kategori == item.id_kategori);
        grid.innerHTML += `
            <div class="card">
                <h3>${item.nama_peralatan}</h3>
                <p style="color:#666; font-size:0.9rem; margin-bottom:0.5rem;">Kategori: ${kat ? kat.nama_kategori : '-'}</p>
                <p><strong>Deskripsi:</strong> ${item.deskripsi}</p>
                <p><strong>Harga:</strong> Rp ${parseInt(item.harga_sewa).toLocaleString('id-ID')} / hari</p>
                <p><strong>Stok:</strong> ${item.stok} unit</p>
                <button class="btn" style="width:100%; margin-top:10px;" onclick="sewaItem('${item.nama_peralatan}')">Sewa Sekarang</button>
            </div>
        `;
    });
}

function sewaItem(nama) {
    const session = JSON.parse(localStorage.getItem('session_user'));
    if (!session) {
        alert('Silakan login terlebih dahulu untuk menyewa!');
        window.location.href = 'login.html';
    } else if (session.role === 'admin') {
        alert('Admin tidak dapat melakukan penyewaan.');
    } else {
        alert(`Pengajuan penyewaan untuk "${nama}" berhasil! Cek pesanan pada menu Riwayat Penyewaan.`);
    }
}

function switchMasterTab(tabName) {
    document.getElementById('tabKategori').style.display = (tabName === 'kategori') ? 'block' : 'none';
    document.getElementById('tabPeralatan').style.display = (tabName === 'peralatan') ? 'block' : 'none';
    document.getElementById('tabPelanggan').style.display = (tabName === 'pelanggan') ? 'block' : 'none';

    if (tabName === 'kategori') renderKategoriAdmin();
    if (tabName === 'peralatan') {
        loadKategoriDropdown();
        renderPeralatanAdmin();
    }
    if (tabName === 'pelanggan') renderPelangganAdmin();
}

function renderKategoriAdmin() {
    const tbody = document.querySelector('#tblKategori tbody');
    if (!tbody) return;
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    tbody.innerHTML = '';
    kategoris.forEach((k, index) => {
        tbody.innerHTML += `
            <tr>
                <td>${k.id_kategori}</td>
                <td>${k.nama_kategori}</td>
                <td><button class="btn btn-danger" onclick="hapusKategori(${index})">Hapus</button></td>
            </tr>
        `;
    });
}

function tambahKategori() {
    const input = document.getElementById('namaKategoriBaru');
    if (input.value.trim() === '') return;

    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    kategoris.push({ id_kategori: Date.now(), nama_kategori: input.value });
    localStorage.setItem('kategori_peralatan', JSON.stringify(kategoris));
    input.value = '';
    renderKategoriAdmin();
}

function hapusKategori(index) {
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    kategoris.splice(index, 1);
    localStorage.setItem('kategori_peralatan', JSON.stringify(kategoris));
    renderKategoriAdmin();
}

function loadKategoriDropdown() {
    const select = document.getElementById('pKategori');
    if (!select) return;
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    select.innerHTML = '<option value="">-- Pilih Kategori --</option>';
    kategoris.forEach(k => {
        select.innerHTML += `<option value="${k.id_kategori}">${k.nama_kategori}</option>`;
    });
}

function renderPeralatanAdmin() {
    const tbody = document.querySelector('#tblPeralatanMaster tbody');
    if (!tbody) return;
    const peralatan = JSON.parse(localStorage.getItem('peralatan')) || [];
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    tbody.innerHTML = '';

    peralatan.forEach((item, index) => {
        const kat = kategoris.find(k => k.id_kategori == item.id_kategori);
        tbody.innerHTML += `
            <tr>
                <td><strong>${item.nama_peralatan}</strong></td>
                <td>${kat ? kat.nama_kategori : '-'}</td>
                <td>Rp ${parseInt(item.harga_sewa).toLocaleString('id-ID')}</td>
                <td>${item.stok}</td>
                <td>${item.kondisi}</td>
                <td>${item.status || 'Aktif'}</td>
                <td>
                    <button class="btn btn-secondary" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="editPeralatan(${index})">Edit</button>
                    <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="hapusPeralatan(${index})">Hapus</button>
                </td>
            </tr>
        `;
    });
}

function editPeralatan(index) {
    const peralatan = JSON.parse(localStorage.getItem('peralatan')) || [];
    const item = peralatan[index];
    if (!item) return;

    document.getElementById('editAlatId').value = item.id_peralatan;
    document.getElementById('pNama').value = item.nama_peralatan;
    document.getElementById('pKategori').value = item.id_kategori;
    document.getElementById('pHarga').value = item.harga_sewa;
    document.getElementById('pStok').value = item.stok;
    document.getElementById('pKondisi').value = item.kondisi;
    document.getElementById('pStatus').value = item.status || 'Aktif';
    document.getElementById('pDeskripsi').value = item.deskripsi;
    document.getElementById('btnSimpanAlat').innerText = 'Update Peralatan';
}

function resetFormPeralatan() {
    const formP = document.getElementById('formPeralatan');
    if (formP) formP.reset();
    document.getElementById('editAlatId').value = '';
    document.getElementById('btnSimpanAlat').innerText = 'Simpan Peralatan';
}

function hapusPeralatan(index) {
    if (confirm('Yakin ingin menghapus peralatan ini?')) {
        const peralatan = JSON.parse(localStorage.getItem('peralatan')) || [];
        peralatan.splice(index, 1);
        localStorage.setItem('peralatan', JSON.stringify(peralatan));
        renderPeralatanAdmin();
    }
}

function renderPelangganAdmin() {
    const tbody = document.querySelector('#tblPelangganMaster tbody');
    if (!tbody) return;
    const pelanggan = JSON.parse(localStorage.getItem('pelanggan')) || [];
    tbody.innerHTML = '';

    if (pelanggan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Belum ada data pelanggan terdaftar.</td></tr>';
        return;
    }

    pelanggan.forEach((p, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${p.id_pelanggan}</td>
                <td><strong>${p.nama_pelanggan}</strong></td>
                <td>${p.email}</td>
                <td>
                    <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.8rem;" onclick="hapusPelanggan(${idx})">Hapus</button>
                </td>
            </tr>
        `;
    });
}

function hapusPelanggan(index) {
    if (confirm('Yakin ingin menghapus data pelanggan ini?')) {
        const pelanggan = JSON.parse(localStorage.getItem('pelanggan')) || [];
        pelanggan.splice(index, 1);
        localStorage.setItem('pelanggan', JSON.stringify(pelanggan));
        renderPelangganAdmin();
    }
}

function renderRiwayatPelanggan() {
    const tbody = document.querySelector('#tblRiwayat tbody');
    if (!tbody) return;
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    tbody.innerHTML = '';

    penyewaan.forEach((p, idx) => {
        let aksi = '-';
        if (p.status === 'Menunggu Pembayaran') {
            aksi = `<button class="btn" onclick="uploadBuktiSimulasi(${idx})">Unggah Bukti</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td>${p.kode_transaksi}</td>
                <td>${p.tgl_kembali_rencana}</td>
                <td>Rp ${parseInt(p.total_harga).toLocaleString('id-ID')}</td>
                <td><strong>${p.status}</strong></td>
                <td>${aksi}</td>
            </tr>
        `;
    });
}

function uploadBuktiSimulasi(index) {
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    penyewaan[index].status = 'Menunggu Verifikasi';
    localStorage.setItem('penyewaan', JSON.stringify(penyewaan));
    alert('Bukti pembayaran berhasil diunggah!');
    renderRiwayatPelanggan();
}

function renderVerifikasiAdmin() {
    const tbody = document.querySelector('#tblVerifikasi tbody');
    if (!tbody) return;
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    tbody.innerHTML = '';

    penyewaan.filter(p => p.status === 'Menunggu Verifikasi').forEach((p, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${p.kode_transaksi}</td>
                <td>${p.nama_pelanggan}</td>
                <td>Rp ${parseInt(p.total_harga).toLocaleString('id-ID')}</td>
                <td><a href="#" onclick="alert('Bukti transfer terverifikasi.')">Lihat Bukti</a></td>
                <td>
                    <button class="btn" onclick="verifikasiSewa(${idx}, 'Disetujui')">Setujui</button>
                    <button class="btn btn-danger" onclick="verifikasiSewa(${idx}, 'Dibatalkan')">Tolak</button>
                </td>
            </tr>
        `;
    });
}

function verifikasiSewa(index, statusBaru) {
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    penyewaan[index].status = statusBaru;
    localStorage.setItem('penyewaan', JSON.stringify(penyewaan));
    alert(`Status diubah menjadi: ${statusBaru}`);
    renderVerifikasiAdmin();
}

function renderPengembalianAdmin() {
    const tbody = document.querySelector('#tblPengembalian tbody');
    if (!tbody) return;
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    tbody.innerHTML = '';

    penyewaan.filter(p => p.status === 'Disetujui' || p.status === 'Sedang Disewa').forEach((p, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${p.kode_transaksi}</td>
                <td>${p.nama_pelanggan}</td>
                <td>${p.tgl_kembali_rencana}</td>
                <td><button class="btn" onclick="prosesPengembalian(${idx})">Proses Kembali</button></td>
            </tr>
        `;
    });
}

function prosesPengembalian(index) {
    const denda = prompt('Masukkan denda jika ada (Rp):', '0');
    if (denda !== null) {
        const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
        penyewaan[index].status = 'Selesai';
        localStorage.setItem('penyewaan', JSON.stringify(penyewaan));
        alert(`Pengembalian selesai dengan denda Rp ${parseInt(denda).toLocaleString('id-ID')}`);
        renderPengembalianAdmin();
    }
}

function renderDashboardStats() {
    const alat = JSON.parse(localStorage.getItem('peralatan')) || [];
    const kat = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    const sewa = JSON.parse(localStorage.getItem('penyewaan')) || [];

    if(document.getElementById('countAlat')) document.getElementById('countAlat').innerText = alat.length;
    if(document.getElementById('countKategori')) document.getElementById('countKategori').innerText = kat.length;
    if(document.getElementById('countPenyewaan')) document.getElementById('countPenyewaan').innerText = sewa.length;
}