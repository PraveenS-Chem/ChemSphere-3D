/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — introShowcase.js
   INTRO SCREEN & SHOWCASE FLOW
   Landing screen, entry transition, featured-molecule showcase, and mini demo sequence.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   INTRO SCREEN + SHOWCASE FLOW
════════════════════════════════════════ */

/* Featured molecules for the showcase */
const SHOWCASE_MOLS = [
  { key:'org-benz',  f:'C₆H₆',    n:'Benzene',     tag:'Aromatic' },
  { key:'vsepr-sf6', f:'SF₆',      n:'SF₆',         tag:'Octahedral' },
  { key:'bio-chol',  f:'C₂₇H₄₆O', n:'Cholesterol', tag:'Biochemistry' },
  { key:'bio-gluc',  f:'C₆H₁₂O₆', n:'Glucose',     tag:'Sugar' },
  { key:'vsepr-h2o', f:'H₂O',      n:'Water',       tag:'VSEPR' },
  { key:'org-etoh',  f:'C₂H₅OH',   n:'Ethanol',     tag:'Organic' },
];

/* Mini demo sequence */
const MINI_DEMO = [
  { key:'org-benz',  caption:'Aromatic resonance system' },
  { key:'vsepr-sf6', caption:'Perfect octahedral geometry' },
  { key:'bio-chol',  caption:'Biochemistry visualised in 3D' },
];
let miniDemoActive = false, miniDemoIdx = 0, miniDemoTimer = null;

/* Delay educational overlay appearance */
let _overlayDelayTimer = null;
const OVERLAY_DELAY = 2200; // ms after molecule load before overlays fade in

/* _viewerReady setter — MUST be defined before initIntro runs */
Object.defineProperty(window, '_viewerReady', {
  set(v) {
    this._vr = v;
    if (v && typeof window._onViewerReady === 'function') {
      window._onViewerReady();
      window._onViewerReady = null;
    }
  },
  get() { return this._vr; },
  configurable: true,
});

(function initIntro() {
  const intro = document.getElementById('intro-screen');
  if (sessionStorage.getItem('cs-intro-seen')) {
    intro.style.display = 'none';
    // Returning user: load smart default
    window._viewerReady
      ? loadSmartDefault()
      : (window._onViewerReady = loadSmartDefault);
    return;
  }
  buildShowcaseGrid();
})();

function buildShowcaseGrid() {
  const grid = document.getElementById('sc-grid');
  if (!grid) return;
  grid.innerHTML = SHOWCASE_MOLS.map(m =>
    `<div class="sc-card" data-key="${m.key}">
      <div class="sc-formula">${m.f}</div>
      <div class="sc-name">${m.n}</div>
      <div class="sc-tag">${m.tag}</div>
    </div>`
  ).join('');
  // Single delegated listener (rebuild safe — replaces previous)
  grid.onclick = e => {
    const card = e.target.closest('.sc-card');
    if (card) showcasePick(card.dataset.key);
  };
}

function enterApp(loadDemo) {
  sessionStorage.setItem('cs-intro-seen', '1');
  const intro = document.getElementById('intro-screen');
  intro.classList.add('out');

  if (loadDemo) {
    // "Load Demo Molecules" — skip showcase, go straight to guided demo
    setTimeout(() => {
      intro.style.display = 'none';
      const kickDemo = () => { startDemo(); toast('Demo running — tap ✕ to exit', 'k'); };
      window._viewerReady ? kickDemo() : (window._onViewerReady = kickDemo);
    }, 650);
    return;
  }

  // "Start Exploring" — cinematic transition → showcase
  setTimeout(() => {
    intro.style.display = 'none';
    showEntryTransition();
  }, 650);
}

function showEntryTransition() {
  const et = document.getElementById('entry-transition');
  et.style.pointerEvents = 'none';
  et.classList.add('in');
  setTimeout(() => {
    et.classList.remove('in');
    et.classList.add('out');
    setTimeout(() => { et.style.display = 'none'; et.classList.remove('out'); }, 500);
    showShowcase();
  }, 1400);
}

function showShowcase() {
  buildShowcaseGrid();
  document.getElementById('showcase-screen').classList.add('v');
}

function dismissShowcase(skipLoad) {
  document.getElementById('showcase-screen').classList.remove('v');
  stopMiniDemo();
  if (!skipLoad) {
    const defaultKey = window.innerWidth < 768 ? 'org-benz' : 'vsepr-sf6';
    const load = () => pickMol(defaultKey);
    window._viewerReady ? load() : (window._onViewerReady = load);
  }
}

function showcasePick(key) {
  stopMiniDemo();
  document.getElementById('showcase-screen').classList.remove('v');
  const load = () => pickMol(key);
  window._viewerReady ? load() : (window._onViewerReady = load);
}

function loadSmartDefault() {
  pickMol(window.innerWidth < 768 ? 'org-benz' : 'vsepr-sf6');
}

function startMiniDemo() {
  miniDemoActive = true;
  miniDemoIdx = 0;
  dismissShowcase(true);
  runMiniDemoStep();
}

function runMiniDemoStep() {
  if (!miniDemoActive || miniDemoIdx >= MINI_DEMO.length) {
    stopMiniDemo();
    toast('Tap any molecule to explore →', 'k');
    return;
  }
  const step = MINI_DEMO[miniDemoIdx];
  const load = () => { pickMol(step.key); setTimeout(() => toast(step.caption,'k'), 800); };
  window._viewerReady ? load() : (window._onViewerReady = load);
  miniDemoIdx++;
  miniDemoTimer = setTimeout(runMiniDemoStep, 5500);
}

function stopMiniDemo() {
  miniDemoActive = false;
  clearTimeout(miniDemoTimer);
}

