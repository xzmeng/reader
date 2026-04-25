import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Library from './pages/Library'
import Reader from './pages/Reader'
import Search from './pages/Search'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/book/:bookId" element={<Reader />} />
        <Route path="/search" element={<Search />} />
      </Routes>
    </BrowserRouter>
  )
}
