import { StudyPlanItem } from "@/types/plan";

export const INITIAL_PLANS: StudyPlanItem[] = [
  {
    id: "plan-1",
    subject: "Modern History",
    topicSummary: "Spectrum Chapters 1-15 & Freedom Struggle Timeline",
    startDate: "2026-09-01",
    endDate: "2026-09-14",
    allocatedHoursPerDay: 4,
    status: "IN_PROGRESS",
  },
  {
    id: "plan-2",
    subject: "Indian Polity",
    topicSummary: "Laxmikanth: Executive, Parliament & Judiciary",
    startDate: "2026-09-15",
    endDate: "2026-09-30",
    allocatedHoursPerDay: 5,
    status: "UPCOMING",
  },
  {
    id: "plan-3",
    subject: "Economic & Social Development",
    topicSummary: "Macroeconomics NCERT + Budget & Economic Survey Highlights",
    startDate: "2026-10-01",
    endDate: "2026-10-20",
    allocatedHoursPerDay: 4,
    status: "UPCOMING",
  },
];