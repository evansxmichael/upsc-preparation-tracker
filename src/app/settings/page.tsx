"use client";

import { useState, useEffect } from "react";

interface SystemSettingsData {
  prelimsTargetDate: string;
  mainsTargetDate: string;
  interviewDate?: string | null;
  dailyTargetHours: number;
  targetYear: number;
  optionalSubject?: string | null;
}

const REQUIRED_PASSKEY = "RESET-UPSC-2027";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Security Modal State
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [enteredPasskey, setEnteredPasskey] = useState("");
  const [passkeyError, setPasskeyError] = useState("");
  const [isWiping, setIsWiping] = useState(false);

  // Form States
  const [targetYear, setTargetYear] = useState<number>(2027);
  const [prelimsDate, setPrelimsDate] = useState<string>("2027-05-23");
  const [mainsDate, setMainsDate] = useState<string>("2027-09-17");
  const [interviewDate, setInterviewDate] = useState<string>("2028-02-15");
  const [dailyTargetHours, setDailyTargetHours] = useState<number>(6.0);
  const [optionalSubject, setOptionalSubject] = useState<string>("Sociology");

  const toInputDate = (dStr?: string | null) => {
    if (!dStr) return "";
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  };

  const calculateDaysLeft = (targetDateStr: string) => {
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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data: SystemSettingsData = await res.json();
        setTargetYear(data.targetYear || 2027);
        setPrelimsDate(toInputDate(data.prelimsTargetDate) || "2027-05-23");
        setMainsDate(toInputDate(data.mainsTargetDate) || "2027-09-17");
        setInterviewDate(toInputDate(data.interviewDate) || "2028-02-15");
        setDailyTargetHours(data.dailyTargetHours || 6.0);
        setOptionalSubject(data.optionalSubject || "Sociology");
      }
    } catch (e) {
      console.error("Failed to load settings from DB", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetYear: Number(targetYear) || 2027,
          prelimsTargetDate: prelimsDate,
          mainsTargetDate: mainsDate,
          interviewDate: interviewDate || null,
          dailyTargetHours: Number(dailyTargetHours) || 6.0,
          optionalSubject: optionalSubject.trim() || null,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportAll = async () => {
    try {
      const res = await fetch("/api/settings?action=EXPORT_ALL");
      if (res.ok) {
        const snapshot = await res.json();
        const dataStr =
          "data:text/json;charset=utf-8," +
          encodeURIComponent(JSON.stringify(snapshot, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute(
          "download",
          `upsc_master_db_snapshot_${new Date().toISOString().slice(0, 10)}.json`
        );
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch (err) {
      console.error("Failed to export full database", err);
    }
  };

  const handleSecureReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPasskey !== REQUIRED_PASSKEY) {
      setPasskeyError(`Invalid passcode. Please type "${REQUIRED_PASSKEY}"`);
      return;
    }

    try {
      setIsWiping(true);
      setPasskeyError("");
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESET_SYSTEM",
          passkey: enteredPasskey,
        }),
      });

      if (res.ok) {
        alert("Database activity logs securely wiped.");
        setShowSecurityModal(false);
        window.location.href = "/";
      } else {
        const err = await res.json();
        setPasskeyError(err.error || "Wipe rejected by server.");
      }
    } catch (err) {
      console.error("Failed to reset database", err);
      setPasskeyError("Network error during wipe.");
    } finally {
      setIsWiping(false);
    }
  };

  const prelimsDays = calculateDaysLeft(prelimsDate);
  const mainsDays = calculateDaysLeft(mainsDate);
  const interviewDays = calculateDaysLeft(interviewDate);

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-xs text-gray-500">
        Loading system configuration & target dates...
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none pb-28">
      {/* Top Header */}
      <div className="border-b border-gray-200 pb-3">
        <span className="text-xs font-mono uppercase text-[#991b1b] font-semibold tracking-wider">
          SYSTEM CONFIGURATION & EXAMINATION MILESTONES
        </span>
        <h2 className="text-2xl font-serif font-bold text-[#0f172a] mt-0.5">
          Application Settings & Data Control
        </h2>
      </div>

      {/* Live Stage Countdown Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <div className="p-4 bg-white border-l-4 border-l-[#991b1b] border-t border-r border-b border-gray-200 rounded-r-lg shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase text-gray-500 font-bold">
              Prelims {targetYear}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-700 rounded border border-red-200">
              GS-1 & CSAT
            </span>
          </div>
          <p className="text-3xl font-serif font-bold text-[#0f172a] mt-2">
            {prelimsDays}{" "}
            <span className="text-xs font-normal text-gray-400 font-mono">
              days left
            </span>
          </p>
          <span className="text-[11px] text-gray-400 block mt-1">
            Target: {new Date(prelimsDate).toLocaleDateString()}
          </span>
        </div>

        <div className="p-4 bg-white border-l-4 border-l-blue-600 border-t border-r border-b border-gray-200 rounded-r-lg shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase text-gray-500 font-bold">
              Mains {targetYear}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">
              9 Written Papers
            </span>
          </div>
          <p className="text-3xl font-serif font-bold text-[#0f172a] mt-2">
            {mainsDays}{" "}
            <span className="text-xs font-normal text-gray-400 font-mono">
              days left
            </span>
          </p>
          <span className="text-[11px] text-gray-400 block mt-1">
            Target: {new Date(mainsDate).toLocaleDateString()}
          </span>
        </div>

        <div className="p-4 bg-white border-l-4 border-l-emerald-600 border-t border-r border-b border-gray-200 rounded-r-lg shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase text-gray-500 font-bold">
              Personality Test
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
              Dholpur House
            </span>
          </div>
          <p className="text-3xl font-serif font-bold text-[#0f172a] mt-2">
            {interviewDays}{" "}
            <span className="text-xs font-normal text-gray-400 font-mono">
              days left
            </span>
          </p>
          <span className="text-[11px] text-gray-400 block mt-1">
            Target: {new Date(interviewDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form: Target Dates & Preferences */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 shadow-2xs space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-serif font-bold text-gray-900 text-lg">
              Target Examination Dates & Study Target
            </h3>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              Updates global countdown timers, daily capacity calculations, and planning engine.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="block text-gray-600 mb-1 font-semibold">
                🎯 Target Exam Year
              </label>
              <input
                type="number"
                min="2026"
                max="2032"
                value={targetYear}
                onChange={(e) => setTargetYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-semibold">
                ⏱️ Daily Target Hours
              </label>
              <input
                type="number"
                min="1"
                max="16"
                step="0.5"
                value={dailyTargetHours}
                onChange={(e) => setDailyTargetHours(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-semibold">
                📅 Target Prelims Date
              </label>
              <input
                type="date"
                value={prelimsDate}
                onChange={(e) => setPrelimsDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-semibold">
                📅 Target Mains Date
              </label>
              <input
                type="date"
                value={mainsDate}
                onChange={(e) => setMainsDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-semibold">
                📅 Target Interview / Personality Test
              </label>
              <input
                type="date"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-gray-600 mb-1 font-semibold">
                📖 Optional Subject
              </label>
              <input
                type="text"
                placeholder="e.g. Sociology, PSIR, Geography, History"
                value={optionalSubject}
                onChange={(e) => setOptionalSubject(e.target.value)}
                className="w-full px-3 py-2 bg-[#fbfbf9] border border-gray-200 rounded focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 font-mono text-xs">
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-5 py-2 bg-[#0f172a] text-white rounded hover:bg-black font-bold cursor-pointer transition shadow-2xs disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Configuration"}
            </button>
            {saveSuccess && (
              <span className="text-emerald-700 font-bold">
                ✓ Settings & Configuration Saved Successfully
              </span>
            )}
          </div>
        </div>

        {/* Database Backup & Control Box */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-gray-900 text-lg">
              Account Data Management
            </h3>
            <p className="text-xs text-gray-600 font-sans leading-relaxed">
              Export a complete portable JSON snapshot containing your syllabus progression,
              mock records, mistake book, revisions, and study sessions.
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs pt-2">
            <button
              type="button"
              onClick={handleExportAll}
              className="w-full py-2.5 bg-white border border-gray-300 rounded text-gray-800 hover:bg-gray-50 cursor-pointer shadow-2xs font-semibold flex items-center justify-center gap-2"
            >
              <span>📥</span> Export Complete Data Backup (.JSON)
            </button>

            <button
              type="button"
              onClick={() => {
                setEnteredPasskey("");
                setPasskeyError("");
                setShowSecurityModal(true);
              }}
              className="w-full py-2.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded cursor-pointer font-bold transition flex items-center justify-center gap-2"
            >
              <span>🔒</span> Secure Reset Activity Logs
            </button>
          </div>
        </div>
      </div>

      {/* Security Passcode Confirmation Modal */}
      {showSecurityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <span className="text-xl">⚠️</span>
              <h3 className="font-serif font-bold text-gray-900 text-lg">
                Protected System Wipe
              </h3>
            </div>

            <p className="text-xs text-gray-600 font-sans leading-relaxed">
              This action will delete all recorded study sessions, mock tests, mistake entries,
              spaced repetition tasks, and journal logs from your account.
            </p>

            <form onSubmit={handleSecureReset} className="space-y-4">
              <div className="p-3 bg-red-50/70 border border-red-200 rounded text-xs font-mono space-y-1">
                <span className="text-red-900 font-bold block">
                  Security Confirmation Required:
                </span>
                <span className="text-red-700 text-[11px]">
                  Type <strong className="bg-red-100 px-1 py-0.5 rounded text-red-900 select-all">{REQUIRED_PASSKEY}</strong> to authorize:
                </span>
              </div>

              <div>
                <input
                  type="text"
                  required
                  placeholder={`Enter "${REQUIRED_PASSKEY}"`}
                  value={enteredPasskey}
                  onChange={(e) => {
                    setEnteredPasskey(e.target.value);
                    setPasskeyError("");
                  }}
                  className="w-full px-3 py-2 font-mono text-xs bg-[#fbfbf9] border border-gray-300 rounded focus:outline-hidden uppercase tracking-wider font-bold"
                />
                {passkeyError && (
                  <span className="text-[11px] font-mono text-red-600 font-bold block mt-1">
                    {passkeyError}
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowSecurityModal(false)}
                  className="px-3.5 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWiping}
                  className="px-4 py-1.5 rounded bg-red-700 text-white hover:bg-red-800 font-bold cursor-pointer disabled:opacity-50"
                >
                  {isWiping ? "Wiping Data..." : "Authorize & Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}