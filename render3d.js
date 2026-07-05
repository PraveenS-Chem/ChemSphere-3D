/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — render3d.js
   3D RENDERING & IONIC COMPOUNDS
   3Dmol.js render pipeline plus robust SDF handling/merging/rebuilding for ionic compounds.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   3D RENDER
   ─────────────────────────────────────
   Ionic compound handling:
   Cactus returns disconnected SDF for salts/ionic compounds (NaOH, NaCl, etc.)
   — the Na⁺ and OH⁻ appear as separate unconnected fragments far apart or at
   the origin, rendering as floating spheres with no bond visible.
   
   Fix: parseSdfConnectivity() detects disconnected SDFs.
   If disconnected → rebuildIonicSdf() repositions fragment centroids at a
   chemically realistic ion-pair distance (~2.3 Å) so the compound displays
   as a proper ion pair, and shows a toast label.
════════════════════════════════════════ */

/* ════════════════════════════════════════
   IONIC COMPOUND 3D — robust SDF handling
   ─────────────────────────────────────
   Cactus returns ionic compounds (NaOH, NaCl, etc.) as either:
   A) A single disconnected molblock (3 atoms, 1 bond for NaOH)
   B) Multiple molblocks separated by $$$$ (one per ion)

   Both cases caused broken 3D: atoms appeared far apart or overlapping
   because only the first molblock was being repositioned.

   Fix pipeline:
   1. mergeSdfRecords()  — collapse any multi-record SDF into ONE molblock
                           with all atoms + bonds combined
   2. parseSdfConnectivity() — detect if the merged block is disconnected
   3. rebuildIonicSdf()  — reposition fragment centroids at ION_DIST apart
════════════════════════════════════════ */

/* Step 1 — Merge a multi-record SDF ($$$$-separated) into one molblock.
   If already a single record, returns sdf unchanged. */
function mergeSdfRecords(sdf) {
  // Normalise line endings
  const text = sdf.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into individual molblock records
  const records = text.split(/\$\$\$\$/).map(r => r.trim()).filter(r => r.length > 0);
  if (records.length <= 1) return text; // already single record — nothing to do

  // Parse each record's atom and bond lines
  let allAtomLines = [];
  let allBondLines = [];

  records.forEach(rec => {
    const lines = rec.split('\n');
    const countsLine = lines[3] || '';
    const atomCount = parseInt(countsLine.substring(0, 3).trim()) || 0;
    const bondCount = parseInt(countsLine.substring(3, 6).trim()) || 0;
    const atomOffset = allAtomLines.length; // for renumbering bonds

    // Collect atom lines (lines 4 … 4+atomCount-1)
    for (let i = 4; i < 4 + atomCount; i++) {
      if (lines[i]) allAtomLines.push(lines[i]);
    }

    // Collect bond lines (renumber atom indices by offset)
    const bondStart = 4 + atomCount;
    for (let i = bondStart; i < bondStart + bondCount; i++) {
      const bl = lines[i];
      if (!bl || bl.trim() === '') continue;
      const a1 = parseInt(bl.substring(0, 3).trim()) + atomOffset;
      const a2 = parseInt(bl.substring(3, 6).trim()) + atomOffset;
      const rest = bl.substring(6); // bond type, stereo, etc
      allBondLines.push(
        String(a1).padStart(3) + String(a2).padStart(3) + rest
      );
    }
  });

  // Build merged counts line
  const totalAtoms = allAtomLines.length;
  const totalBonds = allBondLines.length;
  const countsNew = String(totalAtoms).padStart(3) +
                    String(totalBonds).padStart(3) +
                    '  0  0  0  0  0  0  0  0999 V2000';

  // Use header from first record
  const firstLines = records[0].split('\n');
  const merged = [
    firstLines[0] || '',   // molecule name
    firstLines[1] || '',   // program/date
    firstLines[2] || '',   // comment
    countsNew,
    ...allAtomLines,
    ...allBondLines,
    'M  END',
  ].join('\n');

  console.log(`[ChemSphere 3D] Merged ${records.length} SDF records → ${totalAtoms} atoms, ${totalBonds} bonds`);
  return merged;
}

/* Step 2 — Detect disconnected graph in a single molblock. */
function parseSdfConnectivity(sdf) {
  const lines = sdf.replace(/\r\n/g, '\n').split('\n');
  const countsLine = lines[3] || '';
  const atomCount = parseInt(countsLine.substring(0, 3).trim()) || 0;
  const bondCount = parseInt(countsLine.substring(3, 6).trim()) || 0;
  const disconnected = atomCount > 1 && bondCount < atomCount - 1;
  return { atomCount, bondCount, disconnected };
}

/* Step 3 — Reposition fragment centroids along X axis at ION_DIST spacing. */
function rebuildIonicSdf(sdf) {
  const ION_DIST = 2.4; // Å — representative ionic bond length
  const lines = sdf.replace(/\r\n/g, '\n').split('\n');
  const countsLine = lines[3] || '';
  const atomCount = parseInt(countsLine.substring(0, 3).trim()) || 0;
  const bondCountN = parseInt(countsLine.substring(3, 6).trim()) || 0;

  if (atomCount === 0) return sdf;

  // Parse atom coordinates
  const atomLines = lines.slice(4, 4 + atomCount);
  const atoms = atomLines.map(l => ({
    x: parseFloat(l.substring(0, 10)) || 0,
    y: parseFloat(l.substring(10, 20)) || 0,
    z: parseFloat(l.substring(20, 30)) || 0,
    rest: l.substring(30),
  }));

  // Union-find to identify fragments
  const parent = Array.from({length: atomCount}, (_, i) => i);
  function find(x) { return parent[x] === x ? x : (parent[x] = find(parent[x])); }
  function union(a, b) { parent[find(a)] = find(b); }

  const bondStart = 4 + atomCount;
  lines.slice(bondStart, bondStart + bondCountN).forEach(bl => {
    if (!bl || bl.trim() === '' || bl.startsWith('M')) return;
    const a = parseInt(bl.substring(0, 3).trim()) - 1;
    const b = parseInt(bl.substring(3, 6).trim()) - 1;
    if (a >= 0 && b >= 0 && a < atomCount && b < atomCount) union(a, b);
  });

  // Group into fragments
  const fragMap = new Map();
  atoms.forEach((_, i) => {
    const root = find(i);
    if (!fragMap.has(root)) fragMap.set(root, []);
    fragMap.get(root).push(i);
  });
  const fragList = [...fragMap.values()];
  if (fragList.length < 2) return sdf; // already connected

  // Sort fragments largest-first so the main ion is centred
  fragList.sort((a, b) => b.length - a.length);

  // Compute centroid of each fragment
  const centroids = fragList.map(idxs => ({
    x: idxs.reduce((s, i) => s + atoms[i].x, 0) / idxs.length,
    y: idxs.reduce((s, i) => s + atoms[i].y, 0) / idxs.length,
    z: idxs.reduce((s, i) => s + atoms[i].z, 0) / idxs.length,
  }));

  // Place centroids symmetrically on X axis, centred at origin
  const n = fragList.length;
  const newAtomLines = [...atomLines];
  fragList.forEach((idxs, fi) => {
    const targetX = (fi - (n - 1) / 2) * ION_DIST;
    const dx = targetX - centroids[fi].x;
    const dy = 0 - centroids[fi].y;
    const dz = 0 - centroids[fi].z;
    idxs.forEach(i => {
      const a = atoms[i];
      const nx = (a.x + dx).toFixed(4).padStart(10);
      const ny = (a.y + dy).toFixed(4).padStart(10);
      const nz = (a.z + dz).toFixed(4).padStart(10);
      newAtomLines[i] = `${nx}${ny}${nz}${a.rest}`;
    });
  });

  return [
    ...lines.slice(0, 4),
    ...newAtomLines,
    ...lines.slice(4 + atomCount),
  ].join('\n');
}

async function do3D(query, tk) {
  // Wait for viewer to be ready (Firefox initialises it slower than Chrome).
  // Poll for up to 3 s before giving up and falling back to 2D.
  if (!viewer) {
    await new Promise(resolve => {
      if (viewer) return resolve();
      const deadline = Date.now() + 3000;
      const poll = () => {
        if (viewer) return resolve();
        if (Date.now() > deadline) return resolve(); // timed out — resolve anyway
        setTimeout(poll, 50);
      };
      poll();
    });
  }

  if (!dmol || !viewer) {
    toast('3D unavailable — switching to 2D', 'e');
    setMode('2d');
    return;  // load2D already called in parallel by go()
  }
  showLoad(true, query, 'LOADING 3D STRUCTURE…');
  let sdf = await cactus(query, 'SDF?get3d=true');
  if (tk !== token) return;

  // ── Ionic compound detection & repair ──────────────────────────────────
  // Step 1: merge multi-record SDF ($$$$-separated) into one molblock
  sdf = mergeSdfRecords(sdf);
  // Step 2: detect disconnected graph
  const { disconnected, atomCount, bondCount } = parseSdfConnectivity(sdf);
  let isIonic = false;
  if (disconnected) {
    console.log(`[ChemSphere 3D] Ionic SDF for "${query}" — atoms:${atomCount} bonds:${bondCount}`);
    // Step 3: reposition fragments at realistic ionic distance
    sdf = rebuildIonicSdf(sdf);
    isIonic = true;
    toast('Ionic compound — showing ion pair', 'k');
  }
  // ───────────────────────────────────────────────────────────────────────

  viewer.stopAnimate();
  viewer.clear();
  model = viewer.addModel(sdf, 'sdf');

  if (isIonic) {
    applyIonicStyle();
  } else {
    applyStyle();
  }

  viewer.zoomTo();
  viewer.zoom(0.75);
  viewer.render();

  requestAnimationFrame(() => {
    viewer.resize();
    viewer.render();
    ROT.attachListeners();
    ROT.paused = false;
    ROT.start();
    setTimeout(() => { viewer.resize(); viewer.render(); }, 400);
  });
}

