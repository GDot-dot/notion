
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Task } from '../types';

interface ProgressBoardProps {
  tasks: Task[];
}

export const ProgressBoard: React.FC<ProgressBoardProps> = ({ tasks }) => {
  const averageProgress = tasks.length > 0 
    ? Math.round(tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length)
    : 0;

  const data = [
    { name: 'Completed', value: averageProgress },
    { name: 'Remaining', value: 100 - averageProgress },
  ];

  return (
    <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 cute-shadow border border-pink-100 flex flex-col sm:flex-row gap-6 md:gap-8 items-center h-full">
      <div className="w-full sm:w-1/2 flex flex-col items-center">
        <h3 className="text-lg md:text-xl font-bold text-blue-500 mb-6 flex items-center gap-2 self-start">
          <span className="text-2xl">📊</span> 總體進度表
        </h3>
        <div className="relative w-40 h-40 md:w-48 md:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={80}
                startAngle={90}
                endAngle={450}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="#ff8ba7" />
                <Cell fill="#e0f2f1" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl md:text-4xl font-bold text-pink-500">{averageProgress}%</span>
            <span className="text-[10px] md:text-xs text-pink-300 font-bold">總體進度</span>
          </div>
        </div>
      </div>

      <div className="w-full sm:w-1/2 space-y-4">
        {tasks.slice(0, 4).map((task) => (
          <div key={task.id} className="space-y-1">
            <div className="flex justify-between text-xs md:text-sm font-bold text-[#5c4b51]">
              <span className="truncate pr-2">{task.title}</span>
              <span className="text-pink-400">{task.progress}%</span>
            </div>
            <div className="h-2.5 md:h-3 bg-pink-50 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${task.progress}%`, backgroundColor: task.color }}
              />
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-10 text-pink-200 italic text-sm">尚無進度數據 🍓</div>
        )}
      </div>
    </div>
  );
};
