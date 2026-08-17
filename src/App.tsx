import { useState, useEffect, useCallback } from 'react'
import AuthPage from './AuthPage'
import type { MockUser } from './AuthPage'
import Dashboard from './Dashboard'
import type { ChatSession } from './Dashboard'
import ChatPage from './ChatPage'
import NotificationsPage, { MOCK_NOTIFICATIONS } from './NotificationsPage'
import type { Notification } from './NotificationsPage'
import AnnouncementsPage from './AnnouncementsPage'
import ProfilePage from './ProfilePage'
import UsersPage from './UsersPage'
import ErrorBoundary from './ErrorBoundary'
import ThemeToggle from './ThemeToggle'

type Page = 'chat' | 'notifications' | 'announcements' | 'users' | 'profile'
type AppView = 'landing' | 'auth' | 'dashboard'

const DEFAULT_SESSIONS: ChatSession[] = [
  { id: 'cpen-302-chat', title: 'CPEN 302: Computer Networks Chat', fileName: 'CPEN_302_Class_Chat.txt' },
  { id: 'maths-engineers', title: 'MATH 223: Advanced Calculus Group', fileName: 'MATH223_Discussion.txt' },
]

/* ── Typewriter Animated Headline Component ─────────────────────── */
function TypewriterText() {
  const phrases = [
    'Course schedules and exam venues',
    'WhatsApp class announcements and deadlines',
    'Grading policies and academic regulations',
    'Interim assessments and project guidelines',
  ]

  const [phraseIdx, setPhraseIdx] = useState(0)
  const [currentText, setCurrentText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fullText = phrases[phraseIdx]
    const typingSpeed = isDeleting ? 30 : 65

    if (!isDeleting && currentText === fullText) {
      const pause = setTimeout(() => setIsDeleting(true), 2200)
      return () => clearTimeout(pause)
    }

    if (isDeleting && currentText === '') {
      setIsDeleting(false)
      setPhraseIdx(prev => (prev + 1) % phrases.length)
      return
    }

    const timeout = setTimeout(() => {
      setCurrentText(
        isDeleting
          ? fullText.substring(0, currentText.length - 1)
          : fullText.substring(0, currentText.length + 1)
      )
    }, typingSpeed)

    return () => clearTimeout(timeout)
  }, [currentText, isDeleting, phraseIdx])

  return (
    <span className="inline-block text-[#1e1e1e] font-[700] border-b-2 border-[#1e1e1e] pb-0.5">
      {currentText}
      <span className="inline-block w-[2px] h-[1em] bg-[#1e1e1e] ml-1 align-middle animate-pulse" />
    </span>
  )
}

/* ── Intro Splash Screen Graphic Animation with Motto ───────────── */
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => {
        window.scrollTo(0, 0)
        onFinish()
      }, 450)
    }, 2000)
    return () => clearTimeout(timer)
  }, [onFinish])

  const handleClick = () => {
    setExiting(true)
    setTimeout(() => {
      window.scrollTo(0, 0)
      onFinish()
    }, 300)
  }

  return (
    <div
      onClick={handleClick}
      className={`fixed inset-0 z-50 bg-[#f5f5f5] text-[#1e1e1e] flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] font-['Inter',sans-serif] ${
        exiting ? 'opacity-0 scale-105 filter blur-sm pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Ambient background glow */}
      <div className="absolute w-80 h-80 rounded-full bg-black/[0.04] blur-3xl animate-pulse-glow pointer-events-none" />

      <div className="flex flex-col items-center gap-4 relative z-10 animate-fade-in-up">
        {/* Logo Container */}
        <div className="w-20 h-20 bg-[#ffffff] border border-[#d9d9d9] rounded-[20px] p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-center justify-center animate-scale-in">
          <img
            src="/ses.jpg"
            alt="SES-GPT Logo"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Brand Typography and Motto */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-[700] text-[#1e1e1e] tracking-tight animate-fade-in delay-100">
            SES-GPT
          </h1>
          <p className="text-[13px] text-[#757575] font-[500] tracking-wide mt-1 animate-fade-in delay-150">
            School of Engineering Sciences · UG
          </p>
          <p className="text-[12px] text-[#1e1e1e] font-[600] tracking-wider uppercase mt-2 opacity-85 animate-fade-in delay-200">
            Integrity and Innovation
          </p>
        </div>

        {/* Smooth minimal loading accent bar */}
        <div className="w-28 h-[2.5px] bg-[#e5e5e5] rounded-full overflow-hidden mt-2">
          <div className="h-full bg-[#1e1e1e] rounded-full animate-[shimmer_1.5s_ease-in-out_infinite] w-full" />
        </div>
      </div>
    </div>
  )
}

/* ── Business Professional Landing Page ──────────────────────────── */
function LandingPage({ onGetStarted, onSignIn }: { onGetStarted: () => void; onSignIn: () => void }) {
  const [activeDemoTab, setActiveDemoTab] = useState<'sample1' | 'sample2'>('sample1')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1e1e1e] font-['Inter',sans-serif] flex flex-col justify-between relative overflow-hidden animate-page-enter">
      {/* Ambient background glow */}
      <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-b from-[#e0e0e0]/50 via-[#f0f0f0]/30 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-[rgba(20,18,24,0.08)] bg-[#ffffff]/90 backdrop-blur-md transition-all">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/ses.jpg" alt="SES Logo" className="w-8 h-8 rounded-full object-contain border border-[#d9d9d9] shadow-xs" />
            <div className="flex flex-col">
              <span className="font-[600] text-[15px] text-[#1e1e1e] tracking-tight leading-none">SES-GPT</span>
              <span className="text-[11px] text-[#757575] font-[400]">Integrity and Innovation</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={onSignIn}
              className="text-[#757575] hover:text-[#1e1e1e] text-[14px] font-[500] px-4 py-2 cursor-pointer transition-colors btn-press"
            >
              Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="bg-[#1e1e1e] text-white text-[14px] font-[600] px-5 py-2 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-xs btn-press"
            >
              Launch Assistant
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-20 flex flex-col justify-center items-center text-center relative z-10">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-[700] text-[#1e1e1e] tracking-tight max-w-3xl leading-[1.15] mb-6 animate-fade-in-up delay-50">
          Academic Intelligence and Departmental Knowledge Base
        </h1>

        {/* Dynamic Typewriter Question Prompt */}
        <div className="text-[15px] md:text-[17px] text-[#757575] font-[500] mb-4 min-h-[28px] animate-fade-in-up delay-100 flex items-center justify-center gap-2">
          <span>Search:</span>
          <TypewriterText />
        </div>

        {/* Subtitle */}
        <p className="text-[#757575] text-[16px] md:text-[18px] leading-relaxed mb-8 max-w-2xl font-[400] animate-fade-in-up delay-150">
          Instant, source-verified answers from departmental handbooks, grading policies, and class WhatsApp group discussions powered by neural hybrid retrieval.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-3.5 mb-14 animate-fade-in-up delay-200">
          <button
            onClick={onGetStarted}
            className="bg-[#1e1e1e] text-white font-[600] text-[15px] px-8 py-3 rounded-full hover:opacity-90 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.12)] cursor-pointer btn-press"
          >
            Get Started Free
          </button>
          <button
            onClick={onSignIn}
            className="bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9] font-[600] text-[15px] px-6 py-3 rounded-full hover-invert shadow-xs cursor-pointer btn-press"
          >
            View Demo Accounts
          </button>
        </div>

        {/* Interactive Showcase Mockup Card */}
        <div className="w-full max-w-3xl bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] shadow-[0_12px_36px_rgba(0,0,0,0.06)] overflow-hidden text-left mb-16 animate-fade-in-up delay-200 transition-all">
          {/* Mockup Title Bar */}
          <div className="border-b border-[#f0f0f0] bg-[#fafafa] px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
              <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
              <div className="w-3 h-3 rounded-full bg-[#e5e5e5]" />
              <span className="text-[12px] font-[500] text-[#757575] ml-2">SES-GPT Assistant Preview</span>
            </div>
            <div className="flex items-center gap-1 bg-[#ffffff] border border-[#d9d9d9] rounded-[8px] p-0.5 text-[11px] font-[500]">
              <button
                onClick={() => setActiveDemoTab('sample1')}
                className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                  activeDemoTab === 'sample1'
                    ? 'bg-[#1e1e1e] text-white font-[600]'
                    : 'text-[#757575] hover:text-[#1e1e1e]'
                }`}
              >
                Class WhatsApp Chat
              </button>
              <button
                onClick={() => setActiveDemoTab('sample2')}
                className={`px-3 py-1 rounded-[6px] transition-all cursor-pointer ${
                  activeDemoTab === 'sample2'
                    ? 'bg-[#1e1e1e] text-white font-[600]'
                    : 'text-[#757575] hover:text-[#1e1e1e]'
                }`}
              >
                Academic Handbook
              </button>
            </div>
          </div>

          {/* Mockup Content */}
          <div className="p-6 flex flex-col gap-4 bg-[#ffffff]">
            {activeDemoTab === 'sample1' ? (
              <>
                <div className="flex justify-end">
                  <div className="bg-[#1e1e1e] text-white text-[13px] px-4 py-2.5 rounded-[16px] rounded-br-[4px] max-w-md shadow-xs">
                    When is the next CPEN 302 Interim Assessment and what is the venue?
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-xl w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <img src="/ses.jpg" alt="SES Logo" className="w-4 h-4 rounded-full object-contain border border-[#d9d9d9]" />
                      <span className="text-[11px] font-[600] text-[#757575] uppercase tracking-wider">SES-GPT</span>
                    </div>
                    <div className="bg-[#f9f9f9] border border-[#e5e5e5] rounded-[12px] rounded-tl-[4px] p-4 text-[13px] text-[#1e1e1e] leading-relaxed">
                      According to the recent announcement from Dr. Mensah in the <strong>CPEN 302 Group Chat</strong>:
                      <ul className="list-disc pl-5 my-2 space-y-1">
                        <li><strong>Date and Time:</strong> Thursday, April 17, 2026 at 2:00 PM</li>
                        <li><strong>Venue:</strong> CCB Building, Lab 3</li>
                        <li><strong>Scope:</strong> Chapters 1 through 4 (Network Layer and Routing Protocols)</li>
                      </ul>
                      <div className="mt-3 pt-2.5 border-t border-[#e5e5e5] flex items-center justify-between text-[11px] text-[#757575]">
                        <span>Source: CPEN_302_Class_Chat.txt (Msg #412)</span>
                        <span className="font-[600] text-[#1e1e1e] bg-[#ffffff] border border-[#d9d9d9] px-2 py-0.5 rounded-[4px]">98% Match</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-end">
                  <div className="bg-[#1e1e1e] text-white text-[13px] px-4 py-2.5 rounded-[16px] rounded-br-[4px] max-w-md shadow-xs">
                    What is the minimum grade required to pass a core course in the School of Engineering?
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="max-w-xl w-full">
                    <div className="flex items-center gap-2 mb-1.5">
                      <img src="/ses.jpg" alt="SES Logo" className="w-4 h-4 rounded-full object-contain border border-[#d9d9d9]" />
                      <span className="text-[11px] font-[600] text-[#757575] uppercase tracking-wider">SES-GPT</span>
                    </div>
                    <div className="bg-[#f9f9f9] border border-[#e5e5e5] rounded-[12px] rounded-tl-[4px] p-4 text-[13px] text-[#1e1e1e] leading-relaxed">
                      Per the <strong>UG School of Engineering Sciences Academic Handbook (Section 4.2)</strong>:
                      <p className="mt-1.5">
                        Students must achieve at least a <strong>Grade D (Grade Point 1.0, 50–54%)</strong> to pass an undergraduate course. However, to remain in good academic standing, a minimum cumulative Grade Point Average (CGPA) of <strong>1.00</strong> is required.
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-[#e5e5e5] flex items-center justify-between text-[11px] text-[#757575]">
                        <span>Source: UG_SES_Handbook_2026.pdf (p. 28)</span>
                        <span className="font-[600] text-[#1e1e1e] bg-[#ffffff] border border-[#d9d9d9] px-2 py-0.5 rounded-[4px]">99% Match</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mb-16">
          {[
            { metric: '10,000+', label: 'Indexed Messages and Chunks' },
            { metric: '< 15ms', label: 'Local Neural Vector Retrieval' },
            { metric: '100%', label: 'Source-Cited Factual Precision' },
            { metric: '5', label: 'Engineering Departments Supported' },
          ].map((m, i) => (
            <div key={i} className="bg-[#ffffff] border border-[#d9d9d9] rounded-[12px] p-4 shadow-xs text-center card-hover cursor-default">
              <div className="font-[700] text-2xl md:text-3xl text-[#1e1e1e] tracking-tight">{m.metric}</div>
              <div className="text-[#757575] text-[12px] font-[500] mt-1">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full text-left">
          {[
            {
              title: 'Hybrid Neural Retrieval',
              desc: 'High-density cosine vector embeddings in PostgreSQL pgvector combined with academic keyword ranking.',
            },
            {
              title: 'WhatsApp Discussion Ingestion',
              desc: 'Seamlessly upload semester chat archives. Filters conversational noise and elevates critical exam announcements.',
            },
            {
              title: 'Institutional Role Access',
              desc: 'Granular permissions for Students, TAs, Lecturers, Heads of Department, Dean, and Administrators.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-[#ffffff] border border-[#d9d9d9] rounded-[14px] p-6 shadow-xs card-hover flex flex-col justify-between"
            >
              <div>
                <h3 className="font-[600] text-[16px] text-[#1e1e1e] mb-2">{f.title}</h3>
                <p className="text-[13px] text-[#757575] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(20,18,24,0.08)] bg-[#ffffff] py-6 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[13px] text-[#757575]">
          <div className="flex items-center gap-2">
            <img src="/ses.jpg" alt="SES Logo" className="w-5 h-5 rounded-full object-contain" />
            <span className="font-[600] text-[#1e1e1e]">SES-GPT</span>
          </div>
          <span>Integrity and Innovation · School of Engineering Sciences</span>
          <span>© 2026 University of Ghana</span>
        </div>
      </footer>
    </div>
  )
}

/* ── App Router with Splash Animation and Smooth Transitions ─── */
export default function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [view, setView] = useState<AppView>('landing')
  const [user, setUser] = useState<MockUser | null>(null)
  const [page, setPage] = useState<Page>('chat')
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [activeDocumentTitle, setActiveDocumentTitle] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(DEFAULT_SESSIONS)
  const [chatLoading, setChatLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('ses_notifications')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return MOCK_NOTIFICATIONS
  })

  const unreadCount = notifications.filter(n => !n.read).length

  // Pre-fetch saved sessions upfront on login
  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem('ses_token')
    if (!token) return
    try {
      const res = await fetch('http://localhost:8080/api/whatsapp/sessions', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setChatSessions(data)
        }
      }
    } catch (e) {
      console.warn('Could not load backend sessions upfront, using cached list', e)
    }
  }, [])

  // Pre-fetch notifications from backend on login
  const fetchNotifications = useCallback(async (studentId?: string) => {
    const token = localStorage.getItem('ses_token')
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : ''
    try {
      const res = await fetch(`http://localhost:8080/api/notifications${query}`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const mapped: Notification[] = data.map(item => ({
            id: item.id,
            title: item.title,
            body: item.body,
            senderRole: (item.senderRole as SenderRole) || 'lecturer',
            senderName: item.senderName || 'Faculty',
            department: item.department || 'Computer Engineering',
            targetRoles: ['student'],
            date: item.createdAt || new Date().toISOString(),
            read: item.isRead === true,
          }))
          setNotifications(mapped)
          try {
            localStorage.setItem('ses_notifications', JSON.stringify(mapped))
          } catch {
            // ignore
          }
        }
      }
    } catch (e) {
      console.warn('Could not load backend notifications, using local state', e)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchSessions()
      fetchNotifications(user.studentId || user.id)
    }
  }, [user, fetchSessions, fetchNotifications])

  const handleAuth = (u: MockUser) => {
    // Restore customized profile & picture if saved locally
    try {
      const savedProfile = localStorage.getItem('ses_custom_profile_' + (u.studentId || u.id))
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile)
        u = { ...u, ...parsed }
      }
    } catch (e) {
      // ignore
    }
    setUser(u)
    fetchNotifications(u.studentId || u.id)
    setView('dashboard')
    setPage('chat')
  }

  const handleUpdateUser = (updated: MockUser) => {
    setUser(updated)
    // 1. Permanently save in browser localStorage
    try {
      localStorage.setItem('ses_custom_profile_' + (updated.studentId || updated.id), JSON.stringify(updated))
    } catch (e) {
      console.warn('Could not save profile to localStorage', e)
    }

    // 2. Synchronize directly with PostgreSQL backend database
    const token = localStorage.getItem('ses_token')
    if (token) {
      fetch('http://localhost:8080/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updated.name,
          email: updated.email,
          department: updated.department,
          level: updated.level,
          avatarUrl: updated.avatarUrl,
        }),
      }).catch(err => console.warn('Background profile sync to DB failed', err))
    }
  }

  const handleSignOut = () => {
    setUser(null)
    setView('landing')
    setPage('chat')
    setActiveDocumentId(null)
    setActiveDocumentTitle(null)
  }

  // Instant switching with loading animation
  const handleSelectChat = (docId: string | null, docTitle: string | null) => {
    setActiveDocumentId(docId)
    setActiveDocumentTitle(docTitle)
    setPage('chat')
    if (docId) {
      setChatLoading(true)
      setTimeout(() => setChatLoading(false), 250)
    } else {
      setChatLoading(false)
    }
  }

  const handleDocumentUploaded = (docId: string, docTitle: string) => {
    const newSession: ChatSession = { id: docId, title: docTitle, fileName: docTitle }
    setChatSessions(prev => [newSession, ...prev.filter(s => s.id !== docId)])
    handleSelectChat(docId, docTitle)
  }

  const handleDeleteChat = async (id: string) => {
    setChatSessions(prev => prev.filter(s => s.id !== id))
    if (activeDocumentId === id) {
      handleSelectChat(null, null)
    }
    const token = localStorage.getItem('ses_token')
    if (!token) return
    try {
      await fetch(`http://localhost:8080/api/whatsapp/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
    } catch (e) {
      console.error('Failed to delete backend session', e)
    }
  }

  const handleClearActiveDocument = () => {
    handleSelectChat(null, null)
  }

  const handleBroadcastAnnouncement = (newNotification: Notification) => {
    setNotifications(prev => {
      const updated = [newNotification, ...prev]
      try {
        localStorage.setItem('ses_notifications', JSON.stringify(updated))
      } catch {
        // ignore
      }
      return updated
    })
  }

  const handleNewChat = () => {
    handleSelectChat(null, null)
  }

  return (
    <div className="w-full h-full relative">
      {/* Initial Reveal Splash Animation */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      {view === 'landing' && (
        <div key="landing-view" className="animate-page-enter">
          <LandingPage
            onGetStarted={() => setView('auth')}
            onSignIn={() => setView('auth')}
          />
        </div>
      )}

      {view === 'auth' && (
        <div key="auth-view" className="animate-page-enter">
          <AuthPage onAuth={handleAuth} />
        </div>
      )}

      {view === 'dashboard' && user && (
        <div key="dashboard-view" className="animate-page-enter h-full w-full">
          <Dashboard
            user={user}
            onSignOut={handleSignOut}
            activePage={page}
            onNavigate={p => setPage(p as Page)}
            onNewChat={handleNewChat}
            activeDocumentId={activeDocumentId}
            activeDocumentTitle={activeDocumentTitle}
            chatSessions={chatSessions}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            unreadCount={unreadCount}
          >
            <ErrorBoundary>
              {page === 'chat' && (
                <ChatPage
                  user={user}
                  activeDocumentId={activeDocumentId}
                  activeDocumentTitle={activeDocumentTitle}
                  onClearActiveDocument={handleClearActiveDocument}
                  onDocumentUploaded={handleDocumentUploaded}
                  loadingChat={chatLoading}
                />
              )}
              {page === 'notifications' && (
                <NotificationsPage
                  user={user}
                  notifications={notifications}
                  onUpdateNotifications={setNotifications}
                />
              )}
              {page === 'announcements' && (
                <AnnouncementsPage 
                  user={user} 
                  onBroadcast={handleBroadcastAnnouncement}
                />
              )}
              {page === 'users' && <UsersPage user={user} />}
              {page === 'profile' && <ProfilePage user={user} onUpdateUser={handleUpdateUser} />}
            </ErrorBoundary>
          </Dashboard>
        </div>
      )}
    </div>
  )
}
