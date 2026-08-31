/** 洞府状态 —— 建筑等级与产出 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { BuildingId, StatMods } from '@/types'
import { persistConfig } from '@/utils/storage'
import { BUILDINGS } from '@/data/buildings'
import { FIELD_HERB_PER_HOUR, FIELD_ORE_PER_HOUR, LIBRARY_WUDAO_PER_HOUR, OFFLINE_CAP_HOURS } from '@/data/constants'
import { mergeMods } from '@/core/statsCalc'
import { useResourcesStore } from './resources'

export const useDongfuStore = defineStore(
  'dongfu',
  () => {
    const levels = ref<Record<BuildingId, number>>({
      mansion: 0,
      array: 0,
      alchemy: 0,
      forge: 0,
      field: 0,
      library: 0,
      beast: 0
    })
    /** 产出小数累积器 */
    const frac = ref({ herb: 0, ore: 0, wudao: 0 })

    const buildingMods = computed<StatMods>(() => {
      const sources: StatMods[] = []
      for (const def of BUILDINGS) {
        const lv = levels.value[def.id] ?? 0
        if (lv > 0 && def.mods) sources.push(def.mods(lv))
      }
      return mergeMods(sources)
    })

    const offlineCapHours = computed(() => OFFLINE_CAP_HOURS[Math.min(levels.value.mansion, OFFLINE_CAP_HOURS.length - 1)]!)
    /** 洞府等级限制其余建筑上限 */
    const buildingLevelCap = computed(() => (levels.value.mansion + 1) * 5)
    const subGongfaSlots = computed(() => 1 + Math.floor(levels.value.library / 3))
    const alchemyLevel = computed(() => levels.value.alchemy)
    const forgeCapBonus = computed(() => Math.floor(levels.value.forge / 2))
    const qiCapMult = computed(() => 1 + levels.value.array * 0.08)
    const beastMult = computed(() => 1 + levels.value.beast * 0.1)

    function setLevel(id: BuildingId, lv: number): void {
      levels.value = { ...levels.value, [id]: lv }
    }

    /** 建筑产出(灵田/藏经阁),按秒推进 */
    function produce(dtSec: number): void {
      const resources = useResourcesStore()
      const fieldLv = levels.value.field
      const libLv = levels.value.library
      if (fieldLv > 0) {
        frac.value.herb += (fieldLv * FIELD_HERB_PER_HOUR * dtSec) / 3600
        frac.value.ore += (fieldLv * FIELD_ORE_PER_HOUR * dtSec) / 3600
      }
      if (libLv > 0) {
        frac.value.wudao += (libLv * LIBRARY_WUDAO_PER_HOUR * dtSec) / 3600
      }
      for (const key of ['herb', 'ore', 'wudao'] as const) {
        const whole = Math.floor(frac.value[key])
        if (whole >= 1) {
          frac.value[key] -= whole
          resources.addSmall(key, whole)
        }
      }
    }

    return {
      levels,
      frac,
      buildingMods,
      offlineCapHours,
      buildingLevelCap,
      subGongfaSlots,
      alchemyLevel,
      forgeCapBonus,
      qiCapMult,
      beastMult,
      setLevel,
      produce
    }
  },
  { persist: persistConfig('dongfu') }
)
