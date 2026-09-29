/* =========================================================
 * 穷举测试套件（数据/逻辑/一致性层）—— node tests/exhaustive.node.js
 * 原则：测试域是有限可枚举的，因此逐条全测，不做抽样。
 * 覆盖：
 *   T1 schema：每条记录的每个字段
 *   T2 答案：与题面独立互验（填空解析题面 / 应用题独立 oracle 表）
 *   T3 竖式生成器：全部用例 × 内部不变量 × 验算
 *   T4 文案算式：全量递归提取 = / ≈ / < / > 逐条验算（含 HTML 反解码）
 *   T5 交叉引用闭合 + 陈旧词扫描 + CSS 类闭合
 *   T6 人工签核清单：机器不可判定项全量枚举（倍数关系、单位方程）
 * ======================================================= */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

/* ---------- 环境装载 ---------- */
global.window = {};
require(path.join(ROOT, 'js/division.js'));
const LD = global.window.LongDiv;
for (const f of ['js/data.js', 'js/data2.js', 'js/data3.js', 'js/data4.js']) {
  new Function('window', fs.readFileSync(path.join(ROOT, f), 'utf8'))(global.window);
}
const DATA = global.window.WILL_DATA;
new Function('window', 'globalThis', fs.readFileSync(path.join(ROOT, 'js/widgets.js'), 'utf8'))(global.window, globalThis);
const WIDGETS = global.window.WIDGETS;

/* ---------- 计数与断言 ---------- */
let pass = 0, fail = 0; const failures = []; const audit = [];
function ok(cond, msg) { if (cond) pass++; else { fail++; failures.push(msg); } }

/* ---------- 工具 ---------- */
function walkStrings(obj, cb, pathStr = '') {
  if (typeof obj === 'string') { cb(obj, pathStr); return; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => walkStrings(v, cb, `${pathStr}[${i}]`)); return; }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'img') continue;               // 文件名不参与文案扫描
      walkStrings(v, cb, pathStr ? `${pathStr}.${k}` : k);
    }
  }
}
function dec(s) { s = String(s); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; }
function val(s) { return Number(String(s).replace('.', '')) / Math.pow(10, dec(s)); }
function normalizeExpr(e) {
  return String(e).replace(/[￥$元]/g, '').replace(/[×x]/g, '*').replace(/[÷/]/g, '/').replace(/[−－–]/g, '-').replace(/（/g, '(').replace(/）/g, ')').replace(/\s+/g, '');
}
function evalExpr(e) {
  const n = normalizeExpr(e);
  if (!n || !/\d/.test(n)) return null;
  if (!/^[\d+\-*/().]+$/.test(n)) return null;   // 含字母/未知量 → 不可机判
  try { const v = Function('"use strict";return (' + n + ')')(); return isFinite(v) ? v : null; }
  catch (err) { return null; }
}
function exprSuffix(s) {                          // 最长可用字符后缀（表达式须贴着比较符）
  let i = s.length;
  while (i > 0 && /[0-9.+\-−×x÷*/（）()\s]/.test(s[i - 1])) i--;
  const e = s.slice(i).replace(/[￥$元]/g, '').trim();
  return /\d/.test(e) ? e : null;
}
function exprPrefix(s) {
  let i = 0;
  while (i < s.length && /[0-9.+\-−×x÷*/（）()\s]/.test(s[i])) i++;
  const e = s.slice(0, i).replace(/[￥$元]/g, '').trim();
  return /\d/.test(e) ? e : null;
}
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* =========================================================
 * T1 schema：每条记录的每个字段
 * ======================================================= */
const EXPECTED_IDS = ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12'];
const KP_IDS = ['kp1','kp2','kp3','kp4','kp5'];
const WIDGET_PARAMS = {
  'decimal-shift': ['a', 'b'],
  'compare-line': ['base'],
  'long-division': ['a', 'b', 'shift'],
  'speed-lab': ['distance', 'hours'],
  'clock-convert': ['hours'],
  'blocks': ['factor', 'parts'],
  'order-machine': [],
  'best-buy': ['packs', 'item']
};
ok(DATA.problems.length === 12, `错题数应为 12，实为 ${DATA.problems.length}`);
ok(JSON.stringify(DATA.problems.map(p => p.id).sort()) === JSON.stringify([...EXPECTED_IDS].sort()), '错题 id 集合不符');
for (const kpId of KP_IDS) ok(!!DATA.kps[kpId], `缺少科室 ${kpId}`);
for (const [id, k] of Object.entries(DATA.kps)) {
  for (const f of ['name', 'en', 'icon', 'color', 'slogan', 'intro']) ok(k[f] !== undefined && k[f] !== '', `科室 ${id} 缺字段 ${f}`);
  ok(Array.isArray(k.vocab) && k.vocab.length > 0, `科室 ${id} 缺 vocab`);
}
const glossaryTerms = new Set(DATA.glossary.map(g => g.t));
ok(DATA.glossary.length === new Set(DATA.glossary.map(g => g.t)).size, '词汇卡有重复词条');
for (const g of DATA.glossary) for (const f of ['t', 'zh', 'ex']) ok(g[f], `词条缺 ${f}: ${g.t}`);
for (const [id, k] of Object.entries(DATA.kps)) for (const v of k.vocab || []) ok(glossaryTerms.has(v), `科室 ${id} 引用了不存在的词条 ${v}`);
ok(DATA.sheets.reduce((n, s) => n + s.problems, 0) === DATA.problems.length, '各卷题数之和 ≠ 错题总数');

const usedWidgetTypes = new Set();
for (const p of DATA.problems) {
  for (const f of ['id','kp','emoji','title','en','source','problem','correctAnswer','concept','steps','pitfalls','mnemon','widget','widgetNote','practice'])
    ok(p[f] !== undefined && p[f] !== '', `错题 ${p.id} 缺字段 ${f}`);
  ok(!!DATA.kps[p.kp], `错题 ${p.id} 指向不存在的科室 ${p.kp}`);
  ok(p.problem.en && p.problem.zh, `错题 ${p.id} 原题需中英双语`);
  ok(p.concept.length >= 2 && p.steps.length >= 3, `错题 ${p.id} 讲解/步骤过少`);
  ok(p.pitfalls.length === 3, `错题 ${p.id} 易错点应为 3 条，实为 ${p.pitfalls.length}`);
  for (const pf of p.pitfalls) for (const f of ['wrong', 'why', 'fix']) ok(pf[f], `错题 ${p.id} 易错点缺 ${f}`);
  ok(p.practice.length === 3, `错题 ${p.id} 举一反三应为 3 道，实为 ${p.practice.length}`);
  p.practice.forEach((it, i) => {
    for (const f of ['q', 'hint', 'solution', 'inputs']) ok(it[f], `错题 ${p.id} 练习${i + 1} 缺 ${f}`);
    ok(it.inputs.length >= 1 && it.inputs.length <= 2, `错题 ${p.id} 练习${i + 1} 输入框数异常`);
    for (const inp of it.inputs) ok(inp.label && inp.answer !== undefined && inp.answer !== '', `错题 ${p.id} 练习${i + 1} 输入框缺 label/answer`);
    ok(!it.div || (it.div.a && it.div.b && it.div.shift !== undefined), `错题 ${p.id} 练习${i + 1} div 参数不完整`);
  });
  usedWidgetTypes.add(p.widget.type);
  for (const key of WIDGET_PARAMS[p.widget.type] || []) ok(p.widget[key] !== undefined, `错题 ${p.id} widget 缺参数 ${key}`);
  if (p.widget2) {
    usedWidgetTypes.add(p.widget2.type);
    for (const key of WIDGET_PARAMS[p.widget2.type] || []) ok(p.widget2[key] !== undefined, `错题 ${p.id} widget2 缺参数 ${key}`);
  }
}
for (const t of usedWidgetTypes) ok(!!WIDGETS[t], `数据引用了未注册的组件 ${t}`);

/* =========================================================
 * T2 答案：与题面独立互验
 * ======================================================= */
// 2a. 填空题：解析题面 a ÷ b = ( ) ÷ c，验证 val(a)/val(b) === val(ans)/val(c)
const FILL_RE = /([0-9.]+)\s*÷\s*([0-9.]+)\s*=\s*[（(][　\s]*[)）]\s*÷\s*([0-9.]+)/;
for (const p of DATA.problems) p.practice.forEach((it, i) => {
  const m = it.q.match(FILL_RE);
  if (m) {
    const [, a, b, c] = m;
    const lhs = val(a) / val(b), rhs = val(it.inputs[0].answer) / val(c);
    ok(near(lhs, rhs, 1e-9), `${p.id} 练习${i + 1} 填空不成立: ${a}÷${b}=${lhs} vs ${it.inputs[0].answer}÷${c}=${rhs}`);
  }
});
// 2b. 竖式题：解析题面 a ÷ b = ?，验证 商 ≈ a÷b
const DIV_RE = /([0-9.]+)\s*÷\s*([0-9.]+)\s*=\s*\?/;
for (const p of DATA.problems) p.practice.forEach((it, i) => {
  const m = it.q.match(DIV_RE);
  if (m) {
    const lhs = val(m[1]) / val(m[2]);
    ok(near(parseFloat(it.inputs[0].answer), lhs, 1e-9), `${p.id} 练习${i + 1} 商错误: ${m[1]}÷${m[2]}=${lhs} vs ${it.inputs[0].answer}`);
  }
});
// 2c. 应用题/混合运算：独立 oracle 表（表达式由原始题面手工导出，与 data 文件无关）
const ORACLE = {
  p8: [['21.6/1.2'], ['247.5/4.5'], ['141.6/5.9']],
  p9: [['3.6/1.5+2.6'], ['3.5/0.7+1.5'], ['4.2/0.6*0.5-1.7']],
  p10: [['9.6*(4.5+5.5-1)'], ['0.85*(7.6+2.4-1)'], ['6.7*(3.8+6.2+1)']],
  p11: [['16.8/(0.7*60)', '(0.7*60)/16.8'], ['27/(0.9*60)', '(0.9*60)/27'], ['18/(1.5*60)', '(1.5*60)/18']],
  p12: [['1.75/5', '2.88/8'], ['3.60*15'], ['8.10/6', '5.60/4']]
};
for (const [pid, rows] of Object.entries(ORACLE)) {
  const p = DATA.problems.find(x => x.id === pid);
  rows.forEach((exprs, i) => {
    p.practice[i].inputs.forEach((inp, j) => {
      const expect = evalExpr(exprs[j]);
      ok(expect !== null && near(parseFloat(inp.answer), expect, 1e-9), `${pid} 练习${i + 1} 输入${j + 1} 答案 ${inp.answer} ≠ oracle ${exprs[j]}=${expect}`);
    });
    ok(exprs.length === p.practice[i].inputs.length, `${pid} 练习${i + 1} oracle 与输入框数不一致`);
  });
}
// 2d. correctAnswer 抽查：含数值的与练习/题面一致
for (const p of DATA.problems) for (const m of p.correctAnswer.matchAll(/([0-9]+\.[0-9]+)/g)) {
  const num = m[1];
  const appears = p.practice.some(it => it.inputs.some(inp => near(parseFloat(inp.answer), parseFloat(num), 1e-9)));
  ok(appears || p.steps.concat(p.concept).some(s => String(s).includes(num)), `${p.id} correctAnswer 中的 ${num} 在讲解/练习中无出处`);
}

/* =========================================================
 * T3 竖式生成器：全部用例 × 内部不变量
 * ======================================================= */
let ldCases = 0;
const ldUsages = [];
for (const p of DATA.problems) {
  if (p.widget.type === 'long-division') ldUsages.push([p.id, p.widget]);
  if (p.widget2 && p.widget2.type === 'long-division') ldUsages.push([p.id + '#w2', p.widget2]);
  p.practice.forEach((it, i) => { if (it.div) ldUsages.push([`${p.id}#${i + 1}`, it.div]); });
}
for (const [tag, u] of ldUsages) {
  ldCases++;
  const r = LD.build(u.a, u.b, u.shift);
  const lhs = val(u.a) / val(u.b);
  ok(near(parseFloat(r.quotient), lhs, 1e-9), `[${tag}] 竖式商错误: ${r.quotient} ≠ ${lhs}`);
  ok(LD.buildCheck(r.quotient, u.b, u.a).ok, `[${tag}] 验算失败`);
  ok(r.events.every(e => e.q * r.divisor === e.product), `[${tag}] 内部不变量 product=q×divisor 被破坏`);
  ok(r.events.every(e => e.value === e.product + e.rem), `[${tag}] 内部不变量 value=product+rem 被破坏`);
  ok(r.narration.length === r.events.length && r.narration.every(s => s && s.length > 5), `[${tag}] 旁白缺失`);
  ok(r.rows.some(x => x.kind === 'quotient') && r.rows.some(x => x.kind === 'main'), `[${tag}] 竖式行缺失`);
}

/* =========================================================
 * T4 文案算式全量扫描：每个字符串里的 = ≈ < > 逐条验算
 * ======================================================= */
let eqChecked = 0, eqSkipped = 0, cmpChecked = 0;
const scanTargets = [];
walkStrings(DATA, (s, where) => scanTargets.push([s, 'data:' + where]));
walkStrings(DATA.kps, () => {});                    // 已含于 DATA
{
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  readme.split('\n').forEach((line, i) => scanTargets.push([line, `README:${i + 1}`]));
}
for (const [raw, where] of scanTargets) {
  const s = raw.replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  // ---- 等式链（= 与 ≈）：按操作符位置切分，支持 A = B = C 连等 ----
  const ops = [...s.matchAll(/(=|≈)/g)];
  for (let k = 0; k < ops.length; k++) {
    const op = ops[k][1], at = ops[k].index;
    const leftStr = s.slice(k === 0 ? 0 : ops[k - 1].index + 1, at);
    const rightStr = s.slice(at + 1, k + 1 < ops.length ? ops[k + 1].index : s.length);
    const L = exprSuffix(leftStr), R = exprPrefix(rightStr);
    if (!L || !R) continue;
    const lv = evalExpr(L), rv = evalExpr(R);
    if (lv === null || rv === null) { eqSkipped++; continue; }
    let tol;
    if (op === '≈') {
      tol = 0.5 * Math.pow(10, -Math.min(dec(L), dec(R))) + 1e-12;   // 按“显示精度”给估算容差
    } else {
      tol = Math.max(1e-6, 1e-9 * Math.max(1, Math.abs(lv), Math.abs(rv)));
      // 竖式“商取整”记法：整数÷整数=整数商，且上下文带“余 X”——按 floor 语义判
      const nL = normalizeExpr(L);
      const intDiv = nL.match(/^(\d+)\/(\d+)$/);
      if (!near(lv, rv, tol) && intDiv && Number.isInteger(rv)
          && Math.floor(Number(intDiv[1]) / Number(intDiv[2])) === rv
          && /余/.test(s.slice(Math.max(0, at - 40), at + 40))) {
        eqChecked++; continue;
      }
    }
    ok(near(lv, rv, tol), `[${where}] 算式错误: ${L} ${op} ${R}（${lv} vs ${rv}）`);
    eqChecked++;
  }
  // ---- 不等式（< >，两侧须为纯数值表达式）----
  for (const m of s.matchAll(/([0-9.$￥¥元][0-9.$￥¥元\s]*)\s*([<>≤≥])\s*([0-9.$￥¥元][0-9.$￥¥元\s]*)/g)) {
    const lv = evalExpr(m[1]), rv = evalExpr(m[3]);
    if (lv === null || rv === null) { eqSkipped++; continue; }
    const [a, b] = [lv, rv];
    const hold = m[2] === '<' ? a < b : m[2] === '>' ? a > b : m[2] === '≤' ? a <= b : a >= b;
    ok(hold, `[${where}] 不等式错误: ${m[1]} ${m[2]} ${m[3]}（${a} vs ${b}）`);
    cmpChecked++;
  }
  // ---- 机器不可判定 → 全量枚举人工签核 ----
  for (const m of s.matchAll(/的\s*([0-9.]+|十|两|半)\s*倍/g)) audit.push(`[${where}] 倍数关系:「…${m[0]}…」`);
  for (const m of s.matchAll(/[0-9.]+\s*(?:h|min|km|L)\s*(?:=|≈)/g)) audit.push(`[${where}] 单位方程:「…${m[0]}…」`);
}

/* =========================================================
 * T5 交叉引用闭合 + 陈旧词扫描 + CSS 类闭合
 * ======================================================= */
// 5a. 陈旧词：index.html 与 js/*.js 不允许出现历史硬编码计数
const STALE = [/第一批错题\s*\d+/, /\b11\s*道/, /\b33\s*道/, /4\s*个知识点/, /\b27\s*组/];
for (const f of ['index.html', 'js/data.js', 'js/data2.js', 'js/data3.js', 'js/data4.js', 'js/app.js', 'js/widgets.js', 'js/division.js']) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  STALE.forEach(re => ok(!re.test(src), `${f} 出现陈旧硬编码: ${re}`));
}
// 5b. index.html 导航指向的科室都存在；脚本与文件一一对应
{
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const m of html.matchAll(/#\/kp\/(kp\d+)/g)) ok(!!DATA.kps[m[1]], `导航指向不存在的科室 ${m[1]}`);
  const scripts = [...html.matchAll(/src="(js\/[^"]+)"/g)].map(m => m[1]);
  for (const s of scripts) ok(fs.existsSync(path.join(ROOT, s)), `index.html 引用了不存在的 ${s}`);
  ok(!html.includes('33 道') && !html.includes('11 道'), 'index.html 页脚仍有旧计数');
  ok(html.includes('id="footerInfo"'), 'index.html 缺少动态页脚');
}
// 5c. CSS 类闭合（静态层）：纯静态 class 属性与 classList 字面量必须在 style.css 定义，
//     或为 JS 选择器钩子 / 结构标记类；模板拼接的动态类由浏览器穷举扫描对照真实 DOM 兜底
{
  const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
  const defined = new Set([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(m => m[1]));
  const used = new Set(); const hooks = new Set();
  const STATIC_VAL = /^[a-zA-Z][\w\s-]*$/;                       // 纯静态属性值（无 ${}、引号、+）
  const scan = (src) => {
    for (const m of src.matchAll(/class="([^"]*)"/g)) {
      if (!STATIC_VAL.test(m[1])) continue;                       // 动态拼接 → 浏览器层负责
      m[1].split(/\s+/).forEach(c => c && used.add(c));
    }
    for (const m of src.matchAll(/classList\.(?:add|toggle|remove)\(\s*['"]([a-zA-Z][\w-]*)['"]/g)) used.add(m[1]);
    for (const m of src.matchAll(/querySelector(?:All)?\(\s*[`'"]([^`'"]*)[`'"]/g))
      for (const t of m[1].matchAll(/\.([a-zA-Z][\w-]*)/g)) hooks.add(t[1]);
  };
  scan(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));
  for (const f of ['js/app.js', 'js/widgets.js']) scan(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const STRUCTURAL = new Set(['s0', 's1', 's2', 'merged', 'front', 'practice-list', 'dsh', 'cmp', 'slab', 'blk', 'ord', 'bb']); // 动态编号/纯标记类
  for (const c of used) ok(defined.has(c) || hooks.has(c) || STRUCTURAL.has(c), `类 .${c} 被使用但既无样式也非选择器钩子`);
}

/* =========================================================
 * T7 功能扩展域：原卷映射 / 打印模式（新功能加入即扩展枚举）
 * ======================================================= */
{
  const appSrc = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
  // 7a. 资产闭合：原卷映射引用的图片必须存在
  const mapMatch = appSrc.match(/PROBLEM_SHEET_MAP = \{([\s\S]*?)\n  \};/);
  ok(!!mapMatch, 'app.js 缺少 PROBLEM_SHEET_MAP');
  if (mapMatch) {
    const files = [...new Set([...mapMatch[1].matchAll(/file:\s*'([^']+)'/g)].map(m => m[1]))];
    ok(files.length >= 3, `原卷图数量异常: ${files.length}`);
    for (const f of files) ok(fs.existsSync(path.join(ROOT, f)), `原卷图不存在: ${f}`);
    // 7b. 卷号交叉引用：映射条目的卷号必须与 p.source 的卷号一致
    const entries = [...mapMatch[1].matchAll(/(p\d+):\s*\[([\s\S]*?)\]/g)];
    ok(entries.length === EXPECTED_IDS.length, `映射覆盖题数 ${entries.length} ≠ 错题数 ${EXPECTED_IDS.length}`);
    for (const [, pid, body] of entries) {
      const p = DATA.problems.find(x => x.id === pid);
      ok(!!p, `映射包含未知题目 ${pid}`);
      if (!p) continue;
      const srcSheet = (p.source.match(/卷[①②③④]/) || [])[0];
      const descSheets = [...body.matchAll(/desc:\s*'[^']*?(卷[①②③④])/g)].map(m => m[1]);
      ok(descSheets.length > 0, `${pid} 映射条目缺卷号描述`);
      ok(descSheets[0] === srcSheet, `${pid} 卷号矛盾: source=${srcSheet} 但映射首条=${descSheets[0]}`);
    }
  }
  // 7c. 打印页筛选计数闭合：按钮必须"由 DATA.kps 动态生成"或"逐一静态列出且计数吻合"
  const filterBtns = [...appSrc.matchAll(/data-kp="([^"]*)"[^>]*>[^<]*\((\d+|\$\{[^}]+\})\s*题\)/g)];
  const dynamicGen = /print-filter[\s\S]{0,400}Object\.entries\(DATA\.kps\)/.test(appSrc);
  ok(dynamicGen || filterBtns.length === KP_IDS.length + 1,
    `打印筛选按钮既非动态生成也无静态全列（静态匹配 ${filterBtns.length}/${KP_IDS.length + 1}）`);
  for (const [, kp, n] of filterBtns) {
    if (/^\d+$/.test(n)) {
      const expect = kp ? DATA.problems.filter(p => p.kp === kp).length : DATA.problems.length;
      ok(Number(n) === expect, `打印筛选 "${kp || '全量'} (${n} 题)" 与实际 ${expect} 题不符（硬编码计数）`);
    }
    if (kp && !kp.startsWith('${')) ok(!!DATA.kps[kp], `打印筛选 data-kp="${kp}" 不是有效科室`);
  }
  // 7d. 规格常量：原始需求为五年级学生（外部 spec 写入断言防回归）
  ok(!/四年级/.test(appSrc), '打印卷出现 "四年级"，与原始需求（五年级）矛盾');
}

/* =========================================================
 * T8 生态存活、反向幽灵普查与宣称自洽疫苗 (L5 / L8 闭环)
 * ======================================================= */
{
  // 8a. 反向幽灵普查：DATA.sheets[].img 必须全部真实存在且非空
  for (const s of DATA.sheets) {
    ok(!!s.img, `试卷缺少 img 字段: ${s.name}`);
    ok(fs.existsSync(path.join(ROOT, s.img)), `试卷图片不存在: ${s.img}`);
  }

  // 8b. SEO 基础设施三件套
  ok(fs.existsSync(path.join(ROOT, 'robots.txt')), '缺少 robots.txt');
  const robots = fs.readFileSync(path.join(ROOT, 'robots.txt'), 'utf8');
  ok(robots.includes('Allow: /'), 'robots.txt 必须允许爬取');
  ok(fs.existsSync(path.join(ROOT, 'sitemap.xml')), '缺少 sitemap.xml');
  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  ok(sitemap.includes('https://will.math3.cn/'), 'sitemap.xml 必须收录主页');
  for (const p of DATA.problems) {
    ok(sitemap.includes(`#/p/${p.id}`), `sitemap.xml 缺少题目 ${p.id}`);
  }
  const htmlSrc = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  ok(htmlSrc.includes('<meta name="description"'), 'index.html 缺少 meta description');

  // 8c. 逆向路由 404 保护
  const appCode = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
  ok(appCode.includes('renderNotFound'), 'app.js 必须实现 renderNotFound');
  ok(!appCode.includes('if (!k) { renderHome();'), 'renderKP 不得静默回退 renderHome');
  ok(!appCode.includes('if (!p) { renderHome();'), 'renderProblem 不得静默回退 renderHome');

  // 8d. README 演示组件清单完整性 (8 个组件全收录)
  const readmeSrc = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  ok(readmeSrc.includes('compare-line') || readmeSrc.includes('除数与商的大小数线'), 'README 必须收录全部 8 个组件（含 compare-line）');

  // 8e. L8 营销语封顶 / README 声明对账 (律五：数字不经人手)
  const readmeAssertMatch = readmeSrc.match(/（(\d+)\s*条断言/);
  ok(!!readmeAssertMatch, 'README 必须包含格式为"（N 条断言"的测试声明');
  if (readmeAssertMatch) {
    const claimed = parseInt(readmeAssertMatch[1], 10);
    // 注意：当前检查是倒数第 1 个断言，pass+1 即为最终总通过数
    ok(claimed === pass + 1, `README 声称断言数 (${claimed}) 与实际测试输出 (${pass + 1}) 必须完全一致`);
  }
}

/* =========================================================
 * 报告
 * ======================================================= */
const report = {
  科室: Object.keys(DATA.kps).length,
  错题: DATA.problems.length,
  练习: DATA.problems.reduce((n, p) => n + p.practice.length, 0),
  词汇: DATA.glossary.length,
  竖式用例: ldCases,
  文案串: scanTargets.length,
  等式验算: eqChecked,
  不等式验算: cmpChecked,
  不可机判跳过: eqSkipped,
  人工签核项: audit.length
};
console.log('========== 穷举测试报告 ==========');
console.log(JSON.stringify(report, null, 2));
console.log(`断言通过 ${pass}，失败 ${fail}`);
if (audit.length) {
  console.log('---- 人工签核清单（全量枚举，非抽样） ----');
  audit.forEach(a => console.log('  ' + a));
}
if (fail) { console.log('---- 失败明细 ----'); failures.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
console.log('ALL PASS');
