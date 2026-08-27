"use client";

import { useState, useEffect } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export type TestCategory =
  | "PRELIMS_GS1"
  | "PRELIMS_CSAT"
  | "MAINS_GS"
  | "MAINS_ESSAY"
  | "OPTIONAL";

export type MistakeReason =
  | "CONCEPTUAL_CONFUSION"
  | "FACTUAL_GAP"
  | "MISREAD_QUESTION"
  | "SILLY_MISTAKE"
  | "TIME_PRESSURE";

interface SubjectOption {
  id: string;
  name: string;
  topics: { id: string; title: string }[];
}

interface MockTestRecord {
  id: string;
  title: string;
  category: TestCategory;
  date: string;
  score: number;
  maxScore: number;
  correctCount?: number | null;
  wrongCount?: number | null;
  unattempted?: number | null;
  notes?: string | null;
}

interface MistakeEntry {
  id: string;
  questionSummary: string;
  reason: MistakeReason;
  correctConcept: string;
  revisionStage: number; // 0 to 3
  isArchived?: boolean;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; title: string } | null;
  mockTest?: { id: string; title: string } | null;
}

const CATEGORY_LABELS: Record<TestCategory, string> = {
  PRELIMS_GS1: "GS-1 Prelims",
  PRELIMS_CSAT: "CSAT Paper 2",
  MAINS_GS: "Mains GS",
  MAINS_ESSAY: "Essay",
  OPTIONAL: "Optional",
};

const REASON_OPTIONS: { label: string; value: MistakeReason }[] = [
  { label: "Conceptual Confusion", value: "CONCEPTUAL_CONFUSION" },
  { label: "Factual Gap", value: "FACTUAL_GAP" },
  { label: "Misread Question", value: "MISREAD_QUESTION" },
  { label: "Silly Mistake", value: "SILLY_MISTAKE" },
  { label: "Time Pressure", value: "TIME_PRESSURE" },
];

export default function MockTestsPage() {
  const [tests, setTests] = useState<MockTestRecord[]>([]);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"history" | "mistakes">("history");
  const [mistakeFilter, setMistakeFilter] = useState<"active" | "archived">("active");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  // Date Range Filtration State
  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [showAddMistakeModal, setShowAddMistakeModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "test" | "mistake";
    id: string;
    title: string;
  } | null>(null);

  // Form State: Mock Test
  const [testTitle, setTestTitle] = useState("");
  const [testCategory, setTestCategory] = useState<TestCategory>("PRELIMS_GS1");
  const [testDate, setTestDate] = useState(new Date().toISOString().slice(0, 10));
  const [testScore, setTestScore] = useState<number>(95);
  const [testMaxScore, setTestMaxScore] = useState<number>(200);
  const [testCorrect, setTestCorrect] = useState<number>(55);
  const [testWrong, setTestWrong] = useState<number>(20);
  const [testDurationMins, setTestDurationMins] = useState<number>(120);
  const [testSubjectId, setTestSubjectId] = useState<string>("");
  const [testNotes, setTestNotes] = useState("");

  // Form State: Mistake
  const [mistakeTestId, setMistakeTestId] = useState<string>("");
  const [mistakeSubjectId, setMistakeSubjectId] = useState<string>("");
  const [mistakeTopicId, setMistakeTopicId] = useState<string>("");
  const [mistakeSummary, setMistakeSummary] = useState("");
  const [mistakeReason, setMistakeReason] = useState<MistakeReason>("CONCEPTUAL_CONFUSION");
  const [mistakeCorrectConcept, setMistakeCorrectConcept] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [practiceRes, syllabusRes] = await Promise.all([
        fetch("/api/practice"),
        fetch("/api/syllabus"),
      ]);

      if (practiceRes.ok) {
        const data = await practiceRes.json();
        setTests(data.tests || []);
        setMistakes(data.mistakes || []);
      }

      if (syllabusRes.ok) {
        const sylData = await syllabusRes.json();
        const extractedSubjects: SubjectOption[] = sylData.flatMap((c: any) => c.subjects || []);
        setSubjects(extractedSubjects);
        if (extractedSubjects.length > 0) {
          setMistakeSubjectId(extractedSubjects[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load practice data from DB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter with Category AND Date Range (Start Date to End Date)
  const filteredTests = tests.filter((t) => {
    if (selectedFilter !== "ALL" && t.category !== selectedFilter) {
      return false;
    }

    const testDateObj = new Date(t.date).getTime();

    if (filterStartDate) {
      const startObj = new Date(filterStartDate).getTime();
      if (testDateObj < startObj) return false;
    }

    if (filterEndDate) {
      const endObj = new Date(filterEndDate).getTime();
      if (testDateObj > endObj) return false;
    }

    return true;
  });

  const activeMistakes = mistakes.filter((m) => !m.isArchived);
  const archivedMistakes = mistakes.filter((m) => !!m.isArchived);
  const displayedMistakes = mistakeFilter === "active" ? activeMistakes : archivedMistakes;

  const avgPercentage =
    tests.length > 0
      ? (
          tests.reduce((acc, t) => acc + (t.score / t.maxScore) * 100, 0) /
          tests.length
        ).toFixed(1)
      : "0.0";

  const highestScore =
    tests.length > 0
      ? Math.max(...tests.map((t) => (t.score / t.maxScore) * 100)).toFixed(1)
      : "0.0";

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim()) return;

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: testTitle.trim(),
          category: testCategory,
          date: testDate,
          score: Number(testScore),
          maxScore: Number(testMaxScore) || 200,
          correctCount: Number(testCorrect) || 0,
          wrongCount: Number(testWrong) || 0,
          notes: testNotes.trim(),
          durationMinutes: Number(testDurationMins) || 120,
          subjectId: testSubjectId || null,
        }),
      });

      if (res.ok) {
        const newRecord = await res.json();
        setTests((prev) => [newRecord, ...prev]);
        setTestTitle("");
        setTestNotes("");
        setShowAddTestModal(false);
      }
    } catch (err) {
      console.error("Failed to save mock test", err);
    }
  };

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeSummary.trim() || !mistakeCorrectConcept.trim()) return;

    try {
      const res = await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD_MISTAKE",
          mockTestId: mistakeTestId || null,
          subjectId: mistakeSubjectId || null,
          topicId: mistakeTopicId || null,
          questionSummary: mistakeSummary.trim(),
          reason: mistakeReason,
          correctConcept: mistakeCorrectConcept.trim(),
        }),
      });

      if (res.ok) {
        const newMistake = await res.json();
        setMistakeSummary("");
        setMistakeCorrectConcept("");
        setMistakes((prev) => [newMistake, ...prev]);
        setShowAddMistakeModal(false);
      }
    } catch (err) {
      console.error("Failed to record mistake", err);
    }
  };

  const toggleArchiveMistake = async (id: string, currentArchivedStatus: boolean) => {
    const nextStatus = !currentArchivedStatus;

    // Optimistic update
    setMistakes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isArchived: nextStatus } : m))
    );

    try {
      await fetch("/api/practice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isArchived: nextStatus }),
      });
    } catch (err) {
      console.error("Failed to update mistake archive status", err);
    }
  };

  const cycleMistakeStage = async (id: string, currentStage: number) => {
    const nextStage = ((currentStage + 1) % 4) as 0 | 1 | 2 | 3;

    // Optimistic update
    setMistakes((prev) =>
      prev.map((m) => (m.id === id ? { ...m, revisionStage: nextStage } : m))
    );

    try {
      await fetch("/api/practice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, revisionStage: nextStage }),
      });
    } catch (err) {
      console.error("Failed to update mistake stage", err);
    }
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await fetch(
        `/api/practice?id=${deleteTarget.id}&type=${deleteTarget.type}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        if (deleteTarget.type === "test") {
          setTests((prev) => prev.filter((t) => t.id !== deleteTarget.id));
        } else {
          setMistakes((prev) => prev.filter((m) => m.id !== deleteTarget.id));
        }
      }
    } catch (err) {
      console.error("Failed to delete record", err);
    }

    setDeleteTarget(null);
  };

  const currentSelectedSubject = subjects.find((s) => s.id === mistakeSubjectId);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        Loading mock test metrics & mistake notebook...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-24">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            PERFORMANCE & ERROR LOG
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            Mock Tests & Mistake Notebook
          </h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddTestModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a] text-white rounded text-xs font-mono hover:bg-black shadow-2xs transition cursor-pointer font-medium"
          >
            <span>+</span> Log Test
          </button>
          <button
            onClick={() => setShowAddMistakeModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#991b1b] text-[#991b1b] rounded text-xs font-mono hover:bg-red-50 shadow-2xs transition cursor-pointer font-bold"
          >
            <span>+</span> Log Mistake
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Mocks Taken
          </span>
          <p className="text-2xl font-serif font-bold text-[#0f172a] mt-1">
            {tests.length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Avg Score %
          </span>
          <p className="text-2xl font-mono font-bold text-blue-800 mt-1">
            {avgPercentage}%
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Peak Score
          </span>
          <p className="text-2xl font-mono font-bold text-emerald-700 mt-1">
            {highestScore}%
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Active Mistakes
          </span>
          <p className="text-2xl font-serif font-bold text-[#991b1b] mt-1">
            {activeMistakes.length}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-1">
        <div className="flex gap-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2 font-bold cursor-pointer transition border-b-2 ${
              activeTab === "history"
                ? "border-[#0f172a] text-[#0f172a]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Mock Test History ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab("mistakes")}
            className={`pb-2 font-bold cursor-pointer transition border-b-2 ${
              activeTab === "mistakes"
                ? "border-[#991b1b] text-[#991b1b]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Mistake Notebook ({activeMistakes.length})
          </button>
        </div>

        {activeTab === "history" && (
          <div className="flex gap-1.5 font-mono text-[11px]">
            {["ALL", "PRELIMS_GS1", "PRELIMS_CSAT", "MAINS_GS"].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-2 py-0.5 rounded cursor-pointer transition ${
                  selectedFilter === f
                    ? "bg-[#0f172a] text-white font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f === "ALL" ? "All Tests" : CATEGORY_LABELS[f as TestCategory] || f}
              </button>
            ))}
          </div>
        )}

        {activeTab === "mistakes" && (
          <div className="flex gap-1.5 font-mono text-[11px]">
            <button
              onClick={() => setMistakeFilter("active")}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition ${
                mistakeFilter === "active"
                  ? "bg-[#991b1b] text-white font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Active ({activeMistakes.length})
            </button>
            <button
              onClick={() => setMistakeFilter("archived")}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition ${
                mistakeFilter === "archived"
                  ? "bg-gray-800 text-white font-medium"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Archived ({archivedMistakes.length})
            </button>
          </div>
        )}
      </div>

      {/* View 1: Mock Tests List */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {/* Dual Date Range Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-lg p-3 shadow-2xs font-mono text-xs">
            <span className="text-gray-500 font-semibold uppercase text-[11px] tracking-wider">
              Date Range Filter:
            </span>

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

              {(filterStartDate || filterEndDate) && (
                <button
                  onClick={() => {
                    setFilterStartDate("");
                    setFilterEndDate("");
                  }}
                  className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition cursor-pointer"
                >
                  Clear Range
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3">
            {filteredTests.map((item) => {
              const percentage = ((item.score / item.maxScore) * 100).toFixed(1);
              const totalAttempts =
                (item.correctCount || 0) + (item.wrongCount || 0);
              const accuracyRate =
                totalAttempts > 0
                  ? Math.round(((item.correctCount || 0) / totalAttempts) * 100)
                  : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-serif font-bold text-gray-900 text-lg tracking-tight">
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700 font-medium">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-gray-600 font-sans italic bg-[#fbfbf9] p-2 rounded border border-gray-100">
                        "{item.notes}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-500 pt-1">
                      <span className="flex items-center gap-1">
                        📅 {new Date(item.date).toLocaleDateString()}
                      </span>
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        ✓ {item.correctCount ?? 0} Correct
                      </span>
                      <span className="text-red-700 font-semibold bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        ✗ {item.wrongCount ?? 0} Wrong
                      </span>
                      <span className="text-gray-600">
                        Accuracy: <strong className="text-gray-900">{accuracyRate}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Score Column */}
                  <div className="flex items-center gap-6 self-end md:self-center">
                    <div className="w-36 text-right space-y-1">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                        SCORE
                      </span>
                      <div className="font-mono text-xl font-bold text-[#0f172a]">
                        {item.score}
                        <span className="text-xs font-normal text-gray-400">
                          {" "}
                          / {item.maxScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#0f172a] h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, Number(percentage))
                            )}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-blue-800 block">
                        {percentage}%
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: "test",
                          id: item.id,
                          title: item.title,
                        })
                      }
                      className="text-gray-300 hover:text-red-600 p-1.5 transition cursor-pointer text-base"
                      title="Delete Test"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredTests.length === 0 && (
              <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
                <p className="text-xs font-mono text-gray-400">
                  {filterStartDate || filterEndDate
                    ? "No mock tests found matching the selected date range."
                    : "No mock tests found for this filter in your notebook."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 2: Mistake Notebook */}
      {activeTab === "mistakes" && (
        <div className="space-y-4">
          {displayedMistakes.map((mis, index) => {
            const stageLabels = [
              "Due for Revision",
              "1st Pass Done",
              "2nd Pass Done",
              "Mastered",
            ];
            const stageColors = [
              "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
              "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
              "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
              "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100",
            ];

            return (
              <div
                key={mis.id}
                className={`bg-white border-l-4 ${
                  mis.isArchived ? "border-l-gray-400 opacity-80" : "border-l-[#991b1b]"
                } border-t border-r border-b border-gray-200 rounded-r-lg p-5 shadow-2xs space-y-3 transition-all`}
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">
                        #{String(index + 1).padStart(3, "0")}
                      </span>
                      <span className="text-xs font-mono font-bold uppercase text-[#991b1b]">
                        {mis.subject?.name || "General"}
                      </span>
                      {mis.topic && (
                        <>
                          <span className="text-gray-300">•</span>
                          <h4 className="font-serif font-bold text-gray-900 text-base">
                            {mis.topic.title}
                          </h4>
                        </>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-gray-500 mt-1 block">
                      Root Cause:{" "}
                      <span className="text-gray-800 font-medium">
                        {mis.reason.replace("_", " ")}
                      </span>
                      {mis.mockTest && (
                        <span className="ml-2 text-gray-400">
                          (From: {mis.mockTest.title})
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono">
                    <button
                      onClick={() => toggleArchiveMistake(mis.id, !!mis.isArchived)}
                      className={`text-xs px-3 py-1 font-semibold rounded border cursor-pointer transition ${
                        mis.isArchived
                          ? "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      }`}
                      title={mis.isArchived ? "Restore to Active Notebook" : "Mark Done and Move to Archive"}
                    >
                      {mis.isArchived ? "↩ Restore" : "✓ Mark Done"}
                    </button>

                    <button
                      onClick={() => cycleMistakeStage(mis.id, mis.revisionStage)}
                      className={`text-xs px-3 py-1 font-medium rounded border cursor-pointer transition ${stageColors[mis.revisionStage]}`}
                      title="Click to advance spaced repetition pass"
                    >
                      {stageLabels[mis.revisionStage]}
                    </button>

                    <button
                      onClick={() =>
                        setDeleteTarget({
                          type: "mistake",
                          id: mis.id,
                          title: mis.topic?.title || "Mistake entry",
                        })
                      }
                      className="text-gray-300 hover:text-red-600 p-1 transition cursor-pointer"
                      title="Delete Entry"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Error & Solution Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#fbfbf9] border border-gray-200 rounded space-y-1">
                    <span className="font-mono font-bold uppercase text-gray-500 text-[10px] tracking-wider block">
                      Question / Error Context
                    </span>
                    <p className="text-gray-800 font-sans leading-relaxed">
                      {mis.questionSummary}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/40 border border-emerald-200/60 rounded space-y-1">
                    <span className="font-mono font-bold uppercase text-emerald-800 text-[10px] tracking-wider block">
                      Correct Concept / Remediation
                    </span>
                    <p className="text-emerald-900 font-sans leading-relaxed">
                      {mis.correctConcept}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {displayedMistakes.length === 0 && (
            <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
              <p className="text-xs font-mono text-gray-400">
                {mistakeFilter === "active"
                  ? "No active mistakes in your notebook! All errors resolved or clean."
                  : "No archived mistakes found."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Test Modal */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-gray-900 text-lg">
              Log Mock Test Record
            </h3>
            <form onSubmit={handleAddTest} className="space-y-3 font-sans text-sm">
              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">
                  Test Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vision IAS GS Full Test 3"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Category</label>
                  <select
                    value={testCategory}
                    onChange={(e) =>
                      setTestCategory(e.target.value as TestCategory)
                    }
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Score</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={testScore}
                    onChange={(e) => setTestScore(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Max Marks</label>
                  <input
                    type="number"
                    required
                    value={testMaxScore}
                    onChange={(e) => setTestMaxScore(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Time (Mins)</label>
                  <input
                    type="number"
                    required
                    value={testDurationMins}
                    onChange={(e) => setTestDurationMins(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Correct Count</label>
                  <input
                    type="number"
                    value={testCorrect}
                    onChange={(e) => setTestCorrect(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Wrong Count</label>
                  <input
                    type="number"
                    value={testWrong}
                    onChange={(e) => setTestWrong(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">
                  Analysis / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on performance, time management..."
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#0f172a] text-white hover:bg-black font-bold cursor-pointer"
                >
                  Save Record & Log Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Mistake Modal */}
      {showAddMistakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-gray-900 text-lg">
              Log Mistake Diagnostics
            </h3>
            <form onSubmit={handleAddMistake} className="space-y-3 font-sans text-sm">
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Link to Mock Test</label>
                  <select
                    value={mistakeTestId}
                    onChange={(e) => setMistakeTestId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    <option value="">-- Optional: Select Mock --</option>
                    {tests.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Root Cause</label>
                  <select
                    value={mistakeReason}
                    onChange={(e) =>
                      setMistakeReason(e.target.value as MistakeReason)
                    }
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    {REASON_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Subject</label>
                  <select
                    value={mistakeSubjectId}
                    onChange={(e) => {
                      setMistakeSubjectId(e.target.value);
                      setMistakeTopicId("");
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
                    value={mistakeTopicId}
                    onChange={(e) => setMistakeTopicId(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    <option value="">-- Select Topic (Optional) --</option>
                    {currentSelectedSubject?.topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">
                  Question / Error Context
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="What question went wrong?"
                  value={mistakeSummary}
                  onChange={(e) => setMistakeSummary(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">
                  Correct Concept / Remediation
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Core rule/fact to avoid this error again..."
                  value={mistakeCorrectConcept}
                  onChange={(e) => setMistakeCorrectConcept(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddMistakeModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#991b1b] text-white hover:bg-red-800 font-bold cursor-pointer"
                >
                  Record & Schedule Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title={`Delete ${
          deleteTarget?.type === "test" ? "Mock Record" : "Mistake Entry"
        }`}
        message={`Are you sure you want to remove "${deleteTarget?.title}"?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}