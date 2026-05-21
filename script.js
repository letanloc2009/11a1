/* ==================== ROOT VARIABLES ==================== */
:root {
  --bg: #f0f7ff;
  --surface: #ffffff;
  --border: #d1e3f8;
  --text: #1a2640;
  --muted: #6b82a0;

  --physics: #e74c3c;
  --physics-light: #fdecea;
  --physics-mid: #f5a9a4;
  --chem: #2980b9;
  --chem-light: #ebf5fb;
  --chem-mid: #85c1e9;
  --bio: #27ae60;
  --bio-light: #eafaf1;
  --bio-mid: #82e0aa;

  --header-h: 60px;
  --sidebar-w: 260px;
  --radius: 12px;
  --shadow: 0 2px 16px rgba(60,100,180,0.10);
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Nunito', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  overflow-x: hidden;
}

header {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: var(--header-h);
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 20px rgba(21,101,192,0.3);
}

.header-brand {
  display: flex; align-items: center; gap: 10px;
}

.brand-logo { font-size: 22px; }

.brand-text {
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.05em;
}

.header-center {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: rgba(255,255,255,0.85);
  letter-spacing: 0.1em;
}

.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 40px; height: 40px;
  gap: 5px;
  cursor: pointer;
  background: none; border: none; padding: 0;
  flex-shrink: 0;
}
.hamburger span {
  display: block; width: 22px; height: 2px;
  background: #fff; border-radius: 2px; transition: all .25s;
}
.hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.open span:nth-child(2) { opacity: 0; }
.hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

.header-actions { display:flex; align-items:center; }

.btn-mail {
  width: 38px; height: 38px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .2s;
}
.btn-mail:hover { background: rgba(255,255,255,0.35); }

.layout {
  display: flex;
  margin-top: var(--header-h);
  min-height: calc(100vh - var(--header-h));
}

aside {
  width: var(--sidebar-w);
  min-height: calc(100vh - var(--header-h));
  background: var(--surface);
  border-right: 2px solid var(--border);
  padding: 12px 0 60px;
  position: sticky;
  top: var(--header-h);
  height: calc(100vh - var(--header-h));
  overflow-y: auto;
  flex-shrink: 0;
  transition: transform .3s ease;
  z-index: 90;
  box-shadow: 2px 0 12px rgba(60,100,180,0.06);
}

.sidebar-overlay {
  display: none;
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 89;
}
.sidebar-overlay.open { display: block; }

.nav-home {
  padding: 14px 20px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  color: #1565c0;
  background: #e8f1ff;
  border-radius: 0 30px 30px 0;
  margin: 0 12px 8px 0;
  transition: background .15s;
  letter-spacing: 0.05em;
}
.nav-home:hover { background: #d0e4ff; }

.subject-group { margin-bottom: 4px; }

.subject-toggle {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.08em;
  transition: background .15s;
  user-select: none;
  border-radius: 0;
}
.subject-toggle:hover { background: #f5f8ff; }

.subj-icon { font-size: 16px; }

.arrow {
  font-size: 18px;
  transition: transform .25s;
  margin-left: auto;
  font-weight: 400;
}
.arrow.open { transform: rotate(90deg); }

.physics-color { color: var(--physics); }
.chem-color { color: var(--chem); }
.bio-color { color: var(--bio); }

.subject-items {
  max-height: 0;
  overflow: hidden;
  transition: max-height .35s cubic-bezier(.4,0,.2,1);
}
.subject-items.open { max-height: 600px; }

.nav-item {
  display: flex; align-items: center;
  padding: 11px 20px 11px 36px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s, color .15s;
  color: var(--muted);
  border-radius: 0 30px 30px 0;
  margin-right: 12px;
}
.nav-item:hover { background: #f0f7ff; color: #1565c0; }
.nav-item.active { background: #ddeeff; color: #1565c0; font-weight: 700; }

main {
  flex: 1;
  padding: 28px 36px 70px;
  min-width: 0;
}

.page { display: none; }
.page.active { display: block; }

.page-header {
  margin-bottom: 24px;
  padding: 20px 24px;
  border-radius: var(--radius);
  display: flex; align-items: center; gap: 14px;
}
.physics-header { background: linear-gradient(135deg, #fdecea, #fbbaba33); border-left: 4px solid var(--physics); }
.chem-header { background: linear-gradient(135deg, #ebf5fb, #85c1e933); border-left: 4px solid var(--chem); }
.bio-header { background: linear-gradient(135deg, #eafaf1, #82e0aa33); border-left: 4px solid var(--bio); }

.page-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: var(--text);
}

.page-badge {
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  white-space: nowrap;
}
.physics-badge { background: var(--physics); color: #fff; }
.chem-badge { background: var(--chem); color: #fff; }
.bio-badge { background: var(--bio); color: #fff; }

.hero {
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 40%, #4fc3f7 100%);
  border-radius: var(--radius);
  padding: 48px 40px;
  margin-bottom: 28px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.hero::before {
  content: '';
  position: absolute; inset: 0;
  background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.hero-badge {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  color: #fff;
  border-radius: 30px;
  padding: 6px 18px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 16px;
  position: relative;
}

.hero-title {
  font-size: clamp(28px, 5vw, 56px);
  font-weight: 900;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 14px;
  position: relative;
}
.hero-title span { color: #ffe082; }

.hero-sub {
  color: rgba(255,255,255,0.85);
  font-size: 15px;
  max-width: 480px;
  margin: 0 auto;
  position: relative;
}

.section-title {
  font-size: 18px;
  font-weight: 800;
  margin: 24px 0 14px;
  color: var(--text);
  letter-spacing: 0.03em;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 14px;
  margin-bottom: 8px;
}

.card {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 22px 18px;
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  box-shadow: var(--shadow);
  border: 2px solid transparent;
  text-align: left;
}
.card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(60,100,180,0.18); }

.physics-card:hover { border-color: var(--physics); }
.chem-card:hover { border-color: var(--chem); }
.bio-card:hover { border-color: var(--bio); }

.card-icon { font-size: 30px; margin-bottom: 12px; }
.card h3 { font-size: 14px; font-weight: 800; margin-bottom: 6px; color: var(--text); }
.card p { font-size: 12px; color: var(--muted); line-height: 1.5; }

.sim-container {
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
  margin-bottom: 20px;
  border: 2px solid var(--border);
}

.sim-toolbar {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px;
  background: #1a2640;
  flex-wrap: wrap;
}

.sim-title {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: #7cb9ff;
  flex: 1;
  min-width: 0;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: 'Space Mono', monospace;
  letter-spacing: 0.05em;
  transition: all .2s;
  white-space: nowrap;
}
.btn-physics { background: var(--physics); color: #fff; }
.btn-physics:hover { background: #c0392b; }
.btn-chem { background: var(--chem); color: #fff; }
.btn-chem:hover { background: #1a6395; }
.btn-bio { background: var(--bio); color: #fff; }
.btn-bio:hover { background: #1e8449; }
.btn-secondary { background: #2a3a55; color: #aac4e6; }
.btn-secondary:hover { background: #3a4f70; }

.sim-canvas {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  min-height: 200px;
  background: #0d1b2a;
  position: relative;
}

.sim-controls {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  padding: 18px;
  background: #f7fbff;
  border-top: 2px solid var(--border);
}

.control-group { display: flex; flex-direction: column; gap: 6px; }
.control-group label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
/* .control-group input[type="number"], */
.control-group input[type="number"] {
    width: 100%;
}
.control-group select {
  padding: 8px 12px;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: #fff;
  color: var(--text);
  font-size: 14px;
  font-family: 'Nunito', sans-serif;
  outline: none;
  transition: border-color .15s;
}
.control-group input[type="number"]:focus,
.control-group select:focus { border-color: #1976d2; }

/* Đảm bảo ô input số có chiều rộng đầy đủ và hiển thị đẹp */
.control-group input[type="number"] {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
}

.data-panel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.data-cell {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 16px 18px;
  box-shadow: var(--shadow);
  border: 2px solid var(--border);
}

.dc-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 6px;
}

.dc-val {
  font-family: 'Space Mono', monospace;
  font-size: 24px;
  font-weight: 700;
  color: #1565c0;
}

.dc-unit {
  font-size: 12px;
  color: var(--muted);
  margin-left: 2px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.info-block {
  background: var(--surface);
  border-radius: var(--radius);
  padding: 18px 20px;
  box-shadow: var(--shadow);
  border: 2px solid var(--border);
}

.info-block h4 {
  font-size: 12px;
  font-weight: 800;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--border);
}

.info-block ul { list-style: none; }
.info-block ul li {
  font-size: 13px;
  padding: 5px 0;
  border-bottom: 1px solid #f0f4fa;
  display: flex; align-items: flex-start; gap: 8px;
  line-height: 1.5; color: var(--text);
}
.info-block ul li::before { content: '→'; color: #1976d2; flex-shrink: 0; }

#force-canvas { display: block; max-width: 100%; background: #0d1b2a; }

.coming-soon-page {
  display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  min-height: 55vh; text-align: center; gap: 16px; padding: 40px 20px;
}
.coming-soon-page .cs-icon {
  font-size: 64px; margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
.coming-soon-page h1 {
  font-size: clamp(28px, 8vw, 52px);
  font-weight: 900; color: var(--text); letter-spacing: 4px;
}
.cs-line { width: 60px; height: 4px; border-radius: 2px; background: var(--physics); margin: 0 auto; }
.cs-line.bio { background: var(--bio); }
.coming-soon-page p { font-size: 15px; color: var(--muted); line-height: 1.7; max-width: 340px; }

.chem-shelf {
  background: #f8f4e8;
  border: 2px solid #d4c9a0;
  border-radius: 10px;
  margin: 16px;
  padding: 16px;
}

.shelf-label {
  font-size: 13px; font-weight: 700;
  color: #7a6a30; margin-bottom: 14px;
}

.shelf-row {
  display: flex; flex-wrap: wrap; gap: 10px;
  margin-bottom: 16px;
}

.chem-bottle {
  display: flex; flex-direction: column; align-items: center;
  cursor: pointer; padding: 8px; border-radius: 10px;
  border: 2px solid transparent; transition: all .2s;
  background: rgba(255,255,255,0.7);
  min-width: 70px;
}
.chem-bottle:hover { transform: scale(1.05); border-color: #e74c3c; background: #fff; }
.chem-bottle.selected { border-color: #e74c3c; background: #fdecea; box-shadow: 0 2px 8px rgba(231,76,60,0.3); }

.bottle-svg { font-size: 28px; margin-bottom: 4px; }
.bottle-name { font-size: 11px; font-weight: 800; color: var(--text); font-family: 'Space Mono', monospace; }
.bottle-type { font-size: 10px; color: var(--muted); margin-top: 2px; }

.shelf-selected {
  display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  padding: 12px; background: #fff; border-radius: 8px;
  border: 2px dashed #c9b870;
}

.selected-slot {
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 20px;
  background: #fffde7;
  border-radius: 8px; border: 2px solid #f0d060;
  cursor: pointer; transition: background .15s;
  min-width: 120px;
}
.selected-slot:hover { background: #fff9c4; }
.slot-label { font-size: 10px; font-weight: 700; color: var(--muted); letter-spacing: 0.1em; }
.slot-name { font-size: 14px; font-weight: 800; color: var(--text); font-family: 'Space Mono', monospace; }
.plus-sign { font-size: 28px; color: #e74c3c; font-weight: 700; }

.litmus-section {
  margin: 0 16px 16px;
  padding: 14px;
  background: #faf0ff;
  border-radius: 10px;
  border: 2px solid #e1bee7;
}
.litmus-label { font-size: 13px; font-weight: 700; color: #7b1fa2; margin-bottom: 12px; }
.litmus-display { display: flex; align-items: center; gap: 20px; }

.litmus-paper {
  width: 80px; height: 36px;
  background: #9c27b0;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
  transition: background .8s ease;
  box-shadow: 0 2px 8px rgba(156,39,176,0.3);
}
.litmus-result {
  font-size: 14px; font-weight: 700; color: #7b1fa2;
}

.beaker-section {
  padding: 0 16px 16px;
}

.beaker-wrap {
  display: flex; align-items: flex-end;
  gap: 14px; padding: 24px 16px;
  background: #1a2640;
  border-radius: 10px;
  flex-wrap: wrap; justify-content: center;
  position: relative;
}

.beaker {
  width: 75px; height: 130px;
  border: 3px solid rgba(255,255,255,0.4);
  border-top: none;
  border-radius: 0 0 12px 12px;
  position: relative;
  display: flex; align-items: flex-end;
  overflow: hidden;
}

.beaker-label {
  position: absolute; top: -28px; left: 50%;
  transform: translateX(-50%);
  font-size: 11px; font-weight: 700;
  color: #aac4e6; white-space: nowrap;
  font-family: 'Space Mono', monospace;
}

.beaker-liquid {
  width: 100%; border-radius: 0 0 8px 8px;
  transition: height 0.8s cubic-bezier(.4,0,.2,1), background 0.5s;
}

.reaction-arrow { font-size: 26px; color: #7cb9ff; padding-bottom: 16px; animation: pulse 1.5s infinite; }
.plus-sign2 { font-size: 24px; color: #aac4e6; padding-bottom: 16px; }
@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }

.reaction-equation {
  background: #e8f5e9;
  border: 2px solid #a5d6a7;
  border-radius: 10px;
  padding: 16px 20px;
  margin: 0 0 16px;
}
.reaction-equation h4 { font-size: 13px; font-weight: 700; color: #2e7d32; margin-bottom: 8px; }
.equation-text {
  font-family: 'Space Mono', monospace;
  font-size: 14px; color: #1b5e20; font-weight: 700;
}
.equation-note { font-size: 12px; color: #388e3c; margin-top: 6px; }

.dna-workspace {
  padding: 16px;
  background: #0d1b2a;
  margin: 0;
  min-height: 300px;
}

.dna-bases-box {
  margin-bottom: 16px;
}

.dna-box-label {
  font-size: 13px; font-weight: 700;
  color: #7cb9ff; margin-bottom: 10px;
  font-family: 'Space Mono', monospace;
}

.bases-palette {
  display: flex; gap: 10px; flex-wrap: wrap;
}

.base-chip {
  padding: 8px 18px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 16px;
  font-family: 'Space Mono', monospace;
  cursor: pointer;
  user-select: none;
  transition: transform .15s, box-shadow .15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.base-chip:hover { transform: scale(1.1); }
.base-chip.sm { padding: 3px 10px; font-size: 12px; margin-right: 6px; }

.base-A { background: #e74c3c; color: #fff; }
.base-T { background: #3498db; color: #fff; }
.base-G { background: #2ecc71; color: #fff; }
.base-C { background: #f39c12; color: #fff; }

.dna-strands {
  overflow-x: auto;
  padding: 10px 0;
}

.dna-strand-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: max-content;
}

.dna-strand-row {
  display: flex; gap: 4px; align-items: center;
}

.dna-strand-label {
  font-size: 10px; font-weight: 700;
  color: #7cb9ff; width: 70px; flex-shrink: 0;
  font-family: 'Space Mono', monospace;
}

.dna-base-slot {
  width: 40px; height: 36px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 800;
  font-family: 'Space Mono', monospace;
  cursor: pointer;
  transition: all .15s;
  border: 2px dashed rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.05);
  color: #aaa;
}
.dna-base-slot.filled { border-style: solid; color: #fff; }
.dna-base-slot:hover { background: rgba(255,255,255,0.12); }
.dna-base-slot.correct { box-shadow: 0 0 8px rgba(46,204,113,0.6); }
.dna-base-slot.wrong { box-shadow: 0 0 8px rgba(231,76,60,0.6); }

.dna-bonds-row {
  display: flex; gap: 4px;
  margin-left: 70px;
  height: 16px;
}

.dna-bond {
  width: 40px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; color: rgba(255,255,255,0.3);
  transition: color .3s;
}
.dna-bond.active { color: #f39c12; }

.dna-click-section { margin-top: 10px; }
.dna-click-label { font-size: 12px; color: #7cb9ff; }

.dna-legend {
  display: flex; flex-wrap: wrap; gap: 12px;
  padding: 14px 16px;
  background: #f7fbff;
  border-top: 2px solid var(--border);
}
.legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--muted); }

.dna-score {
  padding: 12px 16px;
  font-weight: 700;
  font-size: 15px;
  color: #27ae60;
  background: #f7fbff;
  border-top: 2px solid var(--border);
  min-height: 44px;
}

.modal-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(10,20,40,0.7);
  display: none; align-items: center; justify-content: center;
  backdrop-filter: blur(6px);
  padding: 16px;
}
.modal-overlay.open { display: flex; }

.modal {
  background: var(--surface);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  width: min(500px, 100%);
  animation: slideUp .25s ease;
  overflow: hidden;
}
@keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:none;opacity:1} }

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px;
  background: linear-gradient(135deg, #1565c0, #1976d2);
}
.modal-header h3 { font-size: 15px; font-weight: 700; color: #fff; }
.modal-close { background: none; border: none; color: rgba(255,255,255,0.7); font-size: 20px; cursor: pointer; }
.modal-close:hover { color: #fff; }

.modal-body { padding: 22px; }
.modal-body label {
  display: block; font-size: 12px; font-weight: 700;
  color: var(--muted); text-transform: uppercase;
  letter-spacing: 0.1em; margin-bottom: 6px; margin-top: 14px;
}
.modal-body label:first-child { margin-top: 0; }
.modal-body input, .modal-body textarea {
  width: 100%;
  border: 2px solid var(--border);
  border-radius: 8px;
  background: #f7fbff;
  padding: 10px 14px;
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  color: var(--text);
  outline: none;
  transition: border-color .15s;
}
.modal-body input:focus, .modal-body textarea:focus { border-color: #1976d2; }
.modal-body textarea { height: 100px; resize: vertical; }

.modal-footer {
  padding: 14px 22px;
  border-top: 2px solid var(--border);
  display: flex; justify-content: flex-end; gap: 10px;
}

.btn-send {
  background: linear-gradient(135deg, #1565c0, #1976d2);
  color: #fff; border: none; border-radius: 8px;
  padding: 10px 22px; font-family: 'Nunito', sans-serif;
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: opacity .15s;
}
.btn-send:hover { opacity: 0.9; }

.success-msg {
  display: none; text-align: center;
  padding: 28px; font-size: 14px; color: var(--text);
}
.success-msg .check { font-size: 40px; margin-bottom: 12px; }

.statusbar {
  position: fixed; bottom: 0; left: var(--sidebar-w); right: 0;
  height: 28px;
  background: #1565c0;
  display: flex; align-items: center; gap: 10px;
  padding: 0 14px;
  font-family: 'Space Mono', monospace;
  font-size: 10px; letter-spacing: 0.1em;
  color: rgba(255,255,255,0.85);
  z-index: 50;
  overflow: hidden; white-space: nowrap;
}
.statusbar .status-item { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.status-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #a5f3a0; animation: blink 2s infinite; flex-shrink: 0;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: #90c4f0; border-radius: 6px; }

@media (max-width: 768px) {
  .hamburger { display: flex; }
  .header-center { display: none; }

  aside {
    position: fixed;
    top: var(--header-h);
    left: 0;
    height: calc(100vh - var(--header-h));
    transform: translateX(-100%);
    z-index: 90;
    box-shadow: 4px 0 20px rgba(0,0,0,0.2);
  }
  aside.open { transform: translateX(0); }

  main { padding: 16px 14px 60px; overflow-x: hidden; }
  .hero { padding: 30px 20px; }
  .cards-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .data-panel { grid-template-columns: repeat(2, 1fr); gap: 8px;}
  
  .sim-controls { grid-template-columns: 1fr; padding: 12px; }
  #force-inputs { grid-template-columns: 1fr !important; }
  
  .sim-canvas { padding: 10px; min-height: 220px; }
  canvas { max-width: 100% !important; height: auto !important; }
  
  .beaker-wrap { padding: 16px 10px; gap: 8px; }
  .beaker { width: 55px; height: 100px; }
  .reaction-arrow, .plus-sign2 { font-size: 18px; padding-bottom: 8px; }
  .beaker-label { font-size: 10px; top: -20px; }
  
  .shelf-selected { justify-content: center; padding: 8px; gap: 8px; }
  .selected-slot { min-width: 100px; padding: 8px; }
  
  .statusbar { left: 0; font-size: 9px; }
}
/* Thêm cho phần nồng độ hóa học */
.concentration-inputs .control-group {
  flex: 1;
  min-width: 130px;
}
.concentration-inputs input {
  width: 100%;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid #ccc;
}
@media (max-width: 420px) {
  .cards-grid { grid-template-columns: 1fr; }
  .beaker { width: 45px; height: 80px; }
}
