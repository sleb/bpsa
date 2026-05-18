import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DAY_IDS } from "@/lib/types";
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
        {DAY_IDS.map((id) => (
          <TabsTrigger key={id} value={id} className="text-xs sm:text-sm">
            {DAY_LABELS[id]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
