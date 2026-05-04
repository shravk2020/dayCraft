"use client";

import { useState } from 'react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/auth/url?type=primary');
      const data = await response.json();
      if (data.url) window.location.href = data.url; 
    } catch (error) {
      console.error("Failed to reach backend:", error);
      alert("Make sure your backend server is running on port 8080!");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 sm:p-12 shadow-2xl border border-slate-100 relative z-10 flex flex-col items-center text-center">
        
        <div className="bg-indigo-600 p-4 rounded-2xl shadow-lg shadow-indigo-200 mb-8 text-white font-bold text-3xl">
          ✨
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-3">
          DayCraft
        </h1>
        <p className="text-slate-500 font-medium mb-10 text-sm leading-relaxed px-4">
          Connect your calendar to start crafting your perfect schedule with AI.
        </p>

        <button 
          onClick={handleGoogleAuth}
          disabled={isLoading}
          type="button"
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 shadow-md"
        >
          {isLoading ? (
            <span className="animate-pulse">Connecting...</span>
          ) : (
            <>
              <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="text-xs text-slate-400 mt-8 font-medium">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>

      </div>
    </div>
  );
}