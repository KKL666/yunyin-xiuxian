/**
 * 区域镇压系统 —— Phase 30.1
 *
 * 当玩家对某区域形成绝对优势后,该区域从主动玩法退出,变成被动收益源。
 * 核心理念:"成长改变世界",而非"世界永远跟着你缩放"。
 */

import { usePlayerStore } from '@/stores/player'
import { useResourcesStore } from '@/stores/resources'
import { regionDef } from '@/data/regions'
import { stoneByTier } from '@/core/formulas'
import { generateEquipment } from '@/core/equipGen'
import { acquireEquipment } from '@/core/loot'
import { rng } from '@/utils/random'
import { gnZero, add } from '@/utils/gnum'
import type { GNum, QualityId } from '@/types'
import { equipmentTemplate } from '@/data/equipment'

/** 区域统计数据(使用指数移动平均) */
export interface RegionStats {
  totalFights: number
  avgRounds: number          // 指数移动平均回合数
  avgDamageTakenPct: number  // 指数移动平均受伤百分比
  consecutiveWins: number
  lastUpdateAt: number
}

/** 镇压判定阈值 */
const SUPPRESS_THRESHOLDS = {
  minFights: 20,              // 最少战斗次数
  maxAvgRounds: 3,            // 平均回合数上限
  maxAvgDamageTaken: 0.10,    // 平均受伤百分比上限 10%
}

/** 镇压收益(每小时基础倍率) */
const SUPPRESS_YIELD_PER_HOUR = {
  stoneMultiplier: 150,       // 灵石倍率
  equipmentChance: 0.4,       // 装备掉落概率
}

/**
 * 判定玩家是否已镇压某区域
 * 条件:≥20 战,平均回合 ≤3,平均受伤 ≤10%
 */
export function checkSuppression(player: ReturnType<typeof usePlayerStore>, regionId: string): boolean {
  if (player.suppressedRegions.includes(regionId)) return false

  const stats = player.regionStats[regionId]
  if (!stats || stats.totalFights < SUPPRESS_THRESHOLDS.minFights) return false

  return (
    stats.avgRounds <= SUPPRESS_THRESHOLDS.maxAvgRounds &&
    stats.avgDamageTakenPct <= SUPPRESS_THRESHOLDS.maxAvgDamageTaken
  )
}

/**
 * 结算已镇压区域的被动收益(每小时产出灵石和装备)
 * 由 GameEngine 每 tick 调用
 * 返回累计收益(供离线结算展示)
 */
export interface SuppressedYield {
  stone: GNum
  equipment: { name: string; quality: QualityId }[]
}

export function settleSuppressedRegions(dt: number): SuppressedYield | null {
  const player = usePlayerStore()
  const resources = useResourcesStore()

  if (player.suppressedRegions.length === 0) return null

  const hours = dt / 3600
  const total: SuppressedYield = { stone: gnZero(), equipment: [] }

  for (const regionId of player.suppressedRegions) {
    const region = regionDef(regionId)
    if (!region) continue

    // 灵石产出:基础倍率 × 区域阶位 × 时间
    const stoneYield = stoneByTier(region.tier, SUPPRESS_YIELD_PER_HOUR.stoneMultiplier * hours)
    resources.addStone(stoneYield)
    total.stone = add(total.stone, stoneYield)

    // 装备掉落:概率结算
    const equipChance = SUPPRESS_YIELD_PER_HOUR.equipmentChance * hours
    if (Math.random() < equipChance) {
      const equip = generateEquipment(region.tier, rng, { luck: 0, minQualityRank: 0 })
      acquireEquipment(equip, true) // quiet=true 避免镇压收益刷屏
      total.equipment.push({ name: equipmentTemplate(equip.templateId)?.name ?? '未知', quality: equip.quality })
    }
  }

  return total
}
