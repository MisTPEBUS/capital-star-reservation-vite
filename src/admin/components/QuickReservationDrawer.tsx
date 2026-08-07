import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getDashboardDailyOpenSchedules,
  type DashboardDailyOpenSchedule,
} from "../../api/admin/dashboard";
import {
  parseReservationText,
  type ParsedReservationText,
} from "../../api/admin/reservationTextParser";
import type { TaiwaneseTranslationResult } from "../../api/admin/taiwaneseTranslation";
import { Button } from "../../components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { createQuickAdminReservation } from "../../services/quickAdminReservation";
import {
  getLocalDateValue,
  matchesScheduleRouteHint,
} from "../../utils/quickReservation";
import { useSpeechRecognitionInput } from "../hooks/useSpeechRecognitionInput";
import { useTaiwaneseReservationInput } from "../hooks/useTaiwaneseReservationInput";
import {
  isScheduleAvailable,
  QuickReservationForm,
} from "./QuickReservationForm";
import { QuickReservationVoiceControls } from "./QuickReservationVoiceControls";

export interface RecentlyCreatedQuickReservation {
  dailyOpenScheduleId: string;
  openDate: string;
  routeNumber: string;
  departureTime: string;
  name: string;
  passengerCount: number;
}

interface QuickReservationContextValue {
  openQuickReservation: () => void;
  recentlyCreatedReservation: RecentlyCreatedQuickReservation | null;
  clearRecentlyCreatedReservation: () => void;
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
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedReservationText | null>(null);
  const [schedules, setSchedules] = useState<DashboardDailyOpenSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [recentlyCreatedReservation, setRecentlyCreatedReservation] =
    useState<RecentlyCreatedQuickReservation | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [error, setError] = useState("");

  const handleTranscript = useCallback((transcript: string) => {
    setText(transcript);
    setParsed(null);
    setSchedules([]);
    setSelectedScheduleId("");
  }, []);
  const {
    isListening,
    speechError,
    supportsSpeechRecognition,
    clearSpeechError,
    stopListening,
    toggleListening,
  } = useSpeechRecognitionInput(handleTranscript);

  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      ) ?? null,
    [schedules, selectedScheduleId],
  );

  const loadTodaySchedules = useCallback(
    async (reservation: ParsedReservationText, routeHint = "") => {
      setIsLoadingSchedules(true);
      try {
        const dailySchedules = await getDashboardDailyOpenSchedules(
          getLocalDateValue(),
        );
        const sortedSchedules = [...dailySchedules].sort((left, right) =>
          left.departureTime.localeCompare(right.departureTime),
        );
        const matchingSchedule = sortedSchedules.find(
          (schedule) =>
            schedule.departureTime.slice(0, 5) ===
              reservation.time.slice(0, 5) &&
            matchesScheduleRouteHint(schedule, routeHint) &&
            isScheduleAvailable(schedule, reservation.passengerCount),
        );

        setSchedules(sortedSchedules);
        setSelectedScheduleId(matchingSchedule?.dailyOpenScheduleId ?? "");
      } finally {
        setIsLoadingSchedules(false);
      }
    },
    [],
  );

  const handleTaiwaneseResult = useCallback(
    async (result: TaiwaneseTranslationResult) => {
      const reservation: ParsedReservationText = {
        time: result.reservation.time,
        phone: result.reservation.phone,
        name: result.reservation.name,
        passengerCount: result.reservation.passengerCount,
      };
      setText(result.transcript);
      setParsed(reservation);
      setSchedules([]);
      setSelectedScheduleId("");
      setError("");
      clearSpeechError();
      await loadTodaySchedules(reservation, result.reservation.schedule);
    },
    [clearSpeechError, loadTodaySchedules],
  );
  const {
    isRecording: isTaiwaneseRecording,
    isProcessing: isTaiwaneseProcessing,
    error: taiwaneseError,
    supportsRecording: supportsTaiwaneseRecording,
    clearError: clearTaiwaneseError,
    cancelRecording: cancelTaiwaneseRecording,
    toggleRecording: toggleTaiwaneseRecording,
  } = useTaiwaneseReservationInput(handleTaiwaneseResult);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      stopListening();
      cancelTaiwaneseRecording();
    }
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
      clearSpeechError();
      setParsed(null);
      setSchedules([]);
      setSelectedScheduleId("");
      const result = await parseReservationText(normalizedText);
      setParsed(result);
      await loadTodaySchedules(result);
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "無法解析預約內容，請稍後再試。",
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleParsedChange = (value: ParsedReservationText) => {
    if (!parsed) return;

    const timeChanged = value.time.slice(0, 5) !== parsed.time.slice(0, 5);
    const selectedIsUnavailable =
      selectedSchedule &&
      !isScheduleAvailable(selectedSchedule, value.passengerCount);

    if (timeChanged || selectedIsUnavailable) {
      setSelectedScheduleId("");
    }
    setParsed(value);
  };

  const handleScheduleSelect = (scheduleId: string) => {
    const schedule = schedules.find(
      (item) => item.dailyOpenScheduleId === scheduleId,
    );
    setSelectedScheduleId(scheduleId);
    if (parsed && schedule) {
      setParsed({
        ...parsed,
        time: schedule.departureTime.slice(0, 5),
      });
    }
  };

  const handleCreateReservation = async () => {
    if (!parsed || !selectedSchedule) return;

    try {
      setIsCreatingReservation(true);
      setError("");
      const created = await createQuickAdminReservation(selectedSchedule, {
        name: parsed.name,
        phone: parsed.phone,
        passengerCount: parsed.passengerCount,
      });

      setRecentlyCreatedReservation({
        dailyOpenScheduleId: created.dailyOpenScheduleId,
        openDate: created.openDate,
        routeNumber: created.routeNumber,
        departureTime: created.departureTime.slice(0, 5),
        name: parsed.name.trim(),
        passengerCount: parsed.passengerCount,
      });
      setText("");
      setParsed(null);
      setSchedules([]);
      setSelectedScheduleId("");
      setIsOpen(false);
      stopListening();
      cancelTaiwaneseRecording();
      navigate("/admin/dashboard");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "建立班次預約失敗，請稍後再試。",
      );
    } finally {
      setIsCreatingReservation(false);
    }
  };

  const contextValue = useMemo(
    () => ({
      openQuickReservation: () => {
        setError("");
        clearSpeechError();
        clearTaiwaneseError();
        setIsOpen(true);
      },
      recentlyCreatedReservation,
      clearRecentlyCreatedReservation: () =>
        setRecentlyCreatedReservation(null),
    }),
    [clearSpeechError, clearTaiwaneseError, recentlyCreatedReservation],
  );

  const isFormValid = Boolean(
    parsed?.name.trim() &&
      parsed.phone.trim() &&
      Number.isInteger(parsed.passengerCount) &&
      parsed.passengerCount > 0 &&
      selectedSchedule &&
      isScheduleAvailable(selectedSchedule, parsed.passengerCount),
  );

  const handleTextChange = (value: string) => {
    setText(value);
    setParsed(null);
    setSchedules([]);
    setSelectedScheduleId("");
    setError("");
    clearSpeechError();
    clearTaiwaneseError();
  };

  const handleMandarinToggle = () => {
    if (!isListening) cancelTaiwaneseRecording();
    clearTaiwaneseError();
    toggleListening();
  };

  const handleTaiwaneseToggle = () => {
    if (!isTaiwaneseRecording) stopListening();
    setError("");
    clearSpeechError();
    toggleTaiwaneseRecording();
  };

  return (
    <QuickReservationContext.Provider value={contextValue}>
      {children}
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          className="admin-quick-reservation-drawer !w-full !max-w-[40rem] !gap-0 !border-admin-border !bg-admin-surface !p-0 !text-admin-text"
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
                  確認語音解析資料與班次後，直接建立預約。
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
            <QuickReservationVoiceControls
              isListening={isListening}
              isParsing={isParsing}
              isTaiwaneseProcessing={isTaiwaneseProcessing}
              isTaiwaneseRecording={isTaiwaneseRecording}
              supportsSpeechRecognition={supportsSpeechRecognition}
              supportsTaiwaneseRecording={supportsTaiwaneseRecording}
              text={text}
              onMandarinToggle={handleMandarinToggle}
              onParse={handleParse}
              onTaiwaneseToggle={handleTaiwaneseToggle}
              onTextChange={handleTextChange}
            />

            {(error || speechError || taiwaneseError) && (
              <p
                className="rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200"
                role="alert"
              >
                {error || speechError || taiwaneseError}
              </p>
            )}

            {parsed && (
              <QuickReservationForm
                isLoadingSchedules={isLoadingSchedules}
                parsed={parsed}
                schedules={schedules}
                selectedScheduleId={selectedScheduleId}
                onParsedChange={handleParsedChange}
                onScheduleSelect={handleScheduleSelect}
              />
            )}
          </div>

          <SheetFooter className="border-t border-admin-border bg-admin-elevated/35 p-5">
            <Button
              className="h-12 w-full bg-adminStatus-enabled text-base font-bold text-admin-bg hover:bg-emerald-300"
              disabled={
                !isFormValid ||
                isCreatingReservation ||
                isTaiwaneseRecording ||
                isTaiwaneseProcessing
              }
              type="button"
              onClick={handleCreateReservation}
            >
              {isCreatingReservation ? "新增中…" : "新增班次預約"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </QuickReservationContext.Provider>
  );
}
