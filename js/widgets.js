/* =========================================================
 * WILL 交互组件库
 * decimal-shift / compare-line / long-division / speed-lab
 * clock-convert / blocks / order-machine
 * 依赖：js/division.js (window.LongDiv)
 * ======================================================= */
(function () {
  'use strict';
  const LD = window.LongDiv;

  function fmt(v, dp) {
    if (!isFinite(v)) return '—';
    let s = v.toFixed(dp === undefined ? 4 : dp);
    if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s;
  }

  /* 数字 → 带小数点样式的 token（appendedAt: 高亮补的0个数, dotCreated: 小数点是"变"出来的） */
  function numTokens(str, opts) {
    opts = opts || {};
    const out = [];
    const appended = opts.appended || 0;
    const chars = str.split('');
    const dotIdx = chars.indexOf('.');
    chars.forEach((ch, i) => {
      if (ch === '.') {
        out.push('<span class="dn dot' + (opts.dotCreated && i === dotIdx ? ' created' : '') + '">·</span>');
      } else {
        // appended>0 时移位结果必无小数点（原小数位不够移才会补0），直接按末尾 appended 个判断
        const isAppended = appended > 0 && i >= chars.length - appended;
        out.push('<span class="dn' + (isAppended ? ' new0' : '') + '">' + ch + '</span>');
      }
    });
    return out.join('');
  }
  function appendedCount(str, n) {
    const f = str.includes('.') ? str.split('.')[1].length : 0;
    return Math.max(0, n - f);
  }
  function dotCreated(str, n) {
    const f = str.includes('.') ? str.split('.')[1].length : 0;
    return f === 0 && n > 0;
  }
  /* 精确商显示 */
  function exactQuotient(a, b) {
    const da = a.includes('.') ? a.split('.')[1].length : 0;
    const db = b.includes('.') ? b.split('.')[1].length : 0;
    const A = Number(LD.shiftDecimalStr(a, da));
    const B = Number(LD.shiftDecimalStr(b, db));
    const v = A / B * Math.pow(10, db - da);
    for (let k = 0; k <= 6; k++) {
      const scaled = Math.round(v * Math.pow(10, k));
      if (Math.abs(v - scaled / Math.pow(10, k)) < 1e-9) return fmt(scaled / Math.pow(10, k), k);
    }
    return '≈ ' + fmt(v, 2);
  }

  /* ============ ① 小数点联动搬家 ============ */
  function decimalShift(el) {
    const a0 = el.dataset.a, b0 = el.dataset.b;
    let n = 0, only = false;
    const q0 = exactQuotient(a0, b0);

    function render() {
      const a = only ? a0 : LD.shiftDecimalStr(a0, n);
      const b = LD.shiftDecimalStr(b0, n);
      const apA = only ? 0 : appendedCount(a0, n), apB = appendedCount(b0, n);
      const bad = only ? exactQuotient(a0, b) : null;
      el.innerHTML = `
        <div class="dsh">
          <div class="dsh-stage">
            <div class="dsh-card"><div class="dsh-label">被除数 dividend</div>
              <div class="dsh-num">${numTokens(a, { appended: apA, dotCreated: dotCreated(a0, n) })}</div></div>
            <div class="dsh-op">÷</div>
            <div class="dsh-card"><div class="dsh-label">除数 divisor</div>
              <div class="dsh-num">${numTokens(b, { appended: apB, dotCreated: dotCreated(b0, n) })}</div></div>
            <div class="dsh-op">=</div>
            <div class="dsh-card ${only ? 'bad' : 'good'}"><div class="dsh-label">商 quotient</div>
              <div class="dsh-num">${only ? bad : q0}</div></div>
          </div>
          <div class="dsh-msg ${only ? 'bad' : 'good'}">${only
            ? `只把除数变成 <b>${b}</b>，被除数没跟上 → 商从 ${q0} 变成了 <b>${bad}</b> ✗ 天平歪了！`
            : (n === 0
              ? `原始算式：${a0} ÷ ${b0} = ${q0}。点下面的按钮，让小数点一起搬家！`
              : `两边同时 ×${n === 1 ? '10' : n === 2 ? '100' : '1000'}（小数点右移 ${n} 位）→ 商还是 <b>${q0}</b> ✓ 商不变！`)}</div>
          <div class="dsh-ctrl">
            <button class="wbtn ghost" data-act="reset" ${n === 0 ? 'disabled' : ''}>↩︎ 复位</button>
            <button class="wbtn" data-act="x10" ${n >= 3 ? 'disabled' : ''}>两边同时 ×10 →</button>
            <button class="wbtn ghost" data-act="x100" ${n >= 2 ? 'disabled' : ''}>一步到位 ×100 →</button>
            <button class="wbtn trap ${only ? 'on' : ''}" data-act="only">👀 ${only ? '回到正确做法' : '只移动除数试试'}</button>
          </div>
          <div class="dsh-shift">小数点已右移：<b>${n}</b> 位 ${n > 0 ? `<span class="pill">÷${b0} 的除数变成了整数 <b>${LD.shiftDecimalStr(b0, Math.max(n, (b0.split('.')[1] || '').length))}</b> 时就够啦</span>` : ''}</div>
        </div>`;
      el.querySelectorAll('.wbtn').forEach(btn => btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'reset') { n = 0; only = false; }
        if (act === 'x10') { n = Math.min(3, n + 1); only = false; }
        if (act === 'x100') { n = 2; only = false; }
        if (act === 'only') { only = !only; if (only && n === 0) n = (b0.split('.')[1] || '').length; }
        render();
      }));
    }
    render();
  }

  /* ============ ② 除数与商的大小（数线） ============ */
  function compareLine(el) {
    const base = Number(el.dataset.base) || 10;
    let d = 1;
    const dOpts = [2, 1.5, 1, 0.5, 0.25, 0.1];
    function render() {
      const q = base / d;
      const maxQ = base / 0.1;
      const pct = q / maxQ * 100;
      const mood = d > 1 ? ['变小了', 'bad', '➖'] : (d === 1 ? ['不变', 'same', '🟰'] : ['变大了！', 'good', '➕']);
      el.innerHTML = `
        <div class="cmp">
          <div class="cmp-eq">${base} ÷ <span class="cmp-d">${fmt(d, 2)}</span> = <b>${fmt(q, 2)}</b>
            <span class="pill ${mood[1]}">${mood[2]} 商${mood[0]}</span></div>
          <div class="cmp-line"><div class="cmp-fill" style="width:${pct}%"></div>
            <div class="cmp-dot" style="left:${pct}%"></div>
            <div class="cmp-ticks"><span>0</span><span>${maxQ / 2}</span><span>${maxQ}</span></div></div>
          <div class="dsh-ctrl">
            ${dOpts.map(v => `<button class="wbtn ${Math.abs(v - d) < 1e-9 ? 'on' : ''}" data-d="${v}">÷ ${v}</button>`).join('')}
          </div>
          <div class="dsh-msg">${d > 1
            ? `除以比 1 大的数（${fmt(d, 2)}）→ 把 ${base} <b>分得更碎</b>，每份比 ${base} 小 → 商变小。`
            : (d === 1
              ? `除以 1 → 一点没变，商还是 ${base}。`
              : `除以比 1 小的数（${fmt(d, 2)}）→ 在问"${base} 里有几个 ${fmt(d, 2)}" → 个数比 ${base} 本身还多 → 商变大！`)}</div>
        </div>`;
      el.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { d = Number(b.dataset.d); render(); }));
    }
    render();
  }

  /* ============ ③ 长除法步进器 ============ */
  function longDivision(el) {
    const a = el.dataset.a, b = el.dataset.b;
    const shift = el.dataset.shift === undefined || el.dataset.shift === '' ? 0 : Number(el.dataset.shift);
    const r = LD.build(a, b, shift);
    const disp = r.events.filter(e => e.display);
    const N = disp.length;
    let s = 0, timer = null, showCheck = false;

    const U = 1.7; // em/列
    const dl = r.divisorStr.length;
    const off = dl + 2; // 多留一列，避免最左侧字符被居中变换裁掉

    function tokenRow(tokens, cls) {
      return `<div class="ld-row ${cls}">` + tokens.map(t =>
        `<span class="ld-t ${t.cls || ''}" style="left:calc((${t.col} + ${off}) * var(--u))">${t.ch}</span>`).join('') + `</div>`;
    }
    function lineRow(from, to, cls) {
      return `<div class="ld-row"><span class="ld-line ${cls || ''}" style="left:calc((${from} + ${off}) * var(--u)); width:calc((${to - from + 1}) * var(--u))"></span></div>`;
    }

    function partialQuotient(k) {
      const used = disp.slice(0, k);
      if (!used.length) return '';
      let intP = '', fracP = '';
      used.forEach(e => {
        if (r.dotCol !== -1 && e.col > r.dotCol) fracP += String(e.q);
        else intP += String(e.q);
      });
      intP = intP.replace(/^0+(?=\d)/, '') || '0';
      return r.dotCol !== -1 && (fracP || (!used.some(e => e.col < r.dotCol) )) ? intP + '.' + fracP : intP;
    }

    function render() {
      // 逐步显示的行
      const rows = [];
      // 商
      const qToks = [];
      const shown = disp.slice(0, s);
      shown.forEach((e, i) => qToks.push({ col: e.col, ch: String(e.q), cls: 'qdigit' + (i === s - 1 ? ' cur' : ' done') }));
      const firstFrac = disp.findIndex(e => r.dotCol !== -1 && e.col > r.dotCol);
      const collapsed = !disp.some(e => r.dotCol !== -1 && e.col < r.dotCol);
      let dotAt = -1;
      if (r.dotCol !== -1) {
        if (collapsed) { if (s >= 1) dotAt = 0; }
        else if (firstFrac !== -1 && s > firstFrac) dotAt = 1;
        else if (firstFrac !== -1 && s === firstFrac + 1) dotAt = 1;
      }
      if (dotAt === 0) qToks.unshift({ col: 0, ch: '0', cls: 'qdigit qzero cur' });
      if (dotAt !== -1) qToks.push({ col: r.dotCol, ch: '.', cls: 'qdot' });
      qToks.sort((x, y) => x.col - y.col);
      rows.push(tokenRow(qToks, 'ld-quot'));

      // 主行：除数 ）被除数（含插入的小数点与补的 0）
      // 除数数字 i 放在 col i-(dl+1)，）固定在 -1，被除数从 0 起；渲染偏移 off=dl+2 保证左侧不裁切
      const mainToks = [];
      r.divisorStr.split('').forEach((ch, i) => mainToks.push({ col: i - dl - 1, ch, cls: 'mdigit mdiv' }));
      mainToks.push({ col: -1, ch: '）', cls: 'mparen' });
      let ci = 0;
      r.dividendStr.split('').forEach(ch => {
        if (ch === '.') mainToks.push({ col: ci, ch: '.', cls: 'mdot' });
        else mainToks.push({ col: ci, ch, cls: 'mdigit' });
        ci++;
      });
      if (r.rows.find(x => x.kind === 'main').tokens.some(t => t.cls && t.cls.includes('mdot-insert'))) {
        mainToks.push({ col: ci, ch: '.', cls: 'mdot insert' }); ci++;
      }
      disp.forEach((e, i) => {
        if (e.appended && s > i) mainToks.push({ col: e.col, ch: '0', cls: 'mdigit append0' + (i === s - 1 ? ' cur' : '') });
      });
      rows.push(tokenRow(mainToks, 'ld-main'));

      // 工作行
      r.rows.forEach(row => {
        if (row.kind === 'product') {
          if (row.eventIdx < s) {
            rows.push(tokenRow(row.tokens.map(t => ({ ...t, cls: t.cls + (row.eventIdx === s - 1 ? ' cur' : ' done') })), 'ld-work'));
            rows.push(lineRow(row.lineFrom, row.lineTo));
          }
        } else if (row.kind === 'value') {
          if (row.eventIdx === s && s < N) {
            rows.push(tokenRow(row.tokens.map(t => ({ ...t, cls: (t.cls || 'vdigit') + ' cur-in' })), 'ld-work'));
          }
        } else if (row.kind === 'final') {
          if (s >= N) rows.push(tokenRow(row.tokens.map(t => ({ ...t, cls: 'finalrem' })), 'ld-work'));
        }
      });

      const note = s === 0
        ? (shift === 0
          ? `除数 ${b} 本来就是整数——<b>不需要搬家</b>！现在直接算 <b>${r.dividendStr} ÷ ${r.divisorStr}</b>，点"下一步"开始除！`
          : `变身完成！现在算 <b>${r.dividendStr} ÷ ${r.divisorStr}</b>（两边小数点同时右移 ${shift} 位）。点"下一步"开始除！`)
        : r.narration[r.events.indexOf(disp[s - 1])] + (s === N ? ` 🎉 商 = <b>${r.quotient}</b>` : `　商到目前为止：<b>${partialQuotient(s) || '…'}</b>`);

      el.innerHTML = `
        <div class="ldw">
          <div class="ld-head">
            <span class="ld-eq">${a} ÷ ${b} = ?</span>
            <span class="pill">${shift === 0 ? `除数 ${b} 已经是整数，不用搬家！` : `变身：两边小数点右移 ${shift} 位 → ${r.dividendStr} ÷ ${r.divisorStr}`}</span>
          </div>
          <div class="ld-grid" style="--u:${U}em">${rows.join('')}</div>
          <div class="ld-note ${s === N ? 'done' : ''}">${note}</div>
          <div class="dsh-ctrl">
            <button class="wbtn ghost" data-act="reset">↩︎ 重新开始</button>
            <button class="wbtn ghost" data-act="prev" ${s === 0 ? 'disabled' : ''}>◀ 上一步</button>
            <button class="wbtn primary" data-act="next" ${s >= N ? 'disabled' : ''}>下一步 ▶</button>
            <button class="wbtn ghost" data-act="auto">${timer ? '⏸ 暂停' : '▶▶ 自动播放'}</button>
            ${s >= N ? '<button class="wbtn check" data-act="check">🔍 验算一下</button>' : ''}
          </div>
          <div class="ld-check ${showCheck ? 'open' : ''}">${showCheck ? renderCheck() : ''}</div>
        </div>`;

      el.querySelectorAll('.wbtn').forEach(btn => btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'reset') { stopAuto(); s = 0; showCheck = false; }
        if (act === 'prev') { s = Math.max(0, s - 1); showCheck = false; }
        if (act === 'next') { s = Math.min(N, s + 1); if (s < N) showCheck = false; }
        if (act === 'auto') { timer ? stopAuto() : startAuto(); }
        if (act === 'check') { showCheck = !showCheck; stopAuto(); }
        render();
      }));

      function startAuto() { timer = setInterval(() => { if (s >= N) { stopAuto(); render(); return; } s++; render(); }, 1500); }
      function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }
    }
    render();

    function renderCheck() {
      const c = r.check;
      return `<div class="mult-box">
        <div class="mult-title">验算：商 × 原来的除数 = 原来的被除数</div>
        ${c.rows.map(row => `<div class="mult-row ${row.cls}">${row.text.replace(/ /g, '&nbsp;')}</div>`).join('')}
        <div class="mult-verdict">${c.ok ? `✓ ${c.result} = ${c.target}，验算通过，答案放心！` : '✗ 验算没对上，快回头检查！'}</div>
      </div>`;
    }
  }

  /* ============ ④ 速度实验室 ============ */
  function speedLab(el) {
    let dist = Number(el.dataset.distance), hrs = Number(el.dataset.hours);
    let playing = false, raf = null, t0 = 0;
    function speed() { return dist / hrs; }
    function render(prog) {
      const sp = speed();
      const p = prog || 0;
      el.innerHTML = `
        <div class="slab">
          <div class="slab-track">
            <div class="slab-road">
              <div class="slab-runner" style="left:${p * 100}%">🏃</div>
              <div class="slab-km">${fmt(p * dist, 1)} km</div>
            </div>
            <div class="slab-scale"><span>起点</span><span>${fmt(dist, 1)} km 终点🏁</span></div>
          </div>
          <div class="slab-eq">速度 = 路程 ÷ 时间 = <b>${fmt(dist, 1)}</b> km ÷ <b>${fmt(hrs, 1)}</b> h = <span class="slab-speed">${fmt(sp, 2)} km/h</span></div>
          <div class="slab-ctrls">
            <label>路程 <input type="range" min="3" max="42" step="0.1" value="${dist}" data-k="d"> <b>${fmt(dist, 1)} km</b></label>
            <label>时间 <input type="range" min="0.5" max="6" step="0.1" value="${hrs}" data-k="h"> <b>${fmt(hrs, 1)} h</b></label>
            <button class="wbtn primary" data-act="play">${playing ? '⏸ 暂停' : '▶ 让他跑起来！'}</button>
          </div>
          <div class="dsh-msg">${p > 0 && p < 1 ? `跑到 ${fmt(p * dist, 1)} km 了，用了 ${fmt(p * hrs, 2)} 小时…` : `跑完全程正好用 ${fmt(hrs, 1)} 小时 → 速度 ${fmt(sp, 2)} km/h，每 1 小时跑 ${fmt(sp, 2)} 千米。`}</div>
        </div>`;
      el.querySelectorAll('input[type=range]').forEach(inp => inp.addEventListener('input', () => {
        if (inp.dataset.k === 'd') dist = Number(inp.value); else hrs = Number(inp.value);
        playing = false; if (raf) cancelAnimationFrame(raf); render(0);
      }));
      el.querySelector('[data-act=play]').addEventListener('click', () => {
        if (playing) { playing = false; if (raf) cancelAnimationFrame(raf); render(0); return; }
        playing = true; t0 = performance.now();
        const DUR = 3600;
        const tick = now => {
          if (!playing) return;
          const p = Math.min(1, (now - t0) / DUR);
          if (p >= 1) { playing = false; render(1); return; }
          render(p); raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    }
    render(0);
  }

  /* ============ ⑤ 时钟换算 + 倒数视角 ============ */
  function clockConvert(el) {
    let hours = Number(el.dataset.hours) || 0.6;
    const dist = el.dataset.distance ? Number(el.dataset.distance) : null;
    let view = 0;
    function render() {
      const mins = hours * 60;
      const frac = Math.min(mins, 60) / 60;
      const circ = 2 * Math.PI * 66;
      const perMin = dist ? dist / mins : null;
      const perKm = dist ? mins / dist : null;
      el.innerHTML = `
        <div class="clk">
          <div class="clk-wrap">
            <svg viewBox="0 0 180 180" class="clk-svg">
              <circle cx="90" cy="90" r="66" class="clk-face"/>
              ${Array.from({ length: 12 }, (_, i) => {
                const ang = i * 30 * Math.PI / 180;
                return `<line x1="${90 + 58 * Math.sin(ang)}" y1="${90 - 58 * Math.cos(ang)}" x2="${90 + 66 * Math.sin(ang)}" y2="${90 - 66 * Math.cos(ang)}" class="clk-tick"/>`;
              }).join('')}
              <circle cx="90" cy="90" r="66" class="clk-arc" stroke-dasharray="${circ * frac} ${circ}" transform="rotate(-90 90 90)"/>
              <text x="90" y="86" text-anchor="middle" class="clk-num">${fmt(mins, 0)}</text>
              <text x="90" y="106" text-anchor="middle" class="clk-unit">分钟</text>
            </svg>
            <div class="clk-eq">${fmt(hours, 1)} h = ${fmt(hours, 1)} × 60 = <b>${fmt(mins, 0)} min</b></div>
            <label class="clk-slider">小时 <input type="range" min="0.1" max="2" step="0.1" value="${hours}"> <b>${fmt(hours, 1)} h</b></label>
            ${hours < 1 ? '<div class="pill warn">不到 1 小时！分钟数 = 小时 × 60，不是把小数点搬家！</div>' : ''}
          </div>
          ${dist ? `<div class="clk-right">
            <div class="clk-toggle"><button class="wbtn ${view === 0 ? 'on' : ''}" data-v="0">① 每分钟视角</button><button class="wbtn ${view === 1 ? 'on' : ''}" data-v="1">② 每千米视角</button></div>
            <div class="clk-view">${view === 0
              ? `<div class="clk-card"><div class="clk-q">每 1 分钟 ⏱ 行多远 🚚？</div><div class="clk-a">${fmt(dist, 1)} km ÷ ${fmt(mins, 0)} min = <b>${fmt(perMin, 2)} km/min</b></div><div class="clk-sub">分子是路程，分母是时间</div></div>`
              : `<div class="clk-card"><div class="clk-q">每 1 千米 🚚 要多久 ⏱？</div><div class="clk-a">${fmt(mins, 0)} min ÷ ${fmt(dist, 1)} km = <b>${fmt(perKm, 2)} min/km</b></div><div class="clk-sub">分子是时间，分母是路程</div></div>`}</div>
            <div class="clk-recip">🪄 两个答案互为<b>倒数</b>：${fmt(perMin, 2)} × ${fmt(perKm, 2)} ${Math.abs(Number(fmt(perMin, 2)) * Number(fmt(perKm, 2)) - 1) < 1e-9 ? '=' : '≈'} 1 —— 说的是同一件事！</div>
          </div>` : ''}
        </div>`;
      el.querySelector('input[type=range]').addEventListener('input', e => { hours = Number(e.target.value); render(); });
      el.querySelectorAll('[data-v]').forEach(b => b.addEventListener('click', () => { view = Number(b.dataset.v); render(); }));
    }
    render();
  }

  /* ============ ⑥ 分配律积木 ============ */
  function blocks(el) {
    const factor = Number(el.dataset.factor);
    const parts = JSON.parse(el.dataset.parts);
    let smart = false;
    const UNIT = 34;
    function render() {
      const pos = parts.filter(p => p > 0), neg = parts.filter(p => p < 0).map(p => -p);
      const totalPos = pos.reduce((s, v) => s + v, 0);
      const total = parts.reduce((s, v) => s + v, 0);
      el.innerHTML = `
        <div class="blk">
          <div class="blk-bar ${smart ? 'merged' : ''}">
            ${smart
              ? `<div class="blk-seg one" style="width:${total * UNIT}px" title="一共 ${fmt(total, 1)} 份"><b>${fmt(total, 1)}</b>&nbsp;份</div>`
              : pos.map((p, i) => `<div class="blk-seg s${i}" style="width:${p * UNIT}px">${fmt(p, 1)} 份</div>`).join('')}
          </div>
          ${!smart ? `<div class="blk-negrow">
              ${neg.map(n => `<div class="blk-seg neg" style="width:${n * UNIT}px">− ${fmt(n, 0)} 份</div>`).join('')}
              <div class="blk-neg-label">↑ 这一份就是单独的 −${factor}，它戴着面具：<b>− ${factor} = − ${factor} × 1</b></div>
            </div>` : ''}
          <div class="blk-calc">${smart
            ? `<span class="blk-eq glow">${factor} × ( ${parts.map(p => fmt(p, 1)).join(' + ').replace('+ -', '− ')} ) = ${factor} × ${fmt(total, 1)} = <b>${fmt(factor * total, 2)}</b></span><div class="blk-tip">把公共朋友 ${factor} 提出来，括号里只剩"份数"——那份看不见的 <b>×1</b> 也进去了！</div>`
            : parts.map(p => `<span class="blk-eq">${factor} × ${fmt(p, 1)} = ${fmt(factor * p, 2)}</span>`).join('<span class="blk-plus">、</span>') + `<span class="blk-eq">合起来 = <b>${fmt(factor * total, 2)}</b></span><div class="blk-tip">分三次算也能对，但容易算错小数——试试聪明算法！</div>`}
          </div>
          <div class="dsh-ctrl"><button class="wbtn primary" data-act="toggle">${smart ? '↩ 看分开算' : '🪄 合并成 ' + fmt(total, 1) + ' 份！'}</button></div>
        </div>`;
      el.querySelector('[data-act=toggle]').addEventListener('click', () => { smart = !smart; render(); });
    }
    render();
  }

  /* ============ ⑦ 运算顺序三级火箭 ============ */
  const ORDER_STAGES = [
    {
      rule: '🥇 第一级：括号 brackets —— 最优先！',
      expr: ['7.25', '÷', '2.5', '+', '(', '4.38', '−', '2.61', ')'],
      active: [4, 5, 6, 7, 8],
      note: '括号有围墙，里面只有 4.38 和 2.61。先算：4.38 − 2.61 = 1.77'
    },
    {
      rule: '🥈 第二级：乘除 × ÷ —— 从左到右',
      expr: ['7.25', '÷', '2.5', '+', '1.77'],
      active: [0, 1, 2],
      note: '7.25 ÷ 2.5：两边 ×10 → 72.5 ÷ 25 = 2.9（可别写成 29！）'
    },
    {
      rule: '🥉 第三级：加减 + − —— 从左到右',
      expr: ['2.9', '+', '1.77'],
      active: [0, 1, 2],
      note: '数位对齐：2.90 + 1.77 = 4.67'
    },
    {
      rule: '🏁 完成！',
      expr: ['4.67'],
      active: [0],
      note: '最终答案 4.67。三级火箭，一级都不能跳！'
    }
  ];
  function orderMachine(el) {
    let s = 0;
    function render() {
      const st = ORDER_STAGES[s];
      el.innerHTML = `
        <div class="ord">
          <div class="ord-rule">${st.rule}</div>
          <div class="ord-expr">${st.expr.map((t, i) => `<span class="ord-t ${st.active.includes(i) ? 'on' : ''} ${'÷×−+()'.includes(t) ? 'op' : ''}">${t}</span>`).join('')}</div>
          <div class="ld-note">${st.note}</div>
          <div class="dsh-ctrl">
            <button class="wbtn ghost" data-act="prev" ${s === 0 ? 'disabled' : ''}>◀ 上一步</button>
            <button class="wbtn primary" data-act="next" ${s === ORDER_STAGES.length - 1 ? 'disabled' : ''}>下一步 ▶</button>
          </div>
        </div>`;
      el.querySelectorAll('.wbtn').forEach(b => b.addEventListener('click', () => {
        if (b.dataset.act === 'next') s = Math.min(ORDER_STAGES.length - 1, s + 1);
        else s = Math.max(0, s - 1);
        render();
      }));
    }
    render();
  }

  /* ============ ⑧ 单价比较 Best Buy ============ */
  function bestBuy(el) {
    const packs = JSON.parse(el.dataset.packs);
    const item = el.dataset.item || 'item';
    const hero = el.dataset.hero || 'Mandisa';
    let stage = 0, will = false;

    const places = s => (String(s).includes('.') ? String(s).split('.')[1].length : 0);
    function unit(p) {
      const da = places(p.price);
      const num = Number(String(p.price).replace('.', ''));
      const v = num / p.count / Math.pow(10, da);
      for (let k = 0; k <= 6; k++) {
        const sc = Math.round(v * Math.pow(10, k));
        if (Math.abs(v - sc / Math.pow(10, k)) < 1e-9) return fmt(sc / Math.pow(10, k), k);
      }
      return fmt(v, 4);
    }
    function align(strs) {
      const m = Math.max(...strs.map(places));
      return strs.map(s => {
        const [i, f] = String(s).split('.');
        return i + (m ? '.' + (f || '').padEnd(m, '0') : '');
      });
    }
    const units = packs.map(unit);
    const aligned = align(units);
    const cheaperIdx = Number(units[0]) <= Number(units[1]) ? 0 : 1;
    const loserIdx = 1 - cheaperIdx;

    function packCard(i, reveal) {
      const p = packs[i];
      return `<div class="bb-card ${reveal ? (i === cheaperIdx ? 'win' : 'lose') : ''}">
        <div class="bb-name">${p.name}</div>
        <div class="bb-deal">${p.count} ${item}s for <b>$${p.price}</b></div>
        ${reveal
          ? `<div class="bb-eq">$${p.price} ÷ ${p.count} = <b>$${units[i]}</b> each</div>`
          : `<div class="bb-eq muted">单价 = ？</div>`}
      </div>`;
    }

    function render() {
      let main = '';
      if (will) {
        const b = packs[1], bUnit = units[1];
        main = `
          <div class="bb-will">
            <div class="bb-step">🪄 Will 的放大法：把 B 包也变成 ${packs[0].count} 个来比</div>
            <div class="bb-eqline">B 包 1 个：$${b.price} ÷ ${b.count} = <b>$${bUnit}</b></div>
            <div class="bb-eqline">B 包 ${packs[0].count} 个：$${bUnit} × ${packs[0].count} = <b>$${fmt(Number(bUnit) * packs[0].count, 2)}</b></div>
            <div class="bb-eqline">A 包 ${packs[0].count} 个：$${packs[0].price}</div>
            <div class="bb-cmprow">
              <span class="bb-tag win">$${packs[0].price}（A 包）</span> vs
              <span class="bb-tag lose">$${fmt(Number(bUnit) * packs[0].count, 2)}（B 包放大后）</span>
              → <b>${packs[cheaperIdx].name}</b> 便宜 ✓
            </div>
            <div class="bb-note">Will 卷子上的算式 1.89÷3×4=2.52 就是这个思路——<b>完全正确</b>！只差最后一步：写出比较和结论。</div>
          </div>`;
      } else {
        main = `
          <div class="bb-grid">${packCard(0, stage >= 1)}${packCard(1, stage >= 2)}</div>
          ${stage >= 3 ? `
            <div class="bb-cmp">
              <div class="bb-cmp-title">⚖️ 比一比（先补 0 对齐）</div>
              <div class="bb-cmprow">
                <span class="bb-tag ${cheaperIdx === 0 ? 'win' : 'lose'}">${aligned[0]}</span> vs
                <span class="bb-tag ${cheaperIdx === 1 ? 'win' : 'lose'}">${aligned[1]}</span>
                → <b>$${aligned[cheaperIdx]} &lt; $${aligned[loserIdx]}</b>
              </div>
              <div class="bb-concl">📝 结论 conclusion：${packs[cheaperIdx].name} is cheaper per ${item}. ${hero} should choose <b>${packs[cheaperIdx].name}</b>! ✅</div>
            </div>` : ''}
        `;
      }
      el.innerHTML = `
        <div class="bb">
          ${main}
          <div class="dsh-ctrl">
            <button class="wbtn ghost" data-act="reset">↩︎ 复位</button>
            ${!will ? `<button class="wbtn primary" data-act="next" ${stage >= 3 ? 'disabled' : ''}>${stage === 0 ? '⚡ 算 Pack A 的单价' : stage === 1 ? '⚡ 算 Pack B 的单价' : stage === 2 ? '⚖️ 比一比，写结论' : '完成！'}</button>` : ''}
            <button class="wbtn trap ${will ? 'on' : ''}" data-act="will">👀 ${will ? '回到标准方法' : `看看 ${hero} 卷子上的方法`}</button>
          </div>
        </div>`;
      el.querySelectorAll('.wbtn').forEach(btn => btn.addEventListener('click', () => {
        const act = btn.dataset.act;
        if (act === 'reset') { stage = 0; will = false; }
        if (act === 'next') stage = Math.min(3, stage + 1);
        if (act === 'will') will = !will;
        render();
      }));
    }
    render();
  }

  window.WIDGETS = {
    'decimal-shift': decimalShift,
    'compare-line': compareLine,
    'long-division': longDivision,
    'speed-lab': speedLab,
    'clock-convert': clockConvert,
    'blocks': blocks,
    'order-machine': orderMachine,
    'best-buy': bestBuy
  };

  /* 页面渲染后初始化所有 data-widget 容器 */
  window.initWidgets = function (root) {
    (root || document).querySelectorAll('[data-widget]').forEach(el => {
      const fn = window.WIDGETS[el.dataset.widget];
      if (fn) { try { fn(el); } catch (err) { el.innerHTML = '<div class="werr">组件加载失败：' + err.message + '</div>'; console.error(err); } }
    });
  };
})();
