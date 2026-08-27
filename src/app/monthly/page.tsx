"use client";

import { useState, useEffect, useMemo } from "react";

interface StudySession {
  id: string;
  durationMinutes: number;
  sessionType: string;
  notes?: string | null;
  date: string;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; title: string } | null;
}

interface MockTestRecord {
  id: string;
  title: string;
  category: string;
  date: string;
  score: number;
  maxScore: number;
}

interface JournalEntry {
  id: string;
  date: string;
  studiedSummary: string;
  accomplishments?: string | null;
  obstacles?: string | null;
  keyLearnings?: string | null;
  tomorrowPlan?: string | null;
  disciplineRating: number;
  energyRating: number;
  confidenceRating: number;
  createdAt: string;
}

interface RevisionTaskItem {
  id: string;
  lastStudiedDate: string;
  nextDueDate: string;
  isCompleted: boolean;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; title: string } | null;
}

export default function MonthlyPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [mockTests, setMockTests] = useState<MockTestRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [revisions, setRevisions] = useState<RevisionTaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Day Modal / Inspector
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);

  const fetchMonthData = async (targetDate: Date) => {
    try {
      setLoading(true);
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth() + 1;

      const res = await fetch(`/api/monthly?year=${targetYear}&month=${targetMonth}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setMockTests(data.mockTests || []);
        setJournals(data.journals || []);
        setRevisions(data.revisions || []);
      }
    } catch (e) {
      console.error("Failed to load monthly data from DB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthData(currentDate);
  }, [currentDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Helper date normalization (YYYY-MM-DD)
  const toDateKey = (d: string | Date) => {
    const obj = new Date(d);
    return isNaN(obj.getTime()) ? "" : obj.toISOString().slice(0, 10);
  };

  // Comprehensive Monthly Aggregator
  const monthStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

    const monthlySessions = sessions.filter((s) => toDateKey(s.date).startsWith(monthPrefix));
    const monthlyTests = mockTests.filter((t) => toDateKey(t.date).startsWith(monthPrefix));
    const monthlyJournals = journals.filter((j) => toDateKey(j.date).startsWith(monthPrefix));
    const monthlyRevisions = revisions.filter((r) => toDateKey(r.lastStudiedDate).startsWith(monthPrefix));

    const totalMinutes = monthlySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    const totalHours = (totalMinutes / 60).toFixed(1);

    const activeDaysSet = new Set(monthlySessions.map((s) => toDateKey(s.date)));
    const activeDaysCount = activeDaysSet.size;

    const avgMockScore =
      monthlyTests.length > 0
        ? (
            monthlyTests.reduce((acc, t) => acc + (t.score / t.maxScore) * 100, 0) /
            monthlyTests.length
          ).toFixed(1)
        : "—";

    const avgDiscipline =
      monthlyJournals.length > 0
        ? (
            monthlyJournals.reduce((acc, j) => acc + j.disciplineRating, 0) /
            monthlyJournals.length
          ).toFixed(1)
        : "—";

    // Day-by-day indexed dictionary (now stores full journals array)
    const dayDataMap: Record<
      number,
      {
        dateStr: string;
        minutes: number;
        sessions: StudySession[];
        mocks: MockTestRecord[];
        journals: JournalEntry[];
        revisions: RevisionTaskItem[];
      }
    > = {};

    let highFocusDays = 0;
    let modFocusDays = 0;
    let lightFocusDays = 0;
    let restDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
      const daySessions = monthlySessions.filter((s) => toDateKey(s.date) === dateStr);
      const dayMocks = monthlyTests.filter((t) => toDateKey(t.date) === dateStr);
      const dayJournals = monthlyJournals.filter((j) => toDateKey(j.date) === dateStr);
      const dayRevs = monthlyRevisions.filter((r) => toDateKey(r.lastStudiedDate) === dateStr);
      const dayMins = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

      if (dayMins >= 360) highFocusDays++;
      else if (dayMins >= 180) modFocusDays++;
      else if (dayMins > 0) lightFocusDays++;
      else restDays++;

      dayDataMap[day] = {
        dateStr,
        minutes: dayMins,
        sessions: daySessions,
        mocks: dayMocks,
        journals: dayJournals,
        revisions: dayRevs,
      };
    }

    return {
      totalHours,
      activeDaysCount,
      mockTestsCount: monthlyTests.length,
      avgMockScore,
      avgDiscipline,
      dayDataMap,
      intensityDistribution: { highFocusDays, modFocusDays, lightFocusDays, restDays },
    };
  }, [sessions, mockTests, journals, revisions, year, month, daysInMonth]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayNumber(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayNumber(null);
  };

  const handleJumpToToday = () => {
    setCurrentDate(new Date());
    setSelectedDayNumber(new Date().getDate());
  };

  const selectedDayInfo = selectedDayNumber ? monthStats.dayDataMap[selectedDayNumber] : null;

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        Synthesizing monthly study intensity...
      </div>
    );
  }

  const todayDate = new Date();
  const isCurrentViewingMonth =
    todayDate.getFullYear() === year && todayDate.getMonth() === month;
  const currentTodayNumber = isCurrentViewingMonth ? todayDate.getDate() : -1;

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            MONTHLY REGISTER & STUDY INTENSITY
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            {monthName} {year}
          </h2>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={handleJumpToToday}
            className="px-3 py-1.5 bg-[#fbfbf9] border border-gray-300 rounded hover:bg-gray-100 text-gray-700 cursor-pointer font-bold"
          >
            Today
          </button>
          <button
            onClick={handlePrevMonth}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            ← Previous
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 cursor-pointer shadow-2xs"
          >
            Next →
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Hours Studied
          </span>
          <p className="text-2xl font-serif font-bold text-[#0f172a] mt-1">
            {monthStats.totalHours} <span className="text-xs font-normal text-gray-400 font-mono">hrs</span>
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Active Study Days
          </span>
          <p className="text-2xl font-mono font-bold text-emerald-700 mt-1">
            {monthStats.activeDaysCount}{" "}
            <span className="text-xs font-normal text-gray-400">/ {daysInMonth}</span>
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Mocks & Peak Avg
          </span>
          <p className="text-2xl font-mono font-bold text-blue-800 mt-1">
            {monthStats.mockTestsCount} mocks{" "}
            <span className="text-xs font-normal text-gray-500">
              ({monthStats.avgMockScore}%)
            </span>
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] font-mono uppercase text-gray-500 tracking-wider">
            Monthly Discipline
          </span>
          <p className="text-2xl font-serif font-bold text-[#991b1b] mt-1">
            {monthStats.avgDiscipline}{" "}
            <span className="text-xs font-normal text-gray-400 font-mono">/ 5</span>
          </p>
        </div>
      </div>

      {/* Study Intensity Calendar Box */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-serif font-bold text-gray-900 text-lg">Study Heatmap</h3>
            <span className="text-xs font-mono text-gray-400">
              Click any calendar day to inspect full sessions & error logs
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-500">
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-[#fbfbf9] border border-gray-200" /> Rest (0h)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-emerald-50 border border-emerald-200" /> 1–3h
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-400" /> 3–6h
            </span>
            <span className="flex items-center gap-1">
              <span className="h-3 w-3 rounded bg-emerald-600 border border-emerald-700 text-white" /> &gt;6h
            </span>
          </div>
        </div>

        {/* Days of Week Headers */}
        <div className="grid grid-cols-7 gap-2 text-center font-mono text-xs font-bold text-gray-400 uppercase py-1 border-b border-gray-100">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {/* Prefix Slots */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="h-28 bg-[#fbfbf9]/40 border border-dashed border-gray-100 rounded-lg"
            />
          ))}

          {/* Actual Calendar Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const data = monthStats.dayDataMap[dayNum];
            const hours = (data.minutes / 60).toFixed(1);
            const isToday = dayNum === currentTodayNumber;
            const isSelected = dayNum === selectedDayNumber;

            let bgClass = "bg-[#fbfbf9] border-gray-200 hover:border-gray-400";
            let hoursTextClass = "text-[#0f172a]";

            if (data.minutes >= 360) {
              bgClass = "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700";
              hoursTextClass = "text-white";
            } else if (data.minutes >= 180) {
              bgClass = "bg-emerald-100 border-emerald-400 text-emerald-950 hover:bg-emerald-200";
              hoursTextClass = "text-emerald-900";
            } else if (data.minutes > 0) {
              bgClass = "bg-emerald-50 border-emerald-200 hover:bg-emerald-100";
            }

            const latestDiscipline =
              data.journals.length > 0
                ? data.journals[data.journals.length - 1].disciplineRating
                : null;

            return (
              <div
                key={dayNum}
                onClick={() => setSelectedDayNumber(dayNum)}
                className={`h-28 border rounded-lg p-2.5 flex flex-col justify-between transition-all cursor-pointer relative shadow-2xs ${bgClass} ${
                  isSelected ? "ring-2 ring-[#0f172a] scale-[1.02] shadow-md z-10" : ""
                } ${isToday ? "border-l-4 border-l-[#991b1b]" : ""}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-mono text-xs font-bold ${
                        data.minutes >= 360 ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {dayNum}
                    </span>
                    {isToday && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[#991b1b]" title="Today" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    {data.mocks.length > 0 && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-blue-100 text-blue-900 font-bold border border-blue-300">
                        Mock ({data.mocks.length})
                      </span>
                    )}
                    {data.journals.length > 0 && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-medium">
                        ★ {latestDiscipline}/5 {data.journals.length > 1 ? `(${data.journals.length})` : ""}
                      </span>
                    )}
                  </div>
                </div>

                <div className="font-mono text-right">
                  {data.minutes > 0 ? (
                    <div>
                      <p className={`text-sm font-bold ${hoursTextClass}`}>{hours}h</p>
                      <span
                        className={`text-[10px] ${
                          data.minutes >= 360 ? "text-emerald-100" : "text-gray-500"
                        }`}
                      >
                        {data.sessions.length} blocks
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-300">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Drawer */}
      {selectedDayInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-md space-y-5">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
            <div>
              <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
                DAY INSPECTOR
              </span>
              <h3 className="font-serif font-bold text-gray-900 text-xl">
                {new Date(selectedDayInfo.dateStr).toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
            </div>
            <button
              onClick={() => setSelectedDayNumber(null)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-mono rounded cursor-pointer"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Focus Blocks */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-500 border-b border-gray-100 pb-1">
                Study Blocks ({selectedDayInfo.sessions.length})
              </h4>
              <div className="space-y-2">
                {selectedDayInfo.sessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-3 bg-[#fbfbf9] border border-gray-200 rounded text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[#0f172a]">
                        {sess.subject?.name || "General Study"}
                      </span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {sess.durationMinutes}m
                      </span>
                    </div>
                    {sess.topic && <p className="text-gray-600">{sess.topic.title}</p>}
                    {sess.notes && <p className="text-gray-400 italic text-[11px]">"{sess.notes}"</p>}
                  </div>
                ))}
                {selectedDayInfo.sessions.length === 0 && (
                  <p className="text-xs font-mono text-gray-400 py-3">No focus blocks recorded.</p>
                )}
              </div>
            </div>

            {/* Column 2: Mocks & Revisions */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-500 border-b border-gray-100 pb-1">
                Mock Tests & Revisions
              </h4>
              <div className="space-y-2">
                {selectedDayInfo.mocks.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-blue-50/50 border border-blue-200 rounded text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-blue-950">{m.title}</span>
                      <span className="font-mono font-bold text-blue-800">
                        {m.score}/{m.maxScore}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-blue-600 uppercase">
                      {m.category}
                    </span>
                  </div>
                ))}
                {selectedDayInfo.revisions.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-emerald-50/50 border border-emerald-200 rounded text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-emerald-950">
                        {r.subject?.name || "Revision Pass"}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700">✓ Revised</span>
                    </div>
                    {r.topic && <p className="text-emerald-800 text-[11px]">{r.topic.title}</p>}
                  </div>
                ))}
                {selectedDayInfo.mocks.length === 0 && selectedDayInfo.revisions.length === 0 && (
                  <p className="text-xs font-mono text-gray-400 py-3">No tests or revisions logged.</p>
                )}
              </div>
            </div>

            {/* Column 3: Journal Reflections (Displays all entries for the day) */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono uppercase font-bold text-gray-500 border-b border-gray-100 pb-1">
                Aspirant Journal Reviews ({selectedDayInfo.journals.length})
              </h4>
              <div className="space-y-3">
                {selectedDayInfo.journals.map((j, idx) => (
                  <div
                    key={j.id}
                    className="p-4 bg-[#fbfbf9] border border-gray-200 rounded text-xs space-y-2"
                  >
                    <div className="flex justify-between items-center font-mono text-[11px]">
                      <span className="text-gray-500 font-bold">
                        Entry #{idx + 1} • {new Date(j.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                          Discipline {j.disciplineRating}/5
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                          Energy {j.energyRating}/5
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="font-mono text-gray-400 text-[10px] uppercase block mb-0.5">
                        Execution Summary
                      </span>
                      <p className="text-gray-800 leading-relaxed font-sans font-medium">
                        {j.studiedSummary}
                      </p>
                    </div>
                    {j.accomplishments && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/60 p-1.5 rounded border border-emerald-100">
                        <strong>✓ Milestone:</strong> {j.accomplishments}
                      </div>
                    )}
                  </div>
                ))}
                {selectedDayInfo.journals.length === 0 && (
                  <p className="text-xs font-mono text-gray-400 py-3">
                    No reflection review written for this day.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}