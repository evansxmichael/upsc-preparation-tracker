export type TestCategory = "PRELIMS_GS1" | "PRELIMS_CSAT" | "MAINS_GS" | "MAINS_ESSAY" | "OPTIONAL";

export type MistakeReason = 
  | "Conceptual Confusion"
  | "Factual Gap"
  | "Misread Question"
  | "Silly Mistake"
  | "Time Pressure";

export interface MistakeEntry {
  id: string;
  testId: string;
  subject: string;
  topic: string;
  questionSummary: string;
  reason: MistakeReason;
  correctConcept: string;
  revisionStage: 0 | 1 | 2 | 3; // 0 = Due, 1 = 1st pass, 2 = 2nd pass, 3 = Mastered
}

export interface MockTestRecord {
  id: string;
  date: string;
  title: string;
  category: TestCategory;
  score: number;
  maxScore: number;
  totalQuestions?: number;
  correctCount?: number;
  wrongCount?: number;
  notes?: string;
}