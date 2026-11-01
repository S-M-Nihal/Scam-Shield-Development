export interface ExtractedEntities {
  urls: string[];
  phones: string[];
  upis: string[];
  amounts: string[];
  hasOtpMention: boolean;
}

export function extractEntities(rawText: string): ExtractedEntities {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|in|xyz|top|site|live|info|apk)[^\s]*)/gi;
  const phoneRegex = /(?:\+91[\-\s]?)?[6789]\d{9}\b/g;
  const upiRegex = /[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}/g;
  const amountRegex = /(?:rs\.?|inr|₹)\s?[\d,]+(?:\.\d{2})?/gi;
  const otpRegex = /\b(otp|pin|cvv|password|one time password)\b/i;

  const urls = rawText.match(urlRegex) || [];
  const phones = rawText.match(phoneRegex) || [];
  const upis = rawText.match(upiRegex) || [];
  const amounts = rawText.match(amountRegex) || [];
  const hasOtpMention = otpRegex.test(rawText);

  return { urls, phones, upis, amounts, hasOtpMention };
}