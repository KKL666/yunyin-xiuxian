/* eslint-disable no-console */
/**
 * 突破服务 —— 渡劫成功率推演
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { tribulationSuccessRate, breakthroughInfo } from './breakthrough'
import type { StatMods } from '@/types'
import { usePlayerStore } from '@/stores/player'
import { useResourcesStore } from '@/stores/resources'

describe('渡劫成功率推演', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('裸装低境界:折半分存亡,而非必死', () => {
    const rate = tribulationSuccessRate(1, {})
    // 首劫伤害公式:0.15+0.02+0.03w,共 4 波,无任何减伤
    // 期望值应落在有意义的中段区间
    console.log(`裸装首劫成功率:${(rate * 100).toFixed(1)}%`)
    expect(rate).toBeGreaterThan(0.2)
    expect(rate).toBeLessThan(0.8)
  })

  it('词条加成单调提升:减伤/渡劫抗性/护盾/再生都会提高存活率', () => {
    const base = tribulationSuccessRate(2, {})
    const withReduction = tribulationSuccessRate(2, { damageReduction: 0.4 })
    const withResist = tribulationSuccessRate(2, { tribulationResist: 0.4 })
    const withShield = tribulationSuccessRate(2, { shieldOnStart: 0.8 })
    const withRegen = tribulationSuccessRate(2, { regenPerRound: 0.05 })
    expect(withReduction).toBeGreaterThan(base)
    expect(withResist).toBeGreaterThan(base)
    expect(withShield).toBeGreaterThan(base)
    expect(withRegen).toBeGreaterThan(base)
  })

  it('同输入确定性:固定种子结果稳定', () => {
    const mods: StatMods = { damageReduction: 0.3, tribulationResist: 0.5, regenPerRound: 0.02 }
    const a = tribulationSuccessRate(3, mods)
    const b = tribulationSuccessRate(3, mods)
    expect(a).toBe(b)
  })

  it('境界越高天劫越难:同词条下高境界成功率不升', () => {
    const low = tribulationSuccessRate(1, { damageReduction: 0.3 })
    const high = tribulationSuccessRate(6, { damageReduction: 0.3 })
    expect(low).toBeGreaterThan(high)
  })

  it('breakthroughInfo:大境界(渡劫)场景返回独立 tribRate', () => {
    const player = usePlayerStore()
    const resources = useResourcesStore()
    // 模拟炼气·十层(SUB_LEVELS=10,sub=9 时 isMajorStep)
    player.$patch({ major: 0, sub: 9 })
    resources.$patch({ qi: 99999 })
    // 强制修为圆满:exp >= expRequirement(0,9)
    player.$patch({ exp: { m: 1e12, e: 0 } })
    const info = breakthroughInfo()
    console.log(
      `境界=${player.realmName} major→${info.targetLabel} needTribulation=${info.needTribulation} rate=${info.rateText} tribRate=${info.tribRate}`
    )

    // 炼气→筑基应需渡劫(多数大境界有天劫),tribRate 应为一个 (0,1) 概率
    if (info.needTribulation) {
      expect(info.tribRate).not.toBeNull()
      expect(info.tribRate!).toBeGreaterThan(0)
      expect(info.tribRate!).toBeLessThanOrEqual(1)
    } else {
      expect(info.tribRate).toBeNull()
    }
  })

  it('breakthroughInfo:渡劫场景 tribRate 与纯函数一致', () => {
    const player = usePlayerStore()
    const resources = useResourcesStore()
    player.$patch({ major: 0, sub: 9 })
    resources.$patch({ qi: 999999 })
    player.$patch({ exp: { m: 1e12, e: 0 } })
    const info = breakthroughInfo()
    if (info.needTribulation && info.tribRate !== null) {
      const mods = player.finalStats.mods
      const expected = tribulationSuccessRate(1, mods)
      expect(info.tribRate).toBeCloseTo(expected, 2)
    } else {
      console.log('此境界突破不需渡劫(境界定义中无天劫)')
    }
  })
})
