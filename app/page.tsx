'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Video,
  ArrowRight,
  Sparkles,
  GraduationCap,
  User,
  LogOut,
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  Smartphone,
  Cpu,
  Database,
  Cloud,
  Lock,
  Palette,
  Users,
  Award,
  Briefcase,
  Play,
  Settings,
  Star,
  Search,
  Code
} from 'lucide-react';

// Interfaces
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

interface UserSession {
  name: string;
  role: 'student' | 'instructor';
}

// Fade-in-up transition variant
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring', damping: 25, stiffness: 120 }
  }
};

export default function HomePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Auth States
  const [user, setUser] = useState<UserSession | null>(null);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInName, setSignInName] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInRole, setSignInRole] = useState<'student' | 'instructor'>('student');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [signInError, setSignInError] = useState<string | null>(null);

  // Admission Form Fields
  const [registerStep, setRegisterStep] = useState(1);
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFatherName, setRegFatherName] = useState('');
  const [regCnic, setRegCnic] = useState('');
  const [regDob, setRegDob] = useState('');
  const [regGender, setRegGender] = useState('Male');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPostalAddress, setRegPostalAddress] = useState('');
  const [regLastQual, setRegLastQual] = useState('');
  const [regPassingYear, setRegPassingYear] = useState('');
  const [regInstitute, setRegInstitute] = useState('');
  const [regDesiredCourseId, setRegDesiredCourseId] = useState('');
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyRel, setRegEmergencyRel] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regClassMode, setRegClassMode] = useState('Online');
  const [regDeclaration, setRegDeclaration] = useState(false);
  const [regBatchName, setRegBatchName] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [admissionsError, setAdmissionsError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState(false);
  const [registeredStudentId, setRegisteredStudentId] = useState('');

  // Enrollment State
  const [enrolledIds, setEnrolledIds] = useState<string[]>([]);
  const [enrollingBatch, setEnrollingBatch] = useState<Batch | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Mock Fallback Batches (based on the user screenshot)
  const fallbackActiveBatches: Batch[] = [
    {
      id: 'mock-1',
      title: 'Full-Stack Web Architect',
      description: 'Access recorded archives, course notes, and participate in live workspaces. Learn frontend, backend, database design, scaling, and cloud architecture.',
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600',
      isLive: false,
      isUpcoming: false,
      price: '$129.99',
      createdAt: new Date().toISOString(),
      lectures: Array(18).fill({ id: '1', title: 'Session' })
    },
    {
      id: 'mock-2',
      title: 'AI & ML Foundations',
      description: 'Master large language models, regression models, neural networks, PyTorch, and clean AI pipeline deployments from scratch.',
      coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600',
      isLive: true,
      liveRoomId: 'ai-ml-live',
      isUpcoming: false,
      price: '$149.99',
      createdAt: new Date().toISOString(),
      lectures: Array(15).fill({ id: '1', title: 'Session' })
    },
    {
      id: 'mock-3',
      title: 'UX Strategy & UI Design',
      description: 'Learn wireframing, typography, human-computer interface design, color theory, product systems, and advanced Figma patterns.',
      coverImage: 'https://images.unsplash.com/photo-1581291518655-9523c932ded7?q=80&w=600',
      isLive: false,
      isUpcoming: false,
      price: '$99.99',
      createdAt: new Date().toISOString(),
      lectures: Array(12).fill({ id: '1', title: 'Session' })
    }
  ];

  const fallbackUpcomingBatches: Batch[] = [
    {
      id: 'mock-up-1',
      title: 'Web Architect Pro',
      description: 'Pre-register and secure your seat for this upcoming cohort. Study deep-dive systems scale and state machine management.',
      coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600',
      isLive: false,
      isUpcoming: true,
      price: '$199.99',
      startDate: '24 October',
      createdAt: new Date().toISOString(),
      lectures: Array(24).fill({ id: '1', title: 'Session' })
    },
    {
      id: 'mock-up-2',
      title: 'Data Masters Bootcamp',
      description: 'Build predictive analysis systems, manage warehouse architecture, and perform big data modeling with Python and Spark.',
      coverImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600',
      isLive: false,
      isUpcoming: true,
      price: '$249.99',
      startDate: '02 November',
      createdAt: new Date().toISOString(),
      lectures: Array(30).fill({ id: '1', title: 'Session' })
    }
  ];

  useEffect(() => {
    // Enable scroll on body/html for the homepage (overriding RootLayout overflow-hidden)
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';

    // Fetch Batches
    async function loadBatches() {
      try {
        const res = await fetch('/api/batches');
        if (res.ok) {
          const data = await res.json();
          // If no batches returned from DB, we use the fallback list
          if (data && data.length > 0) {
            setBatches(data);
            setRegDesiredCourseId(data[0].id);
          } else {
            const fallback = [...fallbackActiveBatches, ...fallbackUpcomingBatches];
            setBatches(fallback);
            setRegDesiredCourseId(fallback[0].id);
          }
        } else {
          const fallback = [...fallbackActiveBatches, ...fallbackUpcomingBatches];
          setBatches(fallback);
          setRegDesiredCourseId(fallback[0].id);
        }
      } catch (err) {
        console.error('Failed to load batches:', err);
        const fallback = [...fallbackActiveBatches, ...fallbackUpcomingBatches];
        setBatches(fallback);
        setRegDesiredCourseId(fallback[0].id);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();

    // Load Session
    const savedUser = localStorage.getItem('lms_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('lms_user');
      }
    }

    // Load Enrollments
    const savedEnrollments = localStorage.getItem('lms_enrollments');
    if (savedEnrollments) {
      try {
        setEnrolledIds(JSON.parse(savedEnrollments));
      } catch (e) {
        localStorage.removeItem('lms_enrollments');
      }
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  // Auth Handlers
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);
    if (!signInName.trim() || !signInPassword.trim()) {
      setSignInError('Username and password are required');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signInName.trim(),
          password: signInPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      const session: UserSession = {
        name: data.name,
        role: data.role
      };

      localStorage.setItem('lms_user', JSON.stringify(session));
      setUser(session);
      setSignInName('');
      setSignInPassword('');
      setShowSignInModal(false);
      
      // Auto redirect based on role
      if (data.role === 'instructor') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/learn';
      }
    } catch (err) {
      setSignInError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(false);

    if (!regDeclaration) {
      setRegError('You must agree to the declaration statement to register.');
      return;
    }

    try {
      let selectedBatchName = '';
      const desiredRaw = regDesiredCourseId ? regDesiredCourseId.trim() : '';
      // If the user entered an id that matches a batch id
      const byId = batches.find((batch) => batch.id === desiredRaw);
      if (byId) {
        selectedBatchName = byId.title;
      } else {
        // Try to match by course title substring
        const lower = desiredRaw.toLowerCase();
        const byTitle = batches.find((batch) => lower.includes(batch.title.toLowerCase()));
        if (byTitle) {
          selectedBatchName = byTitle.title;
        } else {
          // Fallback: take the first comma-separated token as the batch name
          selectedBatchName = desiredRaw.split(',')[0].trim();
        }
      }

      const batchNameToSend = regBatchName || selectedBatchName;

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          password: regPassword.trim(),
          fatherName: regFatherName.trim(),
          cnic: regCnic.trim(),
          dateOfBirth: regDob.trim(),
          gender: regGender,
          whatsapp: regWhatsapp.trim(),
          email: regEmail.trim(),
          postalAddress: regPostalAddress.trim(),
          lastQual: regLastQual.trim(),
          passingYear: regPassingYear.trim(),
          institute: regInstitute.trim(),
          desiredCourseId: regDesiredCourseId,
          batchName: batchNameToSend,
          emergencyName: regEmergencyName.trim(),
          emergencyRel: regEmergencyRel.trim(),
          emergencyPhone: regEmergencyPhone.trim(),
          classMode: regClassMode,
          selectedCourses: regDesiredCourseId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit admission form');
      }

      setRegSuccess(true);
      setRegisteredStudentId(data.user.id);
      
      // Auto log in after register
      const session: UserSession = {
        name: data.user.name,
        role: data.user.role
      };
      localStorage.setItem('lms_user', JSON.stringify(session));
      setUser(session);

      // Reset form fields
      setRegName('');
      setRegPassword('');
      setRegFatherName('');
      setRegCnic('');
      setRegDob('');
      setRegGender('Male');
      setRegWhatsapp('');
      setRegEmail('');
      setRegPostalAddress('');
      setRegLastQual('');
      setRegPassingYear('');
      setRegInstitute('');
      setRegDesiredCourseId('');
      setRegEmergencyName('');
      setRegEmergencyRel('');
      setRegEmergencyPhone('');
      setRegClassMode('Online');
      setRegDeclaration(false);

      setTimeout(() => {
        setShowSignInModal(false);
        setRegSuccess(false);
        setRegisterStep(1);
        window.location.href = '/learn';
      }, 5000);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('lms_user');
    setUser(null);
  };

  const handleEnroll = (batch: Batch) => {
    if (!user) {
      setShowSignInModal(true);
      return;
    }
    const updated = [...enrolledIds, batch.id];
    localStorage.setItem('lms_enrollments', JSON.stringify(updated));
    setEnrolledIds(updated);
    setEnrollingBatch(batch);
  };

  // Filter batches based on state
  const activeBatches = batches.filter((b) => !b.isUpcoming);
  const upcomingBatches = batches.filter((b) => b.isUpcoming);

  // Merge logic to guarantee high visual fidelity to the screenshot (displaying at least 3 active and 2 upcoming)
  const displayActiveBatches = [
    ...activeBatches,
    ...fallbackActiveBatches.filter(fb => !activeBatches.some(ab => ab.title.toLowerCase() === fb.title.toLowerCase()))
  ];

  const displayUpcomingBatches = [
    ...upcomingBatches,
    ...fallbackUpcomingBatches.filter(fb => !upcomingBatches.some(ub => ub.title.toLowerCase() === fb.title.toLowerCase()))
  ];

  // Filter batches by search query
  const filteredActiveBatches = displayActiveBatches.filter((b) => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Categories definition
  const categories = [
    { name: 'Web Dev', icon: Code, color: '#523cf8', bg: '#EEF2FF', count: '120+ Courses' },
    { name: 'Mobile Dev', icon: Smartphone, color: '#a855f7', bg: '#F5F3FF', count: '85+ Courses' },
    { name: 'AI & ML', icon: Cpu, color: '#0ea5e9', bg: '#F0F9FF', count: '60+ Courses' },
    { name: 'Data Science', icon: Database, color: '#f43f5e', bg: '#FFF1F2', count: '90+ Courses' },
    { name: 'Cloud', icon: Cloud, color: '#38bdf8', bg: '#F0F9FF', count: '45+ Courses' },
    { name: 'DevOps', icon: Settings, color: '#10b981', bg: '#ECFDF5', count: '55+ Courses' },
    { name: 'Cyber Security', icon: Lock, color: '#f59e0b', bg: '#FFFBEB', count: '40+ Courses' },
    { name: 'UI/UX', icon: Palette, color: '#ec4899', bg: '#FDF2F8', count: '75+ Courses' }
  ];

  // Benefits definition
  const benefits = [
    {
      title: 'Expert Instructors',
      desc: 'Learn directly from industry engineers and designers at leading tech firms.',
      icon: Users,
      color: '#523cf8',
      bg: '#EEF2FF'
    },
    {
      title: 'Live Classes',
      desc: 'Interact in real-time, ask questions, and get immediate feedback.',
      icon: Video,
      color: '#a855f7',
      bg: '#F5F3FF'
    },
    {
      title: 'Certification',
      desc: 'Earn industry-recognized certificates to showcase your skills and mastery.',
      icon: Award,
      color: '#0ea5e9',
      bg: '#F0F9FF'
    },
    {
      title: 'Job Placement',
      desc: 'Get exclusive access to job boards, resume reviews, and career counseling.',
      icon: Briefcase,
      color: '#10b981',
      bg: '#ECFDF5'
    }
  ];

  // Testimonials list
  const testimonials = [
    {
      text: "The curriculum was incredibly thorough. I went from knowing zero React to landing a junior developer role in just 4 months.",
      author: "Alex Rivera",
      role: "Full-stack Graduate",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200",
      rating: 5
    },
    {
      text: "The live feedback sessions with mentors were a game changer. Having a senior dev look at my code helped me improve 10x faster.",
      author: "Mark Thompson",
      role: "UI/UX Student",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200",
      rating: 5
    },
    {
      text: "The AI foundations course is by far the most up-to-date program I've seen. It actually covers LLMs and modern agentic workflows.",
      author: "Li Wei",
      role: "AI Engineering Student",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200",
      rating: 5
    }
  ];

  // Steps
  const steps = [
    { num: '1', title: 'Choose Course', desc: 'Select from our wide range of expert-led programs.' },
    { num: '2', title: 'Enroll & Start', desc: 'Instant access to materials and live community.' },
    { num: '3', title: 'Learn & Build', desc: 'Work on real-world projects to build your portfolio.' },
    { num: '4', title: 'Get Certified', desc: 'Complete the course and launch your new career.' }
  ];

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] text-slate-800 flex flex-col pb-0">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/60 px-6 py-3.5 flex items-center justify-between transition-all">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#523cf8] to-[#7c6bfc] flex items-center justify-center shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight leading-none block">EduFlow Pro</span>
              <span className="text-[9px] text-[#523cf8] font-mono tracking-widest uppercase font-semibold">ERP Education</span>
            </div>
          </div>

          {/* Navigation Middle Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <Link href="/" className="text-[#523cf8] hover:text-[#523cf8] transition-colors">Home</Link>
            <a href="#active-courses" className="hover:text-slate-900 transition-colors">Courses</a>
            <a href="#categories" className="hover:text-slate-900 transition-colors">Categories</a>
            <a href="#instructors" className="hover:text-slate-900 transition-colors">Instructors</a>
            <a href="#about-us" className="hover:text-slate-900 transition-colors">About</a>
          </nav>

          {/* Search bar inside header */}
          <div className="hidden lg:flex items-center relative w-72 max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#523cf8] focus:bg-white transition-all"
            />
          </div>

          {/* User Section / CTA Buttons */}
          <div className="flex items-center gap-3.5 shrink-0">
            {user ? (
              <>
                {user.role === 'instructor' ? (
                  <Link
                    href="/admin"
                    className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#523cf8]/10 hover:bg-[#523cf8]/20 border border-[#523cf8]/20 text-[#523cf8] transition-all duration-200"
                  >
                    Instructor Panel
                  </Link>
                ) : (
                  <Link
                    href="/learn"
                    className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-[#523cf8] hover:bg-[#4330d9] text-white transition-all duration-200 shadow-sm shadow-[#523cf8]/10"
                  >
                    Student Portal
                  </Link>
                )}

                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 pl-3 pr-2 py-1.5 rounded-lg">
                  <div className="flex flex-col items-end">
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">{user.name}</span>
                    <span className="text-[9px] font-semibold text-slate-400 capitalize font-mono leading-none">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200/50 transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log In
                </button>

                <button
                  onClick={() => { setAuthMode('register'); setShowSignInModal(true); }}
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-lg border border-[#523cf8]/20 text-[#523cf8] bg-white hover:bg-[#f8f6ff] transition-all"
                >
                  Apply for Admission
                </button>

                <button
                  onClick={() => setShowSignInModal(true)}
                  className="text-xs font-bold px-4 py-2 rounded-full bg-[#523cf8] hover:bg-[#4330d9] text-white shadow-sm shadow-[#523cf8]/10 hover:shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-white w-full overflow-hidden">
        <div className="max-w-7xl w-full mx-auto px-6 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Content */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#523cf8] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Next Gen Learning Platform
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] md:max-w-xl mx-auto lg:mx-0">
              Learn Skills That <span className="text-[#523cf8] bg-gradient-to-r from-[#523cf8] to-[#7c6bfc] bg-clip-text text-transparent">Shape Your Future</span>
            </h1>

            <p className="text-slate-500 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0">
              Access world-class education from anywhere in the world. Join over 10M+ students mastering high-demand tech skills through immersive, project-based learning.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-3 justify-center lg:justify-start">
              <a
                href="#active-courses"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-[#523cf8] hover:bg-[#4330d9] text-white font-bold text-sm shadow-md shadow-[#523cf8]/10 hover:shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                Enroll Now
                <ArrowRight className="w-4 h-4" />
              </a>
              
              <a
                href="#about-us"
                className="w-full sm:w-auto flex items-center justify-center px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-sm shadow-sm transition-all duration-200"
              >
                Explore Courses
              </a>
            </div>
          </div>

          {/* Hero Illustration Graphic */}
          <div className="lg:col-span-6 relative flex justify-center w-full">
            <div className="relative w-full max-w-xl aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-slate-100/60 bg-slate-100 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200"
                alt="LMS Classroom Session"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              
              {/* Floating Overlay "Live Class" */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/40 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/10">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">Live Class</h4>
                    <p className="text-[10px] text-slate-500">Started 10m ago</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-500 text-[8px] font-bold text-white flex items-center justify-center">A</div>
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-amber-500 text-[8px] font-bold text-white flex items-center justify-center">M</div>
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-teal-500 text-[8px] font-bold text-white flex items-center justify-center">L</div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono">
                    +120
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-indigo-50/40 border-y border-slate-100 py-10">
        <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="space-y-1">
            <h3 className="font-extrabold text-3xl sm:text-4xl text-[#523cf8]">10,000+</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Students</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-3xl sm:text-4xl text-[#523cf8]">500+</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Premium Courses</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-3xl sm:text-4xl text-[#523cf8]">100+</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expert Instructors</p>
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-3xl sm:text-4xl text-[#523cf8]">95%</h3>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Success Rate</p>
          </div>
        </div>
      </section>

      {/* Explore Featured Courses Section */}
      <section id="active-courses" className="max-w-7xl w-full mx-auto px-6 py-20 lg:py-24 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#523cf8] rounded-full" />
              Explore Featured Courses
            </h2>
            <p className="text-xs text-slate-400 mt-1">Curated learning paths designed by industry veterans.</p>
          </div>
          <a
            href="#active-courses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#523cf8] hover:text-[#4330d9] transition-colors"
          >
            View All Courses
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl flex items-center justify-center p-20 border border-slate-100">
            <span className="spinner border-slate-300 border-t-[#523cf8] w-8 h-8" />
          </div>
        ) : filteredActiveBatches.length === 0 ? (
          <div className="bg-white p-16 text-center border border-slate-200/60 rounded-2xl">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-base font-bold text-slate-700">No matching courses found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Try searching with different keywords or explore other categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredActiveBatches.map((batch, index) => {
              const isEnrolled = enrolledIds.includes(batch.id);
              // Rating fallbacks
              const ratings = ['4.8', '4.9', '5.0'];
              const authors = [
                'By Dr. Sarah Jenkins • Senior Tech Org',
                'By James Patron • Data Scientist',
                'By Elena Rossi • Senior Product Designer'
              ];
              const hours = ['80 Hours', '95 Hours', '70 Hours'];
              const modules = ['18 Modules', '15 Modules', '12 Modules'];

              return (
                <div key={batch.id} className="bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full overflow-hidden group">
                  {/* Card Cover Image */}
                  <div className="relative h-48 overflow-hidden bg-slate-50 border-b border-slate-100 flex items-center justify-center shrink-0">
                    {batch.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={batch.coverImage}
                        alt={batch.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-indigo-100" />
                    )}

                    {/* Tags */}
                    {index === 0 && (
                      <span className="absolute top-4 left-4 z-20 bg-blue-600 text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-sm">
                        Bestseller
                      </span>
                    )}

                    {batch.isLive && (
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-600 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                        Live
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Meta header */}
                      <div className="flex items-center justify-between mb-3 text-[10px] text-slate-400 font-semibold font-mono">
                        <span className="uppercase text-[#523cf8] bg-[#523cf8]/5 px-2 py-0.5 rounded">
                          COHORT
                        </span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {ratings[index % 3]}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 tracking-tight mb-2 group-hover:text-[#523cf8] transition-colors leading-snug">
                        {batch.title}
                      </h4>
                      
                      <p className="text-[11px] text-slate-400 font-medium font-mono mb-2">
                        {authors[index % 3]}
                      </p>
                      
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-6">
                        {batch.description}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Hours & Modules */}
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-4">
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {hours[index % 3]}</span>
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {modules[index % 3]}</span>
                      </div>

                      {/* Enroll Button & Price */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-base font-extrabold text-slate-950 font-mono">
                          {batch.price}
                        </span>
                        
                        {isEnrolled ? (
                          <Link
                            href={`/learn/${batch.id}`}
                            className="flex items-center justify-center gap-1.5 px-4.5 py-2 rounded-lg bg-[#523cf8] hover:bg-[#4330d9] text-white font-bold text-xs shadow-sm shadow-[#523cf8]/10 transition-all"
                          >
                            Access
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleEnroll(batch)}
                            className="px-4.5 py-2 rounded-lg bg-[#523cf8]/5 hover:bg-[#523cf8] border border-[#523cf8]/10 text-[#523cf8] hover:text-white font-bold text-xs transition-all"
                          >
                            Enroll Now
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Top Course Categories Section */}
      <section id="categories" className="bg-white border-t border-slate-200/60 py-20 lg:py-24">
        <div className="max-w-7xl w-full mx-auto px-6 space-y-12">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Top Course Categories</h3>
            <p className="text-xs text-slate-500">Discover diverse programming paths and fields.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {categories.map((cat, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
              >
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ backgroundColor: cat.bg }}
                >
                  <cat.icon className="w-5.5 h-5.5" style={{ color: cat.color }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#523cf8] transition-colors">{cat.name}</h4>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block mt-1">{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Live Batches Section */}
      <section className="max-w-7xl w-full mx-auto px-6 py-20 lg:py-24 space-y-10 border-t border-slate-200/60">
        <div>
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[#523cf8] rounded-full" />
            Upcoming Live Batches
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Pre-register and secure your seat for these upcoming cohorts.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl flex items-center justify-center p-20 border border-slate-100">
            <span className="spinner border-slate-300 border-t-[#523cf8] w-8 h-8" />
          </div>
        ) : displayUpcomingBatches.length === 0 ? (
          <div className="bg-white p-12 text-center border border-slate-200/60 rounded-2xl">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h4 className="text-base font-bold text-slate-700">No upcoming cohorts announced yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              We are finalizing curriculum parameters. Stay tuned for new announcements.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayUpcomingBatches.map((batch, index) => {
              const isRegistered = enrolledIds.includes(batch.id);
              const weeks = ['12 Weeks', '14 Weeks'];
              const teachers = ['Dr. Sarah Jenkins', 'James Wilson'];
              const seats = ['5 Seats Left', '10 Seats Left'];

              return (
                <div 
                  key={batch.id}
                  className="bg-white p-6 border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col sm:flex-row justify-between gap-6"
                >
                  {/* Left block date */}
                  <div className="flex sm:flex-col items-center justify-center px-6 py-4 rounded-xl bg-indigo-50 border border-indigo-100/50 text-center shrink-0">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#523cf8] font-mono leading-none">Started On</span>
                    <span className="text-2xl font-extrabold text-slate-900 leading-none my-1 font-mono">
                      {batch.startDate ? batch.startDate.split(' ')[0] : '24'}
                    </span>
                    <span className="text-[9px] uppercase font-bold text-slate-500 font-mono leading-none">
                      {batch.startDate ? batch.startDate.split(' ')[1] : 'October'}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-grow space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold font-mono text-[#523cf8] bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {batch.price}
                      </span>
                      <span className="text-[9px] text-red-600 bg-red-50 border border-red-100/50 px-2 py-0.5 rounded-full font-bold uppercase font-mono">
                        {seats[index % 2]}
                      </span>
                    </div>
                    
                    <h4 className="text-base font-bold text-slate-900 tracking-tight">{batch.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {batch.description}
                    </p>

                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold font-mono">
                      <span>DURATION: {weeks[index % 2]}</span>
                      <span>INSTRUCTOR: {teachers[index % 2]}</span>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                      {isRegistered ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          Pre-registered Successfully
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(batch)}
                          className="px-6 py-2.5 rounded-lg bg-[#523cf8] hover:bg-[#4330d9] text-white font-bold text-xs transition-all shadow-sm shadow-[#523cf8]/10 shadow-md active:scale-95"
                        >
                          Register Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Why Choose Section */}
      <section className="border-t border-slate-200/60 bg-[#EEF2FF]/40 py-20 lg:py-24">
        <div className="max-w-7xl w-full mx-auto px-6 space-y-12">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Why Choose EduFlow Pro?</h3>
            <p className="text-xs text-slate-500">We provide more than just lessons. We provide a pathway to your career goals.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b, i) => (
              <div
                key={i}
                className="bg-white p-6 border border-slate-100 hover:border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col items-start gap-4"
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: b.bg }}
                >
                  <b.icon className="w-5 h-5" style={{ color: b.color }} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-1">{b.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="about-us" className="max-w-7xl w-full mx-auto px-6 py-20 lg:py-24 space-y-12 border-t border-slate-200/60 bg-white">
        <div className="text-center max-w-lg mx-auto space-y-2">
          <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">How It Works</h3>
          <p className="text-xs text-slate-500">Your step-by-step path to coding expertise.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-[26px] left-[10%] right-[10%] h-[1px] bg-slate-200/80 z-0" />
          
          {steps.map((step, idx) => (
            <div key={idx} className="flex flex-col items-center text-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full border border-indigo-200 bg-indigo-50 text-[#523cf8] text-sm font-bold flex items-center justify-center shadow-sm">
                {step.num}
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-800">{step.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium max-w-[200px]">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Instructors Section */}
      <section id="instructors" className="border-t border-slate-200/60 bg-slate-50/50 py-20 lg:py-24">
        <div className="max-w-7xl w-full mx-auto px-6 space-y-12">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Meet Your Instructors</h3>
            <p className="text-xs text-slate-500">Learn from seasoned developers with years of real-world expertise.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Instructor 1 */}
            <div className="bg-white overflow-hidden border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative group h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=600"
                alt="Dr. Sarah Jenkins"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/35 to-transparent" />
              
              {/* Info panel */}
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <div>
                  <span className="text-[9px] font-bold font-mono text-[#523cf8] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    WEB ARCHITECT
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">Dr. Sarah Jenkins</h4>
                  <p className="text-xs text-slate-300 font-medium">Former Staff Engineer at Vercel</p>
                </div>
                
                <p className="text-[10px] text-slate-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-20 overflow-hidden">
                  Sarah has over 12 years of experience building frontend architectures and designs core routing engines.
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[9px] text-white bg-white/10 px-2 py-0.5 rounded font-mono font-bold">#NextJS</span>
                  <span className="text-[9px] text-white bg-white/10 px-2 py-0.5 rounded font-mono font-bold">#React</span>
                </div>
              </div>
            </div>

            {/* Instructor 2 */}
            <div className="bg-white overflow-hidden border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative group h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600"
                alt="James Patron"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/35 to-transparent" />
              
              {/* Info panel */}
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <div>
                  <span className="text-[9px] font-bold font-mono text-amber-500 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded">
                    DATA SCIENTIST
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">James Patron</h4>
                  <p className="text-xs text-slate-300 font-medium">Principal Architect at OpenAI</p>
                </div>
                
                <p className="text-[10px] text-slate-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-20 overflow-hidden">
                  James specializes in deep reinforcement learning and large language models, training systems engineers.
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[9px] text-white bg-white/10 px-2 py-0.5 rounded font-mono font-bold">#PyTorch</span>
                  <span className="text-[9px] text-white bg-white/10 px-2 py-0.5 rounded font-mono font-bold">#Python</span>
                </div>
              </div>
            </div>

            {/* Instructor 3 */}
            <div className="bg-white overflow-hidden border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 relative group h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=600"
                alt="Elena Rossi"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/35 to-transparent" />
              
              {/* Info panel */}
              <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                <div>
                  <span className="text-[9px] font-bold font-mono text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                    UI/UX DIRECTOR
                  </span>
                  <h4 className="text-base font-bold text-white mt-1.5">Elena Rossi</h4>
                  <p className="text-xs text-slate-300 font-medium">Former Lead Designer at Figma</p>
                </div>
                
                <p className="text-[10px] text-slate-300 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-20 overflow-hidden">
                  Elena is passionate about building products that feel premium, leading Figma core product design sprints.
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[9px] text-white bg-white/10 px-2 py-0.5 rounded font-mono font-bold">#Figma</span>
                  <span className="text-[9px] text-white bg-white/10 px-2 py-0.5 rounded font-mono font-bold">#UIUX</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-24 bg-white border-t border-slate-200/60">
        <div className="max-w-7xl w-full mx-auto px-6 mb-12">
          <div className="text-center max-w-lg mx-auto space-y-2">
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">What Our Students Say</h3>
            <p className="text-xs text-slate-500">Real feedback from actual students who transitioned into tech.</p>
          </div>
        </div>

        {/* Testimonials Cards Grid */}
        <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white p-6 border border-slate-200/80 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300"
            >
              <div>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#fccc5c] text-[#fccc5c]" />
                  ))}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-medium italic mb-6">
                  "{t.text}"
                </p>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200/80"
                />
                <div>
                  <h5 className="text-[11px] font-bold text-slate-800">{t.author}</h5>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase font-mono">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Start Learning Today (CTA Banner) */}
      <section className="max-w-7xl w-full mx-auto px-6 py-16 relative">
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-10 lg:p-16 text-center relative overflow-hidden shadow-sm shadow-indigo-100/10">
          <div className="relative z-10 max-w-xl mx-auto space-y-6">
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Start Learning Today
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Join thousands of students who have already transformed their careers through our platform. Setup an account and jump into a batch.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 justify-center pt-3">
              <button
                onClick={() => {
                  if (user) {
                    window.location.hash = 'active-courses';
                  } else {
                    setShowSignInModal(true);
                  }
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#523cf8] hover:bg-[#4330d9] text-white font-bold text-xs shadow-sm shadow-[#523cf8]/10 transition-all hover:-translate-y-0.5"
              >
                Enroll for Free
              </button>
              
              {!user && (
                <button
                  onClick={() => setShowSignInModal(true)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/80 text-slate-700 font-bold text-xs shadow-sm transition-all"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-[#f8fafc] py-16">
        <div className="max-w-7xl w-full mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#523cf8] to-[#7c6bfc] flex items-center justify-center shadow-md">
                <GraduationCap className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-base">EduFlow Pro</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Empowering the next generation of digital leaders through accessible, high-quality tech educators.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="w-6 h-6 rounded-full bg-slate-100 hover:bg-[#523cf8]/10 border border-slate-200 cursor-pointer transition-colors" />
              <span className="w-6 h-6 rounded-full bg-slate-100 hover:bg-[#523cf8]/10 border border-slate-200 cursor-pointer transition-colors" />
              <span className="w-6 h-6 rounded-full bg-slate-100 hover:bg-[#523cf8]/10 border border-slate-200 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><a href="#" className="hover:text-[#523cf8] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#523cf8] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#523cf8] transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-[#523cf8] transition-colors">Help Center</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-xs text-slate-500 font-semibold">
              <li><a href="#" className="hover:text-[#523cf8] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#523cf8] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#523cf8] transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Subscribe</h4>
            <p className="text-xs text-slate-500 font-medium">Get the latest course updates and career tips.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#523cf8]"
              />
              <button className="px-4 py-2 bg-[#523cf8] hover:bg-[#4330d9] text-white rounded-lg text-xs font-bold shadow-sm transition-all shrink-0">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl w-full mx-auto px-6 mt-16 pt-8 border-t border-slate-200/60 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-bold font-mono">
          <span>© 2026 EduFlow Pro. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-[#523cf8]">English US</span>
            <span className="cursor-pointer hover:text-[#523cf8]">Help & Support Enabled</span>
          </div>
        </div>
      </footer>

      {/* ─── Sign In & Admission Modal ─── */}
      <AnimatePresence>
        {showSignInModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white w-full border border-slate-200/80 rounded-3xl shadow-2xl relative my-8 transition-all ${
                authMode === 'register' ? 'max-w-2xl p-8' : 'max-w-md p-6'
              }`}
            >
              {/* Header */}
              {authMode === 'login' ? (
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-[#523cf8] mb-3">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">Welcome Back</h4>
                  <button onClick={() => {setShowSignInModal(false)}}><span style={{color: "red"}}>Close Modal</span></button>
                  <p className="text-xs text-slate-400 mt-1">Access your school dashboard and live classrooms.</p>
                </div>
              ) : (
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#523cf8]/10 text-[#523cf8] flex items-center justify-center shrink-0">
                      <BookOpen className="w-5.5 h-5.5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-[#523cf8] tracking-tight uppercase leading-none block">Premier Tax Corporate & Accounting School</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest font-mono">Admission & Enrollment Form</p>
                      <button onClick={() => {setShowSignInModal(false)}}><span style={{color: "red"}}>Close Modal</span></button>
                    </div>
                  </div>
                  
                  {/* Step Progress indicators */}
                  <div className="flex items-center gap-2 mt-4 select-none">
                    {[1, 2, 3, 4].map((step) => (
                      <div key={step} className="flex-1 flex items-center gap-1.5">
                        <div
                          className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                            registerStep === step
                              ? 'bg-[#523cf8] text-white'
                              : registerStep > step
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {registerStep > step ? '✓' : step}
                        </div>
                        <div
                          className={`flex-1 h-1 rounded transition-colors hidden sm:block ${
                            registerStep > step ? 'bg-emerald-500' : 'bg-slate-100'
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error alerts */}
              {authMode === 'login' && signInError && (
                <div className="text-xs p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-semibold text-center">
                  ⚠️ {signInError}
                </div>
              )}

              {authMode === 'register' && regError && (
                <div className="text-xs p-3 mb-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-semibold text-center">
                  ⚠️ {regError}
                </div>
              )}

              {authMode === 'register' && regSuccess && (
                <div className="text-xs p-5 mb-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-center space-y-3.5 shadow-sm">
                  <div className="flex items-center justify-center gap-2 font-black text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Admission Received Successfully!
                  </div>
                  <div className="space-y-1.5 bg-white border border-emerald-100 p-3 rounded-xl">
                    <span className="text-[10px] text-slate-450 uppercase tracking-wider block font-bold">Your Unique Student ID</span>
                    <span className="font-mono bg-slate-50 text-slate-800 px-3 py-1 rounded text-sm select-all font-bold block border border-slate-100">{registeredStudentId}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                    Please submit your manual payment receipt with this Student ID. Redirecting to Student Portal to track status...
                  </p>
                </div>
              )}

              {/* Login Form */}
              {authMode === 'login' && (
                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono">
                      Email Address or Username
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. student@example.com or Full Name"
                      value={signInName}
                      onChange={(e) => setSignInName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono">
                      Account Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Enter password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#523cf8] hover:bg-[#4330d9] text-white font-bold text-xs transition-all shadow-md shadow-[#523cf8]/10 hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-98"
                  >
                    Log In to Academy
                  </button>

                  <div className="text-center pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-400 font-medium">
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('register');
                          setRegisterStep(1);
                          setSignInError(null);
                        }}
                        className="text-[#523cf8] font-bold hover:underline"
                      >
                        Apply for Admission
                      </button>
                    </p>
                  </div>
                </form>
              )}

            
              {authMode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-5">
                  <div className="max-h-[60vh] overflow-y-auto pr-3 space-y-6">
                    
                    <section className="space-y-4">
                      <span className="text-xs font-extrabold uppercase text-[#523cf8] tracking-widest font-mono block">1. Personal & Contact Info</span>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Full Name (BLOCK LETTERS) *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ALICE SMITH"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value.toUpperCase())}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Father’s/Guardian Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. BOB SMITH"
                            value={regFatherName}
                            onChange={(e) => setRegFatherName(e.target.value.toUpperCase())}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">CNIC / Form-B No *</label>
                          <input
                            type="text"
                            required
                            placeholder="35202-xxxxxxx-x"
                            value={regCnic}
                            onChange={(e) => setRegCnic(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Date of Birth *</label>
                          <input
                            type="date"
                            required
                            value={regDob}
                            onChange={(e) => setRegDob(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Gender *</label>
                          <select
                            value={regGender}
                            onChange={(e) => setRegGender(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] cursor-pointer"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Contact No (WhatsApp) *</label>
                          <input
                            type="tel"
                            required
                            placeholder="+92 300 xxxxxxx"
                            value={regWhatsapp}
                            onChange={(e) => setRegWhatsapp(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Email Address *</label>
                          <input
                            type="email"
                            required
                            placeholder="student@example.com"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Postal Address *</label>
                        <input
                          type="text"
                          required
                          placeholder="Street, City, Country"
                          value={regPostalAddress}
                          onChange={(e) => setRegPostalAddress(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                        />
                      </div>
                    </section>

                    
                    <section className="space-y-4">
                      <span className="text-xs font-extrabold uppercase text-[#523cf8] tracking-widest font-mono block">2. Academic Background</span>
                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Last Qualification *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. MBA Finance, B.Com, BBA"
                          value={regLastQual}
                          onChange={(e) => setRegLastQual(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Institute / University *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. University of Punjab"
                            value={regInstitute}
                            onChange={(e) => setRegInstitute(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Passing Year *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2024"
                            value={regPassingYear}
                            onChange={(e) => setRegPassingYear(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>
                      </div>
                    </section>

                   
                    <section className="space-y-4">
                      <span className="text-xs font-extrabold uppercase text-[#523cf8] tracking-widest font-mono block">3. Course Enrollment</span>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Desired Course(s) (comma-separated) *</label>
                        <textarea
                          value={regDesiredCourseId}
                          onChange={(e) => setRegDesiredCourseId(e.target.value)}
                          placeholder="e.g. Full-Stack Web Architect, AI & ML Foundations"
                          rows={3}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition resize-vertical"
                        />
                        {batches.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-2">Available courses: {batches.map((b) => b.title).join(', ')}</p>
                        )}

                        <div className="mt-3">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Batch Type</label>
                          <select
                            value={regBatchName}
                            onChange={(e) => setRegBatchName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] cursor-pointer"
                          >
                            <option value="">Auto-detect / Select batch</option>
                            <option value="Summer">Summer</option>
                            <option value="Fall">Fall</option>
                            <option value="Winter">Winter</option>
                            <option value="Spring">Spring</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                    
                    </section>

                   
                    <section className="space-y-4 pb-4 border-b border-slate-100">
                      <span className="text-xs font-extrabold uppercase text-[#523cf8] tracking-widest font-mono block">4. Emergency Contact & Declaration</span>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Contact Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="Emergency Contact"
                            value={regEmergencyName}
                            onChange={(e) => setRegEmergencyName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Relation *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Father, Mother"
                            value={regEmergencyRel}
                            onChange={(e) => setRegEmergencyRel(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Contact Number *</label>
                          <input
                            type="tel"
                            required
                            placeholder="Phone Number"
                            value={regEmergencyPhone}
                            onChange={(e) => setRegEmergencyPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">Create Account Password *</label>
                        <input
                          type="password"
                          required
                          placeholder="Choose password to login later"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:border-[#523cf8] focus:bg-white transition"
                        />
                      </div>

                      <div className="flex items-start gap-2.5 select-none pt-2">
                        <input
                          id="regDeclarationCheckbox"
                          type="checkbox"
                          checked={regDeclaration}
                          onChange={(e) => setRegDeclaration(e.target.checked)}
                          className="mt-0.5 w-4 h-4 text-[#523cf8] border-slate-300 rounded cursor-pointer focus:ring-[#523cf8]"
                        />
                        <label htmlFor="regDeclarationCheckbox" className="text-[10px] text-slate-500 leading-normal font-semibold cursor-pointer">
                          <strong>DECLARATION:</strong> I hereby declare that the information provided above is correct to the best of my knowledge and I agree to abide by the rules and regulations of the academy.
                        </label>
                      </div>
                    </section>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-between items-center">
                    <div className="w-full sm:w-auto">
                      {admissionsError && (
                        <div className="text-xs p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-semibold">{admissionsError}</div>
                      )}
                      {regSuccess && (
                        <div className="text-xs p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold flex items-center gap-2">✓ Admission received</div>
                      )}
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition w-full sm:w-auto"
                      >
                        Back to Login
                      </button>
                      <button
                        type="submit"
                        disabled={regSuccess}
                        className="px-6 py-3 rounded-xl bg-[#523cf8] hover:bg-[#4330d9] text-white font-bold text-xs shadow-md shadow-[#523cf8]/15 transition w-full sm:w-auto"
                      >
                        {regSuccess ? 'Submitting...' : 'Submit Admission Form'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Enrollment Celebration Modal ─── */}
      <AnimatePresence>
        {enrollingBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm p-6 border border-emerald-100 text-center rounded-2xl shadow-xl relative"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
              </div>
              
              <h4 className="text-lg font-bold text-slate-800 mb-1">Congratulations!</h4>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                You have successfully enrolled in <strong>{enrollingBatch.title}</strong>.
              </p>

              <button
                onClick={() => setEnrollingBatch(null)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-sm shadow-emerald-500/10"
              >
                Start Learning
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
