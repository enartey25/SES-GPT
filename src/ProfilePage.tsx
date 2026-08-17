import React, { useState, useRef } from 'react'
import { DEPARTMENTS } from './AuthPage'
import type { MockUser, Role } from './AuthPage'
import ImageCropModal from './ImageCropModal'
import AvatarViewerModal from './AvatarViewerModal'

interface ProfilePageProps {
  user: MockUser
  onUpdateUser?: (u: MockUser) => void
}

const LEVELS = ['L100', 'L200', 'L300', 'L400', 'L500', 'Graduate']

function roleLabel(role: Role) {
  const map: Record<Role, string> = {
    student: 'Student',
    lecturer: 'Lecturer',
    ta: 'Teaching Assistant',
    hod: 'Head of Dept',
    dean: 'Dean',
    admin: 'Administrator',
  }
  return map[role] || 'Member'
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function PasswordField({
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5 font-['Inter',sans-serif]">
      <label htmlFor={id} className="text-[13px] font-[600] text-[#1e1e1e]">
        {label}
      </label>
      <div className="flex items-center bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2.5 shadow-2xs focus-within:border-[#1e1e1e] transition-colors">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••'}
          className="flex-1 bg-transparent text-[#1e1e1e] text-[14px] placeholder-[#b3b3b3] outline-none"
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="text-[#757575] hover:text-[#1e1e1e] cursor-pointer ml-2"
        >
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  )
}

export default function ProfilePage({ user, onUpdateUser }: ProfilePageProps) {
  // Editable user information state
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [department, setDepartment] = useState(user.department)
  const [level, setLevel] = useState(user.level || 'L300')
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(user.avatarUrl)

  // Cropping and viewer modal states
  const [rawImageToCrop, setRawImageToCrop] = useState<string | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)

  const [profileSuccess, setProfileSuccess] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)

  // Password state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  // Handle avatar upload via file reader and launch cropper
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit. Please select a smaller photo.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result as string
        setRawImageToCrop(result)
      }
      reader.readAsDataURL(file)
      // Reset input value so re-selecting same file triggers onChange
      e.target.value = ''
    }
  }

  // Handle saving cropped avatar
  const handleCropComplete = (croppedBase64: string) => {
    setAvatarUrl(croppedBase64)
    setRawImageToCrop(null)
    const updated = { ...user, avatarUrl: croppedBase64 }
    if (onUpdateUser) onUpdateUser(updated)
  }

  const handleRemoveAvatar = () => {
    setAvatarUrl(undefined)
    const updated = { ...user, avatarUrl: undefined }
    if (onUpdateUser) onUpdateUser(updated)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileSuccess(false)

    const updated: MockUser = {
      ...user,
      name: name.trim(),
      email: email.trim(),
      department,
      level: user.role === 'student' ? level : undefined,
      avatarUrl,
    }

    setTimeout(() => {
      if (onUpdateUser) onUpdateUser(updated)
      setProfileLoading(false)
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    }, 400)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('All fields are required.')
      return
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters.')
      return
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match.')
      return
    }
    setPwLoading(true)
    await new Promise(r => setTimeout(r, 600))
    setPwLoading(false)
    setPwSuccess(true)
    setCurrentPw('')
    setNewPw('')
    setConfirmPw('')
    setTimeout(() => setPwSuccess(false), 4000)
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#f5f5f5] text-[#1e1e1e] font-['Inter',sans-serif] p-4 sm:p-6 md:p-10">
      {/* Interactive Crop Modal */}
      {rawImageToCrop && (
        <ImageCropModal
          imageSrc={rawImageToCrop}
          onCrop={handleCropComplete}
          onClose={() => setRawImageToCrop(null)}
        />
      )}

      {/* Avatar Full-Screen Viewer Modal */}
      <AvatarViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        name={name}
        avatarUrl={avatarUrl}
        subtitle={`${department} ${user.level ? `· ${user.level}` : ''}`}
        role={roleLabel(user.role)}
        studentId={user.studentId || user.id}
      />

      <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-16 animate-page-enter">
        {/* Top Header Card with Interactive Avatar Upload & View */}
        <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-6 md:p-8 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with Camera Button & Click-to-View */}
          <div className="relative group shrink-0">
            <button
              type="button"
              onClick={() => setIsViewerOpen(true)}
              className="w-20 h-20 rounded-full bg-[#d9d9d9] border-2 border-[#ffffff] shadow-sm flex items-center justify-center text-2xl font-[700] text-[#1e1e1e] overflow-hidden cursor-pointer hover:ring-2 hover:ring-[#1e1e1e]/20 transition-all"
              title="Click to view full photo"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </button>

            {/* Camera Overlay Icon */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              title="Upload & crop profile photo"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <h1 className="text-[20px] font-[700] text-[#1e1e1e] tracking-tight truncate">
                {name}
              </h1>
              <span className="text-[12px] font-[500] text-[#757575]">
                · {roleLabel(user.role)}
              </span>
            </div>

            <p className="text-[13px] text-[#757575] mt-1 truncate">
              {department} {user.level ? `· ${user.level}` : ''}
            </p>

            {/* Avatar Actions */}
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[12px] font-[600] text-[#1e1e1e] bg-[#f5f5f5] hover:bg-[#eaeaea] border border-[#d9d9d9] px-3 py-1 rounded-[6px] transition-colors cursor-pointer"
              >
                Change Photo
              </button>
              {avatarUrl && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsViewerOpen(true)}
                    className="text-[12px] font-[500] text-[#757575] hover:text-[#1e1e1e] cursor-pointer"
                  >
                    View Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[12px] font-[500] text-[#e11d48] hover:underline cursor-pointer"
                  >
                    Remove Photo
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Editable Profile Information Form */}
        <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-6 md:p-8 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-[16px] font-[600] text-[#1e1e1e]">
                Personal and Academic Information
              </h2>
              <p className="text-[13px] text-[#757575] mt-0.5">
                Update your details. Student ID is an immutable institutional identifier.
              </p>
            </div>
          </div>

          {profileSuccess && (
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] p-3 text-[13px] text-[#16a34a] mb-5 animate-fade-in">
              Profile information updated successfully.
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prof-name" className="text-[13px] font-[600] text-[#1e1e1e]">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2.5 text-[14px] text-[#1e1e1e] placeholder-[#b3b3b3] outline-none focus:border-[#1e1e1e] transition-colors shadow-2xs"
              />
            </div>

            {/* Student ID / Staff ID (Read-only) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-[600] text-[#1e1e1e] flex items-center gap-1.5">
                  <span>Student or Staff ID</span>
                  <span className="text-[11px] font-[400] text-[#757575]">
                    (Permanent Record)
                  </span>
                </label>
                <span className="text-[11px] text-[#757575]">Official UG identifier</span>
              </div>
              <input
                type="text"
                value={user.studentId || user.id}
                disabled
                className="w-full bg-[#f9f9f9] border border-[#e5e5e5] rounded-full px-4 py-2.5 text-[14px] text-[#757575] font-mono cursor-not-allowed select-none"
              />
            </div>

            {/* University Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="prof-email" className="text-[13px] font-[600] text-[#1e1e1e]">
                University Email Address
              </label>
              <input
                id="prof-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2.5 text-[14px] text-[#1e1e1e] placeholder-[#b3b3b3] outline-none focus:border-[#1e1e1e] transition-colors shadow-2xs font-mono text-[13.5px]"
              />
            </div>

            {/* Department & Level Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-[600] text-[#1e1e1e]">Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2.5 text-[13.5px] text-[#1e1e1e] outline-none focus:border-[#1e1e1e] transition-colors shadow-2xs cursor-pointer"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {user.role === 'student' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-[600] text-[#1e1e1e]">Academic Level</label>
                  <select
                    value={level}
                    onChange={e => setLevel(e.target.value)}
                    className="w-full bg-[#ffffff] border border-[#d9d9d9] rounded-full px-4 py-2.5 text-[13.5px] text-[#1e1e1e] outline-none focus:border-[#1e1e1e] transition-colors shadow-2xs cursor-pointer"
                  >
                    {LEVELS.map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="bg-[#1e1e1e] text-white font-[600] text-[14px] py-2.5 px-6 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-xs w-fit mt-2 btn-press disabled:opacity-50"
            >
              {profileLoading ? 'Saving Changes…' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-[#ffffff] border border-[#d9d9d9] rounded-[16px] p-6 md:p-8 shadow-xs">
          <h2 className="text-[16px] font-[600] text-[#1e1e1e] mb-1">
            Security and Password
          </h2>
          <p className="text-[13px] text-[#757575] mb-5">
            Update your account password. Must contain at least 8 characters.
          </p>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            {pwError && (
              <div className="bg-[#fff1f2] border border-[#fecdd3] rounded-[8px] p-3 text-[13px] text-[#e11d48]">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-[8px] p-3 text-[13px] text-[#16a34a]">
                Password updated successfully.
              </div>
            )}

            <PasswordField
              label="Current Password"
              id="cur-pass"
              value={currentPw}
              onChange={setCurrentPw}
            />
            <PasswordField
              label="New Password"
              id="new-pass"
              value={newPw}
              onChange={setNewPw}
            />
            <PasswordField
              label="Confirm New Password"
              id="conf-pass"
              value={confirmPw}
              onChange={setConfirmPw}
            />

            <button
              type="submit"
              disabled={pwLoading}
              className="bg-[#1e1e1e] text-white font-[600] text-[14px] py-2.5 px-6 rounded-full hover:opacity-90 transition-all cursor-pointer shadow-xs w-fit mt-2 btn-press disabled:opacity-50"
            >
              {pwLoading ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
