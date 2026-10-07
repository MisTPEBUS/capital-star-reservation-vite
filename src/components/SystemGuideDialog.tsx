import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";

export interface SystemGuideStep {
  imageSrc: string;
  imageAlt: string;
}

interface SystemGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  steps: readonly SystemGuideStep[];
}

export function SystemGuideDialog({ open, onOpenChange, steps }: SystemGuideDialogProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];
  const lastStepIndex = steps.length - 1;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setStepIndex(0);
    onOpenChange(nextOpen);
  };

  if (!currentStep) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="!bottom-3 !top-auto !max-h-[calc(100dvh-1.5rem)] !w-[calc(100%-1.5rem)] !max-w-[620px] !translate-y-0 !gap-0 overflow-hidden !rounded-[28px] !border !border-bus-100 !p-0 shadow-soft sm:!bottom-auto sm:!top-1/2 sm:!-translate-y-1/2"
      >
        <DialogTitle className="sr-only">系統使用說明</DialogTitle>
        <DialogDescription className="sr-only">
          第 {stepIndex + 1} 步，共 {steps.length} 步。{currentStep.imageAlt}
        </DialogDescription>

        <div className="max-h-[calc(100dvh-6rem)] overflow-y-auto px-6 pb-7 pt-8 sm:px-10 sm:pb-9 sm:pt-10">
          <div className="relative mb-9 flex items-start justify-between sm:mb-12" aria-label={`第 ${stepIndex + 1} 步，共 ${steps.length} 步`}>
            <div className="absolute left-[42px] right-[42px] top-[18px] h-[3px] rounded-full bg-ink-100" aria-hidden="true" />
            <div
              className="absolute left-[42px] top-[18px] h-[3px] rounded-full bg-bus-500 transition-all duration-300"
              style={{ width: `calc((100% - 84px) * ${steps.length === 1 ? 0 : stepIndex / lastStepIndex})` }}
              aria-hidden="true"
            />
            {steps.map((step, index) => {
              const isActive = index === stepIndex;
              const isComplete = index < stepIndex;
              return (
                <div key={`${step.imageSrc}-${index}`} className="relative z-10 flex w-[84px] flex-col items-center gap-2" aria-current={isActive ? "step" : undefined}>
                  <span className={`flex size-[38px] items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${isActive ? "border-bus-500 bg-bus-500 text-white shadow-card" : isComplete ? "border-bus-500 bg-bus-50 text-bus-600" : "border-ink-300 bg-white text-ink-500"}`}>
                    {index + 1}
                  </span>
                  <span className={`text-xs font-semibold sm:text-[13px] ${isActive ? "text-bus-700" : "text-ink-500"}`}>Step {index + 1}</span>
                </div>
              );
            })}
          </div>

          <img
            key={currentStep.imageSrc}
            src={currentStep.imageSrc}
            alt={currentStep.imageAlt}
            className="mx-auto block h-auto max-h-[min(48dvh,430px)] w-full rounded-2xl border border-bus-100 object-contain"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-ink-100 bg-ink-50 px-5 py-4 sm:px-8 sm:py-5">
          {stepIndex > 0 && (
            <button type="button" onClick={() => setStepIndex((index) => index - 1)} className="min-h-11 min-w-24 rounded-xl border border-ink-300 bg-white px-5 text-sm font-bold text-ink-700 transition hover:bg-ink-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500">
              上一步
            </button>
          )}
          {stepIndex < lastStepIndex ? (
            <button type="button" onClick={() => setStepIndex((index) => index + 1)} className="min-h-11 min-w-24 rounded-xl bg-bus-500 px-5 text-sm font-bold text-white shadow-card transition hover:bg-bus-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500 focus-visible:ring-offset-2">
              下一步
            </button>
          ) : (
            <button type="button" onClick={() => handleOpenChange(false)} className="min-h-11 min-w-24 rounded-xl bg-bus-700 px-5 text-sm font-bold text-white shadow-card transition hover:bg-bus-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500 focus-visible:ring-offset-2">
              關閉
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
