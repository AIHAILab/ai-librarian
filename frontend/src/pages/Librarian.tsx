// ============================================================
//  📄 Librarian.tsx — AI 館員主畫面
// ============================================================

import type { ElementType } from "react";
import { useState, useEffect } from "react";

// === 工具資料與子元件 ===
import { mcpTools, type Tool } from "../data/mcpTools";
import {
  Clock,
  FlaskConical,
  Search,
  SquarePlay,
  BookOpen,
  Globe,
  Bookmark,
  CloudSun,
  Settings,
} from "lucide-react";

import Live2DArea from "../components/Live2DArea";
import ToolsSection from "../components/ToolsSection";
import MessageList from "../components/MessageList";
import ChatInput from "../components/ChatInput";
import ConfigModal from "../components/ConfigModal";
import Popover from "../components/Popover";

// LLM streaming hook（負責聊天／工具呼叫／情緒回傳）
import useLLMStream from "../hooks/useLLMStream";

// ============================================================
//  🧩 工具名稱 → ICON 對照表
// ============================================================

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
};

// ============================================================
//  🧩 可選擇的模型列表
// ============================================================

const availableModels = [
  "openai:gpt-4o-mini",
  "openai:gpt-4o",
  "openai:o4-mini",
  "openai:gpt-4.1",
  "openai:gpt-4.1-mini",
  "openai:gpt-4.1-nano",
  "openai:o3-mini",
  "openai:o1",
];

const defaultModel = "openai:gpt-4o-mini";

// ============================================================
//  🏛️ 主元件：Librarian
// ============================================================

export default function Librarian() {
  // ============================================================
  //  1️⃣ Live2D 模型狀態（角色 URL / 情緒）
  // ============================================================
  const [modelUrl, setModelUrl] = useState<string>("");
  const [emotionToken, setEmotionToken] = useState<string | null>(null);

  // ============================================================
  //  2️⃣ MCP 工具 UI 狀態（哪個工具被選中）
  // ============================================================
  const [selected, setSelected] = useState<Tool | null>(null);

  // ============================================================
  //  3️⃣ 模型相關設定（system prompt / 溫度等）
  // ============================================================
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [currentModel, setCurrentModel] = useState(defaultModel);

  // ============================================================
  //  4️⃣ 儲存設定到 localStorage
  // ============================================================
  const applySettings = () => {
    const t = Math.min(1, Math.max(0, Number(temperature) || 0));
    const m = Math.max(1, Math.floor(Number(maxTokens) || 1));

    setTemperature(t);
    setMaxTokens(m);

    localStorage.setItem(
      "aiConfig",
      JSON.stringify({
        systemPrompt,
        temperature: t,
        maxTokens: m,
        model: currentModel,
      })
    );

    alert("設定已保存並套用");
  };

  // ============================================================
  //  5️⃣ 初始化：讀取 localStorage 內的設定
  // ============================================================
  useEffect(() => {
    try {
      const raw = localStorage.getItem("aiConfig");
      if (!raw) return;
      const saved = JSON.parse(raw);

      if (typeof saved.systemPrompt === "string")
        setSystemPrompt(saved.systemPrompt);
      if (typeof saved.temperature === "number")
        setTemperature(saved.temperature);
      if (typeof saved.maxTokens === "number") setMaxTokens(saved.maxTokens);
      if (typeof saved.model === "string") setCurrentModel(saved.model);
    } catch (_) {
      // 忽略錯誤，不讓 UI 中斷
    }
  }, []);

  // ============================================================
  //  6️⃣ 使用自製 LLM streaming Hook
  // ============================================================
  const { messages, followUpQuestions, input, setInput, loading, handleSend } =
    useLLMStream({
      systemPrompt,
      temperature,
      maxTokens,
      currentModel,
      onEmotion: (emo) => setEmotionToken(emo), // Model 回傳角色情緒
    });

  // ============================================================
  //  7️⃣ 初次無訊息顯示建議問題
  // ============================================================
  const suggestedQuestions = [
    "要怎麼控制血糖比較好？有推薦的飲食書嗎？",
    "請幫我找一些關於預防失智或養腦運動的資料",
    "請幫我查詢今天台北的天氣及日期",
    "我今天心情不好可以給我幾首舒壓音樂嗎？",
  ];

  // ============================================================
  //  🖥️ 畫面渲染區
  // ============================================================
  return (
    <div className="w-full max-w-screen-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6 min-h-screen overflow-hidden">
      {/* 左側：Live2D 角色區 */}
      <Live2DArea
        modelUrl={modelUrl}
        setModelUrl={setModelUrl}
        emotionToken={emotionToken}
      />

      {/* 右側：聊天主視窗 */}
      <section className="card p-6 md:col-span-2 h-[80vh] flex flex-col">
        {/* 標題列 + 設定按鈕 */}
        <header className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-neutral-100 font-bold text-lg">對話區</h2>
            <p className="text-neutral-400 text-sm whitespace-nowrap mt-1">
              輸入問題 → AI Librarian 回答 → 顯示對話
            </p>
          </div>

          {/* 設定提示框（Popover） */}
          <Popover
            content={
              <div>
                <p className="mb-1 font-semibold text-neutral-100">模型設定</p>
                <p>可以調整模型、溫度、max tokens、system prompt。</p>
              </div>
            }
          >
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-300"
            >
              <Settings className="w-5 h-5" />
            </button>
          </Popover>
        </header>

        {/* 設定 Modal */}
        {isConfigOpen && (
          <ConfigModal
            systemPrompt={systemPrompt}
            setSystemPrompt={setSystemPrompt}
            temperature={temperature}
            setTemperature={setTemperature}
            maxTokens={maxTokens}
            setMaxTokens={setMaxTokens}
            currentModel={currentModel}
            setCurrentModel={setCurrentModel}
            availableModels={availableModels}
            onClose={() => setIsConfigOpen(false)}
            onApply={() => {
              applySettings();
              setIsConfigOpen(false);
            }}
          />
        )}

        {/* 初次建議按鈕 */}
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

        {/* 訊息列表 */}
        <MessageList
          messages={messages}
          followUpQuestions={followUpQuestions}
          onFollowUpClick={(q) => handleSend(q)}
        />

        {/* 輸入欄位 */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSend={(msg) => handleSend(msg)}
          loading={loading}
        />
      </section>

      {/* 下方工具列表區域 */}
      <ToolsSection
        mcpTools={mcpTools}
        selected={selected}
        setSelected={setSelected}
        toolIconMap={toolIconMap}
      />
    </div>
  );
}
