import { Link, Outlet, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { BarChart3, BookOpen, CheckSquare, GraduationCap, LayoutDashboard, LogOut, Moon, Sun, Timer, Bell } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { dueStatus, useTasks } from "@/lib/data";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/subjects", label: "Subjects", icon: BookOpen },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/progress", label: "Progress", icon: BarChart3 },
] as const;

export function AppShell() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: tasks = [] } = useTasks();
  const reminded = useRef(false);

  const upcoming = tasks.filter((t) => ["overdue", "soon"].includes(dueStatus(t)));

  useEffect(() => {
    if (reminded.current || tasks.length === 0) return;
    reminded.current = true;
    const overdue = upcoming.filter((t) => dueStatus(t) === "overdue").length;
    const soon = upcoming.length - overdue;
    if (overdue) toast.error(`${overdue} assignment${overdue > 1 ? "s are" : " is"} overdue`);
    if (soon) toast.warning(`${soon} assignment${soon > 1 ? "s are" : " is"} due within 48 hours`);
  }, [tasks, upcoming]);

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const name = (user.user_metadata?.['full_name'] as string) || user.email?.split("@")[0] || "Student";

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-sidebar p-5 md:flex">
        <Link to="/dashboard" className="mb-8 flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <GraduationCap className="size-5" />
          </span>
          <span className="font-display text-lg font-bold">StudyFlow</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{ className: "bg-sidebar-accent !text-sidebar-accent-foreground" }}
            >
              <n.icon className="size-4" />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="rounded-2xl bg-primary-soft p-4">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2" onClick={signOut}>
            <LogOut /> Sign out
          </Button>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-8">
          <Link to="/dashboard" className="flex items-center gap-2 md:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
              <GraduationCap className="size-4" />
            </span>
            <span className="font-display font-bold">StudyFlow</span>
          </Link>
          <p className="hidden text-sm text-muted-foreground md:block">Hi {name}, let's get things done ✨</p>
          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Reminders" className="relative">
                  <Bell />
                  {upcoming.length > 0 && (
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 rounded-2xl">
                <p className="mb-2 text-sm font-semibold">Deadline reminders</p>
                {upcoming.length === 0 ? (
                  <p className="text-sm text-muted-foreground">You're all caught up 🎉</p>
                ) : (
                  <ul className="space-y-2">
                    {upcoming.slice(0, 6).map((t) => (
                      <li key={t.id} className="rounded-xl bg-muted p-2.5 text-sm">
                        <p className="font-medium">{t.title}</p>
                        <p className={dueStatus(t) === "overdue" ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                          {dueStatus(t) === "overdue" ? "Overdue " : "Due "}
                          {formatDistanceToNow(new Date(t.due_date!), { addSuffix: true })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
              {dark ? <Sun /> : <Moon />}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" className="md:hidden">
              <LogOut />
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 md:px-8 md:pb-12">
          <Outlet />
        </main>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-around rounded-2xl border bg-card/95 p-1.5 shadow-soft backdrop-blur md:hidden">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium text-muted-foreground"
            activeProps={{ className: "bg-primary-soft !text-primary" }}
          >
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
