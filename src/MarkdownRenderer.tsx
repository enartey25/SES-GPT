import React, { useState } from 'react'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null

  // Pre-process content into blocks (code blocks, tables, headers, lists, quotes, paragraphs)
  const blocks = parseMarkdownBlocks(content)

  return (
    <div className={`markdown-body flex flex-col gap-2.5 text-slate-200 text-sm leading-relaxed ${className}`}>
      {blocks.map((block, idx) => (
        <React.Fragment key={idx}>{renderBlock(block, idx)}</React.Fragment>
      ))}
    </div>
  )
}

type BlockType =
  | { type: 'header'; level: number; text: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; text: string; alertType?: 'note' | 'tip' | 'important' | 'warning' | 'caution' }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string }

function parseMarkdownBlocks(md: string): BlockType[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: BlockType[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 1. Code block (```)
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // consume closing ```
      blocks.push({ type: 'code', language, code: codeLines.join('\n') })
      continue
    }

    // 2. Horizontal Rule (---, ***, ___)
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // 3. Headings (# ... ####)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headerMatch) {
      blocks.push({
        type: 'header',
        level: headerMatch[1].length,
        text: headerMatch[2].trim(),
      })
      i++
      continue
    }

    // 4. Tables (| ... |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim())
        i++
      }
      if (tableLines.length >= 2) {
        const parseRow = (r: string) =>
          r
            .slice(1, -1)
            .split('|')
            .map(c => c.trim())
        const headers = parseRow(tableLines[0])
        // Check if row 1 is delimiter (|---|---|)
        const isDelimiter = tableLines[1].replace(/[\s|:-]/g, '').length === 0
        const dataRows = (isDelimiter ? tableLines.slice(2) : tableLines.slice(1)).map(parseRow)
        blocks.push({ type: 'table', headers, rows: dataRows })
        continue
      }
    }

    // 5. Blockquote (> ...)
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && (lines[i].trim().startsWith('>') || (lines[i].trim() !== '' && quoteLines.length > 0 && !lines[i].startsWith('#')))) {
        quoteLines.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      const fullQuote = quoteLines.join('\n').trim()
      let alertType: 'note' | 'tip' | 'important' | 'warning' | 'caution' | undefined
      const alertMatch = fullQuote.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)$/i)
      let cleanText = fullQuote
      if (alertMatch) {
        alertType = alertMatch[1].toLowerCase() as any
        cleanText = alertMatch[2]
      }
      blocks.push({ type: 'blockquote', text: cleanText, alertType })
      continue
    }

    // 6. Unordered List (- item, * item)
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, '').trim())
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // 7. Ordered List (1. item)
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim())
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // 8. Empty line
    if (line.trim() === '') {
      i++
      continue
    }

    // 9. Paragraph (multi-line accumulator until empty line or next block structure)
    const pLines: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !/^\s*[-*+]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^(\s*[-*_]\s*){3,}$/.test(lines[i]) &&
      !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|'))
    ) {
      pLines.push(lines[i])
      i++
    }
    blocks.push({ type: 'paragraph', text: pLines.join(' ') })
  }

  return blocks
}

function renderBlock(block: BlockType, key: number): React.ReactNode {
  switch (block.type) {
    case 'header': {
      const text = renderInline(block.text)
      if (block.level === 1) {
        return (
          <h1 className="text-xl font-bold text-white tracking-tight border-b border-navy-700 pb-2 mt-3 mb-1 text-cyan-300">
            {text}
          </h1>
        )
      }
      if (block.level === 2) {
        return (
          <h2 className="text-base font-semibold text-white tracking-tight mt-3 mb-1 text-cyan-200">
            {text}
          </h2>
        )
      }
      if (block.level === 3) {
        return (
          <h3 className="text-sm font-semibold text-slate-100 mt-2 mb-0.5 text-cyan-100">
            {text}
          </h3>
        )
      }
      return <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mt-2">{text}</h4>
    }

    case 'code':
      return <CodeBlock code={block.code} language={block.language} />

    case 'table':
      return (
        <div className="overflow-x-auto my-3 rounded-xl border border-navy-700 bg-navy-950/80 shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-navy-900 border-b border-navy-700">
                {block.headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3.5 py-2.5 font-semibold text-cyan-300 tracking-wide">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-navy-900/30' : 'bg-transparent'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-slate-300 leading-relaxed">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'ul':
      return (
        <ul className="flex flex-col gap-1.5 my-1.5 pl-1.5">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-2" />
              <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol className="flex flex-col gap-1.5 my-1.5 pl-1">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-slate-200">
              <span
                style={{ fontFamily: 'var(--font-mono)' }}
                className="text-[11px] font-semibold text-cyan-400 bg-navy-900 border border-cyan-400/30 rounded px-1.5 py-0.2 shrink-0 mt-0.5"
              >
                {idx + 1}
              </span>
              <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )

    case 'blockquote': {
      let borderClass = 'border-cyan-400 bg-cyan-400/10 text-cyan-200'
      let badge = ''
      if (block.alertType === 'warning' || block.alertType === 'caution') {
        borderClass = 'border-amber-400 bg-amber-400/10 text-amber-200'
        badge = '⚠️ WARNING: '
      } else if (block.alertType === 'important') {
        borderClass = 'border-rose-400 bg-rose-400/10 text-rose-200'
        badge = '📌 IMPORTANT: '
      } else if (block.alertType === 'tip') {
        borderClass = 'border-emerald-400 bg-emerald-400/10 text-emerald-200'
        badge = '💡 TIP: '
      }

      return (
        <div className={`border-l-4 pl-3.5 py-2 my-2 rounded-r-lg text-xs leading-relaxed ${borderClass}`}>
          {badge && <strong className="font-bold mr-1">{badge}</strong>}
          {renderInline(block.text)}
        </div>
      )
    }

    case 'hr':
      return <hr className="border-navy-700 my-3" />

    case 'paragraph':
      return <p className="text-slate-200 leading-relaxed my-0.5">{renderInline(block.text)}</p>

    default:
      return null
  }
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 rounded-xl border border-navy-700 bg-navy-950 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-navy-900 border-b border-navy-800 text-[11px]">
        <span style={{ fontFamily: 'var(--font-mono)' }} className="text-slate-400 font-medium lowercase">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre style={{ fontFamily: 'var(--font-mono)' }} className="p-3.5 text-xs text-cyan-200 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/**
 * Parses inline elements: bold (**), italic (*), code (`), links ([text](url)), badges
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return ''

  // Split by inline code first to protect code contents
  const codeRegex = /(`[^`]+`)/g
  const parts = text.split(codeRegex)

  return parts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeContent = part.slice(1, -1)
      return (
        <code
          key={pIdx}
          style={{ fontFamily: 'var(--font-mono)' }}
          className="bg-navy-900/90 border border-navy-700 text-cyan-300 px-1.5 py-0.5 rounded text-[11px] font-semibold"
        >
          {codeContent}
        </code>
      )
    }

    return <span key={pIdx}>{formatInlineStyles(part)}</span>
  })
}

function formatInlineStyles(text: string): React.ReactNode {
  // Regex for bold (**text** or __text__), italic (*text* or _text_), links ([label](url)), strikethrough (~~text~~)
  const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\[[^\]]+\]\([^)]+\)|\*[^*]+\*|_[^_]+_)/g
  const chunks = text.split(tokenRegex)

  return chunks.map((chunk, idx) => {
    if ((chunk.startsWith('**') && chunk.endsWith('**')) || (chunk.startsWith('__') && chunk.endsWith('__'))) {
      const inner = chunk.slice(2, -2)
      return (
        <strong key={idx} className="font-semibold text-white">
          {inner}
        </strong>
      )
    }

    if (chunk.startsWith('~~') && chunk.endsWith('~~')) {
      return (
        <del key={idx} className="line-through text-slate-500">
          {chunk.slice(2, -2)}
        </del>
      )
    }

    if ((chunk.startsWith('*') && chunk.endsWith('*')) || (chunk.startsWith('_') && chunk.endsWith('_'))) {
      return (
        <em key={idx} className="italic text-slate-300">
          {chunk.slice(1, -1)}
        </em>
      )
    }

    const linkMatch = chunk.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-medium"
        >
          {linkMatch[1]}
        </a>
      )
    }

    return chunk
  })
}
