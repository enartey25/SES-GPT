import React, { useState, useEffect, useRef, useCallback } from 'react'
import type { MockUser } from './AuthPage'
import { API_BASE_URL } from './config'

type SavedSession = { id: string; title: string; fileName: string; createdAt: string }

interface WhatsAppUploadPageProps {
  user: MockUser
  onDocumentUploaded: (documentId: string, documentTitle: string) => void
}

export default function WhatsAppUploadPage({ user, onDocumentUploaded }: WhatsAppUploadPageProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Fetch permanent sessions from Supabase backend
  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem('ses_token')
    if (!token) return
    setLoadingSessions(true)
    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSavedSessions(data || [])
      }
    } catch (e) {
      console.error('Failed to fetch permanent sessions', e)
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const handleFile = async (f: File) => {
    setUploadError('')
    setFile(f)
    setUploading(true)

    const token = localStorage.getItem('ses_token')
    const formData = new FormData()
    formData.append('file', f)

    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/upload`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.documentId) {
          setUploading(false)
          // Automatically redirect to AI Chat with the newly uploaded document!
          onDocumentUploaded(data.documentId, f.name)
          return
        }
      }

      const errData = await res.json().catch(() => ({}))
      const errorMsg = errData.error || `Upload failed with status ${res.status}. ${res.status === 401 ? 'Please sign in again.' : ''}`
      setUploadError(errorMsg)
      setUploading(false)
    } catch (err: any) {
      setUploadError(`Could not connect to backend server: ${err.message}. Ensure backend is running.`)
      setUploading(false)
    }
  }

  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const token = localStorage.getItem('ses_token')
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setSavedSessions(prev => prev.filter(s => s.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete session', err)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-navy-950 px-6 py-10" style={{ fontFamily: 'var(--font-sans)' }}>
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-mono)' }} className="text-xl font-bold text-white tracking-tight">
              Document & WhatsApp Archive Hub
            </h1>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Upload class WhatsApp chat exports (<span className="text-cyan-400">.txt</span> / <span className="text-cyan-400">.zip</span>) or course notes. Files are permanently vectorized into Supabase PostgreSQL and you will be immediately redirected to AI Chat to query them.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={e => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => {
            e.preventDefault()
            setDragging(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
          className={`w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-5 transition-all ${dragging ? 'border-cyan-400 bg-cyan-400/10 scale-[1.01]' : 'border-navy-700 bg-navy-900/60 hover:border-navy-600'
            }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.zip,.md,text/plain"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
              e.target.value = ''
            }}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-cyan-400/40 flex items-center justify-center">
                <span className="w-7 h-7 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)' }} className="text-cyan-400 text-base font-semibold">
                  Vectorizing & Indexing in Database…
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Applying noise filter, computing 1536-dim ONNX embeddings & storing permanently in Supabase
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <div className="text-center">
                <p style={{ fontFamily: 'var(--font-mono)' }} className="text-white font-semibold text-base mb-1.5">
                  Drag & Drop your WhatsApp Chat or Document
                </p>
                <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                  Supports exported WhatsApp chats (<span className="text-cyan-400 font-mono">.txt</span> or{' '}
                  <span className="text-cyan-400 font-mono">.zip</span>) and markdown notes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="bg-cyan-400 text-navy-900 hover:bg-cyan-300 transition-colors font-semibold text-xs px-6 py-3 rounded-xl shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Browse & Upload Document
              </button>

              {uploadError && (
                <div className="bg-rose-400/10 border border-rose-400/30 rounded-xl px-4 py-2.5 text-xs text-rose-300 text-center w-full">
                  {uploadError}
                </div>
              )}

              <div className="bg-navy-800/80 border border-navy-700 rounded-xl px-4 py-3 text-xs text-slate-400 leading-relaxed text-center max-w-md">
                <span style={{ fontFamily: 'var(--font-mono)' }} className="text-cyan-300 font-semibold block mb-1">
                  How to export from WhatsApp:
                </span>
                Open Class Chat → ⋮ Menu → More → <strong>Export Chat</strong> → <em>Without Media</em> → Upload here.
              </div>
            </>
          )}
        </div>

        {/* Permanently Stored Documents Library */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h2 style={{ fontFamily: 'var(--font-mono)' }} className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Permanently Saved Documents ({savedSessions.length})
              </h2>
            </div>
            <button
              onClick={fetchSessions}
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>

          {savedSessions.length === 0 ? (
            <div className="border border-navy-800 bg-navy-900/40 rounded-2xl p-8 text-center">
              <p className="text-slate-500 text-xs">
                No previous documents found in the database. Upload a document above to begin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {savedSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => onDocumentUploaded(session.id, session.fileName || session.title || 'Document')}
                  className="flex items-center justify-between p-4 rounded-xl border border-navy-700 bg-navy-900/70 hover:border-cyan-400/50 hover:bg-navy-800/80 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center shrink-0 group-hover:border-cyan-400/60">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="1.8">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-200 text-xs font-semibold truncate group-hover:text-cyan-300">
                        {session.fileName || session.title || 'Document'}
                      </p>
                      <p style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-500 text-[10px] mt-0.5">
                        Uploaded {session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'Active'} · Saved in Supabase DB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="text-xs font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 group-hover:bg-cyan-400 group-hover:text-navy-900 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      <span>Ask AI Chat</span>
                      <span>→</span>
                    </button>
                    <button
                      onClick={e => deleteSession(e, session.id)}
                      title="Delete permanently from database"
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-rose-400/10 cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
