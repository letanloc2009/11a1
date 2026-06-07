/* ==================== HÓA HỌC: TỐC ĐỘ PHẢN ỨNG ==================== */
let rrCanvas, rrCtx;
let rrAnimId = null;
let rrRunning = false;

let rrParticles = [];
let rrFlashes = [];

let rrTemp = 25;       // °C
let rrConc = 0.8;      // hệ số 0.1x -> 2.0x
let rrCatalyst = false;

let rrReactionCount = 0;
let rrLastFrameTs = 0;
let rrRateWindow = []; // [{t, count}]

let rrResizeBound = false;
function ensureRRCanvasSize() {
  if (!rrCanvas || !rrCanvas.parentElement) return;
  const wrap = rrCanvas.parentElement;
  const cssW = Math.max(280, wrap.clientWidth || 700);
  const cssH = Math.max(220, Math.round(cssW * (300 / 700)));
  rrCanvas.style.height = cssH + 'px';
  const dpr = window.devicePixelRatio || 1;
  const newW = Math.round(cssW * dpr);
  const newH = Math.round(cssH * dpr);
  if (rrCanvas.width !== newW || rrCanvas.height !== newH) {
    rrCanvas.width = newW;
    rrCanvas.height = newH;
    // khi resize thì tái tạo hạt để không bị dồn góc
    rrParticles = createRRParticles(Math.max(12, rrParticles.length || 24));
  }
}

function initReactionRate() {
  if (rrCanvas) return;
  rrCanvas = document.getElementById('rr-canvas');
  if (!rrCanvas) return;
  rrCtx = rrCanvas.getContext('2d');
  ensureRRCanvasSize();
  if (!rrResizeBound) {
    rrResizeBound = true;
    window.addEventListener('resize', () => {
      ensureRRCanvasSize();
      rrDraw(true);
    }, { passive: true });
  }
  updateRRParams();
  resetReactionRate();
}

function updateRRParams() {
  const tEl = document.getElementById('rr-temp'); // range (0..100)
  const tIn = document.getElementById('rr-temp-input'); // number (0..100)
  const cEl = document.getElementById('rr-conc'); // range (1..20) -> 0.1..2.0
  const cIn = document.getElementById('rr-conc-input'); // number (0.1..2.0)
  const catEl = document.getElementById('rr-cat');
  if ((!tEl && !tIn) || (!cEl && !cIn) || !catEl) return;

  // temperature
  const tRaw = (tIn ? tIn.value : tEl.value) || '25';
  rrTemp = parseFloat(tRaw);
  if (!Number.isFinite(rrTemp)) rrTemp = 25;
  if (tEl) tEl.value = String(rrTemp);
  if (tIn) tIn.value = String(rrTemp);

  // concentration factor
  let concFactor = 0.8;
  if (cIn && cIn.value !== '') {
    concFactor = parseFloat(cIn.value);
  } else if (cEl) {
    concFactor = (parseFloat(cEl.value || '8')) / 10;
  }
  if (!Number.isFinite(concFactor)) concFactor = 0.8;
  concFactor = Math.max(0.1, Math.min(2.0, concFactor));
  rrConc = concFactor;
  if (cIn) cIn.value = concFactor.toFixed(1);
  if (cEl) cEl.value = String(Math.round(concFactor * 10));
  rrCatalyst = (catEl.value === '1');

  const tVal = document.getElementById('rr-temp-val');
  const cVal = document.getElementById('rr-conc-val');
  if (tVal) tVal.textContent = `${Math.round(rrTemp)}°C`;
  if (cVal) cVal.textContent = `${rrConc.toFixed(1)}x`;

  // tái tạo số hạt theo nồng độ để trực quan hơn
  const targetN = Math.max(12, Math.min(60, Math.round(18 + rrConc * 18)));
  if (rrParticles.length === 0 || Math.abs(rrParticles.length - targetN) >= 6) {
    rrParticles = createRRParticles(targetN);
  }
}

function toggleReactionRate() {
  initReactionRate();
  const btn = document.getElementById('rr-btn');
  rrRunning = !rrRunning;
  if (btn) btn.textContent = rrRunning ? '⏸ TẠM DỪNG' : '▶ CHẠY';
  if (rrRunning) {
    rrLastFrameTs = performance.now();
    rrAnimId = requestAnimationFrame(rrLoop);
  } else {
    cancelAnimationFrame(rrAnimId);
  }
}

function resetReactionRate() {
  initReactionRate();
  rrRunning = false;
  cancelAnimationFrame(rrAnimId);
  rrLastFrameTs = performance.now();

  rrReactionCount = 0;
  rrRateWindow = [];
  rrFlashes = [];

  updateRRParams();
  rrDraw(true);
  rrUpdateUI(0);

  const btn = document.getElementById('rr-btn');
  if (btn) btn.textContent = '▶ CHẠY';
}

function rrLoop(ts) {
  if (!rrRunning) return;
  const dt = Math.min(0.033, Math.max(0.001, (ts - rrLastFrameTs) / 1000));
  rrLastFrameTs = ts;

  rrStep(dt);
  rrDraw(false);
  rrAnimId = requestAnimationFrame(rrLoop);
}

function rrStep(dt) {
  if (!rrCtx) return;
  ensureRRCanvasSize();
  updateRRParams();

  const W = rrCanvas.width;
  const H = rrCanvas.height;

  // tốc độ phụ thuộc nhiệt độ (mang tính minh họa)
  const speedFactor = 0.6 + (rrTemp / 75); // ~0.6..1.9

  // di chuyển
  for (const p of rrParticles) {
    p.x += p.vx * speedFactor * dt;
    p.y += p.vy * speedFactor * dt;
    if (p.x < p.r) { p.x = p.r; p.vx *= -1; }
    if (p.x > W - p.r) { p.x = W - p.r; p.vx *= -1; }
    if (p.y < p.r) { p.y = p.r; p.vy *= -1; }
    if (p.y > H - p.r) { p.y = H - p.r; p.vy *= -1; }
  }

  // va chạm (O(n^2), n nhỏ)
  let reactionsThisFrame = 0;
  for (let i = 0; i < rrParticles.length; i++) {
    for (let j = i + 1; j < rrParticles.length; j++) {
      const a = rrParticles[i], b = rrParticles[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;
      if (dist > 0 && dist < minDist) {
        // đẩy tách nhau để tránh dính
        const overlap = (minDist - dist) / 2;
        const nx = dx / dist, ny = dy / dist;
        a.x -= nx * overlap; a.y -= ny * overlap;
        b.x += nx * overlap; b.y += ny * overlap;

        // đổi vận tốc đơn giản (đàn hồi giả lập)
        const tmpVx = a.vx; const tmpVy = a.vy;
        a.vx = b.vx; a.vy = b.vy;
        b.vx = tmpVx; b.vy = tmpVy;

        // xác suất phản ứng (minh họa): tăng theo T, C và xúc tác
        const base = 0.015;
        const pReact = Math.min(
          0.35,
          base + (rrTemp / 100) * 0.06 + rrConc * 0.03 + (rrCatalyst ? 0.05 : 0)
        );
        if (Math.random() < pReact) {
          rrReactionCount += 1;
          reactionsThisFrame += 1;
          rrFlashes.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, life: 0.25 });
        }
      }
    }
  }

  // flash decay
  rrFlashes.forEach(f => f.life -= dt);
  rrFlashes = rrFlashes.filter(f => f.life > 0);

  // update rate window
  const now = performance.now() / 1000;
  if (reactionsThisFrame > 0) rrRateWindow.push({ t: now, c: reactionsThisFrame });
  // giữ ~2 giây
  rrRateWindow = rrRateWindow.filter(x => now - x.t <= 2.0);
  const total = rrRateWindow.reduce((s, x) => s + x.c, 0);
  const rate = total / 2.0;

  rrUpdateUI(rate);
}

function rrUpdateUI(rate) {
  const countEl = document.getElementById('rr-count');
  const rateEl = document.getElementById('rr-rate');
  const factorEl = document.getElementById('rr-factor');

  if (countEl) countEl.innerHTML = `${rrReactionCount}<span class="dc-unit">lần</span>`;
  if (rateEl) rateEl.innerHTML = `${rate.toFixed(1)}<span class="dc-unit">lần/s</span>`;

  if (factorEl) {
    let factor = '—';
    if (rrTemp >= 70) factor = 'Nhiệt độ ↑';
    else if (rrConc >= 1.4) factor = 'Nồng độ ↑';
    else if (rrCatalyst) factor = 'Có xúc tác';
    factorEl.textContent = factor;
  }
}

function rrDraw(force) {
  if (!rrCtx) return;
  ensureRRCanvasSize();
  const W = rrCanvas.width, H = rrCanvas.height;
  rrCtx.clearRect(0, 0, W, H);

  // background grid
  rrCtx.save();
  rrCtx.globalAlpha = 0.18;
  rrCtx.strokeStyle = '#7cb9ff';
  rrCtx.lineWidth = 1;
  for (let x = 0; x <= W; x += 50) { rrCtx.beginPath(); rrCtx.moveTo(x, 0); rrCtx.lineTo(x, H); rrCtx.stroke(); }
  for (let y = 0; y <= H; y += 50) { rrCtx.beginPath(); rrCtx.moveTo(0, y); rrCtx.lineTo(W, y); rrCtx.stroke(); }
  rrCtx.restore();

  // particles
  for (const p of rrParticles) {
    rrCtx.save();
    rrCtx.shadowBlur = 10;
    rrCtx.shadowColor = p.color;
    rrCtx.fillStyle = p.color;
    rrCtx.beginPath();
    rrCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    rrCtx.fill();
    rrCtx.restore();
  }

  // flashes
  for (const f of rrFlashes) {
    const a = Math.max(0, Math.min(1, f.life / 0.25));
    rrCtx.save();
    rrCtx.globalAlpha = a;
    rrCtx.strokeStyle = '#ffd966';
    rrCtx.lineWidth = 2;
    rrCtx.beginPath();
    rrCtx.arc(f.x, f.y, 18 * (1 - a) + 6, 0, Math.PI * 2);
    rrCtx.stroke();
    rrCtx.restore();
  }

  // title hint
  rrCtx.save();
  rrCtx.fillStyle = 'rgba(255,255,255,0.75)';
  rrCtx.font = "12px 'Space Mono', monospace";
  rrCtx.fillText('● Chấm càng chạy nhanh (T↑) và càng đông (C↑) → phản ứng nhiều hơn', 12, 20);
  rrCtx.restore();
}

function createRRParticles(n) {
  const arr = [];
  if (!rrCanvas) return arr;
  const W = rrCanvas.width, H = rrCanvas.height;
  const palette = ['#ff8a65', '#4fc3f7', '#ffd966', '#82e0aa', '#c39bd3'];
  for (let i = 0; i < n; i++) {
    const r = 6 + Math.random() * 4;
    arr.push({
      x: r + Math.random() * (W - 2 * r),
      y: r + Math.random() * (H - 2 * r),
      vx: (Math.random() * 2 - 1) * (70 + Math.random() * 80),
      vy: (Math.random() * 2 - 1) * (70 + Math.random() * 80),
      r,
      color: palette[i % palette.length] + 'cc'
    });
  }
  return arr;
}
