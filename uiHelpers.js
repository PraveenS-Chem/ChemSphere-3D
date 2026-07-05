/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — uiHelpers.js
   UI HELPERS
   Loading states, error banners, and toast notifications.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   UI HELPERS
════════════════════════════════════════ */
function showLoad(show, mol, txt) {
  document.getElementById('ldr').classList.toggle('h', !show);
  if (mol) document.getElementById('lmol').textContent = mol;
  if (txt) document.getElementById('ltx').textContent  = txt;
}
function showErr(msg) { const e = document.getElementById('eb'); e.textContent = msg; e.classList.add('v'); }
function clearErr()   { const e = document.getElementById('eb'); e.textContent = '';  e.classList.remove('v'); }

let _tt = null;
function toast(msg, type = '') {
  const t = document.getElementById('tst');
  t.textContent = msg;
  t.className = 'tst' + (type ? ' ' + type : '') + ' v';
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('v'), 2800);
}
async function doCopy(text, label) {
  try { await navigator.clipboard.writeText(text); toast(label + ' copied!', 'k'); }
  catch { toast('Copy failed', 'e'); }
}
function openMod()  { /* removed — no upgrade modal */ }
function closeMod() { /* removed — no upgrade modal */ }

/* Google Form — show iframe on button click */
