import { CreditCard, Info } from "lucide-react";

const APPLY_NOTES = [
  { id: "digits", text: "卡號只需輸入數字，最多 20 碼。" },
  { id: "review", text: "送出後系統會自動查詢卡片；查不到時轉由客服人工審核。" },
  { id: "rejected", text: "審核失敗的卡號須先刪除，才能重新申請。" },
] as const;

export function UserCardEmptyState() {
  return (
    <>
      <section className="flex flex-col items-center rounded-card border-2 border-dashed border-ink-300 bg-white px-5 pb-6 pt-7 text-center">
        <span
          aria-hidden="true"
          className="grid size-[76px] place-items-center rounded-full bg-bus-50 text-bus-600"
        >
          <CreditCard className="size-9" strokeWidth={2} />
        </span>
        <h2 className="mt-3.5 text-xl font-black text-ink-900">還沒有綁定卡片</h2>
        <p className="mt-1.5 text-base leading-7 text-ink-500">
          新增悠遊卡卡號，審核通過後即可用於乘車核銷。
        </p>
      </section>

      <section className="rounded-3xl border border-bus-100 bg-ink-50 p-4">
        <h2 className="flex items-center gap-2 text-lg font-black text-ink-800">
          <Info className="size-5 text-bus-600" aria-hidden="true" />
          申請前須知
        </h2>
        <ol className="mt-3 flex flex-col gap-2.5">
          {APPLY_NOTES.map((note, index) => (
            <li
              key={note.id}
              className="flex items-start gap-2.5 text-[15px] leading-6 text-ink-700"
            >
              <span className="mt-0.5 grid size-[22px] shrink-0 place-items-center rounded-full bg-bus-100 text-xs font-black text-bus-700">
                {index + 1}
              </span>
              <span>{note.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
