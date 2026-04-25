import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export interface Book {
  id: number
  title: string
  chapter_count: number
  created_at: string
}

export interface ChapterMeta {
  chapter_index: number
  title: string
}

export interface BookDetail extends Book {
  chapters: ChapterMeta[]
}

export interface Chapter {
  id: number
  book_id: number
  chapter_index: number
  title: string
  content: string
}

export interface SearchResult {
  book_id: number
  book_title: string
  chapter_id: number
  chapter_index: number
  chapter_title: string
  snippet: string
}

export interface SearchResponse {
  total: number
  page: number
  page_size: number
  results: SearchResult[]
}

export const listBooks = () => api.get<Book[]>('/books').then(r => r.data)

export const uploadBook = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post<Book>('/books', form).then(r => r.data)
}

export const getBook = (id: number) =>
  api.get<BookDetail>(`/books/${id}`).then(r => r.data)

export const getChapter = (bookId: number, chapterIndex: number) =>
  api.get<Chapter>(`/books/${bookId}/chapters/${chapterIndex}`).then(r => r.data)

export const deleteBook = (id: number) =>
  api.delete(`/books/${id}`).then(r => r.data)

export const search = (q: string, bookId?: number, page = 1) =>
  api
    .get<SearchResponse>('/search', {
      params: { q, book_id: bookId, page, page_size: 20 },
    })
    .then(r => r.data)
