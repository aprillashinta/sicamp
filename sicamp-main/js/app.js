// Inisialisasi Database LocalStorage
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
            { id_peralatan: 1, id_kategori: 1, nama_peralatan: 'Tenda Dome 4P', harga_sewa: 50000, stok: 5, kondisi: 'Bagus', deskripsi: 'Tenda waterproof double layer.' },
            { id_peralatan: 2, id_kategori: 2, nama_peralatan: 'Carrier Eiger 60L', harga_sewa: 35000, stok: 8, kondisi: 'Bagus', deskripsi: 'Tas gunung ergonomis.' },
            { id_peralatan: 3, id_kategori: 3, nama_peralatan: 'Sleeping Bag Dacron', harga_sewa: 15000, stok: 12, kondisi: 'Bagus', deskripsi: 'Sleeping bag hangat.' }
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

    // Handler Form Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUser').value;
            const pass = document.getElementById('loginPass').value;

            if (username === 'admin' && pass === 'admin123') {
                localStorage.setItem('session_user', JSON.stringify({ nama: 'Administrator', role: 'admin' }));
                alert('Login Berhasil sebagai Admin!');
                window.location.href = 'dashboard.html';
                return;
            }

            const pelangganList = JSON.parse(localStorage.getItem('pelanggan'));
            const user = pelangganList.find(p => p.email === username && p.password === pass);

            if (user) {
                localStorage.setItem('session_user', JSON.stringify({ nama: user.nama_pelanggan, role: 'pelanggan' }));
                alert(`Selamat Datang, ${user.nama_pelanggan}!`);
                window.location.href = 'index.html';
            } else {
                alert('Username/Email atau Password salah!');
            }
        });
    }

    // Handler Form Register
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nama = document.getElementById('regNama').value;
            const email = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPass').value;

            const pelangganList = JSON.parse(localStorage.getItem('pelanggan'));
            pelangganList.push({ id_pelanggan: Date.now(), nama_pelanggan: nama, email: email, password: pass });
            localStorage.setItem('pelanggan', JSON.stringify(pelangganList));

            alert('Pendaftaran Berhasil! Silakan Login.');
            window.location.href = 'login.html';
        });
    }

    // Render Konten Spesifik
    if (document.getElementById('equipmentGrid')) renderKatalog();
    if (document.getElementById('tblKategori')) renderKategoriAdmin();
    if (document.getElementById('tblRiwayat')) renderRiwayatPelanggan();
    if (document.getElementById('tblVerifikasi')) renderVerifikasiAdmin();
    if (document.getElementById('tblPengembalian')) renderPengembalianAdmin();
    if (document.getElementById('statCards')) renderDashboardStats();
});

// Render Header Top Navigation & Indikator User (Disesuaikan untuk Navbar Putih)
function renderUserNavigation() {
    const navPelanggan = document.getElementById('navPelanggan');
    const userIndicator = document.getElementById('userIndicator');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const userInfo = document.getElementById('userInfo');
    const session = JSON.parse(localStorage.getItem('session_user'));

    // 1. Jika di Halaman Landing / Publik (Navbar Putih)
    if (userIndicator) {
        if (!session) {
            if (navPelanggan) navPelanggan.innerHTML = '';
            userIndicator.innerHTML = `
                <span class="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-sicamp-800 bg-sicamp-50 px-3 py-1.5 rounded-full border border-sicamp-200">
                    <span class="w-2 h-2 rounded-full bg-sicamp-500"></span> Status: Tamu
                </span>
                <a href="login.html" class="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all border border-slate-200">
                    Login
                </a>
                <a href="register.html" class="px-5 py-2 text-xs font-bold text-white bg-sicamp-700 hover:bg-sicamp-800 rounded-full transition-all shadow-md shadow-sicamp-700/20">
                    Daftar
                </a>
            `;
        } else if (session.role === 'pelanggan') {
            if (navPelanggan) {
                navPelanggan.innerHTML = `
                    <a href="riwayat-sewa.html" class="text-sm font-semibold text-slate-600 hover:text-sicamp-700 transition-colors flex items-center gap-1.5">
                        <i class="fa-solid fa-clock-rotate-left text-xs text-sicamp-700"></i> Riwayat Penyewaan
                    </a>
                `;
            }
            userIndicator.innerHTML = `
                <div class="flex items-center gap-3">
                    <div class="text-right hidden sm:block">
                        <span class="block text-[10px] text-slate-400 font-medium">Selamat Datang,</span>
                        <span class="text-xs font-bold text-slate-800 leading-none">${session.nama}</span>
                    </div>
                    <button onclick="logout()" class="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-full border border-rose-200 transition-all flex items-center gap-1.5">
                        <i class="fa-solid fa-right-from-bracket"></i> Logout
                    </button>
                </div>
            `;
        } else if (session.role === 'admin') {
            if (navPelanggan) {
                navPelanggan.innerHTML = `
                    <a href="dashboard.html" class="text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                        <i class="fa-solid fa-gauge"></i> Panel Admin
                    </a>
                `;
            }
            userIndicator.innerHTML = `
                <a href="dashboard.html" class="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-full transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5">
                    <i class="fa-solid fa-user-shield"></i> Admin
                </a>
            `;
        }
    }

    // 2. Jika di Halaman Panel Admin (Pakai Sidebar)
    if (sidebarMenu && session && session.role === 'admin') {
        sidebarMenu.innerHTML = `
            <li><a href="dashboard.html" class="block px-4 py-2.5 rounded-xl font-medium hover:bg-brand-800 transition-colors">Dashboard Utama</a></li>
            <li><a href="index.html" class="block px-4 py-2.5 rounded-xl font-medium hover:bg-brand-800 transition-colors">Lihat Landing Page</a></li>
            <li><a href="admin-dashboard.html" class="block px-4 py-2.5 rounded-xl font-medium hover:bg-brand-800 transition-colors">Kelola Kategori & Alat</a></li>
            <li><a href="verifikasi-pembayaran.html" class="block px-4 py-2.5 rounded-xl font-medium hover:bg-brand-800 transition-colors">Verifikasi Pembayaran</a></li>
            <li><a href="pengembalian.html" class="block px-4 py-2.5 rounded-xl font-medium hover:bg-brand-800 transition-colors">Kelola Pengembalian</a></li>
            <li class="mt-4"><a href="#" onclick="logout()" class="block px-4 py-2.5 rounded-xl font-medium text-rose-300 hover:bg-rose-600 hover:text-white transition-colors">Logout</a></li>
        `;
        if (userInfo) userInfo.innerHTML = `User: <strong>${session.nama}</strong><br>Role: <strong>ADMIN</strong>`;
    }
}

function logout() {
    localStorage.removeItem('session_user');
    alert('Anda telah logout.');
    window.location.href = 'index.html';
}

// Render Katalog Peralatan
// Render Katalog Peralatan Camping dengan Tampilan Card Modern
function renderKatalog() {
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;
    
    const items = JSON.parse(localStorage.getItem('peralatan')) || [];
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];

    grid.innerHTML = '';

    if (items.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200">
                <i class="fa-solid fa-box-open text-4xl text-slate-300 mb-3"></i>
                <p class="text-slate-500 font-medium">Belum ada peralatan camping yang tersedia saat ini.</p>
            </div>
        `;
        return;
    }

    // Gambar Default jika peralatan belum memiliki atribut URL gambar
    const sampleImages = [
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1517824806704-9040b037703b?auto=format&fit=crop&w=600&q=80"
    ];

    items.forEach((item, index) => {
        const kat = kategoris.find(k => k.id_kategori == item.id_kategori);
        const imgUrl = sampleImages[index % sampleImages.length];

        grid.innerHTML += `
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                <!-- Thumbnail Image & Badges -->
                <div class="relative h-48 overflow-hidden bg-slate-100">
                    <img src="${imgUrl}" alt="${item.nama_peralatan}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                    <div class="absolute top-3 left-3 flex gap-2">
                        <span class="bg-brand-900/80 backdrop-blur-md text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-brand-700/50">
                            ${kat ? kat.nama_kategori : 'Umum'}
                        </span>
                    </div>
                    <div class="absolute top-3 right-3">
                        <span class="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">
                            Stok: ${item.stok}
                        </span>
                    </div>
                </div>

                <!-- Card Body -->
                <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                        <h3 class="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                            ${item.nama_peralatan}
                        </h3>
                        <p class="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                            ${item.deskripsi || 'Peralatan kemping berkualitas tinggi, bersih, dan siap untuk digunakan.'}
                        </p>
                    </div>

                    <!-- Price & Action Button -->
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                            <span class="block text-[11px] font-medium text-slate-400 uppercase tracking-wider">Harga Sewa</span>
                            <span class="text-lg font-extrabold text-brand-700">
                                Rp ${parseInt(item.harga_sewa).toLocaleString('id-ID')}
                                <span class="text-xs text-slate-400 font-normal">/hari</span>
                            </span>
                        </div>
                        <button onclick="sewaItem('${item.nama_peralatan}')" class="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-600/20 transition-all flex items-center gap-1.5">
                            <i class="fa-solid fa-cart-plus"></i> Sewa
                        </button>
                    </div>
                </div>
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

// Fungsi Admin & Pelanggan Lainnya
function renderKategoriAdmin() {
    const tbody = document.querySelector('#tblKategori tbody');
    if (!tbody) return;
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan'));
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

    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan'));
    kategoris.push({ id_kategori: Date.now(), nama_kategori: input.value });
    localStorage.setItem('kategori_peralatan', JSON.stringify(kategoris));
    input.value = '';
    renderKategoriAdmin();
}

function hapusKategori(index) {
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan'));
    kategoris.splice(index, 1);
    localStorage.setItem('kategori_peralatan', JSON.stringify(kategoris));
    renderKategoriAdmin();
}

function renderRiwayatPelanggan() {
    const tbody = document.querySelector('#tblRiwayat tbody');
    if (!tbody) return;

    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    tbody.innerHTML = '';

    if (penyewaan.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-slate-400">
                    <i class="fa-solid fa-folder-open text-3xl mb-2 block"></i>
                    Belum ada riwayat penyewaan peralatan.
                </td>
            </tr>
        `;
        return;
    }

    penyewaan.forEach((p, idx) => {
        let statusBadge = '';
        if (p.status === 'Menunggu Pembayaran') {
            statusBadge = `<span class="bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-lg">Menunggu Pembayaran</span>`;
        } else if (p.status === 'Menunggu Verifikasi') {
            statusBadge = `<span class="bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold px-2.5 py-1 rounded-lg">Menunggu Verifikasi</span>`;
        } else if (p.status === 'Disetujui' || p.status === 'Selesai') {
            statusBadge = `<span class="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-lg">${p.status}</span>`;
        } else {
            statusBadge = `<span class="bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold px-2.5 py-1 rounded-lg">${p.status}</span>`;
        }

        let aksi = '-';
        if (p.status === 'Menunggu Pembayaran') {
            aksi = `<button class="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 mx-auto" onclick="uploadBuktiSimulasi(${idx})">
                        <i class="fa-solid fa-upload"></i> Unggah Bukti
                    </button>`;
        }

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-4 px-6 font-bold text-brand-900">${p.kode_transaksi}</td>
                <td class="py-4 px-6">${p.tgl_kembali_rencana}</td>
                <td class="py-4 px-6 font-bold text-slate-900">Rp ${p.total_harga.toLocaleString('id-ID')}</td>
                <td class="py-4 px-6">${statusBadge}</td>
                <td class="py-4 px-6 text-center">${aksi}</td>
            </tr>
        `;
    });
}

function uploadBuktiSimulasi(index) {
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan'));
    penyewaan[index].status = 'Menunggu Verifikasi';
    localStorage.setItem('penyewaan', JSON.stringify(penyewaan));
    alert('Bukti pembayaran berhasil diunggah!');
    renderRiwayatPelanggan();
}

function renderVerifikasiAdmin() {
    const tbody = document.querySelector('#tblVerifikasi tbody');
    if (!tbody) return;
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan'));
    tbody.innerHTML = '';

    penyewaan.filter(p => p.status === 'Menunggu Verifikasi').forEach((p, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${p.kode_transaksi}</td>
                <td>${p.nama_pelanggan}</td>
                <td>Rp ${p.total_harga.toLocaleString('id-ID')}</td>
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
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan'));
    penyewaan[index].status = statusBaru;
    localStorage.setItem('penyewaan', JSON.stringify(penyewaan));
    alert(`Status diubah menjadi: ${statusBaru}`);
    renderVerifikasiAdmin();
}

function renderPengembalianAdmin() {
    const tbody = document.querySelector('#tblPengembalian tbody');
    if (!tbody) return;
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan'));
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
        const penyewaan = JSON.parse(localStorage.getItem('penyewaan'));
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

// Function Navigasi Tab Data Master
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

// ==========================================
// 1. KELOLA DATA PERALATAN (CRUD)
// ==========================================
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

// Form Handler Tambah / Edit Peralatan
document.addEventListener('DOMContentLoaded', () => {
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
                // Proses Edit / Ubah
                const idx = peralatan.findIndex(p => p.id_peralatan == editId);
                if (idx !== -1) peralatan[idx] = dataAlat;
                alert('Data peralatan berhasil diperbarui!');
            } else {
                // Proses Tambah Baru
                peralatan.push(dataAlat);
                alert('Peralatan baru berhasil ditambahkan!');
            }

            localStorage.setItem('peralatan', JSON.stringify(peralatan));
            resetFormPeralatan();
            renderPeralatanAdmin();
        });
    }
});

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

// ==========================================
// 2. KELOLA DATA PELANGGAN
// ==========================================
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