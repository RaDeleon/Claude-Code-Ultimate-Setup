import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Measure, Totals, Where } from '../types'
import {
  bar,
  basename,
  branchFromHead,
  cacheHitPercent,
  cacheWritePercent,
  dirname,
  fmtCost,
  fmtDuration,
  fmtReset,
  fmtTokens,
  level,
  limitLabel,
  prettyModel,
} from './format'

const EMPTY_TOTALS: Totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }

// Session state lives in $.state, so it survives a hot reload of this module.
const measureAtom = atom({ plugin: 'ultimate-hud', key: 'measure' } as const, null)
const totalsAtom = atom({ plugin: 'ultimate-hud', key: 'totals' } as const, EMPTY_TOTALS)
const whereAtom = atom({ plugin: 'ultimate-hud', key: 'where' } as const, {})
const startedAtAtom = atom({ plugin: 'ultimate-hud', key: 'startedAt' } as const, null)
const isHiddenAtom = atom({ plugin: 'ultimate-hud', key: 'isHidden' } as const, false)

type UsageFigures = {
  context: { tokens?: number; window: number; percent?: number }
  rateLimits: readonly { kind: string; percentUsed: number; resetsAt?: string }[]
  cost?: { usd: number }
}

function toMeasure(u: UsageFigures): Measure {
  return {
    contextTokens: u.context.tokens,
    contextWindow: u.context.window,
    contextPercent: u.context.percent,
    rateLimits: u.rateLimits.map(r => ({ kind: r.kind, percentUsed: r.percentUsed, resetsAt: r.resetsAt })),
    costUsd: u.cost?.usd,
  }
}

/** Reads the branch from .git/HEAD in `cwd` or the nearest parent that has one. */
async function readBranch($: EngineInterface, cwd: string): Promise<string | undefined> {
  let dir: string | undefined = cwd
  for (let depth = 0; dir !== undefined && depth < 8; depth += 1) {
    try {
      return branchFromHead(await $.fs.read(`${dir}/.git/HEAD`))
    } catch {
      // Not here, or .git is a file (a worktree or submodule): follow its gitdir.
    }
    try {
      const pointer = /^gitdir:\s*(.+)$/m.exec(await $.fs.read(`${dir}/.git`))
      if (pointer) {
        const gitDir = pointer[1]!.trim()
        const absolute = gitDir.startsWith('/') ? gitDir : `${dir}/${gitDir}`
        return branchFromHead(await $.fs.read(`${absolute}/HEAD`))
      }
    } catch {
      // Keep walking up.
    }
    dir = dirname(dir)
  }
  return undefined
}

export const register: Register = (on, options) => {
  let cwd = ''
  // The showIn setting: 'everywhere', or the one surface ('desktop' or 'terminal') the band draws on.
  const showIn = typeof options.showIn === 'string' ? options.showIn : 'everywhere'

  on('session.start', async ($, e, next) => {
    cwd = e.cwd
    await $.command.register({ name: 'hud', description: 'Show or hide the Ultimate HUD above the prompt' })

    const branch = await readBranch($, cwd)
    await update($, whereAtom, () => ({ project: basename(cwd), branch }))
    try {
      const usage = await $.session.usage()
      await update($, startedAtAtom, () => usage.startedAt)
      await update($, measureAtom, () => toMeasure(usage))
    } catch {
      // No figures yet: session.measure fills them in after the first turn.
    }

    // Redraw once a minute so the session clock moves between turns.
    $.clock.every(60_000, () => $.ui.invalidate('ui.render'))

    return next(e)
  })

  // Claude Code pushes its status-line figures after each turn and when a
  // rate-limit window moves: context, rate limits and cost.
  on('session.measure', async ($, e, next) => {
    await update($, measureAtom, () => toMeasure(e))
    return next(e)
  })

  // Each main-thread turn reports its token usage; add it to the session totals.
  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const usage = e.usage
    if (e.agentId === undefined && usage) {
      await update($, totalsAtom, t => ({
        input: t.input + usage.input_tokens,
        output: t.output + usage.output_tokens,
        cacheRead: t.cacheRead + usage.cache_read_input_tokens,
        cacheWrite: t.cacheWrite + usage.cache_creation_input_tokens,
        model: usage.model,
      }))
    }
    if (cwd) {
      const branch = await readBranch($, cwd)
      await update($, whereAtom, w => ({ ...w, branch }))
    }
    return result
  })

  // /clear starts the session over, so the totals start over too.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, totalsAtom, () => EMPTY_TOTALS)
    }
    return next(e)
  })

  on('command.run', { command: 'hud' }, async $ => {
    const isHidden = await update($, isHiddenAtom, hidden => !hidden)
    if (isHidden) return { text: 'HUD hidden. Run /hud to show it again.' }
    if (showIn === 'everywhere') return { text: 'HUD shown.' }
    const where = showIn === 'desktop' ? "the Desktop app's Code tab" : 'the terminal'
    return { text: `HUD shown. The "Show HUD in" setting limits it to ${where}.` }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const isOffSurface = showIn !== 'everywhere' && e.surface !== showIn
    if (e.props.hasSurvey || isOffSurface || (await read($, isHiddenAtom))) {
      return next(e)
    }

    const measure = await read($, measureAtom)
    const totals = await read($, totalsAtom)
    const where = await read($, whereAtom)
    const startedAt = await read($, startedAtAtom)
    const now = await $.clock.now()
    const width = e.props.bodyColumns >= 100 ? 20 : 10

    const { Box, Text } = $.ui.resolve(e)
    const sep = <Text dimColor> | </Text>
    const join = (items: JSX.Element[]) => items.flatMap((item, i) => (i === 0 ? [item] : [sep, item]))

    // Line 1: 🤖 model | 📁 repo | 🌿 branch | ⏱️ duration | 💰 cost
    const line1: JSX.Element[] = []
    const model = prettyModel(totals.model)
    if (model) line1.push(<Text>🤖 {model}</Text>)
    if (where.project) line1.push(<Text>📁 {where.project}</Text>)
    if (where.branch) line1.push(<Text>🌿 {where.branch}</Text>)
    if (startedAt !== null) line1.push(<Text>⏱️ {fmtDuration(now - startedAt)}</Text>)
    if (measure?.costUsd !== undefined) line1.push(<Text>💰 {fmtCost(measure.costUsd)}</Text>)

    // Line 2: 📊 Context [bar] % | 🪙 tokens/window
    const line2: JSX.Element[] = []
    if (measure?.contextPercent !== undefined) {
      const pct = measure.contextPercent
      line2.push(
        <Text>
          📊 Context <Text color={level(pct)}>{bar(pct, width)}</Text> {pct}%
        </Text>,
      )
      if (measure.contextTokens !== undefined) {
        line2.push(
          <Text>
            🪙 {fmtTokens(measure.contextTokens)}/{fmtTokens(measure.contextWindow)}
          </Text>,
        )
      }
    }

    // Line 3: ⬆️ in | ⬇️ out | 🧊 cache read | 🏗️ cache write | 🎯 hit % | ✍️ write %
    const line3: JSX.Element[] = []
    const hasTokens = totals.input + totals.output + totals.cacheRead + totals.cacheWrite > 0
    if (hasTokens) {
      line3.push(<Text>⬆️ {fmtTokens(totals.input)}</Text>)
      line3.push(<Text>⬇️ {fmtTokens(totals.output)}</Text>)
      line3.push(<Text>🧊 {fmtTokens(totals.cacheRead)}</Text>)
      line3.push(<Text>🏗️ {fmtTokens(totals.cacheWrite)}</Text>)
      const hit = cacheHitPercent(totals.cacheRead, totals.input)
      if (hit !== undefined) line3.push(<Text>🎯 {hit}% hit</Text>)
      const write = cacheWritePercent(totals.input, totals.cacheRead, totals.cacheWrite)
      if (write !== undefined) line3.push(<Text>✍️ {write}% write</Text>)
    }

    // Line 4: 🚦 5h [bar] % 🔄 reset | 7d [bar] % 🔄 reset
    const line4: JSX.Element[] = []
    for (const limit of measure?.rateLimits ?? []) {
      const reset = fmtReset(limit.resetsAt, now)
      line4.push(
        <Text>
          🚦 {limitLabel(limit.kind)} <Text color={level(limit.percentUsed)}>{bar(limit.percentUsed, width)}</Text>{' '}
          {limit.percentUsed}%{reset ? ` 🔄 ${reset}` : ''}
        </Text>,
      )
    }

    const rows = [
      { key: 'hud-where', items: line1 },
      { key: 'hud-context', items: line2 },
      { key: 'hud-tokens', items: line3 },
      { key: 'hud-limits', items: line4 },
    ].filter(row => row.items.length > 0)

    if (rows.length === 0) {
      return next(e)
    }

    return (
      <Box flexDirection="column">
        {rows.map(row => (
          <Box key={row.key} flexDirection="row" flexWrap="wrap">
            {join(row.items)}
          </Box>
        ))}
      </Box>
    )
  })
}
