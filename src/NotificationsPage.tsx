import { useState, useEffect } from 'react'
import type { MockUser, Role } from './AuthPage'
import { API_BASE_URL } from './config'

export type SenderRole = 'ta' | 'lecturer' | 'hod' | 'dean' | 'admin'

export interface Notification {
  id: string
  title: string
  body: string
  senderRole: SenderRole
  senderName: string
  department: string
  targetRoles: Role[]
  targetLevels?: string[]
  targetStudentIds?: string[]
  date: string
  read: boolean
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Mid-Semester Exam Timetable Released',
    body: 'The mid-semester examination timetable for the Computer Engineering department has been published. Students are to check the student portal for room and seating assignments. Examinations run from Week 8 (October 6–10). Report any clashes to the Registry by September 28.',
    senderRole: 'hod',
    senderName: 'Prof. Aba Bentil',
    department: 'Computer Engineering',
    targetRoles: ['student', 'ta', 'lecturer'],
    targetLevels: ['L100', 'L200', 'L300', 'L400'],
    date: '2026-04-10T10:30:00Z',
    read: false,
  },
  {
    id: '2',
    title: 'CPEN 302 Interim Assessment Venue Update',
    body: 'The interim assessment for CPEN 302 (Computer Networks) originally scheduled for CCB Lab 2 has been moved to CCB Lab 3 at 2:00 PM. Please report 15 minutes before the session with your UG Student ID.',
    senderRole: 'lecturer',
    senderName: 'Dr. Kwame Mensah',
    department: 'Computer Engineering',
    targetRoles: ['student'],
    targetLevels: ['L300'],
    date: '2026-04-08T14:00:00Z',
    read: false,
  },
  {
    id: '3',
    title: 'SES Annual Engineering Colloquium',
    body: 'The School of Engineering Sciences Annual Research Colloquium is scheduled for next month. Faculty, lecturers, and students are invited to submit project abstracts. Submission portal: ses.ug.edu.gh/colloquium.',
    senderRole: 'dean',
    senderName: 'Prof. Elvis Nyarko',
    department: 'School of Engineering Sciences',
    targetRoles: ['student', 'lecturer', 'ta', 'hod'],
    date: '2026-04-05T09:00:00Z',
    read: true,
  },
  {
    id: '4',
    title: 'TA Office Hours and Tutorial Sessions',
    body: 'Office hours will be held on Monday 3–5 PM and Wednesday 2–4 PM in Room 118. Please bring your tutorial problem sets. Attendance is encouraged.',
    senderRole: 'ta',
    senderName: 'Emmanuel Ansah',
    department: 'Biomedical Engineering',
    targetRoles: ['student'],
    targetLevels: ['L200'],
    date: '2026-04-02T08:00:00Z',
    read: true,
  },
]

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface NotificationsPageProps {
  user: MockUser
  notifications?: Notification[]
  onUpdateNotifications?: (notifications: Notification[]) => void
}

export default function NotificationsPage({
  user,
  notifications: propsNotifications,
  onUpdateNotifications,
}: NotificationsPageProps) {
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('ses_notifications')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return MOCK_NOTIFICATIONS
  })

  const notifications = propsNotifications || localNotifications
  const [selected, setSelected] = useState<Notification | null>(notifications[0] || null)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all')

  // Fetch notifications from Spring Boot backend on mount
  useEffect(() => {
    const token = localStorage.getItem('ses_token')
    const query = user?.studentId ? `?studentId=${encodeURIComponent(user.studentId)}` : ''
    fetch(`${API_BASE_URL}/notifications${query}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
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
          updateNotifications(mapped)
          if (!selected && mapped.length > 0) {
            setSelected(mapped[0])
          }
        }
      })
      .catch(e => console.warn('Could not load notifications from backend, using local state', e))
  }, [user?.studentId])

  const updateNotifications = (newList: Notification[]) => {
    if (onUpdateNotifications) {
      onUpdateNotifications(newList)
    } else {
      setLocalNotifications(newList)
    }
    try {
      localStorage.setItem('ses_notifications', JSON.stringify(newList))
    } catch {
      // ignore
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    updateNotifications(updated)

    const token = localStorage.getItem('ses_token')
    const query = user?.studentId ? `?studentId=${encodeURIComponent(user.studentId)}` : ''
    fetch(`${API_BASE_URL}/notifications/read-all${query}`, {
      method: 'PUT',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).catch(e => console.warn('Backend markAllRead failed', e))
  }

  const handleSelect = (n: Notification) => {
    setSelected(n)
    if (!n.read) {
      const updated = notifications.map(item => (item.id === n.id ? { ...item, read: true } : item))
      updateNotifications(updated)

      const token = localStorage.getItem('ses_token')
      fetch(`${API_BASE_URL}/notifications/${n.id}/read`, {
        method: 'PUT',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }).catch(e => console.warn('Backend markRead failed', e))
    }
  }

  const filtered = notifications.filter(n => {
    const roleMatch = filterRole === 'all' || n.senderRole === filterRole
    const readMatch =
      filterRead === 'all' ? true : filterRead === 'unread' ? !n.read : n.read
    return roleMatch && readMatch
  })

  const ROLE_FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'hod', label: 'HOD' },
    { value: 'dean', label: 'Dean' },
    { value: 'lecturer', label: 'Lecturers' },
    { value: 'ta', label: 'TAs' },
  ]

  const SENDER_BADGE_STYLE: Record<SenderRole, string> = {
    dean: 'bg-[#1e1e1e] text-white',
    hod: 'bg-[#1e1e1e] text-white',
    lecturer: 'bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9]',
    ta: 'bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9]',
    admin: 'bg-[#1e1e1e] text-white',
  }

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5] text-[#1e1e1e] font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="border-b border-[rgba(20,18,24,0.08)] bg-[#ffffff] px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-[600] text-[#1e1e1e] tracking-tight">Notifications</h1>
          <p className="text-[#757575] text-[12px] mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'} · Filtered for {user.role} ({user.department})
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-[13px] font-[500] text-[#1e1e1e] hover:text-[#757575] transition-colors cursor-pointer"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Main Container: Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Notification List */}
        <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-r border-[rgba(20,18,24,0.08)] bg-[#ffffff] flex flex-col">
          {/* Filters Bar */}
          <div className="p-3 border-b border-[rgba(20,18,24,0.06)] flex flex-col gap-2">
            {/* Sender Role Filter */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {ROLE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFilterRole(f.value)}
                  className={`text-[11.5px] font-[500] px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                    filterRole === f.value
                      ? 'bg-[#1e1e1e] text-white'
                      : 'bg-[#f5f5f5] text-[#757575] hover:text-[#1e1e1e]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Read/Unread Filter */}
            <div className="flex items-center gap-1">
              {(['all', 'unread', 'read'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterRead(f)}
                  className={`text-[11px] font-[500] px-2 py-0.5 rounded-[4px] capitalize transition-colors cursor-pointer ${
                    filterRead === f
                      ? 'bg-[#1e1e1e] text-white'
                      : 'text-[#757575] hover:text-[#1e1e1e]'
                  }`}
                >
                  {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-[rgba(20,18,24,0.05)]">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-[#757575]">
                <p className="text-[13px]">No notifications match your filters.</p>
              </div>
            ) : (
              filtered.map(n => {
                const isSelected = selected?.id === n.id
                return (
                  <button
                    key={n.id}
                    onClick={() => handleSelect(n)}
                    className={`w-full p-4 text-left transition-colors cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-[#f5f5f5]'
                        : n.read
                        ? 'hover:bg-[#fafafa]'
                        : 'bg-[#ffffff] hover:bg-[#fafafa]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#1e1e1e] shrink-0" />
                        )}
                        <span
                          className={`text-[10px] font-[600] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            SENDER_BADGE_STYLE[n.senderRole]
                          }`}
                        >
                          {n.senderRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#757575]">{formatDate(n.date)}</span>
                    </div>

                    <h3
                      className={`text-[13.5px] leading-snug ${
                        n.read ? 'font-[400] text-[#757575]' : 'font-[600] text-[#1e1e1e]'
                      }`}
                    >
                      {n.title}
                    </h3>

                    <p className="text-[12px] text-[#757575] line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>

                    <div className="text-[11px] text-[#b3b3b3] pt-0.5">
                      From: {n.senderName} · {n.department}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Notification Reading Pane */}
        <div className="hidden md:flex flex-1 bg-[#f5f5f5] p-6 lg:p-10 overflow-y-auto flex-col">
          {selected ? (
            <div className="max-w-2xl bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-8 shadow-xs flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-2 pb-6 border-b border-[#e5e5e5]">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-[600] uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      SENDER_BADGE_STYLE[selected.senderRole]
                    }`}
                  >
                    {selected.senderRole} Announcement
                  </span>
                  <span className="text-[12px] text-[#757575]">
                    {formatDate(selected.date)}
                  </span>
                </div>
                <h2 className="text-[20px] font-[700] text-[#1e1e1e] tracking-tight leading-snug">
                  {selected.title}
                </h2>
                <div className="flex items-center gap-2 text-[12.5px] text-[#757575]">
                  <span>By <strong className="text-[#1e1e1e]">{selected.senderName}</strong></span>
                  <span>·</span>
                  <span>{selected.department}</span>
                </div>
              </div>

              {/* Body */}
              <div className="text-[14px] leading-relaxed text-[#1e1e1e] font-[400]">
                {selected.body}
              </div>

              {/* Targeting Metadata */}
              <div className="pt-4 border-t border-[#e5e5e5] flex flex-wrap gap-2 items-center text-[12px] text-[#757575]">
                <span>Targeted to:</span>
                {selected.targetRoles.map(r => (
                  <span
                    key={r}
                    className="bg-[#f5f5f5] border border-[#d9d9d9] px-2 py-0.5 rounded-[4px] font-[500] text-[#1e1e1e]"
                  >
                    {r}
                  </span>
                ))}
                {selected.targetLevels && selected.targetLevels.map(lvl => (
                  <span
                    key={lvl}
                    className="bg-[#f5f5f5] border border-[#d9d9d9] px-2 py-0.5 rounded-[4px] font-[500] text-[#1e1e1e]"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#757575] text-[13px]">
              Select a notification from the list to view full details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
