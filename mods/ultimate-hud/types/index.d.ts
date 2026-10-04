/** Claude Code's own status-line figures, as the last `session.measure` pushed them. */
export type Measure = {
  /** Input tokens the last response was answered over. */
  contextTokens?: number
  /** The model's context window, in tokens. */
  contextWindow: number
  /** contextTokens over contextWindow, 0-100. */
  contextPercent?: number
  /** The rate-limit windows (five_hour, seven_day, ...). Empty off a subscription. */
  rateLimits: { kind: string; percentUsed: number; resetsAt?: string }[]
  /** Session cost in US dollars, when the host keeps a ledger. */
  costUsd?: number
}

/** Token counts summed over every main-thread turn this session. */
export type Totals = {
  input: number
  output: number
  cacheRead: number
  cacheWrite: number
  /** The API id of the model that answered last, e.g. claude-opus-5-5. */
  model?: string
}

/** Where the session runs. */
export type Where = {
  project?: string
  branch?: string
}

declare module 'claude-code' {
  interface PluginState {
    'ultimate-hud': {
      measure: Measure | null
      totals: Totals
      where: Where
      startedAt: number | null
      isHidden: boolean
    }
  }
}
