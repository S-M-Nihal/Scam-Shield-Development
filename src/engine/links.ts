export interface LinkAnalysis {
  url: string;
  isSuspicious: boolean;
  reasons: string[];
  riskScore: number;
}

const SHORTENERS = ['bit.ly', 'tinyurl.com', 'is.gd', 'buff.ly', 't.co', 'cutt.ly', 'rb.gy'];
const RISKY_TLDS = ['.xyz', '.top', '.site', '.live', '.info', '.club', '.online', '.buzz'];
const TARGETED_BRANDS = ['sbi', 'hdfc', 'icici', 'axis', 'pnb', 'yono', 'phonepe', 'gpay', 'paytm', 'indiapost', 'eb'];

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

    if (SHORTENERS.some((s) => hostname === s || hostname.endsWith('.' + s))) {
      reasons.push('reasons.link_shortener');
      riskScore += 40;
    }

    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      reasons.push('reasons.link_ip_address');
      riskScore += 60;
    }

    if (RISKY_TLDS.some((tld) => hostname.endsWith(tld))) {
      reasons.push('reasons.link_risky_tld');
      riskScore += 35;
    }

    if (pathname.endsWith('.apk')) {
      reasons.push('reasons.link_apk_download');
      riskScore += 70;
    }

    const matchedBrand = TARGETED_BRANDS.find((b) => hostname.includes(b));
    const isOfficialGov = hostname.endsWith('.gov.in') || hostname.endsWith('.nic.in');
    const isOfficialBank = hostname.endsWith('.bank.sbi') || hostname.endsWith('.hdfcbank.com') || hostname.endsWith('.icicibank.com');

    if (matchedBrand && !isOfficialGov && !isOfficialBank) {
      const parts = hostname.split('.');
      if (parts.length > 2 && !hostname.startsWith(matchedBrand + '.')) {
        reasons.push('reasons.link_brand_impersonation');
        riskScore += 50;
      }
    }
  } catch {
    reasons.push('reasons.invalid_url');
    riskScore += 20;
  }

  return {
    url: rawUrl,
    isSuspicious: riskScore >= 30,
    reasons,
    riskScore: Math.min(100, riskScore),
  };
}