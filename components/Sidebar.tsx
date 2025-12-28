
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Heart, X as CloseIcon } from 'lucide-react';
import { Project } from '../types';

interface SidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  isOpen: boolean;
  onSelectProject: (id: string) => void;
  onAddProject: (parentId: string | null) => void;
}

const ProjectItem: React.FC<{
  project: Project;
  level: number;
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddProject: (parentId: string | null) => void;
}> = ({ project, level, selectedProjectId, onSelectProject, onAddProject }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isSelected = selectedProjectId === project.id;

  return (
    <div className="flex flex-col">
      <div 
        className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-white/60 mb-1 ${isSelected ? 'bg-white shadow-md font-bold translate-x-1' : ''}`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={() => onSelectProject(project.id)}
      >
        <div onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }} className="text-pink-300">
          {project.children.length > 0 ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div className="w-3.5" />
          )}
        </div>
        <span className="text-base leading-none">{project.logoUrl && project.logoUrl.length < 5 ? project.logoUrl : '📁'}</span>
        <span className="truncate text-sm text-[#5c4b51]">{project.name}</span>
      </div>
      
      {isOpen && project.children.length > 0 && (
        <div className="flex flex-col">
          {project.children.map(child => (
            <ProjectItem 
              key={child.id} 
              project={child} 
              level={level + 1} 
              selectedProjectId={selectedProjectId}
              onSelectProject={onSelectProject}
              onAddProject={onAddProject}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ projects, selectedProjectId, isOpen, onSelectProject, onAddProject }) => {
  return (
    <div className={`
      fixed inset-y-0 left-0 w-64 sanrio-pink h-screen flex flex-col p-6 border-r sanrio-border-pink z-50 transition-transform duration-300 shadow-xl
      md:relative md:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-bold text-xl text-pink-600 flex items-center gap-2">
          <span className="text-2xl">🍓</span> Melody
        </h1>
        <button 
          onClick={() => onAddProject(null)}
          className="p-2 bg-white/40 hover:bg-white rounded-xl transition-all shadow-sm"
        >
          <Plus size={18} className="text-pink-500" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar no-scrollbar pr-1">
        <div className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.2em] mb-4 ml-2">My Projects</div>
        {projects.map(project => (
          <ProjectItem 
            key={project.id} 
            project={project} 
            level={0} 
            selectedProjectId={selectedProjectId}
            onSelectProject={onSelectProject}
            onAddProject={onAddProject}
          />
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t sanrio-border-pink text-xs text-pink-300 text-center flex flex-col items-center gap-2">
        <Heart size={14} className="fill-pink-200 text-pink-200" />
        <span className="font-bold tracking-widest uppercase">Pure Cuteness</span>
      </div>
    </div>
  );
};
