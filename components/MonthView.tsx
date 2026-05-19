"use client";

import { Task } from '../app/page';

interface MonthViewProps {
  tasks: Task[];
  currentDate: Date;
  googleEvents?: any[];
  setCurrentDate: (date: Date) => void;
  setCurrentView: (view: 'Day' | 'Week' | 'Month') => void;
}

export default function MonthView({ tasks, currentDate, googleEvents, setCurrentDate, setCurrentView }: MonthViewProps) {  
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // 1. DYNAMIC GRID MATH
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); 
  const firstDay = new Date(year, month, 1).getDay(); 
  
  const calendarBlocks = Array.from({ length: 35 }, (_, i) => {
    const dayOffset = i - firstDay + 1;
    return new Date(year, month, dayOffset);
  });
  
  const scheduledTasks = tasks.filter(task => !task.completedAt && task.scheduledStart);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 h-full shadow-sm flex flex-col overflow-hidden">
      
      {/* Month Header */}
      <div className="grid grid-cols-7 border-b border-slate-100 shrink-0">
        {daysOfWeek.map(day => (
          <div key={day} className="py-3 text-center font-bold text-slate-400 text-xs uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-7 grid-rows-5 flex-1 bg-slate-100 gap-[1px]">
        {calendarBlocks.map((blockDate, index) => {
          
          // 2. REAL DATE MATCHING
          const isCurrentMonth = blockDate.getMonth() === month;
          const isToday = blockDate.toDateString() === new Date().toDateString();
          const dayNumber = blockDate.getDate();

          const eventsForThisDay = googleEvents?.filter(event => {
            if (!event.start) return false;
            return new Date(event.start).toDateString() === blockDate.toDateString();
          }) || [];

          return (
            <div 
              key={index} 
              // --- THE MAGIC CLICK HANDLER ---
              onClick={() => {
                setCurrentDate(blockDate); // Sets the master clock to the day you clicked!
                setCurrentView('Day');     // Swaps the view back to the Day Grid!
              }}
              className={`bg-white p-2 flex flex-col transition-colors hover:bg-slate-50 cursor-pointer overflow-hidden ${!isCurrentMonth ? 'opacity-40 bg-slate-50' : ''}`}
            >
              <div className="flex justify-end mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>
                  {dayNumber}
                </span>
              </div>

              <div className="flex flex-col gap-0.5 overflow-y-auto">
                {eventsForThisDay.map((event) => (
                  <div key={event.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded border mb-0.5 truncate bg-blue-50 border-blue-100 text-blue-700">
                    {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.title}
                  </div>
                ))}

                {isToday && scheduledTasks.map((task) => (
                  <div key={task.id} className="text-[9px] font-bold px-1.5 py-0.5 rounded border mb-0.5 truncate bg-indigo-50 border-indigo-100 text-indigo-700">
                    {task.scheduledStart} - {task.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}