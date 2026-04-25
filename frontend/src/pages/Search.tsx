import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { search } from '../api'
import type { SearchResult } from '../api'

export default function Search() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const doSearch = async (query: string, p = 1) => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await search(query, undefined, p)
      setResults(res.results)
      setTotal(res.total)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }

  const highlight = (text: string) => {
    const term = q.trim()
    if (!term) return text
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
    return parts.map((p, i) =>
      p.toLowerCase() === term.toLowerCase()
        ? <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm">{p}</mark>
        : p
    )
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 text-xl">←</button>
        <h1 className="text-lg font-semibold text-gray-800 flex-1">全站搜索</h1>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <input
            autoFocus
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            placeholder="输入关键词搜索所有书籍…"
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch(q)}
          />
          <button
            onClick={() => doSearch(q)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm transition"
          >搜索</button>
        </div>

        {loading && <p className="text-center text-gray-400 text-sm">搜索中…</p>}

        {!loading && results.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-4">共 {total} 条结果</p>
            <ul className="space-y-3">
              {results.map((r, i) => (
                <li
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition"
                  onClick={() => navigate(`/book/${r.book_id}?chapter=${r.chapter_index}&highlight=${encodeURIComponent(q)}`)}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{r.book_title}</span>
                    <span className="text-xs text-gray-400">{r.chapter_title}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{highlight(r.snippet)}</p>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  disabled={page === 1}
                  onClick={() => doSearch(q, page - 1)}
                  className="px-3 py-1.5 text-sm border rounded disabled:opacity-30 hover:bg-gray-100"
                >上一页</button>
                <span className="px-3 py-1.5 text-sm text-gray-500">{page} / {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => doSearch(q, page + 1)}
                  className="px-3 py-1.5 text-sm border rounded disabled:opacity-30 hover:bg-gray-100"
                >下一页</button>
              </div>
            )}
          </>
        )}

        {!loading && q && results.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-20">未找到「{q}」相关内容</p>
        )}
      </main>
    </div>
  )
}
