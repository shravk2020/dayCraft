"use client";

import { Task } from '../app/page';

interface MonthViewProps {
  tasks: Task[];
  currentDate: Date;
}

export default function MonthView({ tasks, currentDate }: MonthViewProps) {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Create an array of 35 blocks to simulate a month grid
  const calendarBlocks = Array.from({ length: 35 }, (_, i) => i + 1);
  
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
        {calendarBlocks.map((block) => {
          // Math to fake the calendar days
          const dayNumber = block - 2; 
          const isCurrentMonth = dayNumber > 0 && dayNumber <= 30;
          const isToday = dayNumber === 27;

          return (
            <div key={block} className={`bg-white p-2 flex flex-col transition-colors hover:bg-slate-50 cursor-pointer ${!isCurrentMonth ? 'opacity-40 bg-slate-50' : ''}`}>
              <div className="flex justify-end mb-1">
                <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>
                  {isCurrentMonth ? dayNumber : (dayNumber <= 0 ? 31 + dayNumber : dayNumber - 30)}
                </span>
              </div>

              {/* Show tiny badges for tasks on "Today" */}
              {isToday && scheduledTasks.map((task, i) => (
                <div key={task.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border mb-1 truncate ${i > 2 ? 'hidden' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
                  {task.scheduledStart} - {task.title}
                </div>
              ))}
              {isToday && scheduledTasks.length > 3 && (
                <div className="text-[9px] font-bold text-slate-400 pl-1">+{scheduledTasks.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}