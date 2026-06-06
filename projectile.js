/* ==================== VẬT LÍ: CHUYỂN ĐỘNG NÉM (NÉM NGANG / NÉM XIÊN) ==================== */
let projRunning = false, projRAF = null, projT = 0, projLastTime = null;
let projTrailNormal = [], projTrailDrag = [];
let projSim = null; // snapshot params for a run
let projDragState = null; // {x,y,vx,vy}

function initProjectile() {
  projRunning = false;
  cancelAnimationFrame(projRAF);
  projT = 0;
  projLastTime = null;
  projTrailNormal = [];
  projTrailDrag = [];
  projSim = null;
  projDragState = null;
  const btn = document.getElementById('proj-btn');
  if (btn) btn.textContent = '▶ PHÓNG';
  syncProjectileDisplays();
  calcProjectileStats();
  drawProjectileFrame();
}

function getProjectileParamsFromUI() {
  const angle = parseFloat(document.getElementById('proj-angle')?.value ?? '') || 45;
  const v0 = parseFloat(document.getElementById('proj-v0')?.value ?? '') || 20;
  const h0 = parseFloat(document.getElementById('proj-h0')?.value ?? '') || 0;
  const drag = !!document.getElementById('proj-drag')?.checked;
  return { angle, v0, h0, drag };
}

function projectileFlightTime({ angle, v0, h0 }) {
  const rad = angle * Math.PI / 180;
  const g = 9.8;
  const vy = v0 * Math.sin(rad);
  // 0.5 g t^2 - vy t - h0 = 0  => t = (vy + sqrt(vy^2 + 2 g h0)) / g (nghiệm dương)
  return (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g;
}

function syncProjectileDisplays() {
  // Sync number ↔ range + text display (khi KHÔNG chạy)
  const pairs = [
    { key: 'angle', num: 'proj-angle', range: 'proj-angle-range', val: 'proj-angle-val', fmt: (v) => `${Math.round(v)}°` },
    { key: 'v0', num: 'proj-v0', range: 'proj-v0-range', val: 'proj-v0-val', fmt: (v) => `${v.toFixed(0)} m/s` },
    { key: 'h0', num: 'proj-h0', range: 'proj-h0-range', val: 'proj-h0-val', fmt: (v) => `${v.toFixed(0)} m` }
  ];
  for (const p of pairs) {
    const n = document.getElementById(p.num);
    const r = document.getElementById(p.range);
    const out = document.getElementById(p.val);
    if (!n) continue;
    const v = parseFloat(n.value ?? '');
    if (Number.isFinite(v)) {
      if (r) r.value = String(v);
      if (out) out.textContent = p.fmt(v);
    } else if (r) {
      // fallback lấy từ range
      const vr = parseFloat(r.value ?? '');
      if (Number.isFinite(vr)) {
        n.value = String(vr);
        if (out) out.textContent = p.fmt(vr);
      }
    }
  }
}

function projOnNumberInput(which) {
  if (projRunning) return;
  const map = {
    angle: { num: 'proj-angle', range: 'proj-angle-range' },
    v0: { num: 'proj-v0', range: 'proj-v0-range' },
    h0: { num: 'proj-h0', range: 'proj-h0-range' }
  };
  const m = map[which];
  if (!m) return;
  const n = document.getElementById(m.num);
  const r = document.getElementById(m.range);
  if (!n) return;
  const v = parseFloat(n.value ?? '');
  if (Number.isFinite(v) && r) r.value = String(v);
  syncProjectileDisplays();
  calcProjectileStats();
  drawProjectileFrame();
}

function projOnRangeInput(which) {
  if (projRunning) return;
  const map = {
    angle: { num: 'proj-angle', range: 'proj-angle-range' },
    v0: { num: 'proj-v0', range: 'proj-v0-range' },
    h0: { num: 'proj-h0', range: 'proj-h0-range' }
  };
  const m = map[which];
  if (!m) return;
  const n = document.getElementById(m.num);
  const r = document.getElementById(m.range);
  if (!r) return;
  const v = parseFloat(r.value ?? '');
  if (Number.isFinite(v) && n) n.value = String(v);
  syncProjectileDisplays();
  calcProjectileStats();
  drawProjectileFrame();
}

function projOnDragToggle() {
  if (projRunning) return;
  calcProjectileStats();
  drawProjectileFrame();
}

function calcProjectileStats() {
  const { angle, v0, h0 } = getProjectileParamsFromUI();
  const rad = angle * Math.PI / 180;
  const g = 9.8;
  const vx = v0 * Math.cos(rad);
  const vy = v0 * Math.sin(rad);

  const tFlight = projectileFlightTime({ angle, v0, h0 });
  const range = vx * tFlight;
  const hMax = h0 + (vy * vy) / (2 * g);

  const elT = document.getElementById('proj-result-t');
  const elR = document.getElementById('proj-result-r');
  const elH = document.getElementById('proj-result-h');
  if (elT) elT.innerHTML = tFlight.toFixed(2) + '<span class="dc-unit">s</span>';
  if (elR) elR.innerHTML = range.toFixed(1) + '<span class="dc-unit">m</span>';
  if (elH) elH.innerHTML = hMax.toFixed(1) + '<span class="dc-unit">m</span>';

  const fEl = document.getElementById('proj-formula-display');
  if (fEl) fEl.innerHTML =
    `v₀ = ${v0} m/s | α = ${angle}° | h₀ = ${h0} m → ` +
    `T = <b>${tFlight.toFixed(2)} s</b> | L = <b>${range.toFixed(1)} m</b> | ` +
    `H<sub>max</sub> = <b>${hMax.toFixed(1)} m</b>`;
}

function startProjectileRun() {
  projRunning = false;
  cancelAnimationFrame(projRAF);
  projT = 0;
  projLastTime = null;
  projTrailNormal = [];
  projTrailDrag = [];

  // Snapshot tham số cho 1 lần phóng (tránh đổi tham số giữa chừng làm quỹ đạo sai logic)
  projSim = getProjectileParamsFromUI();
  const rad = projSim.angle * Math.PI / 180;
  projSim.g = 9.8;
  projSim.vx0 = projSim.v0 * Math.cos(rad);
  projSim.vy0 = projSim.v0 * Math.sin(rad);
  projSim.tFlight = projectileFlightTime(projSim);
  projSim.range = projSim.vx0 * projSim.tFlight;
  projSim.hMax = projSim.h0 + (projSim.vy0 * projSim.vy0) / (2 * projSim.g);

  projDragState = { x: 0, y: projSim.h0, vx: projSim.vx0, vy: projSim.vy0 };

  drawProjectileFrame();
  calcProjectileStats();
}

function toggleProjectile() {
  // Nếu đã kết thúc 1 lần phóng → bấm lại sẽ phóng mới
  if (!projRunning && projSim && projT >= (projSim.tFlight - 1e-6)) {
    startProjectileRun();
  }

  if (!projSim) startProjectileRun();

  projRunning = !projRunning;
  const btn = document.getElementById('proj-btn');
  if (btn) btn.textContent = projRunning ? '⏸ DỪNG' : '▶ TIẾP TỤC';
  if (projRunning) { projLastTime = null; requestAnimationFrame(projLoop); }
  else cancelAnimationFrame(projRAF);
}

function resetProjectile() {
  initProjectile();
}

function projLoop(ts) {
  if (!projSim) startProjectileRun();

  if (!projLastTime) projLastTime = ts;
  const dt = Math.min((ts - projLastTime) / 1000, 0.04);
  projLastTime = ts;
  projT += dt;

  const g = projSim.g || 9.8;
  const vx0 = projSim.vx0;
  const vy0 = projSim.vy0;
  const h0 = projSim.h0;
  const tFlight = projSim.tFlight;

  // Normal trajectory
  const tClamped = Math.min(projT, tFlight);
  const xN = vx0 * tClamped;
  const yN = h0 + vy0 * tClamped - 0.5 * g * tClamped * tClamped;

  // Drag trajectory (minh hoạ: lực cản tỉ lệ v^2, k=0.15)
  const k = 0.15;
  const subSteps = 2;
  for (let i = 0; i < subSteps; i++) {
    const dtSub = dt / subSteps;
    const spd = Math.hypot(projDragState.vx, projDragState.vy);
    const ax = -k * spd * projDragState.vx;
    const ay = -g - k * spd * projDragState.vy;
    projDragState.vx += ax * dtSub;
    projDragState.vy += ay * dtSub;
    projDragState.x += projDragState.vx * dtSub;
    projDragState.y += projDragState.vy * dtSub;
    if (projDragState.y < 0) { projDragState.y = 0; break; }
  }

  projTrailNormal.push({ x: xN, y: Math.max(0, yN) });
  projTrailDrag.push({ x: projDragState.x, y: projDragState.y });

  drawProjectileFrame(xN, yN, projDragState.x, projDragState.y);

  // Stop when finished (đúng theo thời gian bay)
  if (projT >= tFlight) {
    projRunning = false;
    projT = tFlight; // giữ lại trạng thái cuối
    projLastTime = null;
    const btn = document.getElementById('proj-btn');
    if (btn) btn.textContent = '▶ PHÓNG LẠI';
    drawProjectileFrame(projSim.range, 0, projDragState.x, projDragState.y);
    return;
  }

  if (projRunning) projRAF = requestAnimationFrame(projLoop);
}

function drawProjectileFrame(curX, curY) {
  const c = document.getElementById('proj-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  const params = projSim || getProjectileParamsFromUI();
  const angle = params.angle ?? 45;
  const v0 = params.v0 ?? 20;
  const h0 = params.h0 ?? 0;
  const showDrag = !!document.getElementById('proj-drag')?.checked;

  const g = 9.8;
  const rad = angle * Math.PI / 180;
  const vx0 = v0 * Math.cos(rad);
  const vy0 = v0 * Math.sin(rad);
  const tFlight = projectileFlightTime({ angle, v0, h0 });
  const range = vx0 * tFlight;
  const hMax = h0 + (vy0 * vy0) / (2 * g);

  // Scale: fit full parabola in canvas with padding
  const padL = 60, padR = 30, padT = 40, padB = 50;
  const drawW = W - padL - padR;
  const drawH = H - padT - padB;
  const maxX = Math.max(range * 1.05, 10);
  const maxY = Math.max(hMax * 1.2 + h0, 5);
  const sx = drawW / maxX;
  const sy = drawH / maxY;

  function toCanvas(wx, wy) {
    return { x: padL + wx * sx, y: H - padB - wy * sy };
  }

  // ---- Background ----
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#87CEEB'); sky.addColorStop(0.65, '#b8e4f9'); sky.addColorStop(1, '#d4f5d4');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // Clouds
  function cloud(cx2, cy2, r) {
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    [[0,0],[r*0.65,-r*0.2],[r*-0.65,-r*0.15],[r*1.1,0],[r*-1.1,0.05*r]].forEach(([dx,dy]) => {
      ctx.beginPath(); ctx.arc(cx2+dx, cy2+dy, r*0.75, 0, Math.PI*2); ctx.fill();
    });
  }
  cloud(100, 28, 22); cloud(320, 18, 18); cloud(550, 32, 26);

  // Ground
  ctx.fillStyle = '#3a7d44'; ctx.fillRect(0, H - padB + 2, W, padB - 2);
  ctx.fillStyle = '#4e9e5f'; ctx.fillRect(0, H - padB, W, 4);

  // Grid lines
  ctx.strokeStyle = 'rgba(0,0,80,0.06)'; ctx.lineWidth = 1;
  for (let gx = 0; gx <= maxX; gx += Math.ceil(maxX / 8)) {
    const px = toCanvas(gx, 0).x;
    ctx.beginPath(); ctx.moveTo(px, padT); ctx.lineTo(px, H - padB); ctx.stroke();
    ctx.fillStyle = '#334'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(gx + 'm', px, H - padB + 14);
  }
  for (let gy = 0; gy <= maxY; gy += Math.ceil(maxY / 5)) {
    const py = toCanvas(0, gy).y;
    ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(W - padR, py); ctx.stroke();
    ctx.fillStyle = '#334'; ctx.font = '9px monospace'; ctx.textAlign = 'right';
    ctx.fillText(gy + 'm', padL - 4, py + 3);
  }

  // ---- Full static parabola (ghost) ----
  ctx.strokeStyle = 'rgba(231,76,60,0.2)'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
  ctx.beginPath();
  for (let tt = 0; tt <= tFlight; tt += tFlight / 120) {
    const wx = vx0 * tt;
    const wy = h0 + vy0 * tt - 0.5 * g * tt * tt;
    const p = toCanvas(wx, wy);
    tt === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.stroke(); ctx.setLineDash([]);

  // ---- Drag full ghost (để tham khảo) ----
  if (showDrag) {
    ctx.strokeStyle = 'rgba(52,152,219,0.2)'; ctx.lineWidth = 2; ctx.setLineDash([4, 5]);
    const kD = 0.15;
    let xD = 0, yD = h0, vxD = vx0, vyD = vy0;
    const dtD = 0.016;
    ctx.beginPath();
    ctx.moveTo(toCanvas(0, h0).x, toCanvas(0, h0).y);
    for (let i = 0; i < 2000; i++) {
      const spd = Math.hypot(vxD, vyD);
      vxD += (-kD * spd * vxD) * dtD;
      vyD += (-g - kD * spd * vyD) * dtD;
      xD += vxD * dtD; yD += vyD * dtD;
      if (yD <= 0) break;
      const p = toCanvas(xD, yD);
      ctx.lineTo(p.x, p.y);
    }
    ctx.stroke(); ctx.setLineDash([]);
  }

  // ---- Trails ----
  if (projTrailNormal.length > 1) {
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    projTrailNormal.forEach((pt, i) => {
      const p = toCanvas(pt.x, pt.y);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }
  if (showDrag && projTrailDrag.length > 1) {
    ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 2.5;
    ctx.beginPath();
    projTrailDrag.forEach((pt, i) => {
      const p = toCanvas(pt.x, pt.y);
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  }

  // ---- Height arrow ----
  if (h0 > 0.5) {
    const p0 = toCanvas(0, 0), ph = toCanvas(0, h0);
    ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(padL - 18, p0.y); ctx.lineTo(padL - 18, ph.y); ctx.stroke();
    ctx.fillStyle = '#f39c12'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('h₀', padL - 28, (p0.y + ph.y) / 2 + 4);
  }

  // ---- Current ball ----
  const useX = (curX !== undefined) ? curX : 0;
  const useY = (curY !== undefined) ? curY : h0;
  if (useY >= 0) {
    const p = toCanvas(useX, useY);
    // Shadow
    const ps = toCanvas(useX, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(ps.x, ps.y, 10, 3, 0, 0, Math.PI * 2); ctx.fill();
    // Ball
    const bGrad = ctx.createRadialGradient(p.x - 3, p.y - 3, 2, p.x, p.y, 11);
    bGrad.addColorStop(0, '#ff6b6b'); bGrad.addColorStop(1, '#c0392b');
    ctx.shadowBlur = 14; ctx.shadowColor = '#e74c3c';
    ctx.fillStyle = bGrad;
    ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ---- Legend ----
  ctx.font = '11px Space Mono,monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(padL, 8, 18, 4); ctx.fillText('Không lực cản', padL + 22, 15);
  if (showDrag) {
    ctx.fillStyle = '#2980b9'; ctx.fillRect(padL + 160, 8, 18, 4); ctx.fillText('Có lực cản', padL + 182, 15);
  }

  // ---- Landing mark ----
  const pLand = toCanvas(range, 0);
  ctx.fillStyle = '#e74c3c'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('L=' + range.toFixed(1) + 'm', pLand.x, H - padB + 28);
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.moveTo(pLand.x, H - padB - 4); ctx.lineTo(pLand.x - 5, H - padB + 4); ctx.lineTo(pLand.x + 5, H - padB + 4); ctx.closePath(); ctx.fill();
}

