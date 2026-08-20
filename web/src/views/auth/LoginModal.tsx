import React, { useState } from 'react';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LoginModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="fixed inset-0 z-[200] bg-slate-950/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-sm shadow-lg border border-slate-200 flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Sign In</h2>
            <p className="text-xs text-slate-500 mt-0.5">Access your TradeFlow portal</p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-md border border-red-200 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors" 
                placeholder="you@company.com" 
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-slate-700">Password</label>
                <a href="#" className="text-xs text-slate-500 hover:text-slate-900 hover:underline">Forgot?</a>
              </div>
              <div className="relative flex items-center">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                  className="w-full border border-slate-300 rounded-md pl-3 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors" 
                  placeholder="••••••••" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-5 flex items-center justify-end gap-2.5 border-t border-slate-100 mt-5">
            <button 
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-md hover:bg-slate-800 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

