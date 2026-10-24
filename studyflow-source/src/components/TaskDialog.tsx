import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveTask, useSubjects, type Task } from "@/lib/data";
import { toast } from "sonner";

export function TaskDialog({ open, onOpenChange, task, defaultSubject }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  task?: Task | null;
  defaultSubject?: string | null;
}) {
  const { data: subjects = [] } = useSubjects();
  const save = useSaveTask();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState("medium");
  const [subject, setSubject] = useState<string>("none");

  useEffect(() => {
    if (!open) return;
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setDue(task?.due_date ? format(new Date(task.due_date), "yyyy-MM-dd'T'HH:mm") : "");
    setPriority(task?.priority ?? "medium");
    setSubject(task?.subject_id ?? defaultSubject ?? "none");
  }, [open, task, defaultSubject]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    save.mutate(
      {
        id: task?.id,
        title: title.trim(),
        description: description.trim() || null,
        due_date: due ? new Date(due).toISOString() : null,
        priority,
        subject_id: subject === "none" ? null : subject,
      },
      {
        onSuccess: () => {
          toast.success(task ? "Assignment updated" : "Assignment added");
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{task ? "Edit assignment" : "New assignment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Title</Label>
            <Input id="t-title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Chemistry lab report" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Notes</Label>
            <Textarea id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl" rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-due">Deadline</Label>
            <Input id="t-due" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="hero" disabled={save.isPending}>{task ? "Save changes" : "Add assignment"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
