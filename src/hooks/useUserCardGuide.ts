import { useCallback, useState } from "react";

const GUIDE_DISMISSED_KEY = "capital_star_card_guide_dismissed";

function readIsDismissed(): boolean {
  try {
    return sessionStorage.getItem(GUIDE_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * 首頁「尚未綁定乘車卡」引導視窗。
 * 關閉或前往設定後，本次開啟 LIFF（同一個 session）不再提示。
 */
export function useUserCardGuide(shouldPrompt: boolean) {
  const [isDismissed, setIsDismissed] = useState(readIsDismissed);

  const dismiss = useCallback(() => {
    setIsDismissed(true);

    try {
      sessionStorage.setItem(GUIDE_DISMISSED_KEY, "1");
    } catch {
      // 無法寫入 sessionStorage 時，只在目前畫面內記住
    }
  }, []);

  return { isOpen: shouldPrompt && !isDismissed, dismiss };
}
