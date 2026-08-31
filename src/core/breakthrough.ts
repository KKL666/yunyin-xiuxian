/**
 * 突破服务 —— 成功率计算 / 天劫 / 结算
 */
import { rng } from '@/utils/random'
import { formatPercent } from '@/utils/format'
import { realmDef, realmLabel } from '@/data/realms'
import { BT_FAIL_EXP_LOSS, BT_QI_COST_RATIO, TRIBULATION_BASE_WAVES } from '@/data/constants'
import { breakthroughBaseRate, clampRate, tribulationWaveDamage } from './formulas'
import { modOf } from './statsCalc'
import { track, trackRealm, checkStateAchievements } from './progress'
import { usePlayerStore } from '@/stores/player'
import { useResourcesStore } from '@/stores/resources'
import { useCultivationStore } from '@/stores/cultivation'
import { useUiStore } from '@/stores/ui'
import type { BreakthroughView } from '@/stores/ui'
import { playSfx } from './audio'

export interface BreakthroughInfo {
  ready: boolean
  reason: string
  rate: number
  rateText: string
  qiCost: number
  isMajor: boolean
  needTribulation: boolean
  targetLabel: string
}

export function breakthroughInfo(): BreakthroughInfo {
  const player = usePlayerStore()
  const resources = useResourcesStore()
  const isMajor = player.isMajorStep
  const nextMajor = isMajor ? player.major + 1 : player.major
  const nextSub = isMajor ? 0 : player.sub + 1
  const needTribulation = isMajor && realmDef(nextMajor).tribulation && player.major < nextMajor
  const qiCost = Math.floor(player.qiCapValue * BT_QI_COST_RATIO)
  const mods = player.finalStats.mods
  const rate = clampRate(breakthroughBaseRate(player.major, player.sub) + modOf(mods, 'breakthroughRate') + modOf(mods, 'luck') * 0.05)
  let ready = true
  let reason = ''
  if (player.atMaxRealm) {
    ready = false
    reason = '已至大道尽头'
  } else if (!player.expFull) {
    ready = false
    reason = '修为未至圆满'
  } else if (resources.qi < qiCost) {
    ready = false
    reason = '灵气不足'
  }
  return {
    ready,
    reason,
    rate,
    rateText: formatPercent(rate, 0),
    qiCost,
    isMajor,
    needTribulation,
    targetLabel: realmLabel(nextMajor, nextSub)
  }
}

/** 模拟渡劫:返回(是否渡过, 战报) */
function runTribulation(targetMajor: number): { survived: boolean; log: string[] } {
  const player = usePlayerStore()
  const mods = player.finalStats.mods
  const waves = TRIBULATION_BASE_WAVES + targetMajor
  const resist = Math.min(0.8, modOf(mods, 'tribulationResist'))
  const reduction = Math.min(0.6, modOf(mods, 'damageReduction'))
  const lowHpRed = Math.min(0.6, modOf(mods, 'lowHpReduction'))
  let hpLeft = 1 + modOf(mods, 'shieldOnStart')
  const regen = modOf(mods, 'regenPerRound')
  const log: string[] = [`乌云压顶,${realmDef(targetMajor).name}劫将至——共 ${waves} 道天雷!`]
  for (let w = 1; w <= waves; w += 1) {
    let dmg = tribulationWaveDamage(targetMajor, w, resist) * (1 - reduction) * rng.float(0.85, 1.15)
    // 濒危减伤(背水路数)在气血垂危时同样护持渡劫
    if (hpLeft < 0.3) dmg *= 1 - lowHpRed
    hpLeft = hpLeft - dmg + regen
    if (hpLeft <= 0) {
      log.push(`第 ${w} 道天雷轰然落下,你护体灵光崩碎,重伤坠地……`)
      return { survived: false, log }
    }
    const pct = Math.max(1, Math.round(hpLeft * 100))
    log.push(`第 ${w} 道天雷落下,你咬牙硬撼,气血余 ${Math.min(999, pct)}%。`)
  }
  log.push('雷云散尽,天光重开。你于劫灰中缓缓立起——渡劫,成了!')
  return { survived: true, log }
}

/** 尝试突破,返回展示数据(由 UI 弹窗呈现) */
export function attemptBreakthrough(): BreakthroughView | null {
  const player = usePlayerStore()
  const resources = useResourcesStore()
  const cultivation = useCultivationStore()
  const ui = useUiStore()
  const info = breakthroughInfo()
  if (!info.ready) {
    ui.toast(info.reason, 'warn')
    return null
  }
  const fromLabel = player.realmName
  resources.setQi(resources.qi - info.qiCost, player.qiCapValue)

  let success: boolean
  let tribulationLog: string[] = []
  if (info.needTribulation) {
    const result = runTribulation(player.major + 1)
    success = result.survived
    tribulationLog = result.log
    track('tribulations')
  } else {
    success = rng.chance(info.rate)
  }

  let view: BreakthroughView
  if (success) {
    player.advanceRealm()
    cultivation.clearNegativeBuffs()
    track('breakthroughs')
    trackRealm()
    checkStateAchievements()
    playSfx('breakthrough')
    const realm = player.realm
    view = {
      success: true,
      fromLabel,
      toLabel: player.realmName,
      isMajor: info.isMajor,
      tribulationLog,
      message: info.isMajor ? `境界跃迁,天地翻覆。${realm.desc}。寿元增至 ${player.lifespanMax} 载。` : '灵台清明,经脉拓宽,修为更上一层。'
    }
  } else {
    const mods = player.finalStats.mods
    const refund = Math.min(0.8, modOf(mods, 'breakRefund'))
    player.loseExpPct(BT_FAIL_EXP_LOSS * (1 - refund))
    cultivation.addBuff('injury', Date.now())
    track('breakthroughFails')
    playSfx('fail')
    view = {
      success: false,
      fromLabel,
      toLabel: info.targetLabel,
      isMajor: info.isMajor,
      tribulationLog,
      message: info.needTribulation ? '天威难测,此番渡劫失利。所幸道基未毁,来日再战。' : '灵气逆冲,功亏一篑。你吐出一口淤血,盘膝疗伤。'
    }
  }
  ui.breakthrough = view
  return view
}
