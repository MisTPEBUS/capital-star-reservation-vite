import {
  FormEvent,
  KeyboardEvent,
  ClipboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  LoginVerificationCode,
  requestLoginVerificationCode,
  verifyLoginCode,
} from "../../api/admin/auth";
import {
  hasValidAdminSession,
  saveAdminSession,
} from "../../api/admin/session";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

const OTP_LENGTH = 4;

type DialogState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"activityCode" | "otp">("activityCode");
  const [activityCode, setActivityCode] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [verification, setVerification] =
    useState<LoginVerificationCode | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRequestingCode, setIsRequestingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [dialog, setDialog] = useState<DialogState>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const isVerifyingCodeRef = useRef(false);

  useEffect(() => {
    if (hasValidAdminSession()) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (step !== "otp" || !verification) return;

    const updateRemainingSeconds = () => {
      const milliseconds =
        new Date(verification.expiresAt).getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.ceil(milliseconds / 1000)));
    };

    updateRemainingSeconds();
    const timer = window.setInterval(updateRemainingSeconds, 1000);
    return () => window.clearInterval(timer);
  }, [step, verification]);

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!/^\d{8}$/.test(activityCode)) {
      setDialog({ type: "error", message: "請輸入 8 碼識別碼。" });
      return;
    }

    setIsRequestingCode(true);
    try {
      const nextVerification = await requestLoginVerificationCode(activityCode);
      setVerification(nextVerification);
      setOtp(Array(OTP_LENGTH).fill(""));
      setStep("otp");
      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (error) {
      setDialog({
        type: "error",
        message: error instanceof Error ? error.message : "建立驗證碼失敗。",
      });
    } finally {
      setIsRequestingCode(false);
    }
  };

  const submitOtp = async (nextOtp: string[]) => {
    if (isVerifyingCodeRef.current) return;

    if (nextOtp.some((digit) => !digit)) {
      setDialog({ type: "error", message: "請輸入完整四位驗證碼。" });
      return;
    }

    if (!verification) {
      setDialog({
        type: "error",
        message: "找不到驗證資訊，請重新發送驗證碼。",
      });
      return;
    }

    if (new Date(verification.expiresAt).getTime() <= Date.now()) {
      setDialog({ type: "error", message: "驗證碼已過期，請重新發送。" });
      return;
    }

    isVerifyingCodeRef.current = true;
    setIsVerifyingCode(true);
    try {
      const session = await verifyLoginCode(
        nextOtp.join(""),
        verification.userId,
      );
      saveAdminSession(session);
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      setDialog({
        type: "error",
        message: error instanceof Error ? error.message : "驗證登入失敗。",
      });
    } finally {
      isVerifyingCodeRef.current = false;
      setIsVerifyingCode(false);
    }
  };

  const updateOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    if (digit && nextOtp.every(Boolean)) {
      void submitOtp(nextOtp);
    }
  };

  const handleOtpKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedDigits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedDigits) return;

    const nextOtp = Array.from(
      { length: OTP_LENGTH },
      (_, index) => pastedDigits[index] ?? "",
    );
    setOtp(nextOtp);
    otpRefs.current[Math.min(pastedDigits.length, OTP_LENGTH) - 1]?.focus();

    if (nextOtp.every(Boolean)) {
      void submitOtp(nextOtp);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submitOtp(otp);
  };

  const resendCode = async () => {
    if (remainingSeconds > 0 || isRequestingCode) return;

    setIsRequestingCode(true);
    try {
      const nextVerification = await requestLoginVerificationCode(activityCode);
      setVerification(nextVerification);
      setOtp(Array(OTP_LENGTH).fill(""));
      window.setTimeout(() => otpRefs.current[0]?.focus(), 0);
    } catch (error) {
      setDialog({
        type: "error",
        message: error instanceof Error ? error.message : "建立驗證碼失敗。",
      });
    } finally {
      setIsRequestingCode(false);
    }
  };

  const closeDialog = () => {
    if (dialog?.type === "success") {
      navigate("/admin/dashboard");
      return;
    }

    setDialog(null);
  };

  return (
    <main className="admin-shell flex items-center justify-center p-4">
      <section className="w-full max-w-md">
        <header className="mb-8 text-center">
          {/*  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-adminPanel border border-admin-borderStrong bg-admin-elevated text-2xl font-bold tracking-[0.1em] text-adminStatus-enabled">
           
          </div> */}
          <p className="mt-6 text-xs font-bold tracking-[0.3em] text-adminStatus-enabled">
            CAPITAL STAR
          </p>
          <h1 className="mt-3 text-3xl font-bold text-admin-text">
            首都之星管理後台
          </h1>
          <p className="mt-3 text-sm text-admin-muted">管理者與核銷人員登入</p>
        </header>

        {step === "activityCode" ? (
          <form className="admin-panel p-5 sm:p-6" onSubmit={sendCode}>
            {/*    <p className="text-xs font-semibold tracking-[0.18em] text-admin-muted">
              首都之星LINE識別碼
            </p> */}
            <label
              className=" block text-sm font-medium text-admin-softText"
              htmlFor="activity-code"
            >
              LINE識別碼
            </label>
            <input
              id="activity-code"
              className="mt-2 h-14 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-4 text-center text-lg font-bold tracking-[0.15em] text-admin-text outline-none transition placeholder:text-admin-muted focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15"
              inputMode="numeric"
              maxLength={8}
              placeholder="請輸入數字"
              value={activityCode}
              onChange={(event) =>
                setActivityCode(event.target.value.replace(/\D/g, ""))
              }
            />
            <button
              className="mt-6 h-14 w-full rounded-adminControl bg-adminStatus-enabled px-4 font-bold text-admin-bg transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled"
              type="submit"
              disabled={isRequestingCode}
            >
              {isRequestingCode ? "取得中..." : "取得驗證碼"}
            </button>
          </form>
        ) : (
          <form className="admin-panel p-5 sm:p-6" onSubmit={verifyCode}>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-adminStatus-enabled/30 bg-adminStatus-enabled/10 text-2xl text-adminStatus-enabled">
                @
              </div>
              <h2 className="mt-5 text-2xl font-bold text-admin-text">
                驗證登入
              </h2>
              <p className="mt-3 text-sm text-admin-muted">
                驗證碼已傳送至 LINE
              </p>
              <p className="mt-4 text-xl font-bold text-amber-300">
                {formatCountdown(remainingSeconds)}
              </p>
            </div>

            <div className="mt-8 flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    otpRefs.current[index] = element;
                  }}
                  aria-label={`驗證碼第 ${index + 1} 碼`}
                  className="h-14 w-12 rounded-adminControl border border-admin-borderStrong bg-admin-bg text-center text-2xl font-bold text-admin-text outline-none transition focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15 sm:w-14"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateOtp(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={handleOtpPaste}
                />
              ))}
            </div>

            <button
              className="mt-8 h-14 w-full rounded-adminControl bg-adminStatus-enabled px-4 font-bold text-admin-bg transition hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adminStatus-enabled"
              type="submit"
              disabled={isVerifyingCode || remainingSeconds === 0}
            >
              {isVerifyingCode ? "驗證中..." : "驗證登入"}
            </button>
            <button
              className="mt-4 w-full py-2 text-sm font-medium text-adminStatus-enabled disabled:cursor-not-allowed disabled:text-admin-muted"
              disabled={remainingSeconds > 0 || isRequestingCode}
              type="button"
              onClick={resendCode}
            >
              {remainingSeconds > 0
                ? `可於 ${formatCountdown(remainingSeconds)} 後重新發送`
                : isRequestingCode
                  ? "重新發送中..."
                  : "重新發送驗證碼"}
            </button>
          </form>
        )}

        <p className="mt-7 text-center text-xs leading-5 text-admin-muted">
          CAPITAL STAR ADMIN SYSTEM
          <br />
          僅限授權管理人員使用
        </p>
      </section>

      <AlertDialog
        open={Boolean(dialog)}
        onOpenChange={(isOpen) => {
          if (!isOpen && dialog) closeDialog();
        }}
      >
        {dialog && (
          <AlertDialogContent className="!z-[60] !max-w-sm !rounded-adminPanel !border !border-admin-borderStrong !bg-admin-surface !p-5 !text-admin-text shadow-adminPanel">
            <AlertDialogHeader className="!block !text-center">
              <div
                className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full border text-2xl font-bold ${
                  dialog.type === "success"
                    ? "border-adminStatus-enabled/30 bg-adminStatus-enabled/10 text-adminStatus-enabled"
                    : "border-red-400/30 bg-red-400/10 text-red-300"
                }`}
              >
                {dialog.type === "success" ? "OK" : "!"}
              </div>
              <AlertDialogTitle className="mt-5 text-xl font-bold !text-admin-text">
                {dialog.type === "success" ? "驗證完成" : "登入異常"}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-3 text-sm leading-6 !text-admin-muted">
                {dialog.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="!mx-0 !mb-0 !mt-6 !block !border-0 !bg-transparent !p-0">
              <AlertDialogAction
                className="!h-12 !w-full !rounded-adminControl !bg-admin-elevated !font-semibold !text-admin-text hover:!bg-admin-borderStrong"
                onClick={closeDialog}
              >
                確定
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </main>
  );
}
