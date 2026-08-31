/** 历练状态 —— 区域解锁 / 探索会话 / 待处理事件 / 最近战报 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { AdventureSession, CombatResult } from '@/types'
import { persistConfig } from '@/utils/storage'
import { regionDef } from '@/data/regions'

export interface LastBattleView {
  enemyName: string
  enemyIcon: string
  /** 敌人定义 id(供适配度展示;旧存档可能缺失) */
  enemyId?: string
  isBoss: boolean
  result: CombatResult
  at: number
}

export const useAdventureStore = defineStore(
  'adventure',
  () => {
    const unlocked = ref<string[]>(['qingyun'])
    const cleared = ref<string[]>([])
    const session = ref<AdventureSession | null>(null)
    const pendingEventId = ref<string | null>(null)
    const pendingEventSince = ref(0)
    const seenOnceEvents = ref<string[]>([])
    const lastBattle = ref<LastBattleView | null>(null)

    const sessionActive = computed(() => session.value !== null)
    const currentRegion = computed(() => (session.value ? regionDef(session.value.regionId) : undefined))

    function setSession(s: AdventureSession | null): void {
      session.value = s
    }

    function unlock(regionId: string): boolean {
      if (unlocked.value.includes(regionId)) return false
      unlocked.value = [...unlocked.value, regionId]
      return true
    }

    function markCleared(regionId: string): boolean {
      if (cleared.value.includes(regionId)) return false
      cleared.value = [...cleared.value, regionId]
      return true
    }

    function setPendingEvent(id: string | null, now: number): void {
      pendingEventId.value = id
      pendingEventSince.value = id ? now : 0
    }

    function markEventSeen(id: string): void {
      if (!seenOnceEvents.value.includes(id)) {
        seenOnceEvents.value = [...seenOnceEvents.value, id]
      }
    }

    function recordBattle(view: LastBattleView): void {
      lastBattle.value = view
    }

    return {
      unlocked,
      cleared,
      session,
      pendingEventId,
      pendingEventSince,
      seenOnceEvents,
      lastBattle,
      sessionActive,
      currentRegion,
      setSession,
      unlock,
      markCleared,
      setPendingEvent,
      markEventSeen,
      recordBattle
    }
  },
  { persist: persistConfig('adventure') }
)
