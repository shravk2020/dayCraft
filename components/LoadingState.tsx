"use client";

import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "Syncing with Google Calendar...",
    "Fetching Canvas assignments...",
    "Identifying rigid blocks...",
    "Playing Tetris with your schedule...",
    "Optimizing for maximum deep work...",
    "Finalizing your perfect day..."
  ];

  // Cycle through the messages every 1.8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => Math.min(prev + 1, messages.length - 1));
    }, 1800);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="bg-white rounded-[32px] border border-slate-200 h-full shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background glowing effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-400/20 rounded-full blur-3xl animate-pulse delay-700" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Glowing AI Core */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-50 rounded-full animate-pulse" />
          <div className="h-20 w-20 bg-white border border-indigo-100 shadow-2xl rounded-2xl flex items-center justify-center relative overflow-hidden">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <Sparkles className="w-4 h-4 text-fuchsia-500 absolute top-3 right-3 animate-pulse" />
          </div>
        </div>

        {/* Dynamic Text */}
        <h2 className="text-2xl font-black text-slate-900 mb-3">Crafting your day</h2>
        
        {/* We use a fixed height container so the text doesn't make the layout jump around when it changes */}
        <div className="h-6 flex items-center justify-center transition-all duration-300">
          <p className="text-slate-500 font-medium animate-pulse text-center">
            {messages[messageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}