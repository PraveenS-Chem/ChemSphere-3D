/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — presentationMode.js
   PRESENTATION MODE
   Device-aware fullscreen classroom mode plus its molecule navigation dock.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   PRESENTATION MODE — device-aware + fullscreen + smart classroom
════════════════════════════════════════ */
let pmodeOn = false;

function getDeviceType() {
  const w = window.innerWidth;
  const hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  if (w < 768) return 'mobile';
  if (w <= 1180 && hasTouch) return 'tablet';
  return 'desktop';
}

function enterFullscreen() {
  const el = document.documentElement;
  const fn = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (fn) fn.call(el).catch(() => {});
}
function exitFullscreen() {
  const fn = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen;
  if (fn) fn.call(document).catch(() => {});
}

document.addEventListener('fullscreenchange',       syncPmodeFromFullscreen);
document.addEventListener('webkitfullscreenchange', syncPmodeFromFullscreen);
document.addEventListener('mozfullscreenchange',    syncPmodeFromFullscreen);
function syncPmodeFromFullscreen() {
  const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement);
  if (pmodeOn && !isFs) { pmodeOn = false; applyPmodeState(false); }
}

function togglePmode() {
  pmodeOn = !pmodeOn;
  const device = getDeviceType();
  if (pmodeOn) {
    applyPmodeState(true, device);
    if (device !== 'mobile') enterFullscreen();
  } else {
    applyPmodeState(false, device);
    exitFullscreen();
  }
}

function applyPmodeState(on, device) {
  device = device || getDeviceType();
  document.body.classList.toggle('pmode', on);
  document.body.dataset.pmodeDevice = on ? device : '';

  const btn = document.getElementById('pmode-btn');
  if (btn) {
    btn.classList.toggle('on', on);
    btn.textContent = on ? '⊞ Exit Present' : '⊞ Present';
  }

  // ROT.step() automatically picks the right speed based on pmodeOn flag
  if (rotating && curMode === '3d') {
    ROT.stop();
    ROT.paused = false;
    ROT.start();
  }

  if (on && curMeta) updatePmodePanelEnhanced(curMeta, curMeta._key || null);
  else hidePmodePanel();

  // Hide non-pmode educational panels in presentation mode
  const rp = document.getElementById('edu-right-panel');
  if (rp) rp.classList.remove('v');
  const bs = document.getElementById('edu-bottom-sheet');
  if (bs) { bs.classList.remove('bs-visible', 'bs-expanded'); }

  // Force-hide onboarding hints immediately on pmode toggle (CSS also hides, belt-and-suspenders)
  const hintBar = document.getElementById('hint-bar');
  if (hintBar) { hintBar.style.display = 'none'; }

  // Update geo badge (shows geometry name above bond-angle SVG in pmode, clears on exit)
  const geoBadge = document.getElementById('pmode-geo-badge');
  if (geoBadge) {
    if (on && curMeta && curMeta.s) geoBadge.textContent = curMeta.s;
    else geoBadge.textContent = '';
  }

  // Re-run bond angle to refresh reason/badge visibility for new mode state
  if (curMeta && curMeta._key) showBondAngleEnhanced(curMeta._key);

  requestAnimationFrame(() => { if (viewer) { viewer.resize(); viewer.render(); } });
  toast(on ? 'Presentation mode ON' : 'Presentation mode OFF', 'k');
  // Refresh nav dock visibility and active state
  pndUpdate();
}

/* ════════════════════════════════════════
   PRESENTATION MODE MOLECULE NAV DOCK
   Lets teachers switch molecules without exiting pmode.
════════════════════════════════════════ */

let _pndCat = 'vsepr'; // currently shown category in dock

/** Build/refresh the pill strip for a given category */
function pndRender(cat) {
  const pills = document.getElementById('pnd-pills');
  if (!pills) return;

  // Collect molecules: 'all' flattens every category
  let mols;
  if (cat === 'all') {
    mols = Object.values(DB).flat();
  } else {
    mols = DB[cat] || [];
  }

  pills.innerHTML = mols.map(m => `
    <button class="pnd-pill${m.key === selKey ? ' active' : ''}"
            data-key="${m.key}"
            onclick="pndPick('${m.key}')"
            title="${m.n}">
      <span class="pnd-pill-f">${m.f}</span>
      <span class="pnd-pill-n">${m.n}</span>
    </button>
  `).join('');

  // Scroll to active pill so it's always visible
  requestAnimationFrame(() => {
    const active = pills.querySelector('.pnd-pill.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    pndUpdateArrows();
  });
}

/** Switch active category tab and re-render */
function pndSetCat(cat, btn) {
  _pndCat = cat;
  document.querySelectorAll('.pnd-cat').forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
  pndRender(cat);
}

/** Pick a molecule from the dock — stays in pmode */
function pndPick(key) {
  if (!pmodeOn) return; // safety guard
  // Update active pill immediately (visual feedback before load completes)
  document.querySelectorAll('.pnd-pill').forEach(p => p.classList.toggle('active', p.dataset.key === key));
  // Use pickMol — it calls go(), which updates all educational overlays
  pickMol(key);
}

/** Show/hide scroll arrows based on overflow */
function pndUpdateArrows() {
  const pills = document.getElementById('pnd-pills');
  const left  = document.getElementById('pnd-left');
  const right = document.getElementById('pnd-right');
  if (!pills || !left || !right) return;
  const canLeft  = pills.scrollLeft > 4;
  const canRight = pills.scrollLeft < (pills.scrollWidth - pills.clientWidth - 4);
  left.classList.toggle('show', canLeft);
  right.classList.toggle('show', canRight);
}

/** Scroll the pill strip left (−1) or right (+1) */
function pndScroll(dir) {
  const pills = document.getElementById('pnd-pills');
  if (!pills) return;
  pills.scrollBy({ left: dir * 200, behavior: 'smooth' });
  setTimeout(pndUpdateArrows, 320);
}

/** Called whenever pmode turns on/off, or selKey changes */
function pndUpdate() {
  if (!pmodeOn) return;
  // Sync category to whatever the main grid is showing
  if (_pndCat !== 'all') _pndCat = curCat || _pndCat;
  // Sync cat buttons
  document.querySelectorAll('.pnd-cat').forEach(b => {
    b.classList.toggle('on', b.dataset.cat === _pndCat);
  });
  pndRender(_pndCat);
}

// Listen for scroll events on pills to update arrows
(function initPndScrollListener() {
  // Deferred — DOM not ready yet at parse time
  document.addEventListener('DOMContentLoaded', () => {
    const pills = document.getElementById('pnd-pills');
    if (pills) pills.addEventListener('scroll', pndUpdateArrows, { passive: true });
  });
})();

function updatePmodePanel(meta) {
  if (!meta) { hidePmodePanel(); return; }
  const geoCard = document.getElementById('pmp-geo-card');
  const hybCard = document.getElementById('pmp-hyb-card');
  if (meta.g) {
    document.getElementById('pmp-geo').textContent      = meta.s || '—';
    document.getElementById('pmp-geo-fact').textContent = meta.g || '';
    geoCard.style.display = '';
  } else { geoCard.style.display = 'none'; }
  if (meta.h) {
    document.getElementById('pmp-hyb').textContent   = meta.h || '—';
    document.getElementById('pmp-angle').textContent = meta.a ? '∠ ' + meta.a : '—';
    hybCard.style.display = '';
  } else { hybCard.style.display = 'none'; }
}

function hidePmodePanel() {
  document.getElementById('pmp-geo-card').style.display = 'none';
  document.getElementById('pmp-hyb-card').style.display = 'none';
}

