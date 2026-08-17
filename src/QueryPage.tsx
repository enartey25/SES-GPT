import { useState, useRef, useEffect } from 'react'
import { generateId } from './utils'
import sesLogo from './assets/logo'

const DEPARTMENTS = [
  'Computer Engineering',
  'Agricultural Engineering',
  'Biomedical Engineering',
  'Food Process Engineering',
  'Materials Science and Engineering',
]

type Source = { title: string; chunk: string; score: number }

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: Source[]
  dept?: string
}

const MOCK_RESPONSES: Record<string, { answer: string; sources: Source[] }> = {
  default: {
    answer:
      "Based on the retrieved documents, I can provide a grounded answer to your query. The relevant policy sections indicate that standard procedures apply as outlined in the department handbook. For specific edge cases or exceptions, please consult the supplementary guidelines referenced in the sources below.",
    sources: [
      { title: 'Department Policy Handbook v3.1', chunk: '§ 2.1 — General Procedures', score: 0.94 },
      { title: 'Internal Guidelines 2025', chunk: 'Section: Standard Operations', score: 0.87 },
      { title: 'Compliance Reference Index', chunk: '§ 7 — Exceptions & Escalations', score: 0.81 },
    ],
  },
  legal: {
    answer:
      "Our standard enterprise MSA includes a mutual indemnification clause covering third-party IP infringement claims, capped at 2× the annual contract value. Carve-outs apply for gross negligence and wilful misconduct. Limitation of liability provisions exclude consequential damages except in data breach scenarios. See § 14 of the Master Services Agreement template for the full clause language.",
    sources: [
      { title: 'MSA Template v8 (Enterprise)', chunk: '§ 14 — Indemnification', score: 0.98 },
      { title: 'Legal Playbook 2025', chunk: 'IP Indemnification Guidance', score: 0.91 },
      { title: 'Contract Standards Index', chunk: '§ 3.2 — Liability Caps', score: 0.84 },
    ],
  },
  hr: {
    answer:
      "Employees at the Director level and above are entitled to 6 months of severance, calculated at 100% of base salary. VP and above receive an additional 3-month COBRA subsidy. Severance is contingent on signing a separation agreement and is paid as a lump sum within 30 days of the separation date. Equity vesting acceleration is subject to the terms of the individual grant agreement.",
    sources: [
      { title: 'Employee Handbook v4.2', chunk: '§ 9.3 — Severance Policy', score: 0.96 },
      { title: 'HR Policy Index 2025', chunk: '§ 18 — Director+ Compensation', score: 0.90 },
      { title: 'Equity Plan Summary', chunk: 'Section: Vesting on Separation', score: 0.82 },
    ],
  },
  finance: {
    answer:
      "Unbudgeted spend up to $5,000 may be approved by a department manager. Amounts between $5,000 and $25,000 require VP approval and a completed budget exception form submitted to Finance within 5 business days. Spend exceeding $25,000 requires CFO sign-off and a board memo for amounts above $250,000. All exceptions are tracked in the Finance JIRA project under the BUDEX label.",
    sources: [
      { title: 'Expense Policy v6', chunk: '§ 4 — Approval Thresholds', score: 0.97 },
      { title: 'Finance Governance Manual', chunk: 'Unbudgeted Spend Process', score: 0.89 },
      { title: 'Budget Exception Form Guide', chunk: 'Submission Requirements', score: 0.78 },
    ],
  },
  engineering: {
    answer:
      "Deployment freezes are in effect from December 15 through January 3 each year, and 48 hours before and after major product launches as designated by the Release Committee. Emergency patches for P0 security vulnerabilities may bypass the freeze with explicit VP Engineering approval, documented in the incident Slack channel and the post-mortem. See the Release Management runbook for the full escalation path.",
    sources: [
      { title: 'Release Management Runbook v2', chunk: '§ 3 — Freeze Windows', score: 0.95 },
      { title: 'Engineering Handbook 2025', chunk: 'Deployment Policy', score: 0.88 },
      { title: 'Incident Response Guide', chunk: 'P0 Emergency Patch Process', score: 0.83 },
    ],
  },
  compliance: {
    answer:
      "EU customer records are subject to GDPR Article 5 retention limits. Personal data must not be retained beyond the purpose for which it was collected. Our standard retention schedule sets a 3-year limit on CRM records and 7 years for transaction records. Data subject deletion requests must be fulfilled within 30 days. Records held for legal hold are exempt and managed by the Legal team.",
    sources: [
      { title: 'Data Retention Schedule v2025', chunk: 'EU Customer Data', score: 0.97 },
      { title: 'GDPR Compliance Policy', chunk: 'Article 5 Implementation', score: 0.93 },
      { title: 'Legal Hold Procedures', chunk: 'Exempt Records Handling', score: 0.80 },
    ],
  },
}

function pickResponse(dept: string, query: string): { answer: string; sources: Source[] } {
  const key = dept.toLowerCase().replace('human resources', 'hr').replace('human_resources', 'hr')
  const q = query.toLowerCase()
  if (key === 'legal' || q.includes('contract') || q.includes('indemnif') || q.includes('nda')) return MOCK_RESPONSES.legal
  if (key === 'hr' || q.includes('severance') || q.includes('leave') || q.includes('pto')) return MOCK_RESPONSES.hr
  if (key === 'finance' || q.includes('budget') || q.includes('spend') || q.includes('approval')) return MOCK_RESPONSES.finance
  if (key === 'engineering' || q.includes('deploy') || q.includes('runbook') || q.includes('incident')) return MOCK_RESPONSES.engineering
  if (key === 'compliance' || q.includes('gdpr') || q.includes('retention') || q.includes('eu')) return MOCK_RESPONSES.compliance
  return MOCK_RESPONSES.default
}

function RetrievalAnimation({ stage }: { stage: number }) {
  const stages = ['Embedding query…', 'Searching vector index…', 'Ranking chunks…', 'Generating response…']
  return (
    <div style={{ fontFamily: 'var(--font-mono)' }} className="flex flex-col gap-2 py-2">
      {stages.map((s, i) => (
        <div
          key={s}
          className={`flex items-center gap-3 text-xs transition-all duration-300 ${
            i < stage ? 'text-cyan-400' : i === stage ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {i < stage ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : i === stage ? (
            <span className="w-3 h-3 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </span>
          ) : (
            <span className="w-3 h-3 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-navy-600" />
            </span>
          )}
          {s}
        </div>
      ))}
    </div>
  )
}

function SourceCard({ source, index }: { source: Source; index: number }) {
  return (
    <div
      className="flex items-start justify-between gap-4 rounded-lg border border-navy-700 px-4 py-3 bg-navy-950 hover:border-navy-600 transition-colors"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="min-w-0">
        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-200 text-xs font-medium truncate">
          {source.title}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-500 text-[10px] mt-0.5">
          {source.chunk}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)' }} className="text-cyan-400 text-xs shrink-0 font-semibold">
        {(source.score * 100).toFixed(0)}%
      </div>
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 justify-end mb-1">
            <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-slate-500 uppercase tracking-widest">
              {msg.dept}
            </span>
          </div>
          <div className="bg-navy-700 rounded-2xl rounded-tr-sm px-4 py-3 text-slate-200 text-sm leading-relaxed">
            {msg.text}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-2">
          <img src={sesLogo} alt="SES Logo" className="w-5 h-5 rounded-full object-contain border border-navy-600" />
          <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">SES-GPT</span>
        </div>
        <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-tl-sm px-5 py-4">
          <p className="text-slate-200 text-sm leading-relaxed mb-4">{msg.text}</p>
          {msg.sources && msg.sources.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                {msg.sources.length} sources retrieved
              </div>
              <div className="flex flex-col gap-2">
                {msg.sources.map((s, i) => (
                  <SourceCard key={i} source={s} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingMessage({ dept }: { dept: string }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timings = [0, 600, 1200, 1900]
    const timers = timings.map((t, i) =>
      setTimeout(() => setStage(i), t)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex justify-start">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
            <span style={{ fontFamily: 'var(--font-mono)' }} className="text-cyan-400 text-[8px] font-bold">A</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-slate-500 uppercase tracking-widest">Arcana</span>
        </div>
        <div className="bg-navy-800 border border-navy-700 rounded-2xl rounded-tl-sm px-5 py-4">
          <RetrievalAnimation stage={stage} />
        </div>
      </div>
    </div>
  )
}

interface QueryPageProps {
  onBack: () => void
}

export default function QueryPage({ onBack }: QueryPageProps) {
  const [dept, setDept] = useState('Human Resources')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSubmit = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      text,
      dept,
    }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    await new Promise((r) => setTimeout(r, 2600))

    const { answer, sources } = pickResponse(dept, text)
    const assistantMsg: Message = {
      id: generateId(),
      role: 'assistant',
      text: answer,
      sources,
    }
    setMessages((m) => [...m, assistantMsg])
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const isEmpty = messages.length === 0 && !loading

  return (
    <div className="flex flex-col h-screen bg-navy-900" style={{ fontFamily: 'var(--font-sans)' }}>

      {/* Header */}
      <header className="shrink-0 border-b border-navy-700 bg-navy-950 px-4 md:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-slate-500 hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-navy-800"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M10.5 3L5.5 8l5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src={sesLogo} alt="SES Logo" className="w-6 h-6 rounded-full object-contain border border-navy-600" />
            <div style={{ fontFamily: 'var(--font-mono)' }} className="flex items-center gap-1.5">
              <span className="text-cyan-400 font-semibold text-sm">SES-GPT</span>
              <span className="text-slate-400 text-xs">RAG</span>
            </div>
          </div>
        </div>

        {/* Dept selector */}
        <div className="flex items-center gap-2">
          <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:block">
            Department
          </div>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)' }}
            className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-cyan-400/50 cursor-pointer"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-slate-500 hidden sm:block">
            index live
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center mb-6">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="4" stroke="#22d3ee" strokeWidth="1.5" />
                <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.93 4.93l1.41 1.41M15.66 15.66l1.41 1.41M4.93 17.07l1.41-1.41M15.66 6.34l1.41-1.41" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 style={{ fontFamily: 'var(--font-mono)' }} className="text-white font-semibold text-lg mb-2">
              Ask your department anything
            </h2>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
              Arcana searches the <span className="text-slate-200">{dept}</span> vector index and returns a grounded answer with source citations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-xl w-full">
              {[
                "What is the severance policy for directors?",
                "Which contracts expire in the next 60 days?",
                "What are the unbudgeted spend approval thresholds?",
                "What is the deployment freeze window for Q4?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus() }}
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="text-left text-xs text-slate-300 border border-navy-700 rounded-xl px-4 py-3 hover:border-navy-600 hover:bg-navy-800 transition-colors"
                >
                  "{q}"
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-8 flex flex-col gap-6">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {loading && <TypingMessage dept={dept} />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-navy-700 bg-navy-950 px-4 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end bg-navy-800 border border-navy-600 rounded-2xl px-4 py-3 focus-within:border-cyan-400/40 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              rows={1}
              placeholder={`Ask ${dept} anything…`}
              disabled={loading}
              className="flex-1 bg-transparent text-slate-200 text-sm placeholder-slate-500 resize-none focus:outline-none leading-relaxed disabled:opacity-50"
              style={{ maxHeight: 120 }}
              onInput={(e) => {
                const t = e.currentTarget
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="shrink-0 w-8 h-8 rounded-xl bg-cyan-400 flex items-center justify-center hover:bg-cyan-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 12V2M2 7l5-5 5 5" stroke="#080d1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)' }} className="text-[10px] text-slate-600 mt-2 text-center">
            Enter to send · Shift+Enter for new line · Responses grounded in {dept} index
          </div>
        </div>
      </div>
    </div>
  )
}
