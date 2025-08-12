import { TaskManager } from "@/components/task-manager";

export default function Home() {
  return (
    <main className="min-h-screen w-full p-6 sm:p-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold mb-4">AI Task Manager</h1>
        <TaskManager />
      </div>
    </main>
  );
}
