(() => {
    'use strict';

    const API = {
        kategori: 'api/api_kategori.php',
        peralatan: 'api/api_peralatan.php'
    };

    const CART_KEY = 'keranjang';
    const CART_KEY_ALT = 'sicamp_keranjang';

    const state = {
        kategori: [],
        peralatan: [],
        kategoriAktif: 'all',
        kataKunci: []
    };

    let currentCheckoutStep = 1;

    const FALLBACK_IMAGE =
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80';

    function el(id) {
        return document.getElementById(id);
    }

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }

    function rupiah(value) {
        return 'Rp' + (Number(value) || 0).toLocaleString('id-ID');
    }

    function firstValue(object, keys, fallback = '') {
        for (const key of keys) {
            if (
                object &&
                object[key] !== undefined &&
                object[key] !== null &&
                object[key] !== ''
            ) {
                return object[key];
            }
        }
        return fallback;
    }

    function normalizeResponse(response) {
        if (Array.isArray(response)) return response;
        if (!response || typeof response !== 'object') return [];

        for (const key of [
            'data',
            'result',
            'kategori',
            'peralatan',
            'items',
            'results',
            'records'
        ]) {
            if (Array.isArray(response[key])) {
                return response[key];
            }
        }

        for (const key of ['data', 'result']) {
            if (response[key] && typeof response[key] === 'object') {
                const nested = normalizeResponse(response[key]);
                if (nested.length) return nested;
            }
        }

        return [];
    }

    async function requestAPI(url) {
        const response = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        });

        const text = await response.text();
        let result;

        try {
            result = JSON.parse(text);
        } catch {
            throw new Error('Respons API bukan JSON yang valid.');
        }

        if (!response.ok || result.success === false || result.status === 'error') {
            throw new Error(result.message || 'Gagal mengambil data API.');
        }

        return normalizeResponse(result);
    }

    function idKategori(item) {
        return String(firstValue(item, ['id_kategori', 'kategori_id', 'idKategori'], ''));
    }

    function namaKategori(item) {
        return String(firstValue(item, ['nama_kategori', 'kategori', 'namaKategori'], 'Peralatan Outdoor'));
    }

    function idPeralatan(item) {
        return String(firstValue(item, ['id_peralatan', 'id_alat', 'peralatan_id', 'id'], ''));
    }

    function namaPeralatan(item) {
        return String(firstValue(item, ['nama_peralatan', 'nama_alat', 'nama', 'nama_barang'], 'Peralatan Camping'));
    }

    function deskripsiPeralatan(item) {
        return String(firstValue(item, ['deskripsi', 'keterangan', 'detail'], 'Peralatan outdoor untuk kegiatan camping.'));
    }

    function hargaPeralatan(item) {
        return Number(firstValue(item, ['harga_sewa', 'harga', 'harga_per_hari'], 0)) || 0;
    }

    function stokPeralatan(item) {
        return Math.max(0, Number(firstValue(item, ['stok', 'jumlah_stok', 'stock'], 0)) || 0);
    }

    function statusAktif(item) {
        const status = String(firstValue(item, ['status'], 'Aktif')).trim().toLowerCase();
        return !['tidak aktif', 'nonaktif', 'non-aktif', 'inactive', '0', 'false', 'deleted'].includes(status);
    }

    function gambarPeralatan(item) {
        return String(firstValue(item, ['gambar', 'foto', 'image', 'foto_peralatan', 'gambar_peralatan'], '')).trim() || FALLBACK_IMAGE;
    }

    function kategoriPeralatan(item) {
        const nama = firstValue(item, ['nama_kategori', 'kategori', 'kategori_peralatan'], '');
        if (nama) {
            return typeof nama === 'object' ? namaKategori(nama) : String(nama);
        }
        const id = idKategori(item);
        const kategori = state.kategori.find(itemKategori => idKategori(itemKategori) === id);
        return kategori ? namaKategori(kategori) : 'Peralatan Outdoor';
    }

    function gridKatalog() {
        return el('equipmentGrid') || el('katalogPeralatan') || el('productGrid');
    }

    function containerKategori() {
        return el('filterCategoryContainer') || el('categoryContainer') || el('kategoriContainer');
    }

    function notifikasi(pesan, jenis = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(pesan, jenis);
            return;
        }

        let toast = el('homeToast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'homeToast';
            toast.className = 'fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl';
            document.body.appendChild(toast);
        }

        toast.textContent = pesan;
        toast.style.backgroundColor = jenis === 'error' ? '#e11d48' : jenis === 'success' ? '#15803d' : '#334155';
        toast.style.display = 'block';

        clearTimeout(toast._timeout);
        toast._timeout = setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    function tampilkanPesanKatalog(pesan, error = false) {
        const grid = gridKatalog();
        if (!grid) return;

        grid.innerHTML = `
            <div class="col-span-full py-12 text-center">
                <p class="${error ? 'text-rose-600' : 'text-slate-500'} text-sm font-semibold">
                    ${escapeHTML(pesan)}
                </p>
            </div>
        `;
    }


    // ======================================
    // LOGIKA NAVBAR STATUS LOGIN PELANGGAN
    // ======================================
    function renderNavAuth() {
        const navAuthContainer = document.getElementById('navAuthContainer');
        const navHistoryContainer = document.getElementById('navHistoryContainer');

        if (!navAuthContainer) {
            console.error('Elemen navAuthContainer tidak ditemukan.');
            return;
        }

        // Cari sesi login dari penyimpanan yang umum digunakan.
        const sessionKeys = [
            'session_user',
            'user',
            'userData',
            'currentUser',
            'pengguna',
            'pelanggan'
        ];

        let user = null;

        for (const key of sessionKeys) {
            for (const storage of [localStorage, sessionStorage]) {
                const raw = storage.getItem(key);
                if (!raw) continue;

                try {
                    let parsed = JSON.parse(raw);

                    if (parsed && typeof parsed === 'object') {
                        if (parsed.user && typeof parsed.user === 'object') {
                            parsed = parsed.user;
                        } else if (parsed.data && typeof parsed.data === 'object') {
                            parsed = parsed.data;
                        }

                        const namaPengguna =
                            parsed.nama ||
                            parsed.nama_pelanggan ||
                            parsed.nama_admin ||
                            parsed.name ||
                            parsed.username;

                        if (namaPengguna) {
                            user = { ...parsed, nama: namaPengguna };
                            break;
                        }
                    }
                } catch (error) {
                    console.warn('Data sesi bukan JSON untuk key:', key);
                }
            }

            if (user) break;
        }

        // Jika tidak ada sesi yang valid, tampilkan tombol autentikasi.
        const mobileHistoryLink = document.getElementById('mobileHistoryLink');

        if (!user) {
            if (navHistoryContainer) {
                navHistoryContainer.innerHTML = '';
            }
            if (mobileHistoryLink) mobileHistoryLink.style.display = 'none';

            navAuthContainer.innerHTML = `
                <a href="login.html" class="sc-auth-button">Masuk</a>
                <a href="register.html" class="sc-auth-button">Daftar</a>
            `;
            return;
        }

        // Tampilkan navigasi untuk pengguna yang sudah login.
        if (mobileHistoryLink) mobileHistoryLink.style.display = 'flex';
        if (navHistoryContainer) {
            navHistoryContainer.innerHTML = `
                <a
                    href="#riwayat-pesanan"
                    data-sicamp-view="history"
                    class="text-xs font-bold text-slate-700 hover:text-sicamp-700 transition whitespace-nowrap"
                >
                    Riwayat Pesanan
                </a>
            `;
        }

        navAuthContainer.innerHTML = `
            <span class="text-xs font-extrabold text-slate-800 whitespace-nowrap">
                Halo, ${escapeHTML(user.nama)}
            </span>
            <button type="button" id="btnLogout" class="sc-btn-logout">
                Logout
            </button>
        `;

        document.getElementById('btnLogout').addEventListener('click', function () {
            for (const storage of [localStorage, sessionStorage]) {
                for (const key of sessionKeys) {
                    storage.removeItem(key);
                }
                storage.removeItem('token');
            }

            window.location.href = 'index.html';
        });
    }

function getSesiPelanggan() {
    const sessionKeys = [
        'session_user',
        'user',
        'userData',
        'currentUser',
        'pengguna',
        'pelanggan'
    ];

    for (const storage of [localStorage, sessionStorage]) {
        for (const key of sessionKeys) {
            const raw = storage.getItem(key);
            if (!raw) continue;

            try {
                let user = JSON.parse(raw);

                if (!user || typeof user !== 'object') continue;

                if (user.user && typeof user.user === 'object') {
                    user = user.user;
                } else if (user.data && typeof user.data === 'object') {
                    user = user.data;
                }

                const role = String(
                    user.role ??
                    user.rolename ??
                    user.peran ??
                    user.jenis_user ??
                    user.tipe_user ??
                    user.level ??
                    ''
                ).trim().toLowerCase();

                // Tolak akun admin.
                if (
                    role.includes('admin') ||
                    user.is_admin === true ||
                    user.isAdmin === true
                ) {
                    continue;
                }

                // Prioritaskan ID pelanggan untuk memisahkan keranjang.
                const idPelanggan =
                    user.id_pelanggan ??
                    user.pelanggan_id ??
                    user.id_customer;

                const idUser =
                    user.id_user ??
                    user.user_id ??
                    user.id ??
                    user.uid;

                const identitas = idPelanggan ?? idUser ??
                    user.username ?? user.email;

                const nama =
                    user.nama_pelanggan ??
                    user.nama ??
                    user.name ??
                    user.username;

                if (!identitas || !nama) continue;

                // Jika peran tersedia, pastikan bukan peran yang tidak dikenal.
                if (
                    role &&
                    !role.includes('pelanggan') &&
                    !role.includes('customer') &&
                    !role.includes('user')
                ) {
                    continue;
                }

                return {
                    id: String(identitas),
                    user
                };
            } catch (error) {
                console.warn('Gagal membaca sesi:', key, error);
            }
        }
    }

    return null;
}

function kunciKeranjangAktif() {
    const sesi = getSesiPelanggan();

    if (!sesi) return null;

    return 'sicamp_keranjang_pelanggan_' +
        encodeURIComponent(sesi.id);
}

function pastikanLoginPelanggan() {
    if (getSesiPelanggan()) return true;

    notifikasi(
        'Silakan login sebagai pelanggan untuk menggunakan keranjang.',
        'error'
    );

    return false;
}

function bacaKeranjang() {
    const cartKey = kunciKeranjangAktif();

    // Pengunjung dan admin tidak dapat membaca keranjang pelanggan.
    if (!cartKey) return [];

    try {
        const raw = localStorage.getItem(cartKey);

        if (!raw) return [];

        const data = JSON.parse(raw);

        if (!Array.isArray(data)) return [];

        return data
            .filter(item => item && typeof item === 'object')
            .map(item => {
                const qty = Math.max(
                    1,
                    Number(
                        item.qty ??
                        item.jumlah ??
                        item.quantity ??
                        1
                    ) || 1
                );

                return {
                    ...item,
                    id_peralatan: String(
                        item.id_peralatan ??
                        item.id_alat ??
                        item.id ??
                        ''
                    ),
                    nama_peralatan:
                        item.nama_peralatan ??
                        item.nama_alat ??
                        item.nama ??
                        'Peralatan',
                    harga_sewa: Number(
                        item.harga_sewa ??
                        item.harga ??
                        0
                    ) || 0,
                    qty,
                    jumlah: qty,
                    stok: Number(
                        item.stok ??
                        item.jumlah_stok ??
                        item.stock ??
                        0
                    ) || 0
                };
            });
    } catch (error) {
        console.warn('Gagal membaca keranjang:', error);
        return [];
    }
}

function simpanKeranjang(data) {
    const cartKey = kunciKeranjangAktif();

    // Jangan menulis data ke keranjang global.
    if (!cartKey) {
        updateCartBadge();
        renderKeranjang();
        return;
    }

    const keranjang = data.map(item => {
        const qty = Math.max(
            1,
            Number(item.qty ?? item.jumlah ?? 1) || 1
        );

        return {
            ...item,
            qty,
            jumlah: qty
        };
    });

    localStorage.setItem(
        cartKey,
        JSON.stringify(keranjang)
    );

    updateCartBadge();
    renderKeranjang();
}

function jumlahItemKeranjang() {
    if (!getSesiPelanggan()) return 0;

    return bacaKeranjang().reduce(
        (total, item) => total + Number(item.qty || 1),
        0
    );
}

function updateCartBadge() {
    const badge = el('cartBadgeCount');

    if (!badge) return;

    badge.textContent = String(jumlahItemKeranjang());
    badge.style.display = 'flex';
}
    function renderKategori() {
        const container = containerKategori();
        if (!container) return;

        const daftar = [
            { id: 'all', nama: 'Semua Peralatan' },
            ...state.kategori.map(item => ({
                id: idKategori(item),
                nama: namaKategori(item)
            }))
        ];

        container.innerHTML = daftar.map(item => {
            const aktif = String(state.kategoriAktif) === String(item.id);
            return `
                <button
                    type="button"
                    class="home-category-button ${
                        aktif
                            ? 'bg-sicamp-700 text-white border-sicamp-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-sicamp-500 hover:text-sicamp-700'
                    } inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition-all"
                    data-home-category="${escapeHTML(item.id)}"
                    aria-pressed="${aktif}">
                    ${escapeHTML(item.nama)}
                </button>
            `;
        }).join('');
    }


function renderKategoriDropdown() {
    const select = document.getElementById('filterKategori');

    if (!select) return;

    const kategoriTerpilih = select.value;

    select.innerHTML = `
        <option value="">Semua Kategori</option>
        ${state.kategori.map(item => `
            <option value="${escapeHTML(String(idKategori(item)))}">
                ${escapeHTML(namaKategori(item))}
            </option>
        `).join('')}
    `;

    const pilihanMasihAda = Array.from(select.options)
        .some(option => option.value === kategoriTerpilih);

    if (pilihanMasihAda) {
        select.value = kategoriTerpilih;
    }
}

function pasangFilterBeranda() {
    const form = document.getElementById('filterSearchForm');
    const selectKategori = document.getElementById('filterKategori');
    const tanggalMulai = document.getElementById('tglMulai');
    const tanggalSelesai = document.getElementById('tglSelesai');

    if (selectKategori && selectKategori.dataset.categoryBound !== 'true') {
        selectKategori.dataset.categoryBound = 'true';

        selectKategori.addEventListener('change', () => {
            state.kategoriAktif = selectKategori.value || 'all';
            renderKategori();
            renderPeralatan();
        });
    }

    if (!form || form.dataset.filterBound === 'true') return;

    form.dataset.filterBound = 'true';

    form.addEventListener('submit', async event => {
        event.preventDefault();

        const mulai = tanggalMulai?.value || '';
        const selesai = tanggalSelesai?.value || '';

        if (!mulai || !selesai) {
            notifikasi(
                'Silakan isi tanggal mulai dan tanggal kembali terlebih dahulu.',
                'error'
            );
            return;
        }

        if (selesai <= mulai) {
            notifikasi(
                'Tanggal kembali harus setelah tanggal mulai sewa.',
                'error'
            );
            return;
        }

        state.kategoriAktif = selectKategori?.value || 'all';

        renderKategori();

        try {
            const params = new URLSearchParams({
                tanggal_mulai: mulai,
                tanggal_kembali: selesai
            });

            const response = await fetch(
                `${API.peralatan}?${params.toString()}`,
                {
                    method: 'GET',
                    headers: { Accept: 'application/json' },
                    cache: 'no-store'
                }
            );

            const result = await response.json();

            if (!response.ok || result.status === 'error') {
                throw new Error(
                    result.message || 'Gagal memuat ketersediaan peralatan.'
                );
            }

            state.peralatan = normalizeResponse(result);

            renderPeralatan();

            document.getElementById('katalog')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        } catch (error) {
            console.error('Gagal mencari peralatan:', error);

            notifikasi(
                error.message || 'Gagal mencari peralatan.',
                'error'
            );
        }
    });

    if (tanggalMulai && tanggalSelesai) {
        tanggalMulai.addEventListener('change', () => {
            tanggalSelesai.min = tanggalMulai.value || '';
        });
    }
}


    function dataPeralatanTersaring() {
        let data = state.peralatan.filter(statusAktif);

        if (state.kategoriAktif !== 'all') {
            data = data.filter(item => idKategori(item) === String(state.kategoriAktif));
        }

        const keyword = String(state.kataKunci || '').trim().toLowerCase();

        if (keyword) {
            data = data.filter(item =>
                namaPeralatan(item).toLowerCase().includes(keyword) ||
                deskripsiPeralatan(item).toLowerCase().includes(keyword) ||
                kategoriPeralatan(item).toLowerCase().includes(keyword)
            );
        }

        return data;
    }

    function renderPeralatan() {
        const grid = gridKatalog();
        if (!grid) return;

        const data = dataPeralatanTersaring();

        if (!data.length) {
            tampilkanPesanKatalog(
                state.peralatan.length
                    ? 'Peralatan tidak ditemukan. Coba kata kunci lain.'
                    : 'Belum ada data peralatan yang tersedia.'
            );
            return;
        }

        grid.innerHTML = data.map(item => {
            const id = idPeralatan(item);
            const nama = namaPeralatan(item);
            const harga = hargaPeralatan(item);
            const stok = stokPeralatan(item);
            const tersedia = stok > 0;
            const bolehTambah = Boolean(getSesiPelanggan());

            return `
                <article
                    class="home-equipment-card group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                    data-equipment-id="${escapeHTML(id)}">

                    <div class="relative h-52 overflow-hidden bg-slate-100">
                        <img
                            src="${escapeHTML(gambarPeralatan(item))}"
                            alt="${escapeHTML(nama)}"
                            loading="lazy"
                            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">

                        <span class="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-sicamp-800 shadow-sm">
                            ${escapeHTML(kategoriPeralatan(item))}
                        </span>

                        <span class="absolute right-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                            tersedia ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }">
                            ${tersedia ? 'Stok ' + stok : 'Stok Habis'}
                        </span>
                    </div>

                    <div class="space-y-3 p-4">
                        <div>
                            <h3 class="line-clamp-1 text-base font-extrabold text-slate-900">
                                ${escapeHTML(nama)}
                            </h3>

                            <p class="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-slate-500">
                                ${escapeHTML(deskripsiPeralatan(item))}
                            </p>
                        </div>

                        <div class="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                            <div>
                                <p class="text-[10px] font-semibold text-slate-400">Harga sewa</p>
                                <p class="mt-0.5 text-base font-black text-sicamp-700">
                                    ${rupiah(harga)}
                                    <span class="text-[10px] font-medium text-slate-400">/hari</span>
                                </p>
                            </div>

                            <button
                                type="button"
                                class="home-rent-button rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                                    tersedia && bolehTambah
                                        ? 'bg-sicamp-700 text-white hover:bg-sicamp-800'
                                        : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                }"
                                data-rent-id="${escapeHTML(id)}"
                                ${tersedia && bolehTambah ? '' : 'disabled'}>
                                <i class="fa-solid fa-basket-shopping mr-1"></i>
                                ${!tersedia
                                    ? 'Habis'
                                    : (!bolehTambah ? 'Masuk untuk Tambah' : 'Tambah')}
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    function tambahKeKeranjang(id) {
    if (!pastikanLoginPelanggan()) return;

    const peralatan = state.peralatan.find(
        item => idPeralatan(item) === String(id)
    );

    if (!peralatan) {
        notifikasi('Data peralatan tidak ditemukan.', 'error');
        return;
    }

    if (
        !statusAktif(peralatan) ||
        stokPeralatan(peralatan) <= 0
    ) {
        notifikasi('Peralatan sedang tidak tersedia.', 'error');
        return;
    }

    const keranjang = bacaKeranjang();
    const idBarang = idPeralatan(peralatan);

    const itemLama = keranjang.find(
        item => String(item.id_peralatan) === idBarang
    );

    if (itemLama) {
        if (itemLama.qty >= stokPeralatan(peralatan)) {
            notifikasi(
                'Jumlah barang sudah mencapai batas stok.',
                'error'
            );
            return;
        }

        itemLama.qty += 1;
        itemLama.jumlah = itemLama.qty;
    } else {
        keranjang.push({
            id_peralatan: idBarang,
            nama_peralatan: namaPeralatan(peralatan),
            harga_sewa: hargaPeralatan(peralatan),
            gambar: gambarPeralatan(peralatan),
            stok: stokPeralatan(peralatan),
            qty: 1,
            jumlah: 1
        });
    }

    simpanKeranjang(keranjang);

    notifikasi(
        namaPeralatan(peralatan) +
        ' berhasil ditambahkan ke keranjang.',
        'success'
    );
}

    function renderKeranjang() {
        const container = el('cartItemsContainer');

        if (!container) {
            updateCartBadge();
            return;
        }

        if (!getSesiPelanggan()) {
            container.innerHTML = `
                <div class="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                    <i class="fa-solid fa-lock text-2xl text-slate-300"></i>
                    <p class="mt-2 text-xs font-bold text-slate-600">
                        Masuk untuk menggunakan keranjang
                    </p>
                    <p class="mt-1 text-[11px] text-slate-400">
                        Login sebagai pelanggan untuk melihat keranjangmu.
                    </p>
                    <a href="login.html"
                    class="mt-3 inline-flex rounded-lg bg-sicamp-700 px-4 py-2 text-xs font-bold text-white">
                        Masuk
                    </a>
                </div>
            `;

            updateCartBadge();
            hitungkanTotalCheckout();
            return;
        }

        const keranjang = bacaKeranjang();

        if (!keranjang.length) {
            container.innerHTML = `
                <div class="rounded-xl border border-dashed border-slate-200 p-5 text-center">
                    <i class="fa-solid fa-basket-shopping text-2xl text-slate-300"></i>
                    <p class="mt-2 text-xs font-bold text-slate-600">
                        Keranjang masih kosong
                    </p>
                    <p class="mt-1 text-[11px] text-slate-400">
                        Klik tombol Tambah pada peralatan yang ingin disewa.
                    </p>
                </div>
            `;

            updateCartBadge();
            hitungkanTotalCheckout();
            return;
        }

        container.innerHTML = keranjang.map((item, index) => `
            <div class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
                data-cart-index="${index}">

                <img
                    src="${escapeHTML(item.gambar || FALLBACK_IMAGE)}"
                    alt="${escapeHTML(item.nama_peralatan)}"
                    class="h-16 w-16 shrink-0 rounded-lg bg-slate-100 object-cover"
                    onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">

                <div class="min-w-0 flex-1">
                    <p class="text-xs font-bold text-slate-800">
                        ${escapeHTML(item.nama_peralatan)}
                    </p>

                    <p class="mt-1 text-xs font-bold text-sicamp-700">
                        ${rupiah(item.harga_sewa)}
                        <span class="font-normal text-slate-400">/hari</span>
                    </p>

                    <div class="mt-2 flex items-center gap-2">
                        <button type="button"
                            class="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                            data-cart-action="minus"
                            data-cart-index="${index}">−</button>

                        <span class="min-w-4 text-center text-xs font-bold">
                            ${item.qty}
                        </span>

                        <button type="button"
                            class="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                            data-cart-action="plus"
                            data-cart-index="${index}">+</button>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-2">
                    <p class="text-xs font-bold text-slate-800">
                        ${rupiah(item.harga_sewa * item.qty)}
                    </p>

                    <button type="button"
                        class="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                        data-cart-action="remove"
                        data-cart-index="${index}">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');

        updateCartBadge();
        hitungkanTotalCheckout();
    }

    function hitungkanTotalCheckout() {
        const keranjang = bacaKeranjang();
        const tanggalMulai = el('checkoutTglSewa')?.value || '';
        const tanggalKembali = el('checkoutTglKembali')?.value || '';

        let durasi = 1;
        if (tanggalMulai && tanggalKembali) {
            const mulai = new Date(tanggalMulai + 'T00:00:00');
            const kembali = new Date(tanggalKembali + 'T00:00:00');
            const selisih = Math.round((kembali.getTime() - mulai.getTime()) / (1000 * 60 * 60 * 24));
            durasi = selisih > 0 ? selisih : 1;
        }

        const total = keranjang.reduce((jumlah, item) => {
            return jumlah + (Number(item.harga_sewa) || 0) * (Number(item.qty) || 1) * durasi;
        }, 0);

        if (el('cartTotalHarga')) el('cartTotalHarga').textContent = rupiah(total);
        if (el('checkoutRincianDurasi')) el('checkoutRincianDurasi').textContent = durasi + ' Hari';

        return total;
    }

    function updateCheckoutStep(step) {
        currentCheckoutStep = step;
        const step1 = el('checkoutStep1');
        const step2 = el('checkoutStep2');
        const step3 = el('checkoutStep3');
        const dateSection = el('checkoutDateSection');
        const subtitle = el('stepSubtitle');
        const buttonsArea = el('stepButtonsArea');

        if (!step1 || !step2 || !step3 || !buttonsArea) return;

        step1.classList.add('hidden');
        step2.classList.add('hidden');
        step3.classList.add('hidden');

        [1, 2, 3].forEach(i => {
            const badge = el(`stepBadge${i}`);
            const indicator = el(`stepIndicator${i}`);
            const line = el(`stepLine${i - 1}`);

            if (badge && indicator) {
                if (i <= step) {
                    badge.className = 'w-5 h-5 rounded-full bg-sicamp-700 text-white text-[10px] flex items-center justify-center font-bold';
                    indicator.className = 'flex items-center gap-1.5 text-sicamp-700 font-bold';
                } else {
                    badge.className = 'w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] flex items-center justify-center font-bold';
                    indicator.className = 'flex items-center gap-1.5 text-slate-400 font-bold';
                }
            }

            if (line) {
                line.className = i <= step ? 'h-0.5 w-8 bg-sicamp-700' : 'h-0.5 w-8 bg-slate-200';
            }
        });

        if (step === 1) {
            step1.classList.remove('hidden');
            if (dateSection) dateSection.classList.remove('hidden');
            if (subtitle) subtitle.textContent = 'Tahap 1 dari 3: Ringkasan Keranjang';
            buttonsArea.innerHTML = `
                <button type="button" onclick="nextCheckoutStep(2)" class="w-full sc-btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    <span>Lanjut Ke Data Penyewa</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            `;
        } else if (step === 2) {
            step2.classList.remove('hidden');
            if (dateSection) dateSection.classList.add('hidden');
            if (subtitle) subtitle.textContent = 'Tahap 2 dari 3: Data Penyewa & Jaminan';
            buttonsArea.innerHTML = `
                <button type="button" onclick="nextCheckoutStep(1)" class="w-1/3 sc-btn-secondary py-3 rounded-xl font-bold flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Kembali</span>
                </button>
                <button type="button" onclick="nextCheckoutStep(3)" class="w-2/3 sc-btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                    <span>Lanjut Pembayaran</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            `;
        } else if (step === 3) {
            step3.classList.remove('hidden');
            if (dateSection) dateSection.classList.add('hidden');
            if (subtitle) subtitle.textContent = 'Tahap 3 dari 3: Pembayaran & Bukti Transfer';
            buttonsArea.innerHTML = `
                <button type="button" onclick="nextCheckoutStep(2)" class="w-1/3 sc-btn-secondary py-3 rounded-xl font-bold flex items-center justify-center gap-1.5">
                    <i class="fa-solid fa-arrow-left"></i>
                    <span>Kembali</span>
                </button>
                <button type="button" onclick="submitPesanan()" class="w-2/3 sc-btn-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 bg-emerald-600 border-emerald-600 hover:bg-emerald-700">
                    <i class="fa-solid fa-paper-plane"></i>
                    <span>Kirim Pesanan</span>
                </button>
            `;
        }
    }

    function nextCheckoutStep(targetStep) {
        if (!pastikanLoginPelanggan()) return;
        if (targetStep === 2) {
            const keranjang = bacaKeranjang();
            if (!keranjang.length) {
                notifikasi('Keranjang Anda masih kosong.', 'error');
                return;
            }
            const tglSewa = el('checkoutTglSewa')?.value;
            const tglKembali = el('checkoutTglKembali')?.value;
            if (!tglSewa || !tglKembali) {
                notifikasi('Harap isi tanggal mulai dan rencana kembali sewa.', 'error');
                return;
            }
        }

        if (targetStep === 3) {
            const nama = el('checkoutNama')?.value.trim();
            const wa = el('checkoutWA')?.value.trim();
            const darurat = el('checkoutKontakDarurat')?.value.trim();
            const alamat = el('checkoutAlamat')?.value.trim();
            const ktp = el('checkoutKTP')?.files.length;

            if (!nama || !wa || !darurat || !alamat || !ktp) {
                notifikasi('Harap lengkapi semua Data Penyewa dan Upload KTP/KTM.', 'error');
                return;
            }
        }

        updateCheckoutStep(targetStep);
    }

async function submitPesanan() {
    if (!pastikanLoginPelanggan()) return;

    const tombol = document.querySelector(
        'button[onclick="submitPesanan()"]'
    );

    // Ambil data sesi pelanggan dengan aman
    const sesi = getSesiPelanggan();
    const user = sesi?.user || sesi || {};

    const idPelanggan = Number(
        user.id_pelanggan ??
        user.pelanggan_id ??
        user.id_customer ??
        user.id_user ??
        user.user_id ??
        user.id ??
        0
    );

    if (!Number.isInteger(idPelanggan) || idPelanggan <= 0) {
        notifikasi(
            'ID pelanggan tidak ditemukan. Silakan login ulang.',
            'error'
        );
        return;
    }

    const keranjang = bacaKeranjang();

    if (!keranjang.length) {
        notifikasi('Keranjang masih kosong.', 'error');
        return;
    }

    const tanggalMulai = el('checkoutTglSewa')?.value;
    const tanggalKembali = el('checkoutTglKembali')?.value;

    const nama = el('checkoutNama')?.value.trim();
    const wa = el('checkoutWA')?.value.trim();
    const darurat = el('checkoutKontakDarurat')?.value.trim();
    const alamat = el('checkoutAlamat')?.value.trim();

    const ktp = el('checkoutKTP')?.files?.[0];
    const bukti = el('checkoutBukti')?.files?.[0];

    if (!tanggalMulai || !tanggalKembali ||
        tanggalKembali <= tanggalMulai) {
        notifikasi('Tanggal penyewaan tidak valid.', 'error');
        return;
    }

    if (!nama || !wa || !darurat || !alamat || !ktp) {
        notifikasi('Lengkapi data penyewa dan unggah KTP/KTM.', 'error');
        return;
    }

    if (!bukti) {
        notifikasi('Silakan unggah bukti pembayaran.', 'error');
        return;
    }

    if (keranjang.some(item =>
        !Number.isInteger(Number(item.id_peralatan)) ||
        Number(item.id_peralatan) <= 0
    )) {
        notifikasi(
            'Paket bundling belum terhubung ke ID peralatan database.',
            'error'
        );
        return;
    }

    const durasi = Math.max(
        1,
        Math.round(
            (new Date(tanggalKembali + 'T00:00:00') -
             new Date(tanggalMulai + 'T00:00:00')) / 86400000
        )
    );

    const detailItems = keranjang.map(item => ({
        id_peralatan: Number(item.id_peralatan),
        jumlah: Number(item.qty ?? item.jumlah ?? 1),
        harga_satuan: Number(item.harga_sewa) * durasi
    }));

    if (tombol) tombol.disabled = true;

    try {
        // Gunakan FormData agar file gambar (ktp dan bukti) bisa ikut terkirim
        const formData = new FormData();
        formData.append('id_pelanggan', idPelanggan);
        formData.append('tanggal_mulai', tanggalMulai);
        formData.append('tanggal_kembali_rencana', tanggalKembali);
        formData.append('detail_items', JSON.stringify(detailItems));

        if (ktp) formData.append('ktp', ktp);
        if (bukti) formData.append('bukti', bukti);

        const response = await fetch('api/api_penyewaan.php', {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        });

        const hasil = await response.json();

        if (!response.ok || hasil.status !== 'success') {
            throw new Error(
                hasil.message || 'Gagal menyimpan transaksi.'
            );
        }

        notifikasi(
            'Transaksi tersimpan dengan kode ' + hasil.kode_transaksi,
            'success'
        );

        simpanKeranjang([]);

        setTimeout(() => {
            if (typeof window.showSiCampHistory === 'function') {
                window.showSiCampHistory();
            } else {
                window.location.hash = 'riwayat-pesanan';
            }
        }, 1000);

    } catch (error) {
        console.error('Gagal menyimpan transaksi:', error);
        notifikasi(error.message || 'Gagal menyimpan transaksi.', 'error');
    } finally {
        if (tombol) tombol.disabled = false;
    }
}

    function pasangEventKatalog() {
        const grid = gridKatalog();
        if (grid && grid.dataset.homeCartBound !== 'true') {
            grid.dataset.homeCartBound = 'true';
            grid.addEventListener('click', event => {
                const button = event.target.closest('[data-rent-id]');
                if (!button || button.disabled) return;
                event.preventDefault();
                tambahKeKeranjang(button.dataset.rentId);
            });
        }

        const kategori = containerKategori();
        if (kategori && kategori.dataset.homeCategoryBound !== 'true') {
            kategori.dataset.homeCategoryBound = 'true';
            kategori.addEventListener('click', event => {
                const button = event.target.closest('[data-home-category]');
                if (!button) return;
                if (!pastikanLoginPelanggan()) return;
                state.kategoriAktif = button.dataset.homeCategory;
                renderKategori();
                renderPeralatan();
            });
        }

        const input = el('searchInput');
        if (input && input.dataset.homeSearchBound !== 'true') {
            input.dataset.homeSearchBound = 'true';
            input.addEventListener('input', () => {
                state.kataKunci = input.value || '';
                renderPeralatan();
            });
        }

        document.addEventListener('click', event => {
            const button = event.target.closest('[data-cart-action]');
            if (!button) return;

            const index = Number(button.dataset.cartIndex);
            const action = button.dataset.cartAction;
            const keranjang = bacaKeranjang();

            if (!Number.isInteger(index) || !keranjang[index]) return;

            const item = keranjang[index];

            if (action === 'plus') {
                if (item.qty >= item.stok) {
                    notifikasi('Jumlah barang sudah mencapai batas stok.', 'error');
                    return;
                }
                item.qty += 1;
                item.jumlah = item.qty;
            } else if (action === 'minus') {
                if (item.qty <= 1) {
                    keranjang.splice(index, 1);
                } else {
                    item.qty -= 1;
                    item.jumlah = item.qty;
                }
            } else if (action === 'remove') {
                keranjang.splice(index, 1);
            } else {
                return;
            }

            simpanKeranjang(keranjang);
        });

        document.addEventListener('input', event => {
            if (
                event.target.id === 'checkoutTglSewa' ||
                event.target.id === 'checkoutTglKembali'
            ) {
                hitungkanTotalCheckout();
            }
        });
    }


    async function loadKategori() {
        try {
            state.kategori = await requestAPI(API.kategori);

            renderKategori();
            renderKategoriDropdown();
        } catch (error) {
            console.error('Gagal memuat kategori:', error);
        }
    }


    async function loadPeralatan() {
        try {
            state.peralatan = await requestAPI(API.peralatan);
            renderPeralatan();
        } catch (error) {
            console.error('Gagal memuat peralatan:', error);
            tampilkanPesanKatalog('Data peralatan gagal dimuat. Periksa API peralatan.', true);
        }
    }

    window.sewaItem = function (namaPaket) {
        if (!pastikanLoginPelanggan()) return;

        const paketBundling = {
            id_peralatan: 'paket-bundling-muncak-starter-4p',
            nama_peralatan: namaPaket,
            harga_sewa: 85000,
            gambar: FALLBACK_IMAGE,
            stok: 999,
            qty: 1,
            jumlah: 1,
            tipe: 'bundling'
        };

        const keranjang = bacaKeranjang();

        const paketSudahAda = keranjang.find(
            item =>
                item.id_peralatan === paketBundling.id_peralatan
        );

        if (paketSudahAda) {
            notifikasi(
                'Paket bundling sudah ada di keranjang.',
                'info'
            );
            return;
        }

        keranjang.push(paketBundling);

        simpanKeranjang(keranjang);

        notifikasi(
            namaPaket + ' berhasil ditambahkan ke keranjang.',
            'success'
        );

        // Tidak membuka modal keranjang secara otomatis.
    };

    window.renderKeranjang = renderKeranjang;
    window.hitungkanTotalCheckout = hitungkanTotalCheckout;
    window.updateCartBadge = updateCartBadge;
    window.tambahKeKeranjang = tambahKeKeranjang;
    window.addToCart = tambahKeKeranjang;
    window.renderPeralatan = renderPeralatan;
    window.loadHomeKategori = loadKategori;
    window.loadHomePeralatan = loadPeralatan;
    window.updateCheckoutStep = updateCheckoutStep;
    window.nextCheckoutStep = nextCheckoutStep;
    window.submitPesanan = submitPesanan;

    window.searchKeywordHandler = function () {
        const input = el('searchInput');
        state.kataKunci = input ? input.value : '';
        renderPeralatan();
    };

    window.addEventListener('storage', event => {
        if (event.key === CART_KEY || event.key === CART_KEY_ALT) {
            renderKeranjang();
        }
    });


    async function init() {
        // Eksekusi perubahan navbar langsung tanpa cek nama file
        renderNavAuth();

        pasangFilterBeranda();
        pasangEventKatalog();
        renderKeranjang();
        tampilkanPesanKatalog('Memuat peralatan...');

        await Promise.allSettled([
            loadKategori(),
            loadPeralatan()
        ]);

        renderKeranjang();
        updateCartBadge();
    }


    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();