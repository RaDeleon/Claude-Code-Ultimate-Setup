// Pure formatting helpers for the HUD. No `$` here, so every function is
// easy to test and safe to import from the hooks module.

/** 950 → 950, 1200 → 1.2k, 155100 → 155.1k, 1000000 → 1M, 1250000 → 1.25M */
export function fmtTokens(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0'
  if (n < 1000) return String(Math.round(n))
  const k = Math.round(n / 100) / 10
  if (k < 1000) return `${trimZeros(k.toFixed(1))}k`
  const m = Math.round(n / 10_000) / 100
  return `${trimZeros(m.toFixed(2))}M`
}

function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s
}

/** A progress bar of `width` cells: [████░░░░] */
export function bar(percent: number, width: number): string {
  const p = clamp(percent, 0, 100)
  const filled = Math.round((p / 100) * width)
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}]`
}

/** Green under 70%, yellow from 70% to 89%, red at 90%+. */
export function level(percent: number): 'green' | 'yellow' | 'red' {
  if (percent >= 90) return 'red'
  if (percent >= 70) return 'yellow'
  return 'green'
}

/** cache_read / (cache_read + input) × 100, the formula from setup.md. */
export function cacheHitPercent(cacheRead: number, input: number): number | undefined {
  const denominator = cacheRead + input
  return denominator > 0 ? Math.round((cacheRead / denominator) * 100) : undefined
}

/** Share of all input tokens that were written to the cache. */
export function cacheWritePercent(input: number, cacheRead: number, cacheWrite: number): number | undefined {
  const denominator = input + cacheRead + cacheWrite
  return denominator > 0 ? Math.round((cacheWrite / denominator) * 100) : undefined
}

/** claude-opus-5-5 → Opus 5.5, claude-sonnet-4-5-20250929 → Sonnet 4.5 */
export function prettyModel(id: string | undefined): string | undefined {
  if (!id) return undefined
  const parts = id
    .replace(/\[.*\]$/, '')
    .replace(/^claude-/, '')
    .replace(/-\d{8}$/, '')
    .split('-')
    .filter(Boolean)
  const words = parts.filter(p => !/^\d+$/.test(p))
  const numbers = parts.filter(p => /^\d+$/.test(p))
  if (words.length === 0) return id
  const name = words.map(w => w[0]!.toUpperCase() + w.slice(1)).join(' ')
  return numbers.length > 0 ? `${name} ${numbers.join('.')}` : name
}

/** 45s → <1m, 42m → 42m, 2h 14m → 2h 14m */
export function fmtDuration(ms: number): string {
  const minutes = Math.floor(Math.max(0, ms) / 60_000)
  if (minutes < 1) return '<1m'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function fmtCost(usd: number): string {
  return `$${usd.toFixed(2)}`
}

/** five_hour → 5h, seven_day → 7d, spend_limit → spend */
export function limitLabel(kind: string): string {
  if (kind === 'five_hour') return '5h'
  if (kind === 'seven_day') return '7d'
  if (kind === 'spend_limit') return 'spend'
  return kind.replace(/_/g, ' ')
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Within a day: 1:42pm. Further out: the weekday, e.g. Mon. */
export function fmtReset(iso: string | undefined, nowMs: number): string | undefined {
  if (!iso) return undefined
  const at = new Date(iso)
  const ms = at.getTime()
  if (!Number.isFinite(ms)) return undefined
  if (ms - nowMs >= 24 * 60 * 60 * 1000) return DAYS[at.getDay()]
  const h = at.getHours()
  const m = String(at.getMinutes()).padStart(2, '0')
  return `${h % 12 === 0 ? 12 : h % 12}:${m}${h < 12 ? 'am' : 'pm'}`
}

/** The last path segment: /Users/a/Claude-Code-Ultimate-Setup → Claude-Code-Ultimate-Setup */
export function basename(path: string): string {
  const trimmed = path.replace(/[\\/]+$/, '')
  return trimmed.split(/[\\/]/).pop() || trimmed
}

/** The parent directory, or undefined at the root. */
export function dirname(path: string): string | undefined {
  const trimmed = path.replace(/[\\/]+$/, '')
  const i = Math.max(trimmed.lastIndexOf('/'), trimmed.lastIndexOf('\\'))
  if (i <= 0) return undefined
  return trimmed.slice(0, i)
}

/** "ref: refs/heads/main" → main; a detached HEAD → its short sha. */
export function branchFromHead(head: string): string | undefined {
  const text = head.trim()
  const ref = /^ref:\s*refs\/heads\/(.+)$/.exec(text)
  if (ref) return ref[1]
  if (/^[0-9a-f]{7,}$/i.test(text)) return text.slice(0, 7)
  return undefined
}

function clamp(n: number, min: number, max: number): number {
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min
}
