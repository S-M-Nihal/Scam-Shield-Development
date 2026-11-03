export interface UpiAnalysis {
  upiId: string;
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
  reminderNotice: string;
}

const SUSPICIOUS_UPI_TERMS = ['refund', 'cashback', 'helpline', 'customercare', 'kyc', 'support', 'reward'];

export function analyzeUpi(upiId: string): UpiAnalysis {
  const cleanUpi = upiId.trim().toLowerCase();
  const reasons: string[] = [];
  let riskScore = 0;

  const handle = cleanUpi.split('@')[0] || '';

  if (SUSPICIOUS_UPI_TERMS.some((term) => handle.includes(term))) {
    reasons.push('reasons.upi_impersonation_handle');
    riskScore += 65;
  }

  if (!cleanUpi.includes('@') || cleanUpi.startsWith('@') || cleanUpi.endsWith('@')) {
    reasons.push('reasons.invalid_upi');
    riskScore += 30;
  }

  return {
    upiId,
    isSuspicious: riskScore >= 30,
    reasons,
    riskScore: Math.min(100, riskScore),
    reminderNotice: 'reasons.upi_pin_warning', // "Never enter UPI PIN to receive money"
  };
}