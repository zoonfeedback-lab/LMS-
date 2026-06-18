'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, User, Hash, ChevronRight, Zap, Video, Clock } from 'lucide-react';
import ClassroomWorkspace from '@/components/ClassroomWorkspace';

type Role = 'instructor' | 'student';

interface SessionConfig {
  token: string;
  serverUrl: string;
  role: Role;
  username: string;
  room: string;
}

export default function ClassroomPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [activeTab, setActiveTab] = useState<'host' | 'join'>('host');
  const [isRoomLocked, setIsRoomLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionConfig | null>(null);
  const [endedSession, setEndedSession] = useState<{
    room: string;
    duration: number;
    role: Role;
    username: string;
    endedAt: string;
  } | null>(null);

  const connectToRoom = useCallback(async (roomName: string, userName: string, userRole: Role) => {
    setError(null);
    setLoading(true);
    try {
      const finalRoom = roomName.trim();
      const finalUsername = userName.trim() || (userRole === 'instructor' ? 'Instructor' : 'Student');

      const params = new URLSearchParams({ room: finalRoom, username: finalUsername, role: userRole });
      const res = await fetch(`/api/livekit?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to join room as ${userRole}`);
      }

      const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
      if (!serverUrl) {
        throw new Error('LiveKit server URL not configured');
      }

      setSession({
        token: data.token,
        serverUrl,
        role: userRole,
        username: finalUsername,
        room: finalRoom,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      const roleParam = params.get('role') as Role | null;
      const usernameParam = params.get('username');
      
      let autoUsername = usernameParam || '';
      
      if (roomParam) {
        setRoom(roomParam);
        setIsRoomLocked(true);
        
        const resolvedRole = roleParam === 'instructor' ? 'instructor' : 'student';
        if (resolvedRole === 'instructor') {
          setActiveTab('host');
        } else {
          setActiveTab('join');
        }
        
        // If username not provided in URL, try to load from localStorage for students
        if (!autoUsername && resolvedRole === 'student') {
          const savedUser = localStorage.getItem('lms_user');
          if (savedUser) {
            try {
              const parsed = JSON.parse(savedUser);
              if (parsed.name) {
                autoUsername = parsed.name;
              }
            } catch (e) {}
          }
        }
        
        // If we have room, role, and a username, auto-connect!
        if (autoUsername || resolvedRole === 'instructor') {
          const finalUsername = autoUsername || (resolvedRole === 'instructor' ? 'Instructor' : 'Student');
          setUsername(finalUsername);
          connectToRoom(roomParam, finalUsername, resolvedRole);
        }
      }
    }
  }, [connectToRoom]);

  const handleHost = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const finalRoom = room.trim() || `room-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
      const finalUsername = username.trim() || 'Instructor';
      await connectToRoom(finalRoom, finalUsername, 'instructor');
    },
    [username, room, connectToRoom]
  );

  const handleJoin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Extract Room ID from URL if they pasted a full invite URL into the field
      let targetRoom = room.trim();
      if (targetRoom.includes('classroom?room=')) {
        try {
          const url = new URL(targetRoom);
          const parsedRoom = url.searchParams.get('room');
          if (parsedRoom) {
            targetRoom = parsedRoom;
          }
        } catch (err) {
          console.warn('Failed to parse pasted Room ID URL:', err);
        }
      }

      const finalUsername = username.trim() || 'Student';
      await connectToRoom(targetRoom, finalUsername, 'student');
    },
    [room, username, connectToRoom]
  );

  // ── If we have a session, render the classroom ──
  if (session) {
    return (
      <ClassroomWorkspace
        token={session.token}
        serverUrl={session.serverUrl}
        role={session.role}
        username={session.username}
        room={session.room}
        onLeave={(duration) => {
          setEndedSession({
            room: session.room,
            duration: duration || 0,
            role: session.role,
            username: session.username,
            endedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
          setSession(null);
        }}
      />
    );
  }

  // ── Meeting Ended Screen ──
  if (endedSession) {
    const formatDuration = (seconds: number) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hrs > 0) {
        return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
      }
      if (mins > 0) {
        return `${mins}m ${secs.toString().padStart(2, '0')}s`;
      }
      return `${secs}s`;
    };

    const isStudent = endedSession.role === 'student';

    return (
      <div className="h-full flex items-center justify-center p-4 relative">
        <div className="gradient-bg" />
        
        {/* Floating particles */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${6 + i * 3}px`,
                height: `${6 + i * 3}px`,
                background: `rgba(124, 92, 252, ${0.08 + i * 0.02})`,
                top: `${15 + i * 18}%`,
                left: `${10 + i * 20}%`,
                animation: `floatOrb ${8 + i * 2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>

        <div className="glass-card w-full max-w-md p-8 relative z-10 fade-in text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#fc5c7c] to-[#7c5cfc] mb-6 shadow-lg">
            <Video className="w-7 h-7 text-white" style={{ opacity: 0.9 }} />
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            {isStudent ? 'You left the lecture' : 'Lecture ended successfully'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
            {isStudent ? 'Your connection to the live classroom was closed.' : 'The lecture session has been closed for all participants.'}
          </p>

          {/* Stats Box */}
          <div 
            className="p-5 rounded-2xl mb-8 text-left space-y-3.5"
            style={{
              background: 'rgba(10, 10, 25, 0.45)',
              border: '1px solid var(--border-glass)',
            }}
          >
            <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-white/40">
              <span>Session Stats</span>
              <span className="text-indigo-400 font-mono tracking-normal">{endedSession.room}</span>
            </div>
            
            <div className="h-px bg-white/5" />

            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Duration</span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>{formatDuration(endedSession.duration)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Ended At</span>
              <span className="text-sm font-semibold text-white">{endedSession.endedAt}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Role</span>
              <span 
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: isStudent ? 'rgba(92, 240, 208, 0.1)' : 'rgba(124, 92, 252, 0.15)',
                  color: isStudent ? 'var(--accent-secondary)' : 'var(--accent)',
                  border: `1px solid ${isStudent ? 'rgba(92, 240, 208, 0.2)' : 'rgba(124, 92, 252, 0.25)'}`,
                }}
              >
                {isStudent ? 'Student' : 'Instructor'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={async () => {
                const { room: r, username: u, role: rl } = endedSession;
                setEndedSession(null);
                await connectToRoom(r, u, rl);
              }}
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  Rejoin Lecture
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  router.push(isStudent ? '/learn' : '/');
                }}
                className="flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs font-semibold border transition-all text-[#eeeef4] bg-white/5 border-white/10 hover:bg-white/10 cursor-pointer"
              >
                {isStudent ? 'Go to Dashboard' : 'Return Home'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setEndedSession(null);
                }}
                className="flex items-center justify-center gap-1.5 py-3 rounded-lg text-xs font-semibold border transition-all text-indigo-400 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 cursor-pointer"
              >
                Go to Lobby
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Auto-connecting Screen ──
  if (loading && !session && isRoomLocked) {
    return (
      <div className="h-full flex items-center justify-center p-4 relative">
        <div className="gradient-bg" />
        
        {/* Floating particles */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${6 + i * 3}px`,
                height: `${6 + i * 3}px`,
                background: `rgba(124, 92, 252, ${0.08 + i * 0.02})`,
                top: `${15 + i * 18}%`,
                left: `${10 + i * 20}%`,
                animation: `floatOrb ${8 + i * 2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>

        <div className="glass-card w-full max-w-md p-8 relative z-10 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-250 border-t-indigo-600 animate-spin mb-6" />
          <h2 className="text-xl font-bold text-white mb-2">Connecting to Live Stage</h2>
          <div className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] px-3.5 py-1.5 rounded-full mb-4">
            <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
            <span className="text-xs font-mono text-[#5cf0d0] tracking-wider uppercase font-bold">
              {room}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-4 leading-relaxed">
            Setting up your secure audio/video channel, please wait...
          </p>
        </div>
      </div>
    );
  }

  // ── Google Meet / Zoom style Direct Link Join Screen ──
  if (isRoomLocked) {
    return (
      <div className="h-full flex items-center justify-center p-4 relative">
        <div className="gradient-bg" />
        
        {/* Floating particles */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${6 + i * 3}px`,
                height: `${6 + i * 3}px`,
                background: `rgba(124, 92, 252, ${0.08 + i * 0.02})`,
                top: `${15 + i * 18}%`,
                left: `${10 + i * 20}%`,
                animation: `floatOrb ${8 + i * 2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.8}s`,
              }}
            />
          ))}
        </div>

        {/* Meet/Zoom-style Card */}
        <div className="glass-card w-full max-w-md p-8 relative z-10 fade-in text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c5cfc] to-[#5cf0d0] mb-6 shadow-lg animate-pulse">
            <Video className="w-7 h-7 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
            Join Lecture
          </h1>
          
          <div className="inline-flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] px-3.5 py-1.5 rounded-full mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
            <span className="text-xs font-mono text-[#5cf0d0] tracking-wider uppercase font-bold">
              {room}
            </span>
          </div>

          <form onSubmit={handleJoin} className="space-y-6 text-left">
            <div>
              <label
                htmlFor="username"
                className="flex items-center gap-2 text-xs font-medium mb-2 uppercase tracking-wider animate-pulse"
                style={{ color: 'var(--text-muted)' }}
              >
                <User className="w-3.5 h-3.5" />
                Enter Your Name
              </label>
              <input
                id="username"
                type="text"
                required
                placeholder="e.g. Alice Smith"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field text-center text-lg py-3 font-semibold border-glass-active"
                autoFocus
              />
            </div>

            {error && (
              <div
                className="text-sm p-3.5 rounded-xl fade-in text-center"
                style={{
                  background: 'rgba(252, 92, 124, 0.08)',
                  border: '1px solid rgba(252, 92, 124, 0.15)',
                  color: 'var(--danger)',
                }}
              >
                {error.includes('not been created yet') || error.includes('404') ? (
                  <div className="font-semibold text-xs leading-relaxed text-red-400">
                    ⚠️ Class session has not been started yet.<br />
                    <span className="opacity-80 font-normal">Please wait for the instructor to start the class.</span>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 py-4 text-base font-bold shadow-lg transition-all"
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <>
                  Join Meeting
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-[10px] mt-8" style={{ color: 'var(--text-muted)' }}>
            Protected Live Stream · Screen capture disabled for students
          </p>
        </div>
      </div>
    );
  }

  // ── Lobby / Join Screen ──
  return (
    <div className="h-full flex items-center justify-center p-4 relative">
      {/* Animated background */}
      <div className="gradient-bg" />

      {/* Floating particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${6 + i * 3}px`,
              height: `${6 + i * 3}px`,
              background: `rgba(124, 92, 252, ${0.08 + i * 0.02})`,
              top: `${15 + i * 18}%`,
              left: `${10 + i * 20}%`,
              animation: `floatOrb ${8 + i * 2}s ease-in-out infinite alternate`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>

      {/* Join Card */}
      <div className="glass-card w-full max-w-md p-8 relative z-10 fade-in">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c5cfc] to-[#5cf0d0] mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            LiveSpace
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isRoomLocked ? 'Join a secure classroom session' : 'Start or join a live session'}
          </p>
        </div>

        {/* Tab Controls (only shown if not joining directly via link) */}
        {!isRoomLocked && (
          <div className="tab-bar mb-6">
            <button
              type="button"
              className={`tab-btn flex items-center justify-center gap-1.5 ${
                activeTab === 'host' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('host')}
            >
              <Video className="w-3.5 h-3.5" />
              Host Class
            </button>
            <button
              type="button"
              className={`tab-btn flex items-center justify-center gap-1.5 ${
                activeTab === 'join' ? 'active' : ''
              }`}
              onClick={() => setActiveTab('join')}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Join Class
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={activeTab === 'host' && !isRoomLocked ? handleHost : handleJoin} className="space-y-4">
          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="flex items-center gap-2 text-xs font-medium mb-2 uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              <User className="w-3.5 h-3.5" />
              Your Name
            </label>
            <input
              id="username"
              type="text"
              placeholder={activeTab === 'host' ? 'Instructor (Optional)' : 'Student (Optional)'}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              autoFocus
            />
          </div>

          {/* Room ID (only shown/needed for Join flow) */}
          {(activeTab === 'join' || isRoomLocked) && (
            <div>
              <label
                htmlFor="room"
                className="flex items-center gap-2 text-xs font-medium mb-2 uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                <Hash className="w-3.5 h-3.5" />
                Room ID
              </label>
              <input
                id="room"
                type="text"
                required
                readOnly={isRoomLocked}
                placeholder="e.g. math-101"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className={`input-field ${isRoomLocked ? 'animate-pulse' : ''}`}
                style={
                  isRoomLocked
                    ? {
                        opacity: 0.6,
                        cursor: 'not-allowed',
                        border: '1px solid rgba(92, 240, 208, 0.4)',
                        background: 'rgba(10, 10, 25, 0.4)',
                      }
                    : {}
                }
              />
              {isRoomLocked && (
                <p className="text-[10px] mt-1.5 flex items-center gap-1 font-semibold" style={{ color: 'var(--accent-secondary)' }}>
                  ✓ Joining via invite link
                </p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="text-sm p-3 rounded-lg fade-in"
              style={{
                background: 'rgba(252, 92, 124, 0.1)',
                border: '1px solid rgba(252, 92, 124, 0.2)',
                color: 'var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || (activeTab === 'join' && !room.trim())}
              className="btn-primary flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="spinner" />
              ) : activeTab === 'host' && !isRoomLocked ? (
                <>
                  Start New Class
                  <Video className="w-4 h-4" />
                </>
              ) : (
                <>
                  Join Classroom
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Powered by LiveKit · End-to-end encrypted
        </p>
      </div>
    </div>
  );
}
