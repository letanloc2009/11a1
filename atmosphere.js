/* ==================== KHÍ ÁP & GIÓ ==================== */
let atmRunning = false;
let atmRAF = null;
let atmT = 0;
let atmLastTime = null;
let atmParticles = [];

function initAtmosphere() {
  resetAtmosphere();
}

function resetAtmosphere() {
  atmRunning = false;
  cancelAnimationFrame(atmRAF);
  atmT = 0;
  atmLastTime = null;
  initAtmParticles();
  drawAtmosphere(0);
  const btn = document.getElementById('atm-btn');
  if (btn) btn.textContent = '▶ CHẠY';
  updateAtmInfo(0.5);
}

function initAtmParticles() {
  atmParticles = [];
  for (let i = 0; i < 80; i++) {
    atmParticles.push({
      lat: Math.random(), // 0=south pole, 1=north pole
      lon: Math.random(),
      speed: 0.002 + Math.random()*0.003,
      size: 2 + Math.random()*2,
      alpha: 0.4 + Math.random()*0.5
    });
  }
}

function toggleAtmosphere() {
  const btn = document.getElementById('atm-btn');
  atmRunning = !atmRunning;
  if (btn) btn.textContent = atmRunning ? '⏸ DỪNG' : '▶ CHẠY';
  if (atmRunning) {
    atmLastTime = null;
    requestAnimationFrame(atmLoop);
  } else {
    cancelAnimationFrame(atmRAF);
  }
}

function atmLoop(ts) {
  if (!atmRunning) return;
  if (!atmLastTime) atmLastTime = ts;
  const dt = Math.min((ts - atmLastTime)/1000, 0.05);
  atmLastTime = ts;
  atmT += dt;

  // Move particles according to their latitude zone
  atmParticles.forEach(p => {
    const windDir = getWindDirection(p.lat);
    p.lon += windDir * p.speed * dt;
    p.lon = ((p.lon % 1) + 1) % 1;
    // Slight meridional drift (Hadley cells)
    const meridDrift = getMeridionalDrift(p.lat);
    p.lat += meridDrift * p.speed * dt * 0.3;
    p.lat = Math.max(0.02, Math.min(0.98, p.lat));
  });

  drawAtmosphere(atmT);
  atmRAF = requestAnimationFrame(atmLoop);
}

// Returns westward(-) or eastward(+) wind velocity by latitude (0=S.Pole, 1=N.Pole, 0.5=equator)
function getWindDirection(lat) {
  const mode = document.getElementById('atm-mode').value;
  if (mode === 'coriolis') {
    // Northern hemisphere deflects right (eastward), southern left (westward)
    return (lat > 0.5) ? 1.5 : -1.5;
  }
  // Standard cell structure
  // Equator (lat~0.5): converging -> near-zero mean lon wind but show Hadley
  if (lat > 0.5) { // Northern hemisphere
    const nlat = (lat - 0.5) * 2; // 0 at equator, 1 at N.Pole
    if (nlat < 0.33) return -1;  // Tín phong NE (trade winds) - westward
    if (nlat < 0.67) return 1.5;  // Gió Tây
    return -0.8;  // Gió Đông cực
  } else {
    const slat = (0.5 - lat) * 2; // 0 at equator, 1 at S.Pole
    if (slat < 0.33) return 1;  // Trade winds SE
    if (slat < 0.67) return -1.5; // Westerlies
    return 0.8;  // Polar easterlies
  }
}

function getMeridionalDrift(lat) {
  // Hadley cell: rises at equator, sinks at 30°, rises at 60°, sinks at poles
  if (lat > 0.5) {
    const n = (lat-0.5)*2;
    if (n < 0.3) return 0.1; // poleward in Hadley
    if (n < 0.5) return -0.1; // equatorward in Ferrel (lower branch)
    if (n < 0.7) return 0.08; // poleward Ferrel
    return -0.06; // polar
  } else {
    const s = (0.5-lat)*2;
    if (s < 0.3) return -0.1;
    if (s < 0.5) return 0.1;
    if (s < 0.7) return -0.08;
    return 0.06;
  }
}

function updateAtmInfo(lat) {
  // lat 0=south pole, 1=north pole, 0.5=equator
  const deg = Math.round((lat - 0.5) * 180); // -90 to +90
  const absDeg = Math.abs(deg);
  let wind = '', pressure = '', climate = '';
  if (absDeg < 10) { wind='Tín phong (Doldrums/ITCZ)'; pressure='Low 1008 hPa'; climate='Nhiệt đới ẩm, mưa nhiều'; }
  else if (absDeg < 35) { wind='Tín phong (Trade winds)'; pressure='High 1020 hPa'; climate='Bán khô hạn, nhiều nắng'; }
  else if (absDeg < 60) { wind='Gió Tây (Westerlies)'; pressure='Low 1000 hPa'; climate='Ôn đới, bốn mùa rõ rệt'; }
  else { wind='Gió Đông cực'; pressure='High 1030 hPa'; climate='Cực và cận cực, băng tuyết'; }

  const el = id => document.getElementById(id);
  if (el('atm-lat')) el('atm-lat').textContent = (deg >= 0 ? deg+'°B' : Math.abs(deg)+'°N');
  if (el('atm-wind')) el('atm-wind').textContent = wind;
  if (el('atm-pressure')) el('atm-pressure').innerHTML = pressure.split(' ')[1] + '<span class="dc-unit">hPa</span>';
  if (el('atm-climate')) el('atm-climate').textContent = climate;
}

function drawAtmosphere(t) {
  const c = document.getElementById('atm-canvas'); if (!c) return;
  ensureAtmCanvasSize();
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  const mode = document.getElementById('atm-mode').value;

  ctx.clearRect(0,0,W,H);

  // Background - globe projection (rectangular)
  const bg = ctx.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,'#0b132b'); bg.addColorStop(1,'#0d2b4e');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

  // Latitude zone bands (colored by pressure/cell type)
  const zones = [
    { from:0.0, to:0.1, color:'rgba(100,200,100,0.12)', label:'Cực Nam', labPos:0.05 },
    { from:0.1, to:0.23, color:'rgba(200,200,255,0.12)', label:'Gió Đông cực', labPos:0.17 },
    { from:0.23, to:0.4, color:'rgba(255,220,100,0.10)', label:'Gió Tây', labPos:0.32 },
    { from:0.4, to:0.6, color:'rgba(255,150,50,0.12)', label:'Xích đạo ITCZ', labPos:0.5 },
    { from:0.6, to:0.77, color:'rgba(255,220,100,0.10)', label:'Gió Tây', labPos:0.68 },
    { from:0.77, to:0.9, color:'rgba(200,200,255,0.12)', label:'Gió Đông cực', labPos:0.83 },
    { from:0.9, to:1.0, color:'rgba(100,200,100,0.12)', label:'Cực Bắc', labPos:0.95 }
  ];

  zones.forEach(z => {
    const y1 = H*(1-z.to), y2 = H*(1-z.from);
    ctx.fillStyle = z.color;
    ctx.fillRect(0, y1, W, y2-y1);
    if (mode === 'cells' || mode === 'pressure') {
      ctx.fillStyle='rgba(255,255,255,0.25)';
      ctx.font='10px monospace'; ctx.textAlign='right';
      ctx.fillText(z.label, W-6, (y1+y2)/2+4);
    }
  });

  // Latitude lines
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = H * (0.5 - lat/180);
    ctx.strokeStyle = Math.abs(lat)===0 ? 'rgba(255,150,50,0.5)' : 'rgba(255,255,255,0.1)';
    ctx.lineWidth = Math.abs(lat)===0 ? 2 : 1;
    ctx.setLineDash(Math.abs(lat)===0 ? [] : [4,6]);
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.font='9px monospace'; ctx.textAlign='left';
    ctx.fillText(lat>0?lat+'°B':lat<0?Math.abs(lat)+'°N':'0°', 4, y-3);
  }

  // Wind arrows (static pattern)
  if (mode === 'cells' || mode === 'coriolis') {
    drawWindArrows(ctx, W, H, t);
  } else if (mode === 'pressure') {
    drawPressureBands(ctx, W, H);
  }

  // Moving particles
  atmParticles.forEach(p => {
    const px = p.lon * W;
    const py = H * (1 - p.lat);
    const color = getWindColor(p.lat);
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = color;
    ctx.shadowBlur = 4; ctx.shadowColor = color;
    ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // Labels
  ctx.fillStyle='#74b9ff'; ctx.font='bold 10px monospace'; ctx.textAlign='center';
  ctx.fillText('N', W/2, 14);
  ctx.fillStyle='#74b9ff'; ctx.fillText('S', W/2, H-4);
}

function drawWindArrows(ctx, W, H, t) {
  const latBands = [
    {lat:0.05, label:'Gió Đông cực (S)', dir:-1, color:'#90caf9'},
    {lat:0.17, label:'Gió Tây (S)', dir:1, color:'#a5d6a7'},
    {lat:0.33, label:'Tín phong SE', dir:1, color:'#ffe082'},
    {lat:0.5,  label:'ITCZ', dir:0, color:'#ef9a9a'},
    {lat:0.67, label:'Tín phong NE', dir:-1, color:'#ffe082'},
    {lat:0.83, label:'Gió Tây (N)', dir:-1, color:'#a5d6a7'},
    {lat:0.95, label:'Gió Đông cực (N)', dir:1, color:'#90caf9'},
  ];

  latBands.forEach(b => {
    const y = H*(1-b.lat);
    const aCount = 6;
    for (let i = 0; i < aCount; i++) {
      const baseX = (i/aCount + (b.dir * t * 0.04)) % 1;
      const ax = ((baseX + 1) % 1) * W;
      drawArrow(ctx, ax, y, b.dir, b.color, 18);
    }
  });
}

function drawArrow(ctx, x, y, dir, color, size) {
  if (dir === 0) return;
  ctx.save();
  ctx.fillStyle = color; ctx.strokeStyle = color; ctx.lineWidth=1.5;
  ctx.globalAlpha = 0.7;
  ctx.translate(x, y);
  ctx.scale(dir > 0 ? 1 : -1, 1);
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(-size, -size*0.35);
  ctx.lineTo(-size*0.6, 0);
  ctx.lineTo(-size, size*0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPressureBands(ctx, W, H) {
  const bands = [
    {lat:0.0, label:'HIGH – Cực cao áp', color:'#1565c0'},
    {lat:0.17, label:'LOW – Ôn đới thấp áp', color:'#c62828'},
    {lat:0.33, label:'HIGH – Chí tuyến cao áp', color:'#1565c0'},
    {lat:0.5,  label:'LOW – Xích đạo thấp áp (ITCZ)', color:'#c62828'},
    {lat:0.67, label:'HIGH – Chí tuyến cao áp', color:'#1565c0'},
    {lat:0.83, label:'LOW – Ôn đới thấp áp', color:'#c62828'},
    {lat:1.0,  label:'HIGH – Cực cao áp', color:'#1565c0'},
  ];

  bands.forEach(b => {
    const y = H*(1-b.lat);
    ctx.save();
    ctx.strokeStyle = b.color; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke();
    ctx.fillStyle = b.color; ctx.font='bold 10px monospace'; ctx.textAlign='center';
    ctx.fillText(b.label, W*0.5, y > H*0.1 ? y-6 : y+14);
    ctx.restore();
  });
}

function getWindColor(lat) {
  if (lat < 0.17 || lat > 0.83) return '#90caf9'; // polar
  if (lat < 0.33 || lat > 0.67) return '#a5d6a7'; // westerlies
  if (lat < 0.45 || lat > 0.55) return '#ffe082'; // trade
  return '#ef9a9a'; // equatorial
}

let atmCanvasBound = false;
function ensureAtmCanvasSize() {
  const c = document.getElementById('atm-canvas'); if(!c||!c.parentElement) return;
  const cssW = Math.max(280, c.parentElement.clientWidth||700);
  const cssH = Math.max(220, Math.round(cssW*(320/700)));
  c.style.height = cssH+'px';
  const dpr=window.devicePixelRatio||1;
  const nW=Math.round(cssW*dpr), nH=Math.round(cssH*dpr);
  if(c.width!==nW||c.height!==nH){c.width=nW;c.height=nH;}
  if(!atmCanvasBound){
    atmCanvasBound=true;
    window.addEventListener('resize',()=>{ensureAtmCanvasSize();drawAtmosphere(atmT);},{passive:true});
  }
}