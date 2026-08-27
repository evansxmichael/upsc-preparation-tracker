"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DashboardData {
  settings: {
    targetYear: number;
    prelimsTargetDate: string;
    mainsTargetDate: string;
    interviewDate?: string | null;
    dailyTargetHours: number;
  };
  overallProgress: number;
  totalTopics: number;
  completedTopics: number;
  todayHours: string;
  dailyTargetHours: number;
  streak: number;
  mockCount: number;
  avgMockScore: number;
  urgentRevisions: {
    id: string;
    nextDueDate: string;
    passCount: number;
    subject?: { id: string; name: string } | null;
    topic?: { id: string; title: string } | null;
  }[];
  weakAreas: { subject: string; count: number }[];
}

interface DailyTaskItem {
  id: string;
  date: string;
  text: string;
  hours: string | null;
  completed: boolean;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Execution Module States
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [todayTasks, setTodayTasks] = useState<DailyTaskItem[]>([]);
  const [historyTasks, setHistoryTasks] = useState<DailyTaskItem[]>([]);
  const [newTaskInput, setNewTaskInput] = useState("");
  const [newTaskHours, setNewTaskHours] = useState("1.0h");

  // History Range Filtration
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const todayDateStr = new Date().toISOString().slice(0, 10);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const [dashRes, taskRes] = await Promise.all([
        fetch("/api/dashboard"),
        fetch(`/api/tasks?date=${todayDateStr}`),
      ]);

      if (dashRes.ok) setData(await dashRes.json());
      if (taskRes.ok) setTodayTasks(await taskRes.json());
    } catch (e) {
      console.error("Failed to load dashboard metrics", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStartDate) params.set("startDate", filterStartDate);
      if (filterEndDate) params.set("endDate", filterEndDate);

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        setHistoryTasks(await res.json());
      }
    } catch (e) {
      console.error("Failed to load task history", e);
    }
  };

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistoryTasks();
    }
  }, [activeTab, filterStartDate, filterEndDate]);

  const calculateDaysLeft = (targetDateStr?: string | null) => {
    if (!targetDateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    return Math.max(
      0,
      Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    );
  };

  const handleToggleTask = async (task: DailyTaskItem) => {
    const nextCompleted = !task.completed;

    setTodayTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
    );
    setHistoryTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, completed: nextCompleted } : t))
    );

    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "TOGGLE",
          id: task.id,
          completed: nextCompleted,
        }),
      });
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newTaskInput.trim(),
          hours: newTaskHours.trim() || "1.0h",
          date: todayDateStr,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setTodayTasks((prev) => [...prev, created]);
        setNewTaskInput("");
      }
    } catch (err) {
      console.error("Failed to add task", err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setTodayTasks((prev) => prev.filter((t) => t.id !== id));
        setHistoryTasks((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  if (loading || !data) {
    return (
      <div className="py-24 text-center font-mono text-xs text-gray-500">
        Synthesizing live preparation command center...
      </div>
    );
  }

  const prelimsDays = calculateDaysLeft(data.settings.prelimsTargetDate);
  const mainsDays = calculateDaysLeft(data.settings.mainsTargetDate);
  const targetCapacityHours = data.dailyTargetHours || 6.0;
  const todayProgressPct = Math.min(
    100,
    Math.round((Number(data.todayHours) / targetCapacityHours) * 100)
  );

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Target & Multi-Stage Countdown Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono text-[#991b1b] uppercase tracking-wider font-semibold">
            COMMAND CENTER & EXECUTION HUB
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            UPSC CSE {data.settings.targetYear}
          </h2>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-2xs text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              PRELIMS STAGE
            </span>
            <span className="text-lg font-bold text-[#0f172a] leading-none">
              {prelimsDays}{" "}
              <span className="text-[10px] font-normal text-gray-400">DAYS</span>
            </span>
          </div>

          <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-2xs text-right">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              MAINS STAGE
            </span>
            <span className="text-lg font-bold text-blue-800 leading-none">
              {mainsDays}{" "}
              <span className="text-[10px] font-normal text-gray-400">DAYS</span>
            </span>
          </div>
        </div>
      </div>

      {/* Primary KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">
            Overall Syllabus
          </span>
          <p className="text-2xl font-serif font-bold text-[#0f172a]">
            {data.overallProgress}%
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0f172a] h-full"
              style={{ width: `${data.overallProgress}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 block pt-0.5">
            {data.completedTopics} of {data.totalTopics} topics complete
          </span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">
            Today's Focus Time
          </span>
          <p className="text-2xl font-bold text-blue-800">
            {data.todayHours}{" "}
            <span className="text-xs font-normal text-gray-400">
              / {targetCapacityHours}h
            </span>
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-800 h-full"
              style={{ width: `${todayProgressPct}%` }}
            />
          </div>
          <span className="text-[10px] text-gray-400 block pt-0.5">
            {todayProgressPct}% of daily capacity target
          </span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">
            Active Study Streak
          </span>
          <p className="text-2xl font-serif font-bold text-emerald-700">
            {data.streak}{" "}
            <span className="text-xs font-normal font-mono text-gray-400">
              DAYS 🔥
            </span>
          </p>
          <span className="text-[10px] text-emerald-800 font-semibold block pt-2">
            Consistency: Active
          </span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">
            Mock Performance
          </span>
          <p className="text-2xl font-serif font-bold text-[#991b1b]">
            {data.avgMockScore}%
          </p>
          <span className="text-[10px] text-gray-400 block pt-2">
            Across {data.mockCount} tests logged in DB
          </span>
        </div>
      </div>

      {/* Main Execution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("today")}
                className={`text-sm font-serif font-bold cursor-pointer transition pb-1 border-b-2 ${
                  activeTab === "today"
                    ? "border-[#0f172a] text-[#0f172a]"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                Today's Targets ({todayTasks.filter((t) => t.completed).length}/{todayTasks.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`text-sm font-serif font-bold cursor-pointer transition pb-1 border-b-2 ${
                  activeTab === "history"
                    ? "border-[#991b1b] text-[#991b1b]"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                Task Archives & History
              </button>
            </div>

            <Link
              href="/study-log"
              className="text-xs font-mono text-[#0f172a] hover:underline font-bold self-start sm:self-auto"
            >
              Launch Pomodoro Timer ➔
            </Link>
          </div>

          {/* Tab 1: Today's Tasks View */}
          {activeTab === "today" && (
            <div className="space-y-3">
              <div className="space-y-2">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-[#fbfbf9] hover:bg-gray-100/70 border border-gray-200 rounded-lg transition group"
                  >
                    <div
                      onClick={() => handleToggleTask(task)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => {}}
                        className="h-4 w-4 rounded border-gray-300 text-[#0f172a] cursor-pointer"
                      />
                      <span
                        className={`text-xs md:text-sm font-sans ${
                          task.completed
                            ? "text-gray-400 line-through"
                            : "text-gray-800 font-medium"
                        }`}
                      >
                        {task.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-xs text-gray-400">
                      <span>{task.hours}</span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600 transition cursor-pointer"
                        title="Delete Task"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Quick Task Form */}
              <form onSubmit={handleAddTask} className="flex gap-2 pt-2 font-mono text-xs">
                <input
                  type="text"
                  placeholder="+ Add a custom micro-task for today..."
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded font-sans text-xs focus:outline-hidden"
                />
                <input
                  type="text"
                  placeholder="1.0h"
                  value={newTaskHours}
                  onChange={(e) => setNewTaskHours(e.target.value)}
                  className="w-16 px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-center focus:outline-hidden"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-[#0f172a] text-white rounded hover:bg-black font-semibold cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>
          )}

          {/* Tab 2: History View */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#fbfbf9] border border-gray-200 rounded-lg font-mono text-xs">
                <span className="text-gray-500 uppercase text-[11px] font-bold">
                  Filter Date Range:
                </span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-[11px]">From:</span>
                    <input
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400 text-[11px]">To:</span>
                    <input
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-hidden"
                    />
                  </div>
                  {(filterStartDate || filterEndDate) && (
                    <button
                      onClick={() => {
                        setFilterStartDate("");
                        setFilterEndDate("");
                      }}
                      className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-[11px] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {historyTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                          t.completed
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {t.completed ? "✓ DONE" : "✗ MISSED"}
                      </span>
                      <span
                        className={`font-sans ${
                          t.completed ? "text-gray-500 line-through" : "text-gray-800 font-medium"
                        }`}
                      >
                        {t.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-gray-400">
                      <span>{new Date(t.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{t.hours}</span>
                    </div>
                  </div>
                ))}

                {historyTasks.length === 0 && (
                  <p className="text-xs font-mono text-gray-400 py-8 text-center">
                    No task records found in the selected range.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Revisions & Quick Actions */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <h4 className="font-serif font-bold text-gray-900 text-base">
                Spaced Revision Due
              </h4>
              <Link
                href="/revision"
                className="text-xs font-mono text-[#991b1b] hover:underline font-bold"
              >
                View Engine ➔
              </Link>
            </div>

            <div className="space-y-2">
              {data.urgentRevisions.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 bg-amber-50/50 border border-amber-200 rounded text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold uppercase text-[#991b1b] text-[10px]">
                      {r.subject?.name || "General"}
                    </span>
                    <span className="text-gray-400 font-mono text-[10px]">
                      Pass #{r.passCount}
                    </span>
                  </div>
                  <p className="font-sans text-gray-800 font-medium">
                    {r.topic?.title || "Revision Topic"}
                  </p>
                </div>
              ))}

              {data.urgentRevisions.length === 0 && (
                <p className="text-xs font-mono text-gray-400 py-3 text-center">
                  ✓ Spaced revision queue is clear for today!
                </p>
              )}
            </div>
          </div>

          {data.weakAreas.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-gray-100 pb-1">
                <span className="text-[#991b1b] font-bold uppercase text-[10px]">
                  ⚠️ Attention Areas
                </span>
                <Link
                  href="/analytics"
                  className="text-gray-400 hover:text-gray-700 text-[10px]"
                >
                  Deep Analytics
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {data.weakAreas.map((w) => (
                  <span
                    key={w.subject}
                    className="px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-800 text-[11px] font-semibold"
                  >
                    {w.subject} ({w.count} errors)
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-3 font-mono text-xs">
            <h4 className="font-serif font-bold text-gray-900 text-base">
              Quick Action Hub
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/study-log"
                className="p-2 text-center bg-[#0f172a] text-white rounded hover:bg-black font-semibold shadow-2xs"
              >
                ⏱️ Focus Timer
              </Link>
              <Link
                href="/mock-tests"
                className="p-2 text-center bg-white border border-gray-300 text-gray-800 rounded hover:bg-gray-50 font-medium"
              >
                📝 Log Test
              </Link>
              <Link
                href="/journal"
                className="p-2 text-center bg-white border border-gray-300 text-gray-800 rounded hover:bg-gray-50 font-medium"
              >
                📓 Day Review
              </Link>
              <Link
                href="/resources"
                className="p-2 text-center bg-white border border-gray-300 text-gray-800 rounded hover:bg-gray-50 font-medium"
              >
                📦 Study Links
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}