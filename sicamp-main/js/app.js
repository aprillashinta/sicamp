// ==========================================
// 1. DATABASE LOCALSTORAGE & INISIALISASI
// ==========================================
function initDefaultData() {
    const defaultKategori = [
        { id_kategori: '1', nama_kategori: 'Tenda & Shelter' },
        { id_kategori: '2', nama_kategori: 'Carrier & Tas' },
        { id_kategori: '3', nama_kategori: 'Alat Masak & Makan' },
        { id_kategori: '4', nama_kategori: 'Tidur & Matras' },
        { id_kategori: '5', nama_kategori: 'Aksesori & Penerangan' }
    ];

    if (!localStorage.getItem('kategori_peralatan')) {
        localStorage.setItem('kategori_peralatan', JSON.stringify(defaultKategori));
    }
}

function initDatabase() {
    initDefaultData();

    if (!localStorage.getItem('peralatan')) {
        const defaultPeralatan = [
            { id_peralatan: 1, id_kategori: 1, nama_peralatan: 'Tenda Dome 4P', harga_sewa: 50000, stok: 5, kondisi: 'Bagus', status: 'Aktif', deskripsi: 'Tenda waterproof double layer.' },
            { id_peralatan: 2, id_kategori: 2, nama_peralatan: 'Carrier Eiger 60L', harga_sewa: 35000, stok: 8, kondisi: 'Bagus', status: 'Aktif', deskripsi: 'Tas gunung ergonomis.' },
            { id_peralatan: 3, id_kategori: 4, nama_peralatan: 'Sleeping Bag Dacron', harga_sewa: 15000, stok: 12, kondisi: 'Bagus', status: 'Aktif', deskripsi: 'Sleeping bag hangat.' }
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

// ==========================================
// 2. EVENT LISTENER AWAL (DOM CONTENT LOADED)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    renderUserNavigation();
    renderCategoryOptionsAndTabs();

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
    if (document.getElementById('tblKategoriMaster')) renderKategoriAdmin();
    if (document.getElementById('tblKategoriAdmin')) renderTabelKategoriAdmin();
    if (document.getElementById('tblRiwayat')) renderRiwayatPelanggan();
    if (document.getElementById('tblVerifikasi')) renderVerifikasiAdmin();
    if (document.getElementById('tblPengembalian')) renderPengembalianAdmin();
    if (document.getElementById('statCards')) renderDashboardStats();
});

// ==========================================
// 3. RENDER NAVIGASI & KATEGORI (MODERN UI)
// ==========================================
function renderCategoryOptionsAndTabs() {
    const selectSelect = document.getElementById('searchKategoriSelect');
    const tabContainer = document.getElementById('filterCategoryContainer');
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    const currentCategoryFilter = window.currentCategoryFilter || 'all';

    if (selectSelect) {
        selectSelect.innerHTML = '<option value="all">Semua Kategori</option>';
        kategoris.forEach(k => {
            selectSelect.innerHTML += `<option value="${k.id_kategori}">${k.nama_kategori}</option>`;
        });
        selectSelect.value = currentCategoryFilter;
    }

    if (tabContainer) {
        tabContainer.innerHTML = `
            <button onclick="setCategoryFilter('all')" class="px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${currentCategoryFilter === 'all' ? 'bg-sicamp-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                Semua Alat
            </button>
        `;
        kategoris.forEach(k => {
            const isSelected = String(currentCategoryFilter) === String(k.id_kategori);
            tabContainer.innerHTML += `
                <button onclick="setCategoryFilter('${k.id_kategori}')" class="px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${isSelected ? 'bg-sicamp-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                    ${k.nama_kategori}
                </button>
            `;
        });
    }
}

function renderUserNavigation() {
    const navPelanggan = document.getElementById('navPelanggan');
    const userIndicator = document.getElementById('userIndicator');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const userInfo = document.getElementById('userInfo');

    const session = JSON.parse(localStorage.getItem('session_user'));
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    if (userIndicator) {
        if (!session) {
            if (navPelanggan) navPelanggan.innerHTML = '';
            userIndicator.innerHTML = `
                <a href="login.html" class="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all border border-slate-200">Masuk</a>
                <a href="register.html" class="px-4 py-2 text-xs font-bold text-white bg-sicamp-700 hover:bg-sicamp-800 rounded-full transition-all shadow-md shadow-sicamp-700/20">Daftar</a>
            `;
        } else if (session.role === 'pelanggan') {
            if (navPelanggan) {
                navPelanggan.innerHTML = `
                    <a href="riwayat-sewa.html" class="hover:text-sicamp-700 transition-colors flex items-center gap-1">
                        <i class="fa-solid fa-clock-rotate-left text-xs text-sicamp-700"></i> Riwayat
                    </a>
                `;
            }
            userIndicator.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-800 hidden sm:inline">${session.nama}</span>
                    <button onclick="logout()" class="px-3 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-full border border-rose-200 transition-all">Logout</button>
                </div>
            `;
        } else if (session.role === 'admin') {
            if (navPelanggan) {
                navPelanggan.innerHTML = `<a href="dashboard.html" class="text-amber-600 font-bold hover:underline">Panel Admin</a>`;
            }
            userIndicator.innerHTML = `
                <a href="dashboard.html" class="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-full transition-all">Admin Dashboard</a>
            `;
        }
    }

    if (sidebarMenu && session && session.role === 'admin') {
        const menuItems = [
            { name: 'Dashboard Utama', url: 'dashboard.html', icon: 'fa-chart-pie' },
            { name: 'Lihat Landing Page', url: 'index.html', icon: 'fa-globe' },
            { name: 'Kelola Kategori & Alat', url: 'admin-dashboard.html', icon: 'fa-boxes-stacked' },
            { name: 'Verifikasi Pembayaran', url: 'verifikasi-pembayaran.html', icon: 'fa-file-invoice-dollar' },
            { name: 'Kelola Pengembalian', url: 'pengembalian.html', icon: 'fa-rotate-left' }
        ];

        sidebarMenu.innerHTML = '';
        menuItems.forEach(item => {
            const isActive = currentPath === item.url;
            const activeClass = isActive 
                ? 'bg-sicamp-700 text-white font-bold shadow-md shadow-sicamp-700/30' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium';

            sidebarMenu.innerHTML += `
                <li>
                    <a href="${item.url}" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs transition-all ${activeClass}">
                        <i class="fa-solid ${item.icon} text-sm"></i>
                        <span>${item.name}</span>
                    </a>
                </li>
            `;
        });

        sidebarMenu.innerHTML += `
            <li class="pt-4 mt-2 border-t border-slate-800">
                <a href="#" onclick="logout()" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-semibold">
                    <i class="fa-solid fa-right-from-bracket text-sm"></i>
                    <span>Logout</span>
                </a>
            </li>
        `;

        if (userInfo) {
            userInfo.innerHTML = `User: <strong class="text-white">${session.nama}</strong><br>Role: <strong class="text-sicamp-500 uppercase">ADMIN</strong>`;
        }
    }
}

function logout() {
    localStorage.removeItem('session_user');
    alert('Anda telah logout.');
    window.location.href = 'index.html';
}

// ==========================================
// 4. RENDER KATALOG & RIWAYAT PELANGGAN
// ==========================================
function renderKatalog() {
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;
    const items = JSON.parse(localStorage.getItem('peralatan')) || [];
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];

    grid.innerHTML = '';
    items.forEach(item => {
        const kat = kategoris.find(k => k.id_kategori == item.id_kategori);
        grid.innerHTML += `
            <div class="card bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-slate-800 text-lg mb-1">${item.nama_peralatan}</h3>
                    <p class="text-xs text-slate-400 mb-3">Kategori: ${kat ? kat.nama_kategori : '-'}</p>
                    <p class="text-xs text-slate-600 mb-2"><strong>Deskripsi:</strong> ${item.deskripsi}</p>
                    <p class="text-xs text-slate-600 mb-1"><strong>Harga:</strong> Rp ${parseInt(item.harga_sewa).toLocaleString('id-ID')} / hari</p>
                    <p class="text-xs text-slate-600 mb-4"><strong>Stok:</strong> ${item.stok} unit</p>
                </div>
                <button class="w-full py-2 bg-sicamp-700 hover:bg-sicamp-800 text-white font-bold text-xs rounded-xl shadow-sm transition-all" onclick="sewaItem('${item.nama_peralatan}')">Sewa Sekarang</button>
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

function renderRiwayatPelanggan() {
    const tbody = document.querySelector('#tblRiwayat tbody');
    if (!tbody) return;

    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    tbody.innerHTML = '';

    if (penyewaan.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-12 text-center text-slate-400">
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
            statusBadge = `<span class="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full">Menunggu Pembayaran</span>`;
        } else if (p.status === 'Menunggu Verifikasi') {
            statusBadge = `<span class="bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-bold px-2.5 py-1 rounded-full">Menunggu Verifikasi</span>`;
        } else if (p.status === 'Disetujui' || p.status === 'Selesai') {
            statusBadge = `<span class="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-full">${p.status}</span>`;
        } else {
            statusBadge = `<span class="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-bold px-2.5 py-1 rounded-full">${p.status}</span>`;
        }

        let aksi = '-';
        if (p.status === 'Menunggu Pembayaran') {
            aksi = `<button onclick="uploadBuktiSimulasi(${idx})" class="px-3 py-1.5 bg-sicamp-700 hover:bg-sicamp-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 mx-auto">
                        <i class="fa-solid fa-upload"></i> Unggah Bukti
                    </button>`;
        }

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-4 px-6 font-bold text-slate-900">${p.kode_transaksi}</td>
                <td class="py-4 px-6">${p.tgl_sewa || '-'}</td>
                <td class="py-4 px-6">${p.tgl_kembali_rencana || '-'}</td>
                <td class="py-4 px-6 font-bold text-sicamp-700">Rp ${(p.total_harga || 0).toLocaleString('id-ID')}</td>
                <td class="py-4 px-6">${statusBadge}</td>
                <td class="py-4 px-6 text-center">${aksi}</td>
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

// ==========================================
// 5. RENDER FITUR ADMIN & KELOLA DATA
// ==========================================
function switchMasterTab(tabName) {
    if (document.getElementById('tabKategori')) document.getElementById('tabKategori').style.display = (tabName === 'kategori') ? 'block' : 'none';
    if (document.getElementById('tabPeralatan')) document.getElementById('tabPeralatan').style.display = (tabName === 'peralatan') ? 'block' : 'none';
    if (document.getElementById('tabPelanggan')) document.getElementById('tabPelanggan').style.display = (tabName === 'pelanggan') ? 'block' : 'none';

    if (tabName === 'kategori') renderKategoriAdmin();
    if (tabName === 'peralatan') {
        loadKategoriDropdown();
        renderPeralatanAdmin();
    }
    if (tabName === 'pelanggan') renderPelangganAdmin();
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
                    <button class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold rounded" onclick="editPeralatan(${index})">Edit</button>
                    <button class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded" onclick="hapusPeralatan(${index})">Hapus</button>
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
    if (document.getElementById('editAlatId')) document.getElementById('editAlatId').value = '';
    if (document.getElementById('btnSimpanAlat')) document.getElementById('btnSimpanAlat').innerText = 'Simpan Peralatan';
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
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada data pelanggan terdaftar.</td></tr>';
        return;
    }

    pelanggan.forEach((p, idx) => {
        tbody.innerHTML += `
            <tr>
                <td>${p.id_pelanggan}</td>
                <td><strong>${p.nama_pelanggan}</strong></td>
                <td>${p.email}</td>
                <td>
                    <button class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded" onclick="hapusPelanggan(${idx})">Hapus</button>
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

function renderTabelKategoriAdmin() {
    const tbody = document.querySelector('#tblKategoriAdmin tbody');
    if (!tbody) return;

    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    tbody.innerHTML = '';

    if (kategoris.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-slate-400">Belum ada kategori.</td></tr>`;
        return;
    }

    kategoris.forEach((k, idx) => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3.5 px-6 font-bold text-slate-900">${k.id_kategori}</td>
                <td class="py-3.5 px-6 font-semibold">${k.nama_kategori}</td>
                <td class="py-3.5 px-6 text-center">
                    <button onclick="hapusKategoriAdmin(${idx})" class="p-1 text-rose-500 hover:text-rose-700 text-xs">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

function openModalKategori() {
    if (document.getElementById('inputNamaKategori')) document.getElementById('inputNamaKategori').value = '';
    if (document.getElementById('modalKategori')) document.getElementById('modalKategori').classList.remove('hidden');
}

function closeModalKategori() {
    if (document.getElementById('modalKategori')) document.getElementById('modalKategori').classList.add('hidden');
}

function saveKategoriHandler(e) {
    e.preventDefault();
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    const nama = document.getElementById('inputNamaKategori').value.trim();

    if (!nama) return;

    const newKat = {
        id_kategori: String(Date.now()),
        nama_kategori: nama
    };

    kategoris.push(newKat);
    localStorage.setItem('kategori_peralatan', JSON.stringify(kategoris));
    
    alert('Kategori berhasil ditambahkan!');
    closeModalKategori();
    
    renderTabelKategoriAdmin();
    renderCategoryOptionsAndTabs();
}

function hapusKategoriAdmin(index) {
    if (confirm('Yakin ingin menghapus kategori ini?')) {
        const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
        kategoris.splice(index, 1);
        localStorage.setItem('kategori_peralatan', JSON.stringify(kategoris));
        renderTabelKategoriAdmin();
        renderCategoryOptionsAndTabs();
    }
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
                <td><a href="#" class="text-blue-600 underline" onclick="alert('Bukti transfer terverifikasi.')">Lihat Bukti</a></td>
                <td>
                    <button class="px-2 py-1 bg-emerald-600 text-white text-xs font-bold rounded" onclick="verifikasiSewa(${idx}, 'Disetujui')">Setujui</button>
                    <button class="px-2 py-1 bg-rose-600 text-white text-xs font-bold rounded" onclick="verifikasiSewa(${idx}, 'Dibatalkan')">Tolak</button>
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
                <td><button class="px-3 py-1 bg-sicamp-700 text-white text-xs font-bold rounded" onclick="prosesPengembalian(${idx})">Proses Kembali</button></td>
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

    if (document.getElementById('countAlat')) document.getElementById('countAlat').innerText = alat.length;
    if (document.getElementById('countKategori')) document.getElementById('countKategori').innerText = kat.length;
    if (document.getElementById('countPenyewaan')) document.getElementById('countPenyewaan').innerText = sewa.length;
}

// ==========================================
// 6. REAL-TIME SYNC Antar Tab Browser
// ==========================================
window.addEventListener('storage', (e) => {
    if (e.key === 'kategori_peralatan' || e.key === 'peralatan') {
        renderCategoryOptionsAndTabs();
        renderKatalog();
    }
});

window.addEventListener('focus', () => {
    renderCategoryOptionsAndTabs();
    renderKatalog();
});