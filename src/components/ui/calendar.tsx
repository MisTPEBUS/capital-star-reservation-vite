import * as React from "react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      className={cn("p-2 text-admin-text", className)}
      classNames={{
        root: "w-fit",
        months: "flex flex-col",
        month: "space-y-3",
        month_caption: "flex h-9 items-center justify-center text-sm font-bold",
        nav: "flex items-center justify-between",
        button_previous:
          "rounded-adminControl px-2 py-1 text-admin-softText hover:bg-admin-elevated hover:text-admin-text",
        button_next:
          "rounded-adminControl px-2 py-1 text-admin-softText hover:bg-admin-elevated hover:text-admin-text",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-medium text-admin-muted",
        week: "mt-1 flex w-full",
        day: "relative h-9 w-9 p-0 text-center",
        day_button:
          "h-9 w-9 rounded-adminControl text-sm font-medium text-admin-softText hover:bg-admin-elevated hover:text-admin-text focus:outline-none focus:ring-2 focus:ring-adminStatus-enabled",
        selected:
          "[&>button]:bg-adminStatus-enabled [&>button]:text-admin-bg",
        today: "[&>button]:border [&>button]:border-adminStatus-enabled",
        outside: "opacity-40",
        disabled: "opacity-40",
        ...classNames,
      }}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  );
}

export { Calendar };
