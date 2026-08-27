export type MasteryLevel = "NOT_STARTED" | "LEARNING" | "COMPLETED" | "REVISED" | "MASTERED";

export interface SyllabusTopic {
  id: string;
  title: string;
  status: MasteryLevel;
  difficulty?: "Easy" | "Medium" | "Hard";
  revisionsCount: number;
  pyqsAttempted?: number;
}

export interface SyllabusSectionData {
  id: string;
  name: string;
  topics: SyllabusTopic[];
}

export interface SyllabusTier {
  id: "foundation" | "prelims" | "mains" | "optional";
  title: string;
  sections: SyllabusSectionData[];
}