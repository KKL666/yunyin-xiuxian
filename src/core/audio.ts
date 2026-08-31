/**
 * 音频引擎 —— Tone.js + 真实乐器采样(FluidR3 音源,本地文件,纯单机)
 * 背景乐:D 宫调式主题曲《云隐》,52 BPM——
 *   古筝(筝采样)主旋律级进为主、句尾长音;琵琶对答与轮指;
 *   四五度叠置和声垫轻铺;低音长持续弱存在;副歌隔小节一记太鼓藏于混响
 * 音效:真实木鱼 / 钟琴 / 管钟 / 太鼓 / 古筝刮奏
 * Tone.js 与采样均按需加载:主包不含引擎,测试环境(无 AudioContext)天然免疫;
 * 浏览器自动播放策略:必须在首次用户交互后 unlockAudio() 才会出声
 */
import type * as ToneNS from 'tone'

export type SfxName = 'click' | 'success' | 'warn' | 'info' | 'rare' | 'win' | 'lose' | 'breakthrough' | 'fail'

export interface AudioPrefs {
  musicOn: boolean
  sfxOn: boolean
  /** 0~1 */
  musicVol: number
  /** 0~1 */
  sfxVol: number
}

const prefs: AudioPrefs = { musicOn: true, sfxOn: true, musicVol: 0.5, sfxVol: 0.7 }

const BPM = 52
/** 前奏 4 + 主歌 8 + 副歌 8 + 尾声 4 = 24 小节曲体,再留 2 小节混响余韵 */
const LOOP_END = '26:0:0'

type NoteEvent = [time: string, note: string, dur: string]
type ChordEvent = [time: string, notes: string[], dur: string]

/**
 * 古筝主旋律(D 宫调式,级进为主):
 * 前奏疏朗铺陈 → 主歌中音区叙事 → 副歌级进登高、长音收句 → 尾声下行送归,收于宫
 */
const MELODY: NoteEvent[] = [
  // 前奏(古筝独奏)
  ['0:0:0', 'A3', '2n'],
  ['0:2:0', 'D4', '2n'],
  ['1:0:0', 'E4', '4n'],
  ['1:1:0', 'F#4', '4n'],
  ['1:2:0', 'E4', '4n'],
  ['1:3:0', 'D4', '4n'],
  ['2:0:0', 'B3', '2n'],
  ['2:2:0', 'A3', '2n'],
  ['3:0:0', 'D4', '1n'],
  // 主歌 A
  ['4:0:0', 'D4', '4n.'],
  ['4:1:2', 'E4', '8n'],
  ['4:2:0', 'F#4', '2n'],
  ['5:0:0', 'A4', '4n'],
  ['5:1:0', 'F#4', '4n'],
  ['5:2:0', 'E4', '2n'],
  ['6:0:0', 'E4', '4n.'],
  ['6:1:2', 'F#4', '8n'],
  ['6:2:0', 'E4', '4n'],
  ['6:3:0', 'D4', '4n'],
  ['7:0:0', 'B3', '4n'],
  ['7:1:0', 'A3', '2n.'],
  ['7:3:2', 'E4', '16n'], // 倚音引句
  ['8:0:0', 'D4', '4n.'],
  ['8:1:2', 'E4', '8n'],
  ['8:2:0', 'F#4', '2n'],
  ['9:0:0', 'A4', '4n'],
  ['9:1:0', 'B4', '4n'],
  ['9:2:0', 'A4', '2n'],
  ['10:0:0', 'F#4', '4n'],
  ['10:1:0', 'E4', '4n'],
  ['10:2:0', 'D4', '4n'],
  ['10:3:0', 'E4', '4n'],
  ['11:0:0', 'D4', '1n'],
  // 副歌 B(级进登高,长音收句)
  ['12:0:0', 'A4', '2n'],
  ['12:2:0', 'B4', '4n'],
  ['12:3:0', 'D5', '4n'],
  ['13:0:0', 'D5', '2n'],
  ['13:2:0', 'E5', '4n'],
  ['13:3:0', 'D5', '4n'],
  ['14:0:0', 'B4', '4n.'],
  ['14:1:2', 'A4', '8n'],
  ['14:2:0', 'B4', '4n'],
  ['14:3:0', 'D5', '4n'],
  ['15:0:0', 'A4', '1n'],
  ['16:0:0', 'B4', '2n'],
  ['16:2:0', 'D5', '4n'],
  ['16:3:0', 'E5', '4n'],
  ['17:0:0', 'D5', '4n.'],
  ['17:1:2', 'B4', '8n'],
  ['17:2:0', 'A4', '2n'],
  ['18:0:0', 'F#4', '4n'],
  ['18:1:0', 'A4', '4n'],
  ['18:2:0', 'B4', '4n'],
  ['18:3:0', 'A4', '4n'],
  ['19:0:0', 'D5', '1n'],
  // 尾声(级进回落)
  ['20:0:0', 'B4', '2n'],
  ['20:2:0', 'A4', '4n'],
  ['20:3:0', 'F#4', '4n'],
  ['21:0:0', 'E4', '2n'],
  ['21:2:0', 'F#4', '4n'],
  ['21:3:0', 'E4', '4n'],
  ['22:0:0', 'A3', '4n'],
  ['22:1:0', 'B3', '4n'],
  ['22:2:0', 'D4', '2n'],
  ['22:3:2', 'E4', '16n'], // 倚音送尾
  ['23:0:0', 'D4', '1n']
]

/**
 * 琵琶声部:副歌进入前扫弦引入,长音处对答填空,副歌收束轮指,尾声一声挑尾
 */
const PIPA: NoteEvent[] = [
  ['11:3:0', 'A4', '8n'],
  ['11:3:2', 'B4', '8n'],
  ['11:3:3', 'D5', '8n'],
  ['15:1:0', 'E5', '8n'],
  ['15:1:2', 'D5', '8n'],
  ['15:2:0', 'B4', '4n'],
  ['15:3:0', 'A4', '4n'],
  ['19:0:0', 'D5', '16n'],
  ['19:0:1', 'D5', '16n'],
  ['19:0:2', 'D5', '16n'],
  ['19:0:3', 'D5', '16n'],
  ['19:1:0', 'D5', '16n'],
  ['19:1:1', 'D5', '16n'],
  ['19:1:2', 'D5', '16n'],
  ['19:1:3', 'D5', '16n'],
  ['19:2:0', 'D5', '2n'],
  ['23:2:0', 'A4', '4n'],
  ['23:3:0', 'D5', '2n']
]

/** 低音:长持续、弱存在,两小节一枚 */
const BASS: NoteEvent[] = [
  ['4:0:0', 'D2', '2m'],
  ['6:0:0', 'A2', '2m'],
  ['8:0:0', 'D2', '2m'],
  ['10:0:0', 'E2', '1m'],
  ['11:0:0', 'D2', '1m'],
  ['12:0:0', 'D2', '2m'],
  ['14:0:0', 'E2', '2m'],
  ['16:0:0', 'D2', '2m'],
  ['18:0:0', 'A2', '1m'],
  ['19:0:0', 'D2', '1m'],
  ['20:0:0', 'A2', '2m'],
  ['22:0:0', 'D2', '2m']
]

/** 和声垫:四五度叠置(避免西式三度堆叠),主歌轻、副歌厚 */
const PAD: ChordEvent[] = [
  ['4:0:0', ['D3', 'A3', 'E4'], '1m'],
  ['5:0:0', ['D3', 'A3', 'E4'], '1m'],
  ['6:0:0', ['A2', 'E3', 'B3'], '1m'],
  ['7:0:0', ['A2', 'E3', 'B3'], '1m'],
  ['8:0:0', ['D3', 'A3', 'E4'], '1m'],
  ['9:0:0', ['D3', 'A3', 'E4'], '1m'],
  ['10:0:0', ['E3', 'B3', 'F#4'], '1m'],
  ['11:0:0', ['D3', 'A3', 'D4'], '1m'],
  ['12:0:0', ['D3', 'A3', 'D4', 'A4'], '1m'],
  ['13:0:0', ['B2', 'F#3', 'B3', 'F#4'], '1m'],
  ['14:0:0', ['E3', 'B3', 'E4'], '1m'],
  ['15:0:0', ['E3', 'B3', 'E4'], '1m'],
  ['16:0:0', ['D3', 'A3', 'D4', 'A4'], '1m'],
  ['17:0:0', ['B2', 'F#3', 'B3', 'F#4'], '1m'],
  ['18:0:0', ['A2', 'E3', 'A3'], '1m'],
  ['19:0:0', ['D3', 'A3', 'D4'], '1m']
]

/** 副歌鼓点:隔小节强拍一记太鼓,藏在混响里 */
const DRUM_HITS: [time: string, note: string, vel: number][] = [
  ['12:0:0', 'C2', 0.45],
  ['14:0:0', 'G2', 0.3],
  ['16:0:0', 'C2', 0.45],
  ['18:0:0', 'G2', 0.3]
]

// ---- 运行时状态(全部在动态加载后建立) ----
let T: typeof ToneNS | null = null
let initPromise: Promise<void> | null = null
let unlocked = false
let bgmPlaying = false
let lastClickAt = 0

let musicBus: ToneNS.Gain | null = null
let sfxBus: ToneNS.Gain | null = null
let zheng: ToneNS.Sampler | null = null
let zhengSfx: ToneNS.Sampler | null = null
let pipa: ToneNS.Sampler | null = null
let wood: ToneNS.Sampler | null = null
let taiko: ToneNS.Sampler | null = null
let taikoBgm: ToneNS.Sampler | null = null
let bellSampler: ToneNS.Sampler | null = null
let chimeSampler: ToneNS.Sampler | null = null
let bassSynth: ToneNS.Synth | null = null
let padSynth: ToneNS.PolySynth | null = null

function applyPrefs(): void {
  if (!T || !musicBus || !sfxBus) return
  musicBus.gain.rampTo(prefs.musicVol * 0.9, 0.1)
  sfxBus.gain.rampTo(prefs.sfxVol * 0.8, 0.1)
  if (prefs.musicOn && unlocked) startBgm()
  if (!prefs.musicOn) stopBgm()
}

/** 构建乐器、效果与整首曲子(仅一次) */
async function init(): Promise<void> {
  const tone = await import('tone')
  const audioBase = `${import.meta.env.BASE_URL}audio/`
  const sampler = (dir: string, urls: Record<string, string>, volume: number, release = 1.5): ToneNS.Sampler =>
    new tone.Sampler({ urls, baseUrl: `${audioBase}${dir}/`, volume, release })

  // 总线:音乐(带长混响,山谷空旷)/ 音效(短混响,清爽)
  musicBus = new tone.Gain(prefs.musicVol * 0.9).toDestination()
  sfxBus = new tone.Gain(prefs.sfxVol * 0.8).toDestination()
  const hallVerb = new tone.Reverb({ decay: 4.5, preDelay: 0.03, wet: 0.28 }).connect(musicBus)
  const roomVerb = new tone.Reverb({ decay: 1.8, preDelay: 0.01, wet: 0.2 }).connect(sfxBus)

  // 真实采样乐器(FluidR3 音源,见 public/audio/README.md)
  const ZHENG_URLS = {
    C3: 'C3.mp3',
    F3: 'F3.mp3',
    A3: 'A3.mp3',
    C4: 'C4.mp3',
    F4: 'F4.mp3',
    A4: 'A4.mp3',
    C5: 'C5.mp3',
    F5: 'F5.mp3',
    A5: 'A5.mp3',
    C6: 'C6.mp3'
  }
  zheng = sampler('zheng', ZHENG_URLS, -2, 2.5).connect(hallVerb)
  zhengSfx = sampler('zheng', ZHENG_URLS, -6, 2).connect(roomVerb)
  pipa = sampler(
    'pipa',
    { C4: 'C4.mp3', F4: 'F4.mp3', A4: 'A4.mp3', C5: 'C5.mp3', F5: 'F5.mp3', A5: 'A5.mp3', C6: 'C6.mp3' },
    -8,
    1.2
  ).connect(hallVerb)
  wood = sampler('wood', { C5: 'C5.mp3', F5: 'F5.mp3' }, -10, 0.4).connect(sfxBus)
  taiko = sampler('drum', { C2: 'C2.mp3', G2: 'G2.mp3', C3: 'C3.mp3' }, -6, 1).connect(roomVerb)
  taikoBgm = sampler('drum', { C2: 'C2.mp3', G2: 'G2.mp3', C3: 'C3.mp3' }, -16, 1).connect(hallVerb)
  bellSampler = sampler('bell', { C4: 'C4.mp3', G4: 'G4.mp3', C5: 'C5.mp3' }, -8, 2.5).connect(roomVerb)
  chimeSampler = sampler('chime', { C5: 'C5.mp3', G5: 'G5.mp3', C6: 'C6.mp3' }, -12, 1.5).connect(roomVerb)

  // 低音与和声垫仍用轻合成,藏在采样声部之下
  bassSynth = new tone.Synth({
    volume: -20,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.5, decay: 0.4, sustain: 0.7, release: 2.5 }
  }).connect(hallVerb)
  padSynth = new tone.PolySynth(tone.Synth, {
    volume: -27,
    oscillator: { type: 'triangle' },
    envelope: { attack: 1.4, decay: 0.5, sustain: 0.8, release: 2.8 }
  }).connect(hallVerb)

  // 等混响与全部采样就绪
  await Promise.all([hallVerb.ready, roomVerb.ready, tone.loaded()])

  // 各声部装入 Transport,整曲循环
  const transport = tone.getTransport()
  transport.bpm.value = BPM
  transport.loop = true
  transport.loopStart = 0
  transport.loopEnd = LOOP_END

  const toEvents = (list: NoteEvent[]): { time: string; note: string; dur: string }[] =>
    list.map(([time, note, dur]) => ({ time, note, dur }))

  const melodyPart = new tone.Part((time, ev) => {
    zheng?.triggerAttackRelease(ev.note, ev.dur, time, 0.7 + Math.random() * 0.2)
  }, toEvents(MELODY))
  melodyPart.humanize = 0.02
  melodyPart.start(0)

  const pipaPart = new tone.Part((time, ev) => {
    pipa?.triggerAttackRelease(ev.note, ev.dur, time, 0.55 + Math.random() * 0.2)
  }, toEvents(PIPA))
  pipaPart.humanize = 0.01
  pipaPart.start(0)

  const bassPart = new tone.Part((time, ev) => {
    bassSynth?.triggerAttackRelease(ev.note, ev.dur, time, 0.8)
  }, toEvents(BASS))
  bassPart.start(0)

  const padPart = new tone.Part(
    (time, ev) => {
      padSynth?.triggerAttackRelease(ev.notes, ev.dur, time, 0.6)
    },
    PAD.map(([time, notes, dur]) => ({ time, notes, dur }))
  )
  padPart.start(0)

  const drumPart = new tone.Part(
    (time, ev) => {
      taikoBgm?.triggerAttackRelease(ev.note, '2n', time, ev.vel)
    },
    DRUM_HITS.map(([time, note, vel]) => ({ time, note, vel }))
  )
  drumPart.start(0)

  // 切后台暂停乐曲,回前台续播
  document.addEventListener('visibilitychange', () => {
    if (!T) return
    if (document.visibilityState === 'hidden') {
      if (bgmPlaying) T.getTransport().pause()
    } else if (bgmPlaying && prefs.musicOn) {
      T.getTransport().start()
    }
  })

  T = tone
}

/** 同步偏好(设置页开关/音量变化时调用) */
export function configureAudio(p: AudioPrefs): void {
  prefs.musicOn = p.musicOn
  prefs.sfxOn = p.sfxOn
  prefs.musicVol = Math.max(0, Math.min(1, p.musicVol))
  prefs.sfxVol = Math.max(0, Math.min(1, p.sfxVol))
  applyPrefs()
}

/** 首次用户交互时调用,加载引擎并解锁声音;每次交互重入无副作用 */
export function unlockAudio(): void {
  if (typeof window === 'undefined' || typeof window.AudioContext === 'undefined') return
  unlocked = true
  if (T) {
    // 已就绪:在手势调用栈内直接恢复上下文
    void T.start()
    if (prefs.musicOn) startBgm()
    return
  }
  initPromise ??= init()
    .then(() => {
      void T!.start()
      applyPrefs()
    })
    .catch(err => {
      console.error('[音频] 引擎加载失败', err)
    })
}

export function startBgm(): void {
  if (!T || bgmPlaying || !prefs.musicOn) return
  bgmPlaying = true
  T.getTransport().start('+0.1')
}

export function stopBgm(): void {
  if (!T || !bgmPlaying) return
  bgmPlaying = false
  T.getTransport().stop()
}

/** 古筝刮奏(真采样):速度放缓,余音相叠 */
function gliss(notes: string[], step: number, vel = 0.55): void {
  if (!T || !zhengSfx) return
  const now = T.now()
  notes.forEach((n, i) => zhengSfx?.triggerAttackRelease(n, '2n', now + i * step, vel))
}

export function playSfx(name: SfxName): void {
  if (!prefs.sfxOn || !unlocked || !T) return
  const now = T.now()
  switch (name) {
    case 'click': {
      // 全局按钮音 = 低而闷的木鱼轻叩,限频防连点噪音
      const t = Date.now()
      if (t - lastClickAt < 90) return
      lastClickAt = t
      wood?.triggerAttackRelease('C5', '8n', now, 0.4)
      break
    }
    case 'info':
      chimeSampler?.triggerAttackRelease('D6', '2n', now, 0.35)
      break
    case 'success':
      chimeSampler?.triggerAttackRelease('D6', '2n', now, 0.4)
      chimeSampler?.triggerAttackRelease('E6', '1n', now + 0.14, 0.4)
      break
    case 'warn':
      taiko?.triggerAttackRelease('C2', '2n', now, 0.7)
      break
    case 'rare':
      // 管钟一撞,金声玉振
      bellSampler?.triggerAttackRelease('D5', '1n', now, 0.6)
      chimeSampler?.triggerAttackRelease('D7', '1n', now + 0.15, 0.2)
      break
    case 'win':
      gliss(['D5', 'E5', 'F#5', 'A5', 'B5'], 0.09)
      break
    case 'lose':
      gliss(['F#4', 'E4', 'B3'], 0.2, 0.5)
      taiko?.triggerAttackRelease('G2', '2n', now + 0.6, 0.45)
      break
    case 'breakthrough':
      // 整条刮奏冲顶 + 管钟定音
      gliss(['F#3', 'A3', 'B3', 'D4', 'E4', 'F#4', 'A4', 'B4', 'D5'], 0.075, 0.6)
      bellSampler?.triggerAttackRelease('D5', '1n', now + 0.8, 0.7)
      break
    case 'fail':
      gliss(['A3', 'E3', 'D3'], 0.24, 0.5)
      taiko?.triggerAttackRelease('C2', '2n', now + 0.8, 0.55)
      break
  }
}
