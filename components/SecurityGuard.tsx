'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Lock, EyeOff } from 'lucide-react';

interface SecurityGuardProps {
  children: React.ReactNode;
  username: string;
  role: 'instructor' | 'student';
}

export default function SecurityGuard({
  children,
  username,
  role,
}: SecurityGuardProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);

  // If instructor, do not enforce restrictions
  const isStudent = role === 'student';

  useEffect(() => {
    if (!isStudent) return;

    // ── 1. Focus & Blur Lockout ──
    const handleBlur = () => {
      // Blur indicates user is using an external app (like Snipping Tool or OBS focus change)
      setIsLocked(true);
    };

    const handleFocus = () => {
      // Short delay to ensure screenshot/external tool has finished/closed
      setTimeout(() => {
        setIsLocked(false);
      }, 500);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── 2. Keyboard Shortcut Prevention ──
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect PrintScreen (note: PrintScreen keydown triggers on some OS, keyup is more common)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerTemporaryLock('Screenshot attempt detected. Screenshots are disabled!');
        return;
      }

      // Cmd/Ctrl combinations
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl) {
        switch (e.key.toLowerCase()) {
          case 'p': // Print
            e.preventDefault();
            triggerWarning('Printing is disabled in this classroom!');
            break;
          case 's': // Save page
            e.preventDefault();
            triggerWarning('Saving this page is disabled!');
            break;
          case 'u': // View source
            e.preventDefault();
            triggerWarning('Viewing source is disabled!');
            break;
          case 'c': // Prevent copy
            e.preventDefault();
            triggerWarning('Copying content is disabled!');
            break;
          default:
            break;
        }
      }

      // DevTools shortcuts (F12, Ctrl+Shift+I / Cmd+Opt+I)
      if (e.key === 'F12' || (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'i')) {
        e.preventDefault();
        triggerWarning('Developer Tools are disabled!');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerTemporaryLock('Screenshot attempt detected. Screenshots are disabled!');
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    // ── 3. Override getDisplayMedia (Screen Sharing) ──
    // Blocks client-side scripts/extension capture if they run within the same page
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = async function () {
        triggerWarning('Screen recording is disabled for students!');
        throw new Error('Screen sharing/recording is blocked on this page.');
      };

      return () => {
        navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia;
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('keydown', handleKeyDown, { capture: true });
        window.removeEventListener('keyup', handleKeyUp, { capture: true });
      };
    }

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
  }, [isStudent]);

  // Temporary blackout for print-screen keypresses
  const triggerTemporaryLock = (msg: string) => {
    setWarningMessage(msg);
    setIsLocked(true);
    setTimeout(() => {
      setIsLocked(false);
      setWarningMessage(null);
    }, 2500);
  };

  // Regular warning banner alert
  const triggerWarning = (msg: string) => {
    setWarningMessage(msg);
    setTimeout(() => {
      setWarningMessage(null);
    }, 3500);
  };

  // Render watermarks inside canvas background
  const [watermarkUrl, setWatermarkUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!isStudent) return;
    
    // Draw tiled watermark canvas
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.rotate(-25 * Math.PI / 180);
      ctx.font = '12px Inter, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(155, 155, 192, 0.07)'; // subtle text color
      ctx.fillText(`${username}`, 10, 100);
      ctx.fillText('PROTECTED CLASSROOM', 10, 120);
      setWatermarkUrl(canvas.toDataURL());
    }
  }, [isStudent, username]);

  if (!isStudent) {
    return <>{children}</>;
  }

  return (
    <div 
      className="relative w-full h-full select-none"
      onContextMenu={(e) => {
        e.preventDefault();
        triggerWarning('Right-click is disabled to protect content.');
      }}
    >
      {/* Dynamic Tiled Watermark Overlay */}
      {watermarkUrl && (
        <div 
          className="fixed inset-0 pointer-events-none z-[9999]"
          style={{ backgroundImage: `url(${watermarkUrl})`, backgroundRepeat: 'repeat' }}
        />
      )}

      {/* Dynamic Floating Watermark Indicator */}
      <FloatingWatermark username={username} />

      {/* Dynamic CSS for Print Protection */}
      <style jsx global>{`
        @media print {
          body {
            display: none !important;
          }
        }
        * {
          -webkit-user-drag: none;
        }
      `}</style>

      {/* Main Content */}
      <div className={`w-full h-full transition-all duration-300 ${isLocked ? 'blur-2xl scale-98 pointer-events-none' : ''}`}>
        {children}
      </div>

      {/* Blur/Lock Overlay */}
      {isLocked && (
        <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md fade-in px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 animate-pulse">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mb-2">
            Classroom Content Protected
          </h2>
          <p className="text-sm max-w-sm" style={{ color: 'var(--text-secondary)' }}>
            {warningMessage || 'To protect lecture materials, stream viewing is paused when the browser tab loses focus or when a screen capture tool is open.'}
          </p>
        </div>
      )}

      {/* Notification Toast */}
      {warningMessage && !isLocked && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-2.5 px-4 py-3 bg-[#151525]/95 border border-red-500/30 rounded-xl shadow-lg fade-in">
          <EyeOff className="w-4 h-4 text-red-400 shrink-0" />
          <span className="text-xs font-medium text-white">{warningMessage}</span>
        </div>
      )}
    </div>
  );
}

// ── Floating Watermark Component ──
// Drifts around the screen to prevent cropping in photo/video recordings
function FloatingWatermark({ username }: { username: string }) {
  const [position, setPosition] = useState({ top: '15%', left: '15%' });

  useEffect(() => {
    const interval = setInterval(() => {
      const topRandom = Math.floor(Math.random() * 70) + 15; // keep between 15% and 85%
      const leftRandom = Math.floor(Math.random() * 70) + 15;
      setPosition({
        top: `${topRandom}%`,
        left: `${leftRandom}%`,
      });
    }, 12000); // changes position every 12 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="fixed pointer-events-none z-[9998] transition-all duration-[1000ms] ease-in-out bg-black/30 border border-white/5 backdrop-blur-[2px] px-2.5 py-1 rounded-md text-[10px] tracking-widest text-white/25 uppercase font-mono font-bold"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {username} · LMS SECURE STREAM
    </div>
  );
}
