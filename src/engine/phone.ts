export interface PhoneAnalysis {
  phone: string;
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
}

export function analyzePhone(rawPhone: string, claimedSenderIsBank: boolean = false): PhoneAnalysis {
  const cleaned = rawPhone.replace(/[\s\-\(\)]/g, '');
  const reasons: string[] = [];
  let riskScore = 0;

  // Flag personal 10-digit mobile numbers claiming to represent bank/official servers
  if (claimedSenderIsBank && /^(?:\+91)?[6789]\d{9}$/.test(cleaned)) {
    reasons.push('reasons.phone_personal_claiming_official');
    riskScore += 60;
  }

  // Flag high-risk international prefixes masquerading as local support (+92, +234, +44, etc.)
  if (/^\+(?!91)\d{1,4}/.test(cleaned)) {
    reasons.push('reasons.phone_foreign_origin');
    riskScore += 45;
  }

  return {
    phone: rawPhone,
    isSuspicious: riskScore >= 30,
    reasons,
    riskScore: Math.min(100, riskScore),
  };
}