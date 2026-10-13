let currentCheckoutStep = 1;
let currentCategoryFilter = 'all';
let searchKeyword = '';

function renderUserNavigation() {
    const navPelanggan = document.getElementById('navPelanggan');
    const userIndicator = document.getElementById('userIndicator');
    const sidebarAdmin = document.getElementById('sidebarAdmin');

    const session = JSON.parse(localStorage.getItem('session_user'));
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    if (userIndicator) {
        if (!session) {
            if (navPelanggan) navPelanggan.innerHTML = '';
            userIndicator.innerHTML = `
                <a href="login.html" class="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-all border border-slate-200 no-underline">Masuk</a>
                <a href="register.html" class="px-4 py-2 text-xs font-bold text-white bg-sicamp-700 hover:bg-sicamp-800 rounded-full transition-all shadow-md shadow-sicamp-700/20 no-underline">Daftar</a>
            `;
        } else if (session.role === 'pelanggan') {
            if (navPelanggan) {
                navPelanggan.innerHTML = `
                    <a href="riwayat-sewa.html" class="hover:text-sicamp-700 transition-colors flex items-center gap-1.5 no-underline">
                        <i class="fa-solid fa-clock-rotate-left text-xs text-sicamp-700"></i> Riwayat Penyewaan
                    </a>
                `;
            }
            userIndicator.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-slate-800 hidden sm:inline">Halo, <strong>${session.nama}</strong></span>
                    <button onclick="logout()" class="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-full border border-rose-200 transition-all cursor-pointer">Logout</button>
                </div>
            `;
        } else if (session.role === 'admin') {
            if (navPelanggan) {
                navPelanggan.innerHTML = `
                    <a href="dashboard.html" class="text-amber-600 font-bold hover:underline no-underline">Panel Admin</a>
                `;
            }
            userIndicator.innerHTML = `
                <a href="dashboard.html" class="px-4 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-full transition-all no-underline shadow-md shadow-amber-500/20">Admin Dashboard</a>
            `;
        }
    }

    if (sidebarAdmin) {
        const adminName = session ? session.nama : 'Administrator';
        
        sidebarAdmin.innerHTML = `
            <div>
                <div class="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div class="w-10 h-10 bg-sicamp-700 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg shadow-sicamp-700/30">
                        <i class="fa-solid fa-tree"></i>
                    </div>
                    <div>
                        <h1 class="font-extrabold text-lg leading-none">SiCamp</h1>
                        <span class="text-[10px] font-bold tracking-wider text-slate-400 uppercase">Admin Control</span>
                    </div>
                </div>

                <nav class="p-4">
                    <ul class="space-y-1">
                        <li>
                            <a href="dashboard.html" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs transition-all no-underline ${currentPath === 'dashboard.html' ? 'bg-sicamp-700 text-white font-bold shadow-md shadow-sicamp-700/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}">
                                <i class="fa-solid fa-chart-pie text-sm"></i>
                                <span>Dashboard Utama</span>
                            </a>
                        </li>
                        <li class="pt-3 pb-1 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">DATA MASTER</li>
                        <li>
                            <a href="kelola-alat.html" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs transition-all no-underline ${currentPath === 'kelola-alat.html' ? 'bg-sicamp-700 text-white font-bold shadow-md shadow-sicamp-700/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}">
                                <i class="fa-solid fa-boxes-stacked text-sm"></i>
                                <span>Kelola Alat</span>
                            </a>
                        </li>
                        <li>
                            <a href="kelola-kategori.html" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs transition-all no-underline ${currentPath === 'kelola-kategori.html' ? 'bg-sicamp-700 text-white font-bold shadow-md shadow-sicamp-700/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}">
                                <i class="fa-solid fa-tags text-sm"></i>
                                <span>Kelola Kategori</span>
                            </a>
                        </li>
                        <li class="pt-3 pb-1 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">TRANSAKSI</li>
                        <li>
                            <a href="verifikasi-pembayaran.html" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs transition-all no-underline ${currentPath === 'verifikasi-pembayaran.html' ? 'bg-sicamp-700 text-white font-bold shadow-md shadow-sicamp-700/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}">
                                <i class="fa-solid fa-file-invoice-dollar text-sm"></i>
                                <span>Verifikasi Pembayaran</span>
                            </a>
                        </li>
                        <li>
                            <a href="pengembalian.html" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs transition-all no-underline ${currentPath === 'pengembalian.html' ? 'bg-sicamp-700 text-white font-bold shadow-md shadow-sicamp-700/30' : 'text-slate-300 hover:bg-slate-800 hover:text-white font-medium'}">
                                <i class="fa-solid fa-rotate-left text-sm"></i>
                                <span>Kelola Pengembalian</span>
                            </a>
                        </li>
                        <li class="pt-4 mt-2 border-t border-slate-800">
                            <a href="#" onclick="logout()" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-semibold no-underline">
                                <i class="fa-solid fa-right-from-bracket text-sm"></i>
                                <span>Logout</span>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>

            <div class="p-4 border-t border-slate-800 bg-slate-950/50">
                <p class="text-xs text-slate-400 leading-relaxed">
                    User: <strong class="text-white">${adminName}</strong><br>
                    Role: <strong class="text-amber-500 uppercase">ADMIN</strong>
                </p>
            </div>
        `;
    }
}

function logout() {
    localStorage.removeItem('session_user');
    alert('Anda telah logout.');
    window.location.href = 'login.html';
}

async function loadKategoriFromDB() {
    try {
        const res = await fetch('api/api_kategori.php');
        const kategoris = await res.json();
        localStorage.setItem('kategori_peralatan', JSON.stringify(kategoris));
        renderTabelKategoriAdmin();
        renderCategoryOptionsAndTabs();
    } catch (err) {
        console.error("Gagal memuat kategori dari DB:", err);
    }
}

function renderTabelKategoriAdmin() {
    const tbody = document.querySelector('#tblKategoriAdmin tbody') || document.querySelector('#tblKategori tbody');
    if (!tbody) return;

    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
    tbody.innerHTML = '';

    if (kategoris.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="py-6 text-center text-slate-400 font-medium">Belum ada kategori. Silakan tambah kategori baru.</td></tr>`;
        return;
    }

    kategoris.forEach((k) => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3.5 px-6 font-bold text-slate-900">${k.id_kategori}</td>
                <td class="py-3.5 px-6 font-semibold">${k.nama_kategori}</td>
                <td class="py-3.5 px-6 text-center">
                    <button onclick="hapusKategoriAdmin(${k.id_kategori})" class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 mx-auto cursor-pointer">
                        <i class="fa-solid fa-trash"></i> Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}

function openModalTambahKategori() {
    const input = document.getElementById('inputNamaKategori');
    if (input) input.value = '';
    const modal = document.getElementById('modalKategori');
    if (modal) modal.classList.remove('hidden');
}

function closeModalKategori() {
    const modal = document.getElementById('modalKategori');
    if (modal) modal.classList.add('hidden');
}

async function saveKategoriHandler(e) {
    e.preventDefault();
    const input = document.getElementById('inputNamaKategori');
    const nama = input ? input.value.trim() : '';

    if (!nama) {
        alert('Harap isi Nama Kategori!');
        return;
    }

    try {
        const res = await fetch('api/api_kategori.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama_kategori: nama })
        });
        const result = await res.json();
        if (result.status === 'success' || result.id) {
            alert('Kategori berhasil disimpan ke Database!');
            closeModalKategori();
            loadKategoriFromDB();
        } else {
            alert('Gagal menyimpan kategori!');
        }
    } catch (err) {
        alert('Terjadi kesalahan jaringan.');
    }
}

async function hapusKategoriAdmin(idKategori) {
    if (confirm('Yakin ingin menghapus kategori ini dari Database?')) {
        try {
            const res = await fetch(`api/api_kategori.php?id=${idKategori}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.status === 'success') {
                alert('Kategori berhasil dihapus!');
                loadKategoriFromDB();
            } else {
                alert('Gagal menghapus kategori!');
            }
        } catch (err) {
            alert('Terjadi kesalahan jaringan.');
        }
    }
}

async function loadPeralatanFromDB() {
    try {
        const res = await fetch('api/api_peralatan.php');
        const peralatan = await res.json();
        localStorage.setItem('peralatan', JSON.stringify(peralatan));
        if (document.getElementById('tblPeralatanAdmin')) renderTabelPeralatanAdmin();
        if (document.getElementById('equipmentGrid')) renderKatalog();
    } catch (err) {
        console.error("Gagal memuat peralatan dari DB:", err);
    }
}

function renderTabelPeralatanAdmin() {
    const tbody = document.querySelector('#tblPeralatanAdmin tbody');
    if (!tbody) return;

    const peralatan = JSON.parse(localStorage.getItem('peralatan')) || [];
    tbody.innerHTML = '';

    if (peralatan.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-slate-400 font-medium">Belum ada data peralatan. Silakan tambah peralatan baru.</td></tr>`;
        return;
    }

    peralatan.forEach((p) => {
        const imgUrl = p.gambar || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80';

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="py-3 px-6">
                    <img src="${imgUrl}" alt="${p.nama_peralatan}" class="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-xs">
                </td>
                <td class="py-4 px-6 font-bold text-slate-900">${p.id_peralatan}</td>
                <td class="py-4 px-6 font-bold text-slate-800">${p.nama_peralatan}</td>
                <td class="py-4 px-6 font-semibold text-slate-500">${p.nama_kategori || 'Umum'}</td>
                <td class="py-4 px-6 font-extrabold text-sicamp-700">Rp ${parseInt(p.harga_sewa).toLocaleString('id-ID')}</td>
                <td class="py-4 px-6 font-bold">${p.stok} unit</td>
                <td class="py-4 px-6 text-center">
                    <button onclick="hapusPeralatanAdmin('${p.id_peralatan}')" class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer">
                        <i class="fa-solid fa-trash"></i> Hapus
                    </button>
                </td>
            </tr>
        `;
    });
}

function openModalTambahAlat() {
    const form = document.getElementById('formPeralatan');
    if (form) form.reset();
    
    const idInput = document.getElementById('inputAlatId');
    if (idInput) idInput.value = '';

    const selectKategori = document.getElementById('inputKategoriAlat');
    if (selectKategori) {
        const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];
        selectKategori.innerHTML = '<option value="">-- Pilih Kategori --</option>';
        kategoris.forEach(k => {
            selectKategori.innerHTML += `<option value="${k.id_kategori}">${k.nama_kategori}</option>`;
        });
    }

    const modal = document.getElementById('modalPeralatan');
    if (modal) modal.classList.remove('hidden');
}

function closeModalAlat() {
    const modal = document.getElementById('modalPeralatan');
    if (modal) modal.classList.add('hidden');
}

async function savePeralatanHandler(e) {
    e.preventDefault();

    const idAlat = document.getElementById('inputAlatId').value;
    const idKategori = document.getElementById('inputKategoriAlat').value;
    const namaAlat = document.getElementById('inputNamaAlat').value.trim();
    const hargaSewa = document.getElementById('inputHargaAlat').value;
    const stok = document.getElementById('inputStokAlat').value;
    const gambar = document.getElementById('inputGambarAlat').value.trim();
    const deskripsi = document.getElementById('inputDeskripsiAlat').value.trim();

    if (!namaAlat || !idKategori) {
        alert('Harap isi Nama Peralatan dan Pilih Kategori!');
        return;
    }

    const payload = {
        id_peralatan: idAlat,
        id_kategori: idKategori,
        nama_peralatan: namaAlat,
        harga_sewa: parseFloat(hargaSewa) || 0,
        stok: parseInt(stok) || 0,
        gambar: gambar,
        deskripsi: deskripsi
    };

    try {
        const res = await fetch('api/api_peralatan.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.status === 'success') {
            alert('Peralatan berhasil disimpan ke Database!');
            closeModalAlat();
            loadPeralatanFromDB();
        } else {
            alert('Gagal menyimpan peralatan: ' + (result.message || 'Error Server'));
        }
    } catch (err) {
        alert('Terjadi kesalahan jaringan.');
    }
}

async function hapusPeralatanAdmin(idAlat) {
    if (confirm('Yakin ingin menghapus peralatan ini dari Database?')) {
        try {
            const res = await fetch(`api/api_peralatan.php?id=${idAlat}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.status === 'success') {
                alert('Peralatan berhasil dihapus!');
                loadPeralatanFromDB();
            } else {
                alert('Gagal menghapus peralatan!');
            }
        } catch (err) {
            alert('Terjadi kesalahan jaringan.');
        }
    }
}

function renderCategoryOptionsAndTabs() {
    const tabContainer = document.getElementById('filterCategoryContainer');
    const selectSelect = document.getElementById('searchKategoriSelect');
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];

    if (tabContainer) {
        tabContainer.innerHTML = `
            <button onclick="setCategoryFilter('all')" 
                class="px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${currentCategoryFilter === 'all' ? 'bg-sicamp-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                Semua Alat
            </button>
        `;

        kategoris.forEach(k => {
            const isSelected = String(currentCategoryFilter) === String(k.id_kategori);
            tabContainer.innerHTML += `
                <button onclick="setCategoryFilter('${k.id_kategori}')" 
                    class="px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${isSelected ? 'bg-sicamp-700 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}">
                    ${k.nama_kategori}
                </button>
            `;
        });
    }

    if (selectSelect) {
        selectSelect.innerHTML = '<option value="all">Semua Kategori</option>';
        kategoris.forEach(k => {
            selectSelect.innerHTML += `<option value="${k.id_kategori}">${k.nama_kategori}</option>`;
        });
        selectSelect.value = currentCategoryFilter;
    }
}

function setCategoryFilter(catId) {
    currentCategoryFilter = catId;
    renderCategoryOptionsAndTabs();
    renderKatalog();
}

function renderKatalog() {
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;

    const items = JSON.parse(localStorage.getItem('peralatan')) || [];

    grid.innerHTML = '';
    const filtered = items.filter(item => {
        const matchCategory = (currentCategoryFilter === 'all') || (String(item.id_kategori) === String(currentCategoryFilter));
        const matchKeyword = !searchKeyword || item.nama_peralatan.toLowerCase().includes(searchKeyword);
        return matchCategory && matchKeyword;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200">
                <i class="fa-solid fa-box-open text-4xl text-slate-300 mb-3 block"></i>
                <p class="text-slate-500 text-xs font-medium">Belum ada peralatan yang sesuai dengan pencarian Anda.</p>
            </div>
        `;
        return;
    }

    filtered.forEach((item) => {
        const isStokAvailable = item.stok > 0;
        const stokBadge = isStokAvailable 
            ? `<span class="bg-sicamp-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">Stok: ${item.stok}</span>`
            : `<span class="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">Stok Habis</span>`;

        grid.innerHTML += `
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                <div class="relative h-48 overflow-hidden bg-slate-100">
                    <img src="${item.gambar || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80'}" alt="${item.nama_peralatan}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute top-3 right-3">${stokBadge}</div>
                </div>
                <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                        <h3 class="text-base font-bold text-slate-900 group-hover:text-sicamp-700 transition-colors line-clamp-1">${item.nama_peralatan}</h3>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">${item.deskripsi || 'Peralatan pendakian berkualitas tinggi, terawat, dan siap pakai.'}</p>
                    </div>
                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                            <span class="block text-[10px] font-semibold text-slate-400 uppercase">Harga Sewa</span>
                            <span class="text-base font-black text-slate-900">Rp ${parseInt(item.harga_sewa).toLocaleString('id-ID')}<span class="text-xs text-slate-400 font-normal">/hari</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadKategoriFromDB();
    loadPeralatanFromDB();
    renderUserNavigation();
});