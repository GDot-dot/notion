
import React, { useState } from 'react';
import { Edit3, Eye, Link, Trash2, FileText, ExternalLink, Plus, Image as ImageIcon, FileCode, Video, Globe } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Attachment, ResourceCategory } from '../types.ts';

interface NotesAreaProps {
  notes: string;
  logoUrl?: string;
  attachments?: Attachment[];
  onUpdateNotes: (notes: string) => void;
  onUpdateLogo: (url: string) => void;
  onUpdateAttachments: (attachments: Attachment[]) => void;
}

export const NotesArea: React.FC<NotesAreaProps> = ({ 
  notes, 
  logoUrl, 
  attachments = [], 
  onUpdateNotes, 
  onUpdateLogo,
  onUpdateAttachments
}) => {
  const [isEditing, setIsEditing] = useState(true);

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
    const url = prompt("🌐 貼上網址 (例如: Google Drive 或圖片連結)");
    if (!url) return;

    // 自動偵測類型
    let category: ResourceCategory = 'link';
    if (url.match(/\.(jpeg|jpg|gif|png)$/) != null) category = 'image';
    else if (url.includes('figma.com')) category = 'design';
    else if (url.includes('docs.google.com') || url.includes('.pdf')) category = 'document';
    else if (url.includes('youtube.com') || url.includes('vimeo.com')) category = 'video';

    const newAttachment: Attachment = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      url,
      category,
      createdAt: new Date().toISOString()
    };
    onUpdateAttachments([...attachments, newAttachment]);
  };

  return (
    <div className="bg-white rounded-[40px] p-8 cute-shadow border border-pink-100 min-h-[600px] flex flex-col space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-72 flex-shrink-0 space-y-8">
          {/* Logo 區域 */}
          <div>
            <label className="block text-sm font-bold text-pink-400 mb-4 uppercase tracking-wider">專案標誌 🎀</label>
            <div 
              className="w-full aspect-square max-w-[200px] bg-pink-50 rounded-3xl border-2 border-dashed border-pink-200 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner mx-auto lg:mx-0"
              onClick={() => {
                const res = prompt('輸入 Emoji (如 🍓) 或圖片網址', logoUrl || '📁');
                if (res !== null) onUpdateLogo(res);
              }}
            >
              {logoUrl?.startsWith('http') ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">{logoUrl || '📁'}</span>
              )}
            </div>
          </div>

          {/* 強化版資源連結區 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-pink-400 uppercase tracking-wider">資源管理庫 🍰</label>
              <button 
                onClick={handleAddResource}
                className="p-2 bg-pink-50 text-pink-500 rounded-xl hover:bg-pink-100 transition-all shadow-sm"
              >
                <Plus size={18} />
              </button>
            </div>
            
            <div className="space-y-3">
              {attachments.map(item => (
                <div key={item.id} className="group flex flex-col p-3 bg-pink-50/20 border border-pink-50 rounded-2xl hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    {getCategoryIcon(item.category)}
                    <span className="flex-1 text-[11px] font-bold text-[#5c4b51] truncate">{item.name}</span>
                    <button onClick={() => onUpdateAttachments(attachments.filter(a => a.id !== item.id))} className="opacity-0 group-hover:opacity-100 p-1 text-pink-200 hover:text-red-400 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  {item.category === 'image' && (
                    <div className="w-full h-24 rounded-lg bg-pink-100/30 overflow-hidden mb-2 border border-pink-50">
                      <img src={item.url} className="w-full h-full object-cover opacity-80" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}

                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-1.5 bg-white border border-pink-100 rounded-xl text-[10px] font-black text-pink-400 hover:bg-pink-500 hover:text-white transition-all shadow-sm"
                  >
                    <ExternalLink size={10} /> 前往資源
                  </a>
                </div>
              ))}
              {attachments.length === 0 && (
                <div className="text-center py-10 px-4 bg-pink-50/10 rounded-3xl border-2 border-dashed border-pink-50">
                   <p className="text-[10px] text-pink-200 font-bold italic leading-relaxed">貼上 Google Drive 或圖片連結<br/>實現 0 成本雲端管理 🍓</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-pink-400 flex items-center gap-2 uppercase tracking-wider">
              <Edit3 size={16} /> 專案內容筆記 🍓
            </label>
            <div className="flex bg-pink-50 p-1 rounded-xl border border-pink-100">
              <button onClick={() => setIsEditing(true)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isEditing ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300'}`}>編輯</button>
              <button onClick={() => setIsEditing(false)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!isEditing ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300'}`}>預覽</button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[400px]">
            {isEditing ? (
              <textarea
                className="flex-1 w-full p-8 rounded-[40px] bg-pink-50/20 border-2 border-pink-50 focus:border-pink-200 focus:outline-none focus:ring-4 focus:ring-pink-50 text-[#5c4b51] resize-none font-mono text-sm"
                value={notes}
                onChange={(e) => onUpdateNotes(e.target.value)}
                placeholder="在這裡留下專案筆記..."
              />
            ) : (
              <div className="flex-1 w-full p-8 rounded-[40px] bg-white border border-pink-50 overflow-y-auto prose prose-pink max-w-none shadow-inner">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{notes || "*還沒有內容喔...*"}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
