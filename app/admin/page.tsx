'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Video,
  VideoOff,
  BookOpen,
  FileText,
  LayoutDashboard,
  ExternalLink,
  ArrowRight,
  GraduationCap,
  RefreshCw,
  Bell,
  ChevronRight,
  ChevronDown,
  Download,
  Settings,
  LogOut,
  X,
  CheckCircle,
  UploadCloud,
  FileCheck,
  Menu,
  Search,
  Tv,
  Layers,
  Calendar,
  Zap,
  Award,
  TrendingUp,
  MapPin,
  Clock,
  Users
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

interface ActivityItem {
  id: string;
  type: 'batch_created' | 'lecture_published';
  title: string;
  subtitle: string;
  time: Date;
}

export default function AdminDashboard() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'batches' | 'courses' | 'live' | 'admissions'>('dashboard');

  // Selected batch for the detailed "Batches" view tab
  const [selectedDetailBatchId, setSelectedDetailBatchId] = useState<string>('');

  // Drawer modal state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'batch' | 'lecture'>('batch');

  // New Batch Form State
  const [batchTitle, setBatchTitle] = useState('');
  const [batchDescription, setBatchDescription] = useState('');
  const [batchCoverImage, setBatchCoverImage] = useState('');
  const [batchIsUpcoming, setBatchIsUpcoming] = useState(false);
  const [batchPrice, setBatchPrice] = useState('Free');
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchSuccess, setBatchSuccess] = useState(false);

  // New Lecture Form State
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDescription, setLectureDescription] = useState('');
  const [lectureVideoUrl, setLectureVideoUrl] = useState('');
  const [lectureNotesUrl, setLectureNotesUrl] = useState('');
  const [lectureError, setLectureError] = useState<string | null>(null);
  const [lectureSuccess, setLectureSuccess] = useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown states
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Mobile responsive menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Class scheduling modal states
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveClassTitle, setLiveClassTitle] = useState('');
  const [liveSelectedBatchId, setLiveSelectedBatchId] = useState('');
  const [liveInstructor, setLiveInstructor] = useState('');
  const [liveScheduledDate, setLiveScheduledDate] = useState('');
  const [liveScheduledTime, setLiveScheduledTime] = useState('');
  const [liveRecordingOption, setLiveRecordingOption] = useState(true);
  const [liveModalError, setLiveModalError] = useState<string | null>(null);
  const [liveModalSuccess, setLiveModalSuccess] = useState(false);

  // Admin Authentication States
  const [adminIsAuthenticated, setAdminIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);

  // Admissions State variables
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [admissionsLoading, setAdmissionsLoading] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any | null>(null);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionsSearchQuery, setAdmissionsSearchQuery] = useState('');
  const [admissionsStatusFilter, setAdmissionsStatusFilter] = useState('All');
  const [admissionsClassModeFilter, setAdmissionsClassModeFilter] = useState('All');
  const [admissionsError, setAdmissionsError] = useState<string | null>(null);
  const [admissionsSuccess, setAdmissionsSuccess] = useState(false);
  const [enrolledFilter, setEnrolledFilter] = useState<'all' | 'live' | 'recorded'>('all');

  const toggleDoc = (doc: string) => {
    setEditDocsReceived((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  const handleSignOut = () => {
    localStorage.removeItem('lms_user');
    setAdminIsAuthenticated(false);
  };

  // Admissions Editing States (Office Use Only)
  const [editStatus, setEditStatus] = useState('Pending');
  const [editClassMode, setEditClassMode] = useState('Online');
  const [editAdmissionFee, setEditAdmissionFee] = useState('');
  const [editDiscount, setEditDiscount] = useState('');
  const [editNetPayable, setEditNetPayable] = useState('');
  const [editAdmissionDate, setEditAdmissionDate] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('Cash');
  const [editRemarks, setEditRemarks] = useState('');
  const [editDocsReceived, setEditDocsReceived] = useState<string[]>([]);
  const [editDesiredCourseId, setEditDesiredCourseId] = useState('');

  // Handle Admin Log In Authentication
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: adminUsername.trim(),
          password: adminPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.role !== 'instructor') {
        throw new Error('Access Denied: Instructor role required');
      }

      localStorage.setItem('lms_user', JSON.stringify({ name: data.name, role: data.role }));
      setAdminIsAuthenticated(true);
      setAdminUsername('');
      setAdminPassword('');
    } catch (err) {
      setAdminAuthError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  // Fetch admissions
  const fetchAdmissions = useCallback(async () => {
    try {
      setAdmissionsLoading(true);
      const res = await fetch('/api/admin/admissions');
      if (res.ok) {
        const data = await res.json();
        setAdmissions(data);
      }
    } catch (err) {
      console.error('Failed to load admissions:', err);
    } finally {
      setAdmissionsLoading(false);
    }
  }, []);

  // Update specific student admission form status/fee registry parameters
  const handleSaveAdmission = async (e?: React.FormEvent, forceStatus?: string) => {
    if (e) e.preventDefault();
    if (!selectedAdmission) return;
    setAdmissionsError(null);
    setAdmissionsSuccess(false);

    const targetStatus = forceStatus || editStatus;

    try {
      const selectedCourseId = editDesiredCourseId || selectedAdmission?.enrollments?.[0]?.batchId || '';
      const admissionPayload = {
        userId: selectedAdmission.id,
        status: targetStatus,
        desiredCourseId: selectedCourseId,
        name: selectedAdmission.name || '',
        email: selectedAdmission.email || '',
        password: selectedAdmission.password || '',
        fatherName: selectedAdmission.fatherName || '',
        cnic: selectedAdmission.cnic || '',
        dateOfBirth: selectedAdmission.dateOfBirth || '',
        gender: selectedAdmission.gender || '',
        whatsapp: selectedAdmission.whatsapp || '',
        postalAddress: selectedAdmission.postalAddress || '',
        lastQual: selectedAdmission.lastQual || '',
        passingYear: selectedAdmission.passingYear || '',
        institute: selectedAdmission.institute || '',
        emergencyName: selectedAdmission.emergencyName || '',
        emergencyRel: selectedAdmission.emergencyRel || '',
        emergencyPhone: selectedAdmission.emergencyPhone || '',
        batchName: selectedAdmission.batchName || selectedAdmission?.enrollments?.[0]?.batch?.title || '',
        selectedCourses: selectedCourseId,
      };

      const res = await fetch('/api/admin/admissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(admissionPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update admission details');
      }

      if (forceStatus) {
        setEditStatus(forceStatus);
      }
      setAdmissionsSuccess(true);
      fetchAdmissions();
      setTimeout(() => {
        setShowAdmissionModal(false);
        setAdmissionsSuccess(false);
        setSelectedAdmission(null);
      }, 1200);
    } catch (err) {
      setAdmissionsError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  // Select a student to populate edit state
  const handleSelectAdmission = (admission: any) => {
    setSelectedAdmission(admission);
    setEditStatus(admission.status || 'Pending');
    setEditClassMode(admission.classMode || 'Online');
    setEditAdmissionFee(admission.admissionFee || '');
    setEditDiscount(admission.discount || '');
    setEditNetPayable(admission.netPayable || '');
    setEditAdmissionDate(admission.admissionDate || new Date().toISOString().split('T')[0]);
    setEditPaymentMethod(admission.paymentMethod || 'Cash');
    setEditRemarks(admission.remarks || '');
    setEditDocsReceived(admission.docsReceived ? admission.docsReceived.split(',') : []);
    
    // Set initially enrolled batch course
    const activeEnrollment = admission.enrollments?.[0];
    setEditDesiredCourseId(activeEnrollment?.batchId || '');
    
    setAdmissionsError(null);
    setAdmissionsSuccess(false);
    setShowAdmissionModal(true);
  };

  // Fetch batches
  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/Batches');
      const data = await res.json();
      if (res.ok && data.success) {
        const batchList = data.batches || [];
        setBatches(batchList);
        if (batchList.length > 0) {
          if (!selectedBatchId) {
            setSelectedBatchId(batchList[0].id);
          }
          if (!selectedDetailBatchId) {
            setSelectedDetailBatchId(batchList[0].id);
          }
          if (!liveSelectedBatchId) {
            setLiveSelectedBatchId(batchList[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId, selectedDetailBatchId, liveSelectedBatchId]);

  useEffect(() => {
    // Check local storage session for instructor credentials
    const savedUser = localStorage.getItem('lms_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'instructor') {
          setAdminIsAuthenticated(true);
        }
      } catch (e) {}
    }
    fetchBatches();
    fetchAdmissions();
  }, [fetchBatches, fetchAdmissions]);

  // Handle Create Batch
  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBatchError(null);
    setBatchSuccess(false);

    if (!batchTitle.trim()) {
      setBatchError('Title is required');
      return;
    }

    try {
      const res = await fetch('/api/admin/Batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: batchTitle.trim(),
          description: batchDescription.trim() || undefined,
          duration: batchPrice.trim() || 'Free',
          startDate: batchIsUpcoming ? (batchStartDate.trim() || undefined) : undefined,
          status: batchIsUpcoming ? 'upcoming' : 'active',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to create batch');
      }

      setBatchSuccess(true);
      setBatchTitle('');
      setBatchDescription('');
      setBatchCoverImage('');
      setBatchIsUpcoming(false);
      setBatchPrice('Free');
      setBatchStartDate('');
      
      // Refresh list
      fetchBatches();
      
      // Auto close drawer after short delay
      setTimeout(() => {
        setIsDrawerOpen(false);
        setBatchSuccess(false);
      }, 1500);
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  // Handle Create Lecture
  const handleCreateLecture = async (e: React.FormEvent) => {
    e.preventDefault();
    setLectureError(null);
    setLectureSuccess(false);

    if (!selectedBatchId) {
      setLectureError('Please select a course batch');
      return;
    }
    if (!lectureTitle.trim()) {
      setLectureError('Lecture title is required');
      return;
    }

    try {
      const res = await fetch(`/api/admin/Batches/${selectedBatchId}/lectures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lectureTitle.trim(),
          description: lectureDescription.trim() || undefined,
          videoUrl: lectureVideoUrl.trim() || undefined,
          notesUrl: lectureNotesUrl.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to add lecture');
      }

      setLectureSuccess(true);
      setLectureTitle('');
      setLectureDescription('');
      setLectureVideoUrl('');
      setLectureNotesUrl('');
      
      // Refresh list
      fetchBatches();
      
      // Auto close drawer after short delay
      setTimeout(() => {
        setIsDrawerOpen(false);
        setLectureSuccess(false);
      }, 1500);
    } catch (err) {
      setLectureError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  // Toggle Live State
  const handleToggleLive = async (batchId: string, currentLiveState: boolean) => {
    const nextState = !currentLiveState;
    setActionLoading(batchId);

    try {
      const res = await fetch(`/api/admin/Batches/${batchId}/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLive: nextState }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to toggle live state');
      }

      // Update local state directly
      setBatches((prev) =>
        prev.map((b) => (b.id === batchId ? { ...b, isLive: nextState, liveRoomId: data.liveRoomId } : b))
      );

      // If going live, open the classroom in a new tab as instructor
      if (nextState && data.liveRoomId) {
        window.open(`/classroom?room=${data.liveRoomId}&role=instructor&username=Instructor`, '_blank');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update live status');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Schedule Live Class Form Submission
  const handleScheduleLiveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLiveModalError(null);
    setLiveModalSuccess(false);

    if (!liveClassTitle.trim()) {
      setLiveModalError('Class title is required');
      return;
    }
    if (!liveSelectedBatchId) {
      setLiveModalError('Please select a course batch');
      return;
    }
    if (!liveScheduledDate) {
      setLiveModalError('Please select a scheduled date');
      return;
    }
    if (!liveScheduledTime) {
      setLiveModalError('Please select a scheduled time');
      return;
    }

    try {
      const scheduledStartString = `${liveScheduledDate} at ${liveScheduledTime}`;

      // Update the Batch metadata to show it is upcoming with start date
      const resBatch = await fetch(`/api/admin/Batches/${liveSelectedBatchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'upcoming',
          startDate: scheduledStartString,
        }),
      });

      if (!resBatch.ok) {
        const data = await resBatch.json();
        throw new Error(data.message || data.error || 'Failed to update batch schedule');
      }

      // Also publish a scheduled lecture item in the database
      const resLecture = await fetch(`/api/admin/Batches/${liveSelectedBatchId}/lectures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Scheduled Live Session: ${liveClassTitle}`,
          description: `Host Instructor: ${liveInstructor || 'Dr. Michael Chen'}. Scheduled for ${liveScheduledDate} at ${liveScheduledTime}. Automatic cloud recording: ${liveRecordingOption ? 'Enabled' : 'Disabled'}.`,
        }),
      });

      if (!resLecture.ok) {
        const data = await resLecture.json();
        throw new Error(data.message || data.error || 'Failed to publish live session materials');
      }

      setLiveModalSuccess(true);
      setLiveClassTitle('');
      setLiveInstructor('');
      setLiveScheduledDate('');
      setLiveScheduledTime('');
      setLiveRecordingOption(true);

      // Refresh list
      fetchBatches();

      // Auto close modal after brief delay
      setTimeout(() => {
        setIsLiveModalOpen(false);
        setLiveModalSuccess(false);
      }, 1500);

    } catch (err) {
      setLiveModalError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  // Handle cancel scheduled class
  const handleCancelLiveClass = async (batchId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled live session?')) return;
    setActionLoading(batchId);

    try {
      const res = await fetch(`/api/admin/Batches/${batchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'active',
          startDate: null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Failed to cancel session');
      }

      fetchBatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel session');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete Batch
  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to delete this batch directory? This action is irreversible.')) return;
    setActionLoading(batchId);

    try {
      const res = await fetch(`/api/admin/Batches/${batchId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete batch');
      }

      fetchBatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoading(null);
    }
  };

  // Dynamic calculations for Stats
  const liveCount = batches.filter((b) => b.isLive).length;
  const totalLectures = batches.reduce((sum, b) => sum + b.lectures.length, 0);

  // Generate real activities from DB entities
  const getActivities = (): ActivityItem[] => {
    const list: ActivityItem[] = [];
    batches.forEach((b) => {
      list.push({
        id: `batch-${b.id}`,
        type: 'batch_created',
        title: `Batch created: ${b.title}`,
        subtitle: `Price: ${b.price}`,
        time: new Date(b.createdAt)
      });
      b.lectures.forEach((l) => {
        list.push({
          id: `lecture-${l.id}`,
          type: 'lecture_published',
          title: `Lecture published: ${l.title}`,
          subtitle: `Added to ${b.title}`,
          time: new Date(l.createdAt)
        });
      });
    });
    return list.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5);
  };

  const dynamicActivities = getActivities();

  // Helper for time ago format
  const getTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Real data export JSON anchor download
  const handleExportData = () => {
    if (batches.length === 0) {
      alert('No database data available to export.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(batches, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'eduflow_catalog_report.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Retrieve current batch selection for detailed view
  const currentBatch = batches.find((b) => b.id === selectedDetailBatchId) || batches[0] || null;
  
  const currentTitle = currentBatch ? currentBatch.title : "No Active Batch";
  const currentSubtitle = currentBatch && currentBatch.description ? currentBatch.description : "Please select or create a course batch first.";
  const currentCode = currentBatch ? `BATCH-${currentBatch.id.substring(0, 5).toUpperCase()}` : "N/A";
  const currentStartDate = currentBatch && currentBatch.startDate ? currentBatch.startDate : "Immediate / Self-Paced";

  if (!adminIsAuthenticated) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans flex items-center justify-center relative p-4 select-none">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-emerald-500/5 z-0 pointer-events-none" />
        
        {/* Floating particles */}
        <div className="fixed inset-0 pointer-events-none z-0">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-indigo-500/5 animate-pulse"
              style={{
                width: `${10 + i * 5}px`,
                height: `${10 + i * 5}px`,
                top: `${20 + i * 15}%`,
                left: `${15 + i * 15}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>

        <div className="bg-white w-full max-w-md p-8 border border-slate-200/80 rounded-3xl shadow-2xl relative z-10 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-150 mb-4">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-black text-indigo-950 tracking-tight leading-tight">Premier School</h2>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest mt-1">Admin Portal Log In</p>
          </div>

          {adminAuthError && (
            <div className="text-xs p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-bold text-center">
              ⚠️ {adminAuthError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono">
                Admin Username
              </label>
              <input
                type="text"
                required
                placeholder="Enter username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono">
                Secret Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <button
              type="submit"
              disabled={adminAuthLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {adminAuthLoading ? (
                <span className="spinner border-white border-t-transparent w-4 h-4" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
          
          <div className="text-center">
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-slate-650 transition"
            >
              ← Back to Main Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#f8fafc] text-slate-800 font-sans flex overflow-hidden z-10 relative select-none">
      
      {/* ─── LEFT SIDEBAR MENU (DESKTOP) ─── */}
      <aside className="w-64 border-r border-slate-200/80 bg-white flex flex-col justify-between py-6 px-4 shrink-0 h-full hidden lg:flex">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-100">
              <GraduationCap className="w-5.5 h-5.5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-indigo-950 tracking-tight">
              EduFlow <span className="text-indigo-600 font-semibold">Pro</span>
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-4">
              Main Menu
            </span>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Dashboard
              </button>

              <button
                onClick={() => setActiveTab('batches')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'batches'
                    ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Layers className={`w-4 h-4 ${activeTab === 'batches' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Batches
              </button>

              <button
                onClick={() => setActiveTab('courses')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'courses'
                    ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <BookOpen className={`w-4 h-4 ${activeTab === 'courses' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Course Library
              </button>

              <button
                onClick={() => setActiveTab('live')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'live'
                    ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Tv className={`w-4 h-4 ${activeTab === 'live' ? 'text-indigo-600' : 'text-slate-400'}`} />
                Live Sessions
              </button>

              <button
                onClick={() => setActiveTab('admissions')}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                  activeTab === 'admissions'
                    ? 'bg-indigo-50/80 text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Users className={`w-4 h-4 ${activeTab === 'admissions' ? 'text-indigo-600' : 'text-slate-450'}`} />
                Admissions Registry
              </button>
            </nav>
          </div>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => alert('Settings opened')}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            Settings
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            Sign Out
          </button>
        </div>
      </aside>      {/* ─── MOBILE RESPONSIVE SIDEBAR OVERLAY ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 bg-white h-full flex flex-col justify-between py-6 px-4 shadow-xl z-10 transition-all">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                    <GraduationCap className="w-4.5 h-4.5" />
                  </div>
                  <span className="text-base font-extrabold text-indigo-950">EduFlow Pro</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 block mb-4">
                  Main Menu
                </span>
                <nav className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveTab('dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                      activeTab === 'dashboard'
                        ? 'bg-indigo-50/80 text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('batches');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                      activeTab === 'batches'
                        ? 'bg-indigo-50/80 text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Batches
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('courses');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                      activeTab === 'courses'
                        ? 'bg-indigo-50/80 text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    Course Library
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('live');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                      activeTab === 'live'
                        ? 'bg-indigo-50/80 text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Tv className="w-4 h-4" />
                    Live Sessions
                  </button>

                  <button
                    onClick={() => {
                      setActiveTab('admissions');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold transition ${
                      activeTab === 'admissions'
                        ? 'bg-indigo-50/80 text-indigo-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    Admissions Registry
                  </button>
                </nav>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  alert('Settings opened');
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ─── MAIN CONTENT WRAPPER ─── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        
        {/* Simple Panel Header (Hosts Search, Notifications, Profile) */}
        <header className="h-16 border-b border-slate-200/60 bg-white flex items-center justify-between px-6 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger for mobile screens */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-500 lg:hidden transition active:scale-95"
            >
              <Menu className="w-5.5 h-5.5" />
            </button>
            
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search analytics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 pl-10 pr-4 py-2 bg-slate-100/80 border border-transparent rounded-full text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-200 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-800 relative transition-all active:scale-95"
              >
                <Bell className="w-5 h-5" />
                {dynamicActivities.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border border-white" />
                )}
              </button>
              
              {notificationsOpen && (
                <div className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                    <span className="font-bold text-xs text-slate-800">Recent Activity Updates</span>
                  </div>
                  <div className="space-y-2">
                    {dynamicActivities.slice(0, 3).map((act) => (
                      <div key={act.id} className="flex gap-2.5 p-2 hover:bg-slate-50 rounded-xl transition cursor-pointer">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          act.type === 'batch_created' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {act.type === 'batch_created' ? <BookOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-700 font-medium">{act.title}</p>
                          <span className="text-[9px] text-slate-400">{getTimeAgo(act.time)}</span>
                        </div>
                      </div>
                    ))}
                    {dynamicActivities.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-4 font-medium">No new activity notifications</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-all"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                  alt="Avatar"
                  className="w-8 h-8 rounded-full border border-slate-200/50 object-cover"
                />
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2.5 w-48 bg-white border border-slate-200/80 rounded-2xl shadow-xl z-50 py-2">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-800">Admin Account</p>
                    <p className="text-[10px] text-slate-400">admin@eduflow.pro</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      setActiveTab('dashboard');
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    My Profile
                  </button>
                  <Link
                    href="/learn"
                    className="block text-left px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    Student Portal
                  </Link>
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false);
                        handleSignOut();
                      }}
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

      {/* ─── SCROLLABLE PAGE CONTAINER ─── */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-16">
        
        {/* ─── activeTab === 'dashboard' ─── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 fade-in">
            
            {/* Header Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                  <span>Admin</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-500">Dashboard</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-950 tracking-tight leading-tight">
                  Dashboard Overview
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                  Here is the real-time status of your LMS directories.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportData}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/40 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  Export Catalog
                </button>
                <button
                  onClick={() => {
                    setDrawerTab('batch');
                    setIsDrawerOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Create Course
                </button>
              </div>
            </div>

            {/* 3 Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: ACTIVE COURSES */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Courses
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">{batches.length}</h4>
                    <span className="text-[10px] font-semibold text-indigo-600 flex items-center gap-1 mt-1">
                      <ArrowRight className="w-3 h-3 rotate-45" />
                      Live counts <span className="text-slate-400 font-medium">from catalog</span>
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                    <BookOpen className="w-4 h-4" />
                  </div>
                </div>
                {/* Wave Sparkline */}
                <div className="h-8 mt-2 w-full flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                      d="M0 25 C10 23, 20 18, 30 24 C40 30, 50 10, 60 12 C70 14, 80 5, 90 20 L100 8"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 2: PUBLISHED LECTURES */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Published Lectures
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">{totalLectures}</h4>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      <ArrowRight className="w-3 h-3 rotate-45" />
                      Lesson items <span className="text-slate-400 font-medium">attached</span>
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                    <FileCheck className="w-4.5 h-4.5" />
                  </div>
                </div>
                {/* Wave Sparkline */}
                <div className="h-8 mt-2 w-full flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                      d="M0 22 C15 25, 30 28, 45 20 C60 12, 75 14, 90 28 L100 18"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

              {/* Card 3: LIVE ROOMS */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Live Rooms Active
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">{liveCount}</h4>
                    {liveCount > 0 ? (
                      <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1.5 mt-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        Live streaming active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-1">
                        All channels offline
                      </span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                    <Tv className="w-4 h-4" />
                  </div>
                </div>
                {/* Wave Sparkline */}
                <div className="h-8 mt-2 w-full flex items-end">
                  <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                    <path
                      d="M0 28 C20 28, 40 22, 60 27 C80 32, 90 15, 100 24"
                      fill="none"
                      stroke="#f43f5e"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>

            </div>

            {/* Catalog Summary & Side Columns Split Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* LMS Course Catalog Table (2/3 Left Column) */}
              <div className="xl:col-span-2 bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 tracking-tight">
                      LMS Course Catalog Summary
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Quick status checklist of all registered directories.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    View All
                  </button>
                </div>

                {batches.length === 0 ? (
                  <div className="text-center py-20 border border-dashed border-slate-200 rounded-xl my-4">
                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                    <p className="text-xs text-slate-500 font-bold">No course categories found</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Click "Create Course" to initialize a batch.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto my-2">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-3">Course Batch</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Price</th>
                          <th className="py-2.5 px-3">Lectures</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {batches.slice(0, 5).map((batch) => (
                          <tr key={batch.id} className="hover:bg-slate-50/80 transition">
                            <td className="py-3.5 px-3">
                              <span className="font-bold text-slate-850 block text-[13px]">{batch.title}</span>
                              <span className="text-[10px] text-slate-400 truncate max-w-xs block mt-0.5">{batch.description || 'No description provided'}</span>
                            </td>
                            <td className="py-3.5 px-3">
                              {batch.isLive ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-[9px] font-bold uppercase animate-pulse">Live</span>
                              ) : batch.isUpcoming ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[9px] font-bold uppercase">Upcoming</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-bold uppercase">Offline</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 font-semibold text-slate-600">{batch.price}</td>
                            <td className="py-3.5 px-3 font-bold text-slate-700">{batch.lectures.length}</td>
                            <td className="py-3.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedDetailBatchId(batch.id);
                                  setActiveTab('batches');
                                }}
                                className="text-indigo-600 font-bold hover:text-indigo-850 hover:underline"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Live Now & Recent Activity Sidebar (1/3 Right Column) */}
              <div className="space-y-6 flex flex-col">
                
                {/* Live Now Card */}
                <div className="bg-[#4f46e5] text-white rounded-2xl p-5 shadow-lg shadow-indigo-100 flex flex-col justify-between min-h-60 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent pointer-events-none" />
                  
                  <div className="flex items-center justify-between z-10">
                    <span className="text-xs font-extrabold tracking-wide uppercase">Live Streams</span>
                    <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-full font-bold">
                      {liveCount} Active
                    </span>
                  </div>

                  {/* Sessions List */}
                  <div className="space-y-3.5 my-5 z-10">
                    
                    {/* Render active live streams from database */}
                    {batches.filter((b) => b.isLive).map((batch) => (
                      <div key={batch.id} className="flex items-center justify-between bg-white/10 hover:bg-white/15 transition border border-white/5 p-2.5 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white">
                            <Video className="w-4.5 h-4.5" />
                          </div>
                          <div className="truncate max-w-40">
                            <p className="text-[11px] font-bold leading-tight truncate">{batch.title}</p>
                            <span className="text-[9px] text-indigo-200">Live Broadcasting</span>
                          </div>
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      </div>
                    ))}

                    {/* Placeholder when none is live */}
                    {liveCount === 0 && (
                      <div className="text-center py-8 text-indigo-200/80 bg-white/5 rounded-xl border border-white/5">
                        <Tv className="w-8 h-8 mx-auto text-indigo-300 opacity-60 mb-2" />
                        <p className="text-[10px] font-semibold leading-tight">No active streams</p>
                        <span className="text-[8px] text-indigo-300 mt-0.5 block">Go to Course Library to launch a live room.</span>
                      </div>
                    )}

                  </div>

                  <button
                    onClick={() => setActiveTab('courses')}
                    className="w-full text-center py-2 border border-white/30 hover:border-white/60 rounded-xl text-[11px] font-bold text-white tracking-wider transition bg-white/5 hover:bg-white/10 z-10 active:scale-95"
                  >
                    Manage Streams
                  </button>
                </div>

                {/* Recent Activity Card */}
                <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-800 mb-4 tracking-tight">
                      Recent Activity Logs
                    </h3>
                    
                    <div className="space-y-4">
                      
                      {/* Render dynamic DB events */}
                      {dynamicActivities.map((act) => (
                        <div key={act.id} className="flex gap-3">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                            act.type === 'batch_created' ? 'bg-indigo-50 text-indigo-650' : 'bg-emerald-50 text-emerald-650'
                          }`}>
                            {act.type === 'batch_created' ? <Plus className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-[11px] text-slate-600 font-medium leading-normal">
                              {act.title} <span className="text-slate-400 text-[10px] block mt-0.5">{act.subtitle}</span>
                            </p>
                            <span className="text-[9px] text-slate-400">{getTimeAgo(act.time)}</span>
                          </div>
                        </div>
                      ))}

                      {/* Fallback placeholder when no logs */}
                      {dynamicActivities.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                          <FileText className="w-8 h-8 mx-auto text-slate-300 mb-1.5" />
                          <p className="text-[10px] font-semibold">No activity registered</p>
                          <span className="text-[8px] text-slate-400">Database changes will appear here.</span>
                        </div>
                      )}

                    </div>
                  </div>

                  <button
                    onClick={() => alert('No system logs configured.')}
                    className="w-full text-center text-[11px] font-bold text-indigo-600 hover:text-indigo-850 transition pt-5 border-t border-slate-100 mt-4"
                  >
                    View System Logs
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─── activeTab === 'batches' (Web Architects Pro Mockup / DB Batch details) ─── */}
        {activeTab === 'batches' && batches.length === 0 && (
          <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200/50 rounded-2xl shadow-sm my-8 text-center max-w-2xl mx-auto">
            <Layers className="w-16 h-16 text-indigo-100 mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No active batches</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              You have not created any course batches yet. Head over to the Course Library to set up your first batch directory.
            </p>
            <button
              onClick={() => setActiveTab('courses')}
              className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition active:scale-95 shadow-md shadow-indigo-100"
            >
              Go to Course Library
            </button>
          </div>
        )}

        {activeTab === 'batches' && batches.length > 0 && (
          <div className="space-y-8 fade-in">
            
            {/* Header Title Row with Selection Dropdown */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                  <span>Admin</span>
                  <ChevronRight className="w-3 h-3" />
                  <span>Batches</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-500">{currentTitle}</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-950 tracking-tight leading-tight">
                  Batch Details
                </h2>
              </div>

              {/* Course Batch Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Batch:</span>
                <select
                  value={selectedDetailBatchId}
                  onChange={(e) => setSelectedDetailBatchId(e.target.value)}
                  className="bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold px-3.5 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-sm"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Banner Section */}
            <div className="relative h-52 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
              <img
                src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80"
                className="absolute inset-0 w-full h-full object-cover"
                alt="Banner Background"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent" />
              
              <div className="absolute inset-0 p-6 flex flex-col justify-between z-10 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold tracking-widest uppercase bg-indigo-600/80 px-2.5 py-1 rounded">
                    Batch Code: {currentCode}
                  </span>
                  <span className="text-[10px] font-extrabold bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {currentBatch && currentBatch.isLive ? 'Live Streaming' : 'Active'}
                  </span>
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-black tracking-tight">{currentTitle}</h3>
                  <p className="text-xs text-slate-300 mt-1 font-medium">{currentSubtitle}</p>
                </div>
              </div>
            </div>

            {/* Course Meta Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              
              <div className="bg-white border border-slate-200/50 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Start Date</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{currentStartDate}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Price Tier</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{currentBatch ? currentBatch.price : 'Free'}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Curriculum</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{currentBatch ? `${currentBatch.lectures.length} Lectures` : '0 Lectures'}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {currentBatch ? (currentBatch.isLive ? 'Live Now' : currentBatch.isUpcoming ? 'Upcoming' : 'Offline') : 'Offline'}
                  </p>
                </div>
              </div>

            </div>

            {/* Split layout: Enrolled Students and Weekly Schedule */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column (2/3): Enrolled Students */}
              <div className="xl:col-span-2 bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col justify-start min-h-[320px]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-850 tracking-tight flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Enrolled Cohort Roster ({
                        admissions.filter((student) =>
                          student.enrollments?.some((e: any) => e.batchId === currentBatch?.id)
                        ).length
                      })
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Students enrolled in this course batch</span>
                  </div>

                  {/* Filter Sub-Tabs */}
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-150 p-1 rounded-xl shrink-0">
                    <button
                      onClick={() => setEnrolledFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition ${
                        enrolledFilter === 'all'
                          ? 'bg-white border border-slate-200/60 text-indigo-650 shadow-sm'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setEnrolledFilter('live')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition ${
                        enrolledFilter === 'live'
                          ? 'bg-white border border-slate-200/60 text-indigo-650 shadow-sm'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      Live Phase
                    </button>
                    <button
                      onClick={() => setEnrolledFilter('recorded')}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition ${
                        enrolledFilter === 'recorded'
                          ? 'bg-white border border-slate-200/60 text-indigo-650 shadow-sm'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      Recorded Phase
                    </button>
                  </div>
                </div>

                {(() => {
                  const enrolledStudents = admissions.filter((student) =>
                    student.enrollments?.some((e: any) => e.batchId === currentBatch?.id)
                  );
                  const filteredEnrolledStudents = enrolledStudents.filter((student) => {
                    if (enrolledFilter === 'all') return true;
                    if (enrolledFilter === 'live') return student.status === 'Active';
                    if (enrolledFilter === 'recorded') return student.status === 'Completed';
                    return true;
                  });

                  if (filteredEnrolledStudents.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 flex-grow border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                        <Users className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-xs font-semibold text-slate-550 font-bold">No students found</p>
                        <span className="text-[10px] text-slate-400 max-w-xs block mt-1">
                          No matching student profiles were found for the selected enrollment filter.
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-extrabold text-[10px] uppercase tracking-wider">
                            <th className="pb-3 pr-4 font-extrabold">Student Detail</th>
                            <th className="pb-3 px-4 font-extrabold">Class Mode</th>
                            <th className="pb-3 px-4 font-extrabold">Course Phase / Expiry</th>
                            <th className="pb-3 pl-4 text-right font-extrabold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEnrolledStudents.map((student) => {
                            const enrollment = student.enrollments?.find((e: any) => e.batchId === currentBatch?.id);
                            const expiryDate = enrollment?.recordedAccessExpiresAt ? new Date(enrollment.recordedAccessExpiresAt) : null;
                            const isExpired = expiryDate ? new Date() > expiryDate : false;
                            const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

                            return (
                              <tr key={student.id} className="border-b border-slate-100/60 hover:bg-slate-50/40 transition">
                                <td className="py-3 pr-4">
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={student.avatarUrl}
                                      alt="Student Avatar"
                                      className="w-9 h-9 rounded-xl border border-slate-200 object-cover shadow-sm shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <span className="font-extrabold text-slate-800 block truncate">{student.name}</span>
                                      <span className="font-mono text-[9px] bg-slate-150 text-slate-600 px-1.5 py-0.5 rounded select-all font-semibold inline-block mt-0.5 leading-none">
                                        {student.id}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${
                                    student.classMode === 'Physical'
                                      ? 'bg-amber-50 border-amber-100 text-amber-600'
                                      : 'bg-indigo-50 border-indigo-100 text-indigo-650'
                                  }`}>
                                    {student.classMode || 'Online'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="space-y-1">
                                    {student.status === 'Active' && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-50 border border-indigo-150 text-indigo-650">
                                        Live Phase (Active)
                                      </span>
                                    )}
                                    {student.status === 'Completed' && (
                                      <div className="flex flex-col items-start gap-1">
                                        <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-50 border border-emerald-150 text-emerald-650">
                                          Recorded Phase
                                        </span>
                                        {expiryDate && (
                                          <span className={`text-[9px] font-bold ${isExpired ? 'text-rose-500 font-black' : 'text-slate-400'}`}>
                                            {isExpired ? 'Expired access' : `${daysLeft} days left`}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {student.status === 'Pending' && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-50 border border-amber-150 text-amber-600">
                                        Pending Verification
                                      </span>
                                    )}
                                    {student.status === 'Dropped' && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 border border-slate-200 text-slate-500">
                                        Dropped Cohort
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 pl-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAdmission(student)}
                                    className="px-2.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-extrabold text-[10px] rounded-lg transition active:scale-95 shadow-sm font-sans"
                                  >
                                    Manage
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>

              {/* Right Column (1/3): Weekly Schedule Timeline */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col justify-start min-h-[320px]">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-extrabold text-slate-850 tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    Cohort Sessions Schedule
                  </h3>
                </div>

                {(!currentBatch?.lectures || currentBatch.lectures.length === 0) ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 flex-grow border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <Calendar className="w-10 h-10 text-slate-300 mb-3" />
                    <p className="text-xs font-semibold text-slate-550 font-bold">No sessions published</p>
                    <span className="text-[10px] text-slate-400 max-w-[160px] block mt-1">
                      No lecture playbacks or live streams scheduled.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                    {currentBatch.lectures.map((lecture, idx) => {
                      const isLiveSession = lecture.title.toLowerCase().includes('scheduled live');
                      return (
                        <div
                          key={lecture.id}
                          className={`p-3.5 rounded-xl border flex flex-col gap-1.5 transition ${
                            isLiveSession
                              ? 'bg-rose-50/10 border-rose-150 shadow-sm'
                              : 'bg-slate-50/40 border-slate-150'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              isLiveSession
                                ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                            }`}>
                              {isLiveSession ? 'Live Stream' : `Session ${idx + 1}`}
                            </span>
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {new Date(lecture.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h5 className="font-extrabold text-slate-800 text-xs leading-snug">{lecture.title}</h5>
                          {lecture.description && (
                            <p className="text-[10px] text-slate-450 leading-relaxed truncate-2-lines">{lecture.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ─── activeTab === 'courses' ─── */}
        {activeTab === 'courses' && (
          <div className="space-y-6 fade-in">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 pb-5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                  <span>Admin</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-500">Course Library</span>
                </div>
                <h2 className="text-2xl font-extrabold text-indigo-950 tracking-tight flex items-center gap-2.5">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                  LMS Course Batches Management
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Configure your classes, launch secure streams, and publish educational lecture attachments.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchBatches}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition active:scale-95 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setDrawerTab('batch');
                    setIsDrawerOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-100 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Create Batch
                </button>
                <button
                  onClick={() => {
                    setDrawerTab('lecture');
                    setIsDrawerOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-100 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Publish Lecture
                </button>
              </div>
            </div>

            {/* Course Batches List Grid */}
            {loading ? (
              <div className="bg-white border border-slate-200/50 rounded-2xl flex items-center justify-center p-24 shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <span className="spinner w-8 h-8 border-indigo-600 border-t-transparent" />
                  <span className="text-xs font-semibold text-slate-400">Loading LMS directories...</span>
                </div>
              </div>
            ) : batches.length === 0 ? (
              <div className="bg-white border border-slate-200/50 rounded-2xl p-16 text-center shadow-sm">
                <GraduationCap className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h4 className="text-base font-bold text-slate-800">No active batches created</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Configure your first lecture category using the "Create Batch" controls at the top.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {batches.map((batch) => (
                  <div
                    key={batch.id}
                    className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-6"
                  >
                    {/* Top Row: Details & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                      
                      {/* Details */}
                      <div className="space-y-3.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                            Batch Module
                          </span>
                          
                          {batch.isUpcoming ? (
                            <span className="inline-flex items-center px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 text-[9px] font-bold uppercase rounded-full">
                              Upcoming
                            </span>
                          ) : batch.isLive ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-bold uppercase rounded-full animate-pulse">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                              Live Room Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-bold uppercase rounded-full">
                              Offline
                            </span>
                          )}

                          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                            {batch.price}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-lg font-extrabold text-slate-800 leading-tight mb-1.5">
                            {batch.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                            {batch.description || 'No batch description provided.'}
                          </p>
                        </div>

                        <div className="flex items-center gap-4 text-[10px] font-semibold text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                            {batch.lectures.length} Lectures Attached
                          </span>
                          <span>•</span>
                          {batch.isUpcoming && batch.startDate ? (
                            <span className="text-amber-600 font-bold">Launch: {batch.startDate}</span>
                          ) : (
                            <span>Created {new Date(batch.createdAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Column */}
                      <div className="flex flex-col gap-2 shrink-0 w-full sm:w-48">
                        {actionLoading === batch.id ? (
                          <div className="flex items-center justify-center py-4">
                            <span className="spinner border-indigo-600 border-t-transparent" />
                          </div>
                        ) : (
                          <>
                            {batch.isLive ? (
                              <>
                                <button
                                  onClick={() => handleToggleLive(batch.id, true)}
                                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition active:scale-95 shadow-sm"
                                >
                                  <VideoOff className="w-4 h-4 text-rose-400" />
                                  End Live Session
                                </button>
                                
                                <Link
                                  href={`/classroom?room=${batch.liveRoomId}&role=instructor&username=Instructor`}
                                  target="_blank"
                                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-xs shadow-lg shadow-rose-100 hover:shadow-rose-200 transition hover:-translate-y-0.5"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Join Live Stage
                                </Link>
                              </>
                            ) : (
                              <button
                                onClick={() => handleToggleLive(batch.id, false)}
                                className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 active:scale-95"
                              >
                                <Video className="w-4 h-4" />
                                Go Live (Start Stream)
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 font-bold text-xs transition active:scale-95 mt-1"
                            >
                              Delete Batch Directory
                            </button>
                          </>
                        )}
                      </div>

                    </div>

                    {/* Bottom Row: Lectures list (Full width) */}
                    {batch.lectures.length > 0 && (
                      <div className="w-full border-t border-slate-100 pt-4">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-2.5">
                          Published Lectures
                        </span>
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {batch.lectures.map((lecture, index) => (
                            <div key={lecture.id} className="flex items-center justify-between text-xs p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition">
                              <span className="font-bold text-slate-700 truncate max-w-sm">
                                {index + 1}. {lecture.title}
                              </span>
                              <div className="flex items-center gap-3">
                                {lecture.videoUrl && (
                                  <a href={lecture.videoUrl} target="_blank" rel="noreferrer" title="Watch Video" className="p-1 rounded-lg hover:bg-slate-200 text-indigo-600 transition">
                                    <Video className="w-4 h-4" />
                                  </a>
                                )}
                                {lecture.notesUrl && (
                                  <a href={lecture.notesUrl} target="_blank" rel="noreferrer" title="Download Notes" className="p-1 rounded-lg hover:bg-slate-200 text-emerald-600 transition">
                                    <FileText className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ─── activeTab === 'live' (Live Course Management Hub) ─── */}
        {activeTab === 'live' && (
          <div className="space-y-8 fade-in">
            
            {/* Header Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                  <span>Admin</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-500">Live Sessions</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-indigo-950 tracking-tight leading-tight">
                  Live Stage & Session Hub
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1 font-medium">
                  Schedule real-time classes, start active video stages, and monitor recording uploads.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchBatches}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition active:scale-95 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsLiveModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  Schedule Live Class
                </button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: ACTIVE STREAMS */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Active Streams
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">{liveCount}</h4>
                    <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                      Active video stages
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shadow-inner">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Card 2: SCHEDULED CLASSES */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Scheduled Streams
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">
                      {batches.filter((b) => b.isUpcoming && b.startDate).length}
                    </h4>
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
                      Upcoming calendar sessions
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-650 shadow-inner">
                    <Calendar className="w-4.5 h-4.5" />
                  </div>
                </div>
              </div>

              {/* Card 3: CLOUD RECORDINGS */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recorded Vault
                    </span>
                    <h4 className="text-2xl font-black text-slate-800 mt-1">
                      {batches.reduce((sum, b) => sum + b.lectures.filter(l => l.title.toLowerCase().includes('live')).length, 0)}
                    </h4>
                    <span className="text-[10px] font-semibold text-indigo-650 flex items-center gap-1 mt-1">
                      Uploaded live recordings
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                </div>
              </div>

            </div>

            {/* Split layout: Scheduled Sessions and Active Channels */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Left Column (2/3): Scheduled Sessions */}
              <div className="xl:col-span-2 bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 mb-6 tracking-tight">
                    Upcoming Scheduled Classes
                  </h3>

                  {batches.filter((b) => b.isUpcoming && b.startDate).length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-200 rounded-xl my-4">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                      <p className="text-xs text-slate-550 font-bold">No upcoming live sessions</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Click "Schedule Live Class" to schedule a session.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto my-2">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">Batch / Class</th>
                            <th className="py-2.5 px-3">Scheduled Start</th>
                            <th className="py-2.5 px-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {batches.filter((b) => b.isUpcoming && b.startDate).map((batch) => (
                            <tr key={batch.id} className="hover:bg-slate-50/80 transition">
                              <td className="py-3.5 px-3">
                                <span className="font-bold text-slate-850 block text-[13px]">{batch.title}</span>
                                <span className="text-[10px] text-slate-450 block mt-0.5 truncate max-w-sm">
                                  {batch.lectures.find(l => l.title.includes('Scheduled Live'))?.description || 'Virtual Lecture Session'}
                                </span>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className="font-semibold text-slate-650 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  {batch.startDate}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-right space-x-3">
                                <button
                                  onClick={() => handleToggleLive(batch.id, false)}
                                  className="text-indigo-650 hover:text-indigo-850 font-bold active:scale-95 transition"
                                >
                                  Start Stream
                                </button>
                                <button
                                  onClick={() => handleCancelLiveClass(batch.id)}
                                  className="text-rose-500 hover:text-rose-700 font-bold active:scale-95 transition"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column (1/3): Active Channels */}
              <div className="bg-white border border-slate-200/50 rounded-2xl p-6 shadow-sm flex flex-col min-h-[360px]">
                <h3 className="text-base font-extrabold text-slate-800 mb-6 tracking-tight">
                  Active Live Stages
                </h3>

                <div className="space-y-4 flex-1 flex flex-col justify-start">
                  {batches.filter((b) => b.isLive).map((batch) => (
                    <div
                      key={batch.id}
                      className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="truncate max-w-[150px]">
                          <span className="font-bold text-slate-800 block text-xs truncate">{batch.title}</span>
                          <span className="text-[9px] text-indigo-600 font-mono tracking-wider uppercase block mt-0.5">
                            Room: {batch.liveRoomId?.substring(0, 10)}...
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-600 text-[9px] font-bold uppercase rounded-full animate-pulse">
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                          Live Now
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/classroom?room=${batch.liveRoomId}&role=instructor&username=Instructor`}
                          target="_blank"
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-md shadow-indigo-100 transition active:scale-95 animate-pulse"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Join Stage
                        </Link>
                        <button
                          onClick={() => handleToggleLive(batch.id, true)}
                          className="px-3 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold transition active:scale-95"
                        >
                          End
                        </button>
                      </div>
                    </div>
                  ))}

                  {batches.filter((b) => b.isLive).length === 0 && (
                    <div className="text-center py-20 text-slate-400 flex-1 flex flex-col items-center justify-center">
                      <Tv className="w-10 h-10 text-slate-350 mb-2.5" />
                      <p className="text-xs font-semibold text-slate-500">All channels offline</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">Launch a classroom to go live.</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ─── activeTab === 'admissions' (Admissions Registry) ─── */}
        {activeTab === 'admissions' && (
          <div className="space-y-8 fade-in">
            {/* Header Title Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-1.5">
                  <span>Admin</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-slate-500">Admissions Registry</span>
                </div>
                <h2 className="text-2xl font-black text-indigo-950 tracking-tight leading-tight">
                  Admissions Registry
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Verify student details, check documents, set fee structures, and approve registrations.
                </p>
              </div>
              
              <button
                type="button"
                onClick={fetchAdmissions}
                disabled={admissionsLoading}
                className="self-start sm:self-center px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 active:scale-95 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${admissionsLoading ? 'animate-spin' : ''}`} />
                Reload Data
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Registered</span>
                  <p className="text-2xl font-black text-indigo-950 mt-0.5">{admissions.length}</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Active / Approved</span>
                  <p className="text-2xl font-black text-emerald-650 mt-0.5">
                    {admissions.filter(a => a.status === 'Active').length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-550 shrink-0 border border-amber-100/50">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Pending Review</span>
                  <p className="text-2xl font-black text-amber-650 mt-0.5">
                    {admissions.filter(a => a.status === 'Pending').length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/50 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Graduated / Dropped</span>
                  <p className="text-2xl font-black text-slate-700 mt-0.5">
                    {admissions.filter(a => a.status === 'Completed' || a.status === 'Dropped').length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by Name, CNIC, Email or WhatsApp..."
                  value={admissionsSearchQuery}
                  onChange={(e) => setAdmissionsSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                  <select
                    value={admissionsStatusFilter}
                    onChange={(e) => setAdmissionsStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white transition cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Dropped">Dropped</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mode:</span>
                  <select
                    value={admissionsClassModeFilter}
                    onChange={(e) => setAdmissionsClassModeFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white transition cursor-pointer"
                  >
                    <option value="All">All Modes</option>
                    <option value="Physical">Physical</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Admissions Table */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
              {admissionsLoading ? (
                <div className="text-center py-20 text-slate-400">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-650 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500">Loading registry details...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="py-4 px-6">Student Detail</th>
                        <th className="py-4 px-3">Contact</th>
                        <th className="py-4 px-3">CNIC & Mode</th>
                        <th className="py-4 px-3">Registered Course</th>
                        <th className="py-4 px-3 text-center">Status</th>
                        <th className="py-4 px-3">Office Fee Card</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {admissions.filter((student) => {
                        const query = admissionsSearchQuery.toLowerCase().trim();
                        const matchesSearch = 
                          !query ||
                          student.name.toLowerCase().includes(query) ||
                          (student.fatherName && student.fatherName.toLowerCase().includes(query)) ||
                          (student.cnic && student.cnic.toLowerCase().includes(query)) ||
                          (student.email && student.email.toLowerCase().includes(query)) ||
                          (student.whatsapp && student.whatsapp.toLowerCase().includes(query));
                          
                        const matchesStatus = 
                          admissionsStatusFilter === 'All' || 
                          student.status === admissionsStatusFilter;
                          
                        const matchesClassMode = 
                          admissionsClassModeFilter === 'All' || 
                          student.classMode === admissionsClassModeFilter;
                          
                        return matchesSearch && matchesStatus && matchesClassMode;
                      }).map((student) => {
                        const enrolledCourse = student.enrollments?.[0]?.batch?.title || 'No Course Selection';
                        
                        return (
                          <tr key={student.id} className="hover:bg-slate-50/40 transition">
                            <td className="py-4.5 px-6">
                              <div className="flex items-center gap-3">
                                <img
                                  src={student.avatarUrl}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover border border-slate-100 shrink-0"
                                />
                                <div>
                                  <span className="font-extrabold text-slate-800 block">{student.name}</span>
                                  <span className="text-[9.5px] font-bold text-indigo-650 bg-indigo-50/60 px-1.5 py-0.5 rounded font-mono select-all inline-block mt-0.5 border border-indigo-100/50">ID: {student.id}</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">S/O: {student.fatherName || 'N/A'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4.5 px-3">
                              <span className="font-bold text-slate-800 block">{student.whatsapp || 'N/A'}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">{student.email || 'N/A'}</span>
                            </td>
                            <td className="py-4.5 px-3">
                              <span className="font-semibold text-slate-650 block font-mono">{student.cnic || 'N/A'}</span>
                              <span className={`inline-flex items-center text-[9px] font-extrabold uppercase mt-1 px-2 py-0.5 rounded-full ${
                                student.classMode === 'Physical' 
                                  ? 'bg-orange-50 border border-orange-100 text-orange-600'
                                  : 'bg-cyan-50 border border-cyan-100 text-cyan-600'
                              }`}>
                                {student.classMode || 'Online'}
                              </span>
                            </td>
                            <td className="py-4.5 px-3">
                              <span className="font-bold text-slate-800 line-clamp-2 max-w-[200px]">{enrolledCourse}</span>
                              <span className="text-[9px] text-slate-400 block mt-0.5">Applied: {new Date(student.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="py-4.5 px-3 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                student.status === 'Active' 
                                  ? 'bg-emerald-50 border border-emerald-100 text-emerald-600' 
                                  : student.status === 'Pending' 
                                  ? 'bg-amber-50 border border-amber-100 text-amber-600'
                                  : student.status === 'Completed'
                                  ? 'bg-indigo-50 border border-indigo-100 text-indigo-600'
                                  : 'bg-rose-50 border border-rose-100 text-rose-600'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  student.status === 'Active'
                                    ? 'bg-emerald-500'
                                    : student.status === 'Pending'
                                    ? 'bg-amber-500'
                                    : student.status === 'Completed'
                                    ? 'bg-indigo-500'
                                    : 'bg-rose-500'
                                }`} />
                                {student.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-4.5 px-3">
                              {student.admissionFee || student.netPayable ? (
                                <div>
                                  <span className="font-bold text-slate-700 block">Fee: {student.netPayable || 'N/A'}</span>
                                  <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Docs: {student.docsReceived ? student.docsReceived.split(',').filter(Boolean).length : 0} received</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold italic">Unconfigured Office Card</span>
                              )}
                            </td>
                            <td className="py-4.5 px-6 text-right">
                              <button
                                type="button"
                                onClick={() => handleSelectAdmission(student)}
                                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 rounded-lg text-xs font-bold transition active:scale-95"
                              >
                                Office Actions
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {admissions.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-20 text-slate-400">
                            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2.5" />
                            <p className="text-xs font-bold text-slate-500">No applications registered</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>

      {/* ─── CREATION DRAWER SLIDE-OVER MODAL ─── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            {/* Drawer Box */}
            <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col justify-between">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">Management Console</h3>
                    <p className="text-[10px] text-slate-400">Publish course catalog directories</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Drawer Tabs */}
              <div className="px-6 border-b border-slate-100 bg-slate-50/20 flex gap-4">
                <button
                  onClick={() => setDrawerTab('batch')}
                  className={`text-xs font-bold py-3.5 relative border-b-2 transition ${
                    drawerTab === 'batch'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Create Course Batch
                </button>
                <button
                  onClick={() => setDrawerTab('lecture')}
                  className={`text-xs font-bold py-3.5 relative border-b-2 transition ${
                    drawerTab === 'lecture'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Upload Lecture Content
                </button>
              </div>

              {/* Drawer Scrollable Forms Content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                
                {/* 1. Batch creation Form */}
                {drawerTab === 'batch' && (
                  <form onSubmit={handleCreateBatch} className="space-y-4">
                    
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Batch Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Full Stack JS Masterclass"
                        value={batchTitle}
                        onChange={(e) => setBatchTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Description
                      </label>
                      <textarea
                        placeholder="Add batch goals, schedule details, syllabus outline..."
                        rows={4}
                        value={batchDescription}
                        onChange={(e) => setBatchDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Cover Image URL
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://images.unsplash.com/photo-xxx"
                        value={batchCoverImage}
                        onChange={(e) => setBatchCoverImage(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                          Course Price
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Free or $49"
                          value={batchPrice}
                          onChange={(e) => setBatchPrice(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 pt-5 select-none">
                        <input
                          id="isUpcoming"
                          type="checkbox"
                          checked={batchIsUpcoming}
                          onChange={(e) => setBatchIsUpcoming(e.target.checked)}
                          className="w-4.5 h-4.5 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor="isUpcoming" className="text-xs font-bold text-slate-600 cursor-pointer">
                          Upcoming Batch?
                        </label>
                      </div>
                    </div>

                    {batchIsUpcoming && (
                      <div className="fade-in">
                        <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                          Start Date / Launch Time
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. July 15, 2026 at 6:00 PM"
                          value={batchStartDate}
                          onChange={(e) => setBatchStartDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                        />
                      </div>
                    )}

                    {batchError && (
                      <div className="text-xs p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-semibold">
                        {batchError}
                      </div>
                    )}

                    {batchSuccess && (
                      <div className="text-xs p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4.5 h-4.5" />
                        ✓ Batch directory created successfully!
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition hover:-translate-y-0.5 active:scale-95"
                    >
                      Publish Batch Module
                    </button>
                  </form>
                )}

                {/* 2. Lecture creation Form */}
                {drawerTab === 'lecture' && (
                  <form onSubmit={handleCreateLecture} className="space-y-4">
                    
                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Select Course Batch *
                      </label>
                      <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer transition"
                      >
                        {batches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.title}
                          </option>
                        ))}
                        {batches.length === 0 && <option value="">No active batches found</option>}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Lecture Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Session 01 — Git & Github"
                        value={lectureTitle}
                        onChange={(e) => setLectureTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Lecture Outline / Summary
                      </label>
                      <textarea
                        placeholder="Summary logs, files covered, homework, syllabus updates..."
                        rows={3}
                        value={lectureDescription}
                        onChange={(e) => setLectureDescription(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Recorded Video Resource URL (MP4 / WebM / Embed)
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://storage.googleapis.com/classroom-recordings/session.mp4"
                        value={lectureVideoUrl}
                        onChange={(e) => setLectureVideoUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Notes / Presentation Slides Download Link (PDF)
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://drive.google.com/file/d/xxx/view"
                        value={lectureNotesUrl}
                        onChange={(e) => setLectureNotesUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                      />
                    </div>

                    {lectureError && (
                      <div className="text-xs p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-semibold">
                        {lectureError}
                      </div>
                    )}

                    {lectureSuccess && (
                      <div className="text-xs p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold flex items-center gap-2">
                        <CheckCircle className="w-4.5 h-4.5" />
                        ✓ Lecture attachments published successfully!
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20 transition hover:-translate-y-0.5 active:scale-95"
                    >
                      Publish Lecture Materials
                    </button>
                  </form>
                )}

              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end">
                <span className="text-[9px] font-semibold text-slate-400 mr-auto flex items-center gap-1">
                  <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                  Prisma DB Sync Operational
                </span>
                
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition active:scale-95"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── CREATE NEW LIVE CLASS SCHEDULING MODAL ─── */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop blur */}
          <div
            onClick={() => setIsLiveModalOpen(false)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-fade-in"
          />

          {/* Modal box */}
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative border border-slate-100 z-10 space-y-6 fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-indigo-950 tracking-tight">
                  Create New Live Class
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Schedule a real-time session with your students.
                </p>
              </div>
              <button
                onClick={() => setIsLiveModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleScheduleLiveClass} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Class Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass on Microservices"
                  value={liveClassTitle}
                  onChange={(e) => setLiveClassTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Batch Selection *
                  </label>
                  <select
                    value={liveSelectedBatchId}
                    onChange={(e) => setLiveSelectedBatchId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="">Select a batch...</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Instructor *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Michael Chen"
                    value={liveInstructor}
                    onChange={(e) => setLiveInstructor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={liveScheduledDate}
                    onChange={(e) => setLiveScheduledDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Time (EST) *
                  </label>
                  <input
                    type="time"
                    required
                    value={liveScheduledTime}
                    onChange={(e) => setLiveScheduledTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                  />
                </div>
              </div>

              {/* Toggle switch for recording option */}
              <div className="flex items-center justify-between bg-indigo-50/30 border border-indigo-100/50 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100/60 flex items-center justify-center text-indigo-600 shrink-0">
                    <Video className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Recording Option</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Automatically record and upload to dashboard</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLiveRecordingOption(!liveRecordingOption)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                    liveRecordingOption ? 'bg-indigo-650' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      liveRecordingOption ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {liveModalError && (
                <div className="text-xs p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-semibold">
                  {liveModalError}
                </div>
              )}

              {liveModalSuccess && (
                <div className="text-xs p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4.5 h-4.5" />
                  ✓ Live session scheduled and class materials published!
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLiveModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-100 transition active:scale-95"
                >
                  Schedule Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── OFFICE ACTIONS / ADMISSION CARD MODAL ─── */}
      {showAdmissionModal && selectedAdmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop blur */}
          <div
            onClick={() => setShowAdmissionModal(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
          />

          {/* Modal box */}
          <div className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative border border-slate-100 z-10 space-y-6 fade-in max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-indigo-950 tracking-tight">
                  Office Use & Enrollment Management
                </h3>
                <p className="text-xs text-slate-450 font-semibold mt-1 flex flex-wrap items-center gap-1">
                  Student Name: <span className="text-indigo-650 font-bold">{selectedAdmission.name}</span> | Full ID: <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded select-all font-bold border border-slate-200">{selectedAdmission.id}</span>
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setShowAdmissionModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Double Column */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Student Details (Read-only Reference) */}
              <div className="bg-slate-50/60 border border-slate-200/55 rounded-2xl p-6 space-y-5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                  Student Admission Form Details
                </span>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Father's Name</label>
                    <p className="text-slate-800 font-bold">{selectedAdmission.fatherName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">CNIC / Form-B No</label>
                    <p className="text-slate-800 font-bold font-mono">{selectedAdmission.cnic || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Date of Birth</label>
                    <p className="text-slate-800 font-bold">{selectedAdmission.dateOfBirth || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Gender</label>
                    <p className="text-slate-800 font-bold">{selectedAdmission.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">WhatsApp No</label>
                    <p className="text-slate-800 font-bold">{selectedAdmission.whatsapp || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Email Address</label>
                    <p className="text-slate-800 font-bold font-mono text-[10px] truncate">{selectedAdmission.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3.5 text-xs font-semibold text-slate-750">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Postal Address</label>
                    <p className="text-slate-800 font-bold text-[11px] leading-relaxed">{selectedAdmission.postalAddress || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Last Qualification</label>
                      <p className="text-slate-800 font-bold">{selectedAdmission.lastQual || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Passing Year</label>
                      <p className="text-slate-800 font-bold">{selectedAdmission.passingYear || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Institute Name</label>
                    <p className="text-slate-800 font-bold">{selectedAdmission.institute || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-3.5 text-xs font-semibold text-slate-750">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-bold">Emergency Guardian Contact</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Name</label>
                      <p className="text-slate-800 font-bold truncate">{selectedAdmission.emergencyName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Relation</label>
                      <p className="text-slate-800 font-bold truncate">{selectedAdmission.emergencyRel || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">Phone</label>
                      <p className="text-slate-800 font-bold truncate font-mono">{selectedAdmission.emergencyPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Office Actions Form */}
              <form onSubmit={handleSaveAdmission} className="space-y-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-100 pb-2">
                  Office Use Parameters & Setup
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      Admission Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer transition"
                    >
                      <option value="Pending">Pending Review</option>
                      <option value="Active">Active Student</option>
                      <option value="Completed">Completed / Graduate</option>
                      <option value="Dropped">Dropped / Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      Class Mode
                    </label>
                    <select
                      value={editClassMode}
                      onChange={(e) => setEditClassMode(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer transition"
                    >
                      <option value="Online">Online Classes</option>
                      <option value="Physical">Physical Classes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Switched / Swapped Cohort Course
                  </label>
                  <select
                    value={editDesiredCourseId}
                    onChange={(e) => setEditDesiredCourseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white cursor-pointer transition"
                  >
                    <option value="">No Course / Keep Enrolled</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      Total Fee
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rs 12,000"
                      value={editAdmissionFee}
                      onChange={(e) => setEditAdmissionFee(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      Discount
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rs 2,000"
                      value={editDiscount}
                      onChange={(e) => setEditDiscount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      Net Payable
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rs 10,000"
                      value={editNetPayable}
                      onChange={(e) => setEditNetPayable(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      Admission Date
                    </label>
                    <input
                      type="date"
                      value={editAdmissionDate}
                      onChange={(e) => setEditAdmissionDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-750 focus:outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition cursor-pointer"
                    >
                      <option value="Cash">Cash Handover</option>
                      <option value="Bank">Bank Deposit</option>
                      <option value="Online">Online Transfer</option>
                    </select>
                  </div>
                </div>

                {/* Documents Checklist Checkboxes */}
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
                    Submitted Documents Checklist
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-650 bg-slate-50 border border-slate-200/60 p-3.5 rounded-2xl">
                    {[
                      'CNIC / Form-B Copy',
                      'Passport Photo',
                      'Last Degree / Transcript',
                      'Paid Fee Receipt',
                      'Signed Undertaking'
                    ].map((doc) => (
                      <label key={doc} className="flex items-center gap-2 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editDocsReceived.includes(doc)}
                          onChange={() => toggleDoc(doc)}
                          className="w-4 h-4 rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <span>{doc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                    Office Remarks & Discount Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter discount remarks or installment plans details..."
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white resize-none transition"
                  />
                </div>

                {admissionsError && (
                  <div className="text-xs p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-semibold">
                    {admissionsError}
                  </div>
                )}

                {admissionsSuccess && (
                  <div className="text-xs p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4.5 h-4.5" />
                    ✓ Enrollment card saved and synchronized!
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdmissionModal(false)}
                    className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-605 font-bold text-xs rounded-xl transition active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  {selectedAdmission.status === 'Pending' && (
                    <button
                      type="button"
                      onClick={() => handleSaveAdmission(undefined, 'Active')}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-100 transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      ✓ Approve Student
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-100 transition active:scale-95 cursor-pointer"
                  >
                    Save Office Details
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
