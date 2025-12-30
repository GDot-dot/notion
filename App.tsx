
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar.tsx';
import { GanttChart } from './components/GanttChart.tsx';
import { ProgressBoard } from './components/ProgressBoard.tsx';
import { NotesArea } from './components/NotesArea.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { ProjectPrecautions } from './components/ProjectPrecautions.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { Project, ViewType, TaskStatus, Task, TaskPriority, Tag } from './types.ts';
import { COLORS } from './constants.tsx';
import { useProjects } from './context/ProjectContext.tsx';
import { auth, googleProvider, isConfigured, signInWithPopup, signOut } from './lib/firebase.ts';
import { Plus, LayoutDashboard, Calendar, BarChart2, BookOpen, Trash2, Check, Menu, LogIn, Loader2, Search, Filter } from 'lucide-react';
import { addDays } from 'date-fns';
import { GoogleGenAI, Type } from "@google/genai";

const ProjectView: React.FC = () => {
  const { projectId, view } = useParams<{ projectId: string, view: ViewType }>();
  const { state, dispatch, syncToCloud } = useProjects();
  const navigate = useNavigate();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);

  const findProject = useCallback((id: string, list: Project[]): Project | null => {
    for (const p of list) {
      if (p.id === id) return p;
      const found = findProject(id, p.children);
      if (found) return found;
    }
    return null;
  }, []);

  const currentProject = useMemo(() => {
    return (projectId ? findProject(projectId, state.projects) : null) || state.projects[0];
  }, [projectId, state.projects, findProject]);

  // 🍓 追蹤最近存取時間
  useEffect(() => {
    if (currentProject && projectId) {
      const last = currentProject.lastAccessedAt ? new Date(currentProject.lastAccessedAt).getTime() : 0;
      const now = Date.now();
      if (now - last > 30000) { // 30秒更新一次
        updateProject(currentProject.id, { lastAccessedAt: new Date().toISOString() });
      }
    }
  }, [projectId]);

  const updateProject = (id: string, updates: Partial<Project>) => {
    const updater = (list: Project[]): Project[] => list.map(p => {
      if (p.id === id) return { ...p, ...updates };
      return { ...p, children: updater(p.children) };
    });
    const next = updater(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  const addNewProject = (parentId: string | null = null) => {
    const name = prompt(parentId ? "📁 請輸入子專案名稱" : "🍓 請輸入新計畫名稱");
    if (!name) return;
    
    const newProj: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      parentId,
      notes: `# ${name} 🎀`,
      logoUrl: parentId ? '📁' : '🍓',
      precautions: [],
      tasks: [],
      children: [],
      lastAccessedAt: new Date().toISOString()
    };

    let next: Project[];
    if (parentId === null) {
      next = [...state.projects, newProj];
    } else {
      const insertInTree = (list: Project[]): Project[] => list.map(p => {
        if (p.id === parentId) return { ...p, children: [...p.children, newProj] };
        return { ...p, children: insertInTree(p.children) };
      });
      next = insertInTree(state.projects);
    }

    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
    navigate(`/project/${newProj.id}/dashboard`);
  };

  const getAggregatedTasks = useCallback((proj: Project): Task[] => {
    let tasks = [...proj.tasks];
    proj.children.forEach(child => {
      tasks = [...tasks, ...getAggregatedTasks(child)];
    });
    return tasks;
  }, []);

  const allTasks = useMemo(() => {
    return currentProject ? getAggregatedTasks(currentProject) : [];
  }, [currentProject, getAggregatedTasks]);

  const filteredTasks = useMemo(() => {
    if (!activeTagId) return allTasks;
    return allTasks.filter(t => t.tags?.some(tag => tag.id === activeTagId));
  }, [allTasks, activeTagId]);

  const availableTags = useMemo(() => {
    const tagsMap = new Map<string, Tag>();
    allTasks.forEach(t => {
      t.tags?.forEach(tag => tagsMap.set(tag.id, tag));
    });
    return Array.from(tagsMap.values());
  }, [allTasks]);

  const activeView = (view || 'dashboard') as ViewType;

  if (!currentProject) return null;

  return (
    <div className="flex min-h-screen relative overflow-x-hidden bg-[#fff5f8]">
      <Sidebar 
        projects={state.projects} 
        workspaceLogo={state.workspaceLogo}
        workspaceName={state.workspaceName}
        onUpdateWorkspace={(logo, name) => {
          dispatch({ type: 'UPDATE_WORKSPACE', logo, name });
          syncToCloud(state.projects, logo, name);
        }}
        selectedProjectId={currentProject.id} 
        isOpen={isSidebarOpen}
        onSelectProject={(id) => { navigate(`/project/${id}/${activeView}`); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
        onAddProject={addNewProject}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar transition-all duration-300">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-pink-500 bg-white rounded-xl shadow-sm border border-pink-100">
              <Menu size={24} />
            </button>
            <h1 className="text-3xl font-black text-pink-600 flex items-center gap-3">
              <span className="text-4xl">{currentProject.logoUrl?.length === 2 ? currentProject.logoUrl : '🍓'}</span>
              {currentProject.name}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {!state.user ? (
              <button onClick={() => signInWithPopup(auth!, googleProvider)} className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-md border border-blue-50 text-blue-500 hover:bg-blue-50 transition-all">
                <LogIn size={18} /> Google 登入
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white px-2 py-1.5 pr-4 rounded-2xl border border-pink-100 shadow-sm">
                <img src={state.user.photoURL || ''} className="w-8 h-8 rounded-full border-2 border-pink-200" />
                <button onClick={() => signOut(auth!)} className="text-[10px] font-bold text-pink-300">登出</button>
              </div>
            )}

            <button onClick={() => addNewProject(null)} className="flex items-center gap-2 bg-[#f04a94] text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-lg hover:bg-pink-600 transition-all active:scale-95">
              <Plus size={18} /> 建立計畫
            </button>
          </div>
        </header>

        {availableTags.length > 0 && (
          <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-100 rounded-full text-pink-500">
              <Filter size={14} />
              <span className="text-xs font-black">標籤篩選</span>
            </div>
            <button onClick={() => setActiveTagId(null)} className={`px-5 py-1.5 rounded-full text-[12px] font-black border transition-all ${!activeTagId ? 'bg-[#f04a94] text-white border-[#f04a94] shadow-md' : 'bg-white text-pink-300 border-pink-100'}`}>全部任務</button>
            {availableTags.map(tag => (
              <button 
                key={tag.id}
                onClick={() => setActiveTagId(activeTagId === tag.id ? null : tag.id)}
                className={`px-5 py-1.5 rounded-full text-[12px] font-black transition-all border ${activeTagId === tag.id ? 'text-white' : ''}`}
                style={{ backgroundColor: activeTagId === tag.id ? tag.color : 'white', color: activeTagId === tag.id ? 'white' : tag.color, borderColor: tag.color }}
              >{tag.text}</button>
            ))}
          </div>
        )}

        <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'dashboard', label: '總覽', icon: <LayoutDashboard size={18} /> },
            { id: 'gantt', label: '甘特圖', icon: <BarChart2 size={18} /> },
            { id: 'calendar', label: '日期表', icon: <Calendar size={18} /> },
            { id: 'notes', label: '設定', icon: <BookOpen size={18} /> },
          ].map(v => (
            <button key={v.id} onClick={() => navigate(`/project/${currentProject.id}/${v.id}`)} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all ${activeView === v.id ? 'bg-[#f04a94] text-white shadow-xl translate-y-[-2px]' : 'text-pink-300 bg-white/50 hover:bg-pink-50'}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <div className="space-y-8 md:space-y-12 pb-20 animate-in fade-in duration-500">
          {activeView === 'dashboard' ? (
            <div className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <ProgressBoard tasks={filteredTasks} />
                <ProjectPrecautions precautions={currentProject.precautions || []} backgroundColor={currentProject.precautionsColor} onUpdate={(items) => updateProject(currentProject.id, { precautions: items })} onColorChange={(color) => updateProject(currentProject.id, { precautionsColor: color })} />
              </div>
              <GanttChart tasks={filteredTasks} />
              <div className="bg-white rounded-[40px] p-8 border border-pink-100 cute-shadow">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-pink-600 flex items-center gap-3">
                    <span className="p-2 bg-pink-100 rounded-xl text-pink-500"><Check size={20} /></span>
                    任務清單
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTasks.map(task => (
                    <div key={task.id} onClick={() => setEditingTaskId(task.id)} className="flex items-center gap-4 p-5 rounded-[28px] bg-pink-50/20 border border-pink-50 hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                       <div className={`w-7 h-7 rounded-xl border-2 flex items-center justify-center transition-all ${task.status === TaskStatus.COMPLETED ? 'bg-pink-400 border-pink-400 text-white' : 'bg-white border-pink-100'}`}>
                         {task.status === TaskStatus.COMPLETED && <Check size={16} strokeWidth={4} />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className={`font-black text-base text-[#5c4b51] ${task.status === TaskStatus.COMPLETED ? 'line-through opacity-40' : ''}`}>{task.title}</p>
                       </div>
                       <div className="text-sm font-black text-pink-400">{task.progress}%</div>
                    </div>
                  ))}
                  <button onClick={() => {
                    const nt: Task = { id: Math.random().toString(36).substr(2, 9), title: '新任務 🎀', description: '', startDate: new Date().toISOString(), endDate: addDays(new Date(), 3).toISOString(), progress: 0, status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, color: '#ffb8d1', tags: [], attachments: [] };
                    updateProject(currentProject.id, { tasks: [...currentProject.tasks, nt] });
                    setEditingTaskId(nt.id);
                  }} className="flex items-center justify-center gap-2 p-5 rounded-[28px] border-2 border-dashed border-pink-100 text-pink-300 hover:border-pink-300 hover:text-pink-400 transition-all font-bold"><Plus size={20} /> 新增任務</button>
                </div>
              </div>
              <CalendarView tasks={filteredTasks} />
            </div>
          ) : (
            <div className="animate-in fade-in duration-500">
              {activeView === 'gantt' && <GanttChart tasks={filteredTasks} />}
              {activeView === 'calendar' && <CalendarView tasks={filteredTasks} />}
              {activeView === 'notes' && <NotesArea notes={currentProject.notes} logoUrl={currentProject.logoUrl} attachments={currentProject.attachments} onUpdateNotes={(notes) => updateProject(currentProject.id, { notes })} onUpdateLogo={(url) => updateProject(currentProject.id, { logoUrl: url })} onUpdateAttachments={(files) => updateProject(currentProject.id, { attachments: files })} />}
            </div>
          )}
        </div>
      </main>

      {editingTaskId && filteredTasks.find(t => t.id === editingTaskId) && (
        <TaskDetailModal task={filteredTasks.find(t => t.id === editingTaskId)!} allProjects={state.projects} onClose={() => setEditingTaskId(null)} onUpdate={(up) => {
          const updateTaskInState = (list: Project[]): Project[] => list.map(p => {
            const idx = p.tasks.findIndex(t => t.id === editingTaskId);
            if (idx !== -1) {
              const ts = [...p.tasks];
              ts[idx] = { ...ts[idx], ...up };
              return { ...p, tasks: ts };
            }
            return { ...p, children: updateTaskInState(p.children) };
          });
          const next = updateTaskInState(state.projects);
          dispatch({ type: 'UPDATE_PROJECTS', projects: next });
          syncToCloud(next);
        }} />
      )}
    </div>
  );
};

const App: React.FC = () => {
  const { state } = useProjects();
  return (
    <Routes>
      <Route path="/" element={state.projects.length > 0 ? <Navigate to={`/project/${state.projects[0].id}/dashboard`} /> : <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-pink-400" /></div>} />
      <Route path="/project/:projectId/:view" element={<ProjectView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
