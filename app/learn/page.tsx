'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Video,
  ArrowRight,
  GraduationCap,
  ArrowLeft,
  LayoutDashboard,
  Calendar,
  Award,
  Settings as SettingsIcon,
  Users,
  Clock,
  Tv,
  CheckCircle,
  TrendingUp,
  FileCheck,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  User,
  Plus,
  HelpCircle,
  Sparkles,
  LogOut,
  MapPin,
  Camera,
  Layers,
  Edit2,
  RefreshCw
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

interface StudentProfile {
  id?: string;
  name: string;
  role: 'student' | 'instructor';
  title: string;
  avatarUrl: string;
  enrollmentDate: string;
  gpa: string;
  attendance: string;
  certificates: string;
  status?: string;
}

interface TimelineEvent {
  id: string;
  type: 'enroll' | 'watch' | 'badge';
  title: string;
  subtitle: string;
  timeString: string;
}

const CircularProgress = ({ percentage, size = 48, strokeWidth = 4 }: { percentage: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          className="text-slate-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-indigo-650 transition-all duration-500 ease-in-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800">
        {percentage}%
      </div>
    </div>
  );
};

export default function LearnDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [watchedLectures, setWatchedLectures] = useState<Record<string, string[]>>({});
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Tab/Subtab state
  const [activeTab, setActiveTab] = useState<'overview' | 'academic' | 'schedule' | 'achievements' | 'settings'>('academic');

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown states
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Student Profile Settings
  const [profile, setProfile] = useState<StudentProfile>({
    name: 'Alex Rivers',
    role: 'student',
    title: 'Computer Science Undergraduate',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    enrollmentDate: 'Enrolled: Sept 2022',
    gpa: '3.8',
    attendance: '94%',
    certificates: '5'
  });

  // Settings Edit States
  const [editName, setEditName] = useState(profile.name);
  const [editTitle, setEditTitle] = useState(profile.title);
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatarUrl);
  const [editGpa, setEditGpa] = useState(profile.gpa);
  const [editAttendance, setEditAttendance] = useState(profile.attendance);
  const [editCertificates, setEditCertificates] = useState(profile.certificates);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Load student profile details, enrollments, watched lectures, and timeline events
  // Load student profile details, enrollments, watched lectures, and timeline events in parallel
  const loadStudentData = async (studentName: string) => {
    try {
      const nameParam = encodeURIComponent(studentName);
      
      const [profRes, enrollRes, progressRes, timelineRes] = await Promise.all([
        fetch(`/api/student/profile?name=${nameParam}`),
        fetch(`/api/student/enrollments?name=${nameParam}`),
        fetch(`/api/student/progress?name=${nameParam}`),
        fetch(`/api/student/timeline?name=${nameParam}`)
      ]);

      if (profRes.ok) {
        const student = await profRes.json();
        setProfile(student);
        setEditName(student.name);
        setEditTitle(student.title);
        setEditAvatarUrl(student.avatarUrl);
        setEditGpa(student.gpa);
        setEditAttendance(student.attendance);
        setEditCertificates(student.certificates);

        // Sync local session cache
        localStorage.setItem('lms_user', JSON.stringify({
          name: student.name,
          role: student.role,
        }));
      }

      if (enrollRes.ok) {
        const enrollmentList = await enrollRes.json();
        setEnrolledIds(enrollmentList);
      }

      if (progressRes.ok) {
        const progressObj = await progressRes.json();
        setWatchedLectures(progressObj);
      }

      if (timelineRes.ok) {
        const timelineLogs = await timelineRes.json();
        setTimeline(timelineLogs);
      }
    } catch (e) {
      console.error('Error loading student profile details:', e);
    } finally {
      setProfileLoaded(true);
    }
  };

  const fetchBatchesAndData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/batches');
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
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
      fetchBatchesAndData();
      loadStudentData(parsed.name);
    } catch (e) {
      window.location.href = '/';
    }
  }, []);

  const handleEnroll = async (batchId: string) => {
    try {
      const res = await fetch('/api/student/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, batchId }),
      });
      if (res.ok) {
        await loadStudentData(profile.name);
      }
    } catch (e) {
      console.error('Failed to enroll in batch:', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/student/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          name: editName,
          title: editTitle,
          avatarUrl: editAvatarUrl,
          gpa: editGpa,
          attendance: editAttendance,
          certificates: editCertificates,
        }),
      });

      if (res.ok) {
        setSettingsSuccess(true);
        await loadStudentData(editName);
        setTimeout(() => setSettingsSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('lms_user');
    localStorage.removeItem('lms_enrollments');
    window.location.href = '/';
  };

  // Filter batches
  const enrolledBatches = batches.filter((b) => enrolledIds.includes(b.id));
  const libraryBatches = batches.filter((b) => !enrolledIds.includes(b.id) && !b.isUpcoming);

  const getEnrollmentInfo = (batchId: string) => {
    const enrollment = (profile as any).enrollments?.find((e: any) => e.batchId === batchId);
    if (!enrollment) return { isExpired: false, daysLeft: null, expiryDate: null };
    if (!enrollment.recordedAccessExpiresAt) return { isExpired: false, daysLeft: null, expiryDate: null };
    
    const expiry = new Date(enrollment.recordedAccessExpiresAt);
    const isExpired = new Date() > expiry;
    const daysLeft = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return { isExpired, daysLeft, expiryDate: expiry.toLocaleDateString() };
  };

  // Calculate batch progress percentage
  const getBatchProgress = (batch: Batch): number => {
    const watched = watchedLectures[batch.id] || [];
    if (batch.lectures.length === 0) return 0;
    return Math.round((watched.length / batch.lectures.length) * 100);
  };

  const dynamicTimeline = timeline;

  if (!isAuthorized || !profileLoaded) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] text-slate-800 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-650 animate-spin" />
          <span className="text-xs font-semibold text-slate-400">Verifying student credentials...</span>
        </div>
      </div>
    );
  }

  if (profile.status === 'Pending') {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans flex items-center justify-center relative p-4 select-none">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-indigo-500/5 z-0 pointer-events-none" />
        
        <div className="bg-white w-full max-w-lg p-8 border border-slate-200/80 rounded-3xl shadow-2xl relative z-10 space-y-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shadow-md animate-pulse mb-2">
            <span className="text-3xl font-sans font-bold">🔒</span>
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Portal Access Locked
            </h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
              Manual Payment Review Required
            </p>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed font-medium bg-slate-50 border border-slate-200/60 p-5 rounded-2xl text-left space-y-3.5">
            <p>
              Your admission request to <strong>Premier Tax Corporate & Accounting School</strong> has been received, but access to the learning portal is gated until manual fee verification is completed.
            </p>

            <div className="space-y-1.5 bg-white border border-slate-200/80 p-3.5 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">Your Unique Student ID</span>
              <span className="font-mono bg-slate-50 text-indigo-950 px-3 py-1.5 rounded text-sm select-all font-black block border border-slate-100">{profile.id}</span>
              <span className="text-[9px] text-slate-400 block font-medium">Use this ID for payment cross-checks & verification support.</span>
            </div>

            <p className="text-[10px] text-slate-400 font-semibold italic border-t border-slate-100 pt-3">
              💡 Please send your manual payment proof (bank receipt/deposit transaction) with your Student ID to the administration via WhatsApp to activate your account.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => loadStudentData(profile.name)}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-150 transition active:scale-95 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Check Approval Status
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
          
          <div className="text-center pt-2">
            <a
              href="https://wa.me/923001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition inline-flex items-center gap-1.5"
            >
              💬 Connect with Administration
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col overflow-hidden z-10 relative select-none">
      
      {/* ─── TOP NAVIGATION HEADER ─── */}
      <header className="h-16 border-b border-slate-200/80 bg-white flex items-center justify-between px-6 shrink-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-100">
            <GraduationCap className="w-5.5 h-5.5 text-white" />
          </div>
          <span className="text-xl font-extrabold text-indigo-950 tracking-tight">
            EduFlow <span className="text-indigo-600 font-semibold">Pro</span>
          </span>
        </div>

        {/* Middle Header Tabs */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-500">
          <button onClick={() => setActiveTab('academic')} className={`hover:text-indigo-600 transition ${activeTab === 'academic' ? 'text-indigo-600' : ''}`}>Dashboard</button>
          <button onClick={() => setActiveTab('overview')} className={`hover:text-indigo-600 transition ${activeTab === 'overview' ? 'text-indigo-600' : ''}`}>My Courses</button>
          <button onClick={() => setActiveTab('schedule')} className={`hover:text-indigo-600 transition ${activeTab === 'schedule' ? 'text-indigo-600' : ''}`}>Schedule</button>
          <button onClick={() => setActiveTab('achievements')} className={`hover:text-indigo-600 transition ${activeTab === 'achievements' ? 'text-indigo-600' : ''}`}>Achievements</button>
        </nav>

        {/* Right Header Search & Actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 pl-10 pr-4 py-2 bg-slate-100/80 border border-transparent rounded-full text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
            />
          </div>

          {/* Bell Icon Notification */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 relative transition-all active:scale-95"
            >
              <Bell className="w-5 h-5" />
              {batches.some(b => b.isLive) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border border-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-4">
                <span className="font-bold text-xs text-slate-800 block border-b border-slate-100 pb-2 mb-2">Live Session Alerts</span>
                <div className="space-y-2">
                  {batches.filter(b => b.isLive).map(b => (
                    <div key={b.id} className="flex gap-2.5 p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer">
                      <div className="w-7 h-7 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-700 font-bold">{b.title} is LIVE now!</p>
                        <span className="text-[9px] text-slate-400">Click to join streaming classroom</span>
                      </div>
                    </div>
                  ))}
                  {batches.filter(b => b.isLive).length === 0 && (
                    <p className="text-center text-xs text-slate-400 py-4 font-medium">No active streams at the moment</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-all"
            >
              <img
                src={profile.avatarUrl}
                alt="Student Avatar"
                className="w-8 h-8 rounded-full border border-slate-200 object-cover"
              />
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2">
                <div className="px-4 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800">{profile.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{profile.role} account</p>
                </div>
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    setActiveTab('settings');
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  My Profile
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── BODY CONTAINER (SIDEBAR + CONTENT) ─── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ─── SIDEBAR NAVIGATION ─── */}
        <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between py-6 px-4 shrink-0 h-full hidden lg:flex">
          <div className="space-y-6">
            
            {/* Quick Profile Panel */}
            <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50/50 border border-slate-200/40">
              <div className="relative">
                <img
                  src={profile.avatarUrl}
                  alt="Student Portrait"
                  className="w-16 h-16 rounded-full border-2 border-indigo-100 object-cover shadow-sm"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[9px] border border-white">
                  ✓
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-indigo-950 mt-2.5 leading-tight">{profile.name}</h4>
              <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{profile.title}</span>
              
              <button
                onClick={() => alert('Transcript requested! Ready to download via Settings when registrar reviews.')}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition mt-4"
              >
                Request Transcript
              </button>
            </div>

            {/* Sidebar Navigation Options */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-4">
                Student Menu
              </span>
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'overview'
                      ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className={`w-4 h-4 ${activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  Overview
                </button>

                <button
                  onClick={() => setActiveTab('academic')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'academic'
                      ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <GraduationCap className={`w-4 h-4 ${activeTab === 'academic' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  Academic Path
                </button>

                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'schedule'
                      ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Calendar className={`w-4 h-4 ${activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  Schedule
                </button>

                <button
                  onClick={() => setActiveTab('achievements')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'achievements'
                      ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Award className={`w-4 h-4 ${activeTab === 'achievements' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  Achievements
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                    activeTab === 'settings'
                      ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <SettingsIcon className={`w-4 h-4 ${activeTab === 'settings' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  Settings
                </button>
              </nav>
            </div>
          </div>
        </aside>

        {/* ─── SCROLLABLE PAGE CONTAINER ─── */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-16 bg-slate-50">
          
          {/* ─── PENDING APPROVAL WARNING HEADER BANNER ─── */}
          {profile.status === 'Pending' && (
            <div className="mb-6 bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-200 p-4.5 rounded-2xl flex items-start gap-3.5 shadow-sm text-xs font-bold text-amber-900 leading-relaxed max-w-4xl fade-in select-none">
              <span className="w-6.5 h-6.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-sm mt-0.5 text-base">
                ⚠️
              </span>
              <div>
                <span className="text-amber-800 font-extrabold text-sm block mb-0.5">Admission Form Under Office Review</span>
                Your application to Premier Tax Corporate & Accounting School is currently pending approval. 
                Our registry office is verifying your submitted CNIC, photographs, and paid fee receipts. 
                You can browse active learning stages and material, but editing profiles and requesting official certificates are restricted until approved.
              </div>
            </div>
          )}

          {/* ─── TAB: ACADEMIC PATH ─── */}
          {activeTab === 'academic' && (
            <div className="space-y-8 fade-in">
              
              {/* Header profile card block */}
              <div className="relative bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative">
                    <img
                      src={profile.avatarUrl}
                      alt="Student"
                      className="w-20 h-20 rounded-full object-cover border-2 border-indigo-50 shadow-inner"
                    />
                    <span className="absolute bottom-0.5 right-0.5 w-6 h-6 rounded-full bg-indigo-600 text-white border-2 border-white flex items-center justify-center text-[10px] shadow-sm">
                      ✓
                    </span>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-black text-indigo-950 tracking-tight leading-tight">{profile.name}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center justify-center sm:justify-start gap-1">
                      <GraduationCap className="w-4 h-4 text-indigo-500" />
                      {profile.title}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1.5">
                      {profile.enrollmentDate}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95 shadow-sm"
                >
                  <Edit2 className="w-4 h-4 text-slate-450" />
                  Edit Profile
                </button>
              </div>

              {/* Stats Counters Row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Completed Courses */}
                <div className="bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Completed Courses</span>
                    <p className="text-2xl font-black text-slate-805 mt-0.5">{enrolledBatches.filter(b => getBatchProgress(b) === 100).length || profile.certificates}</p>
                  </div>
                </div>

                {/* Current GPA */}
                <div className="bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-650 shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Current GPA</span>
                    <p className="text-2xl font-black text-slate-805 mt-0.5">{profile.gpa}</p>
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Attendance</span>
                    <p className="text-2xl font-black text-slate-805 mt-0.5">{profile.attendance}</p>
                  </div>
                </div>

                {/* Certificates */}
                <div className="bg-white border border-slate-200/50 rounded-xl p-5 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-650 shrink-0">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Certificates</span>
                    <p className="text-2xl font-black text-slate-805 mt-0.5">{profile.certificates}</p>
                  </div>
                </div>

              </div>

              {/* Split Content: Learning Progress and Timeline */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Column (2/3): Learning Progress */}
                <div className="xl:col-span-2 space-y-6 flex flex-col justify-start">
                  
                  <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm space-y-6 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-extrabold text-slate-850 tracking-tight">Learning Progress</h4>
                      <button onClick={() => setActiveTab('overview')} className="text-xs font-bold text-indigo-600 hover:text-indigo-850 hover:underline">
                        View All
                      </button>
                    </div>

                    <div className="space-y-4">
                      {enrolledBatches.map((batch) => {
                        const progress = getBatchProgress(batch);
                        const lastLecture = batch.lectures[batch.lectures.length - 1]?.title || 'Final Module';
                        const { isExpired, daysLeft } = getEnrollmentInfo(batch.id);
                        
                        return (
                          <div
                            key={batch.id}
                            className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 hover:border-slate-300 transition"
                          >
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                              <CircularProgress percentage={progress} size={50} />
                              <div className="truncate max-w-[280px]">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-extrabold text-slate-800 text-sm truncate">{batch.title}</h5>
                                  {profile.status === 'Completed' && (
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                      isExpired ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}>
                                      {isExpired ? 'Expired' : `${daysLeft}d left`}
                                    </span>
                                  )}
                                  {profile.status === 'Active' && (
                                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-105">
                                      Live Phase
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1 truncate">
                                  Next: {lastLecture}
                                </p>
                              </div>
                            </div>
                            
                            {isExpired ? (
                              <button
                                type="button"
                                disabled
                                className="w-full sm:w-auto text-center px-4 py-2 bg-slate-200 text-slate-400 font-bold text-xs rounded-xl cursor-not-allowed shrink-0 border border-slate-250"
                              >
                                Access Expired
                              </button>
                            ) : (
                              <Link
                                href={`/learn/${batch.id}`}
                                className="w-full sm:w-auto text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-100 hover:shadow-indigo-200 transition active:scale-95 shrink-0"
                              >
                                Continue Learning
                              </Link>
                            )}
                          </div>
                        );
                      })}

                      {enrolledBatches.length === 0 && (
                        <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                          <p className="text-xs font-bold text-slate-550">Not enrolled in any cohorts</p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">Explore the available catalog to join a class.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Achievements Grid Block (rendered under progress) */}
                  <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm space-y-6">
                    <h4 className="text-base font-extrabold text-slate-850 tracking-tight">Achievements Unlocked</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      
                      <div className={`border p-4 rounded-xl text-center space-y-2 transition ${
                        (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 1)
                          ? 'bg-amber-50/50 border-amber-200/60'
                          : 'bg-slate-50/40 border-slate-200/50 opacity-40'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                          (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 1)
                            ? 'bg-amber-50 text-amber-500'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Award className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-slate-800 text-xs block leading-tight">Fast Learner</span>
                        <span className="text-[9px] text-slate-400 block font-medium">
                          {Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 1 ? 'Unlocked' : 'Locked (Watch 1 Lesson)'}
                        </span>
                      </div>

                      <div className={`border p-4 rounded-xl text-center space-y-2 transition ${
                        (enrolledIds.length >= 2)
                          ? 'bg-blue-50/50 border-blue-200/60'
                          : 'bg-slate-50/40 border-slate-200/50 opacity-40'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                          (enrolledIds.length >= 2)
                            ? 'bg-blue-50 text-blue-500'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          <Users className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-slate-800 text-xs block leading-tight">Top Contributor</span>
                        <span className="text-[9px] text-slate-400 block font-medium">
                          {enrolledIds.length >= 2 ? 'Unlocked' : 'Locked (Join 2 Cohorts)'}
                        </span>
                      </div>

                      <div className={`border p-4 rounded-xl text-center space-y-2 transition ${
                        (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 5 || parseInt(profile.attendance) >= 95)
                          ? 'bg-emerald-50/50 border-emerald-200/60'
                          : 'bg-slate-50/40 border-slate-200/50 opacity-40'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                          (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 5 || parseInt(profile.attendance) >= 95)
                            ? 'bg-emerald-50 text-emerald-500'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          <CheckCircle className="w-5 h-5" />
                        </div>
                        <span className="font-extrabold text-slate-800 text-xs block leading-tight">Perfect Attendance</span>
                        <span className="text-[9px] text-slate-400 block font-medium">
                          {(Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 5 || parseInt(profile.attendance) >= 95) ? 'Unlocked' : 'Locked (Watch 5 Lessons)'}
                        </span>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Right Column (1/3): Academic Timeline */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col justify-start min-h-[400px]">
                  <h4 className="text-base font-extrabold text-slate-850 tracking-tight mb-6">Academic Timeline</h4>

                  <div className="relative border-l border-slate-100 pl-5.5 space-y-5.5 my-2 ml-2">
                    {dynamicTimeline.map((item) => (
                      <div key={item.id} className="relative">
                        <span className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                          item.type === 'enroll' ? 'bg-indigo-650' : item.type === 'watch' ? 'bg-emerald-500' : 'bg-purple-650'
                        }`} />
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{item.timeString}</span>
                          <h5 className="font-extrabold text-slate-800 text-xs mt-0.5">{item.title}</h5>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                            {item.subtitle}
                          </p>
                        </div>
                      </div>
                    ))}

                    {dynamicTimeline.length === 0 && (
                      <div className="text-center py-12 text-slate-400">
                        <Clock className="w-8 h-8 mx-auto text-slate-350 mb-1.5" />
                        <p className="text-xs font-semibold">Timeline registers empty</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ─── TAB: OVERVIEW (ALL AVAILABLE COURSE BATCHES) ─── */}
          {activeTab === 'overview' && (
            <div className="space-y-8 fade-in">
              <div>
                <h3 className="text-2xl font-extrabold text-indigo-950 tracking-tight leading-tight">My Courses</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Browse enrolled classes and join active live stages.</p>
              </div>

              {/* Enrolled Batches Grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Enrolled Batches ({enrolledBatches.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrolledBatches.map((batch) => (
                    <div key={batch.id} className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between h-72">
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Active Cohort</span>
                          {batch.isLive && (
                            <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold uppercase rounded animate-pulse">Live</span>
                          )}
                        </div>
                        <h5 className="font-extrabold text-slate-800 text-base line-clamp-1">{batch.title}</h5>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                          {batch.description || 'No batch description provided.'}
                        </p>
                      </div>

                      <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2 pt-4">
                        {batch.isLive && batch.liveRoomId ? (
                          <Link
                            href={`/classroom?room=${batch.liveRoomId}&role=student&username=${encodeURIComponent(profile?.name || 'Student')}`}
                            className="w-full text-center py-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-rose-500/20 transition active:scale-95"
                          >
                            Join Live Streaming Stage
                          </Link>
                        ) : batch.isUpcoming ? (
                          <div className="w-full text-center py-2 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-bold rounded-xl">
                            Launches: {batch.startDate || 'Soon'}
                          </div>
                        ) : (
                          <div className="w-full text-center py-2 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-xl border border-slate-200/50">
                            No Active Stream Session
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1.5">
                          <span className="font-semibold text-slate-400">{batch.lectures.length} Lectures</span>
                          <Link href={`/learn/${batch.id}`} className="text-indigo-650 hover:text-indigo-850 font-bold hover:underline flex items-center gap-0.5">
                            Curriculum <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Catalog (Library items to join) */}
              <div className="space-y-4 pt-4 border-t border-slate-200/60">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Available Library Batches ({libraryBatches.length})</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {libraryBatches.map((batch) => (
                    <div key={batch.id} className="bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between h-72">
                      <div className="p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Not Enrolled</span>
                          <span className="text-[9px] font-bold text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded-full">{batch.price}</span>
                        </div>
                        <h5 className="font-extrabold text-slate-800 text-base line-clamp-1">{batch.title}</h5>
                        <p className="text-xs text-slate-450 leading-relaxed line-clamp-3">
                          {batch.description || 'Unlock advanced educational material by enrolling.'}
                        </p>
                      </div>

                      <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <span className="font-bold text-slate-450 text-xs">{batch.lectures.length} lectures</span>
                        <button
                          onClick={() => handleEnroll(batch.id)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md shadow-indigo-100"
                        >
                          Enroll Now
                        </button>
                      </div>
                    </div>
                  ))}
                  {libraryBatches.length === 0 && (
                    <p className="text-xs font-medium text-slate-400">All available courses are added to your enrolled list.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ─── TAB: SCHEDULE ─── */}
          {activeTab === 'schedule' && (
            <div className="space-y-8 fade-in">
              <div>
                <h3 className="text-2xl font-extrabold text-indigo-950 tracking-tight leading-tight">Weekly Lecture Schedule</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Join upcoming classes and check time allocations.</p>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm min-h-[400px]">
                <div className="space-y-4">
                  {batches.filter(b => b.isUpcoming && b.startDate).map((batch) => (
                    <div key={batch.id} className="p-4 rounded-xl border border-slate-150 bg-slate-50/50 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                          <Calendar className="w-5.5 h-5.5" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-slate-800 text-sm">{batch.title}</h5>
                          <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">Start Date: {batch.startDate}</span>
                        </div>
                      </div>

                      {batch.isLive ? (
                        <Link
                          href={`/classroom?room=${batch.liveRoomId}&role=student&username=${encodeURIComponent(profile?.name || 'Student')}`}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition active:scale-95"
                        >
                          Join Live Now
                        </Link>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                          Pending Launch
                        </span>
                      )}
                    </div>
                  ))}

                  {batches.filter(b => b.isUpcoming && b.startDate).length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                      <Calendar className="w-12 h-12 text-slate-350 mx-auto mb-2.5" />
                      <p className="text-xs font-bold">No sessions scheduled for this week</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Check back later for scheduled cohorts.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: ACHIEVEMENTS ─── */}
          {activeTab === 'achievements' && (
            <div className="space-y-8 fade-in">
              <div>
                <h3 className="text-2xl font-extrabold text-indigo-950 tracking-tight leading-tight">Achievements & Badges</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Verify credentials and badges earned through progress.</p>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl p-8 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                
                <div className={`border p-6 rounded-2xl text-center space-y-3 hover:shadow-md transition ${
                  (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 1)
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-150 bg-slate-50/30 opacity-40'
                }`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                    (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 1)
                      ? 'bg-amber-50 text-amber-500'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Award className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Fast Learner</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Completed 1 curriculum lesson within the student portal.</p>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                    (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 1)
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-slate-500 bg-slate-100'
                  }`}>
                    {Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 1 ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <div className={`border p-6 rounded-2xl text-center space-y-3 hover:shadow-md transition ${
                  (enrolledIds.length >= 2)
                    ? 'border-blue-200 bg-blue-50/10'
                    : 'border-slate-150 bg-slate-50/30 opacity-40'
                }`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                    (enrolledIds.length >= 2)
                      ? 'bg-blue-50 text-blue-500'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Users className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Top Contributor</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Enrolled in 2 or more active batches to participate in peer cohorts.</p>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                    (enrolledIds.length >= 2)
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-500 bg-slate-100'
                  }`}>
                    {enrolledIds.length >= 2 ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

                <div className={`border p-6 rounded-2xl text-center space-y-3 hover:shadow-md transition ${
                  (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 5 || parseInt(profile.attendance) >= 95)
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-150 bg-slate-50/30 opacity-40'
                }`}>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto shadow-sm ${
                    (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 5 || parseInt(profile.attendance) >= 95)
                      ? 'bg-emerald-50 text-emerald-500'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Perfect Attendance</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">Attended all live classrooms or completed 5 recorded sessions.</p>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block ${
                    (Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 5 || parseInt(profile.attendance) >= 95)
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-slate-500 bg-slate-100'
                  }`}>
                    {(Object.values(watchedLectures).reduce((sum, list) => sum + list.length, 0) >= 5 || parseInt(profile.attendance) >= 95) ? 'Unlocked' : 'Locked'}
                  </span>
                </div>

              </div>
            </div>
          )}

          {/* ─── TAB: SETTINGS ─── */}
          {activeTab === 'settings' && (
            <div className="space-y-8 fade-in">
              <div>
                <h3 className="text-2xl font-extrabold text-indigo-950 tracking-tight leading-tight">Student Settings</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Update academic details, custom avatars, and profiles.</p>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl p-6 md:p-8 shadow-sm max-w-2xl">
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  
                  {/* Portrait Edit */}
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                    <img src={editAvatarUrl} alt="Avatar Edit Preview" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Avatar URL</label>
                      <input
                        type="url"
                        value={editAvatarUrl}
                        onChange={(e) => setEditAvatarUrl(e.target.value)}
                        className="w-80 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Academic Degree / Title</label>
                      <input
                        type="text"
                        required
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-slate-100 pt-5">
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Current GPA</label>
                      <input
                        type="text"
                        required
                        value={editGpa}
                        onChange={(e) => setEditGpa(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Attendance</label>
                      <input
                        type="text"
                        required
                        value={editAttendance}
                        onChange={(e) => setEditAttendance(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Certificates Count</label>
                      <input
                        type="text"
                        required
                        value={editCertificates}
                        onChange={(e) => setEditCertificates(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {settingsSuccess && (
                    <div className="text-xs p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold">
                      ✓ Profile details saved and synced dynamically!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={profile.status === 'Pending'}
                    className={`w-full py-3 text-white font-bold text-xs rounded-xl transition active:scale-95 ${
                      profile.status === 'Pending'
                        ? 'bg-slate-300 cursor-not-allowed shadow-none'
                        : 'bg-indigo-650 hover:bg-indigo-700 shadow-lg shadow-indigo-100 hover:-translate-y-0.5'
                    }`}
                  >
                    {profile.status === 'Pending' ? 'Locked (Pending Approval Review)' : 'Save Profile Settings'}
                  </button>

                </form>
              </div>
            </div>
          )}

        </main>
      </div>

    </div>
  );
}
