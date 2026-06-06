/* ==================== FORCE – PUSH/PULL BOX ==================== */
let forceRunning = false, forceRAF = null, forceOffset = 0, forceVelocity = 0, forceLastTime = null;
let leftMode = null, rightMode = null; // 'pull' | 'push' | null

function fDragStart(event, type) {
  event.dataTransfer.setData('forceType', type);
}
function fDrop(event, side) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  const type = event.dataTransfer.getData('forceType');
  if (!type) return;
  if (side === 'left') leftMode = type;
  else rightMode = type;
  updateForceZoneUI();
  updateForceDisplay();
}
function clearForceZone(side) {
  if (side === 'left') leftMode = null;
  else rightMode = null;
  updateForceZoneUI();
  updateForceDisplay();
}
function clearAllForceZones() {
  leftMode = null; rightMode = null;
  forceOffset = 0; forceVelocity = 0;
  forceRunning = false; cancelAnimationFrame(forceRAF);
  document.getElementById('force-btn').textContent = '▶ CHẠY';
  updateForceZoneUI(); updateForceDisplay();
}
function updateForceZoneUI() {
  const zl = document.getElementById('force-zone-left');
  const zr = document.getElementById('force-zone-right');
  const il = document.getElementById('fz-left-icon');
  const ir = document.getElementById('fz-right-icon');
  const ll = document.getElementById('fz-left-label');
  const lr = document.getElementById('fz-right-label');
  zl.className = 'force-zone' + (leftMode === 'pull' ? ' has-pull' : leftMode === 'push' ? ' has-push' : '');
  zr.className = 'force-zone right-zone' + (rightMode === 'pull' ? ' has-pull' : rightMode === 'push' ? ' has-push' : '');
  il.textContent = leftMode === 'pull' ? '🏃' : leftMode === 'push' ? '💪' : '❓';
  ir.textContent = rightMode === 'pull' ? '🏃' : rightMode === 'push' ? '💪' : '❓';
  ll.innerHTML = leftMode === 'pull' ? 'Người kéo<br><small style="color:#e74c3c">←  Kéo về trái</small>' 
               : leftMode === 'push' ? 'Người đẩy<br><small style="color:#2980b9">→  Đẩy sang phải</small>'
               : 'Thả nhân vật<br>vào đây';
  lr.innerHTML = rightMode === 'pull' ? 'Người kéo<br><small style="color:#2980b9">→  Kéo về phải</small>'
               : rightMode === 'push' ? 'Người đẩy<br><small style="color:#e74c3c">←  Đẩy sang trái</small>'
               : 'Thả nhân vật<br>vào đây';
}

function getForceNet() {
  const f1 = parseFloat(document.getElementById('force-left').value) || 0;
  const f2 = parseFloat(document.getElementById('force-right').value) || 0;
  // Left pull → force ← (negative), Left push → force → (positive)
  // Right pull → force → (positive), Right push → force ← (negative)
  let contrib1 = 0, contrib2 = 0;
  if (leftMode === 'pull') contrib1 = -f1;
  else if (leftMode === 'push') contrib1 = +f1;
  if (rightMode === 'pull') contrib2 = +f2;
  else if (rightMode === 'push') contrib2 = -f2;
  return { f1, f2, net: contrib1 + contrib2, contrib1, contrib2 };
}

function updateForceDisplay() {
  const { f1, f2, net } = getForceNet();
  document.getElementById('fl-val').textContent = f1 + ' N';
  document.getElementById('fr-val').textContent = f2 + ' N';
  document.getElementById('fp-f1').innerHTML = f1 + '<span class="dc-unit">N</span>';
  document.getElementById('fp-f2').innerHTML = f2 + '<span class="dc-unit">N</span>';
  document.getElementById('fp-net').innerHTML = (leftMode || rightMode) ? Math.abs(net).toFixed(0) + '<span class="dc-unit">N</span>' : '–<span class="dc-unit">N</span>';
  if (!leftMode && !rightMode) {
    document.getElementById('fp-result').textContent = '— Chọn nhân vật —';
  } else {
    document.getElementById('fp-result').textContent = net > 0.5 ? '→ Thùng sang phải' : net < -0.5 ? '← Thùng sang trái' : '⇌ Cân bằng';
  }
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
  const { net } = getForceNet();
  forceVelocity = forceVelocity * 0.96 + (net/600) * dt;
  forceOffset += forceVelocity * dt;
  forceOffset = Math.max(-1, Math.min(1, forceOffset));
  drawForceScene(forceOffset);
  if (Math.abs(forceOffset) >= 0.97) {
    forceRunning = false;
    document.getElementById('force-btn').textContent = '▶ CHẠY LẠI';
    document.getElementById('fp-result').textContent = forceOffset > 0 ? '→ Thùng đã sang phải!' : '← Thùng đã sang trái!';
    drawForceScene(forceOffset); return;
  }
  if (forceRunning) forceRAF = requestAnimationFrame(forceLoop);
}

function drawForceScene(offset) {
  const c = document.getElementById('force-canvas'); if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  // Background warehouse
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#1a1a2e'); bg.addColorStop(1,'#16213e');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  // Floor
  ctx.fillStyle = '#2a2a3e'; ctx.fillRect(0, H*0.75, W, H*0.25);
  // Floor tiles
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for(let x=0; x<W; x+=50) { ctx.beginPath(); ctx.moveTo(x, H*0.75); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(0, H*0.88); ctx.lineTo(W, H*0.88); ctx.stroke();
  // Floor shadow line
  ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, H*0.75, W, 4);

  const { f1, f2, net, contrib1, contrib2 } = getForceNet();
  const groundY = H * 0.75;
  const boxW = 80, boxH = 64;
  const boxX = W/2 + offset*(W*0.30) - boxW/2;
  const boxY = groundY - boxH;

  // ---- Draw rope/connection if needed ----
  const ropeY = boxY + boxH/2;
  if (leftMode === 'pull') {
    ctx.strokeStyle = '#c8a96e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(boxX, ropeY); ctx.lineTo(boxX - 90, ropeY); ctx.stroke();
    // Rope texture
    ctx.strokeStyle = '#a07840'; ctx.lineWidth = 1;
    for(let rx = boxX-90; rx < boxX; rx += 10) {
      ctx.beginPath(); ctx.moveTo(rx, ropeY-2); ctx.lineTo(rx+5, ropeY+2); ctx.stroke();
    }
  }
  if (rightMode === 'pull') {
    ctx.strokeStyle = '#c8a96e'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(boxX+boxW, ropeY); ctx.lineTo(boxX+boxW+90, ropeY); ctx.stroke();
    ctx.strokeStyle = '#a07840'; ctx.lineWidth = 1;
    for(let rx = boxX+boxW; rx < boxX+boxW+90; rx += 10) {
      ctx.beginPath(); ctx.moveTo(rx, ropeY-2); ctx.lineTo(rx+5, ropeY+2); ctx.stroke();
    }
  }

  // ---- Draw box (thùng hàng) ----
  ctx.save();
  const boxGrad = ctx.createLinearGradient(boxX, boxY, boxX+boxW, boxY+boxH);
  boxGrad.addColorStop(0,'#8B5E3C'); boxGrad.addColorStop(0.5,'#A0714A'); boxGrad.addColorStop(1,'#6B4226');
  ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(160,113,74,0.5)';
  ctx.fillStyle = boxGrad;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(boxX, boxY, boxW, boxH, 4) : ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.fill(); ctx.shadowBlur = 0;
  // Box top
  ctx.fillStyle = '#B88A5A';
  ctx.fillRect(boxX+2, boxY+2, boxW-4, 12);
  // Box stripes
  ctx.strokeStyle = '#6B4226'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(boxX+boxW/2, boxY); ctx.lineTo(boxX+boxW/2, boxY+boxH); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(boxX, boxY+boxH/2); ctx.lineTo(boxX+boxW, boxY+boxH/2); ctx.stroke();
  // Box icon
  ctx.fillStyle = '#FFD700'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
  ctx.fillText('📦', boxX+boxW/2, boxY+boxH/2+6);
  // Box shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(boxX+boxW/2, groundY+2, boxW/2+8, 6, 0, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // ---- Draw persons ----
  function drawWorkerPull(cx, groundY, color, shirtColor, facingRight, leaning) {
    const dir = facingRight ? 1 : -1;
    const armX = cx + dir * 18;
    // Leaning back
    const lean = leaning * 0.25;
    ctx.save(); ctx.translate(cx, groundY - 2);
    // Shoes
    ctx.fillStyle = '#222';
    ctx.fillRect(-6 + lean*30, -8, 12, 6);
    // Legs
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4+lean*20, -8); ctx.lineTo(-6+lean*40, -30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4+lean*20, -8); ctx.lineTo(6+lean*40, -30); ctx.stroke();
    // Body (torso)
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-8+lean*30, -50, 16, 22);
    // Arms – reaching toward box
    ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0+lean*30, -40); ctx.lineTo(dir*22+lean*30, -30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0+lean*30, -40); ctx.lineTo(dir*22+lean*30, -50); ctx.stroke();
    // Head
    ctx.fillStyle = '#F5CBA7'; ctx.beginPath(); ctx.arc(lean*30, -58, 10, 0, Math.PI*2); ctx.fill();
    // Hard hat
    ctx.fillStyle = '#FFD700';
    ctx.beginPath(); ctx.ellipse(lean*30, -65, 12, 5, 0, 0, Math.PI); ctx.fill();
    ctx.fillRect(-12+lean*30, -66, 24, 4);
    ctx.restore();
  }

  function drawWorkerPush(cx, groundY, color, shirtColor, facingRight) {
    const dir = facingRight ? 1 : -1;
    ctx.save(); ctx.translate(cx, groundY - 2);
    // Shoes
    ctx.fillStyle = '#222'; ctx.fillRect(-6+dir*4, -8, 12, 6);
    // Legs
    ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-4+dir*4, -8); ctx.lineTo(-5+dir*8, -30); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4+dir*4, -8); ctx.lineTo(5+dir*8, -30); ctx.stroke();
    // Body – leaning forward
    ctx.fillStyle = shirtColor;
    ctx.fillRect(-8+dir*6, -52, 16, 22);
    // Arms – pushing
    ctx.strokeStyle = color; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0+dir*6, -42); ctx.lineTo(dir*22+dir*6, -38); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0+dir*6, -42); ctx.lineTo(dir*22+dir*6, -50); ctx.stroke();
    // Head
    ctx.fillStyle = '#F5CBA7'; ctx.beginPath(); ctx.arc(dir*6, -62, 10, 0, Math.PI*2); ctx.fill();
    // Hard hat
    ctx.fillStyle = '#FF6B35';
    ctx.beginPath(); ctx.ellipse(dir*6, -69, 12, 5, 0, 0, Math.PI); ctx.fill();
    ctx.fillRect(-12+dir*6, -70, 24, 4);
    ctx.restore();
  }

  // Left person
  if (leftMode === 'pull') {
    const px = boxX - 100;
    drawWorkerPull(px, groundY, '#2d3436', '#e74c3c', true, 1);
  } else if (leftMode === 'push') {
    const px = boxX - 30;
    drawWorkerPush(px, groundY, '#2d3436', '#2980b9', true);
  }

  // Right person
  if (rightMode === 'pull') {
    const px = boxX + boxW + 100;
    drawWorkerPull(px, groundY, '#2d3436', '#2980b9', false, 1);
  } else if (rightMode === 'push') {
    const px = boxX + boxW + 30;
    drawWorkerPush(px, groundY, '#2d3436', '#e74c3c', false);
  }

  // ---- Force arrows on box ----
  const arrowY = boxY - 20;
  const cx = boxX + boxW/2;
  if (leftMode) {
    const dir1 = contrib1 >= 0 ? 1 : -1;
    const len1 = Math.min(Math.abs(contrib1)/3 + 20, 130);
    const color1 = contrib1 >= 0 ? '#2ecc71' : '#e74c3c';
    ctx.strokeStyle = color1; ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = color1;
    ctx.beginPath(); ctx.moveTo(cx, arrowY); ctx.lineTo(cx + dir1 * len1, arrowY); ctx.stroke();
    ctx.fillStyle = color1;
    const ax = cx + dir1 * len1;
    ctx.beginPath(); ctx.moveTo(ax + dir1*8, arrowY); ctx.lineTo(ax - dir1*4, arrowY-5); ctx.lineTo(ax - dir1*4, arrowY+5); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color1;
    ctx.fillText('F₁='+f1+'N', cx + dir1*len1/2, arrowY - 8);
  }
  if (rightMode) {
    const offsetY2 = leftMode ? 18 : 0;
    const dir2 = contrib2 >= 0 ? 1 : -1;
    const len2 = Math.min(Math.abs(contrib2)/3 + 20, 130);
    const color2 = contrib2 >= 0 ? '#3498db' : '#e67e22';
    ctx.strokeStyle = color2; ctx.lineWidth = 3; ctx.shadowBlur = 8; ctx.shadowColor = color2;
    ctx.beginPath(); ctx.moveTo(cx, arrowY - offsetY2); ctx.lineTo(cx + dir2 * len2, arrowY - offsetY2); ctx.stroke();
    ctx.fillStyle = color2;
    const ax2 = cx + dir2 * len2;
    ctx.beginPath(); ctx.moveTo(ax2+dir2*8, arrowY-offsetY2); ctx.lineTo(ax2-dir2*4, arrowY-offsetY2-5); ctx.lineTo(ax2-dir2*4, arrowY-offsetY2+5); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = color2;
    ctx.fillText('F₂='+f2+'N', cx + dir2*len2/2, arrowY - offsetY2 - 8);
  }

  // ---- Net force bar at bottom ----
  if (leftMode || rightMode) {
    const barW = W * 0.55, barX = (W - barW)/2, barY = H - 28, barH = 10;
    ctx.fillStyle = '#111'; ctx.fillRect(barX, barY, barW, barH);
    if (Math.abs(net) > 0.5) {
      const fillW = Math.min(Math.abs(net)/600, 1) * (barW/2);
      const netColor = net > 0 ? '#2ecc71' : '#e74c3c';
      ctx.fillStyle = netColor;
      if (net > 0) ctx.fillRect(barX+barW/2, barY, fillW, barH);
      else ctx.fillRect(barX+barW/2-fillW, barY, fillW, barH);
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(barX+barW/2-1.5, barY-3, 3, barH+6);
    ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    const netSign = net > 0 ? '+' : '';
    ctx.fillText('HỢP LỰC: ' + netSign + net.toFixed(0) + ' N', W/2, barY + barH + 14);
  } else {
    ctx.fillStyle = '#7cb9ff'; ctx.font = '12px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText('← Kéo nhân vật vào 2 vùng bên trên để xem lực tác dụng →', W/2, H - 16);
  }

  // Title labels
  ctx.fillStyle = '#ffe082'; ctx.font = 'bold 12px Nunito,sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('🏭 KHO HÀNG – MÔ PHỎNG LỰC', 12, 20);
}
