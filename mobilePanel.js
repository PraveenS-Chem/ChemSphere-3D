/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — mobilePanel.js
   MOBILE MOLECULE SCREEN
   Full-screen mobile molecule picker that lives outside .app (WebGL canvas constraints).
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   MOBILE MOLECULE SCREEN
   Lives outside .app entirely — WebGL canvas inside .app can never
   affect it. No z-index needed, no GPU compositing issues.
════════════════════════════════════════ */
let molScreenOpen = false;

function openMolScreen() {
  molScreenOpen = true;
  document.getElementById('mol-screen').classList.add('v');
  // Pause rotation to save battery while browsing molecules
  ROT.stop();
  // Sync the mobile grid with current selection
  msRenderGrid(curCat);
  // Sync category buttons
  document.querySelectorAll('.ms-cat').forEach(b => {
    b.classList.toggle('on', b.dataset.cat === curCat);
  });
  // Sync mobile style/color selects with desktop sidebar values
  const dSty = document.getElementById('sty');
  const dCol = document.getElementById('col');
  if (dSty) document.getElementById('ms-sty').value = dSty.value;
  if (dCol) document.getElementById('ms-col').value = dCol.value;
  // Update bottom tab
  document.getElementById('bmol').classList.add('on');
}

function closeMolScreen() {
  molScreenOpen = false;
  document.getElementById('mol-screen').classList.remove('v');
  document.getElementById('bmol').classList.remove('on');
  // Resume rotation
  if (curMode === '3d') ROT.start();
}

function togDrawer() {
  molScreenOpen ? closeMolScreen() : openMolScreen();
}
function closeDrawer() { closeMolScreen(); }

function msCat(cat, btn) {
  curCat = cat;
  document.querySelectorAll('.ms-cat').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  // Also sync desktop sidebar tabs
  document.querySelectorAll('.ctb').forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
  msRenderGrid(cat);
}

function msRenderGrid(cat) {
  const mols = DB[cat] || [];
  document.getElementById('ms-grid').innerHTML = mols.map(m =>
    `<div class="ms-card${m.key === selKey ? ' sel':''}" data-key="${m.key}">
      <div class="ms-cf">${m.f}</div>
      <div class="ms-cn">${m.n}</div>
      <div class="ms-cs">${m.s}</div>
    </div>`
  ).join('');
}

function msPick(key) {
  // Mobile card tap — delegate to shared pickMol
  closeMolScreen();
  pickMol(key);
}

function msSearch() {
  const val = document.getElementById('ms-in').value.trim();
  if (!val) return;
  selKey = null;
  document.getElementById('ms-err').classList.remove('v');
  closeMolScreen();
  clearErr();
  go(val, null);
}

/* Mobile style/color sync — keep desktop sidebar in sync */
function msSyncStyle() {
  const val = document.getElementById('ms-sty').value;
  document.getElementById('sty').value = val;
  applyStyle();
}
function msSyncColor() {
  const val = document.getElementById('ms-col').value;
  document.getElementById('col').value = val;
  applyStyle();
}

