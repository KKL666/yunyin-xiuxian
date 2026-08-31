<template>
  <BaseModal :open="def !== undefined" :title="def?.name ?? ''" @close="close">
    <div v-if="def">
      <div class="flex items-center gap-2">
        <QualityTag :quality="def.quality" />
        <span class="chip-ink border-ink/30 text-ink-soft">{{ GONGFA_TYPE_NAMES[def.type] }}</span>
        <span v-if="def.element" class="chip-ink" :style="{ color: ELEMENTS[def.element].color }">
          {{ ELEMENTS[def.element].name }}属性
        </span>
        <span v-if="learned" class="ml-auto tabular text-[12px] text-gold-ink">第 {{ level }}/{{ def.maxLevel }} 层</span>
      </div>
      <p class="mt-2 text-[12px] leading-relaxed text-ink-faint">{{ def.desc }}</p>
      <p v-if="def.minRealm > player.major" class="mt-1 text-[11px] text-cinnabar">需更高境界方可参悟其精义</p>
      <div class="ink-divider my-3" />
      <template v-if="learned">
        <div class="space-y-1.5">
          <p v-for="row in modRows" :key="row.label" class="flex justify-between text-[13px]">
            <span class="text-ink-soft">{{ row.label }}</span>
            <span class="tabular text-azure">{{ row.value }}</span>
          </p>
          <p v-if="def.skill" class="flex justify-between text-[13px]">
            <span class="text-ink-soft">附带神通「{{ def.skill.name }}」</span>
            <span class="tabular text-cinnabar">{{ Math.round(def.skill.mult * 100) }}% 威力</span>
          </p>
        </div>
        <p v-if="upCost" class="mt-3 text-right text-[11px] text-ink-faint tabular">
          进修需 悟道点×{{ upCost.wudao }} · 残页×{{ upCost.page }}
        </p>
      </template>
      <p v-else class="text-[12px] text-ink-faint">尚未习得此功法。</p>
    </div>
    <template v-if="learned" #footer>
      <div class="flex gap-2">
        <button v-if="def?.type === 'main'" class="btn-seal flex-1" :disabled="isMain" @click="setMain">
          {{ isMain ? '主修中' : '设为主修' }}
        </button>
        <button v-else class="btn-seal flex-1" @click="toggleSub">
          {{ isSub ? '卸下辅修' : '设为辅修' }}
        </button>
        <button v-if="upCost" class="btn-ghost flex-1" @click="def && upgradeGongfa(def.id)">进 修</button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useUiStore } from '@/stores/ui'
  import { useCultivationStore } from '@/stores/cultivation'
  import { useDongfuStore } from '@/stores/dongfu'
  import { usePlayerStore } from '@/stores/player'
  import { gongfaDef, GONGFA_TYPE_NAMES } from '@/data/gongfa'
  import { ELEMENTS } from '@/data/linggen'
  import { gongfaUpgradeCost, upgradeGongfa } from '@/core/gongfaService'
  import { gongfaModsAt } from '@/stores/cultivation'
  import { formatPercent } from '@/utils/format'
  import { STAT_NAMES } from '@/ui/statNames'
  import type { AnyStatKey } from '@/types'
  import BaseModal from '@/components/common/BaseModal.vue'
  import QualityTag from '@/components/common/QualityTag.vue'

  const ui = useUiStore()
  const cultivation = useCultivationStore()
  const dongfu = useDongfuStore()
  const player = usePlayerStore()

  const def = computed(() => (ui.gongfaDetailId ? gongfaDef(ui.gongfaDetailId) : undefined))
  const level = computed(() => (def.value ? (cultivation.learned[def.value.id] ?? 0) : 0))
  const learned = computed(() => level.value > 0)
  const upCost = computed(() => (def.value ? gongfaUpgradeCost(def.value.id) : null))

  const modRows = computed(() => {
    if (!def.value || !learned.value) return []
    const mods = gongfaModsAt(def.value.id, level.value)
    return Object.entries(mods).map(([k, v]) => ({
      label: STAT_NAMES[k as AnyStatKey] ?? k,
      value: `+${formatPercent(v as number)}`
    }))
  })

  const isMain = computed(() => def.value && cultivation.mainGongfa === def.value.id)
  const isSub = computed(() => def.value && cultivation.subGongfa.includes(def.value.id))

  function close(): void {
    ui.gongfaDetailId = null
  }

  function setMain(): void {
    if (def.value) cultivation.equipMain(def.value.id)
  }

  function toggleSub(): void {
    if (!def.value) return
    const ok = cultivation.toggleSub(def.value.id, dongfu.subGongfaSlots)
    if (!ok) ui.toast(`辅修栏已满(${dongfu.subGongfaSlots} 个,升级藏经阁可扩容)`, 'warn')
  }
</script>
