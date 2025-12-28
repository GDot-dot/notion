
import React from 'react';
import { format, eachDayOfInterval, isSameDay, addDays, differenceInDays } from 'date-fns';
import { Task } from '../types';

interface GanttChartProps {
  tasks: Task[];
}

export const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  if (tasks.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-white rounded-[40px] border-2 border-dashed border-pink-200 text-pink-300">
        <p>目前沒有排程任務 🍰</p>
      </div>
    );
  }

  // 自動找出任務涵蓋的日期範圍
  const allDates = tasks.flatMap(t => [new Date(t.startDate), new Date(t.endDate)]);
  // Replace startOfDay, min, and max with native JS logic as they are reported missing from the imported date-fns package
  const minTime = Math.min(...allDates.map(d => d.getTime()));
  const maxTime = Math.max(...allDates.map(d => d.getTime()));
  
  const rangeStart = new Date(minTime);
  rangeStart.setHours(0, 0, 0, 0);
  
  const rangeEnd = addDays(new Date(maxTime), 14);
  
  const allDays = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  
  // 僅顯示每 5 天的日期標籤作為表頭
  const headerDays = allDays.filter((_, i) => i % 5 === 0);

  return (
    <div className="bg-white rounded-[40px] p-8 cute-shadow border border-pink-100 overflow-hidden">
      <h2 className="text-xl font-bold text-pink-600 mb-8 flex items-center gap-2">
        <span className="text-2xl">❤️</span> 專案開發甘特圖
      </h2>
      
      <div className="overflow-x-auto custom-scrollbar pb-4">
        <div className="min-w-[900px]">
          {/* 表頭 */}
          <div className="flex mb-4 relative h-8">
            <div className="w-48 flex-shrink-0 font-bold text-pink-400 text-lg pl-2">任務名稱</div>
            <div className="flex-1 relative">
              {headerDays.map((day, idx) => {
                const leftPos = differenceInDays(day, rangeStart) * 35;
                return (
                  <div key={idx} className="absolute text-[11px] font-bold text-pink-300" style={{ left: `${leftPos}px` }}>
                    {format(day, 'MM/dd')}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 任務行 */}
          <div className="space-y-6">
            {tasks.map((task) => {
              // Replace startOfDay with native Date manipulation
              const start = new Date(task.startDate);
              start.setHours(0, 0, 0, 0);
              const end = new Date(task.endDate);
              end.setHours(0, 0, 0, 0);
              
              const left = differenceInDays(start, rangeStart) * 35;
              const width = (differenceInDays(end, start) + 1) * 35;
              const duration = differenceInDays(end, start) + 1;

              return (
                <div key={task.id} className="flex group items-center">
                  <div className="w-48 flex-shrink-0">
                    <div className="text-sm font-bold text-[#5c4b51] truncate">{task.title}</div>
                    <div className="text-[10px] text-pink-300 font-bold">{task.progress}% 完成</div>
                  </div>
                  <div className="flex-1 relative h-8">
                    <div 
                      className="absolute top-0 h-6 rounded-full shadow-sm transition-transform group-hover:scale-[1.02] cursor-pointer flex items-center justify-end pr-3"
                      style={{ 
                        left: `${left}px`, 
                        width: `${width}px`,
                        backgroundColor: task.color + '33',
                        border: `2px solid ${task.color}`
                      }}
                    >
                      <div 
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000" 
                        style={{ width: `${task.progress}%`, backgroundColor: task.color }} 
                      />
                      <span className="relative z-10 text-[10px] font-bold text-white drop-shadow-sm">{duration}天</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
