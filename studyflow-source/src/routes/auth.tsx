import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — StudyFlow" },
      { name: "description", content: "Sign in or create your StudyFlow account to manage assignments." },
      { property: "og:title", content: "Sign in — StudyFlow" },
      { property: "og:description", content: "Sign in or create your StudyFlow account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account.");
        else navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error("Google sign-in failed"); return; }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="card-surface w-full max-w-md animate-rise p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
            <GraduationCap />
          </span>
          <h1 className="text-2xl font-bold">{mode === "in" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your study life, beautifully organized.</p>
        </div>
        <Button variant="outline" className="w-full" onClick={google} type="button">
          <svg viewBox="0 0 24 24" className="size-4"><path fill="currentColor" d="M21.35 11.1H12v2.98h5.35c-.23 1.4-1.66 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.96S8.78 6.26 12 6.26c1.83 0 3.06.78 3.76 1.45l2.57-2.47C16.7 3.7 14.56 2.75 12 2.75 6.9 2.75 2.75 6.9 2.75 12S6.9 21.25 12 21.25c6.92 0 9.5-4.86 9.5-7.36 0-.5-.05-.86-.15-1.25z"/></svg>
          Continue with Google
        </Button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "up" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl" />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "in" ? "New here?" : "Already have an account?"}{" "}
          <button className="font-semibold text-primary" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
