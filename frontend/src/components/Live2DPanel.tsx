// src/components/Live2DPanel.tsx
import React, { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'

type Props = {
  /** 絕對路徑，例如：/Hiyori/Hiyori.model3.json */
  modelUrl: string
  className?: string
}

/**
 * 等價於你 Vue 的 <Live2D />：
 * - 先把 PIXI 掛到 window（pixi-live2d-display@0.4 需要）
 * - 明確指定 <canvas> 給 Application
 * - 關閉 autoUpdate，改用 app.ticker 手動驅動（避免 registerTicker 版本摩擦）
 * - ResizeObserver 跟隨容器尺寸調整
 */
export default function Live2DPanel({ modelUrl, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas || !modelUrl) return

    let app: PIXI.Application | null = null
    let model: any = null
    let ro: ResizeObserver | null = null
    let tickFn: ((dt: number) => void) | null = null
    let destroyed = false

    ;(async () => {
      try {
        // 1) window.PIXI 必須先存在，外掛才能正確讀到 PIXI
        ;(window as any).PIXI = PIXI

        // 2) 動態載入 cubism4（必須在掛完 window.PIXI 之後）
        const { Live2DModel } = await import('pixi-live2d-display/cubism4')

        // 3) 建 Application，用你提供的 canvas
        app = new PIXI.Application({
          view: canvas,
          autoStart: true,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          width: container.clientWidth || 1,
          height: container.clientHeight || 1,
        })

        // 4) 載模型：關掉 autoUpdate，改由 app.ticker 驅動
        const abs = new URL(modelUrl, window.location.origin).pathname
        model = await Live2DModel.from(abs, { autoUpdate: false })
        if (destroyed) return
        app.stage.addChild(model)

        // 5) 定位與縮放（底部置中）
        const fit = () => {
          const w = container.clientWidth || 1
          const h = container.clientHeight || 1
          app!.renderer.resize(w, h)

          const hasAnchor = (model as any).anchor?.set
          if (hasAnchor) (model as any).anchor.set(0.5, 1)
          else (model as any).pivot?.set?.(model.width / 2, model.height)

          const mw = Math.max(1, model.width)
          const mh = Math.max(1, model.height)
          const scale = Math.min((w * 0.9) / mw, (h * 0.95) / mh)
          model.scale.set(scale > 0 ? scale : 0.5)
          model.position.set(w / 2, h * 0.98)
        }
        fit()

        // 6) 由 PIXI 的 ticker 手動更新 Live2D（避開 registerTicker 差異）
        tickFn = (dt: number) => model.update?.(dt)
        app.ticker.add(tickFn)

        // 7) 跟著容器尺寸跑
        ro = new ResizeObserver(() => fit())
        ro.observe(container)
        // 初次再補一刀，避免首次 clientWidth/Height 為 0
        setTimeout(fit, 0)
      } catch (e) {
        console.error('[Live2DPanel] mount failed:', e)
      }
    })()

    return () => {
      destroyed = true
      try { ro?.disconnect() } catch {}
      try { tickFn && app?.ticker?.remove?.(tickFn) } catch {}
      try { app?.destroy?.(true, { children: true }) } catch {}
    }
  }, [modelUrl])

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  )
}
