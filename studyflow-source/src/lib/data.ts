import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Session = Database["public"]["Tables"]["study_sessions"]["Row"];

export const SUBJECT_COLORS: Record<string, string> = {
  violet: "oklch(0.58 0.22 293)",
  pink: "oklch(0.66 0.21 350)",
  blue: "oklch(0.62 0.16 250)",
  teal: "oklch(0.65 0.12 190)",
  green: "oklch(0.66 0.16 150)",
  amber: "oklch(0.76 0.16 70)",
  red: "oklch(0.62 0.21 25)",
};
export const subjectColor = (c?: string | null) => SUBJECT_COLORS[c ?? "violet"] ?? "oklch(0.58 0.22 293)";

const err = (e: unknown) => toast.error(e instanceof Error ? e.message : "Something went wrong");

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });
}
export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}
export function useSessions() {
  return useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("study_sessions").select("*").order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return data;
    },
  });
}

type TaskInput = Database["public"]["Tables"]["tasks"]["Insert"];
export function useSaveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<TaskInput, "id"> & { id?: string | undefined }) => {
      const { id, ...rest } = t;
      const { error } = id
        ? await supabase.from("tasks").update(rest).eq("id", id)
        : await supabase.from("tasks").insert(rest);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: err,
  });
}
export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Task) => {
      const completed = !t.completed;
      const { error } = await supabase
        .from("tasks")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", t.id);
      if (error) throw error;
      return completed;
    },
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      if (c) toast.success("Nice work! Task completed 🎉");
    },
    onError: err,
  });
}
export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task deleted");
    },
    onError: err,
  });
}
export function useSaveSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { id?: string | undefined; name: string; color: string }) => {
      const { id, ...rest } = s;
      const { error } = id
        ? await supabase.from("subjects").update(rest).eq("id", id)
        : await supabase.from("subjects").insert(rest);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
    onError: err,
  });
}
export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Subject removed");
    },
    onError: err,
  });
}
export function useLogSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: { minutes: number; subject_id: string | null }) => {
      const { error } = await supabase.from("study_sessions").insert(s);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
    onError: err,
  });
}

export function dueStatus(t: Task): "overdue" | "soon" | "later" | "none" | "done" {
  if (t.completed) return "done";
  if (!t.due_date) return "none";
  const diff = new Date(t.due_date).getTime() - Date.now();
  if (diff < 0) return "overdue";
  if (diff < 1000 * 60 * 60 * 48) return "soon";
  return "later";
}
