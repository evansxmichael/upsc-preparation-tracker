import { RevisionTask } from "@/types/revision";

export const INITIAL_REVISIONS: RevisionTask[] = [
  {
    id: "rev-1",
    subject: "Polity",
    topic: "Fundamental Rights (Articles 14–32)",
    lastStudiedDate: "2026-08-17",
    nextDueDate: "2026-08-24",
    intervalDays: 7,
    passCount: 2,
    notes: "Focus on reasonable restrictions under Article 19.",
  },
  {
    id: "rev-2",
    subject: "Economy",
    topic: "Inflation & Monetary Policy Transmission",
    lastStudiedDate: "2026-08-10",
    nextDueDate: "2026-08-24",
    intervalDays: 14,
    passCount: 3,
    notes: "Review MSF, Standing Deposit Facility (SDF) mechanisms.",
  },
  {
    id: "rev-3",
    subject: "Modern History",
    topic: "Revolt of 1857 & Administrative Shifts",
    lastStudiedDate: "2026-08-22",
    nextDueDate: "2026-08-25",
    intervalDays: 3,
    passCount: 1,
    notes: "Review key regional leaders and causes of failure.",
  },
];