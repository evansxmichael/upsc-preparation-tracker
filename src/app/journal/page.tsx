"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export interface JournalEntry {
  id: string;
  date: string;
  studiedSummary: string;
  accomplishments?: string | null;
  obstacles?: string | null;
  keyLearnings?: string | null;
  tomorrowPlan?: string | null;
  confidenceRating: number;
  energyRating: number;
  disciplineRating: number;
  createdAt: string;
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Advanced Filtration States
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("ALL");

  // Modal & Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JournalEntry | null>(null);

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [studiedSummary, setStudiedSummary] = useState("");
  const [accomplishments, setAccomplishments] = useState("");
  const [obstacles, setObstacles] = useState("");
  const [keyLearnings, setKeyLearnings] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [confidenceRating, setConfidenceRating] = useState(4);
  const [energyRating, setEnergyRating] = useState(4);
  const [disciplineRating, setDisciplineRating] = useState(5);

  // Fetch entries from PostgreSQL
  const fetchJournalEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/journal");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (e) {
      console.error("Failed to load journal entries from DB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJournalEntries();
  }, []);

  // Quick Preset Handlers
  const handleSetQuickPreset = (preset: "ALL" | "7D" | "30D") => {
    if (preset === "ALL") {
      setFilterStartDate("");
      setFilterEndDate("");
      return;
    }
    const today = new Date();
    const start = new Date();
    const days = preset === "7D" ? 7 : 30;
    start.setDate(today.getDate() - days);

    setFilterStartDate(start.toISOString().slice(0, 10));
    setFilterEndDate(today.toISOString().slice(0, 10));
  };

  // Filter Engine
  const filteredEntries = entries.filter((entry) => {
    const entryDateObj = new Date(entry.date).getTime();

    // Date Range Filtration
    if (filterStartDate) {
      const startObj = new Date(filterStartDate).getTime();
      if (entryDateObj < startObj) return false;
    }

    if (filterEndDate) {
      const endObj = new Date(filterEndDate).getTime();
      if (entryDateObj > endObj) return false;
    }

    // Discipline Rating Filter
    if (disciplineFilter !== "ALL") {
      const targetRating = parseInt(disciplineFilter);
      if (entry.disciplineRating < targetRating) return false;
    }

    // Search Query (across text fields)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSummary = entry.studiedSummary?.toLowerCase().includes(q);
      const matchAccomplish = entry.accomplishments?.toLowerCase().includes(q);
      const matchObstacles = entry.obstacles?.toLowerCase().includes(q);
      const matchLearnings = entry.keyLearnings?.toLowerCase().includes(q);
      const matchPlan = entry.tomorrowPlan?.toLowerCase().includes(q);

      if (
        !matchSummary &&
        !matchAccomplish &&
        !matchObstacles &&
        !matchLearnings &&
        !matchPlan
      ) {
        return false;
      }
    }

    return true;
  });

  // Dynamic Calculated Metrics (Based on filtered subset)
  const totalCount = filteredEntries.length;
  const avgDiscipline =
    totalCount > 0
      ? (
          filteredEntries.reduce((a, b) => a + b.disciplineRating, 0) / totalCount
        ).toFixed(1)
      : "0.0";
  const avgEnergy =
    totalCount > 0
      ? (
          filteredEntries.reduce((a, b) => a + b.energyRating, 0) / totalCount
        ).toFixed(1)
      : "0.0";
  const avgConfidence =
    totalCount > 0
      ? (
          filteredEntries.reduce((a, b) => a + b.confidenceRating, 0) / totalCount
        ).toFixed(1)
      : "0.0";

  // Actions
  const handleAddEntry = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!studiedSummary.trim()) return;

  try {
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        studiedSummary: studiedSummary.trim(),
        accomplishments: accomplishments.trim() || null,
        obstacles: obstacles.trim() || null,
        keyLearnings: keyLearnings.trim() || null,
        tomorrowPlan: tomorrowPlan.trim() || null,
        confidenceRating,
        energyRating,
        disciplineRating,
      }),
    });

    if (res.ok) {
      const saved = await res.json();
      // Append the new saved entity to the list without dropping older entries
      setEntries((prev) => [saved, ...prev]);
      setStudiedSummary("");
      setAccomplishments("");
      setObstacles("");
      setKeyLearnings("");
      setTomorrowPlan("");
      setShowAddModal(false);
    }
  } catch (err) {
    console.error("Failed to save journal review to DB", err);
  }
};

const executeDelete = async () => {
  if (!deleteTarget) return;

  try {
    const res = await fetch(`/api/journal?id=${deleteTarget.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setEntries((prev) => prev.filter((item) => item.id !== deleteTarget.id));
    }
  } catch (err) {
    console.error("Failed to delete entry from DB", err);
  }

  setDeleteTarget(null);
};

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        Loading journal reviews...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            DAILY REVIEW & ACCOUNTABILITY SYSTEM
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            Aspirant Journal
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a] text-white rounded text-xs font-mono hover:bg-black shadow-2xs transition cursor-pointer font-medium"
        >
          <span>+</span> Write Review
        </button>
      </div>

      {/* Dynamic KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Filtered Entries
          </span>
          <p className="text-2xl font-serif font-bold text-[#0f172a] mt-1">
            {totalCount}
            <span className="text-xs font-normal text-gray-400 font-mono ml-1">
              / {entries.length}
            </span>
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Discipline Index
          </span>
          <p className="text-2xl font-mono font-bold text-emerald-700 mt-1">
            {avgDiscipline}{" "}
            <span className="text-xs font-normal text-gray-400">/ 5</span>
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Avg Energy
          </span>
          <p className="text-2xl font-mono font-bold text-blue-800 mt-1">
            {avgEnergy}{" "}
            <span className="text-xs font-normal text-gray-400">/ 5</span>
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Confidence
          </span>
          <p className="text-2xl font-mono font-bold text-amber-600 mt-1">
            {avgConfidence}{" "}
            <span className="text-xs font-normal text-gray-400">/ 5</span>
          </p>
        </div>
      </div>

      {/* Advanced Multi-Dimensional Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          {/* Keyword Search */}
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              placeholder="Search in reviews, friction points, insights..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden font-sans text-xs"
            />
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleSetQuickPreset("ALL")}
              className={`px-2.5 py-1 rounded cursor-pointer transition ${
                !filterStartDate && !filterEndDate
                  ? "bg-[#0f172a] text-white font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleSetQuickPreset("7D")}
              className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleSetQuickPreset("30D")}
              className="px-2.5 py-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer transition"
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Dual Date Range & Score Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px]">From:</span>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="px-2 py-1 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px]">To:</span>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="px-2 py-1 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            {(filterStartDate || filterEndDate || searchQuery || disciplineFilter !== "ALL") && (
              <button
                onClick={() => {
                  setFilterStartDate("");
                  setFilterEndDate("");
                  setSearchQuery("");
                  setDisciplineFilter("ALL");
                }}
                className="px-2 py-1 text-[11px] bg-red-50 text-red-700 hover:bg-red-100 rounded transition cursor-pointer font-bold"
              >
                Reset All Filters
              </button>
            )}
          </div>

          {/* Discipline Level Selector */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-[11px]">Discipline:</span>
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="px-2 py-1 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
            >
              <option value="ALL">All Levels</option>
              <option value="5">⭐⭐⭐⭐⭐ (5/5 Only)</option>
              <option value="4">⭐⭐⭐⭐ (4+ High Focus)</option>
              <option value="3">⭐⭐⭐ (3+ Average)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Journal Entries Feed */}
      <div className="space-y-5">
        {filteredEntries.map((entry) => (
          <article
            key={entry.id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-2xs hover:border-gray-300 transition-all space-y-5"
          >
            {/* Header / Date & Scores */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-base font-serif font-bold text-[#0f172a]">
                  {formatDateLabel(entry.date)}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  • Logged{" "}
                  {new Date(entry.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {/* Metric Badges */}
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    Discipline {entry.disciplineRating}/5
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-semibold">
                    Energy {entry.energyRating}/5
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                    Confidence {entry.confidenceRating}/5
                  </span>
                </div>

                <button
                  onClick={() => setDeleteTarget(entry)}
                  className="text-gray-300 hover:text-red-600 p-1 transition cursor-pointer text-sm"
                  title="Delete Entry"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Core Study Narrative */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 font-semibold block">
                Study Execution & Progress
              </span>
              <p className="text-gray-900 font-sans text-sm leading-relaxed font-medium">
                {entry.studiedSummary}
              </p>
              {entry.accomplishments && (
                <div className="flex items-start gap-2 text-xs text-emerald-800 bg-emerald-50/50 p-2.5 rounded border border-emerald-100 font-sans">
                  <span className="font-bold">✓ Key Milestone:</span>
                  <span>{entry.accomplishments}</span>
                </div>
              )}
            </div>

            {/* 3-Column Structured Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Obstacles */}
              <div className="p-3.5 bg-[#fbfbf9] border border-gray-200 rounded space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-red-800 font-bold">
                  <span>⚠️ Friction & Obstacles</span>
                </div>
                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  {entry.obstacles || "No major setbacks recorded."}
                </p>
              </div>

              {/* Key Insights */}
              <div className="p-3.5 bg-[#fbfbf9] border border-gray-200 rounded space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-blue-800 font-bold">
                  <span>💡 Conceptual Realization</span>
                </div>
                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  {entry.keyLearnings || "Standard progression."}
                </p>
              </div>

              {/* Next Targets */}
              <div className="p-3.5 bg-[#fbfbf9] border border-gray-200 rounded space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#0f172a] font-bold">
                  <span>🎯 Tomorrow's Target</span>
                </div>
                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  {entry.tomorrowPlan || "Continue syllabus plan."}
                </p>
              </div>
            </div>
          </article>
        ))}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
            <p className="text-xs font-mono text-gray-400">
              {searchQuery || filterStartDate || filterEndDate || disciplineFilter !== "ALL"
                ? "No daily reviews found matching your active filter criteria."
                : "No daily reflections logged yet."}
            </p>
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl w-full mx-4 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-gray-900 text-lg">
              Daily Preparation Review
            </h3>
            <form onSubmit={handleAddEntry} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-mono text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-mono text-gray-500 mb-1">
                  What did you study today?
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Chapters, topics, question sets finished..."
                  value={studiedSummary}
                  onChange={(e) => setStudiedSummary(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-mono text-gray-500 mb-1">
                  Accomplishments & Wins
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5 hours pure focus, zero distractions"
                  value={accomplishments}
                  onChange={(e) => setAccomplishments(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-gray-500 mb-1">
                    Friction / Obstacles
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Wasted time, low stamina, difficult topic..."
                    value={obstacles}
                    onChange={(e) => setObstacles(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  />
                </div>
                <div>
                  <label className="block font-mono text-gray-500 mb-1">
                    Key Conceptual Realization
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Core lesson learned today..."
                    value={keyLearnings}
                    onChange={(e) => setKeyLearnings(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-gray-500 mb-1">
                  Target for Tomorrow
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finish Modern History spectrum, 1 GS-2 answer"
                  value={tomorrowPlan}
                  onChange={(e) => setTomorrowPlan(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-3 gap-3 pt-1 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">Discipline (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={disciplineRating}
                    onChange={(e) => setDisciplineRating(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Energy (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={energyRating}
                    onChange={(e) => setEnergyRating(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Confidence (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={confidenceRating}
                    onChange={(e) => setConfidenceRating(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 font-mono">
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
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Journal Entry"
        message={`Are you sure you want to remove the review for ${
          deleteTarget ? formatDateLabel(deleteTarget.date) : "this day"
        }?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}