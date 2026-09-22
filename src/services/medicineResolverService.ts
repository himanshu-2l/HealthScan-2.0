/**
 * Medicine Resolver Service
 * 
 * Provides deterministic brand-to-composition resolution, salt normalization,
 * British-to-US spelling normalization, and combination splitting.
 * Grounded in docs/MEDICINE_LENS.md
 */

import { INDIAN_MEDICINES, IndianMedicineRecord } from '../data/indianMedicines';
import { MedicineIdentification, GenericIngredient, CandidateAlternative } from '../types/medicineLens';

// Regex patterns for dosage and salt cleanup
const DOSE_TOKEN = /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|i\.u\.|units?|%)(?:\s*\/\s*(?:\d+(?:\.\d+)?\s*)?(?:mg|mcg|g|ml|iu|i\.u\.|units?|%))?/gi;
const TRAILING_NUM = /(?:\s+\d+(?:\.\d+)?)+\b/g;
const PAREN_CONTENT = /\([^)]*\)/g;
const NON_ALNUM_PLUS = /[^a-z0-9+ ]+/gi;
const MULTI_SPACE = /\s+/g;

const BRITISH_TO_US: Record<string, string> = {
  amoxycillin: 'amoxicillin',
  cefuroxim: 'cefuroxime',
  paracetomol: 'paracetamol',
  paracetamol: 'paracetamol',
  salbutamol: 'albuterol',
  levosalbutamol: 'levalbuterol',
  frusemide: 'furosemide',
  lignocaine: 'lidocaine',
  adrenaline: 'epinephrine',
  noradrenaline: 'norepinephrine',
  glyceryl_trinitrate: 'nitroglycerin'
};

const SALT_SUFFIXES = [
  'hydrochloride',
  'dihydrochloride',
  'hcl',
  'sodium',
  'potassium',
  'calcium',
  'sulphate',
  'sulfate',
  'phosphate',
  'maleate',
  'fumarate',
  'tartrate',
  'succinate',
  'besylate',
  'besilate',
  'mesylate',
  'citrate',
  'acetate',
  'gluconate',
  'lactate',
  'nitrate',
  'tosylate',
  'bromide',
  'chloride',
  'iodide',
  'hydrate',
  'trihydrate',
  'monohydrate',
  'dipivoxil',
  'axetil',
  'medoxomil'
];

/**
 * Normalizes a brand name for deterministic matching.
 * e.g., "Augmentin 625 Duo Tablet" -> "augmentin duo"
 */
export function normalizeBrand(name: string): string {
  if (!name) return '';
  let s = name.toLowerCase().trim();
  s = s.replace(PAREN_CONTENT, ' ');
  s = s.replace(DOSE_TOKEN, ' ');
  s = s.replace(/\btablets?\b|\bcapsules?\b|\bsyrups?\b|\binjections?\b|\bdrops?\b|\bgel\b|\bointment\b|\bcream\b/gi, ' ');
  s = s.replace(/\+/g, ' ');
  s = s.replace(NON_ALNUM_PLUS, ' ');
  s = s.replace(MULTI_SPACE, ' ').trim();
  s = s.replace(TRAILING_NUM, '').trim();
  return s;
}

/**
 * Normalizes a single generic or active salt name.
 * e.g., "Amoxycillin Trihydrate (500mg)" -> "amoxicillin"
 */
export function normalizeGeneric(name: string): string {
  if (!name) return '';
  let s = name.toLowerCase().trim();
  s = s.replace(PAREN_CONTENT, ' ');
  s = s.replace(DOSE_TOKEN, ' ');
  s = s.replace(NON_ALNUM_PLUS, ' ');
  s = s.replace(MULTI_SPACE, ' ').trim();

  // Strip known salt suffixes
  const words = s.split(' ');
  const filteredWords = words.filter(word => !SALT_SUFFIXES.includes(word));
  s = filteredWords.join(' ');

  // British to US mapping
  if (BRITISH_TO_US[s]) {
    s = BRITISH_TO_US[s];
  } else {
    // Check individual tokens
    s = s.split(' ').map(w => BRITISH_TO_US[w] || w).join(' ');
  }

  return s.trim();
}

/**
 * Split combination salt string into individual ingredients.
 * e.g., "Amoxicillin 500mg + Clavulanic Acid 125mg" -> [{ name: 'amoxicillin', strength: '500mg' }, { name: 'clavulanic acid', strength: '125mg' }]
 */
export function splitCombinations(rawText: string): GenericIngredient[] {
  if (!rawText) return [];

  // Split by +, /, |, &, or 'and'
  const parts = rawText.split(/\+|\/|\||&|\band\b/i);
  const results: GenericIngredient[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Extract strength if present
    const strengthMatch = trimmed.match(DOSE_TOKEN);
    const strength = strengthMatch ? strengthMatch[0].trim() : undefined;
    const cleanName = normalizeGeneric(trimmed);

    if (cleanName) {
      results.push({
        name: cleanName,
        strength
      });
    }
  }

  return results;
}

/**
 * Compute simple Levenshtein similarity between two strings (0.0 to 1.0)
 */
function stringSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0.0;
  
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.max(0, 1.0 - distance / maxLen);
}

/**
 * Deterministically resolve a raw brand name or OCR text candidate against the Indian medicines database.
 */
export function resolveMedicine(query: string): MedicineIdentification {
  if (!query || query.trim().length === 0) {
    return {
      status: 'unidentified',
      confidence: 0,
      genericIngredients: [],
      evidence: ['No query provided for resolution.']
    };
  }

  const normalizedQuery = normalizeBrand(query);
  const normalizedGenericQuery = normalizeGeneric(query);

  // 1. Direct exact match on normalized brand
  const exactBrandMatch = INDIAN_MEDICINES.find(
    m => m.normalizedBrand === normalizedQuery || normalizeBrand(m.brandName) === normalizedQuery
  );

  if (exactBrandMatch) {
    return {
      status: 'identified',
      confidence: 0.98,
      brandName: exactBrandMatch.brandName,
      genericIngredients: exactBrandMatch.genericIngredients,
      dosageForm: exactBrandMatch.dosageForm,
      manufacturer: exactBrandMatch.manufacturer,
      evidence: [
        `Exact brand match resolved for "${exactBrandMatch.brandName}".`,
        `Identified active ingredients: ${exactBrandMatch.genericIngredients.map(g => `${g.name} ${g.strength || ''}`).join(', ')}.`,
        `Manufacturer: ${exactBrandMatch.manufacturer}.`
      ]
    };
  }

  // 2. Check if the query is a generic salt itself (e.g. "Paracetamol", "Azithromycin")
  const genericMatch = INDIAN_MEDICINES.find(m =>
    m.genericIngredients.some(g => normalizeGeneric(g.name) === normalizedGenericQuery)
  );

  if (genericMatch && normalizedGenericQuery.length > 3) {
    return {
      status: 'identified',
      confidence: 0.92,
      brandName: `${genericMatch.brandName} (Representative Brand)`,
      genericIngredients: [{ name: normalizedGenericQuery, strength: 'Standard' }],
      dosageForm: genericMatch.dosageForm,
      manufacturer: genericMatch.manufacturer,
      evidence: [
        `Direct generic ingredient recognition for "${normalizedGenericQuery}".`,
        `Cross-referenced against verified clinical formulation.`
      ]
    };
  }

  // 3. Substring / Prefix match with high confidence
  const candidateScores: Array<{ record: IndianMedicineRecord; score: number }> = [];

  for (const record of INDIAN_MEDICINES) {
    const recNorm = record.normalizedBrand;
    let score = 0;

    if (recNorm === normalizedQuery) {
      score = 0.95;
    } else if (normalizedQuery.startsWith(recNorm) || recNorm.startsWith(normalizedQuery)) {
      score = 0.85;
    } else if (normalizedQuery.includes(recNorm) || recNorm.includes(normalizedQuery)) {
      score = 0.80;
    } else {
      const sim = stringSimilarity(normalizedQuery, recNorm);
      if (sim > 0.65) {
        score = sim * 0.85;
      }
    }

    if (score > 0.5) {
      candidateScores.push({ record, score });
    }
  }

  // Sort descending by score
  candidateScores.sort((a, b) => b.score - a.score);

  if (candidateScores.length > 0) {
    const top = candidateScores[0];
    const alternatives: CandidateAlternative[] = candidateScores.slice(1, 5).map(c => ({
      name: c.record.brandName,
      genericName: c.record.genericIngredients.map(g => `${g.name} ${g.strength || ''}`).join(' + '),
      confidence: Math.round(c.score * 100) / 100
    }));

    if (top.score >= 0.80) {
      return {
        status: 'identified',
        confidence: Math.round(top.score * 100) / 100,
        brandName: top.record.brandName,
        genericIngredients: top.record.genericIngredients,
        dosageForm: top.record.dosageForm,
        manufacturer: top.record.manufacturer,
        alternatives: alternatives.length > 0 ? alternatives : undefined,
        evidence: [
          `Matched brand "${top.record.brandName}" with confidence ${(top.score * 100).toFixed(0)}%.`,
          `Composition: ${top.record.genericIngredients.map(g => `${g.name} ${g.strength || ''}`).join(', ')}.`
        ]
      };
    } else {
      // Ambiguous: require user confirmation
      return {
        status: 'possible_matches',
        confidence: Math.round(top.score * 100) / 100,
        brandName: top.record.brandName,
        genericIngredients: top.record.genericIngredients,
        dosageForm: top.record.dosageForm,
        manufacturer: top.record.manufacturer,
        alternatives: [
          {
            name: top.record.brandName,
            genericName: top.record.genericIngredients.map(g => `${g.name} ${g.strength || ''}`).join(' + '),
            confidence: Math.round(top.score * 100) / 100
          },
          ...alternatives
        ],
        evidence: [
          `Multiple potential matches found for query "${query}".`,
          `Confidence is below single-match threshold; user selection required.`
        ]
      };
    }
  }

  // 4. Try parsing combinations if the user wrote "Paracetamol + Ibuprofen"
  const comboIngredients = splitCombinations(query);
  if (comboIngredients.length > 0) {
    return {
      status: 'identified',
      confidence: 0.75,
      brandName: 'Generic Combination',
      genericIngredients: comboIngredients,
      evidence: [
        `Parsed active ingredients: ${comboIngredients.map(g => `${g.name} ${g.strength || ''}`).join(', ')}.`
      ]
    };
  }

  // 5. Unidentified
  return {
    status: 'unidentified',
    confidence: 0.1,
    genericIngredients: [],
    evidence: [`No verified Indian pharmaceutical match found for "${query}".`]
  };
}

/**
 * Retrieve comprehensive educational details for a resolved brand or ingredient.
 */
export function getMedicineDetails(brandOrGeneric: string): IndianMedicineRecord | undefined {
  const norm = normalizeBrand(brandOrGeneric);
  const normGen = normalizeGeneric(brandOrGeneric);

  return INDIAN_MEDICINES.find(m => 
    m.normalizedBrand === norm ||
    normalizeBrand(m.brandName) === norm ||
    m.genericIngredients.some(g => normalizeGeneric(g.name) === normGen)
  );
}
