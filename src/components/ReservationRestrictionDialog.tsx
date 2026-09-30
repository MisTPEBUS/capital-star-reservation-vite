import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

interface ReservationRestrictionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const servicePhones = [
  { station: "礁溪轉運站", number: "03-988-0700" },
  { station: "宜蘭轉運站", number: "03-937-3600" },
  { station: "羅東轉運站", number: "03-955-6585" },
];

export function ReservationRestrictionDialog({
  open,
  onOpenChange,
}: ReservationRestrictionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>預約功能暫停</DialogTitle>
          <DialogDescription className="sr-only">
            累計未核銷預約紀錄達三筆，預約功能暫停十四天。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-base leading-7 text-ink-800">
          <p className="font-bold">親愛的旅客您好：</p>
          <p>
            您因累計3筆未核銷預約紀錄，暫時關閉預約功能14天，
            如有其他乘車諮詢及服務，請電洽各轉運站預約服務專線，我們將竭誠為您服務。
          </p>
          <p>感謝您的支持與配合，敬祝 旅途順心！</p>

          <div>
            <p className="font-black">服務電話</p>
            <ul className="mt-2 space-y-2">
              {servicePhones.map(({ station, number }) => (
                <li key={station} className="flex flex-wrap justify-between gap-x-4">
                  <span>{station}</span>
                  <a
                    className="font-bold text-bus-700 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bus-500"
                    href={`tel:${number}`}
                  >
                    {number}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            我知道了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
