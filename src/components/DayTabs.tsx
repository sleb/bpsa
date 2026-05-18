import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DayId } from "@/lib/types";

const DAY_LABELS: Record<DayId, string> = {
  "2026-06-18": "Thu Jun 18",
  "2026-06-19": "Fri Jun 19",
  "2026-06-20": "Sat Jun 20",
};

type Props = {
  selectedDay: DayId;
  onDayChange: (day: DayId) => void;
};

export function DayTabs({ selectedDay, onDayChange }: Props) {
  return (
    <Tabs value={selectedDay} onValueChange={(v) => onDayChange(v as DayId)}>
      <TabsList className="grid grid-cols-3 w-full min-h-[44px]">
        {(Object.entries(DAY_LABELS) as [DayId, string][]).map(([id, label]) => (
          <TabsTrigger key={id} value={id} className="text-xs sm:text-sm">
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
