/** 游戏元状态 —— 是否开局 / 时间戳 / 存档版本 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { persistConfig, SAVE_VERSION } from '@/utils/storage'

export const useGameStore = defineStore(
  'game',
  () => {
    const started = ref(false)
    const saveVersion = ref(SAVE_VERSION)
    const createdAt = ref(0)
    const lastActiveAt = ref(0)
    const totalPlaySec = ref(0)

    function markStarted(): void {
      started.value = true
      createdAt.value = Date.now()
      lastActiveAt.value = Date.now()
    }

    function stampActive(now: number): void {
      lastActiveAt.value = now
    }

    function addPlayTime(sec: number): void {
      totalPlaySec.value += sec
    }

    return { started, saveVersion, createdAt, lastActiveAt, totalPlaySec, markStarted, stampActive, addPlayTime }
  },
  { persist: persistConfig('game') }
)
