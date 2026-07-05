/* ═══════════════════════════════════════════════════════════
   CHEMSPHERE — eduContent.js
   EDUCATIONAL CONTENT & HELPERS
   Local educational database (21 curated molecules) and the enhanced edu helper functions that read from it.
═══════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════
   EDU_CONTENT — Local educational database
   Covers all 21 curated molecules.
   Feeds: sidebar insights, edu-card overlay,
          edu-highlight, pmode teaching steps,
          bond-angle reason text.
════════════════════════════════════════ */
const EDU_CONTENT = {
  /* ── VSEPR ───────────────────────────────────────── */
  'vsepr-h2o': {
    short: [
      'O has 2 lone pairs → they repel bond pairs more than bond pairs repel each other',
      'Bond angle is 104.5°, not 109.5° — lone pair compression in action',
      'Highly polar molecule (1.85 D) — responsible for water\'s unique solvent properties',
    ],
    presentation: [
      'O has 4 electron pairs: 2 bonding + 2 lone pairs (sp³)',
      'Lone pair–lone pair repulsion > lone pair–bond pair > bond pair–bond pair',
      'This compresses H–O–H angle from 109.5° → 104.5°',
      'Asymmetric charge distribution gives net dipole = 1.85 D → polar molecule',
    ],
    geometry_reason: '2 lone pairs on O cause extra repulsion, bending the molecule below the ideal tetrahedral angle.',
    polarity: 'Polar — the two O–H dipoles do NOT cancel due to the bent shape.',
    exam_tip: 'Classic NEET trap: H₂O has 109.5° electron geometry but 104.5° molecular geometry. Always distinguish the two.',
    real_world: 'Water\'s bent shape and polarity give it its anomalous boiling point (100°C), surface tension, and ability to dissolve ionic compounds.',
  },
  'vsepr-co2': {
    short: [
      'Linear geometry — no lone pairs on C, two double bonds point opposite',
      'Both C=O bonds are polar, but they cancel exactly → net dipole = 0',
      'sp hybridised carbon — only 2 electron domains around C',
    ],
    presentation: [
      'C forms 2 double bonds with O atoms — only 2 electron domains',
      'VSEPR predicts 180° bond angle → linear shape',
      'Each C=O bond is polar (O more electronegative), but vectors are equal and opposite',
      'Net dipole = 0 despite polar bonds — symmetry cancels them out',
    ],
    geometry_reason: 'Only 2 bonding domains on C (sp hybridisation) → 180° linear geometry with no lone pairs to distort it.',
    polarity: 'Non-polar — linear symmetry causes the two C=O dipole vectors to cancel exactly.',
    exam_tip: 'CO₂ is the most tested "polar bonds but non-polar molecule" example. The key is always the geometry, not just the bonds.',
    real_world: 'CO₂ is a greenhouse gas; its linear shape allows it to absorb infrared radiation at specific wavelengths, trapping heat in the atmosphere.',
  },
  'vsepr-bf3': {
    short: [
      'sp² hybridisation — B has only 3 bond pairs, no lone pairs',
      'Trigonal planar with 120° angles → dipole = 0 by symmetry',
      'Empty p-orbital on B makes it a strong Lewis acid',
    ],
    presentation: [
      'B forms 3 bonds with F atoms — 3 electron domains only',
      'sp² hybridisation → flat trigonal planar geometry, 120° angles',
      'All 3 B–F dipoles cancel due to symmetry → net dipole = 0',
      'Unfilled p-orbital on B readily accepts lone pairs — classic Lewis acid',
    ],
    geometry_reason: '3 bonding pairs, 0 lone pairs on B → maximum repulsion separation is 120° in a flat plane.',
    polarity: 'Non-polar — the 3 B–F dipole vectors are symmetrically arranged and cancel completely.',
    exam_tip: 'BF₃ is the textbook Lewis acid. In reactions with NH₃ (Lewis base), BF₃ accepts the lone pair from N → forms a dative bond.',
    real_world: 'BF₃ is widely used as a catalyst in organic synthesis (Friedel-Crafts reactions, polymerisation). Its Lewis acidity is the key.',
  },
  'vsepr-ch4': {
    short: [
      'Perfect tetrahedral — 4 identical C–H bonds, no lone pairs, 109.5°',
      'All bonds equivalent by symmetry → dipole = 0',
      'The reference molecule for sp³ hybridisation in VSEPR',
    ],
    presentation: [
      'C forms 4 identical C–H bonds — 4 electron domains, 0 lone pairs',
      'sp³ hybridisation → perfect tetrahedral geometry at 109.5°',
      'All four C–H dipoles point symmetrically outward → net dipole = 0',
      'Methane is the simplest alkane and benchmark for all sp³ comparisons',
    ],
    geometry_reason: '4 bonding pairs with no lone pairs → perfect tetrahedral with equal 109.5° angles on all sides.',
    polarity: 'Non-polar — 4 identical bonds arranged symmetrically; all dipole contributions cancel.',
    exam_tip: 'Use CH₄ as the reference: NH₃ has 1 lone pair → 107°, H₂O has 2 lone pairs → 104.5°. Each lone pair reduces the angle ~2.5°.',
    real_world: 'Methane is the primary component of natural gas and a potent greenhouse gas (28× more warming than CO₂ over 100 years).',
  },
  'vsepr-nh3': {
    short: [
      '1 lone pair on N → bond angle compressed from 109.5° to 107°',
      'Trigonal pyramidal shape — N at apex of a flattened tetrahedron',
      'Lone pair on N makes NH₃ a Lewis base and nucleophile',
    ],
    presentation: [
      'N has 4 electron pairs: 3 bonding N–H + 1 lone pair (sp³)',
      'Lone pair repels the 3 bond pairs → H–N–H angle 107° (less than 109.5°)',
      'Molecular shape is trigonal pyramidal, not planar — lone pair takes up equatorial space',
      'The lone pair is responsible for NH₃\'s basicity and nucleophilicity',
    ],
    geometry_reason: '1 lone pair occupies more space than a bonding pair, pushing bond pairs closer together and reducing angle to 107°.',
    polarity: 'Polar — pyramidal shape means N–H dipoles do not cancel; net dipole points from H₃ base toward N.',
    exam_tip: 'NH₃ basicity: lone pair on N donates to H⁺ (Brønsted base) or empty orbitals (Lewis base). Both mechanismswork via the same lone pair.',
    real_world: 'Produced via Haber process (N₂ + 3H₂ → 2NH₃) — the backbone of global fertiliser production feeding ~50% of the world\'s population.',
  },
  'vsepr-pcl5': {
    short: [
      'sp³d hybridisation — expanded octet, 5 bond pairs, no lone pairs',
      'Trigonal bipyramidal: 3 equatorial (120°) + 2 axial (90°) positions',
      'Axial bonds are longer and weaker than equatorial bonds',
    ],
    presentation: [
      'P uses d-orbitals to form 5 bonds — expanded octet beyond the normal 8',
      'sp³d hybridisation → trigonal bipyramidal geometry',
      'Equatorial bonds (3) at 120°; axial bonds (2) at 90° to equatorial plane',
      'Axial bonds experience more repulsion → longer (240 pm) vs equatorial (202 pm)',
    ],
    geometry_reason: '5 electron domains with no lone pairs → trigonal bipyramidal. Axial and equatorial positions are not equivalent.',
    polarity: 'Non-polar — the molecule has a C₃ᵥ symmetry axis; all bond dipoles cancel when summed vectorially.',
    exam_tip: 'JEE Advanced: axial bonds are longer/weaker than equatorial in PCl₅. This is because axial bonds interact with more electron pairs (three 90° interactions vs two for equatorial).',
    real_world: 'PCl₅ is a key reagent in pharmaceuticals and dye synthesis for converting –COOH and –OH groups to reactive –COCl and –Cl groups.',
  },
  'vsepr-sf6': {
    short: [
      'sp³d² hybridisation — 6 bond pairs, perfectly octahedral, all 90°',
      'S uses d-orbitals for expanded octet (12 electrons around S)',
      'Perfect symmetry → dipole = 0, extremely chemically inert',
    ],
    presentation: [
      'S forms 6 bonds with F — requires d-orbital participation (expanded octet)',
      'sp³d² hybridisation → octahedral geometry, all bond angles 90°',
      'All 6 S–F bonds are identical; perfect Oh symmetry',
      'Net dipole = 0 — 6 polar bonds cancel completely due to geometry',
    ],
    geometry_reason: '6 equivalent bonding domains with no lone pairs → perfect octahedral with all 90° angles.',
    polarity: 'Non-polar — octahedral symmetry causes all S–F dipole vectors to cancel in pairs.',
    exam_tip: 'SF₆ is the most common example of sp³d² hybridisation. Remember: PCl₅ = sp³d (trigonal bipyramidal), SF₆ = sp³d² (octahedral).',
    real_world: 'SF₆ is the most potent known greenhouse gas (23,500× more warming than CO₂ per molecule). Used in electrical insulation — its inertness is both useful and an environmental risk.',
  },
  'vsepr-xef4': {
    short: [
      'sp³d² hybridisation — 6 electron pairs: 4 bonding + 2 lone pairs',
      'Lone pairs sit opposite each other (trans) → square planar molecular shape',
      'Key distinction: 6 electron pairs but only 4 bonds → not octahedral',
    ],
    presentation: [
      'Xe has 6 electron domains: 4 Xe–F bonds + 2 lone pairs (sp³d²)',
      'To minimise repulsion, lone pairs occupy axial positions (trans to each other)',
      'The 4 F atoms form a square in the equatorial plane → square planar shape',
      'Despite polar Xe–F bonds, the square planar geometry makes dipole = 0',
    ],
    geometry_reason: '2 lone pairs prefer trans positions in octahedral arrangement → lone pairs cancel each other\'s repulsion, leaving F atoms in a square plane.',
    polarity: 'Non-polar — the 4 Xe–F dipoles cancel in pairs across the square plane.',
    exam_tip: 'JEE distinction: XeF₄ has 6 electron pairs (octahedral electron geometry) but 4 bonds (square planar molecular geometry). Always state both.',
    real_world: 'XeF₄ was the first noble gas compound deliberately synthesised (1962), proving the chemical inactivity of noble gases was not absolute.',
  },

  /* ── ORGANIC ─────────────────────────────────────── */
  'org-benz': {
    short: [
      '6 delocalized π electrons — satisfies Hückel rule (4n+2, n=1)',
      'All C–C bonds equal length (1.40 Å) — between single and double bond',
      'Planar, symmetric ring → dipole = 0, resistant to addition reactions',
    ],
    presentation: [
      'Each C is sp² hybridised — 3 sigma bonds in the plane + 1 unhybridised p-orbital',
      'The 6 p-orbitals overlap above and below the ring → delocalised π system',
      'Resonance energy ~150 kJ/mol makes benzene more stable than a hypothetical cyclohexatriene',
      'Undergoes electrophilic aromatic substitution (not addition) to preserve aromaticity',
    ],
    geometry_reason: 'All sp² carbons in a flat ring with equal bond angles of 120° — resonance delocalisation equalises all bond lengths.',
    polarity: 'Non-polar — perfectly symmetric hexagonal ring; all bond dipoles cancel completely.',
    exam_tip: 'Benzene undergoes EAS (electrophilic aromatic substitution), NOT addition. This preserves the aromatic pi system. Addition would destroy aromaticity.',
    real_world: 'Benzene is the foundation of the aromatic compound family — aspirin, paracetamol, TNT, DNA bases, and most pharmaceuticals contain benzene rings.',
  },
  'org-etoh': {
    short: [
      'Polar O–H group enables H-bonding → bp 78°C despite low MW',
      'C–O–H angle ~109.5° — sp³ O with 2 lone pairs',
      'Both hydrophilic (–OH) and hydrophobic (–CH₂CH₃) portions',
    ],
    presentation: [
      'Ethanol has sp³ carbon atoms and a bent sp³ oxygen (2 lone pairs)',
      'The –OH group forms strong H-bonds with water → completely miscible',
      'H-bonding raises bp to 78°C vs propane –42°C (similar MW but no H-bonding)',
      'Amphiphilic structure: –OH is polar/hydrophilic, –C₂H₅ is nonpolar/hydrophobic',
    ],
    geometry_reason: 'sp³ O with 2 lone pairs creates a bent C–O–H angle (~108°), similar to water but perturbed by the ethyl group.',
    polarity: 'Polar — the O–H bond and C–O bond both contribute to a net molecular dipole (1.69 D).',
    exam_tip: 'H-bonding in ethanol: ethanol can be both H-bond donor (via –OH) and acceptor (via O lone pair). This doubles its H-bonding interactions vs acetone.',
    real_world: 'Ethanol is the active component in alcoholic beverages, hand sanitisers (denatures proteins), and a biofuel. Industrial production uses yeast fermentation of glucose.',
  },
  'org-acet': {
    short: [
      'sp² carbonyl carbon (C=O) — trigonal planar with ~120° angles',
      'Most polar common solvent that cannot H-bond donate',
      'C=O bond is highly polarised: C⁺–O⁻ partial charges',
    ],
    presentation: [
      'Central carbonyl C is sp² — double bond to O + two single bonds to CH₃ groups',
      'Trigonal planar around C=O: all bond angles ~120°',
      'C=O is polar (electronegativity difference) — large dipole (2.91 D)',
      'No O–H group → cannot donate H-bonds, but can accept them via lone pairs on O',
    ],
    geometry_reason: 'sp² hybridisation at carbonyl C → flat trigonal arrangement with 120° angles around C.',
    polarity: 'Polar — the C=O dipole is large (2.91 D) and not cancelled by the symmetric methyl groups.',
    exam_tip: 'Acetone is used in Lucas test: tertiary alcohols react instantly with ZnCl₂/HCl (Lucas reagent) at room temperature. Secondary alcohols take 5 min. Primary do not react without heating.',
    real_world: 'Acetone is the body\'s main ketone body in diabetic ketoacidosis — causes the characteristic fruity breath. Also the most common organic solvent in labs.',
  },
  'org-acac': {
    short: [
      'Planar –COOH group: sp² carbonyl C with resonance delocalization',
      'Forms H-bonded dimers in non-polar solvents → apparent MW doubles',
      'Weak acid: Ka = 1.8×10⁻⁵, about 10,000× weaker than HCl',
    ],
    presentation: [
      'The carboxyl group –COOH has an sp² C: C=O and C–OH in resonance',
      'Resonance in –COO⁻ (acetate ion) makes both C–O bonds equal length',
      'In non-polar solvents like benzene, two molecules form cyclic H-bonded dimers',
      'This dimerisation doubles the apparent molecular weight (60 → ~120 g/mol)',
    ],
    geometry_reason: 'sp² hybridised carbonyl C forces the –COOH group to be planar with ~120° bond angles around C.',
    polarity: 'Polar — the –COOH group has a significant dipole; the molecule is not symmetric.',
    exam_tip: 'Classic JEE concept: acetic acid in benzene shows MW ~120 g/mol instead of 60 g/mol due to dimerization via H-bonding. Use: observed MW / calculated MW = 2 → degree of association = 1.',
    real_world: 'Acetic acid is the active component of vinegar (4–8%). Industrially, it\'s made by oxidation of acetaldehyde or the Monsanto process (CO + CH₃OH with Rh catalyst).',
  },
  'org-form': {
    short: [
      'Simplest aldehyde — one C with one H and a C=O double bond',
      'sp² carbonyl C → trigonal planar, ~120° bond angles',
      'Most reactive of all aldehydes — no bulky groups to shield C=O',
    ],
    presentation: [
      'Formaldehyde: H₂C=O — sp² carbon with trigonal planar geometry',
      'C=O is polar; the molecule also has a significant net dipole (2.33 D)',
      'No alpha-H stabilisation or steric shielding → very reactive in nucleophilic addition',
      'Forms polyoxymethylene (formaldehyde polymer) spontaneously when concentrated',
    ],
    geometry_reason: 'sp² hybridised C — 3 sigma bonds (2 to H, 1 to O) + one π bond to O — forces a flat 120° arrangement.',
    polarity: 'Polar — large C=O dipole (2.33 D); the H atoms have small opposing dipoles but don\'t cancel the main C=O dipole.',
    exam_tip: 'Formaldehyde undergoes addition reactions at C=O much more readily than other aldehydes (no steric bulk). It gives a positive Tollens\' test (silver mirror) and Fehling\'s test.',
    real_world: 'Formalin (37% aqueous formaldehyde) is used as a biological preservative and embalming fluid. It reacts with proteins via –NH₂ groups (cross-linking). A known carcinogen.',
  },

  /* ── BIOMOLECULES ────────────────────────────────── */
  'bio-gluc': {
    short: [
      'Pyranose ring: 6-membered ring with 5 C and 1 O, all sp³',
      'Anomeric C1: α (axial –OH) and β (equatorial –OH) interconvert via mutarotation',
      'β-D-glucose (64%) more stable than α-D-glucose (36%) — equatorial –OH preferred',
    ],
    presentation: [
      'Open-chain glucose (6C aldehyde) cyclises to a pyranose ring via intramolecular hemiacetal formation',
      'C1 becomes the anomeric carbon — two configurations: α (–OH axial) and β (–OH equatorial)',
      'In aqueous solution, α and β forms interconvert (mutarotation) reaching ~36:64 equilibrium',
      'β-glucose is more stable (–OH equatorial) — same reason β-maltose, β-cellobiose are stable',
    ],
    geometry_reason: 'All 6 ring atoms adopt sp³ hybridisation in chair conformation to minimise angle strain and torsional strain.',
    polarity: 'Polar and highly hydrophilic — multiple –OH groups form H-bonds with water; freely soluble.',
    exam_tip: 'Mutarotation: [α]D of pure α-D-glucose (+112°) and β-D-glucose (+19°) both equilibrate to +52.7° in solution. This is a direct consequence of anomeric interconversion.',
    real_world: 'Glucose is the universal cellular fuel — oxidised in glycolysis and the citric acid cycle. Blood glucose is tightly regulated at ~5 mmol/L. Diabetes involves loss of this regulation.',
  },
  'bio-aden': {
    short: [
      'Purine base: bicyclic aromatic system (pyrimidine fused with imidazole)',
      'Pairs with thymine (DNA) via 2 H-bonds; with uracil (RNA)',
      'Component of ATP — the universal energy currency of cells',
    ],
    presentation: [
      'Adenine is a purine: a 6-membered pyrimidine ring fused with a 5-membered imidazole ring',
      'Fully aromatic — all atoms sp², planar, delocalised π system',
      'In DNA, A pairs with T via 2 H-bonds (A–T weaker than G–C which has 3 H-bonds)',
      'Adenosine triphosphate (ATP) contains adenine: hydrolysis of ATP → ADP + Pi releases ~30 kJ/mol',
    ],
    geometry_reason: 'All ring atoms are sp² hybridised → planar bicyclic aromatic system with bond angles close to 120°.',
    polarity: 'Polar — multiple N–H and C–N bonds, amino group (–NH₂) at C6; soluble in water.',
    exam_tip: 'A–T pairs have 2 H-bonds, G–C pairs have 3 H-bonds. Higher G–C content → higher DNA melting temperature (Tm). DNA with more G–C is more thermostable.',
    real_world: 'ATP is the molecular unit of energy currency. Every biochemical reaction requiring energy uses ATP hydrolysis. A resting human turns over ~40 kg of ATP per day.',
  },
  'bio-chol': {
    short: [
      'Steroid backbone: 4 fused rings (3 cyclohexane + 1 cyclopentane)',
      'Single –OH group at C3 — the only polar site on an otherwise hydrophobic molecule',
      'Precursor to all steroid hormones, bile acids, and vitamin D',
    ],
    presentation: [
      'Cholesterol has a rigid steroid core: 3 six-membered rings + 1 five-membered ring fused together',
      'Most carbons are sp³ — the rings are mostly in chair conformations',
      'The single –OH group makes cholesterol amphiphilic (one polar head, large hydrophobic body)',
      'This amphiphilic nature is essential for its role in cell membranes (intercalates between phospholipids)',
    ],
    geometry_reason: 'Predominantly sp³ ring carbons — 4 fused rings create a rigid, relatively flat hydrophobic scaffold.',
    polarity: 'Essentially non-polar with a single polar –OH. The large hydrophobic body dominates → insoluble in water.',
    exam_tip: 'Cholesterol is transported in blood as LDL ("bad") and HDL ("good") lipoprotein complexes because it\'s insoluble in the aqueous bloodstream. High LDL → atherosclerosis risk.',
    real_world: 'Without cholesterol, animal cell membranes would not function — it modulates membrane fluidity and is the precursor for cortisol, testosterone, oestrogen, and vitamin D₃.',
  },
  'bio-alan': {
    short: [
      'Simplest chiral amino acid — alpha carbon has 4 different substituents',
      'L-configuration (natural form): NH₂ and COOH on the same carbon',
      'Non-essential — synthesised in the body from pyruvate',
    ],
    presentation: [
      'Alanine: H₂N–CH(CH₃)–COOH — alpha-C is sp³ with 4 different groups',
      'The 4 groups (–NH₂, –COOH, –CH₃, –H) make C-alpha a stereocentre',
      'L-alanine is the natural (biologically active) enantiomer in all proteins',
      'Exists as zwitterion at physiological pH: –NH₃⁺ and –COO⁻',
    ],
    geometry_reason: 'sp³ alpha-carbon with 4 different substituents → tetrahedral stereocentre with chiral geometry.',
    polarity: 'Polar — both –NH₂ and –COOH groups are ionisable; exists as zwitterion at neutral pH.',
    exam_tip: 'Chirality rule: 4 different groups on sp³ carbon → chiral centre. L-amino acids (natural) vs D-amino acids (found in some bacterial cell walls). Glycine is the only achiral amino acid.',
    real_world: 'L-Alanine is released in large amounts from muscle during fasting/exercise (glucose-alanine cycle) — it travels to the liver for gluconeogenesis.',
  },

  /* ── INORGANIC ───────────────────────────────────── */
  'in-h2so4': {
    short: [
      'Tetrahedral around S: sp³ hybridisation, expanded octet with d-orbitals',
      'Diprotic strong acid: Ka₁ ≫ Ka₂ (first ionisation is complete)',
      'Concentrated H₂SO₄ is a powerful dehydrating agent — not just an acid',
    ],
    presentation: [
      'S is sp³ hybridised: tetrahedral with 2 S=O bonds and 2 S–OH bonds',
      'S=O bonds have partial double-bond character due to p→d back-donation from O',
      'First ionisation is complete (strong acid); second ionisation is partial (Ka₂ = 0.012)',
      'Concentrated H₂SO₄ removes water from compounds chemically — char sugar, dehydrate alcohols',
    ],
    geometry_reason: 'S has 4 bonding domains (2 double bonds + 2 single bonds) → tetrahedral geometry at ~109.5°.',
    polarity: 'Polar — the asymmetric arrangement of S=O and S–OH bonds creates a net dipole.',
    exam_tip: 'Safety: ALWAYS add acid to water (never water to acid). The hydration of H₂SO₄ is highly exothermic — adding water to concentrated acid causes violent spattering.',
    real_world: 'H₂SO₄ is the most produced chemical worldwide (annual production ~270 million tonnes). Used in fertilisers (superphosphate), car batteries, and metal processing.',
  },
  'in-hno3': {
    short: [
      'Trigonal planar around N: sp² hybridisation with N=O and N–OH',
      'Resonance in NO₃⁻ ion: all N–O bonds become equal after ionisation',
      'Strong oxidising acid: HNO₃ + conc. HCl (1:3) = Aqua Regia',
    ],
    presentation: [
      'N is sp² hybridised — trigonal planar with ~120° angles',
      'The –NO₂ group has resonance: N=O and N–O in nitric acid contribute equally in nitrate ion',
      'HNO₃ is both a strong acid AND a strong oxidising agent (via NO₃⁻/NO₂/NO)',
      'Aqua regia (1 HNO₃ : 3 HCl) dissolves gold and platinum by forming chloro-complexes',
    ],
    geometry_reason: 'sp² hybridisation at N (3 electron domains) → trigonal planar with ~120° bond angles.',
    polarity: 'Polar — asymmetric distribution of bonds around N gives a net dipole.',
    exam_tip: 'Brown ring test for NO₃⁻: Fe²⁺ + NO₃⁻ + H⁺ → [Fe(NO)]²⁺ (brown). The test uses freshly prepared FeSO₄ solution and conc. H₂SO₄ added carefully at the side.',
    real_world: 'HNO₃ is essential in explosives manufacture (TNT, nitroglycerin) via nitration reactions. Also used to make ammonium nitrate fertiliser (and explosives).',
  },
  'in-nh3': {
    short: [
      'Same geometry as VSEPR NH₃ (trigonal pyramidal, 107°)',
      'Industrial production via Haber process — critical for global food supply',
      'NH₄⁺ formation: lone pair on N donates to H⁺ — Brønsted base',
    ],
    presentation: [
      'N has sp³ hybridisation: 3 N–H bonds + 1 lone pair → trigonal pyramidal',
      'Lone pair on N is responsible for NH₃\'s base character (pKb = 4.74)',
      'Haber Process: N₂ + 3H₂ ⇌ 2NH₃ at ~450°C, ~200 atm, Fe catalyst',
      'Le Chatelier: high pressure favours NH₃ (fewer moles gas); low T favours product (exothermic) but reduces rate',
    ],
    geometry_reason: '1 lone pair on N compresses H–N–H angle from tetrahedral 109.5° to 107° via enhanced lone pair repulsion.',
    polarity: 'Polar — pyramidal shape prevents dipole cancellation; net dipole points from H₃ base toward lone pair on N.',
    exam_tip: 'Haber process uses compromise conditions: ~450°C (not lower) for acceptable reaction rate, ~200 atm (not higher due to equipment cost), Fe catalyst (not to shift equilibrium — only increases rate).',
    real_world: 'The Haber process feeds approximately 50% of the world\'s population by producing nitrogen fertilisers. Without it, global food production would halve.',
  },
  'in-h3po4': {
    short: [
      'Tetrahedral around P: sp³ hybridisation, 4 bonds (1 P=O + 3 P–OH)',
      'Triprotic weak acid: Ka₁ (7.5×10⁻³) ≫ Ka₂ ≫ Ka₃',
      'Phosphodiester bonds from H₃PO₄ form the backbone of DNA and RNA',
    ],
    presentation: [
      'P is sp³ hybridised — 4 bonding domains (1 double bond to O + 3 single bonds to OH)',
      'Trigonal pyramidal molecular shape — the P=O bond is similar to S=O in H₂SO₄',
      'Triprotic: loses H⁺ in 3 steps: H₃PO₄ → H₂PO₄⁻ → HPO₄²⁻ → PO₄³⁻',
      'Second and third ionisations are much weaker — only Ka₁ is significant in buffering',
    ],
    geometry_reason: 'sp³ P with 4 electron domains — tetrahedral arrangement similar to H₂SO₄ but with different bond orders.',
    polarity: 'Polar — multiple O–H bonds and a P=O bond create a significant net dipole.',
    exam_tip: 'Ka₁ >> Ka₂ >> Ka₃ for polyprotic acids: each successive ionisation is harder because the species is more negatively charged (repels H⁺ more). H₃PO₄ is a weak triprotic acid, not strong.',
    real_world: 'H₃PO₄ is used in fertilisers (superphosphate, NPK), food (pH regulator in cola drinks), and rust treatment. DNA/RNA backbone is built from phosphodiester bonds derived from phosphoric acid.',
  },
};

/* ════════════════════════════════════════
   EDU HELPER FUNCTIONS
════════════════════════════════════════ */

/** Update the sidebar "Learning Insights" chip section */
function updateEduInsights(key) {
  const section = document.getElementById('edu-insights');
  const chips   = document.getElementById('edu-chips');
  if (!section || !chips) return;
  const e = EDU_CONTENT[key];
  if (!e) { section.style.display = 'none'; return; }

  chips.innerHTML = [
    `<div class="edu-chip geo"><span class="edu-chip-k">Geometry</span>${e.geometry_reason}</div>`,
    `<div class="edu-chip"><span class="edu-chip-k">Polarity</span>${e.polarity}</div>`,
    `<div class="edu-chip tip"><span class="edu-chip-k">⚡ Exam Tip</span>${e.exam_tip}</div>`,
  ].join('');
  section.style.display = '';
}

/** Enhance the edu-card overlay with richer insight from EDU_CONTENT */
function updateEduCardEnhanced(meta, key) {
  const card = document.getElementById('edu-card');
  if (!meta || !meta.s) { card.classList.remove('v'); return; }

  document.getElementById('edu-name').textContent = meta.n || '—';
  document.getElementById('edu-geo').textContent  = meta.s || '—';
  document.getElementById('edu-hyb').textContent  = meta.h || '—';
  document.getElementById('edu-ang').textContent  = meta.a || '—';

  // Prefer EDU_CONTENT polarity sentence, fall back to meta.x
  const e = key ? EDU_CONTENT[key] : null;
  const insight = (e && e.polarity) ? e.polarity : (meta.x || meta.g || '');
  const short = insight.length > 90 ? insight.slice(0,88) + '…' : insight;
  document.getElementById('edu-ins').textContent = short;
  card.classList.add('v');
}

/** Update pmode panel with full teaching steps and real-world card */
function updatePmodePanelEnhanced(meta, key) {
  if (!meta) { hidePmodePanel(); return; }

  // Existing geo + hyb cards (unchanged)
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

  // NEW: teaching steps + real-world card
  const stepsCard = document.getElementById('pmp-steps-card');
  const stepsList = document.getElementById('pmp-steps');
  const rwEl      = document.getElementById('pmp-rw');
  const rwText    = document.getElementById('pmp-rw-text');
  const e = key ? EDU_CONTENT[key] : null;

  if (e && e.presentation && e.presentation.length) {
    stepsList.innerHTML = e.presentation.map((s, i) =>
      `<li class="pmp-step"><span class="pmp-step-n">${pmodeOn ? '•' : i+1}</span>${s}</li>`
    ).join('');
    if (e.real_world) {
      rwText.textContent = e.real_world;
      rwEl.style.display = '';
    } else {
      rwEl.style.display = 'none';
    }
    stepsCard.style.display = '';
  } else {
    stepsCard.style.display = 'none';
  }
}

/** Show bond angle with reason text below SVG */
function showBondAngleEnhanced(key) {
  const angle   = BOND_ANGLES[key];
  const svg     = document.getElementById('bond-angle-svg');
  const reason  = document.getElementById('ba-reason');
  const geoBadge = document.getElementById('pmode-geo-badge');
  if (!reason) return;

  if (!angle || curMode !== '3d') {
    svg.classList.remove('v');
    reason.classList.remove('v');
    if (geoBadge) geoBadge.textContent = '';
    return;
  }

  const cx = 60, cy = 10, r = 44;
  if (angle >= 175) {
    document.getElementById('ba-arc').setAttribute('d', `M 10,${cy} L 110,${cy}`);
    document.getElementById('ba-arc').setAttribute('fill','none');
  } else {
    const half = (angle / 2) * Math.PI / 180;
    const x1 = cx + r * Math.sin(-half), y1 = cy + r * Math.cos(-half);
    const x2 = cx + r * Math.sin(half),  y2 = cy + r * Math.cos(half);
    const large = angle > 180 ? 1 : 0;
    document.getElementById('ba-arc').setAttribute('d',
      `M ${x1.toFixed(1)},${y1.toFixed(1)} A ${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} L ${cx},${cy} Z`);
    document.getElementById('ba-arc').setAttribute('fill','rgba(0,229,180,.08)');
    document.getElementById('ba-arc').setAttribute('stroke','rgba(0,229,180,.5)');
  }
  document.getElementById('ba-label').textContent = angle + '°';
  svg.classList.add('v');

  // Reason text (normal mode only) — truncated geometry explanation
  const e = EDU_CONTENT[key];
  if (!pmodeOn) {
    if (e && e.geometry_reason) {
      const short = e.geometry_reason.length > 62
        ? e.geometry_reason.slice(0,60) + '…'
        : e.geometry_reason;
      reason.textContent = short;
      reason.classList.add('v');
    } else {
      reason.classList.remove('v');
    }
  } else {
    reason.classList.remove('v');
  }

  // Pmode: show compact geometry name badge above the SVG (bottom-right)
  if (geoBadge) {
    if (pmodeOn && curMeta && curMeta.s) {
      geoBadge.textContent = curMeta.s;
    } else {
      geoBadge.textContent = '';
    }
  }
}

/** Enhance EDU_HIGHLIGHTS to cover all molecules using EDU_CONTENT */
function showEduHighlightEnhanced(key) {
  const el = document.getElementById('edu-highlight');
  if (curMode !== '3d') { el.classList.remove('v'); return; }

  // Use existing EDU_HIGHLIGHTS first, fall back to EDU_CONTENT
  const hl = EDU_HIGHLIGHTS[key];
  const e  = EDU_CONTENT[key];

  let title, text;
  if (hl) {
    title = hl.title; text = hl.text;
  } else if (e) {
    title = 'Key Insight';
    text  = e.short[0]; // first learning point
  } else {
    el.classList.remove('v'); return;
  }

  document.getElementById('hl-title').textContent = title;
  document.getElementById('hl-text').textContent  = text;
  el.classList.add('v');
  clearTimeout(showEduHighlightEnhanced._t);
  showEduHighlightEnhanced._t = setTimeout(() => el.classList.remove('v'), 8000);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && pmodeOn) {
    setTimeout(() => {
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!isFs && pmodeOn) { pmodeOn = false; applyPmodeState(false); }
    }, 80);
  }
}, true);

window.addEventListener('resize', () => {
  if (pmodeOn) document.body.dataset.pmodeDevice = getDeviceType();
});
