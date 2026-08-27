export interface JournalEntry {
  id: string;
  date: string;
  studiedSummary: string;
  accomplishments: string;
  obstacles: string;
  keyLearnings: string;
  tomorrowPlan: string;
  confidenceRating: number; // 1 to 5
  energyRating: number;     // 1 to 5
  disciplineRating: number; // 1 to 5
  createdAt: string;
}