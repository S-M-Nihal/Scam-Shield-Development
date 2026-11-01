import rules from './rules.json';
import { normalizeText } from './normalize';
import { extractEntities, type ExtractedEntities } from './extract';

export interface ScanResult {
  score: number;
  verdict: 'Safe' | 'Suspicious' | 'Likely Scam';
  reasons: string[];
  matchedCategories: string[];
  entities: ExtractedEntities;
}

export function scoreMessage(rawText: string): ScanResult {
  const cleanText = normalizeText(rawText);
  const entities = extractEntities(rawText);

  let remainingProbability = 1.0;
  let genuineDiscount = 0.0;
  const matchedReasons: string[] = [];
  const matchedCategories: string[] = [];

  for (const rule of rules) {
    const isMatched = rule.patterns.some((pattern) =>
      new RegExp(pattern, 'i').test(cleanText)
    );

    if (isMatched) {
      if (rule.weight > 0) {
        remainingProbability *= (1 - rule.weight);
        matchedReasons.push(rule.reasonKey);
        if (!matchedCategories.includes(rule.category)) {
          matchedCategories.push(rule.category);
        }
      } else {
        genuineDiscount += Math.abs(rule.weight);
      }
    }
  }

  if (matchedCategories.length > 0 && (entities.urls.length > 0 || entities.phones.length > 0)) {
    remainingProbability *= (1 - 0.25);
  }

  let finalScore = (1 - remainingProbability) - genuineDiscount;
  finalScore = Math.max(0, Math.min(1, finalScore)) * 100;
  finalScore = Math.round(finalScore);

  let verdict: 'Safe' | 'Suspicious' | 'Likely Scam' = 'Safe';
  if (finalScore >= 60) {
    verdict = 'Likely Scam';
  } else if (finalScore >= 30) {
    verdict = 'Suspicious';
  }

  return {
    score: finalScore,
    verdict,
    reasons: matchedReasons,
    matchedCategories,
    entities,
  };
}