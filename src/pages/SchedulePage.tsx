import { useEffect, useState } from "react";
import { DayTabs } from "@/components/DayTabs";
import { ScheduleList } from "@/components/ScheduleList";
import { subscribeSchedule } from "@/lib/scheduleService";
import { getTodayCampDay } from "@/lib/campTime";
import { db } from "@/lib/firebase";
import type { DayId, ScheduleEntry } from "@/lib/types";

export function SchedulePage() {
  const todayDayId = getTodayCampDay();
  const [selectedDay, setSelectedDay] = useState<DayId>(todayDayId ?? "2026-06-18");
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeSchedule(db, selectedDay, (schedule) => {
      setEntries(schedule.entries);
      setLoading(false);
    });
    return unsub;
  }, [selectedDay]);

  return (
    <div className="max-w-lg mx-auto w-full min-h-screen">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="px-4 py-3">
          <h1 className="text-base font-semibold leading-tight">BP Youth Summer Adventure</h1>
          <p className="text-xs text-muted-foreground">June 18–20 · Potholes State Park, WA</p>
        </div>
        <DayTabs selectedDay={selectedDay} onDayChange={setSelectedDay} />
      </header>

      <main>
        <ScheduleList entries={entries} loading={loading} />
      </main>
    </div>
  );
}
