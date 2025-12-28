
import React from 'react';
import { X, Calendar, Flag, AlignLeft, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project } from '../types';
import { COLORS } from '../constants';
import { format } from 'date-fns';

interface TaskDetailModalProps {
  task: Task;
  allProjects: Project[];
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, allProjects, onClose, onUpdate }) => {
  // 攤平所有專案以便選擇
  const flattenProjects = (projs: Project[]): Project[] => {
    return projs.reduce((acc: Project[], curr) => {
      return [...acc, curr, ...flattenProjects(curr.children)];
    }, []);
  };
  const flatProjectList = flattenProjects(allProjects);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[40px] border-l-4 border-pink-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-8 border-b border-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner bg-pink-50">
              🍬
            </div>
            <h2 className="text-xl font-bold text-pink-600">編輯任務詳情</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pink-50 rounded-full transition-colors text-pink-300">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* 標題區 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">任務名稱</label>
            <input 
              value={task.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="任務名稱..."
              className="text-2xl font-bold text-[#5c4b51] w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-pink-100 rounded-xl px-2 py-1"
            />
          </div>

          {/* 基本屬性 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 size={12} /> 狀態
              </label>
              <select 
                value={task.status}
                onChange={(e) => onUpdate({ status: e.target.value as TaskStatus })}
                className="w-full p-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-sm font-medium text-[#5c4b51] focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {Object.values(TaskStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
                <Flag size={12} /> 優先度
              </label>
              <select 
                value={task.priority}
                onChange={(e) => onUpdate({ priority: e.target.value as TaskPriority })}
                className="w-full p-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-sm font-medium text-[#5c4b51] focus:outline-none focus:ring-2 focus:ring-pink-200"
              >
                {Object.values(TaskPriority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
                <Calendar size={12} /> 開始日期
              </label>
              <input 
                type="date"
                value={task.startDate.split('T')[0]}
                onChange={(e) => onUpdate({ startDate: new Date(e.target.value).toISOString() })}
                className="w-full p-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-sm font-medium text-[#5c4b51] focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
                <Calendar size={12} /> 結束日期
              </label>
              <input 
                type="date"
                value={task.endDate.split('T')[0]}
                onChange={(e) => onUpdate({ endDate: new Date(e.target.value).toISOString() })}
                className="w-full p-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-sm font-medium text-[#5c4b51] focus:outline-none focus:ring-2 focus:ring-pink-200"
              />
            </div>
          </div>

          {/* 關聯專案 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
              <LinkIcon size={12} /> 關聯專案
            </label>
            <select 
              value={task.relatedProjectId || ''}
              onChange={(e) => onUpdate({ relatedProjectId: e.target.value || undefined })}
              className="w-full p-3 rounded-2xl bg-pink-50/50 border border-pink-100 text-sm font-medium text-[#5c4b51] focus:outline-none focus:ring-2 focus:ring-pink-200"
            >
              <option value="">無關聯專案</option>
              {flatProjectList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* 進度條 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">當前完成進度</label>
              <span className="text-sm font-bold text-pink-500">{task.progress}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={task.progress}
              onChange={(e) => onUpdate({ progress: parseInt(e.target.value) })}
              className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-400"
            />
          </div>

          {/* 筆記/內容區域 */}
          <div className="space-y-2 flex-1 flex flex-col">
            <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
              <AlignLeft size={12} /> 內容與注意事項
            </label>
            <textarea
              value={task.description}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="在這裡輸入任務筆記、詳細步驟或注意事項..."
              className="w-full flex-1 p-5 rounded-[30px] bg-pink-50/30 border border-pink-50 text-[#5c4b51] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-pink-200 min-h-[200px] resize-none"
            />
          </div>
        </div>

        <div className="p-8 border-t border-pink-50 text-center">
          <p className="text-[10px] text-pink-200 font-bold uppercase tracking-widest">
            Last Updated: {format(new Date(), 'yyyy-MM-dd HH:mm')} 🍓
          </p>
        </div>
      </div>
    </div>
  );
};
