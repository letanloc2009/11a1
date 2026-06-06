/* ==================== CẤU TẠO TẾ BÀO ==================== */
const cellData = {
  wall: { name: 'Thành tế bào', latin: 'Cell Wall', emoji: '🟫', desc: 'Bao bọc bên ngoài, tạo hình dáng và độ cứng chắc cho tế bào thực vật. Cấu tạo chủ yếu từ xenlulôzơ.', fun: 'Bảo vệ tế bào khỏi bị vỡ khi hút quá nhiều nước.' },
  membrane: { name: 'Màng sinh chất', latin: 'Plasma Membrane', emoji: '🟡', desc: 'Lớp màng bán thấm chọn lọc, kiểm soát sự ra vào của các chất.', fun: 'Giống như "người gác cổng" của tế bào.' },
  nucleus: { name: 'Nhân tế bào', latin: 'Nucleus', emoji: '🟠', desc: 'Chứa vật chất di truyền (DNA), điều khiển mọi hoạt động sống của tế bào.', fun: 'Đóng vai trò như "bộ não" của tế bào.' },
  vacuole: { name: 'Không bào trung tâm', latin: 'Central Vacuole', emoji: '🔵', desc: 'Túi lớn chứa dịch tế bào (nước, chất dinh dưỡng, chất thải). Tạo áp suất thẩm thấu.', fun: 'Chiếm tới 80-90% thể tích tế bào thực vật trưởng thành!' },
  chloroplast: { name: 'Lục lạp', latin: 'Chloroplast', emoji: '🟢', desc: 'Bào quan quang hợp, chứa diệp lục hấp thụ ánh sáng mặt trời.', fun: 'Nhà máy năng lượng mặt trời của tế bào.' },
  mitochondria: { name: 'Ty thể', latin: 'Mitochondrion', emoji: '🔴', desc: 'Nơi diễn ra hô hấp tế bào, tạo ra năng lượng ATP cho tế bào hoạt động.', fun: '"Nhà máy điện" của tế bào.' },
  golgi: { name: 'Bộ máy Golgi', latin: 'Golgi Apparatus', emoji: '🩷', desc: 'Hệ thống túi dẹp xếp chồng, làm nhiệm vụ sửa đổi, phân loại và đóng gói protein.', fun: '"Bưu điện" của tế bào.' },
  er: { name: 'Lưới nội chất', latin: 'Endoplasmic Reticulum', emoji: '🟣', desc: 'Mạng lưới ống và xoang mang màng, tổng hợp protein (ER hạt) và lipid (ER trơn).', fun: 'Hệ thống "đường cao tốc" vận chuyển nội bộ.' },
  ribosome: { name: 'Ribosome', latin: 'Ribosome', emoji: '⚪', desc: 'Bộ máy tổng hợp protein từ axit amin theo khuôn mẫu mARN.', fun: 'Cấu trúc không có màng bao bọc.' }
};

let currentOrganelle = null, cellCanvasSetup = false;
let chipBoxOrganelle = null; // chỉ set khi click vào chip tên bào quan

// Tọa độ hộp bao quanh từng bào quan (relative to cx,cy)
function getOrganelleBounds(id, cx, cy) {
  const boxes = {
    wall:         { x: cx-215, y: cy-138, w: 430, h: 276 },
    membrane:     { x: cx-195, y: cy-116, w: 390, h: 232 },
    nucleus:      { x: cx-172, y: cy-82,  w: 88,  h: 88  },
    vacuole:      { x: cx-128, y: cy-68,  w: 256, h: 156 },
    chloroplast:  { x: cx-108, y: cy-80,  w: 272, h: 180 },
    mitochondria: { x: cx-142, y: cy-96,  w: 260, h: 178 },
    golgi:        { x: cx+40,  y: cy-52,  w: 92,  h: 104 },
    er:           { x: cx-102, y: cy-70,  w: 86,  h: 62  },
    ribosome:     { x: cx-112, y: cy-82,  w: 76,  h: 100 }
  };
  return boxes[id] || null;
}

function drawPlantCell() {
  const c = document.getElementById('cell-canvas'); if(!c) return;
  const ctx = c.getContext('2d'); const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  
  const cx = W/2, cy = H/2;
  
  // Wall
  ctx.lineWidth = 15; ctx.strokeStyle = currentOrganelle === 'wall' ? '#e67e22' : '#27ae60';
  ctx.fillStyle = '#1e3b2b'; ctx.beginPath(); ctx.roundRect(cx - 200, cy - 120, 400, 240, 30); ctx.fill(); ctx.stroke();
  
  // Membrane
  ctx.lineWidth = 3; ctx.strokeStyle = currentOrganelle === 'membrane' ? '#f1c40f' : '#82e0aa';
  ctx.beginPath(); ctx.roundRect(cx - 190, cy - 110, 380, 220, 25); ctx.stroke();
  
  // Vacuole
  ctx.fillStyle = currentOrganelle === 'vacuole' ? 'rgba(52, 152, 219, 0.6)' : 'rgba(52, 152, 219, 0.2)';
  ctx.strokeStyle = currentOrganelle === 'vacuole' ? '#3498db' : 'rgba(52, 152, 219, 0.5)';
  ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy + 10, 120, 70, 0, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  
  // Nucleus
  ctx.fillStyle = currentOrganelle === 'nucleus' ? '#e67e22' : '#d35400'; ctx.beginPath(); ctx.arc(cx - 130, cy - 40, 35, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#f39c12'; ctx.beginPath(); ctx.arc(cx - 140, cy - 45, 12, 0, Math.PI*2); ctx.fill();
  
  // ER
  ctx.strokeStyle = currentOrganelle === 'er' ? '#9b59b6' : '#8e44ad'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx-90, cy-40); ctx.lineTo(cx-70, cy-60); ctx.lineTo(cx-50, cy-20); ctx.lineTo(cx-30, cy-50); ctx.stroke();
  
  // Chloroplasts
  [[cx-80,cy+80], [cx+120,cy-60], [cx+140,cy+60]].forEach(pos => {
    ctx.fillStyle = currentOrganelle === 'chloroplast' ? '#2ecc71' : '#1e8449';
    ctx.beginPath(); ctx.ellipse(pos[0], pos[1], 20, 12, Math.PI/4, 0, Math.PI*2); ctx.fill();
  });
  
  // Mitochondria
  [[cx-120,cy+60], [cx+100,cy+70], [cx+60,cy-80]].forEach(pos => {
    ctx.fillStyle = currentOrganelle === 'mitochondria' ? '#e74c3c' : '#c0392b';
    ctx.beginPath(); ctx.ellipse(pos[0], pos[1], 15, 8, -Math.PI/6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(pos[0]-10, pos[1]); ctx.lineTo(pos[0]-5, pos[1]-4); ctx.lineTo(pos[0], pos[1]+4); ctx.lineTo(pos[0]+5, pos[1]-4); ctx.lineTo(pos[0]+10, pos[1]); ctx.stroke();
  });
  
  // Golgi
  ctx.strokeStyle = currentOrganelle === 'golgi' ? '#fd79a8' : '#e84393'; ctx.lineWidth = 5;
  for(let i=0; i<4; i++) { ctx.beginPath(); ctx.arc(cx+80, cy, 30+i*6, -Math.PI/3, Math.PI/3); ctx.stroke(); }
  
  // Ribosome
  ctx.fillStyle = currentOrganelle === 'ribosome' ? '#fff' : '#aaa';
  [[cx-60,cy-30], [cx-40,cy-40], [cx-80,cy-60], [cx-50,cy-70], [cx-100,cy+10]].forEach(pos => {
    ctx.beginPath(); ctx.arc(pos[0], pos[1], 3, 0, Math.PI*2); ctx.fill();
  });

  // ---- Vẽ hình chữ nhật vàng nét đứt khi click vào chip ----
  if (chipBoxOrganelle) {
    const b = getOrganelleBounds(chipBoxOrganelle, cx, cy);
    if (b) {
      ctx.save();
      ctx.strokeStyle = '#f1c40f';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 5]);
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#f1c40f';
      const pad = 8;
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(b.x - pad, b.y - pad, b.w + pad*2, b.h + pad*2, 8);
        ctx.stroke();
      } else {
        ctx.strokeRect(b.x - pad, b.y - pad, b.w + pad*2, b.h + pad*2);
      }
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}

function setupCellEvents() {
  if (cellCanvasSetup) return;
  const c = document.getElementById('cell-canvas'); if(!c) return;
  
  function detectOrganelle(e) {
    const rect = c.getBoundingClientRect();
    const scaleX = c.width / rect.width, scaleY = c.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const cx = c.width/2, cy = c.height/2;
    if(Math.hypot(x-(cx-130), y-(cy-40)) < 40) return 'nucleus';
    if(Math.hypot(x-cx, y-(cy+10)) < 80) return 'vacuole';
    if(Math.hypot(x-(cx-120), y-(cy+60))<22 || Math.hypot(x-(cx+100), y-(cy+70))<22 || Math.hypot(x-(cx+60), y-(cy-80))<22) return 'mitochondria';
    if(Math.hypot(x-(cx-80), y-(cy+80))<26 || Math.hypot(x-(cx+120), y-(cy-60))<26 || Math.hypot(x-(cx+140), y-(cy+60))<26) return 'chloroplast';
    if(x > cx+58 && x < cx+115 && Math.abs(y-cy) < 42) return 'golgi';
    if(x > cx-100 && x < cx-15 && y > cy-72 && y < cy-8) return 'er';
    if(Math.abs(x-cx) > 168 && Math.abs(x-cx) < 215 && Math.abs(y-cy) < 132) return 'wall';
    if(Math.abs(x-cx) < 205 && Math.abs(y-cy) < 128) return 'membrane';
    if(Math.hypot(x-(cx-60), y-(cy-30))<8 || Math.hypot(x-(cx-40),y-(cy-40))<8 || Math.hypot(x-(cx-80),y-(cy-60))<8) return 'ribosome';
    return null;
  }

  c.addEventListener('mousemove', (e) => {
    const hovered = detectOrganelle(e);
    const tt = document.getElementById('cell-tooltip');
    if(hovered) { tt.style.opacity = 1; tt.textContent = cellData[hovered].emoji + ' ' + cellData[hovered].name; c.style.cursor = 'pointer'; }
    else { tt.style.opacity = 0; c.style.cursor = 'crosshair'; }
  });

  c.addEventListener('click', (e) => {
    const clicked = detectOrganelle(e);
    if(clicked) {
      chipBoxOrganelle = clicked; // click canvas: cũng vẽ hình chữ nhật vàng nét đứt
      showOrganelleInfo(clicked);
    }
  });

  cellCanvasSetup = true;
}

function highlightOrganelle(id) { currentOrganelle = id; drawPlantCell(); }

// Gọi từ chip (tên bào quan): vẽ hình chữ nhật vàng nét đứt
function showOrganelleInfoFromChip(id) {
  chipBoxOrganelle = id;
  showOrganelleInfo(id);
}

function showOrganelleInfo(id) {
  highlightOrganelle(id);
  document.querySelectorAll('.cell-chip').forEach(chip => {
    chip.classList.remove('active');
    if(chip.getAttribute('onclick').includes(`'${id}'`)) chip.classList.add('active');
  });
  const panel = document.getElementById('organelle-info-panel');
  if(!id) { panel.style.display = 'none'; return; }
  panel.style.display = 'flex';
  const data = cellData[id];
  document.getElementById('organelle-emoji').textContent = data.emoji;
  document.getElementById('organelle-name').textContent = data.name;
  document.getElementById('organelle-latin').textContent = data.latin;
  document.getElementById('organelle-desc').textContent = data.desc;
  const funEl = document.getElementById('organelle-fun');
  if(data.fun) { funEl.style.display = 'block'; funEl.textContent = '💡 Mẹo: ' + data.fun; } 
  else funEl.style.display = 'none';
}
function resetCellView() {
  chipBoxOrganelle = null;
  highlightOrganelle(null);
  document.querySelectorAll('.cell-chip').forEach(c => c.classList.remove('active'));
  document.getElementById('organelle-info-panel').style.display = 'none';
}
