/** 玩家状态 —— 境界 / 修为 / 寿元 / 灵根 / 最终属性汇总 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { FinalStats, GNum, LinggenProfile, StatMods } from '@/types'
import { gn, gnMin, gnZero, add, gte, mulN, progress, subClamp } from '@/utils/gnum'
import { persistConfig } from '@/utils/storage'
import { realmDef, realmLabel, SUB_NAMES, MAX_MAJOR } from '@/data/realms'
import { SUB_LEVELS, START_AGE } from '@/data/constants'
import { titleDef } from '@/data/titles'
import { petDef } from '@/data/pets'
import { talentDef } from '@/data/talents'
import { baseCultPerSec, baseQiRegen, expRequirement, qiCap } from '@/core/formulas'
import { computeFinalStats, modOf } from '@/core/statsCalc'
import { useInventoryStore } from './inventory'
import { useCultivationStore } from './cultivation'
import { useDongfuStore } from './dongfu'
import { useResourcesStore } from './resources'

export const usePlayerStore = defineStore(
  'player',
  () => {
    const inventory = useInventoryStore()
    const cultivation = useCultivationStore()
    const dongfu = useDongfuStore()
    const resources = useResourcesStore()

    const name = ref('无名散修')
    const linggen = ref<LinggenProfile | null>(null)
    const major = ref(0)
    const sub = ref(0)
    const exp = ref<GNum>(gnZero())
    const age = ref(START_AGE)
    const lifespanBonusYears = ref(0)
    const titleId = ref<string | null>(null)
    const petId = ref<string | null>(null)
    const dead = ref(false)
    const reincarnation = ref({ count: 0, daoFruit: 0, talents: [] as string[] })

    // ---------- 境界 ----------
    const realm = computed(() => realmDef(major.value))
    const realmName = computed(() => realmLabel(major.value, sub.value))
    const subName = computed(() => SUB_NAMES[Math.min(sub.value, SUB_NAMES.length - 1)]!)
    const expReq = computed(() => expRequirement(major.value, sub.value))
    const expProgress = computed(() => progress(exp.value, expReq.value))
    const expFull = computed(() => gte(exp.value, expReq.value))
    const isMajorStep = computed(() => sub.value >= SUB_LEVELS - 1)
    const atMaxRealm = computed(() => major.value >= MAX_MAJOR && sub.value >= SUB_LEVELS - 1)

    // ---------- 属性汇总 ----------
    const talentMods = computed<StatMods[]>(() => reincarnation.value.talents.map(id => talentDef(id)?.mods ?? {}))
    const titleMods = computed<StatMods>(() => (titleId.value ? (titleDef(titleId.value)?.mods ?? {}) : {}))
    const petMods = computed<StatMods>(() => {
      if (!petId.value) return {}
      const def = petDef(petId.value)
      if (!def) return {}
      const scaled: StatMods = {}
      for (const k in def.mods) {
        const key = k as keyof StatMods
        scaled[key] = (def.mods[key] ?? 0) * dongfu.beastMult
      }
      return scaled
    })

    const qiCapValue = computed(() => Math.floor(qiCap(major.value, sub.value) * dongfu.qiCapMult))
    const qiRich = computed(() => resources.qi >= qiCapValue.value * 0.5)

    const finalStats = computed<FinalStats>(() =>
      computeFinalStats({
        major: major.value,
        sub: sub.value,
        linggenMult: linggen.value?.growthMult ?? 1,
        modSources: [
          inventory.equipMods,
          cultivation.gongfaMods,
          cultivation.buffMods,
          dongfu.buildingMods,
          titleMods.value,
          petMods.value,
          ...talentMods.value
        ],
        equipFlats: inventory.equipFlats,
        daoFruit: reincarnation.value.daoFruit,
        qiRich: qiRich.value
      })
    )

    /** 修为增速(每秒) */
    const cultPerSec = computed(
      () => baseCultPerSec(major.value, sub.value) * Math.max(0.05, 1 + modOf(finalStats.value.mods, 'cultivationSpeed'))
    )
    const qiRegenPerSec = computed(() => baseQiRegen(major.value) * Math.max(0.05, 1 + modOf(finalStats.value.mods, 'qiRegen')))

    // ---------- 寿元 ----------
    const lifespanMax = computed(() => {
      const base = realm.value.lifespanYears
      return Math.floor(base * (1 + modOf(finalStats.value.mods, 'lifespanPct')) + lifespanBonusYears.value)
    })
    const lifespanRatio = computed(() => Math.max(0, 1 - age.value / Math.max(1, lifespanMax.value)))

    // ---------- 动作 ----------
    function initCharacter(newName: string, profile: LinggenProfile): void {
      name.value = newName
      linggen.value = profile
      major.value = 0
      sub.value = 0
      exp.value = gnZero()
      age.value = START_AGE
      lifespanBonusYears.value = 0
      dead.value = false
    }

    /** 增加修为,封顶于当前突破需求 */
    function gainExp(v: GNum): void {
      exp.value = gnMin(add(exp.value, v), expReq.value)
    }

    function loseExpPct(pct: number): void {
      exp.value = subClamp(exp.value, mulN(exp.value, pct))
    }

    function advanceRealm(): void {
      if (isMajorStep.value) {
        if (major.value < MAX_MAJOR) {
          major.value += 1
          sub.value = 0
        }
      } else {
        sub.value += 1
      }
      exp.value = gnZero()
    }

    function addAge(years: number): void {
      age.value += years
    }

    function addLifespan(years: number): void {
      lifespanBonusYears.value += years
    }

    function setTitle(id: string | null): void {
      titleId.value = id
    }

    function setPet(id: string | null): void {
      petId.value = id
    }

    function addTalent(id: string): void {
      if (!reincarnation.value.talents.includes(id)) {
        reincarnation.value = {
          ...reincarnation.value,
          talents: [...reincarnation.value.talents, id]
        }
      }
    }

    function addDaoFruit(n: number): void {
      reincarnation.value = { ...reincarnation.value, daoFruit: reincarnation.value.daoFruit + n }
    }

    function markDead(): void {
      dead.value = true
    }

    /** 转世重置(保留天赋/道果/转世次数) */
    function rebirth(newLinggen: LinggenProfile): void {
      reincarnation.value = { ...reincarnation.value, count: reincarnation.value.count + 1 }
      linggen.value = newLinggen
      major.value = 0
      sub.value = 0
      exp.value = gnZero()
      age.value = START_AGE
      lifespanBonusYears.value = 0
      dead.value = false
    }

    /** 存档修复 */
    function sanitize(): void {
      exp.value = gn(exp.value)
      if (!Number.isFinite(age.value)) age.value = START_AGE
      if (!Number.isFinite(major.value) || major.value < 0) major.value = 0
      if (!Number.isFinite(sub.value) || sub.value < 0) sub.value = 0
    }

    return {
      name,
      linggen,
      major,
      sub,
      exp,
      age,
      lifespanBonusYears,
      titleId,
      petId,
      dead,
      reincarnation,
      realm,
      realmName,
      subName,
      expReq,
      expProgress,
      expFull,
      isMajorStep,
      atMaxRealm,
      qiCapValue,
      qiRich,
      finalStats,
      cultPerSec,
      qiRegenPerSec,
      lifespanMax,
      lifespanRatio,
      initCharacter,
      gainExp,
      loseExpPct,
      advanceRealm,
      addAge,
      addLifespan,
      setTitle,
      setPet,
      addTalent,
      addDaoFruit,
      markDead,
      rebirth,
      sanitize
    }
  },
  { persist: persistConfig('player') }
)
