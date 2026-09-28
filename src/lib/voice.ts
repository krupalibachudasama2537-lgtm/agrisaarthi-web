import type { LanguageCode } from '@/data/types'

/**
 * Text-to-speech via the browser Web Speech API (speechSynthesis).
 * The physical station speaker and IVR alert calls use pre-recorded audio;
 * this powers the dashboard's "Play voice" / "Listen" buttons.
 */
export const BCP47: Record<LanguageCode, string> = { en: 'en-IN', hi: 'hi-IN', gu: 'gu-IN' }

export type VoiceStatus = 'available' | 'missing' | 'unsupported'

const supported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null

/** Chromium fills the voice list asynchronously – wait for it (max 1.5 s) */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!supported()) return Promise.resolve([])
  const now = window.speechSynthesis.getVoices()
  if (now.length) return Promise.resolve(now)
  voicesPromise ??= new Promise((resolve) => {
    const done = () => resolve(window.speechSynthesis.getVoices())
    window.speechSynthesis.addEventListener('voiceschanged', done, { once: true })
    setTimeout(done, 1500)
  })
  return voicesPromise
}

/** Best voice for a language: exact hi-IN / gu-IN / en-IN first, then any voice of that language */
function pickVoice(voices: SpeechSynthesisVoice[], lang: LanguageCode) {
  const norm = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-')
  return voices.find((v) => norm(v) === BCP47[lang].toLowerCase()) ?? voices.find((v) => norm(v).startsWith(lang))
}

export async function voiceStatus(lang: LanguageCode): Promise<VoiceStatus> {
  if (!supported()) return 'unsupported'
  return pickVoice(await loadVoices(), lang) ? 'available' : 'missing'
}

/** Split long text on sentence ends (. ? ! and the Devanagari danda ।) – Chrome stops long utterances */
function chunks(text: string) {
  return text
    .split(/(?<=[.?!।])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Speak `text` with a hi-IN / gu-IN / en-IN voice.
 * Resolves to the reason it could not speak, or 'available' when speech started.
 */
export async function speak(text: string, lang: LanguageCode, onEnd?: () => void): Promise<VoiceStatus> {
  if (!supported()) return 'unsupported'
  const voice = pickVoice(await loadVoices(), lang)
  if (!voice) return 'missing'

  const synth = window.speechSynthesis
  synth.cancel()
  const parts = chunks(text)
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part)
    u.lang = BCP47[lang]
    u.voice = voice
    u.rate = 0.95
    if (i === parts.length - 1) {
      u.onend = () => onEnd?.()
      u.onerror = () => onEnd?.()
    }
    synth.speak(u)
  })
  return 'available'
}

export function stopSpeaking() {
  if (supported()) window.speechSynthesis.cancel()
}

/* ---------- preferred voice language (Settings → Voice language) ---------- */

const VOICE_KEY = 'agrisaarthi.voiceLang'

export function getVoiceLang(fallback: LanguageCode): LanguageCode {
  try {
    const v = localStorage.getItem(VOICE_KEY)
    if (v === 'en' || v === 'hi' || v === 'gu') return v
  } catch {
    // storage unavailable
  }
  return fallback
}

export function setVoiceLang(lang: LanguageCode) {
  try {
    localStorage.setItem(VOICE_KEY, lang)
  } catch {
    // ignore
  }
}
