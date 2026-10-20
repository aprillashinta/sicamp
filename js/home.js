/* =========================================================
   SICAMP - BERANDA PELANGGAN
   Memuat kategori dan peralatan dari database melalui API
   Tidak mengubah fungsi sidebar maupun halaman admin
   ========================================================= */

(() => {
    'use strict';

    const API = {
        kategori: 'api/api_kategori.php',
        peralatan: 'api/api_peralatan.php'
    };

    const state = {
        kategori: [],
        peralatan: [],
        kategoriAktif: 'all',
        kataKunci: '',
        sedangMemuat: false
    };

    const FALLBACK_IMAGE =
        'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80';

    /* =====================================================
       UTILITAS
       ===================================================== */

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }

    function formatRupiah(value) {
        const harga = Number(value) || 0;

        return 'Rp' + harga.toLocaleString('id-ID');
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    function getFirstValue(object, keys, fallback = '') {
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
        if (Array.isArray(response)) {
            return response;
        }

        if (!response || typeof response !== 'object') {
            return [];
        }

        const possibleKeys = [
            'data',
            'result',
            'kategori',
            'peralatan',
            'items'
        ];

        for (const key of possibleKeys) {
            if (Array.isArray(response[key])) {
                return response[key];
            }
        }

        return [];
    }

    async function requestAPI(url) {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            cache: 'no-store'
        });

        const text = await response.text();

        let result;

        try {
            result = JSON.parse(text);
        } catch {
            throw new Error(
                'Respons API bukan JSON yang valid. Periksa file ' + url
            );
        }

        if (!response.ok) {
            throw new Error(
                result.message ||
                'Gagal mengambil data dari ' + url
            );
        }

        if (
            result &&
            result.success === false
        ) {
            throw new Error(
                result.message ||
                'API tidak berhasil mengambil data.'
            );
        }

        return normalizeResponse(result);
    }

    /* =====================================================
       NORMALISASI DATA DATABASE
       ===================================================== */

    function getKategoriId(item) {
        return String(
            getFirstValue(item, [
                'id_kategori',
                'kategori_id',
                'idKategori'
            ], '')
        );
    }

    function getKategoriNama(item) {
        return String(
            getFirstValue(item, [
                'nama_kategori',
                'kategori',
                'namaKategori'
            ], 'Kategori lainnya')
        );
    }

    function getPeralatanId(item) {
        return String(
            getFirstValue(item, [
                'id_peralatan',
                'id_alat',
                'peralatan_id',
                'id'
            ], '')
        );
    }

    function getPeralatanNama(item) {
        return String(
            getFirstValue(item, [
                'nama_peralatan',
                'nama_alat',
                'nama',
                'nama_barang'
            ], 'Peralatan tanpa nama')
        );
    }

    function getPeralatanDeskripsi(item) {
        return String(
            getFirstValue(item, [
                'deskripsi',
                'keterangan',
                'detail'
            ], 'Peralatan outdoor untuk menemani kegiatan camping.')
        );
    }

    function getPeralatanHarga(item) {
        return Number(
            getFirstValue(item, [
                'harga_sewa',
                'harga',
                'harga_per_hari'
            ], 0)
        ) || 0;
    }

    function getPeralatanStok(item) {
        return Number(
            getFirstValue(item, [
                'stok',
                'jumlah_stok',
                'stock'
            ], 0)
        ) || 0;
    }

    function getPeralatanStatus(item) {
        return String(
            getFirstValue(item, [
                'status'
            ], 'Aktif')
        ).toLowerCase();
    }

    function getPeralatanGambar(item) {
        const gambar = getFirstValue(item, [
            'gambar',
            'foto',
            'image',
            'foto_peralatan',
            'gambar_peralatan'
        ], '');

        if (!gambar) {
            return FALLBACK_IMAGE;
        }

        const value = String(gambar).trim();

        if (
            value.startsWith('data:image/') ||
            value.startsWith('https://') ||
            value.startsWith('http://')
        ) {
            return value;
        }

        /*
         * Jika database menyimpan path gambar lokal,
         * path tersebut digunakan sebagai sumber gambar.
         *
         * Contoh:
         * assets/peralatan/tenda.jpg
         * uploads/tenda.jpg
         */

        return value;
    }

    function getNamaKategoriPeralatan(item) {
        const kategoriDariData = getFirstValue(item, [
            'nama_kategori',
            'kategori',
            'kategori_peralatan'
        ], '');

        if (kategoriDariData) {
            if (typeof kategoriDariData === 'object') {
                return getKategoriNama(kategoriDariData);
            }

            return String(kategoriDariData);
        }

        const idKategori = String(
            getFirstValue(item, [
                'id_kategori',
                'kategori_id'
            ], '')
        );

        const kategori = state.kategori.find(
            itemKategori => getKategoriId(itemKategori) === idKategori
        );

        return kategori
            ? getKategoriNama(kategori)
            : 'Peralatan Outdoor';
    }

    function isPeralatanAktif(item) {
        const status = getPeralatanStatus(item);

        return [
            'aktif',
            'active',
            'tersedia',
            '1'
        ].includes(status);
    }

    /* =====================================================
       ELEMEN BERANDA
       ===================================================== */

    function getGridKatalog() {
        return (
            getElement('equipmentGrid') ||
            getElement('katalogPeralatan') ||
            getElement('productGrid')
        );
    }

    function getContainerKategori() {
        return (
            getElement('filterCategoryContainer') ||
            getElement('categoryContainer') ||
            getElement('kategoriContainer')
        );
    }

    function tampilkanPesanKatalog(pesan, jenis = 'info') {
        const grid = getGridKatalog();

        if (!grid) {
            console.warn(
                'Elemen katalog tidak ditemukan. ' +
                'Periksa ID equipmentGrid di index.html.'
            );

            return;
        }

        const warna = jenis === 'error'
            ? 'text-rose-600'
            : 'text-slate-500';

        grid.innerHTML = `
            <div class="col-span-full py-12 text-center">
                <div class="mx-auto mb-4 flex h-14 w-14
                            items-center justify-center rounded-2xl
                            bg-slate-100 text-slate-400">
                    <i class="fa-solid ${
                        jenis === 'error'
                            ? 'fa-circle-exclamation'
                            : 'fa-box-open'
                    } text-xl"></i>
                </div>

                <p class="${warna} text-sm font-semibold">
                    ${escapeHTML(pesan)}
                </p>
            </div>
        `;
    }

    /* =====================================================
       RENDER KATEGORI
       ===================================================== */

    function renderKategori() {
        const container = getContainerKategori();

        if (!container) {
            console.warn(
                'Elemen kategori tidak ditemukan. ' +
                'Periksa ID filterCategoryContainer di index.html.'
            );

            return;
        }

        const semuaKategori = [
            {
                id: 'all',
                nama: 'Semua Peralatan'
            },
            ...state.kategori.map(item => ({
                id: getKategoriId(item),
                nama: getKategoriNama(item)
            }))
        ];

        container.innerHTML = semuaKategori.map(kategori => {
            const aktif =
                String(state.kategoriAktif) === String(kategori.id);

            return `
                <button
                    type="button"
                    class="home-category-button ${
                        aktif
                            ? 'bg-sicamp-700 text-white border-sicamp-700'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-sicamp-500 hover:text-sicamp-700'
                    } inline-flex items-center gap-2 rounded-full
                       border px-4 py-2.5 text-xs font-bold
                       transition-all"
                    data-home-category="${escapeHTML(kategori.id)}"
                    aria-pressed="${aktif ? 'true' : 'false'}"
                >
                    ${escapeHTML(kategori.nama)}
                </button>
            `;
        }).join('');

        container.querySelectorAll('[data-home-category]').forEach(button => {
            button.addEventListener('click', () => {
                state.kategoriAktif = button.dataset.homeCategory;

                renderKategori();
                renderPeralatan();
            });
        });
    }

    /* =====================================================
       FILTER DAN PENCARIAN
       ===================================================== */

    function getPeralatanTersaring() {
        let data = state.peralatan.filter(isPeralatanAktif);

        if (state.kategoriAktif !== 'all') {
            data = data.filter(item => {
                const idKategori = String(
                    getFirstValue(item, [
                        'id_kategori',
                        'kategori_id'
                    ], '')
                );

                return idKategori === String(state.kategoriAktif);
            });
        }

        const keyword = state.kataKunci
            .trim()
            .toLowerCase();

        if (keyword) {
            data = data.filter(item => {
                const nama = getPeralatanNama(item).toLowerCase();
                const deskripsi = getPeralatanDeskripsi(item).toLowerCase();
                const kategori = getNamaKategoriPeralatan(item).toLowerCase();

                return (
                    nama.includes(keyword) ||
                    deskripsi.includes(keyword) ||
                    kategori.includes(keyword)
                );
            });
        }

        return data;
    }

    function pasangPencarian() {
        const searchInput = getElement('searchInput');

        if (!searchInput || searchInput.dataset.homeInitialized === 'true') {
            return;
        }

        searchInput.dataset.homeInitialized = 'true';

        searchInput.addEventListener('input', event => {
            state.kataKunci = event.target.value || '';

            renderPeralatan();
        });

        /*
         * Tetap mendukung atribut HTML lama:
         * onkeyup="searchKeywordHandler()"
         */
    }

    /* =====================================================
       RENDER KARTU PERALATAN
       ===================================================== */

    function renderPeralatan() {
        const grid = getGridKatalog();

        if (!grid) {
            return;
        }

        const data = getPeralatanTersaring();

        if (data.length === 0) {
            tampilkanPesanKatalog(
                state.kataKunci
                    ? 'Peralatan tidak ditemukan. Coba kata kunci lain.'
                    : 'Belum ada peralatan yang tersedia untuk ditampilkan.'
            );

            return;
        }

        grid.innerHTML = data.map(item => {
            const id = getPeralatanId(item);
            const nama = getPeralatanNama(item);
            const deskripsi = getPeralatanDeskripsi(item);
            const harga = getPeralatanHarga(item);
            const stok = getPeralatanStok(item);
            const gambar = getPeralatanGambar(item);
            const kategori = getNamaKategoriPeralatan(item);

            const stokTersedia = stok > 0;

            return `
                <article
                    class="home-equipment-card group overflow-hidden
                           rounded-2xl border border-slate-200/80
                           bg-white shadow-sm transition-all
                           hover:-translate-y-1 hover:shadow-lg"
                    data-equipment-id="${escapeHTML(id)}"
                >
                    <div class="relative h-52 overflow-hidden bg-slate-100">
                        <img
                            src="${escapeHTML(gambar)}"
                            alt="${escapeHTML(nama)}"
                            loading="lazy"
                            class="h-full w-full object-cover transition-transform
                                   duration-500 group-hover:scale-105"
                            onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'"
                        >

                        <span class="absolute left-3 top-3 rounded-full
                                     bg-white/95 px-3 py-1.5 text-[10px]
                                     font-bold text-sicamp-800 shadow-sm">
                            ${escapeHTML(kategori)}
                        </span>

                        <span class="absolute right-3 top-3 rounded-full
                                     px-3 py-1.5 text-[10px] font-bold
                                     ${
                                         stokTersedia
                                             ? 'bg-emerald-100 text-emerald-700'
                                             : 'bg-rose-100 text-rose-700'
                                     }">
                            ${
                                stokTersedia
                                    ? 'Stok ' + stok
                                    : 'Stok Habis'
                            }
                        </span>
                    </div>

                    <div class="space-y-3 p-4">
                        <div>
                            <h3 class="line-clamp-1 text-base
                                       font-extrabold text-slate-900">
                                ${escapeHTML(nama)}
                            </h3>

                            <p class="mt-1 line-clamp-2 min-h-[2.5rem]
                                      text-xs leading-relaxed text-slate-500">
                                ${escapeHTML(deskripsi)}
                            </p>
                        </div>

                        <div class="flex items-end justify-between gap-3
                                    border-t border-slate-100 pt-3">
                            <div>
                                <p class="text-[10px] font-semibold
                                          text-slate-400">
                                    Harga sewa
                                </p>

                                <p class="mt-0.5 text-base font-black
                                          text-sicamp-700">
                                    ${formatRupiah(harga)}
                                    <span class="text-[10px] font-medium
                                                 text-slate-400">
                                        /hari
                                    </span>
                                </p>
                            </div>

                            <button
                                type="button"
                                class="home-rent-button rounded-xl
                                       px-3.5 py-2.5 text-xs font-bold
                                       transition-all
                                       ${
                                           stokTersedia
                                               ? 'bg-sicamp-700 text-white hover:bg-sicamp-800'
                                               : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                       }"
                                data-rent-id="${escapeHTML(id)}"
                                ${stokTersedia ? '' : 'disabled'}
                            >
                                <i class="fa-solid fa-basket-shopping mr-1"></i>
                                ${stokTersedia ? 'Tambah' : 'Habis'}
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        pasangTombolKeranjang();
    }

    /* =====================================================
       KERANJANG
       ===================================================== */

    function pasangTombolKeranjang() {
        const grid = getGridKatalog();

        if (!grid) {
            return;
        }

        grid.querySelectorAll('[data-rent-id]').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.dataset.rentId;

                const peralatan = state.peralatan.find(
                    item => getPeralatanId(item) === String(id)
                );

                if (!peralatan) {
                    tampilkanNotifikasi(
                        'Data peralatan tidak ditemukan.',
                        'error'
                    );

                    return;
                }

                if (
                    !isPeralatanAktif(peralatan) ||
                    getPeralatanStok(peralatan) <= 0
                ) {
                    tampilkanNotifikasi(
                        'Peralatan sedang tidak tersedia.',
                        'error'
                    );

                    return;
                }

                /*
                 * Jika app.js atau script beranda lama menyediakan
                 * fungsi tambah keranjang, gunakan fungsi tersebut.
                 * Nama fungsi yang tidak tersedia tidak akan dipanggil.
                 */

                const fungsiKeranjang = [
                    'tambahKeKeranjang',
                    'addToCart',
                    'tambahKeranjang',
                    'sewaItem'
                ];

                for (const namaFungsi of fungsiKeranjang) {
                    if (typeof window[namaFungsi] === 'function') {
                        try {
                            window[namaFungsi](id);
                            return;
                        } catch (error) {
                            console.error(
                                'Gagal menggunakan fungsi keranjang:',
                                error
                            );

                            break;
                        }
                    }
                }

                /*
                 * Jika fungsi keranjang lama tidak tersedia,
                 * simpan item ke keranjang lokal sebagai fallback.
                 *
                 * Ini bukan transaksi database. Checkout tetap harus
                 * menggunakan API penyewaan yang benar.
                 */

                tambahKeranjangLokal(peralatan);
            });
        });
    }

    function tambahKeranjangLokal(peralatan) {
        let keranjang = [];

        try {
            keranjang = JSON.parse(
                localStorage.getItem('sicamp_keranjang') || '[]'
            );

            if (!Array.isArray(keranjang)) {
                keranjang = [];
            }
        } catch {
            keranjang = [];
        }

        const id = getPeralatanId(peralatan);

        const itemLama = keranjang.find(item =>
            String(
                getFirstValue(item, [
                    'id_peralatan',
                    'id_alat',
                    'id'
                ], '')
            ) === String(id)
        );

        if (itemLama) {
            const jumlah = Number(
                getFirstValue(itemLama, [
                    'jumlah',
                    'qty',
                    'quantity'
                ], 1)
            );

            if (jumlah >= getPeralatanStok(peralatan)) {
                tampilkanNotifikasi(
                    'Jumlah barang sudah mencapai batas stok.',
                    'error'
                );

                return;
            }

            if ('jumlah' in itemLama) {
                itemLama.jumlah = jumlah + 1;
            } else if ('qty' in itemLama) {
                itemLama.qty = jumlah + 1;
            } else {
                itemLama.jumlah = jumlah + 1;
            }
        } else {
            keranjang.push({
                id_peralatan: id,
                nama_peralatan: getPeralatanNama(peralatan),
                harga_sewa: getPeralatanHarga(peralatan),
                gambar: getPeralatanGambar(peralatan),
                jumlah: 1
            });
        }

        localStorage.setItem(
            'sicamp_keranjang',
            JSON.stringify(keranjang)
        );

        perbaruiBadgeKeranjang(keranjang.length);

        tampilkanNotifikasi(
            getPeralatanNama(peralatan) + ' ditambahkan ke keranjang.',
            'success'
        );
    }

    function perbaruiBadgeKeranjang(jumlah) {
        const badge = getElement('cartBadgeCount');

        if (badge) {
            badge.textContent = String(jumlah);
        }
    }

    function tampilkanNotifikasi(pesan, jenis = 'info') {
        if (typeof window.showNotification === 'function') {
            window.showNotification(pesan, jenis);
            return;
        }

        let toast = getElement('homeToast');

        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'homeToast';

            toast.className =
                'fixed bottom-5 right-5 z-[100] max-w-sm ' +
                'rounded-xl px-4 py-3 text-sm font-semibold ' +
                'text-white shadow-xl transition-all';

            document.body.appendChild(toast);
        }

        toast.textContent = pesan;

        toast.style.backgroundColor =
            jenis === 'error' ? '#e11d48' :
            jenis === 'success' ? '#15803d' :
            '#334155';

        toast.style.display = 'block';

        clearTimeout(toast._timeout);

        toast._timeout = setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    /* =====================================================
       MUAT DATA DARI API
       ===================================================== */

    async function loadKategori() {
        try {
            const data = await requestAPI(API.kategori);

            state.kategori = data;

            try {
                localStorage.setItem(
                    'kategori',
                    JSON.stringify(data)
                );
            } catch (error) {
                console.warn('Kategori tidak dapat disimpan ke cache.', error);
            }

            renderKategori();
        } catch (error) {
            console.error('Gagal memuat kategori:', error);

            const container = getContainerKategori();

            if (container) {
                container.innerHTML = `
                    <p class="py-2 text-xs text-rose-600">
                        Kategori gagal dimuat. Periksa koneksi server.
                    </p>
                `;
            }
        }
    }

    async function loadPeralatan() {
        try {
            const data = await requestAPI(API.peralatan);

            state.peralatan = data;

            try {
                localStorage.setItem(
                    'peralatan',
                    JSON.stringify(data)
                );
            } catch (error) {
                console.warn('Peralatan tidak dapat disimpan ke cache.', error);
            }

            renderPeralatan();
        } catch (error) {
            console.error('Gagal memuat peralatan:', error);

            tampilkanPesanKatalog(
                'Data peralatan gagal dimuat. Pastikan server PHP berjalan dan API peralatan dapat diakses.',
                'error'
            );
        }
    }

    /* =====================================================
       KOMPATIBILITAS DENGAN HTML LAMA
       ===================================================== */

    window.searchKeywordHandler = function () {
        const searchInput = getElement('searchInput');

        state.kataKunci = searchInput
            ? searchInput.value
            : '';

        renderPeralatan();
    };

    window.renderHomeKategori = renderKategori;
    window.renderHomePeralatan = renderPeralatan;

    window.loadHomeKategori = loadKategori;
    window.loadHomePeralatan = loadPeralatan;

    /* =====================================================
       INISIALISASI
       ===================================================== */

    async function init() {
        /*
         * Jangan menjalankan loader beranda di halaman admin.
         */
        const halaman = window.location.pathname
            .split('/')
            .pop()
            .toLowerCase();

        if (
            halaman &&
            halaman !== 'index.html' &&
            halaman !== ''
        ) {
            return;
        }

        pasangPencarian();

        tampilkanPesanKatalog('Memuat peralatan dari database...');

        await Promise.allSettled([
            loadKategori(),
            loadPeralatan()
        ]);

        /*
         * Badge awal keranjang.
         */
        try {
            const keranjang = JSON.parse(
                localStorage.getItem('sicamp_keranjang') || '[]'
            );

            perbaruiBadgeKeranjang(
                Array.isArray(keranjang) ? keranjang.length : 0
            );
        } catch {
            perbaruiBadgeKeranjang(0);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();