/* ==================== SINH HỌC: QUANG HỢP (MÔ PHỎNG) ==================== */
let psCanvas, psCtx;
let psAnimId = null;
let psRunning = false;

let psLight = 450; // lux
let psCO2 = 450;   // ppm
let psTemp = 25;   // °C

let psBubbles = [];
let psO2Count = 0;
let psLastTs = 0;

let psResizeBound = false;
function ensurePSCanvasSize() {
  if (!psCanvas || !psCanvas.parentElement) return;
  const wrap = psCanvas.parentElement;
  const cssW = Math.max(280, wrap.clientWidth || 700);
  const cssH = Math.max(220, Math.round(cssW * (280 / 700)));
  psCanvas.style.height = cssH + 'px';
  const dpr = window.devicePixelRatio || 1;
  const newW = Math.round(cssW * dpr);
  const newH = Math.round(cssH * dpr);
  if (psCanvas.width !== newW || psCanvas.height !== newH) {
    psCanvas.width = newW;
    psCanvas.height = newH;
    psBubbles = [];
  }
}

function initPhotosynthesis() {
  if (psCanvas) return;
  psCanvas = document.getElementById('ps-canvas');
  if (!psCanvas) return;
  psCtx = psCanvas.getContext('2d');
  ensurePSCanvasSize();
  if (!psResizeBound) {
    psResizeBound = true;
    window.addEventListener('resize', () => {
      ensurePSCanvasSize();
      psDraw();
    }, { passive: true });
  }
  updatePSParams();
  resetPhotosynthesis();
}

function updatePSParams() {
  const lightEl = document.getElementById('ps-light'); // range
  const lightIn = document.getElementById('ps-light-input'); // number
  const co2El = document.getElementById('ps-co2'); // range
  const co2In = document.getElementById('ps-co2-input'); // number
  const tempEl = document.getElementById('ps-temp'); // range
  const tempIn = document.getElementById('ps-temp-input'); // number
  if ((!lightEl && !lightIn) || (!co2El && !co2In) || (!tempEl && !tempIn)) return;

  psLight = parseFloat((lightIn ? lightIn.value : lightEl.value) || '450');
  psCO2 = parseFloat((co2In ? co2In.value : co2El.value) || '450');
  psTemp = parseFloat((tempIn ? tempIn.value : tempEl.value) || '25');
  if (!Number.isFinite(psLight)) psLight = 450;
  if (!Number.isFinite(psCO2)) psCO2 = 450;
  if (!Number.isFinite(psTemp)) psTemp = 25;

  if (lightEl) lightEl.value = String(psLight);
  if (lightIn) lightIn.value = String(psLight);
  if (co2El) co2El.value = String(psCO2);
  if (co2In) co2In.value = String(psCO2);
  if (tempEl) tempEl.value = String(psTemp);
  if (tempIn) tempIn.value = String(psTemp);

  const lv = document.getElementById('ps-light-val');
  const cv = document.getElementById('ps-co2-val');
  const tv = document.getElementById('ps-temp-val');
  if (lv) lv.textContent = `${Math.round(psLight)}`;
  if (cv) cv.textContent = `${Math.round(psCO2)}`;
  if (tv) tv.textContent = `${Math.round(psTemp)}°C`;
}

function togglePhotosynthesis() {
  initPhotosynthesis();
  const btn = document.getElementById('ps-btn');
  psRunning = !psRunning;
  if (btn) btn.textContent = psRunning ? '⏸ TẠM DỪNG' : '▶ CHẠY';
  if (psRunning) {
    psLastTs = performance.now();
    psAnimId = requestAnimationFrame(psLoop);
  } else {
    cancelAnimationFrame(psAnimId);
  }
}

function resetPhotosynthesis() {
  initPhotosynthesis();
  psRunning = false;
  cancelAnimationFrame(psAnimId);
  psLastTs = performance.now();

  psBubbles = [];
  psO2Count = 0;
  updatePSParams();
  psUpdateUI();
  psDraw();

  const btn = document.getElementById('ps-btn');
  if (btn) btn.textContent = '▶ CHẠY';
}

function psLoop(ts) {
  if (!psRunning) return;
  const dt = Math.min(0.04, Math.max(0.001, (ts - psLastTs) / 1000));
  psLastTs = ts;

  ensurePSCanvasSize();
  updatePSParams();
  const { ratePerMin } = psComputeRate();

  // bọt O2 sinh ra theo tốc độ (minh họa)
  const bubblesPerSec = ratePerMin / 60;
  const spawnProb = Math.min(0.9, bubblesPerSec * dt);
  if (Math.random() < spawnProb) psSpawnBubble();

  // update bubbles
  psBubbles.forEach(b => {
    b.y -= b.vy * dt;
    b.x += Math.sin((performance.now() / 1000) + b.phase) * 12 * dt;
    b.life -= dt;
  });
  psBubbles = psBubbles.filter(b => b.life > 0 && b.y > -20);

  psUpdateUI();
  psDraw();
  psAnimId = requestAnimationFrame(psLoop);
}

function psComputeRate() {
  // hàm bão hòa ánh sáng + CO2
  const fLight = psLight / (psLight + 260); // 0..~0.8
  const fCO2 = Math.max(0, psCO2 - 200) / (Math.max(0, psCO2 - 200) + 420);

  // nhiệt độ tối ưu ~28°C (minh họa)
  const opt = 28, sigma = 8;
  const fTemp = Math.exp(-Math.pow(psTemp - opt, 2) / (2 * sigma * sigma));

  const limiting = Math.min(fLight, fCO2, fTemp);
  const ratePerMin = 120 * limiting; // 0..120 (đv/min)

  // xác định yếu tố giới hạn
  let limitName = '—';
  const minVal = limiting;
  const eps = 0.02;
  if (Math.abs(fLight - minVal) < eps) limitName = 'Ánh sáng';
  else if (Math.abs(fCO2 - minVal) < eps) limitName = 'CO₂';
  else limitName = 'Nhiệt độ';

  return { ratePerMin, limitName };
}

function psSpawnBubble() {
  if (!psCanvas) return;
  ensurePSCanvasSize();
  const W = psCanvas.width, H = psCanvas.height;

  // vùng "lá" ở phía dưới
  const baseY = H - 55;
  psBubbles.push({
    x: W * 0.35 + Math.random() * (W * 0.3),
    y: baseY + Math.random() * 10,
    r: 4 + Math.random() * 6,
    vy: 40 + Math.random() * 40,
    life: 5 + Math.random() * 2,
    phase: Math.random() * Math.PI * 2
  });
  psO2Count += 1;
}

function psUpdateUI() {
  const { ratePerMin, limitName } = psComputeRate();

  const rateEl = document.getElementById('ps-rate');
  const limitEl = document.getElementById('ps-limit');
  const o2El = document.getElementById('ps-o2');

  if (rateEl) rateEl.innerHTML = `${ratePerMin.toFixed(1)}<span class="dc-unit">đv/phút</span>`;
  if (limitEl) limitEl.textContent = limitName;
  if (o2El) o2El.innerHTML = `${psO2Count}<span class=\"dc-unit\">bọt</span>`;
}

function psDraw() {
  if (!psCtx) return;
  ensurePSCanvasSize();
  const W = psCanvas.width, H = psCanvas.height;
  psCtx.clearRect(0, 0, W, H);

  // nền
  psCtx.save();
  const grd = psCtx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#0b3d1c');
  grd.addColorStop(1, '#071c0f');
  psCtx.fillStyle = grd;
  psCtx.fillRect(0, 0, W, H);
  psCtx.restore();

  // mặt nước
  psCtx.save();
  psCtx.fillStyle = 'rgba(79,195,247,0.10)';
  psCtx.fillRect(0, 40, W, H - 40);
  psCtx.restore();

  // "lá" (minh họa)
  psCtx.save();
  psCtx.fillStyle = 'rgba(130,224,170,0.75)';
  psCtx.beginPath();
  psCtx.ellipse(W / 2, H - 55, 220, 45, 0, 0, Math.PI * 2);
  psCtx.fill();
  psCtx.restore();

  // bọt
  for (const b of psBubbles) {
    psCtx.save();
    psCtx.globalAlpha = Math.max(0.15, Math.min(0.85, b.life / 6));
    psCtx.strokeStyle = 'rgba(255,255,255,0.85)';
    psCtx.lineWidth = 2;
    psCtx.shadowBlur = 8;
    psCtx.shadowColor = 'rgba(124,185,255,0.55)';
    psCtx.beginPath();
    psCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    psCtx.stroke();
    psCtx.restore();
  }

  // tia nắng (tùy theo ánh sáng)
  const rays = Math.round((psLight / 1000) * 10);
  psCtx.save();
  psCtx.globalAlpha = 0.15 + (psLight / 1000) * 0.25;
  psCtx.strokeStyle = '#ffd966';
  psCtx.lineWidth = 4;
  for (let i = 0; i < rays; i++) {
    const x = 60 + i * ((W - 120) / Math.max(1, rays - 1));
    psCtx.beginPath();
    psCtx.moveTo(x, 0);
    psCtx.lineTo(x + 20, 70);
    psCtx.stroke();
  }
  psCtx.restore();

  psCtx.save();
  psCtx.fillStyle = 'rgba(255,255,255,0.8)';
  psCtx.font = "12px 'Space Mono', monospace";
  psCtx.fillText('Bọt O₂ ↑ khi tốc độ quang hợp ↑ (minh họa)', 12, 20);
  psCtx.restore();
}
