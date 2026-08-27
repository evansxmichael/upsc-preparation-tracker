export interface NavItem {
  name: string;
  href: string;
  iconName: string;
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Dashboard", href: "/", iconName: "LayoutDashboard" },
  { name: "Syllabus", href: "/syllabus", iconName: "BookOpen" },
  { name: "Study Log", href: "/study-log", iconName: "Clock" },
  { name: "Plan", href: "/plan", iconName: "CalendarDays" },
  { name: "Revision", href: "/revision", iconName: "RotateCcw" },
  { name: "PYQs", href: "/pyq", iconName: "HelpCircle" },
  { name: "Answer Writing", href: "/answers", iconName: "PenTool" },
  { name: "Mock Tests", href: "/mock-tests", iconName: "FileCheck" },
  { name: "Journal", href: "/journal", iconName: "BookText" },
  { name: "Resources", href: "/resources", iconName: "FolderArchive" },
  { name: "Monthly", href: "/monthly", iconName: "Calendar" },
  { name: "Analytics", href: "/analytics", iconName: "BarChart3" },
  { name: "Settings", href: "/settings", iconName: "Settings" },
];