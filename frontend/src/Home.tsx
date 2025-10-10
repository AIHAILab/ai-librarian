import { useNavigate } from "react-router-dom"

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden flex items-center justify-center">
      {/* 🔵 發光粒子背景 */}
      
      <div className="absolute inset-0">
        
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full  bg-white/80 opacity-70 animate-float"
            
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${5 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* 🔹 中央區塊 */}
      <div className="relative z-10 text-center">
        {/* Slogan */}
        <h1 className="text-4xl md:text-6xl font-bold text-sky-400/70 mb-6 drop-shadow-lg">
          Unlock knowledge, powered by AI.
        </h1>

        {/* Start 按鈕 */}
        <button
          onClick={() => navigate("/librarian")}
          className="px-10 py-4 text-lg font-semibold rounded-full 
                     bg-sky-600 text-white shadow-lg hover:bg-sky-500 
                     transition-all duration-300 animate-pulse"
        >
          Start
        </button>
      </div>
    </div>
  )
}
