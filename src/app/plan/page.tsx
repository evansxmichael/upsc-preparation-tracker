"use client";

import { useState, useEffect, useMemo } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface PlanPhase {
  id: string;
  name: string;
  weeks: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

const DEFAULT_INITIAL_PHASES: PlanPhase[] = [
  { id: "p1", name: "Polity (Laxmikanth)", weeks: 3, startDate: "2026-08-24", endDate: "2026-09-13" },
  { id: "p2", name: "Ancient + Medieval History", weeks: 2, startDate: "2026-09-14", endDate: "2026-09-27" },
  { id: "p3", name: "Modern History", weeks: 2, startDate: "2026-09-28", endDate: "2026-10-11" },
  { id: "p4", name: "Art & Culture", weeks: 1, startDate: "2026-10-12", endDate: "2026-10-18" },
  { id: "p5", name: "Physical Geography", weeks: 2, startDate: "2026-10-19", endDate: "2026-11-01" },
  { id: "p6", name: "Indian + World Geography", weeks: 2, startDate: "2026-11-02", endDate: "2026-11-15" },
  { id: "p7", name: "Economy", weeks: 3, startDate: "2026-11-16", endDate: "2026-12-06" },
  { id: "p8", name: "Environment & Ecology", weeks: 2, startDate: "2026-12-07", endDate: "2026-12-20" },
  { id: "p9", name: "Science & Tech basics", weeks: 1, startDate: "2026-12-21", endDate: "2026-12-27" },
  { id: "p10", name: "Buffer + 1st revision pass", weeks: 2, startDate: "2026-12-28", endDate: "2027-01-10" },
];

export default function StudyPlanPage() {
  const [phases, setPhases] = useState<PlanPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const [deleteTarget, setDeleteTarget] = useState<PlanPhase | null>(null);

  // Helper date utilities
  const formatDateDisplay = (dateObj: Date) => {
    return dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const toInputDateStr = (d: Date) => {
    return d.toISOString().slice(0, 10);
  };

  // Add days to date string
  const calculateEndDateFromWeeks = (startDateStr: string, weeks: number) => {
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) return startDateStr;
    const end = new Date(start);
    end.setDate(end.getDate() + Math.max(1, weeks) * 7 - 1);
    return toInputDateStr(end);
  };

  // Calculate weeks from date range
  const calculateWeeksFromDates = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return 1;
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24) + 1;
    return Math.max(1, Math.round(diffDays / 7));
  };

  // Fetch plan from PostgreSQL
  const fetchPlan = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/plan");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPhases(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              weeks: p.weeks || 2,
              startDate: p.startDate ? toInputDateStr(new Date(p.startDate)) : "2026-08-24",
              endDate: p.endDate ? toInputDateStr(new Date(p.endDate)) : "2026-09-06",
            }))
          );
        } else {
          setPhases(DEFAULT_INITIAL_PHASES);
        }
      }
    } catch (e) {
      console.error("Failed to load study plan", e);
      setPhases(DEFAULT_INITIAL_PHASES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const markUnsaved = () => {
    setHasUnsavedChanges(true);
    setSaveStatus("unsaved");
  };

  // Dynamic Header Timeline Calculation with Overlap Handling
  const summaryTimeline = useMemo(() => {
    if (phases.length === 0) {
      return {
        earliestStartText: "Not set",
        latestEndText: "Not set",
        totalDistinctWeeks: 0,
        totalPlanElapsedPercent: 0,
      };
    }

    const validStarts = phases
      .map((p) => new Date(p.startDate).getTime())
      .filter((t) => !isNaN(t));
    const validEnds = phases
      .map((p) => new Date(p.endDate).getTime())
      .filter((t) => !isNaN(t));

    if (validStarts.length === 0 || validEnds.length === 0) {
      return {
        earliestStartText: "Not set",
        latestEndText: "Not set",
        totalDistinctWeeks: 0,
        totalPlanElapsedPercent: 0,
      };
    }

    const minStartTime = Math.min(...validStarts);
    const maxEndTime = Math.max(...validEnds);

    const minStartDate = new Date(minStartTime);
    const maxEndDate = new Date(maxEndTime);

    // Global distinct span
    const totalSpanDays = (maxEndTime - minStartTime) / (1000 * 3600 * 24) + 1;
    const totalDistinctWeeks = Math.max(1, Math.round(totalSpanDays / 7));

    // Global elapsed calculation against today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const elapsedDays = (today.getTime() - minStartTime) / (1000 * 3600 * 24);
    const totalPlanElapsedPercent =
      totalSpanDays > 0
        ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalSpanDays) * 100)))
        : 0;

    return {
      earliestStartText: formatDateDisplay(minStartDate),
      latestEndText: formatDateDisplay(maxEndDate),
      totalDistinctWeeks,
      totalPlanElapsedPercent,
    };
  }, [phases]);

  // Phase Mutation Handlers
  const handleUpdateName = (id: string, name: string) => {
    setPhases((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    markUnsaved();
  };

  const handleUpdateWeeks = (id: string, weeks: number) => {
    const validWeeks = Math.max(1, weeks);
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newEndDate = calculateEndDateFromWeeks(p.startDate, validWeeks);
        return { ...p, weeks: validWeeks, endDate: newEndDate };
      })
    );
    markUnsaved();
  };

  const handleUpdateStartDate = (id: string, newStartDate: string) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newEndDate = calculateEndDateFromWeeks(newStartDate, p.weeks);
        return { ...p, startDate: newStartDate, endDate: newEndDate };
      })
    );
    markUnsaved();
  };

  const handleUpdateEndDate = (id: string, newEndDate: string) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const newWeeks = calculateWeeksFromDates(p.startDate, newEndDate);
        return { ...p, endDate: newEndDate, weeks: newWeeks };
      })
    );
    markUnsaved();
  };

  const handleAddPhase = () => {
    const lastPhase = phases[phases.length - 1];
    const defaultStart = lastPhase ? lastPhase.endDate : toInputDateStr(new Date());
    const defaultEnd = calculateEndDateFromWeeks(defaultStart, 2);

    const newPhase: PlanPhase = {
      id: `phase-${Date.now()}`,
      name: "New Custom Study Phase",
      weeks: 2,
      startDate: defaultStart,
      endDate: defaultEnd,
    };

    setPhases((prev) => [...prev, newPhase]);
    markUnsaved();
  };

  const confirmDeletePhase = () => {
    if (!deleteTarget) return;
    setPhases((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    markUnsaved();
  };

  const handleSaveToDb = async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phases }),
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        setSaveStatus("saved");
      } else {
        setSaveStatus("unsaved");
      }
    } catch (e) {
      console.error("Failed to save plan to database", e);
      setSaveStatus("unsaved");
    }
  };

  const handleReset = async () => {
    if (window.confirm("Reload study plan and discard any unsaved changes?")) {
      await fetchPlan();
      setHasUnsavedChanges(false);
      setSaveStatus("saved");
    }
  };

  const handleBackup = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(phases, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `upsc_study_plan_schedule_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        Loading multi-subject schedule...
      </div>
    );
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Top Header & Actions */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            CONCURRENT STAGE SCHEDULER
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            UPSC 2027 Study Plan
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer"
          >
            <span>📥</span> Backup
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer"
          >
            <span>🔄</span> Sync DB
          </button>
        </div>
      </div>

      {/* Main Header Summary Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold block mb-1">
              OVERALL TIMELINE SPAN
            </span>
            <p className="text-lg font-serif font-bold text-[#0f172a]">
              {summaryTimeline.earliestStartText} <span className="text-gray-400 font-sans font-normal">to</span> {summaryTimeline.latestEndText}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500 font-semibold block mb-1">
              TOTAL EFFECTIVE DURATION (INCL. PARALLEL WEEKS)
            </span>
            <p className="text-lg font-serif font-bold text-[#991b1b]">
              {summaryTimeline.totalDistinctWeeks} distinct weeks
            </p>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="space-y-1 pt-2 border-t border-gray-100">
          <div className="w-full bg-[#e5e7eb] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#0f172a] h-full transition-all duration-300"
              style={{ width: `${summaryTimeline.totalPlanElapsedPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-mono text-gray-500">
            <span>{summaryTimeline.totalPlanElapsedPercent}% of overall preparation period elapsed</span>
            <span>{phases.length} Total Subjects / Phases</span>
          </div>
        </div>
      </div>

      {/* Subject Phases List */}
      <div className="space-y-4">
        {phases.map((phase) => {
          const startDate = new Date(phase.startDate);
          const endDate = new Date(phase.endDate);

          let status: "In progress" | "Upcoming" | "Completed" = "Upcoming";
          let progressPercent = 0;

          if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
            if (today > endDate) {
              status = "Completed";
              progressPercent = 100;
            } else if (today >= startDate && today <= endDate) {
              status = "In progress";
              const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24) + 1;
              const elapsed = (today.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
              progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDays) * 100)));
            }
          }

          const isInProgress = status === "In progress";

          return (
            <div
              key={phase.id}
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4 relative group"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                {/* Status Indicator */}
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                      isInProgress
                        ? "bg-[#991b1b] animate-pulse"
                        : status === "Completed"
                        ? "bg-emerald-600"
                        : "bg-gray-300"
                    }`}
                  />
                </div>

                {/* Phase Name Input */}
                <div className="flex-1 w-full">
                  <input
                    type="text"
                    value={phase.name}
                    onChange={(e) => handleUpdateName(phase.id, e.target.value)}
                    className="w-full px-3 py-1.5 text-base font-serif font-bold text-[#0f172a] bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden focus:border-gray-400"
                  />
                </div>

                {/* Custom Duration Input */}
                <div className="flex items-center gap-2 font-mono text-sm self-end md:self-auto">
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={phase.weeks}
                    onChange={(e) =>
                      handleUpdateWeeks(phase.id, parseInt(e.target.value) || 1)
                    }
                    className="w-14 px-2 py-1.5 text-center bg-[#fbfbf9] border border-gray-200 rounded font-mono text-sm text-gray-800 focus:outline-hidden focus:border-gray-400"
                  />
                  <span className="text-gray-500 text-xs">wk</span>

                  <button
                    onClick={() => setDeleteTarget(phase)}
                    className="text-gray-400 hover:text-red-600 p-1.5 transition cursor-pointer text-sm ml-1"
                    title="Delete Phase"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Individual Calendar Pickers for Start and End Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={phase.startDate}
                    onChange={(e) => handleUpdateStartDate(phase.id, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#fbfbf9] border border-gray-200 rounded font-mono text-gray-800 focus:outline-hidden focus:border-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={phase.endDate}
                    onChange={(e) => handleUpdateEndDate(phase.id, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-[#fbfbf9] border border-gray-200 rounded font-mono text-gray-800 focus:outline-hidden focus:border-gray-400"
                  />
                </div>
              </div>

              {/* Status Meta Line */}
              <div className="flex justify-between items-center text-xs font-mono text-gray-500 pt-1 border-t border-gray-100">
                <span>
                  {formatDateDisplay(startDate)} – {formatDateDisplay(endDate)}
                </span>
                <span className={`font-semibold ${isInProgress ? "text-[#991b1b]" : status === "Completed" ? "text-emerald-700" : "text-gray-400"}`}>
                  {status}
                </span>
              </div>

              {/* Individual Subject Micro Progress Bar */}
              <div className="w-full bg-[#e5e7eb] h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isInProgress
                      ? "bg-[#991b1b]"
                      : status === "Completed"
                      ? "bg-emerald-600"
                      : "bg-transparent"
                  }`}
                  style={{
                    width: `${progressPercent}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Subject Phase Button */}
      <div>
        <button
          onClick={handleAddPhase}
          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded text-xs font-mono text-gray-700 shadow-2xs transition cursor-pointer"
        >
          <span>+</span> Add Parallel or Sequential Subject
        </button>
      </div>

      {/* Bottom Sticky Save Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-[#fbfbf9]/95 backdrop-blur-xs border-t border-gray-200 p-4 flex justify-between items-center px-8 z-40">
        <span className="text-xs font-mono text-gray-500">
          {saveStatus === "saved" ? (
            <span className="text-emerald-700 font-medium">✓ All changes saved</span>
          ) : saveStatus === "saving" ? (
            <span className="text-blue-700 font-medium">● Saving schedule changes...</span>
          ) : (
            <span className="text-amber-700 font-medium">● Unsaved schedule modifications</span>
          )}
        </span>
        <button
          onClick={handleSaveToDb}
          disabled={!hasUnsavedChanges}
          className={`flex items-center gap-2 px-5 py-2 text-xs font-mono font-bold rounded shadow-xs transition ${
            hasUnsavedChanges
              ? "bg-[#0f172a] text-white hover:bg-black cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <span>💾</span> Save Schedule
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Confirm Phase Deletion"
        message={`Are you sure you want to delete "${deleteTarget?.name}" from your preparation schedule?`}
        onConfirm={confirmDeletePhase}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}