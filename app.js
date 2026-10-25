const $ = s => document.querySelector(s);
const box = $("#box");
const sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
let qs = [], qi = 0, score = 0, mode;

// Bộ từ: "all" hoặc khoá trong DATA (mỗi bộ là 1 lựa chọn, không chia phần)
$("#src").innerHTML = '<option value="all">Tất cả</option>' +
  Object.entries(DATA).map(([k, d]) => `<option value="${k}">${d.name}</option>`).join("");

const sources = () => { const s = $("#src").value; return s === "all" ? Object.values(DATA) : [DATA[s]]; };
const all = key => sources().flatMap(d => d[key]);

$("#start").onclick = start;
function start() {
  mode = $("#mode").value; const n = +$("#num").value; qi = 0; score = 0;
  const words = all("words"), p = words;
  if (mode === "list") return showList(p);
  if (mode === "vi2en" || mode === "en2vi") {
    qs = sh(p).slice(0, n).map(w => {
      const others = sh(words.filter(x => x !== w && x[2] !== w[2] && x[0] !== w[0])).slice(0, 3);
      const opts = sh([w, ...others]); return { w, opts, ans: opts.indexOf(w) };
    });
  } else if (mode === "stress") {
    qs = sh(all("stress")).slice(0, n).map(g => { const idx = sh([0, 1, 2, 3]); return { words: idx.map(i => g[0][i]), ans: idx.indexOf(g[1]) }; });
  } else {
    // Đáp án nhiễu: giới từ/tiểu từ thì lấy giới từ khác, còn lại lấy đáp án của câu khác
    const fills = all("fill"), answers = [...new Set(fills.map(f => f[1]))];
    const PART = ["up", "on", "off", "out", "over", "with", "to", "in", "for", "into", "away", "through"];
    qs = sh(fills).slice(0, n).map(f => {
      const pool = PART.includes(f[1]) ? PART : answers.filter(a => !PART.includes(a));
      const opts = sh([f[1], ...sh(pool.filter(a => a !== f[1])).slice(0, 3)]);
      return { s: f[0], opts, ans: opts.indexOf(f[1]), why: f[3] };
    });
  }
  show();
}

function head() { return `<div class="row" style="justify-content:space-between"><span class="muted">Câu ${qi + 1}/${qs.length}</span><span class="muted">Điểm: ${score}</span></div><div class="bar"><div style="width:${qi / qs.length * 100}%"></div></div>`; }
const clean = s => s.replace(/[\[\]]/g, "");
const mark = s => s.replace(/\[(.*?)\]/g, '<u class="s">$1</u>');

function show() {
  if (qi >= qs.length) return finish(); const q = qs[qi]; let h = head();
  if (mode === "vi2en" || mode === "en2vi") {
    const ask = mode === "vi2en" ? q.w[2] : q.w[0];
    h += `<p class="muted">${mode === "vi2en" ? "Chọn từ tiếng Anh đúng nghĩa:" : "Chọn nghĩa tiếng Việt đúng:"}</p><div class="q">${ask}</div>
  <div class="opts">${q.opts.map((o, i) => `<button class="opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${mode === "vi2en" ? o[0] : o[2]}</button>`).join("")}</div>`;
  } else if (mode === "stress") {
    h += `<p class="muted">Chọn từ có trọng âm chính khác với các từ còn lại:</p>
  <div class="opts">${q.words.map((o, i) => `<button class="opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${clean(o)}</button>`).join("")}</div>`;
  } else {
    h += `<p class="muted">Chọn từ thích hợp điền vào chỗ trống:</p><div class="q">${q.s.replace("___", "______")}</div>
  <div class="opts">${q.opts.map((o, i) => `<button class="opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${o}</button>`).join("")}</div>`;
  }
  h += `<div class="fb" id="fb"></div><div id="nx"></div>`; box.innerHTML = h;
  box.querySelectorAll(".opt").forEach(b => b.onclick = () => pick(+b.dataset.i));
}

function pick(i) {
  const q = qs[qi], bs = box.querySelectorAll(".opt"); bs.forEach(b => b.disabled = true);
  bs[q.ans].classList.add("ok"); if (i === q.ans) score++; else bs[i].classList.add("bad");
  const info = mode === "stress" ? "Trọng âm: " + q.words.map(mark).join(" · ")
    : mode === "fill" ? q.s.replace("___", `<b>${q.opts[q.ans]}</b>`) + `<div class="muted" style="margin-top:6px">💡 Vì sao: ${q.why}</div>`
    : `<b>${q.w[0]}</b> ${q.w[1]} — ${q.w[2]}`;
  $("#fb").innerHTML = (i === q.ans ? "✅ Đúng! " : "❌ Sai. ") + info; next();
}

function next() {
  $("#nx").innerHTML = `<button class="pri" id="nb" style="margin-top:8px">${qi + 1 < qs.length ? "Câu tiếp →" : "Xem kết quả"}</button>`;
  const b = $("#nb"); b.focus(); b.onclick = () => { qi++; show(); };
}

function finish() {
  if (!qs.length) { box.innerHTML = `<p class="muted">Không có câu hỏi cho lựa chọn này.</p>`; return; }
  const p = Math.round(score / qs.length * 100);
  box.innerHTML = `<div class="q">Kết quả: ${score}/${qs.length} (${p}%)</div><p>${p >= 90 ? "Xuất sắc! 🎉" : p >= 70 ? "Khá tốt! 👍" : p >= 50 ? "Cần cố gắng thêm 💪" : "Hãy ôn lại danh sách từ nhé 📖"}</p><button class="pri" onclick="start()">Làm lại</button>`;
}

function showList(p) {
  box.innerHTML = `<p class="muted">${p.length} từ</p><table><tr><th>Từ</th><th>Phiên âm</th><th>Nghĩa</th></tr>${p.map(v => `<tr><td><b>${v[0]}</b></td><td>${v[1]}</td><td>${v[2]}</td></tr>`).join("")}</table>`;
}
