/* ==================== GIAO THOA YOUNG ==================== */

function syncYoungSliders() {
  const r1 = document.getElementById('lambda-range');
  const r2 = document.getElementById('a-range');
  const r3 = document.getElementById('D-range');
  const r4 = document.getElementById('orders-range');
  if(r1) r1.value = document.getElementById('lambda').value;
  if(r2) r2.value = document.getElementById('a-slit').value;
  if(r3) r3.value = document.getElementById('D-screen').value;
  if(r4) r4.value = document.getElementById('young-orders').value;
}

function getLambdaColorName(lambda) {
  if (lambda < 420) return 'Tím';
  if (lambda < 450) return 'Tím – Chàm';
  if (lambda < 495) return 'Xanh lam';
  if (lambda < 530) return 'Xanh lục';
  if (lambda < 570) return 'Vàng lục';
  if (lambda < 590) return 'Vàng';
  if (lambda < 625) return 'Cam';
  if (lambda < 700) return 'Cam đỏ';
  return 'Đỏ';
}

// Hàm đổi bước sóng (nm) sang mã màu RGB
function lambdaToColor(lambda) {
  let r, g, b, alpha;
  if (lambda >= 380 && lambda < 440) { r = -(lambda - 440) / (440 - 380); g = 0.0; b = 1.0; } 
  else if (lambda >= 440 && lambda < 490) { r = 0.0; g = (lambda - 440) / (490 - 440); b = 1.0; } 
  else if (lambda >= 490 && lambda < 510) { r = 0.0; g = 1.0; b = -(lambda - 510) / (510 - 490); } 
  else if (lambda >= 510 && lambda < 580) { r = (lambda - 510) / (580 - 510); g = 1.0; b = 0.0; } 
  else if (lambda >= 580 && lambda < 645) { r = 1.0; g = -(lambda - 645) / (645 - 580); b = 0.0; } 
  else if (lambda >= 645 && lambda <= 780) { r = 1.0; g = 0.0; b = 0.0; } 
  else { r = 0.0; g = 0.0; b = 0.0; }
  
  if (lambda >= 380 && lambda < 420) alpha = 0.3 + 0.7 * (lambda - 380) / (420 - 380);
  else if (lambda >= 420 && lambda < 700) alpha = 1.0;
  else if (lambda >= 700 && lambda <= 780) alpha = 0.3 + 0.7 * (780 - lambda) / (780 - 700);
  else alpha = 0;
  
  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha})`;
}

function runYoung() {
  const c = document.getElementById('young-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;

  // Lấy dữ liệu từ input
  const lambda = parseFloat(document.getElementById('lambda').value) || 600;
  const a = parseFloat(document.getElementById('a-slit').value) || 0.5;
  const D = parseFloat(document.getElementById('D-screen').value) || 1.5;
  const orders = parseInt(document.getElementById('young-orders').value) || 7;

  // Tính khoảng vân i (mm)
  const i_mm = (lambda * 1e-6 * D * 1e3) / a;

  // Tên màu
  const colorName = getLambdaColorName(lambda);
  const el = document.getElementById('lambda-color-label');
  if (el) { el.textContent = colorName; el.style.color = lambdaToColor(lambda).replace(/,[^,]+\)/, ',1)'); }
  // Color dot
  const dot = document.getElementById('lambda-color-dot');
  if (dot) dot.style.background = lambdaToColor(lambda).replace(/,[^,]+\)/, ',1)');

  // Cập nhật data panel (dùng đúng ID trong HTML)
  const iEl = document.getElementById('i-val');
  if (iEl) iEl.innerHTML = i_mm.toFixed(3) + '<span class="dc-unit">mm</span>';

  const lambdaDisp = document.getElementById('lambda-val-display');
  if (lambdaDisp) lambdaDisp.innerHTML = lambda + '<span class="dc-unit">nm</span>';

  const calcEl = document.getElementById('young-calc-display');
  if (calcEl) calcEl.textContent = `${lambda}×10⁻⁹×${D}/${a}×10⁻³ = ${i_mm.toFixed(3)} mm`;

  const descEl = document.getElementById('young-desc');
  if (descEl) descEl.textContent = colorName;

  // Tính scale: hiển thị đủ ±orders vân trong canvas
  // scaleX (px/mm) để orders*i_mm lấp đầy nửa chiều rộng
  const halfW = (W - 20) / 2;
  const scaleX = Math.max(10, halfW / (Math.max(orders, 3) * i_mm));
  const centerX = W / 2;
  const colorStr = lambdaToColor(lambda);

  // Xóa canvas
  ctx.clearRect(0,0,W,H);

  // Nền tối
  const bgGrad = ctx.createLinearGradient(0,0,0,H);
  bgGrad.addColorStop(0, '#050a12'); bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad; ctx.fillRect(0,0,W,H);

  const rulerH = 44;
  const patternH = H - rulerH;

  // ---- Vẽ hệ vân ----
  for (let px = 0; px < W; px++) {
    const mmX = (px - centerX) / scaleX;
    const intensity = Math.pow(Math.cos(Math.PI * mmX / i_mm), 2);
    ctx.globalAlpha = intensity * 0.92;
    ctx.fillStyle = colorStr;
    ctx.fillRect(px, 0, 1, patternH);
  }
  ctx.globalAlpha = 1.0;

  // ---- Nhãn vân sáng (k=0,±1,±2...) ----
  ctx.font = 'bold 9px "Space Mono", monospace';
  ctx.textAlign = 'center';
  for (let k = -orders; k <= orders; k++) {
    const px = centerX + k * i_mm * scaleX;
    if (px < 4 || px > W-4) continue;
    ctx.strokeStyle = k === 0 ? 'rgba(231,76,60,0.7)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = k === 0 ? 1.5 : 1;
    ctx.setLineDash(k === 0 ? [] : [3,3]);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, patternH); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = k === 0 ? '#e74c3c' : 'rgba(255,255,255,0.6)';
    ctx.fillText(k === 0 ? 'k=0' : (k > 0 ? `+${k}` : `${k}`), px, patternH - 6);
  }

  // ---- Thước đo ở đáy ----
  const rulerY = patternH;
  ctx.fillStyle = '#0e1520'; ctx.fillRect(0, rulerY, W, rulerH);
  ctx.strokeStyle = '#2a3a55'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, rulerY); ctx.lineTo(W, rulerY); ctx.stroke();

  // Vạch mm
  const mmStep = scaleX > 25 ? 1 : (scaleX > 10 ? 2 : 5);
  const mmRange = Math.ceil(halfW / scaleX) + 2;
  for (let mm = -mmRange; mm <= mmRange; mm += 0.5) {
    const px = centerX + mm * scaleX;
    if (px < 0 || px > W) continue;
    const isMajor = Number.isInteger(mm) && mm % mmStep === 0;
    const isMid = mm % 0.5 === 0 && !Number.isInteger(mm);
    ctx.strokeStyle = isMajor ? '#445' : '#2a3a4a';
    ctx.lineWidth = isMajor ? 1.2 : 0.8;
    ctx.beginPath();
    ctx.moveTo(px, rulerY + 2);
    ctx.lineTo(px, rulerY + (isMajor ? 18 : 10));
    ctx.stroke();
    if (isMajor) {
      ctx.fillStyle = '#6a8aaa';
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(mm + 'mm', px, rulerY + 30);
    }
  }
  // Đường giữa
  ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(centerX, rulerY); ctx.lineTo(centerX, rulerY + 22); ctx.stroke();

  // ---- Thông số góc trên ----
  ctx.font = '10px "Space Mono", monospace';
  ctx.textAlign = 'left'; ctx.fillStyle = '#7cb9ff';
  ctx.fillText(`λ = ${lambda} nm  |  a = ${a} mm  |  D = ${D} m  |  i = ${i_mm.toFixed(3)} mm`, 10, 16);

  // ---- Sơ đồ nguồn khe nhỏ bên trái ----
  const slitDraw = (x0, yc) => {
    ctx.fillStyle = '#334';
    ctx.fillRect(x0, yc - 60, 6, 44);
    ctx.fillRect(x0, yc + 16, 6, 44);
    ctx.strokeStyle = '#f39c12'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x0+6, yc - 14); ctx.lineTo(x0+6, yc + 14); ctx.stroke();
    ctx.fillStyle = '#f39c12'; ctx.font = '8px monospace'; ctx.textAlign = 'left';
    ctx.fillText('S₁', x0+8, yc - 6);
    ctx.fillText('S₂', x0+8, yc + 12);
  };
  slitDraw(2, patternH/2);
}

function resetYoung() {
  document.getElementById('lambda').value = 600;
  document.getElementById('a-slit').value = 0.5;
  document.getElementById('D-screen').value = 1.5;
  document.getElementById('young-orders').value = 7;
  runYoung();
}
