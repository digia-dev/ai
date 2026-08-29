import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTTSOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
}

export function useTTS(options: UseTTSOptions = {}) {
  const { lang = 'id-ID', rate = 1, pitch = 1 } = options;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (currentText === text) {
        setCurrentText(null);
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentText(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentText(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, currentText, lang, rate, pitch]);

  const stop = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentText(null);
    }
  }, []);

  return { isSpeaking, speak, stop, currentText };
}
