"use client";

import { useState, useEffect } from 'react';
import { X, Lock, Sparkles, Zap } from 'lucide-react';
import { Task } from '../app/page';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void; 
  editingTask: Task | null;
}

export default function AddTaskModal({ isOpen, onClose, onSave, editingTask }: AddTaskModalProps) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState(''); // NEW STATE
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [flexibility, setFlexibility] = useState<'Rigid' | 'High Priority' | 'Flexible'>('Flexible');

  useEffect(() => {
    if (editingTask && isOpen) {
      setTaskName(editingTask.title);
      setDescription(editingTask.description || ''); // Pre-fill description
      setDays(Math.floor(editingTask.duration / (24 * 60)));
      setHours(Math.floor((editingTask.duration % (24 * 60)) / 60));
      setMinutes(editingTask.duration % 60);
      setDueDate(editingTask.dueDate || '');
      setDueTime(editingTask.dueTime || '');
      setFlexibility(editingTask.flexibility || 'Flexible');
    } else if (!isOpen) {
      setTaskName('');
      setDescription(''); // Clear description
      setDays(0); setHours(0); setMinutes(0);
      setDueDate('');
      setDueTime('');
      setFlexibility('Flexible');
    }
  }, [editingTask, isOpen]);

  const applyPreset = (d: number, h: number, m: number) => {
    setDays(d); setHours(h); setMinutes(m);
  };

  const handleSubmit = () => {
    if (!taskName.trim()) return;

    const totalMinutes = (days * 24 * 60) + (hours * 60) + minutes;

    const savedTask: Task = {
      id: editingTask ? editingTask.id : Math.random().toString(),
      title: taskName,
      description, // Save the description!
      source: editingTask ? editingTask.source : 'Manual',
      duration: totalMinutes || 30,
      dueDate,
      dueTime,
      flexibility, 
    };

    onSave(savedTask); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-white w-full max-w-lg rounded-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-900">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Task Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Task Name</label>
            <input 
              type="text" 
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="e.g. Read Bio Chapter 4" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* NEW: DESCRIPTION BOX */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description / Notes</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add links, Zoom URLs, or assignment notes here..." 
              rows={3}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none text-sm text-slate-700"
            />
          </div>

          {/* DURATION */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Duration</label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input type="number" min="0" value={days} onChange={(e) => setDays(Number(e.target.value) || 0)} className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-semibold text-slate-800 focus:outline-none focus:border-indigo-500" />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">d</span>
              </div>
              <div className="flex-1 relative">
                <input type="number" min="0" value={hours} onChange={(e) => setHours(Number(e.target.value) || 0)} className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-semibold text-slate-800 focus:outline-none focus:border-indigo-500" />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">h</span>
              </div>
              <div className="flex-1 relative">
                <input type="number" min="0" value={minutes} onChange={(e) => setMinutes(Number(e.target.value) || 0)} className="w-full pl-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-semibold text-slate-800 focus:outline-none focus:border-indigo-500" />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">m</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button onClick={() => applyPreset(0, 0, 30)} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-semibold rounded-lg">30 min</button>
              <button onClick={() => applyPreset(0, 0, 45)} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-semibold rounded-lg">45 min</button>
              <button onClick={() => applyPreset(0, 1, 0)} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-semibold rounded-lg">1 hr</button>
              <button onClick={() => applyPreset(1, 0, 0)} className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 text-xs font-semibold rounded-lg">1 day</button>
            </div>
          </div>

          {/* DUE DATE & TIME */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Time (Optional)</label>
              <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-700 font-medium" />
            </div>
          </div>

          {/* 3-TIER FLEXIBILITY */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Flexibility</label>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => setFlexibility('Rigid')} className={`flex flex-col items-center p-3 border-2 rounded-xl transition-all ${flexibility === 'Rigid' ? 'border-slate-800 bg-slate-800 text-white shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <Lock className={`w-5 h-5 mb-1 ${flexibility === 'Rigid' ? 'text-white' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs">Rigid</span>
              </button>
              <button onClick={() => setFlexibility('High Priority')} className={`flex flex-col items-center p-3 border-2 rounded-xl transition-all ${flexibility === 'High Priority' ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <Zap className={`w-5 h-5 mb-1 ${flexibility === 'High Priority' ? 'text-orange-500' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs">Priority</span>
              </button>
              <button onClick={() => setFlexibility('Flexible')} className={`flex flex-col items-center p-3 border-2 rounded-xl transition-all ${flexibility === 'Flexible' ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
                <Sparkles className={`w-5 h-5 mb-1 ${flexibility === 'Flexible' ? 'text-indigo-500' : 'text-slate-400'}`} />
                <span className="font-semibold text-xs">Flexible</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-colors">
            {editingTask ? 'Save Changes' : 'Add Task'}
          </button>
        </div>

      </div>
    </div>
  );
}