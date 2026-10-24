import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Flame, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskItem } from "@/components/TaskItem";
import { dueStatus, subjectColor, useSessions, useSubjects, useTasks, type Task } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — StudyFlow" }, { name: "description", content: "Your study overview." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: subjects = [] } = useSubjects();
  const { data: sessions = [] } = useSessions();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const done = tasks.filter((t) => t.completed).length;
  const overdue = tasks.filter((t) => dueStatus(t) === "overdue").length;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayMin = sessions.filter((s) => new Date(s.created_at) >= todayStart).reduce((a, s) => a + s.minutes, 0);
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  const upcoming = tasks.filter((t) => !t.completed).slice(0, 5);
  const subMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const stats = [
    { label: "Completed", value: `${done}/${tasks.length}`, icon: CheckCircle2 },
    { label: "Overdue", value: overdue, icon: AlertTriangle },
    { label: "Focus today", value: `${todayMin}m`, icon: Flame },
    { label: "Pending", value: tasks.length - done, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-primary p-6 text-primary-foreground shadow-glow md:p-8 animate-rise">
        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm opacity-80">Overall progress</p>
            <h1 className="mt-1 text-3xl font-bold md:text-4xl">{pct}% of assignments done</h1>
            <div className="mt-4 h-2 w-full max-w-sm overflow-hidden rounded-full bg-primary-foreground/25">
              <div className="h-full rounded-full bg-primary-foreground transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <Button variant="secondary" size="lg" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus /> New assignment
          </Button>
        </div>
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-primary-foreground/10" />
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="card-surface p-5 animate-rise" style={{ animationDelay: `${i * 60}ms` }}>
            <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary"><s.icon className="size-5" /></span>
            <p className="mt-3 font-display text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card-surface p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Up next</h2>
            <Link to="/tasks" className="text-sm font-semibold text-primary">View all</Link>
          </div>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl bg-muted p-8 text-center">
              <p className="font-medium">Nothing pending 🎉</p>
              <p className="text-sm text-muted-foreground">Add an assignment to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((t) => (
                <TaskItem key={t.id} task={t} subject={t.subject_id ? subMap[t.subject_id] : undefined} onEdit={(x) => { setEditing(x); setOpen(true); }} />
              ))}
            </div>
          )}
        </section>

        <section className="card-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Subjects</h2>
            <Link to="/subjects" className="text-sm font-semibold text-primary">Manage</Link>
          </div>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No subjects yet. <Link to="/subjects" className="text-primary">Add one</Link>.</p>
          ) : (
            <ul className="space-y-4">
              {subjects.map((s) => {
                const st = tasks.filter((t) => t.subject_id === s.id);
                const d = st.filter((t) => t.completed).length;
                return (
                  <li key={s.id}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="size-2.5 rounded-full" style={{ background: subjectColor(s.color) }} />{s.name}
                      </span>
                      <span className="text-muted-foreground">{d}/{st.length}</span>
                    </div>
                    <Progress value={st.length ? (d / st.length) * 100 : 0} className="h-2" />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <TaskDialog open={open} onOpenChange={setOpen} task={editing} />
    </div>
  );
}
