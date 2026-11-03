export function speakText(text: string, lang: string = 'en'): { supported: boolean; needsVoiceHint: boolean } {
  if (!('speechSynthesis' in window)) {
    return { supported: false, needsVoiceHint: false };
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const langMap: Record<string, string> = {
    en: 'en-IN',
    te: 'te-IN',
    hi: 'hi-IN',
  };

  const targetLang = langMap[lang] || 'en-IN';
  utterance.lang = targetLang;

  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find((v) =>
    v.lang.startsWith(targetLang) || v.lang.replace('_', '-').startsWith(targetLang)
  );

  let needsVoiceHint = false;
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  } else if (lang !== 'en') {
    needsVoiceHint = true;
  }

  window.speechSynthesis.speak(utterance);
  return { supported: true, needsVoiceHint };
}