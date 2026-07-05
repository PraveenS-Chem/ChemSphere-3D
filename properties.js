/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — properties.js
   PROPERTIES & 3D STYLE
   Molecule property/meta lookups, info-card population, and 3D style/rotation controls (applyStyle, togRot, resetV, zoomV).
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   PROPERTIES
════════════════════════════════════════ */
async function loadProps(query, meta) {
  document.getElementById('prt').textContent = meta ? meta.n : query;
  document.getElementById('prg').innerHTML   = '<div style="font-family:var(--fn);font-size:10px;color:var(--di);padding:8px">Fetching…</div>';

  const fields = [
    {label:'Molecular Formula',  key:'formula'},
    {label:'Molecular Weight',   key:'mw'},
    {label:'IUPAC Name',         key:'iupac_name'},
    {label:'SMILES',             key:'smiles'},
    {label:'InChIKey',           key:'stdinchikey'},
    {label:'LogP (est.)',        key:'xlogp2'},
    {label:'H-Bond Donors',      key:'h_bond_donor_count'},
    {label:'H-Bond Acceptors',   key:'h_bond_acceptor_count'},
    {label:'Rotatable Bonds',    key:'rotatable_bond_count'},
    {label:'Heavy Atom Count',   key:'heavy_atom_count'},
  ];

  const results = await Promise.allSettled(fields.map(f => cactus(query, f.key)));

  document.getElementById('prg').innerHTML = fields.map((f, i) => {
    const val      = results[i].status === 'fulfilled' ? results[i].value : '—';
    const small    = val.length > 25;
    const tiny     = val.length > 40;
    const fs       = tiny ? '11px' : small ? '13px' : '16px';
    const copyable = ['SMILES','InChIKey','IUPAC Name'].includes(f.label) && val !== '—';
    const safe     = val.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    return `<div class="prc">
      <div class="prcl">${f.label}</div>
      <div class="prcv" style="font-size:${fs}">${val}</div>
      ${copyable ? `<button class="cpy" onclick="doCopy('${safe}','${f.label}')">⎘ Copy</button>` : ''}
    </div>`;
  }).join('');
}

/* ════════════════════════════════════════
   LIVE META (for searched molecules)
════════════════════════════════════════ */
async function liveMeta(query, iupac) {
  try {
    const [formula, mw] = await Promise.all([
      cactus(query, 'formula').catch(() => '—'),
      cactus(query, 'mw').catch(() => '—'),
    ]);
    fillInfo({
      n: iupac || query,
      f: formula.replace(/([0-9]+)/g, '<sub>$1</sub>'),
      w: mw, h: '—', a: '—', d: '—',
      g: 'Apply VSEPR theory based on electron pairs around the central atom.',
      x: 'Search powered by NCI Cactus. For exam details refer to NCERT.',
    });
  } catch {
    fillInfo({ n: query, f: '—', w: '—', h: '—', a: '—', d: '—', g: '—', x: '—' });
  }
}

/* ════════════════════════════════════════
   FILL INFO CARD
════════════════════════════════════════ */
function fillInfo(m) {
  document.getElementById('i-nm').textContent = m.n;
  document.getElementById('i-fm').innerHTML   = m.f;
  document.getElementById('i-wt').textContent = (m.w && m.w !== '—') ? (String(m.w).includes('g/mol') ? m.w : m.w + ' g/mol') : '—';
  document.getElementById('i-hy').textContent = m.h;
  document.getElementById('i-an').textContent = m.a;
  document.getElementById('i-dp').textContent = m.d;
  document.getElementById('i-go').textContent = m.g;
  document.getElementById('i-fc').textContent = m.x;
  document.getElementById('ic').classList.add('v');
  updateAtomLegend(m);

  // Hide overlays immediately on new molecule load, then fade in after delay
  clearTimeout(_overlayDelayTimer);
  document.getElementById('edu-card').classList.remove('v');
  document.getElementById('edu-highlight').classList.remove('v');
  document.getElementById('bond-angle-svg').classList.remove('v');

  _overlayDelayTimer = setTimeout(() => {
    const key = m._key || null;
    updateEduCardEnhanced(m, key);
    updateEduRightPanel(m, key);
    updateEduBottomSheet(m, key);
    if (key) {
      updateEduInsights(key);
      showEduHighlightEnhanced(key);
      showBondAngleEnhanced(key);
    }
    if (typeof pmodeOn !== 'undefined' && pmodeOn) updatePmodePanelEnhanced(m, key);
  }, OVERLAY_DELAY);
}

/* ════════════════════════════════════════
   3D STYLE & ROTATION
════════════════════════════════════════ */
function applyStyle() {
  if (!viewer || !model) return;
  const s = document.getElementById('sty').value;
  const c = document.getElementById('col').value;
  if (s === 'sphere') {
    model.setStyle({}, {
      sphere: { scale: 0.26, colorscheme: c },
      stick:  { radius: 0.10, colorscheme: c }
    });
  } else if (s === 'line') {
    model.setStyle({}, { line: { colorscheme: c } });
  } else {
    model.setStyle({}, { stick: { radius: 0.18, colorscheme: c } });
  }
  viewer.render();
}

/* ── Ionic 3D style ─────────────────────────────────────────────────────
   For ionic compounds: render ALL atoms as large spheres with explicit
   element colours so single-atom ions (Na⁺, K⁺, Ca²⁺, Cl⁻ etc.) are
   clearly visible against the dark background.
   Uses 3Dmol's per-element colour overrides.
─────────────────────────────────────────────────────────────────────────── */
function applyIonicStyle() {
  if (!viewer || !model) return;

  // Explicit bright colours for ions commonly invisible with default schemes
  const ionColours = {
    Na: 0xaaaaff,   // soft purple — alkali
    K:  0xcc88ff,   // violet
    Li: 0xcc4444,   // red-pink
    Ca: 0x44cc88,   // green — alkaline earth
    Mg: 0x22bb77,
    Ba: 0x44aaff,
    Fe: 0xff8844,   // orange
    Cu: 0x44ccff,   // cyan
    Zn: 0x88ccaa,
    Al: 0xaaaacc,
    // Anion-formers keep standard CPK
    O:  0xff4444,
    N:  0x4488ff,
    Cl: 0x00e5b4,
    F:  0x00e5b4,
    S:  0xffdd00,
    P:  0xff9900,
    C:  0xddddff,
    H:  0xffffff,
  };

  // Base style: large spheres for all atoms (makes single-atom ions visible)
  model.setStyle({}, {
    sphere: { scale: 0.55, colorscheme: 'Jmol' }
  });

  // Override colours per element with our bright palette
  Object.entries(ionColours).forEach(([elem, color]) => {
    model.setStyle({ elem }, {
      sphere: { scale: 0.55, color }
    });
  });

  // Covalent bonds within a fragment (e.g. O-H in OH⁻) — thin stick
  model.setStyle({}, {
    sphere: { scale: 0.55 },  // keep sphere
    stick:  { radius: 0.12, colorscheme: 'Jmol' }
  });

  // Re-apply element colours on top of stick (stick doesn't erase sphere in 3Dmol)
  Object.entries(ionColours).forEach(([elem, color]) => {
    model.setStyle({ elem }, {
      sphere: { scale: 0.55, color },
      stick:  { radius: 0.12, color }
    });
  });

  viewer.render();
}
function togRot() {
  rotating = document.getElementById('rot').checked;
  if (!viewer) return;
  if (rotating) {
    ROT.paused = false;
    ROT.start();
  } else {
    ROT.stop();
  }
}
function resetV() {
  if (!viewer) return;
  ROT.onInteract(); // brief pause so user can see the reset orientation
  viewer.zoomTo();
  viewer.render();
}
function zoomV(f) {
  if (!viewer) return;
  ROT.onInteract();
  viewer.zoom(f, 500);
}

