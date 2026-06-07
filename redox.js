/* ==================== OXI HÓA – KHỬ ==================== */
const redoxReactions = [
  {
    id: 'fe_hcl',
    name: 'Fe + HCl',
    label: '🔴 Fe + HCl',
    reductant: 'Fe (chất khử)',
    oxidant: 'H⁺ (chất oxi hóa)',
    electrons: 2,
    equation: 'Fe + 2HCl → FeCl₂ + H₂↑',
    ion: 'Fe − 2e⁻ → Fe²⁺  |  2H⁺ + 2e⁻ → H₂↑',
    note: 'Fe bị oxi hóa (0→+2); H⁺ bị khử (+1→0). Bọt H₂ nổi lên.',
    dg: '−84.8 kJ/mol',
    reductantColor: '#ef9a9a',
    oxidantColor: '#90caf9',
    productColor: '#a5d6a7'
  },
  {
    id: 'zn_cuso4',
    name: 'Zn + CuSO₄',
    label: '🔵 Zn + CuSO₄',
    reductant: 'Zn (chất khử)',
    oxidant: 'Cu²⁺ (chất oxi hóa)',
    electrons: 2,
    equation: 'Zn + CuSO₄ → ZnSO₄ + Cu↓',
    ion: 'Zn − 2e⁻ → Zn²⁺  |  Cu²⁺ + 2e⁻ → Cu↓',
    note: 'Zn mạnh hơn Cu trong dãy hoạt động. Cu màu đỏ bám lên thanh Zn.',
    dg: '−211.7 kJ/mol',
    reductantColor: '#b0bec5',
    oxidantColor: '#80cbc4',
    productColor: '#ffab91'
  },
  {
    id: 'kmno4_h2o2',
    name: 'KMnO₄ + H₂O₂',
    label: '🟣 KMnO₄ + H₂O₂',
    reductant: 'H₂O₂ (chất khử)',
    oxidant: 'MnO₄⁻ (chất oxi hóa)',
    electrons: 5,
    equation: '2KMnO₄ + 5H₂O₂ + 3H₂SO₄ → 2MnSO₄ + K₂SO₄ + 8H₂O + 5O₂↑',
    ion: '2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂↑ + 8H₂O',
    note: 'Dung dịch tím KMnO₄ mất màu khi phản ứng với H₂O₂ trong môi trường acid.',
    dg: '−1530 kJ/mol',
    reductantColor: '#fff59d',
    oxidantColor: '#ce93d8',
    productColor: '#b0bec5'
  },
  {
    id: 'na_h2o',
    name: 'Na + H₂O',
    label: '🟡 Na + H₂O',
    reductant: 'Na (chất khử)',
    oxidant: 'H₂O (chất oxi hóa)',
    electrons: 1,
    equation: '2Na + 2H₂O → 2NaOH + H₂↑',
    ion: 'Na − e⁻ → Na⁺  |  2H₂O + 2e⁻ → H₂↑ + 2OH⁻',
    note: 'Na kim loại hoạt động mạnh, phản ứng mãnh liệt với nước, sinh bọt khí H₂.',
    dg: '−368 kJ/mol',
    reductantColor: '#ffe082',
    oxidantColor: '#b3e5fc',
    productColor: '#dcedc8'
  },
  {
    id: 'cl2_nabr',
    name: 'Cl₂ + NaBr',
    label: '🟢 Cl₂ + NaBr',
    reductant: 'Br⁻ (chất khử)',
    oxidant: 'Cl₂ (chất oxi hóa)',
    electrons: 1,
    equation: 'Cl₂ + 2NaBr → 2NaCl + Br₂',
    ion: '2Br⁻ − 2e⁻ → Br₂  |  Cl₂ + 2e⁻ → 2Cl⁻',
    note: 'Cl₂ oxi hóa mạnh hơn Br₂ → đẩy Br⁻ ra khỏi muối. Dung dịch có màu vàng nâu (Br₂).',
    dg: '−57.2 kJ/mol',
    reductantColor: '#b2dfdb',
    oxidantColor: '#cfd8dc',
    productColor: '#ffe0b2'
  }
];

let redoxSelectedId = 'fe_hcl';
let redoxAnimRunning = false;
let redoxRAF = null;
let redoxT = 0;
let redoxParticles = [];

function initRedox() {
  renderRedoxPicker();
  resetRedox();
}

function renderRedoxPicker() {
  const container = document.getElementById('redox-picker');
  if (!container) return;
  container.innerHTML = redoxReactions.map(r =>
    `<button onclick="selectRedox('${r.id}')" style="padding:7px 14px;border-radius:20px;border:2px solid ${r.id===redoxSelectedId?'#1565c0':'#ccc'};background:${r.id===redoxSelectedId?'#1565c0':'#f5f7fa'};color:${r.id===redoxSelectedId?'#fff':'#333'};font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;">${r.label}</button>`
  ).join('');
}

function selectRedox(id) {
  redoxSelectedId = id;
  renderRedoxPicker();
  resetRedox();
}

function resetRedox() {
  redoxAnimRunning = false;
  cancelAnimationFrame(redoxRAF);
  redoxT = 0;
  redoxParticles = [];
  const eq = document.getElementById('redox-equation');
  if (eq) eq.style.display = 'none';
  ['redox-reductant','redox-oxidant','redox-electrons','redox-dg'].forEach(id => {
    const el = document.getElementById(id); if (el) el.textContent = '–';
  });
  drawRedoxScene(0, false);
}

function runRedox() {
  const rx = redoxReactions.find(r => r.id === redoxSelectedId);
  if (!rx) return;
  document.getElementById('redox-reductant').textContent = rx.reductant;
  document.getElementById('redox-oxidant').textContent = rx.oxidant;
  document.getElementById('redox-electrons').textContent = rx.electrons + ' e⁻';
  document.getElementById('redox-dg').textContent = rx.dg;
  const eq = document.getElementById('redox-equation');
  if (eq) {
    eq.style.display = 'block';
    document.getElementById('redox-eq-text').textContent = rx.ion;
    document.getElementById('redox-eq-note').textContent = rx.note;
  }
  redoxT = 0;
  redoxParticles = [];
  for (let i = 0; i < 20; i++) {
    redoxParticles.push({
      x: 0.15 + Math.random() * 0.2,
      y: 0.3 + Math.random() * 0.4,
      vx: 0, vy: 0,
      r: 4 + Math.random() * 4,
      type: 'reductant',
      alpha: 1
    });
    redoxParticles.push({
      x: 0.65 + Math.random() * 0.2,
      y: 0.3 + Math.random() * 0.4,
      vx: 0, vy: 0,
      r: 4 + Math.random() * 4,
      type: 'oxidant',
      alpha: 1
    });
  }
  redoxAnimRunning = true;
  animateRedox();
}

function animateRedox() {
  if (!redoxAnimRunning) return;
  redoxT += 0.016;
  const c = document.getElementById('redox-canvas'); if (!c) return;
  const W = c.width, H = c.height;

  // Move particles toward center then product
  redoxParticles.forEach(p => {
    if (redoxT < 1.5) {
      // converge to center
      const tx = 0.5, ty = 0.5;
      p.x += (tx - p.x) * 0.018;
      p.y += (ty - p.y) * 0.018 + (Math.random()-0.5)*0.003;
    } else {
      // scatter as products
      if (!p.scattered) {
        p.scattered = true;
        p.vx = (Math.random()-0.5) * 0.012;
        p.vy = (Math.random()-0.5) * 0.012;
        p.type = 'product';
      }
      p.x += p.vx;
      p.y += p.vy;
      p.alpha = Math.max(0, p.alpha - 0.008);
    }
  });

  drawRedoxScene(redoxT, true);
  if (redoxT < 3) {
    redoxRAF = requestAnimationFrame(animateRedox);
  } else {
    redoxAnimRunning = false;
    drawRedoxScene(3, false);
  }
}

function drawRedoxScene(t, animating) {
  const c = document.getElementById('redox-canvas'); if (!c) return;
  ensureRedoxCanvasSize();
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const rx = redoxReactions.find(r => r.id === redoxSelectedId) || redoxReactions[0];

  // Background
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0d1b2a'); bg.addColorStop(1,'#1a2640');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  const reacted = t > 1.5;

  // Draw beakers
  drawRedoxBeaker(ctx, W*0.12, H*0.18, W*0.22, H*0.65, rx.reductantColor, rx.reductant.split(' ')[0], !reacted);
  drawRedoxBeaker(ctx, W*0.63, H*0.18, W*0.22, H*0.65, rx.oxidantColor, rx.oxidant.split(' ')[0], !reacted);
  if (reacted) {
    drawRedoxBeaker(ctx, W*0.37, H*0.28, W*0.26, H*0.55, rx.productColor, 'Sản phẩm', true);
  }

  // Electron transfer arrow
  if (animating && t > 0.3 && t < 1.5) {
    const progress = Math.min(1, (t-0.3)/1.2);
    const sx = W*0.34, sy = H*0.5;
    const ex = W*0.63, ey = H*0.5;
    const mx = sx + (ex-sx)*progress;
    ctx.save();
    ctx.strokeStyle = '#ffeb3b'; ctx.lineWidth=2.5; ctx.setLineDash([6,4]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(mx, ey); ctx.stroke();
    ctx.setLineDash([]);
    // electron ball
    ctx.fillStyle = '#ffeb3b';
    ctx.shadowBlur = 12; ctx.shadowColor = '#ffeb3b';
    ctx.beginPath(); ctx.arc(mx, ey, 6, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 11px monospace'; ctx.fillStyle='#fff'; ctx.textAlign='center';
    ctx.fillText('e⁻', mx, ey+4);
    ctx.restore();
  }

  // Arrow label
  if (!animating || t > 1.5) {
    const arrowProg = Math.min(1, Math.max(0,(t-1.5)/1.0));
    ctx.save();
    ctx.font = 'bold 12px Space Mono,monospace'; ctx.textAlign='center';
    if (reacted) {
      ctx.fillStyle = '#a5d6a7';
      ctx.fillText('✔ Phản ứng hoàn thành', W/2, H*0.92);
    } else {
      ctx.fillStyle = '#7cb9ff';
      ctx.fillText('Nhấn ⚗ PHẢN ỨNG để khởi động', W/2, H*0.92);
    }
    ctx.restore();
  }

  // Particles
  if (animating) {
    redoxParticles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      let col = p.type==='reductant' ? rx.reductantColor : p.type==='oxidant' ? rx.oxidantColor : rx.productColor;
      ctx.fillStyle = col; ctx.shadowBlur=8; ctx.shadowColor=col;
      ctx.beginPath(); ctx.arc(p.x*W, p.y*H, p.r, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });
  }

  // Title
  ctx.font = 'bold 13px Space Mono,monospace'; ctx.textAlign='left';
  ctx.fillStyle = '#7cb9ff';
  ctx.fillText(rx.equation, 12, H-10);
}

function drawRedoxBeaker(ctx, x, y, w, h, color, label, filled) {
  const wallW = 3, bot = y+h;
  ctx.save();
  // Body outline
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x, bot); ctx.lineTo(x+w, bot); ctx.lineTo(x+w, y);
  ctx.stroke();
  // Liquid fill
  if (filled) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(x+wallW, y+h*0.25, w-wallW*2, h*0.7);
    ctx.globalAlpha = 1;
  }
  // Label
  ctx.font = 'bold 11px monospace'; ctx.fillStyle='#fff'; ctx.textAlign='center';
  ctx.fillText(label, x+w/2, y-8);
  ctx.restore();
}

let redoxCanvasBound = false;
function ensureRedoxCanvasSize() {
  const c = document.getElementById('redox-canvas'); if (!c||!c.parentElement) return;
  const cssW = Math.max(280, c.parentElement.clientWidth||700);
  const cssH = Math.max(200, Math.round(cssW*(280/700)));
  c.style.height = cssH+'px';
  const dpr = window.devicePixelRatio||1;
  const nW=Math.round(cssW*dpr), nH=Math.round(cssH*dpr);
  if(c.width!==nW||c.height!==nH){c.width=nW;c.height=nH;}
  if(!redoxCanvasBound){
    redoxCanvasBound=true;
    window.addEventListener('resize',()=>{ensureRedoxCanvasSize();drawRedoxScene(redoxT,false);},{passive:true});
  }
}