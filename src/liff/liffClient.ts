import liff from "@line/liff";

export interface LiffProfile {
  lineUserId: string;
  displayName: string;
  pictureUrl: string;
  statusMessage: string;
  idToken: string | null;
  isInClient: boolean;
}

let isInitialized = false;

export async function initLiff(): Promise<LiffProfile | null> {
  const liffId = import.meta.env.VITE_LIFF_ID;

  if (!liffId) {
    throw new Error("VITE_LIFF_ID 尚未設定");
  }

  if (!isInitialized) {
    await liff.init({
      liffId,
      withLoginOnExternalBrowser: true,
    });

    isInitialized = true;
  }

  if (!liff.isLoggedIn()) {
    liff.login({
      redirectUri: window.location.href,
    });

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
