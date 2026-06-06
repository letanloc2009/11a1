/* ==================== LẮP RÁP DNA ==================== */
let dnaPairs = [];
function initDNA() { applyDNAPairCount(); }
function applyDNAPairCount() {
  const count = parseInt(document.getElementById('dna-pair-count').value) || 6;
  dnaPairs = [];
  const bases = ['A', 'T', 'G', 'C'], comp = {'A':'T', 'T':'A', 'G':'C', 'C':'G'};
  for(let i=0; i<count; i++) {
    const b1 = bases[Math.floor(Math.random()*bases.length)];
    dnaPairs.push({ b1: b1, target: comp[b1], current: null });
  }
  document.getElementById('dna-score').innerHTML = '';
  renderDNAStrands();
}
function renderDNAStrands() {
  const c = document.getElementById('dna-strands'); if(!c) return;
  let html = '<div class="dna-strand-container">';
  dnaPairs.forEach((p, i) => {
    html += `
    <div class="dna-strand-row">
      <div class="dna-strand-label">Cặp ${i+1}</div>
      <div class="dna-base-slot filled base-${p.b1}">${p.b1}</div>
      <div class="dna-bonds-row" id="bond-${i}">
        <span class="dna-bond">—</span><span class="dna-bond">—</span>${(p.b1==='G'||p.b1==='C')?'<span class="dna-bond">—</span>':''}
      </div>
      <div class="dna-base-slot ${p.current?'filled base-'+p.current:''}" id="slot-${i}" 
           ondragover="event.preventDefault()" ondrop="dropBase(event, ${i})" onclick="cycleBase(${i})">
           ${p.current||'?'}
      </div>
    </div>`;
  });
  c.innerHTML = html + '</div>';
}
function dragBase(ev, base) { ev.dataTransfer.setData("base", base); }
function dropBase(ev, idx) {
  const b = ev.dataTransfer.getData("base");
  if(b) { dnaPairs[idx].current = b; renderDNAStrands(); }
}
function cycleBase(idx) {
  const bases = ['A', 'T', 'G', 'C'];
  let cur = dnaPairs[idx].current;
  dnaPairs[idx].current = cur ? bases[(bases.indexOf(cur)+1)%4] : 'A';
  renderDNAStrands();
}
function checkDNA() {
  let corrects = 0;
  dnaPairs.forEach((p, i) => {
    const s = document.getElementById(`slot-${i}`), b = document.getElementById(`bond-${i}`);
    if(p.current === p.target) {
      corrects++; s.classList.add('correct'); s.classList.remove('wrong');
      b.querySelectorAll('.dna-bond').forEach(el => el.classList.add('active'));
    } else {
      s.classList.add('wrong'); s.classList.remove('correct');
      b.querySelectorAll('.dna-bond').forEach(el => el.classList.remove('active'));
    }
  });
  const scr = document.getElementById('dna-score');
  if(corrects === dnaPairs.length) scr.innerHTML = `🎉 Tuyệt vời! Đúng ${corrects}/${dnaPairs.length} cặp. Chuỗi DNA đã liên kết!`;
  else scr.innerHTML = `⚠️ Mới đúng ${corrects}/${dnaPairs.length} cặp. Hãy xem lại nguyên tắc A-T, G-C.`;
}
function resetDNA() { applyDNAPairCount(); }
