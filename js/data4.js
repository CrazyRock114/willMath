/* =========================================================
 * WILL 数据 · 第 4 部分（补充卷④）：KP5 单价与单位率 + 错题 P12
 * 另含：P7「再遇同款」标记、词汇卡补充
 * ======================================================= */
(function () {
  const D = window.WILL_DATA;

  /* ---- 批次信息更新 ---- */
  D.batch = 'Batch 1 + 2 · 共 4 张卷';
  D.sheets.push({ name: '卷④ Cambridge Primary 6 Ch19 · 典例精析（荧光笔题）', img: 'mmexport1790519087982.jpg', problems: 1 });

  /* ---- P7 再遇同款标记：3.99÷9.5 在卷④又出现了 ---- */
  const p7 = D.problems.find(p => p.id === 'p7');
  if (p7) {
    p7.reencounter = `这道题在卷④（Cambridge Primary 6 Chapter 19 练习卷）<b>又出现了</b>——一模一样的 3.99 ÷ 9.5！能在新卷子里再遇到，说明它就是<b>高发考点</b>。趁热打铁：把下面的 3 道举一反三<b>再做一遍</b>，再看一次竖式动画。最后考考自己：为什么商<b>不可能</b>是 4.2？（提示：3.99 还不到 9.5 的一半！）`;
  }

  /* ---- 词汇卡补充 ---- */
  D.glossary.push(
    { t: 'unit price', zh: '单价', ex: '总价 ÷ 数量：$2.50 ÷ 4 = $0.625 一个' },
    { t: 'best buy', zh: '划算之选', ex: '单价更低的那一包/那一家' },
    { t: 'total cost', zh: '总价', ex: '一共花的钱：单价 × 数量' },
    { t: 'conclusion', zh: '结论', ex: '应用题最后那句回答：Pack A is cheaper.' }
  );

  /* ---- 新科室：单价与单位率 ---- */
  D.kps.kp5 = {
    name: '单价与单位率 · 聪明的比较',
    en: 'Unit Price & Best Buy',
    icon: '🛒', color: 'teal',
    slogan: '算一算、比一比、写结论',
    intro: `
      <p>只要题目里出现"<b>per</b>"（每）——每支多少钱、每个橙子多少钱、每小时多少千米——全都是一家人：<b>单位率 unit rate</b>。核心动作只有一个：<b>除！</b></p>
      <div class="formula-card">unit rate = total ÷ quantity<br><span class="zh">单价（单位率）= 总量 ÷ 数量</span></div>
      <p>比较两样东西谁划算，两条路都能走：</p>
      <ul>
        <li><b>视角一 · 都算成"每 1 个"</b>：各自 ÷ 自己的数量，得到单价再比大小。</li>
        <li><b>视角二 · 变成相同数量</b>：像 Will 在卷④上写的那样 1.89 ÷ 3 × 4 = 2.52，把 B 包"放大"到 4 个再比总价——思路完全正确！</li>
      </ul>
      <p>应用题三步走：<b>算一算 → 比一比 → 写结论 conclusion</b>。最后那句结论，才是题目真正要的答案！</p>`,
    recap: {
      title: '课文回顾 · 卷④ Worked Example 1（典例精析）',
      html: `<div class="recap-box"><span class="ex">Pack A: $2.50 ÷ 4 = $0.625</span><span class="ex">Pack B: $1.89 ÷ 3 = $0.63</span><span class="arrow">→ $0.625 &lt; $0.630</span><span class="note">Pack A 更划算 ✓</span></div>`
    },
    vocab: ['unit price', 'best buy', 'conclusion', 'per']
  };

  /* ---- P12：Mandisa 橙子比较（荧光笔不会做题） ---- */
  D.problems.push({
    id: 'p12', kp: 'kp5', emoji: '🍊',
    title: '单价比较 · 哪包橙子更划算？',
    en: 'Best Buy: Cost per Orange',
    source: '卷④ · Authentic Problems a (Cambridge Primary 6)',
    problem: { en: 'Mandisa compares two packs: 4 oranges for $2.50 versus 3 oranges for $1.89. Show your working to determine which pack has the lower cost per orange.', zh: '比较两包橙子：4 个装 $2.50 对比 3 个装 $1.89。写出计算过程，判断哪一包每个橙子更便宜。' },
    correctAnswer: 'Pack A（$0.625/个 < $0.630/个）',
    concept: [
      `新题型登场：<b>Best Buy（哪个更划算）</b>！关键武器是<b>单价 unit price</b>——"per" 又来了：cost <b>per</b> orange = 每个橙子的价钱。<b>单价 = 总价 ÷ 数量</b>。`,
      `钱可以是很小的小数：$0.625 就是 62.5 美分，别怕它——它只是个普通小数。`,
      `两种比法都聪明：`,
      `<div class="formula-card">方法一（标准）：各自算出 1 个的价钱再比<br>方法二（Will 卷④上写的！）：把数量变相同再比总价</div>`,
      `Will 的算式 1.89 ÷ 3 × 4 = 2.52 用的就是方法二：先算 B 包 1 个 $0.63，再算买 4 个要 $2.52，比 A 包的 $2.50 贵 2 美分 → A 便宜。先 ÷ 后 ×，正好符合"从左到右"的运算顺序，<b>思路完全正确</b>！`,
      `唯一的问题是：写完 2.52 就停笔了。题目要你 "determine which pack"（判断哪包），所以必须比出大小、写下<b>结论 conclusion</b>——应用题的最后一句才是得分句！`
    ],
    steps: [
      `① 认题：问 "cost per orange" → 单价 = 总价 ÷ 数量。`,
      `② A 包：$2.50 ÷ 4 = <b>$0.625</b>（竖式：4 ) 2.50，商的小数点和 2.50 的小数点对齐）。`,
      `③ B 包：$1.89 ÷ 3 = <b>$0.63</b>（189 ÷ 3 = 63，正好除尽）。`,
      `④ 比较（先补 0 对齐）：$0.625 vs $0.630 → 十分位 6=6，百分位 2&lt;3 → <b>0.625 &lt; 0.630</b>。`,
      `⑤ 写结论：Pack A is cheaper per orange. Mandisa should choose <b>Pack A</b>.`,
      `（用 Will 的方法验证：1.89÷3×4 = 2.52 > 2.50 → A 包便宜 ✓ 两种方法殊途同归！）`
    ],
    pitfalls: [
      { wrong: '算到一半就停笔（只有 2.52，没有比较和结论）', why: `Will 这次的情况——觉得"我算出来了"就算做完。但应用题三步<b>算一算 → 比一比 → 写结论</b>缺一不可，改卷老师要看的就是最后那句结论。`, fix: `写完数字后抬头问自己："题目问的问题，我回答了吗？"补上一句 "So Pack A is cheaper per orange." 才算完成。` },
      { wrong: '2.50 ÷ 4 小数点错位，得 6.25 或 62.5', why: `商的小数点没有对齐被除数的小数点。估算报警：$2.50 买 4 个橙子，每个应该是 $0.60 左右；$6.25 一个？金子做的橙子！`, fix: `商的小数点和 2.50 的小数点<b>对齐</b> → 0.625。用下面的竖式动画走一遍。` },
      { wrong: '把 0.625 和 0.63 比反了（觉得 625 &gt; 63）', why: `忽略了小数位数，直接比"数字大小"。`, fix: `补 0 对齐再比：0.625 vs 0.630——从高位起一位一位比：十分位 6=6，百分位 2&lt;3 → 0.625 &lt; 0.630。` }
    ],
    mnemon: '单价 = 总价 ÷ 数量；算一算、比一比、写结论；比较之前先补 0。',
    widget: { type: 'best-buy', packs: '[{"name":"Pack A","count":4,"price":"2.50"},{"name":"Pack B","count":3,"price":"1.89"}]', item: 'orange' },
    widgetNote: '一步步算出两包的单价，看哪包赢；再切"Will 的放大法"——你会发现他卷子上的思路其实完全正确，只差一句结论！',
    widget2: { type: 'long-division', a: '2.50', b: '4', shift: 0 },
    widget2Title: '竖式演示：2.50 ÷ 4（除数本来就是整数）',
    widget2Note: '除数是整数就不用搬家！注意商的小数点要和 2.50 的小数点对齐——0.625 就出来啦。',
    practice: [
      { q: `A stationery shop sells pencils in two packs: 5 pencils for $1.75, or 8 pencils for $2.88. Work out the cost per pencil for each pack. Which is the better buy?`, inputs: [{ label: '便宜的那包：每支', answer: '0.35', unit: '$' }, { label: '贵的那包：每支', answer: '0.36', unit: '$' }], hint: `单价 = 总价 ÷ 数量：算 $1.75 ÷ 5 和 $2.88 ÷ 8。`, solution: `5 支装：1.75÷5 = <b>$0.35</b>/支；8 支装：2.88÷8 = <b>$0.36</b>/支。0.35 &lt; 0.36 → <b>5 支装更划算</b>。结论：The 5-pencil pack is the better buy.`, trap: `比较前补 0 对齐：0.35 vs 0.36；结论句别忘了写！` },
      { q: `One notebook costs $3.60. How much do 15 notebooks cost?`, inputs: [{ label: '15 本总价', answer: '54', unit: '$' }], hint: `反过来了：这次知道单价，求总价 → 单价 × 数量。`, solution: `3.60 × 15 = 3.6 × 10 + 3.6 × 5 = 36 + 18 = <b>$54</b>。`, trap: `单价 × 数量 是"除法"的逆运算：单价检验法 54÷15=3.6 ✓` },
      { q: `Pack X: 6 pens for $8.10. Pack Y: 4 pens for $5.60. Which pack is cheaper per pen?`, inputs: [{ label: '便宜的那包：每支', answer: '1.35', unit: '$' }, { label: '贵的那包：每支', answer: '1.4', unit: '$' }], hint: `分别算单价：8.10÷6 和 5.60÷4。8.10÷6 可以想成 810÷6=135，再点回两位小数。`, solution: `X：8.10÷6 = <b>$1.35</b>/支；Y：5.60÷4 = <b>$1.40</b>/支。1.35 &lt; 1.40 → <b>Pack X 每支更便宜</b>。结论：Pack X has the lower cost per pen.`, trap: `8.10÷6 的竖式：8÷6=1 余 2 → 21÷6=3 余 3 → 30÷6=5 → 1.35，商的小数点对齐 8.10 的小数点。` }
    ]
  });
})();
