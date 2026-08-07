import { useCallback, useEffect, useRef, useState } from "react";
import {
  parseTaiwaneseReservationAudio,
  type TaiwaneseTranslationResult,
} from "../../api/admin/taiwaneseTranslation";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;

function getSupportedMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

export function useTaiwaneseReservationInput(
  onResult: (result: TaiwaneseTranslationResult) => void | Promise<void>,
) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldUploadRef = useRef(false);
  const mountedRef = useRef(true);
  const operationIdRef = useRef(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const supportsRecording =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const cancelRecording = useCallback(() => {
    operationIdRef.current += 1;
    shouldUploadRef.current = false;
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
    recorderRef.current = null;
    chunksRef.current = [];
    releaseStream();
    setIsRecording(false);
    setIsProcessing(false);
  }, [releaseStream]);

  const stopRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    shouldUploadRef.current = true;
    recorder.stop();
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    if (!supportsRecording) {
      setError("此瀏覽器不支援錄音，請改用最新版 Chrome 或 Safari。");
      return;
    }

    try {
      setError("");
      operationIdRef.current += 1;
      const operationId = operationIdRef.current;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current || operationId !== operationIdRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const mimeType = getSupportedMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      shouldUploadRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        if (mountedRef.current) setError("錄音失敗，請重新嘗試。");
        cancelRecording();
      };
      recorder.onstop = async () => {
        const shouldUpload = shouldUploadRef.current;
        const chunks = chunksRef.current;
        const audioType = recorder.mimeType || mimeType || "audio/webm";
        recorderRef.current = null;
        chunksRef.current = [];
        releaseStream();

        if (!shouldUpload || chunks.length === 0 || !mountedRef.current) return;

        const audio = new Blob(chunks, { type: audioType });
        if (audio.size > MAX_AUDIO_SIZE) {
          setError("錄音檔超過 25 MB，請縮短錄音後再試。");
          return;
        }

        const operationId = operationIdRef.current;
        try {
          setIsProcessing(true);
          const result = await parseTaiwaneseReservationAudio(audio);
          if (mountedRef.current && operationId === operationIdRef.current) {
            await onResult(result);
          }
        } catch (parseError) {
          if (mountedRef.current && operationId === operationIdRef.current) {
            setError(
              parseError instanceof Error
                ? parseError.message
                : "台語語音解析失敗，請稍後再試。",
            );
          }
        } finally {
          if (mountedRef.current && operationId === operationIdRef.current) {
            setIsProcessing(false);
          }
        }
      };

      recorder.start(1000);
      setIsRecording(true);
    } catch (recordingError) {
      releaseStream();
      setError(
        recordingError instanceof DOMException &&
          recordingError.name === "NotAllowedError"
          ? "麥克風權限未開啟，請允許瀏覽器使用麥克風。"
          : "無法啟動麥克風，請確認裝置後再試。",
      );
    }
  }, [cancelRecording, onResult, releaseStream, supportsRecording]);

  const toggleRecording = useCallback(() => {
    if (isRecording) stopRecording();
    else void startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const clearError = useCallback(() => setError(""), []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      operationIdRef.current += 1;
      shouldUploadRef.current = false;
      const recorder = recorderRef.current;
      if (recorder?.state === "recording") recorder.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    isRecording,
    isProcessing,
    error,
    supportsRecording,
    clearError,
    cancelRecording,
    toggleRecording,
  };
}
