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
            throw new Error('Respons API bukan JSON yang valid.');
        }

        if (
            !response.ok ||
            result.success === false ||
            result.status === 'error'
        ) {
            throw new Error(result.message || 'Gagal mengambil data API.');
        }

        return normalizeResponse(result);
    }

    function idKategori(item) {
        return String(firstValue(item, [
            'id_kategori',
            'kategori_id',
            'idKategori'
        ], ''));
    }

    function namaKategori(item) {
        return String(firstValue(item, [
            'nama_kategori',
            'kategori',
            'namaKategori'
        ], 'Peralatan Outdoor'));
    }

    function idPeralatan(item) {
        return String(firstValue(item, [
            'id_peralatan',
            'id_alat',
            'peralatan_id',
            'id'
        ], ''));
    }

    function namaPeralatan(item) {
        return String(firstValue(item, [
            'nama_peralatan',
            'nama_alat',
            'nama',
            'nama_barang'
        ], 'Peralatan Camping'));
    }

    function deskripsiPeralatan(item) {
        return String(firstValue(item, [
            'deskripsi',
            'keterangan',
            'detail'
        ], 'Peralatan outdoor untuk kegiatan camping.'));
    }

    function hargaPeralatan(item) {
        return Number(firstValue(item, [
            'harga_sewa',
            'harga',
            'harga_per_hari'
        ], 0)) || 0;
    }

    function stokPeralatan(item) {
        return Math.max(0, Number(firstValue(item, [
            'stok',
            'jumlah_stok',
            'stock'
        ], 0)) || 0);
    }

    function statusAktif(item) {
        const status = String(firstValue(item, ['status'], 'Aktif'))
            .trim()
            .toLowerCase();

        return ![
            'tidak aktif',
            'nonaktif',
            'non-aktif',
            'inactive',
            '0',
            'false',
            'deleted'
        ].includes(status);
    }

    function gambarPeralatan(item) {
        return String(firstValue(item, [
            'gambar',
            'foto',
            'image',
            'foto_peralatan',
            'gambar_peralatan'
        ], '')).trim() || FALLBACK_IMAGE;
    }

    function kategoriPeralatan(item) {
        const nama = firstValue(item, [
            'nama_kategori',
            'kategori',
            'kategori_peralatan'
        ], '');

        if (nama) {
            return typeof nama === 'object'
                ? namaKategori(nama)
                : String(nama);
        }

        const id = idKategori(item);
        const kategori = state.kategori.find(
            itemKategori => idKategori(itemKategori) === id
        );

        return kategori ? namaKategori(kategori) : 'Peralatan Outdoor';
    }

    function gridKatalog() {
        return el('equipmentGrid') ||
            el('katalogPeralatan') ||
            el('productGrid');
    }

    function containerKategori() {
        return el('filterCategoryContainer') ||
            el('categoryContainer') ||
            el('kategoriContainer');
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
            toast.className =
                'fixed bottom-5 right-5 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl';
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

    function bacaKeranjang() {
        try {
            const utama = JSON.parse(
                localStorage.getItem(CART_KEY) || 'null'
            );

            const alternatif = JSON.parse(
                localStorage.getItem(CART_KEY_ALT) || 'null'
            );

            const data = Array.isArray(utama)
                ? utama
                : Array.isArray(alternatif)
                    ? alternatif
                    : [];

            return data.map(item => {
                const jumlah = Math.max(1, Number(firstValue(item, [
                    'qty',
                    'jumlah',
                    'quantity'
                ], 1)) || 1);

                return {
                    ...item,
                    id_peralatan: String(firstValue(item, [
                        'id_peralatan',
                        'id_alat',
                        'peralatan_id',
                        'id'
                    ], '')),
                    nama_peralatan: String(firstValue(item, [
                        'nama_peralatan',
                        'nama_alat',
                        'nama',
                        'nama_barang'
                    ], 'Peralatan Camping')),
                    harga_sewa: Number(firstValue(item, [
                        'harga_sewa',
                        'harga',
                        'harga_per_hari'
                    ], 0)) || 0,
                    gambar: gambarPeralatan(item),
                    stok: Number(firstValue(item, [
                        'stok',
                        'jumlah_stok',
                        'stock'
                    ], 999)) || 999,
                    qty: jumlah,
                    jumlah: jumlah
                };
            });
        } catch (error) {
            console.error('Gagal membaca keranjang:', error);
            return [];
        }
    }

    function simpanKeranjang(data) {
        const keranjang = data.map(item => {
            const jumlah = Math.max(
                1,
                Number(item.qty ?? item.jumlah ?? 1) || 1
            );

            return {
                ...item,
                qty: jumlah,
                jumlah: jumlah
            };
        });

        localStorage.setItem(CART_KEY, JSON.stringify(keranjang));
        localStorage.setItem(CART_KEY_ALT, JSON.stringify(keranjang));

        updateCartBadge();
        renderKeranjang();
    }

    function jumlahItemKeranjang() {
        return bacaKeranjang().reduce((total, item) => {
            return total + Number(item.qty || 1);
        }, 0);
    }

    function updateCartBadge() {
        const badge = el('cartBadgeCount');
        if (!badge) return;

        const jumlah = jumlahItemKeranjang();

        badge.textContent = String(jumlah);
        badge.style.display = 'flex';
    }

    function renderKategori() {
        const container = containerKategori();
        if (!container) return;

        const daftar = [
            {
                id: 'all',
                nama: 'Semua Peralatan'
            },
            ...state.kategori.map(item => ({
                id: idKategori(item),
                nama: namaKategori(item)
            }))
        ];

        container.innerHTML = daftar.map(item => {
            const aktif =
                String(state.kategoriAktif) === String(item.id);

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

    function dataPeralatanTersaring() {
        let data = state.peralatan.filter(statusAktif);

        if (state.kategoriAktif !== 'all') {
            data = data.filter(item =>
                idKategori(item) === String(state.kategoriAktif)
            );
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
                            tersedia
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
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
                                <p class="text-[10px] font-semibold text-slate-400">
                                    Harga sewa
                                </p>

                                <p class="mt-0.5 text-base font-black text-sicamp-700">
                                    ${rupiah(harga)}
                                    <span class="text-[10px] font-medium text-slate-400">/hari</span>
                                </p>
                            </div>

                            <button
                                type="button"
                                class="home-rent-button rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                                    tersedia
                                        ? 'bg-sicamp-700 text-white hover:bg-sicamp-800'
                                        : 'cursor-not-allowed bg-slate-100 text-slate-400'
                                }"
                                data-rent-id="${escapeHTML(id)}"
                                ${tersedia ? '' : 'disabled'}>
                                <i class="fa-solid fa-basket-shopping mr-1"></i>
                                ${tersedia ? 'Tambah' : 'Habis'}
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    function tambahKeKeranjang(id) {
        const peralatan = state.peralatan.find(
            item => idPeralatan(item) === String(id)
        );

        if (!peralatan) {
            notifikasi('Data peralatan tidak ditemukan.', 'error');
            return;
        }

        if (!statusAktif(peralatan) || stokPeralatan(peralatan) <= 0) {
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
                notifikasi('Jumlah barang sudah mencapai batas stok.', 'error');
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
            namaPeralatan(peralatan) + ' berhasil ditambahkan ke keranjang.',
            'success'
        );
    }

    function renderKeranjang() {
        const container = el('cartItemsContainer');

        if (!container) return;

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
            <div
                class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3"
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
                        <button
                            type="button"
                            class="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                            data-cart-action="minus"
                            data-cart-index="${index}"
                            aria-label="Kurangi jumlah">
                            −
                        </button>

                        <span class="min-w-4 text-center text-xs font-bold">
                            ${item.qty}
                        </span>

                        <button
                            type="button"
                            class="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
                            data-cart-action="plus"
                            data-cart-index="${index}"
                            aria-label="Tambah jumlah">
                            +
                        </button>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-2">
                    <p class="text-xs font-bold text-slate-800">
                        ${rupiah(item.harga_sewa * item.qty)}
                    </p>

                    <button
                        type="button"
                        class="rounded-lg p-2 text-rose-500 hover:bg-rose-50"
                        data-cart-action="remove"
                        data-cart-index="${index}"
                        aria-label="Hapus barang">
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

            const selisih = Math.round(
                (kembali.getTime() - mulai.getTime()) /
                (1000 * 60 * 60 * 24)
            );

            durasi = selisih > 0 ? selisih : 1;
        }

        const total = keranjang.reduce((jumlah, item) => {
            return jumlah +
                (Number(item.harga_sewa) || 0) *
                (Number(item.qty) || 1) *
                durasi;
        }, 0);

        const totalElement = el('cartTotalHarga');

        if (totalElement) {
            totalElement.textContent = rupiah(total);
        }

        const durasiElement = el('checkoutRincianDurasi');

        if (durasiElement) {
            durasiElement.textContent = durasi + ' Hari';
        }

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

    function submitPesanan() {
        const bukti = el('checkoutBukti')?.files.length;

        if (!bukti) {
            notifikasi('Wajib mengunggah bukti transfer pembayaran.', 'error');
            return;
        }

        notifikasi('Pesanan Anda berhasil dikirim!', 'success');

        simpanKeranjang([]);

        if (typeof window.closeModalKeranjang === 'function') {
            window.closeModalKeranjang();
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

            tampilkanPesanKatalog(
                'Data peralatan gagal dimuat. Periksa API peralatan.',
                true
            );
        }
    }

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
        const halaman = window.location.pathname
            .split('/')
            .pop()
            .toLowerCase();

        if (halaman && halaman !== 'index.html') return;

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