import { Languages, Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/button";

interface QuickReservationVoiceControlsProps {
  text: string;
  isListening: boolean;
  supportsSpeechRecognition: boolean;
  isParsing: boolean;
  isTaiwaneseRecording: boolean;
  isTaiwaneseProcessing: boolean;
  supportsTaiwaneseRecording: boolean;
  onTextChange: (value: string) => void;
  onMandarinToggle: () => void;
  onTaiwaneseToggle: () => void;
  onParse: () => void;
}

export function QuickReservationVoiceControls({
  text,
  isListening,
  supportsSpeechRecognition,
  isParsing,
  isTaiwaneseRecording,
  isTaiwaneseProcessing,
  supportsTaiwaneseRecording,
  onTextChange,
  onMandarinToggle,
  onTaiwaneseToggle,
  onParse,
}: QuickReservationVoiceControlsProps) {
  return (
    <section className="rounded-adminPanel border border-admin-borderStrong bg-admin-surface p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-adminStatus-enabled text-sm font-black text-admin-bg">
          1
        </span>
        <div>
          <h3 className="text-lg font-bold text-admin-text">輸入預約需求</h3>
          <p className="mt-0.5 text-sm leading-6 text-admin-muted">
            可直接輸入文字，或使用國語、台語語音輸入。
          </p>
        </div>
      </div>

      <textarea
        className="min-h-36 w-full resize-y rounded-adminControl border border-admin-borderStrong bg-admin-bg p-4 text-lg leading-8 text-admin-text outline-none placeholder:text-admin-muted focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15"
        id="quick-reservation-text"
        name="quick-reservation-text"
        placeholder="例如：早上 7 點，張小姐 2 人，電話 0987654321"
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
      />

      <p className="mt-2 rounded-adminControl bg-admin-elevated/50 px-3 py-2 text-xs leading-5 text-admin-muted">
        建議附頌：[乘車時間]、[姓名]、[人數]與[電話]；系統會自動整理成預約資料。
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-[auto_auto_minmax(0,1fr)]">
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
          onClick={onMandarinToggle}
        >
          {isListening ? (
            <MicOff aria-hidden="true" className="!h-5 !w-5" />
          ) : (
            <Mic aria-hidden="true" className="!h-5 !w-5" />
          )}
          {isListening ? "停止收音" : "國語語音"}
        </Button>

        <Button
          aria-pressed={isTaiwaneseRecording}
          className={`h-12 px-4 font-bold ${
            isTaiwaneseRecording
              ? "bg-red-500 text-white hover:bg-red-600"
              : "border-admin-borderStrong bg-admin-bg text-admin-softText hover:bg-admin-elevated hover:text-admin-text"
          }`}
          disabled={isTaiwaneseProcessing}
          title={
            supportsTaiwaneseRecording
              ? "錄製台語並解析預約資料"
              : "此瀏覽器不支援錄音"
          }
          type="button"
          variant={isTaiwaneseRecording ? "destructive" : "outline"}
          onClick={onTaiwaneseToggle}
        >
          {isTaiwaneseRecording ? (
            <MicOff aria-hidden="true" className="!h-5 !w-5" />
          ) : (
            <Languages aria-hidden="true" className="!h-5 !w-5" />
          )}
          {isTaiwaneseProcessing
            ? "台語解析中…"
            : isTaiwaneseRecording
              ? "停止並解析"
              : "台語語音"}
        </Button>

        <Button
          className="col-span-2 h-12 bg-adminStatus-enabled text-base font-bold text-admin-bg shadow-sm hover:bg-emerald-300 sm:col-span-1"
          disabled={
            isParsing ||
            isListening ||
            isTaiwaneseRecording ||
            isTaiwaneseProcessing ||
            !text.trim()
          }
          type="button"
          onClick={onParse}
        >
          <Sparkles aria-hidden="true" className="!h-5 !w-5" />
          {isParsing ? "解析中…" : "解析預約資料"}
        </Button>
      </div>

      {isListening && (
        <p
          className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-200"
          role="status"
        >
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
          正在聆聽，請說出完整預約內容…
        </p>
      )}
      {isTaiwaneseRecording && (
        <p
          className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-200"
          role="status"
        >
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-400" />
          正在錄製台語，說完後請按「停止並解析」…
        </p>
      )}
      {isTaiwaneseProcessing && (
        <p
          className="mt-3 text-sm font-semibold text-adminStatus-enabled"
          role="status"
        >
          正在上傳錄音並解析預約資料…
        </p>
      )}
    </section>
  );
}
