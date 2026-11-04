import rules from './rules.json';
import { normalizeText } from './normalize';
import { extractEntities, type ExtractedEntities } from './extract';
import { analyzeLink } from './links';

export interface ScanResult {
  score: number;
  verdict: 'Safe' | 'Suspicious' | 'Likely Scam';
  reasons: string[];
  matchedCategories: string[];
  entities: ExtractedEntities;
}

export function scoreMessage(rawText: string): ScanResult {
  if (!rawText || !rawText.trim()) {
    return {
      score: 0,
      verdict: 'Safe',
      reasons: [],
      matchedCategories: ['default_safe'],
      entities: { urls: [], phones: [], upis: [], amounts: [] },
    };
  }

  const cleanText = normalizeText(rawText);
  const entities = extractEntities(rawText);

  let remainingProbability = 1.0;
  let genuineDiscount = 0.0;
  const matchedReasons: string[] = [];
  const matchedCategories: string[] = [];

  // 1. Text Pattern Matching
  for (const rule of rules) {
    const isMatched = rule.patterns.some((pattern) =>
      new RegExp(pattern, 'i').test(cleanText)
    );

    if (isMatched) {
      if (rule.weight > 0) {
        remainingProbability *= 1 - rule.weight;
        if (!matchedReasons.includes(rule.reasonKey)) {
          matchedReasons.push(rule.reasonKey);
        }
        if (!matchedCategories.includes(rule.category)) {
          matchedCategories.push(rule.category);
        }
      } else {
        genuineDiscount += Math.abs(rule.weight);
      }
    }
  }

  // 2. Direct Link Analysis
  for (const url of entities.urls) {
    const linkCheck = analyzeLink(url);
    if (linkCheck.isSuspicious) {
      remainingProbability *= 1 - 0.65;
      linkCheck.reasons.forEach((r) => {
        if (!matchedReasons.includes(r)) matchedReasons.push(r);
      });
      if (!matchedCategories.includes('suspicious_link')) {
        matchedCategories.push('suspicious_link');
      }
    }
  }

  // 3. Multi-Signal Phishing Combination Multiplier
  if (matchedCategories.length >= 2 && entities.urls.length > 0) {
    remainingProbability *= 1 - 0.45;
  }

  let finalScore = (1 - remainingProbability - genuineDiscount) * 100;
  finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

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
    matchedCategories: matchedCategories.length > 0 ? matchedCategories : ['default_safe'],
    entities,
  };
}