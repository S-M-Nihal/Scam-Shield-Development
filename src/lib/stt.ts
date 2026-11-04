export interface SpeechRecognitionResultState {
  isSupported: boolean;
  startListening: (onResult: (text: string) => void, onError: (err: string) => void) => void;
  stopListening: () => void;
}

export function createSpeechRecognizer(lang: string = 'en-IN') {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return {
      isSupported: false,
      startListening: () => {},
      stopListening: () => {},
    };
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-IN';

  return {
    isSupported: true,
    startListening: (onResult: (text: string) => void, onError: (err: string) => void) => {
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
      };
      recognition.onerror = (event: any) => {
        onError(event.error);
      };
      recognition.start();
    },
    stopListening: () => {
      recognition.stop();
    },
  };
}