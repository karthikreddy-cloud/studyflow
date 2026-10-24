import { format } from "date-fns";
import { CalendarClock, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { dueStatus, subjectColor, useDeleteTask, useToggleTask, type Subject, type Task } from "@/lib/data";

const PRIORITY: Record<string, string> = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/15 text-warning",
  low: "bg-success/15 text-success",
};

export function TaskItem({ task, subject, onEdit }: { task: Task; subject?: Subject | undefined; onEdit: (t: Task) => void }) {
  const toggle = useToggleTask();
  const del = useDeleteTask();
  const status = dueStatus(task);

  return (
    <div className="group flex items-start gap-3 rounded-2xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-soft animate-rise">
      <Checkbox checked={task.completed} onCheckedChange={() => toggle.mutate(task)} className="mt-0.5 size-5 rounded-md" aria-label="Toggle complete" />
      <div className="min-w-0 flex-1">
        <p className={cn("font-medium", task.completed && "text-muted-foreground line-through")}>{task.title}</p>
        {task.description && <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          {subject && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 font-medium">
              <span className="size-2 rounded-full" style={{ background: subjectColor(subject.color) }} />
              {subject.name}
            </span>
          )}
          <span className={cn("rounded-full px-2.5 py-1 font-medium capitalize", PRIORITY[task.priority] ?? PRIORITY["medium"])}>{task.priority}</span>
          {task.due_date && (
            <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
              status === "overdue" ? "bg-destructive/10 text-destructive" : status === "soon" ? "bg-primary-soft text-primary" : "text-muted-foreground")}>
              <CalendarClock className="size-3" />
              {format(new Date(task.due_date), "MMM d, h:mm a")}
              {status === "overdue" && " · overdue"}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => onEdit(task)} aria-label="Edit"><Pencil /></Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 hover:text-destructive" aria-label="Delete"><Trash2 /></Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this assignment?</AlertDialogTitle>
              <AlertDialogDescription>"{task.title}" will be permanently removed.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => del.mutate(task.id)}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
