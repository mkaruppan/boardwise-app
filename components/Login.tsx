import React, { useState } from 'react';
import { User } from '../types.ts';
import { Lock, Loader2, UserPlus, Mail, Key, Eye, EyeOff, AlertCircle, Info, Shield, CheckCircle } from 'lucide-react';
import Logo from './Logo.tsx';

interface LoginProps {
  onLogin: (user: User) => void;
  users: User[]; 
  onRegister: () => void;
  onForgotPassword: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, users, onRegister, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (user && password) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Please check your email and password.');
        setIsLoading(false);
      }
    }, 1500);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onForgotPassword(forgotEmail);
    setResetSent(true);
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo_password_123');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 relative">
        <div className="bg-brand-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-10">
              <Logo className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="mb-4 shadow-lg rounded-full bg-brand-800/50 p-2 border border-brand-700">
                <Logo className="w-16 h-16" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Boardwise SA</h1>
            <p className="text-brand-accent font-medium mt-1 text-xs tracking-[0.2em] uppercase">Digital Governance Portal</p>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800">Sign In</h2>
            <div className="flex items-center text-xs text-brand-accent bg-brand-900/5 px-3 py-1 rounded-full border border-brand-accent/20 font-medium">
              <Lock className="w-3 h-3 mr-1" />
              Secure AES-256
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-2 text-red-700 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                  placeholder="name@boardwise.co.za"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs text-brand-900 hover:text-brand-accent hover:underline font-medium">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="w-full flex items-center justify-center py-3 px-4 bg-brand-900 hover:bg-brand-800 text-white rounded-lg font-bold shadow-md transition-all hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4 border border-brand-700">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Access Portal'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 mb-4 border border-slate-100">
                <div className="flex items-center space-x-2 font-bold text-slate-600 mb-2">
                   <Info className="w-3 h-3" />
                   <span>Demo Credentials</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   {users.filter(u => u.status === 'ACTIVE').slice(0, 4).map(u => (
                      <button key={u.id} onClick={() => fillDemo(u.email || '')} className="text-left px-2 py-1.5 hover:bg-slate-200 rounded truncate transition-colors border border-slate-200 bg-white">
                         <span className="font-semibold text-slate-700">{u.name.split(' ')[0]}</span>
                      </button>
                   ))}
                </div>
             </div>

            <button onClick={onRegister} className="w-full flex items-center justify-center space-x-2 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg transition-colors font-medium text-sm">
                <UserPlus className="w-4 h-4" />
                <span>New Director Registration</span>
            </button>
          </div>
        </div>

        {showForgotModal && (
          <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm p-8 flex flex-col justify-center animate-in fade-in zoom-in">
             {!resetSent ? (
               <>
                 <h3 className="text-xl font-bold text-brand-900 mb-2">Reset Password</h3>
                 <p className="text-sm text-slate-500 mb-6">Enter your email address. We'll send you a secure link to reset your credentials.</p>
                 <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email Address</label>
                      <input type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="block w-full px-3 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent" placeholder="name@boardwise.co.za" />
                    </div>
                    <div className="flex flex-col space-y-2">
                      <button type="submit" className="w-full bg-brand-900 text-white font-bold py-3 rounded-lg hover:bg-brand-800 transition-colors">Send Reset Link</button>
                      <button type="button" onClick={() => { setShowForgotModal(false); setForgotEmail(''); }} className="w-full bg-white text-slate-600 font-medium py-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                    </div>
                 </form>
               </>
             ) : (
               <div className="text-center">
                 <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                   <CheckCircle className="w-6 h-6 text-green-600" />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-2">Check your email</h3>
                 <p className="text-sm text-slate-600 mb-6">We've sent a password reset link to <span className="font-semibold text-slate-900">{forgotEmail}</span>.</p>
                 <button onClick={() => { setShowForgotModal(false); setResetSent(false); setForgotEmail(''); }} className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors">Return to Login</button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;