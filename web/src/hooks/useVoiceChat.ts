'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '. ')
    .trim();
}

export function useVoiceChat() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [autoListen, setAutoListen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  // Refs to avoid stale closures in callbacks
  const autoListenRef = useRef(false);
  const isMutedRef = useRef(false);

  useEffect(() => {
    autoListenRef.current = autoListen;
  }, [autoListen]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI && 'speechSynthesis' in window);
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    window.speechSynthesis?.cancel();
    setIsSpeaking(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition: any = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const text = Array.from(event.results as any[])
        .map((r: any) => r[0].transcript)
        .join('');
      setTranscript(text);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setTranscript('');
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (isMutedRef.current || !('speechSynthesis' in window)) {
        // TTS muted — still fire onEnd so caller can react
        onEnd?.();
        return;
      }
      window.speechSynthesis.cancel();

      const cleaned = stripMarkdown(text);
      if (!cleaned) { onEnd?.(); return; }

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find((v) => v.lang.startsWith('en') && v.name.includes('Samantha')) ||
        voices.find((v) => v.lang.startsWith('en') && v.localService);
      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }
      return !prev;
    });
  }, []);

  return {
    isListening,
    isSpeaking,
    isMuted,
    transcript,
    isSupported,
    autoListen,
    setAutoListen,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleMute,
  };
}
