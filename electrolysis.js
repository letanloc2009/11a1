/* ==================== HÓA HỌC: ĐIỆN PHÂN (MÔ PHỎNG) ==================== */
let elCanvas, elCtx;
let elAnimId = null;
let elRunning = false;

let elTime = 0;    // s (mô phỏng)
let elCharge = 0;  // C
let elMass = 0;    // g (Cu bám catot)

let elCurrent = 1.5; // A
let elSpeed = 1;     // x

let elIons = [];     // hạt ion để vẽ

const EL_F = 96485;     // C/mol e-
const EL_M_CU = 63.546; // g/mol
const EL_N = 2;         // Cu2+ + 2e -> Cu

let elResizeBound = false;
function ensureELCanvasSize() {
  if (!elCanvas || !elCanvas.parentElement) return;
  const wrap = elCanvas.parentElement;
  const cssW = Math.max(280, wrap.clientWidth || 700);
  const cssH = Math.max(240, Math.round(cssW * (300 / 700)));
  elCanvas.style.height = cssH + 'px';
  const dpr = window.devicePixelRatio || 1;
  const newW = Math.round(cssW * dpr);
  const newH = Math.round(cssH * dpr);
  if (elCanvas.width !== newW || elCanvas.height !== newH) {
    elCanvas.width = newW;
    elCanvas.height = newH;
    // reset ion positions after resize
    elIons = createELIons(Math.max(36, elIons.length || 44));
  }
}

function initElectrolysis() {
  if (elCanvas) return;
  elCanvas = document.getElementById('el-canvas');
  if (!elCanvas) return;
  elCtx = elCanvas.getContext('2d');
  ensureELCanvasSize();
  if (!elResizeBound) {
    elResizeBound = true;
    window.addEventListener('resize', () => {
      ensureELCanvasSize();
      elDraw();
    }, { passive: true });
  }
  updateELParams();
  resetElectrolysis();
}

function updateELParams() {
  const curEl = document.getElementById('el-current'); // range (0..50) => 0..5A
  const curIn = document.getElementById('el-current-input'); // number (0..5)
  const speedEl = document.getElementById('el-speed');
  if ((!curEl && !curIn) || !speedEl) return;

  if (curIn && curIn.value !== '') {
    elCurrent = parseFloat(curIn.value);
  } else {
    // range (0..50) -> A
    elCurrent = (parseFloat(curEl?.value || '15')) / 10;
  }
  if (!Number.isFinite(elCurrent)) elCurrent = 1.5;
  // clamp 0..5
  elCurrent = Math.max(0, Math.min(5, elCurrent));
  if (curIn) curIn.value = elCurrent.toFixed(1);
  if (curEl) curEl.value = String(Math.round(elCurrent * 10));
  elSpeed = parseFloat(speedEl.value || '1');

  const curVal = document.getElementById('el-current-val');
  if (curVal) curVal.textContent = `${elCurrent.toFixed(1)}A`;
}

function toggleElectrolysis() {
  initElectrolysis();
  const btn = document.getElementById('el-btn');
  elRunning = !elRunning;
  if (btn) btn.textContent = elRunning ? '⏸ TẠM DỪNG' : '▶ CHẠY';
  if (elRunning) {
    elLastTs = performance.now();
    elAnimId = requestAnimationFrame(elLoop);
  } else {
    cancelAnimationFrame(elAnimId);
  }
}

function resetElectrolysis() {
  initElectrolysis();
  elRunning = false;
  cancelAnimationFrame(elAnimId);
  elLastTs = performance.now();

  elTime = 0;
  elCharge = 0;
  elMass = 0;
  updateELParams();
  elIons = createELIons(44);
  elUpdateUI();
  elDraw();

  const btn = document.getElementById('el-btn');
  if (btn) btn.textContent = '▶ CHẠY';
}

let elLastTs = 0;
function elLoop(ts) {
  if (!elRunning) return;
  const dtReal = Math.min(0.04, Math.max(0.001, (ts - elLastTs) / 1000));
  elLastTs = ts;
  ensureELCanvasSize();
  updateELParams();

  const dt = dtReal * elSpeed;
  elTime += dt;
  elCharge += elCurrent * dt;

  // Faraday: m = (M * Q) / (n * F)
  elMass = (EL_M_CU * elCharge) / (EL_N * EL_F);

  elStepIons(dtReal);
  elUpdateUI();
  elDraw();

  elAnimId = requestAnimationFrame(elLoop);
}

function elStepIons(dtReal) {
  if (!elCanvas) return;
  ensureELCanvasSize();
  const W = elCanvas.width, H = elCanvas.height;

  // vùng dung dịch
  const bx = 170, by = 55, bw = W - 340, bh = H - 95;
  const cathodeX = bx + 80;         // trái
  const anodeX = bx + bw - 80;      // phải

  for (const ion of elIons) {
    // drift về catot tùy theo dòng (minh họa)
    const drift = (elCurrent / 5) * 45;
    ion.vx += (-drift - ion.vx) * 0.08;
    ion.vy += (Math.sin((performance.now() / 1000) + ion.phase) * 10 - ion.vy) * 0.04;

    ion.x += ion.vx * dtReal;
    ion.y += ion.vy * dtReal;

    // bounce trong beaker
    if (ion.x < bx + 10) ion.x = bx + 10;
    if (ion.x > bx + bw - 10) ion.x = bx + bw - 10;
    if (ion.y < by + 10) ion.y = by + 10;
    if (ion.y > by + bh - 10) ion.y = by + bh - 10;

    // "bám" catot: nếu gần catot thì respawn sang phải
    if (ion.x < cathodeX + 15) {
      ion.x = anodeX + 20 + Math.random() * 30;
      ion.y = by + 20 + Math.random() * (bh - 40);
      ion.phase = Math.random() * Math.PI * 2;
    }
  }
}

function elUpdateUI() {
  const tEl = document.getElementById('el-time');
  const qEl = document.getElementById('el-charge');
  const mEl = document.getElementById('el-mass');
  if (tEl) tEl.innerHTML = `${Math.floor(elTime)}<span class="dc-unit">s</span>`;
  if (qEl) qEl.innerHTML = `${Math.floor(elCharge)}<span class="dc-unit">C</span>`;
  if (mEl) mEl.innerHTML = `${elMass.toFixed(3)}<span class="dc-unit">g</span>`;
}

function elDraw() {
  if (!elCtx) return;
  ensureELCanvasSize();
  const W = elCanvas.width, H = elCanvas.height;
  elCtx.clearRect(0, 0, W, H);

  // beaker
  const bx = 170, by = 55, bw = W - 340, bh = H - 95;
  elCtx.save();
  elCtx.lineWidth = 3;
  elCtx.strokeStyle = 'rgba(124,185,255,0.6)';
  elCtx.fillStyle = 'rgba(79,195,247,0.10)';
  elCtx.beginPath();
  if (elCtx.roundRect) elCtx.roundRect(bx, by, bw, bh, 16);
  else elCtx.rect(bx, by, bw, bh);
  elCtx.fill();
  elCtx.stroke();
  elCtx.restore();

  // electrodes
  const cathodeX = bx + 80;
  const anodeX = bx + bw - 80;
  const eTop = by + 18, eBot = by + bh - 18;

  elCtx.save();
  elCtx.lineWidth = 10;
  elCtx.lineCap = 'round';
  // cathode (âm)
  elCtx.strokeStyle = '#a7f3d0';
  elCtx.beginPath(); elCtx.moveTo(cathodeX, eTop); elCtx.lineTo(cathodeX, eBot); elCtx.stroke();
  // anode (dương)
  elCtx.strokeStyle = '#ffd966';
  elCtx.beginPath(); elCtx.moveTo(anodeX, eTop); elCtx.lineTo(anodeX, eBot); elCtx.stroke();
  elCtx.restore();

  // deposition on cathode (minh họa)
  const dep = Math.min(14, elMass * 20); // tỷ lệ
  elCtx.save();
  elCtx.strokeStyle = '#e67e22';
  elCtx.lineWidth = 3 + dep;
  elCtx.globalAlpha = 0.75;
  elCtx.beginPath(); elCtx.moveTo(cathodeX - 2, eTop + 8); elCtx.lineTo(cathodeX - 2, eBot - 8); elCtx.stroke();
  elCtx.restore();

  // ions
  for (const ion of elIons) {
    elCtx.save();
    elCtx.globalAlpha = 0.85;
    elCtx.fillStyle = ion.color;
    elCtx.shadowBlur = 10;
    elCtx.shadowColor = ion.color;
    elCtx.beginPath();
    elCtx.arc(ion.x, ion.y, ion.r || 4, 0, Math.PI * 2);
    elCtx.fill();
    elCtx.restore();
  }

  // labels
  elCtx.save();
  elCtx.font = "12px 'Space Mono', monospace";
  elCtx.fillStyle = 'rgba(255,255,255,0.85)';
  elCtx.textAlign = 'left';
  elCtx.fillText('Catot (–): Cu²⁺ + 2e⁻ → Cu', bx + 15, by - 14);
  elCtx.textAlign = 'center';
  elCtx.fillText('Anot (+): minh họa', anodeX, by - 14);
  elCtx.restore();
}

function createELIons(n) {
  const arr = [];
  if (!elCanvas) return arr;
  const W = elCanvas.width, H = elCanvas.height;
  const bx = 170, by = 55, bw = W - 340, bh = H - 95;
  for (let i = 0; i < n; i++) {
    arr.push({
      x: bx + 30 + Math.random() * (bw - 60),
      y: by + 30 + Math.random() * (bh - 60),
      vx: -10 + Math.random() * 10,
      vy: -10 + Math.random() * 20,
      phase: Math.random() * Math.PI * 2,
      r: 3 + Math.random() * 2,
      color: 'rgba(255, 138, 101, 0.95)' // Cu2+
    });
  }
  return arr;
}
