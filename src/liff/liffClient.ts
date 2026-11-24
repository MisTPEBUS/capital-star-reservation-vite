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
    initPromise = liff
      .init({
        liffId,
        withLoginOnExternalBrowser: true,
      })
      .catch((error) => {
        // 初始化失敗後允許重新初始化
        initPromise = null;
        throw error;
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

/**
 * 取得目前 LIFF 的 ID token，供需要 X-Line-Id-Token 的 API 使用。
 * 未登入或取不到 token 時回傳 null。
 */
export async function getLiffIdToken(): Promise<string | null> {
  await initializeLiff();

  if (!liff.isLoggedIn()) {
    return null;
  }

  return liff.getIDToken();
}

export async function getLiffDecodedIdToken(): Promise<
  ReturnType<typeof liff.getDecodedIDToken>
> {
  await initializeLiff();

  if (!liff.isLoggedIn()) {
    return null;
  }

  return liff.getDecodedIDToken();
}

/**
 * 判斷目前使用者是否已加入
 * LINE Login Channel 綁定的官方帳號。
 */
export async function isOfficialAccountFriend(): Promise<boolean> {
  await initializeLiff();

  if (!liff.isLoggedIn()) {
    return false;
  }

  const friendship = await liff.getFriendship();

  return friendship.friendFlag;
}

/**
 * 在 LINE 內時，用外部瀏覽器開啟乘車憑證頁。
 *
 * reservationId 放在 # 前面的 query string：
 * liff.openWindow() 會把 hash 內的 query 搬到 # 前面，放在 hash 內會讀不到。
 *
 * @returns 已用外部瀏覽器開啟時回傳 true；不在 LINE 內回傳 false，由呼叫端自行導頁。
 */
export function openTicketInExternalBrowser(reservationId: string): boolean {
  if (!liff.isInClient()) return false;

  const url = new URL(import.meta.env.BASE_URL, window.location.origin);
  url.searchParams.set("reservationId", reservationId);
  url.hash = "/ticket";

  liff.openWindow({ url: url.toString(), external: true });
  return true;
}

/**
 * 開啟首都之星官方 LINE 帳號。
 *
 * 未加入好友：
 * → 顯示官方帳號頁與「加入好友」
 *
 * 已加入好友：
 * → 開啟官方帳號聊天
 */
/**
 * 顯示 LINE 官方的加入好友 / 解除封鎖視窗。
 */
/* export function openOfficialAccount(): void {
  window.location.href = "https://line.me/R/ti/p/%40280suimv";
} */

/**
 * 顯示 LINE 官方帳號加入好友視窗。
 *
 * LIFF 內：使用 requestFriendship()
 * 外部瀏覽器：開啟官方帳號連結
 */
export async function openOfficialAccount(): Promise<void> {
  const basicId = import.meta.env.VITE_LINE_OA_BASIC_ID?.trim();

  if (!basicId) {
    throw new Error("VITE_LINE_OA_BASIC_ID 尚未設定");
  }

  await initializeLiff();

  // LINE LIFF 內優先使用官方好友視窗
  if (liff.isInClient() && liff.isLoggedIn()) {
    await liff.requestFriendship();
    return;
  }

  // 外部瀏覽器備援
  const url = `https://line.me/R/ti/p/${encodeURIComponent(basicId)}`;

  window.location.assign(url);
}
