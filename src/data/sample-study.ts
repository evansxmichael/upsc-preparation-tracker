import { StudySession } from "@/types/study";

export const INITIAL_STUDY_SESSIONS: StudySession[] = [
  {
    id: "sess-1",
    date: "2026-08-24",
    subject: "Polity",
    topic: "Laxmikanth Ch. 5 — Parliament & Committee System",
    durationMinutes: 120,
    sessionType: "New Learning",
    notes: "Focused on Financial Committees: Public Accounts vs Estimates.",
    createdAt: "2026-08-24T10:30:00Z",
  },
  {
    id: "sess-2",
    date: "2026-08-24",
    subject: "Polity",
    topic: "Fundamental Rights (Articles 14-18)",
    durationMinutes: 45,
    sessionType: "Revision",
    notes: "Spaced revision pass 1 completed.",
    createdAt: "2026-08-24T14:15:00Z",
  },
  {
    id: "sess-3",
    date: "2026-08-24",
    subject: "CSAT",
    topic: "Reading Comprehension & Critical Reasoning",
    durationMinutes: 50,
    sessionType: "CSAT",
    notes: "Solved 25 PYQs from 2023-2024 paper.",
    createdAt: "2026-08-24T16:00:00Z",
  },
];