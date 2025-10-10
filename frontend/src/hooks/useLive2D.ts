// src/hooks/useLive2D.ts
import 'pixi-live2d-display/cubism4'
import { useEffect } from 'react'
import { Application, Graphics } from 'pixi.js'
import { Live2DModel } from 'pixi-live2d-display/cubism4'

export function useLive2D(container: HTMLDivElement | null, modelUrl: string) {
  useEffect(() => {
    if (!container || !modelUrl) return
    let destroyed = false
    let app: any = null
    let model: any = null
    let removeResize: any = null
    let tickFn: ((dt: number) => void) | null = null

    ;(async () => {
      try {
        const abs = new URL(modelUrl, window.location.origin).pathname

        const res = await fetch(abs, { cache: 'no-store' })
        if (!res.ok) throw new Error(`Model not found: ${abs} (${res.status})`)
        const ct = (res.headers.get('content-type') || '').toLowerCase()
        if (!ct.includes('json')) {
          const txt = (await res.text()).slice(0, 120)
          throw new Error(`Expected JSON but got "${ct}". Path: ${abs}. Snippet: ${txt}`)
        }

        // Pixi v7
        const maybeApp: any = new (Application as any)()
        if (typeof maybeApp.init === 'function') {
          await maybeApp.init({ backgroundAlpha: 0, resizeTo: container })
          container.appendChild(maybeApp.canvas)
          app = maybeApp
        } else {
          app = new (Application as any)({ backgroundAlpha: 0, resizeTo: container })
          container.appendChild(app.view || app.canvas)
        }

        // （除錯方塊，可刪）
        const dbg = new Graphics()
        dbg.beginFill(0xffffff, 0.3); dbg.drawRect(8, 8, 24, 24); dbg.endFill()
        app.stage.addChild(dbg)

        console.log('[Live2D] loading', abs)
        // ✅ 關掉 autoUpdate，改用手動 ticker
        model = await Live2DModel.from(abs, { autoUpdate: false })
        if (destroyed) return
        console.log('[Live2D] loaded:', model)

        app.stage.addChild(model)

        // 版面與錨點
        const hasAnchor = (model as any).anchor?.set
        if (hasAnchor) (model as any).anchor.set(0.5, 1)
        else (model as any).pivot?.set?.(model.width / 2, model.height)
        app.stage.sortableChildren = true
        ;(model as any).zIndex = 1

        const fit = () => {
          const w = app.renderer.width  || container.clientWidth  || 1
          const h = app.renderer.height || container.clientHeight || 1
          if (app.renderer.resize) app.renderer.resize(w, h)
          const mw = Math.max(1, model.width)
          const mh = Math.max(1, model.height)
          const scale = Math.min((w * 0.9) / mw, (h * 0.95) / mh)
          model.scale.set(scale > 0 ? scale : 0.5)
          model.position.set(w / 2, h * 0.98)
        }
        fit()
        const onResize = () => requestAnimationFrame(fit)
        window.addEventListener('resize', onResize)
        removeResize = () => window.removeEventListener('resize', onResize)
        setTimeout(fit, 0)

        // ✅ 用 Pixi 的 ticker 手動驅動 Live2D
        tickFn = (dt: number) => {
          // dt 以 60FPS 為基準（~1.0）
          model.update?.(dt)
        }
        app.ticker.add(tickFn)

      } catch (err) {
        console.error('[Live2D] mount failed:', err)
      }
    })()

    return () => {
      destroyed = true
      try { removeResize?.() } catch {}
      try { tickFn && (app?.ticker?.remove?.(tickFn)) } catch {}
      try { app?.destroy?.(true, { children: true }) } catch {}
      try { container.innerHTML = '' } catch {}
    }
  }, [container, modelUrl])
}
