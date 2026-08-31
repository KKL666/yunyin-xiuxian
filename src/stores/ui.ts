/** 瞬态 UI 状态 —— Toast / 各类 Modal(不持久化) */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { OfflineSummary } from '@/types'

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'success' | 'warn' | 'rare'
}

export interface BreakthroughView {
  success: boolean
  fromLabel: string
  toLabel: string
  isMajor: boolean
  tribulationLog: string[]
  message: string
}

export interface ReincarnationView {
  daoFruitGained: number
  talentChoices: string[]
  extraTalents: string[]
  prevRealmLabel: string
}

let toastSeq = 1

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const offlineSummary = ref<OfflineSummary | null>(null)
  const breakthrough = ref<BreakthroughView | null>(null)
  const equipDetailUid = ref<string | null>(null)
  const artifactDetailId = ref<string | null>(null)
  const gongfaDetailId = ref<string | null>(null)
  const buffDetailId = ref<string | null>(null)
  const deathDialog = ref(false)
  const reincarnation = ref<ReincarnationView | null>(null)
  const corruptedNotice = ref<string[]>([])

  function toast(text: string, kind: Toast['kind'] = 'info'): void {
    const id = toastSeq
    toastSeq += 1
    toasts.value = [...toasts.value.slice(-4), { id, text, kind }]
    const ttl = kind === 'rare' ? 4200 : 2600
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, ttl)
  }

  return {
    toasts,
    offlineSummary,
    breakthrough,
    equipDetailUid,
    artifactDetailId,
    gongfaDetailId,
    buffDetailId,
    deathDialog,
    reincarnation,
    corruptedNotice,
    toast
  }
})
