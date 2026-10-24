/* Admin — inti: util, dialog/drawer, grafik SVG, login, shell & router */
(function () {
  'use strict';
  var W = window, A = W.Admin = { pages: {}, order: ['dasbor', 'produk', 'seksi', 'testimoni', 'faq', 'crm', 'notif', 'pengaturan', 'migrasi', 'akun'], user: null, cleanup: null };
  var $ = A.$ = function (s, r) { return (r || document).querySelector(s); }, $$ = A.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = A.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  A.rp = function (n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); };
  A.num = function (n) { return Number(n || 0).toLocaleString('id-ID'); };
  A.arr = function (v) { if (Array.isArray(v)) return v; if (!v) return []; try { var p = JSON.parse(v); if (Array.isArray(p)) return p; } catch (e) {} return String(v).split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
  A.on = function (v) { v = String(v).toLowerCase(); return v === '1' || v === 'true' || v === 'aktif'; };
  A.dt = function (s) { s = String(s || ''); if (s.length < 16) return s; var m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']; return s.slice(8, 10) + ' ' + m[Number(s.slice(5, 7)) - 1] + ' ' + s.slice(11, 16); };
  A.tglPendek = function (t) { var m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']; return Number(t.slice(8, 10)) + ' ' + m[Number(t.slice(5, 7)) - 1]; };
  A.init = function (s) { return String(s || '?').trim().charAt(0).toUpperCase(); };
  A.safe = function (u) { u = String(u || '').trim(); return /^(https?:\/\/|img\/|data:image\/|\/)/i.test(u) ? u : ''; };
  A.debounce = function (fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; };
  A.download = function (name, text, mime) { var b = new Blob(['﻿' + text], { type: mime || 'text/csv;charset=utf-8' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
  A.csv = function (rows) { return rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n'); };

  /* ---------- toast ---------- */
  A.toast = function (msg, type) {
    var b = $('#toasts'), el = document.createElement('div'); el.className = 'tst ' + (type || ''); el.innerHTML = '<span class="ms">' + (type === 'err' ? 'error' : type === 'ok' ? 'check_circle' : 'info') + '</span><span>' + esc(msg) + '</span>';
    b.appendChild(el); setTimeout(function () { el.style.transition = '.3s'; el.style.opacity = 0; setTimeout(function () { el.remove(); }, 300); }, type === 'err' ? 5500 : 3200);
  };
  /* ---------- API helper ---------- */
  A.call = function (a, d, o) { return API.post(a, d, o).catch(function (e) { if (!(o && o.quiet)) A.toast(e.message, 'err'); throw e; }); };
  A.busy = function (btn, p) {
    if (!btn) return p; var h = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>';
    var done = function () { btn.disabled = false; btn.innerHTML = h; }; p.then(done, done); return p;
  };

  /* ---------- dialog & drawer ---------- */
  var stack = [];
  A.open = function (o) {
    var layer = $('#layer'), ov = document.createElement('div'), box = document.createElement('div'), last = document.activeElement;
    ov.className = 'ov'; box.className = o.kind === 'drawer' ? 'drawer' : 'dlg' + (o.wide ? ' wide' : ''); box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
    box.innerHTML = '<div class="dr-h"><h3>' + esc(o.title || '') + '</h3>' + (o.locked ? '' : '<button class="ib" data-x aria-label="Tutup"><span class="ms">close</span></button>') + '</div><div class="dr-b">' + (o.body || '') + '</div>' + (o.actions ? '<div class="dr-f"></div>' : '');
    layer.appendChild(ov); layer.appendChild(box);
    var api = { el: box, body: $('.dr-b', box), close: function () { if (!box.parentNode) return; ov.remove(); box.remove(); stack = stack.filter(function (s) { return s !== api; }); if (last && last.focus) try { last.focus(); } catch (e) {} o.onClose && o.onClose(); }, locked: o.locked };
    if (!o.locked) { ov.onclick = api.close; $('[data-x]', box).onclick = api.close; }
    if (o.actions) { var f = $('.dr-f', box); o.actions.forEach(function (a) { var b = document.createElement('button'); b.type = 'button'; b.className = 'b ' + (a.cls || 'b-line'); b.innerHTML = a.t; b.onclick = function () { var r = a.fn ? a.fn(api, b) : api.close(); if (r && r.then) A.busy(b, r).catch(function () {}); }; f.appendChild(b); }); }
    stack.push(api); o.onMount && o.onMount(api);
    var fi = $('input:not([type=checkbox]):not([type=file]),textarea', box); setTimeout(function () { (fi || $('.dr-h .ib', box) || box).focus && (fi || $('.dr-h .ib', box) || box).focus(); }, 80);
    return api;
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && stack.length) { var t = stack[stack.length - 1]; if (!t.locked) t.close(); } });
  A.confirm = function (msg, o) {
    o = o || {}; return new Promise(function (res) {
      var done = false, fin = function (v) { if (!done) { done = true; res(v); } };
      A.open({ title: o.title || 'Konfirmasi', body: '<p>' + esc(msg) + '</p>', onClose: function () { fin(false); }, actions: [{ t: 'Batal', cls: 'b-line', fn: function (d) { d.close(); } }, { t: o.ok || 'Ya, lanjutkan', cls: o.danger ? 'b-red' : 'b-gold', fn: function (d) { fin(true); d.close(); } }] });
    });
  };
  A.switch = function (name, on, extra) { return '<label class="sw"><input type="checkbox" name="' + name + '"' + (on ? ' checked' : '') + (extra || '') + '><i></i></label>'; };
  A.skeleton = function (n) { var s = ''; for (var i = 0; i < (n || 4); i++) s += '<div class="skel" style="height:' + (i ? 90 : 120) + 'px;margin-bottom:14px"></div>'; return s; };

  /* kompres & unggah gambar */
  A.compress = function (file, maxW) {
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = function () { rej(new Error('Gagal membaca berkas')); };
      fr.onload = function () { var im = new Image(); im.onerror = function () { rej(new Error('Berkas bukan gambar valid')); }; im.onload = function () {
        var w = im.width, h = im.height, s = Math.min(1, (maxW || 1600) / w); w = Math.round(w * s); h = Math.round(h * s);
        var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(im, 0, 0, w, h);
        var png = file.type === 'image/png' && file.size < 300000, mime = png ? 'image/png' : 'image/jpeg', url = c.toDataURL(mime, .84); res({ mime: mime, b64: url.split(',')[1], dataUrl: url, nama: file.name });
      }; im.src = fr.result; }; fr.readAsDataURL(file);
    });
  };
  A.upload = function (file) {
    if (!/^image\//.test(file.type)) return Promise.reject(new Error('Hanya berkas gambar'));
    return A.compress(file).then(function (c) { return API.post('unggah', { nama: c.nama, mime: c.mime, b64: c.b64, dataUrl: c.dataUrl }); }).then(function (r) { return r.url; });
  };

  /* ---------- GRAFIK SVG ---------- */
  var PAL = ['#D4A640', '#2F6FDE', '#1C9E5B', '#8B5CF6', '#E5604D', '#0EA5B7', '#B8860B'];
  A.PAL = PAL;
  function niceMax(v) { if (v <= 4) return 4; var p = Math.pow(10, Math.floor(Math.log10(v))), m = v / p, u = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10; return u * p; }
  function svgOpen(W, H) { return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" preserveAspectRatio="xMidYMid meet">'; }
  A.line = function (o) {
    var Wd = 640, H = o.h || 250, pl = 42, pr = 14, pt = 14, pb = 28, n = o.labels.length, all = [];
    o.series.forEach(function (s) { all = all.concat(s.data); }); var max = niceMax(Math.max.apply(null, all.concat([1]))), uid = 'g' + Math.random().toString(36).slice(2, 7);
    var x = function (i) { return pl + (n > 1 ? i * (Wd - pl - pr) / (n - 1) : (Wd - pl - pr) / 2); }, y = function (v) { return pt + (H - pt - pb) * (1 - v / max); };
    var s = svgOpen(Wd, H) + '<defs>' + o.series.map(function (se, k) { return '<linearGradient id="' + uid + k + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + se.color + '" stop-opacity=".28"/><stop offset="1" stop-color="' + se.color + '" stop-opacity="0"/></linearGradient>'; }).join('') + '</defs>';
    for (var t = 0; t <= 4; t++) { var v = max * t / 4, yy = y(v); s += '<line class="gl" x1="' + pl + '" x2="' + (Wd - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (pl - 8) + '" y="' + (yy + 4) + '" text-anchor="end">' + (o.fmtY ? o.fmtY(v) : (v % 1 ? v.toFixed(1) : v)) + '</text>'; }
    var step = Math.max(1, Math.ceil(n / 6)); o.labels.forEach(function (l, i) { if (i % step === 0 || i === n - 1) { if (i === n - 1 && i % step !== 0 && n - 1 - (Math.floor((n - 1) / step) * step) < step / 2) return; s += '<text x="' + x(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>'; } });
    o.series.forEach(function (se, k) {
      var pts = se.data.map(function (v, i) { return x(i).toFixed(1) + ',' + y(v).toFixed(1); });
      if (o.area !== false && (o.area || k === 0)) s += '<polygon points="' + x(0) + ',' + y(0) + ' ' + pts.join(' ') + ' ' + x(n - 1) + ',' + y(0) + '" fill="url(#' + uid + k + ')"/>';
      s += '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + se.color + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>';
      se.data.forEach(function (v, i) { s += '<circle class="pt" data-i="' + i + '" cx="' + x(i) + '" cy="' + y(v) + '" r="4.5" fill="#fff" stroke="' + se.color + '" stroke-width="2.4" style="opacity:0"/>'; });
    });
    s += '<line class="hl" y1="' + pt + '" y2="' + (H - pb) + '" style="display:none"/>';
    var bw = n > 1 ? (Wd - pl - pr) / (n - 1) : 40;
    o.labels.forEach(function (l, i) {
      var tip = '<b>' + esc(o.tipLabels ? o.tipLabels[i] : l) + '</b>' + o.series.map(function (se) { return '<div><i style="background:' + se.color + '"></i>' + esc(se.name) + ': <b style="display:inline;color:#fff">' + (o.fmtTip ? o.fmtTip(se.data[i]) : A.num(se.data[i])) + '</b></div>'; }).join('');
      s += '<rect class="hz" data-i="' + i + '" data-x="' + x(i) + '" data-tip="' + esc(tip) + '" x="' + (x(i) - bw / 2) + '" y="' + pt + '" width="' + bw + '" height="' + (H - pt - pb) + '" fill="transparent"/>';
    });
    return '<div class="chart">' + s + '</svg><div class="tip"></div></div>';
  };
  A.vbars = function (o) {
    var Wd = 640, H = o.h || 220, pl = 34, pr = 8, pt = 12, pb = 26, n = o.data.length, max = niceMax(Math.max.apply(null, o.data.concat([1]))), bw = (Wd - pl - pr) / n, top = o.data.indexOf(Math.max.apply(null, o.data));
    var s = svgOpen(Wd, H); for (var t = 0; t <= 4; t++) { var v = max * t / 4, yy = pt + (H - pt - pb) * (1 - v / max); s += '<line class="gl" x1="' + pl + '" x2="' + (Wd - pr) + '" y1="' + yy + '" y2="' + yy + '"/><text x="' + (pl - 6) + '" y="' + (yy + 4) + '" text-anchor="end">' + (v % 1 ? v.toFixed(1) : v) + '</text>'; }
    o.data.forEach(function (v, i) {
      var h = (H - pt - pb) * v / max, xx = pl + i * bw + bw * .18, w = bw * .64;
      s += '<rect data-tip="' + esc('<b>' + o.labels[i] + '</b>' + A.num(v) + ' ' + (o.unit || '')) + '" class="hz" x="' + xx + '" y="' + (H - pb - h) + '" width="' + w + '" height="' + Math.max(h, 0) + '" rx="3" fill="' + (i === top && v > 0 ? '#D4A640' : '#E9D49B') + '"/>';
      if (i % 3 === 0) s += '<text x="' + (xx + w / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + o.labels[i] + '</text>';
    });
    return '<div class="chart">' + s + '</svg><div class="tip"></div></div>';
  };
  A.hbars = function (items, o) {
    o = o || {}; if (!items.length) return '<div class="empty" style="padding:24px">Belum ada data</div>';
    var max = Math.max.apply(null, items.map(function (i) { return i.jumlah; }).concat([1])), tot = items.reduce(function (a, b) { return a + b.jumlah; }, 0) || 1;
    return '<div class="hb">' + items.slice(0, o.maks || 6).map(function (it, k) { return '<div class="r" title="' + esc(it.nama) + ': ' + A.num(it.jumlah) + ' (' + Math.round(it.jumlah / tot * 100) + '%)"><span>' + esc(it.nama) + '</span><div class="bar"><i style="width:' + (it.jumlah / max * 100).toFixed(1) + '%;background:' + (o.warna || PAL[k % PAL.length]) + '"></i></div><b>' + A.num(it.jumlah) + '</b></div>'; }).join('') + '</div>';
  };
  A.donut = function (items, label) {
    if (!items.length) return '<div class="empty" style="padding:24px">Belum ada data</div>';
    var tot = items.reduce(function (a, b) { return a + b.jumlah; }, 0) || 1, R = 56, C = 2 * Math.PI * R, off = 0;
    var s = '<svg viewBox="0 0 160 160" role="img" aria-label="' + esc(label || 'Diagram donat') + '"><g transform="rotate(-90 80 80)">';
    items.forEach(function (it, k) { var len = it.jumlah / tot * C; s += '<circle cx="80" cy="80" r="' + R + '" fill="none" stroke="' + PAL[k % PAL.length] + '" stroke-width="22" stroke-dasharray="' + Math.max(len - 1.5, 0).toFixed(2) + ' ' + (C - Math.max(len - 1.5, 0)).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '"><title>' + esc(it.nama) + ': ' + A.num(it.jumlah) + ' (' + Math.round(it.jumlah / tot * 100) + '%)</title></circle>'; off += len; });
    s += '</g><text x="80" y="78" text-anchor="middle" style="font:800 20px Montserrat;fill:#0F1B33">' + A.num(tot) + '</text><text x="80" y="96" text-anchor="middle" style="font-size:10px">' + esc(label || 'total') + '</text></svg>';
    return '<div class="donut-wrap">' + s + '<div class="dl">' + items.map(function (it, k) { return '<div><i style="background:' + PAL[k % PAL.length] + '"></i>' + esc(it.nama) + '<b>' + Math.round(it.jumlah / tot * 100) + '%</b></div>'; }).join('') + '</div></div>';
  };
  document.addEventListener('pointermove', function (e) {
    var z = e.target.closest && e.target.closest('.chart [data-tip]'), ch = e.target.closest && e.target.closest('.chart');
    $$('.chart').forEach(function (c) { if (c !== ch) { var t = $('.tip', c); t && t.classList.remove('on'); $$('.pt', c).forEach(function (p) { p.style.opacity = 0; }); var h = $('.hl', c); h && (h.style.display = 'none'); } });
    if (!z || !ch) return;
    var tip = $('.tip', ch), cr = ch.getBoundingClientRect(), zr = z.getBoundingClientRect(), mx = z.dataset.x ? zr.left + zr.width / 2 : e.clientX;
    tip.innerHTML = z.dataset.tip; tip.style.left = Math.max(70, Math.min(cr.width - 70, mx - cr.left)) + 'px'; tip.style.top = (z.dataset.x ? (zr.top - cr.top + 40) : (zr.top - cr.top)) + 'px'; tip.classList.add('on');
    if (z.dataset.x) { var i = z.dataset.i, h2 = $('.hl', ch); h2.setAttribute('x1', z.dataset.x); h2.setAttribute('x2', z.dataset.x); h2.style.display = ''; $$('.pt', ch).forEach(function (p) { p.style.opacity = p.dataset.i === i ? 1 : 0; }); }
  }, { passive: true });

  /* ---------- shell ---------- */
  var ROLE_CS = ['dasbor', 'testimoni', 'faq', 'crm'];
  function allowed(id) { return A.user && (A.user.peran === 'admin' || ROLE_CS.indexOf(id) >= 0); }
  function buildMenu() {
    var groups = { dasbor: null, produk: 'Konten', crm: 'Pelanggan', pengaturan: 'Sistem' }, h = '';
    A.order.forEach(function (id) {
      var p = A.pages[id]; if (!p || !allowed(id)) return;
      if (groups[id]) h += '<div class="menu-sep">' + groups[id] + '</div>';
      h += '<a href="#/' + id + '" data-id="' + id + '"><span class="ms">' + p.icon + '</span>' + esc(p.title) + '</a>';
    });
    $('#menu').innerHTML = h;
  }
  A.route = function () {
    var id = (location.hash.replace(/^#\/?/, '') || 'dasbor').split('/')[0];
    if (!A.pages[id] || !allowed(id)) { location.hash = '#/dasbor'; return; }
    if (A.cleanup) { try { A.cleanup(); } catch (e) {} A.cleanup = null; }
    $$('#menu a').forEach(function (a) { a.classList.toggle('on', a.dataset.id === id); });
    $('#pageTitle').textContent = A.pages[id].title; document.title = A.pages[id].title + ' · Panel Admin';
    $('#shell').classList.remove('open'); var v = $('#view'); v.innerHTML = A.skeleton(3); window.scrollTo(0, 0);
    var tok = A.routeTok = Math.random(); Promise.resolve(A.pages[id].render(v, function () { return A.routeTok === tok; })).catch(function (e) { if (A.routeTok === tok) v.innerHTML = '<div class="card pad"><div class="empty"><span class="ms">cloud_off</span>' + esc(e.message || 'Gagal memuat halaman') + '<br><br><button class="b b-gold" onclick="Admin.route()">Coba lagi</button></div></div>'; });
  };
  function showApp(user) {
    A.user = user; $('#login').hidden = true; $('#shell').hidden = false; buildMenu();
    $('#uNama').textContent = user.nama || user.email; $('#uPeran').textContent = user.darurat ? 'akses darurat' : user.peran; $('#uAva').textContent = A.init(user.nama || user.email);
    A.route(); if (user.wajib_ganti) A.passDlg(true);
  }
  function showLogin(msg) { A.user = null; API.setToken(''); $('#shell').hidden = true; $('#login').hidden = false; $('#lgErr').textContent = msg || ''; $('#demoNote').hidden = !API.DEMO; API.warm('admin'); setTimeout(function () { $('#lgEmail').focus(); }, 50); }
  A.passDlg = function (wajib) {
    A.open({ title: wajib ? 'Ganti kata sandi awal' : 'Ganti kata sandi', locked: wajib, body: (wajib ? '<div class="alert warn mb"><span class="ms">shield</span><span>Demi keamanan, kata sandi awal wajib diganti sebelum melanjutkan.</span></div>' : '') + '<form class="form-grid" onsubmit="return false"><label class="full">Kata sandi saat ini<input type="password" id="pwLama" autocomplete="current-password"></label><label>Kata sandi baru<input type="password" id="pwBaru" autocomplete="new-password"><span class="hint">Minimal 8 karakter</span></label><label>Ulangi kata sandi baru<input type="password" id="pwUlang" autocomplete="new-password"></label></form>',
      actions: [wajib ? { t: 'Keluar', cls: 'b-line', fn: function (d) { d.close(); logout(); } } : { t: 'Batal', cls: 'b-line', fn: function (d) { d.close(); } }, { t: 'Simpan', cls: 'b-gold', fn: function (d) {
        var l = $('#pwLama').value, b = $('#pwBaru').value, u = $('#pwUlang').value;
        if (b.length < 8) { A.toast('Kata sandi baru minimal 8 karakter.', 'err'); return; } if (b !== u) { A.toast('Pengulangan kata sandi tidak sama.', 'err'); return; }
        return A.call('gantiPass', { lama: l, baru: b }).then(function (r) { if (r.token) API.setToken(r.token); A.user.wajib_ganti = false; d.locked = false; d.close(); A.toast('Kata sandi diperbarui.', 'ok'); });
      } }] });
  };
  function logout() { API.setToken(''); location.hash = ''; showLogin(''); }

  var darurat = false;
  function bindLogin() {
    $('#lgEye').onclick = function () { var i = $('#lgPass'); i.type = i.type === 'password' ? 'text' : 'password'; this.querySelector('.ms').textContent = i.type === 'password' ? 'visibility' : 'visibility_off'; };
    $('#lgDarurat').onclick = function () { darurat = !darurat; $('#loginTitle').textContent = darurat ? 'Akses darurat' : 'Masuk'; $('#lgEmail').closest('label').hidden = darurat; this.textContent = darurat ? 'Kembali ke login biasa' : 'Lupa kata sandi? Gunakan akses darurat'; $('#lgPass').value = ''; $('#lgErr').textContent = ''; };
    $('#loginForm').onsubmit = function (e) {
      e.preventDefault(); var em = $('#lgEmail').value.trim(), pw = $('#lgPass').value, err = $('#lgErr'); err.textContent = '';
      if ((!darurat && !em) || !pw) { err.textContent = darurat ? 'Isi kata sandi darurat.' : 'Isi email dan kata sandi.'; return; }
      A.busy($('#lgBtn'), API.post(darurat ? 'loginDarurat' : 'login', { email: em, password: pw }).then(function (r) { API.setToken(r.token); $('#lgPass').value = ''; showApp(r.user); }).catch(function (x) { err.textContent = x.message; }));
    };
    $('#userBtn').onclick = function (e) { e.stopPropagation(); var m = $('#uMenu'); m.hidden = !m.hidden; };
    document.addEventListener('click', function (e) { if (!e.target.closest('.top-r')) $('#uMenu').hidden = true; });
    $('#uMenu').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; this.hidden = true; if (b.dataset.act === 'logout') logout(); else if (A.user && A.user.darurat) A.toast('Akun darurat tidak punya kata sandi biasa.', 'err'); else A.passDlg(false); };
    $('#burger').onclick = function () { $('#shell').classList.add('open'); }; $('#sideClose').onclick = $('#sideBg').onclick = function () { $('#shell').classList.remove('open'); };
    window.addEventListener('hashchange', function () { if (A.user) A.route(); });
    window.addEventListener('lp:sesi-habis', function () { showLogin('Sesi berakhir. Silakan masuk kembali.'); });
  }
  A.start = function () {
    bindLogin();
    if (API.token()) API.post('me', {}).then(function (r) { showApp(r.user); }).catch(function () { showLogin(''); }); else showLogin('');
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(A.start, 0); }); else setTimeout(A.start, 0);
})();
