
import { TaskPriority, TaskStatus, Project } from './types.ts';

export const COLORS = {
  primary: '#ff85b2',
  secondary: '#ffdeeb',
  accent: '#fff5f8',
  text: '#5c4b51',
  taskColors: [
    '#ffb8d1', // 粉
    '#b8e1ff', // 藍
    '#d1ffb8', // 綠
    '#fff7b8', // 黃
    '#e1b8ff', // 紫
  ],
  stickyNotes: [
    '#fff9c4', // 經典黃
    '#ffecf2', // 柔嫩粉
    '#e3f2fd', // 晴空藍
    '#f1f8e9', // 抹茶綠
    '#f3e5f5', // 薰衣草紫
  ],
  priority: {
    [TaskPriority.LOW]: '#e1f5fe',    // 淺藍
    [TaskPriority.MEDIUM]: '#fff9c4', // 淺黃
    [TaskPriority.HIGH]: '#ffebee'    // 淺紅
  },
  status: {
    [TaskStatus.TODO]: '#ffcdd2',        // 粉紅 (待處理)
    [TaskStatus.IN_PROGRESS]: '#ffe0b2',  // 粉橘 (進行中)
    [TaskStatus.COMPLETED]: '#c8e6c9'     // 薄荷綠 (已完成)
  }
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'root-1',
    name: '我的夢想計畫 🎀',
    parentId: null,
    notes: '這是我的第一個專案筆記！點擊左上角圖示可以換成 Emoji。',
    logoUrl: '📁', 
    precautions: ['記得要在圖表上放可愛的 Logo 喔！✨', '使用粉嫩色系（粉紅、粉藍、粉黃）。'],
    precautionsColor: '#fff9c4',
    tasks: [
      {
        id: 'task-1',
        title: '歡迎使用 Melody 管理工具',
        description: '這是一個示範任務。',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        progress: 30,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        color: '#ffb8d1'
      }
    ],
    children: [
      {
        id: 'child-1',
        name: '子專案範例 ✨',
        parentId: 'root-1',
        notes: '子專案的詳細說明。',
        logoUrl: '📁',
        precautions: [],
        precautionsColor: '#ffecf2',
        tasks: [],
        children: []
      }
    ]
  }
];
