/** 时间工具 */

export function now(): number {
  return Date.now()
}

/** 本地日期字符串,用于每日任务重置 */
export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
