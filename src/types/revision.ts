export type RevisionInterval = 1 | 3 | 7 | 14 | 30 | 60;

export interface RevisionTask {
  id: string;
  subject: string;
  topic: string;
  lastStudiedDate: string;
  nextDueDate: string;
  intervalDays: RevisionInterval;
  passCount: number;
  notes?: string;
}