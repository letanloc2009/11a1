/* ==================== ĐỊA LÍ: TRÁI ĐẤT QUAY QUANH MẶT TRỜI ==================== */
let earthYear = new Date().getFullYear();
let earthDay = 80; // 1..365/366 (tùy năm)
let earthRAF = null;
let earthRunning = false;
let earthLastTime = null;
let earthSpin = 0; // để mô tả Trái Đất tự quay
let earthAutoOrbit = true; // Trái Đất tự động quay quanh Mặt Trời
let earthDayFloat = earthDay;

function ensureEarthOrbitCanvasSize() {
  const c = document.getElementById('earthorbit-canvas');
  if (!c || !c.parentElement) return;
  const wrap = c.parentElement;
  const cssW = Math.max(280, wrap.clientWidth || 700);
  const cssH = Math.max(260, Math.round(cssW * (340 / 700)));
  c.style.height = cssH + 'px';
  const dpr = window.devicePixelRatio || 1;
  const newW = Math.round(cssW * dpr);
  const newH = Math.round(cssH * dpr);
  if (c.width !== newW || c.height !== newH) {
    c.width = newW;
    c.height = newH;
  }
}

function isLeapYear(y) {
  if (!Number.isFinite(y)) return false;
  return (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
}

function daysInYear(y) {
  return isLeapYear(y) ? 366 : 365;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function deg2rad(d) { return d * Math.PI / 180; }

function getEventBaseDays() {
  // Xấp xỉ theo năm không nhuận, theo đơn vị 1..365
  return {
    spring: 80,  // ~20/3
    summer: 173, // ~21/6
    autumn: 267, // ~23/9
    winter: 356  // ~21/12
  };
}

function getEventDays(y) {
  const base = getEventBaseDays();
  const leap = isLeapYear(y);
  // Nếu năm nhuận thì các mốc sau 28/2 dịch +1 theo thứ tự ngày trong năm
  const shift = (d) => d + (leap && d > 59 ? 1 : 0);
  return {
    spring: shift(base.spring),
    summer: shift(base.summer),
    autumn: shift(base.autumn),
    winter: shift(base.winter)
  };
}

function updateEarthControls() {
  const yIn = document.getElementById('earth-year');
  if (yIn && parseInt(yIn.value, 10) !== earthYear) yIn.value = String(earthYear);

  const info = document.getElementById('earth-year-info');
  if (info) {
    const d = daysInYear(earthYear);
    info.textContent = `${d} ngày (${isLeapYear(earthYear) ? 'năm nhuận' : 'không nhuận'})`;
  }

  const slider = document.getElementById('earth-day');
  if (slider) {
    slider.min = '1';
    slider.max = String(daysInYear(earthYear));
    const dNow = Math.round(earthDay);
    if (parseInt(slider.value, 10) !== dNow) slider.value = String(dNow);
  }

  const label = document.getElementById('earth-day-label');
  if (label) label.textContent = `Ngày ${Math.round(earthDay)}`;
}

function initEarthOrbit() {
  earthYear = new Date().getFullYear();
  const ev = getEventDays(earthYear);
  earthDay = ev.spring;
  earthDayFloat = earthDay;
  updateEarthControls();
  earthSpin = 0;
  earthAutoOrbit = true;
  updateEarthAutoButton();
  updateEarthInfo();
  ensureEarthOrbitCanvasSize();
  drawEarthOrbit();
  startEarthOrbitLoop();
}

function updateEarthAutoButton() {
  const btn = document.getElementById('earthorbit-auto-btn');
  if (!btn) return;
  btn.textContent = earthAutoOrbit ? '⏸ TỰ ĐỘNG' : '▶ TỰ ĐỘNG';
  btn.style.background = earthAutoOrbit ? '#2a3a55' : '#0984e3';
  btn.style.color = '#fff';
}

function toggleEarthOrbitAuto() {
  earthAutoOrbit = !earthAutoOrbit;
  updateEarthAutoButton();
}

function startEarthOrbitLoop() {
  if (earthRunning) return;
  earthRunning = true;
  earthLastTime = null;
  cancelAnimationFrame(earthRAF);
  earthRAF = requestAnimationFrame(earthLoop);
  window.addEventListener('resize', () => {
    ensureEarthOrbitCanvasSize();
    drawEarthOrbit();
  }, { passive: true });
}

function earthLoop(ts) {
  if (!earthRunning) return;
  if (earthLastTime == null) earthLastTime = ts;
  const dt = Math.min(0.05, Math.max(0, (ts - earthLastTime) / 1000));
  earthLastTime = ts;
  earthSpin += dt * 2.2; // tốc độ tự quay minh họa
  // Tự động tăng "ngày trong năm" để Trái Đất quay quanh Mặt Trời
  if (earthAutoOrbit) {
    const days = daysInYear(earthYear);
    earthDayFloat += dt * 20; // ~20 ngày/giây (minh họa)
    while (earthDayFloat > days) earthDayFloat -= days;
    earthDay = clamp(Math.round(earthDayFloat), 1, days);
    updateEarthControls();
    updateEarthInfo();
  }
  drawEarthOrbit();
  earthRAF = requestAnimationFrame(earthLoop);
}

function getEarthEvent(day) {
  // các mốc phổ biến (xấp xỉ)
  const e = getEventDays(earthYear);
  if (day === e.spring) return 'Xuân phân (khoảng 20/3)';
  if (day === e.summer) return 'Hạ chí (khoảng 21/6)';
  if (day === e.autumn) return 'Thu phân (khoảng 23/9)';
  if (day === e.winter) return 'Đông chí (khoảng 21/12)';
  return null;
}

function getSeasonNH(day) {
  // Bắc bán cầu (xấp xỉ theo mốc)
  const e = getEventDays(earthYear);
  if (day >= e.spring && day < e.summer) return 'Mùa xuân (Bắc bán cầu)';
  if (day >= e.summer && day < e.autumn) return 'Mùa hạ (Bắc bán cầu)';
  if (day >= e.autumn && day < e.winter) return 'Mùa thu (Bắc bán cầu)';
  return 'Mùa đông (Bắc bán cầu)';
}

function updateEarthInfo() {
  updateEarthControls();

  const info = document.getElementById('earthorbit-info');
  if (!info) return;
  const ev = getEarthEvent(earthDay);
  const season = getSeasonNH(earthDay);
  info.innerHTML = `
    <div class="water-info-card" style="border-left:4px solid #74b9ff">
      <div class="water-info-title">🌞 Góc nhìn vũ trụ</div>
      <p><b>${ev ? ev : season}</b>. Năm <b>${earthYear}</b>, ngày <b>${earthDay}</b>. Trái Đất <b>tự quay quanh trục</b> (gây <b>Ngày/Đêm</b>) và <b>quay quanh Mặt Trời</b>. Trục Trái Đất nghiêng <b>23.5°</b> nên mỗi bán cầu nhận ánh sáng khác nhau → <b>Bốn mùa</b>.</p>
      <div class="water-fun-fact">💡 Mẹo: kéo thanh ngày và quan sát nửa sáng/nửa tối trên Trái Đất + trục nghiêng hướng về phía nào.</div>
    </div>`;
}

function setEarthYear(y) {
  if (!Number.isFinite(y)) return;
  earthYear = clamp(Math.floor(y), 1900, 2100);
  const days = daysInYear(earthYear);
  // giữ ngày trong khoảng hợp lệ
  earthDay = clamp(Math.round(earthDay), 1, days);
  earthDayFloat = earthDay;
  updateEarthControls();
  updateEarthInfo();
  drawEarthOrbit();
}

function setEarthDay(day) {
  const days = daysInYear(earthYear);
  earthDay = clamp(day, 1, days);
  earthDayFloat = earthDay;
  const slider = document.getElementById('earth-day');
  if (slider && parseInt(slider.value, 10) !== earthDay) slider.value = String(earthDay);
  // Khi người dùng kéo thanh, tạm dừng tự động để dễ quan sát
  earthAutoOrbit = false;
  updateEarthAutoButton();
  updateEarthInfo();
  drawEarthOrbit();
}

function jumpEarthEvent(key) {
  const e = getEventDays(earthYear);
  if (!e[key]) return;
  setEarthDay(e[key]);
}

function drawEarthOrbit() {
  const c = document.getElementById('earthorbit-canvas');
  if (!c) return;
  ensureEarthOrbitCanvasSize();
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0, 0, W, H);

  // background space
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#020617');
  bg.addColorStop(1, '#0b132b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // stars
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i++) {
    const x = (Math.sin(i * 999) * 0.5 + 0.5) * W;
    const y = (Math.sin(i * 1337) * 0.5 + 0.5) * H;
    const r = (i % 7 === 0) ? 1.6 : 1.0;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  const cx = W * 0.50, cy = H * 0.52;
  const rx = Math.min(W, H) * 0.34;
  const ry = rx * 0.62;

  // orbit ellipse
  ctx.save();
  ctx.strokeStyle = 'rgba(124,185,255,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Sun
  const sunR = Math.min(W, H) * 0.06;
  const sunGrad = ctx.createRadialGradient(cx, cy, 6, cx, cy, sunR * 2.4);
  sunGrad.addColorStop(0, '#fff59d');
  sunGrad.addColorStop(0.4, '#ffd54f');
  sunGrad.addColorStop(1, 'rgba(255,213,79,0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(cx, cy, sunR * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd54f';
  ctx.beginPath(); ctx.arc(cx, cy, sunR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0b132b';
  ctx.font = '900 10px Space Mono,monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MẶT TRỜI', cx, cy + 4);

  // Earth position by day-of-year
  const days = daysInYear(earthYear);
  const ang = ((earthDay - 1) / days) * Math.PI * 2 - Math.PI / 2;
  const ex = cx + Math.cos(ang) * rx;
  const ey = cy + Math.sin(ang) * ry;

  // sunlight direction at Earth (from Earth -> Sun)
  const sx = cx - ex, sy = cy - ey;
  const sLen = Math.hypot(sx, sy) || 1;
  const sdx = sx / sLen, sdy = sy / sLen;

  // Earth
  const eR = Math.min(W, H) * 0.05;
  ctx.save();
  // draw night side base
  ctx.fillStyle = '#0b3d91';
  ctx.beginPath(); ctx.arc(ex, ey, eR, 0, Math.PI * 2); ctx.fill();

  // lit side gradient
  const g = ctx.createLinearGradient(ex - sdx * eR, ey - sdy * eR, ex + sdx * eR, ey + sdy * eR);
  g.addColorStop(0, '#0b3d91');
  g.addColorStop(0.52, '#2e86de');
  g.addColorStop(1, '#b3e5fc');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(ex, ey, eR, 0, Math.PI * 2); ctx.fill();

  // terminator line
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  // vector vuông góc hướng ánh sáng
  const px = -sdy, py = sdx;
  ctx.moveTo(ex + px * eR, ey + py * eR);
  ctx.lineTo(ex - px * eR, ey - py * eR);
  ctx.stroke();

  // Axis tilt (23.5°) – hướng cố định trong không gian
  const axisAng = -Math.PI / 2 + deg2rad(23.5);
  const ax = Math.cos(axisAng), ay = Math.sin(axisAng);
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ex - ax * (eR * 1.4), ey - ay * (eR * 1.4));
  ctx.lineTo(ex + ax * (eR * 1.4), ey + ay * (eR * 1.4));
  ctx.stroke();

  // mark north pole
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(ex + ax * (eR * 1.4), ey + ay * (eR * 1.4), 2.2, 0, Math.PI * 2); ctx.fill();

  // Equator hint (rotate a bit with spin)
  const eqAng = earthSpin;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(ex, ey, eR * 1.0, eR * 0.35, eqAng, 0, Math.PI * 2);
  ctx.stroke();

  // Earth label
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = '900 10px Space Mono,monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TRÁI ĐẤT', ex, ey + eR + 14);
  ctx.restore();

  // season indicator (NH tilt)
  const dot = ax * sdx + ay * sdy; // >0: Bắc bán cầu hướng về Mặt Trời
  let seasonHint = '';
  if (Math.abs(dot) < 0.18) seasonHint = 'Gần điểm phân (hai bán cầu nhận ánh sáng gần như nhau)';
  else if (dot > 0) seasonHint = 'Bắc bán cầu nghiêng về Mặt Trời → ngày dài hơn, dễ là mùa nóng';
  else seasonHint = 'Bắc bán cầu nghiêng xa Mặt Trời → ngày ngắn hơn, dễ là mùa lạnh';

  // draw sun rays line
  ctx.save();
  ctx.strokeStyle = 'rgba(255,213,79,0.35)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // HUD text
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.font = '800 11px Nunito,sans-serif';
  ctx.textAlign = 'left';
  const ev = getEarthEvent(earthDay);
  ctx.fillText(ev ? ev : getSeasonNH(earthDay), 14, 18);
  ctx.fillStyle = 'rgba(124,185,255,0.85)';
  ctx.font = '700 11px Nunito,sans-serif';
  ctx.fillText(seasonHint, 14, 36);
}
