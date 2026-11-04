export interface ExtractedEntities {
  urls: string[];
  phones: string[];
  upis: string[];
  amounts: string[];
}

export function extractEntities(rawText: string): ExtractedEntities {
  if (!rawText) {
    return {
      urls: [],
      phones: [],
      upis: [],
      amounts: [],
    };
  }

  // 1. URL extraction: Handles markdown links [url](url), angle brackets, and trailing punctuation
  const rawUrlRegex = /(https?:\/\/[^\s<>"'\])]+|www\.[^\s<>"'\])]+)/gi;
  const rawUrls = rawText.match(rawUrlRegex) || [];
  const urls: string[] = Array.from(
    new Set(
      rawUrls.map((u) => u.replace(/[.,;!?\])]+$/, '').trim())
    )
  );

  // 2. UPI IDs (e.g., username@bank, support-refund@okaxis)
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
  const upis: string[] = Array.from(new Set(rawText.match(upiRegex) || []));

  // 3. Phone Numbers (Indian 10-digit mobile & international formats)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b[6-9]\d{9}\b/g;
  const rawPhones = rawText.match(phoneRegex) || [];
  const phones: string[] = Array.from(
    new Set(rawPhones.map((p) => p.replace(/[\s\-().]/g, '')))
  );

  // 4. Currency Amounts (INR, Rs, ₹, $, USD, EUR) - forward slashes properly escaped
  const amountRegex = /(?:(?:rs\.?|inr|₹|\$|€|£)\s*[\d,]+(?:\.\d{1,2})?)|(?:[\d,]+(?:\.\d{1,2})?\s*(?:\/\-|lakh|crore|k|usd|inr))/gi;
  const amounts: string[] = Array.from(new Set(rawText.match(amountRegex) || []));

  return {
    urls,
    phones,
    upis,
    amounts,
  };
}