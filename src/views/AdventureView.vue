<template>
  <div class="stagger-in space-y-4 px-4 pb-6 pt-4">
    <!-- 历练中 -->
    <template v-if="adventure.sessionActive">
      <CombatPanel />
    </template>

    <!-- 选择区域 -->
    <template v-else>
      <SectionTitle title="历练" hint="行万里路,炼一颗心" />
      <div class="space-y-2.5">
        <div v-for="row in visibleRows" :key="row.def.id" class="card-ink px-4 py-3" :class="{ 'opacity-70': !row.unlocked }">
          <div class="flex items-center gap-3">
            <span
              class="grid h-10 w-10 shrink-0 place-items-center rounded-md"
              :class="row.unlocked ? 'bg-indigo-ink/10 text-indigo-ink' : 'bg-ink/6 text-ink-ghost'"
            >
              <GameIcon :name="row.unlocked ? row.def.icon : 'lock'" :size="18" />
            </span>
            <div class="min-w-0 grow">
              <p class="flex items-center gap-2">
                <span class="font-kai text-[15px] tracking-wider text-ink">{{ row.def.name }}</span>
                <span v-if="row.cleared" class="chip-ink border-jade/60 text-[9px] text-jade">已靖</span>
              </p>
              <p class="mt-0.5 text-[11px] text-ink-faint">
                {{ REALMS[row.def.minRealm]?.name }}境相宜 ·
                <span :class="row.def.danger >= 4 ? 'text-cinnabar' : ''">{{ DANGER_NAMES[row.def.danger] }}</span>
                <span v-if="row.tooHard" class="ml-1 text-cinnabar">· 境界尚浅,恐有性命之忧</span>
              </p>
            </div>
            <button v-if="row.unlocked" class="btn-seal shrink-0 px-4! py-2! text-[13px]!" @click="chooseMode(row.def)">出发</button>
          </div>
          <p class="mt-2 text-[11px] leading-relaxed text-ink-faint">
            <template v-if="row.unlocked">{{ row.def.desc }}</template>
            <template v-else>需先击败{{ prevRegionName(row.def) }}之主,方可踏足此地。</template>
          </p>
          <div v-if="row.unlocked && (row.chips.length || row.adaptation)" class="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              v-for="chip in row.chips"
              :key="chip.trait"
              class="chip-ink text-[10px]!"
              :class="chip.level >= 3 ? 'border-cinnabar/50 text-cinnabar' : 'border-ink/25 text-ink-faint'"
            >
              {{ chip.name }}·{{ ECO_LEVEL_NAMES[chip.level] }}
            </span>
            <span v-if="row.adaptation" class="ml-auto text-[10px] text-ink-soft tabular" :title="row.adaptation.reasons.join(';')">
              适配
              <span class="text-gold-ink">{{ starsText(row.adaptation.stars) }}</span>
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- 模式选择 + 战斗前预览 -->
    <BaseModal :open="modeTarget !== null" :title="modeTarget?.name ?? ''" @close="modeTarget = null">
      <!-- 适配预览 -->
      <div v-if="preview" class="mb-3 rounded-md bg-ink/4 px-3 py-2.5">
        <template v-if="preview.mine && currentBuild">
          <p class="flex items-center justify-between text-[12px]">
            <span class="text-ink-soft">
              当前构筑:
              <span class="font-kai text-ink">{{ currentBuild.displayName }}</span>
            </span>
            <span class="tabular text-gold-ink">{{ starsText(preview.mine.stars) }}</span>
          </p>
          <p v-for="(r, i) in preview.mine.reasons" :key="i" class="mt-0.5 text-[10px] text-ink-faint">{{ r }}</p>
        </template>
        <p v-else class="text-[11px] text-ink-faint">尚未成流派,此地对各路数一视同仁。</p>
        <div class="ink-divider my-2" />
        <p class="text-[10px] text-ink-faint">此地相性(机制契合度,并非胜率):</p>
        <p class="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
          <span v-for="rec in preview.recs" :key="rec.style.id" class="text-[11px] text-ink-soft tabular">
            {{ rec.style.name }}
            <span class="text-gold-ink">{{ starsText(rec.adaptation.stars) }}</span>
          </span>
        </p>
        <p class="mt-1.5 text-[10px] text-ink-ghost tabular">
          战力 {{ formatGN(player.finalStats.power) }} · 装备成色、词条与临场随机仍定成败
        </p>
      </div>
      <p class="text-[12px] text-ink-faint">此行欲作何打算?</p>
      <div class="mt-3 space-y-2">
        <button
          v-for="m in MODE_LIST"
          :key="m.id"
          class="flex w-full items-center justify-between rounded-lg border border-ink/20 px-4 py-3 text-left active:scale-98 active:bg-ink/5"
          @click="begin(m.id)"
        >
          <span>
            <span class="font-kai text-[14px] tracking-widest text-ink">{{ EXPLORE_MODES[m.id].name }}</span>
            <span class="ml-2 text-[11px]" :class="m.id === 'risky' ? 'text-cinnabar' : 'text-ink-faint'">{{ m.risk }}</span>
          </span>
          <span class="text-right text-[11px] text-ink-faint tabular">
            {{ formatDuration(EXPLORE_MODES[m.id].durationSec) }}
            <br />
            收益 ×{{ EXPLORE_MODES[m.id].rewardMult }}
          </span>
        </button>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import type { ExploreMode, RegionDef } from '@/types'
  import { useAdventureStore } from '@/stores/adventure'
  import { usePlayerStore } from '@/stores/player'
  import { REGIONS, regionDef, DANGER_NAMES } from '@/data/regions'
  import { REALMS } from '@/data/realms'
  import { EXPLORE_MODES } from '@/data/constants'
  import { startExploration } from '@/core/exploration'
  import { detectBuild } from '@/core/buildDetect'
  import { detectionAdaptation, ecologyChips, ECO_LEVEL_NAMES, recommendForRegion, regionEcology, starsText } from '@/core/buildAdvisor'
  import { formatDuration, formatGN } from '@/utils/format'
  import SectionTitle from '@/components/common/SectionTitle.vue'
  import GameIcon from '@/components/common/GameIcon.vue'
  import BaseModal from '@/components/common/BaseModal.vue'
  import CombatPanel from '@/components/adventure/CombatPanel.vue'

  const adventure = useAdventureStore()
  const player = usePlayerStore()

  const modeTarget = ref<RegionDef | null>(null)

  const MODE_LIST: { id: ExploreMode; risk: string }[] = [
    { id: 'normal', risk: '安稳' },
    { id: 'deep', risk: '小险' },
    { id: 'risky', risk: '大凶' }
  ]

  const currentBuild = computed(() => detectBuild(player.finalStats.mods))

  const regionRows = computed(() =>
    REGIONS.map(r => {
      const eco = regionEcology(r)
      return {
        def: r,
        unlocked: adventure.unlocked.includes(r.id),
        cleared: adventure.cleared.includes(r.id),
        tooHard: r.minRealm > player.major,
        // 第一层信息:只保留最强的两个生态标签
        chips: ecologyChips(eco).slice(0, 2),
        adaptation: currentBuild.value ? detectionAdaptation(currentBuild.value, eco) : null
      }
    })
  )

  /** 出发预览:当前构筑适配 + 推荐方向 */
  const preview = computed(() => {
    if (!modeTarget.value) return null
    const eco = regionEcology(modeTarget.value)
    const mine = currentBuild.value ? detectionAdaptation(currentBuild.value, eco) : null
    const recs = recommendForRegion(modeTarget.value).slice(0, 2)
    return { mine, recs }
  })

  /** 只展示到「第一个未解锁」为止再多一个,保持神秘感 */
  const visibleRows = computed(() => {
    const rows = regionRows.value
    const firstLocked = rows.findIndex(r => !r.unlocked)
    return firstLocked < 0 ? rows : rows.slice(0, firstLocked + 1)
  })

  function chooseMode(region: RegionDef): void {
    modeTarget.value = region
  }

  function begin(mode: ExploreMode): void {
    if (!modeTarget.value) return
    if (startExploration(modeTarget.value.id, mode)) {
      modeTarget.value = null
    }
  }

  function prevRegionName(r: RegionDef): string {
    return r.requireCleared ? (regionDef(r.requireCleared)?.name ?? '') : ''
  }
</script>
