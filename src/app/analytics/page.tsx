"use client";

import { useState, useEffect } from "react";

interface AnalyticsData {
  healthScore: number;
  syllabusCoveragePct: number;
  totalTopicsCount: number;
  completedTopicsCount: number;
  totalStudyHours: string;
  totalSessionsCount: number;
  mockCount: number;
  avgMockPct: number;
  mockTrend: {
    id: string;
    title: string;
    category: string;
    score: number;
    maxScore: number;
    percentage: number;
    date: string;
  }[];
  revisionAdherencePct: number;
  overdueRevisions: number;
  totalRevisions: number;
  completedRevisions: number;
  avgDiscipline: number;
  subjectBreakdown: {
    id: string;
    name: string;
    categoryName: string;
    hours: string;
    percentOfTotal: number;
    topicCoverage: number;
  }[];
  rootCauseCount: Record<string, number>;
  weakAreas: {
    id: string;
    subject: string;
    errorCount: number;
    severity: "CRITICAL" | "MODERATE" | "LOW";
  }[];
}

const REASON_LABELS: Record<string, string> = {
  CONCEPTUAL_CONFUSION: "Conceptual Confusion",
  FACTUAL_GAP: "Factual Gap / Amnesia",
  MISREAD_QUESTION: "Misread Question",
  SILLY_MISTAKE: "Calculation / Silly Mistake",
  TIME_PRESSURE: "Time Pressure",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Date Range Filtration
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activePreset, setActivePreset] = useState<"ALL" | "7D" | "30D" | "CUSTOM">("ALL");

  const fetchAnalytics = async (start = startDate, end = endDate) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (start) params.set("startDate", start);
      if (end) params.set("endDate", end);

      const res = await fetch(`/api/analytics?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to load analytics from DB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(startDate, endDate);
  }, [startDate, endDate]);

  const handleApplyPreset = (preset: "ALL" | "7D" | "30D") => {
    setActivePreset(preset);
    if (preset === "ALL") {
      setStartDate("");
      setEndDate("");
      return;
    }

    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - (preset === "7D" ? 7 : 30));

    setStartDate(past.toISOString().slice(0, 10));
    setEndDate(today.toISOString().slice(0, 10));
  };

  const totalMistakesCount = data
    ? Object.values(data.rootCauseCount).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            INTELLIGENCE & DIAGNOSTIC SUITE
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            Preparation Health & Performance Analytics
          </h2>
        </div>
        <button
          onClick={() => fetchAnalytics(startDate, endDate)}
          className="px-3 py-1.5 bg-[#fbfbf9] hover:bg-gray-100 text-gray-700 border border-gray-300 rounded text-xs font-mono transition cursor-pointer self-start sm:self-auto font-medium"
        >
          ↻ Refresh Diagnostics
        </button>
      </div>

      {/* Date Range Filtration Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs space-y-3 font-mono text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-bold uppercase text-[11px] tracking-wider">
              Time Scope:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleApplyPreset("ALL")}
                className={`px-2.5 py-1 rounded cursor-pointer transition ${
                  activePreset === "ALL" && !startDate && !endDate
                    ? "bg-[#0f172a] text-white font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All Time
              </button>
              <button
                onClick={() => handleApplyPreset("7D")}
                className={`px-2.5 py-1 rounded cursor-pointer transition ${
                  activePreset === "7D"
                    ? "bg-[#0f172a] text-white font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => handleApplyPreset("30D")}
                className={`px-2.5 py-1 rounded cursor-pointer transition ${
                  activePreset === "30D"
                    ? "bg-[#0f172a] text-white font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Last 30 Days
              </button>
            </div>
          </div>

          {/* Dual Date Calendars */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setActivePreset("CUSTOM");
                  setStartDate(e.target.value);
                }}
                className="px-2 py-1 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 text-[11px]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setActivePreset("CUSTOM");
                  setEndDate(e.target.value);
                }}
                className="px-2 py-1 text-xs bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setActivePreset("ALL");
                  setStartDate("");
                  setEndDate("");
                }}
                className="px-2 py-1 text-[11px] bg-red-50 text-red-700 hover:bg-red-100 rounded transition cursor-pointer font-bold"
              >
                Clear Range
              </button>
            )}
          </div>
        </div>
      </div>

      {loading || !data ? (
        <div className="py-24 text-center font-mono text-xs text-gray-500">
          Calculating metrics for the selected time range...
        </div>
      ) : (
        <>
          {/* Preparation Health Score Master Banner */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-xs font-mono uppercase text-gray-500 font-bold tracking-wider">
                  Preparation Health Composite
                </span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-gray-900">
                System Health:{" "}
                <span
                  className={
                    data.healthScore >= 75
                      ? "text-emerald-700"
                      : data.healthScore >= 50
                      ? "text-amber-600"
                      : "text-[#991b1b]"
                  }
                >
                  {data.healthScore >= 75
                    ? "Prime Examination Readiness"
                    : data.healthScore >= 50
                    ? "Steady Progress (Refinements Needed)"
                    : "Action Required"}
                </span>
              </h3>
              <p className="text-xs text-gray-600 font-sans max-w-2xl leading-relaxed">
                Synthesized across Syllabus Coverage ({data.syllabusCoveragePct}%),
                Mock Accuracy ({data.avgMockPct}%), Spaced Revision Adherence (
                {data.revisionAdherencePct}%), and Discipline consistency (
                {data.avgDiscipline}/5).
              </p>
            </div>

            {/* Big Health Number */}
            <div className="flex items-center gap-6 font-mono border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-8">
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-5xl font-serif font-bold text-[#0f172a]">
                    {data.healthScore}
                  </span>
                  <span className="text-sm text-gray-400 font-mono font-normal">
                    / 100
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 font-mono block mt-1 uppercase tracking-wider">
                  Health Index
                </span>
              </div>
            </div>
          </div>

          {/* Core Pillar KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
              <span className="text-[11px] uppercase text-gray-500 tracking-wider">
                Syllabus Coverage
              </span>
              <p className="text-2xl font-serif font-bold text-[#0f172a]">
                {data.syllabusCoveragePct}%
              </p>
              <span className="text-[11px] text-gray-400 block">
                {data.completedTopicsCount} of {data.totalTopicsCount} topics
              </span>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
              <span className="text-[11px] uppercase text-gray-500 tracking-wider">
                Study Volume (Range)
              </span>
              <p className="text-2xl font-bold text-blue-800">
                {data.totalStudyHours}{" "}
                <span className="text-xs font-normal text-gray-400">hrs</span>
              </p>
              <span className="text-[11px] text-gray-400 block">
                {data.totalSessionsCount} recorded blocks
              </span>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
              <span className="text-[11px] uppercase text-gray-500 tracking-wider">
                Mock Accuracy
              </span>
              <p className="text-2xl font-bold text-emerald-700">
                {data.avgMockPct}%
              </p>
              <span className="text-[11px] text-gray-400 block">
                Across {data.mockCount} tests in scope
              </span>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs space-y-1">
              <span className="text-[11px] uppercase text-gray-500 tracking-wider">
                Revision Adherence
              </span>
              <p className="text-2xl font-serif font-bold text-[#991b1b]">
                {data.revisionAdherencePct}%
              </p>
              <span className="text-[11px] text-gray-400 block">
                {data.overdueRevisions} overdue tasks
              </span>
            </div>
          </div>

          {/* Grid Row 2: Weakness Detection & Subject Time Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module 1: Automated Weakness Detection */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-base">
                    Automated Weak Area Detection
                  </h3>
                  <span className="text-xs font-mono text-gray-400">
                    Subjects with concentrated mock test errors & gaps
                  </span>
                </div>
                <span className="text-xs font-mono text-[#991b1b] font-bold">
                  {data.weakAreas.length} flagged
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {data.weakAreas.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 bg-[#fbfbf9] border border-gray-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            w.severity === "CRITICAL"
                              ? "bg-[#991b1b]"
                              : w.severity === "MODERATE"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <strong className="text-gray-900">{w.subject}</strong>
                      </div>
                      <span className="text-[11px] text-gray-500">
                        {w.errorCount} diagnostic mistakes
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                        w.severity === "CRITICAL"
                          ? "bg-red-50 text-[#991b1b] border-red-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {w.severity} PRIORITY
                    </span>
                  </div>
                ))}

                {data.weakAreas.length === 0 && (
                  <p className="text-xs font-mono text-gray-400 py-6 text-center">
                    ✓ No weak subject concentrations flagged. Clean mistake record!
                  </p>
                )}
              </div>
            </div>

            {/* Module 2: Subject Time Investment vs Syllabus Progress */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-base">
                    Subject Time Investment vs Progress
                  </h3>
                  <span className="text-xs font-mono text-gray-400">
                    Hours spent in time range & syllabus topic completion
                  </span>
                </div>
              </div>

              <div className="space-y-3.5">
                {data.subjectBreakdown.map((item) => (
                  <div key={item.id} className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-gray-900 font-bold">{item.name}</span>
                        <span className="text-[10px] text-gray-400 ml-1.5 uppercase font-medium">
                          ({item.categoryName})
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="text-gray-500">{item.hours} hrs</span>
                        <span className="text-emerald-700 font-semibold">
                          {item.topicCoverage}% covered
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-[#0f172a] h-full"
                        style={{ width: `${item.percentOfTotal}%` }}
                        title={`Time Share: ${item.percentOfTotal}%`}
                      />
                    </div>
                  </div>
                ))}

                {data.subjectBreakdown.length === 0 && (
                  <p className="text-xs font-mono text-gray-400 py-6 text-center">
                    No subject study hours logged yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Grid Row 3: Mock Test Progression & Mistake Root-Causes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Module 3: Mock Test Performance Trends */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-base">
                    Recent Mock Test Progression
                  </h3>
                  <span className="text-xs font-mono text-gray-400">
                    Recent score trends and percentage curves
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                {data.mockTrend.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-[#fbfbf9] border border-gray-200 rounded-lg flex items-center justify-between font-mono text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-serif font-bold text-gray-900 text-sm block">
                        {m.title}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {m.date} • {m.category}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-[#0f172a] block">
                        {m.score}/{m.maxScore}
                      </span>
                      <span
                        className={`text-[11px] font-bold ${
                          m.percentage >= 60
                            ? "text-emerald-700"
                            : m.percentage >= 45
                            ? "text-blue-700"
                            : "text-[#991b1b]"
                        }`}
                      >
                        {m.percentage}%
                      </span>
                    </div>
                  </div>
                ))}

                {data.mockTrend.length === 0 && (
                  <p className="text-xs font-mono text-gray-400 py-6 text-center">
                    No mock tests taken in this date range.
                  </p>
                )}
              </div>
            </div>

            {/* Module 4: Mistake Notebook Diagnostics */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <div>
                  <h3 className="font-serif font-bold text-gray-900 text-base">
                    Mistake Notebook Diagnostics
                  </h3>
                  <span className="text-xs font-mono text-gray-400">
                    Root causes behind wrong answers ({totalMistakesCount} total)
                  </span>
                </div>
              </div>

              <div className="space-y-3 font-mono text-xs">
                {Object.entries(data.rootCauseCount).map(([reason, count]) => {
                  const label = REASON_LABELS[reason] || reason;
                  const pct =
                    totalMistakesCount > 0
                      ? Math.round((count / totalMistakesCount) * 100)
                      : 0;

                  return (
                    <div key={reason} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-800 font-medium">{label}</span>
                        <span className="text-gray-500">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#991b1b] h-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                {totalMistakesCount === 0 && (
                  <p className="text-xs font-mono text-gray-400 py-6 text-center">
                    Mistake notebook is clear. No diagnostic errors logged!
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}