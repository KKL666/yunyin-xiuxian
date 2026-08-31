<template>
  <button
    class="card-ink relative flex flex-col items-center gap-1 px-2 py-2.5 active:scale-95 transition-transform"
    :style="{ borderColor: quality.color + '66' }"
    @click="emit('open', props.item.uid)"
  >
    <span v-if="props.equipped" class="absolute left-1 top-1 text-[8px] text-jade font-kai">佩</span>
    <span v-if="props.item.locked" class="absolute right-1 top-1 text-ink-faint"><GameIcon name="lock" :size="9" /></span>
    <span class="grid h-9 w-9 place-items-center rounded-md" :style="{ color: quality.color, background: quality.color + '14' }">
      <GameIcon :name="template?.icon ?? 'sword'" :size="18" />
    </span>
    <span class="w-full truncate text-center font-kai text-[11px]" :style="{ color: quality.color }">
      {{ template?.name ?? '?' }}
    </span>
    <span class="text-[9px] text-ink-faint tabular">
      {{ quality.name }}
      <template v-if="props.item.level > 0">+{{ props.item.level }}</template>
    </span>
  </button>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { EquipmentInstance } from '@/types'
  import { equipmentTemplate } from '@/data/equipment'
  import { qualityDef } from '@/data/qualities'
  import GameIcon from '@/components/common/GameIcon.vue'

  const props = defineProps<{ item: EquipmentInstance; equipped?: boolean }>()
  const emit = defineEmits<{ open: [uid: string] }>()

  const template = computed(() => equipmentTemplate(props.item.templateId))
  const quality = computed(() => qualityDef(props.item.quality))
</script>
