/* ==================== LAI GIỐNG MENDEL ==================== */

const mendelTraits = {
  flower: {
    label: 'Màu hoa',
    dom: { name: 'Đỏ', emoji: '🌹', allele: 'A' },
    rec: { name: 'Trắng', emoji: '🤍', allele: 'a' },
    desc: 'Hoa đỏ (A) trội hoàn toàn so với hoa trắng (a).'
  },
  seed_color: {
    label: 'Màu hạt',
    dom: { name: 'Vàng', emoji: '🟡', allele: 'B' },
    rec: { name: 'Xanh', emoji: '🟢', allele: 'b' },
    desc: 'Hạt vàng (B) trội hoàn toàn so với hạt xanh (b).'
  },
  seed_shape: {
    label: 'Dạng hạt',
    dom: { name: 'Trơn', emoji: '⭕', allele: 'C' },
    rec: { name: 'Nhăn', emoji: '〰️', allele: 'c' },
    desc: 'Hạt trơn (C) trội hoàn toàn so với hạt nhăn (c).'
  },
  height: {
    label: 'Chiều cao',
    dom: { name: 'Cao', emoji: '🌿', allele: 'D' },
    rec: { name: 'Lùn', emoji: '🌱', allele: 'd' },
    desc: 'Thân cao (D) trội hoàn toàn so với thân lùn (d).'
  }
};

let mendelSelectedTrait = 'flower';
let mendelCrossType = 'mono'; // 'mono' | 'dihy'

function initMendel() {
  renderMendelTraitPicker();
  runMendelCross();
}

function renderMendelTraitPicker() {
  const container = document.getElementById('mendel-trait-picker');
  if (!container) return;
  container.innerHTML = Object.entries(mendelTraits).map(([key, t]) =>
    `<button class="mendel-trait-btn ${key === mendelSelectedTrait ? 'active' : ''}"
      onclick="selectMendelTrait('${key}')">
      ${t.dom.emoji}×${t.rec.emoji} ${t.label}
    </button>`
  ).join('');
}

function selectMendelTrait(key) {
  mendelSelectedTrait = key;
  renderMendelTraitPicker();
  runMendelCross();
}

function selectMendelCrossType(type) {
  mendelCrossType = type;
  document.querySelectorAll('.mendel-cross-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-type') === type);
  });
  runMendelCross();
}

function runMendelCross() {
  const t = mendelTraits[mendelSelectedTrait];
  const A = t.dom.allele, a = t.rec.allele;
  const B = (mendelCrossType === 'dihy') ? mendelTraits['seed_color'].dom.allele : null;
  const b = (mendelCrossType === 'dihy') ? mendelTraits['seed_color'].rec.allele : null;

  let f1Panel, f2Results, punnetHTML;

  if (mendelCrossType === 'mono') {
    // P: AA x aa → F1: all Aa
    const f2Counts = { [A + A]: 250, [A + a]: 500, [a + a]: 250 };
    punnetHTML = buildPunnet1([A, a], [A, a], t);
    f1Panel = buildF1Panel1(t, A, a);
    f2Results = buildF2Results1(t, A, a, f2Counts);
  } else {
    // Dihybrid: AABB x aabb → F1: AaBb
    // F1 x F1: 9A_B_ : 3A_bb : 3aaB_ : 1aabb
    const t2 = mendelTraits['seed_color'];
    punnetHTML = buildPunnet2([A + B, A + b, a + B, a + b], [A + B, A + b, a + B, a + b], t, t2);
    f1Panel = buildF1Panel2(t, t2, A, a, B, b);
    f2Results = buildF2Results2(t, t2, A, a, B, b, 1600);
  }

  const out = document.getElementById('mendel-output');
  if (!out) return;
  out.innerHTML = `
    <div class="mendel-section">
      <div class="mendel-label">🌱 Thế hệ P (Bố/Mẹ)</div>
      <div class="mendel-parents">${buildParents(t, mendelCrossType)}</div>
    </div>
    ${f1Panel}
    <div class="mendel-section">
      <div class="mendel-label">🔲 Bảng Punnett (F1 × F1)</div>
      ${punnetHTML}
    </div>
    ${f2Results}
  `;
}

function buildParents(t, crossType) {
  const A = t.dom.allele, a = t.rec.allele;
  if (crossType === 'mono') {
    return `
      <div class="mendel-parent">
        <div class="mendel-plant dom">${t.dom.emoji} ${t.dom.name}</div>
        <div class="mendel-genotype">${A}${A}</div>
        <div class="mendel-ptype">Thuần chủng trội</div>
      </div>
      <div class="mendel-cross-symbol">×</div>
      <div class="mendel-parent">
        <div class="mendel-plant rec">${t.rec.emoji} ${t.rec.name}</div>
        <div class="mendel-genotype">${a}${a}</div>
        <div class="mendel-ptype">Thuần chủng lặn</div>
      </div>`;
  } else {
    const t2 = mendelTraits['seed_color'];
    const B = t2.dom.allele, b = t2.rec.allele;
    return `
      <div class="mendel-parent">
        <div class="mendel-plant dom">${t.dom.emoji}${t2.dom.emoji} Trội kép</div>
        <div class="mendel-genotype">${A}${A}${B}${B}</div>
        <div class="mendel-ptype">${t.dom.name} + ${t2.dom.name}</div>
      </div>
      <div class="mendel-cross-symbol">×</div>
      <div class="mendel-parent">
        <div class="mendel-plant rec">${t.rec.emoji}${t2.rec.emoji} Lặn kép</div>
        <div class="mendel-genotype">${a}${a}${b}${b}</div>
        <div class="mendel-ptype">${t.rec.name} + ${t2.rec.name}</div>
      </div>`;
  }
}

function buildF1Panel1(t, A, a) {
  return `
  <div class="mendel-section mendel-f1">
    <div class="mendel-label">🌿 Thế hệ F1 (Tất cả đều như nhau)</div>
    <div class="mendel-f1-result">
      <div class="mendel-f1-plant">${t.dom.emoji}</div>
      <div>
        <div class="mendel-genotype big">${A}${a}</div>
        <div class="mendel-ptype">${t.dom.name} (100%)</div>
        <div class="mendel-note">Kiểu hình trội hoàn toàn — Gen lặn bị che khuất</div>
      </div>
    </div>
  </div>`;
}

function buildF1Panel2(t, t2, A, a, B, b) {
  return `
  <div class="mendel-section mendel-f1">
    <div class="mendel-label">🌿 Thế hệ F1 (Tất cả đều như nhau)</div>
    <div class="mendel-f1-result">
      <div class="mendel-f1-plant">${t.dom.emoji}${t2.dom.emoji}</div>
      <div>
        <div class="mendel-genotype big">${A}${a}${B}${b}</div>
        <div class="mendel-ptype">${t.dom.name} + ${t2.dom.name} (100%)</div>
        <div class="mendel-note">Cả hai tính trạng trội đều biểu hiện ở F1</div>
      </div>
    </div>
  </div>`;
}

function buildPunnet1(rowAlleles, colAlleles, t) {
  const A = t.dom.allele;
  let html = '<table class="punnett-table"><thead><tr><th></th>';
  colAlleles.forEach(c => html += `<th class="pun-gamete">${c}</th>`);
  html += '</tr></thead><tbody>';
  rowAlleles.forEach(r => {
    html += `<tr><td class="pun-gamete">${r}</td>`;
    colAlleles.forEach(col => {
      const g = [r, col].sort().join('');
      const isDom = g.includes(A);
      const emoji = isDom ? t.dom.emoji : t.rec.emoji;
      const cls = isDom ? 'pun-dom' : 'pun-rec';
      html += `<td class="pun-cell ${cls}">${emoji}<br><small>${g}</small></td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function buildPunnet2(rowAlleles, colAlleles, t, t2) {
  const A = t.dom.allele;
  const B = t2.dom.allele;
  let html = '<table class="punnett-table punnett-large"><thead><tr><th></th>';
  colAlleles.forEach(c => html += `<th class="pun-gamete">${c}</th>`);
  html += '</tr></thead><tbody>';
  rowAlleles.forEach(r => {
    html += `<tr><td class="pun-gamete">${r}</td>`;
    colAlleles.forEach(col => {
      const aAlleles = [r[0], col[0]].sort();
      const bAlleles = [r[1], col[1]].sort();
      const genA = aAlleles.join('');
      const genB = bAlleles.join('');
      const domA = genA.includes(A), domB = genB.includes(B);
      let cls = 'pun-rec';
      if (domA && domB) cls = 'pun-dom';
      else if (domA || domB) cls = 'pun-mid';
      html += `<td class="pun-cell ${cls}"><small>${genA}${genB}</small></td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}

function buildF2Results1(t, A, a, counts) {
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const domCount = counts[A + A] + counts[A + a];
  const recCount = counts[a + a];
  return `
  <div class="mendel-section">
    <div class="mendel-label">🌾 Kết quả F2 (mô phỏng ${total.toLocaleString()} cây)</div>
    <div class="mendel-f2-bar-wrap">
      <div class="mendel-f2-row">
        <div class="mendel-f2-label">${t.dom.emoji} ${t.dom.name} (AA + Aa)</div>
        <div class="mendel-f2-bar" style="width:${(domCount / total) * 100}%">
          <span>${domCount.toLocaleString()} cây (75%)</span>
        </div>
      </div>
      <div class="mendel-f2-row">
        <div class="mendel-f2-label">${t.rec.emoji} ${t.rec.name} (aa)</div>
        <div class="mendel-f2-bar rec" style="width:${(recCount / total) * 100}%">
          <span>${recCount.toLocaleString()} cây (25%)</span>
        </div>
      </div>
    </div>
    <div class="mendel-ratio">Tỉ lệ kiểu hình: <b>3 ${t.dom.name} : 1 ${t.rec.name}</b></div>
    <div class="mendel-geno-table">
      <div class="mendel-geno-item dom">${A}${A}<br><small>Đồng hợp trội</small><br>${counts[A + A]} cây (25%)</div>
      <div class="mendel-geno-item mid">${A}${a}<br><small>Dị hợp</small><br>${counts[A + a]} cây (50%)</div>
      <div class="mendel-geno-item rec">${a}${a}<br><small>Đồng hợp lặn</small><br>${counts[a + a]} cây (25%)</div>
    </div>
    <div class="mendel-info-box">${t.desc}</div>
  </div>`;
}

function buildF2Results2(t, t2, A, a, B, b, total) {
  const n9 = Math.round(total * 9 / 16);
  const n3a = Math.round(total * 3 / 16);
  const n3b = Math.round(total * 3 / 16);
  const n1 = total - n9 - n3a - n3b;
  return `
  <div class="mendel-section">
    <div class="mendel-label">🌾 Kết quả F2 (mô phỏng ${total.toLocaleString()} cây)</div>
    <div class="mendel-f2-bar-wrap">
      <div class="mendel-f2-row">
        <div class="mendel-f2-label">${t.dom.emoji}${t2.dom.emoji} ${t.dom.name}+${t2.dom.name}</div>
        <div class="mendel-f2-bar" style="width:${(n9 / total) * 100}%"><span>${n9.toLocaleString()} cây (56.25%)</span></div>
      </div>
      <div class="mendel-f2-row">
        <div class="mendel-f2-label">${t.dom.emoji}${t2.rec.emoji} ${t.dom.name}+${t2.rec.name}</div>
        <div class="mendel-f2-bar" style="width:${(n3a / total) * 100}%;background:#f39c12"><span>${n3a.toLocaleString()} cây (18.75%)</span></div>
      </div>
      <div class="mendel-f2-row">
        <div class="mendel-f2-label">${t.rec.emoji}${t2.dom.emoji} ${t.rec.name}+${t2.dom.name}</div>
        <div class="mendel-f2-bar" style="width:${(n3b / total) * 100}%;background:#9b59b6"><span>${n3b.toLocaleString()} cây (18.75%)</span></div>
      </div>
      <div class="mendel-f2-row">
        <div class="mendel-f2-label">${t.rec.emoji}${t2.rec.emoji} ${t.rec.name}+${t2.rec.name}</div>
        <div class="mendel-f2-bar rec" style="width:${(n1 / total) * 100}%"><span>${n1.toLocaleString()} cây (6.25%)</span></div>
      </div>
    </div>
    <div class="mendel-ratio">Tỉ lệ kiểu hình: <b>9 : 3 : 3 : 1</b> (Định luật phân ly độc lập)</div>
    <div class="mendel-info-box">Hai cặp gen trên hai cặp NST khác nhau phân ly và tổ hợp độc lập nhau trong quá trình hình thành giao tử.</div>
  </div>`;
}

function runMendelSimulation(n) {
  const t = mendelTraits[mendelSelectedTrait];
  const A = t.dom.allele, a = t.rec.allele;
  const total = n || 1000;
  let dom = 0, rec = 0;
  for (let i = 0; i < total; i++) {
    const a1 = Math.random() < 0.5 ? A : a;
    const a2 = Math.random() < 0.5 ? A : a;
    if (a1 === A || a2 === A) dom++; else rec++;
  }
  const el = document.getElementById('mendel-sim-result');
  if (el) {
    el.innerHTML = `
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">
        <div class="mendel-sim-card dom">${t.dom.emoji} ${t.dom.name}: <b>${dom}</b> cây (${(dom / total * 100).toFixed(1)}%)</div>
        <div class="mendel-sim-card rec">${t.rec.emoji} ${t.rec.name}: <b>${rec}</b> cây (${(rec / total * 100).toFixed(1)}%)</div>
      </div>
      <div style="font-size:11px;color:#6b82a0;margin-top:6px;">Mô phỏng ngẫu nhiên ${total.toLocaleString()} cây — kết quả xấp xỉ 3:1</div>`;
  }
}

