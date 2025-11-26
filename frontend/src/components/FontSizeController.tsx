// src/components/FontSizeController.tsx
import { useEffect, useState } from "react";

export default function FontSizeController() {
  const [fontSize, setFontSize] = useState(16);

  // 初始化讀取 localStorage
  useEffect(() => {
    const saved = localStorage.getItem("fontSize");
    if (saved) setFontSize(Number(saved));
  }, []);

  // 更新 CSS root + localStorage
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${fontSize}px`
    );
    localStorage.setItem("fontSize", String(fontSize));
  }, [fontSize]);

  const increase = () => setFontSize((prev) => Math.min(prev + 2, 28));
  const decrease = () => setFontSize((prev) => Math.max(prev - 2, 12));

  return (
    <div className="fixed bottom-6 left-6 z-[999] flex flex-col gap-2 bg-black/40 backdrop-blur-md p-3 rounded-lg shadow-lg">
      <button
        onClick={increase}
        className="px-3 py-1 text-white rounded bg-blue-600 hover:bg-blue-500 font-semibold"
      >
        A+
      </button>
      <button
        onClick={decrease}
        className="px-3 py-1 text-white rounded bg-blue-600 hover:bg-blue-500 font-semibold"
      >
        A-
      </button>
    </div>
  );
}
