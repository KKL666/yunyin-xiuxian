/**
 * 存档服务 —— 导出 / 导入 / 重置 / 迁移
 */
import {
  applyImportPayload,
  buildExportPayload,
  clearAllSave,
  migrateInventorySlice,
  SAVE_VERSION,
  validateImportPayload,
  type ExportPayload
} from '@/utils/storage'
import { encryptSave, readSaveText } from '@/utils/crypto'
import { engine } from './engine'
import { saveAs } from 'file-saver'

/** 迁移旧版本存档(链式) */
function migrate(payload: ExportPayload): ExportPayload {
  const migrated = { ...payload, data: { ...payload.data } }
  if (migrated.version < 2 && typeof migrated.data.inventory === 'object' && migrated.data.inventory !== null) {
    migrated.data.inventory = migrateInventorySlice(migrated.data.inventory as Record<string, unknown>)
  }
  migrated.version = SAVE_VERSION
  return migrated
}

export function exportSaveText(): string {
  // 导出为密文,防手改;导入时兼容旧版明文 JSON
  return encryptSave(JSON.stringify(buildExportPayload()))
}

/** 触发浏览器下载存档文件 */
export function downloadSave(): void {
  const text = exportSaveText()
  const blob = new Blob([text], { type: 'application/json' })
  const stamp = new Date().toISOString().slice(0, 10)
  saveAs(blob, `yunyin-xiuxian-${stamp}.save`)
}

/** 导入存档文本(密文或旧版明文皆可);成功返回 null,失败返回错误信息 */
export function importSaveText(text: string): string | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(readSaveText(text.trim()))
  } catch {
    return '文件内容无法解析(既非本游戏密文,也非有效 JSON)'
  }
  const error = validateImportPayload(parsed)
  if (error) return error
  try {
    applyImportPayload(migrate(parsed as ExportPayload))
  } catch {
    return '写入存档失败,浏览器存储可能不可用'
  }
  return null
}

/**
 * 封存写盘:页面即将卸载时,丢弃一切后续 localStorage 写入。
 * persist 插件的 $subscribe 走 Vue 调度器(微任务批量刷盘)——清档/导入之后、卸载之前,
 * 排队中的持久化仍会执行并把内存状态回写进 localStorage(实测栈:persistState → flushJobs)。
 * 拦截 mutation 源头不可穷尽,直接在写盘层截断
 * 注意:必须在「导入写盘完成之后」调用——它会把 setItem 置为 noop,先调用会吞掉导入的写入
 */
export function sealStorageWrites(): void {
  try {
    Object.defineProperty(window.localStorage, 'setItem', { value: () => undefined, configurable: true })
  } catch {
    // 存储不可用时无事可做
  }
}

/**
 * 清空全部存档并回到首页。
 * 顺序:停引擎(去掉 beforeunload 写档)→ 封存写盘(丢弃排队刷盘)→ 清档 → 重载
 */
export function resetGame(): void {
  engine.stop()
  sealStorageWrites()
  clearAllSave()
  window.location.hash = '#/'
  window.location.reload()
}

/** 重载(导入存档后调用)。封存写盘,防止排队刷盘在卸载前覆盖刚导入的分片 */
export function reloadGame(): void {
  engine.stop()
  sealStorageWrites()
  // 直接落到主页:导入的存档 game.started=true,守卫对 home 放行;
  // 若导入异常(started 为 false),守卫仍会兜底转回 welcome
  window.location.hash = '#/'
  window.location.reload()
}
