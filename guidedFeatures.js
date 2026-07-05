/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — guidedFeatures.js
   GUIDED LEARNING FEATURES
   Guided educational highlights, bond-angle visualization, and guided demo mode.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   FEATURE 2 — GUIDED EDUCATIONAL HIGHLIGHTS
   Key concept overlays for supported molecules
════════════════════════════════════════ */
const EDU_HIGHLIGHTS = {
  'vsepr-h2o': {
    title:'Lone Pair Effect',
    text:'2 lone pairs on O compress bond angle from 109.5° → 104.5°. Greater lone pair–bond pair repulsion = smaller angle.'
  },
  'vsepr-nh3': {
    title:'Lone Pair Compression',
    text:'1 lone pair on N reduces bond angle from 109.5° → 107°. Pyramidal shape — N acts as Lewis base via this lone pair.'
  },
  'vsepr-co2': {
    title:'Symmetry Cancels Dipole',
    text:'Both C=O bonds are polar, but they point in opposite directions. Net dipole = 0. Linear + symmetric = non-polar.'
  },
  'vsepr-sf6': {
    title:'Expanded Octet',
    text:'S uses d-orbitals to hold 6 bond pairs (sp³d²). All 90° angles. Perfect octahedral symmetry → dipole = 0.'
  },
  'vsepr-xef4': {
    title:'Square Planar Geometry',
    text:'6 electron pairs but 2 are lone pairs. They sit opposite each other (trans), giving square planar shape — not octahedral.'
  },
  'vsepr-ch4': {
    title:'Perfect Tetrahedral',
    text:'4 identical C-H bonds at 109.5°. No lone pairs. Complete symmetry → dipole = 0. The VSEPR reference molecule.'
  },
  'vsepr-bf3': {
    title:'Lewis Acid — Empty Orbital',
    text:'sp² hybridised B has an empty p-orbital. Accepts lone pairs from Lewis bases. Trigonal planar → dipole = 0.'
  },
  'org-benz': {
    title:'Aromatic Resonance',
    text:'6 π electrons delocalised over ring (Hückel: 4n+2, n=1). All C-C bonds equal length. Extra stability from resonance energy.'
  },
  'bio-gluc': {
    title:'Anomeric Carbon',
    text:'C1 is the anomeric carbon. α-glucose (36%) and β-glucose (64%) interconvert in solution — called mutarotation.'
  },
};

function showEduHighlight(key) {
  const hl = EDU_HIGHLIGHTS[key];
  const el = document.getElementById('edu-highlight');
  if (!hl || curMode !== '3d') { el.classList.remove('v'); return; }
  document.getElementById('hl-title').textContent = hl.title;
  document.getElementById('hl-text').textContent  = hl.text;
  el.classList.add('v');
  // Auto-hide after 8 seconds
  clearTimeout(showEduHighlight._t);
  showEduHighlight._t = setTimeout(() => el.classList.remove('v'), 8000);
}

/* ════════════════════════════════════════
   FEATURE 5 — BOND ANGLE VISUALIZATION
   SVG arc diagram for supported molecules
════════════════════════════════════════ */
const BOND_ANGLES = {
  'vsepr-h2o':  104.5,
  'vsepr-nh3':  107,
  'vsepr-ch4':  109.5,
  'vsepr-bf3':  120,
  'vsepr-co2':  180,
  'vsepr-sf6':  90,
  'vsepr-xef4': 90,
  'vsepr-pcl5': 120,
  'org-benz':   120,
};

function showBondAngle(key) {
  const angle = BOND_ANGLES[key];
  const svg   = document.getElementById('bond-angle-svg');
  if (!angle || curMode !== '3d') { svg.classList.remove('v'); return; }

  const cx = 60, cy = 10, r = 44;
  const label = angle + '°';

  if (angle >= 175) {
    // Linear — show straight line with angle
    document.getElementById('ba-arc').setAttribute('d',
      `M 10,${cy} L 110,${cy}`);
    document.getElementById('ba-arc').setAttribute('fill','none');
  } else {
    // Draw arc between two bond vectors
    const half = (angle / 2) * Math.PI / 180;
    const x1 = cx + r * Math.sin(-half);
    const y1 = cy + r * Math.cos(-half);
    const x2 = cx + r * Math.sin(half);
    const y2 = cy + r * Math.cos(half);
    const large = angle > 180 ? 1 : 0;
    document.getElementById('ba-arc').setAttribute('d',
      `M ${x1.toFixed(1)},${y1.toFixed(1)} A ${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} L ${cx},${cy} Z`);
    document.getElementById('ba-arc').setAttribute('fill','rgba(0,229,180,.08)');
  }
  document.getElementById('ba-label').textContent = label;
  svg.classList.add('v');
}

/* ════════════════════════════════════════
   FEATURE 3 — GUIDED DEMO MODE
════════════════════════════════════════ */
const DEMO_SEQ = ['vsepr-h2o','vsepr-ch4','vsepr-bf3','vsepr-nh3','vsepr-co2','vsepr-sf6','vsepr-xef4','org-benz','bio-chol'];
let demoActive = false, demoIdx = 0, demoTimer = null;

function toggleDemo() {
  demoActive ? stopDemo() : startDemo();
}

function startDemo() {
  demoActive = true;
  demoIdx = 0;
  document.getElementById('demo-btn').classList.add('on');
  document.getElementById('demo-bar').classList.add('v');
  // Build progress dots
  document.getElementById('demo-prog').innerHTML =
    DEMO_SEQ.map((_,i) => `<div class="demo-dot${i===0?' on':''}" id="ddot-${i}"></div>`).join('');
  runDemoStep();
}

function runDemoStep() {
  if (!demoActive || demoIdx >= DEMO_SEQ.length) { stopDemo(); return; }
  const key = DEMO_SEQ[demoIdx];
  // Update progress dots
  DEMO_SEQ.forEach((_,i) => {
    const d = document.getElementById('ddot-'+i);
    if (d) d.classList.toggle('on', i === demoIdx);
  });
  // Update demo bar mol name
  const meta = findMeta(key);
  document.getElementById('demo-mol-name').textContent = meta ? meta.n : key;
  // Load molecule
  pickMol(key);
  demoIdx++;
  demoTimer = setTimeout(runDemoStep, 6000);
}

function stopDemo() {
  demoActive = false;
  clearTimeout(demoTimer);
  document.getElementById('demo-btn').classList.remove('on');
  document.getElementById('demo-bar').classList.remove('v');
}

