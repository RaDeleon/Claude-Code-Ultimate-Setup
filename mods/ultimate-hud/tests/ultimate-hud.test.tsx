import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'

import {
  bar,
  branchFromHead,
  cacheHitPercent,
  cacheWritePercent,
  fmtDuration,
  fmtTokens,
  level,
  prettyModel,
} from '../hooks/format'

const SURFACES = ['terminal', 'desktop'] as const

const band = (bodyColumns = 140) => ({
  plugin: 'ultimate-hud',
  component: 'AbovePrompt' as const,
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 20,
    bodyColumns,
    scroll: { offset: 0, bodyRows: 19 },
    view: {},
  },
})


const run = (command: string) => ({
  command,
  args: '',
  origin: { kind: 'composer' as const },
  presentation: { isFullscreen: false, columns: 140 },
})

/** Answers, in Claude Code's place, everything the mod asks of it. */
function setup(on: On, files: Record<string, string> = {}) {
  mock.clock(on)
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('session.measure', ($, e) => ({ changed: e.changed }))
  on('turn.complete', () => ({ text: 'done' }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 1_000_000 }, rateLimits: [] } }))
  // Claude Code draws nothing of its own in the band.
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => {
    const { Box } = $.ui.resolve(e)
    return <Box />
  })
  on('fs.read', ($, e) => {
    const text = files[e.path]
    return text === undefined ? { deny: 'ENOENT' } : { value: text }
  })
}

test('formats tokens the way setup.md specifies', () => {
  expect(fmtTokens(950)).toBe('950')
  expect(fmtTokens(1200)).toBe('1.2k')
  expect(fmtTokens(155_100)).toBe('155.1k')
  expect(fmtTokens(1_000_000)).toBe('1M')
  expect(fmtTokens(1_250_000)).toBe('1.25M')
  expect(fmtTokens(999_960)).toBe('1M')
})

test('cache hit and write percentages', () => {
  expect(cacheHitPercent(91, 9)).toBe(91)
  expect(cacheHitPercent(0, 0)).toBeUndefined()
  expect(cacheWritePercent(10, 80, 10)).toBe(10)
  expect(cacheWritePercent(0, 0, 0)).toBeUndefined()
})

test('bars, colors, models, durations and branches', () => {
  expect(bar(50, 10)).toBe('[█████░░░░░]')
  expect(bar(150, 4)).toBe('[████]')
  expect(level(69)).toBe('green')
  expect(level(70)).toBe('yellow')
  expect(level(90)).toBe('red')
  expect(prettyModel('claude-opus-5-5')).toBe('Opus 5.5')
  expect(prettyModel('claude-sonnet-4-5-20250929')).toBe('Sonnet 4.5')
  expect(fmtDuration(30_000)).toBe('<1m')
  expect(fmtDuration(134 * 60_000)).toBe('2h 14m')
  expect(branchFromHead('ref: refs/heads/feature/hud\n')).toBe('feature/hud')
  expect(branchFromHead('0123456789abcdef')).toBe('0123456')
})

test('the band stays out of the way before there is anything to show', async ($, on) => {
  setup(on)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...band(), surface })
    expect(await ui.find({ key: 'hud-tokens' })).toBeUndefined()
    expect(await ui.find({ key: 'hud-context' })).toBeUndefined()
    await ui.unmount()
  }
})

test('draws model, repo, branch, context, tokens, cache %, cost and limits', async ($, on) => {
  setup(on, { '/Users/angelo/Claude-Code-Ultimate-Setup/.git/HEAD': 'ref: refs/heads/main\n' })

  await $.session.start({ cwd: '/Users/angelo/Claude-Code-Ultimate-Setup', surface: 'terminal', isInteractive: true })

  await $.session.measure({
    context: { tokens: 155_100, window: 1_000_000, percent: 16 },
    rateLimits: [
      { kind: 'five_hour', percentUsed: 31 },
      { kind: 'seven_day', percentUsed: 92 },
    ],
    cost: { usd: 3.42 },
    changed: ['context', 'rateLimits', 'cost'],
  })

  const turn = (turnId: string, model: string, agentId?: string) => ({
    reason: 'answer' as const,
    answer: 'ok',
    durationMs: 1_000,
    isAborted: false,
    turnId,
    agentId,
    usage: { ...usage, model },
  })
  const usage = { input_tokens: 9_000, output_tokens: 8_000, cache_read_input_tokens: 91_000, cache_creation_input_tokens: 2_000 }
  await $.turn.complete(turn('t1', 'claude-opus-5-5'))
  await $.turn.complete(turn('t2', 'claude-opus-5-5'))
  // A subagent's turn is left out of the main totals.
  await $.turn.complete(turn('t3', 'claude-haiku-4-5', 'a1'))

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ ...band(), surface })

    const where = await ui.find({ key: 'hud-where' })
    expect(where?.text).toContain('🤖 Opus 5.5')
    expect(where?.text).toContain('📁 Claude-Code-Ultimate-Setup')
    expect(where?.text).toContain('🌿 main')
    expect(where?.text).toContain('💰 $3.42')

    const context = await ui.find({ key: 'hud-context' })
    expect(context?.text).toContain('16%')
    expect(context?.text).toContain('🪙 155.1k/1M')

    const tokens = await ui.find({ key: 'hud-tokens' })
    expect(tokens?.text).toContain('⬆️ 18k')
    expect(tokens?.text).toContain('⬇️ 16k')
    expect(tokens?.text).toContain('🧊 182k')
    expect(tokens?.text).toContain('🏗️ 4k')
    expect(tokens?.text).toContain('🎯 91% hit')
    expect(tokens?.text).toContain('✍️ 2% write')

    const limits = await ui.find({ key: 'hud-limits' })
    expect(limits?.text).toContain('🚦 5h')
    expect(limits?.text).toContain('31%')
    expect(limits?.text).toContain('🚦 7d')

    const redBar = await ui.find({ type: 'Text', text: /^\[█{18}░{2}\]$/ })
    expect(redBar?.props.color).toBe('red')

    await ui.unmount()
  }
})

test('/hud hides and shows the band', async ($, on) => {
  setup(on)
  await $.session.start({ cwd: '/Users/angelo/project', surface: 'terminal', isInteractive: true })

  const hidden = await $.command.run(run('hud'))
  expect(hidden.text).toContain('HUD hidden')
  let ui = await $.ui.mount({ ...band(), surface: 'terminal' })
  expect(await ui.find({ key: 'hud-where' })).toBeUndefined()
  await ui.unmount()

  const shown = await $.command.run(run('hud'))
  expect(shown.text).toContain('HUD shown')
  ui = await $.ui.mount({ ...band(), surface: 'terminal' })
  expect((await ui.find({ key: 'hud-where' }))?.text).toContain('📁 project')
  await ui.unmount()
})
