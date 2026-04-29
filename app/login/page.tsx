"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true); 
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('gcal_primary_tokens', 'dummy_email_user_token');
      // Hard redirect to the dashboard
      window.location.href = '/';
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 sm:p-10 shadow-2xl border border-slate-100 relative z-10 flex flex-col items-center">
        
        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200 mb-6 text-white font-bold text-xl px-4">
          ✨
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2 text-center">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-slate-500 font-medium mb-8 text-center text-sm">
          {isLogin ? 'Enter your details to access your workspace.' : 'Start crafting your perfect schedule with AI.'}
        </p>

        <form onSubmit={handleEmailAuth} className="w-full space-y-4 mb-6">
          {!isLogin && (
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required={!isLogin}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          )}

          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />

          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-2"
          >
            {isLoading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="w-full flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OR</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        <button 
          onClick={handleGoogleAuth}
          disabled={isLoading}
          type="button"
          className="w-full bg-white border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
        >
          {isLoading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <p className="text-sm font-medium text-slate-500 mt-8">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            type="button"
            className="text-indigo-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  );
}