import { Link, useLocation } from "react-router-dom";
import { BookOpen, Bot } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../lib/api";
import Popover from "../components/Popover";

export default function Navbar() {
  const { pathname } = useLocation();
  const [healthStatus, setHealthStatus] = useState<"ok" | "error" | "idle">(
    "idle"
  );

  // 系統狀態檢查
  useEffect(() => {
    const checkSystem = async () => {
      try {
        await api.get("/");
        setHealthStatus("ok");
      } catch {
        setHealthStatus("error");
      }
    };
    checkSystem();
    const interval = setInterval(checkSystem, 30000);
    return () => clearInterval(interval);
  }, []);

  // 狀態文字
  const statusText =
    healthStatus === "ok"
      ? "系統正常"
      : healthStatus === "error"
      ? "系統異常"
      : "檢查中...";

  // Popover 說明內容
  const statusDescription = {
    ok: {
      title: "系統正常",
      text: "伺服器運作正常，你可以正常使用所有功能。",
    },
    error: {
      title: "系統異常",
      text: "API 或伺服器連線異常，可能無法使用部分功能。",
    },
    idle: {
      title: "檢查中",
      text: "系統正在進行健康檢查，請稍待片刻。",
    },
  } as const;

  const active = pathname === "/librarian";

  return (
    <nav className="sticky top-0 z-50 bg-neutral-950/70 backdrop-blur-lg border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-5 h-20 flex items-center justify-between">
        {/* 左 LOGO */}
        <Link
          to="/"
          className="flex items-center gap-3 hover:opacity-80 transition"
        >
          <BookOpen className="w-7 h-7 text-sky-400" />
          <div>
            <div className="text-neutral-100 font-bold">AI Librarian</div>
            <div className="text-xs text-neutral-400">智慧搜尋幫手</div>
          </div>
        </Link>

        {/* 右側：Bot + 系統狀態（含 Popover） */}
        {/* <div className="hidden md:flex">
          <Popover
            content={
              <div>
                <p className="font-semibold text-neutral-100 mb-1">
                  {statusDescription[healthStatus].title}
                </p>
                <p className="text-neutral-300 text-sm leading-relaxed">
                  {statusDescription[healthStatus].text}
                </p>
              </div>
            }
          >
            <Link
              to="/librarian"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm transition
                ${
                  active
                    ? "bg-sky-500/10 border-sky-700/40"
                    : "border-neutral-700/40 hover:bg-neutral-800/60"
                }
              `}
            >
              
              <Bot className="w-6 h-6 text-sky-300" />

              
              <span
                className={
                  healthStatus === "ok"
                    ? "text-green-400"
                    : healthStatus === "error"
                    ? "text-red-400"
                    : "text-neutral-300"
                }
              >
                {statusText}
              </span>
            </Link>
          </Popover>
        </div> */}
      </div>
    </nav>
  );
}
