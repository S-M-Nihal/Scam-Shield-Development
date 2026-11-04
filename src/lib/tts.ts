export function speakText(text: string, lang: string = 'en'): { supported: boolean; needsVoiceHint: boolean } {
  if (!('speechSynthesis' in window)) {
    return { supported: false, needsVoiceHint: false };
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Exact BCP 47 language codes
  const langTagMap: Record<string, string> = {
    en: 'en-IN',
    te: 'te-IN',
    hi: 'hi-IN',
  };

  const targetLang = langTagMap[lang] || 'en-IN';
  utterance.lang = targetLang;

  const voices = window.speechSynthesis.getVoices();

  // Search for an exact language match (e.g. "te-IN" or "hi-IN" or voice names containing "Telugu" / "Hindi")
  const matchedVoice = voices.find((v) => {
    const vLang = v.lang.replace('_', '-').toLowerCase();
    const tLang = targetLang.toLowerCase();
    return vLang.startsWith(tLang) || 
           vLang.startsWith(lang.toLowerCase()) || 
           (lang === 'hi' && v.name.toLowerCase().includes('hindi')) ||
           (lang === 'te' && v.name.toLowerCase().includes('telugu'));
  });

  let needsVoiceHint = false;
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  } else if (lang !== 'en') {
    needsVoiceHint = true;
  }

  // Adjust rate and pitch for regional natural clarity
  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
  return { supported: true, needsVoiceHint };
}