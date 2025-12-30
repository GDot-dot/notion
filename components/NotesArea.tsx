
import React, { useState } from 'react';
import { Image as ImageIcon, Edit3, Eye, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NotesAreaProps {
  notes: string;
  logoUrl?: string;
  onUpdateNotes: (notes: string) => void;
  onUpdateLogo: (url: string) => void;
}

export const NotesArea: React.FC<NotesAreaProps> = ({ notes, logoUrl, onUpdateNotes, onUpdateLogo }) => {
  const [isEditing, setIsEditing] = useState(true);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateLogo(url);
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 cute-shadow border border-pink-100 min-h-[500px] flex flex-col">
      <div className="flex flex-col md:flex-row gap-8 flex-1">
        {/* Logo 部分 */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-bold text-pink-400 mb-4">專案標誌 🎀</label>
          <div 
            className="w-40 h-40 bg-pink-50 rounded-3xl border-2 border-dashed border-pink-200 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner"
            onClick={() => document.getElementById('logo-input-notes')?.click()}
          >
            {logoUrl?.startsWith('http') || logoUrl?.startsWith('blob') ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : logoUrl ? (
              <span className="text-6xl">{logoUrl}</span>
            ) : (
              <ImageIcon className="text-pink-200" size={48} />
            )}
            <div className="absolute inset-0 bg-pink-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-xs text-white font-bold bg-pink-400 px-3 py-1.5 rounded-full shadow-lg">更換標誌</span>
            </div>
            <input 
              id="logo-input-notes" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
            <p className="text-[10px] text-blue-400 font-bold flex items-center gap-1 leading-relaxed">
              <Info size={12} /> 提示：你可以使用 Emoji 或是上傳本地圖片作為專案標籤。
            </p>
          </div>
        </div>

        {/* 筆記內容 */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-pink-400 flex items-center gap-2">
              <Edit3 size={16} /> 詳細說明與 Markdown 筆記 🍓
            </label>
            <div className="flex bg-pink-50 p-1 rounded-xl border border-pink-100">
              <button 
                onClick={() => setIsEditing(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isEditing ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300'}`}
              >
                <Edit3 size={12} /> 編輯
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!isEditing ? 'bg-white text-pink-500 shadow-sm' : 'text-pink-300'}`}
              >
                <Eye size={12} /> 預覽
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            {isEditing ? (
              <textarea
                className="flex-1 w-full p-6 rounded-[32px] bg-pink-50/20 border-2 border-pink-50 focus:border-pink-200 focus:outline-none focus:ring-4 focus:ring-pink-50 text-[#5c4b51] resize-none font-mono text-sm leading-relaxed"
                placeholder="# 在這裡開始寫筆記...
支援 Markdown 語法：
- **粗體**
- *斜體*
- [ ] 待辦事項
- ### 小標題"
                value={notes}
                onChange={(e) => onUpdateNotes(e.target.value)}
              />
            ) : (
              <div className="flex-1 w-full p-8 rounded-[32px] bg-white border border-pink-50 overflow-y-auto prose max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {notes || "*目前還沒有內容喔，切換到編輯模式寫點什麼吧！*"}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
