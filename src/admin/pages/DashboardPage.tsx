import { useEffect, useMemo, useState } from "react";
import { FaCaretLeft, FaCaretRight, FaCheck } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import {
  type DashboardDailyOpenSchedule,
  type DashboardReservation,
  createAdminReservation,
  deleteAdminReservation,
  getDashboardDailyOpenSchedules,
  getDashboardScheduleReservations,
  updateAdminReservation,
} from "../../api/admin/dashboard";
import { getRoutes } from "../../api/admin/routes";
import { cancelDailyOpenSchedulesBatch } from "../../api/admin/schedules";
import { DataTable } from "../components/DataTable";
import { BatchScheduleSelector } from "../components/BatchScheduleSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { useQuickReservation } from "../components/QuickReservationDrawer";

const defaultPassengerNotificationText = `📢 親愛的旅客您好：

因故無法提供您預約的「首都之星」班次服務，造成您的行程受到影響，我們深感抱歉。🙏

若您需要協助改班或有任何疑問，歡迎隨時與我們聯繫，我們將盡快為您服務。

感謝您的理解與支持，祝您一路平安、順心愉快！💙`;

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDateFromValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function getTodayValue() {
  return formatDateValue(new Date());
}

function openInputPicker(event: React.MouseEvent<HTMLInputElement>) {
  event.currentTarget.showPicker?.();
}

function formatDepartureTime(value: string) {
  return value.slice(0, 5);
}

function getScheduleDepartureDate(schedule: DashboardDailyOpenSchedule) {
  const dateMatch = schedule.openDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = schedule.departureTime.match(/^(\d{1,2}):(\d{2})/);

  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch;
  const [, hour, minute] = timeMatch;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    0,
    0,
  );
}

function hasScheduleDeparted(schedule: DashboardDailyOpenSchedule) {
  const departureDate = getScheduleDepartureDate(schedule);

  if (!departureDate || Number.isNaN(departureDate.getTime())) return false;

  return departureDate.getTime() <= Date.now();
}

function canCancelSchedule(schedule: DashboardDailyOpenSchedule) {
  return schedule.status !== "INACTIVE" && !hasScheduleDeparted(schedule);
}

function getScheduleName(
  schedule: Pick<DashboardDailyOpenSchedule, "routeNumber" | "routeName">,
) {
  return `${schedule.routeNumber}｜${schedule.routeName}`;
}

function getStatusText(status: string) {
  if (status === "ACTIVE") return "啟用";
  if (status === "INACTIVE") return "停班";
  return status;
}

type ScheduleCardTone = "blue" | "green" | "red" | "slate";

interface ScheduleCardPalette {
  selectedCard: string;
  defaultCard: string;
  accent: string;
  routeLabel: string;
  statusBadge: string;
}

const scheduleCardPalettes: Record<ScheduleCardTone, ScheduleCardPalette> = {
  blue: {
    selectedCard:
      " bg-blue-700 border-4 border-white  shadow-[0_10px_26px_rgba(0,0,0,0.2)]",
    defaultCard:
      "border-blue-300 bg-blue-700 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]",
    accent: "bg-blue-400",
    routeLabel: "text-blue-200",
    statusBadge: "bg-blue-400/15 text-blue-200 ring-1 ring-blue-400/30",
  },
  green: {
    selectedCard:
      "border-emerald-300 bg-emerald-700 border-4 border-white shadow-[0_10px_26px_rgba(0,0,0,0.2)]",
    defaultCard:
      "border-emerald-300 bg-emerald-700 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]",
    accent: "bg-emerald-400",
    routeLabel: "text-emerald-200",
    statusBadge:
      "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30",
  },
  red: {
    selectedCard:
      "border-red-300 bg-red-800 border-4 border-white shadow-[0_10px_26px_rgba(0,0,0,0.2)]",
    defaultCard:
      "border-red-300 bg-red-800 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]",
    accent: "bg-red-400",
    routeLabel: "text-red-200",
    statusBadge: "bg-red-400/15 text-red-200 ring-1 ring-red-400/30",
  },
  slate: {
    selectedCard:
      "border-slate-300 bg-slate-700 border-4 border-white shadow-[0_10px_26px_rgba(0,0,0,0.2)]",
    defaultCard:
      "border-slate-300 bg-slate-700 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)]",
    accent: "bg-slate-400",
    routeLabel: "text-slate-200",
    statusBadge: "bg-slate-400/15 text-slate-200 ring-1 ring-slate-400/30",
  },
};

function getScheduleCardPalette(
  schedule: Pick<DashboardDailyOpenSchedule, "routeNumber" | "status">,
) {
  if (schedule.status === "INACTIVE") {
    return scheduleCardPalettes.slate;
  }

  const toneByRouteNumber: Record<string, ScheduleCardTone> = {
    "1570": "blue",
    "1571": "green",
    "1572": "red",
  };

  return scheduleCardPalettes[
    toneByRouteNumber[schedule.routeNumber] ?? "slate"
  ];
}

export function DashboardPage() {
  const {
    recentlyCreatedReservation,
    clearRecentlyCreatedReservation,
  } = useQuickReservation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDate, setOpenDate] = useState(getTodayValue());
  const [schedules, setSchedules] = useState<DashboardDailyOpenSchedule[]>([]);
  const selectedRouteNumber = searchParams.get("route") ?? "ALL";
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [newReservation, setNewReservation] = useState<{
    name: string;
    phone: string;
    passengerCount: number;
  } | null>(null);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [editingReservation, setEditingReservation] = useState<{
    reservationId: string;
    name: string;
    phone: string;
    passengerCount: number;
    pickupStopId: string | null;
  } | null>(null);
  const [isUpdatingReservation, setIsUpdatingReservation] = useState(false);
  const [deletingReservationId, setDeletingReservationId] = useState<
    string | null
  >(null);
  const [reservationRefreshKey, setReservationRefreshKey] = useState(0);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportScope, setExportScope] = useState<"SELECTED" | "DAY">(
    "SELECTED",
  );
  const [exportRouteId, setExportRouteId] = useState("ALL");
  const [includeCancelledForExport, setIncludeCancelledForExport] =
    useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState(false);
  const [isReservationsLoading, setIsReservationsLoading] = useState(false);
  const [isBatchCancelMode, setIsBatchCancelMode] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancellingSchedule, setIsCancellingSchedule] = useState(false);
  const [selectedCancelScheduleIds, setSelectedCancelScheduleIds] = useState<
    string[]
  >([]);
  const [cancelNotificationText, setCancelNotificationText] = useState(
    defaultPassengerNotificationText,
  );
  const [cancelScheduleError, setCancelScheduleError] = useState("");
  const [cancelScheduleSuccess, setCancelScheduleSuccess] = useState("");
  const [hideCancelledReservations, setHideCancelledReservations] =
    useState(false);
  const [schedulesError, setSchedulesError] = useState("");
  const [reservationsError, setReservationsError] = useState("");
  const [reservationCreateSuccess, setReservationCreateSuccess] = useState("");
  const todayValue = getTodayValue();

  useEffect(() => {
    if (!recentlyCreatedReservation) return;

    if (openDate !== recentlyCreatedReservation.openDate) {
      setOpenDate(recentlyCreatedReservation.openDate);
      setSelectedScheduleId(null);
      setReservations([]);
      return;
    }

    if (isSchedulesLoading) return;

    const matchingSchedule = schedules.find(
      (schedule) =>
        schedule.dailyOpenScheduleId ===
        recentlyCreatedReservation.dailyOpenScheduleId,
    );

    if (!matchingSchedule) return;

    setSelectedScheduleId(matchingSchedule.dailyOpenScheduleId);
    selectRouteNumber(matchingSchedule.routeNumber);
    setNewReservation(null);
    setReservationsError("");
    setReservationRefreshKey((current) => current + 1);
    setReservationCreateSuccess(
      `已新增 ${recentlyCreatedReservation.name} ${recentlyCreatedReservation.departureTime}、${recentlyCreatedReservation.passengerCount} 人的班次預約。`,
    );
    clearRecentlyCreatedReservation();
  }, [
    clearRecentlyCreatedReservation,
    isSchedulesLoading,
    openDate,
    recentlyCreatedReservation,
    schedules,
  ]);

  useEffect(() => {
    const timers = [
      schedulesError && window.setTimeout(() => setSchedulesError(""), 5000),
      reservationsError &&
        window.setTimeout(() => setReservationsError(""), 5000),
      cancelScheduleError &&
        window.setTimeout(() => setCancelScheduleError(""), 5000),
      cancelScheduleSuccess &&
        window.setTimeout(() => setCancelScheduleSuccess(""), 5000),
      reservationCreateSuccess &&
        window.setTimeout(() => setReservationCreateSuccess(""), 5000),
    ].filter(Boolean) as number[];

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [
    schedulesError,
    reservationsError,
    cancelScheduleError,
    cancelScheduleSuccess,
    reservationCreateSuccess,
  ]);

  const routeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          schedules.map((schedule) => [
            schedule.routeId,
            {
              routeNumber: schedule.routeNumber,
              routeName: schedule.routeName,
            },
          ]),
        ).entries(),
      ).map(([routeId, route]) => ({ routeId, ...route })),
    [schedules],
  );

  const filteredSchedules = useMemo(
    () =>
      selectedRouteNumber === "ALL"
        ? schedules
        : schedules.filter(
            (schedule) => schedule.routeNumber === selectedRouteNumber,
          ),
    [schedules, selectedRouteNumber],
  );

  function selectRouteNumber(routeNumber: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (routeNumber === "ALL") {
        next.delete("route");
      } else {
        next.set("route", routeNumber);
      }

      return next;
    });
  }

  const selectedSchedule = useMemo(
    () =>
      schedules.find(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      ) ?? null,
    [schedules, selectedScheduleId],
  );

  const isSelectedScheduleDeparted = selectedSchedule
    ? hasScheduleDeparted(selectedSchedule)
    : false;

  const selectedCancelSchedules = useMemo(
    () =>
      schedules.filter((schedule) =>
        selectedCancelScheduleIds.includes(schedule.dailyOpenScheduleId),
      ),
    [schedules, selectedCancelScheduleIds],
  );

  const selectedCancelPassengerCount = selectedCancelSchedules.reduce(
    (sum, schedule) =>
      sum + (schedule.reservedPassengerCount ?? schedule.reservedCount),
    0,
  );

  const filteredReservations = useMemo(
    () =>
      hideCancelledReservations
        ? reservations.filter(
            (reservation) => reservation.status === "RESERVED",
          )
        : reservations,
    [hideCancelledReservations, reservations],
  );

  const reservationRows = useMemo(
    () =>
      filteredReservations.map((reservation) => ({
        ...reservation,
        departureTime: selectedSchedule
          ? formatDepartureTime(selectedSchedule.departureTime)
          : "",
      })),
    [filteredReservations, selectedSchedule],
  );

  const totalReservedCount = schedules.reduce(
    (sum, schedule) =>
      sum + (schedule.reservedPassengerCount ?? schedule.reservedCount),
    0,
  );
  const totalAvailableSeats = schedules.reduce(
    (sum, schedule) => sum + schedule.availableSeats,
    0,
  );

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      try {
        setIsSchedulesLoading(true);
        setSchedulesError("");
        setReservations([]);

        const result = await getDashboardDailyOpenSchedules(openDate);
        if (!isCurrent) return;

        const sortedSchedules = [...result].sort((a, b) =>
          a.departureTime.localeCompare(b.departureTime),
        );

        setSchedules(sortedSchedules);
        setSelectedScheduleId(sortedSchedules[0]?.dailyOpenScheduleId ?? null);
      } catch (error) {
        if (!isCurrent) return;

        setSchedules([]);
        setSelectedScheduleId(null);
        setSchedulesError(
          error instanceof Error ? error.message : "讀取當日開放班次失敗。",
        );
      } finally {
        if (isCurrent) {
          setIsSchedulesLoading(false);
        }
      }
    }

    load();

    return () => {
      isCurrent = false;
    };
  }, [openDate]);

  useEffect(() => {
    if (
      selectedScheduleId &&
      filteredSchedules.some(
        (schedule) => schedule.dailyOpenScheduleId === selectedScheduleId,
      )
    ) {
      return;
    }

    setSelectedScheduleId(filteredSchedules[0]?.dailyOpenScheduleId ?? null);
  }, [filteredSchedules, selectedScheduleId]);

  useEffect(() => {
    let isCurrent = true;

    async function loadReservations() {
      if (!selectedScheduleId) {
        setReservations([]);
        return;
      }

      try {
        setIsReservationsLoading(true);
        setReservationsError("");

        const result =
          await getDashboardScheduleReservations(selectedScheduleId);
        if (!isCurrent) return;

        setSchedules((current) =>
          current.map((schedule) =>
            schedule.dailyOpenScheduleId === result.schedule.dailyOpenScheduleId
              ? {
                  ...schedule,
                  ...result.schedule,
                  status: result.schedule.status ?? schedule.status,
                }
              : schedule,
          ),
        );
        setReservations(result.reservations);
      } catch (error) {
        if (!isCurrent) return;

        setReservations([]);
        setReservationsError(
          error instanceof Error ? error.message : "讀取班次預約清單失敗。",
        );
      } finally {
        if (isCurrent) {
          setIsReservationsLoading(false);
        }
      }
    }

    loadReservations();

    return () => {
      isCurrent = false;
    };
  }, [selectedScheduleId, reservationRefreshKey]);

  const handleCreateReservation = async () => {
    if (!selectedSchedule || !newReservation) return;

    const name = newReservation.name.trim();
    const phone = newReservation.phone.trim();

    if (!name || !phone) {
      setReservationsError("請填寫姓名與電話。");
      return;
    }

    if (
      !Number.isInteger(newReservation.passengerCount) ||
      newReservation.passengerCount < 1
    ) {
      setReservationsError("搭乘人數至少為 1 人。");
      return;
    }

    try {
      setIsCreatingReservation(true);
      setReservationsError("");

      const routes = await getRoutes();
      const route = routes.find(
        (item) => item.routeId === selectedSchedule.routeId,
      );
      const pickupStopId =
        reservations.find((reservation) => reservation.pickupStopId)
          ?.pickupStopId ??
        [...(route?.stops ?? [])].sort(
          (left, right) => left.sequence - right.sequence,
        )[0]?.stopId;

      if (!pickupStopId) {
        throw new Error("此路線沒有可用上車站，無法建立預約。");
      }

      await createAdminReservation({
        name,
        phone,
        passengerCount: newReservation.passengerCount,
        routeId: selectedSchedule.routeId,
        departureTime: formatDepartureTime(selectedSchedule.departureTime),
        openDate: selectedSchedule.openDate,
        pickupStopId,
      });

      setNewReservation(null);
      setReservationRefreshKey((current) => current + 1);
    } catch (error) {
      setReservationsError(
        error instanceof Error ? error.message : "建立預約失敗，請稍後再試。",
      );
    } finally {
      setIsCreatingReservation(false);
    }
  };

  const handleUpdateReservation = async () => {
    if (!editingReservation) return;

    const { reservationId, name, phone, passengerCount, pickupStopId } =
      editingReservation;

    if (!name.trim() || !phone.trim()) {
      setReservationsError("請填寫姓名與電話。");
      return;
    }

    if (!Number.isInteger(passengerCount) || passengerCount < 1) {
      setReservationsError("搭乘人數至少為 1 人。");
      return;
    }

    if (!pickupStopId) {
      setReservationsError("缺少上車站資料，無法修改預約。");
      return;
    }

    try {
      setIsUpdatingReservation(true);
      setReservationsError("");
      await updateAdminReservation(reservationId, {
        name: name.trim(),
        phone: phone.trim(),
        passengerCount,
        pickupStopId,
      });
      setEditingReservation(null);
      setReservationRefreshKey((current) => current + 1);
    } catch (error) {
      setReservationsError(
        error instanceof Error ? error.message : "修改預約失敗，請稍後再試。",
      );
    } finally {
      setIsUpdatingReservation(false);
    }
  };

  const handleDeleteReservation = async (reservation: DashboardReservation) => {
    if (!window.confirm(`確定刪除「${reservation.name}」的預約？`)) return;

    try {
      setDeletingReservationId(reservation.reservationId);
      setReservationsError("");
      await deleteAdminReservation(reservation.reservationId);
      setEditingReservation(null);
      setReservationRefreshKey((current) => current + 1);
    } catch (error) {
      setReservationsError(
        error instanceof Error ? error.message : "刪除預約失敗，請稍後再試。",
      );
    } finally {
      setDeletingReservationId(null);
    }
  };

  const downloadReservationExcel = async (
    schedulesToExport: DashboardDailyOpenSchedule[],
    includeCancelled: boolean,
  ) => {
    if (schedulesToExport.length === 0) {
      setReservationsError("沒有符合條件的班次可匯出。");
      return;
    }

    try {
      setIsExporting(true);
      const scheduleReservations = await Promise.all(
        schedulesToExport.map(async (schedule) =>
          getDashboardScheduleReservations(schedule.dailyOpenScheduleId),
        ),
      );
      const exportReservations = scheduleReservations
        .sort((a, b) =>
          a.schedule.departureTime.localeCompare(b.schedule.departureTime),
        )
        .flatMap(({ schedule, reservations: scheduleRows }) =>
          scheduleRows
            .filter(
              (reservation) =>
                includeCancelled || reservation.status === "RESERVED",
            )
            .sort((a, b) => a.sequence - b.sequence)
            .map((reservation) => ({ schedule, reservation })),
        );
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("當日乘客名單");

      worksheet.columns = [
        { header: "班次", key: "scheduleName", width: 28 },
        { header: "發車時間", key: "departureTime", width: 14 },
        { header: "稱謂", key: "name", width: 18 },
        { header: "識別碼", key: "activeCode", width: 16 },
        { header: "上車站", key: "pickupStopName", width: 20 },
        { header: "搭乘人數", key: "passengerCount", width: 12 },

        { header: "乘車序號/電話", key: "sequence", width: 20 },
      ];

      exportReservations.forEach(({ schedule, reservation }) => {
        worksheet.addRow({
          scheduleName: getScheduleName(schedule),
          departureTime: formatDepartureTime(schedule.departureTime),
          name: reservation.name,
          sequence: reservation.sequence,
          activeCode: reservation.activeCode,
          phone: reservation.phone,
          pickupStopName: reservation.pickupStopName,
          passengerCount: reservation.passengerCount,
        });
      });

      worksheet.views = [{ state: "frozen", ySplit: 1 }];
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF047857" },
      };

      worksheet.eachRow((row) => {
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FF94A3B8" } },
            left: { style: "thin", color: { argb: "FF94A3B8" } },
            bottom: { style: "thin", color: { argb: "FF94A3B8" } },
            right: { style: "thin", color: { argb: "FF94A3B8" } },
          };
          cell.alignment = {
            horizontal: columnNumber === 4 ? "center" : "left",
            vertical: "middle",
          };
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${openDate}-班次預約乘客清單.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setReservationsError(
        error instanceof Error ? error.message : "匯出當班乘客名單失敗。",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    const schedulesToExport =
      exportScope === "SELECTED"
        ? selectedSchedule
          ? [selectedSchedule]
          : []
        : schedules.filter(
            (schedule) =>
              exportRouteId === "ALL" || schedule.routeId === exportRouteId,
          );

    await downloadReservationExcel(
      schedulesToExport,
      includeCancelledForExport,
    );

    if (schedulesToExport.length > 0) {
      setIsExportDialogOpen(false);
    }
  };

  const startBatchCancelMode = () => {
    if (!selectedSchedule || !canCancelSchedule(selectedSchedule)) return;

    setCancelScheduleError("");
    setCancelScheduleSuccess("");
    setCancelNotificationText(defaultPassengerNotificationText);
    setSelectedCancelScheduleIds([selectedSchedule.dailyOpenScheduleId]);
    setIsBatchCancelMode(true);
  };

  const exitBatchCancelMode = () => {
    if (isCancellingSchedule) return;

    setIsBatchCancelMode(false);
    setSelectedCancelScheduleIds([]);
    setCancelScheduleError("");
  };

  const toggleCancelSchedule = (schedule: DashboardDailyOpenSchedule) => {
    if (!canCancelSchedule(schedule) || isCancellingSchedule) return;

    setSelectedCancelScheduleIds((current) =>
      current.includes(schedule.dailyOpenScheduleId)
        ? current.filter(
            (scheduleId) => scheduleId !== schedule.dailyOpenScheduleId,
          )
        : [...current, schedule.dailyOpenScheduleId],
    );
  };

  const selectCurrentRouteDaySchedules = () => {
    if (!selectedSchedule || isCancellingSchedule) return;

    setSelectedCancelScheduleIds(
      schedules
        .filter(
          (schedule) =>
            schedule.routeId === selectedSchedule.routeId &&
            canCancelSchedule(schedule),
        )
        .map((schedule) => schedule.dailyOpenScheduleId),
    );
  };

  const openCancelScheduleModal = () => {
    if (selectedCancelScheduleIds.length === 0) {
      setCancelScheduleError("請至少選擇一個要停班的班次。");
      return;
    }

    setCancelScheduleError("");
    setIsCancelModalOpen(true);
  };

  const closeCancelScheduleModal = () => {
    if (isCancellingSchedule) return;

    setIsCancelModalOpen(false);
    setCancelScheduleError("");
  };

  const submitCancelSchedule = async () => {
    const trimmedNotificationText = cancelNotificationText.trim();

    if (selectedCancelScheduleIds.length === 0) {
      setCancelScheduleError("請至少選擇一個要停班的班次。");
      return;
    }

    if (!trimmedNotificationText) {
      setCancelScheduleError("請輸入通知乘客的文字內容。");
      return;
    }

    try {
      setIsCancellingSchedule(true);
      setCancelScheduleError("");

      const result = await cancelDailyOpenSchedulesBatch(
        selectedCancelScheduleIds,
        trimmedNotificationText,
      );
      const cancelledScheduleIds = new Set(selectedCancelScheduleIds);
      const cancellationResultByScheduleId = new Map(
        result.cancelledSchedules.map((schedule) => [
          schedule.dailyOpenScheduleId,
          schedule,
        ]),
      );

      setSchedules((current) =>
        current.map((schedule) => {
          if (!cancelledScheduleIds.has(schedule.dailyOpenScheduleId)) {
            return schedule;
          }

          const cancellationResult = cancellationResultByScheduleId.get(
            schedule.dailyOpenScheduleId,
          );
          const reservedPassengerCount =
            schedule.reservedPassengerCount ?? schedule.reservedCount;

          return {
            ...schedule,
            status: cancellationResult?.status ?? "INACTIVE",
            reservedCount: 0,
            reservedPassengerCount: 0,
            cancelledCount:
              schedule.cancelledCount +
              (cancellationResult?.cancelledReservationCount ??
                schedule.reservedCount),
            cancelledPassengerCount:
              (schedule.cancelledPassengerCount ?? schedule.cancelledCount) +
              reservedPassengerCount,
            availableSeats: schedule.quota,
          };
        }),
      );
      setIsCancelModalOpen(false);
      setIsBatchCancelMode(false);
      setSelectedCancelScheduleIds([]);
      setCancelScheduleSuccess(
        `已成功停用 ${result.totalCount} 個班次，乘客通知正在發送。`,
      );
      setReservationRefreshKey((current) => current + 1);
    } catch (error) {
      setCancelScheduleError(
        error instanceof Error
          ? error.message
          : "批次取消班次失敗，請稍後再試。",
      );
    } finally {
      setIsCancellingSchedule(false);
    }
  };

  const shiftOpenDate = (days: number) => {
    setOpenDate((current) =>
      formatDateValue(addDays(getDateFromValue(current), days)),
    );
  };

  return (
    <div className="admin-dashboard flex min-h-[calc(100vh-4.5rem)] flex-col space-y-4">
      {schedulesError ? (
        <p className="rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          {schedulesError}
        </p>
      ) : (
        <section className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="hidden min-h-0 flex-col xl:flex xl:max-h-[calc(100vh-6.5rem)]">
            {isBatchCancelMode && (
              <div className="mb-3 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3">
                <p className="text-sm font-bold text-red-200">
                  選擇要停班的班次
                </p>
                <p className="mt-1 text-xs text-admin-muted">
                  點選班次可加入或移除選取。
                </p>
              </div>
            )}
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {isSchedulesLoading ? (
                <p className="px-3 py-6 text-center text-base text-admin-muted">
                  讀取班次中…
                </p>
              ) : filteredSchedules.length === 0 ? (
                <div className="rounded-adminControl border border-dashed border-admin-borderStrong bg-admin-bg px-4 py-8 text-center text-base text-admin-muted">
                  此日期沒有符合路線的開放預約班次。
                </div>
              ) : (
                filteredSchedules.map((schedule) => {
                  const isSelected =
                    schedule.dailyOpenScheduleId === selectedScheduleId;
                  const isBatchSelected = selectedCancelScheduleIds.includes(
                    schedule.dailyOpenScheduleId,
                  );
                  const isBatchSelectable = canCancelSchedule(schedule);
                  const cardPalette = getScheduleCardPalette(schedule);
                  const reservationRate = Math.min(
                    100,
                    Math.round(
                      ((schedule.reservedPassengerCount ??
                        schedule.reservedCount) /
                        Math.max(schedule.quota, 1)) *
                        100,
                    ),
                  );

                  return (
                    <button
                      key={schedule.dailyOpenScheduleId}
                      aria-pressed={
                        isBatchCancelMode ? isBatchSelected : isSelected
                      }
                      className={`group relative w-full overflow-hidden rounded-adminControl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black ${
                        isSelected
                          ? cardPalette.selectedCard
                          : cardPalette.defaultCard
                      } ${
                        isBatchCancelMode && isBatchSelected
                          ? "!border-red-200 ring-4 ring-red-400/70"
                          : ""
                      } ${
                        isBatchCancelMode && !isBatchSelectable
                          ? "cursor-not-allowed opacity-40"
                          : ""
                      }`}
                      disabled={isBatchCancelMode && !isBatchSelectable}
                      type="button"
                      onClick={() => {
                        if (isBatchCancelMode) {
                          toggleCancelSchedule(schedule);
                        } else {
                          setSelectedScheduleId(schedule.dailyOpenScheduleId);
                        }
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute inset-y-0 left-0 w-1 ${
                          isSelected ? "bg-white/80" : cardPalette.accent
                        }`}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={`text-sm font-bold tracking-[0.12em] ${
                            isSelected
                              ? "text-white/80"
                              : cardPalette.routeLabel
                          }`}
                        >
                          路線 {schedule.routeNumber}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`shrink-0 rounded-full px-2 py-1 text-sm font-bold ${
                              isSelected
                                ? "bg-white/15 text-white ring-1 ring-white/25"
                                : cardPalette.statusBadge
                            }`}
                          >
                            {getStatusText(schedule.status)}
                          </span>
                          {isBatchCancelMode && (
                            <span
                              aria-label={isBatchSelected ? "已選取" : "未選取"}
                              className={`grid h-7 w-7 place-items-center rounded-full border-2 ${
                                isBatchSelected
                                  ? "border-red-100 bg-red-500 text-white"
                                  : "border-white/60 bg-black/10 text-transparent"
                              }`}
                            >
                              <FaCheck aria-hidden="true" className="text-xs" />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p
                            className={`text-3xl font-bold leading-none tabular-nums ${
                              isSelected ? "text-white" : "text-admin-text"
                            }`}
                          >
                            {formatDepartureTime(schedule.departureTime)}
                          </p>
                          <p
                            className={`mt-2 truncate text-sm font-medium ${isSelected ? "text-white/75" : "text-admin-softText"}`}
                          >
                            {schedule.routeName}
                          </p>
                        </div>
                        <div className="min-w-[92px] text-right">
                          <p
                            className={`text-sm font-medium ${isSelected ? "text-white/70" : "text-admin-muted"}`}
                          >
                            預約 / 總人數
                          </p>
                          <p
                            className={`mt-1 text-xl font-bold leading-none tabular-nums ${isSelected ? "text-white" : "text-admin-text"}`}
                          >
                            {schedule.reservedPassengerCount ??
                              schedule.reservedCount}
                            <span
                              className={`mx-1 text-base font-medium ${isSelected ? "text-white/65" : "text-admin-muted"}`}
                            >
                              /
                            </span>
                            {schedule.quota}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <section className="admin-panel-body flex min-h-0 min-w-0 flex-col">
            <section className="  max-w-full rounded-adminControl  bg-admin-surface  ">
              <div className="flex  flex-wrap items-center gap-3">
                <div className=" grid h-11 w-[260px] max-w-full shrink-0 grid-cols-[44px_minmax(0,1fr)_44px] items-center overflow-hidden rounded-adminControl border border-admin-borderStrong bg-admin-bg">
                  <button
                    aria-label="前一天"
                    className="grid h-full place-items-center text-admin-softText hover:text-adminStatus-enabled disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isBatchCancelMode}
                    title="前一天"
                    type="button"
                    onClick={() => shiftOpenDate(-1)}
                  >
                    <FaCaretLeft aria-hidden="true" className="text-xl" />
                  </button>
                  <label className="h-full border-x border-admin-borderStrong">
                    <input
                      aria-label="選擇日期"
                      className="h-full w-full bg-admin-bg px-3 text-center text-base font-bold text-admin-text outline-none focus:ring-2 focus:ring-inset focus:ring-adminStatus-enabled disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={isBatchCancelMode}
                      id="dashboard-open-date"
                      name="dashboard-open-date"
                      type="date"
                      value={openDate}
                      onClick={openInputPicker}
                      onChange={(event) => setOpenDate(event.target.value)}
                    />
                  </label>
                  <button
                    aria-label="後一天"
                    className="grid h-full place-items-center text-admin-softText hover:text-adminStatus-enabled disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isBatchCancelMode}
                    title="後一天"
                    type="button"
                    onClick={() => shiftOpenDate(1)}
                  >
                    <FaCaretRight aria-hidden="true" className="text-xl" />
                  </button>
                </div>
                <button
                  className={`h-11 rounded-adminControl border px-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                    openDate === todayValue
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/10 text-adminStatus-enabled"
                      : "border-admin-borderStrong text-admin-softText"
                  }`}
                  disabled={isBatchCancelMode}
                  type="button"
                  onClick={() => setOpenDate(todayValue)}
                >
                  今日
                </button>
                <label className="min-w-[190px] text-base font-medium text-admin-softText">
                  <span className="sr-only">路線篩選</span>
                  <select
                    aria-label="路線篩選"
                    className="h-11 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base font-semibold text-admin-text outline-none focus:border-adminStatus-enabled disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={isBatchCancelMode}
                    id="dashboard-route-filter"
                    name="dashboard-route-filter"
                    value={selectedRouteNumber}
                    onChange={(event) => selectRouteNumber(event.target.value)}
                  >
                    <option value="ALL">全部路線</option>
                    {routeOptions.map((route) => (
                      <option key={route.routeId} value={route.routeNumber}>
                        {route.routeNumber}｜{route.routeName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex h-10 items-center gap-2 rounded-adminControl border border-admin-borderStrong px-3 text-base font-semibold text-admin-softText">
                  <input
                    className="h-4 w-4 accent-adminStatus-enabled"
                    id="dashboard-hide-cancelled"
                    name="dashboard-hide-cancelled"
                    type="checkbox"
                    checked={hideCancelledReservations}
                    onChange={(event) =>
                      setHideCancelledReservations(event.target.checked)
                    }
                  />
                  不含取消
                </label>
                <button
                  className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-base font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={schedules.length === 0 || isBatchCancelMode}
                  type="button"
                  onClick={() => {
                    setExportScope(selectedSchedule ? "SELECTED" : "DAY");
                    setExportRouteId("ALL");
                    setIncludeCancelledForExport(false);
                    setIsExportDialogOpen(true);
                  }}
                >
                  匯出
                </button>
                <button
                  className="h-10 rounded-adminControl bg-adminStatus-enabled px-4 text-base font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !selectedSchedule ||
                    selectedSchedule.status === "INACTIVE" ||
                    isSelectedScheduleDeparted ||
                    isBatchCancelMode ||
                    Boolean(newReservation)
                  }
                  type="button"
                  onClick={() =>
                    setNewReservation({
                      name: "",
                      phone: "",
                      passengerCount: 1,
                    })
                  }
                >
                  新增
                </button>
                <button
                  className="h-10 rounded-adminControl border border-red-400/50 bg-red-500/10 px-4 text-base font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={
                    !selectedSchedule ||
                    selectedSchedule.status === "INACTIVE" ||
                    isSelectedScheduleDeparted ||
                    isCancellingSchedule ||
                    isBatchCancelMode ||
                    Boolean(newReservation)
                  }
                  type="button"
                  onClick={startBatchCancelMode}
                >
                  批次取消
                </button>
              </div>
            </section>

            {isBatchCancelMode && (
              <div className="mt-4">
                <BatchScheduleSelector
                  schedules={filteredSchedules}
                  selectedScheduleIds={selectedCancelScheduleIds}
                  canSelect={canCancelSchedule}
                  onToggle={toggleCancelSchedule}
                />
              </div>
            )}

            {reservationsError && (
              <p className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                {reservationsError}
              </p>
            )}

            {cancelScheduleSuccess && (
              <p
                className="mt-4 rounded-adminControl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200"
                role="status"
              >
                {cancelScheduleSuccess}
              </p>
            )}

            {reservationCreateSuccess && (
              <p
                className="mt-4 rounded-adminControl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200"
                role="status"
              >
                {reservationCreateSuccess}
              </p>
            )}

            {newReservation && (
              <section className="mt-4 rounded-adminControl border border-adminStatus-enabled/30 bg-adminStatus-enabled/5 p-4 md:hidden">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-admin-text">
                      新增預約
                    </h2>
                    <p className="mt-1 text-sm text-admin-muted">
                      {selectedSchedule
                        ? `${selectedSchedule.routeNumber}｜${selectedSchedule.routeName}・${formatDepartureTime(selectedSchedule.departureTime)}`
                        : "請先選擇班次"}
                    </p>
                  </div>
                  <span className="rounded-full bg-adminStatus-enabled/15 px-2.5 py-1 text-xs font-bold text-adminStatus-enabled">
                    快速預約
                  </span>
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-admin-softText">
                    姓名
                    <input
                      autoComplete="name"
                      className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                      id="mobile-new-reservation-name"
                      name="mobile-new-reservation-name"
                      value={newReservation.name}
                      onChange={(event) =>
                        setNewReservation({
                          ...newReservation,
                          name: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm font-bold text-admin-softText">
                    電話
                    <input
                      autoComplete="tel"
                      className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                      id="mobile-new-reservation-phone"
                      inputMode="tel"
                      name="mobile-new-reservation-phone"
                      value={newReservation.phone}
                      onChange={(event) =>
                        setNewReservation({
                          ...newReservation,
                          phone: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label className="block text-sm font-bold text-admin-softText">
                    搭乘人數
                    <input
                      className="mt-1.5 h-12 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-base text-admin-text outline-none focus:border-adminStatus-enabled"
                      id="mobile-new-reservation-passenger-count"
                      min="1"
                      name="mobile-new-reservation-passenger-count"
                      type="number"
                      value={newReservation.passengerCount}
                      onChange={(event) =>
                        setNewReservation({
                          ...newReservation,
                          passengerCount: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      className="h-12 rounded-adminControl border border-admin-borderStrong text-base font-bold text-admin-softText"
                      disabled={isCreatingReservation}
                      type="button"
                      onClick={() => setNewReservation(null)}
                    >
                      取消
                    </button>
                    <button
                      className="h-12 rounded-adminControl bg-adminStatus-enabled text-base font-bold text-admin-bg disabled:opacity-50"
                      disabled={isCreatingReservation || !selectedSchedule}
                      type="button"
                      onClick={handleCreateReservation}
                    >
                      {isCreatingReservation ? "送出中…" : "確認預約"}
                    </button>
                  </div>
                </div>
              </section>
            )}

            <div className="mt-4 min-h-0 flex-1 overflow-auto rounded-adminControl border border-admin-border">
              {isReservationsLoading ? (
                <div className="px-4 py-10 text-center text-sm text-admin-muted">
                  讀取預約清單中…
                </div>
              ) : (
                <DataTable
                  reservations={reservationRows}
                  newReservation={newReservation}
                  newReservationDepartureTime={
                    selectedSchedule
                      ? formatDepartureTime(selectedSchedule.departureTime)
                      : ""
                  }
                  isCreating={isCreatingReservation}
                  onNewReservationChange={setNewReservation}
                  onCreate={handleCreateReservation}
                  onCancelCreate={() => setNewReservation(null)}
                  editingReservation={editingReservation}
                  isUpdating={isUpdatingReservation}
                  deletingReservationId={deletingReservationId}
                  onStartEdit={(reservation) =>
                    setEditingReservation({
                      reservationId: reservation.reservationId,
                      name: reservation.name,
                      phone: reservation.phone,
                      passengerCount: reservation.passengerCount,
                      pickupStopId: reservation.pickupStopId,
                    })
                  }
                  onEditingReservationChange={setEditingReservation}
                  onUpdate={handleUpdateReservation}
                  onCancelEdit={() => setEditingReservation(null)}
                  onDelete={handleDeleteReservation}
                />
              )}
            </div>
          </section>
        </section>
      )}

      {isBatchCancelMode && (
        <section
          aria-label="批次停班操作"
          className="sticky bottom-2 z-20 mx-2 rounded-adminPanel border border-red-400/40 bg-admin-surface/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)] backdrop-blur sm:p-4"
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-red-500 text-white">
                  <FaCheck aria-hidden="true" className="text-xs" />
                </span>
                <p className="font-bold text-admin-text">
                  已選擇 {selectedCancelScheduleIds.length} 個班次
                </p>
              </div>
              <p className="mt-1 truncate pl-9 text-sm text-admin-muted">
                {openDate}
                {selectedSchedule
                  ? `・目前路線 ${getScheduleName(selectedSchedule)}`
                  : ""}
                ・預計影響 {selectedCancelPassengerCount} 位乘客
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <button
                className="h-11 rounded-adminControl border border-adminStatus-enabled/50 bg-adminStatus-enabled/10 px-4 text-sm font-bold text-adminStatus-enabled hover:bg-adminStatus-enabled/20"
                type="button"
                onClick={selectCurrentRouteDaySchedules}
              >
                同路線整日
              </button>
              <button
                className="h-11 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-bold text-admin-softText hover:bg-admin-elevated"
                type="button"
                onClick={() => setSelectedCancelScheduleIds([])}
              >
                清除
              </button>
              <button
                className="h-11 rounded-adminControl border border-admin-borderStrong px-4 text-sm font-bold text-admin-softText hover:bg-admin-elevated"
                type="button"
                onClick={exitBatchCancelMode}
              >
                退出
              </button>
              <button
                className="h-11 rounded-adminControl bg-red-500 px-5 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={selectedCancelScheduleIds.length === 0}
                type="button"
                onClick={openCancelScheduleModal}
              >
                下一步
              </button>
            </div>
          </div>
        </section>
      )}

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="export-reservations-dialog !max-w-xl !gap-6 !rounded-adminPanel !border !border-admin-borderStrong !bg-admin-surface !p-5 !text-admin-text shadow-adminPanel sm:!p-6">
          <DialogHeader className="border-b border-admin-border pb-5 pr-8">
            <DialogTitle className="text-3xl font-bold text-admin-text">
              匯出預約名單
            </DialogTitle>
            <DialogDescription className="text-base text-admin-muted">
              選擇要匯出的班次範圍與預約規則。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5">
            <fieldset className="grid gap-3">
              <legend className="text-base font-bold text-admin-softText">
                匯出範圍
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={!selectedSchedule}
                  aria-pressed={exportScope === "SELECTED"}
                  onClick={() => setExportScope("SELECTED")}
                  className={`rounded-adminControl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    exportScope === "SELECTED"
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/10 ring-2 ring-adminStatus-enabled/20"
                      : "border-admin-borderStrong bg-admin-bg/50 hover:border-adminStatus-enabled/70 hover:bg-admin-elevated/60"
                  }`}
                >
                  <p className="font-bold text-admin-text">當班</p>
                  <p className="mt-1 text-base leading-6 text-admin-muted">
                    {selectedSchedule
                      ? `${selectedSchedule.routeNumber}｜${formatDepartureTime(selectedSchedule.departureTime)}`
                      : "請先選擇班次"}
                  </p>
                </button>
                <button
                  type="button"
                  aria-pressed={exportScope === "DAY"}
                  onClick={() => setExportScope("DAY")}
                  className={`rounded-adminControl border p-4 text-left transition ${
                    exportScope === "DAY"
                      ? "border-adminStatus-enabled bg-adminStatus-enabled/10 ring-2 ring-adminStatus-enabled/20"
                      : "border-admin-borderStrong bg-admin-bg/50 hover:border-adminStatus-enabled/70 hover:bg-admin-elevated/60"
                  }`}
                >
                  <p className="font-bold text-admin-text">當日</p>
                  <p className="mt-1 text-base leading-6 text-admin-muted">
                    {openDate} 的所有符合班次
                  </p>
                </button>
              </div>
            </fieldset>

            {exportScope === "DAY" && (
              <label className="grid gap-2 text-base font-bold text-admin-softText">
                選擇路線
                <select
                  id="export-route"
                  name="export-route"
                  value={exportRouteId}
                  onChange={(event) => setExportRouteId(event.target.value)}
                  className="h-11 rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 text-lg font-semibold text-admin-text outline-none focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/20"
                >
                  <option value="ALL">全部路線</option>
                  {routeOptions.map((route) => (
                    <option key={route.routeId} value={route.routeId}>
                      {route.routeNumber}｜{route.routeName}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="flex items-center gap-3 rounded-adminControl border border-admin-borderStrong bg-admin-bg/50 p-4 text-base font-bold text-admin-softText">
              <input
                id="export-include-cancelled"
                name="export-include-cancelled"
                type="checkbox"
                checked={includeCancelledForExport}
                onChange={(event) =>
                  setIncludeCancelledForExport(event.target.checked)
                }
                className="h-4 w-4 accent-adminStatus-enabled"
              />
              預約規則：含取消
            </label>
          </div>

          <DialogFooter className="border-t border-admin-border pt-5">
            <button
              type="button"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}
              className="h-10 rounded-adminControl border border-admin-borderStrong px-4 text-base font-bold text-admin-softText transition hover:bg-admin-elevated disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={
                isExporting || (exportScope === "SELECTED" && !selectedSchedule)
              }
              className="h-10 rounded-adminControl bg-adminStatus-enabled px-5 text-base font-bold text-admin-bg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? "匯出中…" : "匯出"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isCancelModalOpen && selectedSchedule && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-schedule-title"
        >
          <section className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-adminPanel border border-admin-borderStrong bg-admin-surface shadow-adminPanel">
            <div className="flex items-start justify-between gap-4 border-b border-admin-border px-5 py-5">
              <div>
                <h2
                  className="text-3xl font-bold text-admin-text"
                  id="cancel-schedule-title"
                >
                  確認批次停班
                </h2>
              </div>
              <button
                aria-label="關閉"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-admin-borderStrong text-2xl font-semibold leading-none text-admin-softText transition hover:border-adminStatus-enabled hover:text-adminStatus-enabled"
                disabled={isCancellingSchedule}
                type="button"
                onClick={closeCancelScheduleModal}
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-adminControl border border-admin-border bg-admin-bg p-3">
                  <p className="text-sm text-admin-muted">停班日期</p>
                  <p className="mt-1 text-lg font-bold text-admin-text">
                    {openDate}
                  </p>
                </div>
                <div className="rounded-adminControl border border-admin-border bg-admin-bg p-3">
                  <p className="text-sm text-admin-muted">選取班次</p>
                  <p className="mt-1 text-lg font-bold text-admin-text">
                    {selectedCancelSchedules.length} 班
                  </p>
                </div>
                <div className="rounded-adminControl border border-admin-border bg-admin-bg p-3">
                  <p className="text-sm text-admin-muted">影響乘客</p>
                  <p className="mt-1 text-lg font-bold text-admin-text">
                    {selectedCancelPassengerCount} 人
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-base font-bold text-admin-softText">
                  即將停用的班次
                </p>
                <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                  {selectedCancelSchedules.map((schedule) => (
                    <span
                      key={schedule.dailyOpenScheduleId}
                      className="rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-base font-semibold text-red-200"
                    >
                      {formatDepartureTime(schedule.departureTime)}・
                      {schedule.routeNumber}
                    </span>
                  ))}
                </div>
              </div>

              <label className="mt-5 block text-base font-bold text-admin-softText">
                乘客通知文字
                <span className="ml-2 font-normal text-admin-muted">
                  將套用至所有受影響乘客
                </span>
                <textarea
                  className="mt-2 min-h-64 w-full rounded-adminControl border border-admin-borderStrong bg-admin-bg px-3 py-3 text-lg leading-8 text-admin-text outline-none focus:border-adminStatus-enabled focus:ring-4 focus:ring-adminStatus-enabled/15"
                  id="cancel-notification-text"
                  name="cancel-notification-text"
                  rows={12}
                  value={cancelNotificationText}
                  onChange={(event) => {
                    setCancelNotificationText(event.target.value);
                    setCancelScheduleError("");
                  }}
                />
              </label>

              <div className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-base leading-7 text-red-200">
                所選班次會變更為停班，現有預約會全部取消，系統將使用上方文字通知乘客。
              </div>

              {cancelScheduleError && (
                <p
                  className="mt-4 rounded-adminControl border border-red-400/30 bg-red-400/10 px-4 py-3 text-base text-red-200"
                  role="alert"
                >
                  {cancelScheduleError}
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-admin-border bg-admin-elevated/30 px-5 py-4">
              <button
                className="h-11 rounded-adminControl border border-admin-borderStrong px-5 text-base font-semibold text-admin-softText disabled:opacity-60"
                disabled={isCancellingSchedule}
                type="button"
                onClick={closeCancelScheduleModal}
              >
                返回
              </button>
              <button
                className="h-11 rounded-adminControl bg-red-500 px-5 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={
                  isCancellingSchedule || !cancelNotificationText.trim()
                }
                type="button"
                onClick={submitCancelSchedule}
              >
                {isCancellingSchedule
                  ? "停班處理中…"
                  : `確認停用 ${selectedCancelSchedules.length} 個班次`}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
