
export enum TaskStatus {
  TODO = '待處理',
  IN_PROGRESS = '進行中',
  COMPLETED = '已完成'
}

export enum TaskPriority {
  LOW = '低',
  MEDIUM = '中',
  HIGH = '高'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: TaskStatus;
  priority: TaskPriority;
  color: string;
  relatedProjectId?: string;
}

export interface Project {
  id: string;
  name: string;
  logoUrl?: string;
  notes: string;
  precautions: string[]; // 專案注意事項小叮嚀
  precautionsColor?: string; // 注意事項區域的背景顏色
  tasks: Task[];
  children: Project[];
  parentId: string | null;
}

export type ViewType = 'dashboard' | 'gantt' | 'calendar' | 'notes';
