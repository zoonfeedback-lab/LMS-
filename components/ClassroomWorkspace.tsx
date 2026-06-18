'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  Chat,
  RoomAudioRenderer,
  useParticipants,
  useRoomContext,
  useLocalParticipant,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { RoomEvent, RemoteParticipant } from 'livekit-client';
import {
  Video,
  PenTool,
  MessageSquare,
  BarChart3,
  LogOut,
  Users,
  Zap,
  Copy,
  Check,
  Mic,
  MicOff,
  VideoOff,
  Monitor,
  X,
  Maximize,
  Minimize,
  Clock,
} from 'lucide-react';
import Whiteboard from './Whiteboard';
import PollWidget from './PollWidget';
import SecurityGuard from './SecurityGuard';

interface ClassroomWorkspaceProps {
  token: string;
  serverUrl: string;
  role: 'instructor' | 'student';
  username: string;
  room: string;
  onLeave: (duration?: number) => void;
}

type MainTab = 'video' | 'whiteboard';
type SideTab = 'chat' | 'polls' | 'members';

export default function ClassroomWorkspace(props: ClassroomWorkspaceProps) {
  return (
    <SecurityGuard username={props.username} role={props.role}>
      <LiveKitRoom
        token={props.token}
        serverUrl={props.serverUrl}
        connect={true}
        data-lk-theme="default"
        className="h-full"
      >
        <RoomAudioRenderer />
        <ClassroomWorkspaceInner {...props} />
      </LiveKitRoom>
    </SecurityGuard>
  );
}

function ClassroomWorkspaceInner({
  role,
  username,
  room: roomName,
  onLeave,
}: ClassroomWorkspaceProps) {
  const room = useRoomContext();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant();

  const [mainTab, setMainTab] = useState<MainTab>('video');
  const [sideTab, setSideTab] = useState<SideTab>('chat');

  // Meeting duration timer
  const [meetingTime, setMeetingTime] = useState(0);
  const meetingTimeRef = useRef(meetingTime);

  useEffect(() => {
    meetingTimeRef.current = meetingTime;
  }, [meetingTime]);

  useEffect(() => {
    const meetingTimer = setInterval(() => {
      setMeetingTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(meetingTimer);
  }, []);

  const hasLeft = useRef(false);
  const triggerLeave = useCallback((duration: number) => {
    if (hasLeft.current) return;
    hasLeft.current = true;
    onLeave(duration);
  }, [onLeave]);

  // Fullscreen State & Ref
  const videoStageRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!videoStageRef.current) return;

    if (!document.fullscreenElement) {
      videoStageRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Copy Link State
  const [copied, setCopied] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Raised Hands & Permission States
  const [raisedHands, setRaisedHands] = useState<{ identity: string; username: string }[]>([]);
  const [handRaised, setHandRaised] = useState(false);
  const [allowedMic, setAllowedMic] = useState(false);
  const [allowedCamera, setAllowedCamera] = useState(false);
  const [allowedScreen, setAllowedScreen] = useState(false);
  const [securityToast, setSecurityToast] = useState<string | null>(null);

  // Emoji Reactions State
  const [reactions, setReactions] = useState<{ id: string; username: string; emoji: string }[]>([]);

  const isInstructor = role === 'instructor';

  // ── 1. Listen for Real-Time Signals (Permissions, Hand Raises, Emojis) ──
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant?: RemoteParticipant) => {
      const decoder = new TextDecoder();
      try {
        const message = JSON.parse(decoder.decode(payload));
        
        if (message.type === 'raise-hand') {
          setRaisedHands((prev) => {
            if (prev.some((h) => h.identity === message.identity)) return prev;
            return [...prev, { identity: message.identity, username: message.username }];
          });
          if (isInstructor) {
            triggerSecurityToast(`✋ ${message.username} raised their hand`);
          }
        } else if (message.type === 'lower-hand') {
          setRaisedHands((prev) => prev.filter((h) => h.identity !== message.identity));
        } else if (message.type === 'grant-permission') {
          if (message.identity === localParticipant.identity) {
            setAllowedMic(message.mic);
            setAllowedCamera(message.camera);
            setAllowedScreen(message.screen);
            
            let modes = [];
            if (message.mic) modes.push('Microphone');
            if (message.camera) modes.push('Camera');
            if (message.screen) modes.push('Screen Share');
            triggerSecurityToast(`✅ Instructor granted you permission for: ${modes.join(', ')}`);
          }
        } else if (message.type === 'revoke-permission') {
          if (message.identity === localParticipant.identity) {
            setAllowedMic(false);
            setAllowedCamera(false);
            setAllowedScreen(false);
            
            // Enforce muting immediately
            localParticipant.setMicrophoneEnabled(false);
            localParticipant.setCameraEnabled(false);
            localParticipant.setScreenShareEnabled(false);
            
            triggerSecurityToast('❌ Your media permissions have been revoked by the instructor.');
          }
        } else if (message.type === 'emoji-reaction') {
          setReactions((prev) => [...prev, { id: message.id, username: message.username, emoji: message.emoji }]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== message.id));
          }, 3200);
        }
      } catch (e) {
        console.error('Failed to parse incoming data packet:', e);
      }
    };

    const handleRoomDisconnected = () => {
      triggerLeave(meetingTimeRef.current);
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);
    room.on(RoomEvent.Disconnected, handleRoomDisconnected);
    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
      room.off(RoomEvent.Disconnected, handleRoomDisconnected);
    };
  }, [room, localParticipant.identity, isInstructor, username, triggerLeave]);

  // Clean up disconnected participants from hand raises
  const allParticipants = useParticipants();
  useEffect(() => {
    setRaisedHands((prev) => 
      prev.filter((hand) => allParticipants.some((p) => p.identity === hand.identity))
    );
  }, [allParticipants]);

  // Toast notifier helper
  const triggerSecurityToast = (msg: string) => {
    setSecurityToast(msg);
    setTimeout(() => setSecurityToast(null), 4000);
  };

  // ── 2. Emoji Trigger Sender ──
  const sendEmojiReaction = (emoji: string) => {
    if (!room) return;
    const reactionId = Math.random().toString(36).substring(2, 9);
    
    // Add locally for the sender immediately
    setReactions((prev) => [...prev, { id: reactionId, username: 'You', emoji }]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== reactionId));
    }, 3200);

    const encoder = new TextEncoder();
    const payload = encoder.encode(
      JSON.stringify({
        type: 'emoji-reaction',
        id: reactionId,
        username,
        emoji,
      })
    );
    room.localParticipant.publishData(payload, { reliable: true });
  };

  // ── 3. Student Call-to-Actions (Raise/Lower Hand) ──
  const raiseHand = () => {
    if (!room) return;
    const encoder = new TextEncoder();
    const payload = encoder.encode(
      JSON.stringify({
        type: 'raise-hand',
        identity: localParticipant.identity,
        username,
      })
    );
    room.localParticipant.publishData(payload, { reliable: true });
    setHandRaised(true);
  };

  const lowerHand = () => {
    if (!room) return;
    const encoder = new TextEncoder();
    const payload = encoder.encode(
      JSON.stringify({
        type: 'lower-hand',
        identity: localParticipant.identity,
      })
    );
    room.localParticipant.publishData(payload, { reliable: true });
    setHandRaised(false);
  };

  // ── 4. Instructor Controls (Grant/Revoke Authorities) ──
  const grantPermission = (identity: string, mic: boolean, camera: boolean, screen: boolean) => {
    if (!room) return;
    const encoder = new TextEncoder();
    const payload = encoder.encode(
      JSON.stringify({
        type: 'grant-permission',
        identity,
        mic,
        camera,
        screen,
      })
    );
    room.localParticipant.publishData(payload, { reliable: true });
    setRaisedHands((prev) => prev.filter((h) => h.identity !== identity));
  };

  const revokePermission = (identity: string) => {
    if (!room) return;
    const encoder = new TextEncoder();
    const payload = encoder.encode(
      JSON.stringify({
        type: 'revoke-permission',
        identity,
      })
    );
    room.localParticipant.publishData(payload, { reliable: true });
  };

  const handleLeave = async () => {
    if (isInstructor) {
      try {
        await fetch(`/api/livekit?room=${roomName}&role=instructor`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to end classroom session:', err);
      }
    }
    triggerLeave(meetingTime);
  };

  // ── 5. Copy Invite Link & Recording Operations ──
  const handleCopyLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      const inviteUrl = `${window.location.origin}/classroom?room=${roomName}`;
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomName]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs > 0 ? String(hrs).padStart(2, '0') : null,
      String(mins).padStart(2, '0'),
      String(secs).padStart(2, '0'),
    ]
      .filter(Boolean)
      .join(':');
  };

  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } as any,
      });

      let mixedStream = screenStream;

      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const dest = audioContext.createMediaStreamDestination();
          let hasAudio = false;

          if (screenStream.getAudioTracks().length > 0) {
            const screenSource = audioContext.createMediaStreamSource(screenStream);
            screenSource.connect(dest);
            hasAudio = true;
          }

          const micSource = audioContext.createMediaStreamSource(micStream);
          micSource.connect(dest);
          hasAudio = true;

          if (hasAudio) {
            mixedStream = new MediaStream([
              ...screenStream.getVideoTracks(),
              ...dest.stream.getAudioTracks()
            ]);
          }
        }
      } catch (micErr) {
        console.warn('Microphone access denied or failed, recording tab audio only:', micErr);
      }

      streamRef.current = mixedStream;
      chunksRef.current = [];

      let options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/mp4' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: '' };
      }

      const recorder = new MediaRecorder(mixedStream, options);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lecture-${roomName}-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        a.click();
        URL.revokeObjectURL(url);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        setIsRecording(false);
        setRecordingTime(0);
      };

      screenStream.getVideoTracks()[0].onended = () => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.stop();
        }
      };

      recorder.start();
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* ── CSS Style Hack to hide default ControlBar & Floating Emojis ── */}
      <style jsx global>{`
        .student-video-stage .lk-control-bar { display: none !important; }
        
        @keyframes emojiFloat {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-30px) scale(1.2);
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(-50vh) translateX(var(--drift-x, 20px)) scale(0.8);
            opacity: 0;
          }
        }
        .animate-emoji-float {
          animation: emojiFloat 3.2s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      `}</style>

      {/* ── Top Bar ── */}
      <header
        className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-glass)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <span className="font-semibold text-sm text-white">LiveSpace</span>
          </div>
          <div className="h-4 w-px" style={{ background: 'var(--border-glass)' }} />
          {/* Meeting Elapsed Timer */}
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] px-2.5 py-1 rounded-lg text-white/70 font-mono text-xs font-semibold select-none">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {formatTime(meetingTime)}
          </div>
          <div className="h-4 w-px" style={{ background: 'var(--border-glass)' }} />
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/[0.05] pl-2.5 pr-1.5 py-1 rounded-lg animate-pulse">
            <Users className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary)' }} />
            <span className="text-xs font-semibold text-[#eeeef4] mr-1">
              {roomName}
            </span>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center p-1 rounded hover:bg-white/10 transition-all text-white"
              style={{ cursor: 'pointer' }}
              title="Copy Invite Link"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/50" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Instructor Recording Controls */}
          {isInstructor && (
            <div className="flex items-center gap-2 relative">
              {isRecording ? (
                <>
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shrink-0" />
                    <span className="text-[10px] font-mono text-red-400 font-bold ml-1">
                      REC {formatTime(recordingTime)}
                    </span>
                  </div>
                  <button
                    onClick={stopRecording}
                    className="btn-danger flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold"
                    style={{ height: '30px', padding: '0 12px' }}
                  >
                    Stop & Save
                  </button>
                </>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    color: 'var(--text-primary)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    height: '30px',
                    padding: '0 12px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)')}
                >
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                  Record
                </button>
              )}
            </div>
          )}

          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              background: isInstructor ? 'rgba(124, 92, 252, 0.15)' : 'rgba(92, 240, 208, 0.12)',
              color: isInstructor ? 'var(--accent)' : 'var(--accent-secondary)',
              border: `1px solid ${isInstructor ? 'rgba(124, 92, 252, 0.25)' : 'rgba(92, 240, 208, 0.2)'}`,
            }}
          >
            {isInstructor ? '🎓 Instructor' : '📖 Student'} — {username}
          </span>
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
            style={{
              color: 'var(--danger)',
              background: 'rgba(252, 92, 124, 0.08)',
              border: '1px solid rgba(252, 92, 124, 0.15)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(252, 92, 124, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(252, 92, 124, 0.08)')}
          >
            <LogOut className="w-3.5 h-3.5" />
            Leave
          </button>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Security Notification Toast */}
        {securityToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-2.5 px-4 py-3 bg-[#151525]/95 border border-indigo-500/35 rounded-xl shadow-lg fade-in">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0 animate-bounce" />
            <span className="text-xs font-semibold text-white">{securityToast}</span>
          </div>
        )}

        {/* ── Left Column: Video stage & Student Controls (60%) ── */}
        <div className="flex flex-col" style={{ width: '60%' }}>
          <div className="p-2 shrink-0">
            <div className="tab-bar">
              <button
                className={`tab-btn flex items-center justify-center gap-1.5 ${mainTab === 'video' ? 'active' : ''}`}
                onClick={() => setMainTab('video')}
              >
                <Video className="w-3.5 h-3.5" />
                Video
              </button>
              <button
                className={`tab-btn flex items-center justify-center gap-1.5 ${mainTab === 'whiteboard' ? 'active' : ''}`}
                onClick={() => setMainTab('whiteboard')}
              >
                <PenTool className="w-3.5 h-3.5" />
                Whiteboard
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-2 pt-0 flex flex-col relative">
            <div
              ref={videoStageRef}
              className="flex-1 rounded-xl overflow-hidden relative student-video-stage"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
              }}
            >
              {/* Fullscreen stage button */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 z-[45] p-2 rounded-lg bg-black/50 hover:bg-black/75 border border-white/10 text-white transition-all shadow-md flex items-center justify-center cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Stage'}
              >
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              {mainTab === 'video' ? <VideoConference /> : <Whiteboard />}

              {/* Floating Emojis Overlay */}
              <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                {reactions.map((r) => (
                  <FloatingEmojiBubble key={r.id} emoji={r.emoji} username={r.username} />
                ))}
              </div>

              {/* Custom Unified Control Bar */}
              {mainTab === 'video' && (
                <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
                  {/* Left Side: Media controls and Hand Raise */}
                  <div className="flex items-center gap-2 pointer-events-auto bg-black/60 border border-white/10 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl">
                    {role === 'student' && (
                      <>
                        {handRaised ? (
                          <button
                            onClick={lowerHand}
                            className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all animate-pulse cursor-pointer"
                            style={{
                              color: 'white',
                              background: 'rgba(245, 158, 11, 0.25)',
                              border: '1px solid rgba(245, 158, 11, 0.45)',
                            }}
                          >
                            ✋ Raised
                          </button>
                        ) : (
                          <button
                            onClick={raiseHand}
                            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-[#eeeef4] bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer"
                          >
                            ✋ Raise Hand
                          </button>
                        )}
                        <div className="w-px h-5 bg-white/10" />
                      </>
                    )}

                    {/* Microphone Toggle */}
                    <button
                      onClick={() => {
                        if (isInstructor || allowedMic) {
                          localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
                        } else {
                          triggerSecurityToast('🎤 Microphone access is disabled by the instructor. Raise hand to request permission.');
                        }
                      }}
                      className={`flex items-center justify-center p-2 rounded-lg transition-all border cursor-pointer ${
                        isInstructor || allowedMic
                          ? isMicrophoneEnabled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25'
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                          : 'bg-red-500/5 text-red-500/40 border-red-500/10 hover:bg-red-500/10'
                      }`}
                      title={isInstructor || allowedMic ? (isMicrophoneEnabled ? 'Mute Mic' : 'Unmute Mic') : 'Microphone Disabled'}
                    >
                      {isMicrophoneEnabled && (isInstructor || allowedMic) ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                    </button>

                    {/* Camera Toggle */}
                    <button
                      onClick={() => {
                        if (isInstructor || allowedCamera) {
                          localParticipant.setCameraEnabled(!isCameraEnabled);
                        } else {
                          triggerSecurityToast('📹 Camera access is disabled by the instructor. Raise hand to request permission.');
                        }
                      }}
                      className={`flex items-center justify-center p-2 rounded-lg transition-all border cursor-pointer ${
                        isInstructor || allowedCamera
                          ? isCameraEnabled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25'
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                          : 'bg-red-500/5 text-red-500/40 border-red-500/10 hover:bg-red-500/10'
                      }`}
                      title={isInstructor || allowedCamera ? (isCameraEnabled ? 'Disable Camera' : 'Enable Camera') : 'Camera Disabled'}
                    >
                      {isCameraEnabled && (isInstructor || allowedCamera) ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                    </button>

                    {/* Screen Share Toggle */}
                    <button
                      onClick={() => {
                        if (isInstructor || allowedScreen) {
                          localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
                        } else {
                          triggerSecurityToast('🖥️ Screen sharing is disabled by the instructor. Raise hand to request permission.');
                        }
                      }}
                      className={`flex items-center justify-center p-2 rounded-lg transition-all border cursor-pointer ${
                        isInstructor || allowedScreen
                          ? isScreenShareEnabled
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25'
                            : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10'
                          : 'bg-red-500/5 text-red-500/40 border-red-500/10 hover:bg-red-500/10'
                      }`}
                      title={isInstructor || allowedScreen ? (isScreenShareEnabled ? 'Stop Sharing' : 'Share Screen') : 'Screen Sharing Disabled'}
                    >
                      <Monitor className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Middle: Emoji Reaction Picker */}
                  <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto bg-black/60 border border-white/10 backdrop-blur-md px-3.5 py-2 rounded-full flex items-center gap-2.5 shadow-xl transition-all">
                    {['👍', '👏', '❤️', '😂', '🎉', '😮'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => sendEmojiReaction(emoji)}
                        className="text-xl hover:scale-130 active:scale-95 transition-all p-1 rounded-full hover:bg-white/10 shrink-0 select-none cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Right Side: Leave Controls */}
                  <div className="flex items-center gap-2 pointer-events-auto bg-black/60 border border-white/10 backdrop-blur-md px-3 py-2 rounded-xl shadow-xl">
                    <button
                      onClick={handleLeave}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all text-red-400 hover:text-white bg-red-500/10 border border-red-500/20 hover:bg-red-500/80 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Leave
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-px shrink-0" style={{ background: 'var(--border-glass)' }} />

        {/* ── Right Sidebar: Chat / Polls / Members (40%) ── */}
        <div className="flex flex-col" style={{ width: '40%' }}>
          <div className="p-2 shrink-0">
            <div className="tab-bar">
              <button
                className={`tab-btn flex items-center justify-center gap-1.5 ${sideTab === 'chat' ? 'active' : ''}`}
                onClick={() => setSideTab('chat')}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                className={`tab-btn flex items-center justify-center gap-1.5 ${sideTab === 'polls' ? 'active' : ''}`}
                onClick={() => setSideTab('polls')}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Polls
              </button>
              <button
                className={`tab-btn flex items-center justify-center gap-1.5 relative ${sideTab === 'members' ? 'active' : ''}`}
                onClick={() => setSideTab('members')}
              >
                <Users className="w-3.5 h-3.5" />
                Members
                {raisedHands.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 p-2 pt-0">
            <div
              className="h-full rounded-xl overflow-hidden flex flex-col"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-glass)',
              }}
            >
              {sideTab === 'chat' ? (
                <Chat />
              ) : sideTab === 'polls' ? (
                <PollWidget role={role} />
              ) : (
                <MembersTab
                  role={role}
                  raisedHands={raisedHands}
                  grantPermission={grantPermission}
                  revokePermission={revokePermission}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Floating Emoji React Component ──
function FloatingEmojiBubble({ emoji, username }: { emoji: string; username: string }) {
  const [randomLeft] = useState(() => Math.floor(Math.random() * 60) + 20); // 20% to 80% span
  const [randomDrift] = useState(() => Math.floor(Math.random() * 80) - 40); // -40px to 40px drift
  const [randomDuration] = useState(() => (Math.random() * 1.2 + 2.0).toFixed(1)); // 2.0s to 3.2s float

  return (
    <div
      className="absolute bottom-12 flex flex-col items-center animate-emoji-float z-[99]"
      style={{
        left: `${randomLeft}%`,
        animationDuration: `${randomDuration}s`,
        '--drift-x': `${randomDrift}px`,
      } as any}
    >
      <span className="text-4xl filter drop-shadow-md select-none">{emoji}</span>
      <span className="text-[9px] text-white/70 bg-black/60 px-1.5 py-0.5 rounded-md mt-1 backdrop-blur-[1px] tracking-wide whitespace-nowrap select-none">
        {username}
      </span>
    </div>
  );
}

// ── Members List Sidebar Tab ──
interface MembersTabProps {
  role: 'instructor' | 'student';
  raisedHands: { identity: string; username: string }[];
  grantPermission: (identity: string, mic: boolean, camera: boolean, screen: boolean) => void;
  revokePermission: (identity: string) => void;
}

function MembersTab({ role, raisedHands, grantPermission, revokePermission }: MembersTabProps) {
  const participants = useParticipants();
  const isInstructor = role === 'instructor';

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: 'var(--border-glass)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
          Participants ({participants.length})
        </h3>
        {raisedHands.length > 0 && (
          <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 px-2 py-0.5 rounded-full">
            ✋ {raisedHands.length} Raised
          </span>
        )}
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {participants.map((p) => {
          const isMe = p.isLocal;
          const isHandRaised = raisedHands.some((h) => h.identity === p.identity);
          const isUserInstructor = p.name?.toLowerCase().includes('(instructor)') || p.identity.toLowerCase().includes('instructor');

          return (
            <div
              key={p.identity}
              className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-white/[0.01]"
              style={{
                background: 'rgba(10, 10, 25, 0.4)',
                border: '1px solid var(--border-glass)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c5cfc]/20 to-[#5cf0d0]/20 flex items-center justify-center font-extrabold text-xs text-white uppercase shrink-0">
                  {p.name?.[0] || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#eeeef4] truncate pr-1">
                    {p.name || p.identity} {isMe && <span className="text-[10px] text-gray-500 font-normal">(You)</span>}
                  </p>
                  <p className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {isUserInstructor ? '🎓 Instructor' : '📖 Student'}
                  </p>
                </div>
              </div>

              {/* Action buttons / indicators */}
              <div className="flex items-center gap-2 shrink-0">
                {isHandRaised && (
                  <span className="text-base animate-bounce animate-pulse" title="Hand Raised" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.5))' }}>
                    ✋
                  </span>
                )}

                {isInstructor && !isUserInstructor && !isMe && (
                  <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-lg border border-white/[0.05]">
                    {/* Grant mic/cam speak permissions */}
                    <button
                      onClick={() => grantPermission(p.identity, true, true, false)}
                      className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 hover:scale-105 transition-all"
                      style={{ cursor: 'pointer' }}
                      title="Grant Mic & Camera"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>
                    {/* Grant screen share permission */}
                    <button
                      onClick={() => grantPermission(p.identity, true, true, true)}
                      className="p-1 rounded hover:bg-sky-500/10 text-sky-400 hover:scale-105 transition-all"
                      style={{ cursor: 'pointer' }}
                      title="Grant Screen Sharing"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    {/* Revoke permissions (Force Mute) */}
                    <button
                      onClick={() => revokePermission(p.identity)}
                      className="p-1 rounded hover:bg-red-500/10 text-red-400 hover:scale-105 transition-all"
                      style={{ cursor: 'pointer' }}
                      title="Revoke Permissions"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
