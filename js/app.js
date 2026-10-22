"use strict";

const SICAMP_CONFIG = {
    api: {
        auth: "api/api_auth.php",
        kategori: "api/api_kategori.php",
        peralatan: "api/api_peralatan.php",
        penyewaan: "api/api_penyewaan.php"
    },
    logo: "assets/sicamp-logo.png",
    imageFallback:
        "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80"
};

let currentCheckoutStep = 1;
let currentCategoryFilter = "all";
let searchKeyword = "";

let filterPencarianAlat = "";
let filterKategoriAlat = "all";
let filterStokAlat = "all";
let filterUrutanAlat = "terbaru";

let halamanPeralatanAktif = 1;
let jumlahPeralatanPerHalaman = 5;

let dataKategori = [];
let dataPeralatan = [];
let dataPenyewaan = [];

let sidebarInitialized = false;

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getStoredArray(key) {
    try {
        const value = JSON.parse(localStorage.getItem(key));
        return Array.isArray(value) ? value : [];
    } catch (error) {
        console.warn(`Data localStorage "${key}" tidak valid.`, error);
        return [];
    }
}

function getSessionUser() {
    try {
        return (
            JSON.parse(localStorage.getItem("session_user")) ||
            JSON.parse(localStorage.getItem("user")) ||
            null
        );
    } catch (error) {
        return null;
    }
}

function getImageFallback() {
    return SICAMP_CONFIG.imageFallback;
}

function formatRupiah(value) {
    const nominal = Number(value) || 0;

    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(nominal);
}

function formatTanggal(value) {
    if (!value) return "-";

    const tanggal = new Date(value);

    if (Number.isNaN(tanggal.getTime())) {
        return escapeHTML(value);
    }

    return tanggal.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric"
    });
}

function getCurrentPage() {
    const page = window.location.pathname.split("/").pop().split("?")[0].split("#")[0];
    return page || "index.html";
}

function isAdminPage() {
    const adminPages = [
        "dashboard.html",
        "kelola-alat.html",
        "kelola-kategori.html",
        "verifikasi-pembayaran.html",
        "pengembalian.html"
    ];

    return adminPages.includes(getCurrentPage());
}

function showNotification(message, type = "info") {
    const existing = document.getElementById("sicampToast");

    if (existing) {
        existing.remove();
    }

    const toast = document.createElement("div");
    toast.id = "sicampToast";
    toast.className = `sicamp-toast sicamp-toast-${type}`;
    toast.setAttribute("role", "status");
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    window.setTimeout(() => {
        toast.classList.remove("show");

        window.setTimeout(() => {
            toast.remove();
        }, 250);
    }, 3000);
}

function logout() {
    const confirmed = window.confirm(
        "Apakah kamu yakin ingin keluar dari SiCamp Admin?"
    );

    if (!confirmed) return;

    localStorage.removeItem("session_user");
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    window.location.href = "login.html";
}

function ensureSidebarMount() {
    if (!isAdminPage()) return;

    let sidebar = document.getElementById("sidebarAdmin");

    if (!sidebar) {
        sidebar = document.createElement("aside");
        sidebar.id = "sidebarAdmin";
        sidebar.setAttribute("aria-label", "Navigasi administrator");

        const mainContent = document.querySelector("main");

        if (mainContent && mainContent.parentNode) {
            mainContent.parentNode.insertBefore(sidebar, mainContent);
        } else {
            document.body.prepend(sidebar);
        }
    }

    if (!document.getElementById("sidebarOverlay")) {
        const overlay = document.createElement("div");
        overlay.id = "sidebarOverlay";
        overlay.setAttribute("aria-hidden", "true");
        document.body.appendChild(overlay);
    }

    if (!document.getElementById("mobileSidebarBackdrop")) {
        const backdrop = document.createElement("div");
        backdrop.id = "mobileSidebarBackdrop";
        backdrop.setAttribute("aria-hidden", "true");
        document.body.appendChild(backdrop);
    }

    if (!document.getElementById("mobileSidebarToggle")) {
        const toggle = document.createElement("button");

        toggle.type = "button";
        toggle.id = "mobileSidebarToggle";
        toggle.className = "sicamp-mobile-toggle";
        toggle.setAttribute("aria-label", "Buka menu navigasi");
        toggle.setAttribute("aria-expanded", "false");
        toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';

        document.body.appendChild(toggle);
    }
}

function renderUserNavigation() {
    const sidebar = document.getElementById("sidebarAdmin");

    if (!sidebar || !isAdminPage()) return;

    const session = getSessionUser();
    const currentPage = getCurrentPage();

    const adminName =
        session?.nama_admin ||
        session?.nama ||
        session?.username ||
        "Administrator";

    const menuItems = [
        {
            label: "Dashboard Utama",
            href: "dashboard.html",
            icon: "fa-chart-pie",
            group: "UTAMA"
        },
        {
            label: "Kelola Alat",
            href: "kelola-alat.html",
            icon: "fa-boxes-stacked",
            group: "DATA MASTER"
        },
        {
            label: "Kelola Kategori",
            href: "kelola-kategori.html",
            icon: "fa-tags",
            group: "DATA MASTER"
        },
        {
            label: "Verifikasi Pembayaran",
            href: "verifikasi-pembayaran.html",
            icon: "fa-file-invoice-dollar",
            group: "TRANSAKSI"
        },
        {
            label: "Kelola Pengembalian",
            href: "pengembalian.html",
            icon: "fa-rotate-left",
            group: "TRANSAKSI"
        }
    ];

    let lastGroup = "";

    const menuHTML = menuItems.map((item) => {
        let groupHTML = "";

        if (item.group !== lastGroup) {
            groupHTML = `
                <li class="sicamp-menu-group">
                    ${escapeHTML(item.group)}
                </li>
            `;

            lastGroup = item.group;
        }

        const active = currentPage === item.href;

        return `
            ${groupHTML}
            <li class="sicamp-menu-item">
                <a
                    href="${item.href}"
                    class="sicamp-menu-link ${active ? "active" : ""}"
                    ${active ? 'aria-current="page"' : ""}
                    title="${escapeHTML(item.label)}"
                >
                    <span class="sicamp-menu-icon">
                        <i class="fa-solid ${item.icon}"></i>
                    </span>

                    <span class="sicamp-menu-label">
                        ${escapeHTML(item.label)}
                    </span>
                </a>
            </li>
        `;
    }).join("");

    sidebar.innerHTML = `
        <div class="sicamp-sidebar-inner">

            <div class="sicamp-brand">
                <a href="dashboard.html" class="sicamp-brand-link">
                    <img
                        src="${SICAMP_CONFIG.logo}"
                        alt="Logo SiCamp"
                        class="sicamp-brand-logo"
                        onerror="this.style.display='none'"
                    >
                </a>

                <button
                    type="button"
                    id="sidebarCollapseButton"
                    class="sicamp-collapse-button"
                    aria-label="Ciutkan sidebar"
                    title="Ciutkan sidebar"
                >
                    <i class="fa-solid fa-angles-left"></i>
                </button>
            </div>

            <div class="sicamp-profile">
                <div class="sicamp-profile-avatar">
                    <i class="fa-solid fa-user-shield"></i>
                </div>

                <div class="sicamp-profile-info">
                    <strong>${escapeHTML(adminName)}</strong>
                    <span>Administrator</span>
                </div>

                <span class="sicamp-online-indicator"></span>
            </div>

            <nav class="sicamp-navigation" aria-label="Menu utama">
                <ul class="sicamp-menu-list">
                    ${menuHTML}
                </ul>
            </nav>

            <div class="sicamp-sidebar-footer">
                <div class="sicamp-footer-status">
                    <span class="sicamp-status-dot"></span>
                    <span class="sicamp-footer-label">Sistem aktif</span>
                </div>

                <button
                    type="button"
                    id="sidebarLogoutButton"
                    class="sicamp-logout-button"
                    title="Logout"
                >
                    <i class="fa-solid fa-right-from-bracket"></i>
                    <span class="sicamp-menu-label">Logout</span>
                </button>

                <div class="sicamp-footer-version">
                    SiCamp Admin Control
                </div>
            </div>

        </div>
    `;

    const logoutButton = document.getElementById("sidebarLogoutButton");
    logoutButton?.addEventListener("click", logout);

    const collapseButton = document.getElementById("sidebarCollapseButton");
    collapseButton?.addEventListener("click", toggleSidebarCollapse);
}

function toggleSidebarCollapse() {
    if (window.matchMedia("(max-width: 900px)").matches) {
        closeMobileSidebar();
        return;
    }

    document.body.classList.toggle("sicamp-sidebar-collapsed");

    const collapsed = document.body.classList.contains("sicamp-sidebar-collapsed");

    localStorage.setItem("sicamp_sidebar_collapsed", collapsed ? "true" : "false");

    const button = document.getElementById("sidebarCollapseButton");

    if (button) {
        button.setAttribute("aria-label", collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar");
        button.title = collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar";
        button.innerHTML = collapsed
            ? '<i class="fa-solid fa-angles-right"></i>'
            : '<i class="fa-solid fa-angles-left"></i>';
    }
}

function openMobileSidebar() {
    document.body.classList.add("sicamp-mobile-sidebar-open");

    const toggle = document.getElementById("mobileSidebarToggle");

    if (toggle) {
        toggle.setAttribute("aria-expanded", "true");
        toggle.setAttribute("aria-label", "Tutup menu navigasi");
        toggle.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    }
}

function closeMobileSidebar() {
    document.body.classList.remove("sicamp-mobile-sidebar-open");

    const toggle = document.getElementById("mobileSidebarToggle");

    if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Buka menu navigasi");
        toggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }
}

function initializeSharedSidebarControls() {
    if (sidebarInitialized) return;
    sidebarInitialized = true;

    const toggle = document.getElementById("mobileSidebarToggle");
    const backdrop = document.getElementById("mobileSidebarBackdrop");

    toggle?.addEventListener("click", () => {
        const isOpen = document.body.classList.contains("sicamp-mobile-sidebar-open");
        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }
    });

    backdrop?.addEventListener("click", closeMobileSidebar);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMobileSidebar();
        }
    });

    document.querySelectorAll("#sidebarAdmin a").forEach((link) => {
        link.addEventListener("click", () => {
            if (window.matchMedia("(max-width: 900px)").matches) {
                closeMobileSidebar();
            }
        });
    });

    try {
        const collapsed = localStorage.getItem("sicamp_sidebar_collapsed") === "true";

        if (collapsed && !window.matchMedia("(max-width: 900px)").matches) {
            document.body.classList.add("sicamp-sidebar-collapsed");

            const button = document.getElementById("sidebarCollapseButton");

            if (button) {
                button.setAttribute("aria-label", "Lebarkan sidebar");
                button.title = "Lebarkan sidebar";
                button.innerHTML = '<i class="fa-solid fa-angles-right"></i>';
            }
        }
    } catch (error) {
        console.warn("Preferensi sidebar tidak dapat dibaca.", error);
    }

    window.addEventListener("resize", () => {
        if (!window.matchMedia("(max-width: 900px)").matches) {
            closeMobileSidebar();
        }
    });
}

async function requestAPI(url, options = {}) {
    const defaultHeaders = { Accept: "application/json" };

    const config = {
        method: options.method || "GET",
        headers: {
            ...defaultHeaders,
            ...(options.headers || {})
        }
    };

    if (options.body !== undefined) {
        if (options.body instanceof FormData) {
            config.body = options.body;
        } else if (typeof options.body === "string") {
            config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
            config.body = options.body;
        } else {
            config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";
            config.body = JSON.stringify(options.body);
        }
    }

    const response = await fetch(url, config);
    const responseText = await response.text();

    let result;

    try {
        result = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
        throw new Error("Respons server bukan JSON yang valid. Periksa file API PHP.");
    }

    if (!response.ok) {
        throw new Error(
            result.message || result.pesan || `Permintaan gagal dengan status ${response.status}.`
        );
    }

    if (result && result.success === false) {
        throw new Error(result.message || result.pesan || "Permintaan tidak berhasil.");
    }

    return result;
}

async function loadKategoriFromDB() {
    try {
        const result = await requestAPI(SICAMP_CONFIG.api.kategori);
        const kategori = Array.isArray(result) ? result : (result.data || result.kategori || result.result || []);
        dataKategori = Array.isArray(kategori) ? kategori : [];

        try {
            localStorage.setItem("kategori", JSON.stringify(dataKategori));
        } catch (error) {
            console.warn("Kategori tidak dapat disimpan ke cache.", error);
        }

        if (typeof renderKategori === "function") renderKategori(dataKategori);
        if (typeof renderKategoriTable === "function") renderKategoriTable(dataKategori);

        return dataKategori;
    } catch (error) {
        console.error("Gagal memuat kategori:", error);
        dataKategori = getStoredArray("kategori");
        return dataKategori;
    }
}

async function loadPeralatanFromDB() {
    try {
        const result = await requestAPI(SICAMP_CONFIG.api.peralatan);
        const peralatan = Array.isArray(result) ? result : (result.data || result.peralatan || result.result || []);
        dataPeralatan = Array.isArray(peralatan) ? peralatan : [];

        try {
            localStorage.setItem("peralatan", JSON.stringify(dataPeralatan));
        } catch (error) {
            console.warn("Cache peralatan tidak dapat disimpan.", error);
        }

        if (typeof renderPeralatan === "function") renderPeralatan(dataPeralatan);
        if (typeof renderPeralatanTable === "function") renderPeralatanTable(dataPeralatan);
        if (typeof renderDashboard === "function") renderDashboard();

        return dataPeralatan;
    } catch (error) {
        console.error("Gagal memuat peralatan:", error);
        dataPeralatan = getStoredArray("peralatan");
        return dataPeralatan;
    }
}

async function loadVerifikasiPembayaran() {
    try {
        const result = await requestAPI(SICAMP_CONFIG.api.penyewaan);
        const penyewaan = Array.isArray(result) ? result : (result.data || result.penyewaan || result.result || []);
        dataPenyewaan = Array.isArray(penyewaan) ? penyewaan : [];

        renderVerifikasiTable(dataPenyewaan);
        return dataPenyewaan;
    } catch (error) {
        console.error("Gagal memuat data verifikasi pembayaran:", error);
        dataPenyewaan = getStoredArray("penyewaan");
        renderVerifikasiTable(dataPenyewaan);
        return dataPenyewaan;
    }
}

function renderVerifikasiTable(data) {
    const tbody = document.getElementById("tbodyVerifikasi") || document.querySelector("table tbody");
    if (!tbody || getCurrentPage() !== "verifikasi-pembayaran.html") return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #94a3b8; padding: 24px;">
                    Belum ada data pembayaran yang perlu diverifikasi.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map((item) => {
        const statusClean = String(item.status || "").toLowerCase().trim();
        const isMenunggu = statusClean === "menunggu verifikasi" || statusClean === "menunggu";

        return `
            <tr>
                <td>
                    <strong>${escapeHTML(item.kode_transaksi || item.kode || '-')}</strong>
                    <br><small style="color: #94a3b8;">ID: ${item.id || item.id_penyewaan}</small>
                </td>
                <td>${escapeHTML(item.nama_pelanggan || item.pelanggan || "Pelanggan")}</td>
                <td>${formatTanggal(item.tanggal_sewa || item.created_at)}</td>
                <td><strong>${formatRupiah(item.total_pembayaran || item.total)}</strong></td>
                <td>
                    <span class="badge ${isMenunggu ? 'badge-stok-habis' : 'badge-stok-tersedia'}">
                        ${escapeHTML(item.status || 'Proses')}
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <button 
                            type="button" 
                            class="action-btn detail" 
                            onclick="lihatDetailPembayaran('${item.id || item.id_penyewaan}')" 
                            title="Lihat Detail & Bukti"
                        >
                            <i class="fa-solid fa-eye"></i>
                        </button>

                        ${isMenunggu ? `
                            <button 
                                type="button" 
                                class="action-btn approve" 
                                onclick="setujuiPembayaran('${item.id || item.id_penyewaan}')" 
                                title="Setujui Pembayaran"
                            >
                                <i class="fa-solid fa-check"></i>
                            </button>
                            <button 
                                type="button" 
                                class="action-btn reject" 
                                onclick="tolakPembayaran('${item.id || item.id_penyewaan}')" 
                                title="Tolak Pembayaran"
                            >
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

async function setujuiPembayaran(id) {
    if (!confirm("Apakah Anda yakin ingin menyetujui pembayaran ini?")) return;

    try {
        await requestAPI(SICAMP_CONFIG.api.penyewaan, {
            method: "POST",
            body: { action: "verify", id: id, status: "Terverifikasi" }
        });
        showNotification("Pembayaran berhasil disetujui!", "success");
        loadVerifikasiPembayaran();
    } catch (error) {
        showNotification(error.message || "Gagal menyetujui pembayaran", "error");
    }
}

async function tolakPembayaran(id) {
    const alasan = prompt("Masukkan alasan penolakan pembayaran:");
    if (alasan === null) return;

    try {
        await requestAPI(SICAMP_CONFIG.api.penyewaan, {
            method: "POST",
            body: { action: "reject", id: id, catatan: alasan, status: "Ditolak" }
        });
        showNotification("Pembayaran telah ditolak", "warning");
        loadVerifikasiPembayaran();
    } catch (error) {
        showNotification(error.message || "Gagal menolak pembayaran", "error");
    }
}

function lihatDetailPembayaran(id) {
    showNotification(`Membuka detail transaksi #${id}...`, "info");
}

function getPeralatanId(item) {
    return item?.id_peralatan ?? item?.id ?? item?.id_alat ?? null;
}

function getKategoriId(item) {
    return item?.id_kategori ?? item?.kategori_id ?? item?.id ?? null;
}

function getPeralatanName(item) {
    return item?.nama_peralatan || item?.nama_alat || item?.nama || "Peralatan tanpa nama";
}

function getPeralatanStock(item) {
    return Number(item?.stok ?? item?.jumlah_stok ?? item?.stock ?? 0);
}

function getPeralatanPrice(item) {
    return Number(item?.harga_sewa ?? item?.harga ?? item?.harga_per_hari ?? 0);
}

function getKategoriName(item) {
    return item?.nama_kategori || item?.kategori || "Tanpa kategori";
}

function filterDataPeralatan(data = dataPeralatan) {
    let hasil = [...data];

    const keyword = String(filterPencarianAlat || searchKeyword || "").trim().toLowerCase();

    if (keyword) {
        hasil = hasil.filter((item) => {
            const nama = getPeralatanName(item).toLowerCase();
            const kategori = getKategoriName(item).toLowerCase();
            const deskripsi = String(item?.deskripsi || "").toLowerCase();

            return (
                nama.includes(keyword) ||
                kategori.includes(keyword) ||
                deskripsi.includes(keyword)
            );
        });
    }

    if (filterKategoriAlat !== "all") {
        hasil = hasil.filter((item) => {
            return String(getKategoriId(item)) === String(filterKategoriAlat);
        });
    }

    if (filterStokAlat === "tersedia") {
        hasil = hasil.filter((item) => getPeralatanStock(item) > 0);
    }

    if (filterStokAlat === "habis") {
        hasil = hasil.filter((item) => getPeralatanStock(item) <= 0);
    }

    if (filterUrutanAlat === "nama_asc") {
        hasil.sort((a, b) => getPeralatanName(a).localeCompare(getPeralatanName(b), "id"));
    } else if (filterUrutanAlat === "nama_desc") {
        hasil.sort((a, b) => getPeralatanName(b).localeCompare(getPeralatanName(a), "id"));
    } else if (filterUrutanAlat === "harga_asc") {
        hasil.sort((a, b) => getPeralatanPrice(a) - getPeralatanPrice(b));
    } else if (filterUrutanAlat === "harga_desc") {
        hasil.sort((a, b) => getPeralatanPrice(b) - getPeralatanPrice(a));
    } else if (filterUrutanAlat === "stok_asc") {
        hasil.sort((a, b) => getPeralatanStock(a) - getPeralatanStock(b));
    } else if (filterUrutanAlat === "stok_desc") {
        hasil.sort((a, b) => getPeralatanStock(b) - getPeralatanStock(a));
    }

    return hasil;
}

function resetFilterPeralatan() {
    filterPencarianAlat = "";
    filterKategoriAlat = "all";
    filterStokAlat = "all";
    filterUrutanAlat = "terbaru";
    halamanPeralatanAktif = 1;

    const searchInput = document.getElementById("searchAlat");
    const categorySelect = document.getElementById("filterKategori");
    const stockSelect = document.getElementById("filterStok");
    const sortSelect = document.getElementById("filterUrutan");

    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "all";
    if (stockSelect) stockSelect.value = "all";
    if (sortSelect) sortSelect.value = "terbaru";

    if (typeof renderPeralatan === "function") {
        renderPeralatan(filterDataPeralatan());
    }
}

function initializePeralatanFilters() {
    const searchInput = document.getElementById("searchAlat");
    const categorySelect = document.getElementById("filterKategori");
    const stockSelect = document.getElementById("filterStok");
    const sortSelect = document.getElementById("filterUrutan");

    searchInput?.addEventListener("input", (event) => {
        filterPencarianAlat = event.target.value;
        halamanPeralatanAktif = 1;
        if (typeof renderPeralatan === "function") {
            renderPeralatan(filterDataPeralatan());
        }
    });

    categorySelect?.addEventListener("change", (event) => {
        filterKategoriAlat = event.target.value;
        halamanPeralatanAktif = 1;
        if (typeof renderPeralatan === "function") {
            renderPeralatan(filterDataPeralatan());
        }
    });

    stockSelect?.addEventListener("change", (event) => {
        filterStokAlat = event.target.value;
        halamanPeralatanAktif = 1;
        if (typeof renderPeralatan === "function") {
            renderPeralatan(filterDataPeralatan());
        }
    });

    sortSelect?.addEventListener("change", (event) => {
        filterUrutanAlat = event.target.value;
        halamanPeralatanAktif = 1;
        if (typeof renderPeralatan === "function") {
            renderPeralatan(filterDataPeralatan());
        }
    });
}

function initializeCustomerNavigation() {
    const navPelanggan = document.getElementById("navPelanggan");
    const userIndicator = document.getElementById("userIndicator");

    if (!navPelanggan && !userIndicator) return;

    const session = getSessionUser();

    if (userIndicator) {
        if (session) {
            const nama = session.nama_pelanggan || session.nama || session.username || "Pelanggan";
            userIndicator.textContent = nama;
        } else {
            userIndicator.textContent = "Pengunjung";
        }
    }

    if (navPelanggan) {
        navPelanggan.innerHTML = `
            <a href="index.html">Beranda</a>
            <a href="riwayat-sewa.html">Riwayat Sewa</a>
            ${
                session
                    ? `<button type="button" id="customerLogoutButton" class="sicamp-customer-logout">Keluar</button>`
                    : `<a href="login.html">Masuk</a>`
            }
        `;

        document.getElementById("customerLogoutButton")?.addEventListener("click", logout);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    initializeCustomerNavigation();

    if (!isAdminPage()) return;

    ensureSidebarMount();
    renderUserNavigation();
    initializeSharedSidebarControls();
    initializePeralatanFilters();

    const tasks = [loadKategoriFromDB(), loadPeralatanFromDB()];
    if (getCurrentPage() === "verifikasi-pembayaran.html") {
        tasks.push(loadVerifikasiPembayaran());
    }

    await Promise.allSettled(tasks);
});

window.escapeHTML = escapeHTML;
window.getStoredArray = getStoredArray;
window.getSessionUser = getSessionUser;
window.getImageFallback = getImageFallback;

window.formatRupiah = formatRupiah;
window.formatTanggal = formatTanggal;
window.showNotification = showNotification;

window.logout = logout;

window.ensureSidebarMount = ensureSidebarMount;
window.renderUserNavigation = renderUserNavigation;
window.initializeSharedSidebarControls = initializeSharedSidebarControls;

window.requestAPI = requestAPI;
window.loadKategoriFromDB = loadKategoriFromDB;
window.loadPeralatanFromDB = loadPeralatanFromDB;
window.loadVerifikasiPembayaran = loadVerifikasiPembayaran;
window.renderVerifikasiTable = renderVerifikasiTable;
window.setujuiPembayaran = setujuiPembayaran;
window.tolakPembayaran = tolakPembayaran;
window.lihatDetailPembayaran = lihatDetailPembayaran;

window.filterDataPeralatan = filterDataPeralatan;
window.resetFilterPeralatan = resetFilterPeralatan;

window.getPeralatanId = getPeralatanId;
window.getKategoriId = getKategoriId;
window.getPeralatanName = getPeralatanName;
window.getPeralatanStock = getPeralatanStock;
window.getPeralatanPrice = getPeralatanPrice;
window.getKategoriName = getKategoriName;