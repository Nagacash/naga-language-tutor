"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RecorderState } from "@/components/use-recorder";
import type { LanguageId } from "@/lib/types";

// Free speech-to-text using the browser's built-in recognition. No Fish Audio credits are used.
type SpeechAlternative = { transcript: string };
type SpeechEvent = { results: ArrayLike<ArrayLike<SpeechAlternative>> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
};
type RecognitionConstructor = new () => Recognition;

const locales: Record<LanguageId, string> = {
  es: "es-ES", fr: "fr-FR", it: "it-IT", de: "de-DE", "pt-BR": "pt-BR",
  ja: "ja-JP", ko: "ko-KR", "zh-CN": "zh-CN", ar: "ar-SA", en: "en-US",
};

function recognitionConstructor(): RecognitionConstructor | undefined {
  const scope = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

export function useBrowserRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const sequence = useRef(0);
  const release = useCallback(() => {
    sequence.current++;
    const current = recognition.current;
    recognition.current = null;
    current?.abort();
  }, []);
  useEffect(() => release, [release]);
  const cancel = useCallback(() => { release(); setState("idle"); setError(""); }, [release]);
  const stop = useCallback(() => { recognition.current?.stop(); }, []);
  const start = useCallback((language: LanguageId, onText: (text: string) => void) => {
    release();
    setError("");
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      setError("Browser speech recognition is not available here. Use Chrome, Edge or Safari, or switch to Fish Audio in Preferences.");
      return;
    }
    const generation = sequence.current;
    const instance = new Constructor();
    instance.lang = locales[language];
    instance.continuous = false;
    instance.interimResults = false;
    let heard = "";
    instance.onresult = (event) => {
      if (generation !== sequence.current) return;
      heard = Array.from(event.results).map((result) => result[0]?.transcript ?? "").join(" ").trim();
    };
    instance.onerror = (event) => {
      if (generation !== sequence.current) return;
      if (event.error === "no-speech") setError("No speech was detected. Try again or type your reply.");
      else if (event.error === "not-allowed" || event.error === "service-not-allowed") setError("Allow microphone access to speak, or type your reply below.");
      else setError("Browser speech recognition stopped. Try again or type your reply.");
    };
    instance.onend = () => {
      if (generation !== sequence.current) return;
      recognition.current = null;
      setState("idle");
      if (heard) onText(heard);
    };
    recognition.current = instance;
    setState("recording");
    try {
      instance.start();
    } catch {
      recognition.current = null;
      setState("idle");
      setError("Browser speech recognition could not start. Try again or type your reply.");
    }
  }, [release]);
  return { state, error, start, stop, cancel };
}
