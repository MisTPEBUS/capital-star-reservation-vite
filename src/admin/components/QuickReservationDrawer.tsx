import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Mic, MicOff, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  parseReservationText,
  type ParsedReservationText,
} from "../../api/admin/reservationTextParser";
import { Button } from "../../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
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

interface QuickReservationContextValue {
  openQuickReservation: () => void;
  pendingReservation: ParsedReservationText | null;
  clearPendingReservation: () => void;
}

const QuickReservationContext =
  createContext<QuickReservationContextValue | null>(null);

export function useQuickReservation() {
  const context = useContext(QuickReservationContext);

  if (!context) {
    throw new Error(
      "useQuickReservation must be used inside QuickReservationProvider.",
    );
  }

  return context;
}

export function QuickReservationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedReservationText | null>(null);
  const [pendingReservation, setPendingReservation] =
    useState<ParsedReservationText | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const speechRecognitionConstructor =
    typeof window === "undefined"
      ? undefined
      : window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const supportsSpeechRecognition = Boolean(speechRecognitionConstructor);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  useEffect(() => stopListening, [stopListening]);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) stopListening();
  };

  const handleParse = async () => {
    const normalizedText = text.trim();
    if (!normalizedText) {
      setError("請先輸入或說出預約內容。");
      return;
    }

    try {
      setIsParsing(true);
      setError("");
      const result = await parseReservationText(normalizedText);
      setParsed(result);
    } catch (parseError) {
      setParsed(null);
      setError(
        parseError instanceof Error
          ? parseError.message
          : "無法解析預約內容，請稍後再試。",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      return;
    }

    if (!speechRecognitionConstructor) {
      setError("此瀏覽器不支援語音輸入，請改用文字輸入。");
      return;
    }

    setError("");
    const recognition = new speechRecognitionConstructor();
    recognition.lang = "zh-TW";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        transcript += event.results[index][0].transcript;
      }
      setText(transcript);
      setParsed(null);
    };
    recognition.onerror = (event) => {
      setError(
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
  };

  const handleApply = () => {
    if (!parsed) return;
    setPendingReservation(parsed);
    setIsOpen(false);
    stopListening();
    navigate("/admin/dashboard");
  };

  const contextValue = useMemo(
    () => ({
      openQuickReservation: () => {
        setError("");
        setIsOpen(true);
      },
      pendingReservation,
      clearPendingReservation: () => setPendingReservation(null),
    }),
    [pendingReservation],
  );

  return (
    <QuickReservationContext.Provider value={contextValue}>
      {children}
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          className="admin-quick-reservation-drawer !w-full !max-w-[34rem] !gap-0 !border-admin-border !bg-admin-surface !p-0 !text-admin-text"
          side="right"
        >
          <SheetHeader className="border-b border-admin-border bg-admin-elevated/60 px-5 py-5 pr-14 text-left">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-adminStatus-enabled/15 text-adminStatus-enabled">
                <Sparkles aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <SheetTitle className="!text-xl !font-bold !text-admin-text">
                  預約快速輸入
                </SheetTitle>
                <SheetDescription className="mt-1 !text-admin-muted">
                  使用語音或自然語句，自動整理乘客預約資料。
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  className="text-sm font-bold text-admin-softText"
                  htmlFor="quick-reservation-text"
                >
                  預約內容
                </label>
                <span className="text-xs text-admin-muted">
                  支援姓名、電話、時間與人數
                </span>
              </div>
              <textarea
                className="min-h-36 w-full resize-y rounded-adminControl border border-admin-borderStrong bg-admin-bg p-3 text-base leading-7 text-admin-text outline-none placeholder:text-admin-muted focus:border-adminStatus-enabled focus:ring-2 focus:ring-adminStatus-enabled/20"
                id="quick-reservation-text"
                placeholder="例如：王小明預約明天南港線下午兩點，電話0912-345-678，共3人"
                value={text}
                onChange={(event) => {
                  setText(event.target.value);
                  setParsed(null);
                  setError("");
                }}
              />
              <div className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                <Button
                  aria-pressed={isListening}
                  className={`h-12 px-4 font-bold ${
                    isListening
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "border-admin-borderStrong bg-admin-bg text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
                  }`}
                  title={
                    supportsSpeechRecognition
                      ? "使用麥克風輸入"
                      : "此瀏覽器不支援語音辨識"
                  }
                  type="button"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={handleToggleListening}
                >
                  {isListening ? (
                    <MicOff aria-hidden="true" className="!h-5 !w-5" />
                  ) : (
                    <Mic aria-hidden="true" className="!h-5 !w-5" />
                  )}
                  {isListening ? "停止收音" : "語音輸入"}
                </Button>
                <Button
                  className="h-12 bg-adminStatus-enabled text-base font-bold text-admin-bg hover:bg-emerald-300"
                  disabled={isParsing || !text.trim()}
                  type="button"
                  onClick={handleParse}
                >
                  <Sparkles aria-hidden="true" className="!h-5 !w-5" />
                  {isParsing ? "解析中…" : "解析預約資料"}
                </Button>
              </div>
              {isListening && (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-200" role="status">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
                  正在聆聽，請說出完整預約內容…
                </p>
              )}
            </div>

            {error && (
              <p
                className="rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
                role="alert"
              >
                {error}
              </p>
            )}

            {parsed && (
              <section
                aria-labelledby="parsed-reservation-title"
                className="rounded-adminPanel border border-adminStatus-enabled/30 bg-adminStatus-enabled/5 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3
                    className="text-base font-bold text-admin-text"
                    id="parsed-reservation-title"
                  >
                    解析完成
                  </h3>
                  <span className="rounded-full bg-adminStatus-enabled/15 px-2.5 py-1 text-xs font-bold text-adminStatus-enabled">
                    請確認資料
                  </span>
                </div>

                <dl className="hidden grid-cols-2 gap-3 md:grid">
                  {[
                    ["姓名", parsed.name],
                    ["電話", parsed.phone],
                    ["班次時間", parsed.time],
                    ["搭乘人數", `${parsed.passengerCount} 人`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-adminControl border border-admin-border bg-admin-bg/60 p-3"
                    >
                      <dt className="text-xs font-semibold text-admin-muted">
                        {label}
                      </dt>
                      <dd className="mt-1 text-base font-bold text-admin-text">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="space-y-4 md:hidden">
                  <label className="block text-sm font-bold text-admin-softText">
                    姓名
                    <input
                      className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                      value={parsed.name}
                      onChange={(event) =>
                        setParsed({ ...parsed, name: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm font-bold text-admin-softText">
                    電話
                    <input
                      className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                      inputMode="tel"
                      value={parsed.phone}
                      onChange={(event) =>
                        setParsed({ ...parsed, phone: event.target.value })
                      }
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-sm font-bold text-admin-softText">
                      班次時間
                      <input
                        className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                        type="time"
                        value={parsed.time.slice(0, 5)}
                        onChange={(event) =>
                          setParsed({ ...parsed, time: event.target.value })
                        }
                      />
                    </label>
                    <label className="block text-sm font-bold text-admin-softText">
                      搭乘人數
                      <input
                        className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                        min="1"
                        type="number"
                        value={parsed.passengerCount}
                        onChange={(event) =>
                          setParsed({
                            ...parsed,
                            passengerCount: Number(event.target.value),
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              </section>
            )}
          </div>

          <SheetFooter className="border-t border-admin-border bg-admin-elevated/35 p-5">
            <Button
              className="h-12 w-full bg-adminStatus-enabled text-base font-bold text-admin-bg hover:bg-emerald-300"
              disabled={
                !parsed ||
                !parsed.name.trim() ||
                !parsed.phone.trim() ||
                parsed.passengerCount < 1
              }
              type="button"
              onClick={handleApply}
            >
              <span className="hidden md:inline">帶入 Dashboard 表格</span>
              <span className="md:hidden">帶入預約表單</span>
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </QuickReservationContext.Provider>
  );
}
