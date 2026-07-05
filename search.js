/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — search.js
   SEARCH, GRID & VIEW MODE
   Category grid rendering, view-mode switching (3d/2d/ionic/quiz), molecule lookup, and the race-condition-safe load orchestrator.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   GRID
════════════════════════════════════════ */
function pickCat(cat, btn) {
  curCat = cat;
  document.querySelectorAll('.ctb').forEach(t => t.classList.remove('on'));
  btn.classList.add('on');
  renderGrid(cat);
}
function renderGrid(cat) {
  const mols = DB[cat] || [];
  document.getElementById('mg').innerHTML = mols.map(m =>
    `<div class="mc${m.key === selKey ? ' sel' : ''}" data-key="${m.key}">
      <div class="mcf">${m.f}</div>
      <div class="mcn">${m.n}</div>
      <div class="mcs">${m.s}</div>
    </div>`
  ).join('');
}

/* ════════════════════════════════════════
   VIEW MODE
════════════════════════════════════════ */
const MODE_MAP = {
  '3d':    { dtab:'d3d', btab:'b3d' },
  '2d':    { dtab:'d2d', btab:'b2d' },
  'props': { dtab:'dpr', btab:'bpr' },
};

function setMode(mode) {
  curMode = mode;
  const is3d = mode === '3d';

  // Sync tab active states (desktop + mobile)
  Object.entries(MODE_MAP).forEach(([m, ids]) => {
    document.getElementById(ids.dtab)?.classList.toggle('on', m === mode);
    document.getElementById(ids.btab)?.classList.toggle('on', m === mode);
  });

  // Show/hide panels
  document.getElementById('p3d').style.display  = is3d ? 'block' : 'none';
  document.getElementById('p2d').classList.toggle('on', mode === '2d');
  document.getElementById('ppr').classList.toggle('on', mode === 'props');
  document.getElementById('s3d').style.display  = is3d ? 'block' : 'none';
  document.getElementById('vc').style.display   = is3d ? 'flex'  : 'none';

  // 3D-only overlays
  ['edu-card','atom-legend','hint-bar','edu-highlight','bond-angle-svg','ba-reason'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!is3d) el.classList.remove('v');
    el.style.display = is3d ? '' : 'none';
  });

  // Show/hide right panel and bottom sheet on mode switch
  const rp = document.getElementById('edu-right-panel');
  if (rp) {
    if (!is3d || pmodeOn || window.innerWidth < 768) rp.classList.remove('v');
    else if (is3d && curMeta) updateEduRightPanel(curMeta, curMeta._key || null);
  }
  const bs = document.getElementById('edu-bottom-sheet');
  if (bs) {
    if (!is3d || pmodeOn || window.innerWidth >= 768) {
      bs.classList.remove('bs-visible', 'bs-expanded');
      _bsExpanded = false;
    } else if (is3d && curMeta) updateEduBottomSheet(curMeta, curMeta._key || null);
  }
  // Learning Insights only shown in sidebar (always visible if present)
  // but clear bond-angle reason on mode switch
  if (!is3d) {
    const r = document.getElementById('ba-reason');
    if (r) r.classList.remove('v');
  }

  if (window.innerWidth < 768) closeMolScreen();

  // Panels are pre-loaded by go() for all modes simultaneously.
  // No lazy load needed here — switching tabs is instant.
}

/* ════════════════════════════════════════
   LOAD MOLECULES
════════════════════════════════════════ */
function findMeta(key) {
  for (const arr of Object.values(DB)) {
    const m = arr.find(m => m.key === key);
    if (m) return m;
  }
  return null;
}

function pickMol(key) {
  selKey = key;
  renderGrid(curCat);
  msRenderGrid(curCat); // keep mobile grid in sync
  const meta = findMeta(key);
  if (meta) meta._key = key;
  if (window.innerWidth < 768) closeMolScreen();
  go(meta ? meta.pname : key, meta);
  // Keep nav dock active pill in sync (no-op when dock is hidden)
  if (pmodeOn) {
    document.querySelectorAll('.pnd-pill').forEach(p => p.classList.toggle('active', p.dataset.key === key));
  }
}

function doSearch() {
  const val = document.getElementById('mol-in').value.trim();
  if (!val) return;
  selKey = null;
  renderGrid(curCat);
  clearErr();
  if (window.innerWidth < 768) closeMolScreen();
  go(val, null);
}

/* ════════════════════════════════════════
   NCI CACTUS helper
════════════════════════════════════════ */
async function cactus(name, rep) {
  const url = `${CACTUS}/${encodeURIComponent(name)}/${rep}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const txt = await res.text();
  if (!txt || txt.includes('Page not found') || !txt.trim()) throw new Error('Not found');
  return txt.trim();
}

/* ════════════════════════════════════════
   MAIN ORCHESTRATOR — race-condition safe
════════════════════════════════════════ */
async function go(query, meta) {
  const tk = ++token;   // unique token; stale calls are silently dropped

  showLoad(true, query, 'RESOLVING MOLECULE…');
  clearErr();
  document.getElementById('emp').style.display = 'none';
  curQ = query;
  curMeta = meta;

  try {
    // Verify exists on Cactus & get IUPAC name
    const iupac = await cactus(query, 'iupac_name').catch(() => null);
    if (tk !== token) return;

    // ── Load ALL panels simultaneously ────────────────────────────────────
    // Each panel loads independently in parallel so switching tabs is instant.
    // do3D / load2D / loadProps each check (tk !== token) internally where
    // needed; we suppress individual panel errors silently — only the active
    // panel error is surfaced to the user.
    const results = await Promise.allSettled([
      do3D(query, tk),
      load2D(query),
      loadProps(query, meta),
    ]);
    if (tk !== token) return;

    // Surface error only if the ACTIVE panel failed
    const panelIdx = { '3d': 0, '2d': 1, 'props': 2 };
    const activeIdx = panelIdx[curMode] ?? 0;
    if (results[activeIdx].status === 'rejected') {
      throw results[activeIdx].reason;
    }
    // ─────────────────────────────────────────────────────────────────────

    // Fill sidebar info card
    if (meta) fillInfo(meta);
    else      await liveMeta(query, iupac);

    // Update badge
    document.getElementById('bnm').textContent = meta ? meta.n : (iupac || query);
    document.getElementById('bdg').classList.add('v');

  } catch(err) {
    if (tk !== token) return;
    showErr(`"${query}" not found. Try: water, caffeine, aspirin, benzene.`);
    document.getElementById('emp').style.display = 'flex';
  } finally {
    if (tk === token) showLoad(false);
  }
}

