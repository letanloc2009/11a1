/* ==================== SINH HỌC: ENZYME (MÔ PHỎNG) ==================== */
let enzCanvas, enzCtx;

let enzType = 'amylase';
let enzPH = 7;
let enzTemp = 37;

const enzProfiles = {
  pepsin:  { name: 'Pepsin',  optPH: 2.0,  phSigma: 1.1, optT: 37, tSigma: 10 },
  amylase: { name: 'Amylase', optPH: 7.0,  phSigma: 1.6, optT: 37, tSigma: 10 },
  trypsin: { name: 'Trypsin', optPH: 8.0,  phSigma: 1.4, optT: 37, tSigma: 10 }
};

function initEnzyme() {
  if (enzCanvas) return;
  enzCanvas = document.getElementById('enz-canvas');
  if (!enzCanvas) return;
  enzCtx = enzCanvas.getContext('2d');
  resetEnzyme();
}

function resetEnzyme() {
  initEnzyme();
  const typeEl = document.getElementById('enz-type');
  const phEl = document.getElementById('enz-ph');
  const phIn = document.getElementById('enz-ph-input');
  const tEl = document.getElementById('enz-temp');
  const tIn = document.getElementById('enz-temp-input');
  if (typeEl) typeEl.value = enzType;
  if (phEl) phEl.value = String(enzPH);
  if (phIn) phIn.value = String(enzPH);
  if (tEl) tEl.value = String(enzTemp);
  if (tIn) tIn.value = String(enzTemp);
  updateEnzyme();
}

function randomizeEnzyme() {
  initEnzyme();
  const keys = Object.keys(enzProfiles);
  enzType = keys[Math.floor(Math.random() * keys.length)];
  enzPH = 1 + Math.floor(Math.random() * 14);
  enzTemp = 5 + Math.floor(Math.random() * 71);

  const typeEl = document.getElementById('enz-type');
  const phEl = document.getElementById('enz-ph');
  const phIn = document.getElementById('enz-ph-input');
  const tEl = document.getElementById('enz-temp');
  const tIn = document.getElementById('enz-temp-input');
  if (typeEl) typeEl.value = enzType;
  if (phEl) phEl.value = String(enzPH);
  if (phIn) phIn.value = String(enzPH);
  if (tEl) tEl.value = String(enzTemp);
  if (tIn) tIn.value = String(enzTemp);
  updateEnzyme();
}

function updateEnzyme() {
  const typeEl = document.getElementById('enz-type');
  const phEl = document.getElementById('enz-ph');
  const phIn = document.getElementById('enz-ph-input');
  const tEl = document.getElementById('enz-temp');
  const tIn = document.getElementById('enz-temp-input');
  if (!typeEl || (!phEl && !phIn) || (!tEl && !tIn)) return;

  enzType = typeEl.value;
  enzPH = parseFloat((phIn ? phIn.value : phEl.value) || '7');
  enzTemp = parseFloat((tIn ? tIn.value : tEl.value) || '37');
  if (!Number.isFinite(enzPH)) enzPH = 7;
  if (!Number.isFinite(enzTemp)) enzTemp = 37;
  enzPH = Math.max(1, Math.min(14, enzPH));
  enzTemp = Math.max(0, Math.min(80, enzTemp));
  if (phEl) phEl.value = String(enzPH);
  if (phIn) phIn.value = String(enzPH);
  if (tEl) tEl.value = String(enzTemp);
  if (tIn) tIn.value = String(enzTemp);

  const phVal = document.getElementById('enz-ph-val');
  const tVal = document.getElementById('enz-temp-val');
  if (phVal) phVal.textContent = `${enzPH}`;
  if (tVal) tVal.textContent = `${Math.round(enzTemp)}°C`;

  const prof = enzProfiles[enzType] || enzProfiles.amylase;
  const activity = enzComputeActivity(enzPH, enzTemp, prof);

  const aEl = document.getElementById('enz-activity');
  const opEl = document.getElementById('enz-optph');
  const otEl = document.getElementById('enz-opttemp');

  if (aEl) aEl.innerHTML = `${Math.round(activity)}<span class="dc-unit">%</span>`;
  if (opEl) opEl.textContent = `${prof.optPH}`;
  if (otEl) otEl.textContent = `${prof.optT}°C`;

  drawEnzyme();
}

function enzComputeActivity(ph, temp, prof) {
  const phCurve = Math.exp(-Math.pow(ph - prof.optPH, 2) / (2 * prof.phSigma * prof.phSigma));
  const tCurve = Math.exp(-Math.pow(temp - prof.optT, 2) / (2 * prof.tSigma * prof.tSigma));

  // mô phỏng biến tính khi quá nóng (rơi mạnh sau ~55°C)
  const denature = 1 / (1 + Math.exp((temp - 55) / 2.8));
  const val = 100 * phCurve * tCurve * denature;
  return Math.max(0, Math.min(100, val));
}

function drawEnzyme() {
  if (!enzCtx) return;
  const W = enzCanvas.width, H = enzCanvas.height;
  enzCtx.clearRect(0, 0, W, H);

  // nền
  const grd = enzCtx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#0d1b2a');
  grd.addColorStop(1, '#0b132b');
  enzCtx.fillStyle = grd;
  enzCtx.fillRect(0, 0, W, H);

  // khung
  enzCtx.save();
  enzCtx.strokeStyle = 'rgba(124,185,255,0.35)';
  enzCtx.lineWidth = 2;
  enzCtx.strokeRect(40, 35, W - 80, H - 80);
  enzCtx.restore();

  const prof = enzProfiles[enzType] || enzProfiles.amylase;

  // vẽ đường cong pH (trên)
  drawCurve({
    x: 60, y: 55, w: W - 120, h: (H - 120) / 2 - 10,
    minX: 1, maxX: 14,
    label: 'Hoạt tính theo pH',
    color: '#82e0aa',
    f: (x) => enzComputeActivity(x, prof.optT, prof) / 100
  });

  // vẽ đường cong nhiệt độ (dưới)
  drawCurve({
    x: 60, y: 55 + (H - 120) / 2 + 10, w: W - 120, h: (H - 120) / 2 - 10,
    minX: 0, maxX: 80,
    label: 'Hoạt tính theo nhiệt độ (°C)',
    color: '#ffd966',
    f: (x) => enzComputeActivity(prof.optPH, x, prof) / 100
  });

  // marker hiện tại (pH)
  drawMarker({
    x: 60, y: 55, w: W - 120, h: (H - 120) / 2 - 10,
    minX: 1, maxX: 14, value: enzPH, color: '#82e0aa', text: `pH=${enzPH}`
  });
  // marker hiện tại (temp)
  drawMarker({
    x: 60, y: 55 + (H - 120) / 2 + 10, w: W - 120, h: (H - 120) / 2 - 10,
    minX: 0, maxX: 80, value: enzTemp, color: '#ffd966', text: `T=${Math.round(enzTemp)}°C`
  });

  // activity badge
  const act = enzComputeActivity(enzPH, enzTemp, prof);
  enzCtx.save();
  enzCtx.fillStyle = 'rgba(255,255,255,0.9)';
  enzCtx.font = "12px 'Space Mono', monospace";
  enzCtx.fillText(`Enzyme: ${prof.name} | Hoạt tính: ${Math.round(act)}%`, 12, 20);
  enzCtx.restore();
}

function drawCurve({ x, y, w, h, minX, maxX, label, color, f }) {
  enzCtx.save();
  enzCtx.strokeStyle = 'rgba(255,255,255,0.18)';
  enzCtx.lineWidth = 1;
  enzCtx.beginPath();
  enzCtx.moveTo(x, y + h);
  enzCtx.lineTo(x + w, y + h);
  enzCtx.stroke();

  enzCtx.strokeStyle = color;
  enzCtx.lineWidth = 3;
  enzCtx.beginPath();
  for (let i = 0; i <= 220; i++) {
    const t = i / 220;
    const vx = minX + t * (maxX - minX);
    const vy = f(vx);
    const px = x + t * w;
    const py = y + h - vy * h;
    if (i === 0) enzCtx.moveTo(px, py);
    else enzCtx.lineTo(px, py);
  }
  enzCtx.stroke();

  enzCtx.fillStyle = 'rgba(255,255,255,0.75)';
  enzCtx.font = "11px 'Space Mono', monospace";
  enzCtx.fillText(label, x, y - 8);
  enzCtx.restore();
}

function drawMarker({ x, y, w, h, minX, maxX, value, color, text }) {
  const t = (value - minX) / (maxX - minX);
  const px = x + Math.max(0, Math.min(1, t)) * w;
  enzCtx.save();
  enzCtx.strokeStyle = color;
  enzCtx.globalAlpha = 0.7;
  enzCtx.lineWidth = 2;
  enzCtx.beginPath();
  enzCtx.moveTo(px, y);
  enzCtx.lineTo(px, y + h);
  enzCtx.stroke();
  enzCtx.globalAlpha = 1;
  enzCtx.fillStyle = color;
  enzCtx.beginPath();
  enzCtx.arc(px, y + h, 4, 0, Math.PI * 2);
  enzCtx.fill();
  enzCtx.fillStyle = 'rgba(255,255,255,0.85)';
  enzCtx.font = "11px 'Space Mono', monospace";
  enzCtx.fillText(text, px + 8, y + 16);
  enzCtx.restore();
}
