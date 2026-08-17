import { useState, useEffect, useCallback } from 'react'
import type { MockUser, Role } from './AuthPage'
import { DEPARTMENTS } from './AuthPage'
import AvatarViewerModal from './AvatarViewerModal'
import { API_BASE_URL } from './config'

interface UsersPageProps { user: MockUser }

export interface ManagedUser {
  id: string
  studentId?: string
  name: string
  email: string
  role: Role
  department: string
  level?: string
  avatarUrl?: string
  status: 'active' | 'pending' | 'suspended'
  joinedAt?: string
}

const MOCK_MANAGED: ManagedUser[] = [
  { id: '10671234', studentId: '10671234', name: 'Ama Owusu', email: 'ama.owusu@ug.edu.gh', role: 'student', department: 'Computer Engineering', level: 'L300', status: 'active', joinedAt: '2024-09-01' },
  { id: '10672345', studentId: '10672345', name: 'Kwabena Asare', email: 'kasare@ug.edu.gh', role: 'student', department: 'Agricultural Engineering', level: 'L200', status: 'active', joinedAt: '2025-01-10' },
  { id: '10673456', studentId: '10673456', name: 'Abena Frimpong', email: 'afrimpong@ug.edu.gh', role: 'student', department: 'Materials Science and Engineering', level: 'L400', status: 'pending', joinedAt: '2025-09-01' },
  { id: '10674567', studentId: '10674567', name: 'Yaw Darko', email: 'ydarko@ug.edu.gh', role: 'student', department: 'Food Process Engineering', level: 'L100', status: 'pending', joinedAt: '2025-09-01' },
  { id: 'TA-011', studentId: 'TA-011', name: 'Emmanuel Ansah', email: 'e.ansah@ug.edu.gh', role: 'ta', department: 'Biomedical Engineering', status: 'active', joinedAt: '2024-08-20' },
  { id: 'STF-0042', studentId: 'STF-0042', name: 'Dr. Kwame Mensah', email: 'kmensah@ug.edu.gh', role: 'lecturer', department: 'Computer Engineering', status: 'active', joinedAt: '2023-01-05' },
  { id: '10675678', studentId: '10675678', name: 'Adjoa Nyarko', email: 'anyarko@ug.edu.gh', role: 'student', department: 'Biomedical Engineering', level: 'L300', status: 'suspended', joinedAt: '2024-09-01' },
]

function roleBadgeClass(role: Role) {
  const map: Record<Role, string> = {
    student: 'role-student', lecturer: 'role-lecturer', ta: 'role-ta',
    hod: 'role-hod', dean: 'role-dean', admin: 'role-admin',
  }
  return map[role] || 'role-student'
}

function StatusBadge({ status }: { status: ManagedUser['status'] }) {
  const map = {
    active: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    pending: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    suspended: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
  }
  return (
    <span style={{ fontFamily: 'var(--font-mono)' }}
      className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide inline-flex items-center gap-1 ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400' : status === 'pending' ? 'bg-amber-400 animate-pulse' : 'bg-rose-400'}`} />
      {status}
    </span>
  )
}

export default function UsersPage({ user: admin }: UsersPageProps) {
  const [users, setUsers] = useState<ManagedUser[]>(MOCK_MANAGED)
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all')
  const [filterDept, setFilterDept] = useState<string | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<ManagedUser['status'] | 'all'>('all')
  const [selectedUserForAvatar, setSelectedUserForAvatar] = useState<ManagedUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch real users from backend API
  const fetchUsers = useCallback(async () => {
    const token = localStorage.getItem('ses_token')
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          const mapped: ManagedUser[] = data.map((u: any) => ({
            id: u.id || u.studentId,
            studentId: u.studentId || u.id,
            name: u.name,
            email: u.email,
            role: (u.role?.toLowerCase() || 'student') as Role,
            department: u.department || 'Computer Engineering',
            level: u.level || undefined,
            status: !u.active ? 'suspended' : (!u.verified ? 'pending' : 'active'),
            joinedAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2025-01-01',
          }))
          setUsers(mapped)
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, using localized database state.', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Approve a pending user registration
  const approveUser = async (targetId: string, studentId?: string) => {
    const lookupKey = studentId || targetId
    setActionLoading(lookupKey)
    const token = localStorage.getItem('ses_token')

    try {
      if (token) {
        const res = await fetch(`${API_BASE_URL}/users/${lookupKey}/verify`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          // Retry with alternate ID if available
          if (targetId && targetId !== lookupKey) {
            await fetch(`${API_BASE_URL}/users/${targetId}/verify`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}` },
            })
          }
        }
      }
    } catch (e) {
      console.error('Backend verify failed, updating in local state', e)
    }

    setUsers(prev => prev.map(u => (u.id === targetId || u.studentId === lookupKey ? { ...u, status: 'active' } : u)))
    setActionLoading(null)
    showToast(`Approved registration for user (${lookupKey}) successfully!`, 'success')
  }

  // Suspend an active user
  const suspendUser = async (targetId: string, studentId?: string) => {
    const lookupKey = studentId || targetId
    setActionLoading(lookupKey)
    const token = localStorage.getItem('ses_token')

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/users/${lookupKey}/suspend`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (e) {
      console.error('Backend suspend failed, updating in local state', e)
    }

    setUsers(prev => prev.map(u => (u.id === targetId || u.studentId === lookupKey ? { ...u, status: 'suspended' } : u)))
    setActionLoading(null)
    showToast(`User (${lookupKey}) has been suspended.`, 'error')
  }

  // Reinstate a suspended user
  const reinstateUser = async (targetId: string, studentId?: string) => {
    const lookupKey = studentId || targetId
    setActionLoading(lookupKey)
    const token = localStorage.getItem('ses_token')

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/users/${lookupKey}/reinstate`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (e) {
      console.error('Backend reinstate failed, updating in local state', e)
    }

    setUsers(prev => prev.map(u => (u.id === targetId || u.studentId === lookupKey ? { ...u, status: 'active' } : u)))
    setActionLoading(null)
    showToast(`Reinstated user (${lookupKey}) to active status.`, 'success')
  }

  const filtered = users.filter(u => {
    const s = search.toLowerCase()
    const matchSearch = !s || u.name.toLowerCase().includes(s) || u.id.includes(s) || (u.studentId && u.studentId.includes(s)) || u.email.toLowerCase().includes(s)
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchDept = filterDept === 'all' || u.department.toLowerCase() === filterDept.toLowerCase()
    const matchStatus = filterStatus === 'all' || u.status === filterStatus
    return matchSearch && matchRole && matchDept && matchStatus
  })

  const pendingUsers = users.filter(u => u.status === 'pending')

  return (
    <div className="flex flex-col h-full bg-navy-950 text-slate-200" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-fade-in-up ${toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-400/40 text-emerald-200' : 'bg-rose-950/90 border-rose-400/40 text-rose-200'
          }`}>
          <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          <span style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 border-b border-navy-700 bg-navy-950/90 px-6 py-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 00-3-3.87" />
                  <path d="M16 3.13a4 4 0 010 7.75" />
                </svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-mono)' }} className="text-white font-bold text-lg tracking-tight">
                SES Admin & User Approvals
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-cyan-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {admin.id}
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Manage accounts across the 5 School of Engineering Sciences departments. Approve student and faculty registrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="text-xs font-medium text-slate-300 hover:text-cyan-400 bg-navy-800 border border-navy-600 hover:border-cyan-400/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={loading ? 'animate-spin' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>{loading ? 'Refreshing…' : 'Sync Database'}</span>
            </button>
          </div>
        </div>

        {/* Pending Approvals Quick Action Banner */}
        {pendingUsers.length > 0 && (
          <div className="mb-4 bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h2 style={{ fontFamily: 'var(--font-mono)' }} className="text-amber-300 text-xs font-bold">
                  {pendingUsers.length} Registration{pendingUsers.length > 1 ? 's' : ''} Awaiting Admin Approval
                </h2>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Unverified users cannot log in or submit RAG queries until approved by ADM-001.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  pendingUsers.forEach(u => approveUser(u.id, u.studentId))
                }}
                className="bg-emerald-400 text-navy-950 hover:bg-emerald-300 transition-colors font-semibold text-xs px-3.5 py-1.5 rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Approve All Pending ({pendingUsers.length})
              </button>
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="flex items-center gap-2 bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 glow-focus">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, ID or email…"
              className="flex-1 bg-transparent text-slate-200 text-xs placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Department Filter (5 official SES depts) */}
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none cursor-pointer"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <option value="all">All 5 Departments</option>
            {DEPARTMENTS.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={e => setFilterRole(e.target.value as Role | 'all')}
            className="bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none cursor-pointer"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <option value="all">All Roles</option>
            {(['student', 'ta', 'lecturer', 'hod', 'dean', 'admin'] as Role[]).map(r => (
              <option key={r} value={r} className="capitalize">
                {r.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ManagedUser['status'] | 'all')}
            className="bg-navy-800 border border-navy-600 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none cursor-pointer"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            <option value="all">All Statuses ({users.length})</option>
            <option value="pending">Pending Approval ({pendingUsers.length})</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="border border-navy-700 rounded-2xl overflow-hidden bg-navy-900/60 shadow-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-navy-900 border-b border-navy-700">
              <tr>
                {['User', 'Student / Staff ID', 'Role & Level', 'SES Department', 'Status', 'Admin Actions'].map(h => (
                  <th
                    key={h}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    className="text-[10px] uppercase tracking-widest text-slate-400 px-4 py-3.5 font-semibold"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {filtered.map(u => {
                const isLoading = actionLoading === (u.studentId || u.id)
                return (
                  <tr key={u.id} className="hover:bg-navy-800/40 transition-colors">
                    {/* User info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedUserForAvatar(u)}
                          className="w-8 h-8 rounded-full bg-[#d9d9d9] border border-[#d9d9d9] flex items-center justify-center text-xs font-bold text-[#1e1e1e] shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#1e1e1e]/20 transition-all"
                          title={`Click to view ${u.name}'s profile photo`}
                        >
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          )}
                        </button>
                        <div className="min-w-0">
                          <div className="text-slate-100 font-semibold text-xs truncate">{u.name}</div>
                          <div className="text-slate-500 text-[10px] truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* ID */}
                    <td className="px-4 py-3.5">
                      <span style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-300 font-mono text-xs">
                        {u.studentId || u.id}
                      </span>
                    </td>

                    {/* Role & Level */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`role-badge ${roleBadgeClass(u.role)}`}>{u.role}</span>
                        {u.level && (
                          <span
                            style={{ fontFamily: 'var(--font-mono)' }}
                            className="text-[10px] bg-navy-800 border border-navy-700 text-slate-400 px-1.5 py-0.5 rounded font-medium"
                          >
                            {u.level}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Department */}
                    <td className="px-4 py-3.5">
                      <span className="text-slate-300 font-medium text-xs">
                        {u.department}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <StatusBadge status={u.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        {u.status === 'pending' && (
                          <button
                            onClick={() => approveUser(u.id, u.studentId)}
                            disabled={isLoading}
                            className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-400/15 border border-emerald-400/40 text-emerald-300 hover:bg-emerald-400 hover:text-navy-950 transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-50"
                            style={{ fontFamily: 'var(--font-mono)' }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>{isLoading ? 'Approving…' : 'Approve User'}</span>
                          </button>
                        )}

                        {u.status === 'active' && (
                          <button
                            onClick={() => suspendUser(u.id, u.studentId)}
                            disabled={isLoading}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-navy-800 border border-navy-700 text-slate-400 hover:border-rose-400/40 hover:bg-rose-400/10 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            style={{ fontFamily: 'var(--font-mono)' }}
                            title="Suspend user access"
                          >
                            <span>Suspend</span>
                          </button>
                        )}

                        {u.status === 'suspended' && (
                          <button
                            onClick={() => reinstateUser(u.id, u.studentId)}
                            disabled={isLoading}
                            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-navy-800 border border-navy-700 text-slate-400 hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            style={{ fontFamily: 'var(--font-mono)' }}
                            title="Reinstate user access"
                          >
                            <span>Reinstate</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-slate-500 text-xs">
              No users found matching the selected search criteria or filters.
            </div>
          )}
        </div>
      </div>

      {/* Avatar Full-Screen Viewer Modal */}
      <AvatarViewerModal
        isOpen={!!selectedUserForAvatar}
        onClose={() => setSelectedUserForAvatar(null)}
        name={selectedUserForAvatar?.name || ''}
        avatarUrl={selectedUserForAvatar?.avatarUrl}
        subtitle={`${selectedUserForAvatar?.department || ''} ${selectedUserForAvatar?.level ? `· ${selectedUserForAvatar.level}` : ''}`}
        role={selectedUserForAvatar?.role}
        studentId={selectedUserForAvatar?.studentId || selectedUserForAvatar?.id}
      />
    </div>
  )
}
