export type StudySessionType =
  | "New Learning"
  | "Revision"
  | "PYQ"
  | "Mock Test"
  | "Answer Writing"
  | "Current Affairs"
  | "CSAT";

export interface StudySession {
  id: string;
  date: string;
  subject: string;
  topic: string;
  durationMinutes: number;
  sessionType: StudySessionType;
  notes?: string;
  createdAt: string;
}