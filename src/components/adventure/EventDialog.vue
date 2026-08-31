<template>
  <BaseModal :open="open" :closable="false" :title="result ? '际遇' : (def?.title ?? '际遇')">
    <!-- 抉择阶段 -->
    <template v-if="!result && def">
      <p class="text-[13px] leading-relaxed text-ink-soft">{{ def.text }}</p>
      <div class="mt-4 space-y-2">
        <button
          v-for="(choice, idx) in def.choices"
          :key="idx"
          class="w-full rounded-lg border px-4 py-2.5 text-left font-kai text-[14px] tracking-widest transition-all"
          :class="choiceAvailable(choice, tier) ? 'border-ink/25 text-ink active:scale-98 active:bg-ink/5' : 'border-ink/10 text-ink-ghost'"
          :disabled="!choiceAvailable(choice, tier)"
          @click="choose(idx)"
        >
          {{ choice.label }}
          <span v-if="choice.hint" class="ml-2 text-[11px] font-normal text-ink-faint">{{ choice.hint }}</span>
        </button>
      </div>
    </template>
    <!-- 结果阶段 -->
    <template v-else-if="result">
      <p class="text-[13px] leading-relaxed text-ink-soft animate-ink-pop">{{ result.outcomeText }}</p>
      <ul v-if="result.lines.length" class="mt-3 space-y-1.5">
        <li v-for="(line, i) in result.lines" :key="i" class="rounded bg-paper-deep/70 px-3 py-1.5 text-[12px] text-ink tabular">
          {{ line }}
        </li>
      </ul>
    </template>
    <template v-if="result" #footer>
      <button class="btn-seal w-full" @click="finish">继续赶路</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useAdventureStore } from '@/stores/adventure'
  import { eventDef } from '@/data/events'
  import { choiceAvailable, resolveEventChoice, type EventResolution } from '@/core/eventEngine'
  import { afterEventResolved } from '@/core/exploration'
  import BaseModal from '@/components/common/BaseModal.vue'

  const adventure = useAdventureStore()

  const result = ref<EventResolution | null>(null)

  const def = computed(() => (adventure.pendingEventId ? eventDef(adventure.pendingEventId) : undefined))
  const tier = computed(() => adventure.currentRegion?.tier ?? 1)
  const open = computed(() => def.value !== undefined || result.value !== null)

  function choose(idx: number): void {
    if (!def.value) return
    const choice = def.value.choices[idx]
    if (!choice || !choiceAvailable(choice, tier.value)) return
    result.value = resolveEventChoice(def.value, idx, tier.value)
    afterEventResolved(Date.now())
  }

  function finish(): void {
    result.value = null
  }
</script>
