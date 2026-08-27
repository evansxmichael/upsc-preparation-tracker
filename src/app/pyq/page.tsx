"use client";

import { useState, useEffect, useMemo } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface SubjectOption {
  id: string;
  name: string;
  category?: {
    id: string;
    title: string;
    tier: string;
  } | null;
  topics: { id: string; title: string }[];
}

interface PyqAttemptItem {
  id: string;
  year: number;
  paper: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unattempted: number;
  scoreCalculated: number;
  accuracyPct: number;
  notes?: string | null;
  attemptDate: string;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; title: string } | null;
}

interface PyqStats {
  totalAttempted: number;
  totalCorrect: number;
  totalWrong: number;
  overallAccuracy: number;
  attemptsCount: number;
}

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

export default function PyqPage() {
  const [attempts, setAttempts] = useState<PyqAttemptItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [stats, setStats] = useState<PyqStats | null>(null);
  const [subjectBreakdown, setSubjectBreakdown] = useState<
    { name: string; total: number; correct: number; accuracy: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [filterYear, setFilterYear] = useState("ALL");
  const [filterPaper, setFilterPaper] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");

  // Modal State
  const [showLogModal, setShowLogModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PyqAttemptItem | null>(null);

  // Form State
  const [year, setYear] = useState<number>(2026);
  const [paper, setPaper] = useState("PRELIMS_GS1");
  const [totalQuestions, setTotalQuestions] = useState(25);
  const [correctCount, setCorrectCount] = useState(18);
  const [wrongCount, setWrongCount] = useState(5);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [notes, setNotes] = useState("");

  const fetchPyqData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterYear !== "ALL") params.set("year", filterYear);
      if (filterPaper !== "ALL") params.set("paper", filterPaper);
      if (filterSubject !== "ALL") params.set("subjectId", filterSubject);

      const res = await fetch(`/api/pyq?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAttempts(data.attempts || []);
        setSubjects(data.subjects || []);
        setStats(data.stats || null);
        setSubjectBreakdown(data.subjectBreakdown || []);
      }
    } catch (e) {
      console.error("Failed to load PYQ records", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPyqData();
  }, [filterYear, filterPaper, filterSubject]);

  const handleLogAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/pyq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          paper,
          totalQuestions,
          correctCount,
          wrongCount,
          subjectId: selectedSubjectId || null,
          topicId: selectedTopicId || null,
          notes,
        }),
      });

      if (res.ok) {
        setShowLogModal(false);
        setNotes("");
        setSelectedSubjectId("");
        setSelectedTopicId("");
        await fetchPyqData();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to log PYQ session.");
      }
    } catch (err) {
      console.error("Failed to log PYQ", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/pyq?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setAttempts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        fetchPyqData();
      }
    } catch (err) {
      console.error("Failed to delete attempt", err);
    }
    setDeleteTarget(null);
  };

  const selectedSubjectObj = subjects.find((s) => s.id === selectedSubjectId);

  const groupedSubjects = useMemo(() => {
    const map: Record<string, SubjectOption[]> = {};
    subjects.forEach((s) => {
      const cat = s.category?.title || "Syllabus Subjects";
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    return map;
  }, [subjects]);

  if (loading && !stats) {
    return (
      <div className="py-24 text-center font-mono text-xs text-gray-500">
        Loading UPSC Previous Year Questions Analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            OFFICIAL PAPERS ARCHIVE (2015–2026)
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            Previous Year Questions (PYQ) Mastery
          </h2>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="px-4 py-2 bg-[#0f172a] text-white rounded text-xs font-mono hover:bg-black transition cursor-pointer font-medium self-start sm:self-auto shadow-2xs"
        >
          + Log PYQ Attempt
        </button>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">PYQ Questions Solved</span>
          <p className="text-2xl font-serif font-bold text-[#0f172a]">{stats?.totalAttempted || 0}</p>
          <span className="text-[10px] text-gray-400 block">{stats?.attemptsCount || 0} logged sets</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Overall Accuracy</span>
          <p className="text-2xl font-bold text-emerald-700">{stats?.overallAccuracy || 0}%</p>
          <span className="text-[10px] text-gray-400 block">
            {stats?.totalCorrect || 0} correct / {stats?.totalWrong || 0} wrong
          </span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Net Correct Yield</span>
          <p className="text-2xl font-bold text-blue-800">{stats?.totalCorrect || 0}</p>
          <span className="text-[10px] text-gray-400 block">High yield accuracy</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Penalty Incurred</span>
          <p className="text-2xl font-serif font-bold text-[#991b1b]">{stats?.totalWrong || 0}</p>
          <span className="text-[10px] text-gray-400 block">Negative marks deductions</span>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500 font-bold uppercase text-[11px]">Filters:</span>

            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
            >
              <option value="ALL">All Exam Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={filterPaper}
              onChange={(e) => setFilterPaper(e.target.value)}
              className="px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
            >
              <option value="ALL">All Papers</option>
              <option value="PRELIMS_GS1">Prelims GS Paper-1</option>
              <option value="PRELIMS_CSAT">Prelims CSAT</option>
              <option value="MAINS_GS1">Mains GS-1</option>
              <option value="MAINS_GS2">Mains GS-2</option>
              <option value="MAINS_GS3">Mains GS-3</option>
              <option value="MAINS_GS4">Mains GS-4</option>
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
            >
              <option value="ALL">All Subjects</option>
              {Object.entries(groupedSubjects).map(([categoryName, subList]) => (
                <optgroup key={categoryName} label={categoryName}>
                  {subList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {(filterYear !== "ALL" || filterPaper !== "ALL" || filterSubject !== "ALL") && (
              <button
                onClick={() => {
                  setFilterYear("ALL");
                  setFilterPaper("ALL");
                  setFilterSubject("ALL");
                }}
                className="px-2 py-1 text-[11px] bg-red-50 text-red-700 hover:bg-red-100 rounded transition cursor-pointer font-bold"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Breakdown + History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject Accuracy Pillar */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="font-serif font-bold text-gray-900 text-base">Subject PYQ Accuracy</h3>
            <span className="text-xs font-mono text-gray-400">Accuracy rate across attempted questions</span>
          </div>

          <div className="space-y-3">
            {subjectBreakdown.map((sb) => (
              <div key={sb.name} className="space-y-1 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-800">{sb.name}</span>
                  <span className="text-gray-500">
                    {sb.correct}/{sb.total} ({sb.accuracy}%)
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      sb.accuracy >= 75
                        ? "bg-emerald-600"
                        : sb.accuracy >= 50
                        ? "bg-blue-600"
                        : "bg-[#991b1b]"
                    }`}
                    style={{ width: `${sb.accuracy}%` }}
                  />
                </div>
              </div>
            ))}

            {subjectBreakdown.length === 0 && (
              <p className="text-xs font-mono text-gray-400 py-6 text-center">
                No subject PYQ sessions logged yet.
              </p>
            )}
          </div>
        </div>

        {/* History Attempts Feed */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <div>
              <h3 className="font-serif font-bold text-gray-900 text-base">Attempt Log & Score Records</h3>
              <span className="text-xs font-mono text-gray-400">{attempts.length} attempts found</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {attempts.map((a) => (
              <div
                key={a.id}
                className="p-3.5 bg-[#fbfbf9] border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-[#0f172a] text-white text-[10px]">
                      UPSC {a.year}
                    </span>
                    <span className="font-mono text-gray-500 text-[11px]">
                      {a.paper.replace("_", " ")}
                    </span>
                    {a.subject && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-red-50 text-[#991b1b] border border-red-200 font-bold">
                        {a.subject.name}
                      </span>
                    )}
                  </div>
                  {a.topic && <p className="font-sans text-gray-800 font-medium">{a.topic.title}</p>}
                  {a.notes && <p className="font-sans text-gray-400 italic text-[11px]">"{a.notes}"</p>}
                </div>

                <div className="flex items-center gap-4 font-mono justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#0f172a] block">
                      {a.scoreCalculated} <span className="text-[10px] text-gray-400 font-normal">marks</span>
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        a.accuracyPct >= 70 ? "text-emerald-700" : "text-[#991b1b]"
                      }`}
                    >
                      {a.accuracyPct}% ({a.correctCount}C / {a.wrongCount}W)
                    </span>
                  </div>

                  <button
                    onClick={() => setDeleteTarget(a)}
                    className="text-gray-300 hover:text-red-600 transition p-1 cursor-pointer"
                    title="Delete record"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {attempts.length === 0 && (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-lg">
                <p className="text-xs font-mono text-gray-400">
                  No PYQ attempts logged matching this filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-gray-900 text-lg">
              Log Previous Year Questions Attempt
            </h3>
            <form onSubmit={handleLogAttempt} className="space-y-3 font-sans text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">Exam Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Paper</label>
                  <select
                    value={paper}
                    onChange={(e) => setPaper(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs"
                  >
                    <option value="PRELIMS_GS1">Prelims GS-1 (2m / -0.66m)</option>
                    <option value="PRELIMS_CSAT">Prelims CSAT (2.5m / -0.833m)</option>
                    <option value="MAINS_GS1">Mains GS-1</option>
                    <option value="MAINS_GS2">Mains GS-2</option>
                    <option value="MAINS_GS3">Mains GS-3</option>
                    <option value="MAINS_GS4">Mains GS-4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">Total Questions</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={totalQuestions}
                    onChange={(e) => setTotalQuestions(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Correct Count</label>
                  <input
                    type="number"
                    min="0"
                    max={totalQuestions}
                    required
                    value={correctCount}
                    onChange={(e) => setCorrectCount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs text-emerald-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Wrong Count</label>
                  <input
                    type="number"
                    min="0"
                    max={Math.max(0, totalQuestions - correctCount)}
                    required
                    value={wrongCount}
                    onChange={(e) => setWrongCount(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs text-red-700 font-bold"
                  />
                </div>
              </div>

              {/* Dynamic Grouped Subject Selection */}
              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">Link Subject (Optional)</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => {
                      setSelectedSubjectId(e.target.value);
                      setSelectedTopicId("");
                    }}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs"
                  >
                    <option value="">-- None / General Mock --</option>
                    {Object.entries(groupedSubjects).map(([categoryName, subList]) => (
                      <optgroup key={categoryName} label={categoryName}>
                        {subList.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Link Topic (Optional)</label>
                  <select
                    value={selectedTopicId}
                    onChange={(e) => setSelectedTopicId(e.target.value)}
                    disabled={!selectedSubjectObj || selectedSubjectObj.topics.length === 0}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs disabled:opacity-40"
                  >
                    <option value="">-- None --</option>
                    {selectedSubjectObj?.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-gray-500 mb-1">Session Analysis / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Fundamental Rights articles 19-21 tricky wording, CSAT reading speed needs focus..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#0f172a] text-white hover:bg-black font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save PYQ Attempt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete PYQ Record"
        message="Are you sure you want to remove this PYQ attempt from your records?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}