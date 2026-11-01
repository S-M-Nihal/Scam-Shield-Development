import { describe, it, expect } from 'vitest';
import dataset from '../../src/data/dataset.json';
import { scoreMessage } from '../../src/engine/score';

describe('Scam Shield Engine Day 1 Benchmark', () => {
  it('runs over the dataset and reports accuracy', () => {
    let truePositives = 0;
    let trueNegatives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;

    for (const item of dataset) {
      const result = scoreMessage(item.text);
      const isDetectedAsScam = result.verdict !== 'Safe';

      if (item.isScam && isDetectedAsScam) truePositives++;
      else if (!item.isScam && !isDetectedAsScam) trueNegatives++;
      else if (!item.isScam && isDetectedAsScam) falsePositives++;
      else if (item.isScam && !isDetectedAsScam) falseNegatives++;
    }

    const total = dataset.length;
    const accuracy = ((truePositives + trueNegatives) / total) * 100;

    console.log('\n=======================================');
    console.log('   Scam Shield Engine Day 1 Benchmark  ');
    console.log('=======================================');
    console.log(`Total Samples:    ${total}`);
    console.log(`Accuracy:         ${accuracy.toFixed(2)}%`);
    console.log(`False Positives:  ${falsePositives}`);
    console.log(`False Negatives:  ${falseNegatives}`);
    console.log('=======================================\n');

    expect(total).toBeGreaterThan(0);
  });
});