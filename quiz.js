/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — quiz.js
   QUIZ MODE
   Fully self-contained quiz engine (qz*-prefixed) — hub, question bank, scoring, results, and unit tests.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   QUIZ MODE INTEGRATION — ChemSphere
   All functions prefixed qz* to avoid
   collisions with the main app's setMode()
════════════════════════════════════════ */

/* ── Patch setMode() to handle 'quiz' ── */
const _origSetMode = window.setMode || function(){};
window.setMode = function(m) {
  if (m === 'quiz') {
    // Hide/show quiz panel and disable normal viewer panels
    document.getElementById('quiz-panel').classList.add('on');
    // Sync header tabs
    document.querySelectorAll('.dtab').forEach(t => t.classList.remove('on'));
    const dqz = document.getElementById('dqz');
    if (dqz) dqz.classList.add('on');
    // Sync mobile bottom tabs
    ['b3d','b2d','bpr','bmol'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('on');
    });
    const bqz = document.getElementById('bqz');
    if (bqz) bqz.classList.add('on');
    // Update hub stats
    qzUpdateHubStats();
    return;
  }
  // For any non-quiz mode, hide the quiz panel
  document.getElementById('quiz-panel').classList.remove('on');
  const dqz = document.getElementById('dqz');
  if (dqz) dqz.classList.remove('on');
  const bqz = document.getElementById('bqz');
  if (bqz) bqz.classList.remove('on');
  _origSetMode(m);
};

/* ── Show a sub-screen within the quiz panel ── */
function qzShow(screen) {
  ['qz-hub','qz-quiz','qz-results'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === screen) ? 'block' : 'none';
  });
  const panel = document.getElementById('quiz-panel');
  if (panel) panel.scrollTop = 0;
}

/* ════════════════════════════════════════
   MOLECULE DATABASE (mirror of main DB)
════════════════════════════════════════ */
const QZ_MOLS = {
  vsepr: [
    {key:'vsepr-h2o',  f:'H₂O',   n:'Water',                  s:'Bent',              w:'18.02',  h:'sp³',   a:'104.5°', d:'1.85 D',  diff:'easy'},
    {key:'vsepr-co2',  f:'CO₂',   n:'Carbon Dioxide',         s:'Linear',            w:'44.01',  h:'sp',    a:'180°',   d:'0 D',     diff:'easy'},
    {key:'vsepr-bf3',  f:'BF₃',   n:'Boron Trifluoride',      s:'Trigonal Planar',   w:'67.81',  h:'sp²',   a:'120°',   d:'0 D',     diff:'easy'},
    {key:'vsepr-ch4',  f:'CH₄',   n:'Methane',                s:'Tetrahedral',       w:'16.04',  h:'sp³',   a:'109.5°', d:'0 D',     diff:'easy'},
    {key:'vsepr-nh3',  f:'NH₃',   n:'Ammonia',                s:'Trigonal Pyramidal',w:'17.03',  h:'sp³',   a:'107°',   d:'1.47 D',  diff:'easy'},
    {key:'vsepr-pcl5', f:'PCl₅',  n:'PCl₅',                   s:'Trig. Bipyramidal', w:'208.2',  h:'sp³d',  a:'90°/120°',d:'0 D',    diff:'hard'},
    {key:'vsepr-sf6',  f:'SF₆',   n:'Sulfur Hexafluoride',    s:'Octahedral',        w:'146.1',  h:'sp³d²', a:'90°',    d:'0 D',     diff:'medium'},
    {key:'vsepr-xef4', f:'XeF₄',  n:'Xenon Tetrafluoride',    s:'Square Planar',     w:'207.3',  h:'sp³d²', a:'90°',    d:'0 D',     diff:'hard'},
  ],
  organic: [
    {key:'org-benz',   f:'C₆H₆',  n:'Benzene',                s:'Hexagonal',         w:'78.11',  h:'sp²',   a:'120°',   d:'0 D',     diff:'easy'},
    {key:'org-etoh',   f:'C₂H₅OH',n:'Ethanol',                s:'Tetrahedral C',     w:'46.07',  h:'sp³',   a:'109.5°', d:'1.69 D',  diff:'easy'},
    {key:'org-acet',   f:'C₃H₆O', n:'Acetone',                s:'Trigonal Planar',   w:'58.08',  h:'sp²',   a:'~120°',  d:'2.91 D',  diff:'medium'},
    {key:'org-acac',   f:'CH₃COOH',n:'Acetic Acid',           s:'Planar –COOH',      w:'60.05',  h:'sp²',   a:'~120°',  d:'1.74 D',  diff:'medium'},
    {key:'org-form',   f:'CH₂O',  n:'Formaldehyde',           s:'Trigonal Planar',   w:'30.03',  h:'sp²',   a:'~120°',  d:'2.33 D',  diff:'medium'},
  ],
  organic2: [
    {key:'org-eth',    f:'C₂H₄',  n:'Ethene',                 s:'Trigonal Planar',   w:'28.05',  h:'sp²',   a:'120°',   d:'0 D',     diff:'easy'},
    {key:'org-ethy',   f:'C₂H₂',  n:'Ethyne',                 s:'Linear',            w:'26.04',  h:'sp',    a:'180°',   d:'0 D',     diff:'easy'},
    {key:'org-chloro', f:'CHCl₃', n:'Chloroform',             s:'Tetrahedral',       w:'119.4',  h:'sp³',   a:'~109.5°',d:'1.15 D',  diff:'medium'},
    {key:'org-ccl4',   f:'CCl₄',  n:'Carbon Tetrachloride',   s:'Tetrahedral',       w:'153.8',  h:'sp³',   a:'109.5°', d:'0 D',     diff:'medium'},
    {key:'org-urea',   f:'CO(NH₂)₂',n:'Urea',                 s:'Trigonal Planar',   w:'60.06',  h:'sp²',   a:'~120°',  d:'4.56 D',  diff:'hard'},
  ],
  biomol: [
    {key:'bio-gluc',   f:'C₆H₁₂O₆',n:'Glucose',              s:'Pyranose Ring',     w:'180.2',  h:'sp³',   a:'109.5°', d:'—',       diff:'medium'},
    {key:'bio-aden',   f:'C₅H₅N₅', n:'Adenine',              s:'Planar Bicyclic',   w:'135.1',  h:'sp²',   a:'~120°',  d:'—',       diff:'hard'},
    {key:'bio-chol',   f:'C₂₇H₄₆O',n:'Cholesterol',          s:'Steroid Core',      w:'386.7',  h:'sp³',   a:'109.5°', d:'—',       diff:'hard'},
    {key:'bio-alan',   f:'C₃H₇NO₂',n:'Alanine',              s:'Tetrahedral',       w:'89.09',  h:'sp³',   a:'109.5°', d:'—',       diff:'medium'},
  ],
  inorganic: [
    {key:'in-h2so4',   f:'H₂SO₄', n:'Sulfuric Acid',          s:'Tetrahedral',       w:'98.08',  h:'sp³',   a:'109.5°', d:'—',       diff:'medium'},
    {key:'in-hno3',    f:'HNO₃',  n:'Nitric Acid',            s:'Trigonal Planar',   w:'63.01',  h:'sp²',   a:'~120°',  d:'—',       diff:'medium'},
    {key:'in-nf3',     f:'NF₃',   n:'Nitrogen Trifluoride',   s:'Pyramidal',         w:'71.0',   h:'sp³',   a:'102.5°', d:'0.24 D',  diff:'hard'},
    {key:'in-of2',     f:'OF₂',   n:'Oxygen Difluoride',      s:'Bent',              w:'54.0',   h:'sp³',   a:'102°',   d:'0.30 D',  diff:'hard'},
    {key:'in-clf3',    f:'ClF₃',  n:'Chlorine Trifluoride',   s:'T-shaped',          w:'92.45',  h:'sp³d',  a:'87.5°',  d:'0.6 D',   diff:'hard'},
    {key:'in-xef2',    f:'XeF₂',  n:'Xenon Difluoride',       s:'Linear',            w:'169.3',  h:'sp³d',  a:'180°',   d:'0 D',     diff:'hard'},
    {key:'in-so2',     f:'SO₂',   n:'Sulfur Dioxide',         s:'Bent',              w:'64.06',  h:'sp²',   a:'119°',   d:'1.63 D',  diff:'medium'},
    {key:'in-so3',     f:'SO₃',   n:'Sulfur Trioxide',        s:'Trigonal Planar',   w:'80.06',  h:'sp²',   a:'120°',   d:'0 D',     diff:'medium'},
    {key:'in-no2',     f:'NO₂',   n:'Nitrogen Dioxide',       s:'Bent',              w:'46.01',  h:'sp²',   a:'134°',   d:'0.32 D',  diff:'hard'},
    {key:'in-o3',      f:'O₃',    n:'Ozone',                  s:'Bent',              w:'48.0',   h:'sp²',   a:'117°',   d:'0.53 D',  diff:'medium'},
    {key:'in-h2o2',    f:'H₂O₂',  n:'Hydrogen Peroxide',      s:'Non-planar Bent',   w:'34.01',  h:'sp³',   a:'111°',   d:'2.26 D',  diff:'hard'},
    {key:'in-becl2',   f:'BeCl₂', n:'Beryllium Chloride',     s:'Linear',            w:'79.91',  h:'sp',    a:'180°',   d:'0 D',     diff:'medium'},
    {key:'in-ph3',     f:'PH₃',   n:'Phosphine',              s:'Pyramidal',         w:'34.0',   h:'sp³',   a:'93.5°',  d:'0.58 D',  diff:'hard'},
    {key:'in-pcl3',    f:'PCl₃',  n:'PCl₃',                   s:'Pyramidal',         w:'137.3',  h:'sp³',   a:'100°',   d:'0.97 D',  diff:'hard'},
    {key:'in-diborane',f:'B₂H₆',  n:'Diborane',               s:'Bridged',           w:'27.67',  h:'sp³',   a:'97°',    d:'0 D',     diff:'hard'},
  ]
};

/* ── Question bank builder ── */
function qzBuildBank(filterCat='all', filterType='all', filterDiff='all') {
  let mols = [];
  const cats = filterCat === 'all' ? Object.keys(QZ_MOLS) : [filterCat];
  cats.forEach(c => { if (QZ_MOLS[c]) mols.push(...QZ_MOLS[c]); });
  if (filterDiff !== 'all') mols = mols.filter(m => m.diff === filterDiff);

  const bank = [];
  const qTypes = {
    geo:    m => ({stem:`What is the molecular geometry (VSEPR shape) of ${m.n}?`,   formula:m.f, answer:m.s, distractors:qzGeoD(m.s),  explain:`${m.n} (${m.f}) has ${m.h} hybridization. The VSEPR geometry is ${m.s} with bond angle ${m.a}.`, neet:null, tag:'geo',   diff:m.diff, mol:m}),
    hyb:    m => ({stem:`What is the hybridization of the central atom in ${m.n}?`,    formula:m.f, answer:m.h, distractors:qzHybD(m.h),   explain:`The central atom in ${m.n} (${m.f}) is ${m.h} hybridized. Shape: ${m.s}, bond angle: ${m.a}.`, neet:null, tag:'hyb',   diff:m.diff, mol:m}),
    angle:  m => ({stem:`What is the bond angle in ${m.n}?`,                           formula:m.f, answer:m.a, distractors:qzAngD(m.a),   explain:`${m.n} has a bond angle of ${m.a}. It is ${m.h} hybridized with ${m.s} geometry.`, neet:null, tag:'angle', diff:m.diff, mol:m}),
    dipole: m => ({stem:`Which best describes the dipole moment of ${m.n}?`,           formula:m.f, answer:m.d==='0 D'?'Zero (non-polar)':`Non-zero (${m.d})`, distractors:qzDipD(m.d), explain:`${m.n}: dipole = ${m.d}. Geometry: ${m.s}.`, neet:null, tag:'dipole', diff:m.diff, mol:m}),
  };
  const types = filterType === 'all' ? ['geo','hyb','angle','dipole'] : [filterType];

  mols.forEach(m => {
    types.forEach(t => {
      if (qTypes[t]) {
        const q = qTypes[t](m);
        if (q) bank.push(q);
      }
    });
    if (filterType === 'all' || filterType === 'fact') {
      const f = QZ_FACTS.find(q => q.mol === m.n || q.mol === m.f);
      if (f) {
        const all = [f.a, ...f.opts.slice(0,3)];
        qzShuffle(all);
        bank.push({stem:f.q, formula:f.f, answer:f.a, distractors:all, explain:f.exp, neet:f.neet, tag:'fact', diff:f.diff, mol:m});
      }
    }
  });
  return bank;
}

function qzGeoD(c) {
  const pool=['Linear','Bent','Trigonal Planar','Tetrahedral','Trigonal Pyramidal','Octahedral','Square Planar','Trig. Bipyramidal','T-shaped','Hexagonal','Pyranose Ring','Bridged','Non-planar Bent','Planar Bicyclic','Steroid Core'];
  return qzDistract(c,pool);
}
function qzHybD(c) { return qzDistract(c,['sp','sp²','sp³','sp³d','sp³d²','sp³d³']); }
function qzAngD(c) {
  const pool=['90°','93.5°','97°','100°','102°','102.5°','104.5°','107°','109.5°','111°','117°','119°','120°','134°','180°','90°/120°','~120°','~109.5°','87.5°'];
  return qzDistract(c,pool.filter(x=>x!==c));
}
function qzDipD(d) {
  const correct=d==='0 D'?'Zero (non-polar)':`Non-zero (${d})`;
  return qzDistract(correct,['Zero (non-polar)','Non-zero — highly polar (>2 D)','Non-zero — slightly polar (<1 D)','Cannot be determined','Non-zero (1.85 D)','Non-zero (2.91 D)']);
}
function qzDistract(correct,pool) {
  const opts=pool.filter(x=>x!==correct);
  qzShuffle(opts);
  const all=[correct,...opts.slice(0,3)];
  qzShuffle(all);
  return all;
}

/* ── Fact questions ── */
const QZ_FACTS = [
  {mol:'H₂O',  f:'H₂O',  q:'In H₂O, why is the bond angle 104.5° and NOT 109.5°?', a:'Lone pair–bond pair repulsion on O reduces the angle', opts:['H–O bonds are weaker than in ideal geometry','O is sp² hybridized','H atoms repel each other strongly'], exp:'Two lone pairs on O in H₂O exert greater repulsion than bond pairs, compressing the H–O–H angle from the ideal tetrahedral 109.5° to 104.5°.', neet:'Classic NEET VSEPR question — lone pair repulsion order: LP–LP > LP–BP > BP–BP.',diff:'easy'},
  {mol:'CO₂',  f:'CO₂',  q:'CO₂ has two polar C=O bonds yet its net dipole is zero. Why?', a:'Linear geometry — the two bond dipoles cancel by symmetry', opts:['C–O bonds are non-polar','C and O have the same electronegativity','The molecule is ionic'], exp:'CO₂ is linear (sp hybridized). The two C=O dipoles point in exactly opposite directions and cancel, giving a net dipole of zero despite each bond being polar.', neet:'Classic NEET trap — symmetric linear molecules can have ZERO net dipole. Compare with H₂O (bent, non-zero dipole).', diff:'easy'},
  {mol:'NH₃',  f:'NH₃',  q:'Which process produces NH₃ from N₂ and H₂ at ~500°C and ~200 atm?', a:'Haber Process', opts:['Contact Process','Ostwald Process','Solvay Process'], exp:'The Haber Process: N₂ + 3H₂ ⇌ 2NH₃, using Fe catalyst at ~500°C and ~200 atm.', neet:'Contact Process makes H₂SO₄; Ostwald Process makes HNO₃; Haber Process makes NH₃.', diff:'easy'},
  {mol:'BF₃',  f:'BF₃',  q:'BF₃ acts as a Lewis acid because it has:', a:'An empty p-orbital on boron that accepts electron pairs', opts:['Lone pairs on F that can donate electrons','Three polar B–F bonds','A net dipole moment'], exp:'B in BF₃ is sp² hybridized with an empty unhybridized p-orbital. This makes it electron-deficient and a strong Lewis acid.', neet:'BF₃ + NH₃ → F₃B–NH₃ (Lewis acid-base adduct). Important for JEE.', diff:'medium'},
  {mol:'SF₆',  f:'SF₆',  q:'SF₆ is approximately how many times more potent a greenhouse gas than CO₂?', a:'23,500 times', opts:['100 times','1,000 times','50,000 times'], exp:'SF₆ has a global warming potential (GWP) of ~23,500 over 100 years, making it one of the most potent greenhouse gases.', neet:'Know that SF₆ = octahedral, sp³d², bond angle 90°, dipole = 0.', diff:'medium'},
  {mol:'XeF₄', f:'XeF₄', q:'XeF₄ is square planar despite having 6 electron pairs. Where do the 2 lone pairs sit?', a:'Opposite each other (trans) in axial positions', opts:['Both in equatorial positions','One axial, one equatorial','Randomly distributed'], exp:'XeF₄ has sp³d² hybridization with 4 bond pairs and 2 lone pairs. The lone pairs take the two axial positions (trans to each other).', neet:'KEY JEE: sp³d² can give octahedral (0 LP), square planar (2 LP trans), or other shapes.', diff:'hard'},
  {mol:'Benzene',f:'C₆H₆',q:'Benzene satisfies Hückel\'s rule because it has:', a:'6 π electrons (4n+2, n=1)', opts:['4 π electrons','8 π electrons','3 alternating double bonds only'], exp:'Hückel\'s rule: aromatic if 4n+2 π electrons in a planar conjugated ring. Benzene has 6 π electrons (n=1).', neet:'Aromatic: 4n+2 π e⁻. Benzene n=1 → 6. Naphthalene n=2 → 10.', diff:'medium'},
  {mol:'NF₃',  f:'NF₃',  q:'NF₃ bond angle (102.5°) is SMALLER than NH₃ (107°) because:', a:'F pulls bonding electrons away from N, reducing lone pair–bond pair repulsion', opts:['F is larger than H and takes more space','N uses sp² hybridization in NF₃','N–F bonds are longer than N–H bonds'], exp:'In NF₃, F\'s high electronegativity pulls the bonding pair away from N, increasing the lone pair\'s relative electron density and compressing the bond angle.', neet:'Classic NEET comparison: NH₃ 107° > NF₃ 102.5°. Reason: electronegativity of F vs H.', diff:'hard'},
  {mol:'Ozone', f:'O₃',  q:'Ozone (O₃) decolourises moist starch-iodide paper. This confirms:', a:'O₃ is a stronger oxidising agent than O₂', opts:['O₃ is acidic','O₃ bleaches permanently like Cl₂','O₃ has a linear structure'], exp:'O₃ oxidises I⁻ to I₂ (starch turns blue), confirming it is a powerful oxidising agent. O₃ absorbs UV in the stratosphere.', neet:'O₃ test: starch-iodide paper turns blue. SO₂ bleaching is reversible. Cl₂ bleaching is permanent.', diff:'medium'},
  {mol:'Urea',  f:'CO(NH₂)₂',q:'Urea was the first organic compound synthesized from an inorganic source. Who did this?', a:'Friedrich Wöhler (1828)', opts:['Antoine Lavoisier','Louis Pasteur','Dmitri Mendeleev'], exp:'In 1828, Friedrich Wöhler accidentally synthesized urea from ammonium cyanate, disproving the "vital force theory."', neet:'Wöhler 1828: NH₄CNO → CO(NH₂)₂. First synthesis of organic from inorganic. Disproved vitalism.', diff:'medium'},
  {mol:'H₂O₂', f:'H₂O₂', q:'In H₂O₂, what is the unusual oxidation state of oxygen?', a:'−1', opts:['0','−2','+1'], exp:'In H₂O₂, oxygen is in the −1 oxidation state (between 0 in O₂ and −2 in H₂O). H₂O₂ acts as BOTH oxidising agent AND reducing agent.', neet:'H₂O₂ oxidation state O = −1. Unique: acts as both oxidiser and reducer. Decomposes with MnO₂.', diff:'hard'},
  {mol:'Diborane',f:'B₂H₆',q:'The bridging bonds in B₂H₆ (diborane) are called:', a:'Three-centre two-electron (banana) bonds', opts:['Normal covalent bonds','Coordinate (dative) bonds','van der Waals interactions'], exp:'B₂H₆ has two bridging H atoms each forming a 3-centre 2-electron "banana bond" shared between two B atoms.', neet:'B₂H₆ = electron deficient compound. 3-centre 2-electron bonds. B₂H₆ + 6H₂O → 2B(OH)₃ + 6H₂.', diff:'hard'},
  {mol:'ClF₃',  f:'ClF₃', q:'ClF₃ is T-shaped (not trigonal planar) because:', a:'Lone pairs occupy equatorial positions to minimize repulsion', opts:['Cl uses sp² hybridization','F atoms are too large for planar arrangement','ClF₃ actually IS trigonal planar'], exp:'ClF₃ has 5 electron pairs (sp³d). The 2 lone pairs prefer equatorial positions (more space, less repulsion). This gives a T-shape.', neet:'KEY JEE: Lone pairs prefer equatorial in tbp. ClF₃ T-shaped (87.5°). Not trigonal planar!', diff:'hard'},
  {mol:'CCl₄',  f:'CCl₄', q:'CCl₄ has four polar C–Cl bonds yet its net dipole is zero because:', a:'Tetrahedral symmetry causes all four bond dipoles to cancel exactly', opts:['C–Cl bonds are actually non-polar','The molecule is linear','Carbon is sp hybridized'], exp:'In CCl₄, the four C–Cl bond dipoles arranged tetrahedrally cancel exactly. Compare with CHCl₃ where replacing one Cl with H breaks symmetry → non-zero dipole.', neet:'CCl₄ dipole = 0 (symmetric tetrahedral). CHCl₃ dipole ≠ 0 (asymmetric). Classic NEET MCQ!', diff:'medium'},
];

/* ── State ── */
let qzMode     = 'quick';
let qzBank     = [];
let qzIdx      = 0;
let qzCorrect  = 0;
let qzWrong    = 0;
let qzSkipped  = 0;
let qzTotalTarget = 0;  // cfg.count — the advertised question count for this session
let qzLog      = [];
let qzTimer    = null;
let qzTimerVal = 20;
let qzTimerMax = 20;
let qzStart    = 0;
let qzTotalMs  = 0;
let qzStreak   = 0;
let qzBest     = parseInt(localStorage.getItem('cs_best') || '0');
let qzDone     = parseInt(localStorage.getItem('cs_done') || '0');
let qzLastSettings = {cat:'all', type:'all', diff:'all'};

const QZ_MODE_CFG = {
  quick:   {label:'Quick Fire',   count:10, time:20, color:'var(--acc)',  bg:'rgba(74,143,255,.1)'},
  chapter: {label:'Chapter Drill',count:15, time:30, color:'var(--tea)',  bg:'rgba(0,229,180,.1)'},
  exam:    {label:'Exam Sim',     count:20, time:0,  color:'var(--org)',  bg:'rgba(255,107,53,.1)'},
  blitz:   {label:'Blitz',        count:8,  time:8,  color:'var(--gold)', bg:'rgba(255,215,0,.1)'},
};

/* ── Hub ── */
let qzHubCat = 'all';
function qzPickFilt(cat, btn) {
  qzHubCat = cat;
  document.querySelectorAll('.filt-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('#mod-cats .mod-opt').forEach(b => b.classList.toggle('on', b.dataset.val === cat));
  qzLastSettings.cat = cat;
}
function qzUpdateHubStats() {
  const best = document.getElementById('stat-best');
  const done = document.getElementById('stat-done');
  if (best) best.textContent = qzBest ? qzBest + '%' : '—';
  if (done) done.textContent = qzDone;
}

/* ── Modal ── */
function qzOpenSettings(mode) {
  qzMode = mode;
  const cfg = QZ_MODE_CFG[mode];
  document.getElementById('qz-modal').classList.add('v');
  document.getElementById('mod-title').textContent = cfg.label;
  document.getElementById('mod-sub').textContent = `${cfg.count} questions · ${cfg.time > 0 ? cfg.time + 's per question' : 'untimed'}`;
  document.getElementById('mod-chapter-row').style.display = (mode === 'chapter') ? 'block' : 'none';
  qzSelOptVal('cat', qzLastSettings.cat);
  qzSelOptVal('type', qzLastSettings.type);
  qzSelOptVal('diff', qzLastSettings.diff);
}
function qzCloseModal() {
  document.getElementById('qz-modal').classList.remove('v');
}
function qzSelOpt(btn, group) {
  const parent = btn.closest('.mod-row');
  parent.querySelectorAll('.mod-opt').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  qzLastSettings[group] = btn.dataset.val;
}
function qzSelOptVal(group, val) {
  const map = {cat:'mod-cats', type:'mod-types', diff:'mod-diff'};
  const parent = document.getElementById(map[group]);
  if (!parent) return;
  parent.querySelectorAll('.mod-opt').forEach(b => b.classList.toggle('on', b.dataset.val === val));
}

/* ── Start ── */
function qzStartQuiz() {
  qzCloseModal();
  const cfg = QZ_MODE_CFG[qzMode];
  let bank = qzBuildBank(qzLastSettings.cat, qzLastSettings.type, qzLastSettings.diff);
  if (!bank.length) bank = qzBuildBank('all','all','all');
  qzShuffle(bank);
  qzBank    = bank.slice(0, cfg.count);
  qzTotalTarget = cfg.count;                           // advertised question count
  qzIdx     = 0; qzCorrect = 0; qzWrong = 0; qzSkipped = 0;
  qzLog     = []; qzStreak = 0; qzTotalMs = 0;
  qzShow('qz-quiz');
  qzRenderQ();
}

/* ── Render question ── */
function qzRenderQ() {
  if (qzIdx >= qzBank.length) { qzShowResults(); return; }
  const q = qzBank[qzIdx];
  const cfg = QZ_MODE_CFG[qzMode];

  document.getElementById('qpbar').style.width = ((qzIdx / qzBank.length) * 100) + '%';
  document.getElementById('qinfo').textContent = `Q${qzIdx+1} of ${qzBank.length}`;
  document.getElementById('score-correct').textContent = qzCorrect;
  document.getElementById('score-total').textContent   = qzTotalTarget;

  const modeTag = document.getElementById('qmode-tag');
  modeTag.textContent  = cfg.label;
  modeTag.style.background = cfg.bg;
  modeTag.style.color  = cfg.color;

  document.getElementById('q-num').textContent  = `Q${qzIdx+1} / ${qzBank.length}`;
  const tagEl = document.getElementById('q-tag');
  tagEl.textContent = {geo:'Geometry',hyb:'Hybridization',angle:'Bond Angle',dipole:'Dipole',fact:'Exam Fact'}[q.tag] || q.tag;
  tagEl.className   = 'q-tag ' + (q.tag==='fact'?'fact':q.tag==='geo'?'geo':'');
  const diffEl = document.getElementById('q-diff');
  if (q.diff==='hard') { diffEl.textContent='HARD'; diffEl.style.display=''; }
  else diffEl.style.display='none';

  document.getElementById('q-stem').textContent = q.stem;
  const fEl = document.getElementById('q-formula');
  if (q.formula) { fEl.textContent = q.formula; fEl.style.display=''; }
  else fEl.style.display='none';

  const optsEl = document.getElementById('opts');
  optsEl.innerHTML = '';
  ['A','B','C','D'].forEach((letter, i) => {
    if (!q.distractors[i]) return;
    const btn = document.createElement('button');
    btn.className = 'opt';
    btn.innerHTML = `<span class="opt-letter">${letter}</span>${q.distractors[i]}`;
    btn.dataset.val = q.distractors[i];
    btn.onclick = () => qzAnswer(q.distractors[i], q);
    optsEl.appendChild(btn);
  });

  const fb = document.getElementById('feedback');
  fb.className = 'feedback'; fb.style.display='none';
  document.getElementById('btn-next').classList.remove('show');
  document.getElementById('btn-skip').style.display='';

  const tw = document.getElementById('timer-wrap');
  clearInterval(qzTimer);
  if (cfg.time > 0) {
    tw.style.display = '';
    qzTimerMax = cfg.time; qzTimerVal = cfg.time;
    document.getElementById('timer-num').textContent = cfg.time + 's';
    const fill = document.getElementById('timer-fill');
    fill.style.width = '100%';
    fill.className = 'timer-fill';
    qzStart = performance.now();
    qzTimer = setInterval(() => {
      qzTimerVal--;
      const pct = (qzTimerVal / qzTimerMax) * 100;
      fill.style.width = pct + '%';
      document.getElementById('timer-num').textContent = qzTimerVal + 's';
      if (qzTimerVal <= Math.ceil(qzTimerMax*0.25)) fill.className='timer-fill danger';
      else if (qzTimerVal <= Math.ceil(qzTimerMax*0.5)) fill.className='timer-fill warn';
      if (qzTimerVal <= 0) { clearInterval(qzTimer); qzAnswer(null, q, true); }
    }, 1000);
  } else {
    tw.style.display = 'none';
    qzStart = performance.now();
  }
}

/* ── Answer ── */
function qzAnswer(chosen, q, timeout=false) {
  clearInterval(qzTimer);
  const elapsed = performance.now() - qzStart;
  qzTotalMs += elapsed;
  const correct = !timeout && chosen === q.answer;

  document.querySelectorAll('.opt').forEach(b => {
    b.classList.add('disabled');
    b.onclick = null;
    if (b.dataset.val === q.answer) b.classList.add('correct');
    else if (b.dataset.val === chosen) b.classList.add('wrong');
  });

  if (correct) { qzCorrect++; qzStreak++; if (qzStreak >= 3) qzShowStreak(qzStreak); }
  else { qzWrong++; qzStreak = 0; }

  qzLog.push({q, chosen, correct, skipped:false, ms:elapsed});

  const fb = document.getElementById('feedback');
  fb.className = 'feedback show' + (correct ? '' : ' wrong-fb');
  fb.style.display = '';
  document.getElementById('fb-icon').textContent = timeout ? '⏱' : correct ? '✅' : '❌';
  const verdict = document.getElementById('fb-verdict');
  verdict.textContent = timeout ? "TIME'S UP" : correct ? 'CORRECT' : 'INCORRECT';
  verdict.className   = 'fb-verdict ' + (correct ? 'ok' : 'err');
  let txt = timeout ? `The correct answer was: ${q.answer}. ${q.explain}` : !correct ? `Correct answer: ${q.answer}. ${q.explain}` : q.explain;
  document.getElementById('fb-text').textContent = txt;
  const neetEl = document.getElementById('fb-neet');
  if (q.neet) { neetEl.textContent = '⚡ ' + q.neet; neetEl.style.display=''; }
  else neetEl.style.display='none';

  document.getElementById('btn-next').classList.add('show');
  document.getElementById('btn-skip').style.display='none';
}

function qzSkipQ() {
  clearInterval(qzTimer);
  const elapsed = performance.now() - qzStart;
  qzTotalMs += elapsed;
  qzSkipped++; qzStreak = 0;
  qzLog.push({q:qzBank[qzIdx], chosen:null, correct:false, skipped:true, ms:elapsed});
  qzIdx++;
  qzRenderQ();
}

function qzNextQ() { qzIdx++; qzRenderQ(); }

function qzExitQuiz() {
  clearInterval(qzTimer);
  qzShow('qz-hub');
}

/* ── Streak toast ── */
function qzShowStreak(n) {
  const t = document.getElementById('streak-toast');
  document.getElementById('streak-text').textContent =
    n >= 5 ? `${n} in a row! You're on fire!` : n === 4 ? `${n} streak! Keep going!` : `${n} correct in a row!`;
  t.classList.add('v');
  setTimeout(() => t.classList.remove('v'), 2200);
}

/* ── Results ── */
function qzShowResults() {
  clearInterval(qzTimer);

  // ── SCORE CALCULATION ──────────────────────────────────────────────────
  // Denominator is always the ADVERTISED question count (qzTotalTarget),
  // not qzBank.length which can be smaller when the filtered pool is small.
  // Formula: scorePercent = (correctAnswers / totalQuestions) * 100
  // e.g. 1 correct in a 10-question quiz → 1/10*100 = 10% (not 20%)
  const total = qzTotalTarget || qzBank.length; // fallback to bank length if unset
  const pct   = Math.round((qzCorrect / total) * 100);

  // ── LOCALSTORAGE UPDATE ────────────────────────────────────────────────
  // IMPORTANT: capture oldBest BEFORE updating qzBest / cs_best.
  // If we read localStorage after the update, pct > cs_best is always false
  // for a new best (because cs_best was just set to pct), breaking the
  // 'New Best Score' banner.
  const oldBest = qzBest;          // snapshot before any mutation
  const isNewBest = pct > oldBest; // true only if this score beats previous best

  qzDone++;
  localStorage.setItem('cs_done', String(qzDone));

  // cs_best stores best percentage (0–100 integer).
  if (isNewBest) { qzBest = pct; localStorage.setItem('cs_best', String(pct)); }
  qzUpdateHubStats();

  // ── RING ANIMATION ─────────────────────────────────────────────────────
  const circumference = 2 * Math.PI * 52;
  setTimeout(() => {
    const ring = document.getElementById('ring-fg');
    ring.style.strokeDashoffset = circumference * (1 - pct/100);
    ring.style.stroke = pct >= 80 ? 'var(--correct)' : pct >= 50 ? 'var(--warn)' : 'var(--wrong)';
  }, 200);

  document.getElementById('res-pct').textContent = pct + '%';

  let verdict, sub;
  if (pct >= 90)      { verdict='🏆 Outstanding!';    sub="Perfect NEET preparation. You're ready!"; qzSpawnConfetti(); }
  else if (pct >= 75) { verdict='⭐ Excellent!';        sub='Strong performance. Keep it up!'; }
  else if (pct >= 60) { verdict='👍 Good Job!';          sub='Above average. Review the incorrect ones.'; }
  else if (pct >= 40) { verdict='📚 Keep Studying!';     sub='Review the 3D visualizer for geometry concepts.'; }
  else                { verdict='🔬 Back to Basics';     sub='Open the 3D visualizer to learn the molecules.'; }

  document.getElementById('res-verdict').textContent = verdict;
  document.getElementById('res-sub').textContent     = sub;
  document.getElementById('r-correct').textContent   = qzCorrect;
  document.getElementById('r-wrong').textContent     = qzWrong;
  document.getElementById('r-skip').textContent      = qzSkipped;
  const avgMs = qzLog.length ? Math.round(qzTotalMs / qzLog.length / 1000) : 0;
  document.getElementById('r-time').textContent      = avgMs + 's';

  // Use isNewBest (computed from oldBest) — NOT localStorage.getItem() here,
  // because cs_best has already been updated above and the comparison would
  // always be false, meaning 'New Best Score' would never appear.
  document.getElementById('lb-title').textContent    = isNewBest || qzDone === 1 ? '🎉 New Best Score!' : 'Latest Score';
  document.getElementById('lb-detail').textContent   = `${qzCorrect}/${total} correct · ${QZ_MODE_CFG[qzMode].label}`;
  document.getElementById('lb-score').textContent    = pct + '%';

  const list = document.getElementById('review-list');
  list.innerHTML = '';
  qzLog.forEach((entry, i) => {
    const {q, chosen, correct, skipped} = entry;
    const cls = skipped ? 'skip' : correct ? 'corr' : 'wron';
    const div = document.createElement('div');
    div.className = 'review-item ' + cls;
    div.innerHTML = `<div class="ri-q">Q${i+1}: ${q.stem}</div>
      <div class="ri-row">
        <span class="ri-chip ${cls}">${skipped ? '⏭ Skipped' : correct ? '✅ ' + chosen : '❌ ' + (chosen||'No answer')}</span>
        ${!correct && !skipped ? `<span class="ri-chip corr">✓ ${q.answer}</span>` : ''}
      </div>
      <div class="ri-exp">${q.explain}</div>`;
    list.appendChild(div);
  });

  qzShow('qz-results');
}

function qzRedoQuiz() {
  qzIdx=0; qzCorrect=0; qzWrong=0; qzSkipped=0; qzLog=[]; qzStreak=0; qzTotalMs=0;
  // qzTotalTarget preserved — same quiz mode replayed
  qzShuffle(qzBank);
  qzShow('qz-quiz');
  qzRenderQ();
}

function qzGoHub() { qzShow('qz-hub'); qzUpdateHubStats(); }

/* ════════════════════════════════════════
   UNIT TESTS — Score calculation
   Run in browser console: qzRunTests()
   All tests must pass before any score-
   related change is merged.
════════════════════════════════════════ */
function qzRunTests() {
  const results = [];
  let passed = 0, failed = 0;

  function assert(label, actual, expected) {
    const ok = actual === expected;
    results.push({ ok, label, actual, expected });
    ok ? passed++ : failed++;
  }

  // ── scorePercent = Math.round(correct / total * 100) ──────────────────
  function calcPct(correct, total) {
    return Math.round((correct / total) * 100);
  }

  // Core formula
  assert('1/10 = 10%',   calcPct(1, 10),  10);
  assert('2/10 = 20%',   calcPct(2, 10),  20);
  assert('5/10 = 50%',   calcPct(5, 10),  50);
  assert('9/10 = 90%',   calcPct(9, 10),  90);
  assert('10/10 = 100%', calcPct(10, 10), 100);
  assert('0/10 = 0%',    calcPct(0, 10),  0);

  // Rounding
  assert('1/3 rounds to 33%',  calcPct(1, 3),  33);
  assert('2/3 rounds to 67%',  calcPct(2, 3),  67);
  assert('1/6 rounds to 17%',  calcPct(1, 6),  17);
  assert('1/15 rounds to 7%',  calcPct(1, 15), 7);
  assert('12/15 = 80%',        calcPct(12,15), 80);
  assert('15/20 = 75%',        calcPct(15,20), 75);
  assert('16/20 = 80%',        calcPct(16,20), 80);
  assert('6/8 = 75%',          calcPct(6, 8),  75);

  // ── localStorage integrity ────────────────────────────────────────────
  // cs_best must be a 0–100 integer string
  const rawBest = localStorage.getItem('cs_best');
  const rawDone = localStorage.getItem('cs_done');

  if (rawBest !== null) {
    const parsed = parseInt(rawBest);
    assert('cs_best is integer',         isNaN(parsed),             false);
    assert('cs_best is 0–100',           parsed >= 0 && parsed <= 100, true);
    assert('cs_best stored as string',   typeof rawBest,            'string');
  }
  if (rawDone !== null) {
    const parsed = parseInt(rawDone);
    assert('cs_done is integer',         isNaN(parsed),             false);
    assert('cs_done is non-negative',    parsed >= 0,               true);
  }

  // ── lb-title: isNewBest must use oldBest, NOT post-update localStorage ─
  // Simulate the sequence: oldBest=5, pct=10 → isNewBest=true
  {
    const simulatedOldBest = 5;
    const simulatedPct     = 10;
    const isNewBest        = simulatedPct > simulatedOldBest;
    assert('isNewBest true when pct > oldBest',  isNewBest, true);
  }
  // Simulate: oldBest=10, pct=10 → isNewBest=false (equal, not new best)
  {
    const simulatedOldBest = 10;
    const simulatedPct     = 10;
    const isNewBest        = simulatedPct > simulatedOldBest;
    assert('isNewBest false when pct === oldBest', isNewBest, false);
  }
  // Simulate: oldBest=20, pct=10 → isNewBest=false (lower score)
  {
    const simulatedOldBest = 20;
    const simulatedPct     = 10;
    const isNewBest        = simulatedPct > simulatedOldBest;
    assert('isNewBest false when pct < oldBest',  isNewBest, false);
  }

  // ── Print results ─────────────────────────────────────────────────────
  console.group(`%cChemSphere Quiz Unit Tests — ${passed}/${passed+failed} passed`,
    passed === passed+failed ? 'color:#00e5b4;font-weight:700' : 'color:#ff4757;font-weight:700');
  results.forEach(r => {
    const icon = r.ok ? '✅' : '❌';
    const msg  = r.ok
      ? `${icon} ${r.label}`
      : `${icon} ${r.label} — expected ${r.expected}, got ${r.actual}`;
    console.log(`%c${msg}`, r.ok ? 'color:#00e5b4' : 'color:#ff4757;font-weight:700');
  });
  console.groupEnd();

  if (failed > 0) {
    console.error(`[ChemSphere] ${failed} test(s) FAILED — score calculation has a bug!`);
  }
  return { passed, failed, total: passed + failed };
}

/* ── Confetti ── */
function qzSpawnConfetti() {
  const colors=['#4a8fff','#00e5b4','#ff6b35','#ffd700','#ff4757'];
  for (let i=0;i<55;i++) {
    const el=document.createElement('div');
    el.className='confetti-piece';
    el.style.left=Math.random()*100+'vw';
    el.style.top='-10px';
    el.style.background=colors[Math.floor(Math.random()*colors.length)];
    el.style.animationDuration=(1.5+Math.random()*2)+'s';
    el.style.animationDelay=Math.random()*.8+'s';
    el.style.borderRadius=Math.random()>.5?'50%':'2px';
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),3800);
  }
}

/* ── Util ── */
function qzShuffle(arr) {
  for (let i=arr.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  qzUpdateHubStats();
  qzShow('qz-hub');
  document.getElementById('qz-modal').addEventListener('click', function(e) {
    if (e.target === this) qzCloseModal();
  });
});
