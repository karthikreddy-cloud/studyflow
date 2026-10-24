import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskDialog } from "@/components/TaskDialog";
import { TaskItem } from "@/components/TaskItem";
import { dueStatus, useSubjects, useTasks, type Task } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Assignments — StudyFlow" }, { name: "description", content: "All your assignments." }] }),
  component: TasksPage,
});

function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const { data: subjects = [] } = useSubjects();
  const [filter, setFilter] = useState("active");
  const [subject, setSubject] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const subMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const list = useMemo(() => tasks.filter((t) => {
    if (filter === "active" && t.completed) return false;
    if (filter === "done" && !t.completed) return false;
    if (filter === "overdue" && dueStatus(t) !== "overdue") return false;
    if (subject !== "all" && t.subject_id !== subject) return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [tasks, filter, subject, q]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Assignments</h1>
        <Button variant="hero" onClick={() => { setEditing(null); setOpen(true); }}><Plus /> New assignment</Button>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="rounded-xl">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
            <TabsTrigger value="done">Done</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="rounded-xl pl-9" />
          </div>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : list.length === 0 ? (
        <div className="card-surface p-10 text-center">
          <p className="font-medium">No assignments here</p>
          <p className="text-sm text-muted-foreground">Try a different filter or add a new one.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((t) => (
            <TaskItem key={t.id} task={t} subject={t.subject_id ? subMap[t.subject_id] : undefined} onEdit={(x) => { setEditing(x); setOpen(true); }} />
          ))}
        </div>
      )}
      <TaskDialog open={open} onOpenChange={setOpen} task={editing} defaultSubject={subject !== "all" ? subject : null} />
    </div>
  );
}
