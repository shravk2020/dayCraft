"use client";

import { useState } from 'react';
import { Task } from '../app/page';
import { Clock, CalendarDays, AlignLeft, X } from 'lucide-react';

interface CalendarGridProps {
  tasks: Task[];
  currentDate: Date;
  googleEvents?: any[];
}

export default function CalendarGrid({tasks, currentDate, googleEvents = []}: CalendarGridProps) { 
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scheduledTasks = tasks.filter(task => !task.completedAt && task.scheduledStart);

  // 1. PERFECT ALIGNMENT MATH: Uses your exact 80px per hour scale!
  const getEventStyles = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    const pixelsPerMinute = 80 / 60;
    const topOffset = (startHour * 80) + (startMinute * pixelsPerMinute);
    const height = durationMinutes * pixelsPerMinute;

    return {
      top: `${topOffset}px`, 
      height: `${height}px`, 
    };
  };

  // 2. FILTER FOR TODAY: Only show events for the currently selected day
  const todaysGoogleEvents = googleEvents?.filter(event => {
    if (!event.start) return false;
    const eventDate = new Date(event.start);
    return eventDate.toDateString() === currentDate.toDateString();
  }) || [];

  const getTaskStyle = (startTime: string, duration: number) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const pixelsPerMinute = 80 / 60;
    const topOffset = (startHour * 80) + (startMinute * pixelsPerMinute);
    const height = duration * pixelsPerMinute;

    return {
      top: `${topOffset}px`,
      height: `${height}px`, 
    };
  };

  return (
    <div 
      className="bg-white rounded-[32px] border border-slate-200 h-full shadow-sm overflow-y-auto relative scroll-smooth"
      onClick={() => setExpandedTaskId(null)}
    >
      <div className="relative min-w-[600px] h-[1920px]">
        
        {/* THE BACKGROUND GRID */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {hours.map((hour) => {
            const isPM = hour >= 12;
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const ampm = isPM ? 'PM' : 'AM';

            return (
              <div key={hour} className="flex border-b border-slate-100 h-[80px] w-full">
                <div className="w-20 shrink-0 text-right pr-4 pt-2 text-[10px] font-bold text-slate-400">
                  {displayHour}:00 {ampm}
                </div>
                <div className="flex-1 border-l border-slate-100 relative"></div>
              </div>
            );
          })}
        </div>

        {/* THE BLOCKS CONTAINER */}
        <div className="absolute top-0 left-20 right-4 bottom-0">
          
          {/* --- GOOGLE CALENDAR EVENTS (Rendered First so they sit behind active tasks) --- */}
          {todaysGoogleEvents.map((event) => (
            <div 
              key={event.id}
              className="absolute left-2 right-2 ml-4 mr-4 bg-blue-50/80 border-l-4 border-blue-500 rounded-lg p-2 shadow-sm overflow-hidden z-0"
              style={getEventStyles(event.start, event.end)}
            >
              <p className="text-xs font-bold text-blue-900 truncate">{event.title}</p>
              <p className="text-[10px] text-blue-700 font-medium truncate mt-0.5">
                {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {event.location && ` • ${event.location}`}
              </p>
            </div>
          ))}

          {/* --- DAYCRAFT SCHEDULED TASKS --- */}
          {scheduledTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            
            let bgColors = "bg-indigo-50 border-indigo-200 text-indigo-900";
            let tagColor = "text-indigo-600 border-indigo-200";
            
            if (task.flexibility === 'Rigid') {
              bgColors = "bg-slate-800 border-slate-900 text-white";
              tagColor = "text-slate-200 border-slate-600";
            } else if (task.flexibility === 'High Priority') {
              bgColors = "bg-orange-50 border-orange-200 text-orange-900";
              tagColor = "text-orange-600 border-orange-200";
            }

            const baseStyle = getTaskStyle(task.scheduledStart!, task.duration);
            const expandedStyle = isExpanded 
              ? { ...baseStyle, height: 'auto', minHeight: baseStyle.height, zIndex: 50 } 
              : { ...baseStyle, zIndex: 10 };

            return (
              <div 
                key={task.id}
                style={expandedStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedTaskId(isExpanded ? null : task.id);
                }}
                className={`absolute left-2 right-2 rounded-xl p-3 shadow-sm border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col ${bgColors} ${isExpanded ? 'shadow-2xl ring-4 ring-indigo-500/20' : 'hover:shadow-md hover:scale-[1.01]'}`}
              >
                
                <div className="flex justify-between items-start gap-2">
                  <h4 className={`font-bold leading-tight ${isExpanded ? 'text-base mb-3' : 'text-sm truncate'}`}>
                    {task.title}
                  </h4>
                  
                  {isExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpandedTaskId(null); }}
                      className="p-1 rounded-full hover:bg-black/10 transition-colors shrink-0 -mt-1 -mr-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {!isExpanded && (
                  <div className="text-[10px] font-medium opacity-70 mt-auto truncate">
                    {task.scheduledStart} • {task.duration}m
                  </div>
                )}

                {isExpanded && (
                  <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/50 border ${tagColor}`}>
                        {task.source}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/50 border ${tagColor}`}>
                        {task.flexibility}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-medium opacity-90 mt-1">
                      <Clock className="w-4 h-4" />
                      {task.scheduledStart} — {task.duration} mins
                    </div>

                    {(task.dueDate || task.dueTime) && (
                      <div className="flex items-center gap-2 text-sm font-medium bg-white/40 p-2 rounded-lg w-fit">
                        <CalendarDays className="w-4 h-4" />
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'}) : ''} {task.dueTime ? ` @ ${task.dueTime}` : ''}
                      </div>
                    )}

                    {task.description && (
                      <div className="flex items-start gap-2 bg-black/5 p-3 rounded-lg mt-1">
                        <AlignLeft className="w-4 h-4 shrink-0 mt-0.5 opacity-70" />
                        <p className="text-xs font-medium leading-relaxed opacity-90 whitespace-pre-wrap">
                          {task.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}