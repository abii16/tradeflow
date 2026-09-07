import React, { useState } from 'react';
import { X, Loader2, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#141414]/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1C1C1C] rounded-2xl w-full max-w-sm shadow-2xl border border-[#2E2E2E] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 flex justify-between items-center border-b border-[#2E2E2E]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#3ECF8E]/10 border border-[#3ECF8E]/20 flex items-center justify-center">
              <LogIn size={16} className="text-[#3ECF8E]" />
            </div>
            <span className="font-bold text-[#EDEDED] tracking-tight text-lg">Sign In</span>
          </div>
          <button onClick={onClose} className="text-[#8F8F8F] hover:text-[#EDEDED] transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          
          {/* Google Button */}
          <button className="w-full flex items-center justify-center gap-3 bg-[#232323] hover:bg-[#2A2A2A] text-[#EDEDED] border border-[#2E2E2E] hover:border-[#8F8F8F] transition-all px-4 py-3 rounded-xl font-bold text-sm mb-6">
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#2E2E2E]"></div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#8F8F8F]">Or continue with email</span>
            <div className="flex-1 h-px bg-[#2E2E2E]"></div>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded-lg border border-red-500/20 mb-4">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F] mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
                  placeholder="admin@tradeflow.com" 
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#8F8F8F]">Password</label>
                  <a href="#" className="text-[10px] font-mono text-[#3ECF8E] hover:underline tracking-wider">Forgot?</a>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required
                    className="w-full bg-[#1C1C1C] text-[#EDEDED] border border-[#2E2E2E] rounded-xl p-3 pr-10 text-sm focus:ring-1 focus:ring-[#3ECF8E] focus:border-[#3ECF8E] outline-none transition-all placeholder-[#8F8F8F]/50" 
                    placeholder="••••••••" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8F8F8F] hover:text-[#EDEDED] focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <button 
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full bg-[#3ECF8E] hover:bg-[#34b27b] text-black px-6 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 disabled:opacity-50 transition-colors shadow-[0_0_15px_rgba(62,207,142,0.15)]"
              >
                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Authenticating...</> : 'Log In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
