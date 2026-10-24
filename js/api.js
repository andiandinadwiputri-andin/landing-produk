/* Klien API: fetch ke Google Apps Script (POST text/plain → tanpa preflight CORS),
   cache SWR di localStorage, dedupe permintaan baca, batcher pelacakan. */
(function () {
  var C = window.APP_CONFIG || {}, DEMO = !C.API_URL;
  var TOKEN_KEY = 'lp_token', inflight = {}, epoch = 0, queue = [], timer = null;

  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function token() { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch (e) {} }

  function timeout(ms) { var c = new AbortController(); setTimeout(function () { c.abort(); }, ms); return c.signal; }

  function raw(a, d, opt) {
    opt = opt || {};
    if (DEMO) return window.Demo.handle(a, d || {}, token());
    return fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ a: a, d: d || {}, t: token() }), signal: timeout(opt.timeout || 45000), redirect: 'follow' })
      .then(function (r) { return r.json(); });
  }
  var READ = /^(me|stats|list_|crm(List|Stats|Detail|Export|Sumber)|notif(Config|Antrian|Status)|blast(List|Pratinjau)|akunList|setGet|rahasiaGet|migStatus|backupList)/;

  function post(a, d, opt) {
    var key = READ.test(a) ? a + JSON.stringify(d || {}) : null, ep = epoch;
    if (key && inflight[key] && inflight[key].ep === ep) return inflight[key].p;
    if (!key) epoch++;
    var p = raw(a, d, opt).then(function (res) {
      if (res && res.kode === 401 && a !== 'login') { setToken(''); window.dispatchEvent(new Event('lp:sesi-habis')); }
      if (!res || res.ok === false) { var e = new Error((res && res.pesan) || 'Permintaan gagal'); e.res = res; throw e; }
      return res;
    }, function (err) {
      var e = new Error(err && err.name === 'AbortError' ? 'Server terlalu lama merespons. Coba lagi.' : 'Tidak dapat terhubung ke server. Periksa koneksi internet.'); e.jaringan = true; throw e;
    });
    if (key) { inflight[key] = { p: p, ep: ep }; var clr = function () { if (inflight[key] && inflight[key].p === p) delete inflight[key]; }; p.then(clr, clr); }
    return p;
  }

  /* Data landing: tampilkan cache dulu (SWR), lalu perbarui */
  function pub(onData) {
    var cached = ls('lp_pub'), got = false;
    if (cached) { try { var j = JSON.parse(cached); got = true; onData(j, 'cache'); } catch (e) {} }
    var req = DEMO ? Promise.resolve(window.Demo.handle('pub', {})) : fetch(C.API_URL + '?a=pub', { signal: timeout(30000) }).then(function (r) { return r.json(); });
    return req.then(function (res) {
      if (!res || !res.ok) throw new Error('gagal');
      ls('lp_pub', JSON.stringify(res)); onData(res, 'net'); return res;
    }).catch(function (e) { if (!got) throw e; });
  }

  /* Pelacakan: dikumpulkan lalu dikirim sekaligus */
  function sid() { var s = ls('lp_sid'); if (!s) { s = Math.random().toString(36).slice(2, 12) + Date.now().toString(36); ls('lp_sid', s); } return s; }
  function sumber() {
    try {
      var q = new URLSearchParams(location.search), u = (q.get('utm_source') || q.get('src') || '').toLowerCase(), r = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : '', t = u || r;
      if (!t || r === location.hostname) return 'Langsung';
      if (/instagram|ig/.test(t)) return 'Instagram'; if (/wa\.|whatsapp/.test(t)) return 'WhatsApp'; if (/google/.test(t)) return 'Google';
      if (/facebook|fb\./.test(t)) return 'Facebook'; if (/tiktok/.test(t)) return 'TikTok'; if (/youtube|youtu\.be/.test(t)) return 'YouTube';
      return 'Lainnya';
    } catch (e) { return 'Langsung'; }
  }
  function perangkat() { var w = window.innerWidth; return w < 700 ? 'Mobile' : w < 1100 ? 'Tablet' : 'Desktop'; }
  function track(ev) {
    ev.sid = sid(); ev.sumber = ev.sumber || sumber(); ev.perangkat = perangkat();
    queue.push(ev); if (queue.length >= 10) flush(); else if (!timer) timer = setTimeout(flush, 3500);
  }
  function flush(beacon) {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!queue.length) return;
    var ev = queue.splice(0, 20);
    if (DEMO) { window.Demo.handle('track', { ev: ev }); return; }
    var body = JSON.stringify({ a: 'track', d: { ev: ev } });
    try {
      if (beacon && navigator.sendBeacon) navigator.sendBeacon(C.API_URL, new Blob([body], { type: 'text/plain;charset=utf-8' }));
      else fetch(C.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body, keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  window.addEventListener('pagehide', function () { flush(true); });
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(true); });

  function warm(w) { if (!DEMO) { try { fetch(C.API_URL + '?w=' + w, { mode: 'no-cors' }).catch(function () {}); } catch (e) {} } }

  window.API = { DEMO: DEMO, post: post, pub: pub, track: track, flush: flush, warm: warm, token: token, setToken: setToken, ls: ls, sid: sid, sumber: sumber, perangkat: perangkat,
    batch: function (items) { return post('batch', { items: items }); } };
})();
