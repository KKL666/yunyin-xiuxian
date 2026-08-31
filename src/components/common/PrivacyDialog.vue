<template>
  <BaseModal :open="open" title="隐私政策" top @close="emit('close')">
    <div class="space-y-3 text-[12px] leading-relaxed">
      <section>
        <h4 class="mb-0.5 font-kai text-[13px] text-ink">一、简介</h4>
        <p class="text-ink-faint">《云隐修仙录》是一款纯单机网页游戏。我们尊重并保护你的隐私,本政策说明游戏如何处理你的数据。</p>
      </section>
      <section>
        <h4 class="mb-0.5 font-kai text-[13px] text-ink">二、数据收集</h4>
        <p class="mb-1 text-ink-faint">游戏仅在你的浏览器本地保存以下数据:</p>
        <ul class="ml-3 list-disc space-y-0.5 text-ink-faint">
          <li>游戏进度(角色、境界、装备、成就等)</li>
          <li>游戏设置(音量、动效、战报速度等)</li>
        </ul>
      </section>
      <section>
        <h4 class="mb-0.5 font-kai text-[13px] text-ink">三、数据存储</h4>
        <p class="text-ink-faint">
          所有数据仅存储在你的浏览器 localStorage 中,不会上传到任何服务器。清除浏览器缓存会删除存档,请在设置中定期导出备份。
        </p>
      </section>
      <section>
        <h4 class="mb-0.5 font-kai text-[13px] text-ink">四、无服务器通信</h4>
        <p class="text-ink-faint">游戏运行不需要联网,不与任何服务器通信,不发送任何统计或遥测数据。</p>
      </section>
      <section>
        <h4 class="mb-0.5 font-kai text-[13px] text-ink">五、第三方服务</h4>
        <p class="text-ink-faint">游戏不接入任何第三方统计、广告或追踪服务。</p>
      </section>
      <section>
        <h4 class="mb-0.5 font-kai text-[13px] text-ink">六、数据控制</h4>
        <p class="mb-1 text-ink-faint">你对自己的数据拥有完全控制权:</p>
        <ul class="ml-3 list-disc space-y-0.5 text-ink-faint">
          <li>随时在设置中导出存档文件</li>
          <li>随时导入之前导出的存档</li>
          <li>随时在设置中清空全部数据</li>
        </ul>
      </section>
      <section>
        <h4 class="mb-0.5 font-kai text-[13px] text-ink">七、联系我们</h4>
        <p class="text-ink-faint">
          若有疑问,可通过
          <a href="https://github.com/setube/yunyin-xiuxian/issues" target="_blank" rel="noopener noreferrer" class="text-azure">
            GitHub Issues
          </a>
          反馈。
        </p>
      </section>
    </div>
    <template #footer>
      <button class="btn-seal w-full" @click="emit('close')">知道了</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
  import BaseModal from '@/components/common/BaseModal.vue'

  defineProps<{ open: boolean }>()

  const emit = defineEmits<{ close: [] }>()
</script>
