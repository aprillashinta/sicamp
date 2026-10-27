window.initSiCampHistory = function initSiCampHistory() {
'use strict';
const API_URL = 'api/api_riwayat_pelanggan.php';
const PAGE_SIZE = 8;
let allTransactions = [], currentPage = 1;
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = value => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(value)||0);
const date = value => { if(!value) return '-'; const d = new Date(String(value).slice(0,10)+'T00:00:00'); return Number.isNaN(d.getTime()) ? escapeHTML(value) : d.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}); };
function sessionUser(){ 
    // Daftar semua kunci sesi yang mungkin digunakan di project kamu
    const sessionKeys = [
        'session_user',
        'user',
        'userData',
        'currentUser',
        'pengguna',
        'pelanggan'
    ];

    for(const key of sessionKeys){
        for(const storage of [localStorage, sessionStorage]){
            try{
                let raw = storage.getItem(key);
                if(!raw) continue;
                let parsed = JSON.parse(raw);
                if(parsed && typeof parsed === 'object'){
                    // Jika datanya terbungkus dalam objek .user atau .data
                    if(parsed.user && typeof parsed.user === 'object') parsed = parsed.user;
                    else if(parsed.data && typeof parsed.data === 'object') parsed = parsed.data;
                    
                    return parsed;
                }
            }catch(_){}
        }
    }
    return null; 
}

function customerId(user){
    if (!user) return null;
    return (
        user.id_pelanggan ?? 
        user.pelanggan_id ?? 
        user.id_customer ?? 
        user.id_user ?? 
        user.user_id ?? 
        user.id ?? 
        user.uid ?? 
        null
    );
}
function normalizeStatus(row){const s=String(row.status_penyewaan || row.status || '').toLowerCase();if(s.includes('batal'))return 'Dibatalkan';if(s.includes('selesai'))return 'Selesai';if(s.includes('sedang'))return 'Sedang Disewa';if(s.includes('setuju')||s==='disetujui')return 'Disetujui';if(s.includes('verifikasi'))return 'Menunggu Verifikasi';if(s.includes('pembayaran')||s==='menunggu')return 'Menunggu Pembayaran';return row.status_penyewaan || row.status || 'Menunggu Pembayaran';}
function badge(status){let cls='';if(status==='Selesai'||status==='Disetujui')cls='ok';else if(status==='Dibatalkan')cls='no';else if(status==='Sedang Disewa')cls='info';else cls='wait';return `<span class="badge ${cls}">${escapeHTML(status)}</span>`;}
function toast(message){const el=$('toast');el.textContent=message;el.style.display='block';setTimeout(()=>el.style.display='none',3200);}
function filtered(){const q=$('historySearchInput').value.trim().toLowerCase(),s=$('statusFilter').value;return allTransactions.filter(t=>(!q||String(t.kode_transaksi||'').toLowerCase().includes(q))&&(!s||normalizeStatus(t)===s));}
function render(){const list=filtered(),pages=Math.max(1,Math.ceil(list.length/PAGE_SIZE));currentPage=Math.min(currentPage,pages);const start=(currentPage-1)*PAGE_SIZE,shown=list.slice(start,start+PAGE_SIZE);$('historyBody').innerHTML=shown.length?shown.map(t=>{const status=normalizeStatus(t);return `<tr><td><span class="code">${escapeHTML(t.kode_transaksi||'-')}</span><span class="sub">${escapeHTML(t.detail_items?.length||0)} jenis peralatan</span></td><td>${date(t.tanggal_penyewaan)}</td><td>${date(t.tanggal_mulai)}<span class="sub">s/d ${date(t.tanggal_kembali_rencana)}</span></td><td><strong>${money(t.total_harga)}</strong></td><td>${badge(status)}</td><td><button class="action" data-detail="${Number(t.id_penyewaan)}">Lihat detail</button></td></tr>`}).join(''):`<tr><td colspan="6" class="empty">${allTransactions.length?'Tidak ada transaksi yang sesuai filter.':'Belum ada riwayat penyewaan.'}</td></tr>`;
$('pageInfo').textContent=list.length?`Menampilkan ${start+1}–${Math.min(start+PAGE_SIZE,list.length)} dari ${list.length} transaksi`:'Tidak ada transaksi';$('pages').innerHTML='';for(let i=1;i<=pages;i++){const b=document.createElement('button');b.textContent=i;if(i===currentPage)b.className='active';b.onclick=()=>{currentPage=i;render()};$('pages').appendChild(b)}
$('totalCount').textContent=allTransactions.length;$('processCount').textContent=allTransactions.filter(t=>!['Selesai','Dibatalkan'].includes(normalizeStatus(t))).length;$('doneCount').textContent=allTransactions.filter(t=>normalizeStatus(t)==='Selesai').length;
}
function openDetail(id){
    const t = allTransactions.find(x => Number(x.id_penyewaan) === Number(id));
    if(!t) return;
    
    $('detailTitle').textContent = 'Detail Penyewaan';
    $('detailCode').textContent = t.kode_transaksi || '-';
    
    const status = normalizeStatus(t);
    
    // Ambil tanggal pembayaran atau fallback ke tanggal transaksi/created_at jika kosong
    const tglBayar = t.tanggal_pembayaran || t.created_at || t.tanggal_penyewaan;
    
    const fields = [
        ['Status Penyewaan', status],
        ['Tanggal Transaksi', date(t.tanggal_penyewaan)],
        ['Tanggal Mulai', date(t.tanggal_mulai)],
        ['Rencana Kembali', date(t.tanggal_kembali_rencana)],
        ['Total Biaya', money(t.total_harga)],
        ['Status Pembayaran', t.status_pembayaran || 'Menunggu Verifikasi'],
        ['Tanggal Pembayaran', date(t.tanggal_pembayaran || t.created_at)],
        ['Catatan', t.catatan || '-']
    ];
    
    $('detailGrid').innerHTML = fields.map(([label, value]) => `
        <div class="detail">
            <label>${escapeHTML(label)}</label>
            <strong>${escapeHTML(value)}</strong>
        </div>
    `).join('');
    
    // Tambahkan bagian untuk menampilkan foto bukti pembayaran jika ada
    let buktiHTML = '';
    const fotoBukti = t.bukti_pembayaran || t.foto_bukti || t.bukti;
    if (fotoBukti) {
        buktiHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 14px; margin: 0 0 10px;">Bukti Pembayaran</h3>
                <a href="${escapeHTML(fotoBukti)}" target="_blank" title="Klik untuk memperbesar">
                    <img src="${escapeHTML(fotoBukti)}" alt="Bukti Transfer" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--line); object-fit: contain;">
                </a>
            </div>
        `;
    }

    let ktpHTML = '';
    const fotoKtp = t.ktp || t.foto_ktp || t.jaminan;
    if (fotoKtp) {
        ktpHTML = `
            <div style="margin-top: 20px;">
                <h3 style="font-size: 14px; margin: 0 0 10px;">Foto Jaminan (KTP/KTM)</h3>
                <a href="${escapeHTML(fotoKtp)}" target="_blank" title="Klik untuk memperbesar">
                    <img src="${escapeHTML(fotoKtp)}" alt="Foto Jaminan" style="max-width: 100%; max-height: 200px; border-radius: 8px; border: 1px solid var(--line); object-fit: contain;">
                </a>
            </div>
        `;
    }
    
    const items = Array.isArray(t.detail_items) ? t.detail_items : [];
    
    $('detailItems').innerHTML = (
        items.length ? items.map(i => `
            <div class="item-row">
                <div>
                    <strong>${escapeHTML(i.nama_peralatan || 'Peralatan')}</strong>
                    <small>${Number(i.jumlah || i.qty || 0)} × ${money(i.harga_satuan || i.harga_sewa || 0)}</small>
                </div>
                <strong>${money(i.subtotal ?? ((Number(i.jumlah || i.qty) || 0) * (Number(i.harga_satuan || i.harga_sewa) || 0)))}</strong>
            </div>
        `).join('') : '<p class="sub">Detail peralatan belum tersedia.</p>'
    ) + buktiHTML + ktpHTML;

    $('detailOverlay').classList.add('show');
}

async function loadHistory(){const user=sessionUser(),id=customerId(user);if(!id){$('historyBody').innerHTML='<tr><td colspan="6" class="empty">Sesi pelanggan tidak ditemukan. Silakan login sebagai pelanggan, lalu buka halaman ini kembali.</td></tr>';$('pageInfo').textContent='Belum login';$('totalCount').textContent='0';$('processCount').textContent='0';$('doneCount').textContent='0';return;}$('historyBody').innerHTML='<tr><td colspan="6" class="loading">Memuat riwayat penyewaan...</td></tr>';try{const response=await fetch(`${API_URL}?id_pelanggan=${encodeURIComponent(id)}`,{headers:{Accept:'application/json'},cache:'no-store'});const result=await response.json();if(!response.ok||result.status!=='success')throw new Error(result.message||'Gagal memuat riwayat.');allTransactions=Array.isArray(result.data)?result.data:[];currentPage=1;render();}catch(err){$('historyBody').innerHTML=`<tr><td colspan="6" class="empty error">${escapeHTML(err.message||'Terjadi kesalahan saat memuat data.')}</td></tr>`;$('pageInfo').textContent='Gagal memuat data';toast('Riwayat belum dapat dimuat. Periksa koneksi API.');}}
$('historyBody').addEventListener('click',e=>{const b=e.target.closest('[data-detail]');if(b)openDetail(b.dataset.detail)});$('historySearchInput').addEventListener('input',()=>{currentPage=1;render()});$('statusFilter').addEventListener('change',()=>{currentPage=1;render()});$('refreshBtn').addEventListener('click',loadHistory);$('closeModal').addEventListener('click',()=>$('detailOverlay').classList.remove('show'));$('closeModalBottom').addEventListener('click',()=>$('detailOverlay').classList.remove('show'));$('detailOverlay').addEventListener('click',e=>{if(e.target===$('detailOverlay'))$('detailOverlay').classList.remove('show')});document.addEventListener('keydown',e=>{if(e.key==='Escape')$('detailOverlay').classList.remove('show')});loadHistory();
};


(function () {
    'use strict';
    const mount = () => document.getElementById('sicampHistoryMount');
    const main = () => document.getElementById('sicampMain');
    let historyLoaded = false;
    let loadingPromise = null;

    async function showHistory() {
        const target = mount();
        const mainElement = main();
        if (!target || !mainElement) return;

        mainElement.classList.add('sicamp-history-active');
        target.hidden = false;
        target.setAttribute('aria-busy', 'true');

        if (historyLoaded && target.querySelector('#sicampHistoryView')) {
            target.setAttribute('aria-busy', 'false');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (!loadingPromise) {
            target.innerHTML = '<div class="sc-container" style="padding-top:32px;padding-bottom:32px"><p role="status">Memuat riwayat pesanan...</p></div>';
            loadingPromise = fetch('riwayat-pelanggan-content.html', { cache: 'no-store' })
                .then(response => {
                    if (!response.ok) throw new Error('Konten riwayat tidak dapat dimuat (' + response.status + ').');
                    return response.text();
                })
                .then(html => {
                    target.innerHTML = html;
                    historyLoaded = true;
                    target.setAttribute('aria-busy', 'false');
                    if (typeof window.initSiCampHistory === 'function') window.initSiCampHistory();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                })
                .catch(error => {
                    target.innerHTML = '<div class="sc-container" style="padding:32px 24px"><p role="alert" style="color:#b42318;font-weight:600">' +
                        String(error.message || 'Gagal memuat riwayat pesanan.') +
                        '</p><button type="button" id="retryHistoryLoad" class="sc-btn-secondary" style="margin-top:12px">Coba lagi</button></div>';
                    target.setAttribute('aria-busy', 'false');
                    loadingPromise = null;
                    document.getElementById('retryHistoryLoad')?.addEventListener('click', showHistory, { once: true });
                });
        }
        await loadingPromise;
    }

    function showCatalog() {
        const target = mount();
        const mainElement = main();
        if (mainElement) mainElement.classList.remove('sicamp-history-active');
        if (target) target.hidden = true;
    }

    window.showSiCampHistory = function () {
        if (window.location.hash !== '#riwayat-pesanan') {
            window.location.hash = 'riwayat-pesanan';
            return;
        }
        showHistory();
    };

    document.addEventListener('click', function (event) {
        const link = event.target.closest('[data-sicamp-view="history"]');
        if (!link) return;
        event.preventDefault();
        if (window.location.hash !== '#riwayat-pesanan') {
            window.location.hash = 'riwayat-pesanan';
        } else {
            showHistory();
        }
    });

    window.addEventListener('hashchange', function () {
        if (window.location.hash === '#riwayat-pesanan') showHistory();
        else showCatalog();
    });

    document.addEventListener('click', function (event) {
        if (event.target.closest('#retryHistoryLoad')) showHistory();
    });

    if (window.location.hash === '#riwayat-pesanan') showHistory();
})();
