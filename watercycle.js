/* ==================== VÒNG TUẦN HOÀN NƯỚC ==================== */
let waterPhase = null; // current highlighted phase
let waterAnimRAF = null, waterAnimRunning = false;
let waterAnimT = 0;
let waterLastTime = null;
let waterDt = 0;
let waterParticles = [];

const waterPhaseData = {
  evaporation: {
    name: 'Bốc hơi',
    emoji: '☀️',
    color: '#e17055',
    desc: 'Ánh sáng mặt trời cung cấp năng lượng để nước ở bề mặt đại dương, sông, hồ chuyển từ thể lỏng sang thể khí (hơi nước). Đây là bước khởi đầu của vòng tuần hoàn.',
    fact: '💡 Hàng ngày, khoảng 1.200 km³ nước bốc hơi từ bề mặt Trái Đất!'
  },
  condensation: {
    name: 'Ngưng tụ',
    emoji: '☁️',
    color: '#74b9ff',
    desc: 'Hơi nước bốc lên cao gặp nhiệt độ thấp, ngưng tụ thành các giọt nước li ti tạo thành mây. Mây trắng là hơi nước ngưng tụ ở cao độ thấp; mây xám thì chứa nhiều nước hơn.',
    fact: '💡 Một đám mây tích lũy hàng nghìn tấn nước trước khi đổ mưa!'
  },
  precipitation: {
    name: 'Mưa / Tuyết',
    emoji: '🌧️',
    color: '#0984e3',
    desc: 'Khi các giọt nước trong mây lớn dần và nặng hơn, chúng rơi xuống dưới dạng mưa, tuyết hoặc mưa đá tùy theo nhiệt độ. Đây là nguồn cấp nước ngọt chính cho đất liền.',
    fact: '💡 Trung bình mỗi năm Trái Đất nhận khoảng 505.000 km³ lượng mưa!'
  },
  runoff: {
    name: 'Dòng chảy',
    emoji: '🏞️',
    color: '#00b894',
    desc: 'Nước mưa chảy trên bề mặt đất thành suối, sông rồi đổ ra biển. Một phần thấm xuống lòng đất trở thành nước ngầm. Cây cối hấp thụ nước qua rễ và thoát hơi qua lá (thoát hơi nước).',
    fact: '💡 Rừng Amazon "tái chế" tới 50-70% lượng mưa qua quá trình thoát hơi nước!'
  }
};

function initWaterCycle() {
  waterPhase = null;
  waterParticles = [];
  waterAnimRunning = false;
  waterLastTime = null;
  cancelAnimationFrame(waterAnimRAF);
  drawWaterCycleScene(null);
  renderWaterPhaseInfo(null);
  document.querySelectorAll('.water-phase-btn').forEach(b => b.classList.remove('active'));
}

function selectWaterPhase(phase) {
  waterPhase = (waterPhase === phase) ? null : phase;
  drawWaterCycleScene(waterPhase);
  renderWaterPhaseInfo(waterPhase);

  document.querySelectorAll('.water-phase-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-phase') === waterPhase);
  });
  if (waterPhase) animateWaterPhase(waterPhase);
  else {
    waterAnimRunning = false;
    cancelAnimationFrame(waterAnimRAF);
  }
}

function renderWaterPhaseInfo(phase) {
  const el = document.getElementById('water-phase-info');
  if (!el) return;
  if (!phase) {
    el.innerHTML = '<p class="water-hint">👆 Nhấn vào một giai đoạn để xem giải thích chi tiết và hiệu ứng động.</p>';
    return;
  }
  const d = waterPhaseData[phase];
  el.innerHTML = `
    <div class="water-info-card" style="border-left:4px solid ${d.color}">
      <div class="water-info-title">${d.emoji} ${d.name}</div>
      <p>${d.desc}</p>
      <div class="water-fun-fact">${d.fact}</div>
    </div>`;
}

function animateWaterPhase(phase) {
  waterParticles = [];
  cancelAnimationFrame(waterAnimRAF);
  waterAnimT = 0;
  waterLastTime = null;
  const n = 18;
  for (let i = 0; i < n; i++) {
    waterParticles.push(createWaterParticle(phase, i, n));
  }
  waterAnimRunning = true;
  requestAnimationFrame(waterAnimLoop);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function quadBezier(p0, p1, p2, t) {
  const x = lerp(lerp(p0.x, p1.x, t), lerp(p1.x, p2.x, t), t);
  const y = lerp(lerp(p0.y, p1.y, t), lerp(p1.y, p2.y, t), t);
  return { x, y };
}

function createWaterParticle(phase, idx, total) {
  const c = document.getElementById('water-canvas');
  const W = c ? c.width : 700, H = c ? c.height : 380;
  const spread = (idx / total);
  const baseSize = 3 + Math.random() * 2.5;
  const speed = phase === 'precipitation' ? (0.55 + Math.random() * 0.35)
    : phase === 'condensation' ? (0.20 + Math.random() * 0.12)
      : (0.35 + Math.random() * 0.25);

  // Mỗi giai đoạn: cho hạt chạy theo "đường đi" tương ứng để logic hơn
  return {
    t: Math.random(),
    tOffset: spread,
    speed,
    alpha: 0.95,
    size: baseSize,
    phase,
    x: W * 0.1,
    y: H * 0.7,
    wobble: Math.random() * Math.PI * 2
  };
}

function waterAnimLoop(ts) {
  if (!waterAnimRunning) return;
  if (waterLastTime == null) waterLastTime = ts;
  const dt = clamp((ts - waterLastTime) / 1000, 0, 0.05);
  waterLastTime = ts;
  waterDt = dt;
  waterAnimT += dt;
  drawWaterCycleScene(waterPhase, true);

  // Respawn particles
  if (waterPhase) {
    const dead = waterParticles.filter(p => p.alpha <= 0).length;
    for (let i = 0; i < dead; i++) {
      waterParticles.push(createWaterParticle(waterPhase, Math.random() * 18 | 0, 18));
    }
  }
  waterAnimRAF = requestAnimationFrame(waterAnimLoop);
}

function drawWaterCycleScene(activePhase, withParticles) {
  const c = document.getElementById('water-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  // ---- Sky ----
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  sky.addColorStop(0, '#1a6891'); sky.addColorStop(0.5, '#5ba3c9'); sky.addColorStop(1, '#87ceeb');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.65);

  // ---- Sun ----
  const sunAlpha = activePhase === 'evaporation' ? 1 : 0.75;
  ctx.save();
  ctx.globalAlpha = sunAlpha;
  const sunGrad = ctx.createRadialGradient(W * 0.88, H * 0.1, 4, W * 0.88, H * 0.1, 34);
  sunGrad.addColorStop(0, '#ffe082'); sunGrad.addColorStop(0.6, '#fdd835'); sunGrad.addColorStop(1, 'rgba(253,216,53,0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(W * 0.88, H * 0.1, 34, 0, Math.PI * 2); ctx.fill();
  if (activePhase === 'evaporation') {
    ctx.strokeStyle = '#fdd835'; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(W * 0.88 + Math.cos(a) * 38, H * 0.1 + Math.sin(a) * 38);
      ctx.lineTo(W * 0.88 + Math.cos(a) * 50, H * 0.1 + Math.sin(a) * 50); ctx.stroke();
    }
  }
  ctx.restore();

  // ---- Mountains ----
  ctx.fillStyle = '#5d6d7e';
  ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.65); ctx.lineTo(W * 0.62, H * 0.28); ctx.lineTo(W * 0.74, H * 0.65); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#718096';
  ctx.beginPath(); ctx.moveTo(W * 0.58, H * 0.65); ctx.lineTo(W * 0.68, H * 0.34); ctx.lineTo(W * 0.78, H * 0.65); ctx.closePath(); ctx.fill();
  // Snow cap
  ctx.fillStyle = '#ecf0f1';
  ctx.beginPath(); ctx.moveTo(W * 0.62, H * 0.28); ctx.lineTo(W * 0.57, H * 0.38); ctx.lineTo(W * 0.67, H * 0.38); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(W * 0.68, H * 0.34); ctx.lineTo(W * 0.64, H * 0.43); ctx.lineTo(W * 0.72, H * 0.43); ctx.closePath(); ctx.fill();

  // ---- Ground ----
  const ground = ctx.createLinearGradient(0, H * 0.65, 0, H);
  ground.addColorStop(0, '#4e9e5f'); ground.addColorStop(0.2, '#3a7d44'); ground.addColorStop(1, '#2d6a3c');
  ctx.fillStyle = ground; ctx.fillRect(0, H * 0.65, W, H * 0.35);

  // ---- Ocean / River ----
  const waterGrad = ctx.createLinearGradient(0, H * 0.65, 0, H);
  waterGrad.addColorStop(0, activePhase === 'evaporation' ? '#1e88e5' : '#0d47a1');
  waterGrad.addColorStop(1, '#0a2855');
  ctx.fillStyle = waterGrad;
  ctx.beginPath(); ctx.moveTo(0, H * 0.67);
  ctx.quadraticCurveTo(W * 0.12, H * 0.64, W * 0.25, H * 0.67);
  ctx.lineTo(W * 0.25, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
  if (activePhase === 'evaporation') {
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(W * 0.02 + i * W * 0.04, H * 0.70 + i * 4);
      ctx.quadraticCurveTo(W * 0.05 + i * W * 0.04, H * 0.695 + i * 4, W * 0.08 + i * W * 0.04, H * 0.70 + i * 4);
      ctx.stroke();
    }
  }

  // River from mountain
  ctx.strokeStyle = '#1e88e5'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(W * 0.63, H * 0.52);
  ctx.quadraticCurveTo(W * 0.48, H * 0.60, W * 0.30, H * 0.66); ctx.stroke();
  ctx.strokeStyle = 'rgba(100,181,246,0.5)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W * 0.63, H * 0.52);
  ctx.quadraticCurveTo(W * 0.48, H * 0.60, W * 0.30, H * 0.66); ctx.stroke();

  // ---- Trees ----
  function drawTree(tx, ty, h, c1, c2) {
    ctx.fillStyle = '#5d4037';
    ctx.fillRect(tx - 3, ty - h * 0.25, 6, h * 0.25);
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.moveTo(tx, ty - h); ctx.lineTo(tx - h * 0.35, ty - h * 0.25); ctx.lineTo(tx + h * 0.35, ty - h * 0.25); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c2;
    ctx.beginPath(); ctx.moveTo(tx, ty - h * 0.85); ctx.lineTo(tx - h * 0.28, ty - h * 0.2); ctx.lineTo(tx + h * 0.28, ty - h * 0.2); ctx.closePath(); ctx.fill();
  }
  const trees = [
    [W * 0.82, H * 0.67, 42, '#2e7d32', '#388e3c'],
    [W * 0.87, H * 0.67, 36, '#1b5e20', '#2e7d32'],
    [W * 0.76, H * 0.67, 38, '#33691e', '#558b2f'],
    [W * 0.91, H * 0.67, 44, '#2e7d32', '#43a047'],
    [W * 0.34, H * 0.67, 32, '#1b5e20', '#2e7d32'],
    [W * 0.40, H * 0.67, 36, '#2e7d32', '#388e3c']
  ];
  trees.forEach(([tx, ty, th, c1, c2]) => drawTree(tx, ty, th, c1, c2));

  // ---- Clouds ----
  function drawCloud(cx2, cy2, r, alpha, isActive) {
    ctx.save(); ctx.globalAlpha = alpha;
    const cColor = isActive ? '#b0c4de' : '#cfd8dc';
    ctx.fillStyle = cColor;
    [[0,0],[r*0.7,-r*0.2],[r*-0.7,-r*0.15],[r*1.2,r*0.1],[r*-1.2,r*0.05],[r*0.3,-r*0.35]].forEach(([dx,dy]) => {
      ctx.beginPath(); ctx.arc(cx2 + dx, cy2 + dy, r * (Math.abs(dx) < 0.1 ? 1 : 0.72), 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }
  const cloudActive = activePhase === 'condensation' || activePhase === 'precipitation';
  drawCloud(W * 0.45, H * 0.16, 28, cloudActive ? 1 : 0.6, cloudActive);
  drawCloud(W * 0.35, H * 0.22, 22, 0.7, false);
  drawCloud(W * 0.56, H * 0.2, 24, cloudActive ? 0.9 : 0.5, cloudActive);

  // ---- Phase arrows (đơn giản, ít hiệu ứng) ----
  function drawSimpleArrow(p0, p1, p2, color, label, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
    ctx.stroke();

    // arrow head theo tiếp tuyến cuối đường
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = dx / len, ny = dy / len;
    const head = 10;
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(p2.x - nx * head + ny * (head * 0.6), p2.y - ny * head - nx * (head * 0.6));
    ctx.lineTo(p2.x - nx * head - ny * (head * 0.6), p2.y - ny * head + nx * (head * 0.6));
    ctx.closePath();
    ctx.fill();

    // label đơn giản
    ctx.font = '800 11px Nunito,sans-serif';
    ctx.textAlign = 'center';
    const mx = (p0.x + p2.x) / 2 + (p1.x - (p0.x + p2.x) / 2) * 0.25;
    const my = (p0.y + p2.y) / 2 + (p1.y - (p0.y + p2.y) / 2) * 0.25 - 8;
    ctx.fillText(label, mx, my);
    ctx.restore();
  }

  const phases = {
    evaporation: { al: activePhase === 'evaporation' ? 1 : 0.4, color: '#e17055' },
    condensation: { al: activePhase === 'condensation' ? 1 : 0.4, color: '#74b9ff' },
    precipitation: { al: activePhase === 'precipitation' ? 1 : 0.4, color: '#0984e3' },
    runoff: { al: activePhase === 'runoff' ? 1 : 0.4, color: '#00b894' }
  };

  // các điểm chính (đồng bộ với hướng di chuyển của hạt)
  const evapP0 = { x: W * 0.14, y: H * 0.67 };
  const evapP1 = { x: W * 0.18, y: H * 0.44 };
  const evapP2 = { x: W * 0.44, y: H * 0.20 };

  const condP0 = { x: W * 0.44, y: H * 0.20 };
  const condP1 = { x: W * 0.48, y: H * 0.12 };
  const condP2 = { x: W * 0.54, y: H * 0.18 };

  const rainP0 = { x: W * 0.52, y: H * 0.20 };
  const rainP1 = { x: W * 0.58, y: H * 0.30 };
  const rainP2 = { x: W * 0.62, y: H * 0.52 };

  const runP0 = { x: W * 0.62, y: H * 0.52 };
  const runP1 = { x: W * 0.46, y: H * 0.62 };
  const runP2 = { x: W * 0.20, y: H * 0.68 };

  drawSimpleArrow(evapP0, evapP1, evapP2, phases.evaporation.color, 'Bốc hơi', phases.evaporation.al);
  drawSimpleArrow(condP0, condP1, condP2, phases.condensation.color, 'Ngưng tụ', phases.condensation.al);
  drawSimpleArrow(rainP0, rainP1, rainP2, phases.precipitation.color, 'Mưa', phases.precipitation.al);
  drawSimpleArrow(runP0, runP1, runP2, phases.runoff.color, 'Dòng chảy', phases.runoff.al);

  // ---- Particles ----
  if (withParticles && waterParticles.length) {
    waterParticles.forEach(p => {
      // cập nhật vị trí theo giai đoạn
      const k = clamp(waterDt * 60, 0, 2); // quy đổi về "đơn vị frame" ~60fps
      p.t += p.speed * waterDt;
      if (p.t > 1) { p.t = 0; p.alpha = 0.95; }

      if (activePhase === 'evaporation') {
        const t = clamp(p.t, 0, 1);
        const pos = quadBezier(evapP0, evapP1, evapP2, t);
        p.x = pos.x + Math.sin(waterAnimT * 3 + p.wobble) * 6;
        p.y = pos.y + Math.cos(waterAnimT * 2 + p.wobble) * 4;
        p.alpha -= 0.006 * k;
      } else if (activePhase === 'condensation') {
        // lượn nhẹ trong vùng mây
        const cx = W * 0.47, cy = H * 0.18;
        const r = 26 + (p.tOffset * 10);
        p.x = cx + Math.cos(waterAnimT * 1.6 + p.wobble) * r * 0.6;
        p.y = cy + Math.sin(waterAnimT * 1.4 + p.wobble) * r * 0.35;
        p.alpha -= 0.003 * k;
      } else if (activePhase === 'precipitation') {
        const t = clamp(p.t, 0, 1);
        const pos = quadBezier(rainP0, rainP1, rainP2, t);
        p.x = pos.x + (Math.random() - 0.5) * 3;
        p.y = pos.y + t * 8; // rơi nhanh hơn về cuối
        p.alpha -= 0.010 * k;
      } else if (activePhase === 'runoff') {
        const t = clamp(p.t, 0, 1);
        const pos = quadBezier(runP0, runP1, runP2, t);
        p.x = pos.x + Math.sin(waterAnimT * 2.2 + p.wobble) * 3;
        p.y = pos.y + Math.cos(waterAnimT * 1.8 + p.wobble) * 2;
        p.alpha -= 0.006 * k;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = activePhase === 'evaporation' ? '#ffe082'
        : activePhase === 'condensation' ? '#b0c4de'
          : activePhase === 'precipitation' ? '#74b9ff'
            : '#00cec9';
      ctx.shadowBlur = 4; ctx.shadowColor = ctx.fillStyle;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    });
    waterParticles = waterParticles.filter(p => p.alpha > 0);
  }

  // ---- Labels for landmarks ----
  ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.font = 'bold 10px Nunito,sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('🌊 Đại dương', W * 0.12, H * 0.82);
  ctx.fillText('⛰️ Núi cao', W * 0.63, H * 0.68);
  ctx.fillText('🌳 Rừng cây', W * 0.85, H * 0.78);
}
