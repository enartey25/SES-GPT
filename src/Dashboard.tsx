import React, { useState } from 'react'
import type { MockUser, Role } from './AuthPage'
import ThemeToggle from './ThemeToggle'

export interface ChatSession {
  id: string
  title: string
  fileName?: string
}

interface DashboardProps {
  user: MockUser
  onSignOut: () => void
  children: React.ReactNode
  activePage: string
  onNavigate: (page: string) => void
  onNewChat?: () => void
  activeDocumentId?: string | null
  activeDocumentTitle?: string | null
  chatSessions?: ChatSession[]
  onSelectChat?: (documentId: string | null, documentTitle: string | null) => void
  onDeleteChat?: (id: string) => void
  unreadCount?: number
}

type NavItem = {
  id: string
  label: string
  icon?: React.ReactNode
  roles?: Role[]
  badge?: string
}

export default function Dashboard({
  user,
  onSignOut,
  children,
  activePage,
  onNavigate,
  onNewChat,
  activeDocumentId = null,
  activeDocumentTitle = null,
  chatSessions = [],
  onSelectChat,
  onDeleteChat,
  unreadCount = 0,
}: DashboardProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const navItems: NavItem[] = [
    { id: 'chat', label: 'AI Chat' },
    {
      id: 'notifications',
      label: 'Notifications',
      badge: unreadCount > 0 ? String(unreadCount) : undefined,
    },
    { id: 'announcements', label: 'Announcements', roles: ['lecturer', 'ta', 'hod', 'dean', 'admin'] },
    { id: 'users', label: 'User Management', roles: ['admin'] },
    { id: 'profile', label: 'Profile' },
  ]

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(user.role))

  const filteredChats = chatSessions.filter(c =>
    (c.title || c.fileName || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleNavClick = (pageId: string) => {
    onNavigate(pageId)
    setMobileOpen(false)
  }

  const handleChatClick = (chat: ChatSession | null) => {
    if (onSelectChat) {
      if (chat) {
        onSelectChat(chat.id, chat.title || chat.fileName || 'Chat')
      } else {
        onSelectChat(null, null)
      }
    }
    onNavigate('chat')
    setMobileOpen(false)
  }

  const handleNewChatClick = () => {
    if (onNewChat) onNewChat()
    else if (onSelectChat) onSelectChat(null, null)
    onNavigate('chat')
    setMobileOpen(false)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f5f5] text-[#1e1e1e] font-['Inter',sans-serif]">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[320px] shrink-0 h-full p-4 border-r border-[rgba(20,18,24,0.1)] bg-[#f5f5f5] justify-between">
        <div className="flex flex-col gap-4 overflow-y-auto">
          {/* Top Brand with official Logo */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <img
                src="/ses.jpg"
                alt="SES Logo"
                className="w-7 h-7 rounded-full object-contain border border-[#d9d9d9] shadow-xs"
              />
              <div className="flex flex-col">
                <span className="text-[15px] font-[600] text-[#1e1e1e] leading-tight">SES-GPT</span>
                <span className="text-[11px] text-[#757575] font-[400]">Integrity and Innovation</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              <button
                onClick={handleNewChatClick}
                className="p-1.5 rounded-full hover:bg-[#e5e5e5] text-[#1e1e1e] transition-colors cursor-pointer"
                title="New Chat / Reset Context"
                aria-label="New chat"
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <circle cx="10" cy="10" r="9" strokeWidth="1.8" />
                  <line x1="10" y1="6" x2="10" y2="14" />
                  <line x1="6" y1="10" x2="14" y2="10" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center px-4 py-2 gap-2 bg-[#ffffff] border border-[#d9d9d9] rounded-full shadow-xs">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats…"
              className="flex-1 border-none outline-none font-['Inter',sans-serif] text-[13px] font-[400] text-[#1e1e1e] bg-transparent placeholder-[#6b7280]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-[#4b5563] hover:text-[#1e1e1e] text-[12px] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col gap-1">
            {filteredNav.map(item => {
              const active = activePage === item.id

              if (item.id === 'chat') {
                return (
                  <div key={item.id} className="flex flex-col gap-1">
                    <button
                      onClick={() => handleNavClick('chat')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[14px] transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#ffffff] font-[600] text-[#1e1e1e] shadow-2xs'
                          : 'bg-transparent text-[#1e1e1e] font-[500] hover:bg-[#eaeaea]'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>

                    {/* Nested Sub-Section: Your Chats */}
                    <div className="ml-3 pl-3 border-l border-[#d9d9d9] flex flex-col gap-1 my-1">
                      <div className="text-[11px] font-[600] uppercase tracking-wider text-[#4b5563] dark:text-[#a1a1aa] px-2 py-1">
                        Your Chats
                      </div>

                      {/* General Knowledge Base Chat */}
                      <button
                        onClick={() => handleChatClick(null)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-all cursor-pointer text-left ${
                          activePage === 'chat' && activeDocumentId === null
                            ? 'bg-[#ffffff] font-[600] text-[#1e1e1e] shadow-2xs'
                            : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#eaeaea] hover:text-[#1e1e1e] font-[450]'
                        }`}
                      >
                        <span className="truncate">General Knowledge Base</span>
                      </button>

                      {/* User's Uploaded WhatsApp Sessions */}
                      {filteredChats.map(chat => {
                        const isSelected = activePage === 'chat' && activeDocumentId === chat.id
                        return (
                          <div
                            key={chat.id}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#ffffff] font-[600] text-[#1e1e1e] shadow-2xs'
                                : 'text-[#374151] dark:text-[#d4d4d8] hover:bg-[#eaeaea] hover:text-[#1e1e1e] font-[450]'
                            }`}
                          >
                            <button
                              onClick={() => handleChatClick(chat)}
                              className="truncate text-left flex-1"
                              title={chat.title || chat.fileName}
                            >
                              {chat.title || chat.fileName || 'Chat Session'}
                            </button>
                            {onDeleteChat && (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  onDeleteChat(chat.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 text-[#757575] hover:text-[#e11d48] transition-opacity p-0.5 ml-1"
                                title="Delete chat session"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )
                      })}

                      {filteredChats.length === 0 && searchQuery && (
                        <div className="text-[11px] text-[#757575] px-2 py-1 italic">
                          No chats match "{searchQuery}"
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[14px] transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#ffffff] font-[600] text-[#1e1e1e] shadow-2xs'
                      : 'bg-transparent text-[#1e1e1e] font-[400] hover:bg-[#eaeaea]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[11px] font-[600] px-2 py-0.5 rounded-full bg-[#1e1e1e] text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* User Profile Bar at bottom */}
        <div className="pt-3 border-t border-[rgba(20,18,24,0.1)] flex items-center justify-between">
          <button
            onClick={() => handleNavClick('profile')}
            className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer group"
          >
            <div className="w-[32px] h-[32px] rounded-full bg-[#d9d9d9] flex items-center justify-center text-[12px] font-[600] text-[#1e1e1e] shrink-0 overflow-hidden border border-[#d9d9d9]">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13.5px] font-[600] text-[#1e1e1e] truncate leading-tight group-hover:underline">
                {user.name}
              </span>
              <span className="text-[11.5px] text-[#757575] truncate">
                {user.studentId || user.id}
              </span>
            </div>
          </button>
          <button
            onClick={onSignOut}
            className="p-2 text-[#757575] hover:text-[#1e1e1e] transition-colors cursor-pointer"
            title="Sign Out"
            aria-label="Sign out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-[300px] max-w-[85vw] h-full bg-[#f5f5f5] p-4 flex flex-col justify-between z-50 shadow-2xl">
            <div className="flex flex-col gap-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src="/ses.jpg" alt="SES Logo" className="w-6 h-6 rounded-full object-contain border border-[#d9d9d9]" />
                  <span className="text-[16px] font-[600] text-[#1e1e1e]">SES-GPT</span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-[#1e1e1e] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Chat Sub-Items */}
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-[600] uppercase tracking-wider text-[#757575] px-1">
                  Your Chats
                </span>
                <button
                  onClick={() => handleChatClick(null)}
                  className={`w-full flex items-center px-3 py-2 rounded-[8px] text-[13px] ${
                    activePage === 'chat' && activeDocumentId === null
                      ? 'bg-[#ffffff] font-[600] text-[#1e1e1e]'
                      : 'text-[#757575]'
                  }`}
                >
                  <span>General Knowledge Base</span>
                </button>
                {filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => handleChatClick(chat)}
                    className={`w-full text-left px-3 py-1.5 rounded-[8px] text-[13px] truncate ${
                      activePage === 'chat' && activeDocumentId === chat.id
                        ? 'bg-[#ffffff] font-[600] text-[#1e1e1e]'
                        : 'text-[#757575]'
                    }`}
                  >
                    {chat.title || chat.fileName || 'Chat'}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex flex-col gap-1 pt-2 border-t border-[#e5e5e5]">
                {filteredNav
                  .filter(item => item.id !== 'chat')
                  .map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-[14px] ${
                        activePage === item.id
                          ? 'bg-[#ffffff] font-[600] text-[#1e1e1e]'
                          : 'bg-transparent text-[#1e1e1e] font-[400]'
                      }`}
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="text-[11px] font-[600] px-2 py-0.5 rounded-full bg-[#1e1e1e] text-white">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[rgba(20,18,24,0.1)] flex items-center justify-between">
              <button
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-3 text-left"
              >
                <div className="w-[30px] h-[30px] rounded-full bg-[#d9d9d9] flex items-center justify-center text-[12px] font-[600] overflow-hidden border border-[#d9d9d9]">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-[600] text-[#1e1e1e]">{user.name}</span>
                  <span className="text-[12px] text-[#757575]">{user.studentId || user.id}</span>
                </div>
              </button>
              <button onClick={onSignOut} className="p-2 text-[#1e1e1e]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e1e1e" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content Area ── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f5f5f5]">
        {/* Mobile top header */}
        <div className="md:hidden flex items-center justify-between h-14 px-4 bg-[#ffffff] border-b border-[rgba(20,18,24,0.1)] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-[#1e1e1e]"
            aria-label="Open navigation"
          >
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="#1e1e1e" strokeWidth="2.2" strokeLinecap="round">
              <line x1="0" y1="1" x2="18" y2="1" />
              <line x1="0" y1="6" x2="18" y2="6" />
              <line x1="0" y1="11" x2="18" y2="11" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5">
            <img src="/ses.jpg" alt="SES Logo" className="w-5 h-5 rounded-full object-contain border border-[#d9d9d9]" />
            <span className="text-[16px] font-[600] text-[#1e1e1e]">SES-GPT</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={handleNewChatClick}
              className="p-1.5 text-[#1e1e1e]"
              aria-label="New chat"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="10" cy="10" r="9" strokeWidth="1.8" />
                <line x1="10" y1="6" x2="10" y2="14" />
                <line x1="6" y1="10" x2="14" y2="10" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 h-full overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
