/* Kupu-kupu hidup: satu karakter, mengikuti kursor ke mana pun.
   Canvas kecil (190px) yang digeser lewat transform → ringan.
   Fisik: steering + inersia, kepakan sayap bergantung kecepatan, antena bergoyang,
   mengitari kursor, melambat saat kursor diam. Menghormati prefers-reduced-motion. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var S = 190, C = S / 2, cv, ctx, raf = 0, on = false, last = 0, t = 0;
  var P = { x: innerWidth * .72, y: innerHeight * .3, vx: 0, vy: 0, head: 0, phase: 0, mx: null, my: null, idle: 0, excite: 0, near: false, seen: false, orbit: 0 };

  function init() {
    cv = document.createElement('canvas'); cv.id = 'kupu'; cv.setAttribute('aria-hidden', 'true');
    var dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = S * dpr; cv.height = S * dpr;
    ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); document.body.appendChild(cv);
    var move = function (e) { P.mx = e.clientX; P.my = e.clientY; P.idle = 0; P.seen = true; P.near = !!(e.target && e.target.closest && e.target.closest('.btn-gold,.wa-fab,.glow,button,a')); };
    addEventListener('pointermove', move, { passive: true });
    addEventListener('pointerdown', function (e) { move(e); P.excite = 1; }, { passive: true });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : (on && start()); });
  }

  /* ---------- gambar ---------- */
  var FORE = new Path2D('M3 -6 C8 -36 40 -66 66 -52 C77 -44 72 -22 60 -8 C46 2 20 4 3 2 Z');
  var HIND = new Path2D('M3 0 C22 -3 54 2 58 22 C62 42 40 54 26 44 C14 37 8 22 3 8 Z');
  var FSPOTS = [[62, -46, 2.3], [66, -36, 2], [68, -26, 2], [64, -15, 1.8], [56, -52, 1.8], [46, -55, 1.6], [34, -50, 1.5]];
  var HSPOTS = [[56, 16, 2.3], [57, 26, 2], [52, 36, 2], [44, 44, 1.8], [34, 47, 1.6], [24, 41, 1.4]];
  var FV = [[66, -52], [70, -38], [66, -20], [56, -8], [44, -50], [30, -42]], HV = [[56, 12], [58, 28], [48, 44], [34, 48], [24, 36]];

  function wing(sx, mirror) {
    ctx.save(); ctx.scale(mirror * sx, 1);
    // sayap belakang
    var gh = ctx.createRadialGradient(6, 6, 2, 36, 26, 56); gh.addColorStop(0, '#ffe9a0'); gh.addColorStop(.45, '#f4a82a'); gh.addColorStop(1, '#d9701a');
    ctx.fillStyle = gh; ctx.fill(HIND);
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(40,20,0,.7)'; ctx.beginPath(); HV.forEach(function (p) { ctx.moveTo(3, 3); ctx.lineTo(p[0] * .92, p[1] * .92); }); ctx.stroke();
    ctx.lineWidth = 3.4; ctx.strokeStyle = '#1b1208'; ctx.lineJoin = 'round'; ctx.stroke(HIND);
    ctx.fillStyle = 'rgba(255,255,255,.92)'; HSPOTS.forEach(function (s) { ctx.beginPath(); ctx.arc(s[0] - 6, s[1] - (s[1] > 20 ? 5 : 0), s[2], 0, 6.283); ctx.fill(); });
    // sayap depan
    var gf = ctx.createRadialGradient(6, -8, 2, 38, -28, 62); gf.addColorStop(0, '#fff0b8'); gf.addColorStop(.4, '#f6b02e'); gf.addColorStop(1, '#df7418');
    ctx.fillStyle = gf; ctx.fill(FORE);
    ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(40,20,0,.72)'; ctx.beginPath(); FV.forEach(function (p) { ctx.moveTo(3, -2); ctx.lineTo(p[0] * .93, p[1] * .93); }); ctx.stroke();
    ctx.lineWidth = 3.6; ctx.strokeStyle = '#1b1208'; ctx.stroke(FORE);
    ctx.fillStyle = 'rgba(255,255,255,.95)'; FSPOTS.forEach(function (s) { ctx.beginPath(); ctx.arc(s[0] - 5, s[1] + 3, s[2], 0, 6.283); ctx.fill(); });
    // kilau
    var sh = ctx.createLinearGradient(0, -50, 40, 0); sh.addColorStop(0, 'rgba(255,255,255,.35)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fill(FORE);
    ctx.restore();
  }
  function body() {
    // abdomen
    var g = ctx.createLinearGradient(-3, 0, 3, 0); g.addColorStop(0, '#120a02'); g.addColorStop(.5, '#4a3216'); g.addColorStop(1, '#120a02');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 20, 3.1, 19, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = .8; for (var i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-2.6, 8 + i * 6.5); ctx.lineTo(2.6, 8 + i * 6.5); ctx.stroke(); }
    // toraks + kepala
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -2, 4.6, 10, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#1b1208'; ctx.beginPath(); ctx.arc(0, -14, 3.6, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-1.6, -15, .9, 0, 6.283); ctx.arc(1.6, -15, .9, 0, 6.283); ctx.fill();
    // antena
    ctx.strokeStyle = '#1b1208'; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
    var sw = Math.sin(t * 5) * 2.2 + P.vx * .004;
    [-1, 1].forEach(function (m) { ctx.beginPath(); ctx.moveTo(m * 1.4, -17); ctx.quadraticCurveTo(m * (8 + sw), -30, m * (15 + sw * 1.5), -37); ctx.stroke(); ctx.fillStyle = '#1b1208'; ctx.beginPath(); ctx.arc(m * (15 + sw * 1.5), -37, 1.7, 0, 6.283); ctx.fill(); });
  }
  function draw() {
    ctx.clearRect(0, 0, S, S); ctx.save(); ctx.translate(C, C);
    var sp = Math.hypot(P.vx, P.vy), bank = Math.max(-.4, Math.min(.4, P.vx / 900));
    ctx.rotate(P.head + bank * .5);
    var open = (Math.cos(P.phase) + 1) / 2, sx = .16 + .84 * open;
    ctx.shadowColor = 'rgba(243,210,122,' + (.5 + P.excite * .3) + ')'; ctx.shadowBlur = 16;
    ctx.scale(.95 + Math.min(sp, 700) / 7000, .95 + Math.min(sp, 700) / 7000);
    wing(sx, 1); wing(sx, -1); ctx.shadowBlur = 0; body();
    ctx.restore();
  }

  /* ---------- fisika ---------- */
  function step(now) {
    raf = requestAnimationFrame(step);
    var dt = Math.min(.05, (now - last) / 1000 || .016); last = now; t += dt;
    P.idle += dt; P.excite = Math.max(0, P.excite - dt * 1.4);
    var tx, ty;
    if (!P.seen) { tx = innerWidth * (.5 + .32 * Math.sin(t * .35)); ty = innerHeight * (.4 + .2 * Math.sin(t * .6 + 1)); }
    else {
      P.orbit += dt * (1.3 + P.excite * 2);
      var calm = P.idle > 4, r = P.near ? 26 : (calm ? 30 : 52 + 16 * Math.sin(t * .8));
      tx = P.mx + Math.cos(P.orbit) * r; ty = P.my + Math.sin(P.orbit * 1.35) * r * .62 - 26;
    }
    var dx = tx - P.x, dy = ty - P.y, dist = Math.hypot(dx, dy), maxV = 1100;
    var want = Math.min(maxV, dist * 4.4);
    var wx = dist > .1 ? dx / dist * want : 0, wy = dist > .1 ? dy / dist * want : 0;
    var k = Math.min(1, dt * 3.4);
    P.vx += (wx - P.vx) * k; P.vy += (wy - P.vy) * k;
    // gerak naik-turun halus mengikuti kepakan + goyangan acak
    P.vy += Math.sin(P.phase * 2) * 55 * dt * 6; P.vx += Math.sin(t * 7.3 + 2) * 30 * dt * 6;
    P.x += P.vx * dt; P.y += P.vy * dt;
    var sp = Math.hypot(P.vx, P.vy);
    if (sp > 45) { var a = Math.atan2(P.vy, P.vx) + Math.PI / 2, d = a - P.head; d = Math.atan2(Math.sin(d), Math.cos(d)); P.head += d * Math.min(1, dt * 5); }
    else P.head += Math.sin(t * 1.6) * .004;
    var rate = (P.idle > 4 && sp < 80 ? 9 : 17) + Math.min(sp, 700) * .022 + P.excite * 14;
    P.phase += dt * rate;
    cv.style.transform = 'translate3d(' + (P.x - C).toFixed(1) + 'px,' + (P.y - C).toFixed(1) + 'px,0)';
    draw();
  }
  function start() { if (!raf && cv) { last = performance.now(); raf = requestAnimationFrame(step); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }

  window.Kupu = {
    set: function (v) {
      if (reduce) return;
      on = !!v; if (!cv) { if (!on) return; init(); }
      cv.style.display = on ? '' : 'none'; on ? start() : stop();
    },
    get on() { return on; }
  };
})();
