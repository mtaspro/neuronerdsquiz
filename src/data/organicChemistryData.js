/**
 * organicChemistryData.js
 * -----------------------
 * HSC (NCTB) Organic Chemistry data — reactants, reagents, reactions,
 * qualitative tests and board-style MCQ/CQ benchmarks.
 *
 * Consumed by:
 *   - src/pages/ChemistryLab.jsx  (virtual bench)
 *   - src/components/chemistry/ReactionCanvas.jsx
 *   - AdventureHub organic quest section
 *
 * ponytail: compounds are formula-keyed cards, not a SMILES parser.
 * Structural rendering = ASCII condensed formula + functional-group tag.
 * Upgrade path: swap `structure` for SMILES + a 2D renderer later.
 */

export const FUNCTIONAL_GROUPS = {
  alkane: 'Alkane (C–C single)',
  alkene: 'Alkene (C=C)',
  alkyne: 'Alkyne (C≡C)',
  aromatic: 'Aromatic (benzene ring)',
  haloalkane: 'Haloalkane (R–X)',
  alcohol1: '1° Alcohol (–CH₂OH)',
  alcohol2: '2° Alcohol (–CHOH–)',
  alcohol3: '3° Alcohol (–C–OH)',
  aldehyde: 'Aldehyde (–CHO)',
  ketone: 'Ketone (–CO–)',
  acid: 'Carboxylic acid (–COOH)',
  amine1: '1° Amine (–NH₂)',
  ether: 'Ether (R–O–R)',
};

// ── Reactant library (bench shelf) ────────────────────────────────────────────
export const REACTANTS = [
  // Hydrocarbons
  { id: 'methane',     name: 'Methane',           formula: 'CH₄',        iupac: 'methane',                 group: 'alkane',     structure: 'CH₄' },
  { id: 'ethane',      name: 'Ethane',            formula: 'C₂H₆',       iupac: 'ethane',                  group: 'alkane',     structure: 'CH₃–CH₃' },
  { id: 'ethene',      name: 'Ethene',            formula: 'C₂H₄',       iupac: 'ethene',                  group: 'alkene',     structure: 'CH₂=CH₂' },
  { id: 'propene',     name: 'Propene',           formula: 'C₃H₆',       iupac: 'prop-1-ene',              group: 'alkene',     structure: 'CH₂=CH–CH₃' },
  { id: 'ethyne',      name: 'Ethyne (Acetylene)',formula: 'C₂H₂',       iupac: 'ethyne',                  group: 'alkyne',     structure: 'CH≡CH' },
  { id: 'propyne',     name: 'Propyne',           formula: 'C₃H₄',       iupac: 'prop-1-yne',              group: 'alkyne',     structure: 'CH≡C–CH₃' },
  { id: 'benzene',     name: 'Benzene',           formula: 'C₆H₆',       iupac: 'benzene',                 group: 'aromatic',   structure: 'C₆H₆ (ring)' },
  { id: 'toluene',     name: 'Toluene',           formula: 'C₇H₈',       iupac: 'methylbenzene',           group: 'aromatic',   structure: 'C₆H₅–CH₃' },
  // Haloalkanes
  { id: 'chloroethane',name: 'Chloroethane',      formula: 'C₂H₅Cl',     iupac: 'chloroethane',            group: 'haloalkane', structure: 'CH₃–CH₂–Cl' },
  { id: 'tertbutylcl', name: '2-Chloro-2-methylpropane', formula: '(CH₃)₃CCl', iupac: '2-chloro-2-methylpropane', group: 'haloalkane', structure: '(CH₃)₃C–Cl' },
  // Alcohols
  { id: 'methanol',    name: 'Methanol',          formula: 'CH₃OH',      iupac: 'methanol',                group: 'alcohol1',   structure: 'CH₃–OH' },
  { id: 'ethanol',     name: 'Ethanol',           formula: 'C₂H₅OH',     iupac: 'ethanol',                 group: 'alcohol1',   structure: 'CH₃–CH₂–OH' },
  { id: 'propan2ol',   name: 'Propan-2-ol',       formula: 'C₃H₇OH',     iupac: 'propan-2-ol',             group: 'alcohol2',   structure: '(CH₃)₂CH–OH' },
  { id: 'tertbutanol', name: '2-Methylpropan-2-ol', formula: 'C₄H₉OH',   iupac: '2-methylpropan-2-ol',     group: 'alcohol3',   structure: '(CH₃)₃C–OH' },
  // Carbonyls
  { id: 'methanal',    name: 'Methanal (Formaldehyde)', formula: 'HCHO', iupac: 'methanal',                group: 'aldehyde',   structure: 'H–CHO' },
  { id: 'ethanal',     name: 'Ethanal (Acetaldehyde)',  formula: 'CH₃CHO', iupac: 'ethanal',               group: 'aldehyde',   structure: 'CH₃–CHO' },
  { id: 'propanone',   name: 'Propanone (Acetone)',     formula: 'C₃H₆O',  iupac: 'propan-2-one',          group: 'ketone',     structure: 'CH₃–CO–CH₃' },
  // Acids / amines
  { id: 'methanoic',   name: 'Methanoic acid',    formula: 'HCOOH',      iupac: 'methanoic acid',          group: 'acid',       structure: 'H–COOH' },
  { id: 'ethanoic',    name: 'Ethanoic acid',     formula: 'CH₃COOH',    iupac: 'ethanoic acid',           group: 'acid',       structure: 'CH₃–COOH' },
  { id: 'methylamine', name: 'Methylamine',       formula: 'CH₃NH₂',     iupac: 'methanamine',             group: 'amine1',     structure: 'CH₃–NH₂' },
  { id: 'aniline',     name: 'Aniline',           formula: 'C₆H₅NH₂',    iupac: 'phenylamine',             group: 'amine1',     structure: 'C₆H₅–NH₂' },
];

// ── Reagents ──────────────────────────────────────────────────────────────────
export const REAGENTS = [
  { id: 'kmno4',      name: 'KMnO₄ (alkaline, cold)', tag: 'Baeyer’s reagent' },
  { id: 'br2water',   name: 'Br₂ / water',            tag: 'Bromine water' },
  { id: 'tollens',    name: 'Tollens’ reagent',       tag: '[Ag(NH₃)₂]⁺ OH⁻' },
  { id: 'fehling',    name: 'Fehling’s solution',     tag: 'Cu²⁺ tartrate' },
  { id: 'dnph',       name: '2,4-DNPH',               tag: 'Brady’s reagent' },
  { id: 'lucas',      name: 'Lucas reagent',          tag: 'ZnCl₂ + conc. HCl' },
  { id: 'hno3h2so4',  name: 'conc. HNO₃ + conc. H₂SO₄', tag: 'Nitration mix (50–60 °C)' },
  { id: 'alcl3rx',    name: 'RX / anhyd. AlCl₃',      tag: 'Friedel–Crafts alkylation' },
  { id: 'naoh_cao',   name: 'NaOH + CaO, Δ',          tag: 'Soda lime (decarboxylation)' },
  { id: 'chcl3_koh',  name: 'CHCl₃ + alc. KOH, Δ',    tag: 'Carbylamine test' },
  { id: 'i2_naoh',    name: 'I₂ + NaOH',              tag: 'Iodoform (haloform) test' },
  { id: 'o3_zn',      name: 'O₃ then Zn/H₂O',         tag: 'Ozonolysis' },
  { id: 'h2_ni',      name: 'H₂ / Ni, Δ',             tag: 'Catalytic hydrogenation' },
  { id: 'na',         name: 'Na metal',               tag: 'Sodium test' },
];

// ── Reaction rules ────────────────────────────────────────────────────────────
// Each rule: reactant group(s) + reagent → observation + product + equation.
// `visual` drives ReactionCanvas: one of
//   'color-fade'  'silver-mirror' 'precipitate' 'bubbles' 'smoke' 'glow' 'none'
export const REACTIONS = [
  // ── Unsaturation tests ────────────────────────────────────────────────
  {
    id: 'alkene-kmno4', groups: ['alkene'], reagent: 'kmno4',
    equation: 'CH₂=CH₂ + [O] + H₂O → HO–CH₂–CH₂–OH',
    product: 'Ethane-1,2-diol',
    observation: 'Purple KMnO₄ decolourised — unsaturation detected.',
    visual: 'color-fade', color: '#a855f7',
  },
  {
    id: 'alkene-br2', groups: ['alkene'], reagent: 'br2water',
    equation: 'CH₂=CH₂ + Br₂ → Br–CH₂–CH₂–Br',
    product: '1,2-Dibromoethane',
    observation: 'Orange bromine water decolourised.',
    visual: 'color-fade', color: '#f97316',
  },
  {
    id: 'alkyne-br2', groups: ['alkyne'], reagent: 'br2water',
    equation: 'CH≡CH + 2Br₂ → CHBr₂–CHBr₂',
    product: '1,1,2,2-Tetrabromoethane',
    observation: 'Bromine water decolourised.',
    visual: 'color-fade', color: '#f97316',
  },
  {
    id: 'alkyne-kmno4', groups: ['alkyne'], reagent: 'kmno4',
    equation: 'CH≡CH + 4[O] → HOOC–COOH',
    product: 'Oxalic acid',
    observation: 'KMnO₄ decolourised — terminal alkyne oxidised.',
    visual: 'color-fade', color: '#a855f7',
  },
  {
    id: 'alkene-o3', groups: ['alkene'], reagent: 'o3_zn',
    equation: 'CH₃–CH=CH₂ + O₃ → Zn/H₂O → CH₃CHO + HCHO',
    product: 'Ethanal + Methanal',
    observation: 'Ozonolysis splits the C=C into two carbonyl compounds.',
    visual: 'smoke', color: '#94a3b8',
  },
  {
    id: 'alkene-h2', groups: ['alkene'], reagent: 'h2_ni',
    equation: 'CH₂=CH₂ + H₂ → Ni,Δ → CH₃–CH₃',
    product: 'Ethane',
    observation: 'Alkene reduced to alkane.',
    visual: 'bubbles', color: '#67e8f9',
  },
  // ── Aromatic substitution ─────────────────────────────────────────────
  {
    id: 'benzene-nitro', groups: ['aromatic'], reagent: 'hno3h2so4',
    equation: 'C₆H₆ + HNO₃ → H₂SO₄,50–60°C → C₆H₅–NO₂ + H₂O',
    product: 'Nitrobenzene',
    observation: 'Pale-yellow nitrobenzene layer forms; characteristic smell.',
    visual: 'precipitate', color: '#fde047',
  },
  {
    id: 'benzene-fc', groups: ['aromatic'], reagent: 'alcl3rx',
    equation: 'C₆H₆ + CH₃Cl → AlCl₃ → C₆H₅–CH₃ + HCl',
    product: 'Toluene (via Friedel–Crafts)',
    observation: 'Alkylbenzene formed; HCl fumes evolved.',
    visual: 'smoke', color: '#e2e8f0',
  },
  // ── Alcohols ──────────────────────────────────────────────────────────
  {
    id: 'alcohol-na', groups: ['alcohol1','alcohol2','alcohol3'], reagent: 'na',
    equation: '2R–OH + 2Na → 2R–ONa + H₂↑',
    product: 'Sodium alkoxide',
    observation: 'H₂ gas bubbles; brisk effervescence.',
    visual: 'bubbles', color: '#67e8f9',
  },
  {
    id: 'lucas-3', groups: ['alcohol3'], reagent: 'lucas',
    equation: '(CH₃)₃C–OH + HCl → ZnCl₂ → (CH₃)₃C–Cl + H₂O',
    product: '3° alkyl chloride',
    observation: 'Immediate turbidity — 3° alcohol.',
    visual: 'precipitate', color: '#e2e8f0', speed: 'instant',
  },
  {
    id: 'lucas-2', groups: ['alcohol2'], reagent: 'lucas',
    equation: '(CH₃)₂CH–OH + HCl → ZnCl₂ → (CH₃)₂CH–Cl + H₂O',
    product: '2° alkyl chloride',
    observation: 'Turbidity within ~5 min — 2° alcohol.',
    visual: 'precipitate', color: '#e2e8f0', speed: 'medium',
  },
  {
    id: 'lucas-1', groups: ['alcohol1'], reagent: 'lucas',
    equation: 'R–CH₂OH + HCl → ZnCl₂ → (very slow)',
    product: 'No reaction at room temp',
    observation: 'No turbidity — 1° alcohol.',
    visual: 'none', color: '#475569', speed: 'slow',
  },
  // ── Carbonyls ─────────────────────────────────────────────────────────
  {
    id: 'tollens-ald', groups: ['aldehyde'], reagent: 'tollens',
    equation: 'R–CHO + 2[Ag(NH₃)₂]⁺ + 3OH⁻ → R–COO⁻ + 2Ag↓ + 4NH₃ + 2H₂O',
    product: 'Silver mirror',
    observation: 'Silver mirror forms on test-tube wall — aldehyde confirmed.',
    visual: 'silver-mirror', color: '#e2e8f0',
  },
  {
    id: 'fehling-ald', groups: ['aldehyde'], reagent: 'fehling',
    equation: 'R–CHO + 2Cu²⁺ + 5OH⁻ → R–COO⁻ + Cu₂O↓ + 3H₂O',
    product: 'Brick-red Cu₂O precipitate',
    observation: 'Brick-red precipitate — reducing aldehyde.',
    visual: 'precipitate', color: '#dc2626',
  },
  {
    id: 'dnph-carbonyl', groups: ['aldehyde','ketone'], reagent: 'dnph',
    equation: 'C=O + H₂N–NH–C₆H₃(NO₂)₂ → C=N–NH–C₆H₃(NO₂)₂ + H₂O',
    product: 'Orange 2,4-DNP hydrazone',
    observation: 'Orange-yellow precipitate — carbonyl present.',
    visual: 'precipitate', color: '#fb923c',
  },
  {
    id: 'haloform', groups: ['aldehyde','ketone'], reagent: 'i2_naoh',
    condition: (r) => r.id === 'ethanal' || r.id === 'propanone',
    equation: 'CH₃–CO–R + 3I₂ + 4NaOH → CHI₃↓ + R–COONa + 3NaI + 3H₂O',
    product: 'Iodoform (CHI₃)',
    observation: 'Yellow CHI₃ crystals — CH₃–CO– group detected.',
    visual: 'precipitate', color: '#fde047',
  },
  // ── Acids ─────────────────────────────────────────────────────────────
  {
    id: 'acid-decarb', groups: ['acid'], reagent: 'naoh_cao',
    equation: 'CH₃COONa + NaOH → CaO,Δ → CH₄↑ + Na₂CO₃',
    product: 'Alkane with one fewer C',
    observation: 'Alkane gas evolved (decarboxylation).',
    visual: 'bubbles', color: '#a3e635',
  },
  // ── Amines ────────────────────────────────────────────────────────────
  {
    id: 'carbylamine', groups: ['amine1'], reagent: 'chcl3_koh',
    equation: 'R–NH₂ + CHCl₃ + 3KOH → R–N≡C + 3KCl + 3H₂O',
    product: 'Isocyanide (carbylamine)',
    observation: 'Offensive-smelling isocyanide — 1° amine confirmed.',
    visual: 'smoke', color: '#f472b6',
  },
];

// ── Lookup helper used by the lab ─────────────────────────────────────────────
export function findReaction(reactant, reagentId) {
  const rule = REACTIONS.find(
    (r) => r.reagent === reagentId && r.groups.includes(reactant.group)
  );
  if (!rule) return null;
  if (rule.condition && !rule.condition(reactant)) return null;
  return rule;
}

// ── Board MCQ/CQ benchmarks (NCTB pattern, mapped to chapter_02 topic codes) ───
// topic codes follow the PDF lecture table (T-01 … qualitative-analysis)
export const QUESTION_BANK = [
  {
    id: 'oc-mcq-01', topic: 'T-01 nomenclature', type: 'mcq',
    q: 'IUPAC name of (CH₃)₃C–Cl?',
    options: ['2-chloro-2-methylpropane', '1-chloro-tert-butane', '2-chloropropane', 'tert-butyl chloride (IUPAC)'],
    answer: 0, board: 'DB’25',
  },
  {
    id: 'oc-mcq-02', topic: 'T-01 nomenclature', type: 'mcq',
    q: 'In HC≡C–CH=CH₂, the C–C bond between the two central carbons is formed by which hybridisation overlap?',
    options: ['sp–sp²', 'sp²–sp²', 'sp–sp³', 'sp³–sp³'],
    answer: 0, board: 'DB’25',
  },
  {
    id: 'oc-mcq-03', topic: 'T-01 nomenclature', type: 'mcq',
    q: 'Correct IUPAC name of CH₃–CH=CH–COOH?',
    options: ['but-2-enoic acid', '2-butenoic acid', 'butenoic-2 acid', 'prop-2-enoic acid'],
    answer: 0, board: 'BB’25',
  },
  {
    id: 'oc-mcq-04', topic: 'T-01 functional group', type: 'mcq',
    q: 'Hybridisation of the carbonyl carbon in >C=O?',
    options: ['sp³', 'sp²', 'sp', 'dsp²'],
    answer: 1, board: 'JB’25',
  },
  {
    id: 'oc-mcq-05', topic: 'qualitative analysis', type: 'mcq',
    q: 'Which reagent gives a silver mirror with ethanal but not propanone?',
    options: ['Fehling’s solution', 'Tollens’ reagent', '2,4-DNPH', 'Lucas reagent'],
    answer: 1, board: 'NCTB standard',
  },
  {
    id: 'oc-mcq-06', topic: 'qualitative analysis', type: 'mcq',
    q: 'The carbylamine test identifies which class?',
    options: ['1° amines', '2° amines', 'aldehydes', 'ketones'],
    answer: 0, board: 'NCTB standard',
  },
  {
    id: 'oc-mcq-07', topic: 'qualitative analysis', type: 'mcq',
    q: 'Immediate turbidity with Lucas reagent indicates a ___ alcohol.',
    options: ['1°', '2°', '3°', 'phenolic'],
    answer: 2, board: 'NCTB standard',
  },
  {
    id: 'oc-mcq-08', topic: 'aromatic', type: 'mcq',
    q: 'Nitration of benzene requires which reagent pair at 50–60 °C?',
    options: ['HNO₃ + H₂SO₄', 'HCl + ZnCl₂', 'Br₂ + FeBr₃', 'CH₃Cl + AlCl₃'],
    answer: 0, board: 'NCTB standard',
  },
];

export const CQ_BANK = [
  {
    id: 'oc-cq-01', topic: 'qualitative analysis',
    stem: 'Compound A (C₂H₆O) gives no turbidity with Lucas reagent at room temperature; isomer B does react slowly. Identify A and B.',
    marks: 4,
    hint: 'Primary vs secondary alcohol.',
  },
  {
    id: 'oc-cq-02', topic: 'carbonyl chemistry',
    stem: 'Two compounds share the formula C₃H₆O. One reduces Tollens’ reagent; the other does not. Distinguish them with two tests.',
    marks: 4,
    hint: 'Propanal vs propanone — Tollens’ then 2,4-DNPH.',
  },
];
