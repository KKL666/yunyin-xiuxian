/**
 * 历练服务 —— 探索会话 / 遭遇循环 / 战斗与事件调度
 */
import type { AdventureSession, ExploreMode } from '@/types'
import { rng } from '@/utils/random'
import { add, gnZero } from '@/utils/gnum'
import { enemyDef } from '@/data/enemies'
import { regionDef, REGIONS } from '@/data/regions'
import { EVENT_AUTO_RESOLVE_SECONDS, EXPLORE_BATTLE_INTERVAL, EXPLORE_EVENT_CHANCE, EXPLORE_MODES } from '@/data/constants'
import { makeEnemySnap, resolveCombat } from './combat'
import { buildPlayerSnap } from './playerSnap'
import { currentDaoRules } from './endgameService'
import { afterWin } from './loot'
import { autoResolveEvent, pickEventFor } from './eventEngine'
import { modOf } from './statsCalc'
import { track } from './progress'
import { stoneByTier } from './formulas'
import { usePlayerStore } from '@/stores/player'
import { useAdventureStore } from '@/stores/adventure'
import { useCultivationStore } from '@/stores/cultivation'
import { useUiStore } from '@/stores/ui'

/** 区域是否可解锁(前置首领已清) */
export function regionAvailable(regionId: string): boolean {
  const adventure = useAdventureStore()
  const def = regionDef(regionId)
  if (!def) return false
  if (!def.requireCleared) return true
  return adventure.cleared.includes(def.requireCleared)
}

export function startExploration(regionId: string, mode: ExploreMode): boolean {
  const adventure = useAdventureStore()
  const player = usePlayerStore()
  const ui = useUiStore()
  const region = regionDef(regionId)
  if (!region || player.dead || adventure.session) return false
  if (!adventure.unlocked.includes(regionId)) return false
  const now = Date.now()
  const modeDef = EXPLORE_MODES[mode]
  const speed = 1 + modOf(player.finalStats.mods, 'explorationSpeed')
  const session: AdventureSession = {
    regionId,
    mode,
    startedAt: now,
    endsAt: now + modeDef.durationSec * 1000,
    nextBattleAt: now + (EXPLORE_BATTLE_INTERVAL * 1000) / speed,
    wins: 0,
    losses: 0,
    events: 0,
    stoneGain: gnZero(),
    expGain: gnZero(),
    itemGain: 0
  }
  adventure.setSession(session)
  ui.toast(`你动身前往${region.name},开始${modeDef.name}`, 'info')
  return true
}

export function stopExploration(reason: 'manual' | 'defeat' | 'complete'): void {
  const adventure = useAdventureStore()
  const ui = useUiStore()
  const s = adventure.session
  if (!s) return
  const region = regionDef(s.regionId)
  adventure.setSession(null)
  adventure.setPendingEvent(null, 0)
  if (s.wins + s.losses >= 3 || reason === 'complete') {
    track('explores')
  }
  if (reason === 'complete') {
    ui.toast(`此行${region?.name ?? ''}历练圆满,胜 ${s.wins} 场,际遇 ${s.events} 次`, 'success')
  } else if (reason === 'defeat') {
    ui.toast('你身负重伤,不得不中断历练归来疗伤', 'warn')
  } else {
    ui.toast('你收拾行囊,提前结束了这次历练', 'info')
  }
}

/** 战斗遭遇(含首领判定) */
function runBattle(now: number): void {
  const adventure = useAdventureStore()
  const cultivation = useCultivationStore()
  const s = adventure.session
  if (!s) return
  const region = regionDef(s.regionId)
  if (!region) return
  const modeDef = EXPLORE_MODES[s.mode]

  const notCleared = !adventure.cleared.includes(region.id)
  // 每积累 10 胜,方有资格挑战区域之主(避免开局撞见首领)
  const bossDue = notCleared && s.wins >= 10
  const eDefId = bossDue ? region.boss : rng.pick(region.enemies)
  const eDef = enemyDef(eDefId)
  if (!eDef) return

  const dangerFactor = modeDef.dangerMult * (1 + (region.danger - 1) * 0.05)
  const pSnap = buildPlayerSnap()
  const eSnap = makeEnemySnap(eDef, region.tier, dangerFactor)
  // 道途在世,一切战斗皆循此规则
  const result = resolveCombat(pSnap, eSnap, rng, currentDaoRules())

  adventure.recordBattle({
    enemyName: eDef.name,
    enemyIcon: eDef.icon,
    enemyId: eDef.id,
    isBoss: Boolean(eDef.isBoss),
    result,
    at: now
  })
  track('battles')

  if (result.win) {
    track('kills')
    const drops = afterWin(region, modeDef.rewardMult, Boolean(eDef.isBoss))
    adventure.setSession({
      ...s,
      wins: s.wins + 1,
      stoneGain: add(s.stoneGain, stoneByTier(region.tier, 10 * modeDef.rewardMult)),
      itemGain: s.itemGain + drops.lines.length,
      nextBattleAt: nextBattleTime(now)
    })
    if (eDef.isBoss) {
      track('bossKills')
      clearRegionAndUnlockNext(region.id)
    }
  } else {
    cultivation.addBuff('injury', now)
    adventure.setSession({ ...s, losses: s.losses + 1 })
    stopExploration('defeat')
  }
}

/** 标记区域首领已清并连锁解锁后续区域(在线/离线共用) */
export function clearRegionAndUnlockNext(regionId: string): void {
  const adventure = useAdventureStore()
  const ui = useUiStore()
  if (!adventure.markCleared(regionId)) return
  const region = regionDef(regionId)
  ui.toast(`你击败了${region?.name ?? ''}之主!`, 'rare')
  for (const r of REGIONS) {
    if (r.requireCleared === regionId && adventure.unlock(r.id)) {
      ui.toast(`新的历练之地已开放——${r.name}`, 'rare')
    }
  }
}

function nextBattleTime(now: number): number {
  const player = usePlayerStore()
  const speed = 1 + modOf(player.finalStats.mods, 'explorationSpeed')
  return now + (EXPLORE_BATTLE_INTERVAL * 1000) / speed
}

/** 每 Tick 推进探索(由引擎调用) */
export function tickExploration(now: number): void {
  const adventure = useAdventureStore()
  const player = usePlayerStore()
  const s = adventure.session
  if (!s || player.dead) return

  // 待处理事件:阻塞战斗;超时自动按默认选项处理
  if (adventure.pendingEventId) {
    if (now - adventure.pendingEventSince > EVENT_AUTO_RESOLVE_SECONDS * 1000) {
      const region = regionDef(s.regionId)
      autoResolveEvent(adventure.pendingEventId, region?.tier ?? 1)
      adventure.setPendingEvent(null, now)
      const cur = adventure.session
      if (cur) adventure.setSession({ ...cur, events: cur.events + 1, nextBattleAt: nextBattleTime(now) })
    }
    return
  }

  if (now >= s.endsAt) {
    stopExploration('complete')
    return
  }

  if (now >= s.nextBattleAt) {
    const region = regionDef(s.regionId)
    if (!region) return
    const eventLuck = modOf(player.finalStats.mods, 'eventLuck')
    if (rng.chance(EXPLORE_EVENT_CHANCE * (1 + eventLuck))) {
      const ev = pickEventFor(region)
      if (ev) {
        adventure.setPendingEvent(ev.id, now)
        return
      }
    }
    runBattle(now)
  }
}

/** 玩家在事件弹窗中做出选择后调用 */
export function afterEventResolved(now: number): void {
  const adventure = useAdventureStore()
  adventure.setPendingEvent(null, now)
  const s = adventure.session
  if (s) {
    adventure.setSession({ ...s, events: s.events + 1, nextBattleAt: nextBattleTime(now) })
  }
}
