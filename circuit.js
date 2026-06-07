/* ==================== CIRCUIT ==================== */
let circuitClosed = false;

// Tự động resize canvas theo kích thước hiển thị (PC/iPad/điện thoại)
let circuitCanvasBound = false;
function ensureCircuitCanvasSize() {
  const c = document.getElementById('circuit-canvas');
  if (!c || !c.parentElement) return;
  const wrap = c.parentElement;
  const cssW = Math.max(280, wrap.clientWidth || 700);
  // giữ tỉ lệ gần giống thiết kế (700x320)
  const cssH = Math.max(220, Math.round(cssW * (320 / 700)));
  c.style.height = cssH + 'px';
  const dpr = window.devicePixelRatio || 1;
  const newW = Math.round(cssW * dpr);
  const newH = Math.round(cssH * dpr);
  if (c.width !== newW || c.height !== newH) {
    c.width = newW;
    c.height = newH;
  }
  if (!circuitCanvasBound) {
    circuitCanvasBound = true;
    window.addEventListener('resize', () => {
      ensureCircuitCanvasSize();
      drawCircuit(circuitClosed, 0, 0);
    }, { passive: true });
  }
}

function setSwitch(closed) {
  circuitClosed = closed;
  runCircuit();
}

function resetCircuit() {
  circuitClosed = false;
  ['circ-A','circ-V','circ-Rtotal','circ-P'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '–<span class="dc-unit">' + (id==='circ-A'?'A':id==='circ-V'?'V':id==='circ-Rtotal'?'Ω':'W') + '</span>';
  });
  ensureCircuitCanvasSize();
  drawCircuit(false, 0, 0);
}

function runCircuit() {
  const E = parseFloat(document.getElementById('circuit-emf').value) || 12;
  const R1 = parseFloat(document.getElementById('circuit-r1').value) || 10;
  const R2 = parseFloat(document.getElementById('circuit-r2').value) || 10;
  const RL = parseFloat(document.getElementById('circuit-lamp').value) || 5;
  const type = document.getElementById('circuit-type').value;
  let Rtotal;
  if (type === 'series') Rtotal = R1 + R2 + RL;
  else if (type === 'parallel') Rtotal = (1/(1/R1 + 1/R2)) + RL;
  else Rtotal = 1/(1/R1 + 1/(R2+RL));
  const I = circuitClosed ? E / Rtotal : 0;
  const V = circuitClosed ? I * RL : 0;
  const P = circuitClosed ? E * I : 0;
  document.getElementById('circ-A').innerHTML = I.toFixed(2) + '<span class="dc-unit">A</span>';
  document.getElementById('circ-V').innerHTML = (I*RL).toFixed(2) + '<span class="dc-unit">V</span>';
  document.getElementById('circ-Rtotal').innerHTML = Rtotal.toFixed(1) + '<span class="dc-unit">Ω</span>';
  document.getElementById('circ-P').innerHTML = P.toFixed(2) + '<span class="dc-unit">W</span>';
  drawCircuit(circuitClosed, I, E);
}


function drawCircuit(closed, I, E) {
  const c = document.getElementById('circuit-canvas'); if (!c) return;
  ensureCircuitCanvasSize();
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  // Nền phòng lab (sáng, dễ nhìn)
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, '#eef6ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Lưới nền nhẹ
  ctx.strokeStyle = 'rgba(13, 27, 42, 0.06)'; ctx.lineWidth = 1;
  for(let x=0; x<W; x+=30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for(let y=0; y<H; y+=30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  const type = document.getElementById('circuit-type').value;
  const R1 = parseFloat(document.getElementById('circuit-r1').value)||10;
  const R2 = parseFloat(document.getElementById('circuit-r2').value)||10;
  const RL = parseFloat(document.getElementById('circuit-lamp').value)||5;
  const glow = closed && I > 0.01;
  const wireColor = glow ? '#f9a825' : '#2c3e50';
  const lineW = glow ? 3 : 2;
  const shadowC = glow ? 'rgba(249,168,37,0.85)' : 'transparent';

  function wire(x1,y1,x2,y2, color, lw, sh) {
    ctx.save();
    if(sh) { ctx.shadowBlur=10; ctx.shadowColor=sh; }
    ctx.strokeStyle=color||wireColor; ctx.lineWidth=lw||lineW;
    ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.restore();
  }

  // Hàm vẽ điện trở (hình chữ nhật – kiểu IEC)
  function drawResistor(x, y, w, label, value) {
    const lead = Math.max(10, w * 0.18);
    const bodyW = Math.max(18, w - lead * 2);
    const bodyH = Math.max(16, Math.min(22, H * 0.06));
    const yTop = y - bodyH / 2;
    const xBody = x + lead;

    // thân điện trở
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = glow ? '#fb8c00' : '#607d8b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(xBody, yTop, bodyW, bodyH, 4);
    else ctx.rect(xBody, yTop, bodyW, bodyH);
    ctx.fill(); ctx.stroke();

    // nhãn
    ctx.fillStyle = '#1a2640';
    ctx.font = 'bold 11px Space Mono,monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y - bodyH / 2 - 10);
    ctx.fillStyle = '#1565c0';
    ctx.font = '10px monospace';
    ctx.fillText(value + 'Ω', x + w / 2, y + bodyH / 2 + 16);
  }

  // Hàm vẽ bóng đèn
  function drawLamp(cx, cy, label, glowing) {
    ctx.save();
    if(glowing) { ctx.shadowBlur=30; ctx.shadowColor='#fff176'; }
    // Vòng tròn bóng đèn
    ctx.strokeStyle = glowing ? '#fb8c00' : '#607d8b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.stroke();
    // Dấu x bên trong
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx-9, cy-9); ctx.lineTo(cx+9, cy+9); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx+9, cy-9); ctx.lineTo(cx-9, cy+9); ctx.stroke();
    if(glowing) {
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#fff176';
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    ctx.fillStyle = glowing ? '#fb8c00' : '#1a2640';
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy - 20);
  }

  // Hàm vẽ nguồn điện (pin)
  function drawBattery(cx, cy, voltage) {
    const bw=14, bh=36;
    // Thân pin
    ctx.fillStyle = '#e3f2fd';
    ctx.strokeStyle = '#1565c0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx-bw/2-4,cy-bh/2-6,bw+8,bh+12,4): ctx.rect(cx-bw/2-4,cy-bh/2-6,bw+8,bh+12); ctx.fill(); ctx.stroke();
    // Vạch cực
    ctx.strokeStyle = '#ef5350'; ctx.lineWidth = 3; // cực dương (+)
    ctx.beginPath(); ctx.moveTo(cx-bw/2,cy-bh/2); ctx.lineTo(cx+bw/2,cy-bh/2); ctx.stroke();
    ctx.strokeStyle = '#90caf9'; ctx.lineWidth = 2; // cực âm (-)
    ctx.beginPath(); ctx.moveTo(cx-bw/2+4,cy+bh/2); ctx.lineTo(cx+bw/2-4,cy+bh/2); ctx.stroke();
    // Ký hiệu + và -
    ctx.fillStyle = '#ef5350'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('+', cx, cy-bh/2-10);
    ctx.fillStyle = '#90caf9'; ctx.fillText('–', cx, cy+bh/2+12);
    // Giá trị E
    ctx.fillStyle = '#fb8c00'; ctx.font = 'bold 10px monospace';
    ctx.fillText(voltage+'V', cx, cy+3);
    ctx.fillStyle = '#1565c0'; ctx.font = '9px monospace'; ctx.fillText('Pin', cx, cy-8);
  }

  // Hàm vẽ ampe kế
  function drawAmmeter(cx, cy, iVal) {
    ctx.save();
    if(glow) { ctx.shadowBlur=8; ctx.shadowColor='#80ff80'; }
    ctx.strokeStyle = glow ? '#69f0ae' : '#546e7a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#1b5e20'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('A', cx, cy+4);
    if(closed) {
      ctx.fillStyle = '#69f0ae'; ctx.font = '9px monospace';
      ctx.fillText(iVal+'A', cx, cy+20);
    }
  }

  // Hàm vẽ vôn kế
  function drawVoltmeter(cx, cy, vVal) {
    ctx.save();
    ctx.strokeStyle = glow ? '#80b4ff' : '#546e7a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#0d47a1'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
    ctx.fillText('V', cx, cy+4);
    if(closed) {
      ctx.fillStyle = '#80b4ff'; ctx.font = '9px monospace';
      ctx.fillText(vVal+'V', cx, cy+20);
    }
  }

  // Hàm vẽ khóa K
  function drawSwitch(x, y, isClosed) {
    ctx.strokeStyle = glow && isClosed ? '#ffd54f' : '#90a4ae'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x-14, y); ctx.lineTo(x-4, y); ctx.stroke();
    ctx.beginPath(); ctx.arc(x-4, y, 3, 0, Math.PI*2); ctx.fillStyle='#90a4ae'; ctx.fill();
    if(isClosed) {
      ctx.beginPath(); ctx.moveTo(x-4, y); ctx.lineTo(x+4, y); ctx.lineTo(x+14, y); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(x-4, y); ctx.lineTo(x+10, y-12); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(x+14, y, 3, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#90a4ae'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    ctx.fillText('K', x, y+14);
  }



  // Tọa độ tương đối để mạch hiển thị ổn trên nhiều màn hình
  const left = W * 0.10, right = W * 0.90;
  const top = H * 0.22, bot = H * 0.82;
  const mid = (top + bot) / 2;
  const lampR = Math.max(14, Math.min(18, H * 0.07));
  const rLen = Math.max(W * 0.08, Math.min(W * 0.14, (right - left) * 0.12));

  if(type === 'series') {
    // pin → K → A → R1 → R2 (trên) → đèn (bên phải) → về pin
    // khung ngoài
    wire(left, top, left, bot, wireColor, lineW, shadowC);
    wire(left, bot, right, bot, wireColor, lineW, shadowC);

    const batX = left, batY = mid;
    const swX = left + (right-left) * 0.18, swY = top;
    const amX = left + (right-left) * 0.32, amY = top;
    const r1X = left + (right-left) * 0.42, rY = top;
    const r2X = left + (right-left) * 0.58;

    // dây trên (tách đoạn để không đè lên dụng cụ)
    wire(left, top, swX - 14, top, wireColor, lineW, shadowC);
    wire(swX + 14, top, amX - 14, top, wireColor, lineW, shadowC);
    wire(amX + 14, top, r1X, top, wireColor, lineW, shadowC);
    wire(r1X + rLen, top, r2X, top, wireColor, lineW, shadowC);
    wire(r2X + rLen, top, right, top, wireColor, lineW, shadowC);

    // ngắt dây phải để đặt đèn
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000'; ctx.lineWidth = lineW + 4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(right, mid - lampR - 4); ctx.lineTo(right, mid + lampR + 4); ctx.stroke();
    ctx.restore();
    wire(right, top, right, mid - lampR, wireColor, lineW, shadowC);
    wire(right, mid + lampR, right, bot, wireColor, lineW, shadowC);

    drawBattery(batX, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));
    drawResistor(r1X, rY, rLen, 'R₁', R1);
    drawResistor(r2X, rY, rLen, 'R₂', R2);
    drawLamp(right, mid, 'Đèn', glow);

    // Vôn kế song song với đèn
    const vmX = right - (right-left) * 0.12;
    const vmY = mid;
    const vVal = (I * RL).toFixed(1);
    ctx.save();
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    // dây đo tới 2 đầu bóng đèn
    ctx.beginPath(); ctx.moveTo(vmX + 14, vmY - 10); ctx.lineTo(right, mid - lampR); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vmX + 14, vmY + 10); ctx.lineTo(right, mid + lampR); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    drawVoltmeter(vmX, vmY, vVal);

  } else if(type === 'parallel') {
    // pin → K → A → (R1 // R2) → đèn → về
    // khung ngoài cơ bản
    wire(left, top, left, bot, wireColor, lineW, shadowC);
    wire(left, bot, right, bot, wireColor, lineW, shadowC);

    const batX = left, batY = mid;
    const swX = left + (right-left) * 0.18, swY = top;
    const amX = left + (right-left) * 0.32, amY = top;
    const jL = left + (right-left) * 0.44;
    const jR = left + (right-left) * 0.64;
    const branchTop = top + (bot-top) * 0.18;
    const branchBot = top + (bot-top) * 0.42;

    // dây trên đến nút jL và từ jR về phải
    wire(left, top, swX - 14, top, wireColor, lineW, shadowC);
    wire(swX + 14, top, amX - 14, top, wireColor, lineW, shadowC);
    wire(amX + 14, top, jL, top, wireColor, lineW, shadowC);
    wire(jR, top, right, top, wireColor, lineW, shadowC);

    // nhánh song song
    wire(jL, top, jL, branchTop, wireColor, lineW, shadowC);
    wire(jL, branchTop, jL + 10, branchTop, wireColor, lineW, shadowC);
    wire(jR - 10, branchTop, jR, branchTop, wireColor, lineW, shadowC);
    wire(jR, branchTop, jR, top, wireColor, lineW, shadowC);
    drawResistor(jL + 10, branchTop, jR - jL - 20, 'R₁', R1);

    wire(jL, top, jL, branchBot, wireColor, lineW, shadowC);
    wire(jL, branchBot, jL + 10, branchBot, wireColor, lineW, shadowC);
    wire(jR - 10, branchBot, jR, branchBot, wireColor, lineW, shadowC);
    wire(jR, branchBot, jR, top, wireColor, lineW, shadowC);
    drawResistor(jL + 10, branchBot, jR - jL - 20, 'R₂', R2);

    // đặt đèn trên dây phải
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000'; ctx.lineWidth = lineW + 4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(right, mid - lampR - 4); ctx.lineTo(right, mid + lampR + 4); ctx.stroke();
    ctx.restore();
    wire(right, top, right, mid - lampR, wireColor, lineW, shadowC);
    wire(right, mid + lampR, right, bot, wireColor, lineW, shadowC);
    drawLamp(right, mid, 'Đèn', glow);

    // vôn kế song song đèn
    const vmX = right - (right-left) * 0.12;
    const vmY = mid;
    const vVal = (I * RL).toFixed(1);
    ctx.save();
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(vmX + 14, vmY - 10); ctx.lineTo(right, mid - lampR); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vmX + 14, vmY + 10); ctx.lineTo(right, mid + lampR); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    drawVoltmeter(vmX, vmY, vVal);

    drawBattery(batX, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));

    // Junction dots
    [jL,jR].forEach(jx => {
      ctx.fillStyle = wireColor; ctx.beginPath(); ctx.arc(jx, top, 5, 0, Math.PI*2); ctx.fill();
    });

  } else { // mixed
    // pin → K → A → (R1 // (R2 + đèn)) → về
    // khung ngoài cơ bản
    wire(left, top, left, bot, wireColor, lineW, shadowC);
    wire(left, bot, right, bot, wireColor, lineW, shadowC);
    wire(right, bot, right, top, wireColor, lineW, shadowC);

    const batX = left, batY = mid;
    const swX = left + (right-left) * 0.18, swY = top;
    const amX = left + (right-left) * 0.32, amY = top;
    const jL = left + (right-left) * 0.46;
    const jR = left + (right-left) * 0.70;
    const branchTop = top - (bot-top) * 0.20;
    const branchMid = top + (bot-top) * 0.18;

    // dây trên: trái → K → A → jL, và jR → phải
    wire(left, top, swX - 14, top, wireColor, lineW, shadowC);
    wire(swX + 14, top, amX - 14, top, wireColor, lineW, shadowC);
    wire(amX + 14, top, jL, top, wireColor, lineW, shadowC);
    wire(jR, top, right, top, wireColor, lineW, shadowC);

    // Nhánh trên: R1
    wire(jL, top, jL, branchTop, wireColor, lineW, shadowC);
    wire(jL, branchTop, jL + 12, branchTop, wireColor, lineW, shadowC);
    wire(jR - 12, branchTop, jR, branchTop, wireColor, lineW, shadowC);
    wire(jR, branchTop, jR, top, wireColor, lineW, shadowC);
    drawResistor(jL + 12, branchTop, jR - jL - 24, 'R₁', R1);

    // Nhánh dưới: R2 nối tiếp Đèn (đặt đèn ngay trước jR để dễ nhìn)
    wire(jL, top, jL, branchMid, wireColor, lineW, shadowC);
    wire(jR, branchMid, jR, top, wireColor, lineW, shadowC);

    const r2StartX = jL + 12;
    const r2Len = Math.max(40, (jR - jL) * 0.40);
    const lampX = jR - Math.max(26, (jR - jL) * 0.12);

    // dây và phần tử trên nhánh dưới (tách đoạn cho rõ ràng)
    wire(jL, branchMid, r2StartX, branchMid, wireColor, lineW, shadowC);
    drawResistor(r2StartX, branchMid, r2Len, 'R₂', R2);
    wire(r2StartX + r2Len, branchMid, lampX - lampR, branchMid, wireColor, lineW, shadowC);
    wire(lampX + lampR, branchMid, jR, branchMid, wireColor, lineW, shadowC);

    // xóa đoạn dây tại vị trí đèn để không chồng lên hình
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000'; ctx.lineWidth = lineW + 4; ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(lampX - lampR - 6, branchMid); ctx.lineTo(lampX + lampR + 6, branchMid); ctx.stroke();
    ctx.restore();
    drawLamp(lampX, branchMid, 'Đèn', glow);

    // vôn kế song song đèn
    const vmX = lampX;
    const vmY = branchMid + (bot-top) * 0.22;
    const vVal = (I * RL).toFixed(1);
    ctx.save();
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(vmX, vmY - 14); ctx.lineTo(lampX - lampR, branchMid); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(vmX, vmY + 14); ctx.lineTo(lampX + lampR, branchMid); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
    drawVoltmeter(vmX, vmY, vVal);

    [jL,jR].forEach(jx => {
      ctx.fillStyle = wireColor; ctx.beginPath(); ctx.arc(jx, top, 5, 0, Math.PI*2); ctx.fill();
    });

    drawBattery(batX, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));
  }

  // Nhãn trạng thái dưới cùng
  ctx.font = 'bold 12px Space Mono,monospace'; ctx.textAlign = 'center';
  if(closed) {
    ctx.fillStyle = '#1b5e20';
    ctx.fillText(`✔ Mạch đóng  |  I = ${I.toFixed(2)} A  |  P = ${(E*I).toFixed(2)} W`, W/2, H-10);
  } else {
    ctx.fillStyle = '#c62828';
    ctx.fillText('✘ Mạch hở – Đóng khóa K để bật mạch', W/2, H-10);
  }
}
requestAnimationFrame(function loop(ts) {
  const cPage = document.getElementById('page-circuit');
  if(cPage && cPage.classList.contains('active') && circuitClosed) {
    const E2 = parseFloat(document.getElementById('circuit-emf').value)||12;
    const R12 = parseFloat(document.getElementById('circuit-r1').value)||10;
    const R22 = parseFloat(document.getElementById('circuit-r2').value)||10;
    const RL2 = parseFloat(document.getElementById('circuit-lamp').value)||5;
    const type2 = document.getElementById('circuit-type').value;
    let Rt; if(type2==='series') Rt=R12+R22+RL2; else if(type2==='parallel') Rt=(1/(1/R12+1/R22))+RL2; else Rt=1/(1/R12+1/(R22+RL2));
    const I2 = E2/Rt;
    drawCircuit(true, I2, E2);
  }
  requestAnimationFrame(loop);
});

function toggleCircuit() {
  circuitClosed = !circuitClosed;
  const btn = document.getElementById('circuit-main-btn');
  if (btn) btn.textContent = circuitClosed ? '🔴 MỞ MẠCH' : '⚡ ĐÓNG MẠCH';
  runCircuit();
}
