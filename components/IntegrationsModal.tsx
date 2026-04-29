"use client";

import { useState, useEffect } from 'react';
import { X, Calendar, GraduationCap, Plus, BookOpen, CheckCircle2, RefreshCw } from 'lucide-react';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  provider: 'gcal' | 'canvas' | 'classroom';
  name: string;
  isActive: boolean;
  status: string;
  lastSynced: string | null;
  isSyncing: boolean;
}

export default function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  
  // States for the "Add New Integration" form
  const [isAdding, setIsAdding] = useState(false);
  const [newProvider, setNewProvider] = useState<'gcal' | 'canvas' | 'classroom'>('gcal');
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Pull their custom list of apps from memory (or load defaults if new user)
      const savedListStr = localStorage.getItem('daycraft_integrations_list');
      
      let baseList: Integration[] = savedListStr ? JSON.parse(savedListStr) : [
        { id: 'primary', provider: 'gcal', name: 'Personal Google Calendar', isActive: false, status: 'Disconnected', lastSynced: null, isSyncing: false },
        { id: 'canvas_main', provider: 'canvas', name: 'University Canvas', isActive: false, status: 'Disconnected', lastSynced: null, isSyncing: false }
      ];

      // Check LocalStorage to see which ones actually have VIP Tokens saved
      const updatedList = baseList.map(app => {
        const hasToken = localStorage.getItem(`gcal_${app.id}_tokens`);
        // We'll fake Canvas and Classroom connection states for now
        const hasFakeToken = localStorage.getItem(`${app.provider}_${app.id}_connected`);

        if (hasToken || hasFakeToken) {
          return { ...app, isActive: true, status: 'Connected', lastSynced: 'Just now' };
        }
        return { ...app, isActive: false, status: 'Disconnected' };
      });

      setIntegrations(updatedList);
    }
  }, [isOpen]);

  const handleAddNew = () => {
    if (!newName.trim()) return;

    const uniqueId = `custom_${Date.now()}`;
    
    const newIntegration: Integration = {
      id: uniqueId,
      provider: newProvider,
      name: newName,
      isActive: false,
      status: 'Disconnected',
      lastSynced: null,
      isSyncing: false,
    };

    const updatedList = [...integrations, newIntegration];
    setIntegrations(updatedList);
    
    // Save this new layout to local storage so it remembers
    localStorage.setItem('daycraft_integrations_list', JSON.stringify(
      updatedList.map(i => ({ id: i.id, provider: i.provider, name: i.name }))
    ));

    // Reset the form
    setIsAdding(false);
    setNewName('');
  };

  // Handle flipping the toggle switch
  const toggleIntegration = async (app: Integration) => {
    const turningOn = !app.isActive;

  // FAKE BEHAVIOR FOR CANVAS/CLASSROOM!! REMOVE LATER WITH BACKEND IMPLEMENTATION!!
    if (app.provider !== 'gcal') {
      setIntegrations(current => current.map(int => int.id === app.id ? { ...int, isSyncing: true, status: 'Syncing...' } : int));
      setTimeout(() => {
        if (turningOn) {
          localStorage.setItem(`${app.provider}_${app.id}_connected`, 'true');
          setIntegrations(current => current.map(int => int.id === app.id ? { ...int, isActive: true, isSyncing: false, status: 'Connected', lastSynced: 'Just now' } : int));
        } else {
          localStorage.removeItem(`${app.provider}_${app.id}_connected`);
          setIntegrations(current => current.map(int => int.id === app.id ? { ...int, isActive: false, isSyncing: false, status: 'Disconnected', lastSynced: null } : int));
        }
      }, 1500);
      return;
    }

    // REAL BACKEND CALL FOR GOOGLE CALENDAR --> need to actually work on pulling in info from calendar, just giving access
    // look into multiple emails and accounts with credentials + legality
    setIntegrations(current => current.map(int => {
      if (int.id === app.id) {
        if (!turningOn) {
          localStorage.removeItem(`gcal_${app.id}_tokens`);
          return { ...int, isActive: false, status: 'Disconnected', lastSynced: null };
        }
        return { ...int, isSyncing: true, status: 'Contacting Google...' };
      }
      return int;
    }));

    if (turningOn) {
      try {
        // We pass the unique ID to the backend
        const response = await fetch(`http://localhost:8080/api/auth/url?type=${app.id}`);
        const data = await response.json();
        if (data.url) window.location.href = data.url; 
      } catch (error) {
        console.error("Failed to reach backend:", error);
        setIntegrations(current => current.map(int => int.id === app.id ? { ...int, isSyncing: false, status: 'Disconnected' } : int));
      }
    }
  };

  // UI Helpers
  const getProviderIcon = (provider: string) => {
    if (provider === 'gcal') return <Calendar className="w-6 h-6 text-blue-600" />;
    if (provider === 'canvas') return <GraduationCap className="w-6 h-6 text-red-600" />;
    return <BookOpen className="w-6 h-6 text-emerald-600" />;
  };

  const getProviderBg = (provider: string) => {
    if (provider === 'gcal') return 'bg-blue-50';
    if (provider === 'canvas') return 'bg-red-50';
    return 'bg-emerald-50';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 shadow-2xl max-h-[90vh] flex flex-col">
        
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Integrations</h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">Connect your apps to feed the DayCraft AI.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable list of apps */}
        <div className="space-y-4 overflow-y-auto pr-2 pb-4 flex-1 custom-scrollbar">
          {integrations.map((app) => (
            <div key={app.id} className={`flex items-center justify-between p-4 sm:p-5 border-2 rounded-2xl transition-all ${app.isActive ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${getProviderBg(app.provider)}`}>
                  {getProviderIcon(app.provider)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{app.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {app.isSyncing ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                        <RefreshCw className="w-3 h-3 animate-spin" /> {app.status}
                      </div>
                    ) : app.isActive ? (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {app.status}
                        </div>
                        {app.lastSynced && <span className="text-[11px] font-medium text-slate-400">Synced: {app.lastSynced}</span>}
                      </div>
                    ) : (
                      <div className="text-xs font-semibold text-slate-400 px-1">{app.status}</div>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={() => toggleIntegration(app)} disabled={app.isSyncing} className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${app.isActive || app.isSyncing ? 'bg-indigo-600' : 'bg-slate-200'} ${app.isSyncing ? 'opacity-75 cursor-wait' : 'cursor-pointer'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${app.isActive || app.isSyncing ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}

          {/* ADD NEW INTEGRATION UI */}
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-500 hover:text-indigo-600 font-bold rounded-2xl transition-all"
            >
              <Plus className="w-5 h-5" /> Add New Integration
            </button>
          ) : (
            <div className="p-5 border-2 border-indigo-100 bg-indigo-50/30 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="font-bold text-slate-800 text-sm">Add New Integration</h3>
              
              <div className="flex gap-3">
                <select 
                  value={newProvider} 
                  onChange={(e) => setNewProvider(e.target.value as 'gcal' | 'canvas' | 'classroom')}
                  className="bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shrink-0"
                >
                  <option value="gcal">Google Calendar</option>
                  <option value="canvas">Canvas LMS</option>
                  <option value="classroom">Google Classroom</option>
                </select>
                
                <input 
                  type="text" 
                  placeholder="e.g., West Valley Canvas" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancel
                </button>
                <button onClick={handleAddNew} disabled={!newName.trim()} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Add Account
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end shrink-0">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}