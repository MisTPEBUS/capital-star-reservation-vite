import liff from "@line/liff";

export interface LiffProfile {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  statusMessage: string;
  idToken: string | null;
  isInClient: boolean;
}

let initPromise: Promise<void> | null = null;

/**
 * 初始化 LIFF SDK。
 * 整個 SPA 生命週期只會真正執行一次 liff.init()。
 */
export async function initializeLiff(): Promise<void> {
  const liffId = import.meta.env.VITE_LIFF_ID;

  if (!liffId) {
    throw new Error("VITE_LIFF_ID 尚未設定");
  }

  if (!initPromise) {
    initPromise = liff.init({
      liffId,
      withLoginOnExternalBrowser: true,
    });
  }

  await initPromise;
}

/**
 * 取得目前 LINE 使用者資料。
 */
export async function initLiff(): Promise<LiffProfile | null> {
  await initializeLiff();

  if (!liff.isLoggedIn()) {
    return null;
  }

  const profile = await liff.getProfile();

  return {
    lineUserId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? "",
    statusMessage: profile.statusMessage ?? "",
    idToken: liff.getIDToken(),
    isInClient: liff.isInClient(),
  };
}
