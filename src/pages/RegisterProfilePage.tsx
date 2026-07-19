import { FormEvent, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuthProfile, updateAuthProfile } from "../api/auth";
import { initLiff, type LiffProfile } from "../liff/liffClient";

type LocationState = {
  returnTo?: string;
};

const sexOptions = [
  { label: "男", value: "MALE" },
  { label: "女", value: "FEMALE" },
];

function normalizeFirstName(value: string) {
  return Array.from(value.trim()).slice(0, 1).join("");
}

export function RegisterProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const returnTo: string =
    typeof locationState?.returnTo === "string" ? locationState.returnTo : "/";

  const [liffProfile, setLiffProfile] = useState<LiffProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [sex, setSex] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    document.title = "會員資料 — Capital Star";
  }, []);

  useEffect(() => {
    let isCurrent = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const nextLiffProfile = await initLiff();
        if (!nextLiffProfile || !isCurrent) return;

        setLiffProfile(nextLiffProfile);

        const profile = await getAuthProfile(nextLiffProfile.lineUserId);
        if (!isCurrent) return;

        setFirstName(normalizeFirstName(profile.firstName ?? ""));
        setSex(profile.sex ?? "");
      } catch (error) {
        if (!isCurrent) return;

        console.error("REGISTER_PROFILE_LOAD_ERROR:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "會員資料讀取失敗",
        );
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isCurrent = false;
    };
  }, [navigate, returnTo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedFirstName = normalizeFirstName(firstName);

    if (!trimmedFirstName) {
      setErrorMessage("請輸入姓氏。");
      return;
    }

    if (!sex) {
      setErrorMessage("請選擇性別。");
      return;
    }

    if (!liffProfile?.lineUserId) {
      setErrorMessage("無法取得 LINE 使用者資料，請重新開啟頁面。");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      await updateAuthProfile(liffProfile.lineUserId, {
        firstName: trimmedFirstName,
        sex,
      });

      navigate(returnTo, { replace: true });
    } catch (error) {
      console.error("REGISTER_PROFILE_SUBMIT_ERROR:", error);
      setErrorMessage(error instanceof Error ? error.message : "儲存失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] px-4 text-center text-ink-900">
        <div className="rounded-panel bg-white p-6 shadow-card ring-1 ring-bus-100">
          <p className="text-lg font-black">正在確認會員資料</p>
          <p className="mt-2 text-sm font-bold text-ink-500">請稍候</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7f3ff_0,#f7fbff_35%,#fff8e6_100%)] px-3 py-4 text-ink-900 md:px-4 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[820px] items-center">
        <section className="w-full overflow-hidden rounded-panel bg-white shadow-card ring-1 ring-bus-100/80">
          <div className="bg-bus-900 px-5 py-6 text-white md:px-7">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-star-300">
              Capital Star
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight md:text-3xl">
              會員資料設定
            </h1>
            <p className="mt-2 text-sm font-bold leading-6 text-bus-100">
              請確認乘車識別資料，儲存後系統會優先顯示姓氏與稱謂。
            </p>
          </div>

          <form className="grid gap-5 p-5 md:p-7" onSubmit={handleSubmit}>
            <label className="grid gap-2">
              <span className="text-sm font-black text-ink-700">姓氏</span>
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                onBlur={(event) =>
                  setFirstName(normalizeFirstName(event.target.value))
                }
                className="h-12 rounded-2xl border border-bus-100 bg-ink-50 px-4 text-base font-bold text-ink-900 outline-none transition focus:border-bus-500 focus:bg-white focus:ring-4 focus:ring-bus-100"
                maxLength={1}
                placeholder="請輸入姓氏"
                autoComplete="family-name"
              />
            </label>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-black text-ink-700">性別</legend>
              <div className="grid grid-cols-2 gap-3">
                {sexOptions.map((option) => {
                  const isSelected = sex === option.value;

                  return (
                    <label
                      key={option.value}
                      className={[
                        "flex h-12 cursor-pointer items-center justify-center rounded-2xl border px-4 text-base font-black transition",
                        isSelected
                          ? "border-bus-600 bg-bus-50 text-bus-700 ring-4 ring-bus-100"
                          : "border-bus-100 bg-white text-ink-700",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="sex"
                        value={option.value}
                        checked={isSelected}
                        onChange={(event) => setSex(event.target.value)}
                        className="sr-only"
                      />
                      {option.label}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {errorMessage ? (
              <div className="rounded-2xl bg-coral/10 px-4 py-3 text-sm font-bold text-coral ring-1 ring-coral/20">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-2xl bg-bus-600 px-5 text-base font-black text-white shadow-card transition hover:bg-bus-700 disabled:cursor-not-allowed disabled:bg-ink-300"
            >
              {isSubmitting ? "儲存中" : "儲存資料"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
