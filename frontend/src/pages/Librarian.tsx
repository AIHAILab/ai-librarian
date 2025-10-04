// src/pages/Librarian.tsx

// =====================================
// React 與工具 import
// =====================================
import type { ElementType } from 'react'                         // 型別：代表一個 React 元件
import { mcpTools, toolZhDesc, type Tool } from '../data/mcpTools' // MCP 工具清單與中文描述
import {
  Clock, FlaskConical, Search, SquarePlay, BookOpen, Globe, Bookmark, CloudSun
} from 'lucide-react'                                           // ICON 套件（lucide-react）
import { useState, useEffect, useRef } from 'react'    // React Hooks（狀態、生命週期、快取、ref）
import Live2DPanel from '../components/Live2DPanel'             // Live2D 畫布元件                             // （預留）API 呼叫工具
import { Settings } from "lucide-react"  // ✅ 引入設定 icon


// =====================================
// 工具 ICON 對照表（讓工具清單能顯示對應的 ICON）
// =====================================
const toolIconMap: Record<string, ElementType> = {
  date_time: Clock,
  arxiv: FlaskConical,
  duckduckgo_results_json: Search,
  youtube_search: SquarePlay,
  ncl_search: BookOpen,
  wikipedia: Globe,
  google_search: Search,
  google_books: Bookmark,
  open_weather_map: CloudSun,
}

// =====================================
// 模型選擇器：定義可用模型清單
// =====================================
const availableModels = [
  'openai:gpt-4o-mini', 'openai:gpt-4o', 'openai:o4-mini', 'openai:gpt-4.1',
  'openai:gpt-4.1-mini', 'openai:gpt-4.1-nano', 'openai:o3-mini', 'openai:o1',
  'anthropic:claude-3-7-sonnet-latest', 'anthropic:claude-3-5-haiku-latest',
  'anthropic:claude-3-5-sonnet-latest', 'anthropic:claude-3-5-sonnet-20240620',
  'google_genai:gemini-2.5-pro', 'google_genai:gemini-2.5-flash',
  'google_genai:gemini-2.5-flash-lite', 'groq:llama-3.3-70b-versatile',
  'groq:llama-3.1-8b-instant'
]

// 預設選用的模型
const defaultModel = "openai:gpt-4o"

// =====================================
// 工具 ICON 元件（避免到處寫 switch）
// =====================================
const IconByName = ({ name }: { name: string }) => {
  const Icon = toolIconMap[name] ?? Search // 如果沒有對應，就用 Search 當預設
  return <Icon className="w-5 h-5 text-sky-300" />
}



// =====================================
// Type 定義
// =====================================
// Live2D 模型資訊
type Live2DInfo = { name: string; url: string; tags?: string[] }
// 訊息物件：使用者或助理的對話
type Message = { role: 'user' | 'assistant'; content: string }
type APIMessage = { role: 'system' | 'user' | 'assistant'; content: string }


// =====================================
// 主元件：Librarian
// =====================================
export default function Librarian() {
  const [selected, setSelected] = useState<Tool | null>(null) // 當前被選擇的工具

  // Live2D 狀態（模型清單 & 畫布 URL）
  const [models, setModels] = useState<Live2DInfo[]>([])     // 所有可用模型（從 /index.json 載入）
  const [modelUrl, setModelUrl] = useState<string>('')       // 當前選中的 Live2D 模型路徑


  // ✅ 新增設定視窗開關
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  // ✅ 新增三個參數的狀態
  const [systemPrompt, setSystemPrompt] = useState("所有輸出只能是 JSON 陣列。")
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1024)

  // ✅ 套用設定
  const applySettings = () => {
  // 基本合法性防呆（避免 NaN 或超出範圍）
  const t = Math.min(1, Math.max(0, Number(temperature) || 0))
  const m = Math.max(1, Math.floor(Number(maxTokens) || 1))

  // 寫回 state（避免輸入了無效值）
  setTemperature(t)
  setMaxTokens(m)

  // 存到 localStorage
  const config = { systemPrompt, temperature: t, maxTokens: m, model: currentModel }
  localStorage.setItem("aiConfig", JSON.stringify(config))

  setIsConfigOpen(false)
  // 你可用 toast，這裡先用最簡單的提示
  alert("設定已保存並套用")
}


  // 對話狀態
  const [messages, setMessages] = useState<Message[]>([])    // 對話紀錄
  const [input, setInput] = useState('')                     // 使用者輸入框
  const [loading, setLoading] = useState(false)              // 是否處理中（送出中）

  // 模型狀態
  const [currentModel, setCurrentModel] = useState(defaultModel) // 當前選用的 LLM 模型
  const [selectedTool, setSelectedTool] = useState<string>("")

  

  // ✅ 建議問題（進入頁面時先顯示，點擊即可送出）
  const suggestedQuestions = [
    "要怎麼控制血糖比較好？有推薦的飲食書嗎？",
    "請幫我找一些關於預防失智或養腦運動的資料",
    "請幫我查詢今天台北的天氣及日期",
    "我想聽古典音樂或懷舊歌曲，可以幫我找播放連結嗎？"
  ]

  // ✅ 延伸問題狀態（AI 回答後自動生成）
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([])

  // =====================================
  // useEffect：讀取 Live2D 模型清單（public/index.json）
  // =====================================
  useEffect(() => {
    const manifestPath = '/index.json'
    fetch(manifestPath)
      .then(r => {
        if (!r.ok) throw new Error(`Manifest ${manifestPath} ${r.status}`)
        return r.json()
      })
      .then((list: Live2DInfo[]) => {
        // 正規化：確保每個模型有正確的路徑
        const normalized = list.map(m => {
          const name = m.name.trim()
          const good = m.url && m.url.startsWith('/') && m.url.endsWith('.model3.json')
            ? m.url
            : `/${name}/${name}.model3.json`
          return { ...m, url: good }
        })
        setModels(normalized)
        // 預設載入第一個模型
        const firstC3 = normalized.find(m => m.url.endsWith('.model3.json'))
        setModelUrl(firstC3?.url ?? normalized[0]?.url ?? '')
      })
      .catch(err => {
        console.error('Load Live2D manifest failed:', err)
        setModels([])
      })
  }, [])

  // =====================================
  // useMemo：過濾 Live2D 模型（依搜尋字串）
  // =====================================
  // const filteredModels = useMemo(() => {
  //   const q = modelSearch.toLowerCase()
  //   return models.filter(m =>
  //     (m.name + ' ' + (m.tags?.join(' ') ?? '')).toLowerCase().includes(q)
  //   )
  // }, [models, modelSearch])

  // ✅ 把 LLM 回覆文字轉成 3 個延伸問題
  function parseSuggestions(text: string): string[] {
    // 嘗試直接 JSON.parse
    try {
      const arr = JSON.parse(text)
      if (Array.isArray(arr)) return arr
    } catch (_) {}

    // 用正則抓第一個陣列
    const match = text.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const arr = JSON.parse(match[0])
        if (Array.isArray(arr)) return arr
      } catch (_) {}
    }

    // 如果還是不行，就用斷行切割
    return text
      .split(/\n|,|。/g)
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 3)
  }

  // =====================================
  // 在載入頁面時把 localStorage 讀回來
  // =====================================
  useEffect(() => {
  try {
    const raw = localStorage.getItem("aiConfig")
    if (!raw) return
    const saved = JSON.parse(raw)
    if (typeof saved.systemPrompt === "string") setSystemPrompt(saved.systemPrompt)
    if (typeof saved.temperature === "number") setTemperature(saved.temperature)
    if (typeof saved.maxTokens === "number") setMaxTokens(saved.maxTokens)
    if (typeof saved.model === "string") {
        setCurrentModel(saved.model)
      } else {
        setCurrentModel(defaultModel) 
      }
  } catch (_) {
    // 讀取失敗就忽略
  }
  }, [])

  // ✅ 用 ref 記錄目前 SSE 串流中的訊息 index
  const streamIndexRef = useRef<number | null>(null)
  // ✅ 組字狀態 ref（避免中文輸入時誤觸 Enter）
  const composingRef = useRef(false)
  // ✅ 新增 buffer：收集後端所有 chunk（避免掉字）
  const llmBufferRef = useRef<string>("")

  const chunksRef = useRef<string[]>([])

  // =====================================
  // 假流式：在前端逐字顯示完整回覆
  // =====================================
  function startStreamingDisplay(fullText: string, onFinished?: () => void) {
  let i = 0
  setMessages((prev) => [...prev, { role: "assistant", content: "" }])

  const interval = setInterval(() => {
    i++
    setMessages((prev) => {
      const updated = [...prev]
      const lastIdx = updated.length - 1
      if (!updated[lastIdx]) return prev
      updated[lastIdx] = {
        ...updated[lastIdx],
        content: fullText.slice(0, i),
      }
      return updated
    })

    if (i >= fullText.length) {
      clearInterval(interval)
      if (onFinished) onFinished() // ✅ callback：打字完後觸發
    }
  }, 30)
}


  // =====================================
  // handleSend：處理送出訊息 + SSE 即時回覆
  // =====================================
  const handleSend = async (customInput?: string) => {
    const text = customInput ?? input
    if (!text.trim()) return

    const userMsg: Message = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    setFollowUpQuestions([])

    // ✅ 把 system prompt 放最前面（只送 API，不顯示在 UI）
    const messagesForAPI: APIMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content } as APIMessage)),
      userMsg,
    ]

    try {
      // ✅ 主回覆：走 SSE（/react/stream），帶入 llm_config 參數
      const response = await fetch("http://localhost:8000/v1/react/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messagesForAPI,
          llm_config: {
            model: currentModel,
            temperature,
            max_tokens: maxTokens,
          },
          thread_id: "thread-frontend",
          // tool_choice: selectedTool || null, 
        }),
      })

      if (!response.body) throw new Error("後端沒有回應 body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split("\n\n")
        buffer = parts.pop() || ""

        for (const part of parts) {
          if (!part.trim()) continue
          const lines = part.split("\n")
          const eventLine = lines.find((l) => l.startsWith("event:"))
          const dataLine = lines.find((l) => l.startsWith("data:"))
          if (!eventLine || !dataLine) continue

          const eventType = eventLine.replace("event:", "").trim().toLowerCase()
          const data = JSON.parse(dataLine.replace("data:", "").trim())

          console.log("收到事件：", eventType, data) 

          switch (eventType) {
            case "tool_chosen":
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `使用工具：${data.used_tools.name}` },
              ])
              break

            case "tool_output":
              console.log("工具回應完整內容：", data)
              break

            case "llm_start":
              console.log("🟢 llm_start")
              // setMessages((prev) => [
              //   ...prev,
              //   { role: "assistant", content: `使用模型：${data.llm_config.model}` },
              // ])

              chunksRef.current = []   
              if (data.message_chunk) chunksRef.current.push( // 有就收
                data.message_chunk
              )
              
              break

            case "llm_delta":
              if (data.message_chunk) chunksRef.current.push(data.message_chunk)
              break

            case "llm_end":
              console.log("✅ 進到 llm_end")
              llmBufferRef.current = chunksRef.current.join("")

              // ✅ 呼叫假流式顯示完整文字，等打字完再生成延伸問題
              startStreamingDisplay(llmBufferRef.current, () => {
                console.log("🟢 llm_end，完整回覆：", llmBufferRef.current)
                const lastAnswer = llmBufferRef.current

                // ✅ 延伸問題：改用 /react/run（一次性 JSON 回傳）
                ;(async () => {
                  try {
                    const res = await fetch("http://localhost:8000/v1/react/run", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        messages: [
                          {
                            role: "system",
                            content: "你是一個助手。只允許輸出 JSON 陣列，不要其他文字。",
                          },
                          {
                            role: "user",
                            content:
                              "請根據以下回答生成三個延伸追問問題，輸出格式必須是 JSON 陣列。例如:[\"問題1\",\"問題2\",\"問題3\"]。\n\n回答內容: " +
                              lastAnswer,
                          },
                        ],
                        llm_config: { model: currentModel, temperature, max_tokens: 128 },
                        thread_id: "thread-suggestions",
                      }),
                    })
                    console.log("延伸問題 response 狀態：", res.status)
                    const json = await res.json()
                    console.log("延伸問題回傳完整 JSON：", json)
                    const text = json?.messages?.[0]?.content ?? ""
                    console.log("延伸問題原始文字：", text)
                    setFollowUpQuestions(parseSuggestions(text))
                  } catch (e) {
                    console.error("延伸問題失敗：", e)
                  }
                })()
              })

              setLoading(false)
              streamIndexRef.current = null
              break

            default:
              console.warn(" 未知事件：", eventType, data)
          }
        }
      }

      setLoading(false)
    } catch (err) {
      console.error("handleSend 錯誤：", err)
      setLoading(false)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "系統錯誤，請稍後再試" },
      ])
    }
  }


  // =====================================
  // 畫面渲染
  // =====================================
  return (
    <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6 min-h-screen overflow-hidden">
      {/* ===================== */}
      {/* 左：Live2D 區塊 */}
      {/* ===================== */}
      <section className="card p-6 md:col-span-1 h-[80vh] relative">
        {/* 角色選擇器（Label + 下拉式選單） */}
        <div className="absolute top-4 left-4 right-4 z-10 space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm text-neutral-400 whitespace-nowrap w-16">選擇角色</label>
            <select
              value={modelUrl}
              onChange={(e) => setModelUrl(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg bg-neutral-900/70 border border-neutral-800 text-neutral-100 focus:ring-2 focus:ring-sky-600/40"
            >
              {models.map(m => (
                <option key={m.name} value={m.url}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live2D 畫布（角色顯示區） */}
        <div className="absolute inset-0 rounded-xl border border-dashed border-sky-700/40 bg-neutral-900/40 z-0 ">
          {modelUrl && (
            <Live2DPanel
              key={modelUrl}   // 🔑 確保切換角色會重新掛載
              modelUrl={modelUrl}
              className="w-full h-full"
            />
          )}
        </div>
      </section>

      {/* ===================== */}
      {/* 右：對話區塊 */}
      {/* ===================== */}
      <section className="card p-6 md:col-span-2 h-[80vh] flex flex-col">
        {/* 標題 + 模型選擇器 + 設定按鈕 */}
        <header className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-neutral-100 font-bold text-lg">對話區</h2>
            <br></br>
            <p className="text-neutral-400 text-sm whitespace-nowrap">輸入問題 → AI agent回答 → 顯示對話</p>
          </div>

          {/* === 模型選擇 + 指定工具（上下排列、寬度一致） === */}
          <div className="flex flex-col items-end gap-3 w-full">

            {/* === 模型選擇 === */}
            <div className="flex items-center gap-3 w-full justify-end">
              <label className="text-sm text-neutral-400 w-20 text-right">選擇模型</label>

              <div className="flex items-center gap-2 w-[280px]">
                <select
                  value={currentModel}
                  onChange={(e) => setCurrentModel(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm w-full"
                >
                  {availableModels.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* ⚙️ 模型設定按鈕 */}
                <button
                  onClick={() => setIsConfigOpen(true)}
                  className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-300 flex-shrink-0"
                  title="模型設定"
                >
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* === 指定工具 === */}
            <div className="flex items-center gap-3  justify-end">
              <label className="text-sm text-neutral-400 w-20 text-right">指定工具</label>
              <select
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 text-sm w-[280px]"
              >
                <option value="">（自動選擇）</option>
                {Object.keys(toolIconMap).map((toolName) => (
                  <option key={toolName} value={toolName}>
                    {toolName}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
        </header>

        {/* ✅ 設定視窗 (Modal) */}
        {isConfigOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-neutral-900 p-6 rounded-xl shadow-xl w-full max-w-md border border-neutral-700">
              <h3 className="text-lg font-bold text-neutral-100 mb-4">模型設定</h3>

              {/* System Prompt */}
              <label className="block text-sm text-neutral-300 mb-1">System Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 mb-4 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 resize-none"
              />

              {/* Temperature */}
              <label className="block text-sm text-neutral-300 mb-1">
                Temperature <span className="text-neutral-400">(數值越高，回答越有創意)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full px-3 py-2 mb-4 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100"
              />

              {/* Max Tokens */}
              <label className="block text-sm text-neutral-300 mb-1">
                Max Tokens <span className="text-neutral-400">(限制回答長度)</span>
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full px-3 py-2 mb-6 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100"
              />

              {/* 按鈕區 */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setIsConfigOpen(false)}
                  className="px-4 py-2 rounded-lg bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                >
                  取消
                </button>
                <button
                onClick={applySettings}
                className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500"
              >
                儲存並套用
              </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ 初始建議問題（只有在還沒有訊息時顯示） */}
        {messages.length === 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="px-3 py-1 rounded-lg border border-sky-700/40 bg-sky-500/10 text-sky-300 hover:bg-sky-600/20 text-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* 訊息列表（顯示聊天紀錄） */}
        <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-y-auto p-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[70%] whitespace-pre-wrap break-words text-xs ${
                m.role === 'user'
                  ? 'ml-auto bg-sky-500/20 text-sky-100'
                  : 'mr-auto bg-neutral-800 text-neutral-200'
              }`}
            >
              {m.content}
            </div>
          ))}

          {/* ✅ 延伸問題（顯示在 LLM 回答後） */}
          {followUpQuestions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {followUpQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 text-xs"
                >
                  👉 {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 輸入列（輸入框 + 送出按鈕） */}
        <div className="mt-4 flex gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            // 監聽組字開始/結束（CJK 輸入法）
            onCompositionStart={() => (composingRef.current = true)}
            onCompositionEnd={() => (composingRef.current = false)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              if (e.shiftKey) return // Shift+Enter 換行

              const isComposing =
                (e as any).nativeEvent?.isComposing ||
                composingRef.current ||
                (e as any).keyCode === 229

              if (isComposing) return

              e.preventDefault()
              handleSend()
            }}
            placeholder="輸入問題..."
            rows={2}
            className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 resize-none no-underline"
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            className="w-28 h-11 rounded-lg border border-sky-700/40 bg-sky-500/10 text-sky-200 hover:bg-sky-600/20 disabled:opacity-50"
          >
            {loading ? '處理中...' : '送出'}
          </button>
        </div>
      </section>

      {/* ===================== */}
      {/* 底：工具區塊 */}
      {/* ===================== */}
      <section className="card p-6 md:col-span-3 h-[46vh] flex flex-col overflow-hidden">
        {/* 工具區標題 */}
        <header className="mb-4">
          <h2 className="text-neutral-100 font-bold text-lg">
            檢索工具（{mcpTools.length}）
          </h2>
          <p className="text-neutral-400 text-sm">點擊工具可查看說明</p>
        </header>

        {/* 工具清單按鈕 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {mcpTools.map((t) => {
            const Icon = toolIconMap[t.name] ?? Search
            const active = selected?.name === t.name
            return (
              <button
                key={t.name}
                onClick={() => setSelected(t)}
                className={`chip transition ${
                  active
                    ? 'ring-1 ring-sky-600/50 bg-sky-500/10 text-sky-300'
                    : 'hover:bg-neutral-800/60'
                }`}
                title={t.name}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{t.name}</span>
              </button>
            )
          })}
        </div>

        {/* 工具詳細資訊 */}
        <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 overflow-y-auto">
          {!selected ? (
            <p className="text-neutral-400">請從上方點選一個工具，這裡會顯示描述。</p>
          ) : (
            <div className="space-y-4">
              {/* 工具標題（ICON + 名稱） */}
              <div className="flex items-center gap-2">
                <IconByName name={selected.name} />
                <h3 className="text-lg font-bold text-neutral-100">{selected.name}</h3>
              </div>

              {/* 工具描述（中文 or 原始描述） */}
              <p className="text-neutral-300">
                {selected.description}
              </p>

              {/* 工具參數 */}
              <div>
                <h4 className="text-neutral-400 text-sm mb-2">參數</h4>
                {selected.args_schema.length === 0 ? (
                  <div className="chip text-neutral-400">無參數</div>
                ) : (
                  <ul className="space-y-2">
                    {selected.args_schema.map((a) => (
                      <li
                        key={a.arg}
                        className="p-3 rounded-lg border border-neutral-800 bg-neutral-950/40"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sky-300">{a.arg}</span>
                          <span className="px-2 py-0.5 text-xs rounded-full border border-neutral-800">
                            類型：{a.type}
                          </span>
                          {a.required && (
                            <span className="px-2 py-0.5 text-xs rounded-full border border-rose-500/40 text-rose-300">
                              必填
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-neutral-400 mt-1">{a.description}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}



