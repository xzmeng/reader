import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getBook, getChapter, search } from '../api'
import type { BookDetail, Chapter, SearchResult } from '../api'

const STORAGE_KEY = (bookId: string) => `reader_progress_${bookId}`

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function renderHighlighted(text: string, term: string) {
  if (!term.trim()) return text
  const parts = text.split(new RegExp(`(${escapeRegex(term.trim())})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === term.trim().toLowerCase()
      ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm">{part}</mark>
      : part
  )
}

export default function Reader() {
  const { bookId } = useParams<{ bookId: string }>()
  const [sp] = useSearchParams()
  const navigate = useNavigate()

  const [book, setBook] = useState<BookDetail | null>(null)
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [highlightTerm, setHighlightTerm] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const id = Number(bookId)

  const loadChapter = async (idx: number) => {
    const ch = await getChapter(id, idx)
    setChapter(ch)
    localStorage.setItem(STORAGE_KEY(bookId!), String(idx))
    window.scrollTo(0, 0)
    contentRef.current?.scrollTo(0, 0)
  }

  // Scroll to first highlight mark after chapter + term are both set
  useEffect(() => {
    if (!highlightTerm || !chapter) return
    const el = contentRef.current?.querySelector('mark')
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [chapter?.id, highlightTerm])

  useEffect(() => {
    getBook(id).then(b => {
      setBook(b)
      const fromSearch = sp.get('chapter')
      const hlParam = sp.get('highlight') ?? ''
      const saved = localStorage.getItem(STORAGE_KEY(bookId!))
      const idx = fromSearch != null ? Number(fromSearch) : saved != null ? Number(saved) : 0
      setHighlightTerm(hlParam)
      loadChapter(Math.min(idx, b.chapter_count - 1))
    })
  }, [id])

  const handleSearch = async (q: string) => {
    setSearchQ(q)
    if (!q.trim()) { setSearchResults([]); return }
    setSearching(true)
    try {
      const res = await search(q, id)
      setSearchResults(res.results)
    } finally {
      setSearching(false)
    }
  }

  const goChapter = (idx: number, term?: string) => {
    setHighlightTerm(term ?? '')
    loadChapter(idx)
    setSidebarOpen(false)
    setSearchOpen(false)
  }

  if (!book || !chapter) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中…</div>
  }

  const hasPrev = chapter.chapter_index > 0
  const hasNext = chapter.chapter_index < book.chapter_count - 1

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 text-xl leading-none">←</button>
        <span className="flex-1 text-sm font-medium text-gray-700 truncate">{book.title}</span>
        <button
          onClick={() => { setSearchOpen(o => !o); setSidebarOpen(false) }}
          className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition"
        >搜索</button>
        <button
          onClick={() => { setSidebarOpen(o => !o); setSearchOpen(false) }}
          className="text-sm text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition"
        >目录</button>
      </header>

      {/* Search panel */}
      {searchOpen && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <input
            autoFocus
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none focus:border-blue-400"
            placeholder="在本书中搜索…"
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
          />
          {searching && <p className="text-xs text-gray-400 mt-2">搜索中…</p>}
          {searchResults.length > 0 && (
            <ul className="mt-2 max-h-60 overflow-y-auto divide-y divide-gray-100">
              {searchResults.map(r => (
                <li
                  key={r.chapter_id + r.snippet}
                  className="py-2 cursor-pointer hover:bg-gray-50 px-1 rounded"
                  onClick={() => goChapter(r.chapter_index, searchQ)}
                >
                  <p className="text-xs font-medium text-blue-600">{r.chapter_title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {renderHighlighted(r.snippet, searchQ)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {!searching && searchQ && searchResults.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">无结果</p>
          )}
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto fixed inset-y-0 left-0 z-20 top-[41px] shadow-lg lg:static lg:shadow-none lg:z-auto">
            <div className="py-2">
              {book.chapters.map(c => (
                <button
                  key={c.chapter_index}
                  onClick={() => goChapter(c.chapter_index)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition ${c.chapter_index === chapter.chapter_index ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-600'}`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </aside>
        )}
        {sidebarOpen && (
          <div className="fixed inset-0 z-10 lg:hidden top-[41px]" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Content */}
        <main ref={contentRef} className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">{chapter.title}</h2>
          <div className="text-gray-700 leading-8 text-base break-words">
            {chapter.content.split('\n').map((line, i) =>
              line.trim()
                ? <p key={i} style={{ textIndent: '2em' }} className="mb-0">{renderHighlighted(line.trim(), highlightTerm)}</p>
                : <div key={i} className="h-3" />
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between mt-10 pt-6 border-t border-gray-200">
            <button
              disabled={!hasPrev}
              onClick={() => loadChapter(chapter.chapter_index - 1)}
              className="px-4 py-2 text-sm rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition"
            >← 上一章</button>
            <span className="text-xs text-gray-400 self-center">
              {chapter.chapter_index + 1} / {book.chapter_count}
            </span>
            <button
              disabled={!hasNext}
              onClick={() => loadChapter(chapter.chapter_index + 1)}
              className="px-4 py-2 text-sm rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-100 transition"
            >下一章 →</button>
          </div>
        </main>
      </div>
    </div>
  )
}
