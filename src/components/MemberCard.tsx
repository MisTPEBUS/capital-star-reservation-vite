import type { PassengerProfile, RouteInfo } from "../types/reservation";
import { SectionTitle } from "./SectionTitle";

interface MemberCardProps {
  passenger: PassengerProfile;
  route: RouteInfo;
  onEditProfile?: () => void;
}

export function MemberCard({
  passenger,
  route,
  onEditProfile,
}: MemberCardProps) {
  return (
    <section className="rounded-panel bg-white p-4 shadow-card ring-1 ring-bus-100/80 md:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <SectionTitle
          eyebrow="乘客會員資訊"
          title=""
          description="識別碼是乘客預約與現場核對的主要識別資料。"
        />
        {onEditProfile ? (
          <button
            type="button"
            onClick={onEditProfile}
            className="h-10 shrink-0 rounded-xl border border-bus-100 bg-white px-4 text-sm font-black text-bus-700 transition hover:bg-bus-50"
          >
            修改資料
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_180px] md:items-stretch">
        <div className="rounded-card bg-gradient-to-br from-bus-900 via-bus-700 to-bus-500 p-4 text-white shadow-lift md:p-5">
          <div className="flex items-start justify-between gap-3">
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

          <div className="mt-4 rounded-2xl bg-white/12 p-3 ring-1 ring-white/15 md:p-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-bus-100">
              識別碼 {/* Active Code */}
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
