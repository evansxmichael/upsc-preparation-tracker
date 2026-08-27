"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

interface AnswerRecord {
  id: string;
  date: string;
  paper: string;
  questionPrompt: string;
  targetMarks: number;
  targetWords: number;
  timeTakenSecs: number;
  selfScore?: number | null;
  hasIntro: boolean;
  hasDiagram: boolean;
  hasWayForward: boolean;
  strengths?: string | null;
  improvements?: string | null;
  docUrl?: string | null;
  subject?: { id: string; name: string; category?: { title: string } | null } | null;
  topic?: { id: string; title: string } | null;
}

const PAPER_CONFIG: Record<string, { label: string; badge: string }> = {
  GS1: { label: "GS Paper 1 (History, Geo, Society)", badge: "bg-amber-50 text-amber-800 border-amber-200" },
  GS2: { label: "GS Paper 2 (Polity, Gov, IR)", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  GS3: { label: "GS Paper 3 (Economy, Env, Sci, Security)", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  GS4_ETHICS: { label: "GS Paper 4 (Ethics, Integrity, Aptitude)", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  ESSAY: { label: "Essay Paper", badge: "bg-rose-50 text-rose-700 border-rose-200" },
  OPTIONAL_1: { label: "Optional Paper 1", badge: "bg-stone-100 text-stone-800 border-stone-300" },
  OPTIONAL_2: { label: "Optional Paper 2", badge: "bg-stone-100 text-stone-800 border-stone-300" },
};

export default function AnswersPage() {
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [stats, setStats] = useState<{
    totalAnswers: number;
    avgScorePct: number;
    avgTimeMinutes: string;
    diagramRatePct: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPaper, setFilterPaper] = useState("ALL");
  const [filterSubject, setFilterSubject] = useState("ALL");

  // Modal & Delete Target
  const [showLogModal, setShowLogModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AnswerRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [paper, setPaper] = useState("GS1");
  const [questionPrompt, setQuestionPrompt] = useState("");
  const [targetMarks, setTargetMarks] = useState(10);
  const [targetWords, setTargetWords] = useState(150);
  const [selfScore, setSelfScore] = useState<string>("5.0");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [hasIntro, setHasIntro] = useState(true);
  const [hasDiagram, setHasDiagram] = useState(false);
  const [hasWayForward, setHasWayForward] = useState(true);
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [docUrl, setDocUrl] = useState("");

  // Dual-Mode Timer Engine (Countdown vs Stopwatch)
  const [timerMode, setTimerMode] = useState<"COUNTDOWN" | "STOPWATCH">("COUNTDOWN");
  const [targetTimeSecs, setTargetTimeSecs] = useState<number>(420); // 7 mins for 10M
  const [currentTimeSecs, setCurrentTimeSecs] = useState<number>(420);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setCurrentTimeSecs((prev) => {
          if (timerMode === "COUNTDOWN") {
            return prev - 1; // Can decrement below zero into overtime mode
          } else {
            return prev + 1; // Standard upward stopwatch
          }
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timerMode]);

  const handleTargetMarksChange = (marks: number) => {
    setTargetMarks(marks);
    let secs = 420; // 10M -> 7m
    if (marks === 15) {
      setTargetWords(250);
      secs = 660; // 15M -> 11m
      setSelfScore("7.5");
    } else if (marks === 125) {
      setTargetWords(1100);
      secs = 4500; // Essay -> 75m
      setSelfScore("65.0");
    } else {
      setTargetWords(150);
      secs = 420;
      setSelfScore("5.0");
    }

    setTargetTimeSecs(secs);
    setCurrentTimeSecs(timerMode === "COUNTDOWN" ? secs : 0);
    setTimerRunning(false);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setCurrentTimeSecs(timerMode === "COUNTDOWN" ? targetTimeSecs : 0);
  };

  const formatTimerDisplay = (secs: number) => {
    const isNegative = secs < 0;
    const absSecs = Math.abs(secs);
    const m = Math.floor(absSecs / 60);
    const s = absSecs % 60;
    return `${isNegative ? "+ OVERTIME " : ""}${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const fetchAnswers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterPaper !== "ALL") params.set("paper", filterPaper);
      if (filterSubject !== "ALL") params.set("subjectId", filterSubject);

      const res = await fetch(`/api/answers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAnswers(data.answers || []);
        setSubjects(data.subjects || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error("Failed to load answer sessions", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, [filterPaper, filterSubject]);

  const handleSaveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionPrompt.trim()) return;

    // Determine actual elapsed time based on mode
    let actualTimeTaken = targetTimeSecs;
    if (timerMode === "COUNTDOWN") {
      actualTimeTaken = targetTimeSecs - currentTimeSecs;
      if (actualTimeTaken < 0) actualTimeTaken = targetTimeSecs + Math.abs(currentTimeSecs);
    } else {
      actualTimeTaken = currentTimeSecs > 0 ? currentTimeSecs : targetTimeSecs;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper,
          questionPrompt,
          targetMarks,
          targetWords,
          timeTakenSecs: Math.max(1, actualTimeTaken),
          selfScore: selfScore ? parseFloat(selfScore) : null,
          hasIntro,
          hasDiagram,
          hasWayForward,
          strengths,
          improvements,
          docUrl,
          subjectId: selectedSubjectId || null,
          topicId: selectedTopicId || null,
        }),
      });

      if (res.ok) {
        setShowLogModal(false);
        setQuestionPrompt("");
        setStrengths("");
        setImprovements("");
        setDocUrl("");
        setSelectedSubjectId("");
        setSelectedTopicId("");
        setTimerRunning(false);
        await fetchAnswers();
      }
    } catch (err) {
      console.error("Failed to save answer record", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/answers?id=${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setAnswers((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        fetchAnswers();
      }
    } catch (err) {
      console.error("Failed to delete answer", err);
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
        Loading Mains Answer Writing Engine...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            MAINS DESCRIPTIVE MASTERY (GS 1–4, ESSAY & OPTIONAL)
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            Answer Writing & Structure Evaluator
          </h2>
        </div>
        <button
          onClick={() => {
            handleResetTimer();
            setShowLogModal(true);
          }}
          className="px-4 py-2 bg-[#0f172a] text-white rounded text-xs font-mono hover:bg-black transition cursor-pointer font-medium self-start sm:self-auto shadow-2xs"
        >
          ✍️ Log Answer Writing
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Answers Written</span>
          <p className="text-2xl font-serif font-bold text-[#0f172a]">{stats?.totalAnswers || 0}</p>
          <span className="text-[10px] text-gray-400 block">Logged across GS & Essay</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Avg Evaluation Yield</span>
          <p className="text-2xl font-bold text-emerald-700">{stats?.avgScorePct || 0}%</p>
          <span className="text-[10px] text-gray-400 block">Mean score percentage</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Avg Time / Answer</span>
          <p className="text-2xl font-bold text-blue-800">
            {stats?.avgTimeMinutes || "0.0"} <span className="text-xs font-normal text-gray-400">min</span>
          </p>
          <span className="text-[10px] text-gray-400 block">Standard benchmark: 7–11m</span>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Diagram Inclusion</span>
          <p className="text-2xl font-serif font-bold text-[#991b1b]">{stats?.diagramRatePct || 0}%</p>
          <span className="text-[10px] text-gray-400 block">Flowcharts & visual maps</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500 font-bold uppercase text-[11px]">Filter Paper:</span>

            <select
              value={filterPaper}
              onChange={(e) => setFilterPaper(e.target.value)}
              className="px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
            >
              <option value="ALL">All Mains Papers</option>
              {Object.entries(PAPER_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
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
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>

            {(filterPaper !== "ALL" || filterSubject !== "ALL") && (
              <button
                onClick={() => {
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

      {/* Answers Feed */}
      <div className="space-y-3">
        {answers.map((item) => {
          const cfg = PAPER_CONFIG[item.paper] || PAPER_CONFIG.GS1;

          return (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs hover:border-gray-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                  <span className={`px-2 py-0.5 border rounded-full font-bold text-[10px] ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  {item.subject && (
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-[10px] font-semibold">
                      {item.subject.name}
                    </span>
                  )}
                  {item.topic && (
                    <span className="text-gray-500 text-[11px]">
                      • {item.topic.title}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono text-xs text-gray-500">
                  <span>⏱️ {formatTime(item.timeTakenSecs)}</span>
                  <span>•</span>
                  <span>{item.targetWords} words</span>
                  <span>•</span>
                  <span className="text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Question Prompt */}
              <h3 className="font-serif font-bold text-gray-900 text-base leading-snug">
                "{item.questionPrompt}"
              </h3>

              {/* Rubric & Score Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#fbfbf9] p-3 rounded-lg border border-gray-200 text-xs font-mono">
                <div className="space-y-1">
                  <span className="text-gray-400 uppercase text-[10px] block font-bold">Structure Check</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className={item.hasIntro ? "text-emerald-700" : "text-red-600"}>
                      {item.hasIntro ? "✓ Intro" : "✗ No Intro"}
                    </span>
                    <span className={item.hasDiagram ? "text-emerald-700 font-bold" : "text-gray-400"}>
                      {item.hasDiagram ? "✓ Diagram" : "○ No Diagram"}
                    </span>
                    <span className={item.hasWayForward ? "text-emerald-700" : "text-red-600"}>
                      {item.hasWayForward ? "✓ Conclusion" : "✗ Conclusion"}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-400 uppercase text-[10px] block font-bold">Self Score</span>
                  <span className="text-sm font-bold text-[#0f172a]">
                    {item.selfScore !== null ? `${item.selfScore} / ${item.targetMarks} marks` : "Unscored"}
                  </span>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3">
                  {item.docUrl && (
                    <a
                      href={item.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-[11px] font-semibold text-[#0f172a] inline-flex items-center gap-1 shadow-2xs"
                    >
                      <span>📎</span> View Script
                    </a>
                  )}
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="text-gray-300 hover:text-red-600 transition p-1 cursor-pointer"
                    title="Delete entry"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Strengths & Improvements */}
              {(item.strengths || item.improvements) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-sans">
                  {item.strengths && (
                    <p className="text-emerald-800 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                      <strong className="font-mono text-[10px] block uppercase text-emerald-900">Key Strengths:</strong>
                      {item.strengths}
                    </p>
                  )}
                  {item.improvements && (
                    <p className="text-amber-800 bg-amber-50/50 p-2 rounded border border-amber-100">
                      <strong className="font-mono text-[10px] block uppercase text-amber-900">Areas for Improvement:</strong>
                      {item.improvements}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {answers.length === 0 && (
          <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-lg">
            <p className="text-xs font-mono text-gray-400">No Mains Answer Writing logs found matching active filters.</p>
          </div>
        )}
      </div>

      {/* Log Modal with Dual-Mode Timer Controls */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl w-full mx-4 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-lg">
                  Log Mains Answer Writing Practice
                </h3>
                <span className="text-[11px] font-mono text-gray-400">
                  Target Benchmark: {targetMarks === 10 ? "7 mins (150w)" : targetMarks === 15 ? "11 mins (250w)" : "75 mins (Essay)"}
                </span>
              </div>

              {/* Enhanced Timer Control Unit */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = timerMode === "COUNTDOWN" ? "STOPWATCH" : "COUNTDOWN";
                    setTimerMode(nextMode);
                    setTimerRunning(false);
                    setCurrentTimeSecs(nextMode === "COUNTDOWN" ? targetTimeSecs : 0);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer"
                  title="Toggle Countdown Benchmark vs Upward Stopwatch"
                >
                  {timerMode === "COUNTDOWN" ? "⏳ Countdown" : "⏱️ Stopwatch"}
                </button>

                <span
                  className={`px-3 py-1 rounded font-bold text-xs ${
                    currentTimeSecs < 0
                      ? "bg-red-700 text-white animate-pulse"
                      : "bg-[#0f172a] text-white"
                  }`}
                >
                  {formatTimerDisplay(currentTimeSecs)}
                </span>

                <button
                  type="button"
                  onClick={() => setTimerRunning(!timerRunning)}
                  className={`px-2.5 py-1 rounded cursor-pointer text-xs font-bold ${
                    timerRunning
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  }`}
                >
                  {timerRunning ? "Pause" : "Start"}
                </button>

                <button
                  type="button"
                  onClick={handleResetTimer}
                  className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded cursor-pointer text-xs"
                  title="Reset timer"
                >
                  ↺
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveAnswer} className="space-y-3 font-sans text-xs">
              <div>
                <label className="block font-mono text-gray-500 mb-1">Question Prompt</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Discuss the constitutional significance of Article 356. Has its frequency of invocation declined post SR Bommai judgment? (150 Words, 10 Marks)"
                  value={questionPrompt}
                  onChange={(e) => setQuestionPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded text-xs focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-gray-500 mb-1">Mains Paper</label>
                  <select
                    value={paper}
                    onChange={(e) => setPaper(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs"
                  >
                    {Object.entries(PAPER_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-500 mb-1">Target Dimension</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleTargetMarksChange(10)}
                      className={`flex-1 py-1.5 rounded border text-xs cursor-pointer ${
                        targetMarks === 10 ? "bg-[#0f172a] text-white font-bold" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      10M (150w)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetMarksChange(15)}
                      className={`flex-1 py-1.5 rounded border text-xs cursor-pointer ${
                        targetMarks === 15 ? "bg-[#0f172a] text-white font-bold" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      15M (250w)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetMarksChange(125)}
                      className={`flex-1 py-1.5 rounded border text-xs cursor-pointer ${
                        targetMarks === 125 ? "bg-[#0f172a] text-white font-bold" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      Essay (125M)
                    </button>
                  </div>
                </div>
              </div>

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
                    <option value="">-- None --</option>
                    {Object.entries(groupedSubjects).map(([cat, list]) => (
                      <optgroup key={cat} label={cat}>
                        {list.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
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
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rubric Checkboxes & Evaluation Score */}
              <div className="p-3 bg-[#fbfbf9] border border-gray-200 rounded-lg space-y-2 font-mono">
                <span className="text-[11px] text-gray-500 uppercase font-bold block">Evaluation Rubric & Score</span>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={hasIntro}
                      onChange={(e) => setHasIntro(e.target.checked)}
                      className="rounded"
                    />
                    <span>Introduction Defined</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={hasDiagram}
                      onChange={(e) => setHasDiagram(e.target.checked)}
                      className="rounded"
                    />
                    <span>Diagram / Map Drawn</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={hasWayForward}
                      onChange={(e) => setHasWayForward(e.target.checked)}
                      className="rounded"
                    />
                    <span>Way Forward / Conclusion</span>
                  </label>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <label className="text-gray-500 text-xs">Self Score / Marks Awarded:</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max={targetMarks}
                    value={selfScore}
                    onChange={(e) => setSelfScore(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-gray-300 rounded font-bold text-center text-[#0f172a]"
                  />
                  <span className="text-gray-400 text-xs">/ {targetMarks} Marks</span>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-gray-500 mb-1">Key Strengths</label>
                  <input
                    type="text"
                    placeholder="e.g. Good article citation, balanced points..."
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block font-mono text-gray-500 mb-1">Areas for Improvement</label>
                  <input
                    type="text"
                    placeholder="e.g. Hand writing rushed, missed 2nd subpart..."
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs"
                  />
                </div>
              </div>

              {/* Document Link */}
              <div>
                <label className="block font-mono text-gray-500 mb-1">Link Handwritten Script (Drive / Cloudinary / PDF)</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/d/... or https://res.cloudinary.com/..."
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded text-xs font-mono"
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
                  {isSubmitting ? "Saving..." : "Save Answer Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Answer Record"
        message="Are you sure you want to remove this answer writing practice record?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}