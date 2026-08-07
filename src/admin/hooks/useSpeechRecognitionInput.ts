import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useSpeechRecognitionInput(
  onTranscript: (transcript: string) => void,
) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const recognitionConstructor =
    typeof window === "undefined"
      ? undefined
      : window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const supportsSpeechRecognition = Boolean(recognitionConstructor);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const clearSpeechError = useCallback(() => setSpeechError(""), []);

  useEffect(() => stopListening, [stopListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    if (!recognitionConstructor) {
      setSpeechError("此瀏覽器不支援語音輸入，請改用文字輸入。");
      return;
    }

    setSpeechError("");
    const recognition = new recognitionConstructor();
    recognition.lang = "zh-TW";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      onTranscript(transcript);
    };
    recognition.onerror = (event) => {
      setSpeechError(
        event.error === "not-allowed"
          ? "麥克風權限未開啟，請允許瀏覽器使用麥克風。"
          : "語音辨識失敗，請再試一次。",
      );
      setIsListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }, [isListening, onTranscript, recognitionConstructor, stopListening]);

  return {
    isListening,
    speechError,
    supportsSpeechRecognition,
    clearSpeechError,
    stopListening,
    toggleListening,
  };
}
