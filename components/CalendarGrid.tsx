"use client";

import { useState } from 'react';
import { Task } from '../app/page';
import { Clock, CalendarDays, AlignLeft, X, CheckSquare } from 'lucide-react';

interface CalendarGridProps {
  tasks: Task[];
}

export default function CalendarGrid({ tasks }: CalendarGridProps) {
  // NEW: State to track which task card is currently clicked open
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const scheduledTasks = tasks.filter(task => !task.completedAt && task.scheduledStart);

  const getTaskStyle = (startTime: string, duration: number) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const pixelsPerMinute = 80 / 60;
    const topOffset = (startHour * 80) + (startMinute * pixelsPerMinute);
    const height = duration * pixelsPerMinute;

    return {
      top: `${topOffset}px`,
      // We set this as a base height, but we'll override it to 'auto' when expanded!
      height: `${height}px`, 
    };
  };

  return (
    // We add an onClick to the background so clicking empty space closes the expanded card
    <div 
      className="bg-white rounded-[32px] border border-slate-200 h-full shadow-sm overflow-y-auto relative scroll-smooth"
      onClick={() => setExpandedTaskId(null)}
    >
      <div className="relative min-w-[600px] h-[1920px]">
        
        {/* 1. THE BACKGROUND GRID */}
        <div className="absolute inset-0 flex flex-col pointer-events-none">
          {hours.map((hour) => {
            const isPM = hour >= 12;
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const ampm = isPM ? 'PM' : 'AM';

            return (
              <div key={hour} className="flex border-b border-slate-100 h-20 w-full">
                <div className="w-20 shrink-0 text-right pr-4 pt-2 text-[10px] font-bold text-slate-400">
                  {displayHour}:00 {ampm}
                </div>
                <div className="flex-1 border-l border-slate-100 relative"></div>
              </div>
            );
          })}
        </div>

        {/* 2. THE SCHEDULED TASK BLOCKS */}
        <div className="absolute top-0 left-20 right-4 bottom-0">
          {scheduledTasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            
            // Determine colors based on flexibility
            let bgColors = "bg-indigo-50 border-indigo-200 text-indigo-900";
            let tagColor = "text-indigo-600 border-indigo-200";
            
            if (task.flexibility === 'Rigid') {
              bgColors = "bg-slate-800 border-slate-900 text-white";
              tagColor = "text-slate-200 border-slate-600";
            } else if (task.flexibility === 'High Priority') {
              bgColors = "bg-orange-50 border-orange-200 text-orange-900";
              tagColor = "text-orange-600 border-orange-200";
            }

            // Get the base positioning math
            const baseStyle = getTaskStyle(task.scheduledStart!, task.duration);
            
            // If expanded, let the height grow automatically to fit content and raise it above others!
            const expandedStyle = isExpanded 
              ? { ...baseStyle, height: 'auto', minHeight: baseStyle.height, zIndex: 50 } 
              : { ...baseStyle, zIndex: 10 };

            return (
              <div 
                key={task.id}
                style={expandedStyle}
                onClick={(e) => {
                  e.stopPropagation(); // Prevents the background click from immediately closing it
                  setExpandedTaskId(isExpanded ? null : task.id);
                }}
                className={`absolute left-2 right-2 rounded-xl p-3 shadow-sm border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col ${bgColors} ${isExpanded ? 'shadow-2xl ring-4 ring-indigo-500/20' : 'hover:shadow-md hover:scale-[1.01]'}`}
              >
                
                {/* ALWAYS VISIBLE: Header Row */}
                <div className="flex justify-between items-start gap-2">
                  <h4 className={`font-bold leading-tight ${isExpanded ? 'text-base mb-3' : 'text-sm truncate'}`}>
                    {task.title}
                  </h4>
                  
                  {/* Close button (only visible when expanded) */}
                  {isExpanded && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setExpandedTaskId(null); }}
                      className="p-1 rounded-full hover:bg-black/10 transition-colors shrink-0 -mt-1 -mr-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* UNEXPANDED VIEW: Just show a tiny time stamp */}
                {!isExpanded && (
                  <div className="text-[10px] font-medium opacity-70 mt-auto truncate">
                    {task.scheduledStart} • {task.duration}m
                  </div>
                )}

                {/* EXPANDED VIEW: All the rich details! */}
                {isExpanded && (
                  <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/50 border ${tagColor}`}>
                        {task.source}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/50 border ${tagColor}`}>
                        {task.flexibility}
                      </span>
                    </div>

                    {/* Time Info */}
                    <div className="flex items-center gap-2 text-sm font-medium opacity-90 mt-1">
                      <Clock className="w-4 h-4" />
                      {task.scheduledStart} — {task.duration} mins
                    </div>

                    {/* Due Date Info */}
                    {(task.dueDate || task.dueTime) && (
                      <div className="flex items-center gap-2 text-sm font-medium bg-white/40 p-2 rounded-lg w-fit">
                        <CalendarDays className="w-4 h-4" />
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'}) : ''} {task.dueTime ? ` @ ${task.dueTime}` : ''}
                      </div>
                    )}

                    {/* Description Block */}
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