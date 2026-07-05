/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — viewerCore.js
   VIEWER CORE
   Manual rAF rotation controller and 3Dmol.js viewer bootstrap (initGrid, initKeyboard, initViewer).
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   ROTATION CONTROLLER
   Manual rAF loop using viewer.rotate() — guaranteed to produce
   visible frames on Android Chrome without requiring user interaction.
   viewer.animate() is NOT used for auto-rotation (it only advances
   when the GL context is already compositing, causing the "rotate only
   after touch" bug on mobile).
════════════════════════════════════════ */
const ROT = {
  rafId:       null,
  paused:      false,   // true while user is dragging/zooming
  resumeTimer: null,    // timeout to resume after inactivity
  RESUME_MS:   2500,    // ms of inactivity before auto-resume
  STEP_NORMAL: 0.4,     // degrees per frame — slow educational spin
  STEP_PMODE:  0.22,    // cinematic, readable in presentation mode
  STEP_MOBILE: 0.30,    // slightly reduced for mid-range Android

  step() {
    if (pmodeOn) return this.STEP_PMODE;
    if (window.innerWidth < 768) return this.STEP_MOBILE;
    return this.STEP_NORMAL;
  },

  start() {
    if (!viewer || !rotating) return;
    this.stop(); // clear any existing loop first
    const tick = () => {
      if (!this.paused && viewer && rotating && curMode === '3d') {
        viewer.rotate(this.step(), 'y');
        viewer.render();
      }
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  },

  stop() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  },

  // Called on any user interaction with the 3D canvas
  onInteract() {
    if (!rotating) return;
    this.paused = true;
    clearTimeout(this.resumeTimer);
    this.resumeTimer = setTimeout(() => {
      this.paused = false;
    }, this.RESUME_MS);
  },

  // Attach interaction listeners to the 3Dmol canvas element
  attachListeners() {
    const canvas = document.querySelector('#c3d canvas');
    if (!canvas || canvas._rotListeners) return; // already attached
    const onInteract = () => this.onInteract();
    canvas.addEventListener('pointerdown', onInteract, { passive: true });
    canvas.addEventListener('wheel',       onInteract, { passive: true });
    canvas._rotListeners = true;
  },
};
let curCat = 'vsepr', selKey = null;
let curQ = null, curMeta = null, curMode = '3d';
let dmol = false, token = 0;
const CACTUS = 'https://cactus.nci.nih.gov/chemical/structure';

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
window.addEventListener('load', () => {
  initGrid();
  initKeyboard();
  initViewer();

  window.addEventListener('resize', () => {
    if (!viewer) return;
    requestAnimationFrame(() => { viewer.resize(); viewer.render(); });
    // Re-evaluate responsive edu panels on resize
    if (curMeta) {
      const key = curMeta._key || null;
      updateEduRightPanel(curMeta, key);
      updateEduBottomSheet(curMeta, key);
    }
  });
});

function initGrid() {
  renderGrid('vsepr');
  // Desktop grid — event delegation
  document.getElementById('mg').addEventListener('click', e => {
    const card = e.target.closest('.mc');
    if (card) pickMol(card.dataset.key);
  });
  // Mobile grid — event delegation
  document.getElementById('ms-grid').addEventListener('click', e => {
    const card = e.target.closest('.ms-card');
    if (card) msPick(card.dataset.key);
  });
}

function initKeyboard() {
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('mol-in').focus();
    }
    if (e.key === 'Escape') { closeDrawer(); }
  });

  document.getElementById('mol-in').addEventListener('keypress', e => {
    if (e.key === 'Enter') doSearch();
  });
  document.getElementById('ms-in').addEventListener('keypress', e => {
    if (e.key === 'Enter') msSearch();
  });
}

function initViewer() {
  document.getElementById('ldr').classList.add('h');
  const ls = document.getElementById('libst');

  if (typeof $3Dmol === 'undefined') {
    ls.innerHTML = '<span class="lfl">✗ 3Dmol.js not loaded</span><span class="lok">✓ SmilesDrawer SVG</span>';
    window._viewerReady = true;
    return;
  }

  dmol = true;
  ls.innerHTML = '<span class="lok">✓ 3Dmol.js ready</span><span class="lok">✓ SmilesDrawer SVG</span>';

  // Use a helper that waits until the viewer element has a real non-zero size
  // before creating the WebGL context. This fixes the 0×0 canvas bug on
  // Android Chrome in desktop mode (and any other deferred-layout scenario).
  function createViewerWhenReady(attempt) {
    attempt = attempt || 1;
    const vwEl = document.getElementById('vw');
    const c3d  = document.getElementById('c3d');
    const W = vwEl.clientWidth  || vwEl.offsetWidth;
    const H = vwEl.clientHeight || vwEl.offsetHeight;

    if (W < 10 || H < 10) {
      // Element not laid out yet — retry up to 30 times (~1.5 s total)
      if (attempt < 30) {
        setTimeout(() => createViewerWhenReady(attempt + 1), 50);
      } else {
        // Last-resort fallback: use window dimensions minus sidebar
        const FW = window.innerWidth  - 300;
        const FH = window.innerHeight - 56;
        c3d.style.width  = FW + 'px';
        c3d.style.height = FH + 'px';
        tryCreate();
      }
      return;
    }

    // Stamp explicit px so WebGL context gets a definite non-zero size
    c3d.style.width  = W + 'px';
    c3d.style.height = H + 'px';
    tryCreate();

    function tryCreate() {
      try {
        viewer = $3Dmol.createViewer(c3d, { backgroundColor:'#060810', antialias:true });
        // Clear the forced size — let CSS take over — then resize
        requestAnimationFrame(() => {
          c3d.style.width  = '';
          c3d.style.height = '';
          viewer.resize();
          viewer.render();
          ROT.attachListeners();
          window._viewerReady = true;

          // Fire any pending load callback (e.g. initial molecule load that
          // was deferred because the viewer wasn't ready yet — happens on
          // Firefox where initViewer completes after the first pickMol call)
          if (typeof window._onViewerReady === 'function') {
            const cb = window._onViewerReady;
            window._onViewerReady = null;
            cb();
          }

          // Belt-and-suspenders: resize again after 600 ms for desktop-mode lag
          setTimeout(() => { viewer.resize(); viewer.render(); }, 600);

          // Install ResizeObserver so canvas always fills the pane on window resize
          if (typeof ResizeObserver !== 'undefined') {
            new ResizeObserver(() => {
              if (viewer) { viewer.resize(); viewer.render(); }
            }).observe(vwEl);
          }
        });
      } catch(err) {
        console.error('3Dmol init failed:', err);
        dmol = false;
        ls.innerHTML = '<span class="lfl">✗ 3Dmol error: ' + err.message + '</span>';
        window._viewerReady = true;
        // Still fire the callback so the UI doesn't hang
        if (typeof window._onViewerReady === 'function') {
          const cb = window._onViewerReady;
          window._onViewerReady = null;
          cb();
        }
      }
    }
  }

  // Kick off after two rAF cycles (ensures first paint is done)
  requestAnimationFrame(() => requestAnimationFrame(() => createViewerWhenReady(1)));
}

