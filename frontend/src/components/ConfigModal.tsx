// src/components/ConfigModal.tsx

type ConfigModalProps = {
  systemPrompt: string;
  setSystemPrompt: (value: string) => void;
  temperature: number;
  setTemperature: (value: number) => void;
  maxTokens: number;
  setMaxTokens: (value: number) => void;
  currentModel: string;
  setCurrentModel: (value: string) => void;
  availableModels: string[];

  onClose: () => void;
  onApply: () => void;
};

export default function ConfigModal({
  systemPrompt,
  setSystemPrompt,
  temperature,
  setTemperature,
  maxTokens,
  setMaxTokens,

  // 新增 props
  currentModel,
  setCurrentModel,
  availableModels,

  onClose,
  onApply,
}: ConfigModalProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-neutral-900 p-6 rounded-xl shadow-xl w-full max-w-md border border-neutral-700">
        <h3 className="text-lg font-bold text-neutral-100 mb-4">模型設定</h3>

        {/* ============================= */}
        {/*       模型選擇區塊          */}
        {/* ============================= */}
        <label className="block text-sm text-neutral-300 mb-1">選擇模型</label>
        <select
          value={currentModel}
          onChange={(e) => setCurrentModel(e.target.value)}
          className="w-full px-3 py-2 mb-4 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100"
        >
          {availableModels.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* System Prompt */}
        <label className="block text-sm text-neutral-300 mb-1">
          System Prompt
        </label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 mb-4 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 resize-none"
        />

        {/* Temperature */}
        <label className="block text-sm text-neutral-300 mb-1">
          Temperature{" "}
          <span className="text-neutral-400">(數值越高，回答越有創意)</span>
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
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
          >
            取消
          </button>
          <button
            onClick={onApply}
            className="px-4 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-500"
          >
            儲存並套用
          </button>
        </div>
      </div>
    </div>
  );
}
