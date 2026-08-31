/* eslint-disable no-console -- 模拟器体检报告的正式输出(npm run test:report 依赖) */
import { describe, expect, it } from 'vitest'
import { BUILD_PROFILES, ENEMY_ARCHETYPES, fullMatrix, tribulationSurvives, type MatrixRow } from './buildSim'

const N = 80

function cell(rows: MatrixRow[], buildId: string, archId: string): number {
  return rows.find(r => r.build.id === buildId)!.cells[archId]!.winRate
}

describe('流派对战审计(Phase 16)', () => {
  const rows = fullMatrix(N)

  it('输出克制矩阵', () => {
    const header = ['流派  ', ...ENEMY_ARCHETYPES.map(a => a.name.padStart(4, ' ')), '  均值'].join(' | ')
    console.log('\n—— 流派 × 敌人原型 胜率矩阵(各 ' + N + ' 场) ——')
    console.log('  ' + header)
    for (const row of rows) {
      const cells = ENEMY_ARCHETYPES.map(a => `${Math.round(row.cells[a.id]!.winRate * 100)}%`.padStart(4, ' '))
      console.log(`  ${row.build.name} | ${cells.join(' | ')} | ${Math.round(row.avgWinRate * 100)}%`)
    }
    console.log('\n—— 天劫期望存活(筑基劫 / 金丹劫) ——')
    for (const b of BUILD_PROFILES) {
      console.log(`  ${b.name}: ${tribulationSurvives(b, 1) ? '渡' : '殒'} / ${tribulationSurvives(b, 2) ? '渡' : '殒'}`)
    }
    expect(rows.length).toBe(6)
  })

  it('无废柴也无霸主:各流派综合胜率在健康区间', () => {
    for (const row of rows) {
      expect(row.avgWinRate, row.build.name).toBeGreaterThan(0.45)
      expect(row.avgWinRate, row.build.name).toBeLessThan(0.88)
    }
    const avgs = rows.map(r => r.avgWinRate)
    expect(Math.max(...avgs) - Math.min(...avgs)).toBeLessThan(0.3)
  })

  it('每个流派都有明确的优势与劣势场景(极差 ≥ 15%)', () => {
    for (const row of rows) {
      const rates = ENEMY_ARCHETYPES.map(a => row.cells[a.id]!.winRate)
      expect(Math.max(...rates) - Math.min(...rates), row.build.name).toBeGreaterThanOrEqual(0.15)
    }
  })

  it('克制关系成立:破盾斩杀墙前,高防之盾仍优于纯奶', () => {
    // 高爆发墙携带真伤后,护盾被无视——罡盾靠高防仍优于沐泽的纯回复
    expect(cell(rows, 'gangdun', 'burst')).toBeGreaterThan(cell(rows, 'muze', 'burst') + 0.05)
  })

  it('克制关系成立:反震吃多段,惧疾影', () => {
    expect(cell(rows, 'fanzhen', 'multi')).toBeGreaterThan(0.6)
    expect(cell(rows, 'fanzhen', 'multi')).toBeGreaterThan(cell(rows, 'fanzhen', 'dodge') + 0.12)
  })

  it('克制关系成立:连击遇疾影明显失灵', () => {
    expect(cell(rows, 'lianji', 'normal')).toBeGreaterThan(cell(rows, 'lianji', 'dodge') + 0.12)
  })

  it('克制关系成立:沐泽擅长首领久战,怕高爆发', () => {
    expect(cell(rows, 'muze', 'boss')).toBeGreaterThan(cell(rows, 'muze', 'burst') + 0.08)
  })

  it('克制关系成立:锋芒收割脆皮快于慢速反击流,攻坚仍乏力', () => {
    expect(cell(rows, 'fengmang', 'burst')).toBeGreaterThan(cell(rows, 'fanzhen', 'burst') + 0.08)
    expect(cell(rows, 'fengmang', 'boss')).toBeLessThan(0.4)
  })

  it('克制关系成立:背水的濒死缠斗最擅攻坚(优于其余攻击流)', () => {
    expect(cell(rows, 'beishui', 'boss')).toBeGreaterThan(cell(rows, 'lianji', 'boss') + 0.1)
    expect(cell(rows, 'beishui', 'boss')).toBeGreaterThan(cell(rows, 'fengmang', 'boss') + 0.1)
  })

  it('真伤是护盾体系的天敌', () => {
    // 罡盾对真伤的表现应显著差于其自身最擅长的场景
    const gangdun = rows.find(r => r.build.id === 'gangdun')!
    const best = Math.max(...ENEMY_ARCHETYPES.map(a => gangdun.cells[a.id]!.winRate))
    expect(best - cell(rows, 'gangdun', 'pierce')).toBeGreaterThan(0.12)
  })

  it('天劫存活分化:护持路数稳过金丹劫,纯攻流须借丹药外力', () => {
    const survives = (id: string, m: number): boolean =>
      tribulationSurvives(
        BUILD_PROFILES.find(b => b.id === id)!,
        m
      )
    // 筑基劫对所有流派友好(首劫保护)
    for (const b of BUILD_PROFILES) {
      expect(tribulationSurvives(b, 1), b.name).toBe(true)
    }
    // 金丹劫开始分化
    expect(survives('gangdun', 2)).toBe(true)
    expect(survives('lianji', 2)).toBe(false)
    expect(survives('fengmang', 2)).toBe(false)
  })
})
