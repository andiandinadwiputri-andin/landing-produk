/* MODE DEMO — meniru API Apps Script memakai localStorage, supaya tampilan bisa dicoba
   sebelum backend dipasang. Tidak aktif bila API_URL di config.js terisi.
   Login demo: admin@demo.com / demo1234 */
(function () {
  var KEY = 'lp_demo_db_v1', db;
  function uid(p) { return p + '_' + Math.random().toString(36).slice(2, 10); }
  function pad(n) { return ('0' + n).slice(-2); }
  function tgl(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function now() { var d = new Date(); return tgl(d) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  function hp62(v) { var d = String(v || '').replace(/\D/g, ''); if (!d) return ''; if (d.indexOf('62') === 0) return d; if (d[0] === '0') return '62' + d.slice(1); if (d[0] === '8') return '62' + d; return d; }
  function hp08(v) { var d = hp62(v); return d ? '0' + d.slice(2) : ''; }
  function hpOk(v) { return /^628\d{7,12}$/.test(hp62(v)); }
  function gagal(m) { var e = new Error(m); e.demo = true; throw e; }
  function rnd(seed) { var x = Math.sin(seed * 9301 + 49297) * 233280; return x - Math.floor(x); }

  function seed() {
    var S = { Pengaturan: {
      brand_nama: 'Aura Digital', brand_tagline: 'Produk digital premium untuk bisnis yang ingin tumbuh', wa_nomor: '6281234567890', wa_pesan: 'Halo, saya tertarik dengan produk digital Anda.',
      kontak_email: 'halo@auradigital.id', kontak_alamat: 'Sorong, Papua Barat Daya', sosmed_instagram: '', sosmed_tiktok: '', sosmed_youtube: '',
      promo_aktif: '1', promo_label: 'Promo spesial berakhir dalam', promo_sampai: '', promo_ulang: '1', meta_judul: 'Aura Digital — Produk Digital Premium',
      meta_deskripsi: 'Template, e-book dan kursus digital siap pakai.', ui_kupu: '1', ui_kilau: '1', hero_interval: '5500', testi_interval: '6500', footer_teks: '© Aura Digital. Seluruh hak dilindungi.'
    },
    Hero: [
      { id: 'smp_h1', judul: 'Ubah Ide Jadi Penghasilan dengan *Produk Digital*', subjudul: 'Template siap pakai, e-book dan kelas online yang sudah terbukti membantu ratusan kreator.', gambar: 'img/hero-1.svg', tombol_teks: 'Lihat Produk', tombol_tautan: '#produk', aktif: '1', urutan: 1 },
      { id: 'smp_h2', judul: 'Hemat Waktu, Tampil *Profesional*', subjudul: 'Desain dan struktur yang sudah dirancang rapi — tinggal sesuaikan dan jual.', gambar: 'img/hero-2.svg', tombol_teks: 'Pelajari Fitur', tombol_tautan: '#fitur', aktif: '1', urutan: 2 },
      { id: 'smp_h3', judul: 'Bonus Eksklusif untuk *Pembeli Hari Ini*', subjudul: 'Dapatkan komunitas privat dan update seumur hidup tanpa biaya tambahan.', gambar: 'img/hero-3.svg', tombol_teks: 'Ambil Promo', tombol_tautan: '#harga', aktif: '1', urutan: 3 }],
    Seksi: [
      { id: 'masalah', judul: 'Apakah Anda *Mengalami* Ini?', subjudul: '', isi: JSON.stringify(['Konversi penjualan rendah meski trafik ramai', 'Calon pembeli ragu dan kurang percaya', 'Informasi produk tercecer di banyak tempat', 'Proses pembelian rumit dan membingungkan']), aktif: '1', urutan: 1 },
      { id: 'solusi', judul: 'Satu Halaman, *Semua Jawaban*', subjudul: 'Kami merangkum semua yang dibutuhkan calon pembeli dalam satu alur yang jelas: kenali masalah, lihat solusi, percaya lewat bukti, lalu beli dalam hitungan detik.', isi: '', aktif: '1', urutan: 2 },
      { id: 'proses', judul: 'Cara Mendapatkan Produk', subjudul: 'Lima langkah singkat', isi: JSON.stringify(['Pilih produk', 'Klik Beli Sekarang', 'Chat via WhatsApp', 'Lakukan pembayaran', 'Terima produk digital']), aktif: '1', urutan: 3 },
      { id: 'fitur', judul: 'Kenapa Memilih *Kami*', subjudul: 'Dirancang untuk hasil nyata', isi: '', aktif: '1', urutan: 4 },
      { id: 'testimoni', judul: 'Kata *Mereka*', subjudul: 'Pengalaman nyata dari pembeli kami', isi: '', aktif: '1', urutan: 5 },
      { id: 'harga', judul: 'Pilih Paket *Terbaik*', subjudul: 'Harga promo terbatas — segera amankan', isi: '', aktif: '1', urutan: 6 },
      { id: 'faq', judul: 'Pertanyaan *Umum*', subjudul: '', isi: '', aktif: '1', urutan: 7 }],
    Produk: [
      { id: 'smp_p1', nama: 'Paket Template Bisnis', kategori: 'Template', deskripsi: '50+ template siap pakai untuk dokumen, presentasi, dan media sosial.', harga_normal: 499000, harga_promo: 249000, gambar: ['img/p1-a.svg', 'img/p1-b.svg', 'img/p1-c.svg'], fitur: ['50+ template editable', 'Lisensi komersial', 'Update gratis'], bonus: ['Panduan penggunaan PDF'], badge: 'Terlaris', pesan_wa: 'Halo, saya ingin membeli Paket Template Bisnis.', link_beli: '', status: '1', urutan: 1 },
      { id: 'smp_p2', nama: 'E-Book Strategi Jualan Online', kategori: 'E-Book', deskripsi: 'Panduan langkah demi langkah menaikkan penjualan dari nol.', harga_normal: 199000, harga_promo: 99000, gambar: ['img/p2-a.svg', 'img/p2-b.svg'], fitur: ['120 halaman', 'Studi kasus nyata', 'Checklist siap cetak'], bonus: ['Template kalender konten'], badge: 'Baru', pesan_wa: 'Halo, saya ingin membeli E-Book Strategi Jualan Online.', link_beli: '', status: '1', urutan: 2 },
      { id: 'smp_p3', nama: 'Kelas Online Kreator Digital', kategori: 'Kursus', deskripsi: '12 modul video + komunitas privat untuk membangun produk digital pertama Anda.', harga_normal: 999000, harga_promo: 599000, gambar: ['img/p3-a.svg', 'img/p3-b.svg', 'img/p3-c.svg'], fitur: ['12 modul video', 'Komunitas privat', 'Sesi tanya jawab'], bonus: ['Akses seumur hidup', 'Sertifikat'], badge: 'Best Value', pesan_wa: 'Halo, saya ingin mendaftar Kelas Online Kreator Digital.', link_beli: '', status: '1', urutan: 3 }],
    Fitur: [
      { id: 'smp_f1', ikon: 'bolt', judul: 'Akses Instan', deskripsi: 'Produk dikirim otomatis setelah pembayaran terkonfirmasi.', aktif: '1', urutan: 1 },
      { id: 'smp_f2', ikon: 'verified_user', judul: 'Garansi Kepuasan', deskripsi: 'Tidak cocok? Hubungi kami dalam 7 hari.', aktif: '1', urutan: 2 },
      { id: 'smp_f3', ikon: 'update', judul: 'Update Seumur Hidup', deskripsi: 'Dapatkan pembaruan materi tanpa biaya tambahan.', aktif: '1', urutan: 3 },
      { id: 'smp_f4', ikon: 'support_agent', judul: 'Dukungan Responsif', deskripsi: 'Tim kami siap membantu lewat WhatsApp.', aktif: '1', urutan: 4 }],
    Testimoni: [
      { id: 'smp_t1', nama: 'Rina Maharani', jabatan: 'Pemilik Toko Online', foto: '', isi: 'Template-nya rapi dan mudah diedit. Dalam seminggu halaman toko saya sudah tampil jauh lebih profesional dan penjualan naik.', rating: 5, aktif: '1', urutan: 1 },
      { id: 'smp_t2', nama: 'Dedi Kurniawan', jabatan: 'Freelancer', foto: '', isi: 'E-book-nya praktis, langsung bisa dipraktikkan. Studi kasusnya relevan dengan bisnis kecil seperti saya.', rating: 5, aktif: '1', urutan: 2 },
      { id: 'smp_t3', nama: 'Siti Aminah', jabatan: 'Content Creator', foto: '', isi: 'Kelasnya terstruktur dan komunitasnya aktif. Produk digital pertama saya akhirnya rilis berkat modul ini.', rating: 5, aktif: '1', urutan: 3 },
      { id: 'smp_t4', nama: 'Yohanes Waromi', jabatan: 'Pemilik UMKM', foto: '', isi: 'Layanan cepat dan ramah. Saya langsung diarahkan lewat WhatsApp dan produk diterima dalam hitungan menit.', rating: 4, aktif: '1', urutan: 4 }],
    FAQ: [
      { id: 'smp_q1', tanya: 'Bagaimana cara menerima produk setelah membeli?', jawab: 'Setelah pembayaran terkonfirmasi, tautan unduhan dikirim melalui WhatsApp atau email Anda.', aktif: '1', urutan: 1 },
      { id: 'smp_q2', tanya: 'Apakah ada garansi?', jawab: 'Ya. Kami menyediakan garansi kepuasan 7 hari jika produk tidak sesuai deskripsi.', aktif: '1', urutan: 2 },
      { id: 'smp_q3', tanya: 'Metode pembayaran apa saja yang tersedia?', jawab: 'Transfer bank dan dompet digital. Detail dikirim oleh admin melalui WhatsApp.', aktif: '1', urutan: 3 },
      { id: 'smp_q4', tanya: 'Apakah produk bisa digunakan untuk keperluan komersial?', jawab: 'Bisa, sesuai lisensi yang tertera pada masing-masing produk.', aktif: '1', urutan: 4 }],
    kontak: [
      { id: 'k_1', nama: 'Rina Maharani', email: 'rina@contoh.id', wa: '628123450001', sumber: 'lead', tag: 'Paket Template Bisnis', status: 'pembeli', catatan: '', opt_out: '0', wa_valid: 'ya', dibuat: tgl(new Date(Date.now() - 5 * 864e5)) + ' 10:00:00', diubah: now() },
      { id: 'k_2', nama: 'Dedi Kurniawan', email: '', wa: '628123450002', sumber: 'lead', tag: 'E-Book Strategi Jualan Online', status: 'prospek', catatan: '', opt_out: '0', wa_valid: '', dibuat: tgl(new Date(Date.now() - 2 * 864e5)) + ' 14:20:00', diubah: now() },
      { id: 'k_3', nama: 'Siti Aminah', email: 'siti@contoh.id', wa: '', sumber: 'manual', tag: 'vip', status: 'baru', catatan: '', opt_out: '0', wa_valid: '', dibuat: tgl(new Date()) + ' 08:10:00', diubah: now() }],
    interaksi: [], klik: [], kunjungan: [], antrian: [], blast: [], backup: [],
    pengguna: [{ id: 'u1', email: 'admin@demo.com', nama: 'Admin Demo', peran: 'admin', pass: 'demo1234', aktif: '1', wajib_ganti: '0', wa: '' }, { id: 'u2', email: 'cs@demo.com', nama: 'CS Demo', peran: 'cs', pass: 'demo1234', aktif: '1', wajib_ganti: '0', wa: '' }],
    notif: {}, rahasia: {}, sumber_mig: '' };
    S.Pengaturan.promo_sampai = new Date(Date.now() + 7 * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    var sm = ['Instagram', 'WhatsApp', 'Google', 'Langsung', 'Facebook', 'TikTok'], tb = ['Beli Sekarang', 'Hero CTA', 'Chat WhatsApp', 'Paket Harga'], pf = ['Mobile', 'Mobile', 'Desktop', 'Tablet'], pn = ['Paket Template Bisnis', 'E-Book Strategi Jualan Online', 'Kelas Online Kreator Digital'];
    for (var i = 0; i < 90; i++) {
      var t = tgl(new Date(Date.now() - i * 864e5)), n = 12 + Math.floor(rnd(i + 1) * 28);
      for (var j = 0; j < n; j++) {
        var h = 8 + Math.floor(rnd(i * 50 + j) * 14), w = t + ' ' + pad(h) + ':' + pad(Math.floor(rnd(j + i) * 60)) + ':00', s = sm[Math.floor(rnd(i * 7 + j) * 6)], p = pf[Math.floor(rnd(i + j * 3) * 4)];
        S.kunjungan.push({ waktu: w, sumber: s, perangkat: p, jam: pad(h) });
        if (rnd(i * 13 + j * 5) < 0.28) S.klik.push({ waktu: w, sumber: s, perangkat: p, jam: pad(h), tombol: tb[Math.floor(rnd(i * 11 + j) * 4)], produk_nama: pn[Math.floor(rnd(i * 3 + j * 7) * 3)] });
      }
    }
    S.kunjungan.sort(function (a, b) { return a.waktu < b.waktu ? -1 : 1; }); S.klik.sort(function (a, b) { return a.waktu < b.waktu ? -1 : 1; });
    return S;
  }
  function load() { if (db) return db; try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) {} if (!db) { db = seed(); save(); } return db; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

  function sess(t) { var m = /^demo\.(.+)\.(\w+)$/.exec(t || ''); if (!m) return null; return { e: m[1], r: m[2] }; }
  var ENT = { produk: 'Produk', hero: 'Hero', seksi: 'Seksi', testimoni: 'Testimoni', faq: 'FAQ', fitur: 'Fitur' };
  var ARR = { gambar: 1, fitur: 1, bonus: 1 };
  function arr(v) { if (Array.isArray(v)) return v; if (!v) return []; return String(v).split(/\n|\|\|/).map(function (x) { return x.trim(); }).filter(Boolean); }
  var PUBKEY = /^(brand_|wa_|kontak_|sosmed_|promo_|meta_|ui_|footer_|logo|hero_|testi_)/;
  var NOTIF_EV = [
    { id: 'lead_baru', label: 'Lead / calon pembeli baru', tujuan: 'admin', wa: '1', email: '1', vars: 'nama, wa, email, produk, brand', tpl: '🔔 *Lead baru* — {brand}\nNama: {nama}\nWhatsApp: {wa}\nEmail: {email}\nProduk: {produk}', subjek: '[{brand}] Lead baru: {nama}' },
    { id: 'lead_sambutan', label: 'Sambutan otomatis ke calon pembeli', tujuan: 'kontak', wa: '1', email: '0', vars: 'nama, produk, brand', tpl: 'Halo {nama} 👋\nTerima kasih sudah tertarik dengan *{produk}* dari {brand}. Tim kami akan segera membalas chat Anda.', subjek: 'Terima kasih dari {brand}' },
    { id: 'klik_beli', label: 'Setiap klik tombol beli (ramai — default mati)', tujuan: 'admin', wa: '0', email: '0', vars: 'produk, tombol, sumber, waktu, brand', tpl: '👆 Klik beli: {produk}\nTombol: {tombol}\nSumber: {sumber}\nWaktu: {waktu}', subjek: '[{brand}] Klik beli: {produk}' }];
  function notifCfg(D) {
    var c = { notif_wa_aktif: '1', notif_email_aktif: '1', notif_admin_wa: '', notif_admin_email: '', notif_blast_batch: '20', notif_blast_jeda: '3-8', notif_footer_blast: '' };
    NOTIF_EV.forEach(function (e) { c['notif_' + e.id + '_wa'] = e.wa; c['notif_' + e.id + '_email'] = e.email; c['notif_' + e.id + '_tpl'] = e.tpl; c['notif_' + e.id + '_subjek'] = e.subjek; });
    for (var k in D.notif) c[k] = D.notif[k];
    return c;
  }
  function kirimNotif(D, ev, vars, o) {
    var c = notifCfg(D), e = NOTIF_EV.filter(function (x) { return x.id === ev; })[0]; if (!e) return;
    vars.brand = D.Pengaturan.brand_nama; var fill = function (s) { return s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] != null ? vars[k] : m; }); };
    var tw = e.tujuan === 'admin' ? hp62(c.notif_admin_wa || D.Pengaturan.wa_nomor) : hp62(o && o.wa), te = e.tujuan === 'admin' ? (c.notif_admin_email || D.Pengaturan.kontak_email) : (o && o.email);
    var base = { id: uid('q'), waktu: now(), event: ev, status: 'antri', coba: 0, error: '' };
    if (c.notif_wa_aktif === '1' && c['notif_' + ev + '_wa'] === '1' && hpOk(tw)) D.antrian.push(Object.assign({ kanal: 'wa', tujuan: hp08(tw), pesan: fill(c['notif_' + ev + '_tpl']) }, base, { id: uid('q') }));
    if (c.notif_email_aktif === '1' && c['notif_' + ev + '_email'] === '1' && te) D.antrian.push(Object.assign({ kanal: 'email', tujuan: te, pesan: fill(c['notif_' + ev + '_tpl']) }, base, { id: uid('q') }));
  }
  function upsertKontak(D, it) {
    var wa = hp62(it.wa), em = String(it.email || '').toLowerCase().trim(); if (!wa && !em) return null; if (wa && !hpOk(wa)) wa = '';
    var cur = D.kontak.filter(function (k) { return (wa && hp62(k.wa) === wa) || (em && k.email && k.email.toLowerCase() === em); })[0], w = now();
    var ord = { tidak_aktif: 0, baru: 1, prospek: 2, pembeli: 3 };
    if (cur) { cur.nama = cur.nama || it.nama || ''; cur.email = cur.email || em; cur.wa = cur.wa || wa; cur.tag = tagGab(cur.tag, it.tag); if (it.status && ord[it.status] > ord[cur.status]) cur.status = it.status; cur.diubah = w; cur._baru = false; return cur; }
    cur = { id: uid('k'), nama: it.nama || '', email: em, wa: wa, sumber: it.sumber || 'manual', tag: tagGab('', it.tag), status: it.status || 'baru', catatan: it.catatan || '', opt_out: '0', wa_valid: '', dibuat: w, diubah: w, _baru: true };
    D.kontak.push(cur); return cur;
  }
  function tagGab(a, b) { var s = {}, o = []; (String(a || '') + ',' + String(b || '')).split(',').forEach(function (t) { t = t.trim(); if (t && !s[t.toLowerCase()]) { s[t.toLowerCase()] = 1; o.push(t); } }); return o.join(', '); }
  function kOut(k) { var o = {}; for (var x in k) if (x[0] !== '_') o[x] = k[x]; o.wa = hp08(k.wa); return o; }
  function sortU(a, b) { return (Number(a.urutan) || 9999) - (Number(b.urutan) || 9999); }
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function aktif(v) { v = String(v).toLowerCase(); return v === '1' || v === 'true' || v === 'aktif'; }

  function stats(D, days) {
    var hari = [], idx = {}, prev = {}, i;
    for (i = days - 1; i >= 0; i--) { var t = tgl(new Date(Date.now() - i * 864e5)); idx[t] = hari.length; hari.push({ tgl: t, kunjungan: 0, klik: 0 }); }
    for (i = days * 2 - 1; i >= days; i--) prev[tgl(new Date(Date.now() - i * 864e5))] = 1;
    var pv = { kunjungan: 0, klik: 0 }, sm = {}, tb = {}, pf = {}, jam = [], pr = {};
    for (i = 0; i < 24; i++) jam.push(0);
    D.kunjungan.forEach(function (r) { var t = r.waktu.slice(0, 10); if (idx[t] !== undefined) { hari[idx[t]].kunjungan++; sm[r.sumber] = (sm[r.sumber] || 0) + 1; pf[r.perangkat] = (pf[r.perangkat] || 0) + 1; } else if (prev[t]) pv.kunjungan++; });
    D.klik.forEach(function (r) { var t = r.waktu.slice(0, 10); if (idx[t] !== undefined) { hari[idx[t]].klik++; tb[r.tombol] = (tb[r.tombol] || 0) + 1; jam[Number(r.jam) || 0]++; var p = r.produk_nama || 'Umum'; pr[p] = (pr[p] || 0) + 1; } else if (prev[t]) pv.klik++; });
    var tot = { kunjungan: 0, klik: 0 }; hari.forEach(function (h) { tot.kunjungan += h.kunjungan; tot.klik += h.klik; });
    var A = function (m) { return Object.keys(m).map(function (k) { return { nama: k, jumlah: m[k] }; }).sort(function (a, b) { return b.jumlah - a.jumlah; }); };
    return { ok: true, days: days, ringkas: { kunjungan: tot.kunjungan, klik: tot.klik, konversi: tot.kunjungan ? Math.round(tot.klik / tot.kunjungan * 1000) / 10 : 0, klikHariIni: hari[hari.length - 1].klik, kunjunganSebelum: pv.kunjungan, klikSebelum: pv.klik },
      harian: hari, sumber: A(sm), tombol: A(tb), perangkat: A(pf), jam: jam, produk: A(pr),
      terbaru: D.klik.slice(-15).reverse().map(function (r) { return { waktu: r.waktu, produk: r.produk_nama || '-', tombol: r.tombol, sumber: r.sumber, perangkat: r.perangkat, nama: r.nama || '' }; }), kontak: crmHit(D) };
  }
  function crmHit(D) { var t7 = tgl(new Date(Date.now() - 7 * 864e5)), o = { total: D.kontak.length, baru7: 0, prospek: 0, pembeli: 0, optout: 0, waValid: 0 }; D.kontak.forEach(function (k) { if (k.dibuat.slice(0, 10) >= t7) o.baru7++; if (k.status === 'prospek') o.prospek++; if (k.status === 'pembeli') o.pembeli++; if (aktif(k.opt_out)) o.optout++; if (k.wa_valid === 'ya') o.waValid++; }); return o; }
  function targetBlast(D, f) { f = f || {}; return D.kontak.filter(function (k) { if (aktif(k.opt_out) || !hpOk(k.wa) || k.wa_valid === 'tidak') return false; if (f.status && f.status !== 'semua' && k.status !== f.status) return false; if (f.sumber && f.sumber !== 'semua' && k.sumber !== f.sumber) return false; if (f.tag && String(k.tag).toLowerCase().indexOf(f.tag.toLowerCase()) < 0) return false; return true; }); }

  function run(a, d, t) {
    var D = load(), s;
    switch (a) {
      case 'pub': {
        var set = {}; for (var k in D.Pengaturan) if (PUBKEY.test(k)) set[k] = D.Pengaturan[k];
        var seksi = {}; D.Seksi.forEach(function (r) { if (aktif(r.aktif)) seksi[r.id] = { judul: r.judul, subjudul: r.subjudul, isi: r.isi }; });
        var ak = function (n) { return copy(D[n]).filter(function (r) { return aktif(r.aktif); }).sort(sortU); };
        return { ok: true, pengaturan: set, seksi: seksi, produk: copy(D.Produk).filter(function (p) { return aktif(p.status); }).sort(sortU), hero: ak('Hero'), testimoni: ak('Testimoni'), faq: ak('FAQ'), fitur: ak('Fitur'), demo: true };
      }
      case 'track': (d.ev || []).forEach(function (e) {
        var w = now(), base = { waktu: w, sumber: e.sumber, perangkat: e.perangkat, jam: w.slice(11, 13) };
        if (e.tipe === 'visit') D.kunjungan.push(base);
        else if (e.tipe === 'klik') { var p = D.Produk.filter(function (x) { return x.id === e.produk_id; })[0]; D.klik.push(Object.assign(base, { tombol: e.tombol, produk_nama: p ? p.nama : '' })); }
      }); save(); return { ok: true };
      case 'lead': {
        if (!String(d.nama || '').trim()) gagal('Nama wajib diisi.'); if (!hpOk(d.wa)) gagal('Nomor WhatsApp tidak valid.');
        var pr = D.Produk.filter(function (x) { return x.id === d.produk_id; })[0], kk = upsertKontak(D, { nama: d.nama, wa: d.wa, email: d.email, sumber: 'lead', tag: pr ? pr.nama : '', status: 'prospek' });
        D.interaksi.push({ id: uid('i'), waktu: now(), kontak_id: kk.id, jenis: 'lead', ringkas: 'Klik ' + (d.tombol || 'beli') + (pr ? ' · ' + pr.nama : '') });
        var w2 = now(); D.klik.push({ waktu: w2, sumber: d.sumber || 'Langsung', perangkat: d.perangkat || 'Mobile', jam: w2.slice(11, 13), tombol: d.tombol || 'Lead', produk_nama: pr ? pr.nama : '', nama: d.nama });
        var v = { nama: d.nama, wa: hp08(d.wa), email: d.email || '-', produk: pr ? pr.nama : '-' };
        kirimNotif(D, 'lead_baru', v); kirimNotif(D, 'lead_sambutan', v, { wa: d.wa, email: d.email }); save(); return { ok: true };
      }
      case 'login': {
        var u = D.pengguna.filter(function (x) { return x.email === String(d.email || '').trim().toLowerCase(); })[0];
        if (!u || !aktif(u.aktif) || u.pass !== d.password) gagal('Email atau kata sandi salah.');
        return { ok: true, token: 'demo.' + u.email + '.' + u.peran, user: { email: u.email, nama: u.nama, peran: u.peran, wajib_ganti: aktif(u.wajib_ganti) } };
      }
      case 'loginDarurat': if (d.password !== 'darurat123') gagal('Kata sandi darurat salah. (Demo: darurat123)'); return { ok: true, token: 'demo.darurat@local.admin', user: { email: 'darurat@local', nama: 'Akses Darurat', peran: 'admin', darurat: true } };
    }
    s = sess(t); if (!s) return { ok: false, kode: 401, pesan: 'Sesi berakhir. Silakan masuk kembali.' };
    if (a === 'batch') return { ok: true, hasil: (d.items || []).map(function (it) { try { return run(it.a, it.d || {}, t); } catch (e) { return { ok: false, pesan: e.message }; } }) };
    var m = /^(list|simpan|hapus|urut)_(\w+)$/.exec(a);
    if (m && ENT[m[2]]) {
      var n = ENT[m[2]], L = D[n];
      if (m[1] === 'list') return { ok: true, data: copy(L).sort(sortU) };
      if (m[1] === 'hapus') { D[n] = L.filter(function (r) { return r.id !== d.id; }); save(); return { ok: true }; }
      if (m[1] === 'urut') { (d.ids || []).forEach(function (id, i) { var r = L.filter(function (x) { return x.id === id; })[0]; if (r) r.urutan = i + 1; }); save(); return { ok: true }; }
      var o = copy(d), cur = L.filter(function (r) { return r.id === o.id; })[0];
      if (n === 'Produk') { if ((!cur || o.nama !== undefined) && !String(o.nama || '').trim()) gagal('Nama produk wajib diisi.'); for (var c in ARR) if (o[c] !== undefined) o[c] = arr(o[c]); if (o.harga_normal !== undefined) o.harga_normal = Number(String(o.harga_normal || 0).replace(/\D/g, '')); if (o.harga_promo !== undefined) o.harga_promo = Number(String(o.harga_promo || 0).replace(/\D/g, '')); }
      if (n === 'Testimoni' && (!cur || o.isi !== undefined) && !String(o.isi || '').trim()) gagal('Isi testimoni wajib diisi.');
      if (n === 'FAQ' && (!cur || o.tanya !== undefined) && !String(o.tanya || '').trim()) gagal('Pertanyaan wajib diisi.');
      if (cur) Object.assign(cur, o); else { o.id = o.id || uid(n.slice(0, 3).toLowerCase()); if (o.urutan === undefined) o.urutan = L.length + 1; L.push(o); cur = o; }
      save(); return { ok: true, data: copy(cur) };
    }
    switch (a) {
      case 'me': return { ok: true, user: { email: s.e, nama: s.e.split('@')[0], peran: s.r } };
      case 'gantiPass': { if (String(d.baru || '').length < 8) gagal('Kata sandi baru minimal 8 karakter.'); var uu = D.pengguna.filter(function (x) { return x.email === s.e; })[0]; if (uu) { if (uu.pass !== d.lama) gagal('Kata sandi lama salah.'); uu.pass = d.baru; uu.wajib_ganti = '0'; save(); } return { ok: true, token: 'demo.' + s.e + '.' + s.r }; }
      case 'stats': return stats(D, Math.min(90, Math.max(1, Number(d.days) || 30)));
      case 'setGet': return { ok: true, data: Object.assign({}, D.Pengaturan, D.notif) };
      case 'setSimpan': Object.assign(D.Pengaturan, d.data || {}); save(); return { ok: true };
      case 'rahasiaGet': return { ok: true, data: { FONNTE_TOKEN: { ada: !!D.rahasia.FONNTE_TOKEN, tersamar: D.rahasia.FONNTE_TOKEN ? D.rahasia.FONNTE_TOKEN.slice(0, 3) + '••••••' + D.rahasia.FONNTE_TOKEN.slice(-3) : '' } } };
      case 'rahasiaSimpan': if (d.kunci !== 'FONNTE_TOKEN') gagal('Kunci rahasia tidak diizinkan.'); if (String(d.nilai).indexOf('•') < 0) { D.rahasia.FONNTE_TOKEN = String(d.nilai || '').trim(); save(); } return run('rahasiaGet', {}, t);
      case 'unggah': return { ok: true, url: d.dataUrl || ('data:' + d.mime + ';base64,' + d.b64) };
      case 'akunList': return { ok: true, data: D.pengguna.map(function (x) { return { id: x.id, email: x.email, nama: x.nama, peran: x.peran, aktif: x.aktif, wajib_ganti: x.wajib_ganti, wa: x.wa }; }) };
      case 'akunSimpan': { var em = String(d.email || '').trim().toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) gagal('Email tidak valid.'); var ex = D.pengguna.filter(function (x) { return x.email === em; })[0], pw = ''; if (ex) { ex.nama = d.nama || ex.nama; ex.peran = d.peran === 'admin' ? 'admin' : 'cs'; ex.aktif = d.aktif === false || d.aktif === '0' ? '0' : '1'; ex.wa = d.wa || ''; } else { pw = Math.random().toString(36).slice(2, 12); D.pengguna.push({ id: uid('u'), email: em, nama: d.nama || em.split('@')[0], peran: d.peran === 'admin' ? 'admin' : 'cs', pass: pw, aktif: '1', wajib_ganti: '1', wa: d.wa || '' }); } save(); return { ok: true, kataSandiAwal: pw }; }
      case 'akunReset': { var ux = D.pengguna.filter(function (x) { return x.email === d.email; })[0]; if (!ux) gagal('Akun tidak ditemukan.'); ux.pass = Math.random().toString(36).slice(2, 12); ux.wajib_ganti = '1'; save(); return { ok: true, kataSandiBaru: ux.pass }; }
      case 'akunHapus': if (d.email === s.e) gagal('Tidak bisa menghapus akun Anda sendiri.'); D.pengguna = D.pengguna.filter(function (x) { return x.email !== d.email; }); save(); return { ok: true };
      /* CRM */
      case 'crmList': { var q = String(d.q || '').toLowerCase().trim(), rows = D.kontak.filter(function (k) { if (d.status && d.status !== 'semua' && k.status !== d.status) return false; if (d.sumber && d.sumber !== 'semua' && k.sumber !== d.sumber) return false; return !q || (k.nama + ' ' + k.email + ' ' + hp08(k.wa) + ' ' + k.tag).toLowerCase().indexOf(q) >= 0; }); rows.sort(function (x, y) { return x.diubah < y.diubah ? 1 : -1; }); var per = Number(d.per) || 50, pg = Number(d.page) || 1; return { ok: true, total: rows.length, page: pg, per: per, data: rows.slice((pg - 1) * per, pg * per).map(kOut) }; }
      case 'crmStats': { var bs = {}, bt = {}; D.kontak.forEach(function (k) { bs[k.sumber] = (bs[k.sumber] || 0) + 1; bt[k.status] = (bt[k.status] || 0) + 1; }); return { ok: true, ringkas: crmHit(D), sumber: bs, status: bt }; }
      case 'crmSumber': return { ok: true, data: [{ id: 'klik', label: 'Klik Beli yang berisi nama + WhatsApp' }, { id: 'pengguna', label: 'Tim admin / CS (akun pengguna)' }] };
      case 'crmDetail': { var kd = D.kontak.filter(function (k) { return k.id === d.id; })[0]; if (!kd) gagal('Kontak tidak ditemukan.'); return { ok: true, data: kOut(kd), interaksi: D.interaksi.filter(function (x) { return x.kontak_id === d.id; }).slice(-50).reverse() }; }
      case 'crmSimpan': {
        var wa = hp62(d.wa); if (!d.nama && !wa && !d.email) gagal('Isi minimal nama, email, atau WhatsApp.'); if (d.wa && !hpOk(wa)) gagal('Nomor WhatsApp tidak valid (contoh 08123456789).');
        if (d.id) { var kc = D.kontak.filter(function (k) { return k.id === d.id; })[0]; if (!kc) gagal('Kontak tidak ditemukan.'); Object.assign(kc, { nama: d.nama, email: String(d.email || '').toLowerCase(), wa: wa, tag: d.tag || '', status: d.status || 'baru', catatan: d.catatan || '', opt_out: aktif(d.opt_out) ? '1' : '0', diubah: now() }); save(); return { ok: true, data: kOut(kc) }; }
        var kn = upsertKontak(D, { nama: d.nama, wa: wa, email: d.email, sumber: 'manual', tag: d.tag, status: d.status, catatan: d.catatan }); save(); return { ok: true, data: kOut(kn) };
      }
      case 'crmHapus': D.kontak = D.kontak.filter(function (k) { return k.id !== d.id; }); save(); return { ok: true };
      case 'crmBulk': { var ids = d.ids || [], nn = 0; if (d.aksi === 'hapus') { D.kontak = D.kontak.filter(function (k) { if (ids.indexOf(k.id) >= 0) { nn++; return false; } return true; }); } else D.kontak.forEach(function (k) { if (ids.indexOf(k.id) < 0) return; if (d.aksi === 'tag') k.tag = tagGab(k.tag, d.nilai); else if (d.aksi === 'status') k.status = d.nilai; else if (d.aksi === 'optout') k.opt_out = aktif(d.nilai) ? '1' : '0'; else return; nn++; }); save(); return { ok: true, n: nn }; }
      case 'crmImport': { var list = (d.rows || []).filter(function (r) { return r.wa || r.email; }); if (d.simulasi) return { ok: true, simulasi: true, total: (d.rows || []).length, valid: list.length, dilewati: (d.rows || []).length - list.length }; var b = 0, up = 0; list.forEach(function (r) { var x = upsertKontak(D, { nama: r.nama, email: r.email, wa: r.wa, tag: r.tag, sumber: 'import' }); if (x) { x._baru ? b++ : up++; } }); save(); return { ok: true, baru: b, diperbarui: up, dilewati: (d.rows || []).length - list.length }; }
      case 'crmSync': { var sb = 0; D.klik.forEach(function (r) { if (r.wa && hpOk(r.wa)) { var x = upsertKontak(D, { nama: r.nama, wa: r.wa, sumber: 'lead', tag: r.produk_nama, status: 'prospek' }); if (x && x._baru) sb++; } }); D.pengguna.forEach(function (u) { var x = upsertKontak(D, { nama: u.nama, email: u.email, wa: u.wa, sumber: 'tim', tag: 'tim' }); if (x && x._baru) sb++; }); save(); return { ok: true, baru: sb, diperbarui: 0 }; }
      case 'crmGabung': { var seen = {}, dup = [], grup = 0; D.kontak.forEach(function (k) { var key = hp62(k.wa) || (k.email ? '@' + k.email.toLowerCase() : ''); if (!key) return; if (seen[key]) { seen[key].tag = tagGab(seen[key].tag, k.tag); dup.push(k.id); grup++; } else seen[key] = k; }); if (!d.simulasi) { D.kontak = D.kontak.filter(function (k) { return dup.indexOf(k.id) < 0; }); save(); } return { ok: true, simulasi: !!d.simulasi, grup: grup, duplikat: dup.length }; }
      case 'crmExport': { var esc = function (v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }, out = ['nama,email,wa,sumber,tag,status,opt_out,dibuat']; D.kontak.forEach(function (k) { if (d.status && d.status !== 'semua' && k.status !== d.status) return; out.push([k.nama, k.email, hp08(k.wa), k.sumber, k.tag, k.status, aktif(k.opt_out) ? 'ya' : 'tidak', k.dibuat].map(esc).join(',')); }); return { ok: true, csv: out.join('\n'), n: out.length - 1 }; }
      case 'crmValidasi': { if (!D.rahasia.FONNTE_TOKEN) gagal('Isi Token Fonnte dulu.'); var td = D.kontak.filter(function (k) { return hpOk(k.wa) && !k.wa_valid; }); td.forEach(function (k, i) { k.wa_valid = i % 5 === 4 ? 'tidak' : 'ya'; }); save(); return { ok: true, n: td.length, sisa: 0 }; }
      /* Notifikasi */
      case 'notifConfig': return { ok: true, config: notifCfg(D), events: NOTIF_EV.map(function (e) { return { id: e.id, label: e.label, tujuan: e.tujuan, vars: e.vars }; }), tokenAda: !!D.rahasia.FONNTE_TOKEN };
      case 'notifSimpan': Object.assign(D.notif, d.config || {}); save(); return { ok: true };
      case 'notifStatus': return D.rahasia.FONNTE_TOKEN ? { ok: true, terhubung: true, device: '0812xxxxxxx (demo)', status: 'connect' } : { ok: true, terhubung: false, pesan: 'Token Fonnte belum diisi.' };
      case 'notifTest': if (!hpOk(d.wa)) gagal('Nomor WhatsApp tidak valid.'); if (!D.rahasia.FONNTE_TOKEN) return { ok: false, pesan: 'Token Fonnte belum diisi.' }; return { ok: true };
      case 'notifAntrian': { var cn = { antri: 0, terkirim: 0, gagal: 0, batal: 0 }; D.antrian.forEach(function (r) { cn[r.status] = (cn[r.status] || 0) + 1; }); return { ok: true, hitung: cn, data: D.antrian.slice(-150).reverse().map(function (r) { return { id: r.id, waktu: r.waktu, kanal: r.kanal, tujuan: r.tujuan, event: r.event, status: r.status, coba: r.coba, error: r.error, pesan: String(r.pesan).slice(0, 80) }; }) }; }
      case 'notifJalankan': { var jn = 0; D.antrian.forEach(function (r) { if (r.status === 'antri' && jn < 30) { jn++; if (r.kanal === 'wa' && !D.rahasia.FONNTE_TOKEN) { r.coba++; r.error = 'Token Fonnte belum diisi'; if (r.coba >= 3) r.status = 'gagal'; } else r.status = 'terkirim'; } }); save(); return { ok: true, n: jn }; }
      case 'notifUlang': { var un = 0; D.antrian.forEach(function (r) { if (r.status === 'gagal') { r.status = 'antri'; r.coba = 0; r.error = ''; un++; } }); save(); return { ok: true, n: un }; }
      case 'notifBersih': { var bn = D.antrian.length; D.antrian = D.antrian.filter(function (r) { return r.status === 'antri'; }); save(); return { ok: true, n: bn - D.antrian.length }; }
      case 'blastPratinjau': return { ok: true, jumlah: targetBlast(D, d.filter).length };
      case 'blastBuat': { var tg = targetBlast(D, d.filter); if (String(d.pesan || '').trim().length < 5) gagal('Isi pesan blast terlalu pendek.'); if (!tg.length) gagal('Tidak ada kontak yang cocok dengan filter.'); var bid = uid('bl'); D.blast.unshift({ id: bid, waktu: now(), judul: d.judul || 'Blast', pesan: d.pesan, total: tg.length, batch: Number(d.batch) || 20, jeda: d.jeda || '3-8' }); tg.forEach(function (k) { D.antrian.push({ id: uid('q'), waktu: now(), kanal: 'wa', tujuan: hp08(k.wa), pesan: d.pesan.replace(/\{nama\}/g, k.nama || 'Kak'), status: 'antri', coba: 0, error: '', event: 'blast', ref: bid }); }); save(); return { ok: true, id: bid, total: tg.length, perMenit: Number(d.batch) || 20, estimasiMenit: Math.ceil(tg.length / (Number(d.batch) || 20)) }; }
      case 'blastList': return { ok: true, data: D.blast.map(function (b) { var c = { antri: 0, terkirim: 0, gagal: 0, batal: 0 }; D.antrian.forEach(function (r) { if (r.ref === b.id) c[r.status]++; }); return Object.assign({}, b, c, { status: b.batal ? 'dibatalkan' : (c.antri > 0 ? 'berjalan' : 'selesai') }); }) };
      case 'blastBatal': { var bb = D.blast.filter(function (b) { return b.id === d.id; })[0]; if (bb) bb.batal = true; var cb = 0; D.antrian.forEach(function (r) { if (r.ref === d.id && r.status === 'antri') { r.status = 'batal'; cb++; } }); save(); return { ok: true, dibatalkan: cb }; }
      /* Migrasi & backup */
      case 'migStatus': return { ok: true, sumberId: D.sumber_mig ? D.sumber_mig.slice(0, 6) + '…' : '', entitas: [{ id: 'produk', label: 'Produk' }, { id: 'testimoni', label: 'Testimoni' }, { id: 'faq', label: 'FAQ' }, { id: 'fitur', label: 'Fitur / Keunggulan' }, { id: 'kontak', label: 'Kontak (CRM)' }], terakhir: D.mig_terakhir || '' };
      case 'migPindai': gagal('Mode demo: migrasi membutuhkan backend Apps Script yang sudah terpasang.');
      case 'migJalankan': gagal('Mode demo: migrasi membutuhkan backend Apps Script yang sudah terpasang.');
      case 'backupList': return { ok: true, data: D.backup.slice().reverse(), simpan: 8 };
      case 'backupBuat': D.backup.push({ id: uid('bk'), nama: 'BACKUP_' + now().replace(/\D/g, '') + '_manual', waktu: now().slice(0, 16), url: '#' }); save(); return { ok: true };
      case 'backupHapus': D.backup = D.backup.filter(function (b) { return b.id !== d.id; }); save(); return { ok: true };
      case 'backupPulihkan': return { ok: true, sheets: d.sheets || [] };
      case 'backupAtur': return { ok: true, simpan: d.simpan };
    }
    gagal('Aksi tidak dikenal: ' + a);
  }
  window.Demo = {
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} db = null; },
    handle: function (a, d, t) {
      return new Promise(function (res) {
        setTimeout(function () { try { res(run(a, d, t)); } catch (e) { res({ ok: false, pesan: e.message }); } }, 120);
      });
    }
  };
})();
