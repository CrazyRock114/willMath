/* =========================================================
 * LongDiv —— 小数除法长除法步骤生成器（纯函数，可被 node 测试）
 * 供竖式步进动画与验算演示使用
 * ======================================================= */
(function (global) {
  'use strict';

  /* 把小数字符串的小数点右移 n 位（位数不够补0）
   * shiftDecimalStr('10.2', 2) -> '1020'
   * shiftDecimalStr('475', 2)  -> '47500'
   * shiftDecimalStr('0.9', 2)  -> '90'
   * shiftDecimalStr('3.658',1) -> '36.58'
   * shiftDecimalStr('0.04',-2) -> '0.0004'（负数=左移）
   */
  function shiftDecimalStr(numStr, n) {
    let s = String(numStr).trim().replace(/\s+/g, '');
    if (!s) return '0';
    let neg = false;
    if (s.startsWith('-')) { neg = true; s = s.slice(1); }
    let dot = s.indexOf('.');
    if (dot === -1) {
      if (n <= 0) {
        // 整数左移：截断（本项目中不会用到负移整数）
        if (n < 0) s = s.slice(0, Math.max(0, s.length + n)) || '0';
        return (neg ? '-' : '') + s;
      }
      return (neg ? '-' : '') + s + '0'.repeat(n);
    }
    let intPart = s.slice(0, dot);
    let frac = s.slice(dot + 1);
    if (n >= 0) {
      if (n >= frac.length) {
        s = intPart + frac + '0'.repeat(n - frac.length);
      } else {
        s = intPart + frac.slice(0, n) + '.' + frac.slice(n);
      }
    } else {
      const k = -n;
      if (k >= intPart.length) {
        s = '0.' + '0'.repeat(k - intPart.length) + intPart + frac;
      } else {
        s = intPart.slice(0, intPart.length - k) + '.' + intPart.slice(intPart.length - k) + frac;
      }
      // 去掉可能产生的尾随 0
      if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
    }
    return (neg ? '-' : '') + stripLead(s);
  }

  /* 去掉整数部分多余的前导 0："024"→"24"，"08.64"→"8.64"，"0.5"→"0.5" */
  function stripLead(s) {
    if (s.startsWith('-')) return '-' + stripLead(s.slice(1));
    const dot = s.indexOf('.');
    const intPart = dot === -1 ? s : s.slice(0, dot);
    const rest = dot === -1 ? '' : s.slice(dot);
    return (intPart.replace(/^0+(?=\d)/, '') || '0') + rest;
  }

  function decimalPlaces(s) {
    s = String(s);
    const i = s.indexOf('.');
    return i === -1 ? 0 : s.length - i - 1;
  }

  /* 组装长除法全部数据
   * a     原被除数，如 '10.2'
   * b     原除数，如 '0.24'
   * shift 两边小数点同时右移的位数
   */
  function build(a, b, shift) {
    const dividendStr = shiftDecimalStr(a, shift);   // 移位后的被除数（竖式里写的）
    const divisorStr = shiftDecimalStr(b, shift);    // 移位后的除数（必为整数）
    const divisor = parseInt(divisorStr, 10);
    if (!divisor) throw new Error('divisor is 0');

    // ---- 列布局：每个字符占一列；若最后需要补小数点则插入一列 ----
    const chars = dividendStr.split('');             // 例如 ['1','0','2','0'] 或 ['3','9','.','9']
    const origDecimalCol = chars.indexOf('.');       // 原有小数点所在列（可能 -1）
    let needInsertedDot = false;                     // 是否需要“插入”小数点列（被除数无小数点但商要变小数）
    const events = [];
    let rem = 0;
    let appended = 0;
    let idx = 0;                                     // 当前处理的列号（相对于 chars + 插入列）
    const MAX_APPEND = 8;

    // 先同步跑一遍算法收集事件（列号先按“无插入点”计，若最后发现需要插入点再整体右移）
    const raw = [];
    while (true) {
      let digit, isAppended = false, col = idx;
      if (idx < chars.length) {
        const ch = chars[idx];
        if (ch === '.') { idx++; continue; }
        digit = parseInt(ch, 10);
      } else {
        if (rem === 0) break;
        if (appended >= MAX_APPEND) break;
        isAppended = true;
        appended++;
        digit = 0;
        col = chars.length + appended - 1;           // 补的0排在最后（未计插入点）
      }
      const value = rem * 10 + digit;
      const q = Math.floor(value / divisor);
      const product = q * divisor;
      const newRem = value - product;
      raw.push({ col, digit, isAppended, value, q, product, rem: newRem });
      rem = newRem;
      idx++;
      if (raw.length > 60) break;                    // 安全阀
    }

    // 是否需要插入小数点列：被除数原本无小数点，但商产生了小数（发生过补0）
    const quotientHasDecimal = appended > 0;
    needInsertedDot = quotientHasDecimal && origDecimalCol === -1;
    // 插入点位于“最后一个原字符列”之后
    const dotCol = needInsertedDot ? chars.length : origDecimalCol;
    // 列总数
    const totalCols = chars.length + appended + (needInsertedDot ? 1 : 0);
    // 若被除数有小数点，补0直接排在最后，无需再插点

    // 给事件标 display（商数字是否写出来）与 decimalBefore
    let seenNonZero = false;
    let firstAppendedDone = false;
    const evts = raw.map((e, i) => {
      let col = e.col;
      if (needInsertedDot && e.isAppended) col = e.col + 1; // 插入点后补0列整体右移一位
      const isLeadingZero = e.q === 0 && !seenNonZero;
      if (!isLeadingZero) seenNonZero = true;
      const decimalBefore = needInsertedDot
        ? (e.isAppended && !firstAppendedDone)
        : false;
      if (e.isAppended && !firstAppendedDone) firstAppendedDone = true;
      return Object.assign({}, e, {
        col,
        display: !isLeadingZero,
        decimalBefore,
        appended: e.isAppended
      });
    });
    // 修正：若被除数原本有小数点（如 39.9），商的小数点天然在 dotCol，不需要 decimalBefore 标记
    // 若被除数无小数点且发生过补0（如 1020），小数点插在补0前 → decimalBefore 已标在第一个补0事件上

    // 商字符串：按列直接判断（col 与 dotCol 比较）
    let intDigits = '', fracDigits = '';
    evts.forEach(e => {
      if (!e.display) return;
      if (dotCol !== -1 && e.col > dotCol) fracDigits += String(e.q);
      else if (dotCol !== -1 && e.col === dotCol) {
        // 恰好在小数点列上的商位：属于小数部分前的最后一位还是小数点本身？
        // 竖式里小数点占一列，数字不会与小数点同列——但 62.1÷3 中补0列=dotCol？不会发生
        // 此情形仅在需要插点时出现，而插点列上无商数字。原小数点列上也不会有商数字（数字事件跳过了'.'）
        // 所以这里理论上不会走到；保险起见算整数部分
        intDigits += String(e.q);
      } else intDigits += String(e.q);
    });
    intDigits = intDigits.replace(/^0+(?=\d)/, '');        // 去前导0
    if (intDigits === '' ) intDigits = fracDigits ? '0' : (intDigits || '0');
    let quotient = intDigits;
    if (dotCol !== -1 && fracDigits) quotient += '.' + fracDigits;
    // 若被除数带小数点但商只算到小数点前（不会发生于本题库），保持原样

    // ---- 生成叙述 ----
    const narration = evts.map((e, i) => {
      let t = '';
      if (e.display === false) {
        t = `${e.value} ÷ ${divisor} 还不够除，这一位先商 0（不用写出来），把下一位也一起带上。`;
      } else {
        if (e.decimalBefore) {
          t += `商的小数点点在这里（和被除数的小数点对齐；被除数是整数时，点在末尾）！`;
        }
        if (e.appended) {
          t += `还余 ${raw[i - 1] ? raw[i - 1].rem : 0} 没除完 → 在末尾补 0 继续除：${e.value} ÷ ${divisor}，商 ${e.q}，${e.q}×${divisor}=${e.product}${e.rem ? '，余 ' + e.rem : '，正好除尽！'}`;
        } else {
          t += `落下数字 ${e.digit}，现在算 ${e.value} ÷ ${divisor}：商 ${e.q}，${e.q}×${divisor}=${e.product}${e.rem ? '，余 ' + e.rem : '，正好除尽！'}`;
        }
      }
      return t;
    });

    // ---- 组装竖式行（tokens: {col, ch, cls}）----
    const rows = [];
    // 商行
    const qTokens = [];
    let collapsedZeroPlaced = false;
    evts.forEach(e => {
      if (!e.display) return;
      if (dotCol !== -1 && e.col > dotCol) {
        // 小数部分：确认小数点已放置
      }
      qTokens.push({ col: e.col, ch: String(e.q), cls: 'qdigit' });
    });
    // 折叠的整数 0（如 36.58÷62 → 0.59）：intDigits 前补的 0 放在第 0 列
    if (intDigits === '0' && evts.some(e => e.display && dotCol !== -1 && e.col > dotCol) && !evts.some(e => e.display && e.col < dotCol && dotCol !== -1 && origDecimalCol !== -1) && !(needInsertedDot && evts.some(e => e.display && e.col < dotCol))) {
      qTokens.unshift({ col: 0, ch: '0', cls: 'qdigit qzero' });
    }
    // 商的小数点
    if (dotCol !== -1 && (fracDigits || (origDecimalCol !== -1 && quotient.includes('.')))) {
      qTokens.push({ col: dotCol, ch: '.', cls: 'qdot' });
    }
    qTokens.sort((x, y) => x.col - y.col);
    rows.push({ kind: 'quotient', tokens: qTokens });

    // 主行：除数 ) 被除数（含补的0，半透明显示）
    const mainTokens = [];
    chars.forEach((ch, i) => {
      if (ch === '.') mainTokens.push({ col: i, ch: '.', cls: 'mdot' });
      else mainTokens.push({ col: i, ch: ch, cls: 'mdigit' });
    });
    if (needInsertedDot) mainTokens.push({ col: chars.length, ch: '.', cls: 'mdot mdot-insert' });
    evts.forEach(e => {
      if (e.appended) mainTokens.push({ col: e.col, ch: '0', cls: 'mdigit append0' });
    });
    mainTokens.sort((x, y) => x.col - y.col);
    rows.push({ kind: 'main', tokens: mainTokens });

    // 工作行：按 display 事件顺序：product → line → (下一事件的 value)…
    const disp = evts.filter(e => e.display);
    disp.forEach((e, k) => {
      // product 行
      const pTokens = digitsRight(String(e.product), e.col);
      rows.push({ kind: 'product', eventIdx: k, tokens: pTokens, lineFrom: pTokens[0].col, lineTo: e.col, event: e });
      // 分隔线
      rows.push({ kind: 'line', eventIdx: k, from: pTokens[0].col, to: e.col });
      // 下一值行 / 最终余数行
      if (k + 1 < disp.length) {
        const vTokens = digitsRight(String(disp[k + 1].value), disp[k + 1].col, disp[k + 1].appended ? 'append0' : 'vdigit');
        rows.push({ kind: 'value', eventIdx: k + 1, tokens: vTokens, event: disp[k + 1], from: vTokens[0].col, to: disp[k + 1].col });
      } else {
        const remStr = String(e.rem === 0 ? '0' : e.rem);
        const rTokens = digitsRight(remStr, e.col, 'finalrem');
        rows.push({ kind: 'final', eventIdx: k, tokens: rTokens, event: e });
      }
    });

    function digitsRight(str, endCol, cls) {
      const arr = [];
      const charsR = str.split('');
      for (let i = 0; i < charsR.length; i++) {
        arr.push({ col: endCol - (charsR.length - 1 - i), ch: charsR[i], cls: cls || 'pdigit' });
      }
      return arr;
    }

    return {
      a, b, shift,
      dividendStr, divisorStr, divisor,
      quotient,
      dotCol, totalCols,
      events: evts,
      narration,
      rows,
      check: buildCheck(quotient, b, a)
    };
  }

  /* 验算：columnMult(商, 原除数) 应等于原被除数 */
  function buildCheck(qStr, bStr, aStr) {
    const px = decimalPlaces(qStr), py = decimalPlaces(bStr);
    const X = parseInt(String(qStr).replace('.', ''), 10) || 0;
    const Y = parseInt(String(bStr).replace('.', ''), 10) || 0;
    const sum = X * Y;
    const decTotal = px + py;
    let sumStr = String(sum);
    if (decTotal > 0) {
      sumStr = sumStr.padStart(decTotal + 1, '0');
      const cut = sumStr.length - decTotal;
      sumStr = sumStr.slice(0, cut) + '.' + sumStr.slice(cut);
      sumStr = sumStr.replace(/0+$/, '').replace(/\.$/, '');
    }
    const ok = normNum(sumStr) === normNum(aStr);
    // 布局行（右对齐字符串）
    const partials = [];
    const yDigits = String(Y).split('');
    for (let i = yDigits.length - 1; i >= 0; i--) {
      const p = X * parseInt(yDigits[i], 10);
      if (p === 0 && yDigits.length > 1) continue;
      partials.push({ text: String(p) + '0'.repeat(yDigits.length - 1 - i), cls: 'mpartial' });
    }
    const targetLen = Math.max(String(sumStr).length, String(sum).length, ...partials.map(p => p.text.length)) + 1;
    const rows = [
      { text: padLeft(String(qStr), targetLen), cls: 'mtop' },
      { text: '× ' + padLeft(String(bStr), targetLen - 2), cls: 'mtop msign' },
      { text: '─'.repeat(targetLen), cls: 'mline' }
    ];
    partials.forEach(p => rows.push({ text: padLeft(p.text, targetLen), cls: 'mpartial' }));
    if (partials.length > 1) rows.push({ text: '─'.repeat(targetLen), cls: 'mline' });
    rows.push({ text: padLeft(sumStr, targetLen), cls: 'msum' });
    return { rows, result: sumStr, target: aStr, ok };
    function padLeft(s, n) { s = String(s); while (s.length < n) s = ' ' + s; return s; }
  }

  function normNum(s) {
    s = String(s).trim();
    if (s.startsWith('.')) s = '0' + s;
    s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    s = s.replace(/^(-?)0+(\d)/, '$1$2');
    return s;
  }

  const api = { shiftDecimalStr, decimalPlaces, build, buildCheck, normNum };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.LongDiv = api;
})(typeof window !== 'undefined' ? window : globalThis);
