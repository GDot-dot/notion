
import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { GanttChart } from './components/GanttChart';
import { ProgressBoard } from './components/ProgressBoard';
import { NotesArea } from './components/NotesArea';
import { CalendarView } from './components/CalendarView';
import { ProjectPrecautions } from './components/ProjectPrecautions';
import { TaskDetailModal } from './components/TaskDetailModal';
import { Project, ViewType, TaskStatus, Task, TaskPriority } from './types';
import { INITIAL_PROJECTS, COLORS } from './constants';
import { Plus, LayoutDashboard, Calendar, BarChart2, BookOpen, Trash2, Flag, Check, Edit3 } from 'lucide-react';
import { format, startOfDay, addDays } from 'date-fns';

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0].id);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const findProject = (id: string, list: Project[]): Project | null => {
    for (const p of list) {
      if (p.id === id) return p;
      const found = findProject(id, p.children);
      if (found) return found;
    }
    return null;
  };

  const currentProject = useMemo(() => {
    return selectedProjectId ? findProject(selectedProjectId, projects) : null;
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
    setProjects(prev => updater(prev));
  }, []);

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
    setProjects(prev => findAndUpdater(prev));
  }, []);

  const addProject = (parentId: string | null) => {
    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: '新專案 ✨',
      parentId,
      notes: '',
      precautions: [],
      tasks: [],
      children: [],
      logoUrl: '📁' // 將棒棒糖改為資料夾圖示
    };
    if (!parentId) setProjects([...projects, newProject]);
    else setProjects(prev => {
      const updater = (list: Project[]): Project[] => list.map(p => {
        if (p.id === parentId) return { ...p, children: [...p.children, newProject] };
        return { ...p, children: updater(p.children) };
      });
      return updater(prev);
    });
    setSelectedProjectId(newProject.id);
  };

  const deleteProject = (id: string) => {
    if (!confirm('確定要刪除這個專案嗎？ 🥺')) return;
    const filter = (list: Project[]): Project[] => {
      return list.filter(p => p.id !== id).map(p => ({
        ...p,
        children: filter(p.children)
      }));
    };
    const newProjects = filter(projects);
    setProjects(newProjects);
    if (selectedProjectId === id) {
      setSelectedProjectId(newProjects[0]?.id || null);
    }
  };

  const addTask = () => {
    if (!currentProject) return;
    const today = startOfDay(new Date());
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
      relatedProjectId: currentProject.parentId || undefined
    };
    updateProject(currentProject.id, { tasks: [...currentProject.tasks, newTask] });
    setEditingTaskId(newTask.id);
  };

  if (!currentProject) return null;

  const CuteCheckbox = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
        checked ? 'bg-pink-400 border-pink-400 text-white shadow-inner' : 'bg-white border-pink-200 hover:border-pink-300'
      }`}
    >
      {checked && <Check size={16} strokeWidth={4} />}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        projects={projects} 
        selectedProjectId={selectedProjectId} 
        onSelectProject={setSelectedProjectId}
        onAddProject={addProject}
      />

      <main className="flex-1 p-8 overflow-y-auto max-h-screen custom-scrollbar">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6 group">
            <div className="relative">
              <input
                value={currentProject.logoUrl || '📁'}
                onChange={(e) => updateProject(currentProject.id, { logoUrl: e.target.value })}
                className="w-16 h-16 bg-pink-100 rounded-3xl flex items-center justify-center text-4xl shadow-inner focus:outline-none focus:ring-4 focus:ring-pink-200 transition-all text-center"
                title="點擊更換圖示"
              />
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-sm border border-pink-100 pointer-events-none group-hover:scale-110 transition-transform">
                <Edit3 size={12} className="text-pink-300" />
              </div>
            </div>
            <div>
              <input 
                value={currentProject.name}
                onChange={(e) => updateProject(currentProject.id, { name: e.target.value })}
                className="text-4xl font-bold text-pink-600 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-pink-100 rounded-xl px-2 w-full max-w-xl transition-all"
              />
              <div className="flex items-center gap-2 mt-1 ml-2">
                <span className="text-xs font-bold text-pink-300 uppercase tracking-widest">Project Space</span>
                <div className="w-1 h-1 rounded-full bg-pink-200" />
                <span className="text-xs font-bold text-pink-200">{currentProject.parentId ? 'Sub-directory' : 'Root Folder'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
              onClick={() => deleteProject(currentProject.id)}
              className="flex items-center gap-2 bg-white text-pink-400 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-sm border border-pink-100 hover:bg-red-50 hover:text-red-400 hover:border-red-100 transition-all active:scale-95"
            >
              <Trash2 size={18} /> 刪除專案
            </button>
            <button 
              onClick={() => addProject(currentProject.id)}
              className="flex items-center gap-2 bg-pink-500 text-white px-6 py-2.5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-pink-600 transition-all active:scale-95"
            >
              <Plus size={18} /> 建立子專案
            </button>
          </div>
        </header>

        {/* 導覽 Tab */}
        <div className="flex gap-4 mb-10">
          {[
            { id: 'dashboard', label: '總覽頁面', icon: <LayoutDashboard size={18} /> },
            { id: 'gantt', label: '甘特圖', icon: <BarChart2 size={18} /> },
            { id: 'calendar', label: '日期表', icon: <Calendar size={18} /> },
            { id: 'notes', label: '專案設定', icon: <BookOpen size={18} /> },
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as ViewType)}
              className={`flex items-center gap-2 px-8 py-3 rounded-[20px] font-bold transition-all ${
                activeView === view.id 
                  ? 'bg-pink-500 text-white shadow-xl translate-y-[-2px]' 
                  : 'text-pink-300 bg-white/50 hover:bg-pink-50 hover:text-pink-400'
              }`}
            >
              {view.icon} {view.label}
            </button>
          ))}
        </div>

        <div className="space-y-12 pb-20">
          {activeView === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                <ProgressBoard tasks={aggregatedTasks} />
                <ProjectPrecautions 
                  precautions={currentProject.precautions || []} 
                  onUpdate={(items) => updateProject(currentProject.id, { precautions: items })}
                />
              </div>
              
              <GanttChart tasks={aggregatedTasks} />

              <div className="bg-white rounded-[40px] p-8 cute-shadow border border-pink-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-pink-600 flex items-center gap-3">
                    <span className="p-2 bg-pink-100 rounded-xl"><Check size={20} /></span>
                    本層任務
                  </h3>
                  <button 
                    onClick={addTask} 
                    className="flex items-center gap-2 bg-pink-50 text-pink-500 px-6 py-2.5 rounded-2xl font-bold hover:bg-pink-100 transition-all shadow-sm"
                  >
                    <Plus size={18} /> 新增任務
                  </button>
                </div>
                <div className="space-y-4">
                  {currentProject.tasks.map(task => (
                    <div key={task.id} onClick={() => setEditingTaskId(task.id)} className="flex items-center gap-4 p-5 rounded-3xl bg-pink-50/20 border border-pink-50 hover:bg-white hover:shadow-xl hover:translate-x-2 transition-all cursor-pointer group">
                      <CuteCheckbox checked={task.status === TaskStatus.COMPLETED} onChange={() => {
                        const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
                        updateTask(task.id, { status: newStatus, progress: newStatus === TaskStatus.COMPLETED ? 100 : 0 });
                      }} />
                      <div className="flex-1">
                        <p className={`font-bold text-[#5c4b51] text-lg ${task.status === TaskStatus.COMPLETED ? 'line-through opacity-40' : ''}`}>{task.title}</p>
                        {task.description && <p className="text-xs text-pink-300 mt-0.5 truncate max-w-md">{task.description}</p>}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="px-4 py-1.5 rounded-full text-[11px] font-bold shadow-inner" style={{ backgroundColor: COLORS.priority[task.priority] }}>{task.priority}</div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-bold text-pink-400 uppercase tracking-tighter">Progress</span>
                          <span className="text-sm font-bold text-pink-500">{task.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {currentProject.tasks.length === 0 && (
                    <div className="text-center py-16 text-pink-200 bg-pink-50/10 rounded-[40px] border-2 border-dashed border-pink-50">
                      <p className="text-4xl mb-2">📂</p>
                      <p className="font-bold">這層專案還沒有任務喔，點擊上方按鈕新增吧！</p>
                    </div>
                  )}
                </div>
              </div>

              <CalendarView tasks={aggregatedTasks} />
            </div>
          )}

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
