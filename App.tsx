
import React, { useState, useCallback, useMemo } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar.tsx';
import { GanttChart } from './components/GanttChart.tsx';
import { ProgressBoard } from './components/ProgressBoard.tsx';
import { NotesArea } from './components/NotesArea.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { ProjectPrecautions } from './components/ProjectPrecautions.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { Project, ViewType, TaskStatus, Task, TaskPriority } from './types.ts';
import { COLORS } from './constants.tsx';
import { useProjects } from './context/ProjectContext.tsx';
import { auth, googleProvider, isConfigured } from './lib/firebase.ts';
import { signInWithPopup, signOut } from 'firebase/auth';
import { Plus, LayoutDashboard, Calendar, BarChart2, BookOpen, Trash2, Check, Edit3, Menu, LogIn, ShieldAlert, Loader2, Save, CloudCheck } from 'lucide-react';
import { addDays } from 'date-fns';

// 🍓 效能優化：使用 React.memo 包裝單個任務項，防止列表更新時不必要的重繪
const TaskItem = React.memo(({ task, onToggleStatus, onEdit, onDelete }: { 
  task: Task, 
  onToggleStatus: () => void, 
  onEdit: () => void,
  onDelete: () => void 
}) => {
  return (
    <div className="flex items-center gap-4 p-4 md:p-5 rounded-[24px] md:rounded-3xl bg-pink-50/20 border border-pink-50 hover:bg-white hover:shadow-lg transition-all cursor-pointer group" onClick={onEdit}>
      <div 
        onClick={(e) => { e.stopPropagation(); onToggleStatus(); }}
        className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
          task.status === TaskStatus.COMPLETED ? 'bg-pink-400 border-pink-400 text-white shadow-inner scale-110' : 'bg-white border-pink-200 hover:border-pink-300'
        }`}
      >
        {task.status === TaskStatus.COMPLETED && <Check size={16} strokeWidth={4} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-[#5c4b51] text-base md:text-lg truncate ${task.status === TaskStatus.COMPLETED ? 'line-through opacity-40' : ''}`}>{task.title}</p>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        <div className="px-3 py-1 rounded-full text-[10px] font-black border border-white/50 shadow-sm" style={{ backgroundColor: COLORS.status[task.status] }}>{task.status}</div>
        <span className="text-sm font-bold text-pink-500 min-w-[32px]">{task.progress}%</span>
        {/* 🍭 需求確認：刪除任務功能 */}
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 text-pink-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 rounded-xl"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
});

const ProjectView: React.FC = () => {
  const { projectId, view } = useParams<{ projectId: string, view: ViewType }>();
  const { state, dispatch, syncToCloud } = useProjects();
  const navigate = useNavigate();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 輔助函式：在樹狀結構中尋找專案
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

  const activeView = (view || 'dashboard') as ViewType;

  // 輔助函式：遞迴獲取所有子專案的任務（用於甘特圖與進度表）
  const getAggregatedTasks = useCallback((proj: Project): Task[] => {
    let tasks = [...proj.tasks];
    proj.children.forEach(child => {
      tasks = [...tasks, ...getAggregatedTasks(child)];
    });
    return tasks;
  }, []);

  const aggregatedTasks = useMemo(() => {
    return currentProject ? getAggregatedTasks(currentProject) : [];
  }, [currentProject, getAggregatedTasks]);

  // 更新專案資訊（遞迴遍歷整個 projects 陣列）
  const updateProject = (id: string, updates: Partial<Project>) => {
    const updater = (list: Project[]): Project[] => list.map(p => {
      if (p.id === id) return { ...p, ...updates };
      return { ...p, children: updater(p.children) };
    });
    const next = updater(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  // 更新任務資訊（遞迴遍歷整個專案樹）
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    const updater = (list: Project[]): Project[] => list.map(p => {
      const idx = p.tasks.findIndex(t => t.id === taskId);
      if (idx !== -1) {
        const ts = [...p.tasks];
        ts[idx] = { ...ts[idx], ...updates };
        return { ...p, tasks: ts };
      }
      return { ...p, children: updater(p.children) };
    });
    const next = updater(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  const addTask = () => {
    if (!currentProject) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      title: '新任務 🎀',
      description: '',
      startDate: today.toISOString(),
      endDate: addDays(today, 2).toISOString(),
      progress: 0,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      color: COLORS.taskColors[Math.floor(Math.random() * COLORS.taskColors.length)],
    };
    updateProject(currentProject.id, { tasks: [...currentProject.tasks, newTask] });
    setEditingTaskId(newTask.id);
  };

  const deleteTask = (taskId: string) => {
    if (!confirm('確定要刪除這個任務嗎？ 🍬')) return;
    const remover = (list: Project[]): Project[] => list.map(p => ({
      ...p,
      tasks: p.tasks.filter(t => t.id !== taskId),
      children: remover(p.children)
    }));
    const next = remover(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
  };

  const deleteProject = (id: string) => {
    if (state.projects.length === 1 && !state.projects[0].parentId) {
      alert("至少需要保留一個計畫喔！🍭");
      return;
    }
    if (!confirm('確定要刪除目前這個計畫嗎？ 🥺')) return;
    const filter = (list: Project[]): Project[] => list.filter(p => p.id !== id).map(p => ({
      ...p,
      children: filter(p.children)
    }));
    const next = filter(state.projects);
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
    navigate('/');
  };

  const addProject = (parentId: string | null) => {
    const newP: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新計畫 🎀',
      parentId,
      notes: '',
      precautions: [],
      tasks: [],
      children: [],
      logoUrl: '📁'
    };
    let next: Project[];
    if (!parentId) next = [...state.projects, newP];
    else {
      const updater = (list: Project[]): Project[] => list.map(p => {
        if (p.id === parentId) return { ...p, children: [...p.children, newP] };
        return { ...p, children: updater(p.children) };
      });
      next = updater(state.projects);
    }
    dispatch({ type: 'UPDATE_PROJECTS', projects: next });
    syncToCloud(next);
    navigate(`/project/${newP.id}/dashboard`);
  };

  if (state.isLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#fff5f8]">
      <Loader2 className="w-12 h-12 text-pink-400 animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen relative overflow-x-hidden bg-[#fff5f8]">
      {isSidebarOpen && <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
      
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
        onAddProject={addProject}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar transition-all duration-300">
        {!isConfigured && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-6 rounded-r-xl flex items-center gap-3 animate-pulse">
            <ShieldAlert className="flex-shrink-0" />
            <p className="text-sm font-bold">⚠️ Firebase 尚未連線，資料暫存在本機 🍓</p>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-3 md:gap-6 group">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-pink-500 bg-white rounded-xl shadow-sm border border-pink-100">
              <Menu size={24} />
            </button>
            <div className="relative cursor-pointer group" onClick={() => {
              const res = prompt('請輸入 Emoji 或圖片網址 🍭', currentProject.logoUrl || '📁');
              if (res !== null) updateProject(currentProject.id, { logoUrl: res });
            }}>
              <div className="w-12 h-12 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-[32px] flex items-center justify-center text-2xl md:text-5xl shadow-inner border-2 border-pink-100 overflow-hidden">
                {currentProject.logoUrl?.startsWith('http') ? <img src={currentProject.logoUrl} className="w-full h-full object-cover" /> : (currentProject.logoUrl || '📁')}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-pink-500 p-1.5 rounded-full shadow-md border-2 border-white transition-transform group-hover:scale-110"><Edit3 size={12} className="text-white" /></div>
            </div>
            <div className="flex-1 min-w-0">
              <input value={currentProject.name} onChange={(e) => updateProject(currentProject.id, { name: e.target.value })} className="text-2xl md:text-4xl font-black text-pink-600 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-pink-100 rounded-xl px-2 w-full truncate" />
              <div className="flex items-center gap-2 mt-1 ml-2">
                <div className="flex items-center gap-2 px-2 py-0.5 bg-white/40 rounded-full border border-pink-100">
                  {state.isSyncing ? <><Loader2 size={12} className="text-pink-400 animate-spin" /><span className="text-[10px] text-pink-400 font-bold">同步中...</span></> : 
                    state.user ? <><CloudCheck size={12} className="text-green-400" /><span className="text-[10px] text-green-500 font-bold">雲端已同步</span></> : 
                    <><Save size={12} className="text-blue-400" /><span className="text-[10px] text-blue-500 font-bold">本地存檔</span></>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {!state.user ? (
              <button onClick={() => auth && signInWithPopup(auth, googleProvider)} className="flex items-center gap-2 bg-white text-blue-500 px-4 py-2 rounded-xl font-bold text-sm shadow-md border border-blue-50 hover:bg-blue-50 active:scale-95 transition-all">
                <LogIn size={18} /> Google 登入
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/60 p-1.5 pr-4 rounded-2xl border border-pink-100 shadow-sm">
                <img src={state.user.photoURL || ''} className="w-8 h-8 rounded-full border-2 border-pink-200 shadow-sm" />
                <button onClick={() => auth && signOut(auth)} className="text-[10px] font-bold text-pink-300 hover:text-red-400">登出</button>
              </div>
            )}
            <button onClick={() => deleteProject(currentProject.id)} className="p-2.5 bg-white text-pink-300 hover:text-red-400 rounded-xl border border-pink-50 shadow-sm hover:bg-red-50 transition-colors"><Trash2 size={20} /></button>
            <button onClick={() => addProject(currentProject.id)} className="flex items-center gap-2 bg-pink-500 text-white px-4 md:px-6 py-2 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm shadow-md hover:bg-pink-600 transition-all active:scale-95"><Plus size={16} /> 建立計畫</button>
          </div>
        </header>

        <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'dashboard', label: '總覽', icon: <LayoutDashboard size={18} /> },
            { id: 'gantt', label: '甘特圖', icon: <BarChart2 size={18} /> },
            { id: 'calendar', label: '日期表', icon: <Calendar size={18} /> },
            { id: 'notes', label: '設定', icon: <BookOpen size={18} /> },
          ].map(v => (
            <button key={v.id} onClick={() => navigate(`/project/${currentProject.id}/${v.id}`)} className={`flex items-center gap-2 px-5 md:px-8 py-2 md:py-3 rounded-xl md:rounded-[20px] font-bold transition-all ${activeView === v.id ? 'bg-pink-500 text-white shadow-xl translate-y-[-2px]' : 'text-pink-300 bg-white/50 hover:bg-pink-50'}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        <div className="space-y-8 md:space-y-12 pb-20 animate-in fade-in duration-500">
          {activeView === 'dashboard' ? (
            <div className="space-y-8 md:space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <ProgressBoard tasks={aggregatedTasks} />
                <ProjectPrecautions precautions={currentProject.precautions || []} onUpdate={(items) => updateProject(currentProject.id, { precautions: items })} />
              </div>
              <GanttChart tasks={aggregatedTasks} />
              <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 cute-shadow border border-pink-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h3 className="text-xl font-bold text-pink-600 flex items-center gap-3"><span className="p-2 bg-pink-100 rounded-xl text-pink-500"><Check size={20} /></span>任務清單</h3>
                  <button onClick={addTask} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-pink-50 text-pink-500 px-6 py-2.5 rounded-2xl font-bold hover:bg-pink-100 shadow-sm transition-all"><Plus size={18} /> 新增任務</button>
                </div>
                <div className="space-y-4">
                  {currentProject.tasks.map(task => (
                    <TaskItem 
                      key={task.id} 
                      task={task} 
                      onToggleStatus={() => {
                        const s = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
                        updateTask(task.id, { status: s, progress: s === TaskStatus.COMPLETED ? 100 : 0 });
                      }}
                      onEdit={() => setEditingTaskId(task.id)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))}
                  {currentProject.tasks.length === 0 && (
                    <div className="text-center py-12 text-pink-200 font-bold italic border-2 border-dashed border-pink-50 rounded-3xl">
                      快來新增你的第一個任務吧！🍭
                    </div>
                  )}
                </div>
              </div>
              <CalendarView tasks={aggregatedTasks} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeView === 'gantt' && <GanttChart tasks={aggregatedTasks} />}
              {activeView === 'calendar' && <CalendarView tasks={aggregatedTasks} />}
              {activeView === 'notes' && <NotesArea notes={currentProject.notes} logoUrl={currentProject.logoUrl} onUpdateNotes={(notes) => updateProject(currentProject.id, { notes })} onUpdateLogo={(url) => updateProject(currentProject.id, { logoUrl: url })} />}
            </div>
          )}
        </div>
      </main>

      {editingTaskId && aggregatedTasks.find(t => t.id === editingTaskId) && (
        <TaskDetailModal 
          task={aggregatedTasks.find(t => t.id === editingTaskId)!}
          allProjects={state.projects}
          onClose={() => setEditingTaskId(null)}
          onUpdate={(up) => updateTask(editingTaskId, up)}
        />
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
