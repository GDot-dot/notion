
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { GanttChart } from './components/GanttChart.tsx';
import { ProgressBoard } from './components/ProgressBoard.tsx';
import { NotesArea } from './components/NotesArea.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { ProjectPrecautions } from './components/ProjectPrecautions.tsx';
import { TaskDetailModal } from './components/TaskDetailModal.tsx';
import { Project, ViewType, TaskStatus, Task, TaskPriority } from './types.ts';
import { INITIAL_PROJECTS, COLORS } from './constants.tsx';
import { Plus, LayoutDashboard, Calendar, BarChart2, BookOpen, Trash2, Check, Edit3, Menu, LogIn, LogOut, Cloud, ShieldAlert, Loader2, Save, CloudCheck } from 'lucide-react';
import { addDays } from 'date-fns';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

/**
 * 🍓 請確認這裡已經換成你的 Firebase 配置 🍓
 */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const isConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY";
const app = isConfigured ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [workspaceLogo, setWorkspaceLogo] = useState('🍓');
  const [workspaceName, setWorkspaceName] = useState('Melody');
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('melody_local_data');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    setIsLoadingData(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.projects) setProjects(data.projects);
        if (data.workspaceLogo) setWorkspaceLogo(data.workspaceLogo);
        if (data.workspaceName) setWorkspaceName(data.workspaceName);
        if (data.lastUpdated) setLastSyncedAt(data.lastUpdated);
      }
      setIsLoadingData(false);
    }, () => setIsLoadingData(false));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    localStorage.setItem('melody_local_data', JSON.stringify(projects));
  }, [projects]);

  const syncToCloud = useCallback(async (newProjects: Project[], newLogo?: string, newName?: string) => {
    if (!user || !db) return;
    setIsSyncing(true);
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'users', user.uid), { 
        projects: newProjects,
        workspaceLogo: newLogo || workspaceLogo,
        workspaceName: newName || workspaceName,
        lastUpdated: now
      }, { merge: true });
      setLastSyncedAt(now);
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  }, [user, workspaceLogo, workspaceName]);

  const updateProjectsState = (newProjects: Project[]) => {
    setProjects(newProjects);
    syncToCloud(newProjects);
  };

  const handleUpdateWorkspace = (newLogo: string, newName: string) => {
    setWorkspaceLogo(newLogo);
    setWorkspaceName(newName);
    syncToCloud(projects, newLogo, newName);
  };

  const findProject = (id: string, list: Project[]): Project | null => {
    for (const p of list) {
      if (p.id === id) return p;
      const found = findProject(id, p.children);
      if (found) return found;
    }
    return null;
  };

  const currentProject = useMemo(() => {
    return (selectedProjectId ? findProject(selectedProjectId, projects) : null) || projects[0];
  }, [selectedProjectId, projects]);

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

  const updateProject = useCallback((id: string, updates: Partial<Project>) => {
    const updater = (list: Project[]): Project[] => {
      return list.map(p => {
        if (p.id === id) return { ...p, ...updates };
        if (p.children.length > 0) return { ...p, children: updater(p.children) };
        return p;
      });
    };
    updateProjectsState(updater(projects));
  }, [projects]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const findAndUpdater = (list: Project[]): Project[] => {
      return list.map(p => {
        const taskIdx = p.tasks.findIndex(t => t.id === taskId);
        if (taskIdx !== -1) {
          const newTasks = [...p.tasks];
          newTasks[taskIdx] = { ...newTasks[taskIdx], ...updates };
          return { ...p, tasks: newTasks };
        }
        return { ...p, children: findAndUpdater(p.children) };
      });
    };
    updateProjectsState(findAndUpdater(projects));
  }, [projects]);

  const addProject = (parentId: string | null) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新計畫 🎀',
      parentId,
      notes: '',
      precautions: [],
      tasks: [],
      children: [],
      logoUrl: '📁'
    };
    if (!parentId) updateProjectsState([...projects, newProject]);
    else {
      const updater = (list: Project[]): Project[] => list.map(p => {
        if (p.id === parentId) return { ...p, children: [...p.children, newProject] };
        return { ...p, children: updater(p.children) };
      });
      updateProjectsState(updater(projects));
    }
    setSelectedProjectId(newProject.id);
  };

  const handleLogin = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      alert(`登入失敗: ${e.message}`);
    }
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

  const CuteCheckbox = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-6 h-6 rounded-lg border-2 flex-shrink-0 flex items-center justify-center transition-all cursor-pointer ${
        checked ? 'bg-pink-400 border-pink-400 text-white shadow-inner scale-110' : 'bg-white border-pink-200 hover:border-pink-300'
      }`}
    >
      {checked && <Check size={16} strokeWidth={4} />}
    </div>
  );

  return (
    <div className="flex min-h-screen relative overflow-x-hidden bg-[#fff5f8]">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-40 md:hidden animate-in fade-in" onClick={() => setIsSidebarOpen(false)} />
      )}

      <Sidebar 
        projects={projects} 
        workspaceLogo={workspaceLogo}
        workspaceName={workspaceName}
        onUpdateWorkspace={handleUpdateWorkspace}
        selectedProjectId={selectedProjectId || projects[0]?.id} 
        isOpen={isSidebarOpen}
        onSelectProject={(id) => { setSelectedProjectId(id); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
        onAddProject={addProject}
      />

      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen custom-scrollbar transition-all duration-300">
        {!isConfigured && (
          <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-6 rounded-r-xl flex items-center gap-3 animate-pulse">
            <ShieldAlert className="flex-shrink-0" />
            <p className="text-sm font-bold">⚠️ 尚未連線到 Firebase：你的資料目前僅儲存在本機。🍓</p>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center gap-3 md:gap-6 group">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-pink-500 bg-white rounded-xl shadow-sm border border-pink-100 active:scale-90 transition-transform">
              <Menu size={24} />
            </button>

            <div className="relative cursor-pointer group" onClick={() => {
              const newLogo = prompt('請輸入 Emoji 或圖片網址 🍭', currentProject.logoUrl || '📁');
              if (newLogo !== null) updateProject(currentProject.id, { logoUrl: newLogo });
            }}>
              <div className="w-12 h-12 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-[32px] flex items-center justify-center text-2xl md:text-5xl shadow-inner border-2 border-pink-100 overflow-hidden transition-all group-hover:shadow-lg">
                {currentProject.logoUrl?.startsWith('http') ? (
                  <img src={currentProject.logoUrl} className="w-full h-full object-cover" alt="logo" />
                ) : (
                  currentProject.logoUrl || '📁'
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-pink-500 p-1.5 rounded-full shadow-md border-2 border-white group-hover:scale-125 transition-transform">
                <Edit3 size={12} className="text-white" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <input 
                value={currentProject.name}
                onChange={(e) => updateProject(currentProject.id, { name: e.target.value })}
                className="text-2xl md:text-4xl font-black text-pink-600 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-pink-100 rounded-xl px-2 w-full truncate transition-all"
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 ml-2">
                <div className="flex items-center gap-2 px-2 py-0.5 bg-white/40 rounded-full border border-pink-100">
                  {isSyncing || isLoadingData ? (
                    <>
                      <Loader2 size={12} className="text-pink-400 animate-spin" />
                      <span className="text-[10px] text-pink-400 font-bold">同步中...</span>
                    </>
                  ) : user ? (
                    <>
                      <CloudCheck size={12} className="text-green-400" />
                      <span className="text-[10px] text-green-500 font-bold">雲端已同步</span>
                    </>
                  ) : (
                    <>
                      <Save size={12} className="text-blue-400" />
                      <span className="text-[10px] text-blue-500 font-bold">儲存於本機</span>
                    </>
                  )}
                </div>
                {lastSyncedAt && (
                  <span className="text-[10px] text-pink-200 font-medium">最後儲存: {new Date(lastSyncedAt).toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {!user ? (
              <button onClick={handleLogin} className="flex items-center gap-2 bg-white text-blue-500 px-4 py-2 rounded-xl font-bold text-sm shadow-md border border-blue-50 hover:bg-blue-50 transition-all active:scale-95">
                <LogIn size={18} /> Google 登入
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/60 p-1.5 pr-4 rounded-2xl border border-pink-100 shadow-sm">
                <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border-2 border-pink-200 shadow-sm" alt="avatar" />
                <button onClick={() => auth && signOut(auth)} className="text-[10px] font-bold text-pink-300 hover:text-red-400 transition-colors">登出</button>
              </div>
            )}
            <button onClick={() => addProject(currentProject.id)} className="flex items-center gap-2 bg-pink-500 text-white px-4 md:px-6 py-2 rounded-xl md:rounded-2xl font-bold text-xs md:text-sm shadow-md hover:bg-pink-600 transition-all active:scale-95">
              <Plus size={16} /> 建立計畫
            </button>
          </div>
        </header>

        <div className="flex gap-2 md:gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'dashboard', label: '總覽', icon: <LayoutDashboard size={18} /> },
            { id: 'gantt', label: '甘特圖', icon: <BarChart2 size={18} /> },
            { id: 'calendar', label: '日期表', icon: <Calendar size={18} /> },
            { id: 'notes', label: '設定', icon: <BookOpen size={18} /> },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as ViewType)}
              className={`flex items-center gap-2 px-5 md:px-8 py-2 md:py-3 rounded-xl md:rounded-[20px] font-bold transition-all flex-shrink-0 ${
                activeView === view.id ? 'bg-pink-500 text-white shadow-xl translate-y-[-2px]' : 'text-pink-300 bg-white/50 hover:bg-pink-50'
              }`}
            >
              {view.icon} {view.label}
            </button>
          ))}
        </div>

        <div className="space-y-8 md:space-y-12 pb-20">
          {activeView === 'dashboard' && (
            <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <ProgressBoard tasks={aggregatedTasks} />
                <ProjectPrecautions precautions={currentProject.precautions || []} onUpdate={(items) => updateProject(currentProject.id, { precautions: items })} />
              </div>
              <GanttChart tasks={aggregatedTasks} />
              <div className="bg-white rounded-[32px] md:rounded-[40px] p-6 md:p-8 cute-shadow border border-pink-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <h3 className="text-xl font-bold text-pink-600 flex items-center gap-3">
                    <span className="p-2 bg-pink-100 rounded-xl text-pink-500"><Check size={20} /></span>
                    任務清單
                  </h3>
                  <button onClick={addTask} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-pink-50 text-pink-500 px-6 py-2.5 rounded-2xl font-bold hover:bg-pink-100 transition-all shadow-sm">
                    <Plus size={18} /> 新增任務
                  </button>
                </div>
                <div className="space-y-4">
                  {currentProject.tasks.map(task => (
                    <div key={task.id} onClick={() => setEditingTaskId(task.id)} className="flex items-center gap-4 p-4 md:p-5 rounded-[24px] md:rounded-3xl bg-pink-50/20 border border-pink-50 hover:bg-white hover:shadow-lg transition-all cursor-pointer group">
                      <CuteCheckbox checked={task.status === TaskStatus.COMPLETED} onChange={() => {
                        const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
                        updateTask(task.id, { status: newStatus, progress: newStatus === TaskStatus.COMPLETED ? 100 : 0 });
                      }} />
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-[#5c4b51] text-base md:text-lg truncate ${task.status === TaskStatus.COMPLETED ? 'line-through opacity-40' : ''}`}>{task.title}</p>
                      </div>
                      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                        <div className="px-3 py-1 rounded-full text-[10px] font-black border border-white/50 shadow-sm" style={{ backgroundColor: COLORS.status[task.status] }}>{task.status}</div>
                        <span className="text-sm font-bold text-pink-500 min-w-[32px]">{task.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <CalendarView tasks={aggregatedTasks} />
            </div>
          )}

          {activeView !== 'dashboard' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeView === 'gantt' && <GanttChart tasks={aggregatedTasks} />}
                {activeView === 'calendar' && <CalendarView tasks={aggregatedTasks} />}
                {activeView === 'notes' && (
                  <NotesArea 
                    notes={currentProject.notes} 
                    logoUrl={currentProject.logoUrl}
                    onUpdateNotes={(notes) => updateProject(currentProject.id, { notes })}
                    onUpdateLogo={(url) => updateProject(currentProject.id, { logoUrl: url })}
                  />
                )}
             </div>
          )}
        </div>
      </main>

      {editingTaskId && aggregatedTasks.find(t => t.id === editingTaskId) && (
        <TaskDetailModal 
          task={aggregatedTasks.find(t => t.id === editingTaskId)!}
          allProjects={projects}
          onClose={() => setEditingTaskId(null)}
          onUpdate={(updates) => updateTask(editingTaskId, updates)}
        />
      )}
    </div>
  );
};

export default App;
