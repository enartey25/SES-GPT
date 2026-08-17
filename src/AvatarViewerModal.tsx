import React from 'react'

interface AvatarViewerModalProps {
  isOpen: boolean
  onClose: () => void
  name: string
  avatarUrl?: string
  subtitle?: string
  role?: string
  studentId?: string
}

export default function AvatarViewerModal({
  isOpen,
  onClose,
  name,
  avatarUrl,
  subtitle,
  role,
  studentId,
}: AvatarViewerModalProps) {
  if (!isOpen) return null

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#ffffff] border border-[#d9d9d9] rounded-[24px] max-w-sm w-full p-6 shadow-2xl flex flex-col items-center gap-5 text-[#1e1e1e] font-['Inter',sans-serif] relative"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#757575] hover:text-[#1e1e1e] p-2 rounded-full hover:bg-[#f0f0f0] transition-colors cursor-pointer"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Large Avatar Photo */}
        <div className="w-52 h-52 rounded-full bg-[#f0f0f0] border-4 border-[#ffffff] shadow-md flex items-center justify-center text-5xl font-[700] text-[#1e1e1e] overflow-hidden shrink-0 mt-2">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        {/* Information */}
        <div className="flex flex-col items-center text-center gap-1">
          <h3 className="text-[18px] font-[700] text-[#1e1e1e] tracking-tight">{name}</h3>
          {subtitle && <p className="text-[13px] text-[#757575]">{subtitle}</p>}
          <div className="flex items-center gap-2 mt-1 text-[12px] text-[#757575]">
            {role && <span className="font-[600] capitalize">{role}</span>}
            {studentId && <span>· {studentId}</span>}
          </div>
        </div>

        {/* Action button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 bg-[#f5f5f5] hover:bg-[#eaeaea] text-[#1e1e1e] font-[600] text-[13px] rounded-full border border-[#d9d9d9] transition-colors cursor-pointer mt-1"
        >
          Done
        </button>
      </div>
    </div>
  )
}
