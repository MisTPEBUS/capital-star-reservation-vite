export const ADMIN_SESSION_STORAGE_KEY = "capital-star-admin-session";

export interface AdminSession {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  userId: string;
  displayName: string | null;
  role: string;
}

export function saveAdminSession(session: AdminSession) {
  const expiresAt = new Date(session.expiresAt).getTime();
  if (!session.accessToken || !session.userId || Number.isNaN(expiresAt)) {
    throw new Error("登入資訊不完整，無法建立後台工作階段");
  }

  localStorage.setItem(
    ADMIN_SESSION_STORAGE_KEY,
    JSON.stringify({
      accessToken: session.accessToken,
      tokenType: session.tokenType || "Bearer",
      expiresAt: session.expiresAt,
      userId: session.userId,
      displayName: session.displayName,
      role: session.role,
    }),
  );
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
}

export function getAdminSession(): AdminSession | null {
  const rawSession = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as AdminSession;
    if (!session.accessToken || !session.expiresAt || !session.userId) {
      clearAdminSession();
      return null;
    }

    return session;
  } catch {
    clearAdminSession();
    return null;
  }
}

export function hasValidAdminSession() {
  const session = getAdminSession();
  if (!session || Number.isNaN(new Date(session.expiresAt).getTime())) {
    clearAdminSession();
    return false;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    clearAdminSession();
    return false;
  }

  return true;
}
