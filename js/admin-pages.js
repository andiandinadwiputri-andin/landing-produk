/* Admin — halaman: Dasbor, Produk & Harga, Seksi Halaman, Testimoni, FAQ */
(function () {
  'use strict';
  var A = window.Admin, $ = A.$, $$ = A.$$, esc = A.esc;

  /* ---------- komponen bersama ---------- */
  A.galeri = function (host, list, o) {
    o = o || {}; var max = o.max || 12, busy = false;
    function draw() {
      host.innerHTML = '<div class="ig">' + list.map(function (u, i) {
        return '<div class="it"><img src="' + esc(A.safe(u)) + '" alt="Gambar ' + (i + 1) + '">' + (i === 0 && max > 1 ? '<span class="no1">Utama</span>' : '') + '<div class="tools">' + (max > 1 ? '<button type="button" data-g="l" data-i="' + i + '" aria-label="Geser ke kiri"' + (i === 0 ? ' disabled' : '') + '><span class="ms">chevron_left</span></button><button type="button" data-g="r" data-i="' + i + '" aria-label="Geser ke kanan"' + (i === list.length - 1 ? ' disabled' : '') + '><span class="ms">chevron_right</span></button>' : '') + '<button type="button" data-g="x" data-i="' + i + '" aria-label="Hapus gambar"><span class="ms">delete</span></button></div></div>';
      }).join('') + (list.length < max || max === 1 ? '<label class="add"><span class="ms">' + (busy ? 'hourglass_top' : 'add_photo_alternate') + '</span>' + (busy ? 'Mengunggah…' : (max === 1 && list.length ? 'Ganti' : 'Unggah')) + '<input type="file" accept="image/*"' + (max > 1 ? ' multiple' : '') + ' hidden></label>' : '') + '</div>' +
        '<div class="row mt" style="gap:8px"><input type="text" class="grow" placeholder="atau tempel URL gambar (https://…)" data-g-url><button type="button" class="b b-line b-sm" data-g="u">Tambah</button></div><p class="hint" style="margin-top:6px">' + (o.hint || (max > 1 ? 'Gambar pertama jadi sampul. Lebih dari satu gambar → tampil sebagai slideshow otomatis.' : 'Gambar dikompres otomatis sebelum diunggah.')) + '</p>';
    }
    host.addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]'); if (!b) return; var i = Number(b.dataset.i), g = b.dataset.g;
      if (g === 'x') list.splice(i, 1); else if (g === 'l' && i > 0) list.splice(i - 1, 0, list.splice(i, 1)[0]); else if (g === 'r' && i < list.length - 1) list.splice(i + 1, 0, list.splice(i, 1)[0]);
      else if (g === 'u') { var inp = $('[data-g-url]', host), u = inp.value.trim(); if (!/^https?:\/\//i.test(u) && !/^img\//.test(u)) { A.toast('URL harus diawali https://', 'err'); return; } if (max === 1) list.length = 0; list.push(u); }
      draw();
    });
    host.addEventListener('change', function (e) {
      if (e.target.type !== 'file') return; var files = Array.prototype.slice.call(e.target.files).slice(0, max === 1 ? 1 : max - list.length); if (!files.length) return;
      busy = true; draw();
      files.reduce(function (p, f) { return p.then(function () { return A.upload(f).then(function (u) { if (max === 1) list.length = 0; list.push(u); }).catch(function (x) { A.toast(f.name + ': ' + x.message, 'err'); }); }); }, Promise.resolve()).then(function () { busy = false; draw(); });
    });
    draw(); return { get: function () { return list.slice(); } };
  };
  function fd(root) { var o = {}; $$('[name]', root).forEach(function (el) { o[el.name] = el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value; }); return o; }
  A.fd = fd;
  function reorder(ent, list, id, dir) {
    var ids = list.map(function (x) { return x.id; }), i = ids.indexOf(id), j = i + dir; if (i < 0 || j < 0 || j >= ids.length) return Promise.resolve();
    ids.splice(j, 0, ids.splice(i, 1)[0]); return A.call('urut_' + ent, { ids: ids });
  }
  function arrows(i, n, id) { return '<button class="ib" data-act="up" data-id="' + id + '" aria-label="Naik"' + (i === 0 ? ' disabled' : '') + '><span class="ms">arrow_upward</span></button><button class="ib" data-act="down" data-id="' + id + '" aria-label="Turun"' + (i === n - 1 ? ' disabled' : '') + '><span class="ms">arrow_downward</span></button>'; }
  function emptyBox(ic, t, btn) { return '<div class="empty"><span class="ms">' + ic + '</span>' + t + (btn ? '<br><br>' + btn : '') + '</div>'; }
  function pct(a, b) { if (!b) return a ? '<span class="delta up">baru</span>' : '<span class="delta zero">—</span>'; var d = Math.round((a - b) / b * 100); return '<span class="delta ' + (d > 0 ? 'up' : d < 0 ? 'dn' : 'zero') + '"><span class="ms" style="font-size:1.1em">' + (d > 0 ? 'trending_up' : d < 0 ? 'trending_down' : 'trending_flat') + '</span>' + (d > 0 ? '+' : '') + d + '% vs periode lalu</span>'; }

  /* =================== DASBOR =================== */
  A.pages.dasbor = { title: 'Dasbor', icon: 'dashboard', render: function (v, alive) {
    var days = Number(API.ls('lp_days')) || 30, admin = A.user.peran === 'admin', S = null;
    function load(segar) {
      var items = [{ a: 'stats', d: { days: days, segar: !!segar } }]; if (admin) items.push({ a: 'notifAntrian', d: {} });
      return API.batch(items).then(function (r) { if (!alive()) return; S = r.hasil[0]; draw(S, r.hasil[1]); });
    }
    function draw(s, q) {
      var r = s.ringkas, lab = s.harian.map(function (h) { return A.tglPendek(h.tgl); }), conv = s.harian.map(function (h) { return h.kunjungan ? Math.round(h.klik / h.kunjungan * 1000) / 10 : 0; });
      var k = s.kontak || {};
      v.innerHTML = '<div class="page-head"><div><h2>Ringkasan Performa</h2><p>Data kunjungan dan klik tombol beli pada halaman penjualan.</p></div><div class="row"><div class="seg" id="dSeg">' + [7, 30, 90].map(function (d) { return '<button data-d="' + d + '"' + (d === days ? ' class="on"' : '') + '>' + d + ' hari</button>'; }).join('') + '</div><button class="b b-line" id="dCsv"><span class="ms">download</span> CSV</button><button class="b b-line" id="dRef"><span class="ms">refresh</span></button></div></div>' +
        '<div class="kpis">' +
        '<div class="card kpi"><span class="ic"><span class="ms">groups</span></span><small>Pengunjung</small><b>' + A.num(r.kunjungan) + '</b>' + pct(r.kunjungan, r.kunjunganSebelum) + '</div>' +
        '<div class="card kpi"><span class="ic"><span class="ms">ads_click</span></span><small>Klik Tombol Beli</small><b>' + A.num(r.klik) + '</b>' + pct(r.klik, r.klikSebelum) + '</div>' +
        '<div class="card kpi"><span class="ic"><span class="ms">percent</span></span><small>Konversi (klik ÷ pengunjung)</small><b>' + r.konversi + '%</b><span class="sub">rata-rata ' + days + ' hari</span></div>' +
        '<div class="card kpi"><span class="ic"><span class="ms">today</span></span><small>Klik Hari Ini</small><b>' + A.num(r.klikHariIni) + '</b><span class="sub">' + A.num(k.total || 0) + ' kontak di CRM</span></div></div>' +
        '<div class="charts">' +
        '<div class="card pad c-8"><div class="chart-h"><div><h3>Kunjungan &amp; Klik Beli Harian</h3><span class="sub">' + days + ' hari terakhir</span></div><div class="legend"><span><i style="background:#2F6FDE"></i>Kunjungan</span><span><i style="background:#D4A640"></i>Klik beli</span></div></div>' + A.line({ labels: lab, tipLabels: s.harian.map(function (h) { return h.tgl; }), series: [{ name: 'Kunjungan', color: '#2F6FDE', data: s.harian.map(function (h) { return h.kunjungan; }) }, { name: 'Klik beli', color: '#D4A640', data: s.harian.map(function (h) { return h.klik; }) }], area: false }) + '</div>' +
        '<div class="card pad c-4"><div class="chart-h"><div><h3>Tombol CTA Paling Diklik</h3><span class="sub">Distribusi klik</span></div></div>' + A.donut(s.tombol, 'klik') + '</div>' +
        '<div class="card pad c-6"><div class="chart-h"><div><h3>Tren Konversi</h3><span class="sub">Klik beli ÷ pengunjung per hari</span></div></div>' + A.line({ labels: lab, tipLabels: s.harian.map(function (h) { return h.tgl; }), series: [{ name: 'Konversi', color: '#1C9E5B', data: conv }], area: true, fmtY: function (x) { return x + '%'; }, fmtTip: function (x) { return x + '%'; }, h: 230 }) + '</div>' +
        '<div class="card pad c-6"><div class="chart-h"><div><h3>Sumber Trafik</h3><span class="sub">Dari mana pengunjung datang</span></div></div>' + A.hbars(s.sumber) + '</div>' +
        '<div class="card pad c-4"><div class="chart-h"><div><h3>Perangkat</h3><span class="sub">Mobile vs desktop</span></div></div>' + A.donut(s.perangkat, 'kunjungan') + '</div>' +
        '<div class="card pad c-8"><div class="chart-h"><div><h3>Jam Ramai Klik Beli</h3><span class="sub">Waktu setempat (WIT) — batang emas tua = puncak</span></div></div>' + A.vbars({ labels: s.jam.map(function (_, i) { return ('0' + i).slice(-2); }), data: s.jam, unit: 'klik', h: 210 }) + '</div>' +
        '<div class="card c-8"><div class="pad" style="padding-bottom:6px"><h3>Klik Beli Terbaru</h3></div><div class="tbl-wrap">' + (s.terbaru.length ? '<table class="resp"><thead><tr><th>Waktu</th><th>Produk</th><th>Tombol</th><th>Sumber</th><th>Perangkat</th></tr></thead><tbody>' + s.terbaru.map(function (t) { return '<tr><td data-l="Waktu">' + A.dt(t.waktu) + '</td><td data-l="Produk">' + esc(t.produk) + (t.nama ? ' <span class="chip gold">' + esc(t.nama) + '</span>' : '') + '</td><td data-l="Tombol">' + esc(t.tombol) + '</td><td data-l="Sumber">' + esc(t.sumber) + '</td><td data-l="Perangkat">' + esc(t.perangkat) + '</td></tr>'; }).join('') + '</tbody></table>' : emptyBox('ads_click', 'Belum ada klik pada periode ini.')) + '</div></div>' +
        '<div class="c-4" style="display:grid;gap:16px;align-content:start"><div class="card pad"><div class="chart-h"><h3>Produk Terpopuler</h3></div>' + A.hbars(s.produk, { maks: 4 }) + '</div>' +
        '<div class="card pad"><div class="chart-h"><h3>Pelanggan &amp; Notifikasi</h3><a class="b b-line b-sm" href="#/crm">CRM</a></div><div class="mini"><div><b>' + A.num(k.total || 0) + '</b><small>Kontak</small></div><div><b>' + A.num(k.prospek || 0) + '</b><small>Prospek</small></div><div><b>' + A.num(k.pembeli || 0) + '</b><small>Pembeli</small></div></div>' + (q ? '<p class="sub mt">Antrean notifikasi: <b>' + (q.hitung.antri || 0) + '</b> menunggu · <b>' + (q.hitung.terkirim || 0) + '</b> terkirim · <b style="color:var(--bad)">' + (q.hitung.gagal || 0) + '</b> gagal</p>' : '') + '</div></div>' +
        '</div>';
      $('#dSeg', v).onclick = function (e) { var b = e.target.closest('[data-d]'); if (!b) return; days = Number(b.dataset.d); API.ls('lp_days', String(days)); v.innerHTML = A.skeleton(3); load(); };
      $('#dRef', v).onclick = function () { A.busy(this, load(true)); };
      $('#dCsv', v).onclick = function () { var rows = [['Tanggal', 'Kunjungan', 'Klik beli', 'Konversi (%)']]; s.harian.forEach(function (h, i) { rows.push([h.tgl, h.kunjungan, h.klik, conv[i]]); }); rows.push([], ['Ringkasan ' + days + ' hari', r.kunjungan, r.klik, r.konversi]); rows.push([], ['Sumber', 'Jumlah']); s.sumber.forEach(function (x) { rows.push([x.nama, x.jumlah]); }); rows.push([], ['Tombol CTA', 'Jumlah']); s.tombol.forEach(function (x) { rows.push([x.nama, x.jumlah]); }); A.download('statistik-' + days + 'hari.csv', A.csv(rows)); };
    }
    return load();
  } };

  /* =================== PRODUK & HARGA =================== */
  A.pages.produk = { title: 'Produk & Harga', icon: 'sell', render: function (v, alive) {
    var list = [];
    function load() { return A.call('list_produk', {}).then(function (r) { if (!alive()) return; list = r.data; draw(); }); }
    function draw() {
      var aktif = list.filter(function (p) { return A.on(p.status); }), avg = aktif.length ? Math.round(aktif.reduce(function (a, p) { return a + (Number(p.harga_promo) || Number(p.harga_normal)); }, 0) / aktif.length) : 0;
      var disk = aktif.filter(function (p) { return p.harga_promo > 0 && p.harga_normal > p.harga_promo; }), avgD = disk.length ? Math.round(disk.reduce(function (a, p) { return a + (1 - p.harga_promo / p.harga_normal) * 100; }, 0) / disk.length) : 0;
      v.innerHTML = '<div class="page-head"><div><h2>Produk &amp; Harga</h2><p>Kelola katalog, harga promo, galeri gambar, dan bonus.</p></div><button class="b b-gold" data-act="add"><span class="ms">add</span> Tambah Produk</button></div>' +
        '<div class="kpis"><div class="card kpi"><span class="ic"><span class="ms">inventory_2</span></span><small>Total Produk</small><b>' + list.length + '</b></div><div class="card kpi"><span class="ic"><span class="ms">visibility</span></span><small>Tayang di Situs</small><b>' + aktif.length + '</b></div><div class="card kpi"><span class="ic"><span class="ms">payments</span></span><small>Rata-rata Harga Promo</small><b style="font-size:1.4rem">' + A.rp(avg) + '</b></div><div class="card kpi"><span class="ic"><span class="ms">percent</span></span><small>Rata-rata Diskon</small><b>' + avgD + '%</b></div></div>' +
        '<div class="card">' + (list.length ? '<div class="tbl-wrap"><table class="resp"><thead><tr><th>Produk</th><th>Harga</th><th>Galeri</th><th>Status</th><th style="text-align:right">Aksi</th></tr></thead><tbody>' + list.map(function (p, i) {
          var im = A.arr(p.gambar);
          return '<tr><td data-l="Produk"><div class="pn">' + (im[0] ? '<img class="thumb" src="' + esc(A.safe(im[0])) + '" alt="">' : '<span class="thumb" style="display:grid;place-items:center;color:#9aa8c0"><span class="ms">image</span></span>') + '<div><b>' + esc(p.nama) + '</b><small>' + esc(p.kategori || '—') + (p.badge ? ' · <span class="chip gold">' + esc(p.badge) + '</span>' : '') + '</small></div></div></td>' +
            '<td data-l="Harga"><b>' + A.rp(p.harga_promo > 0 ? p.harga_promo : p.harga_normal) + '</b>' + (p.harga_promo > 0 && p.harga_normal > p.harga_promo ? '<br><small style="text-decoration:line-through;color:var(--tx2)">' + A.rp(p.harga_normal) + '</small>' : '') + '</td>' +
            '<td data-l="Galeri"><span class="chip ' + (im.length > 1 ? 'ok' : '') + '">' + im.length + ' gambar' + (im.length > 1 ? ' · slideshow' : '') + '</span></td>' +
            '<td data-l="Status">' + A.switch('st', A.on(p.status), ' data-act="tog" data-id="' + p.id + '" aria-label="Tayangkan ' + esc(p.nama) + '"') + '</td>' +
            '<td data-l="Aksi" style="text-align:right;white-space:nowrap">' + arrows(i, list.length, p.id) + '<button class="ib" data-act="edit" data-id="' + p.id + '" aria-label="Ubah"><span class="ms">edit</span></button><button class="ib red" data-act="del" data-id="' + p.id + '" aria-label="Hapus"><span class="ms">delete</span></button></td></tr>';
        }).join('') + '</tbody></table></div>' : emptyBox('inventory_2', 'Belum ada produk.', '<button class="b b-gold" data-act="add">Tambah Produk Pertama</button>')) + '</div>';
    }
    v.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; var id = b.dataset.id, p = list.filter(function (x) { return x.id === id; })[0];
      if (b.dataset.act === 'add') form(null); else if (b.dataset.act === 'edit') form(p);
      else if (b.dataset.act === 'up' || b.dataset.act === 'down') reorder('produk', list, id, b.dataset.act === 'up' ? -1 : 1).then(load);
      else if (b.dataset.act === 'del') A.confirm('Hapus produk "' + p.nama + '"? Tindakan ini tidak bisa dibatalkan.', { danger: true, ok: 'Hapus' }).then(function (y) { if (y) A.call('hapus_produk', { id: id }).then(function () { A.toast('Produk dihapus.', 'ok'); load(); }); });
    };
    v.onchange = function (e) { var b = e.target.closest('[data-act=tog]'); if (!b) return; A.call('simpan_produk', { id: b.dataset.id, status: b.checked ? '1' : '0' }).then(function () { A.toast(b.checked ? 'Produk ditayangkan.' : 'Produk disembunyikan.', 'ok'); }).catch(load); };
    function form(p) {
      p = p || { status: '1', gambar: [], fitur: [], bonus: [] }; var g;
      A.open({ kind: 'drawer', title: p.id ? 'Ubah Produk' : 'Tambah Produk', body:
        '<form id="pf" onsubmit="return false"><div class="fsec"><h4><span class="ms">info</span> Informasi Dasar</h4><div class="form-grid"><label class="full">Nama produk *<input name="nama" required value="' + esc(p.nama) + '" maxlength="100"></label><label>Kategori<input name="kategori" value="' + esc(p.kategori) + '" placeholder="Template / E-Book / Kursus"></label><label>Label (badge)<input name="badge" value="' + esc(p.badge) + '" placeholder="Terlaris, Baru, Best Value"></label><label class="full">Deskripsi singkat<textarea name="deskripsi" maxlength="400">' + esc(p.deskripsi) + '</textarea></label></div></div>' +
        '<div class="fsec"><h4><span class="ms">payments</span> Harga</h4><div class="form-grid"><label>Harga normal (Rp)<input name="harga_normal" inputmode="numeric" value="' + (Number(p.harga_normal) || '') + '"></label><label>Harga promo (Rp)<input name="harga_promo" inputmode="numeric" value="' + (Number(p.harga_promo) || '') + '"></label><div class="full hint" id="hemat">Kosongkan harga promo jika tidak ada diskon.</div></div></div>' +
        '<div class="fsec"><h4><span class="ms">photo_library</span> Galeri Gambar</h4><div id="gal"></div></div>' +
        '<div class="fsec"><h4><span class="ms">checklist</span> Fitur &amp; Bonus</h4><div class="form-grid"><label>Fitur (satu per baris)<textarea name="fitur" rows="5">' + esc(A.arr(p.fitur).join('\n')) + '</textarea></label><label>Bonus (satu per baris)<textarea name="bonus" rows="5">' + esc(A.arr(p.bonus).join('\n')) + '</textarea></label></div></div>' +
        '<div class="fsec"><h4><span class="ms">shopping_bag</span> Tombol Beli</h4><div class="form-grid"><label class="full">Pesan WhatsApp otomatis<textarea name="pesan_wa" rows="2" placeholder="Halo, saya ingin membeli …">' + esc(p.pesan_wa) + '</textarea></label><label class="full">Tautan checkout (opsional)<input name="link_beli" value="' + esc(p.link_beli) + '" placeholder="https://… (jika diisi, menggantikan WhatsApp)"></label></div></div>' +
        '<div class="fsec row sp"><div><b>Tayangkan di situs</b><div class="hint">Produk nonaktif disembunyikan dari pengunjung.</div></div>' + A.switch('status', A.on(p.status)) + '</div></form>',
        onMount: function (d) { g = A.galeri($('#gal', d.el), A.arr(p.gambar).slice(), { max: 8 }); var hm = function () { var f = fd($('#pf', d.el)), n = Number(String(f.harga_normal).replace(/\D/g, '')), pr = Number(String(f.harga_promo).replace(/\D/g, '')); $('#hemat', d.el).textContent = n && pr && pr < n ? 'Diskon ' + Math.round((1 - pr / n) * 100) + '% — hemat ' + A.rp(n - pr) : (pr > n && n ? 'Harga promo lebih tinggi dari harga normal.' : 'Kosongkan harga promo jika tidak ada diskon.'); }; $('#pf', d.el).addEventListener('input', hm); hm(); },
        actions: [{ t: 'Batal', cls: 'b-line', fn: function (d) { d.close(); } }, { t: 'Simpan Produk', cls: 'b-gold', fn: function (d) {
          var f = fd($('#pf', d.el)); if (!f.nama.trim()) { A.toast('Nama produk wajib diisi.', 'err'); return; }
          var pr = Number(String(f.harga_promo).replace(/\D/g, '')), nm = Number(String(f.harga_normal).replace(/\D/g, '')); if (pr && nm && pr > nm) { A.toast('Harga promo tidak boleh lebih tinggi dari harga normal.', 'err'); return; }
          f.id = p.id; f.gambar = g.get(); f.fitur = f.fitur.split('\n').map(function (x) { return x.trim(); }).filter(Boolean); f.bonus = f.bonus.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
          return A.call('simpan_produk', f).then(function () { d.close(); A.toast('Produk disimpan.', 'ok'); load(); });
        } }] });
    }
    return load();
  } };

  /* =================== SEKSI HALAMAN =================== */
  var SEKSI_LABEL = { masalah: ['Masalah / Problem', 'report', 'Satu poin per baris'], solusi: ['Solusi', 'lightbulb', ''], proses: ['Cara Pesan (langkah)', 'format_list_numbered', 'Satu langkah per baris'], fitur: ['Judul Keunggulan', 'star', ''], testimoni: ['Judul Testimoni', 'reviews', ''], harga: ['Judul Harga', 'sell', ''], faq: ['Judul FAQ', 'help', ''] };
  A.pages.seksi = { title: 'Seksi Halaman', icon: 'web', render: function (v, alive) {
    var tab = API.ls('lp_tab_seksi') || 'hero', data = { hero: [], seksi: [], fitur: [] };
    function load() { return API.batch([{ a: 'list_hero' }, { a: 'list_seksi' }, { a: 'list_fitur' }]).then(function (r) { if (!alive()) return; data.hero = r.hasil[0].data; data.seksi = r.hasil[1].data; data.fitur = r.hasil[2].data; draw(); }); }
    function draw() {
      v.innerHTML = '<div class="page-head"><div><h2>Seksi Halaman</h2><p>Atur slide hero, teks tiap bagian, dan daftar keunggulan.</p></div></div><div class="tabs" id="stab">' + [['hero', 'Hero Slideshow'], ['seksi', 'Teks Seksi'], ['fitur', 'Keunggulan']].map(function (t) { return '<button data-t="' + t[0] + '"' + (t[0] === tab ? ' class="on"' : '') + '>' + t[1] + '</button>'; }).join('') + '</div><div id="tbody"></div>';
      $('#stab', v).onclick = function (e) { var b = e.target.closest('[data-t]'); if (b) { tab = b.dataset.t; API.ls('lp_tab_seksi', tab); draw(); } };
      var tb = $('#tbody', v);
      if (tab === 'hero') tb.innerHTML = '<div class="alert info mb"><span class="ms">slideshow</span><span>Setiap slide = satu gambar latar + teks. Tambahkan <b>lebih dari satu slide aktif</b> agar hero berganti otomatis. Gunakan <code>*kata*</code> untuk menyorot kata dengan huruf emas miring.</span></div><div class="row sp mb"><span class="sub">' + data.hero.length + ' slide</span><button class="b b-gold" data-act="add-hero"><span class="ms">add</span> Tambah Slide</button></div><div class="card">' + (data.hero.length ? '<div class="tbl-wrap"><table class="resp"><thead><tr><th>Slide</th><th>Tombol</th><th>Aktif</th><th style="text-align:right">Aksi</th></tr></thead><tbody>' + data.hero.map(function (h, i) { return '<tr><td data-l="Slide"><div class="pn">' + (h.gambar ? '<img class="thumb" style="width:84px;height:48px" src="' + esc(A.safe(h.gambar)) + '" alt="">' : '<span class="thumb" style="width:84px;height:48px"></span>') + '<div><b>' + esc(String(h.judul).replace(/\*/g, '')) + '</b><small>' + esc(String(h.subjudul).slice(0, 70)) + '</small></div></div></td><td data-l="Tombol">' + esc(h.tombol_teks) + ' → <code>' + esc(h.tombol_tautan) + '</code></td><td data-l="Aktif">' + A.switch('a', A.on(h.aktif), ' data-act="tog-hero" data-id="' + h.id + '"') + '</td><td data-l="Aksi" style="text-align:right;white-space:nowrap">' + arrows(i, data.hero.length, h.id) + '<button class="ib" data-act="edit-hero" data-id="' + h.id + '" aria-label="Ubah"><span class="ms">edit</span></button><button class="ib red" data-act="del-hero" data-id="' + h.id + '" aria-label="Hapus"><span class="ms">delete</span></button></td></tr>'; }).join('') + '</tbody></table></div>' : emptyBox('slideshow', 'Belum ada slide. Situs memakai tampilan bawaan.')) + '</div>';
      if (tab === 'seksi') tb.innerHTML = '<div class="card"><div class="tbl-wrap"><table class="resp"><thead><tr><th>Bagian</th><th>Judul</th><th>Tampil</th><th style="text-align:right">Aksi</th></tr></thead><tbody>' + data.seksi.map(function (s) { var l = SEKSI_LABEL[s.id] || [s.id, 'article', '']; return '<tr><td data-l="Bagian"><div class="pn"><span class="thumb" style="width:40px;height:40px;display:grid;place-items:center;color:var(--gold)"><span class="ms">' + l[1] + '</span></span><b>' + esc(l[0]) + '</b></div></td><td data-l="Judul">' + esc(String(s.judul).replace(/\*/g, '')) + '</td><td data-l="Tampil">' + A.switch('a', A.on(s.aktif), ' data-act="tog-seksi" data-id="' + s.id + '"') + '</td><td data-l="Aksi" style="text-align:right"><button class="ib" data-act="edit-seksi" data-id="' + s.id + '" aria-label="Ubah"><span class="ms">edit</span></button></td></tr>'; }).join('') + '</tbody></table></div></div>';
      if (tab === 'fitur') tb.innerHTML = '<div class="row sp mb"><span class="sub">' + data.fitur.length + ' keunggulan</span><button class="b b-gold" data-act="add-fitur"><span class="ms">add</span> Tambah</button></div><div class="card">' + (data.fitur.length ? '<div class="tbl-wrap"><table class="resp"><thead><tr><th>Keunggulan</th><th>Aktif</th><th style="text-align:right">Aksi</th></tr></thead><tbody>' + data.fitur.map(function (f, i) { return '<tr><td data-l="Keunggulan"><div class="pn"><span class="thumb" style="width:42px;height:42px;display:grid;place-items:center;background:#FFF4D6;color:#B8860B"><span class="ms">' + esc(f.ikon || 'star') + '</span></span><div><b>' + esc(f.judul) + '</b><small>' + esc(f.deskripsi) + '</small></div></div></td><td data-l="Aktif">' + A.switch('a', A.on(f.aktif), ' data-act="tog-fitur" data-id="' + f.id + '"') + '</td><td data-l="Aksi" style="text-align:right;white-space:nowrap">' + arrows(i, data.fitur.length, f.id) + '<button class="ib" data-act="edit-fitur" data-id="' + f.id + '" aria-label="Ubah"><span class="ms">edit</span></button><button class="ib red" data-act="del-fitur" data-id="' + f.id + '" aria-label="Hapus"><span class="ms">delete</span></button></td></tr>'; }).join('') + '</tbody></table></div>' : emptyBox('star', 'Belum ada keunggulan.')) + '</div>';
    }
    var NAMA = { hero: 'Slide', fitur: 'Keunggulan' };
    v.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return; var m = /^(\w+)-(hero|seksi|fitur)$/.exec(b.dataset.act), act = m ? m[1] : b.dataset.act, ent = m ? m[2] : '', id = b.dataset.id;
      var item = ent ? data[ent].filter(function (x) { return x.id === id; })[0] : null;
      if (act === 'add' || act === 'edit') { if (ent === 'hero') formHero(item); else if (ent === 'fitur') formFitur(item); else if (ent === 'seksi') formSeksi(item); }
      else if (act === 'up' || act === 'down') { var e2 = tab === 'fitur' ? 'fitur' : 'hero'; reorder(e2, data[e2], id, act === 'up' ? -1 : 1).then(load); }
      else if (act === 'del') A.confirm('Hapus ' + NAMA[ent] + ' ini?', { danger: true, ok: 'Hapus' }).then(function (y) { if (y) A.call('hapus_' + ent, { id: id }).then(function () { A.toast('Dihapus.', 'ok'); load(); }); });
    };
    v.onchange = function (e) { var b = e.target.closest('[data-act^=tog]'); if (!b) return; var ent = b.dataset.act.split('-')[1]; A.call('simpan_' + ent, { id: b.dataset.id, aktif: b.checked ? '1' : '0' }).then(function () { A.toast('Disimpan.', 'ok'); }).catch(load); };
    function formHero(h) {
      h = h || { aktif: '1', tombol_teks: 'Lihat Produk', tombol_tautan: '#produk' }; var g, links = ['#produk', '#fitur', '#testimoni', '#harga', '#faq'];
      A.open({ kind: 'drawer', title: h.id ? 'Ubah Slide Hero' : 'Tambah Slide Hero', body: '<form id="hf" onsubmit="return false"><div class="fsec"><h4><span class="ms">image</span> Gambar Latar</h4><div id="gal"></div></div><div class="fsec"><h4><span class="ms">title</span> Teks</h4><div class="form-grid"><label class="full">Judul * <small>(pakai *kata* untuk huruf emas miring)</small><input name="judul" value="' + esc(h.judul) + '" maxlength="120"></label><label class="full">Sub-judul<textarea name="subjudul" maxlength="260">' + esc(h.subjudul) + '</textarea></label><label>Teks tombol<input name="tombol_teks" value="' + esc(h.tombol_teks) + '" maxlength="30"></label><label>Tujuan tombol<input name="tombol_tautan" list="lk" value="' + esc(h.tombol_tautan) + '"><datalist id="lk">' + links.map(function (l) { return '<option value="' + l + '">'; }).join('') + '</datalist></label></div></div><div class="fsec row sp"><b>Aktif</b>' + A.switch('aktif', A.on(h.aktif)) + '</div></form>',
        onMount: function (d) { g = A.galeri($('#gal', d.el), h.gambar ? [h.gambar] : [], { max: 1, hint: 'Disarankan rasio lebar (16:9), min. 1400px. Sisi kiri gambar ditimpa gelap agar teks terbaca.' }); },
        actions: [{ t: 'Batal', cls: 'b-line', fn: function (d) { d.close(); } }, { t: 'Simpan', cls: 'b-gold', fn: function (d) { var f = fd($('#hf', d.el)); if (!f.judul.trim()) { A.toast('Judul wajib diisi.', 'err'); return; } f.id = h.id; f.gambar = g.get()[0] || ''; return A.call('simpan_hero', f).then(function () { d.close(); A.toast('Slide disimpan.', 'ok'); load(); }); } }] });
    }
    function formSeksi(s) {
      var l = SEKSI_LABEL[s.id] || [s.id, '', ''], list = !!l[2];
      A.open({ title: 'Ubah: ' + l[0], body: '<form id="sf" class="form-grid" onsubmit="return false"><label class="full">Judul <small>(pakai *kata* untuk huruf emas miring)</small><input name="judul" value="' + esc(s.judul) + '" maxlength="120"></label><label class="full">Sub-judul / paragraf<textarea name="subjudul" rows="3">' + esc(s.subjudul) + '</textarea></label>' + (list ? '<label class="full">Isi (' + l[2].toLowerCase() + ')<textarea name="isi" rows="6">' + esc(A.arr(s.isi).join('\n')) + '</textarea></label>' : '') + '<div class="full row sp"><b>Tampilkan bagian ini</b>' + A.switch('aktif', A.on(s.aktif)) + '</div></form>',
        actions: [{ t: 'Batal', cls: 'b-line', fn: function (d) { d.close(); } }, { t: 'Simpan', cls: 'b-gold', fn: function (d) { var f = fd($('#sf', d.el)); f.id = s.id; if (list) f.isi = JSON.stringify(f.isi.split('\n').map(function (x) { return x.trim(); }).filter(Boolean)); return A.call('simpan_seksi', f).then(function () { d.close(); A.toast('Disimpan.', 'ok'); load(); }); } }] });
    }
    function formFitur(f) {
      f = f || { aktif: '1', ikon: 'star' }; var ik = ['bolt', 'verified_user', 'update', 'support_agent', 'workspace_premium', 'rocket_launch', 'diversity_3', 'lock', 'savings', 'school', 'auto_awesome', 'thumb_up'];
      A.open({ title: f.id ? 'Ubah Keunggulan' : 'Tambah Keunggulan', body: '<form id="ff" class="form-grid" onsubmit="return false"><label class="full">Judul *<input name="judul" value="' + esc(f.judul) + '" maxlength="60"></label><label class="full">Deskripsi<textarea name="deskripsi" maxlength="200">' + esc(f.deskripsi) + '</textarea></label><label class="full">Ikon <small>(nama Material Symbols)</small><input name="ikon" id="ikIn" value="' + esc(f.ikon) + '"></label><div class="full chips" id="ikList">' + ik.map(function (i) { return '<button type="button" class="chip" data-i="' + i + '" style="cursor:pointer"><span class="ms" style="font-size:1.2em">' + i + '</span></button>'; }).join('') + '</div><div class="full row sp"><b>Aktif</b>' + A.switch('aktif', A.on(f.aktif)) + '</div></form>',
        onMount: function (d) { $('#ikList', d.el).onclick = function (e) { var b = e.target.closest('[data-i]'); if (b) $('#ikIn', d.el).value = b.dataset.i; }; },
        actions: [{ t: 'Batal', cls: 'b-line', fn: function (d) { d.close(); } }, { t: 'Simpan', cls: 'b-gold', fn: function (d) { var x = fd($('#ff', d.el)); if (!x.judul.trim()) { A.toast('Judul wajib diisi.', 'err'); return; } x.id = f.id; return A.call('simpan_fitur', x).then(function () { d.close(); A.toast('Disimpan.', 'ok'); load(); }); } }] });
    }
    return load();
  } };

  /* =================== TESTIMONI =================== */
  A.pages.testimoni = { title: 'Testimoni', icon: 'reviews', render: function (v, alive) {
    var list = [];
    function load() { return A.call('list_testimoni', {}).then(function (r) { if (!alive()) return; list = r.data; draw(); }); }
    function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += '<span class="ms" style="font-size:1.05em;color:' + (i <= n ? '#D4A640' : '#d5dbe6') + ';font-variation-settings:\'FILL\' 1">star</span>'; return s; }
    function draw() {
      v.innerHTML = '<div class="page-head"><div><h2>Testimoni</h2><p>Bukti sosial yang tampil sebagai karusel otomatis di situs (klik kartu → pop-up).</p></div><button class="b b-gold" data-act="add"><span class="ms">add</span> Tambah Testimoni</button></div>' +
        (list.length ? '<div class="charts">' + list.map(function (t, i) { return '<div class="card pad c-6" style="display:flex;flex-direction:column;gap:12px"><div class="row sp"><div class="pn"><span class="ava" style="width:44px;height:44px">' + (t.foto ? '<img src="' + esc(A.safe(t.foto)) + '" alt="">' : A.init(t.nama)) + '</span><div><b>' + esc(t.nama) + '</b><small>' + esc(t.jabatan) + '</small></div></div><div>' + stars(Number(t.rating) || 5) + '</div></div><p style="color:var(--tx2);flex:1">“' + esc(t.isi) + '”</p><div class="row sp"><div class="row" style="gap:8px">' + A.switch('a', A.on(t.aktif), ' data-act="tog" data-id="' + t.id + '" aria-label="Tampilkan"') + '<span class="sub">' + (A.on(t.aktif) ? 'Tampil' : 'Disembunyikan') + '</span></div><div style="white-space:nowrap">' + arrows(i, list.length, t.id) + '<button class="ib" data-act="edit" data-id="' + t.id + '" aria-label="Ubah"><span class="ms">edit</span></button><button class="ib red" data-act="del" data-id="' + t.id + '" aria-label="Hapus"><span class="ms">delete</span></button></div></div></div>'; }).join('') + '</div>' : '<div class="card">' + emptyBox('reviews', 'Belum ada testimoni.', '<button class="b b-gold" data-act="add">Tambah Testimoni</button>') + '</div>');
    }
    v.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b || b.dataset.act === 'tog') return; var id = b.dataset.id, t = list.filter(function (x) { return x.id === id; })[0];
      if (b.dataset.act === 'add') form(null); else if (b.dataset.act === 'edit') form(t);
      else if (b.dataset.act === 'up' || b.dataset.act === 'down') reorder('testimoni', list, id, b.dataset.act === 'up' ? -1 : 1).then(load);
      else if (b.dataset.act === 'del') A.confirm('Hapus testimoni dari ' + t.nama + '?', { danger: true, ok: 'Hapus' }).then(function (y) { if (y) A.call('hapus_testimoni', { id: id }).then(function () { A.toast('Dihapus.', 'ok'); load(); }); });
    };
    v.onchange = function (e) { var b = e.target.closest('[data-act=tog]'); if (b) A.call('simpan_testimoni', { id: b.dataset.id, aktif: b.checked ? '1' : '0' }).then(load).catch(load); };
    function form(t) {
      t = t || { aktif: '1', rating: 5 }; var g;
      A.open({ kind: 'drawer', title: t.id ? 'Ubah Testimoni' : 'Tambah Testimoni', body: '<form id="tf" onsubmit="return false"><div class="fsec"><h4><span class="ms">person</span> Pemberi Testimoni</h4><div class="form-grid"><label>Nama *<input name="nama" value="' + esc(t.nama) + '" maxlength="60"></label><label>Jabatan / profesi<input name="jabatan" value="' + esc(t.jabatan) + '" maxlength="60"></label><label>Rating<select name="rating">' + [5, 4, 3, 2, 1].map(function (n) { return '<option value="' + n + '"' + (Number(t.rating) === n ? ' selected' : '') + '>' + '★'.repeat(n) + ' (' + n + ')</option>'; }).join('') + '</select></label></div><div class="mt"><b style="font-size:.84rem;color:var(--tx2)">Foto (opsional)</b><div id="gal" style="margin-top:8px"></div></div></div><div class="fsec"><h4><span class="ms">format_quote</span> Isi Testimoni</h4><label>Isi lengkap *<textarea name="isi" rows="6" maxlength="800">' + esc(t.isi) + '</textarea></label></div><div class="fsec row sp"><b>Tampilkan di situs</b>' + A.switch('aktif', A.on(t.aktif)) + '</div></form>',
        onMount: function (d) { g = A.galeri($('#gal', d.el), t.foto ? [t.foto] : [], { max: 1, hint: 'Foto bulat — gunakan gambar persegi.' }); },
        actions: [{ t: 'Batal', cls: 'b-line', fn: function (d) { d.close(); } }, { t: 'Simpan', cls: 'b-gold', fn: function (d) { var f = fd($('#tf', d.el)); if (!f.nama.trim() || !f.isi.trim()) { A.toast('Nama dan isi testimoni wajib diisi.', 'err'); return; } f.id = t.id; f.foto = g.get()[0] || ''; return A.call('simpan_testimoni', f).then(function () { d.close(); A.toast('Testimoni disimpan.', 'ok'); load(); }); } }] });
    }
    return load();
  } };

  /* =================== FAQ =================== */
  A.pages.faq = { title: 'FAQ', icon: 'help', render: function (v, alive) {
    var list = [];
    function load() { return A.call('list_faq', {}).then(function (r) { if (!alive()) return; list = r.data; draw(); }); }
    function draw() {
      v.innerHTML = '<div class="page-head"><div><h2>Pertanyaan Umum (FAQ)</h2><p>Jawab keraguan calon pembeli. Tampil sebagai akordeon di situs.</p></div><button class="b b-gold" data-act="add"><span class="ms">add</span> Tambah FAQ</button></div><div class="card">' + (list.length ? '<div class="tbl-wrap"><table class="resp"><thead><tr><th>Pertanyaan &amp; jawaban</th><th>Tampil</th><th style="text-align:right">Aksi</th></tr></thead><tbody>' + list.map(function (f, i) { return '<tr><td data-l="FAQ"><b>' + esc(f.tanya) + '</b><div class="sub" style="max-width:640px">' + esc(String(f.jawab).slice(0, 140)) + (String(f.jawab).length > 140 ? '…' : '') + '</div></td><td data-l="Tampil">' + A.switch('a', A.on(f.aktif), ' data-act="tog" data-id="' + f.id + '"') + '</td><td data-l="Aksi" style="text-align:right;white-space:nowrap">' + arrows(i, list.length, f.id) + '<button class="ib" data-act="edit" data-id="' + f.id + '" aria-label="Ubah"><span class="ms">edit</span></button><button class="ib red" data-act="del" data-id="' + f.id + '" aria-label="Hapus"><span class="ms">delete</span></button></td></tr>'; }).join('') + '</tbody></table></div>' : emptyBox('help', 'Belum ada FAQ.', '<button class="b b-gold" data-act="add">Tambah FAQ</button>')) + '</div>';
    }
    v.onclick = function (e) {
      var b = e.target.closest('[data-act]'); if (!b || b.dataset.act === 'tog') return; var id = b.dataset.id, f = list.filter(function (x) { return x.id === id; })[0];
      if (b.dataset.act === 'add') form(null); else if (b.dataset.act === 'edit') form(f);
      else if (b.dataset.act === 'up' || b.dataset.act === 'down') reorder('faq', list, id, b.dataset.act === 'up' ? -1 : 1).then(load);
      else if (b.dataset.act === 'del') A.confirm('Hapus pertanyaan ini?', { danger: true, ok: 'Hapus' }).then(function (y) { if (y) A.call('hapus_faq', { id: id }).then(function () { A.toast('Dihapus.', 'ok'); load(); }); });
    };
    v.onchange = function (e) { var b = e.target.closest('[data-act=tog]'); if (b) A.call('simpan_faq', { id: b.dataset.id, aktif: b.checked ? '1' : '0' }).catch(load); };
    function form(f) {
      f = f || { aktif: '1' };
      A.open({ title: f.id ? 'Ubah FAQ' : 'Tambah FAQ', body: '<form id="qf" class="form-grid" onsubmit="return false"><label class="full">Pertanyaan *<input name="tanya" value="' + esc(f.tanya) + '" maxlength="200"></label><label class="full">Jawaban *<textarea name="jawab" rows="5" maxlength="1000">' + esc(f.jawab) + '</textarea></label><div class="full row sp"><b>Tampilkan di situs</b>' + A.switch('aktif', A.on(f.aktif)) + '</div></form>',
        actions: [{ t: 'Batal', cls: 'b-line', fn: function (d) { d.close(); } }, { t: 'Simpan', cls: 'b-gold', fn: function (d) { var x = fd($('#qf', d.el)); if (!x.tanya.trim() || !x.jawab.trim()) { A.toast('Pertanyaan dan jawaban wajib diisi.', 'err'); return; } x.id = f.id; return A.call('simpan_faq', x).then(function () { d.close(); A.toast('FAQ disimpan.', 'ok'); load(); }); } }] });
    }
    return load();
  } };
})();
