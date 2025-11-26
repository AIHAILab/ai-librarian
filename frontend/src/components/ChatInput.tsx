// src/components/ChatInput.tsx
import { useRef } from "react";

type Props = {
  input: string; // 目前輸入的文字
  setInput: (v: string) => void; // 更新輸入內容
  onSend: (customInput?: string) => void; // 送出訊息回呼
  loading: boolean; // 是否為處理中（顯示 loading）
};

export default function ChatInput({ input, setInput, onSend, loading }: Props) {
  // 用來偵測中文輸入法是否正在組字（避免誤送出）
  const composingRef = useRef(false);

  return (
    <div className="mt-4 flex gap-3">
      {/* 輸入區：支援 Shift+Enter 換行，避免中文輸入 Enter 誤觸 */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onCompositionStart={() => (composingRef.current = true)} // 開始組字
        onCompositionEnd={() => (composingRef.current = false)} // 組字結束
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          if (e.shiftKey) return; // Shift+Enter 換行

          // 中文輸入法組字時不送出
          const isComposing =
            (e as any).nativeEvent?.isComposing ||
            composingRef.current ||
            (e as any).keyCode === 229;

          if (isComposing) return;

          e.preventDefault(); // 阻止預設換行
          onSend(); // 送出訊息
        }}
        placeholder="輸入問題..."
        rows={2}
        className="flex-1 px-3 py-2 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 resize-none no-underline"
      />

      {/* 送出按鈕：處理中時 disabled 並顯示 Spinner */}
      <button
        onClick={() => onSend()}
        disabled={loading}
        className="
          w-28 h-11 rounded-lg
          border border-sky-700/40 
          bg-sky-500/10 text-sky-200 
          hover:bg-sky-600/20
          disabled:opacity-50
          flex items-center justify-center
        "
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <span>處理中</span>
            <div className="w-5 h-5 border-2 border-sky-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          "送出"
        )}
      </button>
    </div>
  );
}
