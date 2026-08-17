import React, { useState, useEffect, useCallback } from 'react'
import type { MockUser, Role } from './AuthPage'
import { DEPARTMENTS } from './AuthPage'
import AvatarViewerModal from './AvatarViewerModal'
import { API_BASE_URL } from './config'

interface UsersPageProps {
  user: MockUser
}

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
  {
    id: '10671234',
    studentId: '10671234',
    name: 'Ama Owusu',
    email: 'ama.owusu@ug.edu.gh',
    role: 'student',
    department: 'Computer Engineering',
    level: 'L300',
    status: 'active',
    joinedAt: '2024-09-01',
  },
  {
    id: '10672345',
    studentId: '10672345',
    name: 'Kwabena Asare',
    email: 'kasare@ug.edu.gh',
    role: 'student',
    department: 'Agricultural Engineering',
    level: 'L200',
    status: 'active',
    joinedAt: '2025-01-10',
  },
  {
    id: '10673456',
    studentId: '10673456',
    name: 'Abena Frimpong',
    email: 'afrimpong@ug.edu.gh',
    role: 'student',
    department: 'Materials Science and Engineering',
    level: 'L400',
    status: 'pending',
    joinedAt: '2025-09-01',
  },
  {
    id: '10674567',
    studentId: '10674567',
    name: 'Yaw Darko',
    email: 'ydarko@ug.edu.gh',
    role: 'student',
    department: 'Food Process Engineering',
    level: 'L100',
    status: 'pending',
    joinedAt: '2025-09-01',
  },
  {
    id: 'TA-011',
    studentId: 'TA-011',
    name: 'Emmanuel Ansah',
    email: 'e.ansah@ug.edu.gh',
    role: 'ta',
    department: 'Biomedical Engineering',
    status: 'active',
    joinedAt: '2024-08-20',
  },
  {
    id: 'STF-0042',
    studentId: 'STF-0042',
    name: 'Dr. Godfrey Mills',
    email: 'gmills@ug.edu.gh',
    role: 'lecturer',
    department: 'Computer Engineering',
    status: 'active',
    joinedAt: '2023-01-05',
  },
  {
    id: '10675678',
    studentId: '10675678',
    name: 'Adjoa Nyarko',
    email: 'anyarko@ug.edu.gh',
    role: 'student',
    department: 'Biomedical Engineering',
    level: 'L300',
    status: 'suspended',
    joinedAt: '2024-09-01',
  },
  {
    id: 'HOD-002',
    studentId: 'HOD-002',
    name: 'Prof. Aba Bentil',
    email: 'hod.ce@ug.edu.gh',
    role: 'hod',
    department: 'Computer Engineering',
    status: 'active',
    joinedAt: '2022-08-15',
  },
  {
    id: 'DEAN-001',
    studentId: 'DEAN-001',
    name: 'Prof. Elvis Nyarko',
    email: 'dean.ses@ug.edu.gh',
    role: 'dean',
    department: 'Materials Science and Engineering',
    status: 'active',
    joinedAt: '2021-02-01',
  },
]

const ROLE_LABELS: Record<Role, { label: string; badge: string }> = {
  student: { label: 'Student', badge: 'bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9]' },
  ta: { label: 'Teaching Assistant', badge: 'bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9]' },
  lecturer: { label: 'Lecturer', badge: 'bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9]' },
  hod: { label: 'Head of Dept', badge: 'bg-[#1e1e1e] text-white border border-[#1e1e1e]' },
  dean: { label: 'Dean', badge: 'bg-[#1e1e1e] text-white border border-[#1e1e1e]' },
  admin: { label: 'Administrator', badge: 'bg-[#1e1e1e] text-white border border-[#1e1e1e]' },
}

const ALL_ROLES: { value: Role; label: string }[] = [
  { value: 'student', label: 'Students' },
  { value: 'ta', label: 'Teaching Assistants' },
  { value: 'lecturer', label: 'Lecturers' },
  { value: 'hod', label: 'Heads of Dept' },
  { value: 'dean', label: 'Deans' },
  { value: 'admin', label: 'Administrators' },
]

function StatusBadge({ status }: { status: ManagedUser['status'] }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600] bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1e1e1e]" />
        Active
      </span>
    )
  }
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600] bg-[#f5f5f5] text-[#1e1e1e] border border-[#d9d9d9]">
        <span className="w-1.5 h-1.5 rounded-full border border-[#1e1e1e] animate-pulse" />
        Pending Approval
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-[600] bg-[#1e1e1e] text-white border border-[#1e1e1e]">
      <span className="w-1.5 h-1.5 rounded-full bg-white" />
      Suspended
    </span>
  )
}

export default function UsersPage({ user: admin }: UsersPageProps) {
  const [users, setUsers] = useState<ManagedUser[]>(() => {
    try {
      const saved = localStorage.getItem('ses_managed_users')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {
      // ignore
    }
    return MOCK_MANAGED
  })

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<Role | 'all'>('all')
  const [filterDept, setFilterDept] = useState<string | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<ManagedUser['status'] | 'all'>('all')
  const [selectedUserForAvatar, setSelectedUserForAvatar] = useState<ManagedUser | null>(null)
  const [roleModalUser, setRoleModalUser] = useState<ManagedUser | null>(null)
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    studentId: '',
    email: '',
    role: 'student' as Role,
    department: 'Computer Engineering',
    level: 'L100',
    password: '',
  })
  const [formError, setFormError] = useState('')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Save to local storage on state change
  useEffect(() => {
    try {
      localStorage.setItem('ses_managed_users', JSON.stringify(users))
    } catch {
      // ignore
    }
  }, [users])

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
            status: !u.active ? 'suspended' : !u.verified ? 'pending' : 'active',
            joinedAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '2025-01-01',
          }))
          setUsers(mapped)
          showToast('User directory synchronized with backend database.', 'success')
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

    setUsers(prev =>
      prev.map(u => (u.id === targetId || u.studentId === lookupKey ? { ...u, status: 'active' } : u))
    )
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

    setUsers(prev =>
      prev.map(u => (u.id === targetId || u.studentId === lookupKey ? { ...u, status: 'suspended' } : u))
    )
    setActionLoading(null)
    showToast(`Account (${lookupKey}) has been suspended.`, 'error')
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

    setUsers(prev =>
      prev.map(u => (u.id === targetId || u.studentId === lookupKey ? { ...u, status: 'active' } : u))
    )
    setActionLoading(null)
    showToast(`Reinstated account (${lookupKey}) to active status.`, 'success')
  }

  // Update user role
  const handleUpdateRole = async (targetUser: ManagedUser, newRole: Role) => {
    const lookupKey = targetUser.studentId || targetUser.id
    setActionLoading(lookupKey)
    const token = localStorage.getItem('ses_token')

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/users/${lookupKey}/role`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: newRole.toUpperCase() }),
        })
      }
    } catch (e) {
      console.error('Backend role change failed, updating in local state', e)
    }

    setUsers(prev =>
      prev.map(u => (u.id === targetUser.id || u.studentId === lookupKey ? { ...u, role: newRole } : u))
    )
    setActionLoading(null)
    setRoleModalUser(null)
    showToast(`Updated role for ${targetUser.name} to ${ROLE_LABELS[newRole].label}.`, 'success')
  }

  // Handle Add User Submit
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserForm.name.trim() || !newUserForm.studentId.trim() || !newUserForm.email.trim()) {
      setFormError('Please fill in all required fields.')
      return
    }

    const newUser: ManagedUser = {
      id: newUserForm.studentId.trim(),
      studentId: newUserForm.studentId.trim(),
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim(),
      role: newUserForm.role,
      department: newUserForm.department,
      level: newUserForm.role === 'student' ? newUserForm.level : undefined,
      status: 'active',
      joinedAt: new Date().toISOString().split('T')[0],
    }

    setUsers(prev => [newUser, ...prev])
    setIsAddUserOpen(false)
    setNewUserForm({
      name: '',
      studentId: '',
      email: '',
      role: 'student',
      department: 'Computer Engineering',
      level: 'L100',
      password: '',
    })
    setFormError('')
    showToast(`Created user account for ${newUser.name} successfully!`, 'success')
  }

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Name', 'ID', 'Email', 'Role', 'Department', 'Level', 'Status', 'Joined Date']
    const rows = filtered.map(u => [
      `"${u.name}"`,
      `"${u.studentId || u.id}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.department}"`,
      `"${u.level || ''}"`,
      `"${u.status}"`,
      `"${u.joinedAt || ''}"`,
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ses_user_directory_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Exported user directory to CSV.', 'success')
  }

  const filtered = users.filter(u => {
    const s = search.toLowerCase()
    const matchSearch =
      !s ||
      u.name.toLowerCase().includes(s) ||
      u.id.toLowerCase().includes(s) ||
      (u.studentId && u.studentId.toLowerCase().includes(s)) ||
      u.email.toLowerCase().includes(s)
    const matchRole = filterRole === 'all' || u.role === filterRole
    const matchDept = filterDept === 'all' || u.department.toLowerCase() === filterDept.toLowerCase()
    const matchStatus = filterStatus === 'all' || u.status === filterStatus
    return matchSearch && matchRole && matchDept && matchStatus
  })

  const pendingUsers = users.filter(u => u.status === 'pending')
  const activeUsers = users.filter(u => u.status === 'active')
  const suspendedUsers = users.filter(u => u.status === 'suspended')

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5] text-[#1e1e1e] font-['Inter',sans-serif] overflow-y-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-full shadow-2xl border border-[#d9d9d9] bg-[#1e1e1e] text-white flex items-center gap-3 animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-white" />
          <span className="text-[13px] font-[500]">{toast.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-[600] bg-[#1e1e1e] text-white">
                Admin Console
              </span>
              <span className="text-[12px] text-[#757575] font-[500]">
                Logged in as <strong className="text-[#1e1e1e]">{admin.name}</strong> ({admin.id})
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-[700] text-[#1e1e1e] tracking-tight">
              User Management & Access Control
            </h1>
            <p className="text-[13px] text-[#757575] mt-1 max-w-2xl">
              Authorize user registrations, manage permissions, and supervise accounts across the 5 School of Engineering Sciences departments.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-4 py-2 rounded-full border border-[#d9d9d9] bg-[#ffffff] text-[#1e1e1e] text-[13px] font-[500] hover:border-[#1e1e1e] transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 btn-press"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={loading ? 'animate-spin' : ''}
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              <span>{loading ? 'Refreshing…' : 'Sync Database'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-full border border-[#d9d9d9] bg-[#ffffff] text-[#1e1e1e] text-[13px] font-[500] hover:border-[#1e1e1e] transition-all flex items-center gap-2 cursor-pointer shadow-xs btn-press"
              title="Export filtered directory as CSV"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsAddUserOpen(true)}
              className="px-4 py-2 rounded-full bg-[#1e1e1e] text-white text-[13px] font-[600] hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer shadow-xs btn-press"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>Add New User</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div
            onClick={() => setFilterStatus('all')}
            className={`bg-[#ffffff] border rounded-[16px] p-4.5 transition-all cursor-pointer shadow-xs ${
              filterStatus === 'all' ? 'border-[#1e1e1e]' : 'border-[#d9d9d9] hover:border-[#1e1e1e]'
            }`}
          >
            <span className="text-[12px] text-[#757575] font-[500] block">Total Accounts</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-[700] text-[#1e1e1e]">{users.length}</span>
              <span className="text-[11px] font-[600] text-[#757575] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
                All Roles
              </span>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('pending')}
            className={`bg-[#ffffff] border rounded-[16px] p-4.5 transition-all cursor-pointer shadow-xs ${
              filterStatus === 'pending' ? 'border-[#1e1e1e]' : 'border-[#d9d9d9] hover:border-[#1e1e1e]'
            }`}
          >
            <span className="text-[12px] text-[#757575] font-[500] block">Pending Approvals</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-[700] text-[#1e1e1e]">{pendingUsers.length}</span>
              {pendingUsers.length > 0 ? (
                <span className="text-[11px] font-[600] text-[#1e1e1e] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
                  Action Required
                </span>
              ) : (
                <span className="text-[11px] font-[500] text-[#757575] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
                  Up to Date
                </span>
              )}
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('active')}
            className={`bg-[#ffffff] border rounded-[16px] p-4.5 transition-all cursor-pointer shadow-xs ${
              filterStatus === 'active' ? 'border-[#1e1e1e]' : 'border-[#d9d9d9] hover:border-[#1e1e1e]'
            }`}
          >
            <span className="text-[12px] text-[#757575] font-[500] block">Active Verified</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-[700] text-[#1e1e1e]">{activeUsers.length}</span>
              <span className="text-[11px] font-[600] text-[#757575] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
                Verified
              </span>
            </div>
          </div>

          <div
            onClick={() => setFilterStatus('suspended')}
            className={`bg-[#ffffff] border rounded-[16px] p-4.5 transition-all cursor-pointer shadow-xs ${
              filterStatus === 'suspended' ? 'border-[#1e1e1e]' : 'border-[#d9d9d9] hover:border-[#1e1e1e]'
            }`}
          >
            <span className="text-[12px] text-[#757575] font-[500] block">Suspended</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-[700] text-[#1e1e1e]">{suspendedUsers.length}</span>
              <span className="text-[11px] font-[600] text-[#757575] bg-[#f0f0f0] px-2 py-0.5 rounded-full">
                Blocked
              </span>
            </div>
          </div>
        </div>

        {/* Pending Approvals Quick Banner */}
        {pendingUsers.length > 0 && (
          <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs animate-fade-in-up">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#d9d9d9] flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <h3 className="text-[14px] font-[700] text-[#1e1e1e]">
                  {pendingUsers.length} Registration{pendingUsers.length > 1 ? 's' : ''} Awaiting Admin Approval
                </h3>
                <p className="text-[12px] text-[#757575] mt-0.5">
                  New users cannot log in or query SES departmental knowledge until their Student/Staff ID is verified.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  pendingUsers.forEach(u => approveUser(u.id, u.studentId))
                }}
                className="bg-[#1e1e1e] text-white hover:opacity-90 transition-all font-[600] text-[13px] px-4 py-2 rounded-full shadow-xs cursor-pointer flex items-center gap-1.5 btn-press whitespace-nowrap"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Approve All ({pendingUsers.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Filter and Search Toolbar */}
        <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-4 shadow-xs flex flex-col gap-3.5">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search */}
            <div className="flex-1 flex items-center px-4 py-2 gap-2.5 bg-[#ffffff] border border-[#d9d9d9] rounded-full focus-within:border-[#1e1e1e] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, ID number, or email…"
                className="flex-1 bg-transparent text-[13px] text-[#1e1e1e] placeholder-[#757575] outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-[#757575] hover:text-[#1e1e1e] text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Department Dropdown */}
            <div className="shrink-0">
              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="w-full md:w-auto bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2 text-[13px] font-[500] text-[#1e1e1e] outline-none cursor-pointer focus:border-[#1e1e1e]"
              >
                <option value="all">All 5 SES Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Dropdown */}
            <div className="shrink-0">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as Role | 'all')}
                className="w-full md:w-auto bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2 text-[13px] font-[500] text-[#1e1e1e] outline-none cursor-pointer focus:border-[#1e1e1e]"
              >
                <option value="all">All Roles</option>
                {ALL_ROLES.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
            <span className="text-[12px] font-[600] text-[#757575] mr-1">Status:</span>
            {[
              { key: 'all', label: 'All Statuses', count: users.length },
              { key: 'pending', label: 'Pending Approval', count: pendingUsers.length },
              { key: 'active', label: 'Active Verified', count: activeUsers.length },
              { key: 'suspended', label: 'Suspended', count: suspendedUsers.length },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key as any)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-[500] border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  filterStatus === tab.key
                    ? 'bg-[#1e1e1e] text-white border-[#1e1e1e]'
                    : 'bg-[#ffffff] text-[#757575] border-[#d9d9d9] hover:text-[#1e1e1e] hover:border-[#1e1e1e]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-[600] ${
                    filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#757575]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Directory Table View */}
        <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#d9d9d9] text-[#757575] text-[11px] font-[600] uppercase tracking-wider">
                  <th className="px-5 py-3.5">User Profile</th>
                  <th className="px-5 py-3.5">Student / Staff ID</th>
                  <th className="px-5 py-3.5">Role & Level</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {filtered.map(u => {
                  const isLoading = actionLoading === (u.studentId || u.id)
                  const initials = u.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <tr key={u.id} className="hover:bg-[#fafafa] transition-colors">
                      {/* User Profile */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedUserForAvatar(u)}
                            className="w-9 h-9 rounded-full bg-[#e5e5e5] border border-[#d9d9d9] flex items-center justify-center text-xs font-bold text-[#1e1e1e] shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#1e1e1e]/20 transition-all"
                            title={`Click to view ${u.name}'s profile photo`}
                          >
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              initials
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="text-[#1e1e1e] font-[600] text-[14px] leading-tight truncate">
                              {u.name}
                            </div>
                            <div className="text-[#757575] text-[12px] mt-0.5 truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* ID */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="font-mono text-[12px] font-[500] text-[#1e1e1e] bg-[#f5f5f5] border border-[#e5e5e5] px-2.5 py-1 rounded-md">
                          {u.studentId || u.id}
                        </span>
                      </td>

                      {/* Role & Level */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-[600] ${
                              ROLE_LABELS[u.role]?.badge || 'bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9]'
                            }`}
                          >
                            {ROLE_LABELS[u.role]?.label || u.role}
                          </span>
                          {u.level && (
                            <span className="text-[11px] font-[500] bg-[#f5f5f5] border border-[#d9d9d9] text-[#757575] px-2 py-0.5 rounded-md">
                              {u.level}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-4">
                        <span className="text-[#1e1e1e] font-[500] text-[13px]">{u.department}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={u.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {u.status === 'pending' && (
                            <button
                              onClick={() => approveUser(u.id, u.studentId)}
                              disabled={isLoading}
                              className="text-[12px] font-[600] px-3.5 py-1.5 rounded-full bg-[#1e1e1e] text-white hover:opacity-90 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50 btn-press"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>{isLoading ? 'Approving…' : 'Approve'}</span>
                            </button>
                          )}

                          {u.status === 'active' && (
                            <>
                              <button
                                onClick={() => setRoleModalUser(u)}
                                className="text-[12px] font-[500] px-3 py-1.5 rounded-full bg-[#ffffff] border border-[#d9d9d9] text-[#1e1e1e] hover:border-[#1e1e1e] transition-colors cursor-pointer btn-press"
                                title="Change user role"
                              >
                                Change Role
                              </button>

                              {u.id !== admin.id && u.studentId !== admin.id && (
                                <button
                                  onClick={() => suspendUser(u.id, u.studentId)}
                                  disabled={isLoading}
                                  className="text-[12px] font-[500] px-3 py-1.5 rounded-full bg-[#ffffff] border border-[#d9d9d9] text-[#757575] hover:text-[#1e1e1e] hover:border-[#1e1e1e] transition-colors cursor-pointer disabled:opacity-50 btn-press"
                                  title="Suspend account access"
                                >
                                  Suspend
                                </button>
                              )}
                            </>
                          )}

                          {u.status === 'suspended' && (
                            <button
                              onClick={() => reinstateUser(u.id, u.studentId)}
                              disabled={isLoading}
                              className="text-[12px] font-[500] px-3 py-1.5 rounded-full bg-[#1e1e1e] text-white hover:opacity-90 transition-colors cursor-pointer disabled:opacity-50 btn-press"
                              title="Reinstate account access"
                            >
                              Reinstate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-[#757575] text-[13px] flex flex-col items-center gap-2">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d9d9d9" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span>No user accounts found matching your filters.</span>
              <button
                onClick={() => {
                  setSearch('')
                  setFilterDept('all')
                  setFilterRole('all')
                  setFilterStatus('all')
                }}
                className="mt-1 text-[12px] font-[600] text-[#1e1e1e] underline cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Add New User Modal ── */}
      {isAddUserOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setIsAddUserOpen(false)}
        >
          <div
            className="bg-[#ffffff] border border-[#d9d9d9] rounded-[24px] max-w-md w-full p-6 shadow-2xl flex flex-col gap-5 text-[#1e1e1e] font-['Inter',sans-serif] relative"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <div>
                <h2 className="text-[18px] font-[700] text-[#1e1e1e]">Add New User Account</h2>
                <p className="text-[12px] text-[#757575]">Register a new student, TA, or faculty member.</p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-[#757575] hover:text-[#1e1e1e] p-1.5 rounded-full hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-[#f5f5f5] border border-[#d9d9d9] text-[#1e1e1e] text-[12px] rounded-xl font-[500]">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-[600] text-[#1e1e1e]">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwadwo Mensah"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="px-3.5 py-2 rounded-full border border-[#d9d9d9] text-[13px] outline-none focus:border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-[600] text-[#1e1e1e]">Student / Staff ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10689999"
                    value={newUserForm.studentId}
                    onChange={e => setNewUserForm({ ...newUserForm, studentId: e.target.value })}
                    className="px-3.5 py-2 rounded-full border border-[#d9d9d9] text-[13px] outline-none focus:border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-[600] text-[#1e1e1e]">Role *</label>
                  <select
                    value={newUserForm.role}
                    onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value as Role })}
                    className="px-3.5 py-2 rounded-full border border-[#d9d9d9] text-[13px] outline-none focus:border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] cursor-pointer"
                  >
                    {ALL_ROLES.map(r => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-[600] text-[#1e1e1e]">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kmensah@ug.edu.gh"
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="px-3.5 py-2 rounded-full border border-[#d9d9d9] text-[13px] outline-none focus:border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[12px] font-[600] text-[#1e1e1e]">SES Department *</label>
                <select
                  value={newUserForm.department}
                  onChange={e => setNewUserForm({ ...newUserForm, department: e.target.value })}
                  className="px-3.5 py-2 rounded-full border border-[#d9d9d9] text-[13px] outline-none focus:border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] cursor-pointer"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {newUserForm.role === 'student' && (
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-[600] text-[#1e1e1e]">Academic Level</label>
                  <select
                    value={newUserForm.level}
                    onChange={e => setNewUserForm({ ...newUserForm, level: e.target.value })}
                    className="px-3.5 py-2 rounded-full border border-[#d9d9d9] text-[13px] outline-none focus:border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] cursor-pointer"
                  >
                    {['L100', 'L200', 'L300', 'L400', 'L500', 'Graduate'].map(lvl => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#f0f0f0]">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-full border border-[#d9d9d9] text-[13px] font-[500] text-[#757575] hover:text-[#1e1e1e] hover:border-[#1e1e1e] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#1e1e1e] text-white text-[13px] font-[600] hover:opacity-90 transition-all cursor-pointer shadow-xs btn-press"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Change Role Modal ── */}
      {roleModalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setRoleModalUser(null)}
        >
          <div
            className="bg-[#ffffff] border border-[#d9d9d9] rounded-[24px] max-w-sm w-full p-6 shadow-2xl flex flex-col gap-5 text-[#1e1e1e] font-['Inter',sans-serif] relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <div>
                <h2 className="text-[17px] font-[700] text-[#1e1e1e]">Modify User Role</h2>
                <p className="text-[12px] text-[#757575] mt-0.5">
                  Update permissions for <strong className="text-[#1e1e1e]">{roleModalUser.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setRoleModalUser(null)}
                className="text-[#757575] hover:text-[#1e1e1e] p-1.5 rounded-full hover:bg-[#f0f0f0] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[12px] font-[600] text-[#757575]">Select New Role:</span>
              {ALL_ROLES.map(r => {
                const isCurrent = roleModalUser.role === r.value
                return (
                  <button
                    key={r.value}
                    onClick={() => handleUpdateRole(roleModalUser, r.value)}
                    className={`px-4 py-2.5 rounded-xl border text-left text-[13px] font-[500] transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-[#1e1e1e] text-white border-[#1e1e1e]'
                        : 'bg-[#ffffff] text-[#1e1e1e] border border-[#d9d9d9] hover:border-[#1e1e1e]'
                    }`}
                  >
                    <span>{r.label}</span>
                    {isCurrent && (
                      <span className="text-[11px] font-[600] bg-white/20 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setRoleModalUser(null)}
              className="w-full py-2 bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#1e1e1e] font-[600] text-[13px] rounded-full border border-[#d9d9d9] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Avatar Full-Screen Viewer Modal */}
      <AvatarViewerModal
        isOpen={!!selectedUserForAvatar}
        onClose={() => setSelectedUserForAvatar(null)}
        name={selectedUserForAvatar?.name || ''}
        avatarUrl={selectedUserForAvatar?.avatarUrl}
        subtitle={`${selectedUserForAvatar?.department || ''} ${
          selectedUserForAvatar?.level ? `· ${selectedUserForAvatar.level}` : ''
        }`}
        role={selectedUserForAvatar?.role}
        studentId={selectedUserForAvatar?.studentId || selectedUserForAvatar?.id}
      />
    </div>
  )
}
