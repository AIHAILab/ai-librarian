import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import Librarian from './pages/Librarian'
import Placeholder from './pages/Placeholder'
import Home from "./Home"

export default function App() {
  const location = useLocation()
  const isHome = location.pathname === "/"

  return (
    <>
      {/* 只有非首頁才顯示 Navbar */}
      {!isHome && <Navbar />}

      <div className={isHome ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/librarian" element={<Librarian />} />
          <Route path="/search" element={<Placeholder title="搜尋圖書" />} />
          <Route path="/recommendations" element={<Placeholder title="推薦中心" />} />
          <Route path="/history" element={<Placeholder title="閱讀歷史" />} />
        </Routes>
      </div>
    </>
  )
}
