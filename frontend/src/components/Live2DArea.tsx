// src/components/Live2DArea.tsx
import { useEffect, useState } from "react";
import Live2DPanel from "./Live2DPanel";

type Live2DInfo = {
  name: string;
  url: string;
  tags?: string[];
};

type Props = {
  modelUrl: string;
  setModelUrl: (url: string) => void;
  emotionToken: string | null; // ⚠ 改成 string | null 比較彈性
  //setEmotionToken: (emo: string | null) => void;
};

export default function Live2DArea({
  modelUrl,
  setModelUrl,
  emotionToken,
}: Props) {
  const [models, setModels] = useState<Live2DInfo[]>([]);

  // 讀取模型清單
  useEffect(() => {
    const manifestPath = "/index.json";

    fetch(manifestPath)
      .then((res) => {
        if (!res.ok) throw new Error(`Manifest ${manifestPath} ${res.status}`);
        return res.json();
      })
      .then((list: Live2DInfo[]) => {
        const normalized = list.map((m) => {
          const name = m.name.trim();
          const good =
            m.url && m.url.startsWith("/") && m.url.endsWith(".model3.json")
              ? m.url
              : `/${name}/${name}.model3.json`;
          return { ...m, url: good };
        });

        setModels(normalized);

        // 預設載入第一個角色
        const first = normalized.find((m) => m.url.endsWith(".model3.json"));
        setModelUrl(first?.url ?? normalized[0]?.url ?? "");
      })
      .catch((err) => {
        console.error("Load Live2D manifest failed:", err);
        setModels([]);
      });
  }, [setModelUrl]);

  return (
    <section className="card p-6 md:col-span-1 h-[80vh] relative">
      {/* === Live2D 顯示區 === */}
      <div className="absolute inset-0 rounded-xl border border-dashed border-sky-700/40 bg-neutral-900/40 z-0">
        {modelUrl && (
          <Live2DPanel
            key={modelUrl}
            modelUrl={modelUrl}
            className="w-full h-full"
            emotionToken={emotionToken ?? undefined} // SSE 會直接控制
          />
        )}
      </div>

      {/* ❌ Emotion 按鈕已移除 */}
    </section>
  );
}
