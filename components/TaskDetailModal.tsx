
import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, AlignLeft, CheckCircle2, Edit3, Trash2, Plus, Tag as TagIcon, Save, Eye, ImageIcon, FileCode, FileText, Video, Globe, ExternalLink } from 'lucide-react';
import { Task, TaskPriority, TaskStatus, Project, Tag, Attachment, ResourceCategory } from '../types.ts';
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
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [showPreviewDuringEdit, setShowPreviewDuringEdit] = useState(false);
  const [tempDesc, setTempDesc] = useState(task.description || '');

  useEffect(() => {
    setTempDesc(task.description || '');
    setIsEditingDesc(false);
    setShowPreviewDuringEdit(false);
  }, [task.id]);

  const handleSaveDesc = () => {
    onUpdate({ description: tempDesc });
    setIsEditingDesc(false);
  };

  const handleAddTag = () => {
    const text = prompt("🍓 標籤名稱 (例如: 緊急、草莓蛋糕)");
    if (!text) return;
    const color = prompt("🎨 標籤色號 (例如: #ff85b2)", COLORS.tagThemes[Math.floor(Math.random() * COLORS.tagThemes.length)]);
    if (!color) return;

    const newTag: Tag = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      color
    };
    onUpdate({ tags: [...(task.tags || []), newTag] });
  };

  const removeTag = (tagId: string) => {
    onUpdate({ tags: (task.tags || []).filter(t => t.id !== tagId) });
  };

  const getCategoryIcon = (category: ResourceCategory) => {
    switch (category) {
      case 'image': return <ImageIcon size={14} className="text-pink-400" />;
      case 'design': return <FileCode size={14} className="text-purple-400" />;
      case 'document': return <FileText size={14} className="text-blue-400" />;
      case 'video': return <Video size={14} className="text-red-400" />;
      default: return <Globe size={14} className="text-green-400" />;
    }
  };

  const handleAddResource = () => {
    const name = prompt("🍓 資源名稱 (例如: 設計參考圖、需求文件)");
    if (!name) return;
    const url = prompt("🌐 貼上網址");
    if (!url) return;

    let category: ResourceCategory = 'link';
    const lowUrl = url.toLowerCase();
    if (lowUrl.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) category = 'image';
    else if (lowUrl.includes('figma.com')) category = 'design';
    else if (lowUrl.includes('docs.google.com') || lowUrl.includes('.pdf') || lowUrl.includes('.docx')) category = 'document';
    else if (lowUrl.includes('youtube.com') || lowUrl.includes('vimeo.com')) category = 'video';

    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      url,
      category,
      createdAt: new Date().toISOString()
    };
    onUpdate({ attachments: [...(task.attachments || []), newAttachment] });
  };

  const removeResource = (id: string) => {
    onUpdate({ attachments: (task.attachments || []).filter(a => a.id !== id) });
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[40px] border-l-4 border-pink-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-8 border-b border-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner bg-pink-50">🍭</div>
            <h2 className="text-xl font-bold text-pink-600">任務詳情</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pink-50 rounded-full transition-colors text-pink-300"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar pb-24">
          {/* 1. 任務名稱 */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">任務名稱</label>
            <input 
              value={task.title} 
              onChange={(e) => onUpdate({ title: e.target.value })} 
              className="text-2xl font-bold text-[#5c4b51] w-full bg-pink-50/20 border-2 border-transparent focus:border-pink-100 focus:bg-white focus:outline-none rounded-2xl px-3 py-2 transition-all" 
            />
          </div>

          {/* 2. 標籤分類 */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><TagIcon size={14} /> 標籤分類</label>
            <div className="flex flex-wrap gap-2.5">
              {task.tags?.map(tag => (
                <div key={tag.id} className="group relative">
                  <span 
                    className="px-4 py-2 rounded-2xl text-[11px] font-black border flex items-center gap-2 shadow-sm transition-all pr-10"
                    style={{ backgroundColor: tag.color + '22', borderColor: tag.color, color: tag.color }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                    {tag.text}
                    <button 
                      onClick={() => removeTag(tag.id)} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded-lg"
                    >
                      <X size={12} />
                    </button>
                  </span>
                </div>
              ))}
              <button 
                onClick={handleAddTag} 
                className="px-4 py-2 rounded-2xl text-[11px] font-black border border-dashed border-pink-200 text-pink-300 hover:border-pink-400 hover:text-pink-500 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> 新增標籤
              </button>
            </div>
          </div>

          {/* 3. 完成進度 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-pink-300 uppercase tracking-wider">完成進度</label>
              <span className="text-sm font-black text-pink-500">{task.progress}%</span>
            </div>
            <div className="h-4 bg-pink-50 rounded-full overflow-hidden border border-pink-100 shadow-inner relative">
              <div 
                className="h-full bg-pink-400 transition-all duration-300"
                style={{ width: `${task.progress}%` }}
              />
              <input 
                type="range"
                min="0"
                max="100"
                value={task.progress}
                onChange={(e) => onUpdate({ progress: parseInt(e.target.value), status: parseInt(e.target.value) === 100 ? TaskStatus.COMPLETED : task.status })}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          {/* 4. 狀態與優先度 */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><CheckCircle2 size={12} /> 狀態</label>
              <select 
                value={task.status} 
                onChange={(e) => onUpdate({ status: e.target.value as TaskStatus, progress: e.target.value === TaskStatus.COMPLETED ? 100 : task.progress })} 
                className="w-full p-4 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer focus:ring-2 focus:ring-pink-100"
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
                className="w-full p-4 rounded-2xl border-none text-sm font-bold text-[#5c4b51] shadow-sm cursor-pointer focus:ring-2 focus:ring-pink-100"
                style={{ backgroundColor: COLORS.priority[task.priority] }}
              >
                {Object.values(TaskPriority).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* 5. 資源連結庫 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><Plus size={14} /> 資源連結庫 🍭</label>
              <button 
                onClick={handleAddResource}
                className="p-2 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-100 transition-all shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              {(task.attachments || []).map(item => (
                <div key={item.id} className="group flex items-center gap-3 p-3 bg-pink-50/20 border border-pink-50 rounded-2xl hover:bg-white hover:shadow-md transition-all">
                  <div className="flex-shrink-0">{getCategoryIcon(item.category)}</div>
                  <span className="flex-1 text-[11px] font-bold text-[#5c4b51] truncate">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-pink-400 hover:text-pink-600">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => removeResource(item.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-pink-200 hover:text-red-400 transition-opacity">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {(task.attachments || []).length === 0 && (
                <p className="text-center py-6 text-pink-200 text-xs italic">尚未新增資源連結 🍬</p>
              )}
            </div>
          </div>

          {/* 6. 任務描述 (Markdown) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-pink-300 flex items-center gap-1 uppercase tracking-wider"><AlignLeft size={16} /> 任務描述</label>
              {!isEditingDesc ? (
                <button 
                  onClick={() => setIsEditingDesc(true)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-pink-50 text-pink-500 text-[10px] font-bold hover:bg-pink-100 transition-all"
                >
                  <Edit3 size={12} /> 編輯筆記
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-pink-50 p-1 rounded-xl border border-pink-100">
                  <button onClick={() => setIsEditingDesc(false)} className="px-3 py-1 text-[10px] font-bold text-pink-300">取消</button>
                  <button onClick={() => setShowPreviewDuringEdit(!showPreviewDuringEdit)} className="px-3 py-1 bg-white text-pink-500 rounded-lg text-[10px] font-bold shadow-sm">
                    {showPreviewDuringEdit ? <Edit3 size={10} /> : <Eye size={10} />} {showPreviewDuringEdit ? '編輯' : '預覽'}
                  </button>
                  <button onClick={handleSaveDesc} className="px-3 py-1 bg-pink-500 text-white rounded-lg text-[10px] font-bold shadow-sm">儲存</button>
                </div>
              )}
            </div>

            <div className="w-full min-h-[250px] rounded-[32px] bg-white border border-pink-50 overflow-hidden shadow-inner flex flex-col">
              {isEditingDesc && !showPreviewDuringEdit ? (
                <textarea 
                  value={tempDesc} 
                  onChange={(e) => setTempDesc(e.target.value)} 
                  className="w-full flex-1 p-6 bg-transparent text-[#5c4b51] text-sm focus:outline-none resize-none font-mono leading-relaxed"
                  autoFocus
                />
              ) : (
                <div className="p-6 prose prose-pink prose-sm flex-1 overflow-y-auto">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {(isEditingDesc ? tempDesc : task.description) || "*點擊編輯來描述任務... 🍰*"}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
