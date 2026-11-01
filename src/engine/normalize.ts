export function normalizeText(text: string): string {
  if (!text) return '';

  let normalized = text.normalize('NFKD');
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  normalized = normalized.toLowerCase();

  const lookalikes: Record<string, string> = {
    '0': 'o',
    '1': 'i',
    '3': 'e',
    '@': 'a',
    '$': 's',
  };

  return normalized
    .split('')
    .map((char) => lookalikes[char] || char)
    .join('');
}