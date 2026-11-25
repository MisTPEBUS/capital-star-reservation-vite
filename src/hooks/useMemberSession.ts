import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  getAuthProfile,
  isProfileRegistrationRequired,
  type AuthProfile,
} from "../api/auth";
import {
  initLiff,
  isOfficialAccountFriend,
  openOfficialAccount,
  type LiffProfile,
} from "../liff/liffClient";

type LiffStatus = "loading" | "success" | "error";

export function useMemberSession() {
  const navigate = useNavigate();
  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
  const [liffStatus, setLiffStatus] = useState<LiffStatus>("loading");
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [authError, setAuthError] = useState("");
  const hasOpenedOfficialAccount = useRef(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadLiffProfile() {
      try {
        const profile = await initLiff();
        if (!isCurrent) return;
        setLiffProfile(profile);
        setLiffStatus("success");
      } catch (error) {
        if (!isCurrent) return;
        console.error("LIFF_INIT_ERROR:", error);
        setLiffStatus("error");
      }
    }

    void loadLiffProfile();
    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const lineUserId = liffProfile?.lineUserId;
    if (!lineUserId) return;
    let isCurrent = true;

    async function openOfficialAccountOnce() {
      if (!isCurrent || hasOpenedOfficialAccount.current) return;
      hasOpenedOfficialAccount.current = true;

      try {
        await openOfficialAccount();
      } catch (error) {
        hasOpenedOfficialAccount.current = false;
        if (!isCurrent) return;
        console.error("OPEN_OFFICIAL_ACCOUNT_ERROR:", error);
        setAuthError(
          error instanceof Error ? error.message : "無法開啟官方 LINE 帳號",
        );
      }
    }

    async function loadAuthProfile(currentLineUserId: string) {
      try {
        setAuthProfile(null);
        setAuthError("");
        const profile = await getAuthProfile(currentLineUserId);
        if (!isCurrent) return;

        if (isProfileRegistrationRequired(profile)) {
          navigate("/register", {
            replace: true,
            state: { returnTo: "/" },
          });
          return;
        }

        if (!profile.activeCode?.trim()) {
          const isFriend = await isOfficialAccountFriend();
          if (!isCurrent) return;
          if (!isFriend) {
            await openOfficialAccountOnce();
            return;
          }

          setAuthProfile(profile);
          setAuthError("會員識別碼尚未建立，請稍後再試。");
          return;
        }

        setAuthProfile(profile);
      } catch (error) {
        if (!isCurrent) return;
        console.error("AUTH_PROFILE_ERROR:", error);

        if (axios.isAxiosError(error) && error.response?.status === 404) {
          await openOfficialAccountOnce();
          return;
        }

        setAuthError(
          error instanceof Error ? error.message : "會員資料讀取失敗",
        );
      }
    }

    void loadAuthProfile(lineUserId);
    return () => {
      isCurrent = false;
    };
  }, [liffProfile?.lineUserId, navigate]);

  return { liffProfile, liffStatus, authProfile, authError };
}
