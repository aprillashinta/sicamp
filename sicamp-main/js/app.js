let currentCheckoutStep = 1;

// 1. Fungsi Navigasi Pindah Tahap (1 -> 2 -> 3)
function setCheckoutStep(step) {
    const keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];

    // Validasi saat mau pindah dari Tahap 1 ke Tahap 2
    if (step === 2 && currentCheckoutStep === 1) {
        if (keranjang.length === 0) {
            alert('Keranjang sewa kamu masih kosong!');
            return;
        }
        const tglSewa = document.getElementById('checkoutTglSewa')?.value;
        const tglKembali = document.getElementById('checkoutTglKembali')?.value;
        if (!tglSewa || !tglKembali) {
            alert('Harap tentukan Tanggal Mulai Sewa dan Rencana Kembali!');
            return;
        }
    }

    // Validasi saat mau pindah dari Tahap 2 ke Tahap 3
    if (step === 3 && currentCheckoutStep === 2) {
        const nama = document.getElementById('checkoutNama')?.value.trim();
        const waPenyewa = document.getElementById('checkoutWA')?.value.trim();
        const kontakDarurat = document.getElementById('checkoutKontakDarurat')?.value.trim();
        const alamat = document.getElementById('checkoutAlamat')?.value.trim();
        const inputKTP = document.getElementById('checkoutKTP');

        if (!nama || !waPenyewa || !kontakDarurat || !alamat) {
            alert('Harap isi Nama, No. WA, No. HP Darurat, dan Alamat Lengkap!');
            return;
        }
        if (!inputKTP || inputKTP.files.length === 0) {
            alert('Harap unggah Foto KTP/KTM sebagai Jaminan Digital!');
            return;
        }
    }

    currentCheckoutStep = step;

    // Sembunyikan semua step, tampilkan yang aktif
    document.getElementById('checkoutStep1')?.classList.add('hidden');
    document.getElementById('checkoutStep2')?.classList.add('hidden');
    document.getElementById('checkoutStep3')?.classList.add('hidden');
    document.getElementById(`checkoutStep${step}`)?.classList.remove('hidden');

    // Update Header Text & Stepper Indicator
    updateStepperHeader(step);

    // Update Tombol Bawah
    renderStepButtons(step);
}

// 2. Update Tampilan Stepper Header Visual
function updateStepperHeader(step) {
    const subtitle = document.getElementById('stepSubtitle');
    const labels = {
        1: "Tahap 1 dari 3: Ringkasan Keranjang",
        2: "Tahap 2 dari 3: Isi Data Penyewa",
        3: "Tahap 3 dari 3: Pembayaran & Unggah Bukti"
    };
    if (subtitle) subtitle.innerText = labels[step];

    for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById(`stepIndicator${i}`);
        const badge = document.getElementById(`stepBadge${i}`);
        
        if (i === step) {
            indicator?.classList.remove('text-slate-400');
            indicator?.classList.add('text-sicamp-700');
            badge?.classList.remove('bg-slate-200', 'text-slate-600');
            badge?.classList.add('bg-sicamp-700', 'text-white');
        } else if (i < step) {
            indicator?.classList.remove('text-slate-400');
            indicator?.classList.add('text-sicamp-700');
            badge?.classList.remove('bg-slate-200', 'text-slate-600');
            badge?.classList.add('bg-sicamp-700', 'text-white');
        } else {
            indicator?.classList.remove('text-sicamp-700');
            indicator?.classList.add('text-slate-400');
            badge?.classList.remove('bg-sicamp-700', 'text-white');
            badge?.classList.add('bg-slate-200', 'text-slate-600');
        }
    }
}

// 3. Render Tombol Navigasi Bawah
function renderStepButtons(step) {
    const area = document.getElementById('stepButtonsArea');
    if (!area) return;

    if (step === 1) {
        area.innerHTML = `
            <button onclick="closeModalKeranjang()" class="w-1/3 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all">Batal</button>
            <button onclick="setCheckoutStep(2)" class="w-2/3 py-3 bg-sicamp-700 hover:bg-sicamp-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-sicamp-700/25 transition-all flex items-center justify-center gap-2">
                Lanjut ke Data Penyewa <i class="fa-solid fa-arrow-right"></i>
            </button>
        `;
    } else if (step === 2) {
        area.innerHTML = `
            <button onclick="setCheckoutStep(1)" class="w-1/3 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1">
                <i class="fa-solid fa-arrow-left"></i> Kembali
            </button>
            <button onclick="setCheckoutStep(3)" class="w-2/3 py-3 bg-sicamp-700 hover:bg-sicamp-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-sicamp-700/25 transition-all flex items-center justify-center gap-2">
                Lanjut ke Pembayaran <i class="fa-solid fa-arrow-right"></i>
            </button>
        `;
    } else if (step === 3) {
        area.innerHTML = `
            <button onclick="setCheckoutStep(2)" class="w-1/3 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1">
                <i class="fa-solid fa-arrow-left"></i> Kembali
            </button>
            <button onclick="prosesCheckoutSewa()" class="w-2/3 py-3 bg-sicamp-700 hover:bg-sicamp-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-sicamp-700/25 transition-all flex items-center justify-center gap-2">
                <i class="fa-solid fa-paper-plane"></i> Kirim Sewa Sekarang
            </button>
        `;
    }
}

// ==========================================
// LOGIKA KERANJANG & CHECKOUT SEWA
// ==========================================

// 1. Tambah Barang ke Keranjang
function tambahKeranjang(idPeralatan) {
    const session = JSON.parse(localStorage.getItem('session_user'));
    
    if (!session) {
        alert('Silakan login terlebih dahulu untuk menyewa!');
        window.location.href = 'login.html';
        return;
    }
    
    if (session.role === 'admin') {
        alert('Admin tidak dapat melakukan penyewaan.');
        return;
    }

    const peralatan = JSON.parse(localStorage.getItem('peralatan')) || [];
    const targetAlat = peralatan.find(p => String(p.id_peralatan) === String(idPeralatan));

    if (!targetAlat || targetAlat.stok <= 0) {
        alert('Maaf, stok peralatan ini sedang habis!');
        return;
    }

    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    const itemIndex = keranjang.findIndex(k => String(k.id_peralatan) === String(idPeralatan));

    if (itemIndex !== -1) {
        if (keranjang[itemIndex].qty + 1 > targetAlat.stok) {
            alert(`Jumlah melebihi sisa stok yang tersedia (${targetAlat.stok} unit)!`);
            return;
        }
        keranjang[itemIndex].qty += 1;
    } else {
        keranjang.push({
            id_peralatan: targetAlat.id_peralatan,
            nama_peralatan: targetAlat.nama_peralatan,
            harga_sewa: targetAlat.harga_sewa,
            gambar: targetAlat.gambar,
            qty: 1
        });
    }

    localStorage.setItem('keranjang', JSON.stringify(keranjang));
    updateCartBadge();
    alert(`"${targetAlat.nama_peralatan}" berhasil ditambahkan ke keranjang!`);
}

// 2. Update Jumlah Badge Keranjang di Navbar
function updateCartBadge() {
    const badge = document.getElementById('cartBadgeCount');
    const keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    const totalQty = keranjang.reduce((sum, item) => sum + item.qty, 0);

    if (badge) {
        badge.innerText = totalQty;
        // Hapus kelas 'hidden' agar angka 0 tetap kelihatan sejak awal
        badge.classList.remove('hidden'); 
    }
}

// Fungsi Menghitung Durasi Hari & Total Harga Sewa Otomatis
function hitungkanTotalCheckout() {
    const tglSewaInput = document.getElementById('checkoutTglSewa');
    const tglKembaliInput = document.getElementById('checkoutTglKembali');
    const rincianDurasi = document.getElementById('checkoutRincianDurasi');
    const totalElement = document.getElementById('cartTotalHarga');

    const keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    const totalHargaPerHari = keranjang.reduce((sum, item) => sum + (item.harga_sewa * item.qty), 0);

    let durasiHari = 1;

    if (tglSewaInput && tglKembaliInput && tglSewaInput.value && tglKembaliInput.value) {
        const d1 = new Date(tglSewaInput.value);
        const d2 = new Date(tglKembaliInput.value);

        // Normalisasi waktu ke jam 00:00:00 agar hitungan hari akurat
        d1.setHours(0, 0, 0, 0);
        d2.setHours(0, 0, 0, 0);

        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        durasiHari = diffDays > 0 ? diffDays : 1;
    }

    // Update Teks Durasi di Modal
    if (rincianDurasi) {
        rincianDurasi.innerText = `${durasiHari} Hari`;
    }

    // Update Total Harga (Harga per Hari x Jumlah Hari)
    const grandTotal = totalHargaPerHari * durasiHari;
    if (totalElement) {
        totalElement.innerText = `Rp ${grandTotal.toLocaleString('id-ID')}`;
    }

    return { durasiHari, grandTotal };
}

/// 3. Render Modal Keranjang
function openModalKeranjang() {
    const modal = document.getElementById('modalKeranjang');
    const container = document.getElementById('cartItemsContainer');
    const totalElement = document.getElementById('cartTotalHarga');
    const keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];

    if (!modal) return;

    // 1. Set default tanggal jika belum terisi (Hari ini & Besok)
    const tglSewaInput = document.getElementById('checkoutTglSewa');
    const tglKembaliInput = document.getElementById('checkoutTglKembali');
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    if (tglSewaInput && !tglSewaInput.value) tglSewaInput.value = today;
    if (tglKembaliInput && !tglKembaliInput.value) tglKembaliInput.value = tomorrow;

    // 2. Render item di keranjang
    if (container) {
        container.innerHTML = '';

        if (keranjang.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-slate-400">
                    <i class="fa-solid fa-cart-flatbed text-3xl mb-2 block"></i>
                    Keranjang sewa Anda masih kosong.
                </div>
            `;
            if (totalElement) totalElement.innerText = 'Rp 0';
        } else {
            keranjang.forEach((item, idx) => {
                container.innerHTML += `
                    <div class="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <img src="${item.gambar || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80'}" class="w-12 h-12 object-cover rounded-xl shrink-0">
                        <div class="flex-grow min-w-0">
                            <h4 class="text-xs font-bold text-slate-900 truncate">${item.nama_peralatan}</h4>
                            <span class="text-[11px] font-semibold text-sicamp-700">Rp ${item.harga_sewa.toLocaleString('id-ID')} / hari</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                            <button onclick="ubahQtyKeranjang(${idx}, -1)" class="w-6 h-6 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100">-</button>
                            <span class="text-xs font-bold w-4 text-center">${item.qty}</span>
                            <button onclick="ubahQtyKeranjang(${idx}, 1)" class="w-6 h-6 bg-white border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100">+</button>
                            <button onclick="hapusItemKeranjang(${idx})" class="w-6 h-6 text-rose-500 hover:text-rose-700 ml-1 text-xs">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }
    }

    // 3. PANGGIL DI SINI: hitung durasi hari & grand total otomatis
    hitungkanTotalCheckout();
    setCheckoutStep(1);

    // 4. Tampilkan Modal
    modal.classList.remove('hidden');
}

function closeModalKeranjang() {
    const modal = document.getElementById('modalKeranjang');
    if (modal) modal.classList.add('hidden');
}

function ubahQtyKeranjang(index, change) {
    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    if (keranjang[index]) {
        keranjang[index].qty += change;
        if (keranjang[index].qty <= 0) {
            keranjang.splice(index, 1);
        }
        localStorage.setItem('keranjang', JSON.stringify(keranjang));
        openModalKeranjang();
        updateCartBadge();
    }
}

function hapusItemKeranjang(index) {
    let keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];
    keranjang.splice(index, 1);
    localStorage.setItem('keranjang', JSON.stringify(keranjang));
    openModalKeranjang();
    updateCartBadge();
}

// 4. Proses Checkout (Masuk ke Riwayat Transaksi)
function prosesCheckoutSewa() {
    const session = JSON.parse(localStorage.getItem('session_user'));
    const keranjang = JSON.parse(localStorage.getItem('keranjang')) || [];

    if (!session) {
        alert('Silakan login terlebih dahulu untuk menyewa!');
        window.location.href = 'login.html';
        return;
    }

    if (keranjang.length === 0) {
        alert('Keranjang sewa masih kosong! Pilih alat di katalog terlebih dahulu.');
        return;
    }

    // Ambil Input Form
    const nama = document.getElementById('checkoutNama')?.value.trim();
    const waPenyewa = document.getElementById('checkoutWA')?.value.trim();
    const kontakDarurat = document.getElementById('checkoutKontakDarurat')?.value.trim();
    const alamat = document.getElementById('checkoutAlamat')?.value.trim(); // <-- BARU
    const tglSewa = document.getElementById('checkoutTglSewa')?.value;
    const tglKembali = document.getElementById('checkoutTglKembali')?.value;
    const inputKTP = document.getElementById('checkoutKTP');
    const inputBukti = document.getElementById('checkoutBukti');

    // Validasi Wajib Isi
    if (!nama || !waPenyewa || !kontakDarurat || !alamat) {
        alert('Harap isi Nama Lengkap, No. WhatsApp, Kontak Darurat, dan Alamat Lengkap!');
        return;
    }

    if (!tglSewa || !tglKembali) {
        alert('Harap pilih Tanggal Sewa dan Rencana Kembali!');
        return;
    }

    if (!inputKTP || inputKTP.files.length === 0) {
        alert('Harap unggah Foto KTP/KTM sebagai Jaminan Digital!');
        return;
    }

    // Hitung Total Pembayaran
    const { durasiHari, grandTotal } = hitungkanTotalCheckout();

    // Tentukan Status Awal
    const hasBukti = inputBukti && inputBukti.files.length > 0;
    const statusAwal = hasBukti ? 'Menunggu Verifikasi' : 'Menunggu Pembayaran';

    const newTransaksi = {
        id_penyewaan: Date.now(),
        kode_transaksi: 'TRX-' + String(Date.now()).slice(-6),
        nama_pelanggan: nama,
        no_wa: waPenyewa,
        kontak_darurat: kontakDarurat,
        alamat: alamat, // <-- DITERUSKAN KE DATA TRANSAKSI
        total_harga: grandTotal,
        durasi_hari: durasiHari,
        tgl_sewa: tglSewa,
        tgl_kembali_rencana: tglKembali,
        status: statusAwal,
        detail_items: keranjang,
        ktp_terupload: inputKTP.files[0].name,
        bukti: hasBukti ? inputBukti.files[0].name : null
    };

    let penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    penyewaan.unshift(newTransaksi);
    localStorage.setItem('penyewaan', JSON.stringify(penyewaan));

    // Reset Keranjang & Tutup Modal
    localStorage.removeItem('keranjang');
    updateCartBadge();
    closeModalKeranjang();

    alert('Sewa Berhasil Diajukan! Status pesanan dapat dipantau di halaman Riwayat Penyewaan.');
    window.location.href = 'riwayat-sewa.html';
}

// ==========================================
// 1. DATABASE INITIALIZATION & SEEDING
// ==========================================
function initDatabase() {
    // 1. Setup 5 Kategori Peralatan Standar SiCamp
    if (!localStorage.getItem('kategori_peralatan')) {
        const defaultKategori = [
            { id_kategori: '1', nama_kategori: 'Tenda & Shelter' },
            { id_kategori: '2', nama_kategori: 'Carrier & Tas' },
            { id_kategori: '3', nama_kategori: 'Alat Masak & Makan' },
            { id_kategori: '4', nama_kategori: 'Tidur & Matras' },
            { id_kategori: '5', nama_kategori: 'Aksesori & Penerangan' }
        ];
        localStorage.setItem('kategori_peralatan', JSON.stringify(defaultKategori));
    }

    // 2. Setup Peralatan Standar SiCamp
    if (!localStorage.getItem('peralatan')) {
        const defaultPeralatan = [
            {
                id_peralatan: '1',
                id_kategori: '1',
                nama_peralatan: 'Tenda Dome 4P',
                harga_sewa: 50000,
                stok: 5,
                kondisi: 'Bagus',
                status: 'Aktif',
                deskripsi: 'Tenda waterproof double layer muat hingga 4 orang.',
                gambar: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80'
            },
            {
                id_peralatan: '2',
                id_kategori: '2',
                nama_peralatan: 'Carrier Eiger 60L',
                harga_sewa: 35000,
                stok: 8,
                kondisi: 'Bagus',
                status: 'Aktif',
                deskripsi: 'Tas gunung ergonomis nyaman untuk pendakian jauh.',
                gambar: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=600&q=80'
            },
            {
                id_peralatan: '3',
                id_kategori: '4',
                nama_peralatan: 'Sleeping Bag Dacron',
                harga_sewa: 15000,
                stok: 12,
                kondisi: 'Bagus',
                status: 'Aktif',
                deskripsi: 'Sleeping bag hangat menjaga suhu tubuh malam hari.',
                gambar: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=600&q=80'
            }
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
                tgl_sewa: '2026-10-01',
                tgl_kembali_rencana: '2026-10-05',
                status: 'Menunggu Pembayaran',
                bukti: null
            }
        ];
        localStorage.setItem('penyewaan', JSON.stringify(defaultSewa));
    }
}

function initDefaultData() {
    initDatabase();
}

// ==========================================
// 2. NAVIGASI USER (TOPBAR) & ADMIN (SIDEBAR)
// ==========================================
function renderUserNavigation() {
    const navPelanggan = document.getElementById('navPelanggan');
    const userIndicator = document.getElementById('userIndicator');
    const sidebarMenu = document.getElementById('sidebarMenu');
    const userInfo = document.getElementById('userInfo');

    const session = JSON.parse(localStorage.getItem('session_user'));
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    // Topbar User / Tamu / Admin
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
                    <button onclick="logout()" class="px-3.5 py-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-full border border-rose-200 transition-all">Logout</button>
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

    // Sidebar Khusus Admin
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
                    <a href="${item.url}" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs transition-all no-underline ${activeClass}">
                        <i class="fa-solid ${item.icon} text-sm"></i>
                        <span>${item.name}</span>
                    </a>
                </li>
            `;
        });

        sidebarMenu.innerHTML += `
            <li class="pt-4 mt-2 border-t border-slate-800">
                <a href="#" onclick="logout()" class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-semibold no-underline">
                    <i class="fa-solid fa-right-from-bracket text-sm"></i>
                    <span>Logout</span>
                </a>
            </li>
        `;

        if (userInfo) {
            userInfo.innerHTML = `User: <strong class="text-white">${session.nama}</strong><br>Role: <strong class="text-amber-500 uppercase">ADMIN</strong>`;
        }
    }
}

function logout() {
    localStorage.removeItem('session_user');
    alert('Anda telah logout.');
    window.location.href = 'index.html';
}

// ==========================================
// 3. KATALOG & FILTERING PERALATAN
// ==========================================
let currentCategoryFilter = 'all';
let searchKeyword = '';

function renderCategoryOptionsAndTabs() {
    const tabContainer = document.getElementById('filterCategoryContainer');
    const selectSelect = document.getElementById('searchKategoriSelect');
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];

    // Render Tombol Pill Filter
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

    // Render Dropdown Search (jika ada)
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

function searchKeywordHandler() {
    const input = document.getElementById('searchInput');
    searchKeyword = input ? input.value.toLowerCase().trim() : '';
    renderKatalog();
}

function renderKatalog() {
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;

    const items = JSON.parse(localStorage.getItem('peralatan')) || [];
    const kategoris = JSON.parse(localStorage.getItem('kategori_peralatan')) || [];

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
        const kat = kategoris.find(k => String(k.id_kategori) === String(item.id_kategori));

        grid.innerHTML += `
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group">
                <div class="relative h-48 overflow-hidden bg-slate-100">
                    <img src="${item.gambar || 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80'}" alt="${item.nama_peralatan}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute top-3 left-3">
                        <span class="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">
                            ${kat ? kat.nama_kategori : 'Umum'}
                        </span>
                    </div>
                    <div class="absolute top-3 right-3">
                        <span class="bg-sicamp-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                            Stok: ${item.stok}
                        </span>
                    </div>
                </div>

                <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                        <h3 class="text-base font-bold text-slate-900 group-hover:text-sicamp-700 transition-colors line-clamp-1">
                            ${item.nama_peralatan}
                        </h3>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            ${item.deskripsi || 'Peralatan pendakian berkualitas tinggi, terawat, dan siap pakai.'}
                        </p>
                    </div>

                    <div class="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                            <span class="block text-[10px] font-semibold text-slate-400 uppercase">Harga Sewa</span>
                            <span class="text-base font-black text-slate-900">
                                Rp ${parseInt(item.harga_sewa).toLocaleString('id-ID')}
                                <span class="text-xs text-slate-400 font-normal">/hari</span>
                            </span>
                        </div>
                        <button onclick="tambahKeranjang('${item.id_peralatan}')" class="px-4 py-2 bg-sicamp-700 hover:bg-sicamp-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5">
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

// ==========================================
// 4. MANAGEMENT ADMIN (KATEGORI, ALAT, TRANSAKSI)
// ==========================================
function renderTabelKategoriAdmin() {
    const tbody = document.querySelector('#tblKategoriAdmin tbody') || document.querySelector('#tblKategori tbody');
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
                    <button onclick="hapusKategoriAdmin(${idx})" class="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs transition-all flex items-center gap-1 mx-auto">
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

    if (!nama) return;

    try {
        // Kirim data ke PHP MySQL
        const response = await fetch('api_kategori.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nama_kategori: nama })
        });
        
        const result = await response.json();
        if (result.status === 'success') {
            alert('Kategori berhasil ditambahkan ke Database MySQL!');
            closeModalKategori();
            loadKategoriFromDB(); // Tarik data terbaru dari MySQL
        } else {
            alert('Gagal menyimpan kategori ke Database.');
        }
    } catch (error) {
        console.error("Error:", error);
        alert('Terjadi kesalahan koneksi ke server PHP.');
    }
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

function renderPelangganAdmin() {
    const tbody = document.querySelector('#tblPelangganMaster tbody');
    if (!tbody) return;
    const pelanggan = JSON.parse(localStorage.getItem('pelanggan')) || [];
    tbody.innerHTML = '';

    if (pelanggan.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="py-6 text-center text-slate-400">Belum ada data pelanggan terdaftar.</td></tr>';
        return;
    }

    pelanggan.forEach((p, idx) => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-4 font-bold">${p.id_pelanggan}</td>
                <td class="py-3 px-4"><strong>${p.nama_pelanggan || p.nama}</strong></td>
                <td class="py-3 px-4">${p.email}</td>
                <td class="py-3 px-4 text-center">
                    <button class="px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-200" onclick="hapusPelanggan(${idx})">Hapus</button>
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
    const container = document.getElementById('riwayatListContainer');
    if (!container) return;

    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    container.innerHTML = '';

    if (penyewaan.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 shadow-sm">
                <i class="fa-solid fa-bag-shopping text-4xl mb-3 block text-slate-300"></i>
                <p class="font-bold text-slate-700 text-sm">Belum Ada Transaksi</p>
                <p class="text-xs text-slate-400 mt-1">Kamu belum pernah melakukan penyewaan alat kemping.</p>
                <a href="index.html#katalog" class="inline-block mt-4 px-5 py-2.5 bg-sicamp-700 text-white font-bold text-xs rounded-xl shadow-md no-underline">Mulai Sewa Alat</a>
            </div>
        `;
        return;
    }

    penyewaan.forEach((p, idx) => {
        // Status Badge Style
        let statusClass = "bg-amber-50 text-amber-700 border-amber-200";
        let statusIcon = "fa-clock";
        if (p.status === 'Menunggu Verifikasi') {
            statusClass = "bg-blue-50 text-blue-700 border-blue-200";
            statusIcon = "fa-spinner fa-spin";
        } else if (p.status === 'Disetujui' || p.status === 'Selesai') {
            statusClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
            statusIcon = "fa-circle-check";
        } else if (p.status === 'Dibatalkan' || p.status === 'Ditolak') {
            statusClass = "bg-rose-50 text-rose-700 border-rose-200";
            statusIcon = "fa-circle-xmark";
        }

        // Info Produk yang Disewa
        const itemsCount = p.detail_items ? p.detail_items.length : 1;
        const sampleItemName = (p.detail_items && p.detail_items[0]) ? p.detail_items[0].nama_peralatan : 'Peralatan Camping';
        const sampleImg = (p.detail_items && p.detail_items[0] && p.detail_items[0].gambar) 
            ? p.detail_items[0].gambar 
            : 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=300&q=80';

        // Tombol Aksi
        let actionBtn = '';
        if (p.status === 'Menunggu Pembayaran') {
            actionBtn = `
                <button onclick="uploadBuktiSimulasi(${idx})" class="px-4 py-2 bg-sicamp-700 hover:bg-sicamp-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5">
                    <i class="fa-solid fa-upload"></i> Unggah Bukti Transfer
                </button>
            `;
        } else {
            actionBtn = `
                <span class="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    <i class="fa-solid fa-circle-info"></i> Diproses Admin
                </span>
            `;
        }

        // Render Card ala Shopee
        container.innerHTML += `
            <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <!-- Card Header -->
                <div class="p-4 sm:px-6 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-3">
                        <span class="text-xs font-extrabold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                            ${p.kode_transaksi}
                        </span>
                        <span class="text-[11px] font-medium text-slate-400">
                            <i class="fa-regular fa-calendar mr-1"></i> Sewa: ${p.tgl_sewa || '-'} s/d ${p.tgl_kembali_rencana || '-'}
                        </span>
                    </div>
                    <span class="text-[11px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${statusClass}">
                        <i class="fa-solid ${statusIcon}"></i> ${p.status}
                    </span>
                </div>

                <!-- Card Body -->
                <div class="p-4 sm:p-6 flex items-center gap-4">
                    <img src="${sampleImg}" alt="Item" class="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-100 shrink-0">
                    <div class="flex-grow min-w-0">
                        <h4 class="text-sm font-bold text-slate-900 truncate">${sampleItemName}</h4>
                        <p class="text-xs text-slate-400 mt-1">
                            ${itemsCount > 1 ? `+${itemsCount - 1} peralatan kemping lainnya` : '1 Item Perlengkapan'}
                        </p>
                        <span class="inline-block mt-2 text-[11px] font-semibold text-sicamp-700 bg-sicamp-50 px-2 py-0.5 rounded-md border border-sicamp-200">
                            Durasi Sewa Terjadwal
                        </span>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Biaya</span>
                        <span class="text-base sm:text-lg font-black text-slate-900">
                            Rp ${(p.total_harga || 0).toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                <!-- Card Footer -->
                <div class="px-4 sm:px-6 py-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-4">
                    <span class="text-[11px] text-slate-500 font-medium hidden sm:inline">
                        Silakan unggah bukti transfer sebelum batas waktu sewa.
                    </span>
                    <div class="ml-auto">${actionBtn}</div>
                </div>
            </div>
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

    const pending = penyewaan.filter(p => p.status === 'Menunggu Verifikasi' || p.status === 'Menunggu Pembayaran');

    if (pending.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-slate-400">Tidak ada pembayaran yang membutuhkan verifikasi.</td></tr>`;
        return;
    }

    penyewaan.forEach((p, idx) => {
        if (p.status === 'Menunggu Verifikasi' || p.status === 'Menunggu Pembayaran') {
            tbody.innerHTML += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-4 px-6 font-bold text-slate-900">${p.kode_transaksi}</td>
                    <td class="py-4 px-6">${p.nama_pelanggan}</td>
                    <td class="py-4 px-6 font-bold text-sicamp-700">Rp ${parseInt(p.total_harga).toLocaleString('id-ID')}</td>
                    <td class="py-4 px-6"><span class="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-full">${p.status}</span></td>
                    <td class="py-4 px-6 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button class="px-3.5 py-1.5 bg-sicamp-700 hover:bg-sicamp-800 text-white font-bold text-[11px] rounded-xl shadow-sm transition-all flex items-center gap-1" onclick="verifikasiSewa(${idx}, 'Disetujui')">
                                <i class="fa-solid fa-check"></i> Setujui
                            </button>
                            <button class="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 font-bold text-[11px] rounded-xl border border-rose-200 transition-all flex items-center gap-1" onclick="verifikasiSewa(${idx}, 'Dibatalkan')">
                                <i class="fa-solid fa-xmark"></i> Tolak
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    });
}

function verifikasiSewa(index, statusBaru) {
    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    penyewaan[index].status = statusBaru;
    localStorage.setItem('penyewaan', JSON.stringify(penyewaan));
    alert(`Status transaksi diubah menjadi: ${statusBaru}`);
    renderVerifikasiAdmin();
}

function renderPengembalianAdmin() {
    const tbody = document.querySelector('#tblPengembalian tbody');
    if (!tbody) return;

    const penyewaan = JSON.parse(localStorage.getItem('penyewaan')) || [];
    tbody.innerHTML = '';

    const aktif = penyewaan.filter(p => p.status === 'Disetujui' || p.status === 'Sedang Disewa');

    if (aktif.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400">Tidak ada pengembalian aktif.</td></tr>`;
        return;
    }

    penyewaan.forEach((p, idx) => {
        if (p.status === 'Disetujui' || p.status === 'Sedang Disewa') {
            tbody.innerHTML += `
                <tr class="hover:bg-slate-50 transition-colors">
                    <td class="py-4 px-6 font-bold">${p.kode_transaksi}</td>
                    <td class="py-4 px-6">${p.nama_pelanggan}</td>
                    <td class="py-4 px-6">${p.tgl_kembali_rencana}</td>
                    <td class="py-4 px-6 text-center">
                        <button class="px-3 py-1.5 bg-sicamp-700 text-white font-bold text-xs rounded-xl" onclick="prosesPengembalian(${idx})">Proses Kembali</button>
                    </td>
                </tr>
            `;
        }
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

// Tambahkan fungsi ini tepat di atas DOMContentLoaded
async function loadKategoriFromDB() {
    try {
        const response = await fetch('api_kategori.php');
        const kategoris = await response.json();
        
        // Simpan data dari MySQL ke LocalStorage sebagai cache UI
        localStorage.setItem('kategori_peralatan', JSON.stringify(kategoris));
        
        renderCategoryOptionsAndTabs();
        renderTabelKategoriAdmin();
    } catch (error) {
        console.error("Gagal mengambil data dari MySQL:", error);
    }
}

// ==========================================
// 5. EVENT LISTENERS & INITIAL LOAD
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initDatabase();
    loadKategoriFromDB();
    renderUserNavigation();
    renderCategoryOptionsAndTabs();
    updateCartBadge();

    // Login Form
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
                    nama: user.nama_pelanggan || user.nama, 
                    email: user.email,
                    role: 'pelanggan' 
                }));
                alert(`Selamat Datang, ${user.nama_pelanggan || user.nama}!`);
                window.location.href = 'index.html';
            } else {
                alert('Username/Email atau Password salah!');
            }
        });
    }

    // Register Form
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

    // Render Elemen Spesifik Halaman
    if (document.getElementById('equipmentGrid')) renderKatalog();
    if (document.getElementById('tblKategoriAdmin') || document.getElementById('tblKategori')) renderTabelKategoriAdmin();
    if (document.getElementById('riwayatListContainer') || document.getElementById('tblRiwayat')) renderRiwayatPelanggan();
    if (document.getElementById('tblVerifikasi')) renderVerifikasiAdmin();
    if (document.getElementById('tblPengembalian')) renderPengembalianAdmin();
    if (document.getElementById('statCards')) renderDashboardStats();
});

// Storage Sync Inter-Tab
window.addEventListener('storage', (e) => {
    if (e.key === 'kategori_peralatan' || e.key === 'peralatan') {
        renderCategoryOptionsAndTabs();
        if (document.getElementById('equipmentGrid')) renderKatalog();
    }
});

window.addEventListener('focus', () => {
    renderCategoryOptionsAndTabs();
    if (document.getElementById('equipmentGrid')) renderKatalog();
});