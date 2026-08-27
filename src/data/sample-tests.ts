import { MockTestRecord, MistakeEntry } from "@/types/practice";

export const INITIAL_MOCK_TESTS: MockTestRecord[] = [
  {
    id: "mock-1",
    date: "2026-08-15",
    title: "Vision IAS Prelims Full Test 1",
    category: "PRELIMS_GS1",
    score: 94.5,
    maxScore: 200,
    totalQuestions: 100,
    correctCount: 56,
    wrongCount: 23,
    notes: "Need to cut down on wild guesses in Modern History.",
  },
  {
    id: "mock-2",
    date: "2026-08-20",
    title: "Forum IAS Simulator Test 2",
    category: "PRELIMS_GS1",
    score: 108.0,
    maxScore: 200,
    totalQuestions: 100,
    correctCount: 63,
    wrongCount: 18,
    notes: "Polity accuracy high. Economy questions were tricky.",
  },
];

export const INITIAL_MISTAKES: MistakeEntry[] = [
  {
    id: "mis-1",
    testId: "mock-1",
    subject: "Polity",
    topic: "Fundamental Rights (Art 19 vs 21)",
    questionSummary: "Right to Privacy and reasonable restrictions under emergency provisions.",
    reason: "Conceptual Confusion",
    correctConcept: "Art 20 and 21 cannot be suspended even during a National Emergency (44th Amendment).",
    revisionStage: 1,
  },
  {
    id: "mis-2",
    testId: "mock-2",
    subject: "Economy",
    topic: "Monetary Policy Transmission (Repo vs MSF)",
    questionSummary: "Impact of hike in Marginal Standing Facility rate on overnight liquidity.",
    reason: "Factual Gap",
    correctConcept: "MSF rate represents penal rate at which banks borrow overnight above repo band.",
    revisionStage: 0,
  },
];