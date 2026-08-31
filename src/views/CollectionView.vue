<template>
  <div class="stagger-in space-y-4 px-4 pb-6 pt-4">
    <!-- 页签 -->
    <InkTabs v-model="tab" :tabs="TABS" />

    <!-- 成就 -->
    <template v-if="tab === 'achievement'">
      <SectionTitle title="成就" :hint="`${quests.achieved.length}/${ACHIEVEMENTS.length}`" />
      <div class="card-ink divide-y divide-ink/6 px-4">
        <div v-for="row in achievementRows" :key="row.def.id" class="flex items-center gap-3 py-2.5">
          <span
            class="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-kai"
            :class="row.done ? 'border-gold-ink text-gold-ink' : 'border-ink/15 text-ink-ghost'"
          >
            {{ row.done ? '成' : '未' }}
          </span>
          <div class="min-w-0">
            <p class="font-kai text-[12px]" :class="row.done ? 'text-ink' : 'text-ink-faint'">{{ row.def.name }}</p>
            <p class="truncate text-[10px] text-ink-ghost">{{ row.def.desc }}</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 收藏图鉴 -->
    <template v-else>
      <section v-for="cat in collectionCats" :key="cat.key">
        <SectionTitle :title="cat.name" :hint="`${cat.have}/${cat.total}`" />
        <div class="card-ink mt-2 flex flex-wrap gap-1.5 px-3.5 py-3">
          <template v-for="entry in cat.entries" :key="entry.id">
            <button v-if="entry.owned" class="chip-ink active:scale-95" :style="{ color: entry.color }" @click="openDetail(cat, entry)">
              {{ entry.name }}
            </button>
            <span v-else class="chip-ink border-ink/15 text-ink-ghost" title="尚未收录">???</span>
          </template>
        </div>
      </section>
      <p class="text-center text-[10px] text-ink-ghost">点已收录的条目可查看详情与收录时间</p>
    </template>

    <!-- 图鉴详情 -->
    <BaseModal :open="detail !== null" :title="detail?.entry.name ?? ''" @close="detail = null">
      <div v-if="detail">
        <p class="flex flex-wrap items-center gap-2">
          <span class="chip-ink border-current" :style="{ color: detail.entry.color ?? 'var(--color-ink-soft)' }">
            {{ detail.catName }}
          </span>
          <span v-if="detail.entry.meta" class="text-[11px] text-ink-faint">{{ detail.entry.meta }}</span>
        </p>
        <p class="mt-3 text-[13px] leading-relaxed text-ink-soft">{{ detail.entry.desc || '此物玄妙,难以言表。' }}</p>
        <div class="ink-divider my-3" />
        <p class="flex justify-between text-[11px]">
          <span class="text-ink-faint">收录时间</span>
          <span class="tabular text-ink-soft">{{ detail.time }}</span>
        </p>
      </div>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useQuestsStore } from '@/stores/quests'
  import type { CollectionCategory } from '@/stores/quests'
  import { ACHIEVEMENTS } from '@/data/achievements'
  import { EQUIPMENT_TEMPLATES, EQUIP_SLOT_NAMES } from '@/data/equipment'
  import { GONGFA } from '@/data/gongfa'
  import { PILLS } from '@/data/pills'
  import { ARTIFACTS } from '@/data/artifacts'
  import { PETS } from '@/data/pets'
  import { EVENTS } from '@/data/events'
  import { TALENTS, TALENT_GRADE_COLORS } from '@/data/talents'
  import { qualityDef } from '@/data/qualities'
  import SectionTitle from '@/components/common/SectionTitle.vue'
  import InkTabs from '@/components/common/InkTabs.vue'
  import BaseModal from '@/components/common/BaseModal.vue'

  const quests = useQuestsStore()

  type Tab = 'achievement' | 'collection'
  const tab = ref<Tab>('achievement')
  const TABS: { id: Tab; label: string }[] = [
    { id: 'achievement', label: '成就' },
    { id: 'collection', label: '收藏' }
  ]

  const achievementRows = computed(() =>
    ACHIEVEMENTS.filter(a => !a.hidden || quests.hasAchieved(a.id))
      .map(a => ({ def: a, done: quests.hasAchieved(a.id) }))
      .sort((a, b) => Number(b.done) - Number(a.done))
  )

  interface CatEntry {
    id: string
    name: string
    desc: string
    /** 一行补充信息(部位/品质等) */
    meta: string
    color?: string
    owned: boolean
  }

  interface Cat {
    key: CollectionCategory
    name: string
    have: number
    total: number
    entries: CatEntry[]
  }

  function makeCat(
    key: CollectionCategory,
    name: string,
    ownedIds: string[],
    defs: { id: string; name: string; desc?: string; meta?: string; color?: string }[]
  ): Cat {
    const owned = new Set(ownedIds)
    const entries = defs
      .map(d => ({ id: d.id, name: d.name, desc: d.desc ?? '', meta: d.meta ?? '', color: d.color, owned: owned.has(d.id) }))
      .sort((a, b) => Number(b.owned) - Number(a.owned))
    return { key, name, have: ownedIds.length, total: defs.length, entries }
  }

  const collectionCats = computed<Cat[]>(() => {
    const c = quests.collections
    return [
      makeCat(
        'equip',
        '装备图鉴',
        c.equip,
        EQUIPMENT_TEMPLATES.map(t => ({
          id: t.id,
          name: t.name,
          desc: t.desc,
          meta: `${EQUIP_SLOT_NAMES[t.slot]} · ${t.minTier} 阶起现世`
        }))
      ),
      makeCat(
        'gongfa',
        '功法阁',
        c.gongfa,
        GONGFA.map(g => ({ id: g.id, name: g.name, desc: g.desc, meta: qualityDef(g.quality).name, color: qualityDef(g.quality).color }))
      ),
      makeCat(
        'pill',
        '丹方录',
        c.pill,
        PILLS.map(p => ({ id: p.id, name: p.name, desc: p.desc, meta: qualityDef(p.quality).name, color: qualityDef(p.quality).color }))
      ),
      makeCat(
        'artifact',
        '法宝谱',
        c.artifact,
        ARTIFACTS.map(a => ({
          id: a.id,
          name: a.name,
          desc: a.desc,
          meta: `${qualityDef(a.quality).name} · 神通「${a.active.name}」`,
          color: qualityDef(a.quality).color
        }))
      ),
      makeCat(
        'pet',
        '灵兽册',
        c.pet,
        PETS.map(p => ({ id: p.id, name: p.name, desc: p.desc, meta: qualityDef(p.quality).name, color: qualityDef(p.quality).color }))
      ),
      makeCat(
        'event',
        '见闻志',
        c.event,
        EVENTS.map(e => ({ id: e.id, name: e.title, desc: e.text, meta: '历练际遇' }))
      ),
      makeCat(
        'talent',
        '天赋鉴',
        c.talent,
        TALENTS.map(t => ({ id: t.id, name: t.name, desc: t.desc, meta: '先天之姿', color: TALENT_GRADE_COLORS[t.grade] }))
      )
    ]
  })

  // ---- 详情弹窗 ----
  const detail = ref<{ catName: string; entry: CatEntry; time: string } | null>(null)

  function openDetail(cat: Cat, entry: CatEntry): void {
    const ts = quests.collectedAt[`${cat.key}:${entry.id}`]
    const time =
      ts !== undefined
        ? new Date(ts).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '早年收录,未记时日'
    detail.value = { catName: cat.name, entry, time }
  }
</script>
