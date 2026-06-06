/* ==================== MOMENT LỰC ==================== */
let torqueRunning = false, torqueRAF = null, torqueAngle = 0, torqueOmega = 0, torqueLastTime = null;

function updateTorqueDisplay() {
  const F1 = parseFloat(document.getElementById('F1-torque').value) || 0;
  const d1 = parseFloat(document.getElementById('d1-torque').value) || 0;
  const F2 = parseFloat(document.getElementById('F2-torque').value) || 0;
  const d2 = parseFloat(document.getElementById('d2-torque').value) || 0;
  const M1 = F1 * d1, M2 = F2 * d2, diff = M2 - M1;
  const m1El = document.getElementById('M1-val');
  if (m1El) m1El.innerHTML = M1.toFixed(1) + '<span class="dc-unit">Nm</span>';
  const m2El = document.getElementById('M2-val');
  if (m2El) m2El.innerHTML = M2.toFixed(1) + '<span class="dc-unit">Nm</span>';
  const resEl = document.getElementById('torque-result');
  let res = '⚖ Cân bằng', color = '#27ae60';
  if (diff > 0.1) { res = '↻ Quay phải'; color = '#e74c3c'; }
  else if (diff < -0.1) { res = '↺ Quay trái'; color = '#e74c3c'; }
  if (resEl) resEl.innerHTML = `<span style="color:${color}; font-weight:800;">${res}</span>`;
  const diffEl = document.getElementById('torque-diff');
  if (diffEl) diffEl.innerHTML = Math.abs(diff).toFixed(1) + '<span class="dc-unit">Nm</span>';
  const fmEl = document.getElementById('torque-formula-display');
  if (fmEl) fmEl.innerHTML = `M₁ = ${F1} × ${d1} = <b>${M1.toFixed(1)} Nm</b> &nbsp;|&nbsp; M₂ = ${F2} × ${d2} = <b>${M2.toFixed(1)} Nm</b> &nbsp;→ ${res}`;
  drawTorqueFrame(torqueAngle);
}

function updateTorque() { updateTorqueDisplay(); }

function startTorque() {
  const F1 = parseFloat(document.getElementById('F1-torque').value) || 0;
  const d1 = parseFloat(document.getElementById('d1-torque').value) || 0;
  const F2 = parseFloat(document.getElementById('F2-torque').value) || 0;
  const d2 = parseFloat(document.getElementById('d2-torque').value) || 0;
  const diff = F2*d2 - F1*d1;
  if (Math.abs(diff) < 0.1) {
    // Balanced – small oscillation
    torqueAngle = 0; torqueOmega = 0.002;
  }
  torqueRunning = !torqueRunning;
  const btn = document.getElementById('torque-run-btn');
  if (torqueRunning) {
    btn.textContent = '⏸ DỪNG';
    torqueLastTime = null;
    requestAnimationFrame(torqueLoop);
  } else {
    btn.textContent = '▶ CHẠY';
    cancelAnimationFrame(torqueRAF);
  }
}

function torqueLoop(ts) {
  if (!torqueLastTime) torqueLastTime = ts;
  const dt = Math.min((ts - torqueLastTime)/1000, 0.05); torqueLastTime = ts;
  const F1 = parseFloat(document.getElementById('F1-torque').value) || 0;
  const d1 = parseFloat(document.getElementById('d1-torque').value) || 0;
  const F2 = parseFloat(document.getElementById('F2-torque').value) || 0;
  const d2 = parseFloat(document.getElementById('d2-torque').value) || 0;
  const diff = F2*d2 - F1*d1; // positive = clockwise
  const maxAngle = 0.55;
  // Angular acceleration proportional to net moment
  const alpha = diff * 0.008;
  torqueOmega += alpha * dt;
  torqueOmega *= 0.96; // damping
  torqueAngle += torqueOmega * dt;
  torqueAngle = Math.max(-maxAngle, Math.min(maxAngle, torqueAngle));
  // Stop if at limit
  if (Math.abs(torqueAngle) >= maxAngle * 0.98 && Math.abs(diff) > 0.5) {
    torqueOmega = 0;
  }
  drawTorqueFrame(torqueAngle);
  updateTorqueDisplay();
  if (torqueRunning) torqueRAF = requestAnimationFrame(torqueLoop);
}

function resetTorque() {
  torqueRunning = false; cancelAnimationFrame(torqueRAF);
  torqueAngle = 0; torqueOmega = 0; torqueLastTime = null;
  document.getElementById('F1-torque').value = 10;
  document.getElementById('d1-torque').value = 0.8;
  document.getElementById('F2-torque').value = 20;
  document.getElementById('d2-torque').value = 0.4;
  const btn = document.getElementById('torque-run-btn');
  if (btn) btn.textContent = '▶ CHẠY';
  updateTorqueDisplay();
}

function drawTorqueFrame(angle) {
  const c = document.getElementById('torque-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  // Background gradient
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#e8f8f5'); bg.addColorStop(1,'#d1f2eb');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='rgba(39,174,96,0.10)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

  const F1 = parseFloat(document.getElementById('F1-torque').value) || 0;
  const d1 = parseFloat(document.getElementById('d1-torque').value) || 0;
  const F2 = parseFloat(document.getElementById('F2-torque').value) || 0;
  const d2 = parseFloat(document.getElementById('d2-torque').value) || 0;
  const M1 = F1 * d1, M2 = F2 * d2;

  const cx = W/2, cy = H/2 + 20;
  const pxPerM = W/5;

  // Pivot triangle
  ctx.fillStyle = '#7f8c8d';
  ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.moveTo(cx,cy+6); ctx.lineTo(cx-26,cy+52); ctx.lineTo(cx+26,cy+52); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle='#bdc3c7'; ctx.fillRect(cx-44,cy+52,88,10);

  // Ground line
  ctx.strokeStyle='#95a5a6'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(cx-200, cy+62); ctx.lineTo(cx+200, cy+62); ctx.stroke();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Lever bar
  ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(0,0,0,0.25)';
  const barGrad = ctx.createLinearGradient(0,-6,0,6);
  barGrad.addColorStop(0,'#9b59b6'); barGrad.addColorStop(0.5,'#8e44ad'); barGrad.addColorStop(1,'#6c3483');
  ctx.fillStyle = barGrad;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-W/2+30,-6,W-60,12,3) : ctx.fillRect(-W/2+30,-6,W-60,12);
  ctx.fill(); ctx.shadowBlur = 0;
  // Scale marks
  ctx.strokeStyle='rgba(255,255,255,0.4)'; ctx.lineWidth=1;
  for(let i=-4;i<=4;i++){const sx=i*pxPerM; ctx.beginPath();ctx.moveTo(sx,-8);ctx.lineTo(sx,8);ctx.stroke();}
  ctx.fillStyle='rgba(255,255,255,0.6)'; ctx.font='8px monospace'; ctx.textAlign='center';
  for(let i=-4;i<=4;i++){ctx.fillText(Math.abs(i)+'m', i*pxPerM, 20);}

  const wx1 = -d1*pxPerM, wx2 = d2*pxPerM;
  const s1 = Math.max(24, Math.min(20 + F1*0.45, 58));
  const s2 = Math.max(24, Math.min(20 + F2*0.45, 58));

  // ===== LEFT WEIGHT (M1) =====
  // Vertical force arrow (down)
  const arr1Len = Math.min(50, M1 * 3 + 15);
  ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 6; ctx.shadowColor = '#1565c0';
  ctx.beginPath(); ctx.moveTo(wx1, -(6+s1)); ctx.lineTo(wx1, -(6+s1)-arr1Len); ctx.stroke();
  ctx.fillStyle = '#1565c0';
  ctx.beginPath(); ctx.moveTo(wx1, -(6+s1)); ctx.lineTo(wx1-5, -(6+s1)-12); ctx.lineTo(wx1+5, -(6+s1)-12); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  // Arm span line (d1)
  ctx.strokeStyle = 'rgba(21,101,192,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(0, 25); ctx.lineTo(wx1, 25); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#1565c0'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('d₁='+d1+'m', wx1/2, 38);
  // Curved moment arrow (counter-clockwise = left side down)
  ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2; ctx.shadowBlur = 6; ctx.shadowColor = '#1565c0';
  ctx.beginPath(); ctx.arc(0, 0, 45, Math.PI*1.1, Math.PI*1.7, false); ctx.stroke();
  ctx.fillStyle = '#1565c0';
  ctx.beginPath();
  const ang1e = Math.PI*1.7;
  ctx.moveTo(45*Math.cos(ang1e), 45*Math.sin(ang1e));
  ctx.lineTo(45*Math.cos(ang1e-0.25)-6*Math.sin(ang1e-0.25), 45*Math.sin(ang1e-0.25)+6*Math.cos(ang1e-0.25));
  ctx.lineTo(45*Math.cos(ang1e+0.25)-6*Math.sin(ang1e+0.25), 45*Math.sin(ang1e+0.25)+6*Math.cos(ang1e+0.25));
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  // String
  ctx.strokeStyle='#2980b9'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(wx1,-(6+s1)); ctx.lineTo(wx1,-6); ctx.stroke();
  // Block
  const g1 = ctx.createLinearGradient(wx1-s1/2,0,wx1+s1/2,0);
  g1.addColorStop(0,'#1565c0'); g1.addColorStop(0.5,'#1976d2'); g1.addColorStop(1,'#0d47a1');
  ctx.fillStyle = g1; ctx.shadowBlur = 10; ctx.shadowColor = '#1976d255';
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(wx1-s1/2,-(6+s1),s1,s1,4) : ctx.fillRect(wx1-s1/2,-(6+s1),s1,s1);
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle='#fff'; ctx.font=`bold ${Math.min(13,s1/2.5)}px monospace`; ctx.textAlign='center';
  ctx.fillText(F1+'N', wx1, -(6+s1/2)+4);
  ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='8px monospace';
  ctx.fillText('M₁='+M1.toFixed(1)+'Nm', wx1, -(6+s1)-18);

  // ===== RIGHT WEIGHT (M2) =====
  const arr2Len = Math.min(50, M2 * 3 + 15);
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2.5;
  ctx.shadowBlur = 6; ctx.shadowColor = '#c0392b';
  ctx.beginPath(); ctx.moveTo(wx2, -(6+s2)); ctx.lineTo(wx2, -(6+s2)-arr2Len); ctx.stroke();
  ctx.fillStyle = '#c0392b';
  ctx.beginPath(); ctx.moveTo(wx2, -(6+s2)); ctx.lineTo(wx2-5, -(6+s2)-12); ctx.lineTo(wx2+5, -(6+s2)-12); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(192,57,43,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4,3]);
  ctx.beginPath(); ctx.moveTo(0, 25); ctx.lineTo(wx2, 25); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#c0392b'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('d₂='+d2+'m', wx2/2, 38);
  // Curved moment arrow (clockwise = right side down)
  ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.shadowBlur = 6; ctx.shadowColor = '#c0392b';
  ctx.beginPath(); ctx.arc(0, 0, 58, -Math.PI*0.7, -Math.PI*0.1, false); ctx.stroke();
  ctx.fillStyle = '#c0392b';
  const ang2e = -Math.PI*0.1;
  ctx.beginPath();
  ctx.moveTo(58*Math.cos(ang2e), 58*Math.sin(ang2e));
  ctx.lineTo(58*Math.cos(ang2e-0.25)-7*Math.sin(ang2e-0.25), 58*Math.sin(ang2e-0.25)+7*Math.cos(ang2e-0.25));
  ctx.lineTo(58*Math.cos(ang2e+0.25)-7*Math.sin(ang2e+0.25), 58*Math.sin(ang2e+0.25)+7*Math.cos(ang2e+0.25));
  ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  // String
  ctx.strokeStyle='#e74c3c'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(wx2,-(6+s2)); ctx.lineTo(wx2,-6); ctx.stroke();
  // Block
  const g2 = ctx.createLinearGradient(wx2-s2/2,0,wx2+s2/2,0);
  g2.addColorStop(0,'#c0392b'); g2.addColorStop(0.5,'#e74c3c'); g2.addColorStop(1,'#922b21');
  ctx.fillStyle = g2; ctx.shadowBlur = 10; ctx.shadowColor = '#e74c3c55';
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(wx2-s2/2,-(6+s2),s2,s2,4) : ctx.fillRect(wx2-s2/2,-(6+s2),s2,s2);
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle='#fff'; ctx.font=`bold ${Math.min(13,s2/2.5)}px monospace`; ctx.textAlign='center';
  ctx.fillText(F2+'N', wx2, -(6+s2/2)+4);
  ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='8px monospace';
  ctx.fillText('M₂='+M2.toFixed(1)+'Nm', wx2, -(6+s2)-18);

  ctx.restore();

  // Labels
  ctx.fillStyle='#1565c0'; ctx.font='bold 13px Nunito,sans-serif'; ctx.textAlign='left';
  ctx.fillText(`M₁ = ${M1.toFixed(1)} Nm  ↺`, 16, 24);
  ctx.fillStyle='#c0392b'; ctx.textAlign='right';
  ctx.fillText(`↻  M₂ = ${M2.toFixed(1)} Nm`, W-16, 24);
  // Angle display
  const angDeg = (angle * 180 / Math.PI).toFixed(1);
  ctx.fillStyle='#7f8c8d'; ctx.font='10px monospace'; ctx.textAlign='center';
  ctx.fillText(`Góc nghiêng: ${angDeg}°`, W/2, H-12);
}
