import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listBooks, uploadBook, deleteBook } from '../api'
import type { Book } from '../api'

export default function Library() {
  const [books, setBooks] = useState<Book[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const load = () => listBooks().then(setBooks).catch(() => setError('加载失败'))

  useEffect(() => { load() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await uploadBook(file)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.detail || '上传失败')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`删除《${title}》？`)) return
    await deleteBook(id)
    setBooks(b => b.filter(x => x.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <h1 className="text-xl font-semibold text-gray-800 flex-1">书库</h1>
        <button
          onClick={() => navigate('/search')}
          className="text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded border border-gray-200 hover:border-gray-400 transition"
        >
          全站搜索
        </button>
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded transition">
          {uploading ? '上传中…' : '+ 导入 TXT'}
          <input
            ref={fileRef}
            type="file"
            accept=".txt"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>
        )}
        {books.length === 0 && !uploading && (
          <div className="text-center text-gray-400 mt-20 text-sm">
            暂无书籍，点击「导入 TXT」开始
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map(book => (
            <div
              key={book.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition cursor-pointer group"
              onClick={() => navigate(`/book/${book.id}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-medium text-gray-800 group-hover:text-blue-600 transition line-clamp-2 flex-1">
                  {book.title}
                </h2>
                <button
                  onClick={e => { e.stopPropagation(); handleDelete(book.id, book.title) }}
                  className="text-gray-300 hover:text-red-500 transition text-lg leading-none shrink-0"
                >
                  ×
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">{book.chapter_count} 章节</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
