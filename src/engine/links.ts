export interface LinkAnalysis {
  url: string;
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
}

const SHORTENERS = ['bit.ly', 'tinyurl.com', 'is.gd', 'buff.ly', 't.co', 'cutt.ly', 'rb.gy'];
const RISKY_TLDS = ['.xyz', '.top', '.site', '.live', '.info', '.club', '.online', '.buzz', '.tk', '.ml', '.ga', '.cf', '.gq'];
const TARGETED_BRANDS = ['amazon', 'amz', 'sbi', 'hdfc', 'icici', 'axis', 'pnb', 'yono', 'phonepe', 'gpay', 'paytm', 'indiapost', 'fedex', 'netflix', 'apple'];

export function analyzeLink(rawUrl: string): LinkAnalysis {
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'http://' + url;
  }

  const reasons: string[] = [];
  let riskScore = 0;

  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();

    // Link Shorteners
    if (SHORTENERS.some((s) => hostname === s || hostname.endsWith('.' + s))) {
      reasons.push('reasons.link_shortener');
      riskScore += 45;
    }

    // Raw IP address link
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      reasons.push('reasons.link_ip_address');
      riskScore += 65;
    }

    // Risky TLDs
    if (RISKY_TLDS.some((tld) => hostname.endsWith(tld))) {
      reasons.push('reasons.link_risky_tld');
      riskScore += 40;
    }

    // Direct APK or executable download
    if (pathname.endsWith('.apk') || pathname.endsWith('.exe')) {
      reasons.push('reasons.link_apk_download');
      riskScore += 75;
    }

    // Brand Impersonation / Phishing Domain detection (e.g., amz-careers-verify.example.net)
    const isOfficialGov = hostname.endsWith('.gov.in') || hostname.endsWith('.nic.in');
    const isOfficialAmazon = hostname === 'amazon.in' || hostname.endsWith('.amazon.in') || hostname === 'amazon.com' || hostname.endsWith('.amazon.com');
    const isOfficialBank = hostname.endsWith('.bank.sbi') || hostname.endsWith('.hdfcbank.com') || hostname.endsWith('.icicibank.com');

    const matchedBrand = TARGETED_BRANDS.find((b) => hostname.includes(b));
    if (matchedBrand && !isOfficialGov && !isOfficialAmazon && !isOfficialBank) {
      reasons.push('reasons.link_brand_impersonation');
      riskScore += 60;
    }

    // Suspicious keywords in domain or path
    if (/(verify|secure|auth|login|signin|account|update|careers-verify)/i.test(hostname + pathname) && !isOfficialGov && !isOfficialAmazon && !isOfficialBank) {
      if (!reasons.includes('reasons.suspicious_link')) {
        reasons.push('reasons.suspicious_link');
        riskScore += 35;
      }
    }
  } catch {
    reasons.push('reasons.invalid_url');
    riskScore += 25;
  }

  return {
    url: rawUrl,
    isSuspicious: riskScore >= 30,
    reasons,
    riskScore: Math.min(100, riskScore),
  };
}