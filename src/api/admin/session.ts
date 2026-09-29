export const ADMIN_SESSION_STORAGE_KEY = "capital-star-admin-session";
export const SUPER_ADMIN_SESSION_STORAGE_KEY =
  "capital-star-super-admin-session";
export const SUPER_ADMIN_TOKEN_HEADER = "X-Super-Admin-Token";

// Super Admin Token 在後端不會過期，前端僅保存於分頁內並限制使用時數。
const SUPER_ADMIN_SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

interface AdminIdentity {
  expiresAt: string;
  userId: string;
  displayName: string | null;
  role: string;
}

export interface BearerAdminSession extends AdminIdentity {
  authType: "bearer";
  accessToken: string;
  tokenType: string;
}

export interface SuperAdminSession extends AdminIdentity {
  authType: "superAdmin";
  superAdminToken: string;
}

export type AdminSession = BearerAdminSession | SuperAdminSession;

export function saveAdminSession(session: Omit<BearerAdminSession, "authType">) {
  const expiresAt = new Date(session.expiresAt).getTime();
  if (!session.accessToken || !session.userId || Number.isNaN(expiresAt)) {
    throw new Error("登入資訊不完整，無法建立後台工作階段");
  }

  sessionStorage.removeItem(SUPER_ADMIN_SESSION_STORAGE_KEY);
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

export function saveSuperAdminSession(superAdminToken: string) {
  if (!superAdminToken) {
    throw new Error("缺少 Super Admin Token，無法建立後台工作階段");
  }

  const session: SuperAdminSession = {
    authType: "superAdmin",
    superAdminToken,
    expiresAt: new Date(
      Date.now() + SUPER_ADMIN_SESSION_DURATION_MS,
    ).toISOString(),
    userId: "SuperAdmin",
    displayName: "Super Admin",
    role: "ADMIN",
  };

  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  sessionStorage.setItem(
    SUPER_ADMIN_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  sessionStorage.removeItem(SUPER_ADMIN_SESSION_STORAGE_KEY);
}

function getSuperAdminSession(): SuperAdminSession | null {
  const rawSession = sessionStorage.getItem(SUPER_ADMIN_SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as Partial<SuperAdminSession>;
    if (
      session.authType !== "superAdmin" ||
      !session.superAdminToken ||
      !session.expiresAt
    ) {
      sessionStorage.removeItem(SUPER_ADMIN_SESSION_STORAGE_KEY);
      return null;
    }

    return session as SuperAdminSession;
  } catch {
    sessionStorage.removeItem(SUPER_ADMIN_SESSION_STORAGE_KEY);
    return null;
  }
}

function getBearerAdminSession(): BearerAdminSession | null {
  const rawSession = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as Omit<
      BearerAdminSession,
      "authType"
    >;
    if (!session.accessToken || !session.expiresAt || !session.userId) {
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      return null;
    }

    return { ...session, authType: "bearer" };
  } catch {
    localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    return null;
  }
}

export function getAdminSession(): AdminSession | null {
  return getSuperAdminSession() ?? getBearerAdminSession();
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
