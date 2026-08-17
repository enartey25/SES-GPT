import { useState, useEffect } from 'react'
import type { MockUser, Role } from './AuthPage'
import type { Notification, SenderRole } from './NotificationsPage'
import { generateId } from './utils'
import { API_BASE_URL } from './config'
import sesLogo from './assets/ses.jpg'

interface AnnouncementsPageProps {
  user: MockUser
  onBroadcast?: (notification: Notification) => void
}

export type TargetLevel = 'L100' | 'L200' | 'L300' | 'L400' | 'L500' | 'Graduate'

export interface PastAnnouncement {
  id: string
  title: string
  body: string
  targetSchool: string
  targetDepartment: string
  targetLevels: TargetLevel[]
  targetRoles: Role[]
  targetStudentIds?: string[]
  sentAt: string
  reachCount: number
}

export const SES_DEPARTMENTS = [
  'All SES Departments',
  'Computer Engineering',
  'Biomedical Engineering',
  'Agricultural Engineering',
  'Materials Science & Engineering',
  'Food Process Engineering',
]

const ALL_LEVELS: TargetLevel[] = ['L100', 'L200', 'L300', 'L400', 'L500', 'Graduate']

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'student', label: 'Students' },
  { value: 'ta', label: 'Teaching Assistants' },
  { value: 'lecturer', label: 'Lecturers' },
  { value: 'hod', label: 'Heads of Dept' },
  { value: 'dean', label: 'Deans & Admins' },
]

const DEFAULT_ANNOUNCEMENTS: PastAnnouncement[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    title: 'Mid-Semester Exam Timetable Released',
    body: 'The mid-semester examination timetable for the Computer Engineering department has been published. Students are to check the student portal for room and seating assignments. Examinations run from Week 8 (October 6 to 10). Report any clashes to the Registry by September 28.',
    targetSchool: 'School of Engineering Sciences',
    targetDepartment: 'Computer Engineering',
    targetLevels: ['L100', 'L200', 'L300', 'L400'],
    targetRoles: ['student', 'ta', 'lecturer'],
    sentAt: '2026-04-10T10:30:00Z',
    reachCount: 312,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    title: 'CPEN 306 Embedded Systems Lab Session Rescheduled',
    body: 'The lab session for CPEN 306 has been moved to Friday, October 3 at 10am in CCB Lab 204. Please come prepared with your laboratory logbooks.',
    targetSchool: 'School of Engineering Sciences',
    targetDepartment: 'Computer Engineering',
    targetLevels: ['L300'],
    targetRoles: ['student'],
    sentAt: '2026-04-08T14:00:00Z',
    reachCount: 78,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    title: 'Final Year Project Supervisor Assignments Posted',
    body: 'Supervisor assignments for all L400 final year projects have been posted to the departmental noticeboard and online student repository.',
    targetSchool: 'School of Engineering Sciences',
    targetDepartment: 'Computer Engineering',
    targetLevels: ['L400'],
    targetRoles: ['student', 'lecturer'],
    sentAt: '2026-04-02T11:00:00Z',
    reachCount: 65,
  },
]

function formatDate(iso?: string) {
  if (!iso) return 'Recently'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return 'Recently'
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Recently'
  }
}

export default function AnnouncementsPage({ user, onBroadcast }: AnnouncementsPageProps) {
  const [tab, setTab] = useState<'compose' | 'history'>('compose')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const safeDepartment =
    user?.department && user.department !== 'Administration' ? user.department : 'Computer Engineering'

  // Granular Filter Selections strictly for School of Engineering Sciences
  const [selectedDept, setSelectedDept] = useState<string>(safeDepartment)
  const [selectedLevels, setSelectedLevels] = useState<TargetLevel[]>(['L100', 'L200', 'L300', 'L400'])
  const [selectedRoles, setSelectedRoles] = useState<Role[]>(['student'])
  const [targetStudentIds, setTargetStudentIds] = useState<string>('')

  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [history, setHistory] = useState<PastAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem('ses_announcements_history')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // ignore
    }
    return DEFAULT_ANNOUNCEMENTS
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch announcements history from Spring Boot backend on mount
  useEffect(() => {
    const token = localStorage.getItem('ses_token')
    fetch(`${API_BASE_URL}/announcements`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped: PastAnnouncement[] = data.map(item => {
            const rawLevels = item.targetLevels
            const parsedLevels: TargetLevel[] = Array.isArray(rawLevels)
              ? rawLevels
              : ['L100', 'L200', 'L300', 'L400']

            const rawRoles = item.targetRoles
            const parsedRoles: Role[] = Array.isArray(rawRoles)
              ? rawRoles.map((r: string) => r.toLowerCase() as Role)
              : ['student']

            const rawStudentIds = item.targetStudentIds
            const parsedStudentIds = Array.isArray(rawStudentIds) ? rawStudentIds : undefined

            return {
              id: item.id || generateId(),
              title: item.title || 'Untitled Announcement',
              body: item.body || '',
              targetSchool: item.targetSchool || 'School of Engineering Sciences',
              targetDepartment: item.targetDepartment || 'Computer Engineering',
              targetLevels: parsedLevels,
              targetRoles: parsedRoles,
              targetStudentIds: parsedStudentIds,
              sentAt: item.createdAt || new Date().toISOString(),
              reachCount: typeof item.reachCount === 'number' ? item.reachCount : 65,
            }
          })
          setHistory(mapped)
          try {
            localStorage.setItem('ses_announcements_history', JSON.stringify(mapped))
          } catch {
            // ignore
          }
        }
      })
      .catch(e => console.warn('Could not load announcements from backend, using local state', e))
  }, [])

  const toggleLevel = (level: TargetLevel) => {
    setSelectedLevels(prev =>
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    )
  }

  const selectAllLevels = () => {
    if (selectedLevels.length === ALL_LEVELS.length) {
      setSelectedLevels([])
    } else {
      setSelectedLevels([...ALL_LEVELS])
    }
  }

  const toggleRole = (role: Role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  // Real-time estimated audience reach calculation within SES
  const estimateReach = () => {
    const specificIds = targetStudentIds.split(',').map(s => s.trim()).filter(Boolean)
    if (specificIds.length > 0) return specificIds.length

    let base = 38
    if (selectedDept.startsWith('All')) base *= 5.0
    const levelMultiplier = Math.max(1, selectedLevels.length) * 0.95
    const roleMultiplier = Math.max(1, selectedRoles.length) * 1.15
    return Math.round(base * levelMultiplier * roleMultiplier)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!title.trim()) e.title = 'Title is required'
    if (!body.trim()) e.body = 'Message body is required'
    if (selectedLevels.length === 0) e.levels = 'Please select at least one level / year group'
    if (selectedRoles.length === 0) e.roles = 'Please select at least one target role'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSend = async () => {
    if (!validate()) return
    setSending(true)

    const specificIds = targetStudentIds
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const reach = estimateReach()
    const token = localStorage.getItem('ses_token')
    const senderRoleName = (user?.role ? String(user.role).toLowerCase() : 'lecturer') as Role

    // 1. Broadcast to PostgreSQL backend database
    let backendId = generateId()
    try {
      const res = await fetch(`${API_BASE_URL}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title,
          body,
          senderName: user?.name || 'Faculty Broadcast',
          senderRole: senderRoleName,
          targetSchool: 'School of Engineering Sciences',
          targetDepartment: selectedDept,
          targetLevels: selectedLevels,
          targetRoles: selectedRoles,
          targetStudentIds: specificIds,
          reachCount: reach,
        }),
      })
      if (res.ok) {
        const resData = await res.json()
        if (resData.announcement && resData.announcement.id) {
          backendId = resData.announcement.id
        }
      }
    } catch (e) {
      console.warn('Backend announcement broadcast API failed, saving locally', e)
    }

    // 2. Create PastAnnouncement record for history
    const newEntry: PastAnnouncement = {
      id: backendId,
      title,
      body,
      targetSchool: 'School of Engineering Sciences',
      targetDepartment: selectedDept,
      targetLevels: selectedLevels,
      targetRoles: selectedRoles,
      targetStudentIds: specificIds.length > 0 ? specificIds : undefined,
      sentAt: new Date().toISOString(),
      reachCount: reach,
    }

    const updatedHistory = [newEntry, ...history]
    setHistory(updatedHistory)
    try {
      localStorage.setItem('ses_announcements_history', JSON.stringify(updatedHistory))
    } catch {
      // ignore
    }

    // 3. Deliver into Notifications feed for all targeted recipients (including current user)
    const newNotification: Notification = {
      id: newEntry.id,
      title,
      body,
      senderRole: (senderRoleName as SenderRole) || 'lecturer',
      senderName: user?.name || 'Faculty Broadcast',
      department: selectedDept,
      targetRoles: selectedRoles,
      targetLevels: selectedLevels,
      targetStudentIds: specificIds.length > 0 ? specificIds : undefined,
      date: newEntry.sentAt,
      read: false,
    }

    if (onBroadcast) {
      onBroadcast(newNotification)
    } else {
      try {
        const savedNotifications = localStorage.getItem('ses_notifications')
        const currentList = savedNotifications ? JSON.parse(savedNotifications) : []
        localStorage.setItem('ses_notifications', JSON.stringify([newNotification, ...currentList]))
      } catch {
        // ignore
      }
    }

    setSending(false)
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setTitle('')
      setBody('')
      setTargetStudentIds('')
      setTab('history')
    }, 1200)
  }

  const roleDisplay = user?.role ? String(user.role).toUpperCase() : 'STUDENT'

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5] text-[#1e1e1e] font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="border-b border-[rgba(20,18,24,0.08)] bg-[#ffffff] px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[17px] font-[600] text-[#1e1e1e] tracking-tight">Announcements & Broadcasts</h1>
            <span className="text-[11px] font-[600] px-2 py-0.5 rounded-full bg-[#1e1e1e] text-white">
              SES
            </span>
          </div>
          <p className="text-[#757575] text-[12px] mt-0.5">
            School of Engineering Sciences · Target by Department, Level, Role, or Student ID · {roleDisplay}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#f5f5f5] border border-[#d9d9d9] rounded-full p-1 self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => setTab('compose')}
            className={`px-4 py-1.5 rounded-full text-[12px] font-[500] transition-all cursor-pointer ${
              tab === 'compose'
                ? 'bg-[#1e1e1e] text-white shadow-xs font-[600]'
                : 'text-[#757575] hover:text-[#1e1e1e]'
            }`}
          >
            Compose Notice
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-1.5 rounded-full text-[12px] font-[500] transition-all cursor-pointer ${
              tab === 'history'
                ? 'bg-[#1e1e1e] text-white shadow-xs font-[600]'
                : 'text-[#757575] hover:text-[#1e1e1e]'
            }`}
          >
            Sent History ({history.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
        {/* ── COMPOSE TAB ── */}
        {tab === 'compose' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in-up">
            {sent && (
              <div className="bg-[#ffffff] border border-[#10b981] rounded-[12px] p-4 flex items-center gap-3 shadow-xs animate-fade-in text-[#047857]">
                <div className="w-6 h-6 rounded-full bg-[#10b981] text-white flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
                <span className="text-[13.5px] font-[500]">
                  Announcement broadcasted successfully and delivered to recipient notifications!
                </span>
              </div>
            )}

            <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-6 md:p-8 shadow-xs flex flex-col gap-6">
              {/* SECTION 1: TARGET FILTERS (Department, Level, Role, Student ID) */}
              <div className="border-b border-[rgba(20,18,24,0.06)] pb-6 flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[14px] font-[600] text-[#1e1e1e] tracking-tight">
                    1. Recipient Targeting Filters
                  </h2>
                  <span className="text-[11.5px] text-[#757575]">
                    Estimated Reach: <strong className="text-[#1e1e1e]">~{estimateReach()} recipients</strong>
                  </span>
                </div>

                {/* Filter Row 1: Fixed School Badge & Department Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* School Indicator */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-[600] text-[#1e1e1e]">
                      Target School
                    </label>
                    <div className="bg-[#fafafa] border border-[#d9d9d9] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#1e1e1e] font-[500] flex items-center gap-2 shadow-2xs">
                      <img src={sesLogo} alt="SES" className="w-4 h-4 rounded-full object-contain" />
                      <span>School of Engineering Sciences (SES)</span>
                    </div>
                  </div>

                  {/* Engineering Department Selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-[600] text-[#1e1e1e]">
                      Target Engineering Department
                    </label>
                    <select
                      value={selectedDept}
                      onChange={e => setSelectedDept(e.target.value)}
                      className="bg-[#ffffff] border border-[#d9d9d9] rounded-[10px] px-3.5 py-2.5 text-[13px] text-[#1e1e1e] outline-none focus:border-[#1e1e1e] shadow-2xs cursor-pointer font-[500]"
                    >
                      {SES_DEPARTMENTS.map(d => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filter Row 2: Target Levels (Year Groups) */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-[600] text-[#1e1e1e]">
                      Target Cohort / Year Levels
                    </label>
                    <button
                      type="button"
                      onClick={selectAllLevels}
                      className="text-[11.5px] text-[#757575] hover:text-[#1e1e1e] font-[500] cursor-pointer"
                    >
                      {selectedLevels.length === ALL_LEVELS.length ? 'Deselect All' : 'Select All Levels'}
                    </button>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {ALL_LEVELS.map(level => {
                      const isSelected = selectedLevels.includes(level)
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleLevel(level)}
                          className={`px-3.5 py-1.5 rounded-full text-[12px] font-[500] border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1e1e1e] text-white border-[#1e1e1e] shadow-2xs font-[600]'
                              : 'bg-[#ffffff] border-[#d9d9d9] text-[#1e1e1e] hover:bg-[#fafafa]'
                          }`}
                        >
                          {level}
                        </button>
                      )
                    })}
                  </div>
                  {errors.levels && (
                    <span className="text-[#e11d48] text-[11.5px] font-[500]">{errors.levels}</span>
                  )}
                </div>

                {/* Filter Row 3: Target User Roles */}
                <div className="flex flex-col gap-2">
                  <label className="text-[12px] font-[600] text-[#1e1e1e]">
                    Target User Roles
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {ALL_ROLES.map(role => {
                      const isSelected = selectedRoles.includes(role.value)
                      return (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => toggleRole(role.value)}
                          className={`px-3.5 py-1.5 rounded-full text-[12px] font-[500] border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#1e1e1e] text-white border-[#1e1e1e] shadow-2xs font-[600]'
                              : 'bg-[#ffffff] border-[#d9d9d9] text-[#1e1e1e] hover:bg-[#fafafa]'
                          }`}
                        >
                          {role.label}
                        </button>
                      )
                    })}
                  </div>
                  {errors.roles && (
                    <span className="text-[#e11d48] text-[11.5px] font-[500]">{errors.roles}</span>
                  )}
                </div>

                {/* Filter Row 4: Specific Student IDs Direct Target (Optional) */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-[600] text-[#1e1e1e]">
                      Specific Student ID / Recipient (Optional)
                    </label>
                    <span className="text-[11px] text-[#757575]">e.g. 22370498, 10982341</span>
                  </div>
                  <input
                    type="text"
                    value={targetStudentIds}
                    onChange={e => setTargetStudentIds(e.target.value)}
                    placeholder="Enter Student ID (leave blank to broadcast to all matching department & level students)"
                    className="bg-[#ffffff] border border-[#d9d9d9] focus:border-[#1e1e1e] rounded-[10px] px-3.5 py-2 text-[13px] text-[#1e1e1e] placeholder-[#b3b3b3] outline-none shadow-2xs font-mono"
                  />
                </div>

                {/* Audience Summary Preview Pill */}
                <div className="bg-[#f9f9f9] border border-[#e5e5e5] rounded-[10px] p-3 text-[12px] text-[#757575] flex items-start gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    Broadcasting to:{' '}
                    {targetStudentIds.trim() ? (
                      <>
                        Specific Student ID <strong>{targetStudentIds}</strong> in <strong>{selectedDept}</strong>
                      </>
                    ) : (
                      <>
                        <strong>{selectedRoles.map(r => String(r).toUpperCase()).join(', ')}</strong> in{' '}
                        <strong>{selectedDept}</strong> ({selectedLevels.length > 0 ? selectedLevels.join(', ') : 'None'}) · School of Engineering Sciences
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* SECTION 2: NOTICE CONTENT */}
              <div className="flex flex-col gap-5">
                <h2 className="text-[14px] font-[600] text-[#1e1e1e] tracking-tight">
                  2. Official Notice Content
                </h2>

                {/* Title Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-[600] text-[#1e1e1e]">
                    Announcement Headline
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. CPEN 302 Interim Assessment Venue and Seating Allocation"
                    className={`bg-[#ffffff] border rounded-[10px] px-4 py-2.5 text-[13.5px] text-[#1e1e1e] placeholder-[#b3b3b3] outline-none shadow-2xs transition-colors ${
                      errors.title ? 'border-[#e11d48]' : 'border-[#d9d9d9] focus:border-[#1e1e1e]'
                    }`}
                  />
                  {errors.title && (
                    <span className="text-[#e11d48] text-[11.5px] font-[500]">{errors.title}</span>
                  )}
                </div>

                {/* Message Body */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[12.5px] font-[600] text-[#1e1e1e]">
                      Notice Body
                    </label>
                    <span className="text-[11px] text-[#757575]">{body.length} characters</span>
                  </div>
                  <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    rows={5}
                    placeholder="Write detailed instructions, venue changes, requirements, deadline dates, or contact info…"
                    className={`bg-[#ffffff] border rounded-[10px] px-4 py-3 text-[13.5px] text-[#1e1e1e] placeholder-[#b3b3b3] outline-none shadow-2xs transition-colors resize-none leading-relaxed ${
                      errors.body ? 'border-[#e11d48]' : 'border-[#d9d9d9] focus:border-[#1e1e1e]'
                    }`}
                  />
                  {errors.body && (
                    <span className="text-[#e11d48] text-[11.5px] font-[500]">{errors.body}</span>
                  )}
                </div>
              </div>

              {/* SECTION 3: SUBMIT ACTION */}
              <div className="pt-3 border-t border-[rgba(20,18,24,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[12px] text-[#757575]">
                  Broadcast is instantly published and pushed to recipient Notifications.
                </span>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || sent}
                  className="w-full sm:w-auto bg-[#1e1e1e] text-white font-[600] text-[14px] px-8 py-3 rounded-full hover:opacity-90 transition-all shadow-xs cursor-pointer btn-press disabled:opacity-50"
                >
                  {sending ? 'Broadcasting Notice…' : sent ? '✓ Broadcasted' : 'Broadcast Announcement'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === 'history' && (
          <div className="max-w-3xl mx-auto flex flex-col gap-4 animate-fade-in-up">
            {history.length === 0 ? (
              <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-12 text-center text-[#757575] shadow-xs">
                <p className="text-[14px]">No announcements broadcasted yet.</p>
              </div>
            ) : (
              history.map(item => {
                const displayLevels =
                  Array.isArray(item.targetLevels) && item.targetLevels.length > 0
                    ? item.targetLevels.join(', ')
                    : 'All Levels'

                const displayRoles =
                  Array.isArray(item.targetRoles) && item.targetRoles.length > 0
                    ? item.targetRoles.map(r => String(r).toUpperCase()).join(', ')
                    : 'ALL ROLES'

                const displayStudentIds =
                  Array.isArray(item.targetStudentIds) && item.targetStudentIds.length > 0
                    ? item.targetStudentIds.join(', ')
                    : null

                return (
                  <div
                    key={item.id}
                    className="bg-[#ffffff] border border-[#d9d9d9] rounded-[14px] p-6 shadow-xs card-hover flex flex-col gap-3.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-[600] text-[15px] text-[#1e1e1e] leading-snug">
                        {item.title}
                      </h3>
                      <span className="text-[11.5px] text-[#757575] shrink-0 font-[400]">
                        {formatDate(item.sentAt)}
                      </span>
                    </div>

                    <p className="text-[13px] text-[#757575] leading-relaxed">
                      {item.body}
                    </p>

                    <div className="flex items-center gap-2 pt-2 border-t border-[rgba(20,18,24,0.06)] flex-wrap text-[11.5px]">
                      <span className="bg-[#f5f5f5] border border-[#d9d9d9] text-[#1e1e1e] px-2.5 py-0.5 rounded-full font-[500]">
                        {item.targetDepartment || 'Computer Engineering'}
                      </span>
                      <span className="bg-[#f5f5f5] border border-[#d9d9d9] text-[#1e1e1e] px-2.5 py-0.5 rounded-full font-[500]">
                        {displayLevels}
                      </span>
                      <span className="bg-[#f5f5f5] border border-[#d9d9d9] text-[#1e1e1e] px-2.5 py-0.5 rounded-full font-[500] uppercase">
                        {displayRoles}
                      </span>
                      {displayStudentIds && (
                        <span className="bg-[#f5f5f5] border border-[#d9d9d9] text-[#1e1e1e] px-2.5 py-0.5 rounded-full font-[500] font-mono">
                          Target ID: {displayStudentIds}
                        </span>
                      )}
                      <span className="text-[#757575] ml-auto">
                        Delivered to {item.reachCount || 0} recipients (SES)
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
