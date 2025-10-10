import { Link, useLocation } from 'react-router-dom'
import { BookOpen, Bot, Search, Heart, History } from 'lucide-react' /*  */
import { Wifi } from "lucide-react"
import {useState,useEffect} from 'react'
import api from '../lib/api'  


export default function Navbar() {
  const { pathname } = useLocation()
  const [healthStatus, setHealthStatus] = useState<"ok" | "error" | "idle">("idle")

  const items = [
    { to: '/librarian', icon: Bot, label: 'AI AGENT' },
    // { to: '/search', icon: Search, label: 'test1' },
    // { to: '/recommendations', icon: Heart, label: 'test2' },
    // { to: '/history', icon: History, label: 'test3' },
  ]

  // const checkSystem = async () => {
  //   try{
  //     const res = await api.get('/')
  //     setHealthStatus("ok")
  //     alert("系統正常運作中")
  //   }
  //   catch (error) {
  //     setHealthStatus("error")
  //     alert("系統異常，請稍後再試")
  //   }
  // }

  // ✅ 自動檢查系統狀態
  useEffect(() => {
    const checkSystem = async () => {
      try {
        await api.get('/')
        setHealthStatus("ok")
      } catch (error) {
        setHealthStatus("error")
      }
    }
    // 先立即檢查一次
    checkSystem()

    // 每 30 秒檢查一次
    const interval = setInterval(() => {
      checkSystem()
    }, 30000)

    // 卸載時清除
    return () => clearInterval(interval)



  }, [])

  

  return (
    <nav className="sticky top-0 z-50 bg-neutral-950/70 backdrop-blur-lg border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
        {/* 左：Logo（點擊回首頁） */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition">
          <BookOpen className="w-7 h-7 text-sky-400" />
          <div>
            <div className="text-neutral-100 font-bold">AI Librarian</div>
            <div className="text-xs text-neutral-400">智慧搜尋幫手</div>
          </div>
        </Link>

        {/* 右：分頁 */}
        <div className="hidden md:flex gap-2">
          {items.map(({ to, icon: Icon, label }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                /* 右：分頁 */
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition
                  ${active
                    ? 'text-sky-300 bg-sky-500/10 border-sky-700/40'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60 border-transparent'}`}
              >
                <Icon className="w-6 h-6" />
                {label}
              </Link>
            )
          })}

          {/* 系統狀態顯示：紅綠燈 */}
          {/* 系統狀態顯示：WiFi 圖示 */}
          <div className="flex items-center gap-2">
            <Wifi
              className={`w-5 h-5 ${
                healthStatus === "ok"
                  ? "text-green-400"
                  : healthStatus === "error"
                  ? "text-red-500"
                  : "text-neutral-500"
              }`}
            />
            <span className="text-sm text-neutral-300">
              {healthStatus === "ok" && "系統正常"}
              {healthStatus === "error" && "系統異常"}
              {healthStatus === "idle" && "檢查中..."}
            </span>
</div>



        </div>
      </div>
    </nav>
  )
}
