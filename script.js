/* ==================== MOBILE SIDEBAR ==================== */
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('open'); hamburger.classList.add('open'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); hamburger.classList.remove('open'); }
hamburger.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
overlay.addEventListener('click', closeSidebar);

/* ==================== NAVIGATION ==================== */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (event && event.target) event.target.classList.add('active');
  const labels = {
    home:'Trang chủ', motion:'Chuyển động thẳng', force:'Lực – Kéo co',
    wave:'Sóng cơ học', optics:'Sóng ánh sáng', circuit:'Mạch điện',
    acidbase:'Acid – Base', cell:'Tế bào', dna:'Lắp ráp DNA',
    periodic:'Bảng tuần hoàn'
  };
  document.getElementById('status-page').textContent = (labels[id] || id).toUpperCase();
  if (id === 'motion') { updateMotionParam(); drawMotionFrame(); drawGraph(); }
  if (id === 'force') { drawForceScene(0); }
  if (id === 'wave') { if (!waveRunning) drawWaveFrame(0); }
  if (id === 'optics') { runOptics(); }
  if (id === 'circuit') { resetCircuit(); }
  if (id === 'acidbase') { initShelf(); }
  if (id === 'dna') { initDNA(); }
  if (id === 'periodic') { renderPeriodicTable(); }
  if (id === 'cell') { drawPlantCell(); setupCellEvents(); 
  if (id === 'young') runYoung();
  if (id === 'energy') { resetEnergy(); if(!energyRunning) toggleEnergySim(); }
  if (id === 'torque') updateTorque();
  if (id === 'circuit') resetCircuit();}
  if (window.innerWidth <= 768) closeSidebar();
}

function toggleSubject(el) {
  const items = el.nextElementSibling;
  const arrow = el.querySelector('.arrow');
  items.classList.toggle('open');
  arrow.classList.toggle('open');
}

/* ==================== MOTION ==================== */
let motionRunning = false, motionRAF = null, motionT = 0;
let mV0 = 10, mA = 2, mTmax = 10, mSmax = 1;
let graphHistory = [];

function updateInputFields() {
  const target = document.getElementById('calc-target').value;
  document.getElementById('s-group').style.display = target === 's' ? 'none' : 'block';
  document.getElementById('v-group').style.display = target === 'v' ? 'none' : 'block';
  document.getElementById('t-group').style.display = target === 't' ? 'none' : 'block';
}

function updateMotionParam() {
  mV0 = parseFloat(document.getElementById('v0-input').value) || 10;
  mA  = parseFloat(document.getElementById('a-input').value) || 0;
  mTmax = parseFloat(document.getElementById('t-input').value) || 10;
  mSmax = Math.max(mV0 * mTmax + 0.5 * mA * mTmax * mTmax, 1);
}

function calcAndRun() {
  const target = document.getElementById('calc-target').value;
  mV0 = parseFloat(document.getElementById('v0-input').value) || 0;
  mA  = parseFloat(document.getElementById('a-input').value) || 0;
  const tIn = parseFloat(document.getElementById('t-input').value) || 0;
  const vIn = parseFloat(document.getElementById('v-input').value) || 0;
  const sIn = parseFloat(document.getElementById('s-input').value) || 0;
  if (target === 's') {
    mTmax = tIn;
    document.getElementById('s-input').value = (mV0 * tIn + 0.5 * mA * tIn * tIn).toFixed(2);
  } else if (target === 'v') {
    mTmax = tIn;
    document.getElementById('v-input').value = (mV0 + mA * tIn).toFixed(2);
  } else if (target === 't') {
    const t = Math.abs(mA) > 0.001 ? (vIn - mV0) / mA : (mV0 > 0 ? sIn / mV0 : 0);
    mTmax = Math.max(t, 1);
    document.getElementById('t-input').value = t.toFixed(2);
  }
  document.getElementById('m-acc').innerHTML = mA.toFixed(2) + '<span class="dc-unit">m/s²</span>';
  motionRunning = false; cancelAnimationFrame(motionRAF);
  motionT = 0; graphHistory = []; lastMotionTime = null;
  mSmax = Math.max(mV0 * mTmax + 0.5 * mA * mTmax * mTmax, 1);
  drawMotionFrame(mV0, 0); drawGraph();
  setTimeout(() => {
    motionRunning = true;
    document.getElementById('motion-btn').textContent = '⏸ DỪNG';
    requestAnimationFrame(motionLoop);
  }, 300);
}

function toggleMotion() {
  motionRunning = !motionRunning;
  document.getElementById('motion-btn').textContent = motionRunning ? '⏸ DỪNG' : '▶ TIẾP TỤC';
  if (motionRunning) { lastMotionTime = null; requestAnimationFrame(motionLoop); }
  else cancelAnimationFrame(motionRAF);
}

function resetMotion() {
  motionRunning = false; cancelAnimationFrame(motionRAF);
  motionT = 0; graphHistory = []; lastMotionTime = null;
  document.getElementById('motion-btn').textContent = '▶ CHẠY';
  drawMotionFrame(mV0, 0); drawGraph();
  document.getElementById('m-time').innerHTML = '0.00<span class="dc-unit">s</span>';
  document.getElementById('m-vel').innerHTML = mV0.toFixed(2) + '<span class="dc-unit">m/s</span>';
  document.getElementById('m-dist').innerHTML = '0.00<span class="dc-unit">m</span>';
}

let lastMotionTime = null;
function motionLoop(ts) {
  if (!lastMotionTime) lastMotionTime = ts;
  const dt = Math.min((ts - lastMotionTime) / 1000, 0.05);
  lastMotionTime = ts;
  motionT += dt;
  const v = mV0 + mA * motionT;
  const s = mV0 * motionT + 0.5 * mA * motionT * motionT;
  if ((mA < 0 && v <= 0) || motionT > mTmax) {
    motionRunning = false;
    document.getElementById('motion-btn').textContent = '▶ CHẠY';
    lastMotionTime = null;
    drawMotionFrame(Math.max(0,v), s); drawGraph();
    document.getElementById('m-time').innerHTML = motionT.toFixed(2) + '<span class="dc-unit">s</span>';
    document.getElementById('m-vel').innerHTML = Math.max(0,v).toFixed(2) + '<span class="dc-unit">m/s</span>';
    document.getElementById('m-dist').innerHTML = s.toFixed(2) + '<span class="dc-unit">m</span>';
    return;
  }
  graphHistory.push({ t: motionT, v: Math.max(0, v), s });
  drawMotionFrame(Math.max(0,v), s); drawGraph();
  document.getElementById('m-time').innerHTML = motionT.toFixed(2) + '<span class="dc-unit">s</span>';
  document.getElementById('m-vel').innerHTML = Math.max(0,v).toFixed(2) + '<span class="dc-unit">m/s</span>';
  document.getElementById('m-dist').innerHTML = s.toFixed(2) + '<span class="dc-unit">m</span>';
  if (motionRunning) motionRAF = requestAnimationFrame(motionLoop);
  else lastMotionTime = null;
}

function drawMotionFrame(v, s) {
  const c = document.getElementById('motion-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#c8e6c9'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#37474f'; ctx.fillRect(0, H*0.55, W, H*0.3);
  ctx.strokeStyle = '#ffe082'; ctx.lineWidth = 2; ctx.setLineDash([20,15]);
  ctx.beginPath(); ctx.moveTo(0, H*0.7); ctx.lineTo(W, H*0.7); ctx.stroke();
  ctx.setLineDash([]);
  const sMax = mSmax > 1 ? mSmax : Math.max(mV0 * mTmax + 0.5 * mA * mTmax * mTmax, 1);
  for (let i = 0; i <= 5; i++) {
    const x = (i / 5) * W;
    ctx.fillStyle = '#90a4ae'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText((sMax * i / 5).toFixed(0) + 'm', x, H*0.92);
  }
  const curS = s !== undefined ? s : 0;
  const carX = Math.min((curS / Math.max(sMax, 1)) * W, W - 70);
  const carY = H * 0.58;
  const cw = 62, ch = 26;
  ctx.shadowBlur = 14; ctx.shadowColor = '#1565c0';
  ctx.fillStyle = '#1565c0'; ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(carX, carY, cw, ch, 5) : ctx.fillRect(carX, carY, cw, ch);
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#1976d2';
  ctx.beginPath(); ctx.moveTo(carX+10, carY); ctx.lineTo(carX+18, carY-14); ctx.lineTo(carX+44, carY-14); ctx.lineTo(carX+52, carY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#80d8ff';
  ctx.fillRect(carX+20, carY-12, 10, 10); ctx.fillRect(carX+33, carY-12, 10, 10);
  [carX+12, carX+44].forEach(wx => {
    ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(wx, carY+ch, 9, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#b0bec5'; ctx.beginPath(); ctx.arc(wx, carY+ch, 4, 0, Math.PI*2); ctx.fill();
  });
  const speedText = (v||mV0).toFixed(1) + ' m/s';
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText(speedText, carX + 31, carY - 20);
}

function drawGraph() {
  const c = document.getElementById('graph-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0d1b2a'; ctx.fillRect(0, 0, W, H);
  const pad = { l:40, r:12, t:10, b:20 };
  const gW = W - pad.l - pad.r, gH = H - pad.t - pad.b;
  ctx.strokeStyle = '#334'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t+gH); ctx.lineTo(pad.l+gW, pad.t+gH); ctx.stroke();
  if (graphHistory.length < 2) { ctx.fillStyle = '#7cb9ff'; ctx.font = '11px monospace'; ctx.textAlign = 'left'; ctx.fillText('v(t) – Biểu đồ vận tốc', pad.l+4, pad.t+14); return; }
  const maxV = Math.max(...graphHistory.map(p=>p.v), 1);
  const maxT = mTmax;
  ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
  ctx.beginPath();
  graphHistory.forEach((p, i) => {
    const x = pad.l + (p.t / maxT) * gW;
    const y = pad.t + gH - (p.v / maxV) * gH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = '#e74c3c'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
  ctx.fillText('v(t)', pad.l+4, pad.t+12);
  ctx.fillStyle = '#7cb9ff'; ctx.textAlign = 'center';
  ctx.fillText(maxT.toFixed(0)+'s', pad.l+gW, pad.t+gH+16);
  ctx.textAlign = 'right';
  ctx.fillText(maxV.toFixed(0), pad.l-4, pad.t+10);
}

/* ==================== FORCE ==================== */
let forceRunning = false, forceRAF = null, forceOffset = 0, forceVelocity = 0, forceLastTime = null;

function getForceValues() {
  const f1 = parseFloat(document.getElementById('force-left').value) || 0;
  const f2 = parseFloat(document.getElementById('force-right').value) || 0;
  const maxF = Math.max(f1, f2, 1);
  return { f1, f2, pl: Math.max(1, Math.min(20, Math.round((f1/maxF)*8))), pr: Math.max(1, Math.min(20, Math.round((f2/maxF)*8))) };
}

function updateForceDisplay() {
  const { f1, f2 } = getForceValues();
  document.getElementById('fl-val').textContent = f1 + ' N';
  document.getElementById('fr-val').textContent = f2 + ' N';
  document.getElementById('fp-f1').innerHTML = f1 + '<span class="dc-unit">N</span>';
  document.getElementById('fp-f2').innerHTML = f2 + '<span class="dc-unit">N</span>';
  const net = f2 - f1;
  document.getElementById('fp-net').innerHTML = Math.abs(net).toFixed(0) + '<span class="dc-unit">N</span>';
  document.getElementById('fp-result').textContent = net > 0 ? '→ Phải thắng' : net < 0 ? '← Trái thắng' : '⇌ Cân bằng';
  if (!forceRunning) drawForceScene(forceOffset);
}

function toggleForce() {
  forceRunning = !forceRunning;
  document.getElementById('force-btn').textContent = forceRunning ? '⏸ DỪNG' : '▶ TIẾP TỤC';
  if (forceRunning) { forceLastTime = null; requestAnimationFrame(forceLoop); }
  else cancelAnimationFrame(forceRAF);
}

function resetForce() {
  forceRunning = false; cancelAnimationFrame(forceRAF);
  forceOffset = 0; forceVelocity = 0; forceLastTime = null;
  document.getElementById('force-btn').textContent = '▶ CHẠY';
  drawForceScene(0); updateForceDisplay();
}

function forceLoop(ts) {
  if (!forceLastTime) forceLastTime = ts;
  const dt = Math.min((ts - forceLastTime)/1000, 0.05); forceLastTime = ts;
  const { f1, f2 } = getForceValues();
  const net = f2 - f1;
  forceVelocity = forceVelocity * 0.97 + (net/500) * dt;
  forceOffset += forceVelocity * dt;
  forceOffset = Math.max(-1, Math.min(1, forceOffset));
  drawForceScene(forceOffset);
  document.getElementById('fp-net').innerHTML = Math.abs(net).toFixed(0) + '<span class="dc-unit">N</span>';
  if (Math.abs(forceOffset) >= 0.98) {
    forceRunning = false;
    document.getElementById('force-btn').textContent = '▶ CHẠY LẠI';
    document.getElementById('fp-result').textContent = forceOffset > 0 ? '→ Phải thắng!' : '← Trái thắng!';
    drawForceScene(forceOffset); return;
  }
  if (forceRunning) forceRAF = requestAnimationFrame(forceLoop);
}

function drawForceScene(offset) {
  const c = document.getElementById('force-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#1a1a2e'); bg.addColorStop(1,'#16213e');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2d5016'; ctx.fillRect(0, H*0.72, W, H*0.28);
  ctx.fillStyle = '#3a6b1a'; ctx.fillRect(0, H*0.72, W, 6);
  ctx.strokeStyle = '#4a8a20'; ctx.lineWidth = 1.5;
  for (let i=10; i<W; i+=18) { ctx.beginPath(); ctx.moveTo(i, H*0.72); ctx.lineTo(i+3, H*0.72-8); ctx.stroke(); }
  const { f1, f2, pl, pr } = getForceValues();
  const centerX = W/2 + offset*(W*0.28);
  const ropeY = H*0.48;
  const ropeLeft = 60, ropeRight = W-60;
  ctx.strokeStyle = '#c8a96e'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ropeLeft, ropeY); ctx.lineTo(ropeRight, ropeY); ctx.stroke();
  ctx.strokeStyle = '#a07840'; ctx.lineWidth = 1.5;
  for (let rx=ropeLeft; rx<ropeRight; rx+=14) { ctx.beginPath(); ctx.moveTo(rx, ropeY-2); ctx.lineTo(rx+7, ropeY+2); ctx.stroke(); }
  const mudR = 18;
  ctx.fillStyle = offset>0.05 ? '#2980b9' : offset<-0.05 ? '#e74c3c' : '#888';
  ctx.shadowBlur = 14; ctx.shadowColor = ctx.fillStyle;
  ctx.beginPath(); ctx.arc(centerX, ropeY, mudR*0.55, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fff'; ctx.fillRect(centerX-1.5, ropeY-mudR-10, 3, mudR);
  ctx.fillStyle = '#ffe082';
  ctx.beginPath(); ctx.moveTo(centerX+1, ropeY-mudR-10); ctx.lineTo(centerX+14, ropeY-mudR-4); ctx.lineTo(centerX+1, ropeY-mudR+2); ctx.closePath(); ctx.fill();

  function drawPerson(x, y, color, facingLeft) {
    const dir = facingLeft ? -1 : 1;
    ctx.fillStyle = color;
    ctx.fillRect(x-5, y-20, 10, 18);
    ctx.beginPath(); ctx.arc(x, y-26, 7, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y-16); ctx.lineTo(x+dir*12, y-10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x-3, y-2); ctx.lineTo(x-6, y+14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x+3, y-2); ctx.lineTo(x+4, y+14); ctx.stroke();
  }

  const leftColors = ['#e74c3c','#c0392b','#e17055','#ff6b6b','#ff7675','#fab1a0','#fd79a8','#d63031'];
  const spacing = Math.min(52, (centerX-ropeLeft-30)/(pl+1));
  for (let i=0; i<pl; i++) {
    const px = centerX-40-(i+1)*spacing;
    if (px > ropeLeft+10) drawPerson(px, ropeY+2, leftColors[i%leftColors.length], false);
  }
  const rightColors = ['#2980b9','#1abc9c','#3498db','#0652dd','#12CBC4','#1e90ff','#6c5ce7','#a29bfe'];
  const rspacing = Math.min(52, (ropeRight-centerX-30)/(pr+1));
  for (let i=0; i<pr; i++) {
    const px = centerX+40+(i+1)*rspacing;
    if (px < ropeRight-10) drawPerson(px, ropeY+2, rightColors[i%rightColors.length], true);
  }
  const arrowLen = Math.min(120, f1/3);
  const arrowLenR = Math.min(120, f2/3);
  const arrowY = ropeY-62;
  ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = '#e74c3c';
  ctx.beginPath(); ctx.moveTo(ropeLeft+arrowLen+10, arrowY); ctx.lineTo(ropeLeft+10, arrowY); ctx.stroke();
  ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.moveTo(ropeLeft+8, arrowY); ctx.lineTo(ropeLeft+20, arrowY-6); ctx.lineTo(ropeLeft+20, arrowY+6); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#ff7675'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
  ctx.fillText('F₁='+f1+'N', ropeLeft+arrowLen/2+10, arrowY-8);
  ctx.strokeStyle = '#2980b9'; ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = '#2980b9';
  ctx.beginPath(); ctx.moveTo(ropeRight-arrowLenR-10, arrowY); ctx.lineTo(ropeRight-10, arrowY); ctx.stroke();
  ctx.fillStyle = '#2980b9'; ctx.beginPath(); ctx.moveTo(ropeRight-8, arrowY); ctx.lineTo(ropeRight-20, arrowY-6); ctx.lineTo(ropeRight-20, arrowY+6); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0; ctx.fillStyle = '#74b9ff'; ctx.fillText('F₂='+f2+'N', ropeRight-arrowLenR/2-10, arrowY-8);
  ctx.fillStyle = '#ff7675'; ctx.font = 'bold 13px Nunito,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('ĐỘI TRÁI', 8, 20);
  ctx.fillStyle = '#74b9ff'; ctx.textAlign = 'right'; ctx.fillText('ĐỘI PHẢI', W-8, 20);
  const barW = W*0.5, barX = (W-barW)/2, barY = H*0.88, barH = 10;
  ctx.fillStyle = '#222'; ctx.fillRect(barX, barY, barW, barH);
  const net = f2-f1;
  if (Math.abs(net) > 1) {
    const fillW = Math.min(Math.abs(net)/1000, 1)*(barW/2);
    ctx.fillStyle = net>0 ? '#2980b9' : '#e74c3c';
    if (net > 0) ctx.fillRect(barX+barW/2, barY, fillW, barH);
    else ctx.fillRect(barX+barW/2-fillW, barY, fillW, barH);
  }
  ctx.fillStyle = '#fff'; ctx.fillRect(barX+barW/2-1.5, barY-3, 3, barH+6);
  ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('HỢP LỰC: '+(net>=0?'+':'')+net.toFixed(0)+' N', W/2, barY+barH+16);
}

/* ==================== WAVE SIM ==================== */
let waveRunning = false, waveRAF = null, wavePhase = 0, waveLastTime = null;

function updateWaveAmpNumber() { let val = document.getElementById('wave-amp').value; resetWave(); }
function updateWaveFreqNumber() { let val = document.getElementById('wave-freq').value; resetWave(); }
function updateWaveSpeedNumber() { let val = document.getElementById('wave-speed').value; resetWave(); }

function toggleWave() {
  waveRunning = !waveRunning;
  document.getElementById('wave-btn').textContent = waveRunning ? '⏸ DỪNG' : '▶ CHẠY';
  if (waveRunning) { waveLastTime = null; requestAnimationFrame(waveLoop); }
  else cancelAnimationFrame(waveRAF);
}

function resetWave() {
  waveRunning = false; cancelAnimationFrame(waveRAF);
  wavePhase = 0; waveLastTime = null;
  document.getElementById('wave-btn').textContent = '▶ CHẠY';
  drawWaveFrame(0);
}

function waveLoop(ts) {
  if (!waveLastTime) waveLastTime = ts;
  const dt = Math.min((ts - waveLastTime)/1000, 0.05); waveLastTime = ts;
  const freq = parseFloat(document.getElementById('wave-freq').value) || 2;
  wavePhase += freq * dt * Math.PI * 2;
  drawWaveFrame(wavePhase);
  updateWaveData();
  if (waveRunning) waveRAF = requestAnimationFrame(waveLoop);
}

function updateWaveData() {
  const A = parseFloat(document.getElementById('wave-amp').value) || 30;
  const f = parseFloat(document.getElementById('wave-freq').value) || 2;
  const spd = parseFloat(document.getElementById('wave-speed').value) || 3;
  document.getElementById('wave-A-display').innerHTML = A + '<span class="dc-unit">px</span>';
  document.getElementById('wave-f-display').innerHTML = f + '<span class="dc-unit">Hz</span>';
  document.getElementById('wave-T-display').innerHTML = (1/f).toFixed(2) + '<span class="dc-unit">s</span>';
  document.getElementById('wave-L-display').innerHTML = (spd/f).toFixed(1) + '<span class="dc-unit">cm</span>';
}

function drawWaveFrame(phase) {
  const c = document.getElementById('wave-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0d1b2a'); bg.addColorStop(1,'#0a1628');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  const A = parseFloat(document.getElementById('wave-amp').value) || 30;
  const f = parseFloat(document.getElementById('wave-freq').value) || 2;
  const spd = parseFloat(document.getElementById('wave-speed').value) || 3;
  const waveType = document.getElementById('wave-type').value;
  const lambda = spd / f * (W/6); // scale for display

  ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }

  const cy = H/2;
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.setLineDash([10,10]);
  ctx.beginPath(); ctx.moveTo(0,cy); ctx.lineTo(W,cy); ctx.stroke();
  ctx.setLineDash([]);

  if (waveType === 'transverse') {
    const grad = ctx.createLinearGradient(0,0,W,0);
    grad.addColorStop(0,'#e74c3c'); grad.addColorStop(0.5,'#f39c12'); grad.addColorStop(1,'#e74c3c');
    ctx.strokeStyle = grad; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = cy + A * Math.sin(2*Math.PI*x/lambda - phase);
      x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
    for (let x = 0; x < W; x += 30) {
      const y = cy + A * Math.sin(2*Math.PI*x/lambda - phase);
      ctx.fillStyle = '#ffe082'; ctx.shadowBlur = 8; ctx.shadowColor = '#ffe082';
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = '#aac4e6'; ctx.font = '12px Space Mono,monospace'; ctx.textAlign = 'left';
    ctx.fillText('Sóng ngang – dao động ⊥ phương truyền', 10, 20);
    ctx.strokeStyle = '#ffe082'; ctx.lineWidth = 1; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(20, cy-A); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffe082'; ctx.textAlign = 'left';
    ctx.fillText('A='+A, 24, cy-A/2);
  } else if (waveType === 'longitudinal') {
    ctx.fillStyle = '#aac4e6'; ctx.font = '12px Space Mono,monospace'; ctx.textAlign = 'left';
    ctx.fillText('Sóng dọc – dao động ∥ phương truyền', 10, 20);
    const rows = 5;
    const rowH = (H-80)/rows;
    for (let row = 0; row < rows; row++) {
      const rowY = 50 + row * rowH + rowH/2;
      for (let xi = 0; xi < W; xi += 18) {
        const displacement = A * 0.3 * Math.sin(2*Math.PI*xi/lambda - phase);
        const px = xi + displacement;
        const density = Math.abs(Math.cos(2*Math.PI*xi/lambda - phase));
        const alpha = 0.3 + 0.7 * density;
        const size = 3 + 2 * density;
        ctx.fillStyle = `rgba(100, 181, 246, ${alpha})`;
        ctx.shadowBlur = density > 0.7 ? 6 : 0; ctx.shadowColor = '#4fc3f7';
        ctx.beginPath(); ctx.arc(px, rowY, size, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.fillStyle = '#ffe082'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('NÉNCHẶT', W*0.25, H-12);
    ctx.fillText('LOÃNG', W*0.75, H-12);
  } else if (waveType === 'standing') {
    ctx.strokeStyle = 'rgba(231,76,60,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = cy + A * Math.sin(2*Math.PI*x/lambda - phase);
      x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(52,152,219,0.4)'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = cy + A * Math.sin(2*Math.PI*x/lambda + phase);
      x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
    const grad = ctx.createLinearGradient(0,0,W,0);
    grad.addColorStop(0,'#27ae60'); grad.addColorStop(0.5,'#2ecc71'); grad.addColorStop(1,'#27ae60');
    ctx.strokeStyle = grad; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = cy + 2*A*Math.sin(2*Math.PI*x/lambda)*Math.cos(phase);
      x === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.stroke();
    for (let x = 0; x < W; x += lambda/2) {
      ctx.fillStyle = '#e74c3c'; ctx.shadowBlur = 8; ctx.shadowColor = '#e74c3c';
      ctx.beginPath(); ctx.arc(x, cy, 5, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#aac4e6'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
      ctx.fillText('nút', x, cy+18);
    }
    ctx.fillStyle = '#aac4e6'; ctx.font = '12px Space Mono,monospace'; ctx.textAlign = 'left';
    ctx.fillText('Sóng dừng – Giao thoa hai sóng ngược chiều', 10, 20);
  }
  ctx.strokeStyle = '#7cb9ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(W-100, 35); ctx.lineTo(W-20, 35); ctx.stroke();
  ctx.fillStyle = '#7cb9ff';
  ctx.beginPath(); ctx.moveTo(W-15, 35); ctx.lineTo(W-28, 29); ctx.lineTo(W-28, 41); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#7cb9ff'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('→ truyền', W-58, 30);
}

/* ==================== OPTICS ==================== */
function runOptics() {
  const c = document.getElementById('optics-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#030712'; ctx.fillRect(0,0,W,H);

  const mode = document.getElementById('optics-mode').value;
  const angleDeg = parseFloat(document.getElementById('optics-angle').value) || 40;
  const n2 = parseFloat(document.getElementById('optics-n').value) || 1.5;
  const n1 = 1.0;
  const angleRad = angleDeg * Math.PI / 180;
  const sinR = (n1/n2) * Math.sin(angleRad);
  const rRad = Math.asin(Math.min(sinR, 1));
  const rDeg = rRad * 180 / Math.PI;

  document.getElementById('opt-i').innerHTML = angleDeg + '<span class="dc-unit">°</span>';
  document.getElementById('opt-r').innerHTML = rDeg.toFixed(1) + '<span class="dc-unit">°</span>';
  document.getElementById('opt-n').textContent = n2.toFixed(2);

  if (mode === 'dispersion') {
    document.getElementById('opt-desc').textContent = 'Tán sắc';
    drawDispersion(ctx, W, H, angleDeg);
  } else if (mode === 'refraction') {
    document.getElementById('opt-desc').textContent = 'Khúc xạ';
    drawRefraction(ctx, W, H, angleDeg, rDeg, n1, n2);
  } else {
    document.getElementById('opt-desc').textContent = 'Giao thoa';
    drawInterference(ctx, W, H);
  }
}

function drawDispersion(ctx, W, H) {
  const cx = W*0.35, cy = H/2;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx-80, cy+80); ctx.lineTo(cx+80, cy+80); ctx.lineTo(cx, cy-80); ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = 'rgba(100,200,255,0.08)'; ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.shadowBlur = 6; ctx.shadowColor = '#fff';
  ctx.beginPath(); ctx.moveTo(30, cy-30); ctx.lineTo(cx-20, cy+30); ctx.stroke();
  const colors = ['#ff0000','#ff7700','#ffff00','#00ff00','#0088ff','#4400ff','#8800ff'];
  const angles = [-12,-8,-4,0,4,8,12];
  colors.forEach((col, i) => {
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.shadowBlur = 8; ctx.shadowColor = col;
    const ang = (angles[i]) * Math.PI/180;
    ctx.beginPath();
    ctx.moveTo(cx+20, cy+30);
    ctx.lineTo(cx+20 + Math.cos(ang)*200, cy+30 - Math.sin(ang)*200);
    ctx.stroke();
  });
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#aac4e6'; ctx.font = '12px Space Mono,monospace'; ctx.textAlign = 'left';
  ctx.fillText('Tán sắc ánh sáng – lăng kính tách 7 màu', 10, 20);
  ctx.fillStyle = '#ffe082'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
  ctx.fillText('Ánh sáng trắng', 10, cy-30);
  ctx.fillStyle = '#7cb9ff';
  ctx.fillText('Lăng kính', cx-40, cy+100);
}

function drawRefraction(ctx, W, H, i_deg, r_deg, n1, n2) {
  const iRad = i_deg * Math.PI/180;
  const rRad = r_deg * Math.PI/180;
  const midX = W/2, midY = H/2;
  ctx.fillStyle = 'rgba(52,152,219,0.1)';
  ctx.fillRect(0, midY, W, H-midY);
  ctx.strokeStyle = 'rgba(52,152,219,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();
  ctx.fillStyle = '#7cb9ff'; ctx.font = '11px monospace'; ctx.textAlign = 'right';
  ctx.fillText('n₁ = '+n1.toFixed(2)+' (không khí)', W-10, midY-10);
  ctx.fillStyle = '#4fc3f7'; ctx.fillText('n₂ = '+n2.toFixed(2), W-10, midY+20);
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.setLineDash([6,6]);
  ctx.beginPath(); ctx.moveTo(midX, midY-120); ctx.lineTo(midX, midY+120); ctx.stroke();
  ctx.setLineDash([]);
  const iX = midX - Math.sin(iRad)*150, iY = midY - Math.cos(iRad)*150;
  ctx.strokeStyle = '#ffe082'; ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = '#ffe082';
  ctx.beginPath(); ctx.moveTo(iX, iY); ctx.lineTo(midX, midY); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffe082'; ctx.font = '12px monospace'; ctx.textAlign = 'center';
  ctx.fillText('i = '+i_deg+'°', iX+30, iY+20);
  const rX = midX + Math.sin(rRad)*150, rY = midY + Math.cos(rRad)*150;
  ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = '#2ecc71';
  ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(rX, rY); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#2ecc71'; ctx.fillText('r = '+r_deg.toFixed(1)+'°', rX-30, rY-20);
  const refX = midX + Math.sin(iRad)*100, refY = midY - Math.cos(iRad)*100;
  ctx.strokeStyle = 'rgba(255,224,130,0.4)'; ctx.lineWidth = 2; ctx.setLineDash([6,6]);
  ctx.beginPath(); ctx.moveTo(midX, midY); ctx.lineTo(refX, refY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#aac4e6'; ctx.font = '12px Space Mono,monospace'; ctx.textAlign = 'left';
  ctx.fillText('Khúc xạ ánh sáng – Định luật Snell', 10, 20);
}

function drawInterference(ctx, W, H) {
  const cx = W/2, cy = H/2;
  const slit1 = { x: cx-60, y: cy };
  const slit2 = { x: cx+60, y: cy };
  ctx.fillStyle = '#aac4e6'; ctx.font = '12px Space Mono,monospace'; ctx.textAlign = 'left';
  ctx.fillText('Giao thoa ánh sáng – vân sáng/tối', 10, 20);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) {
      const d1 = Math.sqrt((x-slit1.x)**2 + (y-slit1.y)**2);
      const d2 = Math.sqrt((x-slit2.x)**2 + (y-slit2.y)**2);
      const delta = d1 - d2;
      const lambda = 30;
      const intensity = Math.cos(Math.PI*delta/lambda)**2;
      if (intensity > 0.7) {
        ctx.fillStyle = `rgba(255, 235, 59, ${(intensity-0.7)*3.3*0.3})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(slit1.x, slit1.y, 5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(slit2.x, slit2.y, 5, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#ffe082'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
  ctx.fillText('S₁', slit1.x, slit1.y-10);
  ctx.fillText('S₂', slit2.x, slit2.y-10);
  ctx.fillStyle = '#7cb9ff'; ctx.font = '11px monospace';
  ctx.fillText('Vân sáng: δ=kλ', W*0.8, H-20);
}

/* ==================== CIRCUIT ==================== */
let circuitClosed = false;

function setSwitch(closed) {
  circuitClosed = closed;
  runCircuit();
}

function resetCircuit() {
  circuitClosed = false;
  ['circ-A','circ-V','circ-Rtotal','circ-P'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '–<span class="dc-unit">' + (id==='circ-A'?'A':id==='circ-V'?'V':id==='circ-Rtotal'?'Ω':'W') + '</span>';
  });
  drawCircuit(false, 0, 0);
}

function runCircuit() {
  const E = parseFloat(document.getElementById('circuit-emf').value) || 12;
  const R1 = parseFloat(document.getElementById('circuit-r1').value) || 10;
  const R2 = parseFloat(document.getElementById('circuit-r2').value) || 10;
  const RL = parseFloat(document.getElementById('circuit-lamp').value) || 5;
  const type = document.getElementById('circuit-type').value;
  let Rtotal;
  if (type === 'series') Rtotal = R1 + R2 + RL;
  else if (type === 'parallel') Rtotal = (1/(1/R1 + 1/R2)) + RL;
  else Rtotal = 1/(1/R1 + 1/(R2+RL));
  const I = circuitClosed ? E / Rtotal : 0;
  const V = circuitClosed ? I * RL : 0;
  const P = circuitClosed ? E * I : 0;
  document.getElementById('circ-A').innerHTML = I.toFixed(2) + '<span class="dc-unit">A</span>';
  document.getElementById('circ-V').innerHTML = (I*RL).toFixed(2) + '<span class="dc-unit">V</span>';
  document.getElementById('circ-Rtotal').innerHTML = Rtotal.toFixed(1) + '<span class="dc-unit">Ω</span>';
  document.getElementById('circ-P').innerHTML = P.toFixed(2) + '<span class="dc-unit">W</span>';
  drawCircuit(circuitClosed, I, E);
}


function drawCircuit(closed, I, E) {
  const c = document.getElementById('circuit-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  // Nền phòng lab tối
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a0f1a'); bg.addColorStop(1,'#0d1520');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Lưới nền nhẹ
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
  for(let x=0; x<W; x+=30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for(let y=0; y<H; y+=30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  const type = document.getElementById('circuit-type').value;
  const R1 = parseFloat(document.getElementById('circuit-r1').value)||10;
  const R2 = parseFloat(document.getElementById('circuit-r2').value)||10;
  const RL = parseFloat(document.getElementById('circuit-lamp').value)||5;
  const glow = closed && I > 0.01;
  const wireColor = glow ? '#ffd54f' : '#445566';
  const lineW = glow ? 3 : 2;
  const shadowC = glow ? '#ffd54f' : 'transparent';

  function wire(x1,y1,x2,y2, color, lw, sh) {
    ctx.save();
    if(sh) { ctx.shadowBlur=10; ctx.shadowColor=sh; }
    ctx.strokeStyle=color||wireColor; ctx.lineWidth=lw||lineW;
    ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.restore();
  }

  // Hàm vẽ điện trở (zig-zag chuẩn)
  function drawResistor(x, y, w, label, value) {
    const h2 = 10, segs = 8;
    ctx.fillStyle = '#1a2640';
    ctx.strokeStyle = glow ? '#ffa726' : '#607d8b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    for(let i = 0; i <= segs; i++) {
      const px = x + (w/segs)*i;
      const py = y + (i%2===0 ? -h2 : h2);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x+w, y); ctx.stroke();
    // Nhãn
    ctx.fillStyle = '#b0c4de'; ctx.font = 'bold 11px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, x+w/2, y-18);
    ctx.fillStyle = '#7cb9ff'; ctx.font = '10px monospace';
    ctx.fillText(value+'Ω', x+w/2, y+24);
  }

  // Hàm vẽ bóng đèn
  function drawLamp(cx, cy, label, glowing) {
    ctx.save();
    if(glowing) { ctx.shadowBlur=30; ctx.shadowColor='#fff176'; }
    // Vòng tròn bóng đèn
    ctx.strokeStyle = glowing ? '#ffd54f' : '#607d8b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.stroke();
    // Dấu x bên trong
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx-9, cy-9); ctx.lineTo(cx+9, cy+9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+9, cy-9); ctx.lineTo(cx-9, cy+9); ctx.stroke();
    if(glowing) {
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff176';
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.fillStyle = glowing ? '#ffd54f' : '#b0c4de';
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy - 20);
  }

  // Hàm vẽ nguồn điện (pin)
  function drawBattery(cx, cy, voltage) {
    const bw=14, bh=36;
    // Thân pin
    ctx.fillStyle = '#1e3a5f';
    ctx.strokeStyle = '#90caf9'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx-bw/2-4,cy-bh/2-6,bw+8,bh+12,4): ctx.rect(cx-bw/2-4,cy-bh/2-6,bw+8,bh+12); ctx.fill(); ctx.stroke();
    // Vạch cực
    ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 3; // cực dương (+)
    ctx.beginPath(); ctx.moveTo(cx-bw/2,cy-bh/2); ctx.lineTo(cx+bw/2,cy-bh/2); ctx.stroke();
    ctx.strokeStyle = '#90caf9'; ctx.lineWidth = 2; // cực âm (-)
    ctx.beginPath(); ctx.moveTo(cx-bw/2+4,cy+bh/2); ctx.lineTo(cx+bw/2-4,cy+bh/2); ctx.stroke();
    // Ký hiệu + và -
    ctx.fillStyle = '#ef5350'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('+', cx, cy-bh/2-10);
    ctx.fillStyle = '#90caf9'; ctx.fillText('–', cx, cy+bh/2+12);
    // Giá trị E
    ctx.fillStyle = '#ffe082'; ctx.font = 'bold 10px monospace';
    ctx.fillText(voltage+'V', cx, cy+3);
    ctx.fillStyle = '#7cb9ff'; ctx.font = '9px monospace'; ctx.fillText('Pin', cx, cy-8);
  }

  // Hàm vẽ ampe kế
  function drawAmmeter(cx, cy, iVal) {
    ctx.save();
    if(glow) { ctx.shadowBlur=8; ctx.shadowColor='#80ff80'; }
    ctx.strokeStyle = glow ? '#69f0ae' : '#546e7a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#aaffaa'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('A', cx, cy+4);
    if(closed) {
      ctx.fillStyle = '#69f0ae'; ctx.font = '9px monospace';
      ctx.fillText(iVal+'A', cx, cy+20);
    }
  }

  // Hàm vẽ vôn kế
  function drawVoltmeter(cx, cy, vVal) {
    ctx.save();
    ctx.strokeStyle = glow ? '#80b4ff' : '#546e7a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#aaccff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('V', cx, cy+4);
    if(closed) {
      ctx.fillStyle = '#80b4ff'; ctx.font = '9px monospace';
      ctx.fillText(vVal+'V', cx, cy+20);
    }
  }

  // Hàm vẽ khóa K
  function drawSwitch(x, y, isClosed) {
    ctx.strokeStyle = glow && isClosed ? '#ffd54f' : '#90a4ae'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x-14, y); ctx.lineTo(x-4, y); ctx.stroke();
    ctx.beginPath(); ctx.arc(x-4, y, 3, 0, Math.PI*2); ctx.fillStyle='#90a4ae'; ctx.fill();
    if(isClosed) {
      ctx.beginPath(); ctx.moveTo(x-4, y); ctx.lineTo(x+4, y); ctx.lineTo(x+14, y); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x-4, y); ctx.lineTo(x+10, y-12); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x+14, y, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#90a4ae'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('K', x, y+14);
  }

  // Hạt điện tử di chuyển
  function drawElectrons(points, count, progress) {
    if(!closed || I < 0.01) return;
    ctx.save();
    for(let e=0; e<count; e++) {
      const t = ((progress + e/count) % 1);
      const idx = Math.floor(t * (points.length-1));
      const frac = (t * (points.length-1)) - idx;
      if(idx >= points.length-1) continue;
      const ex = points[idx].x + (points[idx+1].x - points[idx].x)*frac;
      const ey = points[idx].y + (points[idx+1].y - points[idx].y)*frac;
      ctx.shadowBlur=6; ctx.shadowColor='#ffd54f';
      ctx.fillStyle='#ffe082';
      ctx.beginPath(); ctx.arc(ex, ey, 3.5, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  const eProgress = (Date.now() % 3000) / 3000;

  if(type === 'series') {
    // Layout nối tiếp: pin → K → Ammeter → R1 → R2 → Lamp → về pin
    // Đường chính: chữ nhật lớn
    const left=60, right=640, top=80, bot=240;
    const batX=left+30, batY=(top+bot)/2;
    const swX=left+110, swY=top;
    const amX=left+200, amY=top;
    const r1X=left+280, r1Y=top;
    const r2X=left+400, r2Y=top;
    const lampX=right-40, lampY=(top+bot)/2;

    wire(left, top, left, bot, wireColor, lineW, shadowC); // dây trái (pin)
    wire(left, bot, right, bot, wireColor, lineW, shadowC); // dây dưới
    wire(right, bot, right, top, wireColor, lineW, shadowC); // dây phải (đèn)
    wire(right, top, lampX+15, top, wireColor, lineW, shadowC);
    wire(right, bot, right, lampY+15, wireColor, lineW, shadowC);
    wire(left, top, swX-14, top, wireColor, lineW, shadowC);
    wire(swX+14, top, amX-14, top, wireColor, lineW, shadowC);
    wire(amX+14, top, r1X, top, wireColor, lineW, shadowC);
    wire(r1X+60, top, r2X, top, wireColor, lineW, shadowC);
    wire(r2X+60, top, lampX, top, wireColor, lineW, shadowC);

    // Dây nối pin vào mạch
    wire(left, batY-18, left, top, wireColor, lineW, shadowC);
    wire(left, batY+18, left, bot, wireColor, lineW, shadowC);

    drawBattery(batX-30, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));
    drawResistor(r1X, r1Y, 60, 'R₁', R1);
    drawResistor(r2X, r2Y, 60, 'R₂', R2);
    drawLamp(lampX, lampY, 'Đèn', glow);

    // Vôn kế song song với đèn (nét đứt màu xanh)
    const vmX = lampX, vmY = bot-40;
    ctx.save(); ctx.strokeStyle='#4488ff'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(right-4, top); ctx.lineTo(right-4, vmY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(right-4, vmY); ctx.lineTo(vmX+14, vmY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(right-4, bot-4); ctx.lineTo(right-4, vmY); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    drawVoltmeter(vmX-15, vmY, (I*RL).toFixed(1));

    // Electrons
    const ePath = [
      {x:left,y:bot},{x:right,y:bot},{x:right,y:top+30},{x:lampX,y:top+30},
      {x:r2X+60,y:top},{x:r2X,y:top},{x:r1X+60,y:top},{x:r1X,y:top},
      {x:amX+14,y:top},{x:swX+14,y:top},{x:swX-14,y:top},{x:left,y:top},{x:left,y:bot}
    ];
    if(closed) drawElectrons(ePath, 6, eProgress);

  } else if(type === 'parallel') {
    // Layout song song: pin → K → Ammeter → (R1 // R2) → Lamp → về
    const left=60, right=640, top=70, mid=170, bot=260;
    const batX=left+30, batY=(top+bot)/2;
    const swX=130, swY=top;
    const amX=210, amY=top;
    const jL=290, jR=440; // junction points

    // Dây ngoài
    wire(left, batY-18, left, top, wireColor, lineW, shadowC);
    wire(left, batY+18, left, bot, wireColor, lineW, shadowC);
    wire(left, top, swX-14, top, wireColor, lineW, shadowC);
    wire(swX+14, top, amX-14, top, wireColor, lineW, shadowC);
    wire(amX+14, top, jL, top, wireColor, lineW, shadowC);
    wire(jR, top, right-30, top, wireColor, lineW, shadowC);
    wire(left, bot, right, bot, wireColor, lineW, shadowC);
    wire(right, bot, right, top, wireColor, lineW, shadowC);
    wire(right, top, right-30, top, wireColor, lineW, shadowC);

    // Nhánh R1 (trên)
    wire(jL, top, jL, mid-30, wireColor, lineW, shadowC);
    wire(jL, mid-30, jL+10, mid-30, wireColor, lineW, shadowC);
    wire(jR, mid-30, jR, top, wireColor, lineW, shadowC);
    wire(jR-10, mid-30, jR, mid-30, wireColor, lineW, shadowC);
    drawResistor(jL+10, mid-30, jR-jL-20, 'R₁', R1);

    // Nhánh R2 (dưới)
    wire(jL, top, jL, mid+30, wireColor, lineW, shadowC);
    wire(jL, mid+30, jL+10, mid+30, wireColor, lineW, shadowC);
    wire(jR, mid+30, jR, top, wireColor, lineW, shadowC);
    wire(jR-10, mid+30, jR, mid+30, wireColor, lineW, shadowC);
    drawResistor(jL+10, mid+30, jR-jL-20, 'R₂', R2);

    // Đèn nối tiếp sau song song
    const lampX = right-60, lampY=(top+bot)/2;
    wire(right, top, right, lampY-15, wireColor, lineW, shadowC);
    wire(right, lampY+15, right, bot, wireColor, lineW, shadowC);
    drawLamp(lampX+20, lampY, 'Đèn', glow);

    drawBattery(batX-30, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));

    // Junction dots
    [jL,jR].forEach(jx => {
      ctx.fillStyle = wireColor; ctx.beginPath(); ctx.arc(jx, top, 5, 0, Math.PI*2); ctx.fill();
    });

  } else { // mixed
    const left=60, right=640, top=80, bot=240;
    const batX=left+20, batY=(top+bot)/2;
    const swX=120, swY=top;
    const amX=200, amY=top;
    const jL=290, jR=430;

    wire(left, batY-18, left, top, wireColor, lineW, shadowC);
    wire(left, batY+18, left, bot, wireColor, lineW, shadowC);
    wire(left, top, swX-14, top, wireColor, lineW, shadowC);
    wire(swX+14, top, amX-14, top, wireColor, lineW, shadowC);
    wire(amX+14, top, jL, top, wireColor, lineW, shadowC);
    wire(jR, top, right, top, wireColor, lineW, shadowC);
    wire(left, bot, right, bot, wireColor, lineW, shadowC);
    wire(right, bot, right, top, wireColor, lineW, shadowC);

    // R1 nhánh trên song song
    wire(jL, top, jL, top-50, wireColor, lineW, shadowC);
    wire(jL, top-50, jL+15, top-50, wireColor, lineW, shadowC);
    wire(jR, top, jR, top-50, wireColor, lineW, shadowC);
    wire(jR-15, top-50, jR, top-50, wireColor, lineW, shadowC);
    drawResistor(jL+15, top-50, jR-jL-30, 'R₁', R1);

    // R2 nhánh dưới song song
    wire(jL, top, jL, top+50, wireColor, lineW, shadowC);
    wire(jL, top+50, jL+15, top+50, wireColor, lineW, shadowC);
    wire(jR, top, jR, top+50, wireColor, lineW, shadowC);
    wire(jR-15, top+50, jR, top+50, wireColor, lineW, shadowC);
    drawResistor(jL+15, top+50, jR-jL-30, 'R₂', R2);

    // Đèn sau khối song song
    const lampX=right-50, lampY=(top+bot)/2;
    wire(right, top, right, lampY-15, wireColor, lineW, shadowC);
    wire(right, lampY+15, right, bot, wireColor, lineW, shadowC);
    drawLamp(lampX, lampY, 'Đèn', glow);

    [jL,jR].forEach(jx => {
      ctx.fillStyle = wireColor; ctx.beginPath(); ctx.arc(jx, top, 5, 0, Math.PI*2); ctx.fill();
    });

    drawBattery(batX-10, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));
  }

  // Nhãn trạng thái dưới cùng
  ctx.font = 'bold 12px Space Mono,monospace'; ctx.textAlign = 'center';
  if(closed) {
    ctx.fillStyle = '#69f0ae';
    ctx.fillText(`✔ Mạch đóng  |  I = ${I.toFixed(2)} A  |  P = ${(E*I).toFixed(2)} W`, W/2, H-10);
  } else {
    ctx.fillStyle = '#ef5350';
    ctx.fillText('✘ Mạch hở – Đóng khóa K để bật mạch', W/2, H-10);
  }
}
requestAnimationFrame(function loop(ts) {
  const cPage = document.getElementById('page-circuit');
  if(cPage && cPage.classList.contains('active') && circuitClosed) {
    const E2 = parseFloat(document.getElementById('circuit-emf').value)||12;
    const R12 = parseFloat(document.getElementById('circuit-r1').value)||10;
    const R22 = parseFloat(document.getElementById('circuit-r2').value)||10;
    const RL2 = parseFloat(document.getElementById('circuit-lamp').value)||5;
    const type2 = document.getElementById('circuit-type').value;
    let Rt; if(type2==='series') Rt=R12+R22+RL2; else if(type2==='parallel') Rt=(1/(1/R12+1/R22))+RL2; else Rt=1/(1/R12+1/(R22+RL2));
    const I2 = E2/Rt;
    drawCircuit(true, I2, E2);
  }
  requestAnimationFrame(loop);
});
/* ==================== CHEMISTRY ==================== */
const chemicals = [
  { id:'HCl',  name:'HCl',    type:'acid',    strength:'strong', pH:1.0,  pKa: -6,   pKb: null, color:'#ff8a65cc', typeLabel:'Acid mạnh',  formula:'HCl → H⁺ + Cl⁻' },
  { id:'H2SO4',name:'H₂SO₄', type:'acid',    strength:'strong', pH:0.5,  pKa: -3,   pKb: null, color:'#ff7043cc', typeLabel:'Acid mạnh',  formula:'H₂SO₄ → 2H⁺ + SO₄²⁻' },
  { id:'CH3COOH',name:'CH₃COOH',type:'acid', strength:'weak',   pH:3.0,  pKa: 4.76, pKb: null, color:'#ffcc80cc', typeLabel:'Acid yếu',   formula:'CH₃COOH ⇌ CH₃COO⁻ + H⁺' },
  { id:'HNO3', name:'HNO₃',  type:'acid',    strength:'strong', pH:1.2,  pKa: -1,   pKb: null, color:'#ffb74dcc', typeLabel:'Acid mạnh',  formula:'HNO₃ → H⁺ + NO₃⁻' },
  { id:'NaOH', name:'NaOH',  type:'base',    strength:'strong', pH:13.0, pKa: null, pKb: 0,   color:'#4fc3f7cc', typeLabel:'Base mạnh',  formula:'NaOH → Na⁺ + OH⁻' },
  { id:'KOH',  name:'KOH',   type:'base',    strength:'strong', pH:13.0, pKa: null, pKb: 0,   color:'#29b6f6cc', typeLabel:'Base mạnh',  formula:'KOH → K⁺ + OH⁻' },
  { id:'CuOH2',name:'Cu(OH)₂',type:'base',  strength:'weak',   pH:9.0,  pKa: null, pKb: 6.5, color:'#80deea cc', typeLabel:'Base yếu',   formula:'Cu(OH)₂ ⇌ Cu²⁺ + 2OH⁻' },
  { id:'NH3',  name:'NH₃',   type:'base',    strength:'weak',   pH:11.0, pKa: null, pKb: 4.75,color:'#80cbc4cc', typeLabel:'Base yếu',   formula:'NH₃ + H₂O ⇌ NH₄⁺ + OH⁻' },
  { id:'H2O',  name:'H₂O',   type:'neutral', strength:'neutral',pH:7.0,  pKa: null, pKb: null,color:'#b2ebf2cc', typeLabel:'Trung tính', formula:'H₂O – nước tinh khiết' },
  { id:'NaCl', name:'NaCl',  type:'neutral', strength:'neutral',pH:7.0,  pKa: null, pKb: null,color:'#e0e0e0cc', typeLabel:'Muối',       formula:'NaCl – muối ăn' },
  // Thêm vào cuối mảng chemicals
  { id:'CaOH2', name:'Ca(OH)₂', type:'base', strength:'strong', pH:12.5, pKa: null, pKb: 0, color:'#4db6accc', typeLabel:'Base mạnh', formula:'Ca(OH)₂ → Ca²⁺ + 2OH⁻' },
  { id:'Na2CO3', name:'Na₂CO₃', type:'base', strength:'weak', pH:11.0, pKa: null, pKb: 3.67, color:'#80cbc4cc', typeLabel:'Base yếu', formula:'Na₂CO₃ + H₂O ⇌ HCO₃⁻ + OH⁻' },
  { id:'AlCl3', name:'AlCl₃', type:'acid', strength:'weak', pH:4.0, pKa: 5.0, pKb: null, color:'#ffb74dcc', typeLabel:'Acid yếu (thủy phân)', formula:'AlCl₃ + 3H₂O ⇌ Al(OH)₃ + 3H⁺' }
];

let selectedA = null, selectedB = null;

function initShelf() {
  const row = document.getElementById('shelf-row'); if (!row) return;
  row.innerHTML = '';
  chemicals.forEach(ch => {
    const emoji = ch.type === 'acid' ? '🔴' : ch.type === 'base' ? '🔵' : '⚪';
    const div = document.createElement('div');
    div.className = 'chem-bottle';
    div.id = 'bottle-' + ch.id;
    div.innerHTML = `<div class="bottle-svg">${emoji}🧪</div><div class="bottle-name">${ch.name}</div><div class="bottle-type">${ch.typeLabel}</div>`;
    div.onclick = () => selectChemical(ch);
    row.appendChild(div);
  });
  resetChem();
}

function selectChemical(ch) {
  if (!selectedA) {
    selectedA = ch;
    document.getElementById('slot-A-name').textContent = ch.name;
    document.getElementById('slot-A').style.borderColor = '#e74c3c';
    document.getElementById('bottle-'+ch.id).classList.add('selected');
    document.getElementById('beaker-A-label').textContent = ch.name;
    document.getElementById('liq-acid').style.background = ch.color;
  } else if (!selectedB && ch.id !== selectedA.id) {
    selectedB = ch;
    document.getElementById('slot-B-name').textContent = ch.name;
    document.getElementById('slot-B').style.borderColor = '#e74c3c';
    document.getElementById('bottle-'+ch.id).classList.add('selected');
    document.getElementById('beaker-B-label').textContent = ch.name;
    document.getElementById('liq-base').style.background = ch.color;
  }
  updateLitmus();
  document.getElementById('chem-A').textContent = selectedA ? selectedA.name : '–';
  document.getElementById('chem-B').textContent = selectedB ? selectedB.name : '–';
}

function clearSlot(slot) {
  if (slot === 'A' && selectedA) {
    document.getElementById('bottle-'+selectedA.id).classList.remove('selected');
    selectedA = null;
    document.getElementById('slot-A-name').textContent = '— chưa chọn —';
    document.getElementById('slot-A').style.borderColor = '';
    document.getElementById('chem-A').textContent = '–';
  }
  if (slot === 'B' && selectedB) {
    document.getElementById('bottle-'+selectedB.id).classList.remove('selected');
    selectedB = null;
    document.getElementById('slot-B-name').textContent = '— chưa chọn —';
    document.getElementById('slot-B').style.borderColor = '';
    document.getElementById('chem-B').textContent = '–';
  }
  updateLitmus();
}

function updateLitmus() {
  const paper = document.getElementById('litmus-paper');
  const result = document.getElementById('litmus-result');
  if (!selectedA) { paper.style.background = '#9c27b0'; document.getElementById('litmus-text').textContent = 'Quỳ tím'; result.textContent = 'Chưa thử'; return; }
  const pH = selectedA.pH;
  if (pH < 7) { paper.style.background = '#e74c3c'; document.getElementById('litmus-text').textContent = 'Đỏ'; result.textContent = `pH = ${pH} → Môi trường acid 🔴`; }
  else if (pH > 7) { paper.style.background = '#1565c0'; document.getElementById('litmus-text').textContent = 'Xanh'; result.textContent = `pH = ${pH} → Môi trường base 🔵`; }
  else { paper.style.background = '#9c27b0'; document.getElementById('litmus-text').textContent = 'Tím'; result.textContent = `pH = ${pH} → Trung tính ⚪`; }
}

function computePH(chemical, concentration) {
  if (!chemical || chemical.type === 'neutral') return 7.0;
  if (chemical.type === 'acid') {
    if (chemical.strength === 'strong') {
      let h = concentration;
      if (chemical.id === 'H2SO4') h = 2 * concentration;
      return h > 0 ? -Math.log10(h) : 7;
    } else {
      const h = Math.sqrt(concentration * Math.pow(10, -chemical.pKa));
      return -Math.log10(h);
    }
  } else {
    if (chemical.strength === 'strong') {
      let oh = concentration;
      const poh = -Math.log10(oh);
      return 14 - poh;
    } else {
      const oh = Math.sqrt(concentration * Math.pow(10, -chemical.pKb));
      const poh = -Math.log10(oh);
      return 14 - poh;
    }
  }
}

function mixChemicals() {
  if (!selectedA || !selectedB) { alert('Hãy chọn 2 chất từ kệ để phản ứng!'); return; }
  const concA = parseFloat(document.getElementById('conc-A').value) || 0.1;
  const concB = parseFloat(document.getElementById('conc-B').value) || 0.1;
  const volA = parseFloat(document.getElementById('vol-A').value) || 1.0;
  const volB = volA;
  const volTotal = volA + volB;
  
  let finalpH = 7.0;
  let env = 'Trung tính';
  let description = '';

  if ((selectedA.type === 'acid' && selectedB.type === 'base') || (selectedA.type === 'base' && selectedB.type === 'acid')) {
    const acid = selectedA.type === 'acid' ? selectedA : selectedB;
    const base = selectedA.type === 'base' ? selectedA : selectedB;
    const concAcid = selectedA.type === 'acid' ? concA : concB;
    const concBase = selectedA.type === 'base' ? concA : concB;
    const volAcid = selectedA.type === 'acid' ? volA : volB;
    const volBase = selectedA.type === 'base' ? volA : volB;
    
    let nH = 0, nOH = 0;
    if (acid.strength === 'strong') {
      nH = concAcid * volAcid;
      if (acid.id === 'H2SO4') nH *= 2;
    } else {
      nH = concAcid * volAcid;
    }
    if (base.strength === 'strong') {
      nOH = concBase * volBase;
    } else {
      nOH = concBase * volBase;
    }
    
    const nDiff = Math.abs(nH - nOH);
    if (nDiff < 1e-6) {
      finalpH = 7.0;
      env = 'Trung tính (phản ứng trung hòa)';
      description = 'Acid và base vừa đủ → muối trung hòa + nước';
    } else if (nH > nOH) {
      const h_conc = (nH - nOH) / volTotal;
      finalpH = -Math.log10(h_conc);
      env = 'Acid';
      description = `Acid dư ${(nH-nOH).toFixed(4)} mol → pH = ${finalpH.toFixed(2)}`;
    } else {
      const oh_conc = (nOH - nH) / volTotal;
      finalpH = 14 - (-Math.log10(oh_conc));
      env = 'Kiềm';
      description = `Kiềm dư ${(nOH-nH).toFixed(4)} mol → pH = ${finalpH.toFixed(2)}`;
    }
  } 
  else if (selectedA.type === 'acid' && selectedB.type === 'acid') {
    const pH1 = computePH(selectedA, concA);
    const pH2 = computePH(selectedB, concB);
    const h1 = Math.pow(10, -pH1);
    const h2 = Math.pow(10, -pH2);
    const h_avg = (h1 * volA + h2 * volB) / volTotal;
    finalpH = -Math.log10(h_avg);
    env = 'Hỗn hợp acid';
    description = `pH trung bình theo nồng độ H⁺ = ${finalpH.toFixed(2)}`;
  } 
  else if (selectedA.type === 'base' && selectedB.type === 'base') {
    const pH1 = computePH(selectedA, concA);
    const pH2 = computePH(selectedB, concB);
    const oh1 = Math.pow(10, -(14 - pH1));
    const oh2 = Math.pow(10, -(14 - pH2));
    const oh_avg = (oh1 * volA + oh2 * volB) / volTotal;
    finalpH = 14 - (-Math.log10(oh_avg));
    env = 'Hỗn hợp base';
    description = `pH trung bình theo nồng độ OH⁻ = ${finalpH.toFixed(2)}`;
  }
  else {
    const active = selectedA.type !== 'neutral' ? selectedA : selectedB;
    const concActive = selectedA.type !== 'neutral' ? concA : concB;
    finalpH = computePH(active, concActive);
    env = active.type === 'acid' ? 'Môi trường acid' : (active.type === 'base' ? 'Môi trường base' : 'Trung tính');
    description = `Chỉ có ${active.name} ảnh hưởng pH`;
  }

  finalpH = Math.min(14, Math.max(0, finalpH));
  
  document.getElementById('ph-val').textContent = finalpH.toFixed(2);
  document.getElementById('chem-ph-val').innerHTML = finalpH.toFixed(2);
  document.getElementById('chem-env').textContent = env;
  document.getElementById('liq-acid').style.height = '20%';
  document.getElementById('liq-base').style.height = '20%';
  document.getElementById('liq-result').style.height = '70%';
  let color;
  if (finalpH < 6) color = '#ff8a65cc';
  else if (finalpH < 7) color = '#ffcc80cc';
  else if (finalpH > 8) color = '#4fc3f7cc';
  else if (finalpH > 7) color = '#80cbc4cc';
  else color = '#b2ebf2cc';
  document.getElementById('liq-result').style.background = color;
  document.getElementById('ph-display').style.display = 'flex';
  
  const paper = document.getElementById('litmus-paper');
  const resultSpan = document.getElementById('litmus-result');
  if (finalpH < 7) { paper.style.background = '#e74c3c'; document.getElementById('litmus-text').textContent = 'Đỏ'; resultSpan.textContent = `pH = ${finalpH.toFixed(2)} → Môi trường acid 🔴`; }
  else if (finalpH > 7) { paper.style.background = '#1565c0'; document.getElementById('litmus-text').textContent = 'Xanh'; resultSpan.textContent = `pH = ${finalpH.toFixed(2)} → Môi trường base 🔵`; }
  else { paper.style.background = '#9c27b0'; document.getElementById('litmus-text').textContent = 'Tím'; resultSpan.textContent = `pH = 7.00 → Trung tính ⚪`; }
  
  const eqDiv = document.getElementById('reaction-equation');
  const eqText = document.getElementById('reaction-text');
  const eqNote = document.getElementById('reaction-note');
  eqDiv.style.display = 'block';
  if (selectedA.type === 'acid' && selectedB.type === 'base') {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name + ' → Muối + H₂O';
    eqNote.textContent = `Phản ứng trung hòa. ${description}`;
  } else if (selectedA.type === 'base' && selectedB.type === 'acid') {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name + ' → Muối + H₂O';
    eqNote.textContent = `Phản ứng trung hòa. ${description}`;
  } else if (selectedA.type === 'acid' && selectedB.type === 'acid') {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name + ' → Hỗn hợp acid';
    eqNote.textContent = description;
  } else if (selectedA.type === 'base' && selectedB.type === 'base') {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name + ' → Hỗn hợp base';
    eqNote.textContent = description;
  } else {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name;
    eqNote.textContent = description;
  }
}

function resetChem() {
  document.querySelectorAll('.chem-bottle').forEach(b => b.classList.remove('selected'));
  selectedA = null; selectedB = null;
  document.getElementById('slot-A-name').textContent = '— chưa chọn —';
  document.getElementById('slot-B-name').textContent = '— chưa chọn —';
  document.getElementById('slot-A').style.borderColor = '';
  document.getElementById('slot-B').style.borderColor = '';
  document.getElementById('liq-acid').style.height = '60%';
  document.getElementById('liq-acid').style.background = '#ff8a65cc';
  document.getElementById('liq-base').style.height = '60%';
  document.getElementById('liq-base').style.background = '#4fc3f7cc';
  document.getElementById('liq-result').style.height = '0%';
  document.getElementById('ph-display').style.display = 'none';
  document.getElementById('chem-ph-val').textContent = '–';
  document.getElementById('chem-env').textContent = '–';
  document.getElementById('chem-A').textContent = '–';
  document.getElementById('chem-B').textContent = '–';
  document.getElementById('reaction-equation').style.display = 'none';
  document.getElementById('beaker-A-label').textContent = 'Chất A';
  document.getElementById('beaker-B-label').textContent = 'Chất B';
  document.getElementById('conc-A').value = '0.1';
  document.getElementById('conc-B').value = '0.1';
  document.getElementById('vol-A').value = '1.0';
  updateLitmus();
}

/* ==================== PERIODIC TABLE ==================== */
const elementsData = [
  { symbol:"H", name:"Hydrogen", number:1, mass:1.008, group:"IA", period:1, category:"nonmetal", electronegativity:2.20, config:"1s¹" },
  { symbol:"He", name:"Helium", number:2, mass:4.0026, group:"VIIIA", period:1, category:"noble gas", electronegativity:null, config:"1s²" },
  { symbol:"Li", name:"Lithium", number:3, mass:6.94, group:"IA", period:2, category:"alkali metal", electronegativity:0.98, config:"[He] 2s¹" },
  { symbol:"Be", name:"Beryllium", number:4, mass:9.012, group:"IIA", period:2, category:"alkaline earth", electronegativity:1.57, config:"[He] 2s²" },
  { symbol:"B", name:"Boron", number:5, mass:10.81, group:"IIIA", period:2, category:"metalloid", electronegativity:2.04, config:"[He] 2s² 2p¹" },
  { symbol:"C", name:"Carbon", number:6, mass:12.011, group:"IVA", period:2, category:"nonmetal", electronegativity:2.55, config:"[He] 2s² 2p²" },
  { symbol:"N", name:"Nitrogen", number:7, mass:14.007, group:"VA", period:2, category:"nonmetal", electronegativity:3.04, config:"[He] 2s² 2p³" },
  { symbol:"O", name:"Oxygen", number:8, mass:15.999, group:"VIA", period:2, category:"nonmetal", electronegativity:3.44, config:"[He] 2s² 2p⁴" },
  { symbol:"F", name:"Fluorine", number:9, mass:18.998, group:"VIIA", period:2, category:"halogen", electronegativity:3.98, config:"[He] 2s² 2p⁵" },
  { symbol:"Ne", name:"Neon", number:10, mass:20.180, group:"VIIIA", period:2, category:"noble gas", electronegativity:null, config:"[He] 2s² 2p⁶" },
  { symbol:"Na", name:"Sodium", number:11, mass:22.990, group:"IA", period:3, category:"alkali metal", electronegativity:0.93, config:"[Ne] 3s¹" },
  { symbol:"Mg", name:"Magnesium", number:12, mass:24.305, group:"IIA", period:3, category:"alkaline earth", electronegativity:1.31, config:"[Ne] 3s²" },
  { symbol:"Al", name:"Aluminium", number:13, mass:26.982, group:"IIIA", period:3, category:"post-transition", electronegativity:1.61, config:"[Ne] 3s² 3p¹" },
  { symbol:"Si", name:"Silicon", number:14, mass:28.086, group:"IVA", period:3, category:"metalloid", electronegativity:1.90, config:"[Ne] 3s² 3p²" },
  { symbol:"P", name:"Phosphorus", number:15, mass:30.974, group:"VA", period:3, category:"nonmetal", electronegativity:2.19, config:"[Ne] 3s² 3p³" },
  { symbol:"S", name:"Sulfur", number:16, mass:32.06, group:"VIA", period:3, category:"nonmetal", electronegativity:2.58, config:"[Ne] 3s² 3p⁴" },
  { symbol:"Cl", name:"Chlorine", number:17, mass:35.45, group:"VIIA", period:3, category:"halogen", electronegativity:3.16, config:"[Ne] 3s² 3p⁵" },
  { symbol:"Ar", name:"Argon", number:18, mass:39.95, group:"VIIIA", period:3, category:"noble gas", electronegativity:null, config:"[Ne] 3s² 3p⁶" },
  { symbol:"K", name:"Potassium", number:19, mass:39.098, group:"IA", period:4, category:"alkali metal", electronegativity:0.82, config:"[Ar] 4s¹" },
  { symbol:"Ca", name:"Calcium", number:20, mass:40.078, group:"IIA", period:4, category:"alkaline earth", electronegativity:1.00, config:"[Ar] 4s²" },
  { symbol:"Sc", name:"Scandium", number:21, mass:44.956, group:"IIIB", period:4, category:"transition", electronegativity:1.36, config:"[Ar] 3d¹ 4s²" },
  { symbol:"Ti", name:"Titanium", number:22, mass:47.867, group:"IVB", period:4, category:"transition", electronegativity:1.54, config:"[Ar] 3d² 4s²" },
  { symbol:"V", name:"Vanadium", number:23, mass:50.942, group:"VB", period:4, category:"transition", electronegativity:1.63, config:"[Ar] 3d³ 4s²" },
  { symbol:"Cr", name:"Chromium", number:24, mass:51.996, group:"VIB", period:4, category:"transition", electronegativity:1.66, config:"[Ar] 3d⁵ 4s¹" },
  { symbol:"Mn", name:"Manganese", number:25, mass:54.938, group:"VIIB", period:4, category:"transition", electronegativity:1.55, config:"[Ar] 3d⁵ 4s²" },
  { symbol:"Fe", name:"Iron", number:26, mass:55.845, group:"VIIIB", period:4, category:"transition", electronegativity:1.83, config:"[Ar] 3d⁶ 4s²" },
  { symbol:"Co", name:"Cobalt", number:27, mass:58.933, group:"VIIIB", period:4, category:"transition", electronegativity:1.88, config:"[Ar] 3d⁷ 4s²" },
  { symbol:"Ni", name:"Nickel", number:28, mass:58.693, group:"VIIIB", period:4, category:"transition", electronegativity:1.91, config:"[Ar] 3d⁸ 4s²" },
  { symbol:"Cu", name:"Copper", number:29, mass:63.546, group:"IB", period:4, category:"transition", electronegativity:1.90, config:"[Ar] 3d¹⁰ 4s¹" },
  { symbol:"Zn", name:"Zinc", number:30, mass:65.38, group:"IIB", period:4, category:"transition", electronegativity:1.65, config:"[Ar] 3d¹⁰ 4s²" },
  { symbol:"Ga", name:"Gallium", number:31, mass:69.723, group:"IIIA", period:4, category:"post-transition", electronegativity:1.81, config:"[Ar] 3d¹⁰ 4s² 4p¹" },
  { symbol:"Ge", name:"Germanium", number:32, mass:72.630, group:"IVA", period:4, category:"metalloid", electronegativity:2.01, config:"[Ar] 3d¹⁰ 4s² 4p²" },
  { symbol:"As", name:"Arsenic", number:33, mass:74.922, group:"VA", period:4, category:"metalloid", electronegativity:2.18, config:"[Ar] 3d¹⁰ 4s² 4p³" },
  { symbol:"Se", name:"Selenium", number:34, mass:78.971, group:"VIA", period:4, category:"nonmetal", electronegativity:2.55, config:"[Ar] 3d¹⁰ 4s² 4p⁴" },
  { symbol:"Br", name:"Bromine", number:35, mass:79.904, group:"VIIA", period:4, category:"halogen", electronegativity:2.96, config:"[Ar] 3d¹⁰ 4s² 4p⁵" },
  { symbol:"Kr", name:"Krypton", number:36, mass:83.798, group:"VIIIA", period:4, category:"noble gas", electronegativity:3.00, config:"[Ar] 3d¹⁰ 4s² 4p⁶" },
  { symbol:"Rb", name:"Rubidium", number:37, mass:85.468, group:"IA", period:5, category:"alkali metal", electronegativity:0.82, config:"[Kr] 5s¹" },
  { symbol:"Sr", name:"Strontium", number:38, mass:87.62, group:"IIA", period:5, category:"alkaline earth", electronegativity:0.95, config:"[Kr] 5s²" },
  { symbol:"Y", name:"Yttrium", number:39, mass:88.906, group:"IIIB", period:5, category:"transition", electronegativity:1.22, config:"[Kr] 4d¹ 5s²" },
  { symbol:"Zr", name:"Zirconium", number:40, mass:91.224, group:"IVB", period:5, category:"transition", electronegativity:1.33, config:"[Kr] 4d² 5s²" },
  { symbol:"Nb", name:"Niobium", number:41, mass:92.906, group:"VB", period:5, category:"transition", electronegativity:1.6, config:"[Kr] 4d⁴ 5s¹" },
  { symbol:"Mo", name:"Molybdenum", number:42, mass:95.95, group:"VIB", period:5, category:"transition", electronegativity:2.16, config:"[Kr] 4d⁵ 5s¹" },
  { symbol:"Tc", name:"Technetium", number:43, mass:98, group:"VIIB", period:5, category:"transition", electronegativity:1.9, config:"[Kr] 4d⁵ 5s²" },
  { symbol:"Ru", name:"Ruthenium", number:44, mass:101.07, group:"VIIIB", period:5, category:"transition", electronegativity:2.2, config:"[Kr] 4d⁷ 5s¹" },
  { symbol:"Rh", name:"Rhodium", number:45, mass:102.91, group:"VIIIB", period:5, category:"transition", electronegativity:2.28, config:"[Kr] 4d⁸ 5s¹" },
  { symbol:"Pd", name:"Palladium", number:46, mass:106.42, group:"VIIIB", period:5, category:"transition", electronegativity:2.20, config:"[Kr] 4d¹⁰" },
  { symbol:"Ag", name:"Silver", number:47, mass:107.87, group:"IB", period:5, category:"transition", electronegativity:1.93, config:"[Kr] 4d¹⁰ 5s¹" },
  { symbol:"Cd", name:"Cadmium", number:48, mass:112.41, group:"IIB", period:5, category:"transition", electronegativity:1.69, config:"[Kr] 4d¹⁰ 5s²" },
  { symbol:"In", name:"Indium", number:49, mass:114.82, group:"IIIA", period:5, category:"post-transition", electronegativity:1.78, config:"[Kr] 4d¹⁰ 5s² 5p¹" },
  { symbol:"Sn", name:"Tin", number:50, mass:118.71, group:"IVA", period:5, category:"post-transition", electronegativity:1.96, config:"[Kr] 4d¹⁰ 5s² 5p²" },
  { symbol:"Sb", name:"Antimony", number:51, mass:121.76, group:"VA", period:5, category:"metalloid", electronegativity:2.05, config:"[Kr] 4d¹⁰ 5s² 5p³" },
  { symbol:"Te", name:"Tellurium", number:52, mass:127.6, group:"VIA", period:5, category:"metalloid", electronegativity:2.1, config:"[Kr] 4d¹⁰ 5s² 5p⁴" },
  { symbol:"I", name:"Iodine", number:53, mass:126.90, group:"VIIA", period:5, category:"halogen", electronegativity:2.66, config:"[Kr] 4d¹⁰ 5s² 5p⁵" },
  { symbol:"Xe", name:"Xenon", number:54, mass:131.29, group:"VIIIA", period:5, category:"noble gas", electronegativity:2.6, config:"[Kr] 4d¹⁰ 5s² 5p⁶" },
  { symbol:"Cs", name:"Cesium", number:55, mass:132.91, group:"IA", period:6, category:"alkali metal", electronegativity:0.79, config:"[Xe] 6s¹" },
  { symbol:"Ba", name:"Barium", number:56, mass:137.33, group:"IIA", period:6, category:"alkaline earth", electronegativity:0.89, config:"[Xe] 6s²" },
  { symbol:"La", name:"Lanthanum", number:57, mass:138.91, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.1, config:"[Xe] 5d¹ 6s²" },
  { symbol:"Ce", name:"Cerium", number:58, mass:140.12, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.12, config:"[Xe] 4f¹ 5d¹ 6s²" },
  { symbol:"Pr", name:"Praseodymium", number:59, mass:140.91, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.13, config:"[Xe] 4f³ 6s²" },
  { symbol:"Nd", name:"Neodymium", number:60, mass:144.24, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.14, config:"[Xe] 4f⁴ 6s²" },
  { symbol:"Pm", name:"Promethium", number:61, mass:145, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.13, config:"[Xe] 4f⁵ 6s²" },
  { symbol:"Sm", name:"Samarium", number:62, mass:150.36, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.17, config:"[Xe] 4f⁶ 6s²" },
  { symbol:"Eu", name:"Europium", number:63, mass:151.96, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.2, config:"[Xe] 4f⁷ 6s²" },
  { symbol:"Gd", name:"Gadolinium", number:64, mass:157.25, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.2, config:"[Xe] 4f⁷ 5d¹ 6s²" },
  { symbol:"Tb", name:"Terbium", number:65, mass:158.93, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.2, config:"[Xe] 4f⁹ 6s²" },
  { symbol:"Dy", name:"Dysprosium", number:66, mass:162.5, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.22, config:"[Xe] 4f¹⁰ 6s²" },
  { symbol:"Ho", name:"Holmium", number:67, mass:164.93, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.23, config:"[Xe] 4f¹¹ 6s²" },
  { symbol:"Er", name:"Erbium", number:68, mass:167.26, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.24, config:"[Xe] 4f¹² 6s²" },
  { symbol:"Tm", name:"Thulium", number:69, mass:168.93, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.25, config:"[Xe] 4f¹³ 6s²" },
  { symbol:"Yb", name:"Ytterbium", number:70, mass:173.05, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.1, config:"[Xe] 4f¹⁴ 6s²" },
  { symbol:"Lu", name:"Lutetium", number:71, mass:174.97, group:"Lanthan", period:6, category:"lanthanide", electronegativity:1.27, config:"[Xe] 4f¹⁴ 5d¹ 6s²" },
  { symbol:"Hf", name:"Hafnium", number:72, mass:178.49, group:"IVB", period:6, category:"transition", electronegativity:1.3, config:"[Xe] 4f¹⁴ 5d² 6s²" },
  { symbol:"Ta", name:"Tantalum", number:73, mass:180.95, group:"VB", period:6, category:"transition", electronegativity:1.5, config:"[Xe] 4f¹⁴ 5d³ 6s²" },
  { symbol:"W", name:"Tungsten", number:74, mass:183.84, group:"VIB", period:6, category:"transition", electronegativity:2.36, config:"[Xe] 4f¹⁴ 5d⁴ 6s²" },
  { symbol:"Re", name:"Rhenium", number:75, mass:186.21, group:"VIIB", period:6, category:"transition", electronegativity:1.9, config:"[Xe] 4f¹⁴ 5d⁵ 6s²" },
  { symbol:"Os", name:"Osmium", number:76, mass:190.23, group:"VIIIB", period:6, category:"transition", electronegativity:2.2, config:"[Xe] 4f¹⁴ 5d⁶ 6s²" },
  { symbol:"Ir", name:"Iridium", number:77, mass:192.22, group:"VIIIB", period:6, category:"transition", electronegativity:2.2, config:"[Xe] 4f¹⁴ 5d⁷ 6s²" },
  { symbol:"Pt", name:"Platinum", number:78, mass:195.08, group:"VIIIB", period:6, category:"transition", electronegativity:2.28, config:"[Xe] 4f¹⁴ 5d⁹ 6s¹" },
  { symbol:"Au", name:"Gold", number:79, mass:196.97, group:"IB", period:6, category:"transition", electronegativity:2.54, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s¹" },
  { symbol:"Hg", name:"Mercury", number:80, mass:200.59, group:"IIB", period:6, category:"transition", electronegativity:2.00, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s²" },
  { symbol:"Tl", name:"Thallium", number:81, mass:204.38, group:"IIIA", period:6, category:"post-transition", electronegativity:1.62, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹" },
  { symbol:"Pb", name:"Lead", number:82, mass:207.2, group:"IVA", period:6, category:"post-transition", electronegativity:2.33, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²" },
  { symbol:"Bi", name:"Bismuth", number:83, mass:208.98, group:"VA", period:6, category:"post-transition", electronegativity:2.02, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³" },
  { symbol:"Po", name:"Polonium", number:84, mass:209, group:"VIA", period:6, category:"post-transition", electronegativity:2.0, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴" },
  { symbol:"At", name:"Astatine", number:85, mass:210, group:"VIIA", period:6, category:"halogen", electronegativity:2.2, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵" },
  { symbol:"Rn", name:"Radon", number:86, mass:222, group:"VIIIA", period:6, category:"noble gas", electronegativity:null, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶" }
];

function getElementColor(category) {
  switch(category) {
    case 'alkali metal': return '#e74c3c';
    case 'alkaline earth': return '#f39c12';
    case 'transition': return '#2ecc71';
    case 'post-transition': return '#1abc9c';
    case 'metalloid': return '#9b59b6';
    case 'nonmetal': return '#3498db';
    case 'halogen': return '#e67e22';
    case 'noble gas': return '#1f618d';
    case 'lanthanide': return '#95a5a6';
    default: return '#95a5a6';
  }
}

function renderPeriodicTable() {
  const container = document.getElementById('periodic-table-container');
  if (!container) return;
  let html = '<div style="display: grid; grid-template-columns: repeat(18, minmax(55px, 1fr)); gap: 4px; font-family: monospace;">';
  for (let i = 1; i <= 86; i++) {
    const elem = elementsData.find(e => e.number === i);
    if (elem) {
      const color = getElementColor(elem.category);
      html += `<div class="periodic-cell" data-symbol="${elem.symbol}" style="background: ${color}; color: white; border-radius: 6px; padding: 8px 4px; text-align: center; cursor: pointer; transition: 0.1s; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3);">
                  <div style="font-size: 10px;">${elem.number}</div>
                  <div style="font-size: 14px;">${elem.symbol}</div>
                </div>`;
    } else {
      html += `<div style="background: rgba(255,255,255,0.05); border-radius: 6px; padding: 8px 4px; text-align: center;"></div>`;
    }
  }
  html += '</div>';
  container.innerHTML = html;
  
  document.querySelectorAll('.periodic-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      const symbol = cell.dataset.symbol;
      const element = elementsData.find(e => e.symbol === symbol);
      if (element) {
        document.getElementById('element-detail').style.display = 'block';
        document.getElementById('element-name').innerHTML = `${element.name} (${element.symbol})`;
        document.getElementById('element-info').innerHTML = `
          <strong>Số hiệu:</strong> ${element.number}<br>
          <strong>Khối lượng:</strong> ${element.mass} u<br>
          <strong>Nhóm:</strong> ${element.group}, Chu kỳ: ${element.period}<br>
          <strong>Độ âm điện:</strong> ${element.electronegativity || '—'}<br>
          <strong>Cấu hình e:</strong> ${element.config}<br>
          <strong>Phân loại:</strong> ${element.category}
        `;
      }
    });
  });
}

function resetPeriodicHighlight() {
  document.getElementById('element-detail').style.display = 'none';
}

/* ==================== DNA ==================== */
const DNA_PAIRS = { A:'T', T:'A', G:'C', C:'G' };
const BASE_COLORS = { A:'#e74c3c', T:'#3498db', G:'#2ecc71', C:'#f39c12' };
const STRAND_LENGTH = 10;
let strand1 = [];
let strand2 = [];

let draggedBase = null;
function dragBase(e, base) { draggedBase = base; e.dataTransfer.setData('text/plain', base); }

function initDNA() {
  const bases = ['A','T','G','C'];
  strand1 = Array.from({length: STRAND_LENGTH}, () => bases[Math.floor(Math.random()*4)]);
  strand2 = Array(STRAND_LENGTH).fill(null);
  renderDNA();
}

function renderDNA() {
  const container = document.getElementById('dna-strands'); if (!container) return;
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.className = 'dna-strand-container';

  const row1 = document.createElement('div');
  row1.className = 'dna-strand-row';
  const label1 = document.createElement('div');
  label1.className = 'dna-strand-label';
  label1.textContent = "Mạch khuôn:";
  row1.appendChild(label1);
  strand1.forEach((base, i) => {
    const slot = document.createElement('div');
    slot.className = 'dna-base-slot filled base-' + base;
    slot.style.background = BASE_COLORS[base];
    slot.style.borderColor = BASE_COLORS[base];
    slot.textContent = base;
    row1.appendChild(slot);
  });
  wrapper.appendChild(row1);

  const bondsRow = document.createElement('div');
  bondsRow.className = 'dna-bonds-row';
  strand1.forEach((base, i) => {
    const bond = document.createElement('div');
    bond.className = 'dna-bond' + (strand2[i] === DNA_PAIRS[base] ? ' active' : '');
    bond.textContent = strand2[i] === DNA_PAIRS[base] ? (base==='A'||base==='T' ? '||' : '|||') : '·';
    bondsRow.appendChild(bond);
  });
  wrapper.appendChild(bondsRow);

  const row2 = document.createElement('div');
  row2.className = 'dna-strand-row';
  const label2 = document.createElement('div');
  label2.className = 'dna-strand-label';
  label2.textContent = "Mạch bổ sung:";
  row2.appendChild(label2);
  strand1.forEach((base, i) => {
    const slot = document.createElement('div');
    const userBase = strand2[i];
    if (userBase) {
      slot.className = 'dna-base-slot filled base-' + userBase;
      slot.style.background = BASE_COLORS[userBase];
      slot.style.borderColor = BASE_COLORS[userBase];
      slot.textContent = userBase;
    } else {
      slot.className = 'dna-base-slot';
      slot.textContent = '?';
    }
    slot.ondragover = e => e.preventDefault();
    slot.ondrop = e => { e.preventDefault(); const b = e.dataTransfer.getData('text/plain'); strand2[i] = b; renderDNA(); };
    slot.onclick = () => showBaseChooser(i);
    row2.appendChild(slot);
  });
  wrapper.appendChild(row2);
  container.appendChild(wrapper);
}

function showBaseChooser(idx) {
  const bases = ['A','T','G','C'];
  const chosen = prompt(`Chọn base cho vị trí ${idx+1} (cặp với ${strand1[idx]}):\nNhập: A, T, G hoặc C`);
  if (chosen && bases.includes(chosen.toUpperCase())) {
    strand2[idx] = chosen.toUpperCase();
    renderDNA();
  }
}

function checkDNA() {
  const score = strand2.reduce((acc, base, i) => acc + (base === DNA_PAIRS[strand1[i]] ? 1 : 0), 0);
  const total = strand1.length;
  const filled = strand2.filter(b => b !== null).length;
  const scoreDiv = document.getElementById('dna-score');
  if (filled < total) {
    scoreDiv.style.color = '#e74c3c';
    scoreDiv.textContent = `⚠ Chưa điền đủ! Đã điền ${filled}/${total} ô.`;
    return;
  }
  if (score === total) {
    scoreDiv.style.color = '#27ae60';
    scoreDiv.textContent = `🎉 Hoàn hảo! ${score}/${total} cặp base đúng! DNA được lắp ráp thành công!`;
  } else {
    scoreDiv.style.color = '#e74c3c';
    scoreDiv.textContent = `❌ ${score}/${total} đúng. Kiểm tra lại: A↔T, G↔C`;
    const slots = document.querySelectorAll('#dna-strands .dna-strand-row:last-child .dna-base-slot');
    slots.forEach((sl, i) => {
      sl.classList.remove('correct','wrong');
      if (strand2[i]) sl.classList.add(strand2[i] === DNA_PAIRS[strand1[i]] ? 'correct' : 'wrong');
    });
  }
}

function resetDNA() { initDNA(); document.getElementById('dna-score').textContent = ''; }

// ==================== TẾ BÀO THỰC VẬT ====================
let cellCanvas = null, cellCtx = null;
let selectedOrganelle = null;
const organelleRegions = {
  wall: { x: 40, y: 30, w: 620, h: 340, name: "Thành tế bào", desc: "Cấu tạo từ cellulose, lignin, giúp tế bào có hình dạng cố định và bảo vệ." },
  membrane: { x: 60, y: 50, w: 580, h: 300, name: "Màng sinh chất", desc: "Lớp màng phospholipid kép, kiểm soát xuất nhập chất, trao đổi thông tin." },
  nucleus: { x: 280, y: 130, w: 80, h: 70, name: "Nhân tế bào", desc: "Chứa DNA, điều khiển mọi hoạt động sống, có màng nhân và nhân con." },
  vacuole: { x: 120, y: 220, w: 150, h: 120, name: "Không bào", desc: "Chứa nước, ion, chất dự trữ; tạo áp suất thẩm thấu giữ tế bào căng mọng." },
  chloroplast: { x: 450, y: 180, w: 60, h: 50, name: "Lục lạp", desc: "Bào quan quang hợp, chứa diệp lục, biến đổi năng lượng ánh sáng thành hóa năng." },
  mitochondria: { x: 520, y: 280, w: 50, h: 40, name: "Ty thể", desc: "Trung tâm hô hấp tế bào, sản sinh ATP (năng lượng)." },
  golgi: { x: 380, y: 300, w: 70, h: 45, name: "Bộ máy Golgi", desc: "Đóng gói, biến đổi và vận chuyển protein, lipid." },
  er: { x: 200, y: 100, w: 120, h: 40, name: "Lưới nội chất", desc: "Tổng hợp protein (hạt) và lipid (trơn), vận chuyển nội bào." },
  ribosome: { x: 320, y: 200, w: 30, h: 20, name: "Ribosome", desc: "Tổng hợp protein từ mRNA, có thể tự do hoặc gắn trên lưới nội chất." }
};

function drawPlantCell(hoverKey = null) {
  const canvas = document.getElementById('cell-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  // Nền tế bào
  ctx.fillStyle = '#dcedc8'; // màu tế bào
  ctx.fillRect(20, 10, W-40, H-20);
  // Vẽ thành tế bào (đậm)
  ctx.strokeStyle = '#8d6e63';
  ctx.lineWidth = 4;
  ctx.strokeRect(25, 15, W-50, H-30);
  // Màng sinh chất
  ctx.strokeStyle = '#5d4037';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 20, W-60, H-40);
  
  // Không bào lớn
  ctx.fillStyle = '#c5e1a5';
  ctx.fillRect(organelleRegions.vacuole.x, organelleRegions.vacuole.y, organelleRegions.vacuole.w, organelleRegions.vacuole.h);
  ctx.strokeStyle = '#33691e';
  ctx.strokeRect(organelleRegions.vacuole.x, organelleRegions.vacuole.y, organelleRegions.vacuole.w, organelleRegions.vacuole.h);
  
  // Nhân
  ctx.fillStyle = '#ffcc80';
  ctx.beginPath(); ctx.ellipse(organelleRegions.nucleus.x+40, organelleRegions.nucleus.y+35, 40, 35, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#e65100';
  ctx.beginPath(); ctx.arc(organelleRegions.nucleus.x+40, organelleRegions.nucleus.y+35, 12, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(organelleRegions.nucleus.x+35, organelleRegions.nucleus.y+30, 3, 0, Math.PI*2); ctx.fill();
  
  // Lục lạp
  ctx.fillStyle = '#81c784';
  ctx.beginPath(); ctx.ellipse(organelleRegions.chloroplast.x+30, organelleRegions.chloroplast.y+25, 30, 25, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#2e7d32';
  for(let i=0;i<6;i++) ctx.fillRect(organelleRegions.chloroplast.x+10+i*8, organelleRegions.chloroplast.y+20, 3, 10);
  
  // Ty thể
  ctx.fillStyle = '#ef9a9a';
  ctx.beginPath(); ctx.ellipse(organelleRegions.mitochondria.x+25, organelleRegions.mitochondria.y+20, 25, 20, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(organelleRegions.mitochondria.x+10, organelleRegions.mitochondria.y+20);
  ctx.lineTo(organelleRegions.mitochondria.x+40, organelleRegions.mitochondria.y+20); ctx.stroke();
  
  // Golgi
  ctx.fillStyle = '#f48fb1';
  for(let i=0;i<3;i++) ctx.fillRect(organelleRegions.golgi.x+i*20, organelleRegions.golgi.y+i*8, 30, 8);
  
  // Lưới nội chất
  ctx.strokeStyle = '#b39ddb';
  ctx.lineWidth = 3;
  for(let i=0;i<4;i++) {
    ctx.beginPath(); ctx.moveTo(organelleRegions.er.x+i*30, organelleRegions.er.y+5); 
    ctx.lineTo(organelleRegions.er.x+i*30+60, organelleRegions.er.y+20*i); ctx.stroke();
  }
  // Ribosome (chấm nhỏ)
  ctx.fillStyle = '#ba68c8';
  for(let i=0;i<12;i++) {
    ctx.beginPath(); ctx.arc(organelleRegions.ribosome.x + i*12, organelleRegions.ribosome.y + (i%3)*6, 3, 0, Math.PI*2); ctx.fill();
  }
  
  // Nếu có hover, vẽ viền sáng
  if(hoverKey && organelleRegions[hoverKey]) {
    const r = organelleRegions[hoverKey];
    ctx.save();
    ctx.shadowBlur = 12; ctx.shadowColor = '#ffd54f';
    ctx.strokeStyle = '#ffb300'; ctx.lineWidth = 3;
    ctx.strokeRect(r.x-2, r.y-2, r.w+4, r.h+4);
    ctx.restore();
  }
}

let hoverOrganelle = null;
function setupCellEvents() {
  const canvas = document.getElementById('cell-canvas');
  if(!canvas) return;

  // Xử lý khi di chuột (làm sáng viền bào quan)
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;
    let found = null;
    let foundArea = Infinity;
    
    for(let [key, region] of Object.entries(organelleRegions)) {
      if(mouseX >= region.x && mouseX <= region.x+region.w && mouseY >= region.y && mouseY <= region.y+region.h) {
        const area = region.w * region.h;
        if(area < foundArea) { found = key; foundArea = area; }
      }
    }
    
    if(found !== hoverOrganelle) {
      hoverOrganelle = found;
      // Chỉ vẽ lại viền hover nếu chưa click cố định bào quan nào, 
      // hoặc đang hover vào bào quan khác với bào quan đã chọn
      drawPlantCell(hoverOrganelle || selectedOrganelle);
    }
  });

  // XỬ LÝ KHI CLICK CHUỘT TRỰC TIẾP LÊN HÌNH
  canvas.addEventListener('click', (e) => {
    selectedOrganelle = hoverOrganelle; // Có thể là null nếu click ra ngoài
    showOrganelleInfo(selectedOrganelle);
  });
}
function showOrganelleInfo(key) {
  // 1. Tắt sáng (xóa class active) ở tất cả các nút
  document.querySelectorAll('.cell-chip').forEach(btn => btn.classList.remove('active'));

  // 2. Nếu click ra ngoài (key = null) thì ẩn thông tin
  if(!key || !organelleRegions[key]) {
    selectedOrganelle = null;
    document.getElementById('organelle-name').innerHTML = '–––';
    document.getElementById('organelle-desc').innerHTML = '';
    document.getElementById('organelle-info-panel').style.display = 'none'; 
    drawPlantCell(null); // Vẽ lại tế bào không có viền sáng
    return;
  }
  
  // 3. Nếu click đúng bào quan, hiển thị thông tin
  selectedOrganelle = key;
  const org = organelleRegions[key];
  document.getElementById('organelle-name').innerHTML = org.name;
  document.getElementById('organelle-desc').innerHTML = org.desc;
  document.getElementById('organelle-info-panel').style.display = 'flex';

  // 4. BẬT SÁNG NÚT BẤM TƯƠNG ỨNG
  const activeBtn = document.querySelector(`.cell-chip[onclick="showOrganelleInfo('${key}')"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Vẽ lại hình tế bào với viền sáng ở bào quan được chọn
  drawPlantCell(key);
}
function highlightOrganelle(key) {
  if(key && organelleRegions[key]) showOrganelleInfo(key);
  else { selectedOrganelle = null; drawPlantCell(null); document.getElementById('organelle-name').innerHTML = '–––'; document.getElementById('organelle-desc').innerHTML = ''; document.getElementById('organelle-select').value = ''; }
}

function resetCellView() {
  highlightOrganelle(null);
}

// Gọi khởi tạo khi load page cell
// Thêm vào trong window load hoặc trong hàm showPage

// ========== GIAO THOA YOUNG ==========
function wavelengthToRGB(nm) {
  let r=0,g=0,b=0;
  if(nm>=380&&nm<440){r=(440-nm)/60;g=0;b=1;}
  else if(nm<490){r=0;g=(nm-440)/50;b=1;}
  else if(nm<510){r=0;g=1;b=(510-nm)/20;}
  else if(nm<580){r=(nm-510)/70;g=1;b=0;}
  else if(nm<645){r=1;g=(645-nm)/65;b=0;}
  else if(nm<=780){r=1;g=0;b=0;}
  const factor=nm<420?(0.3+0.7*(nm-380)/40):nm>700?(0.3+0.7*(780-nm)/80):1;
  return {r:Math.round(r*factor*255),g:Math.round(g*factor*255),b:Math.round(b*factor*255)};
}

function runYoung() {
  const canvas = document.getElementById('young-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#030712'; ctx.fillRect(0,0,W,H);
  
  let lambda_nm = parseFloat(document.getElementById('lambda').value);
  let a_mm = parseFloat(document.getElementById('a-slit').value);
  let D_m = parseFloat(document.getElementById('D-screen').value);
  if(isNaN(lambda_nm)) lambda_nm = 600;
  if(isNaN(a_mm)) a_mm = 0.5;
  if(isNaN(D_m)) D_m = 1.5;
  
  const lambda_m = lambda_nm * 1e-9;
  const a_m = a_mm * 1e-3;
  const i_m = (lambda_m * D_m) / a_m; // khoảng vân (m)
  const i_mm = i_m * 1000;
  document.getElementById('i-val').innerHTML = i_mm.toFixed(3) + '<span class="dc-unit">mm</span>';
  
  const centerX = W/2;
  // Scale cố định (px/mm) — KHÔNG chia cho i_mm nữa,
  // để khi i_mm tăng (λ tăng) thì khoảng cách vân thực sự giãn ra.
  let scale = 45; // px per mm
  const spacing = i_mm * scale;
  if (spacing < 14) scale = 14 / i_mm;       // tránh vân sát quá
  if (spacing > (W/2 - 20)) scale = (W/2 - 20) / i_mm; // giữ ít nhất 1 vân mỗi bên

  // Vẽ nền gradient cường độ giao thoa
  for(let px = 0; px < W; px++) {
    const xMm = (px - centerX) / scale;
    const intensity = Math.cos(Math.PI * xMm / i_mm) ** 2;
    const wavelengthColor = wavelengthToRGB(lambda_nm);
    ctx.fillStyle = `rgba(${wavelengthColor.r},${wavelengthColor.g},${wavelengthColor.b},${intensity * 0.55})`;
    ctx.fillRect(px, 55, 1, H - 110);
  }

  ctx.strokeStyle = '#ffe082';
  ctx.lineWidth = 1;
  ctx.textAlign = 'center';
  for(let k = -6; k <= 6; k++) {
    let x = centerX + k * i_mm * scale;
    if(x < 0 || x > W) continue;
    
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, H - 40); // Rút ngắn đường kẻ lại để chừa không gian cho chữ
    ctx.stroke();
    
    ctx.fillStyle = k === 0 ? '#ffd54f' : '#7cb9ff';
    
    // Đặt chữ so le 3 mức chiều cao để không bị đè lên nhau
    let level = Math.abs(k) % 3; 
    let textY = H - 4 - (level * 12);
    
    // Đặt tên vân ngắn gọn lại để dễ nhìn hơn
    let text = k === 0 ? 'Sáng TT' : (k % 2 === 0 ? `Sáng ${Math.abs(k/2)}` : `Tối ${Math.ceil(Math.abs(k)/2)}`);
    ctx.fillText(text, x, textY);
  }
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.fillText(`λ = ${lambda_nm} nm, a = ${a_mm} mm, D = ${D_m} m → i = ${i_mm.toFixed(3)} mm`, 20, 40);
}

function resetYoung() {
  document.getElementById('lambda').value = 600;
  document.getElementById('a-slit').value = 0.5;
  document.getElementById('D-screen').value = 1.5;
  runYoung();
}

// ========== NĂNG LƯỢNG: RƠI TỰ DO + XE TRÊN DỐC ==========
let energyAnim = null, energyTime = 0, energyRunning = false;
const g = 9.81;

function drawEnergy(progress) {
  // progress: 0 (trên cao) → 1 (chạm đất/chân dốc)
  const canvas = document.getElementById('energy-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const m = parseFloat(document.getElementById('m-energy').value) || 2;
  const h0 = parseFloat(document.getElementById('h-energy').value) || 20;
  const mode = document.getElementById('energy-mode').value;

  const W_total = m * g * h0;
  const h_cur = h0 * (1 - progress); // chiều cao hiện tại
  const Wt = m * g * h_cur;
  const Wd = W_total - Wt;
  const v_cur = Math.sqrt(2 * g * (h0 - h_cur));

  document.getElementById('ke-val').innerHTML = Wd.toFixed(2);
  document.getElementById('pe-val').innerHTML = Wt.toFixed(2);
  document.getElementById('me-val').innerHTML = W_total.toFixed(2);
  document.getElementById('v-val').innerHTML = v_cur.toFixed(2);

  ctx.clearRect(0, 0, W, H);
  // Nền trời
  const sky = ctx.createLinearGradient(0,0,0,H*0.75);
  sky.addColorStop(0,'#0d1b2a'); sky.addColorStop(1,'#1a3a5c');
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

  if (mode === 'fall') {
    // === VẬT RƠI TỰ DO ===
    const groundY = H - 40;
    const topY = 30;
    const pillarX = W * 0.25;
    const availH = groundY - topY - 20;

    // Mặt đất
    ctx.fillStyle = '#2e7d32'; ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#388e3c'; ctx.fillRect(0, groundY, W, 5);

    // Trụ cao độ
    ctx.fillStyle = '#37474f';
    ctx.fillRect(pillarX - 4, topY, 8, groundY - topY);
    // Vạch chia chiều cao
    for(let i = 0; i <= 5; i++) {
      const yy = topY + (availH / 5) * i;
      ctx.strokeStyle = '#546e7a'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pillarX - 14, yy); ctx.lineTo(pillarX + 14, yy); ctx.stroke();
      const hLabel = (h0 * (5 - i) / 5).toFixed(0);
      ctx.fillStyle = '#90a4ae'; ctx.font = '10px Space Mono,monospace'; ctx.textAlign = 'right';
      ctx.fillText(hLabel + 'm', pillarX - 18, yy + 4);
    }

    // Vị trí vật hiện tại
    const objY = topY + availH * progress;
    const ballR = 18;

    // Vẽ vệt rơi (trail)
    for(let i = 1; i <= 6; i++) {
      const pastP = Math.max(0, progress - i * 0.04);
      const pastY = topY + availH * pastP;
      ctx.fillStyle = `rgba(255,193,7,${0.12 - i*0.015})`;
      ctx.beginPath(); ctx.arc(pillarX + 50, pastY, ballR * (1 - i*0.1), 0, Math.PI*2); ctx.fill();
    }

    // Vật (hình cầu)
    const ballGrad = ctx.createRadialGradient(pillarX+50-4, objY-4, 2, pillarX+50, objY, ballR);
    ballGrad.addColorStop(0,'#ffe082'); ballGrad.addColorStop(1,'#e65100');
    ctx.fillStyle = ballGrad; ctx.shadowBlur = 16; ctx.shadowColor = '#ffa000';
    ctx.beginPath(); ctx.arc(pillarX+50, objY, ballR, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${m}kg`, pillarX+50, objY+4);

    // Mũi tên vận tốc
    if(v_cur > 0.5) {
      const arrLen = Math.min(50, v_cur * 4);
      ctx.strokeStyle = '#80ff80'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(pillarX+50+ballR, objY); ctx.lineTo(pillarX+50+ballR, objY+arrLen); ctx.stroke();
      ctx.fillStyle = '#80ff80';
      ctx.beginPath(); ctx.moveTo(pillarX+50+ballR, objY+arrLen+8); ctx.lineTo(pillarX+50+ballR-5, objY+arrLen); ctx.lineTo(pillarX+50+ballR+5, objY+arrLen); ctx.closePath(); ctx.fill();
      ctx.font = '9px monospace'; ctx.textAlign = 'left';
      ctx.fillText(`v=${v_cur.toFixed(1)}m/s`, pillarX+50+ballR+6, objY+arrLen/2+4);
    }

    // Nhãn h hiện tại
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 1.5; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(pillarX+30, objY); ctx.lineTo(pillarX+110, objY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pillarX+110, groundY); ctx.lineTo(pillarX+110, objY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd54f'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText(`h = ${h_cur.toFixed(1)}m`, pillarX+114, (objY+groundY)/2);

  } else {
    // === XE TRÊN DỐC ===
    const groundY = H - 35;
    const slopeStartX = 50;
    const slopeEndX = W - 80;
    const slopeTopY = 30;
    const slopeBotY = groundY;

    // Vẽ dốc
    ctx.beginPath();
    ctx.moveTo(slopeStartX, slopeTopY);
    ctx.lineTo(slopeEndX, slopeBotY);
    ctx.lineTo(slopeEndX, slopeBotY);
    ctx.lineTo(slopeStartX, slopeBotY);
    ctx.closePath();
    const slopeGrad = ctx.createLinearGradient(slopeStartX, slopeTopY, slopeEndX, slopeBotY);
    slopeGrad.addColorStop(0,'#4a7a5a'); slopeGrad.addColorStop(1,'#2e7d32');
    ctx.fillStyle = slopeGrad; ctx.fill();
    ctx.strokeStyle = '#a5d6a7'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(slopeStartX, slopeTopY); ctx.lineTo(slopeEndX, slopeBotY); ctx.stroke();

    // Mặt đất phẳng
    ctx.fillStyle = '#37474f'; ctx.fillRect(slopeEndX, groundY, W-slopeEndX, H-groundY);
    ctx.fillStyle = '#546e7a'; ctx.fillRect(slopeEndX, groundY, W-slopeEndX, 4);

    // Vạch vùng
    ctx.fillStyle = '#1b5e20'; ctx.fillRect(0, groundY, slopeStartX+2, H-groundY);

    // Góc nghiêng
    const slope_dx = slopeEndX - slopeStartX;
    const slope_dy = slopeBotY - slopeTopY;
    const slopeAngle = Math.atan2(slope_dy, slope_dx);

    // Vị trí xe trên dốc
    const cx = slopeStartX + slope_dx * progress;
    const cy = slopeTopY + slope_dy * progress;

    // Vệt bánh xe
    for(let i = 1; i <= 4; i++) {
      const pp = Math.max(0, progress - i*0.06);
      const tx = slopeStartX + slope_dx * pp;
      const ty = slopeTopY + slope_dy * pp;
      ctx.fillStyle = `rgba(255,214,0,${0.12 - i*0.025})`;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(slopeAngle);
      ctx.fillRect(-25, -10, 50, 14); ctx.restore();
    }

    // Xe (chữ nhật trên dốc)
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(slopeAngle);
    // Thân xe
    const carW = 52, carH = 22;
    const carGrad = ctx.createLinearGradient(-carW/2, -carH-14, carW/2, 0);
    carGrad.addColorStop(0,'#1565c0'); carGrad.addColorStop(1,'#0d47a1');
    ctx.fillStyle = carGrad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(-carW/2, -carH, carW, carH, 4) : ctx.fillRect(-carW/2,-carH,carW,carH);
    ctx.fill();
    // Cabin
    ctx.fillStyle = '#1976d2';
    ctx.beginPath(); ctx.moveTo(-carW/2+8,-carH); ctx.lineTo(-carW/2+14,-carH-14); ctx.lineTo(carW/2-10,-carH-14); ctx.lineTo(carW/2-6,-carH); ctx.closePath(); ctx.fill();
    // Kính
    ctx.fillStyle = '#80d8ff'; ctx.globalAlpha = 0.7;
    ctx.fillRect(-carW/2+15,-carH-12, 20, 10);
    ctx.globalAlpha = 1;
    // Bánh xe (quay)
    const wheelAngle = progress * 15;
    [-carW/3, carW/3].forEach(wx => {
      ctx.fillStyle = '#263238'; ctx.beginPath(); ctx.arc(wx, 4, 8, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#90a4ae'; ctx.beginPath(); ctx.arc(wx, 4, 3, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#b0bec5'; ctx.lineWidth = 1.5;
      ctx.save(); ctx.translate(wx, 4); ctx.rotate(wheelAngle);
      ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(7,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(0,7); ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
    ctx.fillText(`${m}kg`, 0, -carH-20);
    ctx.restore();

    // Nhãn chiều cao hiện tại
    const hLineX = cx - 40;
    ctx.strokeStyle = '#ffd54f'; ctx.lineWidth = 1.5; ctx.setLineDash([4,4]);
    ctx.beginPath(); ctx.moveTo(hLineX, cy); ctx.lineTo(hLineX, groundY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffd54f'; ctx.font = '10px monospace'; ctx.textAlign = 'right';
    if(h_cur > 0.5) ctx.fillText(`h=${h_cur.toFixed(1)}m`, hLineX-4, (cy+groundY)/2);
  }

  // === THANH NĂNG LƯỢNG (bên phải) ===
  const barX = W - 130, barY_top = 20, barH_max = H - 80, barW = 28;
  // Nền
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(barX-10, barY_top-10, barW+20, barH_max+30, 6) : ctx.fillRect(barX-10,barY_top-10,barW+20,barH_max+30);
  ctx.fill();

  const peH = barH_max * (Wt / W_total);
  const keH = barH_max * (Wd / W_total);

  // Thế năng (xanh lá, phần trên)
  ctx.fillStyle = '#43a047';
  ctx.fillRect(barX, barY_top, barW, peH);
  // Động năng (đỏ cam, phần dưới)
  ctx.fillStyle = '#ef5350';
  ctx.fillRect(barX, barY_top + peH, barW, keH);

  // Viền
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.strokeRect(barX, barY_top, barW, barH_max);

  // Nhãn
  ctx.font = 'bold 9px monospace'; ctx.textAlign = 'center';
  if(peH > 16) { ctx.fillStyle = '#fff'; ctx.fillText('Wt', barX+barW/2, barY_top + peH/2 + 4); }
  if(keH > 16) { ctx.fillStyle = '#fff'; ctx.fillText('Wđ', barX+barW/2, barY_top + peH + keH/2 + 4); }

  ctx.fillStyle = '#7cb9ff'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
  ctx.fillText('Năng', barX+barW+4, barY_top+12);
  ctx.fillText('lượng', barX+barW+4, barY_top+22);
  ctx.fillStyle = '#43a047'; ctx.fillRect(barX+barW+4, barY_top+30, 8, 8);
  ctx.fillStyle = '#aaa'; ctx.font='8px monospace';
  ctx.fillText('Wt', barX+barW+14, barY_top+38);
  ctx.fillStyle = '#ef5350'; ctx.fillRect(barX+barW+4, barY_top+44, 8, 8);
  ctx.fillText('Wđ', barX+barW+14, barY_top+52);
}

let energyProgress = 0;
function energyLoop(ts) {
  if(!energyRunning) return;
  energyProgress += 0.008;
  if(energyProgress >= 1) { energyProgress = 1; drawEnergy(1); energyRunning = false; document.getElementById('energy-btn').textContent = '▶ Chạy lại'; return; }
  drawEnergy(energyProgress);
  requestAnimationFrame(energyLoop);
}

function toggleEnergySim() {
  if(energyRunning) {
    energyRunning = false;
    cancelAnimationFrame(energyAnim);
    document.getElementById('energy-btn').textContent = '▶ Tiếp tục';
  } else {
    if(energyProgress >= 1) energyProgress = 0;
    energyRunning = true;
    energyAnim = requestAnimationFrame(energyLoop);
    document.getElementById('energy-btn').textContent = '⏸ Dừng';
  }
}
function resetEnergy() {
  energyRunning = false; cancelAnimationFrame(energyAnim);
  energyProgress = 0; drawEnergy(0);
  document.getElementById('energy-btn').textContent = '▶ Chạy';
}

// ========== MOMENT LỰC ==========
let torqueAngle = 0, torqueVel = 0, torqueRAF = null, torqueRunning = false;

function updateTorque() {
  const F1 = parseFloat(document.getElementById('F1-torque').value) || 0;
  const d1 = parseFloat(document.getElementById('d1-torque').value) || 0;
  const F2 = parseFloat(document.getElementById('F2-torque').value) || 0;
  const d2 = parseFloat(document.getElementById('d2-torque').value) || 0;
  const M1 = F1 * d1;
  const M2 = F2 * d2;
  document.getElementById('M1-val').innerHTML = M1.toFixed(1) + '<span class="dc-unit">Nm</span>';
  document.getElementById('M2-val').innerHTML = M2.toFixed(1) + '<span class="dc-unit">Nm</span>';
  const diff = M2 - M1;
  const result = Math.abs(diff) < 0.01 ? '⚖ Cân bằng' : (diff > 0 ? '↻ Quay sang phải' : '↺ Quay sang trái');
  document.getElementById('torque-result').innerHTML = result;
  // Kích hoạt animation
  if (!torqueRunning) {
    torqueRunning = true;
    torqueAnimLoop();
  }
}

let torqueLastT = null;
function torqueAnimLoop(ts) {
  const F1 = parseFloat(document.getElementById('F1-torque').value) || 0;
  const d1 = parseFloat(document.getElementById('d1-torque').value) || 0;
  const F2 = parseFloat(document.getElementById('F2-torque').value) || 0;
  const d2 = parseFloat(document.getElementById('d2-torque').value) || 0;
  const M1 = F1 * d1, M2 = F2 * d2;
  const netM = M2 - M1; // dương → quay phải
  const I = 1.0; // moment quán tính ảo
  if (!torqueLastT) torqueLastT = ts || performance.now();
  const dt = Math.min((( ts || performance.now()) - torqueLastT) / 1000, 0.05);
  torqueLastT = ts || performance.now();
  const alpha = netM / I * 0.4; // gia tốc góc (scale)
  torqueVel += alpha * dt;
  torqueVel *= 0.97; // ma sát nhỏ
  torqueAngle += torqueVel * dt;
  // Giới hạn góc ±45°
  const maxAngle = Math.PI / 4;
  if (torqueAngle > maxAngle) { torqueAngle = maxAngle; torqueVel *= -0.3; }
  if (torqueAngle < -maxAngle) { torqueAngle = -maxAngle; torqueVel *= -0.3; }
  drawTorqueScene(M1, M2, F1, F2, d1, d2, torqueAngle);
  torqueRAF = requestAnimationFrame(torqueAnimLoop);
}

function drawTorqueScene(M1, M2, F1, F2, d1, d2, angle) {
  const canvas = document.getElementById('torque-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0,0,W,H);

  // Nền đẹp hơn
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#e8f5e9'); bg.addColorStop(1,'#c8e6c9');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Nền đất
  ctx.fillStyle = '#a5d6a7'; ctx.fillRect(0, H*0.72, W, H*0.28);
  ctx.fillStyle = '#81c784'; ctx.fillRect(0, H*0.72, W, 5);

  const pivotX = W/2, pivotY = H*0.62;
  const beamLen = 240;

  // Vẽ trụ đỡ
  ctx.fillStyle = '#795548';
  ctx.fillRect(pivotX-8, pivotY, 16, H*0.72 - pivotY);
  // Đế trụ
  ctx.fillStyle = '#5d4037'; ctx.fillRect(pivotX-30, H*0.72-4, 60, 12); ctx.beginPath(); ctx.arc(pivotX,H*0.72-4,4,0,Math.PI*2); ctx.fillStyle='#ffd54f'; ctx.fill();

  // Vẽ thanh đòn bẩy (xoay theo angle)
  ctx.save();
  ctx.translate(pivotX, pivotY);
  ctx.rotate(angle);

  // Thanh gỗ
  const grad = ctx.createLinearGradient(-beamLen, -10, beamLen, 10);
  grad.addColorStop(0,'#d32f2f'); grad.addColorStop(0.5,'#ef5350'); grad.addColorStop(1,'#1565c0');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(-beamLen, -8, beamLen*2, 16, 4) : ctx.fillRect(-beamLen, -8, beamLen*2, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(-beamLen, -8, beamLen*2, 16);

  // Vị trí điểm lực trái
  const armL = Math.min(beamLen*0.9, d1 * 100);
  const armR = Math.min(beamLen*0.9, d2 * 100);

  // Vật nặng trái (đỏ) - vẽ phía trên thanh
  ctx.fillStyle = '#c62828'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-armL-20, -50, 40, 40, 6) : ctx.fillRect(-armL-20, -50, 40, 40);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
  ctx.fillText(`F₁`, -armL, -35);
  ctx.fillText(`${F1}N`, -armL, -20);
  // Dây treo trái
  ctx.strokeStyle = '#c62828'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-armL, -8); ctx.lineTo(-armL, -10); ctx.stroke();

  // Mũi tên lực xuống trái
  ctx.strokeStyle = '#e53935'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-armL, 8); ctx.lineTo(-armL, 28); ctx.stroke();
  ctx.fillStyle = '#e53935';
  ctx.beginPath(); ctx.moveTo(-armL, 35); ctx.lineTo(-armL-6, 22); ctx.lineTo(-armL+6, 22); ctx.closePath(); ctx.fill();

  // Vật nặng phải (xanh)
  ctx.fillStyle = '#1565c0'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(armR-20, -50, 40, 40, 6) : ctx.fillRect(armR-20, -50, 40, 40);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
  ctx.fillText(`F₂`, armR, -35);
  ctx.fillText(`${F2}N`, armR, -20);
  // Dây treo phải
  ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(armR, -8); ctx.lineTo(armR, -10); ctx.stroke();

  // Mũi tên lực xuống phải
  ctx.strokeStyle = '#1976d2'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(armR, 8); ctx.lineTo(armR, 28); ctx.stroke();
  ctx.fillStyle = '#1976d2';
  ctx.beginPath(); ctx.moveTo(armR, 35); ctx.lineTo(armR-6, 22); ctx.lineTo(armR+6, 22); ctx.closePath(); ctx.fill();

  // Nhãn cánh tay đòn (dưới thanh)
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(-armL, 10); ctx.lineTo(0, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(armR, 10); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#444'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText(`d₁=${d1}m`, -armL/2, 24);
  ctx.fillText(`d₂=${d2}m`, armR/2, 24);

  // Khớp trục giữa
  ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#f57f17'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI*2); ctx.fill(); ctx.stroke();

  ctx.restore();

  // Thông tin M1, M2 ngoài canvas
  ctx.fillStyle = '#b71c1c'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
  ctx.fillText(`M₁ = ${M1.toFixed(1)} Nm`, 16, 26);
  ctx.fillStyle = '#0d47a1'; ctx.textAlign = 'right';
  ctx.fillText(`M₂ = ${M2.toFixed(1)} Nm`, W-16, 26);

  // Trạng thái
  const diff = M2 - M1;
  ctx.fillStyle = Math.abs(diff) < 0.01 ? '#2e7d32' : '#e65100';
  ctx.font = 'bold 13px Nunito,sans-serif'; ctx.textAlign = 'center';
  const stateText = Math.abs(diff)<0.01 ? '⚖ CÂN BẰNG' : (diff>0 ? '↻ Quay phải' : '↺ Quay trái');
  ctx.fillText(stateText, W/2, H-12);
}

function resetTorque() {
  document.getElementById('F1-torque').value = 10;
  document.getElementById('d1-torque').value = 0.8;
  document.getElementById('F2-torque').value = 20;
  document.getElementById('d2-torque').value = 0.4;
  torqueAngle = 0; torqueVel = 0;
  if (torqueRAF) cancelAnimationFrame(torqueRAF);
  torqueRunning = false; torqueLastT = null;
  updateTorque();
}

/* ==================== MODAL ==================== */
document.getElementById('openModal').addEventListener('click', () => {
  document.getElementById('feedbackModal').classList.add('open');
  document.getElementById('modal-form-body').style.display = 'block';
  document.getElementById('success-msg').style.display = 'none';
  document.querySelector('.modal-footer').style.display = 'flex';
});
function closeModal() { document.getElementById('feedbackModal').classList.remove('open'); }
document.getElementById('feedbackModal').addEventListener('click', e => { if (e.target.id==='feedbackModal') closeModal(); });

/* ==================== INIT ==================== */
window.addEventListener('load', () => {
  mV0 = 10; mA = 2; mTmax = 10;
  mSmax = Math.max(mV0*mTmax + 0.5*mA*mTmax*mTmax, 1);
  updateInputFields();
  drawMotionFrame(mV0, 0);
  drawGraph();
  updateForceDisplay();
  drawForceScene(0);
  drawCircuit(false, 0, 12);
  drawWaveFrame(0); updateWaveData();
  initShelf();
  initDNA();
  runOptics();
  renderPeriodicTable();
  
});
