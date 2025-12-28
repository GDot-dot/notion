
import React from 'react';
import { Image as ImageIcon, PlusCircle } from 'lucide-react';

interface NotesAreaProps {
  notes: string;
  logoUrl?: string;
  onUpdateNotes: (notes: string) => void;
  onUpdateLogo: (url: string) => void;
}

export const NotesArea: React.FC<NotesAreaProps> = ({ notes, logoUrl, onUpdateNotes, onUpdateLogo }) => {
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onUpdateLogo(url);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 cute-shadow border border-pink-100 min-h-[400px]">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Logo 部分 */}
        <div className="flex-shrink-0">
          <label className="block text-sm font-bold text-pink-400 mb-2">專案 Logo 🎀</label>
          <div 
            className="w-32 h-32 bg-pink-50 rounded-2xl border-2 border-dashed border-pink-200 flex items-center justify-center overflow-hidden relative group cursor-pointer"
            onClick={() => document.getElementById('logo-input')?.click()}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="text-pink-200" size={32} />
            )}
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="text-[10px] text-white font-bold bg-pink-400 px-2 py-1 rounded">更換 Logo</span>
            </div>
            <input 
              id="logo-input" 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </div>
        </div>

        {/* 筆記內容 */}
        <div className="flex-1 flex flex-col">
          <label className="text-sm font-bold text-pink-400 mb-2">專案注意事項與備註 🍓</label>
          <textarea
            className="flex-1 w-full p-4 rounded-2xl bg-pink-50/30 border border-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-200 text-[#5c4b51] resize-none"
            placeholder="在這裡輸入一些特別需要注意的事項..."
            value={notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
