/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — pubchemFallback.js
   PUBCHEM + WIKIPEDIA FALLBACK
   Fetches molecular data from PubChem/Wikipedia when a searched molecule has no local DB entry.
═══════════════════════════════════════════════════════════ */

/* ══ INSTITUTE BRANDING — removed with token system ══ */

/* ══ ACCESS: fully public — no token required ════ */

/* ══ PUBCHEM + WIKIPEDIA FALLBACK ════════════════ */
// Called when a searched molecule has no local DB entry
async function csGetFallbackInfo(moleculeName) {
  const panel = document.getElementById('pinf') || document.querySelector('.info-panel');
  if (!panel) return;

  // Show loading state in key insight area
  const xi = document.getElementById('pxi') || document.querySelector('[id*="xi"]');
  if (xi) xi.textContent = 'Loading info from PubChem...';

  try {
    // PubChem: get CID from name
    const cidResp = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(moleculeName)}/cids/JSON`
    );
    if (!cidResp.ok) throw new Error('PubChem name lookup failed');
    const cidData = await cidResp.json();
    const cid = cidData.IdentifierList?.CID?.[0];
    if (!cid) throw new Error('No CID found');

    // PubChem: get properties
    const propResp = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,XLogP/JSON`
    );
    const propData = await propResp.json();
    const props = propData.PropertyTable?.Properties?.[0] || {};

    // Wikipedia: get summary
    let wikiSummary = '';
    try {
      const wResp = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(moleculeName)}`
      );
      const wData = await wResp.json();
      wikiSummary = wData.extract ? wData.extract.split('.').slice(0,2).join('.') + '.' : '';
    } catch(e) { /* wiki optional */ }

    // Update info panels with fetched data
    const fw = document.getElementById('pfw') || document.querySelector('[id*="fw"]');
    const fh = document.getElementById('pfh') || document.querySelector('[id*="fh"]');

    if (fw && props.MolecularWeight) fw.textContent = props.MolecularWeight + ' g/mol';
    if (fh && props.IUPACName) fh.textContent = props.IUPACName;
    if (xi) xi.textContent = wikiSummary || 'Source: PubChem CID ' + cid + '. Search for ' + moleculeName + ' on PubChem for full data.';

  } catch(err) {
    if (xi) xi.textContent = 'Tip: Search "' + moleculeName + ' NEET JEE" for exam-specific information. 3D structure powered by NCI Cactus.';
  }
}

// Expose globally so existing search code can call it
window.csGetFallbackInfo = csGetFallbackInfo;
