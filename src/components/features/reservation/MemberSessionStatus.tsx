interface MemberSessionStatusProps {
  status: "loading" | "error";
}

export function MemberSessionStatus({ status }: MemberSessionStatusProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bus-50 px-5 text-center">
      <div
        className={`rounded-panel bg-white p-6 shadow-card ring-1 ${
          status === "loading" ? "ring-bus-100" : "ring-coral/20"
        }`}
      >
        {status === "loading" ? (
          <>
            <p className="text-lg font-black text-ink-900">正在啟動 LINE 會員資料</p>
            <p className="mt-2 text-sm font-bold text-ink-500">請稍候</p>
          </>
        ) : (
          <>
            <p role="alert" className="text-lg font-black text-coral">
              無法載入，請透過 LINE 重新開啟此頁面。
            </p>
            <p className="mt-2 text-sm font-bold text-ink-500">
              若問題持續發生，請聯繫客服。
            </p>
          </>
        )}
      </div>
    </div>
  );
}
