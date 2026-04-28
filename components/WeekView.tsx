"use client";

import { useState } from 'react';
import { Task } from '../app/page';

interface WeekViewProps {
  tasks: Task[];
  currentDate: Date;
}

export default function WeekView({ tasks, currentDate }: WeekViewProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Right now, our fake AI schedules everything on "Today" (Monday)
  const scheduledTasks = tasks.filter(task => !task.completedAt && task.scheduledStart);

  // The CSS Math to place tasks vertically
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
      className="bg-white rounded-[32px] border border-slate-200 h-full shadow-sm flex flex-col overflow-hidden"
      onClick={() => setExpandedTaskId(null)}
    >
      {/* 1. STICKY HEADER (Days of the week) */}
      <div className="flex border-b border-slate-100 shrink-0 bg-white z-20">
        {/* Top-left empty corner above the timestamps */}
        <div className="w-16 shrink-0 border-r border-slate-100 bg-slate-50/30"></div>
        
        {/* The 7 Day Columns */}
        {daysOfWeek.map((day, index) => (
          <div key={day} className="flex-1 py-3 flex flex-col items-center justify-center gap-1 border-r border-slate-100 last:border-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</span>
            <span className={`text-lg font-black ${index === 0 ? 'text-indigo-600 bg-indigo-50 w-7 h-7 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>
              {27 + index > 30 ? (27 + index) - 30 : 27 + index}
            </span>
          </div>
        ))}
      </div>

      {/* 2. SCROLLABLE CALENDAR BODY */}
      <div className="flex-1 overflow-y-auto relative scroll-smooth bg-slate-50/20">
        <div className="relative min-w-[800px] h-[1920px] flex">
          
          {/* Left Column: 24-Hour Timestamps */}
          <div className="w-16 shrink-0 border-r border-slate-100 flex flex-col bg-white">
            {hours.map((hour) => {
              const isPM = hour >= 12;
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
              const ampm = isPM ? 'PM' : 'AM';
              return (
                <div key={hour} className="h-20 text-right pr-2 pt-2 text-[9px] font-bold text-slate-400">
                  {displayHour} {ampm}
                </div>
              );
            })}
          </div>

          {/* Right Area: The 7 Day Columns & Background Grid */}
          <div className="flex-1 flex relative">
            
            {/* Horizontal Grid Lines (Behind the tasks) */}
            <div className="absolute inset-0 flex flex-col pointer-events-none">
              {hours.map((hour) => (
                <div key={hour} className="h-20 border-b border-slate-100 w-full"></div>
              ))}
            </div>

            {/* The 7 Vertical Day Columns */}
            {daysOfWeek.map((day, index) => (
              <div key={day} className="flex-1 border-r border-slate-100 last:border-0 relative">
                
                {/* For our prototype, we drop the AI scheduled tasks into the first column (Monday) */}
                {index === 0 && scheduledTasks.map((task) => {
                  const isExpanded = expandedTaskId === task.id;
                  
                  let bgColors = "bg-indigo-50 border-indigo-200 text-indigo-900";
                  if (task.flexibility === 'Rigid') bgColors = "bg-slate-800 border-slate-900 text-white";
                  else if (task.flexibility === 'High Priority') bgColors = "bg-orange-50 border-orange-200 text-orange-900";

                  const baseStyle = getTaskStyle(task.scheduledStart!, task.duration);
                  const expandedStyle = isExpanded 
                    ? { ...baseStyle, height: 'auto', minHeight: baseStyle.height, zIndex: 50, width: '200%' } // Makes it wider when clicked!
                    : { ...baseStyle, zIndex: 10 };

                  return (
                    <div 
                      key={task.id}
                      style={expandedStyle}
                      onClick={(e) => { e.stopPropagation(); setExpandedTaskId(isExpanded ? null : task.id); }}
                      className={`absolute left-1 right-1 rounded-lg p-2 shadow-sm border overflow-hidden transition-all duration-200 cursor-pointer flex flex-col ${bgColors} ${isExpanded ? 'shadow-xl ring-4 ring-indigo-500/20' : 'hover:shadow-md hover:scale-[1.02]'}`}
                    >
                      <h4 className={`font-bold leading-tight ${isExpanded ? 'text-sm mb-1' : 'text-xs truncate'}`}>
                        {task.title}
                      </h4>
                      <div className="text-[9px] font-medium opacity-70 mt-auto truncate">
                        {task.scheduledStart} • {task.duration}m
                      </div>
                      
                      {/* Show extra details if expanded */}
                      {isExpanded && task.description && (
                        <div className="mt-2 text-[10px] font-medium opacity-90 whitespace-pre-wrap leading-relaxed border-t border-black/10 pt-2">
                          {task.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}