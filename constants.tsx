
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
    notes: '這是我的第一個專案筆記！可以在這裡放 Logo。',
    logoUrl: 'https://picsum.photos/200/200?random=1',
    precautions: ['記得要在圖表上放可愛的 Logo 喔！✨', '使用粉嫩色系（粉紅、粉藍、粉黃）。'],
    tasks: [
      {
        id: 'task-1',
        title: '設計可愛圖示',
        description: '需要包含大耳狗與美樂蒂的元素。',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        progress: 60,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        color: '#ffb8d1'
      }
    ],
    children: [
      {
        id: 'child-1',
        name: '二級資料夾：子活動 ✨',
        parentId: 'root-1',
        notes: '子專案的詳細說明。',
        precautions: [],
        tasks: [],
        children: []
      }
    ]
  }
];
