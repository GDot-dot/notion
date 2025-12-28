
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Task, TaskStatus } from '../types';
import { COLORS } from '../constants.tsx';

interface ProgressBoardProps {
  tasks: Task[];
}

export const ProgressBoard: React.FC<ProgressBoardProps> = ({ tasks }) => {
  const stats = {
    todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
  };

  const unfinished = stats.todo + stats.inProgress;

  const chartData = [
    { name: '待處理', value: stats.todo, color: COLORS.status[TaskStatus.TODO] },
    { name: '進行中', value: stats.inProgress, color: COLORS.status[TaskStatus.IN_PROGRESS] },
    { name: '已完成', value: stats.completed, color: COLORS.status[TaskStatus.COMPLETED] },
  ].filter(d => d.value > 0);

  const total = tasks.length || 1;
  const completedRate = Math.round((stats.completed / total) * 100);

  return (
    <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 cute-shadow border border-pink-100 flex flex-col items-center h-full">
      <div className="w-full flex items-center justify-between mb-6">
        <h3 className="text-lg md:text-xl font-bold text-pink-600 flex items-center gap-2">
          <span className="text-2xl">📊</span> 進度分佈
        </h3>
        <div className="px-3 py-1 bg-pink-50 rounded-full text-xs font-black text-pink-400">
          共 {tasks.length} 個任務
        </div>
      </div>

      <div className="flex flex-col sm:flex-row w-full gap-8 items-center justify-center">
        <div className="relative w-48 h-48 md:w-56 md:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-3xl md:text-4xl font-black text-pink-500">{completedRate}%</span>
            <span className="text-[10px] md:text-xs text-pink-300 font-bold">完成率</span>
          </div>
        </div>

        <div className="flex-1 w-full space-y-3">
          {[
            { label: '待處理', count: stats.todo, color: COLORS.status[TaskStatus.TODO] },
            { label: '進行中', count: stats.inProgress, color: COLORS.status[TaskStatus.IN_PROGRESS] },
            { label: '已完成', count: stats.completed, color: COLORS.status[TaskStatus.COMPLETED] },
            { label: '未完成', count: unfinished, color: '#bdbdbd' }, // 灰黑色代表未完成
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 hover:bg-white transition-all border border-transparent hover:border-pink-50 group">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-bold text-[#5c4b51]">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-pink-400">{item.count}</span>
                <span className="text-[10px] text-gray-300 font-bold">任務</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {tasks.length === 0 && (
        <div className="mt-4 text-pink-200 italic text-sm">快去新增任務來填充圖表吧！🍓</div>
      )}
    </div>
  );
};
