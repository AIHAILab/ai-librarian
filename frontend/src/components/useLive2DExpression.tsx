import { Live2DModel } from 'pixi-live2d-display/cubism4'

type Live2DModelExtended = Live2DModel & {
  internalModel?: {
    coreModel?: {
      setParameterValueById: (id: string, value: number) => void
      getParameterValueById?: (id: string) => number
    }
    update?: () => void
  }
  motionManager?: {
    startRandomMotion?: (group: string, priority?: number) => Promise<void>
  }
  expressionManager?: {
    setExpression?: (exp: any) => void
  }
}

/**
 * 🎭 改善版 applyExpression
 * 1. 每次切換都先 resetFace，避免參數累加讓角色消失或出錯
 * 2. 參數設值直接用 p.Value，不再 prev+p.Value
 * 3. try-catch 有完整 fallback
 * 4. 強制還原 scale 與 position，避免被表情/參數推到畫面外或放大縮小異常
 */
export async function applyExpression(model: Live2DModelExtended, emotionToken?: string) {
  if (!model || !emotionToken) return

  // 表情 - 檔名對應表
  const expressionMap: Record<string, string> = {
    neutral: "F04.exp3.json",
    happy: "F01.exp3.json",
    angry: "F03.exp3.json",
    sad: "F08.exp3.json",
    surprised: "F02.exp3.json",
    shy: "F07.exp3.json",
    relaxed: "F05.exp3.json",
  }

  // 動作 - 動作組對應表
  const motionGroupMap: Record<string, string> = {
    neutral: "Idle",
    happy: "TapBody",
    angry: "TapBody",
    sad: "TapBody",
    surprised: "TapBody",
    shy: "TapBody",
    relaxed: "Idle",
  }

  const expFile = expressionMap[emotionToken]
  const motionGroup = motionGroupMap[emotionToken]
  const expPath = `${window.location.origin}/Haru/expressions/${expFile}`

  try {
    const core = model.internalModel?.coreModel
    if (core) resetFace(core)

    const response = await fetch(expPath)
    if (!response.ok) throw new Error(`❌ 表情檔不存在: ${expPath}`)
    const expData = await response.json()

    if (core && expData.Parameters) {
      expData.Parameters.forEach((p: any) => {
        try {
          core.setParameterValueById(p.Id, p.Value)
        } catch (err) {
          console.warn("⚠️ 設定參數失敗:", p.Id, err)
        }
      })
      model.internalModel?.update?.()
      console.log("🎨 成功套用表情（強制重設）", expFile)
    }

    // 強制還原 scale 與 position
    if (model && typeof model.scale?.set === 'function' && typeof model.position?.set === 'function') {
      model.scale.set(0.32, 0.32)
      model.position.set(153, 595)
    }

  } catch (err) {
    console.warn("⚠️ exp3.json 套用失敗，改用 fallback：", err)
    applyForcedExpression(model, emotionToken)
  }

  try {
    if (motionGroup) {
      await new Promise(resolve => setTimeout(resolve, 300))
      await model.motionManager?.startRandomMotion?.(motionGroup, 1)
    }
  } catch (err) {
    console.warn("⚠️ 無法播放 motion：", err)
  }
}

function applyForcedExpression(model: Live2DModelExtended, emotionToken: string) {
  const core = model.internalModel?.coreModel
  if (!core) return
  resetFace(core)
  const safeSet = (id: string, value: number, min = 0, max = 1) =>
    core.setParameterValueById(id, Math.max(min, Math.min(max, value)))
  
  switch (emotionToken) {
    case "happy":
      safeSet("ParamMouthForm", 1.0)
      safeSet("ParamMouthOpenY", 0.8)
      safeSet("ParamEyeLOpen", 1.0)
      safeSet("ParamEyeROpen", 1.0)
      core.setParameterValueById("ParamAngleZ", 10.0)
      break
    case "angry":
      safeSet("ParamBrowLY", 0.2)
      safeSet("ParamBrowRY", 0.2)
      safeSet("ParamMouthForm", 0.1)
      safeSet("ParamMouthOpenY", 0.2)
      core.setParameterValueById("ParamAngleZ", -10.0)
      break
    case "sad":
      safeSet("ParamEyeLOpen", 0.3)
      safeSet("ParamEyeROpen", 0.3)
      safeSet("ParamMouthForm", 0.2)
      safeSet("ParamMouthOpenY", 0.1)
      core.setParameterValueById("ParamAngleZ", -5.0)
      break
    case "shy":
      safeSet("ParamEyeLOpen", 0.6)
      safeSet("ParamEyeROpen", 0.6)
      safeSet("ParamMouthForm", 0.6)
      safeSet("ParamMouthOpenY", 0.4)
      core.setParameterValueById("ParamAngleZ", 5.0)
      break
    case "relaxed":
      safeSet("ParamEyeLOpen", 0.9)
      safeSet("ParamEyeROpen", 0.9)
      safeSet("ParamMouthForm", 0.7)
      safeSet("ParamMouthOpenY", 0.3)
      core.setParameterValueById("ParamAngleZ", 2.0)
      break
    default:
      core.setParameterValueById("ParamAngleZ", 0)
  }
  model.internalModel?.update?.()
}

function resetFace(core: { setParameterValueById: (id: string, value: number) => void }) {
  const params = [
    "ParamEyeLOpen", "ParamEyeROpen", "ParamMouthOpenY", "ParamMouthForm",
    "ParamBrowLY", "ParamBrowRY", "ParamAngleZ"
  ]
  params.forEach((p) => {
    try { core.setParameterValueById(p, 0) } catch {}
  })
}

export default { applyExpression }
