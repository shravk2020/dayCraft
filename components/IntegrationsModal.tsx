"use client";

import { useState, useEffect, JSX } from 'react';
import { X, Calendar, GraduationCap, Briefcase, RefreshCw, CheckCircle2 } from 'lucide-react';

interface IntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  bg: string;
  isActive: boolean;
  status: string;
  lastSynced: string | null;
  isSyncing: boolean;
}

export default function IntegrationsModal({ isOpen, onClose }: IntegrationsModalProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'gcal_primary', // Primary Account
      name: 'Google Calendar (Personal)',
      description: 'Your primary connected Google Account.',
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50',
      isActive: false,
      status: 'Disconnected',
      lastSynced: null,
      isSyncing: false,
    },
    {
      id: 'gcal_school', // School Account
      name: 'Google Calendar (School)',
      description: 'Connect a separate Google Workspace or Canvas email.',
      icon: <Calendar className="w-6 h-6 text-indigo-600" />,
      bg: 'bg-indigo-50',
      isActive: false,
      status: 'Disconnected',
      lastSynced: null,
      isSyncing: false,
    },
    {
      id: 'canvas',
      name: 'Canvas LMS',
      description: 'Automatically import homework and project deadlines.',
      icon: <GraduationCap className="w-6 h-6 text-red-600" />,
      bg: 'bg-red-50',
      isActive: false,
      status: 'Disconnected',
      lastSynced: null,
      isSyncing: false,
    }
  ]);

  // Check local storage for BOTH accounts when the modal opens
  useEffect(() => {
    if (isOpen) {
      const primaryTokens = localStorage.getItem('gcal_primary_tokens');
      const schoolTokens = localStorage.getItem('gcal_school_tokens');
      
      setIntegrations(current => current.map(integration => {
        if (integration.id === 'gcal_primary' && primaryTokens) {
          return { ...integration, isActive: true, status: 'Connected', lastSynced: 'Just now' };
        }
        if (integration.id === 'gcal_school' && schoolTokens) {
          return { ...integration, isActive: true, status: 'Connected', lastSynced: 'Just now' };
        }
        return integration;
      }));
    }
  }, [isOpen]);

  const toggleIntegration = async (id: string) => {
    // FAKE BEHAVIOR FOR CANVAS
    if (id === 'canvas') {
      setIntegrations(current => current.map(int => int.id === id ? { ...int, isSyncing: true, status: 'Syncing...' } : int));
      setTimeout(() => {
        setIntegrations(current => current.map(int => int.id === id ? { ...int, isActive: true, isSyncing: false, status: 'Connected', lastSynced: 'Just now' } : int));
      }, 2000);
      return;
    }

    // REAL BACKEND CALL FOR GCAL (Primary or School)
    const isConnecting = !integrations.find(i => i.id === id)?.isActive;
    const accountType = id === 'gcal_school' ? 'school' : 'primary';

    setIntegrations(current => current.map(int => {
      if (int.id === id) {
        if (!isConnecting) {
          localStorage.removeItem(`gcal_${accountType}_tokens`);
          return { ...int, isActive: false, status: 'Disconnected', lastSynced: null };
        }
        return { ...int, isSyncing: true, status: 'Contacting Google...' };
      }
      return int;
    }));

    if (isConnecting) {
      try {
        const response = await fetch(`http://localhost:8080/api/auth/url?type=${accountType}`);
        const data = await response.json();
        if (data.url) window.location.href = data.url; 
      } catch (error) {
        console.error("Failed to reach backend:", error);
        setIntegrations(current => current.map(int => int.id === id ? { ...int, isSyncing: false, status: 'Disconnected' } : int));
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-center items-center">
      <div className="bg-white w-full max-w-2xl rounded-[32px] p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Integrations</h2>
            <p className="text-slate-500 font-medium mt-1 text-sm">Connect your apps to feed the DayCraft AI.</p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {integrations.map((app) => (
            <div key={app.id} className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all ${app.isActive ? 'border-indigo-100 bg-indigo-50/30' : 'border-slate-100 bg-white'}`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${app.bg}`}>{app.icon}</div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{app.name}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{app.description}</p>
                  <div className="flex items-center gap-2 mt-2">
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
              <button onClick={() => toggleIntegration(app.id)} disabled={app.isSyncing} className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 shrink-0 ${app.isActive || app.isSyncing ? 'bg-indigo-600' : 'bg-slate-200'} ${app.isSyncing ? 'opacity-75 cursor-wait' : 'cursor-pointer'}`}>
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${app.isActive || app.isSyncing ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}