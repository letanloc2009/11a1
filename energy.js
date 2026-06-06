/* ==================== ĐỘNG NĂNG - THẾ NĂNG ==================== */
let energyRunning = false, energyRAF = null;
let kePhase = 0, peY = 0;

function switchEnergyTab(tab) {
  const tabKe = document.getElementById('tab-ke');
  const tabPe = document.getElementById('tab-pe');
  tabKe.classList.toggle('active', tab === 'ke');
  tabPe.classList.toggle('active', tab === 'pe');
  document.getElementById('panel-ke').style.display = tab === 'ke' ? 'block' : 'none';
  document.getElementById('panel-pe').style.display = tab === 'pe' ? 'block' : 'none';
  if(tab === 'ke') resetKE(); else resetPE();
}
function resetEnergy() { switchEnergyTab('ke'); }
function toggleEnergySim() {} // Dummy để bọc logic từ showPage (vì code HTML đã tách riêng nút Chạy)

function calcKE() {
  const m = parseFloat(document.getElementById('ke-mass').value) || 60;
  const v = parseFloat(document.getElementById('ke-velocity').value) || 5;
  const ke = 0.5 * m * v * v;
  document.getElementById('ke-m-val').innerHTML = m + '<span class="dc-unit">kg</span>';
  document.getElementById('ke-v-val').innerHTML = v.toFixed(1) + '<span class="dc-unit">m/s</span>';
  document.getElementById('ke-result-val').innerHTML = ke.toFixed(1) + '<span class="dc-unit">J</span>';
  document.getElementById('ke-formula-display').innerHTML = `Wđ = ½ × ${m} × ${v}² = <b>${ke.toFixed(1)} J</b>`;
  drawKEFrame();
}
function toggleKE() {
  energyRunning = !energyRunning;
  document.getElementById('ke-btn').textContent = energyRunning ? '⏸ Dừng' : '▶ Chạy';
  if (energyRunning) requestAnimationFrame(keLoop);
  else cancelAnimationFrame(energyRAF);
}
function resetKE() {
  energyRunning = false; cancelAnimationFrame(energyRAF); kePhase = 0;
  document.getElementById('ke-btn').textContent = '▶ Chạy'; calcKE();
}
function keLoop() {
  const v = parseFloat(document.getElementById('ke-velocity').value) || 5;
  kePhase += v * 0.5; drawKEFrame();
  if (energyRunning) energyRAF = requestAnimationFrame(keLoop);
}
function drawKEFrame() {
  const c = document.getElementById('ke-canvas'); if(!c) return;
  const ctx = c.getContext('2d'); const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);

  // Sky gradient
  const sky = ctx.createLinearGradient(0,0,0,H-40);
  sky.addColorStop(0,'#87CEEB'); sky.addColorStop(0.6,'#b0e0f8'); sky.addColorStop(1,'#c8f0e8');
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);

  // Clouds
  function cloud(x, y, r) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    [0,r*0.6,-r*0.6,r*1.1,-r*1.1].forEach((dx,i) => {
      ctx.beginPath(); ctx.arc(x+dx, y+(i%2===0?0:-r*0.2), r*(i===0?1:0.72), 0, Math.PI*2); ctx.fill();
    });
  }
  cloud(80, 30, 22); cloud(300, 20, 18); cloud(520, 38, 25); cloud(650, 18, 16);

  // Road surface
  ctx.fillStyle = '#4a5568'; ctx.fillRect(0, H-50, W, 50);
  ctx.fillStyle = '#2d3748'; ctx.fillRect(0, H-50, W, 8);
  // Road dashes
  ctx.strokeStyle = '#fdcb6e'; ctx.lineWidth = 3; ctx.setLineDash([28,20]);
  ctx.beginPath(); ctx.moveTo(0, H-26); ctx.lineTo(W, H-26); ctx.stroke();
  ctx.setLineDash([]);
  // Road markings animated
  ctx.fillStyle = '#718096';
  for(let x = -(kePhase%80); x < W; x += 80) { ctx.fillRect(x, H-50, 40, 8); }

  // Buildings in background
  const bColors = ['#2c3e50','#34495e','#2e4057','#1a252f'];
  [[30,80,40,H-50],[100,60,35,H-50],[160,100,50,H-50],[550,70,45,H-50],[620,90,38,H-50]].forEach(([bx,bh,bw,by],i) => {
    ctx.fillStyle = bColors[i%bColors.length];
    ctx.fillRect(bx, by-bh, bw, bh);
    // Windows
    ctx.fillStyle = 'rgba(255,235,150,0.5)';
    for(let wy=by-bh+8; wy<by-8; wy+=14)
      for(let wx=bx+5; wx<bx+bw-5; wx+=12)
        ctx.fillRect(wx, wy, 6, 8);
  });

  const v = parseFloat(document.getElementById('ke-velocity').value) || 5;
  const m = parseFloat(document.getElementById('ke-mass').value) || 60;
  const ke = 0.5 * m * v * v;

  // Runner position
  const rx = 130, ry = H - 50;
  const bounce = Math.sin(kePhase * 0.13) * 5;
  const t = kePhase;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(rx, ry, 22, 5, 0, 0, Math.PI*2); ctx.fill();

  // ---- Detailed runner ----
  ctx.save();
  ctx.translate(rx, ry + bounce);

  // Shoes
  const legSwing = Math.sin(t * 0.18) * 0.6;
  // Left leg
  const lLegAng = legSwing;
  const lFootX = Math.sin(lLegAng)*22, lKneeX = Math.sin(lLegAng)*12;
  const lLegY = -8, lKneeY = -24, lFootY = 0;
  ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(lKneeX, lKneeY); ctx.lineTo(lFootX, lLegY); ctx.stroke();
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(lFootX, lLegY, 10, 5, lLegAng*0.3, 0, Math.PI*2); ctx.fill();
  // Right leg
  const rLegAng = -legSwing;
  const rFootX = Math.sin(rLegAng)*22, rKneeX = Math.sin(rLegAng)*12;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(rKneeX, lKneeY); ctx.lineTo(rFootX, lLegY); ctx.stroke();
  ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.ellipse(rFootX, lLegY, 10, 5, rLegAng*0.3, 0, Math.PI*2); ctx.fill();

  // Shorts
  ctx.fillStyle = '#2980b9';
  ctx.beginPath(); ctx.ellipse(0, -32, 12, 8, 0, 0, Math.PI*2); ctx.fill();

  // Torso – jersey
  const jerseyGrad = ctx.createLinearGradient(-12,-60,12,-30);
  jerseyGrad.addColorStop(0,'#e74c3c'); jerseyGrad.addColorStop(1,'#c0392b');
  ctx.fillStyle = jerseyGrad;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-10,-62,20,30,3) : ctx.fillRect(-10,-62,20,30);
  ctx.fill();
  // Number on jersey
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
  ctx.fillText('1', 0, -44);

  // Arms
  const armSwing = -legSwing * 0.7;
  ctx.strokeStyle = '#F5CBA7'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-4, -54);
  ctx.lineTo(-4 + Math.sin(armSwing)*20, -40 + Math.cos(armSwing)*10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, -54);
  ctx.lineTo(4 - Math.sin(armSwing)*20, -40 + Math.cos(armSwing)*10); ctx.stroke();

  // Head
  ctx.fillStyle = '#F5CBA7';
  ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.beginPath(); ctx.arc(0, -72, 12, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  // Hair
  ctx.fillStyle = '#2c1810';
  ctx.beginPath(); ctx.arc(0, -79, 8, Math.PI, 0); ctx.fill();
  // Face
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-4, -71, 2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -71, 2, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -68, 4, 0.2, Math.PI-0.2); ctx.stroke();
  // Headband
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(0, -72, 12, -Math.PI*0.7, -Math.PI*0.3); ctx.stroke();

  ctx.restore();

  // Velocity arrow
  ctx.strokeStyle = '#e17055'; ctx.lineWidth = 2.5;
  const arrowLen = Math.min(v * 10, 140);
  ctx.shadowBlur = 6; ctx.shadowColor = '#e17055';
  ctx.beginPath(); ctx.moveTo(rx+18, ry-55+bounce); ctx.lineTo(rx+18+arrowLen, ry-55+bounce); ctx.stroke();
  ctx.fillStyle = '#e17055';
  ctx.beginPath(); ctx.moveTo(rx+26+arrowLen, ry-55+bounce); ctx.lineTo(rx+12+arrowLen, ry-61+bounce); ctx.lineTo(rx+12+arrowLen, ry-49+bounce); ctx.closePath(); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.font = 'bold 11px Space Mono,monospace'; ctx.fillStyle = '#e17055'; ctx.textAlign = 'center';
  ctx.fillText('v = '+v+' m/s', rx+18+arrowLen/2, ry-66+bounce);

  // KE bar
  const barX = W - 100, barY = 16, barMaxH = H - 80;
  const barFill = Math.min(ke / 15000, 1);
  ctx.fillStyle = '#2d3748'; ctx.fillRect(barX, barY, 28, barMaxH);
  const keGrad = ctx.createLinearGradient(0,barY+barMaxH,0,barY);
  keGrad.addColorStop(0,'#fdcb6e'); keGrad.addColorStop(0.5,'#e17055'); keGrad.addColorStop(1,'#d63031');
  ctx.fillStyle = keGrad;
  ctx.fillRect(barX, barY+barMaxH*(1-barFill), 28, barMaxH*barFill);
  ctx.strokeStyle='#4a5568'; ctx.lineWidth=1; ctx.strokeRect(barX,barY,28,barMaxH);
  ctx.fillStyle='#2d3436'; ctx.font='bold 10px Nunito,sans-serif'; ctx.textAlign='center';
  ctx.fillText('Wđ', barX+14, barY+barMaxH+14);
  ctx.fillStyle='#e17055'; ctx.font='bold 9px monospace';
  ctx.fillText(ke.toFixed(0)+'J', barX+14, Math.max(barY+barMaxH*(1-barFill)-5, barY+12));
}

function calcPE() {
  const m = parseFloat(document.getElementById('pe-mass').value) || 55;
  const h = parseFloat(document.getElementById('pe-height').value) || 5;
  const pe = m * 9.8 * h;
  const vland = Math.sqrt(2 * 9.8 * h);
  document.getElementById('pe-m-val').innerHTML = m + '<span class="dc-unit">kg</span>';
  document.getElementById('pe-h-val').innerHTML = h.toFixed(1) + '<span class="dc-unit">m</span>';
  document.getElementById('pe-result-val').innerHTML = pe.toFixed(0) + '<span class="dc-unit">J</span>';
  document.getElementById('pe-vland-val').innerHTML = vland.toFixed(1) + '<span class="dc-unit">m/s</span>';
  document.getElementById('pe-formula-display').innerHTML = `Wt = mgh = ${m} × 9.8 × ${h} = <b>${pe.toFixed(0)} J</b> | v chạm nước = <b>${vland.toFixed(1)} m/s</b>`;
  drawPEFrame();
}
function togglePE() {
  if(!energyRunning) {
    energyRunning = true; peY = 0; kePhase = 0;
    document.getElementById('pe-btn').textContent = '⏸ Đang rơi...';
    requestAnimationFrame(peLoop);
  }
}
function resetPE() {
  energyRunning = false; cancelAnimationFrame(energyRAF); peY = 0; kePhase = 0;
  document.getElementById('pe-btn').textContent = '▶ Nhảy!'; calcPE();
}
function peLoop() {
  kePhase += 0.05; peY = 0.5 * 9.8 * kePhase * kePhase * 8; 
  if(peY > 150) { peY = 150; energyRunning = false; document.getElementById('pe-btn').textContent = '▶ Chạm nước'; }
  drawPEFrame();
  if(energyRunning) energyRAF = requestAnimationFrame(peLoop);
}
function drawPEFrame() {
  const c = document.getElementById('pe-canvas'); if(!c) return;
  const ctx = c.getContext('2d'); const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  // Sky gradient
  const sky = ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#74b9ff'); sky.addColorStop(0.6,'#a8d8ea'); sky.addColorStop(1,'#55efc4');
  ctx.fillStyle = sky; ctx.fillRect(0,0,W,H);
  // Pool water
  const waterY = H - 56;
  const waterGrad = ctx.createLinearGradient(0,waterY,0,H);
  waterGrad.addColorStop(0,'#0984e3'); waterGrad.addColorStop(1,'#2d3436');
  ctx.fillStyle = waterGrad; ctx.fillRect(0, waterY, W, 56);
  // Water shimmer
  ctx.strokeStyle='rgba(255,255,255,0.3)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=30){ctx.beginPath();ctx.moveTo(x,waterY+4);ctx.quadraticCurveTo(x+15,waterY+1,x+30,waterY+4);ctx.stroke();}
  // Pool edge
  ctx.fillStyle = '#b2bec3'; ctx.fillRect(0, waterY-6, W, 6);

  // Diving platform
  const platX = 60, platY = H - 200;
  ctx.fillStyle = '#636e72'; ctx.fillRect(platX-10, platY, 120, 10);
  ctx.fillStyle = '#b2bec3';
  ctx.fillRect(platX+100, platY, 15, 200 - 56); // pole
  ctx.fillStyle = '#74b9ff'; ctx.fillRect(platX-10, platY-2, 120, 4); // board

  const h = parseFloat(document.getElementById('pe-height').value) || 5;
  const m = parseFloat(document.getElementById('pe-mass').value) || 55;
  const totalE = m * 9.8 * h;
  const curY = platY - 30 + peY;
  const p = Math.min(peY / 150, 1);
  
  // Person (detailed diver)
  const px = platX + 55;
  ctx.save();
  ctx.translate(px, curY);
  
  // Dive pose: body rotates as falling progresses
  const diveAngle = p * 0.7; // lean forward during fall
  ctx.rotate(diveAngle);
  
  // Shadow (projected)
  ctx.restore();
  ctx.save();
  ctx.translate(px, curY);
  
  // Legs
  const legSpread = p * 12; // legs spread as diving
  ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-legSpread*0.6, 36); ctx.stroke(); // left leg
  ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(legSpread*0.6, 36); ctx.stroke(); // right leg
  // Swimsuit shorts
  ctx.fillStyle = '#d63031';
  ctx.beginPath(); ctx.ellipse(0, 14, 9, 7, 0, 0, Math.PI*2); ctx.fill();
  // Torso - swimsuit
  const torsoGrad = ctx.createLinearGradient(-8, -18, 8, 12);
  torsoGrad.addColorStop(0, '#e74c3c');
  torsoGrad.addColorStop(1, '#c0392b');
  ctx.fillStyle = torsoGrad;
  if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(-8, -18, 16, 30, 3); ctx.fill(); }
  else { ctx.fillRect(-8, -18, 16, 30); }
  // Arms raised overhead (diving posture)
  const armRaise = p * 1.2;
  ctx.strokeStyle = '#F5CBA7'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-4, -10); 
  ctx.lineTo(-4 - Math.sin(armRaise)*16, -10 - Math.cos(armRaise)*18); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, -10); 
  ctx.lineTo(4 + Math.sin(armRaise)*16, -10 - Math.cos(armRaise)*18); ctx.stroke();
  // Head
  ctx.fillStyle = '#F5CBA7';
  ctx.shadowBlur = 5; ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.arc(0, -28, 12, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  // Swim cap
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.ellipse(0, -32, 12, 8, 0, Math.PI, 0); ctx.fill();
  // Goggles
  ctx.fillStyle = '#3498db';
  ctx.beginPath(); ctx.arc(-4, -27, 4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -27, 4, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = 'rgba(52,152,219,0.4)';
  ctx.beginPath(); ctx.arc(-4, -27, 3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -27, 3, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-8, -27); ctx.lineTo(-8, -27); ctx.arc(-4, -27, 4, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.arc(4, -27, 4, Math.PI, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -27); ctx.lineTo(0, -25); ctx.stroke(); // nose bridge
  // Smile or determined face
  ctx.strokeStyle = '#2c3e50'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -24, 3, 0.2, Math.PI-0.2); ctx.stroke();
  
  ctx.restore();

  // Energy labels
  if(peY > 5 || energyRunning) {
    ctx.font = 'bold 11px Space Mono,monospace'; ctx.textAlign = 'left';
    ctx.fillStyle = '#ffeaa7';
    ctx.fillText(`Wt: ${(totalE*(1-p)).toFixed(0)} J`, px+20, curY-10);
    ctx.fillStyle = '#ff7675';
    ctx.fillText(`Wđ: ${(totalE*p).toFixed(0)} J`, px+20, curY+6);
  }
  
  // Height arrow
  if(!energyRunning && peY < 5) {
    ctx.strokeStyle='#fdcb6e'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(platX-25, platY); ctx.lineTo(platX-25, waterY-6); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#fdcb6e'; ctx.font='10px Nunito,sans-serif'; ctx.textAlign='center';
    ctx.fillText('h='+h+'m', platX-40, (platY+waterY)/2);
  }
}
