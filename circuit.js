/* ==================== CIRCUIT ==================== */
let circuitClosed = false;

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
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  // Nền phòng lab tối
  const bg = ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#0a0f1a'); bg.addColorStop(1,'#0d1520');
  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  // Lưới nền nhẹ
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'; ctx.lineWidth = 1;
  for(let x=0; x<W; x+=30) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for(let y=0; y<H; y+=30) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  const type = document.getElementById('circuit-type').value;
  const R1 = parseFloat(document.getElementById('circuit-r1').value)||10;
  const R2 = parseFloat(document.getElementById('circuit-r2').value)||10;
  const RL = parseFloat(document.getElementById('circuit-lamp').value)||5;
  const glow = closed && I > 0.01;
  const wireColor = glow ? '#ffd54f' : '#445566';
  const lineW = glow ? 3 : 2;
  const shadowC = glow ? '#ffd54f' : 'transparent';

  function wire(x1,y1,x2,y2, color, lw, sh) {
    ctx.save();
    if(sh) { ctx.shadowBlur=10; ctx.shadowColor=sh; }
    ctx.strokeStyle=color||wireColor; ctx.lineWidth=lw||lineW;
    ctx.lineCap='round';
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.restore();
  }

  // Hàm vẽ điện trở (zig-zag chuẩn)
  function drawResistor(x, y, w, label, value) {
    const h2 = 10, segs = 8;
    ctx.fillStyle = '#1a2640';
    ctx.strokeStyle = glow ? '#ffa726' : '#607d8b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y);
    for(let i = 0; i <= segs; i++) {
      const px = x + (w/segs)*i;
      const py = y + (i%2===0 ? -h2 : h2);
      ctx.lineTo(px, py);
    }
    ctx.lineTo(x+w, y); ctx.stroke();
    // Nhãn
    ctx.fillStyle = '#b0c4de'; ctx.font = 'bold 11px Space Mono,monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, x+w/2, y-18);
    ctx.fillStyle = '#7cb9ff'; ctx.font = '10px monospace';
    ctx.fillText(value+'Ω', x+w/2, y+24);
  }

  // Hàm vẽ bóng đèn
  function drawLamp(cx, cy, label, glowing) {
    ctx.save();
    if(glowing) { ctx.shadowBlur=30; ctx.shadowColor='#fff176'; }
    // Vòng tròn bóng đèn
    ctx.strokeStyle = glowing ? '#ffd54f' : '#607d8b'; ctx.lineWidth = 2.5;
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
    ctx.fillStyle = glowing ? '#ffd54f' : '#b0c4de';
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy - 20);
  }

  // Hàm vẽ nguồn điện (pin)
  function drawBattery(cx, cy, voltage) {
    const bw=14, bh=36;
    // Thân pin
    ctx.fillStyle = '#1e3a5f';
    ctx.strokeStyle = '#90caf9'; ctx.lineWidth = 2;
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
    ctx.fillStyle = '#ffe082'; ctx.font = 'bold 10px monospace';
    ctx.fillText(voltage+'V', cx, cy+3);
    ctx.fillStyle = '#7cb9ff'; ctx.font = '9px monospace'; ctx.fillText('Pin', cx, cy-8);
  }

  // Hàm vẽ ampe kế
  function drawAmmeter(cx, cy, iVal) {
    ctx.save();
    if(glow) { ctx.shadowBlur=8; ctx.shadowColor='#80ff80'; }
    ctx.strokeStyle = glow ? '#69f0ae' : '#546e7a'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI*2); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#aaffaa'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
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
    ctx.fillStyle = '#aaccff'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
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



  if(type === 'series') {
    // Layout nối tiếp: pin → K → Ammeter → R1 → R2 → Lamp → về pin
    // Đường chính: chữ nhật lớn
    const left=60, right=640, top=80, bot=240;
    const batX=left+30, batY=(top+bot)/2;
    const swX=left+110, swY=top;
    const amX=left+200, amY=top;
    const r1X=left+280, r1Y=top;
    const r2X=left+400, r2Y=top;
    const lampX=right-40, lampY=(top+bot)/2;

    wire(left, top, left, bot, wireColor, lineW, shadowC); // dây trái (pin)
    wire(left, bot, right, bot, wireColor, lineW, shadowC); // dây dưới
    wire(right, bot, right, top, wireColor, lineW, shadowC); // dây phải (đèn)
    wire(right, top, lampX+15, top, wireColor, lineW, shadowC);
    wire(right, bot, right, lampY+15, wireColor, lineW, shadowC);
    wire(left, top, swX-14, top, wireColor, lineW, shadowC);
    wire(swX+14, top, amX-14, top, wireColor, lineW, shadowC);
    wire(amX+14, top, r1X, top, wireColor, lineW, shadowC);
    wire(r1X+60, top, r2X, top, wireColor, lineW, shadowC);
    wire(r2X+60, top, lampX, top, wireColor, lineW, shadowC);

    // Dây nối pin vào mạch
    wire(left, batY-18, left, top, wireColor, lineW, shadowC);
    wire(left, batY+18, left, bot, wireColor, lineW, shadowC);

    drawBattery(batX-30, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));
    drawResistor(r1X, r1Y, 60, 'R₁', R1);
    drawResistor(r2X, r2Y, 60, 'R₂', R2);
    drawLamp(lampX, lampY, 'Đèn', glow);

    // Vôn kế song song với đèn (nét đứt màu xanh)
    const vmX = lampX, vmY = bot-40;
    ctx.save(); ctx.strokeStyle='#4488ff'; ctx.lineWidth=1.5; ctx.setLineDash([5,4]);
    ctx.beginPath(); ctx.moveTo(right-4, top); ctx.lineTo(right-4, vmY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(right-4, vmY); ctx.lineTo(vmX+14, vmY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(right-4, bot-4); ctx.lineTo(right-4, vmY); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
    drawVoltmeter(vmX-15, vmY, (I*RL).toFixed(1));

  } else if(type === 'parallel') {
    // Layout song song: pin → K → Ammeter → (R1 // R2) → Lamp → về
    const left=60, right=640, top=70, mid=170, bot=260;
    const batX=left+30, batY=(top+bot)/2;
    const swX=130, swY=top;
    const amX=210, amY=top;
    const jL=290, jR=440; // junction points

    // Dây ngoài
    wire(left, batY-18, left, top, wireColor, lineW, shadowC);
    wire(left, batY+18, left, bot, wireColor, lineW, shadowC);
    wire(left, top, swX-14, top, wireColor, lineW, shadowC);
    wire(swX+14, top, amX-14, top, wireColor, lineW, shadowC);
    wire(amX+14, top, jL, top, wireColor, lineW, shadowC);
    wire(jR, top, right-30, top, wireColor, lineW, shadowC);
    wire(left, bot, right, bot, wireColor, lineW, shadowC);
    wire(right, bot, right, top, wireColor, lineW, shadowC);
    wire(right, top, right-30, top, wireColor, lineW, shadowC);

    // Nhánh R1 (trên)
    wire(jL, top, jL, mid-30, wireColor, lineW, shadowC);
    wire(jL, mid-30, jL+10, mid-30, wireColor, lineW, shadowC);
    wire(jR, mid-30, jR, top, wireColor, lineW, shadowC);
    wire(jR-10, mid-30, jR, mid-30, wireColor, lineW, shadowC);
    drawResistor(jL+10, mid-30, jR-jL-20, 'R₁', R1);

    // Nhánh R2 (dưới)
    wire(jL, top, jL, mid+30, wireColor, lineW, shadowC);
    wire(jL, mid+30, jL+10, mid+30, wireColor, lineW, shadowC);
    wire(jR, mid+30, jR, top, wireColor, lineW, shadowC);
    wire(jR-10, mid+30, jR, mid+30, wireColor, lineW, shadowC);
    drawResistor(jL+10, mid+30, jR-jL-20, 'R₂', R2);

    // Đèn nối tiếp sau song song
    const lampX = right-60, lampY=(top+bot)/2;
    wire(right, top, right, lampY-15, wireColor, lineW, shadowC);
    wire(right, lampY+15, right, bot, wireColor, lineW, shadowC);
    drawLamp(lampX+20, lampY, 'Đèn', glow);

    drawBattery(batX-30, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));

    // Junction dots
    [jL,jR].forEach(jx => {
      ctx.fillStyle = wireColor; ctx.beginPath(); ctx.arc(jx, top, 5, 0, Math.PI*2); ctx.fill();
    });

  } else { // mixed
    const left=60, right=640, top=80, bot=240;
    const batX=left+20, batY=(top+bot)/2;
    const swX=120, swY=top;
    const amX=200, amY=top;
    const jL=290, jR=430;

    wire(left, batY-18, left, top, wireColor, lineW, shadowC);
    wire(left, batY+18, left, bot, wireColor, lineW, shadowC);
    wire(left, top, swX-14, top, wireColor, lineW, shadowC);
    wire(swX+14, top, amX-14, top, wireColor, lineW, shadowC);
    wire(amX+14, top, jL, top, wireColor, lineW, shadowC);
    wire(jR, top, right, top, wireColor, lineW, shadowC);
    wire(left, bot, right, bot, wireColor, lineW, shadowC);
    wire(right, bot, right, top, wireColor, lineW, shadowC);

    // R1 nhánh trên song song
    wire(jL, top, jL, top-50, wireColor, lineW, shadowC);
    wire(jL, top-50, jL+15, top-50, wireColor, lineW, shadowC);
    wire(jR, top, jR, top-50, wireColor, lineW, shadowC);
    wire(jR-15, top-50, jR, top-50, wireColor, lineW, shadowC);
    drawResistor(jL+15, top-50, jR-jL-30, 'R₁', R1);

    // R2 nhánh dưới song song
    wire(jL, top, jL, top+50, wireColor, lineW, shadowC);
    wire(jL, top+50, jL+15, top+50, wireColor, lineW, shadowC);
    wire(jR, top, jR, top+50, wireColor, lineW, shadowC);
    wire(jR-15, top+50, jR, top+50, wireColor, lineW, shadowC);
    drawResistor(jL+15, top+50, jR-jL-30, 'R₂', R2);

    // Đèn sau khối song song
    const lampX=right-50, lampY=(top+bot)/2;
    wire(right, top, right, lampY-15, wireColor, lineW, shadowC);
    wire(right, lampY+15, right, bot, wireColor, lineW, shadowC);
    drawLamp(lampX, lampY, 'Đèn', glow);

    [jL,jR].forEach(jx => {
      ctx.fillStyle = wireColor; ctx.beginPath(); ctx.arc(jx, top, 5, 0, Math.PI*2); ctx.fill();
    });

    drawBattery(left, batY, E);
    drawSwitch(swX, swY, closed);
    drawAmmeter(amX, amY, I.toFixed(2));
  }

  // Nhãn trạng thái dưới cùng
  ctx.font = 'bold 12px Space Mono,monospace'; ctx.textAlign = 'center';
  if(closed) {
    ctx.fillStyle = '#69f0ae';
    ctx.fillText(`✔ Mạch đóng  |  I = ${I.toFixed(2)} A  |  P = ${(E*I).toFixed(2)} W`, W/2, H-10);
  } else {
    ctx.fillStyle = '#ef5350';
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