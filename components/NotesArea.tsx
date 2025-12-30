
import React, { useState } from 'react';
import { Image as ImageIcon, Edit3, Eye, Info, Paperclip, Trash2, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { storage } from '../lib/firebase.ts';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Attachment } from '../types.ts';

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
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!storage) {
      alert("🍭 請先設定 Firebase 金鑰才能使用上傳功能喔！");
      return;
    }

    setIsUploading(true);
    try {
      const storagePath = `notes/attachments/${Date.now()}_${file.name}`;
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

      onUpdateAttachments([...attachments, newAttachment]);
    } catch (error: any) {
      console.error("Upload failed:", error);
      if (error.code === 'storage/unauthorized') {
        alert("🔒 上傳失敗：權限不足。請檢查 Firebase Storage 的 Rules 是否已開放讀寫。");
      } else if (error.message.includes('CORS') || error.name === 'FirebaseError') {
        alert("🌐 上傳失敗：可能是 CORS 政策阻擋。\n\n請參考 lib/firebase.ts 中的註解，設定 Google Cloud Storage 的 CORS 規則。");
      } else {
        alert(`檔案上傳失敗 🥺\n原因: ${error.message}`);
      }
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteFile = async (attachment: Attachment) => {
    if (!confirm('確定要刪除這個檔案嗎？ 🗑️') || !storage) return;

    try {
      const storageRef = ref(storage, attachment.path);
      await deleteObject(storageRef);
      onUpdateAttachments(attachments.filter(a => a.id !== attachment.id));
    } catch (error) {
      console.error("Delete failed:", error);
      onUpdateAttachments(attachments.filter(a => a.id !== attachment.id));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateLogo(url);
    }
  };

  return (
    <div className="bg-white rounded-[40px] p-8 cute-shadow border border-pink-100 min-h-[600px] flex flex-col space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex-shrink-0 space-y-8">
          <div>
            <label className="block text-sm font-bold text-pink-400 mb-4 uppercase tracking-wider">專案標誌 🎀</label>
            <div 
              className="w-full aspect-square max-w-[200px] bg-pink-50 rounded-3xl border-2 border-dashed border-pink-200 flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner mx-auto lg:mx-0"
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
              <input id="logo-input-notes" type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-bold text-pink-400 uppercase tracking-wider">相關檔案 📁</label>
              <button 
                onClick={() => document.getElementById('file-upload-notes')?.click()}
                disabled={isUploading}
                className="p-1.5 bg-pink-50 text-pink-400 rounded-lg hover:bg-pink-100 transition-colors disabled:opacity-50"
                title="上傳附件"
              >
                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
              </button>
              <input id="file-upload-notes" type="file" className="hidden" onChange={handleFileUpload} />
            </div>
            
            <div className="space-y-2">
              {attachments.map(file => (
                <div key={file.id} className="group flex items-center gap-2 p-2 bg-pink-50/30 rounded-xl border border-pink-50 hover:bg-white hover:shadow-sm transition-all">
                  <FileText size={14} className="text-pink-300" />
                  <span className="flex-1 text-[11px] font-bold text-[#5c4b51] truncate" title={file.name}>{file.name}</span>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="p-1 text-blue-300 hover:text-blue-500">
                      <Download size={12} />
                    </a>
                    <button onClick={() => handleDeleteFile(file)} className="p-1 text-pink-200 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="text-center py-4 text-[10px] text-pink-200 font-bold italic">尚無檔案</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-bold text-pink-400 flex items-center gap-2 uppercase tracking-wider">
              <Edit3 size={16} /> Markdown 筆記區域 🍓
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

          <div className="flex-1 flex flex-col min-h-[400px]">
            {isEditing ? (
              <textarea
                className="flex-1 w-full p-6 rounded-[32px] bg-pink-50/20 border-2 border-pink-50 focus:border-pink-200 focus:outline-none focus:ring-4 focus:ring-pink-50 text-[#5c4b51] resize-none font-mono text-sm leading-relaxed"
                placeholder="# 標題 1\n## 標題 2\n- [ ] 任務\n- **粗體文字**\n支援完整 Markdown 語法！"
                value={notes}
                onChange={(e) => onUpdateNotes(e.target.value)}
              />
            ) : (
              <div className="flex-1 w-full p-8 rounded-[32px] bg-white border border-pink-50 overflow-y-auto prose prose-pink max-w-none shadow-inner">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {notes || "*這是一張空白的畫布，快來留下你的想法吧！*"}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
