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
    acidbase:'Acid – Base', cell:'Tế bào', dna:'Lắp ráp DNA'
  };
  document.getElementById('status-page').textContent = (labels[id] || id).toUpperCase();
  if (id === 'motion') { updateMotionParam(); drawMotionFrame(); drawGraph(); }
  if (id === 'force') { drawForceScene(0); }
  if (id === 'wave') { if (!waveRunning) drawWaveFrame(0); }
  if (id === 'optics') { runOptics(); }
  if (id === 'circuit') { resetCircuit(); }
  if (id === 'acidbase') { initShelf(); }
  if (id === 'dna') { initDNA(); }
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

/* ==================== FORCE (bỏ range, dùng number) ==================== */
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

/* ==================== WAVE SIM (number inputs) ==================== */
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

/* ==================== OPTICS (bỏ nút) ==================== */
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

/* ==================== CIRCUIT (number inputs) ==================== */
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
  if (type === 'series') { Rtotal = R1 + R2 + RL; }
  else if (type === 'parallel') { Rtotal = 1/(1/R1 + 1/R2) + RL; }
  else { Rtotal = 1/(1/R1 + 1/(R2+RL)); }
  const I = circuitClosed ? E / Rtotal : 0;
  const V = circuitClosed ? I * (type==='series' ? RL : RL) : 0;
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
  ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H);

  const mx = 80, my = 60, bw = W-160, bh = H-120;
  const wireColor = closed ? '#ffe082' : '#445';
  const lineW = closed ? 3 : 2;
  const glow = closed && I > 0.05;

  function drawWire(x1, y1, x2, y2) {
    if (glow) { ctx.shadowBlur = 8; ctx.shadowColor = '#ffe082'; }
    ctx.strokeStyle = wireColor; ctx.lineWidth = lineW;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  drawWire(mx, my, mx+bw, my);
  drawWire(mx+bw, my, mx+bw, my+bh);
  drawWire(mx+bw, my+bh, mx, my+bh);
  drawWire(mx, my+bh, mx, my);

  const batY = my + bh*0.5;
  ctx.fillStyle = '#263238';
  ctx.fillRect(mx-18, batY-35, 36, 70);
  ctx.strokeStyle = '#aac4e6'; ctx.lineWidth = 2;
  ctx.strokeRect(mx-18, batY-35, 36, 70);
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = i%2===0 ? '#e74c3c' : '#2196f3';
    ctx.fillRect(mx-10, batY-25+i*14, 20, 6);
  }
  ctx.fillStyle = '#ffe082'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('E='+document.getElementById('circuit-emf').value+'V', mx, batY+48);
  ctx.fillText('+', mx, batY-38); ctx.fillText('–', mx, batY+42);

  const swX = mx+80, swY = my;
  ctx.fillStyle = '#263238'; ctx.fillRect(swX-20, swY-16, 40, 32);
  ctx.strokeStyle = '#aac4e6'; ctx.lineWidth = 2; ctx.strokeRect(swX-20, swY-16, 40, 32);
  if (closed) {
    ctx.strokeStyle = '#ffe082'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(swX-10, swY); ctx.lineTo(swX+10, swY); ctx.stroke();
    ctx.fillStyle = '#4caf50';
  } else {
    ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(swX-10, swY+2); ctx.lineTo(swX+10, swY-8); ctx.stroke();
    ctx.fillStyle = '#e74c3c';
  }
  ctx.fillStyle = '#aac4e6'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('K', swX, swY-20);
  ctx.fillText(closed ? '(đóng)' : '(mở)', swX, swY+30);

  const amX = mx+bw*0.45, amY = my;
  ctx.strokeStyle = '#aac4e6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(amX, amY, 18, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#0d1117'; ctx.fill();
  ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 13px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('A', amX, amY+5);
  ctx.fillStyle = '#aac4e6'; ctx.font = '10px monospace';
  ctx.fillText('Ampe kế', amX, amY-24);
  if (closed) {
    ctx.fillStyle = '#ffe082'; ctx.font = '10px monospace';
    ctx.fillText(I.toFixed(2)+'A', amX, amY+30);
  }

  const vmX = mx+bw, vmY = my+bh*0.5;
  ctx.strokeStyle = '#aac4e6'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(vmX, vmY, 18, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = '#0d1117'; ctx.fill();
  ctx.fillStyle = '#2196f3'; ctx.font = 'bold 13px Space Mono,monospace'; ctx.textAlign = 'center';
  ctx.fillText('V', vmX, vmY+5);
  ctx.fillStyle = '#aac4e6'; ctx.font = '10px monospace';
  ctx.fillText('Vôn kế', vmX+30, vmY-6);
  const RL = parseFloat(document.getElementById('circuit-lamp').value)||5;
  if (closed) {
    ctx.fillStyle = '#7cb9ff'; ctx.font = '10px monospace';
    ctx.fillText((I*RL).toFixed(2)+'V', vmX+35, vmY+10);
  }

  const r1X = mx+bw*0.7, r1Y = my;
  ctx.fillStyle = '#f39c12';
  ctx.fillRect(r1X-22, r1Y-10, 44, 20);
  ctx.strokeStyle = '#e67e22'; ctx.lineWidth = 2; ctx.strokeRect(r1X-22, r1Y-10, 44, 20);
  ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('R₁='+document.getElementById('circuit-r1').value+'Ω', r1X, r1Y+4);

  const r2X = mx+bw*0.5, r2Y = my+bh;
  ctx.fillStyle = '#9c27b0';
  ctx.fillRect(r2X-22, r2Y-10, 44, 20);
  ctx.strokeStyle = '#7b1fa2'; ctx.lineWidth = 2; ctx.strokeRect(r2X-22, r2Y-10, 44, 20);
  ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('R₂='+document.getElementById('circuit-r2').value+'Ω', r2X, r2Y+4);

  const lampX = mx+bw*0.2, lampY = my+bh;
  const lampBrightness = closed && I > 0 ? Math.min(I/10, 1) : 0;
  ctx.strokeStyle = closed && lampBrightness > 0.1 ? `rgba(255,235,59,${lampBrightness})` : '#445';
  if (closed && lampBrightness > 0) { ctx.shadowBlur = 20*lampBrightness; ctx.shadowColor = '#ffe082'; }
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(lampX, lampY, 14, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = closed && lampBrightness > 0.1 ? '#ffe082' : '#445'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(lampX-8, lampY-8); ctx.lineTo(lampX+8, lampY+8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(lampX+8, lampY-8); ctx.lineTo(lampX-8, lampY+8); ctx.stroke();
  ctx.fillStyle = closed && lampBrightness > 0 ? '#ffe082' : '#445';
  ctx.font = '10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('Đèn', lampX, lampY-20);
  ctx.fillText(document.getElementById('circuit-lamp').value+'Ω', lampX, lampY+28);

  if (closed) {
    ctx.fillStyle = '#4caf50'; ctx.font = 'bold 12px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('⚡ Mạch đang hoạt động – I = '+I.toFixed(2)+' A', W/2, H-12);
  } else {
    ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 12px Nunito,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('🔴 Mạch hở – Khóa K chưa đóng', W/2, H-12);
  }
}

/* ==================== CHEMISTRY (giữ nguyên, chỉ số lớn) ==================== */
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
  const volB = volA; // giả sử cùng thể tích
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
      description = `Acid ${(nH-nOH).toFixed(4)} mol → pH = ${finalpH.toFixed(2)}`;
    } else {
      const oh_conc = (nOH - nH) / volTotal;
      finalpH = 14 - (-Math.log10(oh_conc));
      env = 'Kiềm';
      description = `Kiềm ${(nOH-nH).toFixed(4)} mol → pH = ${finalpH.toFixed(2)}`;
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

/* ==================== DNA (giữ nguyên) ==================== */
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
});
