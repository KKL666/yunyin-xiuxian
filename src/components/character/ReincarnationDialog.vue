<template>
  <!-- 死亡提示 -->
  <BaseModal :open="ui.deathDialog && !view" :closable="false">
    <div class="text-center">
      <p class="mt-2 font-kai text-2xl tracking-[0.4em] text-ink">寿元将尽</p>
      <p class="mt-3 text-[13px] leading-relaxed text-ink-soft">
        {{ player.name }}枯坐于蒲团之上,油尽灯枯。
        <br />
        此生行至 {{ Math.floor(player.age) }} 载,止步于{{ player.realmName }}。
        <br />
        所幸神魂不灭,尚可入轮回,再启仙途。
      </p>
    </div>
    <template #footer>
      <button class="btn-seal w-full" @click="beginRebirth">兵解转世</button>
    </template>
  </BaseModal>

  <!-- 转世抉择 -->
  <BaseModal :open="view !== null" :closable="false" title="轮回">
    <div v-if="view">
      <p class="text-[12px] leading-relaxed text-ink-soft">
        前尘散作云烟,唯道果与天赋随神魂不灭。
        <br />
        此番轮回凝得道果
        <span class="text-cinnabar tabular">{{ view.daoFruitGained }}</span>
        枚,来世修行更进一步。
      </p>
      <p class="mt-3 font-kai text-[13px] tracking-widest text-ink">择一先天之姿</p>
      <div class="mt-2 space-y-2">
        <button
          v-for="id in view.talentChoices"
          :key="id"
          class="w-full rounded-lg border px-3 py-2 text-left transition-all active:scale-98"
          :class="chosen === id ? 'border-cinnabar bg-cinnabar/5' : 'border-ink/20'"
          @click="chosen = id"
        >
          <p class="flex items-center gap-2">
            <span class="font-kai text-[14px]" :style="{ color: TALENT_GRADE_COLORS[talentDef(id)?.grade ?? 1] }">
              {{ talentDef(id)?.name }}
            </span>
            <span class="text-[10px] text-ink-faint">{{ TALENT_GRADE_NAMES[talentDef(id)?.grade ?? 1] }}</span>
          </p>
          <p class="mt-0.5 text-[11px] text-ink-faint">{{ talentDef(id)?.desc }}</p>
        </button>
      </div>
      <p v-if="view.extraTalents.length" class="mt-3 text-[11px] text-ink-faint">
        另有宿慧觉醒:
        <span v-for="id in view.extraTalents" :key="id" class="mr-2 font-kai text-gold-ink">{{ talentDef(id)?.name }}</span>
      </p>
    </div>
    <template #footer>
      <button class="btn-seal w-full" :disabled="!chosen" @click="confirm">踏入轮回</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useUiStore } from '@/stores/ui'
  import { usePlayerStore } from '@/stores/player'
  import { prepareReincarnation, confirmReincarnation } from '@/core/reincarnation'
  import { talentDef, TALENT_GRADE_COLORS, TALENT_GRADE_NAMES } from '@/data/talents'
  import { engine } from '@/core/engine'
  import { ref } from 'vue'
  import BaseModal from '@/components/common/BaseModal.vue'

  const ui = useUiStore()
  const player = usePlayerStore()
  const router = useRouter()

  const chosen = ref<string | null>(null)

  const view = computed(() => ui.reincarnation)

  function beginRebirth(): void {
    prepareReincarnation()
  }

  function confirm(): void {
    confirmReincarnation(chosen.value)
    chosen.value = null
    engine.resetDeathFlag()
    void router.push('/')
  }
</script>
