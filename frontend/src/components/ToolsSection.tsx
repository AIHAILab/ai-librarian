// src/components/ToolsSection.tsx

import type { ElementType } from "react";
import { Search } from "lucide-react";

type Tool = {
  name: string;
  description: string;
  args_schema?: {
    arg: string;
    type: string;
    required: boolean;
    description: string;
  }[];
};

type Props = {
  mcpTools: Tool[];
  selected: Tool | null;
  setSelected: (t: Tool | null) => void;
  toolIconMap: Record<string, ElementType>;
};

export default function ToolsSection({
  mcpTools,
  selected,
  setSelected,
  toolIconMap,
}: Props) {
  const IconByName = ({ name }: { name: string }) => {
    const Icon = toolIconMap[name] ?? Search;
    return <Icon className="w-4 h-4 text-sky-300" />;
  };

  return (
    <section className="card p-6 md:col-span-3 h-[46vh] flex flex-col overflow-hidden">
      {/* 標題 */}
      <header className="mb-4">
        <h2 className="text-neutral-100 font-bold text-lg">
          AI Librarian 目前有使用的檢索工具（{mcpTools.length}）
        </h2>
        <p className="text-neutral-400 text-sm">點擊工具可查看說明</p>
      </header>

      {/* 工具按鈕清單 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {mcpTools.map((t) => {
          const Icon = toolIconMap[t.name] ?? Search;
          const active = selected?.name === t.name;

          return (
            <button
              key={t.name}
              onClick={() => setSelected(t)}
              className={`chip transition ${
                active
                  ? "ring-1 ring-sky-600/50 bg-sky-500/10 text-sky-300"
                  : "hover:bg-neutral-800/60"
              }`}
              title={t.name}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* 工具詳細資訊 */}
      <div className="flex-1 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 overflow-y-auto">
        {!selected ? (
          <p className="text-neutral-400">
            請從上方點選一個工具，這裡會顯示描述。
          </p>
        ) : (
          <div className="space-y-4">
            {/* 標題 */}
            <div className="flex items-center gap-2">
              <IconByName name={selected.name} />
              <h3 className="text-lg font-bold text-neutral-100">
                {selected.name}
              </h3>
            </div>

            {/* 描述 */}
            <p className="text-neutral-300">{selected.description}</p>
          </div>
        )}
      </div>
    </section>
  );
}
