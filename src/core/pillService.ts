/**
 * 丹药服务 —— 服用与炼制
 */
import { gn, mulN } from '@/utils/gnum'
import { rng } from '@/utils/random'
import { pillDef, PILLS } from '@/data/pills'
import { stoneByTier } from './formulas'
import { collect, track } from './progress'
import { modOf } from './statsCalc'
import { usePlayerStore } from '@/stores/player'
import { useResourcesStore } from '@/stores/resources'
import { useInventoryStore } from '@/stores/inventory'
import { useCultivationStore } from '@/stores/cultivation'
import { useDongfuStore } from '@/stores/dongfu'
import { useUiStore } from '@/stores/ui'
import { playSfx } from './audio'
import type { GNum } from '@/types'

/** 服用丹药 */
export function usePill(id: string): boolean {
  const player = usePlayerStore()
  const resources = useResourcesStore()
  const inventory = useInventoryStore()
  const cultivation = useCultivationStore()
  const ui = useUiStore()
  const def = pillDef(id)
  if (!def) return false
  if (!inventory.spendPill(id)) {
    ui.toast('丹药不足', 'warn')
    return false
  }
  const lines: string[] = []
  if (def.kind === 'instant' && def.instant) {
    if (def.instant.expReqPct) {
      player.gainExp(mulN(player.expReq, def.instant.expReqPct))
      lines.push('修为精进')
    }
    if (def.instant.expFixed) {
      player.gainExp(gn(def.instant.expFixed))
      lines.push('修为精进')
    }
    if (def.instant.qiPct) {
      resources.setQi(resources.qi + player.qiCapValue * def.instant.qiPct, player.qiCapValue)
      lines.push('灵气充盈')
    }
    if (def.instant.lifespanYears) {
      player.addLifespan(def.instant.lifespanYears)
      lines.push(`寿元 +${def.instant.lifespanYears} 载`)
    }
    if (def.instant.wudao) {
      resources.addSmall('wudao', def.instant.wudao)
      lines.push(`悟道点 +${def.instant.wudao}`)
    }
  } else if (def.buffId) {
    cultivation.addBuff(def.buffId, Date.now())
    lines.push('药力化开,状态加身')
  }
  track('pillsUsed')
  collect('pill', id)
  playSfx('success')
  ui.toast(`服下「${def.name}」,${lines.join(',') || '药力温养周身'}`, 'success')
  return true
}

/** 炼丹消耗 */
export function pillCraftCost(id: string): { herb: number; stone: GNum } | null {
  const def = pillDef(id)
  if (!def?.recipe) return null
  const tier = Math.max(1, def.minRealm * 2 + 1)
  return { herb: def.recipe.herb, stone: stoneByTier(tier, def.recipe.stoneBase / 10) }
}

/** 当前可炼制的丹方 */
export function availableRecipes(): string[] {
  const dongfu = useDongfuStore()
  const player = usePlayerStore()
  return PILLS.filter(p => p.recipe && (p.alchemyLevel ?? 1) <= dongfu.alchemyLevel && p.minRealm <= player.major).map(p => p.id)
}

/** 炼制丹药 */
export function craftPill(id: string): boolean {
  const resources = useResourcesStore()
  const inventory = useInventoryStore()
  const player = usePlayerStore()
  const ui = useUiStore()
  const def = pillDef(id)
  const cost = pillCraftCost(id)
  if (!def || !cost) return false
  if (!resources.hasSmall('herb', cost.herb) || !resources.hasStone(cost.stone)) {
    ui.toast('灵草或灵石不足', 'warn')
    return false
  }
  resources.spendSmall('herb', cost.herb)
  resources.spendStone(cost.stone)
  const extra = rng.chance(Math.min(0.8, modOf(player.finalStats.mods, 'alchemyYield'))) ? 1 : 0
  inventory.addPill(id, 1 + extra)
  track('pillsCrafted', 1 + extra)
  collect('pill', id)
  ui.toast(extra ? `丹成两枚!「${def.name}」品相极佳` : `炼成「${def.name}」×1`, extra ? 'rare' : 'success')
  return true
}
