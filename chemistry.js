/* ==================== CHEMISTRY ==================== */
const chemicals = [
  { id:'HCl',  name:'HCl',    type:'acid',    strength:'strong', pH:1.0,  pKa: -6,   pKb: null, color:'#ff8a65cc', typeLabel:'Acid mạnh',  formula:'HCl → H⁺ + Cl⁻' },
  { id:'H2SO4',name:'H₂SO₄', type:'acid',    strength:'strong', pH:0.5,  pKa: -3,   pKb: null, color:'#ff7043cc', typeLabel:'Acid mạnh',  formula:'H₂SO₄ → 2H⁺ + SO₄²⁻' },
  { id:'CH3COOH',name:'CH₃COOH',type:'acid', strength:'weak',   pH:3.0,  pKa: 4.76, pKb: null, color:'#ffcc80cc', typeLabel:'Acid yếu',   formula:'CH₃COOH ⇌ CH₃COO⁻ + H⁺' },
  { id:'HNO3', name:'HNO₃',  type:'acid',    strength:'strong', pH:1.2,  pKa: -1,   pKb: null, color:'#ffb74dcc', typeLabel:'Acid mạnh',  formula:'HNO₃ → H⁺ + NO₃⁻' },
  { id:'NaOH', name:'NaOH',  type:'base',    strength:'strong', pH:13.0, pKa: null, pKb: 0,   color:'#4fc3f7cc', typeLabel:'Base mạnh',  formula:'NaOH → Na⁺ + OH⁻' },
  { id:'KOH',  name:'KOH',   type:'base',    strength:'strong', pH:13.0, pKa: null, pKb: 0,   color:'#29b6f6cc', typeLabel:'Base mạnh',  formula:'KOH → K⁺ + OH⁻' },
  { id:'CuOH2',name:'Cu(OH)₂',type:'base',  strength:'weak',   pH:9.0,  pKa: null, pKb: 6.5, color:'#80deea cc', typeLabel:'Base yếu',   formula:'Cu(OH)₂ ⇌ Cu²⁺ + 2OH⁻' },
  { id:'NH3',  name:'NH₃',   type:'base',    strength:'weak',   pH:11.0, pKa: null, pKb: 4.75,color:'#80cbc4cc', typeLabel:'Base yếu',   formula:'NH₃ + H₂O ⇌ NH₄⁺ + OH⁻' },
  { id:'H2O',  name:'H₂O',   type:'neutral', strength:'neutral',pH:7.0,  pKa: null, pKb: null,color:'#b2ebf2cc', typeLabel:'Trung tính', formula:'H₂O – nước tinh khiết' },
  { id:'NaCl', name:'NaCl',  type:'neutral', strength:'neutral',pH:7.0,  pKa: null, pKb: null,color:'#e0e0e0cc', typeLabel:'Muối',       formula:'NaCl – muối ăn' },
  // Thêm vào cuối mảng chemicals
  { id:'CaOH2', name:'Ca(OH)₂', type:'base', strength:'strong', pH:12.5, pKa: null, pKb: 0, color:'#4db6accc', typeLabel:'Base mạnh', formula:'Ca(OH)₂ → Ca²⁺ + 2OH⁻' },
  { id:'Na2CO3', name:'Na₂CO₃', type:'base', strength:'weak', pH:11.0, pKa: null, pKb: 3.67, color:'#80cbc4cc', typeLabel:'Base yếu', formula:'Na₂CO₃ + H₂O ⇌ HCO₃⁻ + OH⁻' },
  { id:'AlCl3', name:'AlCl₃', type:'acid', strength:'weak', pH:4.0, pKa: 5.0, pKb: null, color:'#ffb74dcc', typeLabel:'Acid yếu (thủy phân)', formula:'AlCl₃ + 3H₂O ⇌ Al(OH)₃ + 3H⁺' }
];

let selectedA = null, selectedB = null;

function initShelf() {
  const row = document.getElementById('shelf-row'); if (!row) return;
  row.innerHTML = '';
  chemicals.forEach(ch => {
    const emoji = ch.type === 'acid' ? '🔴' : ch.type === 'base' ? '🔵' : '⚪';
    const div = document.createElement('div');
    div.className = 'chem-bottle';
    div.id = 'bottle-' + ch.id;
    div.innerHTML = `<div class="bottle-svg">${emoji}🧪</div><div class="bottle-name">${ch.name}</div><div class="bottle-type">${ch.typeLabel}</div>`;
    div.onclick = () => selectChemical(ch);
    row.appendChild(div);
  });
  resetChem();
}

function selectChemical(ch) {
  if (!selectedA) {
    selectedA = ch;
    document.getElementById('slot-A-name').textContent = ch.name;
    document.getElementById('slot-A').style.borderColor = '#e74c3c';
    document.getElementById('bottle-'+ch.id).classList.add('selected');
    document.getElementById('beaker-A-label').textContent = ch.name;
    document.getElementById('liq-acid').style.background = ch.color;
  } else if (!selectedB && ch.id !== selectedA.id) {
    selectedB = ch;
    document.getElementById('slot-B-name').textContent = ch.name;
    document.getElementById('slot-B').style.borderColor = '#e74c3c';
    document.getElementById('bottle-'+ch.id).classList.add('selected');
    document.getElementById('beaker-B-label').textContent = ch.name;
    document.getElementById('liq-base').style.background = ch.color;
  }
  updateLitmus();
  document.getElementById('chem-A').textContent = selectedA ? selectedA.name : '–';
  document.getElementById('chem-B').textContent = selectedB ? selectedB.name : '–';
}

function clearSlot(slot) {
  if (slot === 'A' && selectedA) {
    document.getElementById('bottle-'+selectedA.id).classList.remove('selected');
    selectedA = null;
    document.getElementById('slot-A-name').textContent = '— chưa chọn —';
    document.getElementById('slot-A').style.borderColor = '';
    document.getElementById('chem-A').textContent = '–';
  }
  if (slot === 'B' && selectedB) {
    document.getElementById('bottle-'+selectedB.id).classList.remove('selected');
    selectedB = null;
    document.getElementById('slot-B-name').textContent = '— chưa chọn —';
    document.getElementById('slot-B').style.borderColor = '';
    document.getElementById('chem-B').textContent = '–';
  }
  updateLitmus();
}

function updateLitmus() {
  const paper = document.getElementById('litmus-paper');
  const result = document.getElementById('litmus-result');
  if (!selectedA) { paper.style.background = '#9c27b0'; document.getElementById('litmus-text').textContent = 'Quỳ tím'; result.textContent = 'Chưa thử'; return; }
  const pH = selectedA.pH;
  if (pH < 7) { paper.style.background = '#e74c3c'; document.getElementById('litmus-text').textContent = 'Đỏ'; result.textContent = `pH = ${pH} → Môi trường acid 🔴`; }
  else if (pH > 7) { paper.style.background = '#1565c0'; document.getElementById('litmus-text').textContent = 'Xanh'; result.textContent = `pH = ${pH} → Môi trường base 🔵`; }
  else { paper.style.background = '#9c27b0'; document.getElementById('litmus-text').textContent = 'Tím'; result.textContent = `pH = ${pH} → Trung tính ⚪`; }
}

function computePH(chemical, concentration) {
  if (!chemical || chemical.type === 'neutral') return 7.0;
  if (chemical.type === 'acid') {
    if (chemical.strength === 'strong') {
      let h = concentration;
      if (chemical.id === 'H2SO4') h = 2 * concentration;
      return h > 0 ? -Math.log10(h) : 7;
    } else {
      const h = Math.sqrt(concentration * Math.pow(10, -chemical.pKa));
      return -Math.log10(h);
    }
  } else {
    if (chemical.strength === 'strong') {
      let oh = concentration;
      const poh = -Math.log10(oh);
      return 14 - poh;
    } else {
      const oh = Math.sqrt(concentration * Math.pow(10, -chemical.pKb));
      const poh = -Math.log10(oh);
      return 14 - poh;
    }
  }
}

function mixChemicals() {
  if (!selectedA || !selectedB) { alert('Hãy chọn 2 chất từ kệ để phản ứng!'); return; }
  const concA = parseFloat(document.getElementById('conc-A').value) || 0.1;
  const concB = parseFloat(document.getElementById('conc-B').value) || 0.1;
  const volA = parseFloat(document.getElementById('vol-A').value) || 1.0;
  const volB = volA;
  const volTotal = volA + volB;
  
  let finalpH = 7.0;
  let env = 'Trung tính';
  let description = '';

  if ((selectedA.type === 'acid' && selectedB.type === 'base') || (selectedA.type === 'base' && selectedB.type === 'acid')) {
    const acid = selectedA.type === 'acid' ? selectedA : selectedB;
    const base = selectedA.type === 'base' ? selectedA : selectedB;
    const concAcid = selectedA.type === 'acid' ? concA : concB;
    const concBase = selectedA.type === 'base' ? concA : concB;
    const volAcid = selectedA.type === 'acid' ? volA : volB;
    const volBase = selectedA.type === 'base' ? volA : volB;
    
    let nH = 0, nOH = 0;
    if (acid.strength === 'strong') {
      nH = concAcid * volAcid;
      if (acid.id === 'H2SO4') nH *= 2;
    } else {
      nH = concAcid * volAcid;
    }
    if (base.strength === 'strong') {
      nOH = concBase * volBase;
    } else {
      nOH = concBase * volBase;
    }
    
    const nDiff = Math.abs(nH - nOH);
    if (nDiff < 1e-6) {
      finalpH = 7.0;
      env = 'Trung tính (phản ứng trung hòa)';
      description = 'Acid và base vừa đủ → muối trung hòa + nước';
    } else if (nH > nOH) {
      const h_conc = (nH - nOH) / volTotal;
      finalpH = -Math.log10(h_conc);
      env = 'Acid';
      description = `Acid dư ${(nH-nOH).toFixed(4)} mol → pH = ${finalpH.toFixed(2)}`;
    } else {
      const oh_conc = (nOH - nH) / volTotal;
      finalpH = 14 - (-Math.log10(oh_conc));
      env = 'Kiềm';
      description = `Kiềm dư ${(nOH-nH).toFixed(4)} mol → pH = ${finalpH.toFixed(2)}`;
    }
  } 
  else if (selectedA.type === 'acid' && selectedB.type === 'acid') {
    const pH1 = computePH(selectedA, concA);
    const pH2 = computePH(selectedB, concB);
    const h1 = Math.pow(10, -pH1);
    const h2 = Math.pow(10, -pH2);
    const h_avg = (h1 * volA + h2 * volB) / volTotal;
    finalpH = -Math.log10(h_avg);
    env = 'Hỗn hợp acid';
    description = `pH trung bình theo nồng độ H⁺ = ${finalpH.toFixed(2)}`;
  } 
  else if (selectedA.type === 'base' && selectedB.type === 'base') {
    const pH1 = computePH(selectedA, concA);
    const pH2 = computePH(selectedB, concB);
    const oh1 = Math.pow(10, -(14 - pH1));
    const oh2 = Math.pow(10, -(14 - pH2));
    const oh_avg = (oh1 * volA + oh2 * volB) / volTotal;
    finalpH = 14 - (-Math.log10(oh_avg));
    env = 'Hỗn hợp base';
    description = `pH trung bình theo nồng độ OH⁻ = ${finalpH.toFixed(2)}`;
  }
  else {
    const active = selectedA.type !== 'neutral' ? selectedA : selectedB;
    const concActive = selectedA.type !== 'neutral' ? concA : concB;
    finalpH = computePH(active, concActive);
    env = active.type === 'acid' ? 'Môi trường acid' : (active.type === 'base' ? 'Môi trường base' : 'Trung tính');
    description = `Chỉ có ${active.name} ảnh hưởng pH`;
  }

  finalpH = Math.min(14, Math.max(0, finalpH));
  
  document.getElementById('ph-val').textContent = finalpH.toFixed(2);
  document.getElementById('chem-ph-val').innerHTML = finalpH.toFixed(2);
  document.getElementById('chem-env').textContent = env;
  document.getElementById('liq-acid').style.height = '20%';
  document.getElementById('liq-base').style.height = '20%';
  document.getElementById('liq-result').style.height = '70%';
  let color;
  if (finalpH < 6) color = '#ff8a65cc';
  else if (finalpH < 7) color = '#ffcc80cc';
  else if (finalpH > 8) color = '#4fc3f7cc';
  else if (finalpH > 7) color = '#80cbc4cc';
  else color = '#b2ebf2cc';
  document.getElementById('liq-result').style.background = color;
  document.getElementById('ph-display').style.display = 'flex';
  
  const paper = document.getElementById('litmus-paper');
  const resultSpan = document.getElementById('litmus-result');
  if (finalpH < 7) { paper.style.background = '#e74c3c'; document.getElementById('litmus-text').textContent = 'Đỏ'; resultSpan.textContent = `pH = ${finalpH.toFixed(2)} → Môi trường acid 🔴`; }
  else if (finalpH > 7) { paper.style.background = '#1565c0'; document.getElementById('litmus-text').textContent = 'Xanh'; resultSpan.textContent = `pH = ${finalpH.toFixed(2)} → Môi trường base 🔵`; }
  else { paper.style.background = '#9c27b0'; document.getElementById('litmus-text').textContent = 'Tím'; resultSpan.textContent = `pH = 7.00 → Trung tính ⚪`; }
  
  const eqDiv = document.getElementById('reaction-equation');
  const eqText = document.getElementById('reaction-text');
  const eqNote = document.getElementById('reaction-note');
  eqDiv.style.display = 'block';
  if (selectedA.type === 'acid' && selectedB.type === 'base') {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name + ' → Muối + H₂O';
    eqNote.textContent = `Phản ứng trung hòa. ${description}`;
  } else if (selectedA.type === 'base' && selectedB.type === 'acid') {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name + ' → Muối + H₂O';
    eqNote.textContent = `Phản ứng trung hòa. ${description}`;
  } else if (selectedA.type === 'acid' && selectedB.type === 'acid') {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name + ' → Hỗn hợp acid';
    eqNote.textContent = description;
  } else if (selectedA.type === 'base' && selectedB.type === 'base') {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name + ' → Hỗn hợp base';
    eqNote.textContent = description;
  } else {
    eqText.textContent = selectedA.name + ' + ' + selectedB.name;
    eqNote.textContent = description;
  }
}

function resetChem() {
  document.querySelectorAll('.chem-bottle').forEach(b => b.classList.remove('selected'));
  selectedA = null; selectedB = null;
  document.getElementById('slot-A-name').textContent = '— chưa chọn —';
  document.getElementById('slot-B-name').textContent = '— chưa chọn —';
  document.getElementById('slot-A').style.borderColor = '';
  document.getElementById('slot-B').style.borderColor = '';
  document.getElementById('liq-acid').style.height = '60%';
  document.getElementById('liq-acid').style.background = '#ff8a65cc';
  document.getElementById('liq-base').style.height = '60%';
  document.getElementById('liq-base').style.background = '#4fc3f7cc';
  document.getElementById('liq-result').style.height = '0%';
  document.getElementById('ph-display').style.display = 'none';
  document.getElementById('chem-ph-val').textContent = '–';
  document.getElementById('chem-env').textContent = '–';
  document.getElementById('chem-A').textContent = '–';
  document.getElementById('chem-B').textContent = '–';
  document.getElementById('reaction-equation').style.display = 'none';
  document.getElementById('beaker-A-label').textContent = 'Chất A';
  document.getElementById('beaker-B-label').textContent = 'Chất B';
  document.getElementById('conc-A').value = '0.1';
  document.getElementById('conc-B').value = '0.1';
  document.getElementById('vol-A').value = '1.0';
  updateLitmus();
}

/* ==================== PERIODIC TABLE ==================== */
const elementsData = [
  // Chu kỳ 1
  { symbol:"H", name:"Hydrogen", number:1, mass:1.008, group:"IA", period:1, category:"nonmetal", electronegativity:2.20, config:"1s¹" },
  { symbol:"He", name:"Helium", number:2, mass:4.0026, group:"VIIIA", period:1, category:"noble gas", electronegativity:null, config:"1s²" },
  // Chu kỳ 2
  { symbol:"Li", name:"Lithium", number:3, mass:6.94, group:"IA", period:2, category:"alkali metal", electronegativity:0.98, config:"[He] 2s¹" },
  { symbol:"Be", name:"Beryllium", number:4, mass:9.012, group:"IIA", period:2, category:"alkaline earth", electronegativity:1.57, config:"[He] 2s²" },
  { symbol:"B", name:"Boron", number:5, mass:10.81, group:"IIIA", period:2, category:"metalloid", electronegativity:2.04, config:"[He] 2s² 2p¹" },
  { symbol:"C", name:"Carbon", number:6, mass:12.011, group:"IVA", period:2, category:"nonmetal", electronegativity:2.55, config:"[He] 2s² 2p²" },
  { symbol:"N", name:"Nitrogen", number:7, mass:14.007, group:"VA", period:2, category:"nonmetal", electronegativity:3.04, config:"[He] 2s² 2p³" },
  { symbol:"O", name:"Oxygen", number:8, mass:15.999, group:"VIA", period:2, category:"nonmetal", electronegativity:3.44, config:"[He] 2s² 2p⁴" },
  { symbol:"F", name:"Fluorine", number:9, mass:18.998, group:"VIIA", period:2, category:"halogen", electronegativity:3.98, config:"[He] 2s² 2p⁵" },
  { symbol:"Ne", name:"Neon", number:10, mass:20.180, group:"VIIIA", period:2, category:"noble gas", electronegativity:null, config:"[He] 2s² 2p⁶" },
  // Chu kỳ 3
  { symbol:"Na", name:"Sodium", number:11, mass:22.990, group:"IA", period:3, category:"alkali metal", electronegativity:0.93, config:"[Ne] 3s¹" },
  { symbol:"Mg", name:"Magnesium", number:12, mass:24.305, group:"IIA", period:3, category:"alkaline earth", electronegativity:1.31, config:"[Ne] 3s²" },
  { symbol:"Al", name:"Aluminium", number:13, mass:26.982, group:"IIIA", period:3, category:"post-transition", electronegativity:1.61, config:"[Ne] 3s² 3p¹" },
  { symbol:"Si", name:"Silicon", number:14, mass:28.086, group:"IVA", period:3, category:"metalloid", electronegativity:1.90, config:"[Ne] 3s² 3p²" },
  { symbol:"P", name:"Phosphorus", number:15, mass:30.974, group:"VA", period:3, category:"nonmetal", electronegativity:2.19, config:"[Ne] 3s² 3p³" },
  { symbol:"S", name:"Sulfur", number:16, mass:32.06, group:"VIA", period:3, category:"nonmetal", electronegativity:2.58, config:"[Ne] 3s² 3p⁴" },
  { symbol:"Cl", name:"Chlorine", number:17, mass:35.45, group:"VIIA", period:3, category:"halogen", electronegativity:3.16, config:"[Ne] 3s² 3p⁵" },
  { symbol:"Ar", name:"Argon", number:18, mass:39.95, group:"VIIIA", period:3, category:"noble gas", electronegativity:null, config:"[Ne] 3s² 3p⁶" },
  // Chu kỳ 4
  { symbol:"K", name:"Potassium", number:19, mass:39.098, group:"IA", period:4, category:"alkali metal", electronegativity:0.82, config:"[Ar] 4s¹" },
  { symbol:"Ca", name:"Calcium", number:20, mass:40.078, group:"IIA", period:4, category:"alkaline earth", electronegativity:1.00, config:"[Ar] 4s²" },
  { symbol:"Sc", name:"Scandium", number:21, mass:44.956, group:"IIIB", period:4, category:"transition", electronegativity:1.36, config:"[Ar] 3d¹ 4s²" },
  { symbol:"Ti", name:"Titanium", number:22, mass:47.867, group:"IVB", period:4, category:"transition", electronegativity:1.54, config:"[Ar] 3d² 4s²" },
  { symbol:"V", name:"Vanadium", number:23, mass:50.942, group:"VB", period:4, category:"transition", electronegativity:1.63, config:"[Ar] 3d³ 4s²" },
  { symbol:"Cr", name:"Chromium", number:24, mass:51.996, group:"VIB", period:4, category:"transition", electronegativity:1.66, config:"[Ar] 3d⁵ 4s¹" },
  { symbol:"Mn", name:"Manganese", number:25, mass:54.938, group:"VIIB", period:4, category:"transition", electronegativity:1.55, config:"[Ar] 3d⁵ 4s²" },
  { symbol:"Fe", name:"Iron", number:26, mass:55.845, group:"VIIIB", period:4, category:"transition", electronegativity:1.83, config:"[Ar] 3d⁶ 4s²" },
  { symbol:"Co", name:"Cobalt", number:27, mass:58.933, group:"VIIIB", period:4, category:"transition", electronegativity:1.88, config:"[Ar] 3d⁷ 4s²" },
  { symbol:"Ni", name:"Nickel", number:28, mass:58.693, group:"VIIIB", period:4, category:"transition", electronegativity:1.91, config:"[Ar] 3d⁸ 4s²" },
  { symbol:"Cu", name:"Copper", number:29, mass:63.546, group:"IB", period:4, category:"transition", electronegativity:1.90, config:"[Ar] 3d¹⁰ 4s¹" },
  { symbol:"Zn", name:"Zinc", number:30, mass:65.38, group:"IIB", period:4, category:"transition", electronegativity:1.65, config:"[Ar] 3d¹⁰ 4s²" },
  { symbol:"Ga", name:"Gallium", number:31, mass:69.723, group:"IIIA", period:4, category:"post-transition", electronegativity:1.81, config:"[Ar] 3d¹⁰ 4s² 4p¹" },
  { symbol:"Ge", name:"Germanium", number:32, mass:72.630, group:"IVA", period:4, category:"metalloid", electronegativity:2.01, config:"[Ar] 3d¹⁰ 4s² 4p²" },
  { symbol:"As", name:"Arsenic", number:33, mass:74.922, group:"VA", period:4, category:"metalloid", electronegativity:2.18, config:"[Ar] 3d¹⁰ 4s² 4p³" },
  { symbol:"Se", name:"Selenium", number:34, mass:78.971, group:"VIA", period:4, category:"nonmetal", electronegativity:2.55, config:"[Ar] 3d¹⁰ 4s² 4p⁴" },
  { symbol:"Br", name:"Bromine", number:35, mass:79.904, group:"VIIA", period:4, category:"halogen", electronegativity:2.96, config:"[Ar] 3d¹⁰ 4s² 4p⁵" },
  { symbol:"Kr", name:"Krypton", number:36, mass:83.798, group:"VIIIA", period:4, category:"noble gas", electronegativity:3.00, config:"[Ar] 3d¹⁰ 4s² 4p⁶" },
  // Chu kỳ 5
  { symbol:"Rb", name:"Rubidium", number:37, mass:85.468, group:"IA", period:5, category:"alkali metal", electronegativity:0.82, config:"[Kr] 5s¹" },
  { symbol:"Sr", name:"Strontium", number:38, mass:87.62, group:"IIA", period:5, category:"alkaline earth", electronegativity:0.95, config:"[Kr] 5s²" },
  { symbol:"Y", name:"Yttrium", number:39, mass:88.906, group:"IIIB", period:5, category:"transition", electronegativity:1.22, config:"[Kr] 4d¹ 5s²" },
  { symbol:"Zr", name:"Zirconium", number:40, mass:91.224, group:"IVB", period:5, category:"transition", electronegativity:1.33, config:"[Kr] 4d² 5s²" },
  { symbol:"Nb", name:"Niobium", number:41, mass:92.906, group:"VB", period:5, category:"transition", electronegativity:1.6, config:"[Kr] 4d⁴ 5s¹" },
  { symbol:"Mo", name:"Molybdenum", number:42, mass:95.95, group:"VIB", period:5, category:"transition", electronegativity:2.16, config:"[Kr] 4d⁵ 5s¹" },
  { symbol:"Tc", name:"Technetium", number:43, mass:98, group:"VIIB", period:5, category:"transition", electronegativity:1.9, config:"[Kr] 4d⁵ 5s²" },
  { symbol:"Ru", name:"Ruthenium", number:44, mass:101.07, group:"VIIIB", period:5, category:"transition", electronegativity:2.2, config:"[Kr] 4d⁷ 5s¹" },
  { symbol:"Rh", name:"Rhodium", number:45, mass:102.91, group:"VIIIB", period:5, category:"transition", electronegativity:2.28, config:"[Kr] 4d⁸ 5s¹" },
  { symbol:"Pd", name:"Palladium", number:46, mass:106.42, group:"VIIIB", period:5, category:"transition", electronegativity:2.20, config:"[Kr] 4d¹⁰" },
  { symbol:"Ag", name:"Silver", number:47, mass:107.87, group:"IB", period:5, category:"transition", electronegativity:1.93, config:"[Kr] 4d¹⁰ 5s¹" },
  { symbol:"Cd", name:"Cadmium", number:48, mass:112.41, group:"IIB", period:5, category:"transition", electronegativity:1.69, config:"[Kr] 4d¹⁰ 5s²" },
  { symbol:"In", name:"Indium", number:49, mass:114.82, group:"IIIA", period:5, category:"post-transition", electronegativity:1.78, config:"[Kr] 4d¹⁰ 5s² 5p¹" },
  { symbol:"Sn", name:"Tin", number:50, mass:118.71, group:"IVA", period:5, category:"post-transition", electronegativity:1.96, config:"[Kr] 4d¹⁰ 5s² 5p²" },
  { symbol:"Sb", name:"Antimony", number:51, mass:121.76, group:"VA", period:5, category:"metalloid", electronegativity:2.05, config:"[Kr] 4d¹⁰ 5s² 5p³" },
  { symbol:"Te", name:"Tellurium", number:52, mass:127.6, group:"VIA", period:5, category:"metalloid", electronegativity:2.1, config:"[Kr] 4d¹⁰ 5s² 5p⁴" },
  { symbol:"I", name:"Iodine", number:53, mass:126.90, group:"VIIA", period:5, category:"halogen", electronegativity:2.66, config:"[Kr] 4d¹⁰ 5s² 5p⁵" },
  { symbol:"Xe", name:"Xenon", number:54, mass:131.29, group:"VIIIA", period:5, category:"noble gas", electronegativity:2.6, config:"[Kr] 4d¹⁰ 5s² 5p⁶" },
  // Chu kỳ 6
  { symbol:"Cs", name:"Cesium", number:55, mass:132.91, group:"IA", period:6, category:"alkali metal", electronegativity:0.79, config:"[Xe] 6s¹" },
  { symbol:"Ba", name:"Barium", number:56, mass:137.33, group:"IIA", period:6, category:"alkaline earth", electronegativity:0.89, config:"[Xe] 6s²" },
  { symbol:"La", name:"Lanthanum", number:57, mass:138.91, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.1, config:"[Xe] 5d¹ 6s²" },
  { symbol:"Ce", name:"Cerium", number:58, mass:140.12, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.12, config:"[Xe] 4f¹ 5d¹ 6s²" },
  { symbol:"Pr", name:"Praseodymium", number:59, mass:140.91, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.13, config:"[Xe] 4f³ 6s²" },
  { symbol:"Nd", name:"Neodymium", number:60, mass:144.24, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.14, config:"[Xe] 4f⁴ 6s²" },
  { symbol:"Pm", name:"Promethium", number:61, mass:145, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.13, config:"[Xe] 4f⁵ 6s²" },
  { symbol:"Sm", name:"Samarium", number:62, mass:150.36, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.17, config:"[Xe] 4f⁶ 6s²" },
  { symbol:"Eu", name:"Europium", number:63, mass:151.96, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.2, config:"[Xe] 4f⁷ 6s²" },
  { symbol:"Gd", name:"Gadolinium", number:64, mass:157.25, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.2, config:"[Xe] 4f⁷ 5d¹ 6s²" },
  { symbol:"Tb", name:"Terbium", number:65, mass:158.93, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.2, config:"[Xe] 4f⁹ 6s²" },
  { symbol:"Dy", name:"Dysprosium", number:66, mass:162.5, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.22, config:"[Xe] 4f¹⁰ 6s²" },
  { symbol:"Ho", name:"Holmium", number:67, mass:164.93, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.23, config:"[Xe] 4f¹¹ 6s²" },
  { symbol:"Er", name:"Erbium", number:68, mass:167.26, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.24, config:"[Xe] 4f¹² 6s²" },
  { symbol:"Tm", name:"Thulium", number:69, mass:168.93, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.25, config:"[Xe] 4f¹³ 6s²" },
  { symbol:"Yb", name:"Ytterbium", number:70, mass:173.05, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.1, config:"[Xe] 4f¹⁴ 6s²" },
  { symbol:"Lu", name:"Lutetium", number:71, mass:174.97, group:"IIIB", period:6, category:"lanthanide", electronegativity:1.27, config:"[Xe] 4f¹⁴ 5d¹ 6s²" },
  { symbol:"Hf", name:"Hafnium", number:72, mass:178.49, group:"IVB", period:6, category:"transition", electronegativity:1.3, config:"[Xe] 4f¹⁴ 5d² 6s²" },
  { symbol:"Ta", name:"Tantalum", number:73, mass:180.95, group:"VB", period:6, category:"transition", electronegativity:1.5, config:"[Xe] 4f¹⁴ 5d³ 6s²" },
  { symbol:"W", name:"Tungsten", number:74, mass:183.84, group:"VIB", period:6, category:"transition", electronegativity:2.36, config:"[Xe] 4f¹⁴ 5d⁴ 6s²" },
  { symbol:"Re", name:"Rhenium", number:75, mass:186.21, group:"VIIB", period:6, category:"transition", electronegativity:1.9, config:"[Xe] 4f¹⁴ 5d⁵ 6s²" },
  { symbol:"Os", name:"Osmium", number:76, mass:190.23, group:"VIIIB", period:6, category:"transition", electronegativity:2.2, config:"[Xe] 4f¹⁴ 5d⁶ 6s²" },
  { symbol:"Ir", name:"Iridium", number:77, mass:192.22, group:"VIIIB", period:6, category:"transition", electronegativity:2.2, config:"[Xe] 4f¹⁴ 5d⁷ 6s²" },
  { symbol:"Pt", name:"Platinum", number:78, mass:195.08, group:"VIIIB", period:6, category:"transition", electronegativity:2.28, config:"[Xe] 4f¹⁴ 5d⁹ 6s¹" },
  { symbol:"Au", name:"Gold", number:79, mass:196.97, group:"IB", period:6, category:"transition", electronegativity:2.54, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s¹" },
  { symbol:"Hg", name:"Mercury", number:80, mass:200.59, group:"IIB", period:6, category:"transition", electronegativity:2.00, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s²" },
  { symbol:"Tl", name:"Thallium", number:81, mass:204.38, group:"IIIA", period:6, category:"post-transition", electronegativity:1.62, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹" },
  { symbol:"Pb", name:"Lead", number:82, mass:207.2, group:"IVA", period:6, category:"post-transition", electronegativity:2.33, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²" },
  { symbol:"Bi", name:"Bismuth", number:83, mass:208.98, group:"VA", period:6, category:"post-transition", electronegativity:2.02, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³" },
  { symbol:"Po", name:"Polonium", number:84, mass:209, group:"VIA", period:6, category:"post-transition", electronegativity:2.0, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴" },
  { symbol:"At", name:"Astatine", number:85, mass:210, group:"VIIA", period:6, category:"halogen", electronegativity:2.2, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵" },
  { symbol:"Rn", name:"Radon", number:86, mass:222, group:"VIIIA", period:6, category:"noble gas", electronegativity:null, config:"[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶" },
  // Chu kỳ 7 (87-118)
  { symbol:"Fr", name:"Francium", number:87, mass:223, group:"IA", period:7, category:"alkali metal", electronegativity:0.7, config:"[Rn] 7s¹" },
  { symbol:"Ra", name:"Radium", number:88, mass:226, group:"IIA", period:7, category:"alkaline earth", electronegativity:0.9, config:"[Rn] 7s²" },
  { symbol:"Ac", name:"Actinium", number:89, mass:227, group:"IIIB", period:7, category:"actinide", electronegativity:1.1, config:"[Rn] 6d¹ 7s²" },
  { symbol:"Th", name:"Thorium", number:90, mass:232.04, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 6d² 7s²" },
  { symbol:"Pa", name:"Protactinium", number:91, mass:231.04, group:"IIIB", period:7, category:"actinide", electronegativity:1.5, config:"[Rn] 5f² 6d¹ 7s²" },
  { symbol:"U", name:"Uranium", number:92, mass:238.03, group:"IIIB", period:7, category:"actinide", electronegativity:1.38, config:"[Rn] 5f³ 6d¹ 7s²" },
  { symbol:"Np", name:"Neptunium", number:93, mass:237, group:"IIIB", period:7, category:"actinide", electronegativity:1.36, config:"[Rn] 5f⁴ 6d¹ 7s²" },
  { symbol:"Pu", name:"Plutonium", number:94, mass:244, group:"IIIB", period:7, category:"actinide", electronegativity:1.28, config:"[Rn] 5f⁶ 7s²" },
  { symbol:"Am", name:"Americium", number:95, mass:243, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f⁷ 7s²" },
  { symbol:"Cm", name:"Curium", number:96, mass:247, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f⁷ 6d¹ 7s²" },
  { symbol:"Bk", name:"Berkelium", number:97, mass:247, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f⁹ 7s²" },
  { symbol:"Cf", name:"Californium", number:98, mass:251, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f¹⁰ 7s²" },
  { symbol:"Es", name:"Einsteinium", number:99, mass:252, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f¹¹ 7s²" },
  { symbol:"Fm", name:"Fermium", number:100, mass:257, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f¹² 7s²" },
  { symbol:"Md", name:"Mendelevium", number:101, mass:258, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f¹³ 7s²" },
  { symbol:"No", name:"Nobelium", number:102, mass:259, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f¹⁴ 7s²" },
  { symbol:"Lr", name:"Lawrencium", number:103, mass:266, group:"IIIB", period:7, category:"actinide", electronegativity:1.3, config:"[Rn] 5f¹⁴ 6d¹ 7s²" },
  { symbol:"Rf", name:"Rutherfordium", number:104, mass:267, group:"IVB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d² 7s²" },
  { symbol:"Db", name:"Dubnium", number:105, mass:268, group:"VB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d³ 7s²" },
  { symbol:"Sg", name:"Seaborgium", number:106, mass:269, group:"VIB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d⁴ 7s²" },
  { symbol:"Bh", name:"Bohrium", number:107, mass:270, group:"VIIB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d⁵ 7s²" },
  { symbol:"Hs", name:"Hassium", number:108, mass:269, group:"VIIIB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d⁶ 7s²" },
  { symbol:"Mt", name:"Meitnerium", number:109, mass:278, group:"VIIIB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d⁷ 7s²" },
  { symbol:"Ds", name:"Darmstadtium", number:110, mass:281, group:"VIIIB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d⁸ 7s²" },
  { symbol:"Rg", name:"Roentgenium", number:111, mass:282, group:"IB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d¹⁰ 7s¹" },
  { symbol:"Cn", name:"Copernicium", number:112, mass:285, group:"IIB", period:7, category:"transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d¹⁰ 7s²" },
  { symbol:"Nh", name:"Nihonium", number:113, mass:286, group:"IIIA", period:7, category:"post-transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹" },
  { symbol:"Fl", name:"Flerovium", number:114, mass:289, group:"IVA", period:7, category:"post-transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²" },
  { symbol:"Mc", name:"Moscovium", number:115, mass:290, group:"VA", period:7, category:"post-transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³" },
  { symbol:"Lv", name:"Livermorium", number:116, mass:293, group:"VIA", period:7, category:"post-transition", electronegativity:null, config:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴" },
  { symbol:"Ts", name:"Tennessine", number:117, mass:294, group:"VIIA", period:7, category:"halogen", electronegativity:null, config:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵" },
  { symbol:"Og", name:"Oganesson", number:118, mass:294, group:"VIIIA", period:7, category:"noble gas", electronegativity:null, config:"[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶" }
];


// === THÊM SỐ OXI HÓA PHỔ BIẾN ===
elementsData.forEach(el => {
  let ox = "–";
  const num = el.number;
  const cat = el.category;
  if (cat === "alkali metal") ox = "+1";
  else if (cat === "alkaline earth") ox = "+2";
  else if (cat === "halogen") ox = "-1 (có thể +1,+3,+5,+7)";
  else if (cat === "noble gas") ox = "0";
  else if (cat === "nonmetal") {
    if (num === 1) ox = "+1, -1";
    else if (num === 6) ox = "-4, +4";
    else if (num === 7) ox = "-3, +3, +5";
    else if (num === 8) ox = "-2";
    else if (num === 15) ox = "-3, +3, +5";
    else if (num === 16) ox = "-2, +4, +6";
    else ox = "–";
  }
  else if (cat === "metalloid") {
    if (num === 5) ox = "+3";
    else if (num === 14) ox = "-4, +4";
    else if (num === 32) ox = "+2, +4";
    else if (num === 33) ox = "-3, +3, +5";
    else if (num === 51) ox = "-3, +3, +5";
    else if (num === 52) ox = "-2, +4, +6";
    else ox = "–";
  }
  else if (cat === "post-transition") {
    if (num === 13) ox = "+3";
    else if (num === 31) ox = "+3";
    else if (num === 49) ox = "+3";
    else if (num === 81) ox = "+1, +3";
    else if (num === 82) ox = "+2, +4";
    else if (num === 83) ox = "+3, +5";
    else ox = "–";
  }
  else if (cat === "transition") ox = "thường +2,+3,...";
  else if (cat === "lanthanide") ox = "+3";
  else if (cat === "actinide") ox = "+3, +4, +5, +6";
  el.oxidation = ox;
});

function getCategoryClass(cat) {
  const map = {
    'alkali metal':   'alkali-metal',
    'alkaline earth': 'alkaline-earth',
    'transition':     'transition-metal',
    'post-transition':'post-transition',
    'metalloid':      'metalloid',
    'nonmetal':       'nonmetal',
    'halogen':        'halogen',
    'noble gas':      'noble-gas',
    'lanthanide':     'lanthanide',
    'actinide':       'actinide'
  };
  return map[cat] || 'transition-metal';
}

const categoryViNames = {
  'alkali-metal':   'Kim loại kiềm',
  'alkaline-earth': 'Kiềm thổ',
  'transition-metal':'Kim loại chuyển tiếp',
  'post-transition':'Hậu chuyển tiếp',
  'metalloid':      'Á kim',
  'nonmetal':       'Phi kim',
  'halogen':        'Halogen',
  'noble-gas':      'Khí hiếm',
  'lanthanide':     'Lanthanide',
  'actinide':       'Actinide'
};

function _renderCell(elem) {
  const cls = getCategoryClass(elem.category);
  const shortName = elem.name.length > 11 ? elem.name.substr(0,10)+'…' : elem.name;
  return `<div class="element-cell ${cls}" onclick="showElementDetail(${elem.number})" title="${elem.name} (${elem.number})">
    <div class="atomic-num">${elem.number}</div>
    <div class="symbol">${elem.symbol}</div>
    <div class="elem-name">${shortName}</div>
  </div>`;
}

function _emptyCell() { return '<div class="element-cell empty"></div>'; }
function _placeholderCell(txt) { return `<div class="element-cell placeholder">${txt}</div>`; }

function renderPeriodicTable() {
  const grid = document.getElementById('periodic-grid');
  if (!grid) return;

  function e(n) {
    const el = elementsData.find(el => el.number === n);
    return el ? _renderCell(el) : _emptyCell();
  }
  function row(cells) { return `<div class="periodic-row">${cells.join('')}</div>`; }

  let html = '';

  // Hàng 1: H ... He
  const r1 = [e(1)]; for(let i=0;i<16;i++) r1.push(_emptyCell()); r1.push(e(2));
  html += row(r1);

  // Hàng 2: Li,Be ... B-Ne (10 trống giữa)
  const r2 = [e(3),e(4)]; for(let i=0;i<10;i++) r2.push(_emptyCell()); for(let n=5;n<=10;n++) r2.push(e(n));
  html += row(r2);

  // Hàng 3: Na,Mg ... Al-Ar (10 trống giữa)
  const r3 = [e(11),e(12)]; for(let i=0;i<10;i++) r3.push(_emptyCell()); for(let n=13;n<=18;n++) r3.push(e(n));
  html += row(r3);

  // Hàng 4: K-Kr (đầy đủ 18)
  const r4 = []; for(let n=19;n<=36;n++) r4.push(e(n));
  html += row(r4);

  // Hàng 5: Rb-Xe (đầy đủ 18)
  const r5 = []; for(let n=37;n<=54;n++) r5.push(e(n));
  html += row(r5);

  // Hàng 6: Cs,Ba, [57-71], Hf-Rn
  const r6 = [e(55),e(56),_placeholderCell('57–71')]; for(let n=72;n<=86;n++) r6.push(e(n));
  html += row(r6);

  // Hàng 7: Fr,Ra, [89-103], Rf-Og
  const r7 = [e(87),e(88),_placeholderCell('89–103')]; for(let n=104;n<=118;n++) r7.push(e(n));
  html += row(r7);

  // Nhãn f-block
  html += `<div class="fblock-label">🏷️ Họ Lanthanide (57–71)</div>`;
  const rLa = [_emptyCell(),_emptyCell()]; for(let n=57;n<=71;n++) rLa.push(e(n)); rLa.push(_emptyCell());
  html += row(rLa);

  html += `<div class="fblock-label" style="margin-top:4px;">🏷️ Họ Actinide (89–103)</div>`;
  const rAc = [_emptyCell(),_emptyCell()]; for(let n=89;n<=103;n++) rAc.push(e(n)); rAc.push(_emptyCell());
  html += row(rAc);

  grid.innerHTML = html;
}

function showElementDetail(num) {
  const element = elementsData.find(el => el.number === num);
  if (!element) return;

  // Highlight ô đang chọn
  document.querySelectorAll('.element-cell').forEach(c => c.classList.remove('selected-cell'));
  const cells = document.querySelectorAll('.element-cell');
  cells.forEach(c => { if(c.querySelector('.atomic-num') && c.querySelector('.atomic-num').textContent == num) c.classList.add('selected-cell'); });

  const detail = document.getElementById('element-detail');
  detail.style.display = 'block';
  const cls = getCategoryClass(element.category);
  const catVi = categoryViNames[cls] || element.category;

  detail.innerHTML = `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px;">
      <div class="detail-symbol ${cls}">${element.symbol}</div>
      <div>
        <div class="detail-name">${element.name}</div>
        <div style="font-size:11px;color:#aac4e6;margin-top:3px;letter-spacing:.05em;">${catVi} &nbsp;•&nbsp; Chu kỳ ${element.period} &nbsp;•&nbsp; Nhóm ${element.group}</div>
      </div>
    </div>
    <div class="detail-body">
      <div><strong>Số nguyên tử (Z)</strong>&nbsp; ${element.number}</div>
      <div><strong>Khối lượng nguyên tử</strong>&nbsp; ${element.mass} u</div>
      <div><strong>Độ âm điện (Pauling)</strong>&nbsp; ${element.electronegativity !== null ? element.electronegativity : '—'}</div>
      <div><strong>Cấu hình electron</strong>&nbsp; <code>${element.config}</code></div>
      <div><strong>Số oxi hóa phổ biến</strong>&nbsp; ${element.oxidation}</div>
	</div>`;
}

function lookupByAtomicNumber(val) {
  const num = parseInt(val);
  if (num >= 1 && num <= 118) showElementDetail(num);
}

function resetPeriodicHighlight() {
  document.querySelectorAll('.element-cell').forEach(c => c.classList.remove('selected-cell'));
  const detail = document.getElementById('element-detail');
  detail.style.display = 'none';
  detail.innerHTML = '<div class="detail-placeholder"><p>🔍 Bấm vào một nguyên tố bất kỳ trong bảng, hoặc nhập số hiệu nguyên tử ở trên để xem thông tin chi tiết.</p></div>';
  const inp = document.getElementById('atomic-number-input');
  if (inp) inp.value = '';
}
