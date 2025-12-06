// src/components/Live2DPanel.tsx

import { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

// Live2DPanel 輸入參數
type Props = {
  modelUrl: string; // Live2D 模型 JSON 路徑
  className?: string;
  emotionToken?: string | null; // 用於觸發對應的表情動作
};

// Live2D 顯示主元件
export default function Live2DPanel({
  modelUrl,
  className,
  emotionToken,
}: Props) {
  // 外層容器參考（用於監聽尺寸）
  const containerRef = useRef<HTMLDivElement>(null);
  // canvas 參考（PIXI 渲染目標）
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 保存目前的 Live2D 模型
  const currentModelRef = useRef<any>(null);

  // -------------------------------------------------------
  // 初始化 PIXI + Live2D（modelUrl 改變時重新載入）
  // -------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !modelUrl) return;

    let app: PIXI.Application | null = null;
    let model: any = null;
    let ro: ResizeObserver | null = null;
    let tickFn: ((dt: number) => void) | null = null;
    let destroyed = false;

    const mount = async () => {
      try {
        // 供某些版本依賴 window.PIXI
        (window as any).PIXI = PIXI;

        // 動態載入 Live2D 模組
        const { Live2DModel } = await import("pixi-live2d-display/cubism4");

        // 建立 PIXI Application
        app = new PIXI.Application({
          view: canvas,
          autoStart: false,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          width: container.clientWidth || 1,
          height: container.clientHeight || 1,
        });

        // 關閉互動管理器（避免不必要事件）
        try {
          const im = (app.renderer as any)?.plugins?.interaction;
          im?.destroy?.();
        } catch (_) {}

        app.stage.interactive = false;
        if ("eventMode" in app.stage) (app.stage as any).eventMode = "none";

        // 載入模型
        const abs = new URL(modelUrl, window.location.origin).pathname;
        model = await Live2DModel.from(abs, { autoUpdate: false });
        currentModelRef.current = model;

        if (destroyed) return;

        // 將模型加入舞台
        app.stage.addChild(model);

        // 尺寸調整函式
        const fit = () => {
          const w = container.clientWidth || 1;
          const h = container.clientHeight || 1;
          app!.renderer.resize(w, h);

          const hasAnchor = (model as any)?.anchor?.set;
          if (hasAnchor) model.anchor.set(0.5, 1);
          else model.pivot?.set?.(model.width / 2, model.height);

          const mw = Math.max(1, model.width);
          const mh = Math.max(1, model.height);
          const scale = Math.min((w * 0.9) / mw, (h * 0.95) / mh);
          model.scale.set(scale > 0 ? scale : 0.5);
          model.position.set(w / 2, h * 0.98);
        };

        tickFn = (dt: number) => model.update?.(dt);
        app.ticker.add(tickFn);

        ro = new ResizeObserver(() => fit());
        ro.observe(container);

        // 連續補正尺寸（避免初始化時尺寸未確定）
        const repeatFit = () => {
          let count = 0;
          const max = 10;
          const loop = () => {
            fit();
            count++;
            if (count < max) requestAnimationFrame(loop);
          };
          loop();
        };
        repeatFit();

        app.start();
      } catch (_) {}
    };

    mount();

    // 清除資源
    return () => {
      destroyed = true;

      try {
        ro?.disconnect();
      } catch (_) {}

      try {
        tickFn && app?.ticker?.remove?.(tickFn);
      } catch (_) {}

      try {
        app?.stage?.removeChildren();
        model?.destroy?.();
      } catch (_) {}

      try {
        const im = (app?.renderer as any)?.plugins?.interaction;
        im?.destroy?.();
      } catch (_) {}

      try {
        app?.destroy?.(true, { children: true });
      } catch (_) {}
    };
  }, [modelUrl]);

  // -------------------------------------------------------
  // emotionToken：觸發對應的動作（例如 happy / sad）
  // -------------------------------------------------------
  useEffect(() => {
    const model = currentModelRef.current;
    if (!model || !emotionToken) return;

    const emotionMap: Record<string, { group: string; index: number }> = {
      happy: { group: "TapBody", index: 6 },
      sad: { group: "TapBody", index: 3 },
      angry: { group: "TapBody", index: 1 },
      anger: { group: "TapBody", index: 2 },
      surprised: { group: "TapBody", index: 4 },
      neutral: { group: "TapBody", index: 5 },
    };

    const mapping = emotionMap[emotionToken];
    if (!mapping) return;

    try {
      model.motion(mapping.group, mapping.index);
    } catch (_) {}
  }, [emotionToken]);

  // -------------------------------------------------------
  // 渲染容器 + canvas（PIXI 自行控制內容）
  // -------------------------------------------------------
  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: 100,
        minHeight: 100,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
