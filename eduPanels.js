/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — eduPanels.js
   EDUCATIONAL PANELS
   Atom color legend, desktop right panel, mobile bottom sheet, legacy overlay, and onboarding hints.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   ATOM COLOR LEGEND
════════════════════════════════════════ */
const ATOM_COLORS = {
  H:  { color:'#ffffff', label:'Hydrogen'  },
  C:  { color:'#888888', label:'Carbon'    },
  O:  { color:'#e84040', label:'Oxygen'    },
  N:  { color:'#4466ff', label:'Nitrogen'  },
  S:  { color:'#e0c030', label:'Sulfur'    },
  Cl: { color:'#22cc44', label:'Chlorine'  },
  F:  { color:'#88ee66', label:'Fluorine'  },
  P:  { color:'#ee8822', label:'Phosphorus'},
  Xe: { color:'#aa44dd', label:'Xenon'     },
  B:  { color:'#ffbb44', label:'Boron'     },
  Na: { color:'#aa88ff', label:'Sodium'    },
  K:  { color:'#8866dd', label:'Potassium' },
  Ca: { color:'#66aaff', label:'Calcium'   },
  Fe: { color:'#dd6622', label:'Iron'      },
};

function updateAtomLegend(meta) {
  const legend = document.getElementById('atom-legend');
  const body   = document.getElementById('aleg-body');
  if (!meta) { legend.classList.remove('v'); return; }

  // Extract element symbols from formula string or use formula field
  // Parse elements present from meta.f (formula like H₂O, CH₄, NH₃…)
  const formula = meta.f || '';
  // Extract all capitalised element symbols (1-2 letter)
  const found = [];
  const seen  = new Set();
  // Strip subscript numbers (unicode subscripts + regular digits)
  const clean = formula.replace(/[₀-₉0-9]/g,'');
  const regex = /([A-Z][a-z]?)/g;
  let m;
  while ((m = regex.exec(clean)) !== null) {
    const sym = m[1];
    if (!seen.has(sym)) { seen.add(sym); found.push(sym); }
  }

  if (found.length === 0) { legend.classList.remove('v'); return; }

  body.innerHTML = found.map(sym => {
    const info = ATOM_COLORS[sym] || { color:'#aaaaaa', label: sym };
    return `<div class="aleg-row">
      <div class="aleg-dot" style="background:${info.color};box-shadow:0 0 5px ${info.color}44"></div>
      <span class="aleg-name">${info.label}</span>
    </div>`;
  }).join('');

  legend.classList.add('v');
  legend.classList.remove('collapsed');
}

function toggleLegend() {
  document.getElementById('atom-legend').classList.toggle('collapsed');
}

/* ════════════════════════════════════════
   DESKTOP RIGHT EDUCATIONAL PANEL
   Visible on desktop ≥768px in 3D mode.
════════════════════════════════════════ */
function updateEduRightPanel(meta, key) {
  const panel = document.getElementById('edu-right-panel');
  if (!panel) return;
  const isMobile = window.innerWidth < 768;
  const is3d = curMode === '3d';

  if (isMobile || !is3d || pmodeOn) {
    panel.classList.remove('v');
    return;
  }

  if (!meta || !meta.n) { panel.classList.remove('v'); return; }

  document.getElementById('erp-name').textContent    = meta.n || '—';
  document.getElementById('erp-formula').innerHTML   = meta.f || '—';
  document.getElementById('erp-hyb').textContent     = meta.h || '—';
  document.getElementById('erp-ang').textContent     = meta.a || '—';
  document.getElementById('erp-dip').textContent     = meta.d || '—';

  const geoCard  = document.getElementById('erp-geo-card');
  if (meta.g || meta.s) {
    document.getElementById('erp-geo').textContent      = meta.s || '—';
    document.getElementById('erp-geo-fact').textContent = meta.g || '';
    geoCard.style.display = '';
  } else { geoCard.style.display = 'none'; }

  const e = key ? EDU_CONTENT[key] : null;

  const polarCard = document.getElementById('erp-polarity-card');
  if (e && e.polarity) {
    document.getElementById('erp-polarity').textContent = e.polarity;
    polarCard.style.display = '';
  } else { polarCard.style.display = 'none'; }

  const insightCard = document.getElementById('erp-insight-card');
  const insightEl   = document.getElementById('erp-insight');
  const insight = (e && e.short && e.short[0]) ? e.short[0] : (meta.x || '');
  if (insight) {
    insightEl.textContent = insight;
    insightCard.style.display = '';
  } else { insightCard.style.display = 'none'; }

  const tipCard = document.getElementById('erp-tip-card');
  if (e && e.exam_tip) {
    document.getElementById('erp-tip').textContent = e.exam_tip;
    tipCard.style.display = '';
  } else { tipCard.style.display = 'none'; }

  panel.classList.add('v');
}

/* ════════════════════════════════════════
   MOBILE BOTTOM SHEET
   Collapsible educational card on mobile.
════════════════════════════════════════ */
let _bsExpanded = false;

function updateEduBottomSheet(meta, key) {
  const sheet = document.getElementById('edu-bottom-sheet');
  if (!sheet) return;
  const isMobile = window.innerWidth < 768;
  const is3d = curMode === '3d';

  if (!isMobile || !is3d || pmodeOn) {
    sheet.classList.remove('bs-visible', 'bs-expanded');
    _bsExpanded = false;
    return;
  }

  if (!meta || !meta.n) { sheet.classList.remove('bs-visible', 'bs-expanded'); return; }

  const e = key ? EDU_CONTENT[key] : null;

  // Title = molecule name
  document.getElementById('bs-title').textContent = meta.n || '—';

  // Preview = short geometry description
  const previewText = meta.s ? meta.s + (meta.a ? ' · ' + meta.a : '') : (meta.g || '—');
  document.getElementById('bs-preview').textContent = previewText;

  // Expanded body rows
  document.getElementById('bs-geo').textContent = meta.s || '—';
  document.getElementById('bs-hyb').textContent = meta.h || '—';
  document.getElementById('bs-ang').textContent = meta.a || '—';
  document.getElementById('bs-dip').textContent = meta.d || '—';

  // Insight text
  const insight = (e && e.polarity) ? e.polarity : (meta.x || meta.g || '');
  document.getElementById('bs-insight').textContent = insight;

  // Edu chips
  const chipsEl = document.getElementById('bs-chips');
  if (e) {
    chipsEl.innerHTML = [
      e.geometry_reason ? `<div class="bs-chip geo"><span class="bs-chip-k">Geometry</span>${e.geometry_reason}</div>` : '',
      e.exam_tip        ? `<div class="bs-chip tip"><span class="bs-chip-k">⚡ Exam Tip</span>${e.exam_tip}</div>` : '',
    ].join('');
  } else if (meta.g) {
    chipsEl.innerHTML = `<div class="bs-chip geo"><span class="bs-chip-k">Geometry</span>${meta.g}</div>`;
  } else {
    chipsEl.innerHTML = '';
  }

  // Collapse to peek state for new molecule
  _bsExpanded = false;
  sheet.classList.remove('bs-expanded');
  sheet.classList.add('bs-visible');
  document.getElementById('bs-toggle-btn').textContent = 'Tap to expand';
}

function toggleBottomSheet() {
  const sheet = document.getElementById('edu-bottom-sheet');
  const btn   = document.getElementById('bs-toggle-btn');
  if (!sheet.classList.contains('bs-visible')) return;
  _bsExpanded = !_bsExpanded;
  sheet.classList.toggle('bs-expanded', _bsExpanded);
  btn.textContent = _bsExpanded ? 'Collapse ↓' : 'Tap to expand';
}

// Initialise bottom sheet touch interactions
(function initBottomSheet() {
  let startY = 0, isDragging = false;
  const getSheet = () => document.getElementById('edu-bottom-sheet');

  document.getElementById('bs-header-tap')?.addEventListener('click', toggleBottomSheet);
  document.getElementById('bs-handle')?.addEventListener('click', toggleBottomSheet);

  // Swipe down to collapse
  document.addEventListener('touchstart', e => {
    const sheet = getSheet();
    if (!sheet || !sheet.classList.contains('bs-visible')) return;
    if (!sheet.contains(e.target)) return;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging = false;
    const dy = e.changedTouches[0].clientY - startY;
    if (dy > 50 && _bsExpanded) {
      toggleBottomSheet(); // swipe down collapses
    } else if (dy < -50 && !_bsExpanded) {
      toggleBottomSheet(); // swipe up expands
    }
  }, { passive: true });
})();

/* ════════════════════════════════════════
   EDUCATIONAL OVERLAY (legacy — desktop ≥768px keeps it hidden via CSS,
   but keep function so other callers don't break)
════════════════════════════════════════ */
function updateEduCard(meta) {
  const card = document.getElementById('edu-card');
  if (!meta || !meta.s) { card.classList.remove('v'); return; }

  document.getElementById('edu-name').textContent = meta.n || '—';
  document.getElementById('edu-geo').textContent  = meta.s || '—';
  document.getElementById('edu-hyb').textContent  = meta.h || '—';
  document.getElementById('edu-ang').textContent  = meta.a || '—';

  // Use the NEET/JEE fact as one-line insight (truncate if needed)
  const insight = meta.x || meta.g || '';
  const short = insight.length > 90 ? insight.slice(0,88) + '…' : insight;
  document.getElementById('edu-ins').textContent = short;

  card.classList.add('v');
}

/* ════════════════════════════════════════
   ONBOARDING HINTS
════════════════════════════════════════ */
(function initHints() {
  if (sessionStorage.getItem('cs-hints-seen')) return;
  const bar = document.getElementById('hint-bar');

  function hideHints() {
    bar.classList.add('out');
    setTimeout(() => { bar.style.display = 'none'; }, 520);
    sessionStorage.setItem('cs-hints-seen', '1');
    document.removeEventListener('pointerdown', hideHints, { once: true });
    document.removeEventListener('wheel', hideHints, { once: true });
    clearTimeout(_hintsTimer);
  }

  // Auto-hide after 5s
  const _hintsTimer = setTimeout(hideHints, 5000);
  // Or hide on first interaction
  document.addEventListener('pointerdown', hideHints, { once: true, passive: true });
  document.addEventListener('wheel', hideHints, { once: true, passive: true });
})();

