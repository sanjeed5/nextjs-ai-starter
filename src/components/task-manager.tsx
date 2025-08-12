"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Response as Markdown } from "@/components/ai-elements/response";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO string for storage simplicity
  parentId?: string;
  aiGenerated?: boolean;
  estimatedMinutes?: number;
};

const STORAGE_KEY = "ai-task-manager:tasks";
const PLAN_STORAGE_KEY = "ai-task-manager:plan";

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [planText, setPlanText] = useState<string | null>(null);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Task[];
        setTasks(Array.isArray(parsed) ? parsed : []);
      }
      const planRaw = localStorage.getItem(PLAN_STORAGE_KEY);
      if (planRaw) {
        const parsedPlan = JSON.parse(planRaw) as { text: string; savedAt?: string };
        if (parsedPlan && typeof parsedPlan.text === "string") {
          setPlanText(parsedPlan.text);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks]);

  // Persist plan to localStorage
  useEffect(() => {
    try {
      if (planText && planText.length > 0) {
        localStorage.setItem(
          PLAN_STORAGE_KEY,
          JSON.stringify({ text: planText, savedAt: new Date().toISOString() })
        );
      } else {
        localStorage.removeItem(PLAN_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [planText]);

  const addTask = useCallback(() => {
    const title = newTaskTitle.trim();
    if (!title) return;
    const task: Task = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    setNewTaskTitle("");
  }, [newTaskTitle]);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id && t.parentId !== id));
  }, []);

  const toggleCompleted = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const hasTasks = tasks.length > 0;

  const rootTasks = useMemo(() => tasks.filter((t) => !t.parentId), [tasks]);

  const subtasksByParent = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const t of tasks) {
      if (!t.parentId) continue;
      const arr = map.get(t.parentId) ?? [];
      arr.push(t);
      map.set(t.parentId, arr);
    }
    return map;
  }, [tasks]);

  const breakDownTask = useCallback(async (task: Task) => {
    try {
      setLoadingTaskId(task.id);
      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title }),
      });
      let data: { subtasks?: string[]; error?: string } = {};
      try {
        data = (await res.json()) as { subtasks?: string[]; error?: string };
      } catch {
        // Non-JSON (e.g., HTML error page or plain text)
        const text = await res.text();
        throw new Error(text || "Failed to break down task");
      }
      if (!res.ok) throw new Error(data.error || "Failed to break down task");
      const now = new Date().toISOString();
      const newSubtasks: Task[] = (data.subtasks ?? []).map((title) => ({
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: now,
        parentId: task.id,
        aiGenerated: true,
      }));
      if (newSubtasks.length > 0) {
        setTasks((prev) => [...newSubtasks, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTaskId(null);
    }
  }, []);

  const planMyDay = useCallback(async () => {
    try {
      setIsPlanning(true);
      const now = new Date();
      const res = await fetch("/api/plan-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          nowISO: now.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          locale: typeof navigator !== "undefined" ? navigator.language : "en-US",
        }),
      });
      let data: { plan?: string; error?: string } = {};
      try {
        data = (await res.json()) as { plan?: string; error?: string };
      } catch {
        const text = await res.text();
        throw new Error(text || "Failed to plan day");
      }
      if (!res.ok) throw new Error(data.error || "Failed to plan day");
      setPlanText(data.plan ?? "");
    } catch (err) {
      console.error(err);
      setPlanText("There was an error generating a plan. Please try again.");
    } finally {
      setIsPlanning(false);
    }
  }, [tasks]);

  const clearPlan = useCallback(() => {
    setPlanText(null);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a task"
          onKeyDown={(e) => {
            if (e.key === "Enter") addTask();
          }}
        />
        <Button onClick={addTask}>Add</Button>
        <Button variant="secondary" onClick={planMyDay} disabled={!hasTasks || isPlanning}>
          {isPlanning ? "Planning…" : "Plan My Day"}
        </Button>
        <Button variant="outline" onClick={clearPlan} disabled={!planText} aria-label="Clear plan">
          Clear Plan
        </Button>
      </div>

      {planText && (
        <div className="rounded-md border p-4 text-sm">
          <Markdown>{planText}</Markdown>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {rootTasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tasks yet. Add your first task above.</p>
        ) : (
          rootTasks.map((task) => {
            const subtasks = subtasksByParent.get(task.id) ?? [];
            const isLoading = loadingTaskId === task.id;
            return (
              <div key={task.id} className="rounded-md border p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={task.completed}
                    onChange={() => toggleCompleted(task.id)}
                  />
                  <div className="flex-1 flex items-center gap-2">
                    <span className={task.completed ? "line-through text-muted-foreground" : ""}>
                      {task.title}
                    </span>
                    {task.aiGenerated && <Badge variant="secondary">AI</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => breakDownTask(task)}
                      disabled={isLoading}
                    >
                      {isLoading ? "Breaking…" : "Subtask with AI 🤖"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      aria-label="Delete task"
                      title="Delete"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>

                {subtasks.length > 0 && (
                  <div className="mt-3 pl-6 flex flex-col gap-2">
                    {subtasks.map((st) => (
                      <div key={st.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="size-4"
                          checked={st.completed}
                          onChange={() => toggleCompleted(st.id)}
                        />
                        <div className="flex-1 flex items-center gap-2">
                          <span className={st.completed ? "line-through text-muted-foreground" : ""}>
                            {st.title}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTask(st.id)}
                          aria-label="Remove subtask"
                          title="Remove"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default TaskManager;


