import { useState } from "react";
import { Pencil, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EntryForm } from "@/components/EntryForm";
import { formatTime12h } from "@/lib/campTime";
import type { ScheduleEntry } from "@/lib/types";

type ActiveProps = {
  entry: ScheduleEntry;
  deleted?: false;
  isPublished?: boolean;
  onSave: (entry: ScheduleEntry) => void;
  onDelete: (id: string) => void;
  onRestore?: never;
};

type DeletedProps = {
  entry: ScheduleEntry;
  deleted: true;
  onRestore: (entry: ScheduleEntry) => void;
  onSave?: never;
  onDelete?: never;
};

type Props = ActiveProps | DeletedProps;

function EntryDetails({ entry, deleted }: { entry: ScheduleEntry; deleted?: boolean }) {
  return (
    <div className={`flex-1 min-w-0 ${deleted ? "line-through decoration-destructive" : ""}`}>
      <span className="text-xs font-mono text-muted-foreground">
        {entry.time ? formatTime12h(entry.time) : "—"}
      </span>
      <p className="text-sm font-medium truncate">
        {entry.activity || <span className={deleted ? "italic" : "text-muted-foreground italic"}>Untitled</span>}
      </p>
      <p className="text-xs text-muted-foreground truncate">{entry.location}</p>
    </div>
  );
}

export function EntryRow(props: Props) {
  const [editing, setEditing] = useState(false);
  const { entry } = props;
  const isPublished = !props.deleted && (props.isPublished ?? false);

  if (!props.deleted && editing) {
    return (
      <EntryForm
        entry={entry}
        onSave={(updated) => { props.onSave(updated); setEditing(false); }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  if (props.deleted) {
    return (
      <div className="flex items-start gap-2 py-2 px-1 opacity-50">
        <EntryDetails entry={entry} deleted />
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => props.onRestore(entry)}
          aria-label="Restore entry"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 py-2 px-1">
      <EntryDetails entry={entry} />
      <div className="flex gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setEditing(true)}
          aria-label="Edit entry"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive" aria-label="Delete entry">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>
                {isPublished
                  ? `"${entry.activity || "Untitled"}" will be marked for deletion. It stays live until you publish.`
                  : `"${entry.activity || "Untitled"}" will be discarded from the draft.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => props.onDelete(entry.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
