import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { Project } from '../types.ts';
import { INITIAL_PROJECTS } from '../constants.tsx';
// Fix: Import auth utilities from local firebase lib to resolve missing member errors
import { auth, db, onAuthStateChanged } from '../lib/firebase.ts';
import type { User } from '../lib/firebase.ts';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

interface State {
  projects: Project[];
  workspaceLogo: string;
  workspaceName: string;
  user: User | null;
  lastSyncedAt: string | null;
  isLoading: boolean;
  isSyncing: boolean;
  isDarkMode: boolean; // 🍓 新增 Dark Mode 狀態
}

type Action =
  | { type: 'SET_USER'; user: User | null }
  | { type: 'SET_DATA'; projects: Project[]; workspaceLogo: string; workspaceName: string; lastSyncedAt: string | null }
  | { type: 'UPDATE_PROJECTS'; projects: Project[] }
  | { type: 'UPDATE_WORKSPACE'; logo: string; name: string }
  | { type: 'SET_SYNCING'; isSyncing: boolean }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'TOGGLE_THEME' }; // 新增切換主題動作

const initialState: State = {
  projects: [],
  workspaceLogo: '🍓',
  workspaceName: 'Melody',
  user: null,
  lastSyncedAt: null,
  isLoading: true,
  isSyncing: false,
  isDarkMode: localStorage.getItem('melody_theme') === 'dark',
};

const projectReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user };
    case 'SET_DATA':
      return { 
        ...state, 
        projects: action.projects, 
        workspaceLogo: action.workspaceLogo, 
        workspaceName: action.workspaceName,
        lastSyncedAt: action.lastSyncedAt
      };
    case 'UPDATE_PROJECTS':
      return { ...state, projects: action.projects };
    case 'UPDATE_WORKSPACE':
      return { ...state, workspaceLogo: action.logo, workspaceName: action.name };
    case 'SET_SYNCING':
      return { ...state, isSyncing: action.isSyncing };
    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };
    case 'TOGGLE_THEME':
      const newMode = !state.isDarkMode;
      localStorage.setItem('melody_theme', newMode ? 'dark' : 'light');
      // 直接操作 DOM 確保立即生效
      if (newMode) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return { ...state, isDarkMode: newMode };
    default:
      return state;
  }
};

const ProjectContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
  syncToCloud: (projects: Project[], logo?: string, name?: string) => Promise<void>;
} | null>(null);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, {
    ...initialState,
    projects: JSON.parse(localStorage.getItem('melody_local_data') || JSON.stringify(INITIAL_PROJECTS))
  });

  // 用於防抖動 (Debounce) 的 Timer Ref
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化主題
  useEffect(() => {
    if (state.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // 🍓 核心修正：監聽登入狀態與處理載入標記
  useEffect(() => {
    // 情況 A: 如果根本沒有設定 Firebase API Key
    if (!auth) {
      dispatch({ type: 'SET_LOADING', isLoading: false });
      return;
    }

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      dispatch({ type: 'SET_USER', user: u });
      
      // 情況 B: 如果使用者沒有登入，停止載入狀態，讓應用程式顯示本地緩存資料
      if (!u) {
        dispatch({ 
          type: 'SET_DATA', 
          projects: JSON.parse(localStorage.getItem('melody_local_data') || JSON.stringify(INITIAL_PROJECTS)),
          workspaceLogo: '🍓',
          workspaceName: 'Melody',
          lastSyncedAt: null
        });
        dispatch({ type: 'SET_LOADING', isLoading: false });
      }
    });
    return () => unsubAuth();
  }, []);

  // 情況 C: 如果使用者已登入，開始監聽 Firestore 雲端資料
  useEffect(() => {
    if (!state.user || !db) return;
    
    dispatch({ type: 'SET_LOADING', isLoading: true });
    let isInitialSyncForThisUser = true;

    const unsubDoc = onSnapshot(doc(db, 'users', state.user.uid), (snapshot) => {
      // 只有當不是本地正在同步時，才接收遠端更新，避免打字衝突
      if (!timeoutRef.current) {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const cloudProjects = data.projects || INITIAL_PROJECTS;
          let finalProjects = cloudProjects;

          // 本地資料合流邏輯：只有在剛登入的第一次同步偵測
          if (isInitialSyncForThisUser) {
            isInitialSyncForThisUser = false;
            const localDataStr = localStorage.getItem('melody_local_data');
            
            if (localDataStr) {
              try {
                const localProjects = JSON.parse(localDataStr) as Project[];
                
                // 檢查是否真的有手動修改（忽略自動更新的 lastAccessedAt 等屬性）
                const clean = (projects: Project[]): any => {
                  return projects.map(p => {
                    const { lastAccessedAt, ...rest } = p;
                    return {
                      ...rest,
                      children: clean(p.children || []),
                      tasks: p.tasks.map(t => {
                        const { remindedHistory, ...tRest } = t as any; 
                        return tRest;
                      })
                    };
                  });
                };
                
                const isModified = JSON.stringify(clean(localProjects)) !== JSON.stringify(clean(INITIAL_PROJECTS));

                if (isModified) {
                  const wantMerge = window.confirm(
                    '🎀 發現您有在地編輯的變更！\n\n' +
                    '是否要將這些本地變更作為「新計畫」加入到您的雲端帳號中？\n\n' +
                    '[確定]：保留本地資料，合併至雲端\n' +
                    '[取消]：捨棄本地變更，使用雲端原有資料'
                  );

                  if (wantMerge) {
                    // 賦予新 ID，避免覆蓋雲端原有專案
                    const cloneWithNewIds = (projects: Project[], parentId: string | null = null): Project[] => {
                      return projects.map(p => {
                        const newId = 'proj-' + Math.random().toString(36).substr(2, 9);
                        return {
                          ...p,
                          id: newId,
                          parentId,
                          name: p.name + ' (來自本地)',
                          children: cloneWithNewIds(p.children || [], newId)
                        };
                      });
                    };
                    
                    const clonedLocal = cloneWithNewIds(localProjects);
                    finalProjects = [...cloudProjects, ...clonedLocal];
                    
                    // 立刻推送到雲端
                    setDoc(doc(db, 'users', state.user!.uid), {
                      projects: finalProjects,
                      workspaceLogo: data.workspaceLogo || state.workspaceLogo,
                      workspaceName: data.workspaceName || state.workspaceName,
                      lastUpdated: new Date().toISOString()
                    }, { merge: true }).catch(console.error);
                  }
                }
              } catch (e) {
                console.error("Failed to parse local projects for merge check:", e);
              }
            }
          }

          dispatch({ 
            type: 'SET_DATA', 
            projects: finalProjects,
            workspaceLogo: data.workspaceLogo || '🍓',
            workspaceName: data.workspaceName || 'Melody',
            lastSyncedAt: data.lastUpdated || null
          });
        } else {
          // 若雲端無資料（例如首次登入），自動將目前的本機資料備份至雲端
          const localDataStr = localStorage.getItem('melody_local_data');
          let localProjects = INITIAL_PROJECTS;
          try {
            if (localDataStr) localProjects = JSON.parse(localDataStr);
          } catch (e) {
            console.error(e);
          }
          
          setDoc(doc(db, 'users', state.user!.uid), {
            projects: localProjects,
            workspaceLogo: state.workspaceLogo || '🍓',
            workspaceName: state.workspaceName || 'Melody',
            lastUpdated: new Date().toISOString()
          }, { merge: true }).catch(console.error);
        }
      }
      dispatch({ type: 'SET_LOADING', isLoading: false });
    }, (error) => {
      console.error("Firestore error:", error);
      dispatch({ type: 'SET_LOADING', isLoading: false });
    });
    return () => unsubDoc();
  }, [state.user]);

  // 同步邏輯 (加入 2 秒防抖動)
  const syncToCloud = useCallback(async (newProjects: Project[], newLogo?: string, newName?: string) => {
    // 1. 始終先更新本地快取 (保持介面反應快速)
    localStorage.setItem('melody_local_data', JSON.stringify(newProjects));

    if (!state.user || !db) return;

    // 2. 設定同步狀態為 true (顯示 loading spinner)
    dispatch({ type: 'SET_SYNCING', isSyncing: true });

    // 3. 如果有正在等待的寫入排程，先清除它
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 4. 設定新的延遲寫入排程 (2秒後執行)
    timeoutRef.current = setTimeout(async () => {
      try {
        const now = new Date().toISOString();
        await setDoc(doc(db, 'users', state.user.uid), { 
          projects: newProjects,
          workspaceLogo: newLogo || state.workspaceLogo,
          workspaceName: newName || state.workspaceName,
          lastUpdated: now
        }, { merge: true });
      } catch (e) {
        console.error("Sync Error:", e);
      } finally {
        dispatch({ type: 'SET_SYNCING', isSyncing: false });
        timeoutRef.current = null;
      }
    }, 2000); // 延遲 2000 毫秒
  }, [state.user, state.workspaceLogo, state.workspaceName]);

  return (
    <ProjectContext.Provider value={{ state, dispatch, syncToCloud }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects must be used within ProjectProvider");
  return context;
};