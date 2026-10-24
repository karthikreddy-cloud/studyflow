import { createFileRoute } from "@tanstack/react-router";
import { format, startOfDay, subDays } from "date-fns";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { subjectColor, useSessions, useSubjects, useTasks } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/progress")({
  head: () => ({ meta: [{ title: "Progress — StudyFlow" }, { name: "description", content: "Study progress charts." }] }),
  component: ProgressPage,
});

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)" };

function ProgressPage() {
  const { data: tasks = [] } = useTasks();
  const { data: sessions = [] } = useSessions();
  const { data: subjects = [] } = useSubjects();

  const days = Array.from({ length: 7 }, (_, i) => startOfDay(subDays(new Date(), 6 - i)));
  const daily = days.map((d) => {
    const next = d.getTime() + 86400000;
    const inDay = (iso: string | null) => !!iso && new Date(iso).getTime() >= d.getTime() && new Date(iso).getTime() < next;
    return {
      day: format(d, "EEE"),
      minutes: sessions.filter((s) => inDay(s.created_at)).reduce((a, s) => a + s.minutes, 0),
      completed: tasks.filter((t) => inDay(t.completed_at)).length,
    };
  });

  const bySubject = subjects.map((s) => ({
    name: s.name,
    color: subjectColor(s.color),
    minutes: sessions.filter((x) => x.subject_id === s.id).reduce((a, x) => a + x.minutes, 0),
  })).filter((s) => s.minutes > 0);

  const done = tasks.filter((t) => t.completed).length;
  const totalMin = sessions.reduce((a, s) => a + s.minutes, 0);
  const weekMin = daily.reduce((a, d) => a + d.minutes, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">Study progress</h1>
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: "Tasks done", v: done },
          { l: "Hours this week", v: (weekMin / 60).toFixed(1) },
          { l: "Total hours", v: (totalMin / 60).toFixed(1) },
        ].map((s) => (
          <div key={s.l} className="card-surface p-5 animate-rise">
            <p className="font-display text-2xl font-bold text-primary">{s.v}</p>
            <p className="text-sm text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface p-5">
          <h2 className="mb-4 font-semibold">Focus minutes · last 7 days</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={daily}>
                <defs>
                  <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="minutes" stroke="var(--primary)" strokeWidth={3} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card-surface p-5">
          <h2 className="mb-4 font-semibold">Tasks completed · last 7 days</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={30} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="completed" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card-surface p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Study time by subject</h2>
          {bySubject.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete a focus session with a subject selected to see this chart.</p>
          ) : (
            <div className="flex flex-col items-center gap-6 md:flex-row">
              <div className="h-56 w-full md:w-1/2">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={bySubject} dataKey="minutes" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {bySubject.map((s) => <Cell key={s.name} fill={s.color} />)}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full space-y-2 md:w-1/2">
                {bySubject.map((s) => (
                  <li key={s.name} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: s.color }} />{s.name}</span>
                    <span className="font-semibold">{s.minutes}m</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
