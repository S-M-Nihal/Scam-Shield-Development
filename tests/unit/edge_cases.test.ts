import { describe, it, expect } from 'vitest';
import { scoreMessage } from '../../src/engine/score';
import { analyzeLink } from '../../src/engine/links';
import { analyzeUpi } from '../../src/engine/upi';
import { analyzePhone } from '../../src/engine/phone';

describe('Edge Cases & Entity Checkers Suite', () => {
  it('handles empty input cleanly without crashing', () => {
    const res = scoreMessage('');
    expect(res.verdict).toBe('Safe');
    expect(res.score).toBe(0);
  });

  it('handles massive 10,000 character inputs', () => {
    const bigInput = 'KYC update alert '.repeat(600);
    const res = scoreMessage(bigInput);
    expect(res.score).toBeGreaterThanOrEqual(60);
    expect(res.verdict).toBe('Likely Scam');
  });

  it('flags dangerous link shorteners and APKs', () => {
    const shortener = analyzeLink('http://bit.ly/fake-kyc');
    expect(shortener.isSuspicious).toBe(true);
    expect(shortener.reasons).toContain('reasons.link_shortener');

    const apk = analyzeLink('https://download-bank.xyz/app.apk');
    expect(apk.isSuspicious).toBe(true);
    expect(apk.reasons).toContain('reasons.link_apk_download');
  });

  it('flags UPI collect handles requesting PIN', () => {
    const upi = analyzeUpi('sbi-refund-support@upi');
    expect(upi.isSuspicious).toBe(true);
    expect(upi.reasons).toContain('reasons.upi_impersonation_handle');
  });

  it('flags personal numbers masquerading as official bank SMS', () => {
    const phone = analyzePhone('+919876543210', true);
    expect(phone.isSuspicious).toBe(true);
    expect(phone.reasons).toContain('reasons.phone_personal_claiming_official');
  });
});