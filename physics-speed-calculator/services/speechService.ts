import { useState, useEffect, useCallback } from 'react';

// A custom hook to handle speech synthesis
export const useSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [synth, setSynth] = useState<SpeechSynthesis | null>(null);

  useEffect(() => {
    setSynth(window.speechSynthesis);
  }, []);

  const speak = useCallback((text: string) => {
    if (!synth) {
      console.warn('Speech synthesis not supported by this browser.');
      return;
    }
    // Cancel any current speech before starting a new one
    if (synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
    };
    synth.speak(utterance);
  }, [synth]);

  const cancel = useCallback(() => {
    if (synth && synth.speaking) {
      synth.cancel();
      setIsSpeaking(false);
    }
  }, [synth]);

  // Cleanup on unmount: cancel any ongoing speech
  useEffect(() => {
    return () => {
      if (synth && synth.speaking) {
        synth.cancel();
      }
    };
  }, [synth]);

  return { speak, cancel, isSpeaking };
};
