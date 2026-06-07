/* ==================== KẾT TINH ==================== */

// Solubility data (g/100g H2O) at various temperatures
const crystalSolubilityData = {
  NaCl:  { 0:35.7, 20:36.0, 40:36.6, 60:37.3, 80:38.4, 100:39.2, color:'#b3e5fc', crystal:'#81d4fa', label:'NaCl – Muối ăn' },
  KNO3:  { 0:13.3, 20:31.6, 40:63.9, 60:110,  80:169,  100:246,  color:'#dcedc8', crystal:'#aed581', label:'KNO₃ – Kali nitrat' },
  NaNO3: { 0:73,   20:88,   40:104,  60:124,  80:148,  100:180,  color:'#ffe0b2', crystal:'#ffcc80', label:'NaNO₃' },
  CuSO4: { 0:14.3, 20:20.2, 40:28.5, 60:40.0, 80:55.0, 100:75.4, color:'#b2dfdb', crystal:'#26c6da', label:'CuSO₄·5H₂O' }
};

let crystalRunning = false;
let crystalRAF = null;
let crystalT = 0;
let crystalParticles = [];
let crystalFormed = [];

function initCrystal() {
  resetCrystal();
}

function getSolubility(substance, temp) {
  const data = crystalSolubilityData[substance];
  if (!data) return 36;
  const temps = [0, 20, 40, 60, 80, 100];
  const clampedT = Math.max(0, Math.min(100, temp));
  for (let i = 0; i < temps.length - 1; i++) {
    if (clampedT <= temps[i+1]) {
      const t0 = temps[i], t1 = temps[i+1];
      const frac = (clampedT - t0) / (t1 - t0);
      return data[t0] + frac * (data[t1] - data[t0]);
    }
  }
  return data[100];
}

function updateCrystalTemp() {
  const temp = parseFloat(document.getElementById('crystal-temp').value) || 60;
  document.getElementById('crystal-temp-val').textContent = temp + '°C';
  document.getElementById('crystal-temp-display').innerHTML = temp + '<span class="dc-unit">°C</span>';
  updateCrystalStatus();
  if (!crystalRunning) drawCrystalScene();
}

function updateCrystalConc() {
  const conc = parseFloat(document.getElementById('crystal-conc').value) || 40;
  document.getElementById('crystal-conc-val').textContent = conc + ' g';
  updateCrystalStatus();
  if (!crystalRunning) drawCrystalScene();
}

function updateCrystalStatus() {
  const substance = document.getElementById('crystal-substance').value;
  const temp = parseFloat(document.getElementById('crystal-temp').value) || 60;
  const conc = parseFloat(document.getElementById('crystal-conc').value) || 40;
  const sol = getSolubility(substance, temp);
  const excess = Math.max(0, conc - sol);

  document.getElementById('crystal-solubility').innerHTML = sol.toFixed(1) + '<span class="dc-unit">g/100g</span>';
  document.getElementById('crystal-temp-display').innerHTML = temp + '<span class="dc-unit">°C</span>';

  if (conc < sol * 0.9) {
    document.getElementById('crystal-state').textContent = '💧 Chưa bão hòa';
    document.getElementById('crystal-state').style.color = '#29b6f6';
    document.getElementById('crystal-amount').innerHTML = '0<span class="dc-unit">g</span>';
  } else if (conc <= sol) {
    document.getElementById('crystal-state').textContent = '⚖ Bão hòa';
    document.getElementById('crystal-state').style.color = '#ffb300';
    document.getElementById('crystal-amount').innerHTML = '0<span class="dc-unit">g</span>';
  } else {
    document.getElementById('crystal-state').textContent = '💎 Quá bão hòa – Kết tinh!';
    document.getElementById('crystal-state').style.color = '#69f0ae';
    document.getElementById('crystal-amount').innerHTML = excess.toFixed(1) + '<span class="dc-unit">g</span>';
  }
}

function resetCrystal() {
  crystalRunning = false;
  cancelAnimationFrame(crystalRAF);
  crystalT = 0;
  crystalParticles = [];
  crystalFormed = [];
  updateCrystalStatus();
  drawCrystalScene();
}

function toggleCrystal() {
  const btn = document.getElementById('crystal-btn');
  if (crystalRunning) {
    crystalRunning = false;
    if (btn) btn.textContent = '▶ CHẠY';
    cancelAnimationFrame(crystalRAF);
  } else {
    crystalRunning = true;
    if (btn) btn.textContent = '⏸ DỪNG';
    initCrystalParticles();
    animateCrystal();
  }
}

function initCrystalParticles() {
  const substance = document.getElementById('crystal-substance').value;
  const temp = parseFloat(document.getElementById('crystal-temp').value) || 60;
  const conc = parseFloat(document.getElementById('crystal-conc').value) || 40;
  const sol = getSolubility(substance, temp);
  const data = crystalSolubilityData[substance];

  crystalParticles = [];
  const count = Math.min(60, Math.max(20, Math.round(conc * 0.8)));
  for (let i = 0; i < count; i++) {
    crystalParticles.push({
      x: 0.15 + Math.random() * 0.7,
      y: 0.15 + Math.random() * 0.65,
      vx: (Math.random()-0.5)*0.004,
      vy: (Math.random()-0.5)*0.004,
      r: 3 + Math.random()*3,
      dissolved: true,
      crystallized: false,
      alpha: 0.7 + Math.random()*0.3
    });
  }

  // If supersaturated, some particles will crystallize
  if (conc > sol) {
    const ratio = Math.min(1, (conc - sol) / conc);
    const toXtal = Math.floor(crystalParticles.length * ratio * 0.9);
    for (let i = 0; i < toXtal; i++) {
      crystalParticles[i].willCrystallize = true;
      crystalParticles[i].xtTime = 0.5 + Math.random() * 1.5;
    }
  }
}

function animateCrystal() {
  if (!crystalRunning) return;
  crystalT += 0.016;

  const substance = document.getElementById('crystal-substance').value;
  const temp = parseFloat(document.getElementById('crystal-temp').value) || 60;
  const conc = parseFloat(document.getElementById('crystal-conc').value) || 40;
  const sol = getSolubility(substance, temp);
  const data = crystalSolubilityData[substance];
  const color = data.color;
  const crystColor = data.crystal;

  crystalParticles.forEach(p => {
    if (p.crystallized) {
      // Settle to bottom
      if (p.y < 0.88) p.y += 0.003;
    } else {
      p.x += p.vx + Math.sin(crystalT * 2 + p.r) * 0.0006;
      p.y += p.vy + Math.cos(crystalT * 1.5 + p.r) * 0.0004;
      if (p.x < 0.12) { p.x = 0.12; p.vx *= -1; }
      if (p.x > 0.88) { p.x = 0.88; p.vx *= -1; }
      if (p.y < 0.12) { p.y = 0.12; p.vy *= -1; }
      if (p.y > 0.88) { p.y = 0.88; p.vy *= -1; }

      if (p.willCrystallize && crystalT > p.xtTime) {
        p.crystallized = true;
        p.dissolved = false;
        p.alpha = 1;
      }
    }
  });

  drawCrystalScene();
  crystalRAF = requestAnimationFrame(animateCrystal);
}

function drawCrystalScene() {
  const c = document.getElementById('crystal-canvas'); if (!c) return;
  ensureCrystalCanvasSize();
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;

  const substance = document.getElementById('crystal-substance').value;
  const temp = parseFloat(document.getElementById('crystal-temp').value) || 60;
  const conc = parseFloat(document.getElementById('crystal-conc').value) || 40;
  const sol = getSolubility(substance, temp);
  const data = crystalSolubilityData[substance];

  // Background gradient
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0d1b2a'); bg.addColorStop(1,'#0a2233');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Beaker
  const bx = W*0.05, by = W*0.03, bw = W*0.9, bh = H*0.8;
  ctx.save();
  ctx.strokeStyle='rgba(180,200,240,0.4)'; ctx.lineWidth=2.5;
  ctx.beginPath();
  ctx.moveTo(bx, by); ctx.lineTo(bx, by+bh); ctx.lineTo(bx+bw, by+bh); ctx.lineTo(bx+bw, by);
  ctx.stroke();

  // Water fill
  const liquidH = bh * 0.85;
  const liquidGrad = ctx.createLinearGradient(bx, by+bh-liquidH, bx, by+bh);
  liquidGrad.addColorStop(0, data.color+'66');
  liquidGrad.addColorStop(1, data.color+'aa');
  ctx.fillStyle = liquidGrad;
  ctx.fillRect(bx+2, by+bh-liquidH, bw-4, liquidH);

  // Solubility line
  const sol_pct = Math.min(1, sol / (sol > 0 ? sol * 1.5 : 1));
  const solLineY = by + bh - liquidH * 0.6;
  ctx.strokeStyle = conc > sol ? '#ef5350' : '#66bb6a';
  ctx.lineWidth = 1.5; ctx.setLineDash([6,4]);
  ctx.beginPath(); ctx.moveTo(bx+2, solLineY); ctx.lineTo(bx+bw-2, solLineY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '10px monospace'; ctx.fillStyle = conc > sol ? '#ef9a9a' : '#a5d6a7';
  ctx.textAlign = 'left';
  ctx.fillText('Độ tan: ' + sol.toFixed(1) + 'g', bx+6, solLineY-4);
  ctx.restore();

  // Draw particles
  crystalParticles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    if (p.crystallized) {
      // Draw crystal shape (diamond/square)
      ctx.fillStyle = data.crystal;
      ctx.shadowBlur = 10; ctx.shadowColor = data.crystal;
      const px = bx + p.x * bw, py = by + p.y * bh;
      const sz = p.r * 1.4;
      ctx.beginPath();
      ctx.moveTo(px, py - sz);
      ctx.lineTo(px + sz, py);
      ctx.lineTo(px, py + sz);
      ctx.lineTo(px - sz, py);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    } else {
      // Dissolved ion
      ctx.fillStyle = data.color;
      ctx.shadowBlur = 6; ctx.shadowColor = data.color;
      ctx.beginPath();
      ctx.arc(bx + p.x*bw, by + p.y*bh, p.r, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  });

  // Temperature thermometer on right
  drawThermometer(ctx, W-30, H*0.15, 16, H*0.65, temp);

  // Status text
  ctx.font = 'bold 12px Space Mono,monospace'; ctx.textAlign='center';
  const msg = conc > sol
    ? `💎 Quá bão hòa | Kết tinh: ${(conc-sol).toFixed(1)}g`
    : conc > sol*0.9
    ? `⚖ Bão hòa`
    : `💧 Chưa bão hòa | Có thể hòa tan thêm ${(sol-conc).toFixed(1)}g`;
  ctx.fillStyle = conc > sol ? '#69f0ae' : conc > sol*0.9 ? '#ffb300' : '#29b6f6';
  ctx.fillText(msg, W/2, H-8);
}

function drawThermometer(ctx, cx, y, w, h, temp) {
  ctx.save();
  const bulbR = w*0.7;
  const stemW = w*0.4;
  const stemH = h - bulbR;
  const fillH = stemH * (temp/100);

  // Stem outline
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(cx-stemW/2, y, stemW, stemH, stemW/2)
    : ctx.rect(cx-stemW/2, y, stemW, stemH);
  ctx.stroke();

  // Fill
  const grad = ctx.createLinearGradient(cx, y+stemH, cx, y+stemH-fillH);
  grad.addColorStop(0,'#ef5350'); grad.addColorStop(1,'#ff8a65');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.rect(cx-stemW/2+2, y+stemH-fillH, stemW-4, fillH);
  ctx.fill();

  // Bulb
  ctx.fillStyle='#ef5350'; ctx.beginPath(); ctx.arc(cx, y+stemH+bulbR, bulbR, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1.5; ctx.stroke();

  // Label
  ctx.font='bold 9px monospace'; ctx.fillStyle='#ffcc80'; ctx.textAlign='center';
  ctx.fillText(temp+'°C', cx, y-6);
  ctx.restore();
}

let crystalCanvasBound = false;
function ensureCrystalCanvasSize() {
  const c = document.getElementById('crystal-canvas'); if(!c||!c.parentElement) return;
  const cssW = Math.max(280, c.parentElement.clientWidth||700);
  const cssH = Math.max(200, Math.round(cssW*(300/700)));
  c.style.height = cssH+'px';
  const dpr = window.devicePixelRatio||1;
  const nW=Math.round(cssW*dpr), nH=Math.round(cssH*dpr);
  if(c.width!==nW||c.height!==nH){c.width=nW;c.height=nH;}
  if(!crystalCanvasBound){
    crystalCanvasBound=true;
    window.addEventListener('resize',()=>{ensureCrystalCanvasSize();drawCrystalScene();},{passive:true});
  }
}