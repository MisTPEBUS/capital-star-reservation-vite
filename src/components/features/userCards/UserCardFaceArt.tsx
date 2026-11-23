import { cn } from "@/lib/utils";

interface UserCardFaceArtProps {
  /** 審核失敗時改為灰色 */
  muted?: boolean;
}

/**
 * 卡面裝飾圖形（綠白配色的圓形構圖）。
 * 放在 position: relative 的卡面容器內，尺寸以卡面寬度百分比計算。
 */
export function UserCardFaceArt({ muted = false }: UserCardFaceArtProps) {
  const silverClassName = muted ? "bg-slate-200" : "bg-card-silver";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <span
        className={cn(
          "absolute -bottom-1/2 -right-1/3 aspect-square w-3/4 rounded-full",
          muted ? "bg-slate-300" : "bg-cardFace-green",
        )}
      />
      <span
        className={cn(
          "absolute bottom-[17%] right-[9%] aspect-square w-[22%] rounded-full",
          silverClassName,
        )}
      />
      <span
        className={cn(
          "absolute right-[34%] top-[27%] aspect-square w-[13%] rounded-full",
          muted ? "bg-slate-200" : "bg-cardFace-pink",
        )}
      >
        <span className="absolute inset-[27%] rounded-full bg-white" />
      </span>
      <span
        className={cn(
          "absolute right-[8%] top-[25%] aspect-square w-[7%] rounded-full",
          silverClassName,
        )}
      />
    </div>
  );
}
