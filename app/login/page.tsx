"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Loader2, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  
  // Toggle between "login" and "signup" modes
  const [isLogin, setIsLogin] = useState(true); 
  
  // Loading states
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Handle the Google OAuth Shortcut
  const handleGoogleAuth = async () => {
    setIsGoogleLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/auth/url?type=primary');
      const data = await response.json();
      if (data.url) window.location.href = data.url; 
    } catch (error) {
      console.error("Failed to reach backend:", error);
      alert("Make sure your backend server is running on port 8080!");
      setIsGoogleLoading(false);
    }
  };

  // Handle traditional Email/Password Auth
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    setIsEmailLoading(true);

    // FAKE BACKEND DELAY FOR PROTOTYPE
    setTimeout(() => {
      setIsEmailLoading(false);
      
      // In the future, this is where we send the email/password/name to your Node.js database!
      console.log(isLogin ? "Logging in..." : "Creating account...", { name, email, password });
      
      alert(isLogin ? "Welcome back!" : "Account created! Now let's connect your calendar.");
      
      // We still need Google Calendar tokens for the dashboard to work, 
      // but later we will route them to an onboarding flow here!
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="bg-white w-full max-w-md rounded-[32px] p-8 sm:p-10 shadow-2xl border border-slate-100 relative z-10 flex flex-col items-center">
        
        {/* Logo */}
        <div className="bg-indigo-600 p-3.5 rounded-2xl shadow-lg shadow-indigo-200 mb-6">
          <Sparkles className="text-white w-7 h-7" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2 text-center">
          {isLogin ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-slate-500 font-medium mb-8 text-center text-sm">
          {isLogin ? 'Enter your details to access your workspace.' : 'Start crafting your perfect schedule with AI.'}
        </p>

        {/* The Form */}
        <form onSubmit={handleEmailAuth} className="w-full space-y-4 mb-6">
          
          {/* Only show the Name field if they are signing up */}
          {!isLogin && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="text" 
                placeholder="Full Name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          {/* Email Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="email" 
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={isEmailLoading || isGoogleLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 mt-2"
          >
            {isEmailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 mb-6">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">OR</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Google Shortcut */}
        <button 
          onClick={handleGoogleAuth}
          disabled={isGoogleLoading || isEmailLoading}
          type="button"
          className="w-full bg-white border-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {/* Toggle Button */}
        <p className="text-sm font-medium text-slate-500 mt-8">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 font-bold hover:underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>

      </div>
    </div>
  );
}