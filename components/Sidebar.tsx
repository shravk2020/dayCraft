"use client";

import { useState, useEffect } from 'react';
import { Sparkles, LayoutList, CheckSquare } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Task } from '../app/page';

interface SidebarProps {
  tasks: Task[];
  onOpenAddTask: () => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onToggleComplete: (id: string) => void;
  isCrafting: boolean;      // To know if the AI is currently thinking
  onCraft: () => void;      // To trigger the loading screen
}

export default function Sidebar({ 
  tasks, 
  onOpenAddTask, 
  onDeleteTask, 
  onEditTask, 
  onReorderTasks, 
  onToggleComplete, 
  isCrafting, 
  onCraft 
}: SidebarProps) {
  
  const [isMounted, setIsMounted] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Split the tasks into active and completed
  const activeTasks = tasks.filter(task => !task.completedAt);
  const completedTasks = tasks.filter(task => task.completedAt);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return; 

    const activeItems = Array.from(activeTasks);
    const [reorderedItem] = activeItems.splice(result.source.index, 1);
    activeItems.splice(result.destination.index, 0, reorderedItem);

    // Merge the sorted active tasks with the completed tasks
    onReorderTasks([...activeItems, ...completedTasks]);
  };

  return (
    <div className="w-72 h-screen bg-white border-r border-slate-200 p-6 flex flex-col z-10 relative">
      {/* Header Logo */}
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
          <Sparkles className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">DayCraft</span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-6">
        
        {/* 1. ACTIVE TASKS SECTION */}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold">
              <LayoutList className="w-5 h-5 text-indigo-600" />
              <h2>Task Queue</h2>
            </div>
            <button onClick={onOpenAddTask} className="p-1.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 min-h-[100px]">
            {isMounted && (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="task-list">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 pb-4">
                      {activeTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform,
                              }}
                            >
                              <TaskCard 
                                title={task.title} 
                                source={task.source} 
                                duration={task.duration}
                                dueDate={task.dueDate}
                                dueTime={task.dueTime}
                                flexibility={task.flexibility}
                                description={task.description}
                                completedAt={task.completedAt}
                                onDelete={() => onDeleteTask(task.id)}
                                onEdit={() => onEditTask(task)} 
                                onToggleComplete={() => onToggleComplete(task.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            
            {activeTasks.length === 0 && (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-sm font-medium mt-4">
                No tasks in queue. Add one to get started!
              </div>
            )}
          </div>
        </div>

        {/* 2. COMPLETED TASKS SECTION */}
        {completedTasks.length > 0 && (
          <div className="border-t border-slate-100 pt-6">
            <button 
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center justify-between w-full text-slate-500 hover:text-slate-800 transition-colors mb-4 group"
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckSquare className="w-4 h-4 text-emerald-500" />
                Completed ({completedTasks.length})
              </div>
              <svg className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCompleted && (
              <div className="space-y-3 pb-4">
                {completedTasks.map((task) => (
                  <TaskCard 
                    key={task.id} 
                    title={task.title} 
                    source={task.source} 
                    duration={task.duration}
                    dueDate={task.dueDate}
                    dueTime={task.dueTime}
                    flexibility={task.flexibility}
                    description={task.description}
                    completedAt={task.completedAt}
                    onDelete={() => onDeleteTask(task.id)}
                    onEdit={() => onEditTask(task)} 
                    onToggleComplete={() => onToggleComplete(task.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. THE CRAFT BUTTON */}
      <div className="pt-4 mt-auto shrink-0 bg-white border-t border-slate-100">
        <button 
          onClick={onCraft}
          disabled={isCrafting} 
          className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95 ${
            isCrafting 
              ? 'bg-indigo-400 cursor-wait shadow-indigo-100 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
          }`}
        >
          {isCrafting ? 'Crafting...' : 'Craft My Day ✨'}
        </button>
      </div>
    </div>
  );
}