// React Router：管理路由與取得當前路徑
import { Routes, Route, useLocation } from "react-router-dom";

// 共用元件
import Navbar from "./components/Navbar";
import Librarian from "./pages/Librarian";
import Placeholder from "./pages/Placeholder";
import Home from "./Home";
import Footer from "./components/Footer";
// import FontSizeController from "./components/FontSizeController";

export default function App() {
  // 取得目前路徑，用來判斷是否為首頁
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <>
      {/* 全站字體控制（目前未啟用） */}
      {/* <FontSizeController /> */}

      {/* 非首頁才顯示導覽列 */}
      {!isHome && <Navbar />}

      {/* 除了首頁外都套用固定版面寬度 */}
      <div
        className={isHome ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"}
      >
        {/* 路由設定 */}
        <Routes>
          {/* 首頁 */}
          <Route path="/" element={<Home />} />

          {/* AI 館員主頁 */}
          <Route path="/librarian" element={<Librarian />} />

          {/* 其他 placeholder 頁面 */}
          <Route path="/search" element={<Placeholder title="搜尋圖書" />} />
          <Route
            path="/recommendations"
            element={<Placeholder title="推薦中心" />}
          />
          <Route path="/history" element={<Placeholder title="閱讀歷史" />} />
        </Routes>
      </div>

      {/* 全站頁尾 */}
      <Footer />
    </>
  );
}
