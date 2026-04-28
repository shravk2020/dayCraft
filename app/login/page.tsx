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
  const [isAuthorized, setIsAuthorized] = useState(false);

  // NEW: State to track the date we are currently viewing!
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [currentView, setCurrentView] = useState('Day');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCrafting, setIsCrafting] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenString = urlParams.get('token');
    const accountType = urlParams.get('type') || 'primary';

    if (tokenString) {
      localStorage.setItem(`gcal_${accountType}_tokens`, tokenString);
      window.history.replaceState({}, document.title, "/");
      setIsAuthorized(true);
      if (accountType === 'school') setIsIntegrationsOpen(true);
    } else if (localStorage.getItem('gcal_primary_tokens')) {
      setIsAuthorized(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  if (!isAuthorized) return null;

  // NEW: Smart Date Formatter based on the currentView
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
      // Find the Monday of the current week
      const dayOfWeek = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      
      const monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() + distanceToMonday);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const monthStart = monday.toLocaleDateString('en-US', { month: 'long' });
      const monthEnd = sunday.toLocaleDateString('en-US', { month: 'long' });
      const yearStart = monday.getFullYear();
      const yearEnd = sunday.getFullYear();

      // Format smartly (e.g. "April 27 - May 3, 2026" or "April 20 - 26, 2026")
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

  // NEW: Navigation Functions
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

  const handleToday = () => {
    setCurrentDate(new Date());
  };

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
    router.push('/login');
  };

  return (
    <main className="flex min-h-screen bg-slate-50 text-slate-900 overflow-hidden relative">
      <Sidebar tasks={tasks} onOpenAddTask={() => { setEditingTask(null); setIsModalOpen(true); }} onDeleteTask={handleDeleteTask} onEditTask={handleEditTask} onReorderTasks={handleReorderTasks} onToggleComplete={handleToggleComplete} isCrafting={isCrafting} onCraft={handleCraftMyDay} />
      
      <div className="flex-1 p-8 flex flex-col h-screen">
        <header className="flex justify-between items-center mb-8 shrink-0 gap-4">
          
          {/* UPDATED: Dynamic Header with Navigation Buttons */}
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
          
          {/* View Toggles */}
          <div className="flex bg-slate-200/50 p-1 rounded-xl shrink-0">
            {['Day', 'Week', 'Month'].map((viewName) => (
              <button key={viewName} onClick={() => setCurrentView(viewName)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${ currentView === viewName ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700' }`}>
                {viewName}
              </button>
            ))}
          </div>

          <div className="flex justify-end relative">
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className={`h-12 w-12 border rounded-2xl shadow-sm flex items-center justify-center font-bold transition-all ${isProfileOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-indigo-600 hover:border-indigo-200'}`}>
              JD
            </button>
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className="absolute right-0 top-14 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-slate-800">John Doe</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">john@student.edu</p>
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
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          {isCrafting ? <LoadingState /> : (
            <>
              {/* Note: I added currentDate={currentDate} to these components so you can use it inside them! */}
              {currentView === 'Day' && <CalendarGrid tasks={tasks} currentDate={currentDate} />}
              {currentView === 'Week' && <WeekView tasks={tasks} currentDate={currentDate} />}
              {currentView === 'Month' && <MonthView tasks={tasks} currentDate={currentDate} />}
            </>
          )}
        </div>
      </div>
      <AddTaskModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingTask(null); }} onSave={handleSaveTask} editingTask={editingTask} />
      <IntegrationsModal isOpen={isIntegrationsOpen} onClose={() => setIsIntegrationsOpen(false)} />
    </main>
  );
}