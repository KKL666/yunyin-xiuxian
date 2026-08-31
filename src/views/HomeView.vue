<template>
  <div class="stagger-in space-y-4 px-4 pb-6 pt-4">
    <!-- 人物水墨主视觉 -->
    <div class="card-ink relative overflow-hidden px-4 pb-4 pt-5">
      <!-- 远山 -->
      <svg class="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-ink/8" viewBox="0 0 400 110" preserveAspectRatio="none">
        <path
          class="drift-far"
          d="M0 110 L60 40 Q80 20 100 45 L150 95 L200 30 Q215 12 235 38 L300 100 L340 55 Q355 38 372 60 L400 90 L400 110 Z"
          fill="currentColor"
        />
        <path
          class="drift-near"
          d="M0 110 L40 80 L110 105 L180 70 L260 108 L330 80 L400 105 L400 110 Z"
          fill="currentColor"
          opacity="0.6"
        />
      </svg>
      <div class="relative z-10 flex items-start justify-between">
        <div>
          <h1 class="font-kai text-[26px] tracking-[0.2em] text-ink">{{ player.name }}</h1>
          <p class="mt-1 flex items-center gap-2">
            <span class="chip-ink border-cinnabar/60 font-kai text-cinnabar">{{ player.realmName }}</span>
            <span v-if="player.reincarnation.count > 0" class="chip-ink border-violet-ink/50 text-violet-ink">
              {{ player.reincarnation.count }} 世
            </span>
          </p>
          <p class="mt-2 text-[11px] text-ink-faint tabular">
            {{ Math.floor(player.age) }} 岁 / 寿元 {{ formatYears(player.lifespanMax) }}
          </p>
          <p class="mt-0.5 text-[11px]" :class="player.lifespanRatio < 0.15 ? 'text-cinnabar' : 'text-ink-faint'">
            {{ statusText }}
          </p>
        </div>
        <!-- 打坐人影 · 灵气法阵环绕 -->
        <div class="relative mr-1 mt-1 h-24 w-20">
          <span class="qi-ring inset-x-0 top-6 bottom-1 text-azure/35 animate-spin-slow" />
          <span class="qi-ring -inset-x-2 top-4 -bottom-1 text-cinnabar/20 animate-spin-slower" />
          <svg class="relative h-24 w-20 text-ink/70 animate-breathe" viewBox="0 0 80 100">
            <circle cx="40" cy="26" r="11" fill="currentColor" />
            <path
              d="M40 38 Q18 44 14 74 Q13 80 20 80 L26 80 Q20 88 30 89 L50 89 Q60 88 54 80 L60 80 Q67 80 66 74 Q62 44 40 38 Z"
              fill="currentColor"
            />
            <path d="M12 84 Q40 76 68 84 Q40 92 12 84 Z" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
      </div>
    </div>

    <!-- 天界入口(真仙) -->
    <RouterLink
      v-if="player.major >= 9"
      to="/celestial"
      class="card-ink flex items-center gap-3 border-cinnabar/40 px-4 py-3 active:scale-99"
    >
      <span class="grid h-9 w-9 place-items-center rounded-md bg-cinnabar/90 font-kai text-[17px] text-paper animate-breathe">天</span>
      <span class="min-w-0 grow">
        <span class="block font-kai text-[14px] tracking-[0.25em] text-ink">天界已开</span>
        <span class="block text-[10px] text-ink-faint">道途 · 特殊世界 · 天道熔炉 · 试炼 · 道痕</span>
      </span>
      <span class="text-[11px] text-cinnabar">踏天 →</span>
    </RouterLink>

    <!-- 修炼状态 -->
    <div class="card-ink px-4 py-3.5">
      <div class="flex items-baseline justify-between">
        <p class="font-kai text-[13px] tracking-[0.25em] text-ink-soft">《{{ mainGongfaName }}》运转中</p>
        <RouterLink v-if="player.expFull" to="/cultivation" class="font-kai text-[12px] text-cinnabar animate-breathe">可突破 →</RouterLink>
      </div>
      <div class="mt-3 space-y-3">
        <div>
          <div class="mb-1 flex justify-between text-[11px] text-ink-faint tabular">
            <span>修为</span>
            <span>{{ formatGN(player.exp) }} / {{ formatGN(player.expReq) }} · +{{ formatRate(player.cultPerSec) }}</span>
          </div>
          <ProgressBar :value="player.expProgress" color="var(--color-cinnabar)" :height="7" />
        </div>
        <div>
          <div class="mb-1 flex justify-between text-[11px] text-ink-faint tabular">
            <span>灵气</span>
            <span>
              {{ formatNum(Math.floor(resources.qi)) }} / {{ formatNum(player.qiCapValue) }} · +{{ formatRate(player.qiRegenPerSec) }}
            </span>
          </div>
          <ProgressBar :value="resources.qi / Math.max(1, player.qiCapValue)" color="var(--color-azure)" :height="7" />
        </div>
      </div>
    </div>

    <!-- 材料一览 -->
    <div class="card-ink flex justify-between px-4 py-2.5">
      <div v-for="m in materials" :key="m.name" class="flex flex-col items-center gap-0.5" :title="m.name">
        <GameIcon :name="m.icon" :size="15" class="text-ink-faint" />
        <span class="tabular text-[11px] text-ink-soft">{{ formatNum(m.value) }}</span>
      </div>
    </div>

    <!-- 修行志(任务) -->
    <section>
      <SectionTitle title="修行志" />
      <div class="card-ink mt-2 px-4 py-3">
        <template v-if="mainQuest">
          <p class="flex items-center justify-between">
            <span class="font-kai text-[13px] tracking-wider text-ink">{{ mainQuest.name }}</span>
            <span class="text-[10px] text-ink-faint">主线 {{ quests.mainIdx + 1 }}/{{ MAIN_QUESTS.length }}</span>
          </p>
          <p class="mt-0.5 text-[11px] text-ink-faint">{{ mainQuest.desc }}(达成后自动领赏)</p>
        </template>
        <p v-else class="text-[12px] text-ink-faint">主线已尽,前路由你自己书写。</p>
        <div class="ink-divider my-2.5" />
        <div class="space-y-1.5">
          <p v-for="t in dailyRows" :key="t.id" class="flex items-center justify-between text-[12px]">
            <span :class="t.done ? 'text-ink-ghost line-through' : 'text-ink-soft'">{{ t.desc }}</span>
            <span class="tabular text-[11px]" :class="t.done ? 'text-jade' : 'text-ink-faint'">
              {{ t.done ? '已成' : `${t.progress}/${t.target}` }}
            </span>
          </p>
        </div>
      </div>
    </section>

    <!-- 洞府建筑 -->
    <section>
      <SectionTitle title="洞府" hint="经营家业,道途更稳" />
      <div class="mt-2 grid grid-cols-2 gap-2.5">
        <BuildingCard v-for="def in BUILDINGS" :key="def.id" :def="def" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { usePlayerStore } from '@/stores/player'
  import { useResourcesStore } from '@/stores/resources'
  import { useAdventureStore } from '@/stores/adventure'
  import { useCultivationStore } from '@/stores/cultivation'
  import { useQuestsStore } from '@/stores/quests'
  import { BUILDINGS } from '@/data/buildings'
  import { DAILY_TASKS, MAIN_QUESTS } from '@/data/quests'
  import { gongfaDef } from '@/data/gongfa'
  import { formatGN, formatNum, formatRate, formatYears } from '@/utils/format'
  import SectionTitle from '@/components/common/SectionTitle.vue'
  import ProgressBar from '@/components/common/ProgressBar.vue'
  import GameIcon from '@/components/common/GameIcon.vue'
  import BuildingCard from '@/components/dongfu/BuildingCard.vue'

  const player = usePlayerStore()
  const resources = useResourcesStore()
  const adventure = useAdventureStore()
  const cultivation = useCultivationStore()
  const quests = useQuestsStore()

  const statusText = computed(() => {
    if (player.dead) return '陨落'
    if (adventure.sessionActive) return `历练中 · ${adventure.currentRegion?.name ?? ''}`
    if (cultivation.hasBuff('injury')) return '疗伤中'
    return '闭关修炼中'
  })

  const mainGongfaName = computed(() => (cultivation.mainGongfa ? (gongfaDef(cultivation.mainGongfa)?.name ?? '无名功法') : '未修功法'))

  const mainQuest = computed(() => MAIN_QUESTS[quests.mainIdx])

  const dailyRows = computed(() =>
    DAILY_TASKS.map(t => ({
      ...t,
      progress: Math.min(t.target, quests.dailyDelta(t.counterKey)),
      done: quests.daily.done.includes(t.id)
    }))
  )

  const materials = computed(() => [
    { icon: 'leaf', name: '灵草', value: resources.herb },
    { icon: 'mountain', name: '玄铁', value: resources.ore },
    { icon: 'scroll', name: '残页', value: resources.page },
    { icon: 'sparkles', name: '器灵尘', value: resources.dust },
    { icon: 'book', name: '悟道点', value: resources.wudao }
  ])
</script>
