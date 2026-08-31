/** 丹药库 —— 30 种,可炼制或掉落 */
import type { PillDef, QualityId } from '@/types'

function p(
  id: string,
  name: string,
  quality: QualityId,
  minRealm: number,
  desc: string,
  body: Partial<Pick<PillDef, 'kind' | 'instant' | 'buffId' | 'recipe' | 'alchemyLevel'>>,
  icon = 'flask'
): PillDef {
  return {
    id,
    name,
    quality,
    minRealm,
    desc,
    icon,
    kind: body.kind ?? 'instant',
    instant: body.instant,
    buffId: body.buffId,
    recipe: body.recipe,
    alchemyLevel: body.alchemyLevel
  }
}

export const PILLS: PillDef[] = [
  // ---- 可炼制 ----
  p('p_jvqisan', '聚气散', 'mortal', 0, '最粗浅的灵药,聊胜于无', {
    instant: { expFixed: 30 },
    recipe: { herb: 4, stoneBase: 8 },
    alchemyLevel: 1
  }),
  p('p_jvqidan', '聚气丹', 'fine', 0, '服之灵气涌动,修为小进', {
    instant: { expFixed: 80 },
    recipe: { herb: 8, stoneBase: 15 },
    alchemyLevel: 1
  }),
  p('p_huichun', '回灵丹', 'fine', 0, '回复五成灵气', { instant: { qiPct: 0.5 }, recipe: { herb: 6, stoneBase: 10 }, alchemyLevel: 1 }),
  p(
    'p_wudaocha',
    '悟道茶',
    'fine',
    0,
    '以灵茶入道,战斗中所悟更多',
    { kind: 'buff', buffId: 'buff_wudao', recipe: { herb: 8, stoneBase: 12 }, alchemyLevel: 2 },
    'leaf'
  ),
  p('p_ningshen', '凝神丹', 'fine', 0, '突破前服用,心神凝定', {
    kind: 'buff',
    buffId: 'buff_ningshen',
    recipe: { herb: 10, stoneBase: 18 },
    alchemyLevel: 2
  }),
  p('p_juling', '聚灵丹', 'excellent', 0, '半个时辰内修炼倍增', {
    kind: 'buff',
    buffId: 'buff_juling',
    recipe: { herb: 14, stoneBase: 25 },
    alchemyLevel: 2
  }),
  p('p_zhanling', '战灵丹', 'excellent', 1, '战意沸腾,攻防俱增', {
    kind: 'buff',
    buffId: 'buff_zhanli',
    recipe: { herb: 16, stoneBase: 30 },
    alchemyLevel: 3
  }),
  p('p_huxin', '护心丹', 'excellent', 1, '护住心脉,减免伤害', {
    kind: 'buff',
    buffId: 'buff_huxin',
    recipe: { herb: 16, stoneBase: 30 },
    alchemyLevel: 3
  }),
  p('p_shenxing', '神行丹', 'excellent', 1, '脚下生风,历练如飞', {
    kind: 'buff',
    buffId: 'buff_shenxing',
    recipe: { herb: 18, stoneBase: 32 },
    alchemyLevel: 3
  }),
  p('p_pojing', '破境丹', 'spirit', 1, '冲击境界的至宝,机不可失', {
    kind: 'buff',
    buffId: 'buff_pojing',
    recipe: { herb: 30, stoneBase: 60 },
    alchemyLevel: 4
  }),
  p('p_xuanyuan', '玄元丹', 'spirit', 2, '玄元之气化入丹中,修为大进', {
    instant: { expReqPct: 0.12 },
    recipe: { herb: 24, stoneBase: 45 },
    alchemyLevel: 4
  }),
  p('p_jingang', '金刚液', 'spirit', 2, '服之肉身坚若金刚', {
    kind: 'buff',
    buffId: 'buff_jingang',
    recipe: { herb: 26, stoneBase: 48 },
    alchemyLevel: 4
  }),
  p('p_tianyun', '天运丹', 'spirit', 3, '窃一缕天运,福泽加身', {
    kind: 'buff',
    buffId: 'buff_tianyun',
    recipe: { herb: 30, stoneBase: 55 },
    alchemyLevel: 5
  }),
  p('p_xuanming', '玄冥护体丹', 'spirit', 3, '渡劫前服用,可抵雷霆', {
    kind: 'buff',
    buffId: 'buff_xuanming',
    recipe: { herb: 32, stoneBase: 60 },
    alchemyLevel: 5
  }),
  p('p_yanshou', '延寿丹', 'spirit', 2, '延寿三十载', {
    instant: { lifespanYears: 30 },
    recipe: { herb: 40, stoneBase: 80 },
    alchemyLevel: 5
  }),
  p('p_dahuan', '大还丹', 'profound', 4, '起死人肉白骨,修为暴涨', {
    instant: { expReqPct: 0.2 },
    recipe: { herb: 50, stoneBase: 100 },
    alchemyLevel: 6
  }),
  p('p_wudaodan', '悟道丹', 'profound', 3, '服之如聆道音,悟道点 +20', {
    instant: { wudao: 20 },
    recipe: { herb: 45, stoneBase: 90 },
    alchemyLevel: 6
  }),
  p('p_qianshou', '千年延寿丹', 'profound', 4, '延寿两百载', {
    instant: { lifespanYears: 200 },
    recipe: { herb: 80, stoneBase: 160 },
    alchemyLevel: 7
  }),
  p('p_taixu', '太虚丹', 'earth', 5, '丹成有太虚幻境相随', {
    instant: { expReqPct: 0.25 },
    recipe: { herb: 90, stoneBase: 200 },
    alchemyLevel: 8
  }),
  p('p_wanshou', '万寿金丹', 'earth', 6, '延寿千载,金丹光华内蕴', {
    instant: { lifespanYears: 1000 },
    recipe: { herb: 150, stoneBase: 350 },
    alchemyLevel: 9
  }),
  p('p_jiuzhuan', '九转还魂丹', 'heaven', 7, '九转丹成,天地同贺', {
    instant: { expReqPct: 0.3 },
    recipe: { herb: 200, stoneBase: 500 },
    alchemyLevel: 10
  }),
  p('p_gangqisan', '罡气散', 'excellent', 1, '服之罡气环身,盾出伤随', {
    kind: 'buff',
    buffId: 'buff_gangdun',
    recipe: { herb: 18, stoneBase: 35 },
    alchemyLevel: 3
  }),
  p('p_pofudan', '破釜丹', 'spirit', 2, '断却生路,方见杀机', {
    kind: 'buff',
    buffId: 'buff_pofu',
    recipe: { herb: 28, stoneBase: 50 },
    alchemyLevel: 4
  }),
  // ---- 仅掉落 / 事件 ----
  p('p_yaoxue', '妖血丹', 'fine', 1, '以妖血炼成,药力狂暴', { instant: { expFixed: 100 } }),
  p('p_lingru', '灵乳', 'excellent', 0, '钟乳灵液,灵气充盈', { instant: { qiPct: 1 } }, 'droplets'),
  p('p_leiling', '雷灵丹', 'spirit', 3, '蕴含雷灵之力,战意勃发', { kind: 'buff', buffId: 'buff_zhanli' }, 'zap'),
  p('p_fengsui', '凤髓膏', 'profound', 4, '凤髓所炼,延寿百载', { instant: { lifespanYears: 100 } }, 'flame'),
  p('p_longqi', '龙气丹', 'profound', 4, '一缕真龙之气,修为大涨', { instant: { expReqPct: 0.18 } }),
  p('p_xianchen', '仙尘散', 'earth', 6, '仙人遗蜕所化之尘,悟道点 +50', { instant: { wudao: 50 } }, 'star'),
  p('p_pantao', '蟠桃', 'earth', 5, '瑶池灵桃,延寿五百载', { instant: { lifespanYears: 500 } }, 'leaf'),
  p('p_zaohua', '造化丹', 'heaven', 5, '服之道韵加身', { kind: 'buff', buffId: 'bless_daoyun' }, 'star'),
  p('p_hundun', '混沌丹', 'immortal', 8, '混沌初分时的一缕本源', { instant: { expReqPct: 0.35 } })
]

const BY_ID = new Map(PILLS.map(x => [x.id, x]))

export function pillDef(id: string): PillDef | undefined {
  return BY_ID.get(id)
}
