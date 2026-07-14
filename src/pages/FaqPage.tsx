import { type MouseEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

interface FaqItem {
  question: string;
  answer: FaqAnswer;
}

type FaqAnswerPart = {
  text: string;
  highlight?: boolean;
};

type FaqAnswer = string | FaqAnswerPart[];

const faqSections: Array<{
  title: string;
  description: string;
  items: FaqItem[];
}> = [
  {
    title: "開始使用",
    description: "從 LINE 開啟服務後，幾個步驟就能完成預約。",
    items: [
      {
        question: "第一次使用需要先做什麼？",
        answer:
          "請從 LINE 開啟首都客運預約服務。系統會確認您的 LINE 身分並建立或讀取乘客資料；完成後即可查看可預約的班次。",
      },
      {
        question: "識別碼是什麼？需要自行設定嗎？",
        answer:
          "識別碼是系統提供的 8 位乘客識別碼，會用於乘車憑證與工作人員核對。您不需要自行設定，請在需要時出示憑證即可。",
      },
      {
        question: "為什麼無法看到可預約的班次？",
        answer:
          "請先確認選擇的日期與上車站。若仍沒有班次，可能是該日尚未開放、已超過預約截止時間，或目前沒有符合條件的營運班次。",
      },
    ],
  },
  {
    title: "預約與乘車",
    description: "了解如何選擇班次、使用乘車憑證與處理取消。",
    items: [
      {
        question: "如何完成預約？",
        answer: [
          { text: "依序" },
          { text: "選擇上車站", highlight: true },
          { text: "日期", highlight: true },
          { text: "與可預約" },
          { text: "班次", highlight: true },
          {
            text: "，再按下預約按鈕。系統會確認座位數、預約截止時間與您的預約狀態；成功後會立即",
          },
          { text: "顯示乘車憑證" },
          { text: "。" },
        ],
      },
      {
        question: "預約成功後要在哪裡查看乘車憑證？",
        answer:
          "首頁會顯示下一筆有效預約。點選「預約乘車憑證」即可放大查看班次、上車站、乘車序號與乘車碼；請於上車時出示給工作人員。",
      },
      {
        question: "可以取消已預約的班次嗎？",
        answer:
          "可以。在班次出發前，開啟下一筆預約的乘車憑證並選擇取消預約。取消成功後座位會釋出，您可以重新選擇其他可預約班次。",
      },
      {
        question: "同一天可以預約多個班次嗎？",
        answer:
          "為避免重複占用座位，系統通常只保留同日的一筆有效預約。取消原有預約後，才可以改預約同日的其他班次。",
      },
    ],
  },
  {
    title: "常見狀況",
    description: "遇到異常時，先依下列方式確認。",
    items: [
      {
        question: "乘車憑證沒有顯示，該怎麼辦？",
        answer:
          "請確認網路連線後重新開啟服務。若班次已出發、預約已取消，或沒有未來的有效預約，乘車憑證不會顯示。",
      },
      {
        question: "預約時出現失敗訊息怎麼處理？",
        answer:
          "請依畫面訊息確認座位是否已額滿、是否已過截止時間，或您是否已有同日預約。若問題持續，請稍後重新整理並再試一次。",
      },
      {
        question: "系統會保存哪些資料？",
        answer:
          "系統使用 LINE 識別資訊建立乘客資料，並保存預約所需的基本資料與預約紀錄。資料僅用於身份核對、班次安排與乘車服務。",
      },
    ],
  },
];

function getAnswerText(answer: FaqAnswer) {
  return typeof answer === "string"
    ? answer
    : answer.map((part) => part.text).join("");
}

function renderAnswer(answer: FaqAnswer) {
  if (typeof answer === "string") return answer;

  return answer.map((part, index) =>
    part.highlight ? (
      <mark
        className="box-decoration-clone bg-[linear-gradient(to_top,rgba(255,193,7,0.75)_0%,rgba(255,235,59,0.65)_40%,rgba(255,235,59,0.25)_55%,transparent_60%)] px-1 py-0.5 font-black text-ink-900"
        key={`${part.text}-${index}`}
      >
        {part.text}
      </mark>
    ) : (
      <span key={`${part.text}-${index}`}>{part.text}</span>
    ),
  );
}

export function FaqPage() {
  const [keyword, setKeyword] = useState("");
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredSections = useMemo(() => {
    if (!normalizedKeyword) return faqSections;

    return faqSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          const question = item.question.toLowerCase();
          const answer = getAnswerText(item.answer).toLowerCase();

          return (
            question.includes(normalizedKeyword) ||
            answer.includes(normalizedKeyword)
          );
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [normalizedKeyword]);
  const hasResults = filteredSections.length > 0;

  useEffect(() => {
    const previousFontSize = document.documentElement.style.fontSize;
    document.title = "使用說明 — Capital Star";
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
    ) {
      return;
    }

    event.currentTarget.open = !event.currentTarget.open;
  };

  return (
    <main className="min-h-screen overflow-hidden bg-ink-50 px-3 py-5 pb-20 text-ink-900 sm:px-4 lg:px-6 lg:py-7 lg:pb-24">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-bus-100 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-100px] h-80 w-80 rounded-full bg-star-100/70 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl">
        <header className="rounded-xl border border-bus-500 bg-white/85 p-4 shadow-card backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-black tracking-[0.2em] text-bus-600">
                首都客運
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-ink-900 sm:text-4xl">
                預約系統使用說明
              </h1>
              <p className="mt-3 text-base leading-7 text-ink-500 sm:text-lg">
                透過 LINE
                即可查詢班次、完成預約並出示乘車紀錄。以下整理乘客最常遇到的操作與問題。
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 border-t border-ink-100 pt-4 sm:grid-cols-3">
            {[
              ["1", "選擇日期與上車站"],
              ["2", "預約可用班次"],
              ["3", "出示乘車紀錄"],
            ].map(([step, label]) => (
              <div className="flex items-center gap-3" key={step}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-bus-700 text-sm font-black text-white">
                  {step}
                </span>
                <p className="text-sm font-bold text-ink-700">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-ink-100 pt-4">
            <label className="block text-sm font-black tracking-[0.16em] text-bus-600">
              搜尋問題
            </label>
            <input
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="輸入關鍵字"
              className="mt-2 h-12 w-full rounded-xl border-2 border-bus-100 bg-white px-4 text-base font-bold text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-bus-600 focus:ring-4 focus:ring-bus-500/20"
            />
          </div>
        </header>

        <div className="mt-6 space-y-6">
          {!hasResults && (
            <div className="rounded-xl border-2 border-bus-100 bg-white p-4 text-center shadow-card">
              <p className="text-xl font-black text-ink-900">
                沒有符合的問題，請聯繫客服
              </p>
            </div>
          )}

          {filteredSections.map((section) => (
            <section key={section.title}>
              <div className="mb-3">
                <h2 className="mt-1 text-2xl font-black tracking-tight text-bus-600">
                  {section.title}
                </h2>
                <p className="mt-1.5 text-base leading-6 text-ink-400 sm:text-lg">
                  {section.description}
                </p>
              </div>

              <div className="space-y-2">
                {section.items.map((item) => (
                  <details
                    className="group cursor-pointer rounded-xl border-2 border-blue-400 bg-white p-1.5 shadow-[0_1px_0_rgba(15,23,42,0.08),0_10px_26px_rgba(15,23,42,0.05)] transition hover:border-bus-300 open:border-bus-600 open:ring-2 open:ring-bus-600/25"
                    key={item.question}
                    onClick={toggleFaqCard}
                  >
                    <summary className="flex cursor-pointer  pb-0 list-none items-center justify-between gap-3 rounded-xl p-2 text-left outline-none transition hover:bg-ink-50 focus-visible:bg-ink-50 focus-visible:ring-4 focus-visible:ring-bus-500/20">
                      <span className="text-lg font-black text-ink-900">
                        {item.question}
                      </span>
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-ink-300 bg-white text-xl font-black text-ink-700 transition group-open:rotate-45 group-open:border-bus-600 group-open:text-bus-600">
                        +
                      </span>
                    </summary>
                    <div className="mt-2 border-t border-ink-100 px-2 pt-2 text-base leading-7 text-ink-500">
                      {renderAnswer(item.answer)}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-7 rounded-card border-2 border-bus-500 bg-bus-900 px-4 py-5 text-center text-white shadow-soft sm:px-5">
          <p className="text-xl font-black">需要協助嗎？</p>
          <p className="mt-2 text-base leading-7 text-bus-100">
            若依照說明仍無法完成操作，請聯繫活動承辦人員並提供識別碼與預約日期，以便協助查詢。
          </p>
          <div className="mx-auto  mt-4 max-w-2xl border-t border-white/20 pt-4 text-center">
            <p className="text-lg font-black ">
              首都客運客服中心（05:30~24:00）
            </p>
            <p className="mt-2 text-xl font-black text-star-300">
              免付費專線：0800-000-866
            </p>
            <div className="mt-4  grid gap-2 text-base text-bus-100 sm:grid-cols-2">
              <p>礁溪站　服務電話：03-988-0700</p>
              <p>宜蘭站　服務電話：03-937-3600</p>
              <p>羅東站　服務電話：03-955-6585</p>
            </div>
          </div>
        </footer>
      </div>

      <Link
        className="fixed left-1/2 z-40 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-xl border-2 border-white/20 bg-bus-700 px-5 py-2.5 text-center text-base font-black text-white shadow-card transition hover:bg-bus-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-bus-300/40 md:w-[calc(100%-2rem)] lg:w-auto"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
        to="/"
      >
        前往預約首頁
      </Link>
    </main>
  );
}
