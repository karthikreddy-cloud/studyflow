import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskItem } from "@/components/TaskItem";
import { cn } from "@/lib/utils";
import { SUBJECT_COLORS, subjectColor, useDeleteSubject, useSaveSubject, useSubjects, useTasks, type Subject, type Task } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/subjects")({
  head: () => ({ meta: [{ title: "Subjects — StudyFlow" }, { name: "description", content: "Tasks organized by subject." }] }),
  component: SubjectsPage,
});

function SubjectsPage() {
  const { data: subjects = [] } = useSubjects();
  const { data: tasks = [] } = useTasks();
  const save = useSaveSubject();
  const del = useDeleteSubject();
  const [edit, setEdit] = useState<Partial<Subject> | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskEditing, setTaskEditing] = useState<Task | null>(null);
  const [taskSubject, setTaskSubject] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit?.name?.trim()) return;
    save.mutate({ id: edit.id, name: edit.name.trim(), color: edit.color ?? "violet" }, { onSuccess: () => setEdit(null) });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Subjects</h1>
        <Button variant="hero" onClick={() => setEdit({ name: "", color: "violet" })}><Plus /> Add subject</Button>
      </div>

      {subjects.length === 0 && (
        <div className="card-surface p-10 text-center">
          <p className="font-medium">No subjects yet</p>
          <p className="text-sm text-muted-foreground">Create subjects like Math, Physics or History to group your tasks.</p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {subjects.map((s) => {
          const st = tasks.filter((t) => t.subject_id === s.id);
          return (
            <section key={s.id} className="card-surface overflow-hidden animate-rise">
              <div className="h-1.5" style={{ background: subjectColor(s.color) }} />
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{s.name}</h2>
                    <p className="text-sm text-muted-foreground">{st.filter((t) => t.completed).length} of {st.length} done</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Add task" onClick={() => { setTaskEditing(null); setTaskSubject(s.id); setTaskOpen(true); }}><Plus /></Button>
                    <Button variant="ghost" size="icon" className="size-8" aria-label="Edit subject" onClick={() => setEdit(s)}><Pencil /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 hover:text-destructive" aria-label="Delete subject"><Trash2 /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {s.name}?</AlertDialogTitle>
                          <AlertDialogDescription>Its assignments will be kept without a subject.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => del.mutate(s.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {st.length === 0 ? <p className="text-sm text-muted-foreground">No assignments yet.</p> :
                    st.map((t) => <TaskItem key={t.id} task={t} subject={s} onEdit={(x) => { setTaskEditing(x); setTaskOpen(true); }} />)}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader><DialogTitle className="font-display">{edit?.id ? "Edit subject" : "New subject"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="s-name">Name</Label>
              <Input id="s-name" required value={edit?.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {Object.keys(SUBJECT_COLORS).map((c) => (
                  <button type="button" key={c} aria-label={c} onClick={() => setEdit({ ...edit, color: c })}
                    className={cn("size-8 rounded-full ring-offset-2 ring-offset-background transition-transform hover:scale-110", edit?.color === c && "ring-2 ring-ring")}
                    style={{ background: subjectColor(c) }} />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEdit(null)}>Cancel</Button>
              <Button type="submit" variant="hero" disabled={save.isPending}>Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TaskDialog open={taskOpen} onOpenChange={setTaskOpen} task={taskEditing} defaultSubject={taskSubject} />
    </div>
  );
}
