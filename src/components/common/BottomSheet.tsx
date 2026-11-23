import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** false 時停用 Esc 與點擊遮罩關閉（例如送出中） */
  dismissible?: boolean;
  role?: "dialog" | "alertdialog";
  children: ReactNode;
}

/**
 * 由畫面底部滑出的面板。
 * 使用 Radix Dialog 處理焦點鎖定、Esc 關閉與關閉後焦點回到觸發按鈕。
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  dismissible = true,
  role = "dialog",
  children,
}: BottomSheetProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !dismissible) return;
    onOpenChange(nextOpen);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 animate-fade-in bg-bus-900/55" />
        <DialogPrimitive.Content
          role={role}
          // 沒有說明文字時明確關閉 aria-describedby，避免 Radix 警告
          {...(description ? {} : { "aria-describedby": undefined })}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[90dvh] w-full max-w-[820px] animate-sheet-up overflow-y-auto rounded-t-card bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2.5 shadow-soft outline-none"
        >
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-ink-300"
          />
          <DialogPrimitive.Title className="text-2xl font-black text-ink-900">
            {title}
          </DialogPrimitive.Title>
          {description ? (
            <DialogPrimitive.Description className="mt-1 text-base leading-6 text-ink-500">
              {description}
            </DialogPrimitive.Description>
          ) : null}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
