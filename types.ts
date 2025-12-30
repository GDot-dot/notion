
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

export interface Attachment {
  id: string;
  name: string;
  url: string;
  path: string; // Firebase Storage 的路徑，用於刪除
  type: string;
  createdAt: string;
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
  attachments?: Attachment[];
}

export interface Project {
  id: string;
  name: string;
  logoUrl?: string;
  notes: string;
  precautions: string[];
  precautionsColor?: string;
  tasks: Task[];
  children: Project[];
  parentId: string | null;
  lastAccessedAt?: string;
  attachments?: Attachment[];
}

export type ViewType = 'dashboard' | 'gantt' | 'calendar' | 'notes';
