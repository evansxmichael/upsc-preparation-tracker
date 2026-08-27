"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export type TaskSource = "MANUAL" | "STUDY_LOG" | "MISTAKE_BOOK";

interface SubjectOption {
  id: string;
  name: string;
  topics: { id: string; title: string }[];
}

interface RevisionTaskItem {
  id: string;
  lastStudiedDate: string;
  nextDueDate: string;
  intervalDays: number;
  passCount: number;
  isCompleted: boolean;
  completedAt?: string | null;
  notes?: string | null;
  source: TaskSource;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; title: string } | null;
}

export default function RevisionPage() {
  const [tasks, setTasks] = useState<RevisionTaskItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [upcomingFilterDate, setUpcomingFilterDate] = useState("");
  const [completedFilterDate, setCompletedFilterDate] = useState("");

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RevisionTaskItem | null>(null);

  // Form State for new topic
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [modalLastStudied, setModalLastStudied] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [modalNextDue, setModalNextDue] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [modalNotes, setModalNotes] = useState("");

  const toInputDate = (dStr: string) => {
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  };

  const calculateDaysDiff = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const getDaysUntilDue = (dueDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dueDateStr);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [revRes, sylRes] = await Promise.all([
        fetch("/api/revision"),
        fetch("/api/syllabus"),
      ]);

      if (revRes.ok) {
        const revData = await revRes.json();
        setTasks(revData);
      }

      if (sylRes.ok) {
        const sylData = await sylRes.json();
        const extracted: SubjectOption[] = sylData.flatMap(
          (c: any) => c.subjects || []
        );
        setSubjects(extracted);
        if (extracted.length > 0) setSelectedSubjectId(extracted[0].id);
      }
    } catch (e) {
      console.error("Failed to fetch revision data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Action: Mark Revised (Advance pass, reset start to today + interval)
  const handleMarkRevised = async (task: RevisionTaskItem) => {
    try {
      const res = await fetch("/api/revision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, action: "MARK_REVISED" }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      }
    } catch (e) {
      console.error("Failed to mark revised", e);
    }
  };

  // Action: Complete (Send to Completed section)
  const handleCompleteTask = async (task: RevisionTaskItem) => {
    try {
      const res = await fetch("/api/revision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, action: "COMPLETE" }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      }
    } catch (e) {
      console.error("Failed to complete task", e);
    }
  };

  // Action: Reopen completed task back to active schedule
  const handleReopenTask = async (task: RevisionTaskItem) => {
    try {
      const res = await fetch("/api/revision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, action: "REOPEN" }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      }
    } catch (e) {
      console.error("Failed to reopen task", e);
    }
  };

  // Action: Inline Date Change (recalculates interval days & syncs to DB)
  const handleUpdateDates = async (
    taskId: string,
    newLastStudied: string,
    newNextDue: string
  ) => {
    const calculatedInterval = calculateDaysDiff(newLastStudied, newNextDue);

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              lastStudiedDate: newLastStudied,
              nextDueDate: newNextDue,
              intervalDays: calculatedInterval,
            }
          : t
      )
    );

    try {
      await fetch("/api/revision", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          action: "UPDATE_DATES",
          lastStudiedDate: newLastStudied,
          nextDueDate: newNextDue,
          intervalDays: calculatedInterval,
        }),
      });
    } catch (e) {
      console.error("Failed to sync updated dates to DB", e);
    }
  };

  // Action: Add New Manual Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const interval = calculateDaysDiff(modalLastStudied, modalNextDue);

    try {
      const res = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubjectId || null,
          topicId: selectedTopicId || null,
          lastStudiedDate: modalLastStudied,
          nextDueDate: modalNextDue,
          intervalDays: interval,
          notes: modalNotes.trim() || null,
        }),
      });

      if (res.ok) {
        const newTask = await res.json();
        setTasks((prev) => [...prev, newTask]);
        setModalNotes("");
        setShowAddModal(false);
      }
    } catch (e) {
      console.error("Failed to schedule revision", e);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/revision?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTasks((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      }
    } catch (e) {
      console.error("Failed to delete task", e);
    }
    setDeleteTarget(null);
  };

  // Categorize Tasks
  const activeTasks = tasks.filter((t) => !t.isCompleted);
  const completedTasks = tasks.filter((t) => t.isCompleted);

  const dueTodayTasks = activeTasks.filter(
    (t) => getDaysUntilDue(t.nextDueDate) <= 0
  );

  let upcomingTasks = activeTasks.filter(
    (t) => getDaysUntilDue(t.nextDueDate) > 0
  );
  if (upcomingFilterDate) {
    upcomingTasks = upcomingTasks.filter(
      (t) => toInputDate(t.nextDueDate) === upcomingFilterDate
    );
  }

  let filteredCompletedTasks = completedTasks;
  if (completedFilterDate) {
    filteredCompletedTasks = filteredCompletedTasks.filter(
      (t) => toInputDate(t.completedAt || t.nextDueDate) === completedFilterDate
    );
  }

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        Loading spaced repetition schedule...
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none pb-28">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            SPACED REPETITION & MASTERY ENGINE
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            Revision Scheduler
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a] text-white rounded text-xs font-mono hover:bg-black shadow-2xs transition cursor-pointer font-medium"
        >
          <span>+</span> Schedule Topic
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Due Today / Overdue
          </span>
          <p className="text-2xl font-serif font-bold text-amber-600 mt-1">
            {dueTodayTasks.length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Upcoming Active
          </span>
          <p className="text-2xl font-mono font-bold text-blue-700 mt-1">
            {upcomingTasks.length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Completed / Mastered
          </span>
          <p className="text-2xl font-mono font-bold text-emerald-700 mt-1">
            {completedTasks.length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Total Revisions
          </span>
          <p className="text-2xl font-serif font-bold text-[#0f172a] mt-1">
            {tasks.length}
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: REVISIONS DUE TODAY (No calendar filter needed)  */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800">
            Revisions Due Today ({dueTodayTasks.length})
          </h3>
        </div>

        <div className="space-y-3">
          {dueTodayTasks.map((t) => (
            <RevisionCardItem
              key={t.id}
              task={t}
              status="today"
              onMarkRevised={() => handleMarkRevised(t)}
              onComplete={() => handleCompleteTask(t)}
              onDelete={() => setDeleteTarget(t)}
              onUpdateDates={handleUpdateDates}
              toInputDate={toInputDate}
            />
          ))}

          {dueTodayTasks.length === 0 && (
            <div className="p-5 bg-white border border-dashed border-gray-200 rounded-lg text-center text-xs font-mono text-gray-400">
              ✓ All clear! No revisions pending for today.
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2: UPCOMING SCHEDULE (With Date Filter at Header)     */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#0f172a]">
              Upcoming Schedule ({upcomingTasks.length})
            </h3>
          </div>

          {/* Calendar Filter Bar */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-gray-400 text-[11px]">Filter target date:</span>
            <input
              type="date"
              value={upcomingFilterDate}
              onChange={(e) => setUpcomingFilterDate(e.target.value)}
              className="px-2 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-hidden"
            />
            {upcomingFilterDate && (
              <button
                onClick={() => setUpcomingFilterDate("")}
                className="text-[11px] text-gray-500 hover:text-black underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {upcomingTasks.map((t) => (
            <RevisionCardItem
              key={t.id}
              task={t}
              status="upcoming"
              onMarkRevised={() => handleMarkRevised(t)}
              onComplete={() => handleCompleteTask(t)}
              onDelete={() => setDeleteTarget(t)}
              onUpdateDates={handleUpdateDates}
              toInputDate={toInputDate}
            />
          ))}

          {upcomingTasks.length === 0 && (
            <div className="p-5 bg-white border border-dashed border-gray-200 rounded-lg text-center text-xs font-mono text-gray-400">
              {upcomingFilterDate
                ? `No upcoming revisions scheduled for ${upcomingFilterDate}.`
                : "No upcoming revisions scheduled."}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: COMPLETED REVISIONS (With Date Filter at Header)   */}
      {/* ============================================================ */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              Completed Revisions ({filteredCompletedTasks.length})
            </h3>
          </div>

          {/* Calendar Filter Bar */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-gray-400 text-[11px]">Filter completed date:</span>
            <input
              type="date"
              value={completedFilterDate}
              onChange={(e) => setCompletedFilterDate(e.target.value)}
              className="px-2 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-hidden"
            />
            {completedFilterDate && (
              <button
                onClick={() => setCompletedFilterDate("")}
                className="text-[11px] text-gray-500 hover:text-black underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filteredCompletedTasks.map((t) => (
            <RevisionCardItem
              key={t.id}
              task={t}
              status="completed"
              onReopen={() => handleReopenTask(t)}
              onDelete={() => setDeleteTarget(t)}
              onUpdateDates={handleUpdateDates}
              toInputDate={toInputDate}
            />
          ))}

          {filteredCompletedTasks.length === 0 && (
            <div className="p-5 bg-white border border-dashed border-gray-200 rounded-lg text-center text-xs font-mono text-gray-400">
              {completedFilterDate
                ? `No completed revisions matching ${completedFilterDate}.`
                : "No revisions marked as permanently completed yet."}
            </div>
          )}
        </div>
      </div>

      {/* Add Topic Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-gray-900 text-lg">
              Schedule Spaced Revision
            </h3>
            <form onSubmit={handleAddTask} className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedTopicId("");
                    }}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Topic</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    <option value="">-- Optional Topic --</option>
                    {currentSubject?.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dual Calendars */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">📅 Start Date</label>
                  <input
                    type="date"
                    required
                    value={modalLastStudied}
                    onChange={(e) => setModalLastStudied(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">🎯 Target Date</label>
                  <input
                    type="date"
                    required
                    value={modalNextDue}
                    onChange={(e) => setModalNextDue(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-gray-500 mb-1">
                  Notes / Reminders
                </label>
                <textarea
                  rows={2}
                  placeholder="Key articles, tables, or formula to review..."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 font-mono">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#0f172a] text-white hover:bg-black font-bold cursor-pointer"
                >
                  Schedule Topic
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Revision Task"
        message={`Are you sure you want to stop tracking revisions for "${
          deleteTarget?.topic?.title || deleteTarget?.subject?.name || "this topic"
        }"?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function RevisionCardItem({
  task,
  status,
  onMarkRevised,
  onComplete,
  onReopen,
  onDelete,
  onUpdateDates,
  toInputDate,
}: {
  task: RevisionTaskItem;
  status: "today" | "upcoming" | "completed";
  onMarkRevised?: () => void;
  onComplete?: () => void;
  onReopen?: () => void;
  onDelete: () => void;
  onUpdateDates: (id: string, start: string, end: string) => void;
  toInputDate: (dStr: string) => string;
}) {
  const [startDate, setStartDate] = useState(toInputDate(task.lastStudiedDate));
  const [targetDate, setTargetDate] = useState(toInputDate(task.nextDueDate));

  useEffect(() => {
    setStartDate(toInputDate(task.lastStudiedDate));
    setTargetDate(toInputDate(task.nextDueDate));
  }, [task.lastStudiedDate, task.nextDueDate]);

  const handleStartChange = (val: string) => {
    setStartDate(val);
    onUpdateDates(task.id, val, targetDate);
  };

  const handleTargetChange = (val: string) => {
    setTargetDate(val);
    onUpdateDates(task.id, startDate, val);
  };

  const badgeBorder =
    status === "today"
      ? "border-l-4 border-l-amber-500"
      : status === "completed"
      ? "border-l-4 border-l-emerald-600 opacity-85"
      : "border-l-4 border-l-blue-600";

  const sourceBadge =
    task.source === "STUDY_LOG" ? (
      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
        via Study Log
      </span>
    ) : task.source === "MISTAKE_BOOK" ? (
      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
        via Mistake Log
      </span>
    ) : null;

  return (
    <div
      className={`bg-white ${badgeBorder} border-t border-r border-b border-gray-200 rounded-r-lg p-4 shadow-2xs hover:border-gray-300 transition space-y-3`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase text-[#991b1b]">
              {task.subject?.name || "General"}
            </span>
            {task.topic && (
              <>
                <span className="text-gray-300">•</span>
                <h4 className="font-serif font-bold text-gray-900 text-base">
                  {task.topic.title}
                </h4>
              </>
            )}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
              Pass #{task.passCount}
            </span>
            {sourceBadge}
          </div>

          {task.notes && (
            <p className="text-xs text-gray-600 font-sans">{task.notes}</p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 font-mono self-end md:self-auto">
          {status !== "completed" ? (
            <>
              <button
                onClick={onMarkRevised}
                className="px-3 py-1.5 text-xs font-bold rounded bg-[#0f172a] text-white hover:bg-black transition cursor-pointer shadow-2xs"
                title="Advance to next spaced interval"
              >
                ✓ Mark Revised
              </button>
              <button
                onClick={onComplete}
                className="px-3 py-1.5 text-xs font-bold rounded bg-emerald-700 text-white hover:bg-emerald-800 transition cursor-pointer shadow-2xs"
                title="Mark completely done and remove from active schedule"
              >
                ✓ Complete
              </button>
            </>
          ) : (
            <button
              onClick={onReopen}
              className="px-3 py-1.5 text-xs font-bold rounded bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 transition cursor-pointer"
              title="Return to active revision schedule"
            >
              ↺ Reopen Schedule
            </button>
          )}

          <button
            onClick={onDelete}
            className="text-gray-300 hover:text-red-600 p-1.5 transition cursor-pointer text-base"
            title="Delete Record"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Inline Calendar Edit Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 font-mono text-xs items-center">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[11px]">Start:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleStartChange(e.target.value)}
            className="px-2 py-1 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-[11px]">Next Target:</span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => handleTargetChange(e.target.value)}
            className="px-2 py-1 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
          />
        </div>

        <div className="text-right text-gray-500 text-[11px]">
          Interval: <strong className="text-gray-900">{task.intervalDays} days</strong>
        </div>
      </div>
    </div>
  );
}