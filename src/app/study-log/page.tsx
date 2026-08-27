"use client";

import { useState, useEffect, useRef } from "react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export type StudySessionType =
  | "NEW_LEARNING"
  | "REVISION"
  | "PYQ"
  | "MOCK_TEST"
  | "ANSWER_WRITING"
  | "CURRENT_AFFAIRS"
  | "CSAT";

interface StudySession {
  id: string;
  durationMinutes: number;
  sessionType: StudySessionType;
  notes?: string | null;
  date: string;
  subject?: { id: string; name: string } | null;
  topic?: { id: string; title: string } | null;
}

interface SyllabusCategory {
  id: string;
  title: string;
  subjects: {
    id: string;
    name: string;
    topics: { id: string; title: string }[];
  }[];
}

const SESSION_TYPES: { label: string; value: StudySessionType }[] = [
  { label: "New Learning", value: "NEW_LEARNING" },
  { label: "Revision", value: "REVISION" },
  { label: "PYQ", value: "PYQ" },
  { label: "Mock Test", value: "MOCK_TEST" },
  { label: "Answer Writing", value: "ANSWER_WRITING" },
  { label: "Current Affairs", value: "CURRENT_AFFAIRS" },
  { label: "CSAT", value: "CSAT" },
];

const TIMER_PRESETS = [
  { label: "25 min (Pomodoro)", minutes: 25 },
  { label: "50 min (Deep Work)", minutes: 50 },
  { label: "60 min (Full Hour)", minutes: 60 },
  { label: "90 min (Intensive)", minutes: 90 },
];

export default function StudyLogPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [categories, setCategories] = useState<SyllabusCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudySession | null>(null);

  // Date Filter State
  const [filterDate, setFilterDate] = useState<string>("");

  // Focus Timer States
  const [selectedPreset, setSelectedPreset] = useState<number>(50);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(50 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerSubjectId, setTimerSubjectId] = useState<string>("");
  const [timerTopicId, setTimerTopicId] = useState<string>("");
  const [timerType, setTimerType] = useState<StudySessionType>("NEW_LEARNING");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Manual Session Form States
  const [manualDate, setManualDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [manualSubjectId, setManualSubjectId] = useState<string>("");
  const [manualTopicId, setManualTopicId] = useState<string>("");
  const [manualMinutes, setManualMinutes] = useState<number>(60);
  const [manualType, setManualType] = useState<StudySessionType>("NEW_LEARNING");
  const [manualNotes, setManualNotes] = useState<string>("");

  // Load from PostgreSQL API
  const fetchDbData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, syllabusRes] = await Promise.all([
        fetch("/api/study"),
        fetch("/api/syllabus"),
      ]);

      if (sessionsRes.ok) {
        const sessionData = await sessionsRes.json();
        setSessions(sessionData);
      }
      if (syllabusRes.ok) {
        const sylData = await syllabusRes.json();
        setCategories(sylData);
        if (sylData.length > 0 && sylData[0].subjects.length > 0) {
          setTimerSubjectId(sylData[0].subjects[0].id);
          setManualSubjectId(sylData[0].subjects[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load study sessions from DB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDbData();
  }, []);

  // Timer Tick Logic
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleSelectPreset = (mins: number) => {
    setIsTimerRunning(false);
    setSelectedPreset(mins);
    setTimeLeftSeconds(mins * 60);
  };

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimeLeftSeconds(selectedPreset * 60);
  };

  const handleSaveToPostgres = async (sessionData: {
    durationMinutes: number;
    sessionType: StudySessionType;
    notes?: string;
    subjectId?: string;
    topicId?: string;
  }) => {
    try {
      const res = await fetch("/api/study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sessionData),
      });

      if (res.ok) {
        const savedSession = await res.json();
        setSessions((prev) => [savedSession, ...prev]);
      }
    } catch (err) {
      console.error("Failed to log session in DB", err);
    }
  };

  const handleTimerComplete = async () => {
    const elapsedMinutes = selectedPreset;
    await handleSaveToPostgres({
      durationMinutes: elapsedMinutes,
      sessionType: timerType,
      subjectId: timerSubjectId || undefined,
      topicId: timerTopicId || undefined,
      notes: `Completed via Focus Timer (${selectedPreset}m target).`,
    });

    alert(`🎉 Focus Session completed! Added ${elapsedMinutes} minutes to your Study Log.`);
    setTimeLeftSeconds(selectedPreset * 60);
  };

  const handleSaveEarlySession = async () => {
    const elapsedSecs = selectedPreset * 60 - timeLeftSeconds;
    const elapsedMins = Math.round(elapsedSecs / 60);

    if (elapsedMins < 1) {
      alert("Session too short to record (< 1 minute).");
      return;
    }

    await handleSaveToPostgres({
      durationMinutes: elapsedMins,
      sessionType: timerType,
      subjectId: timerSubjectId || undefined,
      topicId: timerTopicId || undefined,
      notes: `Focus Timer session saved early.`,
    });

    resetTimer();
  };

  const handleManualAddSession = async (e: React.FormEvent) => {
    e.preventDefault();

    await handleSaveToPostgres({
      durationMinutes: Number(manualMinutes) || 30,
      sessionType: manualType,
      subjectId: manualSubjectId || undefined,
      topicId: manualTopicId || undefined,
      notes: manualNotes.trim() || undefined,
    });

    setManualNotes("");
    setShowManualAddModal(false);
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // Helper selectors
  const allSubjects = categories.flatMap((c) => c.subjects);
  const timerCurrentSubject = allSubjects.find((s) => s.id === timerSubjectId);
  const manualCurrentSubject = allSubjects.find((s) => s.id === manualSubjectId);

  // Filtered Sessions
  const filteredSessions = filterDate
    ? sessions.filter(
        (s) => new Date(s.date).toISOString().slice(0, 10) === filterDate
      )
    : sessions;

  // Metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter(
    (s) => new Date(s.date).toISOString().slice(0, 10) === todayStr
  );
  const todayTotalMinutes = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const todayHours = (todayTotalMinutes / 60).toFixed(1);

  const allTotalMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const allTotalHours = (allTotalMinutes / 60).toFixed(1);

  const formatTimerDisplay = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const timerProgress = Math.round(
    ((selectedPreset * 60 - timeLeftSeconds) / (selectedPreset * 60)) * 100
  );

  if (loading) {
  return (
    <div className="py-20 text-center font-mono text-xs text-gray-500">
      Loading focus logs and study records...
    </div>
  );
}

  return (
    <div className="space-y-6 select-none pb-24">
      {/* Top Header */}
      <div className="flex justify-between items-center border-b border-gray-200 pb-3">
        <div>
          <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
            RELATIONAL EXECUTION & TIME ENGINE
          </span>
          <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
            Study Log & Focus Timer
          </h2>
        </div>
        <button
          onClick={() => setShowManualAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0f172a] text-white rounded text-xs font-mono hover:bg-black shadow-2xs transition cursor-pointer font-medium"
        >
          <span>+</span> Log Study Session
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Today's Hours</span>
          <p className="text-2xl font-serif font-bold text-[#0f172a] mt-1">
            {todayHours} <span className="text-xs font-normal text-gray-400">hrs</span>
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Today's Sessions</span>
          <p className="text-2xl font-bold text-blue-800 mt-1">{todaySessions.length}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Total Recorded</span>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {allTotalHours} <span className="text-xs font-normal text-gray-400">hrs</span>
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-2xs">
          <span className="text-[11px] uppercase text-gray-500 tracking-wider">Total Logs</span>
          <p className="text-2xl font-serif font-bold text-[#991b1b] mt-1">{sessions.length}</p>
        </div>
      </div>

      {/* Pomodoro Focus Timer Command Box */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-2xs space-y-5">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#991b1b] animate-ping" />
            <h3 className="font-serif font-bold text-gray-900 text-lg">Active Focus Session</h3>
          </div>
          <div className="flex gap-1.5 font-mono text-xs">
            {TIMER_PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => handleSelectPreset(p.minutes)}
                disabled={isTimerRunning}
                className={`px-2.5 py-1 rounded cursor-pointer transition ${
                  selectedPreset === p.minutes
                    ? "bg-[#0f172a] text-white font-medium"
                    : "bg-[#fbfbf9] text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {p.minutes}m
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Timer Clock */}
          <div className="text-center md:text-left space-y-2">
            <div className="font-mono text-6xl font-bold tracking-tight text-[#0f172a]">
              {formatTimerDisplay(timeLeftSeconds)}
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#991b1b] h-full transition-all duration-500"
                style={{ width: `${timerProgress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-gray-400">
              {timerProgress}% of interval elapsed
            </span>
          </div>

          {/* Session Meta Inputs */}
          <div className="space-y-3 font-sans text-xs">
            <div>
              <label className="block font-mono text-gray-500 mb-1">Focus Subject</label>
              <select
                value={timerSubjectId}
                onChange={(e) => {
                  setTimerSubjectId(e.target.value);
                  setTimerTopicId("");
                }}
                className="w-full px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              >
                <option value="">-- Select Subject --</option>
                {allSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-mono text-gray-500 mb-1">Specific Topic</label>
              <select
                value={timerTopicId}
                onChange={(e) => setTimerTopicId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              >
                <option value="">-- Select Topic (Optional) --</option>
                {timerCurrentSubject?.topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="flex flex-col gap-2 font-mono text-xs">
            <button
              onClick={toggleTimer}
              className={`w-full py-2.5 rounded font-bold transition cursor-pointer shadow-xs ${
                isTimerRunning
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-[#0f172a] hover:bg-black text-white"
              }`}
            >
              {isTimerRunning ? "⏸ Pause Timer" : "▶ Start Focus Timer"}
            </button>

            <div className="flex gap-2">
              <button
                onClick={resetTimer}
                className="flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={handleSaveEarlySession}
                className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded transition cursor-pointer font-medium"
              >
                Save Log Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* History Table & Sessions List */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
          <h3 className="font-serif font-bold text-gray-900 text-lg">
            Logged Study Sessions ({filteredSessions.length})
          </h3>

          {/* Filtration Calendar */}
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-gray-400 text-[11px]">Filter by date:</span>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-2.5 py-1 text-xs bg-white border border-gray-200 rounded focus:outline-hidden font-mono"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="text-[11px] text-gray-500 hover:text-black underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {filteredSessions.map((item) => {
          const hours = Math.floor(item.durationMinutes / 60);
          const mins = item.durationMinutes % 60;
          const timeText = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ""}` : `${mins}m`;

          return (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs hover:border-gray-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-bold uppercase text-[#991b1b]">
                    {item.subject?.name || "General Study"}
                  </span>
                  <span className="text-gray-300">•</span>
                  <h4 className="font-serif font-bold text-gray-900 text-base">
                    {item.topic?.title || "Focus Block"}
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700">
                    {item.sessionType.replace("_", " ")}
                  </span>
                </div>

                {item.notes && (
                  <p className="text-xs text-gray-600 font-sans">{item.notes}</p>
                )}

                <div className="flex items-center gap-4 text-xs font-mono text-gray-400">
                  <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-5 self-end md:self-center font-mono">
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                    DURATION
                  </span>
                  <p className="text-lg font-bold text-[#0f172a]">{timeText}</p>
                </div>

                <button
                  onClick={() => setDeleteTarget(item)}
                  className="text-gray-300 hover:text-red-600 p-1.5 transition cursor-pointer text-base"
                  title="Delete Log"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
  <div className="text-center py-12 bg-white border border-dashed border-gray-300 rounded-lg">
    <p className="text-xs font-mono text-gray-400">
      {filterDate
        ? `No study sessions recorded for ${filterDate}.`
        : "No study sessions recorded yet."}
    </p>
  </div>
)}
      </div>

      {/* Manual Add Session Modal */}
      {showManualAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-gray-900 text-lg">Log Study Session</h3>
            <form onSubmit={handleManualAddSession} className="space-y-3 font-sans text-sm">
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Subject</label>
                  <select
                    value={manualSubjectId}
                    onChange={(e) => {
                      setManualSubjectId(e.target.value);
                      setManualTopicId("");
                    }}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    <option value="">-- Select Subject --</option>
                    {allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Topic Studied</label>
                <select
                  value={manualTopicId}
                  onChange={(e) => setManualTopicId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                >
                  <option value="">-- Select Topic (Optional) --</option>
                  {manualCurrentSubject?.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block text-gray-500 mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    required
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1">Session Type</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as StudySessionType)}
                    className="w-full px-2 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                  >
                    {SESSION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-500 mb-1">Notes / Key Takeaway</label>
                <textarea
                  rows={2}
                  placeholder="Summary of what was retained or practiced..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowManualAddModal(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#0f172a] text-white hover:bg-black font-bold cursor-pointer"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Study Record"
        message={`Are you sure you want to remove the session for "${deleteTarget?.topic?.title || "this session"}"?`}
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}