import { useId } from "react";
import { CircleAlert, Clock, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BottomSheet } from "../../common/BottomSheet";
import { useAddUserCardForm } from "../../../hooks/useAddUserCardForm";
import type { UserCard } from "../../../types/userCard";
import { CARD_NUMBER_MAX_LENGTH } from "../../../utils/userCards";

interface AddUserCardSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingCards: UserCard[];
  addCard: (cardNumber: string) => Promise<UserCard>;
  onAdded: (card: UserCard) => void;
  onLimitReached: () => void;
}

export function AddUserCardSheet({
  open,
  onOpenChange,
  existingCards,
  addCard,
  onAdded,
  onLimitReached,
}: AddUserCardSheetProps) {
  const inputId = useId();
  const hintId = useId();
  const errorId = useId();
  const form = useAddUserCardForm({
    existingCards,
    addCard,
    onAdded,
    onLimitReached,
  });
  const isEmpty = form.cardNumberLength === 0;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) form.reset();
    onOpenChange(nextOpen);
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="新增悠遊卡"
      description="輸入卡號送出後，系統會自動查詢卡片資料。"
      dismissible={!form.isSubmitting}
    >
      <form noValidate onSubmit={form.submit} className="mt-4 flex flex-col gap-2">
        <label htmlFor={inputId} className="text-base font-black text-ink-700">
          卡號
        </label>
        <div className="relative">
          <input
            id={inputId}
            name="cardNumber"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="send"
            placeholder="請輸入卡片上的卡號"
            value={form.value}
            onChange={(event) => form.changeValue(event.target.value)}
            disabled={form.isSubmitting}
            aria-invalid={form.feedback ? true : undefined}
            aria-describedby={form.feedback ? errorId : hintId}
            className={cn(
              "h-14 w-full rounded-2xl border-2 bg-white pl-4 pr-20 text-2xl font-extrabold tabular-nums tracking-wider text-ink-900 outline-none transition placeholder:text-base placeholder:font-semibold placeholder:tracking-normal placeholder:text-ink-500 focus:ring-4 disabled:bg-ink-50 disabled:text-ink-500",
              form.feedback
                ? "border-orange-700 focus:ring-orange-100"
                : "border-ink-300 focus:border-bus-500 focus:ring-bus-100",
            )}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold tabular-nums text-ink-500"
          >
            {form.cardNumberLength} / {CARD_NUMBER_MAX_LENGTH}
          </span>
        </div>

        {form.feedback ? (
          <div
            id={errorId}
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5"
          >
            <CircleAlert
              className="mt-0.5 size-4 shrink-0 text-orange-800"
              aria-hidden="true"
            />
            <div>
              <p className="text-base font-black text-orange-800">
                {form.feedback.title}
              </p>
              {form.feedback.description ? (
                <p className="mt-0.5 text-sm leading-6 text-ink-700">
                  {form.feedback.description}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <p id={hintId} className="text-sm text-ink-500">
            僅限數字，不需輸入空格或符號
          </p>
        )}

        <p className="mt-2 flex items-start gap-2.5 rounded-2xl bg-bus-50 px-3.5 py-3 text-sm font-semibold leading-6 text-bus-700">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          查詢最多約需 10 秒，請勿關閉畫面。查無資料時會轉為人工審核，不影響申請。
        </p>

        <div className="mt-2.5 grid grid-cols-[1fr_1.6fr] gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={form.isSubmitting}
            className="h-14 rounded-2xl border border-ink-300 bg-white text-base font-extrabold text-ink-700 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={form.isSubmitting || isEmpty}
            className={cn(
              "flex h-14 items-center justify-center gap-2 rounded-2xl text-lg font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bus-100",
              form.isSubmitting && "cursor-wait bg-bus-600 text-white",
              !form.isSubmitting && isEmpty && "cursor-not-allowed bg-ink-100 text-ink-500",
              !form.isSubmitting && !isEmpty && "bg-bus-900 text-white shadow-card hover:bg-bus-700",
            )}
          >
            {form.isSubmitting ? (
              <>
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
                查詢卡片中…
              </>
            ) : (
              "送出申請"
            )}
          </button>
        </div>
      </form>
    </BottomSheet>
  );
}
