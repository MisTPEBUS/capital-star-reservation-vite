import { type MouseEvent, useEffect } from "react";
import { Link } from "react-router-dom";

interface FaqItem {
  question: string;
  answer: string;
}

const faqSections: Array<{ title: string; items: FaqItem[] }> = [
  {
    title: "如何使用",

    items: [
      {
        question: "第一次預約需要先做什麼？",
        answer:
          "請從 LINE 下方選單點選前往預約首都之星。設定會員資料後即可查詢及預約班次。",
      },
      {
        question: "識別碼是什麼？需要自行設定嗎？",
        answer:
          "識別碼是系統提供的 8 位乘客識別碼，用於乘車憑證及工作人員核對。您不需要自行設定，乘車時出示乘車憑證即可。",
      },
      {
        question: "為什麼查不到可預約班次？",
        answer:
          "該預約班次尚未開放預約或已超過預約截止時間，或所有符合條件的班次都已額滿。",
      },
    ],
  },
  {
    title: "預約規則",

    items: [
      {
        question: "如何完成預約？",
        answer:
          "請依序選擇上車站、乘車日期、班次及乘車人數，確認資料後送出預約。預約成功後會顯示乘車憑證。",
      },
      {
        question: "同一天可以預約兩個班次嗎？",
        answer:
          "不可以。每位使用者在同一天只能有一筆有效預約；若當天已有預約，系統會提示您已有同日預約。",
      },
      {
        question: "我已預約明天的班次，還可以預約後天嗎？",
        answer:
          "可以。系統只限制同一天的有效預約，不會因為明天的班次尚未搭乘，而影響您預約後天的班次。",
      },
      {
        question: "我可以替其他人一起預約嗎？",
        answer:
          "可以。建立預約時，請填寫實際乘車姓名及乘車人數（最多 3 位），系統會依照填寫的人數顯示是否預約成功。",
      },
      {
        question: "櫃台可以替沒有 LINE 帳號的乘客預約嗎？",
        answer:
          "可以。櫃台人員可輸入乘客姓名、電話、乘車人數、路線、日期、時間及上車站建立預約，系統也會記錄建立該筆預約的工作人員。",
      },
      {
        question: "班次剩餘座位不足時可以預約嗎？",
        answer:
          "不可以。若乘車人數超過班次剩餘座位，系統會提示座位不足，請減少乘車人數或改選其他班次。",
      },
      {
        question: "為什麼畫面顯示班次還有座位，送出後卻無法預約？",
        answer:
          "可能是在您送出預約前，其他乘客已完成預約。系統會以送出當下的剩餘座位重新確認，請重新搜尋班次後再嘗試。",
      },
      {
        question: "預約後可以修改乘車人數嗎？",
        answer:
          "目前不支援直接修改乘車人數。請先取消原預約，再重新選擇班次、乘車姓名及人數建立新預約。",
      },
      {
        question: "預約錯誤可以修改嗎？",
        answer:
          "請先取消預約的班次，重新選擇上車站、乘車日期、班次及乘車人數，確認資料後重新預約。",
      },
      {
        question: "班次已出發後還能取消嗎？",
        answer: "不可以。班次出發後，該筆預約不能再取消。",
      },
    ],
  },

  {
    title: "乘車憑證",

    items: [
      {
        question: "如何確認預約是否成功？",
        answer:
          "預約成功後，系統會顯示乘車序號及乘車憑證。您也可以在右上角「近期預約紀錄」中查看班次日期、發車時間、上車站及乘車人數。",
      },
      {
        question: "預約成功後，要在哪裡查看乘車憑證？",
        answer:
          "點選「近期預約紀錄」，即可查看班次、上車站、乘車序號及乘車碼，請於上車時出示給工作人員。",
      },
      {
        question: "乘車憑證沒有顯示，該怎麼辦？",
        answer:
          "請確認網路連線後重新開啟服務。若班次已出發、預約已取消，或目前沒有未來的有效預約，乘車憑證將不會顯示。",
      },
      {
        question: "預約時出現失敗訊息，該怎麼處理？",
        answer:
          "請依照畫面訊息確認班次是否額滿、是否已超過預約截止時間、乘車人數是否超過剩餘座位，或您是否已有同日預約。若問題持續，請重新整理後再次嘗試。",
      },
      {
        question: "系統會保存哪些資料？",
        answer:
          "系統會使用 LINE 識別資訊建立乘客資料，並保存預約所需的基本資料及預約紀錄。相關資料僅用於身分核對、班次安排及乘車服務。",
      },
    ],
  },
];

export function FaqPage() {
  useEffect(() => {
    const previousFontSize = document.documentElement.style.fontSize;
    document.title = "常見問題｜Capital Star";
    document.documentElement.style.fontSize = "112.5%";
    return () => {
      document.documentElement.style.fontSize = previousFontSize;
    };
  }, []);

  const toggleFaqCard = (event: MouseEvent<HTMLDetailsElement>) => {
    const target = event.target as HTMLElement;
    if (
      target.closest("summary, a, button, input, textarea, select, label") ||
      window.getSelection()?.toString().trim()
    )
      return;
    event.currentTarget.open = !event.currentTarget.open;
  };

  return (
    <main className="min-h-screen overflow-hidden bg-ink-50 px-3 py-5 pb-20 text-ink-900 sm:px-4 lg:px-6 lg:py-7 lg:pb-24">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-bus-100 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-100px] h-80 w-80 rounded-full bg-star-100/70 blur-3xl" />
      </div>
      <div className="mx-auto max-w-4xl">
        <header className="rounded-xl border border-bus-500 bg-white p-4 shadow-card sm:p-6">
          <p className="text-sm font-black tracking-[0.2em] text-bus-600">
            首都之星
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
            FAQ常見問題
          </h1>
        </header>
        <div className="mt-6 space-y-6">
          {faqSections.map((section) => (
            <section key={section.title}>
              <div className="mb-3">
                <h2 className="text-2xl font-black tracking-tight text-bus-600">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <details
                    className="group cursor-pointer rounded-xl border-2 border-blue-400 bg-white p-1.5 shadow-[0_1px_0_rgba(15,23,42,0.08),0_10px_26px_rgba(15,23,42,0.05)] transition hover:border-bus-300 open:border-bus-600 open:ring-2 open:ring-bus-600/25"
                    key={item.question}
                    onClick={toggleFaqCard}
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-2 text-left outline-none transition hover:bg-ink-50 focus-visible:bg-ink-50 focus-visible:ring-4 focus-visible:ring-bus-500/20">
                      <span className="text-lg font-black text-ink-900">
                        {item.question}
                      </span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-300 bg-white text-xl font-black text-ink-700 transition group-open:rotate-45 group-open:border-bus-600 group-open:text-bus-600">
                        +
                      </span>
                    </summary>
                    <div className="mt-2 border-t border-ink-100 px-2 pt-2 text-base leading-7 text-ink-500">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
      <Link
        className="fixed left-1/2 z-40 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-xl border-2 border-white/20 bg-bus-700 px-5 py-2.5 text-center text-base font-black text-white shadow-card transition hover:bg-bus-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-bus-300/40 lg:w-auto"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
        to="/"
      >
        返回預約首頁
      </Link>
    </main>
  );
}
