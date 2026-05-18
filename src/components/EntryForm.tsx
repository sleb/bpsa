import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScheduleEntry } from "@/lib/types";

type Props = {
  entry: ScheduleEntry;
  onSave: (entry: ScheduleEntry) => void;
  onCancel: () => void;
};

const TIME_RE = /^\d{2}:\d{2}$/;

export function EntryForm({ entry, onSave, onCancel }: Props) {
  const [values, setValues] = useState({
    time: entry.time,
    activity: entry.activity,
    location: entry.location,
  });

  const timeValid = TIME_RE.test(values.time);
  const canSave = timeValid && values.activity.trim().length > 0;

  function set(field: keyof typeof values) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setValues((v) => ({ ...v, [field]: e.target.value }));
  }

  return (
    <div className="p-3 bg-muted/50 rounded-md space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor={`time-${entry.id}`} className="text-xs">Time (HH:MM)</Label>
          <Input
            id={`time-${entry.id}`}
            value={values.time}
            onChange={set("time")}
            placeholder="09:00"
            className="h-9 text-sm font-mono"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`location-${entry.id}`} className="text-xs">Location</Label>
          <Input
            id={`location-${entry.id}`}
            value={values.location}
            onChange={set("location")}
            placeholder="Main Pavilion"
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={`activity-${entry.id}`} className="text-xs">Activity</Label>
        <Input
          id={`activity-${entry.id}`}
          value={values.activity}
          onChange={set("activity")}
          placeholder="Morning Assembly"
          className="h-9 text-sm"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel} className="min-h-[44px]">
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSave({ ...entry, ...values })} disabled={!canSave} className="min-h-[44px]">
          Save
        </Button>
      </div>
    </div>
  );
}
