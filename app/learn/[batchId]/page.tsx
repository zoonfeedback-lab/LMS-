'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Video,
  FileText,
  Calendar,
  ExternalLink,
  GraduationCap,
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  Award
} from 'lucide-react';

interface Lecture {
  id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  notesUrl?: string;
  createdAt: string;
}

interface Batch {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  isLive: boolean;
  liveRoomId?: string;
  isUpcoming: boolean;
  price: string;
  startDate?: string;
  createdAt: string;
  lectures: Lecture[];
}

interface BatchPageProps {
  params: Promise<{ batchId: string }>;
}

export default function BatchCurriculumPage({ params }: BatchPageProps) {
  const { batchId } = use(params);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('Alex Rivers');
  const [completedLectures, setCompletedLectures] = useState<string[]>([]);
  const [savingLectureId, setSavingLectureId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [studentStatus, setStudentStatus] = useState<string>('Active');
  const [recordedAccessExpiresAt, setRecordedAccessExpiresAt] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  const loadBatchAndProgress = async (studentName: string) => {
    try {
      setLoading(true);
      
      // 1. Fetch Profile Status and redirect if pending, or lock if expired Completed
      const profRes = await fetch(`/api/student/profile?name=${encodeURIComponent(studentName)}`);
      let currentStatus = 'Active';
      let currentExpiresAt: string | null = null;

      if (profRes.ok) {
        const student = await profRes.json();
        if (student.status === 'Pending') {
          window.location.href = '/learn';
          return;
        }
        currentStatus = student.status || 'Active';
        setStudentStatus(currentStatus);

        const enrollment = student.enrollments?.find((e: any) => e.batchId === batchId);
        if (enrollment?.recordedAccessExpiresAt) {
          currentExpiresAt = enrollment.recordedAccessExpiresAt;
          setRecordedAccessExpiresAt(currentExpiresAt);

          if (currentStatus === 'Completed') {
            const expiry = new Date(currentExpiresAt!);
            if (new Date() > expiry) {
              setIsExpired(true);
              setLoading(false);
              return;
            }
          }
        }
      }

      // Fetch batch data
      const res = await fetch(`/api/batches/${batchId}`);
      if (res.ok) {
        const batchData = await res.json();
        setBatch(batchData);
      }

      // Fetch progress
      const progressRes = await fetch(`/api/student/progress?name=${encodeURIComponent(studentName)}`);
      if (progressRes.ok) {
        const progressObj = await progressRes.json();
        setCompletedLectures(progressObj[batchId] || []);
      }
    } catch (e) {
      console.error('Failed to load batch curriculum details:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('lms_user');
    if (!savedUser) {
      window.location.href = '/';
      return;
    }
    try {
      const parsed = JSON.parse(savedUser);
      if (!parsed.name || parsed.role !== 'student') {
        window.location.href = '/';
        return;
      }
      setIsAuthorized(true);
      setUsername(parsed.name);
      loadBatchAndProgress(parsed.name);
    } catch (e) {
      window.location.href = '/';
    }
  }, [batchId]);

  const toggleLectureCompletion = async (lectureId: string, currentlyCompleted: boolean) => {
    try {
      setSavingLectureId(lectureId);
      const res = await fetch('/api/student/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: username,
          lectureId,
          completed: !currentlyCompleted
        })
      });

      if (res.ok) {
        if (currentlyCompleted) {
          setCompletedLectures(completedLectures.filter(id => id !== lectureId));
        } else {
          setCompletedLectures([...completedLectures, lectureId]);
        }
      }
    } catch (e) {
      console.error('Failed to update lecture progress:', e);
    } finally {
      setSavingLectureId(null);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-650 animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Verifying student credentials...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Loading curriculum workspace...</span>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="min-h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans flex items-center justify-center relative p-4 select-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/5 via-transparent to-indigo-500/5 z-0 pointer-events-none" />
        
        <div className="bg-white w-full max-w-lg p-8 border border-slate-200/80 rounded-3xl shadow-2xl relative z-10 space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 shadow-md animate-pulse mb-2">
            <span className="text-3xl font-sans font-bold">⏰</span>
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Recorded Access Expired
            </h2>
            <p className="text-xs text-rose-600 font-bold uppercase tracking-widest mt-1">
              Recorded Class Duration Completed
            </p>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed font-medium bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-left space-y-3.5">
            <p>
              Your 2-month recorded lecture access to this course cohort has expired. 
              According to the school's policy, access to stream recordings and whiteboard PDF notes is restricted after 2 months from course completion.
            </p>
            <p className="text-[10px] text-slate-450 font-semibold leading-relaxed border-t border-slate-100 pt-3">
              💡 Need an extension? Please contact the administration on WhatsApp or email to request additional access.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/learn"
              className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-150 transition active:scale-95 text-center"
            >
              Return to Student Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center gap-4 font-sans">
        <Layers className="w-12 h-12 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-700">Batch Curriculum Not Found</h2>
        <Link href="/learn" className="text-xs font-bold text-indigo-600 hover:underline">
          Return to Student Dashboard
        </Link>
      </div>
    );
  }

  const completionPercentage = batch.lectures.length > 0 
    ? Math.round((completedLectures.length / batch.lectures.length) * 100)
    : 0;

  const upcomingLectures = batch.lectures.filter(l => l.title.toLowerCase().startsWith('scheduled live session:'));
  const pastLectures = batch.lectures.filter(l => !l.title.toLowerCase().startsWith('scheduled live session:'));

  const getRemainingDaysText = () => {
    if (!recordedAccessExpiresAt) return '';
    const expiry = new Date(recordedAccessExpiresAt);
    const diff = expiry.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return `Expires on ${expiry.toLocaleDateString()} (${days} days remaining)`;
  };

  return (
    <div className="min-h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col overflow-y-auto pb-16 select-none relative">
      
      {/* ─── HEADER NAVIGATION ─── */}
      <header className="sticky top-0 z-50 w-full h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3.5">
          <Link
            href="/learn"
            className="w-9 h-9 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 flex items-center justify-center transition active:scale-95 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-550" />
          </Link>
          <div>
            <h1 className="text-sm font-extrabold text-indigo-950 tracking-tight leading-tight">{batch.title}</h1>
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block mt-0.5">Curriculum Overview</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {studentStatus !== 'Completed' && batch.isLive && batch.liveRoomId && (
            <Link
              href={`/classroom?room=${batch.liveRoomId}&role=student&username=${encodeURIComponent(username || 'Student')}`}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl shadow-md shadow-rose-100 transition active:scale-95"
            >
              <Video className="w-4 h-4 animate-pulse" />
              Join Live Streaming Stage
            </Link>
          )}
        </div>
      </header>

      {/* ─── MAIN CURRICULUM WORKSPACE ─── */}
      <main className="max-w-5xl w-full mx-auto px-6 pt-8 flex-grow">
        
        {/* Phase-specific notifications */}
        {studentStatus === 'Active' && (
          <div className="mb-6 bg-gradient-to-r from-indigo-500/10 via-indigo-650/5 to-transparent border border-indigo-200 p-4.5 rounded-2xl flex items-start gap-3.5 shadow-sm text-xs font-bold text-indigo-900 leading-relaxed fade-in select-none">
            <span className="w-6.5 h-6.5 rounded-lg bg-indigo-50 border border-indigo-250 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5 text-base">
              ℹ️
            </span>
            <div>
              <span className="text-indigo-850 font-extrabold text-sm block mb-0.5">Live Classes Phase Active</span>
              You are currently attending live lectures for this batch. Video recordings and whiteboard PDF notes are locked during this phase. They will unlock and remain available for 2 months once the administration marks this course duration as completed.
            </div>
          </div>
        )}

        {studentStatus === 'Completed' && (
          <div className="mb-6 bg-gradient-to-r from-emerald-500/10 via-emerald-650/5 to-transparent border border-emerald-250 p-4.5 rounded-2xl flex items-start gap-3.5 shadow-sm text-xs font-bold text-emerald-900 leading-relaxed fade-in select-none">
            <span className="w-6.5 h-6.5 rounded-lg bg-emerald-50 border border-emerald-250 text-emerald-650 flex items-center justify-center shrink-0 shadow-sm mt-0.5 text-base">
              🔑
            </span>
            <div>
              <span className="text-emerald-850 font-extrabold text-sm block mb-0.5">Recorded Lectures Phase Active</span>
              This course cohort has completed. You have full access to all session recordings and whiteboard PDF note attachments. 
              Your 2-month access is active until: <strong className="text-emerald-700 underline font-black">{getRemainingDaysText() || '2 months from completion'}</strong>.
            </div>
          </div>
        )}

        {/* Course Hero Panel */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm mb-8 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                My Cohort Class
              </span>
              <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Created {new Date(batch.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-black text-indigo-950 tracking-tight leading-tight">
              {batch.title}
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-3xl">
              {batch.description || 'Welcome to your learning stage. Track session recordings, notes, and study slides. Complete tasks as they launch.'}
            </p>

            {/* Dynamic Progress Indicator */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">Curriculum Completion</span>
                <span className="text-indigo-600">{completedLectures.length} of {batch.lectures.length} lessons ({completionPercentage}%)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-650 transition-all duration-500 rounded-full" 
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timeline of lectures (2/3 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Live Sessions */}
            {upcomingLectures.length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5" />
                  Upcoming Scheduled Classes ({upcomingLectures.length})
                </h3>
                <div className="space-y-3">
                  {upcomingLectures.map((lecture) => (
                    <div
                      key={lecture.id}
                      className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-250 p-5 rounded-2xl shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-base font-extrabold text-slate-800 leading-snug">
                            {lecture.title.replace(/scheduled live session:\s*/gi, '')}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed mt-1">
                            {lecture.description || 'No additional details provided by the instructor.'}
                          </p>
                        </div>
                        {batch.isLive && batch.liveRoomId && (
                          <Link
                            href={`/classroom?room=${batch.liveRoomId}&role=student&username=${encodeURIComponent(username || 'Student')}`}
                            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition active:scale-95 shrink-0"
                          >
                            <Video className="w-3.5 h-3.5 animate-pulse" />
                            Join Live Now
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Classes (Syllabus/Conducted) */}
            <h3 className="text-sm font-extrabold text-indigo-950 uppercase tracking-widest flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Course Topics & Conducted Lectures
            </h3>

            {pastLectures.length === 0 ? (
              <div className="bg-white border border-slate-200/50 rounded-2xl p-12 text-center shadow-sm">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-xs font-extrabold text-slate-700">No sessions published yet</h4>
                <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                  Conducted topics, study notes, and video playbacks will appear here once the class is completed.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastLectures.map((lecture, index) => {
                  const isCompleted = completedLectures.includes(lecture.id);
                  const isSaving = savingLectureId === lecture.id;

                  return (
                    <div
                      key={lecture.id}
                      className={`bg-white border rounded-2xl p-5 shadow-sm transition-all hover:border-slate-300 ${
                        isCompleted ? 'border-indigo-100/60 bg-indigo-50/5' : 'border-slate-200/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-2">
                            <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                              Topic {index + 1}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {new Date(lecture.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="text-base font-extrabold text-slate-800 leading-snug mb-1.5">
                            {lecture.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {lecture.description || 'No class summary details provided for this topic.'}
                          </p>
                        </div>

                        {/* Interactive Completion Toggle */}
                        <button
                          onClick={() => toggleLectureCompletion(lecture.id, isCompleted)}
                          disabled={isSaving}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-extrabold transition active:scale-95 shrink-0 cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-650'
                          }`}
                        >
                          {isSaving ? (
                            <span className="w-3.5 h-3.5 rounded-full border border-indigo-200 border-t-indigo-600 animate-spin block" />
                          ) : isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Circle className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                              Mark Read
                            </>
                          )}
                        </button>
                      </div>

                      {/* Material Action Links */}
                      <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 mt-4">
                        {studentStatus === 'Active' ? (
                          <>
                            <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl font-semibold select-none flex items-center gap-1">
                              🔒 Video recording unlocks after course completion
                            </span>

                            {lecture.notesUrl ? (
                              <a
                                href={lecture.notesUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100/50 text-emerald-650 px-3 py-2 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                Class PDF Notes
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {lecture.videoUrl ? (
                              <a
                                href={lecture.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-100/50 text-indigo-650 px-3 py-2 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5 text-indigo-500" />
                                Watch Recording
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl cursor-not-allowed font-semibold">
                                Recording pending upload
                              </span>
                            )}

                            {lecture.notesUrl ? (
                              <a
                                href={lecture.notesUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-100/50 text-emerald-650 px-3 py-2 rounded-xl text-[10px] font-bold transition active:scale-95 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-500" />
                                Class PDF Notes
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar Metadata Dashboard Panel (1/3 columns) */}
          <div className="space-y-6">
            
            {/* Status Panel Info card */}
            <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Curriculum Details
              </h4>
              
              <ul className="space-y-3.5 text-xs font-semibold">
                <li className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-450">Lecture Sessions</span>
                  <span className="font-bold text-slate-800">{batch.lectures.length} total</span>
                </li>
                <li className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-450">Completed Lessons</span>
                  <span className="font-bold text-slate-800">{completedLectures.length} finished</span>
                </li>
                <li className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-450">Whiteboard Handouts</span>
                  <span className="font-bold text-slate-800">
                    {batch.lectures.filter((l) => l.notesUrl).length} slide decks
                  </span>
                </li>
                <li className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-450">Stream Encryption</span>
                  <span className="font-extrabold text-emerald-600 uppercase tracking-wider">Enabled</span>
                </li>
              </ul>
              
              <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-150 text-[10px] text-slate-450 leading-relaxed font-semibold">
                🛡️ <strong>Secure Session Shield Active:</strong> Student classrooms block screenshots, print screen, layout focus losses, and overlays active watermarks automatically.
              </div>
            </div>

            {/* Live Widget Alert if cohort is streaming */}
            {studentStatus !== 'Completed' && batch.isLive && batch.liveRoomId ? (
              <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center gap-1.5 text-rose-600 text-[9px] font-bold uppercase tracking-widest">
                    <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
                    Lecture streaming now
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-800 leading-tight">
                    The lead instructor is conducting a live streaming session.
                  </h4>
                  <Link
                    href={`/classroom?room=${batch.liveRoomId}&role=student&username=${encodeURIComponent(username || 'Student')}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition active:scale-95 shadow-md shadow-rose-100"
                  >
                    <GraduationCap className="w-4 h-4" />
                    Enter Streaming Classroom
                  </Link>
                </div>
              </div>
            ) : null}
          </div>

        </div>
      </main>
    </div>
  );
}
