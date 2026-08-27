export type PlanStatus = "UPCOMING" | "IN_PROGRESS" | "COMPLETED";

export interface StudyPlanItem {
  id: string;
  subject: string;
  topicSummary: string;
  startDate: string;
  endDate: string;
  allocatedHoursPerDay: number;
  status: PlanStatus;
}