"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import CalendarGrid from '@/components/CalendarGrid';
import WeekView from '@/components/WeekView';
import MonthView from '@/components/MonthView';
import AddTaskModal from '@/components/AddTaskModal';
import IntegrationsModal from '@/components/IntegrationsModal';
import LoadingState from '@/components/LoadingState';

export interface Task {
  id: string;
  title: string;
  source: string;
  duration: number;
  dueDate?: string;
  dueTime?: string;
  flexibility?: 'Rigid' | 'High Priority' | 'Flexible';
  description?: string;
  completedAt?: string;
  scheduledStart?: string;
}

export default function Home() {
  const router = useRouter();
  
  // 1. NEW STATES FOR AUTH AND PROFILE
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userProfile, setUserProfile] = useState<{name: string, email: string, initials: string} | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState('Day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCrafting, setIsCrafting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  // 2. THE UPDATED TOKEN CATCHER & DECODER
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const accountType = urlParams.get('type') || 'primary';
    let storedToken = localStorage.getItem('gcal_primary_tokens');

    if (urlToken) {
      localStorage.setItem(`gcal_${accountType}_tokens`, urlToken);
      window.history.replaceState({}, document.title, "/");
      storedToken = urlToken;
      
      if (accountType !== 'primary') {
        setIsIntegrationsOpen(true);
      }
    }

    if (storedToken) {
      try {
        const parsed = JSON.parse(storedToken);
        // Magic Trick: Google encodes the user info in base64 inside the id_token!
        if (parsed.id_token) {
          const payload = JSON.parse(atob(parsed.id_token.split('.')[1]));
          const name = payload.name || 'User';
          const email = payload.email || '';
          const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
          
          setUserProfile({ name, email, initials });
        }
        setIsAuthorized(true);
      } catch (e) {
        console.error("Token parsing error:", e);
      }
    } else {
      // We no longer router.push('/login') here! We let guests stay.
      setIsAuthorized(false);
    }
    
    setIsCheckingAuth(false);
  }, [router]);

// --- THE DUAL DATA FETCHER ---
  useEffect(() => {
    if (isAuthorized && userProfile?.email) {
      
      // 1. Fetch Calendar Events
      const fetchEvents = async () => {
        try {
          const response = await fetch(`http://localhost:8080/api/calendar/events?email=${userProfile.email}`);
          if (!response.ok) throw new Error('Failed to fetch events');
          const data = await response.json();
          console.log("📅 Combined Events Loaded:", data);
          setCalendarEvents(data);
        } catch (err) {
          console.error("Calendar fetch error:", err);
        }
      };

      // 2. Fetch Classroom Tasks
      const fetchTasks = async () => {
        try {
          const response = await fetch(`http://localhost:8080/api/classroom/tasks?email=${userProfile.email}`);
          if (!response.ok) throw new Error('Failed to fetch tasks');
          const data = await response.json();
          console.log("📚 Classroom Tasks Loaded:", data);
          
          // We combine the new Classroom tasks with any manually created ones you might have!
          setTasks((prevTasks) => {
            const manualTasks = prevTasks.filter(t => !t.id || !t.id.includes('coursework'));
            return [...manualTasks, ...data];
          });
        } catch (err) {
          console.error("Task fetch error:", err);
        }
      };

      // Run both fetches at the exact same time!
      fetchEvents();
      fetchTasks();
    }
  }, [isAuthorized, userProfile?.email]);

  const getFormattedHeader = () => {
    if (currentView === 'Day') {
      const weekday = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
      const month = currentDate.toLocaleDateString('en-US', { month: 'long' });
      const day = currentDate.getDate();
      const year = currentDate.getFullYear();
      const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
      };
      return `${weekday}, ${month} ${day}${getOrdinal(day)}, ${year}`;
    } 
    
    if (currentView === 'Week') {
      const dayOfWeek = currentDate.getDay(); 
      const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() + distanceToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monthStart = monday.toLocaleDateString('en-US', { month: 'short' });
      const monthEnd = sunday.toLocaleDateString('en-US', { month: 'short' });
      const yearStart = monday.getFullYear();
      const yearEnd = sunday.getFullYear();

      if (monthStart === monthEnd) {
        return `${monthStart} ${monday.getDate()} - ${sunday.getDate()}, ${yearStart}`;
      } else if (yearStart === yearEnd) {
        return `${monthStart} ${monday.getDate()} - ${monthEnd} ${sunday.getDate()}, ${yearStart}`;
      } else {
        return `${monthStart} ${monday.getDate()}, ${yearStart} - ${monthEnd} ${sunday.getDate()}, ${yearEnd}`;
      }
    } 
    
    if (currentView === 'Month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day') newDate.setDate(newDate.getDate() - 1);
    if (currentView === 'Week') newDate.setDate(newDate.getDate() - 7);
    if (currentView === 'Month') newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (currentView === 'Day') newDate.setDate(newDate.getDate() + 1);
    if (currentView === 'Week') newDate.setDate(newDate.getDate() + 7);
    if (currentView === 'Month') newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleSaveTask = (taskToSave: Task) => {
    const cleanTask = { ...taskToSave, scheduledStart: undefined };
    if (editingTask) setTasks(tasks.map(t => t.id === cleanTask.id ? cleanTask : t));
    else setTasks([...tasks, cleanTask]);
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => setTasks(tasks.filter(t => t.id !== taskId));
  const handleEditTask = (task: Task) => { setEditingTask(task); setIsModalOpen(true); };
  const handleReorderTasks = (reorderedTasks: Task[]) => setTasks(reorderedTasks);
  const handleToggleComplete = (taskId: string) => setTasks(tasks.map(task => task.id === taskId ? { ...task, completedAt: task.completedAt ? undefined : new Date().toISOString() } : task));
  
  const handleCraftMyDay = () => {
    setIsCrafting(true);
    setTimeout(() => {
      setIsCrafting(false);
      let currentHour = 9;
      let currentMinute = 0;
      const scheduledTasks = tasks.map(task => {
        if (task.completedAt) return task;
        const formatTime = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const scheduledStart = formatTime(currentHour, currentMinute);
        currentMinute += task.duration + 15;
        while (currentMinute >= 60) { currentHour += 1; currentMinute -= 60; }
        return { ...task, scheduledStart };
      });
      setTasks(scheduledTasks);
    }, 3500); 
  };

  const handleSignOut = () => {
    localStorage.removeItem('gcal_primary_tokens');
    localStorage.removeItem('gcal_school_tokens');
    setIsAuthorized(false);
    setUserProfile(null);
    setIsProfileOpen(false);
  };

  return (
    <main className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden relative">
      <Sidebar tasks={tasks} onOpenAddTask={() => { setEditingTask(null); setIsModalOpen(true); }} onDeleteTask={handleDeleteTask} onEditTask={handleEditTask} onReorderTasks={handleReorderTasks} onToggleComplete={handleToggleComplete} isCrafting={isCrafting} onCraft={handleCraftMyDay} />
      
      <div className="flex-1 p-8 flex flex-col h-screen">
        <header className="flex justify-between items-center mb-8 shrink-0 gap-4">
          
          <div className="flex items-center gap-6 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 truncate min-w-[280px]">
              {getFormattedHeader()}
            </h1>
            
            <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden shrink-0">
              <button onClick={handlePrevious} className="p-2 hover:bg-slate-50 text-slate-600 transition-colors border-r border-slate-200">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleToday} className="px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors border-r border-slate-200">
                Today
              </button>
              <button onClick={handleNext} className="p-2 hover:bg-slate-50 text-slate-600 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex bg-slate-200/50 p-1 rounded-xl shrink-0">
            {['Day', 'Week', 'Month'].map((viewName) => (
              <button key={viewName} onClick={() => setCurrentView(viewName)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ currentView === viewName ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}>
                {viewName}
              </button>
            ))}
          </div>

          <div className="flex justify-end relative items-center gap-4">
            {isCheckingAuth ? (
              // Show a skeleton loader while parsing the token
              <div className="h-12 w-24 bg-slate-200 animate-pulse rounded-xl"></div>
            ) : !isAuthorized ? (
              // NOT LOGGED IN: Show Log In / Sign Up
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/login')} 
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors px-2"
                >
                  Log In
                </button>
                <button 
                  onClick={() => router.push('/login')} 
                  className="text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-sm transition-all active:scale-95"
                >
                  Sign Up
                </button>
              </div>
            ) : (
              // LOGGED IN: Show Profile Icon
              <>
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`h-12 w-12 border rounded-2xl shadow-sm flex items-center justify-center font-bold transition-all ${isProfileOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-indigo-600 hover:border-indigo-200'}`}>
                  {userProfile?.initials || 'JD'}
                </button>
                
                {isProfileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                    <div className="absolute right-0 top-14 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-800 truncate">{userProfile?.name || 'John Doe'}</p>
                        <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">{userProfile?.email || 'john@student.edu'}</p>
                      </div>
                      <div className="px-2 space-y-1">
                        <button className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl flex items-center gap-2 transition-colors">
                          <User className="w-4 h-4" /> Account Settings
                        </button>
                        <button onClick={() => { setIsProfileOpen(false); setIsIntegrationsOpen(true); }} className="w-full text-left px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-xl flex items-center gap-2 transition-colors">
                          <Settings className="w-4 h-4" /> Integrations
                        </button>
                      </div>
                      <div className="px-2 mt-1 pt-1 border-t border-slate-100">
                        <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-colors">
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          {isCrafting ? <LoadingState /> : (
            <>
              {currentView === 'Day' && (
                <CalendarGrid 
                  tasks={tasks} 
                  currentDate={currentDate} 
                  googleEvents = {calendarEvents} // <-- Pass the real data here!
                />
              )}
              {currentView === 'Week' && <WeekView tasks={tasks} currentDate={currentDate} googleEvents={calendarEvents}/>}
              {currentView === 'Month' && <MonthView tasks={tasks} currentDate={currentDate} googleEvents={calendarEvents}/>}
            </>
          )}
        </div>
      </div>
      <AddTaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} onSave={handleSaveTask} editingTask={editingTask} />
      <IntegrationsModal 
        isOpen={isIntegrationsOpen} 
        onClose={() => setIsIntegrationsOpen(false)} 
        primaryEmail={userProfile?.email}
      />
    </main>
  );
}