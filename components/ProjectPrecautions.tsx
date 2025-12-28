
import React, { useState } from 'react';
import { Trash2, Plus, Edit3 } from 'lucide-react';

interface ProjectPrecautionsProps {
  precautions: string[];
  onUpdate: (items: string[]) => void;
}

export const ProjectPrecautions: React.FC<ProjectPrecautionsProps> = ({ precautions, onUpdate }) => {
  const [inputValue, setInputValue] = useState('');

  const addItem = () => {
    if (inputValue.trim()) {
      onUpdate([...precautions, inputValue.trim()]);
      setInputValue('');
    }
  };

  const removeItem = (index: number) => {
    const newList = [...precautions];
    newList.splice(index, 1);
    onUpdate(newList);
  };

  return (
    <div className="bg-[#fff9c4] rounded-[40px] p-8 cute-shadow border border-yellow-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-yellow-800 flex items-center gap-2">
          <Edit3 size={24} className="text-yellow-600" /> 專案注意事項
        </h3>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded-full bg-pink-200 opacity-50" />
          <div className="w-4 h-4 rounded-full bg-blue-200 opacity-50" />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
        {precautions.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 group bg-white/60 p-3 rounded-2xl border border-yellow-100/50">
            <span className="text-xl">💡</span>
            <p className="flex-1 text-sm text-yellow-900 font-medium">{item}</p>
            <button 
              onClick={() => removeItem(idx)}
              className="p-1 opacity-0 group-hover:opacity-100 text-yellow-400 hover:text-red-400 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        {precautions.length === 0 && (
          <p className="text-center py-8 text-yellow-600/50 italic text-sm">還沒有小叮嚀喔 📝</p>
        )}
      </div>

      <div className="mt-6 relative">
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
          placeholder="新增小叮嚀..."
          className="w-full bg-white/80 border-2 border-yellow-300 rounded-full px-6 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-12 text-yellow-900 font-medium placeholder-yellow-600/40"
        />
        <button 
          onClick={addItem}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition-colors shadow-sm"
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
};
