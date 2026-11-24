import { ArrowRight, Check, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../ui/dialog";
import { UserCardFaceArt } from "./UserCardFaceArt";

const GUIDE_POINTS = [
  { id: "apply", text: "輸入卡片上的卡號即可申請" },
  { id: "limit", text: "每個帳號最多可綁定 5 張" },
  { id: "progress", text: "審核進度可隨時在卡片頁查看" },
] as const;

interface UserCardGuideDialogProps {
  open: boolean;
  /** 「稍後再說」、Esc 或點擊遮罩 */
  onDismiss: () => void;
  /** 「前往設定」 */
  onGoToCards: () => void;
}

/** 首頁：尚未綁定任何乘車卡時的引導視窗 */
export function UserCardGuideDialog({
  open,
  onDismiss,
  onGoToCards,
}: UserCardGuideDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDismiss();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!bottom-3 !top-auto !flex !w-[calc(100%-1.5rem)] !max-w-[460px] !translate-y-0 !flex-col !gap-0 max-h-[calc(100vh-1.5rem)] overflow-hidden !rounded-card border border-bus-100 !p-0 shadow-soft supports-[height:100dvh]:max-h-[calc(100dvh-1.5rem)] sm:!bottom-auto sm:!top-1/2 sm:!-translate-y-1/2"
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-5">
          <div
            aria-hidden="true"
            className="relative grid h-[136px] place-items-center rounded-[22px] bg-bus-50"
          >
            <div className="relative aspect-[1.586/1] w-[172px] -rotate-6 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift">
              <UserCardFaceArt />
            </div>
            <span className="absolute left-[calc(50%+64px)] top-4 grid size-[42px] place-items-center rounded-full border-[3px] border-white bg-star-400 text-bus-900">
              <Plus className="size-5" strokeWidth={3} />
            </span>
          </div>

          <div>
            <p className="text-sm font-black tracking-[0.2em] text-bus-600">
              乘車卡片
            </p>
            <DialogTitle className="mt-1 text-xl leading-snug sm:text-2xl">
              尚未綁定乘車卡片
            </DialogTitle>
          </div>

          <ul className="m-1 flex flex-col gap-2">
            {GUIDE_POINTS.map((point) => (
              <li
                key={point.id}
                className="flex items-center gap-2.5 text-base font-bold text-ink-800"
              >
                <span
                  aria-hidden="true"
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-bus-50 text-bus-600"
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {point.text}
              </li>
            ))}
          </ul>

          <div className="mt-2 rounded-2xl border-2 border-star-300 bg-[#FFF8D6] px-3.5 py-3">
            <DialogDescription className="text-center text-[17px] font-extrabold leading-[1.55] text-orange-400">
              乘車前須完成
              <strong className="font-black text-xl text-orange-700">
                悠遊卡綁定並通過審核
              </strong>
              <br />
              方可使用該卡片進行乘車核銷。
            </DialogDescription>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-2.5 border-t border-ink-100 bg-ink-50 px-5 pb-[18px] pt-3.5">
          <button
            type="button"
            onClick={onDismiss}
            className="min-h-12 rounded-2xl border border-ink-300 bg-white px-2 py-2 text-base font-extrabold leading-tight text-ink-700 hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500"
          >
            稍後再說
          </button>
          <button
            type="button"
            onClick={onGoToCards}
            className="flex min-h-12 items-center justify-center gap-1.5 rounded-2xl bg-bus-900 px-2 py-2 text-lg font-black leading-tight text-white shadow-card hover:bg-bus-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bus-100"
          >
            前往設定
            <ArrowRight
              className="size-5"
              strokeWidth={2.6}
              aria-hidden="true"
            />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
