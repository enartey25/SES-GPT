import React, { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import sesLogo from './assets/ses.jpg'
import { API_BASE_URL } from './config'

type AuthView = 'signin' | 'register' | 'forgot'

interface AuthPageProps {
  onAuth: (user: MockUser) => void
}

export interface MockUser {
  id: string
  studentId?: string
  name: string
  email: string
  role: Role
  department: string
  level?: string
  avatarUrl?: string
}

export type Role = 'student' | 'lecturer' | 'ta' | 'hod' | 'dean' | 'admin'

export const DEPARTMENTS = [
  'Computer Engineering',
  'Agricultural Engineering',
  'Biomedical Engineering',
  'Food Process Engineering',
  'Materials Science and Engineering',
]

const LEVELS = ['L100', 'L200', 'L300', 'L400', 'L500', 'Graduate']
const ROLES: { value: Role; label: string; desc: string }[] = [
  { value: 'student', label: 'Student', desc: 'Undergraduate or postgraduate student' },
  { value: 'ta', label: 'Teaching Assistant', desc: 'Graduate TA for a course' },
  { value: 'lecturer', label: 'Lecturer', desc: 'Course instructor or professor' },
  { value: 'hod', label: 'Head of Dept', desc: 'Departmental head' },
  { value: 'dean', label: 'Dean', desc: 'School dean' },
  { value: 'admin', label: 'Administrator', desc: 'School administrator' },
]

// Demo accounts with seeded credentials
const MOCK_USERS: MockUser[] = [
  { id: '10671234', studentId: '10671234', name: 'Ama Owusu', email: 'ama.owusu@ug.edu.gh', role: 'student', department: 'Computer Engineering', level: 'L300' },
  { id: 'STF-0042', studentId: 'STF-0042', name: 'Dr. Godfrey Mills', email: 'gmills@ug.edu.gh', role: 'lecturer', department: 'Computer Engineering' },
  { id: 'TA-011', studentId: 'TA-011', name: 'Emmanuel Ansah', email: 'e.ansah@ug.edu.gh', role: 'ta', department: 'Biomedical Engineering' },
  { id: 'HOD-002', studentId: 'HOD-002', name: 'Prof. Aba Bentil', email: 'hod.ce@ug.edu.gh', role: 'hod', department: 'Computer Engineering' },
  { id: 'DEAN-001', studentId: 'DEAN-001', name: 'Prof. Elvis Nyarko', email: 'dean.ses@ug.edu.gh', role: 'dean', department: 'Materials Science and Engineering' },
  { id: 'ADM-001', studentId: 'ADM-001', name: 'SES Admin Desk', email: 'admin.ses@ug.edu.gh', role: 'admin', department: "Dean's Office" },
]

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function FieldInput({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
}: {
  label: string
  id: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-[600] text-[#1e1e1e]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2.5 text-[14px] text-[#1e1e1e] placeholder-[#b3b3b3] outline-none focus:border-[#1e1e1e] transition-colors shadow-2xs font-['Inter',sans-serif]"
      />
    </div>
  )
}

function SignInForm({
  onAuth,
  onSwitch,
}: {
  onAuth: (u: MockUser) => void
  onSwitch: (v: AuthView) => void
}) {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          localStorage.setItem('ses_token', data.token)
        }
        onAuth({
          id: data.studentId || identifier,
          studentId: data.studentId || identifier,
          name: data.name || identifier,
          email: `${identifier}@ug.edu.gh`,
          role: (data.role?.toLowerCase() || 'student') as Role,
          department: data.department || 'Computer Engineering',
        })
        return
      }

      const errData = await res.json().catch(() => ({}))
      setError(errData.error || 'Invalid Student ID or password.')
    } catch {
      // Local fallback for offline mode
      const matched = MOCK_USERS.find(
        u =>
          u.id.toLowerCase() === identifier.toLowerCase() ||
          u.email.toLowerCase() === identifier.toLowerCase()
      )
      if (matched) {
        onAuth(matched)
      } else {
        setError('Invalid credentials. Please verify your Student ID and password.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-['Inter',sans-serif]">
      {error && (
        <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-[8px] px-3.5 py-2.5 text-[13px] text-[#e11d48] animate-fade-in">
          {error}
        </div>
      )}

      <FieldInput
        label="Student ID or Staff Email"
        id="login-id"
        value={identifier}
        onChange={setIdentifier}
        placeholder="e.g. 10671234 or gmills@ug.edu.gh"
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="login-pass" className="text-[13px] font-[600] text-[#1e1e1e]">
            Password
          </label>
          <button
            type="button"
            onClick={() => onSwitch('forgot')}
            className="text-[12px] text-[#757575] hover:text-[#1e1e1e] transition-colors cursor-pointer"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <input
            id="login-pass"
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="w-full bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2.5 pr-10 text-[14px] text-[#1e1e1e] placeholder-[#b3b3b3] outline-none focus:border-[#1e1e1e] transition-colors shadow-2xs font-['Inter',sans-serif]"
          />
          <button
            type="button"
            onClick={() => setShowPass(v => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#757575] hover:text-[#1e1e1e] cursor-pointer"
          >
            <EyeIcon open={showPass} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1e1e1e] text-white font-[600] text-[14px] py-3 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-xs disabled:opacity-50 mt-2 btn-press"
      >
        {loading ? 'Authenticating…' : 'Sign In'}
      </button>

      <div className="text-center text-[13px] text-[#757575] mt-2">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={() => onSwitch('register')}
          className="font-[600] text-[#1e1e1e] hover:underline cursor-pointer"
        >
          Create account
        </button>
      </div>
    </form>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: (v: AuthView) => void }) {
  const [name, setName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [level, setLevel] = useState(LEVELS[2])
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-3 font-['Inter',sans-serif] animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-[#1e1e1e] text-white flex items-center justify-center text-xl">
          ✓
        </div>
        <h2 className="text-[17px] font-[600] text-[#1e1e1e]">Registration Submitted</h2>
        <p className="text-[13px] text-[#757575] max-w-xs leading-relaxed">
          Your account request has been submitted to the School of Engineering Sciences administration for verification.
        </p>
        <button
          onClick={() => onSwitch('signin')}
          className="mt-2 text-[13px] font-[600] text-[#1e1e1e] hover:underline cursor-pointer"
        >
          ← Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 font-['Inter',sans-serif]">
      <FieldInput label="Full Name" id="reg-name" value={name} onChange={setName} placeholder="Ama Owusu" />
      <FieldInput label="Student / Staff ID" id="reg-id" value={studentId} onChange={setStudentId} placeholder="10671234" />
      <FieldInput label="University Email" id="reg-email" type="email" value={email} onChange={setEmail} placeholder="aowusu@ug.edu.gh" />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-[600] text-[#1e1e1e]">Department</label>
          <select
            value={department}
            onChange={e => setDepartment(e.target.value)}
            className="w-full bg-[#ffffff] border border-[#d9d9d9] rounded-full px-3.5 py-2 text-[13px] text-[#1e1e1e] outline-none"
          >
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-[600] text-[#1e1e1e]">Role</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            className="w-full bg-[#ffffff] border border-[#d9d9d9] rounded-full px-3.5 py-2 text-[13px] text-[#1e1e1e] outline-none capitalize"
          >
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <FieldInput label="Password" id="reg-pass" type="password" value={password} onChange={setPassword} placeholder="••••••••" />

      <button
        type="submit"
        className="w-full bg-[#1e1e1e] text-white font-[600] text-[14px] py-3 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-xs mt-2 btn-press"
      >
        Submit Registration
      </button>

      <div className="text-center text-[13px] text-[#757575] mt-1">
        Already registered?{' '}
        <button
          type="button"
          onClick={() => onSwitch('signin')}
          className="font-[600] text-[#1e1e1e] hover:underline cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </form>
  )
}

function ForgotForm({ onSwitch }: { onSwitch: (v: AuthView) => void }) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  if (sent) {
    return (
      <div className="text-center py-6 flex flex-col items-center gap-3 font-['Inter',sans-serif] animate-fade-in">
        <h2 className="text-[17px] font-[600] text-[#1e1e1e]">Reset Link Dispatched</h2>
        <p className="text-[13px] text-[#757575] max-w-xs leading-relaxed">
          If an account exists for <span className="font-[600] text-[#1e1e1e]">{email}</span>, a secure password reset link has been dispatched.
        </p>
        <button
          onClick={() => onSwitch('signin')}
          className="mt-2 text-[13px] font-[600] text-[#1e1e1e] hover:underline cursor-pointer"
        >
          ← Back to Sign In
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={e => { e.preventDefault(); setSent(true) }} className="flex flex-col gap-4 font-['Inter',sans-serif]">
      <FieldInput label="University Email" id="forgot-email" type="email" value={email} onChange={setEmail} placeholder="yourname@ug.edu.gh" />
      <button
        type="submit"
        className="w-full bg-[#1e1e1e] text-white font-[600] text-[14px] py-3 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-xs btn-press"
      >
        Send Reset Link
      </button>
      <button
        type="button"
        onClick={() => onSwitch('signin')}
        className="text-center text-[13px] text-[#757575] hover:text-[#1e1e1e] cursor-pointer"
      >
        ← Back to Sign In
      </button>
    </form>
  )
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [view, setView] = useState<AuthView>('signin')

  const quickLogin = async (u: MockUser) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: u.id, password: 'password123' }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.token) {
          localStorage.setItem('ses_token', data.token)
        }
      }
    } catch (e) {
      console.warn('Quick login token fetch failed, proceeding with offline user state', e)
    }
    onAuth(u)
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4 md:p-8 font-['Inter',sans-serif] relative">
      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md flex flex-col gap-6 animate-page-enter">
        {/* Top Logo & Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-full bg-[#ffffff] border border-[#d9d9d9] p-1.5 shadow-xs flex items-center justify-center">
            <img src={sesLogo} alt="SES Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <div>
            <h1 className="text-2xl font-[700] text-[#1e1e1e] tracking-tight">SES-GPT</h1>
            <p className="text-[12px] text-[#757575] font-[500] uppercase tracking-wider mt-0.5">
              Integrity and Innovation · School of Engineering Sciences
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {view === 'signin' && <SignInForm onAuth={onAuth} onSwitch={setView} />}
          {view === 'register' && <RegisterForm onSwitch={setView} />}
          {view === 'forgot' && <ForgotForm onSwitch={setView} />}
        </div>

        {/* 1-Click Demo Accounts Grid */}
        <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[14px] p-5 shadow-xs">
          <div className="text-[12px] font-[600] text-[#757575] uppercase tracking-wider mb-3 text-center">
            1-Click Demo Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_USERS.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => quickLogin(u)}
                className="text-left p-2.5 rounded-[8px] bg-[#f5f5f5] hover:bg-[#e5e5e5] border border-[#d9d9d9] transition-all cursor-pointer card-hover"
              >
                <div className="text-[12px] font-[600] text-[#1e1e1e] truncate">{u.name}</div>
                <div className="text-[10px] text-[#757575] capitalize">{u.role} · {u.id}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
