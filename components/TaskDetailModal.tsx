
import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, AlignLeft, CheckCircle2, Eye, Edit3, Link as LinkIcon, ExternalLink, Trash2, Plus, Globe, ImageIcon, Save } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, Attachment, ResourceCategory } from '../types.ts';
import { COLORS } from '../constants.tsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TaskDetailModalProps {
  task: Task;
  allProjects: Project[];
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onUpdate }) => {
  // 🍓 內容描述的編輯狀態管理
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [showPreviewDuringEdit, setShowPreviewDuringEdit] = useState(false);
  const [tempDesc, setTempDesc] = useState(task.description || '');

  // 當外部 task 改變時（如切換任務），同步內容
  useEffect(() => {
    setTempDesc(task.description || '');
    setIsEditingDesc(false);
  }, [task.id]);

  const handleStartEdit = () => {
    setTempDesc(task.description || '');
    setIsEditingDesc(true);
    setShowPreviewDuringEdit(false);
  };

  const handleSaveDesc = () => {
    onUpdate({ description: tempDesc });
    setIsEditingDesc(false);
  };

  const handleCancelEdit = () => {
    setTempDesc(task.description || '');
    setIsEditingDesc(false);
  };

  const handleAddLink = () => {
    const name = prompt("🍓 連結標題");
    if (!name) return;
    const url = prompt("🌐 請貼上網址");
    if (!url) return;

    let category: ResourceCategory = 'link';
    if (url.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) category = 'image';
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
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[40px] border-l-4 border-pink-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 頂部標題 */}
        <div className="flex items-center justify-between p-8 border-b border-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner bg-pink-50">🍭</div>
            <h2 className="text-xl font-bold text-pink-600">任務詳情</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pink-50 rounded-full transition-colors text-pink-300"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          {/* 任務名稱 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">任務名稱</label>
            <input 
              value={task.title} 
              onChange={(e) => onUpdate({ title: e.target.value })} 
              className="text-2xl font-bold text-[#5c4b51] w-full bg-pink-50/20 border-2 border-transparent focus:border-pink-100 focus:bg-white focus:outline-none rounded-2xl px-3 py-2 transition-all" 
            />
          </div>

          {/* 狀態與優先度 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><CheckCircle2 size={12} /> 狀態</label>
              <select 
                value={task.status} 
                onChange={(e) => onUpdate({ status: e.target.value as TaskStatus })} 
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer focus:ring-2 focus:ring-pink-100"
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
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer focus:ring-2 focus:ring-pink-100"
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

          {/* 🍓 內容描述區域 (更新為 Markdown 豐富功能) */}
          <div className="space-y-4 flex-1 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><AlignLeft size={14} /> 任務內容描述</label>
              
              <div className="flex items-center gap-2">
                {!isEditingDesc ? (
                  <button 
                    onClick={handleStartEdit}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-50 text-pink-500 text-[10px] font-bold hover:bg-pink-100 shadow-sm transition-all"
                  >
                    <Edit3 size={12} /> 編輯描述
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-pink-50 p-1 rounded-xl border border-pink-100">
                    <button 
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-pink-300 hover:text-red-400 transition-all"
                    >
                      取消
                    </button>
                    <button 
                      onClick={() => setShowPreviewDuringEdit(!showPreviewDuringEdit)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${showPreviewDuringEdit ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300 hover:text-pink-500'}`}
                    >
                      {showPreviewDuringEdit ? <Edit3 size={12} /> : <Eye size={12} />}
                      {showPreviewDuringEdit ? '繼續編輯' : '預覽'}
                    </button>
                    <button 
                      onClick={handleSaveDesc}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500 text-white text-[10px] font-bold hover:bg-pink-600 shadow-sm transition-all"
                    >
                      <Save size={12} /> 完成
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {isEditingDesc && !showPreviewDuringEdit ? (
                <textarea 
                  value={tempDesc} 
                  onChange={(e) => setTempDesc(e.target.value)} 
                  placeholder="輸入任務詳細內容，支援 Markdown 語法... 🍓"
                  className="w-full flex-1 p-6 rounded-[30px] bg-pink-50/30 border-2 border-pink-50 text-[#5c4b51] text-sm focus:outline-none focus:border-pink-200 min-h-[250px] resize-none font-mono leading-relaxed"
                  autoFocus
                />
              ) : (
                <div className="w-full flex-1 p-6 rounded-[30px] bg-white border border-pink-50 overflow-y-auto min-h-[250px] shadow-inner animate-in fade-in duration-300">
                  <div className="prose prose-pink prose-sm">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {(isEditingDesc ? tempDesc : task.description) || "*點擊編輯按鈕來新增內容吧！🍰*"}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
