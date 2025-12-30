
import React, { useState } from 'react';
import { X, Calendar, Flag, AlignLeft, CheckCircle2, Eye, Edit3, Link as LinkIcon, ExternalLink, Trash2, Plus, Globe, ImageIcon, FileText } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, Attachment, ResourceCategory } from '../types.ts';
import { COLORS } from '../constants.tsx';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskDetailModalProps {
  task: Task;
  allProjects: Project[];
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate }) => {
  const [isPreview, setIsPreview] = useState(false);

  const handleAddLink = () => {
    const name = prompt("🍓 連結標題");
    if (!name) return;
    const url = prompt("🌐 請貼上網址");
    if (!url) return;

    let category: ResourceCategory = 'link';
    if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) category = 'image';
    else if (url.includes('docs.google.com')) category = 'document';

    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      url,
      category,
      createdAt: new Date().toISOString()
    };
    onUpdate({ attachments: [...(task.attachments || []), newAttachment] });
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[40px] border-l-4 border-pink-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-8 border-b border-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner bg-pink-50">🍭</div>
            <h2 className="text-xl font-bold text-pink-600">任務詳情</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pink-50 rounded-full transition-colors text-pink-300"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">任務名稱</label>
            <input value={task.title} onChange={(e) => onUpdate({ title: e.target.value })} className="text-2xl font-bold text-[#5c4b51] w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-pink-100 rounded-xl px-2 py-1" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><CheckCircle2 size={12} /> 狀態</label>
              <select 
                value={task.status} 
                onChange={(e) => onUpdate({ status: e.target.value as TaskStatus })} 
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer"
                style={{ backgroundColor: COLORS.status[task.status] + '66' }}
              >
                {Object.values(TaskStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><Flag size={12} /> 優先度</label>
              <select 
                value={task.priority} 
                onChange={(e) => onUpdate({ priority: e.target.value as TaskPriority })} 
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer"
                style={{ backgroundColor: COLORS.priority[task.priority] }}
              >
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* 任務資源區域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><LinkIcon size={12} /> 任務資源連結</label>
              <button onClick={handleAddLink} className="text-[10px] font-bold px-3 py-1.5 rounded-xl bg-pink-50 text-pink-500 hover:bg-pink-100 shadow-sm flex items-center gap-1"><Plus size={10} /> 新增連結</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {task.attachments?.map(link => (
                <div key={link.id} className="flex items-center gap-3 p-3 bg-pink-50/20 border border-pink-50 rounded-2xl group">
                  {link.category === 'image' ? <ImageIcon size={16} className="text-pink-300" /> : <Globe size={16} className="text-blue-300" />}
                  <span className="flex-1 text-xs font-bold text-[#5c4b51] truncate">{link.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg"><ExternalLink size={14} /></a>
                    <button onClick={() => onUpdate({ attachments: task.attachments?.filter(a => a.id !== link.id) })} className="p-1.5 text-pink-300 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              {(!task.attachments || task.attachments.length === 0) && (
                <p className="text-center py-4 text-[10px] text-pink-200 font-bold italic">尚無相關資源 🍰</p>
              )}
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><AlignLeft size={12} /> 內容描述</label>
              <button onClick={() => setIsPreview(!isPreview)} className="text-[10px] font-bold px-2 py-1 rounded-lg bg-pink-50 text-pink-400">{isPreview ? '切換編輯' : '切換預覽'}</button>
            </div>
            {isPreview ? (
              <div className="w-full flex-1 p-6 rounded-[30px] bg-pink-50/10 border border-pink-50 prose prose-pink max-w-none overflow-y-auto min-h-[150px]"><ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description || "*尚無內容*"}</ReactMarkdown></div>
            ) : (
              <textarea value={task.description} onChange={(e) => onUpdate({ description: e.target.value })} className="w-full flex-1 p-6 rounded-[30px] bg-pink-50/30 border border-pink-50 text-[#5c4b51] text-sm focus:outline-none min-h-[150px] resize-none font-mono" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
