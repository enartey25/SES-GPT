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
    <div className={`markdown-body flex flex-col gap-3 text-[#1e1e1e] dark:text-[#f3f4f6] text-[14px] leading-relaxed ${className}`}>
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
      const rawText = quoteLines.join(' ')
      let alertType: 'note' | 'tip' | 'important' | 'warning' | 'caution' | undefined
      let cleanText = rawText

      const alertMatch = rawText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)/i)
      if (alertMatch) {
        alertType = alertMatch[1].toLowerCase() as any
        cleanText = alertMatch[2]
      }

      blocks.push({ type: 'blockquote', text: cleanText, alertType })
      continue
    }

    // 6. Unordered List (-, *, +)
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, '').trim())
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // 7. Ordered List (1. ...)
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, '').trim())
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // 8. Empty lines
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
          <h1 key={key} className="text-[17px] font-[700] text-[#1e1e1e] dark:text-[#ffffff] tracking-tight border-b border-[rgba(20,18,24,0.08)] dark:border-[#33333e] pb-2 mt-4 mb-2">
            {text}
          </h1>
        )
      }
      if (block.level === 2) {
        return (
          <h2 key={key} className="text-[15px] font-[650] text-[#1e1e1e] dark:text-[#ffffff] tracking-tight mt-3 mb-1.5">
            {text}
          </h2>
        )
      }
      if (block.level === 3) {
        return (
          <h3 key={key} className="text-[14px] font-[600] text-[#1e1e1e] dark:text-[#f3f4f6] mt-2.5 mb-1">
            {text}
          </h3>
        )
      }
      return <h4 key={key} className="text-[13px] font-[600] text-[#757575] dark:text-[#a1a1aa] uppercase tracking-wider mt-2 mb-1">{text}</h4>
    }

    case 'code':
      return <CodeBlock key={key} code={block.code} language={block.language} />

    case 'table':
      return (
        <div key={key} className="overflow-x-auto my-3 rounded-[10px] border border-[#d9d9d9] dark:border-[#33333e] bg-[#ffffff] dark:bg-[#18181c] shadow-xs">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead>
              <tr className="bg-[#f5f5f5] dark:bg-[#202026] border-b border-[#d9d9d9] dark:border-[#33333e]">
                {block.headers.map((h, hIdx) => (
                  <th key={hIdx} className="px-3.5 py-2.5 font-[600] text-[#1e1e1e] dark:text-[#ffffff] tracking-wide">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#2d2d38]">
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className={rIdx % 2 === 1 ? 'bg-[#fafafa] dark:bg-[#1f1f27]' : 'bg-transparent'}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2 text-[#1e1e1e] dark:text-[#f3f4f6] leading-relaxed">
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
        <ul key={key} className="flex flex-col gap-1.5 my-1.5 pl-1.5">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[#1e1e1e] dark:text-[#f3f4f6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e1e1e] dark:bg-[#ffffff] shrink-0 mt-2" />
              <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol key={key} className="flex flex-col gap-1.5 my-1.5 pl-1">
          {block.items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-[#1e1e1e] dark:text-[#f3f4f6]">
              <span
                className="text-[11.5px] font-[600] text-[#1e1e1e] dark:text-[#ffffff] bg-[#f0f0f0] dark:bg-[#26262e] border border-[#d9d9d9] dark:border-[#33333e] rounded-[4px] px-1.5 py-0.2 shrink-0 mt-0.5"
              >
                {idx + 1}
              </span>
              <span className="flex-1 leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )

    case 'blockquote': {
      let borderClass = 'border-[#1e1e1e] bg-[#f5f5f5] text-[#1e1e1e] dark:border-[#ffffff] dark:bg-[#202026] dark:text-[#f3f4f6]'
      let badge = ''
      if (block.alertType === 'warning' || block.alertType === 'caution') {
        borderClass = 'border-[#eab308] bg-[#fefce8] text-[#854d0e] dark:bg-[#2a2410] dark:text-[#fef08a]'
        badge = '⚠️ WARNING: '
      } else if (block.alertType === 'important') {
        borderClass = 'border-[#e11d48] bg-[#fff1f2] text-[#9f1239] dark:bg-[#2e1218] dark:text-[#fecdd3]'
        badge = '📌 IMPORTANT: '
      } else if (block.alertType === 'tip') {
        borderClass = 'border-[#10b981] bg-[#ecfdf5] text-[#065f46] dark:bg-[#0f291e] dark:text-[#a7f3d0]'
        badge = '💡 TIP: '
      }

      return (
        <div key={key} className={`border-l-4 pl-3.5 py-2 my-2 rounded-r-[8px] text-[13px] leading-relaxed ${borderClass}`}>
          {badge && <strong className="font-bold mr-1">{badge}</strong>}
          {renderInline(block.text)}
        </div>
      )
    }

    case 'hr':
      return <hr key={key} className="border-[rgba(20,18,24,0.08)] dark:border-[#33333e] my-3" />

    case 'paragraph':
      return <p key={key} className="text-[#1e1e1e] dark:text-[#f3f4f6] leading-relaxed my-0.5">{renderInline(block.text)}</p>

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
    <div className="my-3 rounded-[10px] border border-[#2d2d38] bg-[#141417] overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#1e1e24] border-b border-[#2d2d38] text-[11px]">
        <span className="text-[#a1a1aa] font-medium lowercase font-mono">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[#a1a1aa] hover:text-[#ffffff] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-[#10b981]">Copied!</span>
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
      <pre className="p-3.5 text-[12.5px] text-[#f3f4f6] font-mono overflow-x-auto leading-relaxed">
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
          className="bg-[#f0f0f0] dark:bg-[#26262e] border border-[#d9d9d9] dark:border-[#3a3a46] text-[#1e1e1e] dark:text-[#f3f4f6] px-1.5 py-0.5 rounded-[4px] text-[12px] font-[600] font-mono"
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
        <strong key={idx} className="font-[700] text-[#1e1e1e] dark:text-[#ffffff]">
          {inner}
        </strong>
      )
    }

    if (chunk.startsWith('~~') && chunk.endsWith('~~')) {
      return (
        <del key={idx} className="line-through text-[#757575] dark:text-[#a1a1aa]">
          {chunk.slice(2, -2)}
        </del>
      )
    }

    if ((chunk.startsWith('*') && chunk.endsWith('*')) || (chunk.startsWith('_') && chunk.endsWith('_'))) {
      return (
        <em key={idx} className="italic text-[#1e1e1e] dark:text-[#f3f4f6]">
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
          className="text-[#1e1e1e] dark:text-[#ffffff] underline underline-offset-2 hover:opacity-80 transition-opacity font-[600]"
        >
          {linkMatch[1]}
        </a>
      )
    }

    return chunk
  })
}
