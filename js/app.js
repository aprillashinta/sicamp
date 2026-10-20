/* =========================================================
   SICAMP ADMIN CONTROL
   File: js/app.js
   Shared sidebar, navigation, helpers, and API utilities
   ========================================================= */

"use strict";

/* =========================================================
   1. KONFIGURASI DAN STATE
   ========================================================= */

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

let sidebarInitialized = false;

/* =========================================================
   2. HELPER UMUM
   ========================================================= */

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
    return window.location.pathname.split("/").pop() || "index.html";
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

/* =========================================================
   3. LOGOUT
   ========================================================= */

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

/* =========================================================
   4. STRUKTUR SIDEBAR TERPUSAT
   Sidebar dibuat otomatis oleh app.js.
   HTML halaman cukup berisi konten utama.
   ========================================================= */

function ensureSidebarMount() {
    if (!isAdminPage()) return;

    let sidebar = document.getElementById("sidebarAdmin");

    if (!sidebar) {
        sidebar = document.createElement("aside");
        sidebar.id = "sidebarAdmin";
        sidebar.setAttribute("aria-label", "Navigasi administrator");

        const mainContent = document.querySelector("main");

        if (mainContent && mainContent.parentNode) {
            mainContent.parentNode.insertBefore(
                sidebar,
                mainContent
            );
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

/* =========================================================
   5. MENU ADMIN
   ========================================================= */

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

                    <span class="sicamp-brand-text">
                        <strong>SiCamp</strong>
                        <small>ADMIN CONTROL</small>
                    </span>
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

    const logoutButton = document.getElementById(
        "sidebarLogoutButton"
    );

    logoutButton?.addEventListener("click", logout);

    const collapseButton = document.getElementById(
        "sidebarCollapseButton"
    );

    collapseButton?.addEventListener("click", toggleSidebarCollapse);
}

/* =========================================================
   6. CSS SIDEBAR DAN TEMA
   ========================================================= */

function installSharedSidebarStyles() {
    if (document.getElementById("sicampSharedSidebarStyles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "sicampSharedSidebarStyles";

    style.textContent = `
        :root {
            --sicamp-sidebar-width: 264px;
            --sicamp-sidebar-collapsed: 82px;

            --sicamp-forest-950: #071713;
            --sicamp-forest-900: #0a1f18;
            --sicamp-forest-800: #102b20;
            --sicamp-forest-700: #183b2a;

            --sicamp-lime: #c3f45b;
            --sicamp-lime-hover: #d4ff7b;
            --sicamp-green: #2bd982;

            --sicamp-cream: #f7f7ef;
            --sicamp-white: #ffffff;
            --sicamp-text: #17251d;
            --sicamp-muted: #8b9b91;

            --sicamp-sidebar-radius: 18px;
            --sicamp-sidebar-transition: 220ms ease;
        }

        body {
            min-height: 100vh;
        }

        #sidebarAdmin {
            position: fixed;
            inset: 12px auto 12px 12px;
            z-index: 1000;

            width: var(--sicamp-sidebar-width);
            height: auto;

            overflow: hidden;
            color: #f4f7ef;

            background:
                radial-gradient(
                    circle at 10% 0%,
                    rgba(195, 244, 91, .09),
                    transparent 32%
                ),
                linear-gradient(
                    160deg,
                    var(--sicamp-forest-900),
                    var(--sicamp-forest-950)
                );

            border: 1px solid rgba(255, 255, 255, .07);
            border-radius: var(--sicamp-sidebar-radius);

            box-shadow: 0 16px 40px rgba(6, 23, 17, .18);

            transition:
                width var(--sicamp-sidebar-transition),
                transform var(--sicamp-sidebar-transition);
        }

        .sicamp-sidebar-inner {
            display: flex;
            flex-direction: column;
            width: 100%;
            height: 100%;
            min-height: 0;
        }

        .sicamp-brand {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;

            min-height: 88px;
            padding: 16px 14px;

            border-bottom: 1px solid rgba(255, 255, 255, .07);
        }

        .sicamp-brand-link {
            display: flex;
            align-items: center;
            gap: 11px;

            min-width: 0;
            color: inherit;
            text-decoration: none;
        }

        .sicamp-brand-logo {
            display: block;
            flex: 0 0 auto;

            width: 44px;
            height: 44px;

            object-fit: contain;
            border-radius: 12px;
        }

        .sicamp-brand-text {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
        }

        .sicamp-brand-text strong {
            color: #ffffff;
            font-size: 20px;
            line-height: 1.1;
            font-weight: 800;
            letter-spacing: -.6px;
        }

        .sicamp-brand-text small {
            color: var(--sicamp-lime);
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.6px;
            white-space: nowrap;
        }

        .sicamp-collapse-button {
            display: grid;
            place-items: center;
            flex: 0 0 auto;

            width: 30px;
            height: 30px;

            color: #d9e6d9;
            background: rgba(255, 255, 255, .06);
            border: 1px solid rgba(255, 255, 255, .08);
            border-radius: 9px;

            cursor: pointer;
            transition: background .2s ease, color .2s ease;
        }

        .sicamp-collapse-button:hover {
            color: var(--sicamp-forest-950);
            background: var(--sicamp-lime);
        }

        .sicamp-profile {
            display: flex;
            align-items: center;
            gap: 10px;

            margin: 14px 12px 8px;
            padding: 12px;

            background: rgba(255, 255, 255, .045);
            border: 1px solid rgba(255, 255, 255, .065);
            border-radius: 13px;
        }

        .sicamp-profile-avatar {
            display: grid;
            place-items: center;
            flex: 0 0 auto;

            width: 38px;
            height: 38px;

            color: var(--sicamp-forest-950);
            background: var(--sicamp-lime);
            border-radius: 12px;
        }

        .sicamp-profile-info {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 4px;
            min-width: 0;
        }

        .sicamp-profile-info strong {
            overflow: hidden;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .sicamp-profile-info span {
            color: #9aac9f;
            font-size: 10px;
        }

        .sicamp-online-indicator,
        .sicamp-status-dot {
            flex: 0 0 auto;
            width: 7px;
            height: 7px;
            background: var(--sicamp-green);
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(43, 217, 130, .10);
        }

        .sicamp-navigation {
            flex: 1;
            min-height: 0;
            overflow-x: hidden;
            overflow-y: auto;
            padding: 8px 12px 16px;
        }

        .sicamp-navigation::-webkit-scrollbar {
            width: 4px;
        }

        .sicamp-navigation::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, .16);
            border-radius: 8px;
        }

        .sicamp-menu-list {
            display: flex;
            flex-direction: column;
            gap: 5px;

            margin: 0;
            padding: 0;
            list-style: none;
        }

        .sicamp-menu-group {
            padding: 16px 10px 7px;

            color: #748a7b;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 1.5px;
        }

        .sicamp-menu-link {
            position: relative;

            display: flex;
            align-items: center;
            gap: 12px;

            min-height: 44px;
            padding: 10px 12px;

            color: #bdcec1;
            text-decoration: none;

            font-size: 12px;
            font-weight: 600;

            border: 1px solid transparent;
            border-radius: 11px;

            transition:
                color .18s ease,
                background .18s ease,
                border-color .18s ease;
        }

        .sicamp-menu-link:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, .055);
        }

        .sicamp-menu-link.active {
            color: var(--sicamp-lime);
            background: rgba(195, 244, 91, .105);
            border-color: rgba(195, 244, 91, .13);
        }

        .sicamp-menu-link.active::before {
            position: absolute;
            top: 9px;
            bottom: 9px;
            left: -1px;

            width: 3px;
            content: "";

            background: var(--sicamp-lime);
            border-radius: 0 5px 5px 0;
        }

        .sicamp-menu-icon {
            display: grid;
            place-items: center;
            flex: 0 0 auto;

            width: 20px;
            font-size: 15px;
        }

        .sicamp-menu-label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .sicamp-sidebar-footer {
            flex: 0 0 auto;
            padding: 12px;

            border-top: 1px solid rgba(255, 255, 255, .07);
        }

        .sicamp-footer-status {
            display: flex;
            align-items: center;
            gap: 9px;

            padding: 8px 9px 13px;

            color: #a4b8a9;
            font-size: 10px;
        }

        .sicamp-footer-status .sicamp-status-dot {
            width: 6px;
            height: 6px;
        }

        .sicamp-logout-button {
            display: flex;
            align-items: center;
            gap: 12px;

            width: 100%;
            min-height: 42px;
            padding: 10px 12px;

            color: #ffb4ad;
            background: rgba(255, 105, 95, .07);
            border: 1px solid rgba(255, 105, 95, .10);
            border-radius: 11px;

            font-size: 12px;
            font-weight: 700;
            text-align: left;

            cursor: pointer;
            transition: background .2s ease;
        }

        .sicamp-logout-button:hover {
            background: rgba(255, 105, 95, .15);
        }

        .sicamp-logout-button > i {
            width: 20px;
            text-align: center;
        }

        .sicamp-footer-version {
            padding-top: 13px;
            color: #607669;
            font-size: 9px;
            text-align: center;
        }

        /* Konten bergeser mengikuti lebar sidebar */
        body.sicamp-admin-layout {
            padding-left: calc(var(--sicamp-sidebar-width) + 24px);
        }

        body.sicamp-admin-layout main {
            min-width: 0;
        }

        body.sicamp-sidebar-collapsed #sidebarAdmin {
            width: var(--sicamp-sidebar-collapsed);
        }

        body.sicamp-sidebar-collapsed {
            padding-left: calc(var(--sicamp-sidebar-collapsed) + 24px);
        }

        body.sicamp-sidebar-collapsed .sicamp-brand {
            justify-content: center;
            padding: 14px 8px;
        }

        body.sicamp-sidebar-collapsed .sicamp-brand-link {
            justify-content: center;
        }

        body.sicamp-sidebar-collapsed .sicamp-brand-logo {
            width: 42px;
            height: 42px;
        }

        body.sicamp-sidebar-collapsed .sicamp-brand-text,
        body.sicamp-sidebar-collapsed .sicamp-collapse-button,
        body.sicamp-sidebar-collapsed .sicamp-profile-info,
        body.sicamp-sidebar-collapsed .sicamp-profile .sicamp-online-indicator,
        body.sicamp-sidebar-collapsed .sicamp-menu-label,
        body.sicamp-sidebar-collapsed .sicamp-menu-group,
        body.sicamp-sidebar-collapsed .sicamp-footer-status,
        body.sicamp-sidebar-collapsed .sicamp-footer-version {
            display: none;
        }

        body.sicamp-sidebar-collapsed .sicamp-profile {
            justify-content: center;
            margin: 14px 8px;
            padding: 8px 4px;
        }

        body.sicamp-sidebar-collapsed .sicamp-navigation {
            padding-right: 8px;
            padding-left: 8px;
        }

        body.sicamp-sidebar-collapsed .sicamp-menu-link,
        body.sicamp-sidebar-collapsed .sicamp-logout-button {
            justify-content: center;
            padding-right: 5px;
            padding-left: 5px;
        }

        body.sicamp-sidebar-collapsed .sicamp-menu-icon,
        body.sicamp-sidebar-collapsed .sicamp-logout-button > i {
            width: 100%;
        }

        body.sicamp-sidebar-collapsed .sicamp-menu-link.active::before {
            left: -8px;
        }

        #sidebarOverlay {
            display: none;
        }

        .sicamp-mobile-toggle {
            display: none;
            position: fixed;
            top: 16px;
            left: 16px;
            z-index: 1100;

            width: 44px;
            height: 44px;

            color: var(--sicamp-lime);
            background: var(--sicamp-forest-900);
            border: 1px solid rgba(195, 244, 91, .25);
            border-radius: 12px;

            box-shadow: 0 8px 22px rgba(0, 0, 0, .15);
            cursor: pointer;
        }

        #mobileSidebarBackdrop {
            display: none;
        }

        .sicamp-toast {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 9999;

            max-width: min(420px, calc(100vw - 32px));
            padding: 14px 18px;

            color: #ffffff;
            background: var(--sicamp-forest-900);
            border: 1px solid rgba(195, 244, 91, .3);
            border-radius: 12px;

            box-shadow: 0 12px 32px rgba(0, 0, 0, .18);

            opacity: 0;
            transform: translateY(8px);
            transition: opacity .2s ease, transform .2s ease;
        }

        .sicamp-toast.show {
            opacity: 1;
            transform: translateY(0);
        }

        .sicamp-toast-success {
            border-color: rgba(43, 217, 130, .5);
        }

        .sicamp-toast-error {
            border-color: rgba(255, 105, 95, .5);
        }

        .sicamp-toast-warning {
            border-color: rgba(255, 193, 7, .5);
        }

        @media (max-width: 900px) {
            body.sicamp-admin-layout,
            body.sicamp-sidebar-collapsed {
                padding-left: 0;
            }

            #sidebarAdmin {
                width: min(290px, calc(100vw - 56px));
                inset: 0 auto 0 0;

                border-radius: 0 18px 18px 0;
                transform: translateX(-105%);
            }

            body.sicamp-mobile-sidebar-open #sidebarAdmin {
                transform: translateX(0);
            }

            body.sicamp-sidebar-collapsed #sidebarAdmin {
                width: min(290px, calc(100vw - 56px));
            }

            body.sicamp-sidebar-collapsed .sicamp-brand {
                justify-content: space-between;
                padding: 16px 14px;
            }

            body.sicamp-sidebar-collapsed .sicamp-brand-text,
            body.sicamp-sidebar-collapsed .sicamp-collapse-button,
            body.sicamp-sidebar-collapsed .sicamp-profile-info,
            body.sicamp-sidebar-collapsed .sicamp-profile .sicamp-online-indicator,
            body.sicamp-sidebar-collapsed .sicamp-menu-label,
            body.sicamp-sidebar-collapsed .sicamp-menu-group,
            body.sicamp-sidebar-collapsed .sicamp-footer-status,
            body.sicamp-sidebar-collapsed .sicamp-footer-version {
                display: initial;
            }

            body.sicamp-sidebar-collapsed .sicamp-brand-text,
            body.sicamp-sidebar-collapsed .sicamp-profile-info {
                display: flex;
            }

            body.sicamp-sidebar-collapsed .sicamp-collapse-button {
                display: grid;
            }

            body.sicamp-sidebar-collapsed .sicamp-menu-group {
                display: block;
            }

            body.sicamp-sidebar-collapsed .sicamp-profile {
                justify-content: flex-start;
                margin: 14px 12px 8px;
                padding: 12px;
            }

            body.sicamp-sidebar-collapsed .sicamp-navigation {
                padding: 8px 12px 16px;
            }

            body.sicamp-sidebar-collapsed .sicamp-menu-link,
            body.sicamp-sidebar-collapsed .sicamp-logout-button {
                justify-content: flex-start;
                padding: 10px 12px;
            }

            body.sicamp-sidebar-collapsed .sicamp-menu-icon,
            body.sicamp-sidebar-collapsed .sicamp-logout-button > i {
                width: 20px;
            }

            .sicamp-mobile-toggle {
                display: grid;
                place-items: center;
            }

            #mobileSidebarBackdrop {
                position: fixed;
                inset: 0;
                z-index: 900;

                background: rgba(4, 16, 11, .55);
                backdrop-filter: blur(3px);
            }

            body.sicamp-mobile-sidebar-open #mobileSidebarBackdrop {
                display: block;
            }

            body.sicamp-mobile-sidebar-open {
                overflow: hidden;
            }

            body.sicamp-mobile-sidebar-open .sicamp-mobile-toggle {
                left: min(300px, calc(100vw - 50px));
            }

            body.sicamp-admin-layout main {
                padding-top: 66px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            #sidebarAdmin,
            .sicamp-menu-link,
            .sicamp-toast,
            .sicamp-mobile-toggle {
                transition: none !important;
            }
        }
    `;

    document.head.appendChild(style);
}

/* =========================================================
   7. COLLAPSE DAN RESPONSIVE SIDEBAR
   ========================================================= */

function toggleSidebarCollapse() {
    if (window.matchMedia("(max-width: 900px)").matches) {
        closeMobileSidebar();
        return;
    }

    document.body.classList.toggle("sicamp-sidebar-collapsed");

    const collapsed = document.body.classList.contains(
        "sicamp-sidebar-collapsed"
    );

    localStorage.setItem(
        "sicamp_sidebar_collapsed",
        collapsed ? "true" : "false"
    );

    const button = document.getElementById("sidebarCollapseButton");

    if (button) {
        button.setAttribute(
            "aria-label",
            collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"
        );

        button.title = collapsed
            ? "Lebarkan sidebar"
            : "Ciutkan sidebar";

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
        const isOpen = document.body.classList.contains(
            "sicamp-mobile-sidebar-open"
        );

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
        const collapsed =
            localStorage.getItem("sicamp_sidebar_collapsed") === "true";

        if (
            collapsed &&
            !window.matchMedia("(max-width: 900px)").matches
        ) {
            document.body.classList.add("sicamp-sidebar-collapsed");

            const button = document.getElementById(
                "sidebarCollapseButton"
            );

            if (button) {
                button.setAttribute("aria-label", "Lebarkan sidebar");
                button.title = "Lebarkan sidebar";
                button.innerHTML =
                    '<i class="fa-solid fa-angles-right"></i>';
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

/* =========================================================
   8. REQUEST API
   ========================================================= */

async function requestAPI(url, options = {}) {
    const defaultHeaders = {
        Accept: "application/json"
    };

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
            config.headers["Content-Type"] =
                config.headers["Content-Type"] ||
                "application/json";

            config.body = options.body;
        } else {
            config.headers["Content-Type"] =
                config.headers["Content-Type"] ||
                "application/json";

            config.body = JSON.stringify(options.body);
        }
    }

    const response = await fetch(url, config);
    const responseText = await response.text();

    let result;

    try {
        result = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
        throw new Error(
            "Respons server bukan JSON yang valid. Periksa file API PHP."
        );
    }

    if (!response.ok) {
        throw new Error(
            result.message ||
            result.pesan ||
            `Permintaan gagal dengan status ${response.status}.`
        );
    }

    if (result && result.success === false) {
        throw new Error(
            result.message ||
            result.pesan ||
            "Permintaan tidak berhasil."
        );
    }

    return result;
}

/* =========================================================
   9. DATA KATEGORI
   ========================================================= */

async function loadKategoriFromDB() {
    try {
        const result = await requestAPI(
            SICAMP_CONFIG.api.kategori
        );

        const kategori = Array.isArray(result)
            ? result
            : (
                result.data ||
                result.kategori ||
                result.result ||
                []
            );

        dataKategori = Array.isArray(kategori) ? kategori : [];

        try {
            localStorage.setItem(
                "kategori",
                JSON.stringify(dataKategori)
            );
        } catch (error) {
            console.warn("Kategori tidak dapat disimpan ke cache.", error);
        }

        if (typeof renderKategori === "function") {
            renderKategori(dataKategori);
        }

        if (typeof renderKategoriTable === "function") {
            renderKategoriTable(dataKategori);
        }

        return dataKategori;
    } catch (error) {
        console.error("Gagal memuat kategori:", error);

        dataKategori = getStoredArray("kategori");

        return dataKategori;
    }
}

/* =========================================================
   10. DATA PERALATAN
   ========================================================= */

async function loadPeralatanFromDB() {
    try {
        const result = await requestAPI(
            SICAMP_CONFIG.api.peralatan
        );

        const peralatan = Array.isArray(result)
            ? result
            : (
                result.data ||
                result.peralatan ||
                result.result ||
                []
            );

        dataPeralatan = Array.isArray(peralatan) ? peralatan : [];

        try {
            localStorage.setItem(
                "peralatan",
                JSON.stringify(dataPeralatan)
            );
        } catch (error) {
            console.warn("Cache peralatan tidak dapat disimpan.", error);
        }

        if (typeof renderPeralatan === "function") {
            renderPeralatan(dataPeralatan);
        }

        if (typeof renderPeralatanTable === "function") {
            renderPeralatanTable(dataPeralatan);
        }

        if (typeof renderDashboard === "function") {
            renderDashboard();
        }

        return dataPeralatan;
    } catch (error) {
        console.error("Gagal memuat peralatan:", error);

        dataPeralatan = getStoredArray("peralatan");

        return dataPeralatan;
    }
}

/* =========================================================
   11. HELPER IDENTITAS DATA
   ========================================================= */

function getPeralatanId(item) {
    return (
        item?.id_peralatan ??
        item?.id ??
        item?.id_alat ??
        null
    );
}

function getKategoriId(item) {
    return (
        item?.id_kategori ??
        item?.kategori_id ??
        item?.id ??
        null
    );
}

function getPeralatanName(item) {
    return (
        item?.nama_peralatan ||
        item?.nama_alat ||
        item?.nama ||
        "Peralatan tanpa nama"
    );
}

function getPeralatanStock(item) {
    return Number(
        item?.stok ??
        item?.jumlah_stok ??
        item?.stock ??
        0
    );
}

function getPeralatanPrice(item) {
    return Number(
        item?.harga_sewa ??
        item?.harga ??
        item?.harga_per_hari ??
        0
    );
}

function getKategoriName(item) {
    return (
        item?.nama_kategori ||
        item?.kategori ||
        "Tanpa kategori"
    );
}

/* =========================================================
   12. FILTER DAN PENCARIAN PERALATAN
   ========================================================= */

function filterDataPeralatan(data = dataPeralatan) {
    let hasil = [...data];

    const keyword = String(
        filterPencarianAlat || searchKeyword || ""
    ).trim().toLowerCase();

    if (keyword) {
        hasil = hasil.filter((item) => {
            const nama = getPeralatanName(item).toLowerCase();
            const kategori = getKategoriName(item).toLowerCase();
            const deskripsi = String(
                item?.deskripsi || ""
            ).toLowerCase();

            return (
                nama.includes(keyword) ||
                kategori.includes(keyword) ||
                deskripsi.includes(keyword)
            );
        });
    }

    if (filterKategoriAlat !== "all") {
        hasil = hasil.filter((item) => {
            return String(getKategoriId(item)) ===
                String(filterKategoriAlat);
        });
    }

    if (filterStokAlat === "tersedia") {
        hasil = hasil.filter(
            (item) => getPeralatanStock(item) > 0
        );
    }

    if (filterStokAlat === "habis") {
        hasil = hasil.filter(
            (item) => getPeralatanStock(item) <= 0
        );
    }

    if (filterUrutanAlat === "nama_asc") {
        hasil.sort((a, b) =>
            getPeralatanName(a).localeCompare(
                getPeralatanName(b),
                "id"
            )
        );
    } else if (filterUrutanAlat === "nama_desc") {
        hasil.sort((a, b) =>
            getPeralatanName(b).localeCompare(
                getPeralatanName(a),
                "id"
            )
        );
    } else if (filterUrutanAlat === "harga_asc") {
        hasil.sort(
            (a, b) => getPeralatanPrice(a) - getPeralatanPrice(b)
        );
    } else if (filterUrutanAlat === "harga_desc") {
        hasil.sort(
            (a, b) => getPeralatanPrice(b) - getPeralatanPrice(a)
        );
    } else if (filterUrutanAlat === "stok_asc") {
        hasil.sort(
            (a, b) => getPeralatanStock(a) - getPeralatanStock(b)
        );
    } else if (filterUrutanAlat === "stok_desc") {
        hasil.sort(
            (a, b) => getPeralatanStock(b) - getPeralatanStock(a)
        );
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

/* =========================================================
   13. INISIALISASI FILTER
   ========================================================= */

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

/* =========================================================
   14. NAVIGASI PELANGGAN
   ========================================================= */

function initializeCustomerNavigation() {
    const navPelanggan = document.getElementById("navPelanggan");
    const userIndicator = document.getElementById("userIndicator");

    if (!navPelanggan && !userIndicator) return;

    const session = getSessionUser();

    if (userIndicator) {
        if (session) {
            const nama =
                session.nama_pelanggan ||
                session.nama ||
                session.username ||
                "Pelanggan";

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
                    ? `
                        <button
                            type="button"
                            id="customerLogoutButton"
                            class="sicamp-customer-logout"
                        >
                            Keluar
                        </button>
                    `
                    : `
                        <a href="login.html">Masuk</a>
                    `
            }
        `;

        document
            .getElementById("customerLogoutButton")
            ?.addEventListener("click", logout);
    }
}

/* =========================================================
   15. INISIALISASI APLIKASI
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
    initializeCustomerNavigation();

    if (!isAdminPage()) return;

    document.body.classList.add("sicamp-admin-layout");

    ensureSidebarMount();
    installSharedSidebarStyles();
    renderUserNavigation();
    initializeSharedSidebarControls();
    initializePeralatanFilters();

    await Promise.allSettled([
        loadKategoriFromDB(),
        loadPeralatanFromDB()
    ]);
});

/* =========================================================
   16. EKSPOR FUNGSI GLOBAL
   Mendukung pemanggilan dari atribut onclick HTML lama.
   ========================================================= */

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
window.installSharedSidebarStyles = installSharedSidebarStyles;
window.initializeSharedSidebarControls =
    initializeSharedSidebarControls;

window.requestAPI = requestAPI;
window.loadKategoriFromDB = loadKategoriFromDB;
window.loadPeralatanFromDB = loadPeralatanFromDB;

window.filterDataPeralatan = filterDataPeralatan;
window.resetFilterPeralatan = resetFilterPeralatan;

window.getPeralatanId = getPeralatanId;
window.getKategoriId = getKategoriId;
window.getPeralatanName = getPeralatanName;
window.getPeralatanStock = getPeralatanStock;
window.getPeralatanPrice = getPeralatanPrice;
window.getKategoriName = getKategoriName;