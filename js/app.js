/* =========================================================
 * WILL 错题医院 · 前端主程序（SPA + hash 路由）
 * 依赖：data.js / data2.js / data3.js / division.js / widgets.js
 * ======================================================= */
(function () {
  'use strict';
  const DATA = window.WILL_DATA;
  const PKEY = 'will-math-v1';

  /* ---------- 进度存取 ---------- */
  function getStore() {
    try { return JSON.parse(localStorage.getItem(PKEY)) || { done: {} }; }
    catch (e) { return { done: {} }; }
  }
  function saveStore(s) { try { localStorage.setItem(PKEY, JSON.stringify(s)); } catch (e) {} }
  function isDone(key) { return !!getStore().done[key]; }
  function markDone(key) { const s = getStore(); s.done[key] = true; saveStore(s); }
  function stars() { return Object.keys(getStore().done).length; }
  function problemCured(p) { return p.practice.every((_, i) => isDone(p.id + '#' + i)); }
  function kpStats(kp) {
    const ps = DATA.problems.filter(p => p.kp === kp);
    const cured = ps.filter(problemCured).length;
    const st = ps.reduce((n, p) => n + p.practice.filter((_, i) => isDone(p.id + '#' + i)).length, 0);
    const total = ps.reduce((n, p) => n + p.practice.length, 0);
    return { cured, total: ps.length, st, stTotal: total };
  }
  function totalStars() { return DATA.problems.reduce((n, p) => n + p.practice.length, 0); }

  /* ---------- 工具 ---------- */
  function normAns(v) {
    v = String(v).trim()
      .replace(/(km\/h|km\/min|min\/km|km\/L|km\/l|km|h|min|小时|千米|分钟|公里|升|\$|￥|¥|元)/gi, '')
      .replace(/[，,\s　]/g, '');
    if (v === '') return '';
    if (/^-?\d*\.?\d+$/.test(v)) {
      if (v.startsWith('.')) v = '0' + v;
      if (/^-0?\.0*$/.test(v)) v = '0';
      v = v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
      v = v.replace(/^(-?)0+(\d)/, '$1$2');
      return v;
    }
    return v.toLowerCase();
  }
  const CHEERS = ['太棒了！这题治好了！🎉', '完全正确，Will 最棒！⭐', '漂亮！坑已经填平啦 ✨', '答对了！这个知识点拿下 💪', '满分！给自己一个赞 👏'];
  const OOPS = ['再想想哦，提示在里面 👀', '差一点点，检查一下小数点？', '别急，看看提示再试一次 💡'];
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* ---------- 游戏化音效引擎 (Web Audio API) ---------- */
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }
  function isSoundEnabled() {
    return localStorage.getItem('will-sound-enabled') !== 'false';
  }
  function setSoundEnabled(en) {
    localStorage.setItem('will-sound-enabled', en ? 'true' : 'false');
  }
  function playTone(freq, type, duration, startTime, gainVal) {
    try {
      const ctx = getAudioCtx();
      if (!ctx || !isSoundEnabled()) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + (startTime || 0));
      gain.gain.setValueAtTime(gainVal || 0.12, ctx.currentTime + (startTime || 0));
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + (startTime || 0) + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + (startTime || 0));
      osc.stop(ctx.currentTime + (startTime || 0) + duration);
    } catch (e) {}
  }
  function playCorrectSound() {
    playTone(523.25, 'sine', 0.18, 0, 0.15);
    playTone(659.25, 'sine', 0.18, 0.08, 0.15);
    playTone(783.99, 'sine', 0.22, 0.16, 0.15);
    playTone(1046.50, 'triangle', 0.35, 0.24, 0.18);
  }
  function playWrongSound() {
    playTone(293.66, 'triangle', 0.15, 0, 0.15);
    playTone(261.63, 'sine', 0.22, 0.10, 0.12);
  }
  function playStarSound() {
    playTone(659.25, 'triangle', 0.12, 0, 0.14);
    playTone(783.99, 'triangle', 0.12, 0.07, 0.14);
    playTone(1046.50, 'sine', 0.15, 0.14, 0.16);
    playTone(1318.51, 'sine', 0.35, 0.21, 0.18);
  }
  function playFlipSound() {
    playTone(440, 'sine', 0.06, 0, 0.08);
  }

  /* ---------- 原始卷面实拍映射 ---------- */
  const PROBLEM_SHEET_MAP = {
    p1: [{ name: '卷① 小数除法竖式练习', file: 'assets/hw_image3_quotient_invariance_long_division.png', desc: '卷① B 部分第 1 题 原卷实拍' }],
    p2: [{ name: '卷① 小数除法竖式练习', file: 'assets/hw_image3_quotient_invariance_long_division.png', desc: '卷① B 部分第 2 题 原卷实拍' }],
    p3: [{ name: '卷① 小数除法竖式练习', file: 'assets/hw_image3_quotient_invariance_long_division.png', desc: '卷① B 部分第 3 题 原卷实拍' }],
    p4: [{ name: '卷① 小数除法竖式练习', file: 'assets/hw_image3_quotient_invariance_long_division.png', desc: '卷① B 部分第 4 题 原卷实拍' }],
    p5: [{ name: '卷① 小数除法竖式练习', file: 'assets/hw_image3_quotient_invariance_long_division.png', desc: '卷① C 部分第 1 题 原卷实拍' }],
    p6: [{ name: '卷① 小数除法竖式练习', file: 'assets/hw_image3_quotient_invariance_long_division.png', desc: '卷① C 部分第 2 题 原卷实拍' }],
    p7: [
      { name: '卷① 小数除法竖式练习', file: 'assets/hw_image3_quotient_invariance_long_division.png', desc: '卷① C 部分第 3 题 首次出现实拍' },
      { name: '卷④ Cambridge Primary 6', file: 'assets/hw_image4_highlighted_cambridge.jpg', desc: '卷④ 讲义再次出现（荧光笔标黄难点）' }
    ],
    p8: [{ name: '卷② 除数是小数及应用题', file: 'assets/hw_image1_decimal_division_word_prob.png', desc: '卷② Mr. Phillips 跑步原卷实拍' }],
    p9: [{ name: '卷③ 小数混合运算', file: 'assets/hw_image2_mixed_operations_truck.png', desc: '卷③ 运算顺序题原卷实拍' }],
    p10: [{ name: '卷③ 小数混合运算', file: 'assets/hw_image2_mixed_operations_truck.png', desc: '卷③ 乘法分配律隐藏×1 原卷实拍' }],
    p11: [{ name: '卷③ 小数混合运算', file: 'assets/hw_image2_mixed_operations_truck.png', desc: '卷③ 卡车行驶与单位换算原卷实拍' }],
    p12: [{ name: '卷④ Cambridge Primary 6', file: 'assets/hw_image4_highlighted_cambridge.jpg', desc: '卷④ Mandisa 橙子标黄题与 Will 的草稿笔迹' }]
  };

  function sheetToolsHtml(pid) {
    const list = PROBLEM_SHEET_MAP[pid];
    if (!list || !list.length) return '';
    return `
      <div class="ws-sheet-tools">
        <button class="wbtn ghost view-sheet-btn">📸 查看 Will 原始卷面作业（含红黄批注）</button>
      </div>
      <div class="sheet-modal hidden">
        ${list.map(s => `
          <div class="sheet-preview-wrap">
            <img class="sheet-preview-img" src="${s.file}" alt="${s.name}" loading="lazy">
            <div class="sheet-caption">📄 ${s.desc}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /* ---------- 路由 ---------- */
  const routes = [
    { re: /^#?\/?$/, fn: renderHome },
    { re: /^#\/kp\/(\w+)$/, fn: renderKP },
    { re: /^#\/p\/(\w+)$/, fn: renderProblem },
    { re: /^#\/glossary$/, fn: renderGlossary },
    { re: /^#\/practice$/, fn: renderPracticeAll },
    { re: /^#\/print$/, fn: () => renderPrint() }
  ];
  function navigate() {
    const h = location.hash || '#/';
    window.scrollTo(0, 0);
    for (const r of routes) {
      const m = h.match(r.re);
      if (m) { r.fn(m[1]); return; }
    }
    renderHome();
  }

  /* ---------- 通用渲染 ---------- */
  const app = document.getElementById('app');
  function setActiveNav(hash) {
    document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === hash));
  }
  function kpOf(id) { return DATA.kps[id]; }
  function problemCard(p, i) {
    const cured = problemCured(p);
    const doneN = p.practice.filter((_, j) => isDone(p.id + '#' + j)).length;
    return `<a class="pchip ${cured ? 'cured' : ''}" href="#/p/${p.id}">
      <span class="pchip-emoji">${p.emoji}</span>
      <span class="pchip-body"><b>${p.title}</b><small>${p.problem.en}</small></span>
      <span class="pchip-status">${cured ? '✅ 已治愈' : `${doneN}/${p.practice.length} ⭐`}</span>
    </a>`;
  }

  /* ---------- 首页 ---------- */
  function renderHome() {
    setActiveNav('#/');
    const total = totalStars();
    const done = stars();
    const cured = DATA.problems.filter(problemCured).length;
    app.innerHTML = `
      <section class="hero">
        <div class="hero-badge">${DATA.batch} · ${DATA.date}</div>
        <h1>🩺 Will 的数学错题医院</h1>
        <p class="hero-sub">Will's Math Mistake Clinic —— 把每一道错题，变成一个超能力！</p>
        <div class="hero-stats">
          <div class="stat"><b>${DATA.problems.length}</b><span>道错题病人</span></div>
          <div class="stat"><b>${DATA.kps ? Object.keys(DATA.kps).length : 4}</b><span>个治疗科室</span></div>
          <div class="stat"><b>${total}</b><span>道举一反三</span></div>
          <div class="stat"><b>${done}/${total}</b><span>⭐ 已获得</span></div>
          <div class="stat"><b>${cured}/${DATA.problems.length}</b><span>🏥 已治愈</span></div>
        </div>
      </section>

      <section class="card">
        <h2>🚀 怎么用（家长指南）</h2>
        <ol class="howto">
          <li><b>读病历</b>（5 分钟）：陪 Will 看一遍"深入浅出"和"易错点"，让他用自己的话讲一遍为什么错。</li>
          <li><b>玩实验室</b>：一起玩每道题的互动演示，边玩边问"为什么"。</li>
          <li><b>康复训练</b>：独立完成 3 道举一反三，全对拿 ⭐，三题全对 = 病人治愈 ✅。</li>
          <li><b>三天后复查</b>：回来把错题本身再口算一遍——间隔复习，记得最牢。</li>
        </ol>
        <p class="muted">本批错题来自 ${DATA.sheets.length} 张练习卷：${DATA.sheets.map(s => `${s.name}（${s.problems} 题）`).join('、')}。标记出的 ${DATA.problems.length} 道已全部整理，配套 ${DATA.problems.length * 3} 道举一反三。</p>
      </section>

      <h2 class="sec-title">🏥 治疗科室（${Object.keys(DATA.kps).length} 个知识点）</h2>
      <div class="kp-grid">
        ${Object.entries(DATA.kps).map(([id, k]) => {
          const st = kpStats(id);
          const ps = DATA.problems.filter(p => p.kp === id);
          return `<div class="kp-card ${k.color}">
            <div class="kp-head"><span class="kp-icon">${k.icon}</span>
              <div><h3>${k.name}</h3><small>${k.en}</small></div></div>
            <p class="kp-slogan">"${k.slogan}"</p>
            <div class="progress"><div style="width:${st.stTotal ? st.st / st.stTotal * 100 : 0}%"></div></div>
            <div class="kp-meta">${st.cured}/${st.total} 治愈 · ${st.st}/${st.stTotal} ⭐</div>
            <div class="pchips">${ps.map(problemCard).join('')}</div>
          </div>`;
        }).join('')}
      </div>

      <section class="card center">
        <a class="bigbtn" href="#/practice">✊ 进入康复训练场（${total} 道举一反三）</a>
        <a class="bigbtn ghost" href="#/glossary">📖 英语数学词汇卡</a>
      </section>`;
  }

  /* ---------- 科室页 ---------- */
  function renderKP(id) {
    const k = kpOf(id);
    if (!k) { renderHome(); return; }
    setActiveNav('#/kp/' + id);
    const ps = DATA.problems.filter(p => p.kp === id);
    app.innerHTML = `
      <a class="crumb" href="#/">← 返回医院大厅</a>
      <section class="kp-hero ${k.color}">
        <span class="kp-icon big">${k.icon}</span>
        <div><h1>${k.name}</h1><p>${k.en} · "${k.slogan}"</p></div>
      </section>
      <section class="card"><h2>🎯 先搞懂原理</h2>${k.intro}</section>
      ${k.recap ? `<section class="card"><h2>📘 ${k.recap.title}</h2>${k.recap.html}</section>` : ''}
      ${k.widget ? `<section class="card"><h2>🎮 ${k.widgetTitle || '互动实验室'}</h2>
        <div data-widget="${k.widget.type}" ${Object.entries(k.widget).filter(([key]) => key !== 'type').map(([key, v]) => `data-${key}="${v}"`).join(' ')}></div>
      </section>` : ''}
      <h2 class="sec-title">📋 本科室的错题病人（${ps.length} 位）</h2>
      <div class="plist">${ps.map(problemCard).join('')}</div>
      <section class="card">
        <h2>📖 本科室关键词</h2>
        <div class="vocab-chips">${(k.vocab || []).map(v => `<a href="#/glossary" class="vchip">${v}</a>`).join('')}</div>
        <p class="muted">完整双语词汇卡见 <a href="#/glossary">词汇卡页</a>。</p>
      </section>`;
    window.initWidgets(app);
  }

  /* ---------- 错题详情页 ---------- */
  function renderProblem(id) {
    const p = DATA.problems.find(x => x.id === id);
    if (!p) { renderHome(); return; }
    setActiveNav('#/p/' + id);
    const k = kpOf(p.kp);
    const idx = DATA.problems.indexOf(p);
    const prev = DATA.problems[idx - 1], next = DATA.problems[idx + 1];
    const doneN = p.practice.filter((_, i) => isDone(p.id + '#' + i)).length;
    const cured = problemCured(p);

    app.innerHTML = `
      <a class="crumb" href="#/kp/${p.kp}">← 返回「${k.name}」</a>
      <section class="prob-hero">
        <span class="prob-emoji">${p.emoji}</span>
        <div>
          <h1>${p.title} <small>${p.en}</small></h1>
          <div class="prob-meta">
            <span class="pill">${p.source}</span>
            <span class="pill kp">${k.icon} ${k.name}</span>
            <span class="pill ${cured ? 'good' : ''}">${cured ? '✅ 已治愈' : `⭐ ${doneN}/${p.practice.length}`}</span>
          </div>
        </div>
      </section>

      <section class="worksheet">
        <div class="ws-tag">原题 · Original Problem</div>
        <div class="ws-en">${p.problem.en}</div>
        <div class="ws-zh">${p.problem.zh}</div>
        <div class="ws-ans">✔ 卷面订正后的正确答案：<b>${p.correctAnswer}</b>——但我们要把坑彻底填平！</div>
        ${sheetToolsHtml(p.id)}
      </section>

      ${p.reencounter ? `<section class="card reencounter"><h2>🔁 再遇同款 · 高发考点</h2><p>${p.reencounter}</p></section>` : ''}

      <section class="card">
        <h2>📖 深入浅出 · 把原理讲透</h2>
        ${p.concept.map(c => `<p>${c}</p>`).join('')}
      </section>

      <section class="card">
        <h2>💊 正确解法 · 一步一步</h2>
        <ol class="steps">${p.steps.map(s => `<li>${s}</li>`).join('')}</ol>
        <div class="mnemon">🗣️ 口诀：${p.mnemon}</div>
      </section>

      <section class="card warn-card">
        <h2>⚠️ 易错点病历分析</h2>
        <p class="muted">这类题最经典的几种错法，每一个都是"大脑的小陷阱"——看清它，就不会再掉进去：</p>
        ${p.pitfalls.map((pf, i) => `
          <div class="pitfall">
            <div class="pf-wrong">❌ ${pf.wrong}</div>
            <div class="pf-why">🧠 为什么会这样：${pf.why}</div>
            <div class="pf-fix">🛡️ 防错疫苗：${pf.fix}</div>
          </div>`).join('')}
      </section>

      <section class="card">
        <h2>🎮 互动实验室</h2>
        <div data-widget="${p.widget.type}" data-a="${p.widget.a || ''}" data-b="${p.widget.b || ''}"
             data-shift="${p.widget.shift ?? ''}" data-distance="${p.widget.distance || ''}"
             data-hours="${p.widget.hours || ''}" data-factor="${p.widget.factor || ''}"
             data-item="${p.widget.item || ''}" data-hero="${p.widget.hero || ''}"
             data-parts='${p.widget.parts ? JSON.stringify(p.widget.parts) : ''}'
             data-packs='${p.widget.packs || ''}'></div>
        <p class="muted">${p.widgetNote}</p>
      </section>

      ${p.widget2 ? `<section class="card">
        <h2>🎮 互动实验室 2 · ${p.widget2Title || '再来一个演示'}</h2>
        <div data-widget="${p.widget2.type}" data-a="${p.widget2.a || ''}" data-b="${p.widget2.b || ''}"
             data-shift="${p.widget2.shift || ''}"></div>
        <p class="muted">${p.widget2Note || ''}</p>
      </section>` : ''}

      <section class="card">
        <h2>🏋️ 举一反三 · 康复训练（3 道）</h2>
        <p class="muted">全对 3 道，这位"病人"就治愈啦！做错了没关系——看提示，再来一次。</p>
        <div class="plist practice-list">${p.practice.map((it, i) => practiceCard(p, it, i)).join('')}</div>
      </section>

      <div class="pn-nav">
        ${prev ? `<a class="pn" href="#/p/${prev.id}">← ${prev.emoji} ${prev.title}</a>` : '<span></span>'}
        ${next ? `<a class="pn right" href="#/p/${next.id}">${next.emoji} ${next.title} →</a>` : '<span></span>'}
      </div>`;
    window.initWidgets(app);
    bindPractice(app);
    const sheetBtn = app.querySelector('.view-sheet-btn');
    if (sheetBtn) {
      sheetBtn.addEventListener('click', () => {
        const modal = app.querySelector('.sheet-modal');
        if (modal) modal.classList.toggle('hidden');
      });
    }
  }

  /* ---------- 练习卡片 ---------- */
  function practiceCard(p, it, i) {
    const key = p.id + '#' + i;
    const done = isDone(key);
    return `<div class="pcard ${done ? 'done' : ''}" data-key="${key}">
      <div class="pcard-head">
        <span class="pcard-num">第 ${i + 1} 题 ${done ? '✅' : ''}</span>
        <span class="pcard-status">${done ? '已拿到 ⭐' : '待挑战'}</span>
      </div>
      <div class="pcard-q">${it.q}</div>
      <div class="pcard-inputs">
        ${it.inputs.map((inp, j) => `
          <label class="pin"><span>${inp.label}</span>
            <input type="text" data-j="${j}" placeholder="?" ${done ? 'disabled' : ''}> ${inp.unit ? '<span class="unit">' + inp.unit + '</span>' : ''}
          </label>`).join('')}
        <button class="wbtn primary do-check" ${done ? 'disabled' : ''}>检查 ✓</button>
        <button class="wbtn ghost do-hint">💡 看提示</button>
        <button class="wbtn ghost do-sol">📄 看解析</button>
      </div>
      <div class="pcard-hint hidden">💡 ${it.hint}</div>
      <div class="pcard-fb"></div>
      <div class="pcard-sol hidden"><b>解析：</b>${it.solution}${it.trap ? `<div class="trap-note">⚠️ 易错警示：${it.trap}</div>` : ''}
        ${it.div ? `<div class="sol-ld"><button class="wbtn ghost show-ld">🎬 看这道题的竖式动画</button><div class="ld-holder"></div></div>` : ''}</div>
    </div>`;
  }

  function bindPractice(root) {
    root.querySelectorAll('.pcard').forEach(card => {
      const key = card.dataset.key;
      const [pid, idxStr] = key.split('#');
      const p = DATA.problems.find(x => x.id === pid);
      const it = p.practice[Number(idxStr)];
      const fb = card.querySelector('.pcard-fb');
      let wrongTries = 0;

      card.querySelector('.do-hint').addEventListener('click', () => card.querySelector('.pcard-hint').classList.toggle('hidden'));
      card.querySelector('.do-sol').addEventListener('click', () => card.querySelector('.pcard-sol').classList.toggle('hidden'));
      const ldBtn = card.querySelector('.show-ld');
      if (ldBtn) ldBtn.addEventListener('click', () => {
        const holder = card.querySelector('.ld-holder');
        if (holder.innerHTML) { holder.innerHTML = ''; return; }
        holder.innerHTML = `<div data-widget="long-division" data-a="${it.div.a}" data-b="${it.div.b}" data-shift="${it.div.shift}"></div>`;
        window.initWidgets(holder);
      });

      function check() {
        const inputs = [...card.querySelectorAll('input')];
        const allOk = it.inputs.every((inp, j) => {
          const val = inputs.find(x => Number(x.dataset.j) === j);
          return val && normAns(val.value) !== '' && normAns(val.value) === normAns(inp.answer);
        });
        if (allOk) {
          fb.innerHTML = `<span class="fb good">${pick(CHEERS)}</span>`;
          card.classList.add('done');
          markDone(key);
          inputs.forEach(v => v.disabled = true);
          card.querySelector('.do-check').disabled = true;
          card.querySelector('.pcard-status').textContent = '已拿到 ⭐';
          card.querySelector('.pcard-num').textContent = card.querySelector('.pcard-num').textContent.replace(/✅/g, '').trim() + ' ✅';
          updateNavStars();
          playCorrectSound();
          if (problemCured(p)) playStarSound();
        } else {
          wrongTries++;
          playWrongSound();
          const empty = inputs.some(v => normAns(v.value) === '');
          fb.innerHTML = `<span class="fb bad">${empty ? '把每个空都填上再检查哦～' : pick(OOPS)}</span>${wrongTries >= 2 ? ' <span class="muted">（可以点"看解析"了）</span>' : ''}`;
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 500);
        }
      }
      card.querySelector('.do-check').addEventListener('click', check);
      card.querySelectorAll('input').forEach(inp => inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); }));
    });
  }

  function updateNavStars() {
    const el = document.getElementById('navStars');
    if (el) el.textContent = `⭐ ${stars()}/${totalStars()}`;
  }

  function updateFooterInfo() {
    const el = document.getElementById('footerInfo');
    if (el) el.textContent = `为 Will 定制 · ${DATA.problems.length} 道错题（${Object.keys(DATA.kps).length} 个知识点）· 配套 ${totalStars()} 道举一反三 · 进度自动保存在本机`;
  }

  /* ---------- 词汇卡 ---------- */
  function renderGlossary() {
    setActiveNav('#/glossary');
    app.innerHTML = `
      <a class="crumb" href="#/">← 返回医院大厅</a>
      <section class="kp-hero purple"><span class="kp-icon big">📖</span>
        <div><h1>英语数学词汇卡</h1><p>Bilingual Math Glossary · 课堂听不懂的词，都在这里（点卡片翻面）</p></div></section>
      <div class="gloss-grid">
        ${DATA.glossary.map(g => `
          <div class="gcard" tabindex="0">
            <div class="gcard-inner">
              <div class="gface front"><div class="gterm">${g.t}</div><div class="gzh">${g.zh}</div><div class="gflip">点我翻面 ↻</div></div>
              <div class="gface back"><div class="gterm zh">${g.zh}</div><div class="gex">${g.ex}</div><div class="gflip">再翻回来 ↻</div></div>
            </div>
          </div>`).join('')}
      </div>`;
    app.querySelectorAll('.gcard').forEach(c => {
      const flip = () => {
        c.classList.toggle('flipped');
        playFlipSound();
      };
      c.addEventListener('click', flip);
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
    });
  }

  /* ---------- 全部练习 ---------- */
  function renderPracticeAll() {
    setActiveNav('#/practice');
    const total = totalStars();
    app.innerHTML = `
      <a class="crumb" href="#/">← 返回医院大厅</a>
      <section class="kp-hero orange"><span class="kp-icon big">✊</span>
        <div><h1>康复训练场</h1><p>${total} 道举一反三（${DATA.problems.length} 道错题 × 3）· 已完成 ${stars()}/${total} ⭐</p></div></section>
      ${DATA.kps ? Object.entries(DATA.kps).map(([kpid, k]) => {
        const ps = DATA.problems.filter(p => p.kp === kpid);
        return `<section class="card">
          <h2>${k.icon} ${k.name}</h2>
          ${ps.map(p => `
            <div class="practice-row">
              <a href="#/p/${p.id}" class="pr-src">${p.emoji} ${p.title}</a>
              <div class="pr-items">${p.practice.map((it, i) => {
                const done = isDone(p.id + '#' + i);
                return `<a class="pr-item ${done ? 'done' : ''}" href="#/p/${p.id}" title="${it.q.replace(/<[^>]+>/g, '')}">${done ? '⭐' : i + 1}</a>`;
              }).join('')}</div>
            </div>`).join('')}
        </section>`;
      }).join('') : ''}
      <p class="muted center">点题号跳到对应错题页的练习区。</p>`;
  }

  /* ---------- 打印 A4 练习卷 ---------- */
  function renderPrint(filterKp) {
    setActiveNav('#/print');
    const ps = filterKp ? DATA.problems.filter(p => p.kp === filterKp) : DATA.problems;
    app.innerHTML = `
      <a class="crumb" href="#/">← 返回医院大厅</a>
      <div class="print-actions">
        <button class="wbtn primary do-print">🖨️ 立即打印本卷 (Print A4)</button>
        <a class="wbtn ghost" href="#/">返回大厅</a>
      </div>
      <div class="print-filter">
        <button class="print-filter-btn ${!filterKp ? 'on' : ''}" data-kp="">全量打印 (${DATA.problems.length} 题)</button>
        <button class="print-filter-btn ${filterKp === 'kp2' ? 'on' : ''}" data-kp="kp2">✏️ 竖式长除法 (3 题)</button>
        <button class="print-filter-btn ${filterKp === 'kp3' ? 'on' : ''}" data-kp="kp3">🚗 行程与单位 (2 题)</button>
        <button class="print-filter-btn ${filterKp === 'kp4' ? 'on' : ''}" data-kp="kp4">🧩 混合运算与巧算 (2 题)</button>
        <button class="print-filter-btn ${filterKp === 'kp5' ? 'on' : ''}" data-kp="kp5">🛒 单价比较决策 (1 题)</button>
        <button class="print-filter-btn ${filterKp === 'kp1' ? 'on' : ''}" data-kp="kp1">🔢 搬家填空 (4 题)</button>
      </div>
      <p class="print-tip">💡 打印提示：请用 Chrome/Edge 浏览器，在打印预览中勾选「背景图形」，边距选「默认」或「自定义 10mm」。</p>

      <section class="print-hero">
        <h1>Will 的英语数学错题重练卷 · Grade 5</h1>
        <p class="print-tip">考点涵盖：小数除法长除法、商不变移位、行程单位换算、混合运算与单价决策</p>
        <table class="print-meta-table">
          <tr>
            <td class="print-meta-cell">学生姓名：Will (四年级)</td>
            <td class="print-meta-cell">训练日期：2026 年 ___ 月 ___ 日</td>
            <td class="print-meta-cell">卷面满分：100 分</td>
            <td class="print-meta-cell">实际得分：________</td>
          </tr>
        </table>
      </section>

      <div class="print-grid">
        ${ps.map((p, i) => `
          <div class="print-card">
            <div class="print-card-head">
              <b>第 ${i + 1} 题：${p.title}</b>
              <span class="print-tag">${DATA.kps[p.kp].name}</span>
            </div>
            <div class="print-q-en">${p.problem.en}</div>
            <div class="print-q-zh">${p.problem.zh}</div>
            
            <div class="print-work-grid">
              <div class="print-work-col">
                <span class="print-box-title">【竖式书写与规范列式区】（请写清小数点移位弧线与商对齐）</span>
                <div class="print-grid-canvas"></div>
              </div>
              <div class="print-work-col">
                <span class="print-box-title">【验算与思维草稿区】（真验算：商×原除数）</span>
                <div class="print-grid-canvas"></div>
              </div>
            </div>

            <div class="print-answer-line">
              <span>Final Answer (最终答案): ________________________________________</span>
            </div>

            <div class="print-checklist">
              <span class="print-check-item">防错自查打卡：</span>
              <span class="print-check-item">▢ 除数被除数移位数相同</span>
              <span class="print-check-item">▢ 商小数点对齐新位置</span>
              <span class="print-check-item">▢ 乘法笔算验算对上</span>
              <span class="print-check-item">▢ 答句单位完整</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    app.querySelector('.do-print').addEventListener('click', () => window.print());
    app.querySelectorAll('.print-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const kp = btn.dataset.kp;
        renderPrint(kp || null);
      });
    });
  }

  function initSoundBtn() {
    const btn = document.getElementById('soundToggle');
    if (!btn) return;
    const update = () => {
      const en = isSoundEnabled();
      btn.textContent = en ? '🔊' : '🔇';
      btn.classList.toggle('muted', !en);
    };
    update();
    btn.addEventListener('click', () => {
      setSoundEnabled(!isSoundEnabled());
      update();
      if (isSoundEnabled()) playCorrectSound();
    });
  }

  /* ---------- 启动 ---------- */
  window.addEventListener('hashchange', navigate);
  document.addEventListener('DOMContentLoaded', () => {
    navigate();
    updateNavStars();
    updateFooterInfo();
    initSoundBtn();
  });
})();
