/* Landing page — render dinamis dari API + interaksi */
(function () {
  'use strict';
  var C = window.APP_CONFIG || {}, $ = function (id) { return document.getElementById(id); }, D = null, S = {}, lastJson = '', timers = [], lastFocus = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- util ---------- */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function hl(s) { return esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>'); }
  function rp(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
  function safeUrl(u, def) { u = String(u || '').trim(); return /^(#[\w-]*|https?:\/\/|\/|img\/|data:image\/)/i.test(u) ? u : (def || '#'); }
  function hp62(v) { var d = String(v || '').replace(/\D/g, ''); if (d[0] === '0') return '62' + d.slice(1); if (d[0] === '8') return '62' + d; return d; }
  function arr(v) { if (Array.isArray(v)) return v; try { var p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch (e) { return String(v || '').split('\n').filter(Boolean); } }
  function waNo() { return hp62(S.wa_nomor || C.WA_DEFAULT || ''); }
  function waUrl(msg) { return 'https://wa.me/' + waNo() + '?text=' + encodeURIComponent(msg || S.wa_pesan || 'Halo, saya tertarik dengan produk Anda.'); }
  function toast(m) { var t = $('toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 3600); }
  function every(fn, ms) { var id = setInterval(fn, ms); timers.push(id); return id; }
  function clearTimers() { timers.forEach(clearInterval); timers = []; }
  function setImgBg(root) { root.querySelectorAll('[data-bg]').forEach(function (el) { el.style.backgroundImage = 'url("' + safeUrl(el.dataset.bg, '').replace(/"/g, '%22') + '")'; }); }
  function initial(n) { return String(n || '?').trim().charAt(0).toUpperCase(); }
  function sec(key) { return (D.seksi && D.seksi[key]) || null; }
  function head(id, key, extra) {
    var s = sec(key), el = $(id), wrapper = el.closest('section');
    if (!s) { if (wrapper) wrapper.hidden = true; return false; }
    if (wrapper) wrapper.hidden = false;
    el.innerHTML = '<h2>' + hl(s.judul) + '</h2>' + (s.subjudul && !extra ? '<p>' + esc(s.subjudul) + '</p>' : '') + (extra || '');
    return true;
  }

  /* ---------- render ---------- */
  function render(data, from) {
    var j = JSON.stringify(data); if (j === lastJson) return; lastJson = j;
    D = data; S = data.pengaturan || {}; clearTimers();
    applySettings(); renderHero(); renderMasalah(); renderSolusi(); renderProduk(); renderProses(); renderFitur(); renderTesti(); renderHarga(); renderFaq(); renderFooter();
    observeReveal(); initCountdown();
  }
  function applySettings() {
    var nama = S.brand_nama || C.NAMA_DEFAULT || 'Brand';
    document.title = S.meta_judul || nama; var md = document.querySelector('meta[name=description]'); if (md && S.meta_deskripsi) md.content = S.meta_deskripsi;
    document.querySelectorAll('.brand-name').forEach(function (e) { e.textContent = nama; });
    if (S.logo_url) document.querySelectorAll('.brand-mark').forEach(function (e) { e.innerHTML = '<img alt="" src="' + esc(safeUrl(S.logo_url, '')) + '">'; });
    $('waFab').href = waUrl(S.wa_pesan); $('waFab').target = '_blank';
    document.body.classList.toggle('kilau', S.ui_kilau !== '0');
    kupuApply();
  }
  function kupuApply() {
    var pref = API.ls('lp_kupu') !== '0', allow = (S.ui_kupu || '1') !== '0';
    var btn = $('kupuToggle'); btn.hidden = !allow; btn.setAttribute('aria-pressed', pref ? 'true' : 'false');
    window.Kupu && Kupu.set(allow && pref);
  }

  /* Hero slideshow */
  var hero = { i: 0, n: 0, t: 0, paused: false };
  function renderHero() {
    var list = D.hero && D.hero.length ? D.hero : [{ judul: (S.brand_nama || 'Selamat Datang') + ' — *Produk Digital*', subjudul: S.brand_tagline || '', gambar: '', tombol_teks: 'Lihat Produk', tombol_tautan: '#produk' }];
    $('heroStage').innerHTML = list.map(function (h, i) {
      return '<article class="hs' + (i === 0 ? ' on' : '') + '" aria-hidden="' + (i === 0 ? 'false' : 'true') + '"><div class="hs-bg" data-bg="' + esc(h.gambar) + '"></div><div class="wrap hs-in"><div class="hs-txt"><span class="eyebrow">' + esc(S.brand_nama || '') + '</span><h1>' + hl(h.judul) + '</h1><p>' + esc(h.subjudul) + '</p><div class="hs-cta"><a class="btn-gold btn-lg" href="' + esc(safeUrl(h.tombol_tautan, '#produk')) + '" data-cta="Hero CTA"><span>' + esc(h.tombol_teks || 'Lihat Produk') + '</span><span class="ms">arrow_forward</span></a><a class="btn-ghost" href="' + esc(waUrl()) + '" target="_blank" rel="noopener" data-cta="Hero WhatsApp"><span class="ms">chat</span> Tanya Admin</a></div></div></div></article>';
    }).join('');
    setImgBg($('heroStage'));
    hero.n = list.length; hero.i = 0;
    $('heroDots').innerHTML = list.map(function (_, i) { return '<button aria-label="Slide ' + (i + 1) + '"' + (i === 0 ? ' class="on"' : '') + '></button>'; }).join('');
    $('heroDots').querySelectorAll('button').forEach(function (b, i) { b.onclick = function () { heroGo(i); }; });
    document.querySelector('.hero-ctrl').style.visibility = list.length > 1 ? 'visible' : 'hidden';
    heroSchedule();
  }
  function heroMs() { return Math.max(2500, Number(S.hero_interval) || 5500); }
  function heroSchedule() {
    clearTimeout(hero.t); var bar = $('heroBar'); bar.style.transition = 'none'; bar.style.width = '0';
    if (hero.n < 2 || hero.paused || reduce) return;
    void bar.offsetWidth; bar.style.transition = 'width ' + heroMs() + 'ms linear'; bar.style.width = '100%';
    hero.t = setTimeout(function () { heroGo(hero.i + 1); }, heroMs());
  }
  function heroGo(i) {
    var s = document.querySelectorAll('.hs'); if (!s.length) return; i = (i + s.length) % s.length;
    s.forEach(function (e, k) { e.classList.toggle('on', k === i); e.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    $('heroDots').querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('on', k === i); });
    hero.i = i; heroSchedule();
  }

  function renderMasalah() {
    if (!head('masalahHead', 'masalah')) return;
    $('masalahList').innerHTML = arr(sec('masalah').isi).map(function (t) { return '<div class="pr-card glow reveal"><span class="ms">cancel</span><p>' + esc(t) + '</p></div>'; }).join('');
  }
  function renderSolusi() {
    var s = sec('solusi'), w = $('solusi'); if (!s) { w.hidden = true; return; } w.hidden = false;
    $('solusiHead').innerHTML = '<span class="eyebrow">Solusi</span><h2>' + hl(s.judul) + '</h2><p>' + esc(s.subjudul) + '</p><a href="#produk" class="btn-gold btn-lg" data-cta="Solusi CTA"><span>Lihat Produk</span><span class="ms">arrow_forward</span></a>';
  }

  /* Produk + slideshow gambar otomatis per kartu */
  var vis = new WeakMap(), io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { vis.set(e.target, e.isIntersecting); }); }, { threshold: .2 }) : null;
  function hemat(p) { return p.harga_normal > p.harga_promo && p.harga_promo > 0 ? Math.round((1 - p.harga_promo / p.harga_normal) * 100) : 0; }
  function priceHtml(p) {
    var promo = p.harga_promo > 0 ? p.harga_promo : p.harga_normal, h = hemat(p);
    return '<div class="price"><b>' + rp(promo) + '</b>' + (h ? '<s>' + rp(p.harga_normal) + '</s><span class="hemat">Hemat ' + h + '%</span>' : '') + '</div>';
  }
  function renderProduk() {
    var sx = sec('produk') || null, g = $('produkGrid');
    if (!D.produk.length) { g.innerHTML = '<p class="muted" style="text-align:center;grid-column:1/-1">Produk akan segera hadir.</p>'; return; }
    g.innerHTML = D.produk.map(function (p, ix) {
      var im = arr(p.gambar);
      return '<article class="pcard glow tilt reveal" data-id="' + esc(p.id) + '" style="transition-delay:' + (ix % 3) * 90 + 'ms"><div class="pimg">' + (p.badge ? '<span class="badge">' + esc(p.badge) + '</span>' : '') +
        (im.length ? im.map(function (u, k) { return '<img src="' + esc(safeUrl(u, '')) + '" alt="' + esc(p.nama) + ' — gambar ' + (k + 1) + '" loading="' + (ix < 3 && k === 0 ? 'eager' : 'lazy') + '" decoding="async"' + (k === 0 ? ' class="on"' : '') + '>'; }).join('') : '<div class="noimg">' + esc(initial(p.nama)) + '</div>') +
        (im.length > 1 ? '<div class="pdots">' + im.map(function (_, k) { return '<i' + (k === 0 ? ' class="on"' : '') + '></i>'; }).join('') + '</div>' : '') +
        '</div><div class="pbody"><span class="pcat">' + esc(p.kategori) + '</span><h3>' + esc(p.nama) + '</h3><p>' + esc(p.deskripsi) + '</p>' + priceHtml(p) +
        '<div class="pact"><button class="btn-gold" data-buy="' + esc(p.id) + '" data-label="Beli Sekarang"><span>Beli Sekarang</span><span class="ms">shopping_bag</span></button></div></div></article>';
    }).join('');
    g.querySelectorAll('.pcard').forEach(function (card, ix) {
      var imgs = card.querySelectorAll('.pimg img'), dots = card.querySelectorAll('.pdots i'); if (io) io.observe(card); else vis.set(card, true);
      if (imgs.length < 2 || reduce) return;
      var cur = 0; setTimeout(function () {
        every(function () { if (!vis.get(card) || document.hidden) return; imgs[cur].classList.remove('on'); dots[cur].classList.remove('on'); cur = (cur + 1) % imgs.length; imgs[cur].classList.add('on'); dots[cur].classList.add('on'); }, 3200 + ix * 450);
      }, ix * 600);
    });
  }
  function renderProses() {
    if (!head('prosesHead', 'proses')) return;
    $('prosesList').innerHTML = arr(sec('proses').isi).map(function (t, i) { return '<li class="reveal" style="transition-delay:' + i * 90 + 'ms"><div class="n">' + (i + 1) + '</div><b>' + esc(t) + '</b></li>'; }).join('');
  }
  function renderFitur() {
    if (!head('fiturHead', 'fitur')) return;
    $('fiturGrid').innerHTML = D.fitur.map(function (f, i) { return '<div class="f-card glow reveal" style="transition-delay:' + (i % 4) * 80 + 'ms"><div class="f-ic"><span class="ms">' + esc(f.ikon || 'star') + '</span></div><h3>' + esc(f.judul) + '</h3><p>' + esc(f.deskripsi) + '</p></div>'; }).join('');
  }

  /* Testimoni: karusel otomatis, glow kursor, klik → pop-up */
  var T = { i: 0, pv: 3, n: 0, paused: false, timer: 0 };
  function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += '<span class="ms' + (i > n ? ' off' : '') + '">star</span>'; return '<div class="stars" aria-label="Rating ' + n + ' dari 5">' + s + '</div>'; }
  function avatar(t) { return '<div class="ava">' + (t.foto ? '<img alt="" loading="lazy" src="' + esc(safeUrl(t.foto, '')) + '">' : esc(initial(t.nama))) + '</div>'; }
  function renderTesti() {
    var w = $('testimoni'); if (!head('testiHead', 'testimoni') || !D.testimoni.length) { w.hidden = !D.testimoni.length ? true : w.hidden; return; }
    T.n = D.testimoni.length; T.i = 0;
    $('tTrack').innerHTML = D.testimoni.map(function (t, i) {
      return '<div class="t-slot"><div class="t-card glow" role="button" tabindex="0" data-t="' + i + '" aria-label="Baca testimoni ' + esc(t.nama) + '"><span class="q">”</span>' + stars(Number(t.rating) || 5) + '<blockquote>' + esc(t.isi) + '</blockquote><div class="t-who">' + avatar(t) + '<div><b>' + esc(t.nama) + '</b><small>' + esc(t.jabatan) + '</small></div></div><span class="t-more">Baca selengkapnya <span class="ms">arrow_forward</span></span></div></div>';
    }).join('');
    tLayout(); T.paused = false;
    var iv = Math.max(3000, Number(S.testi_interval) || 6500); clearInterval(T.timer);
    T.timer = every(function () { if (!T.paused && !document.hidden && !reduce && T.pages > 1) tGo(T.i + 1); }, iv);
  }
  function tLayout() {
    var pv = parseInt(getComputedStyle($('tTrack')).getPropertyValue('--pv')) || 3; T.pv = pv; T.pages = Math.max(1, T.n - pv + 1);
    $('tDots').innerHTML = T.pages > 1 ? Array.apply(null, Array(T.pages)).map(function (_, i) { return '<button aria-label="Testimoni ' + (i + 1) + '"' + (i === T.i ? ' class="on"' : '') + '></button>'; }).join('') : '';
    $('tDots').querySelectorAll('button').forEach(function (b, i) { b.onclick = function () { tGo(i); }; });
    $('tPrev').style.visibility = $('tNext').style.visibility = T.pages > 1 ? 'visible' : 'hidden'; tGo(Math.min(T.i, T.pages - 1));
  }
  function tGo(i) { T.i = (i + T.pages) % T.pages; $('tTrack').style.transform = 'translateX(' + (-T.i * 100 / T.pv) + '%)'; $('tDots').querySelectorAll('button').forEach(function (b, k) { b.classList.toggle('on', k === T.i); }); }
  var tm = { i: 0 };
  function openT(i) {
    tm.i = (i + T.n) % T.n; var t = D.testimoni[tm.i];
    $('tModalBody').innerHTML = '<div class="big-q">“</div>' + stars(Number(t.rating) || 5) + '<p class="t-text">' + esc(t.isi) + '</p><div class="t-who">' + avatar(t) + '<div><b>' + esc(t.nama) + '</b><small>' + esc(t.jabatan) + '</small></div></div>';
    openModal('tModal');
  }

  function renderHarga() {
    var ok = head('hargaHead', 'harga'); $('promoBar').hidden = S.promo_aktif === '0';
    if (!ok) return;
    var hotIx = -1; D.produk.forEach(function (p, i) { if (hotIx < 0 && /best|terlaris|populer|favorit/i.test(p.badge || '')) hotIx = i; }); if (hotIx < 0 && D.produk.length === 3) hotIx = 1;
    $('hargaGrid').innerHTML = D.produk.map(function (p, i) {
      var f = arr(p.fitur), b = arr(p.bonus);
      return '<div class="pk glow reveal' + (i === hotIx ? ' hot' : '') + '" style="transition-delay:' + i * 90 + 'ms">' + (p.badge && i === hotIx ? '<span class="ribbon">' + esc(p.badge) + '</span>' : '') + '<h3>' + esc(p.nama) + '</h3>' + priceHtml(p) +
        '<ul class="cl">' + f.map(function (x) { return '<li><span class="ms">check_circle</span>' + esc(x) + '</li>'; }).join('') + '</ul>' +
        (b.length ? '<div class="bonus"><b><span class="ms">redeem</span> Bonus</b><ul>' + b.map(function (x) { return '<li>🎁 ' + esc(x) + '</li>'; }).join('') + '</ul></div>' : '') +
        '<button class="btn-gold btn-lg" data-buy="' + esc(p.id) + '" data-label="Paket Harga"><span>Ambil Paket Ini</span><span class="ms">arrow_forward</span></button></div>';
    }).join('');
  }
  function renderFaq() {
    if (!head('faqHead', 'faq')) return;
    $('faqList').innerHTML = D.faq.map(function (f, i) { return '<div class="fq glow"><button class="fq-q" aria-expanded="false" aria-controls="fa' + i + '"><span>' + esc(f.tanya) + '</span><span class="ms">add</span></button><div class="fq-a" id="fa' + i + '"><div><p>' + esc(f.jawab) + '</p></div></div></div>'; }).join('');
  }
  function renderFooter() {
    $('fTag').textContent = S.brand_tagline || ''; $('fCopy').textContent = S.footer_teks || ('© ' + (S.brand_nama || ''));
    var k = [];
    if (waNo()) k.push('<li><span class="ms">call</span><a href="' + esc(waUrl()) + '" target="_blank" rel="noopener">+' + esc(waNo()) + '</a></li>');
    if (S.kontak_email) k.push('<li><span class="ms">mail</span><a href="mailto:' + esc(S.kontak_email) + '">' + esc(S.kontak_email) + '</a></li>');
    if (S.kontak_alamat) k.push('<li><span class="ms">location_on</span><span>' + esc(S.kontak_alamat) + '</span></li>');
    $('fKontak').innerHTML = k.join('');
    var so = []; [['sosmed_instagram', 'IG', 'Instagram'], ['sosmed_tiktok', 'TT', 'TikTok'], ['sosmed_youtube', 'YT', 'YouTube']].forEach(function (x) { if (S[x[0]]) so.push('<a href="' + esc(safeUrl(S[x[0]], '#')) + '" target="_blank" rel="noopener" aria-label="' + x[2] + '">' + x[1] + '</a>'); });
    $('fSosmed').innerHTML = so.join('') || '<span class="muted">—</span>';
  }

  /* ---------- countdown ---------- */
  var cdT = 0;
  function initCountdown() {
    clearInterval(cdT); if (S.promo_aktif === '0') return;
    $('promoLabel').textContent = S.promo_label || 'Promo spesial berakhir dalam';
    var end = S.promo_sampai ? new Date(S.promo_sampai).getTime() : NaN;
    if (isNaN(end) || end < Date.now()) {
      if (S.promo_ulang === '1' || isNaN(end)) { var st = Number(API.ls('lp_promo_end')); if (!st || st < Date.now()) { st = Date.now() + 7 * 864e5; API.ls('lp_promo_end', String(st)); } end = st; }
    }
    function tick() {
      var d = Math.max(0, end - Date.now()), p = function (n) { return ('0' + n).slice(-2); };
      $('cD').textContent = p(Math.floor(d / 864e5)); $('cH').textContent = p(Math.floor(d % 864e5 / 36e5)); $('cM').textContent = p(Math.floor(d % 36e5 / 6e4)); $('cS').textContent = p(Math.floor(d % 6e4 / 1e3));
      if (!d) { clearInterval(cdT); $('promoLabel').textContent = 'Promo telah berakhir'; }
    }
    tick(); cdT = setInterval(tick, 1000);
  }

  /* ---------- modal ---------- */
  function openModal(id) { lastFocus = document.activeElement; var m = $(id); m.hidden = false; document.body.style.overflow = 'hidden'; var f = m.querySelector('input,.x'); setTimeout(function () { f && f.focus(); }, 60); }
  function closeModals() { document.querySelectorAll('.modal').forEach(function (m) { m.hidden = true; }); document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus(); T.paused = false; }

  /* ---------- beli / lead ---------- */
  var cur = { p: null, label: '' };
  function trackKlik(p, label) { API.track({ tipe: 'klik', produk_id: p ? p.id : '', tombol: label || 'Lainnya' }); }
  function openBuy(id, label) {
    var p = D.produk.filter(function (x) { return x.id === id; })[0]; if (!p) return;
    cur = { p: p, label: label || 'Beli Sekarang' }; trackKlik(p, cur.label);
    var im = arr(p.gambar)[0];
    $('leadProd').innerHTML = (im ? '<img alt="" src="' + esc(safeUrl(im, '')) + '">' : '') + '<div><b>' + esc(p.nama) + '</b><small>' + rp(p.harga_promo > 0 ? p.harga_promo : p.harga_normal) + '</small></div>';
    $('lNama').value = API.ls('lp_nama') || ''; $('lWa').value = API.ls('lp_wa') || ''; $('lErr').textContent = '';
    openModal('leadModal');
  }
  function goBuy(p, nama) {
    var msg = (p.pesan_wa || ('Halo, saya ingin membeli ' + p.nama + '.')) + (nama ? '\n\nNama: ' + nama : '');
    var url = p.link_beli && /^https?:\/\//i.test(p.link_beli) ? p.link_beli : waUrl(msg);
    var w = window.open(url, '_blank', 'noopener'); if (!w) location.href = url;
  }
  function submitLead(e) {
    e.preventDefault(); var n = $('lNama').value.trim(), w = $('lWa').value.trim(), em = $('lEmail').value.trim(), err = $('lErr');
    $('lNama').classList.toggle('bad', !n); $('lWa').classList.toggle('bad', !/^(\+?62|0)8\d{7,12}$/.test(w.replace(/[\s-]/g, '')));
    if (!n) { err.textContent = 'Nama wajib diisi.'; return; }
    if (!/^(\+?62|0)8\d{7,12}$/.test(w.replace(/[\s-]/g, ''))) { err.textContent = 'Nomor WhatsApp tidak valid. Contoh: 08123456789'; return; }
    if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { err.textContent = 'Format email tidak valid.'; return; }
    err.textContent = ''; API.ls('lp_nama', n); API.ls('lp_wa', w);
    goBuy(cur.p, n); closeModals();
    API.post('lead', { nama: n, wa: w, email: em, produk_id: cur.p.id, tombol: cur.label, sid: API.sid(), sumber: API.sumber(), perangkat: API.perangkat() }).catch(function () {});
    toast('Terima kasih, ' + n.split(' ')[0] + '! Mengarahkan ke WhatsApp…');
  }

  /* ---------- efek interaktif ---------- */
  function sparks(x, y) {
    if (reduce) return;
    for (var i = 0; i < 12; i++) { var s = document.createElement('span'); s.className = 'spark'; var a = Math.PI * 2 * i / 12 + Math.random() * .5, d = 40 + Math.random() * 50; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px'); document.body.appendChild(s); setTimeout(function (el) { el.remove(); }.bind(null, s), 850); }
  }
  function ripple(btn, e) { var r = btn.getBoundingClientRect(), s = Math.max(r.width, r.height), el = document.createElement('span'); el.className = 'ripple'; el.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px'; btn.appendChild(el); setTimeout(function () { el.remove(); }, 750); }

  var raf = 0;
  document.addEventListener('pointermove', function (e) {
    var g = e.target.closest && e.target.closest('.glow'); if (!g || raf) return;
    raf = requestAnimationFrame(function () {
      raf = 0; var r = g.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      g.style.setProperty('--mx', x + 'px'); g.style.setProperty('--my', y + 'px');
      if (g.classList.contains('tilt') && e.pointerType === 'mouse' && !reduce) g.style.transform = 'perspective(900px) rotateX(' + ((y / r.height - .5) * -7).toFixed(2) + 'deg) rotateY(' + ((x / r.width - .5) * 7).toFixed(2) + 'deg) translateY(-6px)';
    });
  }, { passive: true });
  document.addEventListener('pointerout', function (e) { var g = e.target.closest && e.target.closest('.tilt'); if (g && !g.contains(e.relatedTarget)) g.style.transform = ''; });
  // tombol CTA "magnet"
  document.addEventListener('pointermove', function (e) {
    var b = e.target.closest && e.target.closest('.btn-gold'); if (!b || e.pointerType !== 'mouse' || reduce) return;
    var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .12).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * .22 - 3).toFixed(1) + 'px) scale(1.04)';
  }, { passive: true });
  document.addEventListener('pointerout', function (e) { var b = e.target.closest && e.target.closest('.btn-gold'); if (b && !b.contains(e.relatedTarget)) b.style.transform = ''; });

  document.addEventListener('click', function (e) {
    var t = e.target, btn = t.closest('.btn-gold,.btn-ghost,.wa-fab');
    if (btn) { ripple(btn, e); if (btn.classList.contains('btn-gold')) sparks(e.clientX, e.clientY); }
    var buy = t.closest('[data-buy]'); if (buy) { openBuy(buy.dataset.buy, buy.dataset.label); return; }
    var cta = t.closest('[data-cta]'); if (cta) trackKlik(null, cta.dataset.cta);
    if (t.closest('#waFab')) trackKlik(null, 'Chat WhatsApp');
    var tc = t.closest('[data-t]'); if (tc) { openT(Number(tc.dataset.t)); return; }
    var fq = t.closest('.fq-q'); if (fq) { var box = fq.parentNode, open = !box.classList.contains('open'); document.querySelectorAll('.fq.open').forEach(function (x) { x.classList.remove('open'); x.querySelector('.fq-q').setAttribute('aria-expanded', 'false'); }); if (open) { box.classList.add('open'); fq.setAttribute('aria-expanded', 'true'); } return; }
    if (t.closest('[data-close]')) closeModals();
    if (t.closest('.nav-links a')) { $('navLinks').classList.remove('open'); $('burger').setAttribute('aria-expanded', 'false'); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModals();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-t]')) { e.preventDefault(); openT(Number(e.target.dataset.t)); }
    if (!$('tModal').hidden) { if (e.key === 'ArrowRight') openT(tm.i + 1); if (e.key === 'ArrowLeft') openT(tm.i - 1); }
    if (e.key === 'Tab') { var m = document.querySelector('.modal:not([hidden]) .modal-box'); if (m) { var f = m.querySelectorAll('button,input,a[href]'); if (f.length) { var a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } } } }
  });

  /* ---------- pengikat sekali jalan ---------- */
  function bind() {
    $('leadForm').addEventListener('submit', submitLead);
    $('lSkip').onclick = function () { goBuy(cur.p, ''); closeModals(); API.post('lead', { nama: 'Pengunjung', wa: '', produk_id: cur.p.id }).catch(function () {}); };
    $('tPrev').onclick = function () { tGo(T.i - 1); }; $('tNext').onclick = function () { tGo(T.i + 1); };
    $('tmPrev').onclick = function () { openT(tm.i - 1); }; $('tmNext').onclick = function () { openT(tm.i + 1); };
    var tv = $('testi'); tv.addEventListener('pointerenter', function () { T.paused = true; }); tv.addEventListener('pointerleave', function () { T.paused = false; });
    $('heroPrev').onclick = function () { heroGo(hero.i - 1); }; $('heroNext').onclick = function () { heroGo(hero.i + 1); };
    var hs = $('hero'); hs.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { hero.paused = true; clearTimeout(hero.t); var b = $('heroBar'); b.style.transition = 'none'; } });
    hs.addEventListener('pointerleave', function () { hero.paused = false; heroSchedule(); });
    var sx = 0; hs.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true }); hs.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) heroGo(hero.i + (dx < 0 ? 1 : -1)); }, { passive: true });
    var ts = 0; $('testi').addEventListener('touchstart', function (e) { ts = e.touches[0].clientX; }, { passive: true }); $('testi').addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - ts; if (Math.abs(dx) > 50) tGo(T.i + (dx < 0 ? 1 : -1)); }, { passive: true });
    $('burger').onclick = function () { var o = $('navLinks').classList.toggle('open'); this.setAttribute('aria-expanded', o); };
    $('kupuToggle').onclick = function () { var on = API.ls('lp_kupu') === '0'; API.ls('lp_kupu', on ? '1' : '0'); kupuApply(); };
    var nav = $('nav'), pg = $('progress');
    addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 30); var h = document.documentElement.scrollHeight - innerHeight; pg.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%'; }, { passive: true });
    var rs; addEventListener('resize', function () { clearTimeout(rs); rs = setTimeout(function () { if (D && T.n) tLayout(); }, 150); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) heroSchedule(); });
    setTimeout(function () { var tip = $('waTip'); tip.classList.add('show'); setTimeout(function () { tip.classList.remove('show'); }, 6500); }, 5000);
  }
  var rio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  function observeReveal() { document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { rio ? rio.observe(el) : el.classList.add('in'); }); }

  /* ---------- mulai ---------- */
  function start() {
    bind();
    $('produkGrid').innerHTML = '<div class="skel"></div><div class="skel"></div><div class="skel"></div>';
    API.pub(render).then(function () {
      if (!sessionStorage.getItem('lp_visit')) { try { sessionStorage.setItem('lp_visit', '1'); } catch (e) {} API.track({ tipe: 'visit', halaman: location.pathname || '/' }); }
    }).catch(function () {
      if (!D) $('produkGrid').innerHTML = '<p class="muted" style="grid-column:1/-1;text-align:center">Gagal memuat data. <button class="link" style="display:inline" onclick="location.reload()">Muat ulang</button></p>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
