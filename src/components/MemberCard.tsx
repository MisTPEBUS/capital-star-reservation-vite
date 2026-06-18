import type { PassengerProfile, RouteInfo } from "../types/reservation";
import { SectionTitle } from "./SectionTitle";

interface MemberCardProps {
  passenger: PassengerProfile;
  route: RouteInfo;
}

export function MemberCard({ passenger, route }: MemberCardProps) {
  return (
    <section className="rounded-panel bg-white p-5 shadow-card ring-1 ring-bus-100/80 md:p-6">
      <SectionTitle
        eyebrow="Section 1"
        title="乘客會員資訊"
        description="活動碼是乘客預約與現場核對的主要識別資料。"
      />

      <div className="grid gap-4 md:grid-cols-[1fr_180px] md:items-stretch">
        <div className="rounded-card bg-gradient-to-br from-bus-900 via-bus-700 to-bus-500 p-5 text-white shadow-lift">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-star-300">
                {passenger.membershipLabel}
              </p>
              <h3 className="mt-2 text-2xl font-black">
                {passenger.displayName}
              </h3>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-star-300 ring-1 ring-white/20">
              {passenger.status === "ACTIVE" ? "可預約" : "停用"}
            </span>
          </div>

          <div className="mt-5 rounded-2xl bg-white/12 p-4 ring-1 ring-white/15">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-bus-100">
              身分識別碼 {/* Active Code */}
            </p>
            <p className="mt-2 font-mono text-3xl font-black tracking-[0.14em] text-star-300">
              {passenger.activeCode}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
