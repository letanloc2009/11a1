/* ==================== MOBILE SIDEBAR ==================== */
const hamburger = document.getElementById('hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('sidebar-overlay');

function openSidebar() { sidebar.classList.add('open'); overlay.classList.add('open'); hamburger.classList.add('open'); }
function closeSidebar() { sidebar.classList.remove('open'); overlay.classList.remove('open'); hamburger.classList.remove('open'); }
hamburger.addEventListener('click', () => sidebar.classList.contains('open') ? closeSidebar() : openSidebar());
overlay.addEventListener('click', closeSidebar);

/* ==================== NAVIGATION ==================== */
function showPage(id) {
  // Ẩn toàn bộ các trang đang active trước đó
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Kích hoạt trang được chọn hiển thị lên màn hình
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  
  // Cập nhật trạng thái lựa chọn trên thanh Sidebar
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (window.event && window.event.target) window.event.target.classList.add('active');
  
  // Định nghĩa nhãn hiển thị tương ứng với ID trang
  const labels = {
    home: 'Trang chủ', motion: 'Chuyển động thẳng', force: 'Lực',
    wave: 'Sóng cơ học', optics: 'Sóng ánh sáng', circuit: 'Mạch điện',
    acidbase: 'Phản ứng hóa học', periodic: 'Bảng tuần hoàn',
    reactionrate: 'Tốc độ phản ứng', electrolysis: 'Điện phân',
    dna: 'Lắp ráp DNA', cell: 'Tế bào', photosynthesis: 'Quang hợp',
    enzyme: 'Enzyme', mitosis: 'Nguyên phân',
    young: 'Giao thoa Young', energy: 'Động năng – Thế năng', torque: 'Moment lực',
    projectile: 'Chuyển động ném', mendel: 'Lai giống Mendel',
    watercycle: 'Vòng tuần hoàn nước', earthorbit: 'Trái Đất quanh Mặt Trời',
    tectonic: 'Mảng kiến tạo', atmosphere: 'Khí áp & Gió'
  };
  
  const statusPage = document.getElementById('status-page');
  if (statusPage) {
    statusPage.textContent = (labels[id] || id).toUpperCase();
  }
  
  // Khởi chạy các hàm logic tương ứng cho từng trang mô phỏng
  if (id === 'motion') { updateMotionParam(); drawMotionFrame(); drawGraph(); }
  if (id === 'force') { drawForceScene(0); }
  if (id === 'wave') { if (!waveRunning) drawWaveFrame(0); }
  if (id === 'optics') { runOptics(); }
  if (id === 'circuit') { resetCircuit(); }
  if (id === 'acidbase') { initShelf(); }
  if (id === 'dna') { initDNA(); }
  if (id === 'cell') { drawPlantCell(); setupCellEvents(); }
  if (id === 'reactionrate') { if (typeof initReactionRate === 'function') initReactionRate(); }
  if (id === 'electrolysis') { if (typeof initElectrolysis === 'function') initElectrolysis(); }
  if (id === 'photosynthesis') { if (typeof initPhotosynthesis === 'function') initPhotosynthesis(); }
  if (id === 'enzyme') { if (typeof initEnzyme === 'function') initEnzyme(); }
  if (id === 'mitosis') { if (typeof resetMitosisAnimation === 'function') resetMitosisAnimation(); }
  if (id === 'young') { runYoung(); syncYoungSliders(); }
  if (id === 'energy') { resetEnergy(); if(!energyRunning) toggleEnergySim(); }
  if (id === 'torque') { updateTorque(); }
  if (id === 'projectile') { if (typeof initProjectile === 'function') initProjectile(); }
  if (id === 'mendel') { if (typeof initMendel === 'function') initMendel(); }
  if (id === 'watercycle') { if (typeof initWaterCycle === 'function') initWaterCycle(); }
  if (id === 'earthorbit') { if (typeof initEarthOrbit === 'function') initEarthOrbit(); }
  if (id === 'tectonic') { if (typeof initTectonic === 'function') initTectonic(); }
  if (id === 'periodic') {
	if (!window.periodicRendered) {
		renderPeriodicTable();
		window.periodicRendered = true;
	}
  }
  
  // Tự động đóng sidebar nếu người dùng đang dùng thiết bị di động screen <= 768px
  if (window.innerWidth <= 768) closeSidebar();
}

function toggleSubject(el) {
  const items = el.nextElementSibling;
  const arrow = el.querySelector('.arrow');
  items.classList.toggle('open');
  arrow.classList.toggle('open');
}
