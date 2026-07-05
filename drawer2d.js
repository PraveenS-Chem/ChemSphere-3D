/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — drawer2d.js
   2D STRUCTURE DRAWING
   SmilesDrawer-based 2D SVG rendering, static SVG fallbacks, and pinch/zoom controls.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   2D SVG — SmilesDrawer v2.x
   ─────────────────────────────────────
   ROOT CAUSE OF ORIGINAL BUG (fixed here):
   The previous code used SmilesDrawer v2.x but called the v1 API:
     SmilesDrawer.parse(smiles, successCb, errorCb)   ← v1 callback style
   In v2, parse() is Promise-based and ignores callback arguments entirely.
   The inner Promise therefore never resolved → catch block fired → "unavailable".

   FIX — two-part:
   1. Use SmilesDrawer.SmiDrawer (v2 high-level class) which accepts a raw
      SMILES string directly, no separate parse() step needed.
   2. Embed a SMILES lookup table for all 43 DB molecules so no Cactus
      round-trip is needed for known molecules (eliminates CORS/mobile fetch
      failures as a secondary failure path). Unknown searched molecules still
      fall back to Cactus.
════════════════════════════════════════ */

/* ── Embedded SMILES for all DB molecules ──────────────────────────────── */
const SMILES_DB = {
  /* Only molecules SmilesDrawer renders correctly (multi-atom, standard valence) */
  'carbon dioxide':           'O=C=O',
  'boron trifluoride':        'FB(F)F',
  'benzene':                  'c1ccccc1',
  'ethanol':                  'CCO',
  'acetone':                  'CC(=O)C',
  'acetic acid':              'CC(=O)O',
  'formaldehyde':             'C=O',
  'glucose':                  'OC[C@H]1OC(O)[C@H](O)[C@@H](O)[C@@H]1O',
  'adenine':                  'Nc1ncnc2[nH]cnc12',
  'cholesterol':              'CC(C)CCCC(C)[C@H]1CC[C@@H]2[C@@H]1CC=C3C[C@@H](O)CC[C@]23C',
  'alanine':                  'C[C@H](N)C(=O)O',
  'sulfuric acid':            'OS(=O)(=O)O',
  'nitric acid':              'O[N+](=O)[O-]',
  'phosphoric acid':          'OP(=O)(O)O',
  'nitrogen trifluoride':     'FN(F)F',
  'oxygen difluoride':        'FOF',
  'sulfur dioxide':           'O=S=O',
  'sulfur trioxide':          'O=S(=O)=O',
  'hydrogen peroxide':        'OO',
  'nitrous oxide':            '[N-]=[N+]=O',
  'carbonic acid':            'OC(=O)O',
  'ethene':                   'C=C',
  'ethyne':                   'C#C',
  'urea':                     'NC(=O)N',
};

/* ── Static SVG for all molecules SmilesDrawer cannot render correctly ───
   Covers: (1) hypervalent/noble-gas atoms, (2) single-atom molecules,
   (3) diatomics with no bond graph, (4) exotic bonding (diborane).
   Geometry labels match NCERT/VSEPR content exactly.
─────────────────────────────────────────────────────────────────────────── */
const STATIC_SVG = (() => {
  /* Palette */
  const Cw = '#dde8ff';   // C / white-ish centre
  const Fg = '#00e5b4';   // F, Cl
  const Xp = '#aaaaff';   // Xe, noble gas
  const Be = '#ffaa44';   // Be, B
  const Pw = '#ff9944';   // P, S (warm)
  const Hw = '#5a6e96';   // H, lone pairs, labels
  const Nb = '#4a8fff';   // N, bonds
  const bd = '#4a8fff';   // bond colour

  const cx=250, cy=185;   // canvas centre

  /* ── Helpers ── */
  const svg = body =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 360"
          style="width:100%;height:auto;display:block">
       <style>.lbl{font-family:'JetBrains Mono',monospace;font-weight:700;
         text-anchor:middle;dominant-baseline:central}
         line{stroke-width:2.5;stroke-linecap:round}</style>
       ${body}
     </svg>`;

  const atom = (x,y,col,sym,r=22) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${col}" fill-opacity="0.15"
             stroke="${col}" stroke-width="1.5"/>
     <text x="${x}" y="${y}" class="lbl" font-size="17" fill="${col}">${sym}</text>`;

  const bond = (x1,y1,x2,y2,col=bd) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${col}"/>`;

  const dbl = (x1,y1,x2,y2,col=bd) => {
    const dx=y2-y1, dy=x1-x2, len=Math.hypot(dx,dy)||1, ox=dx/len*3, oy=dy/len*3;
    return `<line x1="${x1-ox}" y1="${y1-oy}" x2="${x2-ox}" y2="${y2-oy}" stroke="${col}"/>
            <line x1="${x1+ox}" y1="${y1+oy}" x2="${x2+ox}" y2="${y2+oy}" stroke="${col}"/>`;
  };

  const lp = (x,y,col=Hw) =>
    `<circle cx="${x-4}" cy="${y}" r="2.5" fill="${col}"/>
     <circle cx="${x+4}" cy="${y}" r="2.5" fill="${col}"/>`;

  const geo = txt =>
    `<text x="${cx}" y="340" class="lbl" font-size="11" fill="${Hw}">${txt}</text>`;

  /* ── Single atoms / diatomics ── */

  const singleAtom = (col, sym, formula, label) => svg(`
    ${atom(cx,cy,col,sym,32)}
    <text x="${cx}" y="${cy+55}" class="lbl" font-size="13" fill="${Hw}">${formula}</text>
    ${geo(label)}
  `);

  const diatomic = (col1,sym1,col2,sym2,formula,label,dblBond=false) => svg(`
    ${dblBond ? dbl(cx-60,cy,cx+60,cy) : bond(cx-60,cy,cx+60,cy)}
    ${atom(cx-72,cy,col1,sym1)} ${atom(cx+72,cy,col2,sym2)}
    <text x="${cx}" y="${cy+55}" class="lbl" font-size="13" fill="${Hw}">${formula}</text>
    ${geo(label)}
  `);

  return {

    /* ── Single-atom / trivial molecules ─────────── */
    'methane': svg(`
      ${bond(cx,cy,cx,cy-80)} ${bond(cx,cy,cx,cy+80)}
      ${bond(cx,cy,cx-80,cy)} ${bond(cx,cy,cx+80,cy)}
      ${atom(cx,cy,Cw,'C',24)}
      ${atom(cx,cy-92,Hw,'H',18)} ${atom(cx,cy+92,Hw,'H',18)}
      ${atom(cx-92,cy,Hw,'H',18)} ${atom(cx+92,cy,Hw,'H',18)}
      ${geo('Tetrahedral · sp³ · 109.5°')}
    `),

    'ammonia': svg(`
      ${bond(cx,cy,cx,cy-85)}
      ${bond(cx,cy,cx-74,cy+48)} ${bond(cx,cy,cx+74,cy+48)}
      ${atom(cx,cy,Nb,'N',24)}
      ${atom(cx,cy-97,Hw,'H',18)}
      ${atom(cx-86,cy+56,Hw,'H',18)} ${atom(cx+86,cy+56,Hw,'H',18)}
      ${lp(cx,cy-26)}
      ${geo('Trigonal Pyramidal · sp³ · 107°')}
    `),

    'water': svg(`
      ${bond(cx,cy,cx-70,cy+65)} ${bond(cx,cy,cx+70,cy+65)}
      ${atom(cx,cy,'#ff6b6b','O',24)}
      ${atom(cx-82,cy+75,Hw,'H',18)} ${atom(cx+82,cy+75,Hw,'H',18)}
      ${lp(cx-18,cy-22)} ${lp(cx+18,cy-22)}
      ${geo('Bent (V-shape) · sp³ · 104.5°')}
    `),

    'hydrogen fluoride': diatomic(Hw,'H',Fg,'F','H–F','Linear diatomic · sp³ · 180°'),
    'hydrogen chloride': diatomic(Hw,'H',Fg,'Cl','H–Cl','Linear diatomic · sp³ · 180°'),
    'phosphine': svg(`
      ${bond(cx,cy,cx,cy-85)}
      ${bond(cx,cy,cx-74,cy+48)} ${bond(cx,cy,cx+74,cy+48)}
      ${atom(cx,cy,Pw,'P',24)}
      ${atom(cx,cy-97,Hw,'H',18)}
      ${atom(cx-86,cy+56,Hw,'H',18)} ${atom(cx+86,cy+56,Hw,'H',18)}
      ${lp(cx,cy-26)}
      ${geo('Trigonal Pyramidal · sp³ · 93.5°')}
    `),

    /* ── Hypervalent / noble-gas molecules ────────── */

    'xenon tetrafluoride': svg(`
      ${bond(cx,cy,cx,cy-90)} ${bond(cx,cy,cx,cy+90)}
      ${bond(cx,cy,cx-90,cy)} ${bond(cx,cy,cx+90,cy)}
      ${atom(cx,cy,Xp,'Xe',26)}
      ${atom(cx,cy-102,Fg,'F')} ${atom(cx,cy+102,Fg,'F')}
      ${atom(cx-102,cy,Fg,'F')} ${atom(cx+102,cy,Fg,'F')}
      ${lp(cx-34,cy-10)} ${lp(cx+34,cy-10)}
      ${geo('Square Planar · sp³d² · 90°')}
    `),

    'xenon difluoride': svg(`
      ${bond(cx,cy,cx-110,cy)} ${bond(cx,cy,cx+110,cy)}
      ${atom(cx,cy,Xp,'Xe',26)}
      ${atom(cx-122,cy,Fg,'F')} ${atom(cx+122,cy,Fg,'F')}
      ${lp(cx-6,cy-34)} ${lp(cx-6,cy+34)}
      ${lp(cx+6,cy-34)} ${lp(cx+6,cy+34)}
      ${geo('Linear · sp³d · 180°')}
    `),

    'sulfur hexafluoride': svg(`
      ${bond(cx,cy,cx,cy-90)}   ${bond(cx,cy,cx,cy+90)}
      ${bond(cx,cy,cx-90,cy)}   ${bond(cx,cy,cx+90,cy)}
      ${bond(cx,cy,cx-55,cy-55)} ${bond(cx,cy,cx+55,cy+55)}
      ${atom(cx,cy,'#ffd700','S',24)}
      ${atom(cx,cy-102,Fg,'F')}  ${atom(cx,cy+102,Fg,'F')}
      ${atom(cx-102,cy,Fg,'F')}  ${atom(cx+102,cy,Fg,'F')}
      ${atom(cx-67,cy-67,Fg,'F')} ${atom(cx+67,cy+67,Fg,'F')}
      ${geo('Octahedral · sp³d² · 90°')}
    `),

    'phosphorus pentachloride': svg(`
      ${bond(cx,cy,cx,cy-90)}
      ${bond(cx,cy,cx,cy+90)}
      ${bond(cx,cy,cx-90,cy+26)}
      ${bond(cx,cy,cx+90,cy+26)}
      ${bond(cx,cy,cx,cy+52)}
      ${atom(cx,cy,Pw,'P',24)}
      ${atom(cx,cy-102,Fg,'Cl',26)}
      ${atom(cx,cy+102,Fg,'Cl',26)}
      ${atom(cx-104,cy+26,Fg,'Cl',26)}
      ${atom(cx+104,cy+26,Fg,'Cl',26)}
      ${atom(cx,cy+66,Fg,'Cl',26)}
      ${geo('Trig. Bipyramidal · sp³d · 90°/120°')}
    `),

    'chlorine trifluoride': svg(`
      ${bond(cx,cy,cx,cy-88)}
      ${bond(cx,cy,cx,cy+88)}
      ${bond(cx,cy,cx+88,cy)}
      ${atom(cx,cy,Fg,'Cl',24)}
      ${atom(cx,cy-100,Fg,'F')} ${atom(cx,cy+100,Fg,'F')}
      ${atom(cx+100,cy,Fg,'F')}
      ${lp(cx-30,cy-12)} ${lp(cx-30,cy+12)}
      ${geo('T-shaped · sp³d · 87.5°')}
    `),

    'beryllium chloride': svg(`
      ${bond(cx,cy,cx-110,cy)} ${bond(cx,cy,cx+110,cy)}
      ${atom(cx,cy,Be,'Be',22)}
      ${atom(cx-124,cy,Fg,'Cl',26)} ${atom(cx+124,cy,Fg,'Cl',26)}
      ${geo('Linear · sp · 180°')}
    `),

    'diborane': (() => {
      const B1x=cx-72, B2x=cx+72, By=cy;
      const Hbx=cx, Hb1y=cy-50, Hb2y=cy+50;
      return svg(`
        ${bond(B1x,By,Hbx,Hb1y)} ${bond(B2x,By,Hbx,Hb1y)}
        ${bond(B1x,By,Hbx,Hb2y)} ${bond(B2x,By,Hbx,Hb2y)}
        ${bond(B1x,By,B1x-58,By-44)} ${bond(B1x,By,B1x-58,By+44)}
        ${bond(B2x,By,B2x+58,By-44)} ${bond(B2x,By,B2x+58,By+44)}
        ${atom(B1x,By,Be,'B',20)}   ${atom(B2x,By,Be,'B',20)}
        ${atom(Hbx,Hb1y,Hw,'H',16)} ${atom(Hbx,Hb2y,Hw,'H',16)}
        ${atom(B1x-68,By-50,Hw,'H',16)} ${atom(B1x-68,By+50,Hw,'H',16)}
        ${atom(B2x+68,By-50,Hw,'H',16)} ${atom(B2x+68,By+50,Hw,'H',16)}
        ${geo('3c-2e Banana bonds · sp³ B')}
      `);
    })(),

    /* ── Tetrahedral halomethanes (SmilesDrawer fails on multi-Cl SMILES) ── */

    'chloroform': (() => {
      // CHCl3 — tetrahedral: H on top, 3 Cl in trigonal base
      // 2D projection: C centre, H up, Cl at 210°/330°/90°+offset shown as wedge/dash
      // Simplified flat projection: C centre, H at top, 3 Cl arranged below
      const d = 92;
      return svg(`
        ${bond(cx, cy, cx, cy-d)}
        ${bond(cx, cy, cx-d*0.87, cy+d*0.5)}
        ${bond(cx, cy, cx+d*0.87, cy+d*0.5)}
        ${bond(cx, cy, cx, cy+d*0.4)}
        ${atom(cx, cy, Cw, 'C', 22)}
        ${atom(cx, cy-d-12, Hw, 'H', 18)}
        ${atom(cx-d*0.87-14, cy+d*0.5, Fg, 'Cl', 24)}
        ${atom(cx+d*0.87+14, cy+d*0.5, Fg, 'Cl', 24)}
        ${atom(cx, cy+d*0.4+28, Fg, 'Cl', 24)}
        ${geo('Tetrahedral · sp³ · 109.5°')}
      `);
    })(),

    'carbon tetrachloride': (() => {
      // CCl4 — tetrahedral: C centre, 4 Cl
      const d = 95;
      return svg(`
        ${bond(cx, cy, cx, cy-d)}
        ${bond(cx, cy, cx-d*0.87, cy+d*0.5)}
        ${bond(cx, cy, cx+d*0.87, cy+d*0.5)}
        ${bond(cx, cy, cx, cy+d*0.55)}
        ${atom(cx, cy, Cw, 'C', 22)}
        ${atom(cx, cy-d-14, Fg, 'Cl', 24)}
        ${atom(cx-d*0.87-14, cy+d*0.5, Fg, 'Cl', 24)}
        ${atom(cx+d*0.87+14, cy+d*0.5, Fg, 'Cl', 24)}
        ${atom(cx, cy+d*0.55+28, Fg, 'Cl', 24)}
        ${geo('Tetrahedral · sp³ · 109.5°')}
      `);
    })(),

    'phosphorus trichloride': svg(`
      ${bond(cx,cy,cx,cy-88)}
      ${bond(cx,cy,cx-76,cy+50)} ${bond(cx,cy,cx+76,cy+50)}
      ${atom(cx,cy,Pw,'P',24)}
      ${atom(cx,cy-102,Fg,'Cl',24)}
      ${atom(cx-90,cy+60,Fg,'Cl',24)} ${atom(cx+90,cy+60,Fg,'Cl',24)}
      ${lp(cx,cy-26)}
      ${geo('Trigonal Pyramidal · sp³ · 100°')}
    `),

    /* ── Radical / resonance molecules ────────────────────────────────── */

    'nitrogen dioxide': svg(`
      ${bond(cx,cy,cx-80,cy+55,bd,true)}
      ${bond(cx,cy,cx+80,cy+55,bd,false)}
      ${atom(cx,cy,Nb,'N',24)}
      ${atom(cx-93,cy+65,'#ff6b6b','O',22)}
      ${atom(cx+93,cy+65,'#ff6b6b','O',22)}
      ${lp(cx-4,cy-30)}
      <text x="${cx+10}" y="${cy-36}" font-family="'JetBrains Mono',monospace"
            font-size="13" fill="#5a6e96" dominant-baseline="central">•</text>
      ${geo('Bent · sp² · 134° · radical')}
    `),

    'ozone': svg(`
      ${bond(cx,cy,cx-80,cy+55,bd,true)}
      ${bond(cx,cy,cx+80,cy+55,bd,false)}
      ${atom(cx,cy,'#ff6b6b','O',24)}
      ${atom(cx-93,cy+65,'#ff6b6b','O',22)}
      ${atom(cx+93,cy+65,'#ff6b6b','O',22)}
      ${lp(cx-6,cy-28)} ${lp(cx+22,cy-10)}
      ${geo('Bent · sp² · 117° · resonance')}
    `),

  };
})();

/* ── Generic ionic 2D renderer ─────────────────────────────────────────────
   Intercepts disconnected SMILES (containing '.') BEFORE SmilesDrawer sees them.
   Parses each fragment's atom symbol and charge, renders as styled ion labels
   in ChemSphere's dark palette with proper charge superscripts.
   Works for any ionic compound: NaOH, NaCl, KBr, MgO, CaCO3, etc.
─────────────────────────────────────────────────────────────────────────── */
function renderIonicSvg(smiles) {
  // Parse each fragment from dot-separated SMILES
  const fragments = smiles.split('.').map(f => f.trim()).filter(Boolean);

  // Extract atom symbol and charge from a SMILES fragment
  function parseFragment(frag) {
    // Match bracket atoms: [Na+], [OH-], [Ca2+], [SO4 2-], [NH4+]
    const bracketMatch = frag.match(/^\[([A-Z][a-z]?)(\d*)(H\d*)?([+-]\d*|[+-])?\]$/);
    if (bracketMatch) {
      const sym = bracketMatch[1];
      const charge = bracketMatch[4] || '';
      // Format charge: '+' → '⁺', '-' → '⁻', '2+' → '²⁺' etc
      const chargeStr = charge
        .replace('2+','²⁺').replace('3+','³⁺').replace('+','⁺')
        .replace('2-','²⁻').replace('3-','³⁻').replace('-','⁻');
      return { sym, chargeStr, isSimple: true };
    }
    // For multi-atom fragments like [OH-], CO3, etc — show condensed formula
    // Strip brackets and charges to get readable formula
    let formula = frag
      .replace(/\[/g,'').replace(/\]/g,'')
      .replace(/[0-9]?\+[0-9]?/g,'⁺').replace(/[0-9]?\-[0-9]?/g,'⁻')
      .replace(/#/g,'').replace(/\//g,'').replace(/\\/g,'')
      .replace(/\(/g,'').replace(/\)/g,'')
      .replace(/=/g,'');
    // Collapse atom+count for subscript display — keep as-is for SVG text
    return { sym: formula, chargeStr: '', isSimple: false, raw: true };
  }

  const ions = fragments.map(parseFragment);
  const n = ions.length;
  const spacing = Math.min(160, 320 / n);
  const startX = 250 - (spacing * (n - 1)) / 2;

  // Colour map for common ions
  const ionColour = sym => {
    const s = sym.toUpperCase();
    if (['NA','K','LI','CS','RB'].includes(s))  return '#aaaaff';  // alkali
    if (['MG','CA','BA','SR'].includes(s))       return '#ffaa44';  // alkaline earth
    if (['CL','BR','I','F'].includes(s))         return '#00e5b4';  // halide
    if (s === 'O' || s.startsWith('O'))          return '#ff6b6b';  // oxide/hydroxide
    if (s === 'N' || s.startsWith('N'))          return '#4a8fff';  // nitrogen
    if (s === 'S' || s.startsWith('S'))          return '#ffd700';  // sulfur
    return '#dde8ff';  // default
  };

  const ionSvgs = ions.map((ion, i) => {
    const x = startX + i * spacing;
    const col = ionColour(ion.sym);
    const symLen = ion.sym.length;
    const fontSize = symLen <= 2 ? 36 : symLen <= 4 ? 26 : 20;
    const r = Math.max(28, symLen * 9);
    return `
      <circle cx="${x}" cy="190" r="${r}" fill="${col}" fill-opacity="0.12" stroke="${col}" stroke-width="1.2"/>
      <text x="${x}" y="196" font-family="'JetBrains Mono',monospace" font-weight="700"
            font-size="${fontSize}" fill="${col}" text-anchor="middle" dominant-baseline="central">${ion.sym}</text>
      ${ion.chargeStr ? `<text x="${x+r-6}" y="${190-r+10}" font-size="18" fill="${col}"
            font-family="'JetBrains Mono',monospace" font-weight="700" text-anchor="middle">${ion.chargeStr}</text>` : ''}
      ${i < n-1 ? `<text x="${x + spacing/2}" y="196" font-size="22" fill="#3a4a6a"
            text-anchor="middle" dominant-baseline="central" font-family="sans-serif">···</text>` : ''}
    `;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 380"
               style="width:100%;height:auto;display:block;background:transparent">
    ${ionSvgs}
    <text x="250" y="340" font-family="'JetBrains Mono',monospace" font-size="11"
          fill="#5a6e96" text-anchor="middle">Ionic compound · electrostatic attraction</text>
  </svg>`;
}
const SD_OPTIONS = {
  width:           500,
  height:          380,
  bondThickness:   1.6,
  fontSizeLarge:   8,
  fontSizeSmall:   6,
  shortBondLength: 0.85,
  bondLength:      30,
  themes: {
    dark: {
      C:          '#dde8ff',
      O:          '#ff6b6b',
      N:          '#4a8fff',
      F:          '#00e5b4',
      CL:         '#00e5b4',
      BR:         '#ff9944',
      I:          '#aa44ff',
      P:          '#ff9944',
      S:          '#ffd700',
      B:          '#ffaa44',
      SI:         '#aaaaff',
      H:          '#5a6e96',
      BACKGROUND: 'transparent',
    }
  }
};

/* ── SMILES / SVG resolution ────────────────────────────────────────────
   Priority: 1) static SVG (hypervalent molecules), 2) SMILES_DB,
             3) session cache, 4) Cactus API fallback
─────────────────────────────────────────────────────────────────────────── */
const _smilesCache = new Map();

function resolveStatic(query) {
  return STATIC_SVG[query.toLowerCase().trim()] || null;
}

async function resolveSmiles(query) {
  const key = query.toLowerCase().trim();
  if (SMILES_DB[key]) {
    console.log(`[ChemSphere 2D] SMILES from DB for "${query}":`, SMILES_DB[key]);
    return SMILES_DB[key];
  }
  if (_smilesCache.has(query)) {
    console.log(`[ChemSphere 2D] SMILES from cache for "${query}":`, _smilesCache.get(query));
    return _smilesCache.get(query);
  }
  console.log(`[ChemSphere 2D] Fetching SMILES from Cactus for "${query}"…`);
  const smiles = await cactus(query, 'smiles');
  console.log(`[ChemSphere 2D] Cactus returned SMILES for "${query}":`, smiles);
  _smilesCache.set(query, smiles);
  return smiles;
}

/* ── Core render — SmilesDrawer v2 SmiDrawer API ────────────────────────
   Uses SmilesDrawer.SmiDrawer (high-level v2 class).
   draw() accepts a raw SMILES string and returns a Promise.
─────────────────────────────────────────────────────────────────────────── */
async function _sdRender(smiles, canvasEl) {
  console.log(`[ChemSphere 2D] Rendering SMILES:`, smiles);
  if (typeof SmilesDrawer === 'undefined') throw new Error('SmilesDrawer not loaded');
  if (!canvasEl.id) canvasEl.id = 'sd-canvas';
  const sd = new SmilesDrawer.SmiDrawer(SD_OPTIONS);
  await sd.draw(smiles, '#' + canvasEl.id, 'dark', false);
  console.log(`[ChemSphere 2D] Render SUCCESS for:`, smiles);
}

/* ── Zoom state ─────────────────────────────────────────────────────────── */
const _sdZoom = { scale: 1, min: 0.5, max: 3.0, step: 0.25 };

function _sdApplyZoom() {
  const c = document.getElementById('sd-canvas');
  if (!c) return;
  c.style.transform       = `scale(${_sdZoom.scale})`;
  c.style.transformOrigin = 'center center';
  const natural = c.offsetHeight / _sdZoom.scale;
  c.parentElement.style.height =
    Math.min(natural * _sdZoom.scale, window.innerHeight * 0.65) + 'px';
  document.getElementById('sd-zreset').textContent =
    _sdZoom.scale === 1 ? '1:1' : Math.round(_sdZoom.scale * 100) + '%';
}

function _sdZoomBy(delta) {
  _sdZoom.scale = Math.min(_sdZoom.max, Math.max(_sdZoom.min, _sdZoom.scale + delta));
  _sdApplyZoom();
}

function _sdInitZoomButtons() {
  const zi = document.getElementById('sd-zin');
  const zo = document.getElementById('sd-zout');
  const zr = document.getElementById('sd-zreset');
  if (zi && !zi._sdWired) {
    zi.addEventListener('click', () => _sdZoomBy(+_sdZoom.step));
    zo.addEventListener('click', () => _sdZoomBy(-_sdZoom.step));
    zr.addEventListener('click', () => { _sdZoom.scale = 1; _sdApplyZoom(); });
    zi._sdWired = true;
  }
}

function _sdInitPinch() {
  const canvas = document.getElementById('sd-canvas');
  if (!canvas || canvas._sdPinch) return;
  let initDist = null, initScale = 1;
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      initDist  = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                             e.touches[0].clientY - e.touches[1].clientY);
      initScale = _sdZoom.scale;
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && initDist) {
      e.preventDefault();
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX,
                              e.touches[0].clientY - e.touches[1].clientY);
      _sdZoom.scale = Math.min(_sdZoom.max,
                     Math.max(_sdZoom.min, initScale * (dist / initDist)));
      _sdApplyZoom();
    }
  }, { passive: false });
  canvas.addEventListener('touchend', () => { initDist = null; }, { passive: true });
  canvas._sdPinch = true;
}

/* ── Main entry point called by go() ────────────────────────────────────── */
async function load2D(query) {
  const frame  = document.getElementById('f2d');
  const sp     = document.getElementById('sp2');
  const lbl    = document.getElementById('l2d');
  const canvas = document.getElementById('sd-canvas');

  console.log(`[ChemSphere 2D] load2D called for: "${query}"`);

  // Reset UI — remove previous static SVG or error injections
  frame.querySelectorAll('.sd-err, .sd-static').forEach(el => el.remove());
  canvas.style.display = 'block';
  frame.classList.remove('rdy');
  frame.style.height = '';
  sp.style.display   = 'block';
  lbl.textContent    = 'Generating 2D structure…';
  _sdZoom.scale      = 1;

  _sdInitZoomButtons();

  try {
    // ── PATH A: static SVG for hypervalent / noble-gas molecules ──────────
    const staticSvg = resolveStatic(query);
    if (staticSvg) {
      console.log(`[ChemSphere 2D] Using static SVG for "${query}"`);
      // Hide the canvas, inject SVG div instead
      canvas.style.display = 'none';
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      const svgDiv = document.createElement('div');
      svgDiv.className = 'sd-static';
      svgDiv.style.cssText = 'width:100%;padding:12px;box-sizing:border-box';
      svgDiv.innerHTML = staticSvg;
      frame.insertBefore(svgDiv, frame.firstChild);
      frame.classList.add('rdy');
      sp.style.display = 'none';
      lbl.textContent  = `${query} · 2D · SVG`;
      _sdInitPinch();
      console.log(`[ChemSphere 2D] Static SVG render SUCCESS for "${query}"`);
      return;
    }

    // ── PATH B: SmilesDrawer for standard-valence molecules ───────────────
    canvas.style.display = 'block';
    const smiles = await resolveSmiles(query);
    if (!smiles || !smiles.trim()) throw new Error('Empty SMILES returned');

    // ── PATH B1: Ionic intercept — dot-SMILES means disconnected fragments ─
    // SmilesDrawer renders these as floating formula text (Na⁺  O⁻H).
    // Instead show our ionic SVG with charge labels and electrostatic notation.
    if (smiles.includes('.')) {
      console.log(`[ChemSphere 2D] Ionic SMILES detected for "${query}":`, smiles);
      canvas.style.display = 'none';
      const svgDiv = document.createElement('div');
      svgDiv.className = 'sd-static';
      svgDiv.style.cssText = 'width:100%;padding:12px;box-sizing:border-box';
      svgDiv.innerHTML = renderIonicSvg(smiles);
      frame.insertBefore(svgDiv, frame.firstChild);
      frame.classList.add('rdy');
      sp.style.display = 'none';
      lbl.textContent  = `${query} · 2D · Ionic`;
      _sdInitPinch();
      console.log(`[ChemSphere 2D] Ionic SVG render SUCCESS for "${query}"`);
      return;
    }

    await _sdRender(smiles, canvas);
    frame.classList.add('rdy');
    sp.style.display = 'none';
    lbl.textContent  = `${query} · 2D · SVG`;
    _sdApplyZoom();
    _sdInitPinch();

  } catch (err) {
    console.error(`[ChemSphere 2D] FAILED for "${query}":`, err);
    sp.style.display = 'none';
    canvas.style.display = 'none';
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    const errDiv = document.createElement('div');
    errDiv.className = 'sd-err';
    errDiv.innerHTML = `<span>⬡</span>2D structure unavailable for <strong>${query}</strong>.<br>Try a common name or IUPAC name.`;
    frame.appendChild(errDiv);
    frame.classList.add('rdy');
    lbl.textContent = '2D structure unavailable';
  }
}

