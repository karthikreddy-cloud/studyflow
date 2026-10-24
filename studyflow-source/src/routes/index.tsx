import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, BookOpen, Bell, GraduationCap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyFlow — Student Task Manager" },
      { name: "description", content: "Track assignments by subject, get deadline reminders, focus with Pomodoro and see your study progress." },
      { property: "og:title", content: "StudyFlow — Student Task Manager" },
      { property: "og:description", content: "Your study life, beautifully organized." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BookOpen, title: "Subject-wise tasks", text: "Group every assignment by course with color-coded subjects." },
  { icon: Bell, title: "Deadline reminders", text: "Never miss a due date — see what's overdue or coming up." },
  { icon: Timer, title: "Pomodoro focus", text: "Built-in focus timer that logs your study minutes." },
  { icon: BarChart3, title: "Progress charts", text: "Watch your completed tasks and study hours grow." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">StudyFlow</span>
        </div>
        <Button asChild variant="outline"><Link to="/auth">Sign in</Link></Button>
      </header>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-12 text-center animate-rise">
        <span className="inline-block rounded-full bg-primary-soft px-4 py-1.5 text-xs font-semibold text-primary">For students who want calm, not chaos</span>
        <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
          Your study life,{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">beautifully organized.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Plan assignments, beat deadlines, and stay focused — all in one place.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild size="lg" variant="hero"><Link to="/auth">Get started free</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f, i) => (
          <div key={f.title} className="card-surface animate-rise p-6 transition-transform hover:-translate-y-1" style={{ animationDelay: `${i * 80}ms` }}>
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><f.icon className="size-5" /></span>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
