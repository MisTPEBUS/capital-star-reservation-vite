import { useEffect, useState } from "react";
import {
  ChevronRight,
  LogOut,
  Menu,
  Minus,
  Plus,
  TriangleAlert,
  Type,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import packageInfo from "../../../package.json";
import { clearAdminSession, getAdminSession } from "../../api/admin/session";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "../../components/ui/sheet";
import { getAdminPageTitle } from "./Header";
import { dispatchNavigation, navigation, SidebarIcon } from "./Sidebar";

interface MobileNavbarProps {
  fontSize: number;
  canDecreaseFontSize: boolean;
  canIncreaseFontSize: boolean;
  onDecreaseFontSize: () => void;
  onIncreaseFontSize: () => void;
}

const APP_VERSION = `v${packageInfo.version}`;

function MobileNavLink({
  to,
  label,
  icon,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: Parameters<typeof SidebarIcon>[0]["name"];
  onNavigate: () => void;
}) {
  return (
    <NavLink
      className={({ isActive }) =>
        `group flex min-h-14 items-center gap-3 rounded-adminControl border px-3.5 py-3 text-lg font-semibold transition ${
          isActive
            ? "border-adminStatus-enabled/40 bg-adminStatus-enabled/15 text-adminStatus-enabled"
            : "border-transparent text-admin-softText hover:border-admin-border hover:bg-admin-elevated"
        }`
      }
      to={to}
      onClick={onNavigate}
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-admin-bg/60 text-current">
        <SidebarIcon name={icon} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronRight
        aria-hidden="true"
        className="h-5 w-5 text-admin-muted transition-transform group-hover:translate-x-0.5"
      />
    </NavLink>
  );
}

export function MobileNavbar({
  fontSize,
  canDecreaseFontSize,
  canIncreaseFontSize,
  onDecreaseFontSize,
  onIncreaseFontSize,
}: MobileNavbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const session = getAdminSession();
  const displayName = session?.displayName || session?.userId || "管理者";
  const pageTitle = getAdminPageTitle(pathname);
  const isDispatchActive = pathname.startsWith("/admin/dispatch/");

  const handleLogout = () => {
    clearAdminSession();
    setIsOpen(false);
    navigate("/admin/login", { replace: true });
  };

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-admin-border bg-admin-surface/95 shadow-[0_8px_24px_rgba(20,45,55,0.18)] backdrop-blur lg:hidden">
      <div className="flex min-h-16 items-center gap-3 px-3 sm:px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <Button
            aria-label="開啟導覽選單"
            aria-expanded={isOpen}
            className="h-11 w-11 shrink-0 rounded-adminControl border-admin-borderStrong bg-admin-elevated p-0 text-admin-text shadow-sm hover:border-adminStatus-enabled hover:bg-admin-elevated hover:text-adminStatus-enabled focus-visible:ring-adminStatus-enabled"
            variant="outline"
            type="button"
            onClick={() => setIsOpen(true)}
          >
            <Menu aria-hidden="true" className="!h-6 !w-6" />
          </Button>

          <SheetContent
            className="!w-[min(90vw,26rem)] !max-w-none !gap-0 !border-admin-border !bg-admin-surface !p-0 !text-admin-text"
            showCloseButton={false}
            side="left"
          >
            <SheetHeader className="border-b border-admin-border bg-admin-elevated/70 px-5 py-5 text-left">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-adminStatus-enabled/40 bg-adminStatus-enabled/15 text-base font-black text-adminStatus-enabled">
                  CS
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="!text-xl !font-bold !text-admin-text">
                    首都之星管理後台
                  </SheetTitle>
                  <p className="mt-1 text-base font-medium text-admin-muted">
                    系統版本 {APP_VERSION}
                  </p>
                </div>
                <SheetClose asChild>
                  <Button
                    aria-label="關閉導覽選單"
                    className="h-11 w-11 shrink-0 border-transparent bg-transparent p-0 text-admin-muted hover:bg-admin-bg/50 hover:text-admin-text focus-visible:ring-adminStatus-enabled"
                    variant="ghost"
                    type="button"
                  >
                    <X aria-hidden="true" className="!h-6 !w-6" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col">
              <nav
                aria-label="後台主要導覽"
                className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4"
              >
                <div className="space-y-1">
                  <p className="px-3 pb-1 text-sm font-bold tracking-[0.18em] text-admin-muted">
                    主要功能
                  </p>
                  {navigation.slice(0, 1).map((item) => (
                    <MobileNavLink
                      key={item.to}
                      {...item}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between px-3 pb-1">
                    <p className="text-sm font-bold tracking-[0.18em] text-admin-muted">
                      派班管理
                    </p>
                    {isDispatchActive && (
                      <span className="rounded-full bg-adminStatus-enabled/15 px-2.5 py-1 text-xs font-bold text-adminStatus-enabled">
                        使用中
                      </span>
                    )}
                  </div>
                  {dispatchNavigation.map((item) => (
                    <MobileNavLink
                      key={item.to}
                      {...item}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
                </div>

                <div className="space-y-1">
                  <p className="px-3 pb-1 text-sm font-bold tracking-[0.18em] text-admin-muted">
                    系統管理
                  </p>
                  {navigation.slice(1).map((item) => (
                    <MobileNavLink
                      key={item.to}
                      {...item}
                      onNavigate={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              </nav>

              <div className="border-t border-admin-border bg-admin-bg/25 p-4">
                <div className="mb-4 flex items-center gap-3">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-admin-elevated text-lg font-bold text-adminStatus-enabled">
                    {displayName.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold text-admin-text">
                      {displayName}
                    </p>
                    <p className="mt-0.5 text-base text-admin-muted">
                      管理者帳號
                    </p>
                  </div>
                </div>

                <section
                  aria-labelledby="mobile-font-size-title"
                  className="rounded-adminControl border border-admin-borderStrong bg-admin-surface p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-admin-elevated text-adminStatus-enabled">
                      <Type aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-base font-bold text-admin-text"
                        id="mobile-font-size-title"
                      >
                        介面文字大小
                      </p>
                      <p className="text-sm text-admin-muted">
                        目前設定為 {fontSize}px
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button
                      className="h-12 border-admin-borderStrong bg-admin-bg/40 text-base font-bold text-admin-softText hover:bg-admin-elevated hover:text-admin-text focus-visible:ring-adminStatus-enabled"
                      disabled={!canDecreaseFontSize}
                      variant="outline"
                      type="button"
                      onClick={onDecreaseFontSize}
                    >
                      <Minus aria-hidden="true" className="!h-5 !w-5" />
                      縮小
                    </Button>
                    <Button
                      className="h-12 border-adminStatus-enabled/50 bg-adminStatus-enabled/10 text-base font-bold text-adminStatus-enabled hover:bg-adminStatus-enabled/20 hover:text-adminStatus-enabled focus-visible:ring-adminStatus-enabled"
                      disabled={!canIncreaseFontSize}
                      variant="outline"
                      type="button"
                      onClick={onIncreaseFontSize}
                    >
                      <Plus aria-hidden="true" className="!h-5 !w-5" />
                      放大
                    </Button>
                  </div>
                </section>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="mt-3 h-12 w-full border border-red-300/40 bg-red-400/10 text-base font-bold text-red-200 hover:bg-red-400/20 hover:text-red-100"
                      variant="destructive"
                    >
                      <LogOut aria-hidden="true" className="!h-5 !w-5" />
                      登出管理後台
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border border-admin-border !bg-admin-surface !p-5 !text-admin-text shadow-adminPanel">
                    <AlertDialogHeader>
                      <AlertDialogMedia className="bg-red-400/15 text-red-200">
                        <TriangleAlert aria-hidden="true" />
                      </AlertDialogMedia>
                      <AlertDialogTitle className="!text-xl !font-bold !text-admin-text">
                        確定要登出嗎？
                      </AlertDialogTitle>
                      <AlertDialogDescription className="!text-base !leading-7 !text-admin-muted">
                        登出後需要重新驗證管理者身分，才能再次進入後台。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="!border-admin-border !bg-admin-elevated/40">
                      <AlertDialogCancel className="h-11 border-admin-borderStrong bg-admin-surface text-base font-bold text-admin-softText hover:bg-admin-elevated hover:text-admin-text">
                        繼續使用
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="h-11 bg-red-500 text-base font-bold text-white hover:bg-red-600"
                        variant="destructive"
                        onClick={handleLogout}
                      >
                        確認登出
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold tracking-[0.2em] text-adminStatus-enabled">
            CAPITAL STAR ADMIN
          </p>
          <p className="mt-0.5 truncate text-xl font-bold text-admin-text">
            {pageTitle}
          </p>
        </div>
      </div>
    </header>
  );
}
