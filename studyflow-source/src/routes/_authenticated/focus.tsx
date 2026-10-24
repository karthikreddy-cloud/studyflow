import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLogSession, useSessions, useSubjects } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/focus")({
  head: () => ({ meta: [{ title: "Focus — StudyFlow" }, { name: "description", content: "Pomodoro focus timer." }] }),
  component: FocusPage,
});

const MODES = { focus: { label: "Focus", min: 25 }, short: { label: "Short break", min: 5 }, long: { label: "Long break", min: 15 } } as const;
type Mode = keyof typeof MODES;

function FocusPage() {
  const { data: subjects = [] } = useSubjects();
  const { data: sessions = [] } = useSessions();
  const log = useLogSession();
  const [mode, setMode] = useState<Mode>("focus");
  const [left, setLeft] = useState(MODES.focus.min * 60);
  const [running, setRunning] = useState(false);
  const [subject, setSubject] = useState("none");
  const [count, setCount] = useState(0);
  const endRef = useRef<number | null>(null);

  const total = MODES[mode].min * 60;

  const switchMode = (m: Mode) => { setMode(m); setRunning(false); setLeft(MODES[m].min * 60); };

  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const r = Math.max(0, Math.round((endRef.current! - Date.now()) / 1000));
      setLeft(r);
      if (r === 0) {
        clearInterval(id);
        setRunning(false);
        if (mode === "focus") {
          log.mutate({ minutes: MODES.focus.min, subject_id: subject === "none" ? null : subject });
          const n = count + 1; setCount(n);
          toast.success("Focus session complete! Time for a break ☕");
          switchMode(n % 4 === 0 ? "long" : "short");
        } else {
          toast("Break over — back to focus 💪");
          switchMode("focus");
        }
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  useEffect(() => {
    document.title = running ? `${fmt(left)} · ${MODES[mode].label}` : "Focus — StudyFlow";
  }, [left, running, mode]);

  const skip = () => {
    if (mode === "focus") {
      const mins = Math.floor((total - left) / 60);
      if (mins >= 1) {
        log.mutate({ minutes: mins, subject_id: subject === "none" ? null : subject });
        toast.success(`Logged ${mins} minute${mins > 1 ? "s" : ""} of focus`);
      }
    }
    switchMode(mode === "focus" ? "short" : "focus");
  };

  const r = 130, c = 2 * Math.PI * r;
  const progress = 1 - left / total;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const today = sessions.filter((s) => new Date(s.created_at) >= todayStart);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold md:text-3xl">Focus timer</h1>
      <div className="card-surface flex flex-col items-center p-6 md:p-10">
        <div className="mb-6 flex gap-1 rounded-2xl bg-muted p-1">
          {(Object.keys(MODES) as Mode[]).map((m) => (
            <button key={m} onClick={() => switchMode(m)}
              className={cn("rounded-xl px-3 py-2 text-sm font-semibold transition-all md:px-4", mode === m ? "bg-card text-primary shadow-soft" : "text-muted-foreground")}>
              {MODES[m].label}
            </button>
          ))}
        </div>
        <div className="relative size-72">
          <svg viewBox="0 0 300 300" className="size-full -rotate-90">
            <circle cx="150" cy="150" r={r} fill="none" strokeWidth="12" className="stroke-muted" />
            <circle cx="150" cy="150" r={r} fill="none" strokeWidth="12" strokeLinecap="round" className="stroke-primary transition-[stroke-dashoffset] duration-300"
              strokeDasharray={c} strokeDashoffset={c * (1 - progress)} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-6xl font-bold tabular-nums">{fmt(left)}</span>
            <span className="mt-1 text-sm text-muted-foreground">{MODES[mode].label}</span>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => { setRunning(false); setLeft(total); }} aria-label="Reset"><RotateCcw /></Button>
          <Button variant="hero" size="lg" className="w-36" onClick={() => setRunning(!running)}>
            {running ? <><Pause /> Pause</> : <><Play /> Start</>}
          </Button>
          <Button variant="outline" size="icon" onClick={skip} aria-label="Skip"><SkipForward /></Button>
        </div>
        <div className="mt-6 w-full max-w-xs">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Studying…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">General study</SelectItem>
              {subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card-surface p-5">
          <p className="font-display text-2xl font-bold">{today.length}</p>
          <p className="text-sm text-muted-foreground">Sessions today</p>
        </div>
        <div className="card-surface p-5">
          <p className="font-display text-2xl font-bold">{today.reduce((a, s) => a + s.minutes, 0)}m</p>
          <p className="text-sm text-muted-foreground">Focused today</p>
        </div>
      </div>
    </div>
  );
}

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
