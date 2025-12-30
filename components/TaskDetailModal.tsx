
import React, { useState } from 'react';
import { X, Calendar, Flag, AlignLeft, CheckCircle2, Eye, Edit3, Paperclip, Loader2, FileText, Download, Trash2 } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, Attachment } from '../types.ts';
import { COLORS } from '../constants.tsx';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { storage } from '../lib/firebase.ts';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface TaskDetailModalProps {
  task: Task;
  allProjects: Project[];
  onClose: () => void;
  onUpdate: (updates: Partial<Task>) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, allProjects, onClose, onUpdate }) => {
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setIsUploading(true);
    try {
      const storagePath = `tasks/${task.id}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url,
        path: storagePath,
        type: file.type,
        createdAt: new Date().toISOString()
      };

      onUpdate({ attachments: [...(task.attachments || []), newAttachment] });
    } catch (error) {
      console.error("Upload failed:", error);
      alert("檔案上傳失敗 🥺");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (attachment: Attachment) => {
    if (!confirm('確定要刪除這個附件嗎？ 🗑️') || !storage) return;

    try {
      const storageRef = ref(storage, attachment.path);
      await deleteObject(storageRef);
      onUpdate({ attachments: (task.attachments || []).filter(a => a.id !== attachment.id) });
    } catch (error) {
      console.error("Delete failed:", error);
      onUpdate({ attachments: (task.attachments || []).filter(a => a.id !== attachment.id) });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
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

        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">任務名稱</label>
            <input 
              value={task.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="任務名稱..."
              className="text-2xl font-bold text-[#5c4b51] w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-pink-100 rounded-xl px-2 py-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
                <CheckCircle2 size={12} /> 狀態
              </label>
              <select 
                value={task.status}
                onChange={(e) => {
                  const newStatus = e.target.value as TaskStatus;
                  onUpdate({ 
                    status: newStatus,
                    progress: newStatus === TaskStatus.COMPLETED ? 100 : task.progress
                  });
                }}
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all shadow-sm cursor-pointer"
                style={{ backgroundColor: COLORS.status[task.status] + '66' }}
              >
                {Object.values(TaskStatus).map(s => (
                  <option key={s} value={s} className="bg-white">{s}</option>
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
                className="w-full p-3 rounded-2xl border-none text-sm font-bold text-[#5c4b51] focus:outline-none focus:ring-4 focus:ring-pink-100 transition-all shadow-sm cursor-pointer"
                style={{ backgroundColor: COLORS.priority[task.priority] }}
              >
                {Object.values(TaskPriority).map(p => (
                  <option key={p} value={p} className="bg-white">{p}</option>
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

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">完成進度</label>
              <span className="text-sm font-bold text-pink-500">{task.progress}%</span>
            </div>
            <input 
              type="range" min="0" max="100" value={task.progress}
              onChange={(e) => onUpdate({ progress: parseInt(e.target.value) })}
              className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-400 shadow-inner"
            />
          </div>

          {/* 檔案附件區域 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
                <Paperclip size={12} /> 任務附件
              </label>
              <button 
                onClick={() => document.getElementById('task-file-upload')?.click()}
                disabled={isUploading}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-pink-50 text-pink-400 hover:bg-pink-100 transition-colors flex items-center gap-1"
              >
                {isUploading ? <Loader2 size={10} className="animate-spin" /> : <><Paperclip size={10} /> 上傳檔案</>}
              </button>
              <input id="task-file-upload" type="file" className="hidden" onChange={handleFileUpload} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {task.attachments?.map(file => (
                <div key={file.id} className="flex items-center gap-3 p-3 bg-pink-50/20 border border-pink-50 rounded-2xl group">
                  <FileText size={16} className="text-pink-300" />
                  <span className="flex-1 text-xs font-bold text-[#5c4b51] truncate">{file.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg">
                      <Download size={14} />
                    </a>
                    <button onClick={() => handleDeleteFile(file)} className="p-1.5 text-pink-300 hover:text-red-400 hover:bg-red-50 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(!task.attachments || task.attachments.length === 0) && (
                <p className="text-center py-4 text-[10px] text-pink-200 font-bold italic">尚無附件</p>
              )}
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider">
                <AlignLeft size={12} /> 內容與注意事項
              </label>
              <button 
                onClick={() => setIsPreview(!isPreview)}
                className="text-[10px] font-bold px-2 py-1 rounded-lg bg-pink-50 text-pink-400 hover:bg-pink-100 transition-colors flex items-center gap-1"
              >
                {isPreview ? <><Edit3 size={10} /> 編輯模式</> : <><Eye size={10} /> 預覽 Markdown</>}
              </button>
            </div>
            {isPreview ? (
              <div className="w-full flex-1 p-6 rounded-[30px] bg-pink-50/10 border border-pink-50 prose prose-pink max-w-none overflow-y-auto min-h-[180px] shadow-inner">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {task.description || "*尚無備註內容*"}
                </ReactMarkdown>
              </div>
            ) : (
              <textarea
                value={task.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="在這裡輸入任務筆記、詳細步驟或注意事項 (支援 Markdown)..."
                className="w-full flex-1 p-6 rounded-[30px] bg-pink-50/30 border border-pink-50 text-[#5c4b51] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-pink-200 min-h-[180px] resize-none font-mono"
              />
            )}
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
