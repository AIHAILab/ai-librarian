// src/components/MessageList.tsx

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  messages: Message[];
  followUpQuestions: string[];
  onFollowUpClick: (q: string) => void;
};

export default function MessageList({
  messages,
  followUpQuestions,
  onFollowUpClick,
}: Props) {
  return (
    <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-y-auto p-4 space-y-3">
      {/* 訊息泡泡列表 */}
      {messages.map((m, i) => (
        <div
          key={i}
          className={`p-3 rounded-lg max-w-[70%] whitespace-pre-wrap break-words text-xs ${
            m.role === "user"
              ? "ml-auto bg-sky-500/20 text-sky-100"
              : "mr-auto bg-neutral-800 text-neutral-200"
          }`}
        >
          {m.content}
        </div>
      ))}

      {/* 延伸問題（如果有） */}
      {followUpQuestions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {followUpQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => onFollowUpClick(q)}
              className="px-3 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-100 text-xs"
            >
              👉 {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
