import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Configurable session timings (INSA Compliant Enterprise standard)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Show warning 2 minutes before logout (at 13 min)
const ACTIVITY_THROTTLE_MS = 5000; // Throttle writing activity timestamp to storage

export default function SessionIdleManager() {
  const { isAuthenticated, user, logout, refreshUser } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(120);

  const lastActivityRef = useRef<number>(Date.now());
  const lastThrottleRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Record user activity
  const recordActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    if (now - lastThrottleRef.current > ACTIVITY_THROTTLE_MS) {
      lastThrottleRef.current = now;
      try {
        localStorage.setItem('tradeflow_last_activity', now.toString());
      } catch (e) {}
    }
  }, []);

  // Reset session and stay logged in
  const handleStayLoggedIn = async () => {
    const now = Date.now();
    lastActivityRef.current = now;
    lastThrottleRef.current = now;
    try {
      localStorage.setItem('tradeflow_last_activity', now.toString());
    } catch (e) {}
    setShowWarning(false);
    setSecondsRemaining(120);

    try {
      await refreshUser();
    } catch (e) {}
  };

  // Perform logout
  const handleLogoutNow = async () => {
    setShowWarning(false);
    await logout();
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShowWarning(false);
      return;
    }

    // Initialize activity timestamp
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem('tradeflow_last_activity', now.toString());
    } catch (e) {}

    // Attach activity event listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleEvent = () => recordActivity();
    events.forEach((ev) => window.addEventListener(ev, handleEvent, { passive: true }));

    // Listen for activity from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'tradeflow_last_activity' && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (!isNaN(remoteTime) && remoteTime > lastActivityRef.current) {
          lastActivityRef.current = remoteTime;
          setShowWarning(false);
          setSecondsRemaining(120);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Main tick checker running every second
    timerRef.current = setInterval(async () => {
      // Check stored activity across all tabs
      let effectiveLastActivity = lastActivityRef.current;
      try {
        const storedActivity = localStorage.getItem('tradeflow_last_activity');
        if (storedActivity) {
          const parsed = parseInt(storedActivity, 10);
          if (!isNaN(parsed) && parsed > effectiveLastActivity) {
            effectiveLastActivity = parsed;
            lastActivityRef.current = parsed;
          }
        }
      } catch (e) {}

      const idleDuration = Date.now() - effectiveLastActivity;
      const warningThreshold = IDLE_TIMEOUT_MS - WARNING_BEFORE_MS;

      if (idleDuration >= IDLE_TIMEOUT_MS) {
        // Inactivity limit reached -> Auto Logout!
        setShowWarning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        await logout();
      } else if (idleDuration >= warningThreshold) {
        // Inside warning window (last 2 minutes)
        const msRemaining = Math.max(0, IDLE_TIMEOUT_MS - idleDuration);
        setSecondsRemaining(Math.ceil(msRemaining / 1000));
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleEvent));
      window.removeEventListener('storage', handleStorage);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, user, logout, recordActivity, refreshUser]);

  if (!showWarning) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0c0c]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1C1C1C] border border-amber-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 flex flex-col text-[#EDEDED] relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#EDEDED]">Session Inactivity Warning</h3>
            <p className="text-xs text-[#8F8F8F]">INSA Security Compliance Rule</p>
          </div>
        </div>

        <p className="text-sm text-[#A1A1A1] leading-relaxed mb-5">
          You have been inactive for over 13 minutes. To protect your trade credentials and account security, your session will automatically disconnect in:
        </p>

        {/* Live Countdown Display */}
        <div className="bg-[#141414] border border-[#2E2E2E] rounded-xl p-4 flex items-center justify-center gap-3 mb-6">
          <Clock size={20} className="text-amber-400 animate-pulse" />
          <span className="font-mono text-2xl font-bold text-amber-400 tracking-wider">
            {timeFormatted}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleStayLoggedIn}
            className="flex-1 bg-[#3ECF8E] hover:bg-[#34b27b] text-black font-bold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(62,207,142,0.2)]"
          >
            <RefreshCw size={15} />
            Stay Logged In
          </button>
          <button
            type="button"
            onClick={handleLogoutNow}
            className="flex-1 bg-[#242424] hover:bg-red-500/20 text-[#8F8F8F] hover:text-red-400 border border-[#2E2E2E] hover:border-red-500/30 font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
          >
            <LogOut size={15} />
            Log Out Now
          </button>
        </div>
      </div>
    </div>
  );
}
