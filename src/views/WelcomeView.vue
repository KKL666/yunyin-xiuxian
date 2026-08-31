<template>
  <div class="stagger-in flex min-h-full flex-col items-center justify-center px-8 py-10">
    <!-- 游戏图标 -->
    <div class="grid h-24 w-24 place-items-center rounded-2xl bg-cinnabar shadow-lg shadow-cinnabar/30">
      <span class="font-kai text-[56px] leading-none text-paper">道</span>
    </div>

    <!-- 游戏名 -->
    <h1 class="mt-6 font-kai text-[40px] leading-tight tracking-[0.3em] text-ink">云隐修仙录</h1>
    <p class="mt-2 text-[12px] tracking-[0.5em] text-ink-faint">一念修行 · 云深不知处</p>

    <!-- 开始按钮 -->
    <button class="btn-seal mt-10 w-full max-w-72 py-3.5! text-[17px] tracking-[0.3em]" @click="onStart">开 始 游 戏</button>

    <!-- 底部:隐私政策入口 -->
    <button class="mt-6 text-[11px] text-ink-ghost active:text-ink-soft" @click="privacyOpen = true">《隐私政策》</button>

    <!-- 隐私政策全文 -->
    <PrivacyDialog :open="privacyOpen" @close="privacyOpen = false" />

    <!-- 开始前的同意确认 -->
    <BaseModal :open="agreeOpen" title="进入前请确认" :closable="false">
      <p class="text-[12px] leading-relaxed text-ink-faint">
        游戏数据仅保存在你的浏览器本地,不上传服务器、不接入第三方统计。继续游玩前,请阅读并同意隐私政策。
      </p>
      <label class="mt-3 flex items-center gap-2">
        <input v-model="agreed" type="checkbox" class="h-4 w-4 accent-cinnabar" />
        <span class="text-[12px] text-ink-soft">
          我已阅读并同意
          <button class="text-azure" @click.prevent="privacyOpen = true">《隐私政策》</button>
        </span>
      </label>
      <template #footer>
        <div class="flex gap-2">
          <button class="btn-ghost flex-1" @click="agreeOpen = false">再想想</button>
          <button class="btn-seal flex-1" :disabled="!agreed" @click="confirmStart">同意并开始</button>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useSettingsStore } from '@/stores/settings'
  import BaseModal from '@/components/common/BaseModal.vue'
  import PrivacyDialog from '@/components/common/PrivacyDialog.vue'

  const router = useRouter()
  const settings = useSettingsStore()

  const privacyOpen = ref(false)
  const agreeOpen = ref(false)
  const agreed = ref(false)

  function onStart(): void {
    if (settings.privacyAccepted) {
      void router.push('/create')
      return
    }
    agreeOpen.value = true
  }

  function confirmStart(): void {
    settings.privacyAccepted = true
    agreeOpen.value = false
    void router.push('/create')
  }
</script>
