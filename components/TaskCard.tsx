import { Clock, Trash2, Pencil, CalendarDays, Lock, Zap, Sparkles, AlignLeft, CheckCircle2, Undo2, Check } from 'lucide-react';

import { Task } from '../app/page';

interface TaskCardProps {
  title: string;
  source: string;
  duration: number;
  dueDate?: string;
  dueTime?: string;
  flexibility?: Task['flexibility'];
  description?: string;
  completedAt?: string; // <-- NEW
  onDelete: () => void;
  onEdit: () => void; 
  onToggleComplete: () => void; // <-- NEW
}

export default function TaskCard({ title, source, duration, dueDate, dueTime, flexibility, description, completedAt, onDelete, onEdit, onToggleComplete }: TaskCardProps) {
  
  const isCompleted = !!completedAt;

  const renderFlexibilityIcon = () => {
    if (flexibility === 'Rigid') return <Lock className="w-3 h-3 text-slate-600" />;
    if (flexibility === 'High Priority') return <Zap className="w-3 h-3 text-orange-500" />;
    return <Sparkles className="w-3 h-3 text-indigo-500" />;
  };

  return (
    // If completed, we make the background slightly gray and drop the opacity to 75%
    <div className={`group relative p-4 border rounded-xl transition-all cursor-pointer ${isCompleted ? 'bg-slate-50 border-slate-200 opacity-75' : 'bg-white border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md'}`}>
      
      <div className="flex justify-between items-start mb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${isCompleted ? 'bg-slate-200 text-slate-500' : 'text-indigo-600 bg-indigo-50'}`}>
          {source}
        </span>
        <div className={`p-1.5 rounded-lg border ${isCompleted ? 'bg-slate-100 border-slate-200' : 'bg-slate-50 border-slate-100'}`} title={`Flexibility: ${flexibility}`}>
          {renderFlexibilityIcon()}
        </div>
      </div>
      
      {/* If completed, we strike through the text! */}
      <h3 className={`font-semibold text-sm leading-tight pr-8 ${description ? 'mb-1' : 'mb-2'} ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
        {title}
      </h3>

      {!isCompleted && description && (
        <div className="flex items-start gap-1.5 mb-2 pr-6">
          <AlignLeft className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-1.5 mt-3">
        {!isCompleted && (
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {duration} mins
          </div>
        )}
        
        {/* If completed, show when it was done instead of the due date */}
        {isCompleted ? (
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md w-fit mt-1">
            <Check className="w-3.5 h-3.5" />
            Finished {new Date(completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        ) : (
          (dueDate || dueTime) && (
            <div className="flex items-center gap-1.5 text-rose-600 text-xs font-medium bg-rose-50 px-2 py-1 rounded-md w-fit">
              <CalendarDays className="w-3.5 h-3.5" />
              {dueDate ? new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric'}) : ''} 
              {dueTime ? ` @ ${dueTime}` : ''}
            </div>
          )
        )}
      </div>

      {/* HOVER BUTTONS */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white shadow-sm rounded-lg p-0.5 border border-slate-100">
        
        {/* If completed: Show "Restore". If active: Show "Complete" */}
        {isCompleted ? (
          <button onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all" title="Restore Task">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
        ) : (
          <>
            <button onClick={(e) => { e.stopPropagation(); onToggleComplete(); }} className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-all" title="Mark Complete">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-all">
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        {/* Trash is always available */}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

    </div>
  );
}