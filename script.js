/* ── NAV ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event && event.target && event.target.classList.add('active');
  const labels = {
    home:'Trang chủ', motion:'Vận tốc – Quãng đường', wave:'Sóng cơ học',
    optics:'Quang học', circuit:'Mạch điện', acidbase:'Axit–Bazơ',
    electrolysis:'Điện phân', reaction:'Phản ứng oxi hóa', cell:'Tế bào',
    mitosis:'Phân bào', photosynthesis:'Quang hợp'
  };
  document.getElementById('status-page').textContent = labels[id] || id;
  if (id === 'motion') { updateMotionParam(); drawMotionFrame(); drawGraph(); }
  if (id === 'cell') { initCell(); }
}

function toggleSubject(el) {
  const items = el.nextElementSibling;
  const arrow = el.querySelector('.arrow');
  items.classList.toggle('open');
  arrow.classList.toggle('open');
}

/* ── MOTION ── */
let motionRunning = false, motionRAF = null, motionT = 0;
let mV0 = 10, mA = 2, mTmax = 10, mSmax = 1;
let graphHistory = [];

/* --- INPUT FIELDS TOGGLE --- */
function updateInputFields() {
  const target = document.getElementById('calc-target').value;
  document.getElementById('s-group').style.display = target === 's' ? 'none' : 'block';
  document.getElementById('v-group').style.display = target === 'v' ? 'none' : 'block';
  document.getElementById('t-group').style.display = target === 't' ? 'none' : 'block';
}

/* --- CALCULATE THEN RUN SIMULATION --- */
function calcAndRun() {
  const target = document.getElementById('calc-target').value;
  mV0 = parseFloat(document.getElementById('v0-input').value) || 0;
  mA  = parseFloat(document.getElementById('a-input').value) || 0;
  const tIn = parseFloat(document.getElementById('t-input').value) || 0;
  const vIn = parseFloat(document.getElementById('v-input').value) || 0;
  const sIn = parseFloat(document.getElementById('s-input').value) || 0;

  let calcResult, calcLabel;

  if (target === 's') {
    // biết v0, a, t → tính s
    mTmax = tIn;
    const s = mV0 * tIn + 0.5 * mA * tIn * tIn;
    calcResult = s;
    calcLabel = 's = ' + s.toFixed(2) + ' m';
    document.getElementById('s-input').value = s.toFixed(2);
  } else if (target === 'v') {
    // biết v0, a, t → tính v cuối
    mTmax = tIn;
    const v = mV0 + mA * tIn;
    calcResult = v;
    calcLabel = 'v = ' + v.toFixed(2) + ' m/s';
    document.getElementById('v-input').value = v.toFixed(2);
  } else if (target === 't') {
    // biết v0, a, v cuối → tính t
    if (Math.abs(mA) > 0.001) {
      const t = (vIn - mV0) / mA;
      calcResult = t;
      mTmax = Math.max(t, 1);
      calcLabel = 't = ' + t.toFixed(2) + ' s';
      document.getElementById('t-input').value = t.toFixed(2);
    } else {
      // a=0: dùng s/v0
      const t = mV0 > 0 ? sIn / mV0 : 0;
      calcResult = t;
      mTmax = Math.max(t, 1);
      document.getElementById('t-input').value = t.toFixed(2);
    }
  }

  // cập nhật ô kết quả
  document.getElementById('m-acc').innerHTML = mA.toFixed(2) + '<span class="dc-unit">m/s²</span>';

  // reset rồi chạy mô phỏng
  motionRunning = false;
  cancelAnimationFrame(motionRAF);
  motionT = 0; graphHistory = []; lastMotionTime = null;
  mSmax = Math.max(mV0 * mTmax + 0.5 * mA * mTmax * mTmax, 1);
  drawMotionFrame(mV0, 0);
  drawGraph();

  // tự động chạy
  setTimeout(() => {
    motionRunning = true;
    document.getElementById('motion-btn').textContent = '⏸ Dừng';
    requestAnimationFrame(motionLoop);
  }, 300);
}

function toggleMotion() {
  motionRunning = !motionRunning;
  document.getElementById('motion-btn').textContent = motionRunning ? '⏸ Dừng' : '▶ Tiếp tục';
  if (motionRunning) { lastMotionTime = null; requestAnimationFrame(motionLoop); }
  else cancelAnimationFrame(motionRAF);
}

function resetMotion() {
  motionRunning = false;
  cancelAnimationFrame(motionRAF);
  motionT = 0; graphHistory = []; lastMotionTime = null;
  document.getElementById('motion-btn').textContent = '▶ Khởi động';
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
    document.getElementById('motion-btn').textContent = '▶ Khởi động';
    lastMotionTime = null;
    drawMotionFrame(Math.max(0,v), s);
    drawGraph();
    document.getElementById('m-time').innerHTML = motionT.toFixed(2) + '<span class="dc-unit">s</span>';
    document.getElementById('m-vel').innerHTML = Math.max(0,v).toFixed(2) + '<span class="dc-unit">m/s</span>';
    document.getElementById('m-dist').innerHTML = s.toFixed(2) + '<span class="dc-unit">m</span>';
    return;
  }

  graphHistory.push({ t: motionT, v: Math.max(0, v), s });
  drawMotionFrame(Math.max(0,v), s);
  drawGraph();

  document.getElementById('m-time').innerHTML = motionT.toFixed(2) + '<span class="dc-unit">s</span>';
  document.getElementById('m-vel').innerHTML = Math.max(0,v).toFixed(2) + '<span class="dc-unit">m/s</span>';
  document.getElementById('m-dist').innerHTML = s.toFixed(2) + '<span class="dc-unit">m</span>';

  if (motionRunning) motionRAF = requestAnimationFrame(motionLoop);
  else lastMotionTime = null;
}

function drawMotionFrame(v, s) {
  const c = document.getElementById('motion-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  /*ctx.fillStyle = '#0d0d0d'; */
  ctx.fillStyle = '#d4f1c5';
  ctx.fillRect(0, 0, W, H);

  // road
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(0, H*0.55, W, H*0.3);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, H*0.55); ctx.lineTo(W, H*0.55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H*0.85); ctx.lineTo(W, H*0.85); ctx.stroke();

  // dashed center line
  ctx.strokeStyle = '#fdcb6e55'; ctx.lineWidth = 2; ctx.setLineDash([20,15]);
  ctx.beginPath(); ctx.moveTo(0, H*0.7); ctx.lineTo(W, H*0.7); ctx.stroke();
  ctx.setLineDash([]);

  // distance markers
  const sMax = mSmax > 1 ? mSmax : Math.max(mV0 * mTmax + 0.5 * mA * mTmax * mTmax, 1);
  for (let i = 0; i <= 5; i++) {
    const x = (i / 5) * W;
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, H*0.54); ctx.lineTo(x, H*0.86); ctx.stroke();
    ctx.fillStyle = '#555'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText((sMax * i / 5).toFixed(0) + 'm', x, H*0.92);
  }

  // car position
  const curS = s !== undefined ? s : 0;
  const carX = Math.min((curS / Math.max(sMax, 1)) * W, W - 60);
  const carY = H * 0.58;
  const cw = 60, ch = 28;

  // car body
  ctx.shadowBlur = 12; ctx.shadowColor = '#d63031';
  ctx.fillStyle = '#2d3436';
  ctx.fillRect(carX, carY, cw, ch);
  ctx.shadowBlur = 0;

  // car top
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(carX + 10, carY - 14, cw - 20, 16);

  // windows
  ctx.fillStyle = '#74b9ff88';
  ctx.fillRect(carX + 13, carY - 12, 14, 12);
  ctx.fillRect(carX + 30, carY - 12, 14, 12);

  // wheels
  [carX + 12, carX + cw - 14].forEach(wx => {
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(wx, carY + ch, 9, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(wx, carY + ch, 9, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#555'; ctx.beginPath(); ctx.arc(wx, carY + ch, 4, 0, Math.PI*2); ctx.fill();
  });

  // velocity arrow
  if (v !== undefined && v > 0) {
    const arrowLen = Math.min(v * 3, 120);
    const ax = carX + cw, ay = carY + ch/2;
    ctx.strokeStyle = '#00b894'; ctx.lineWidth = 3;
    ctx.shadowBlur = 6; ctx.shadowColor = '#00b894';
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + arrowLen, ay); ctx.stroke();
    ctx.fillStyle = '#00b894';
    ctx.beginPath(); ctx.moveTo(ax+arrowLen+8, ay); ctx.lineTo(ax+arrowLen-6, ay-5); ctx.lineTo(ax+arrowLen-6, ay+5); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00b894'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'left';
    ctx.fillText('v = ' + v.toFixed(1) + ' m/s', ax + arrowLen + 12, ay + 4);
  }
}

function drawGraph() {
  const c = document.getElementById('graph-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#080808'; ctx.fillRect(0, 0, W, H);

  const pad = { l:48, r:16, t:12, b:24 };
  const gW = W - pad.l - pad.r, gH = H - pad.t - pad.b;

  // axes
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, pad.t+gH); ctx.lineTo(pad.l+gW, pad.t+gH); ctx.stroke();

  if (graphHistory.length < 2) return;
  const maxV = Math.max(...graphHistory.map(p=>p.v), 1);
  const maxT = mTmax;

  // v-t line (red)
  ctx.strokeStyle = '#d63031'; ctx.lineWidth = 2;
  ctx.beginPath();
  graphHistory.forEach((p, i) => {
    const x = pad.l + (p.t / maxT) * gW;
    const y = pad.t + gH - (p.v / maxV) * gH;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // labels
  ctx.fillStyle = '#d63031'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
  ctx.fillText('v(t)', pad.l + 4, pad.t + 12);
  ctx.fillStyle = '#555'; ctx.textAlign = 'center';
  ctx.fillText(maxT.toFixed(0)+'s', pad.l + gW, pad.t + gH + 16);
  ctx.textAlign = 'right';
  ctx.fillText(maxV.toFixed(0), pad.l - 4, pad.t + 10);
}

// init motion canvas on page load
window.addEventListener('load', () => {
  mV0 = 10; mA = 2; mTmax = 10;
  mSmax = Math.max(mV0 * mTmax + 0.5 * mA * mTmax * mTmax, 1);
  updateInputFields();
  drawMotionFrame(mV0, 0);
  drawGraph();
});

/* ── CHEM ── */
let chemMixed = false;
function mixReaction() {
  const ac = parseFloat(document.getElementById('acid-conc').value) || 0.5;
  const bc = parseFloat(document.getElementById('base-conc').value) || 0.5;
  const ratio = ac / bc;
  let pH;
  if (Math.abs(ratio - 1) < 0.05) { pH = 7.0; }
  else if (ratio > 1) { pH = -Math.log10(ac - bc); pH = Math.max(0, pH); }
  else { pH = 14 + Math.log10(bc - ac); pH = Math.min(14, pH); }
  pH = Math.round(pH * 10) / 10;

  let color, env;
  if (pH < 6) { color = '#ff7675cc'; env = '⚡ Axit mạnh'; }
  else if (pH < 7) { color = '#fdcb6ecc'; env = '〰 Axit yếu'; }
  else if (pH === 7) { color = '#dfe6e9cc'; env = '✓ Trung tính'; }
  else if (pH < 8) { color = '#81ececcc'; env = '〰 Kiềm yếu'; }
  else { color = '#74b9ffcc'; env = '⚡ Kiềm mạnh'; }

  document.getElementById('liq-acid').style.height = '20%';
  document.getElementById('liq-base').style.height = '20%';
  document.getElementById('liq-result').style.height = '70%';
  document.getElementById('liq-result').style.background = color;
  document.getElementById('ph-display').style.display = 'block';
  document.getElementById('ph-val').textContent = pH.toFixed(1);
  document.getElementById('chem-ph-val').innerHTML = pH.toFixed(1);
  document.getElementById('chem-env').textContent = env;
}
function resetChem() {
  document.getElementById('liq-acid').style.height = '60%';
  document.getElementById('liq-base').style.height = '60%';
  document.getElementById('liq-result').style.height = '0%';
  document.getElementById('ph-display').style.display = 'none';
  document.getElementById('chem-ph-val').textContent = '–';
  document.getElementById('chem-env').textContent = 'Chưa trộn';
}

/* ── CELL ── */
let cellType = 'animal';
const organelles = {
  animal: [
    { x:0.5, y:0.5, rx:0.13, ry:0.11, color:'#fdcb6e', stroke:'#f9ca24', label:'Nhân tế bào', desc:'Chứa DNA, điều khiển mọi hoạt động tế bào. Được bao bọc bởi màng nhân.' },
    { x:0.3, y:0.35, rx:0.07, ry:0.04, color:'#00b89455', stroke:'#00b894', label:'Ti thể', desc:'Nhà máy năng lượng của tế bào, tổng hợp ATP qua hô hấp tế bào.' },
    { x:0.72, y:0.4, rx:0.07, ry:0.04, color:'#00b89455', stroke:'#00b894', label:'Ti thể', desc:'Nhà máy năng lượng của tế bào, tổng hợp ATP qua hô hấp tế bào.' },
    { x:0.65, y:0.65, rx:0.08, ry:0.05, color:'#6c5ce755', stroke:'#6c5ce7', label:'Bộ Golgi', desc:'Chế biến, đóng gói và vận chuyển protein và lipid ra khỏi tế bào.' },
    { x:0.3, y:0.65, rx:0.06, ry:0.04, color:'#e1700055', stroke:'#e17000', label:'Lưới nội chất', desc:'Mạng lưới màng nội bào, vận chuyển và xử lý protein (hạt nhám) và lipid.' },
    { x:0.5, y:0.25, rx:0.04, ry:0.025, color:'#d6336c55', stroke:'#d6336c', label:'Trung thể', desc:'Tổ chức thoi phân bào trong quá trình phân chia tế bào.' },
  ],
  plant: [
    { x:0.5, y:0.5, rx:0.13, ry:0.11, color:'#fdcb6e', stroke:'#f9ca24', label:'Nhân tế bào', desc:'Chứa DNA, điều khiển mọi hoạt động tế bào.' },
    { x:0.28, y:0.38, rx:0.09, ry:0.06, color:'#00b89488', stroke:'#00b894', label:'Lục lạp', desc:'Bào quan quang hợp, chứa diệp lục, chuyển ánh sáng thành năng lượng hóa học.' },
    { x:0.7, y:0.35, rx:0.09, ry:0.06, color:'#00b89488', stroke:'#00b894', label:'Lục lạp', desc:'Bào quan quang hợp, chứa diệp lục.' },
    { x:0.5, y:0.7, rx:0.18, ry:0.12, color:'#74b9ff33', stroke:'#74b9ff', label:'Không bào trung tâm', desc:'Lưu trữ nước và chất dinh dưỡng, duy trì áp suất thẩm thấu của tế bào.' },
    { x:0.3, y:0.62, rx:0.07, ry:0.04, color:'#00b89455', stroke:'#00b894', label:'Ti thể', desc:'Sản xuất ATP qua hô hấp tế bào.' },
  ]
};

function initCell() {
  setCellType('animal');
}

function setCellType(type) {
  cellType = type;
  document.getElementById('btn-animal').className = type === 'animal' ? 'btn btn-success' : 'btn btn-secondary';
  document.getElementById('btn-plant').className = type === 'plant' ? 'btn btn-success' : 'btn btn-secondary';
  drawCell();
}

function drawCell() {
  const c = document.getElementById('cell-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = '#050a0f'; ctx.fillRect(0, 0, W, H);

  // cell wall / membrane
  const isPlant = cellType === 'plant';
  if (isPlant) {
    ctx.strokeStyle = '#81ecec'; ctx.lineWidth = 8;
    ctx.strokeRect(60, 20, W - 120, H - 40);
    ctx.strokeStyle = '#55efc4'; ctx.lineWidth = 2;
    ctx.strokeRect(70, 28, W - 140, H - 56);
  } else {
    ctx.strokeStyle = '#fd79a8'; ctx.lineWidth = 3;
    ctx.shadowBlur = 10; ctx.shadowColor = '#fd79a8';
    ctx.beginPath();
    ctx.ellipse(W/2, H/2, W/2 - 50, H/2 - 25, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // organelles
  const orgs = organelles[cellType];
  orgs.forEach(o => {
    ctx.shadowBlur = 15; ctx.shadowColor = o.stroke;
    ctx.fillStyle = o.color;
    ctx.strokeStyle = o.stroke; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(o.x * W, o.y * H, o.rx * W, o.ry * H, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
  });

  // labels
  ctx.font = '11px IBM Plex Mono'; ctx.textAlign = 'center';
  orgs.forEach(o => {
    ctx.fillStyle = o.stroke;
    ctx.fillText(o.label, o.x * W, o.y * H + o.ry * H + 14);
  });
}

// Hover for cell info
document.addEventListener('DOMContentLoaded', () => {
  const c = document.getElementById('cell-canvas');
  c.addEventListener('mousemove', e => {
    const rect = c.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width;
    const my = (e.clientY - rect.top) / rect.height;
    const orgs = organelles[cellType] || [];
    let found = null;
    for (const o of orgs) {
      const dx = (mx - o.x) / o.rx;
      const dy = (my - o.y) / o.ry;
      if (dx * dx + dy * dy <= 1) { found = o; break; }
    }
    const info = document.getElementById('cell-info');
    if (found) {
      info.innerHTML = `<strong style="font-size:15px">${found.label}</strong><span style="color:var(--muted);margin-left:10px">${found.desc}</span>`;
    } else {
      info.innerHTML = `<span style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.15em;color:var(--muted);text-transform:uppercase">Di chuột vào bào quan để xem thông tin</span>`;
    }
  });
});

/* ── MODAL ── */
document.getElementById('openModal').addEventListener('click', () => {
  document.getElementById('feedbackModal').classList.add('open');
  document.getElementById('modal-form-body').style.display = 'block';
  document.getElementById('success-msg').style.display = 'none';
  document.querySelector('.modal-footer').style.display = 'flex';
});
function closeModal() { document.getElementById('feedbackModal').classList.remove('open'); }
document.getElementById('feedbackModal').addEventListener('click', e => { if (e.target.id === 'feedbackModal') closeModal(); });

function submitFeedback() {
  const name = document.getElementById('fb-name').value.trim();
  const content = document.getElementById('fb-content').value.trim();
  if (!name || !content) { alert('Vui lòng điền đầy đủ thông tin!'); return; }
  document.getElementById('modal-form-body').style.display = 'none';
  document.querySelector('.modal-footer').style.display = 'none';
  document.getElementById('success-msg').style.display = 'block';
  setTimeout(closeModal, 2500);
}
