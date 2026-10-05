# ultimate-hud

An emoji HUD drawn above the Claude Code prompt, in the style of this repo's statusline. It runs inside Claude Code as a [mod](https://code.claude.com/docs/en/plugins/mods/overview), so it needs no bash scripts and no `settings.json` changes, and it works in the terminal and in the Code tab of the Claude Desktop app.

```
🤖 Opus 5.5 | 📁 Claude-Code-Ultimate-Setup | 🌿 main | ⏱️ 42m | 💰 $1.87
📊 Context [████░░░░░░░░░░░░░░░░] 21% | 🪙 210k/1M
⬆️ 120k | ⬇️ 8.4k | 🧊 1.2M | 🏗️ 85k | 🎯 91% hit | ✍️ 6% write
🚦 5h [██████░░░░░░░░░░░░░░] 31% 🔄 1:42pm | 🚦 7d [██░░░░░░░░░░░░░░░░░░] 12% 🔄 Mon
```

## What each item means

| Item | Meaning |
| --- | --- |
| 🤖 | Model that answered the last turn |
| 📁 / 🌿 | Folder the session runs in, and its git branch |
| ⏱️ | Session duration |
| 💰 | Session cost, as `/cost` totals it |
| 📊 / 🪙 | Context window fill, and tokens used / window size |
| ⬆️ / ⬇️ | Uncached input tokens / output tokens, summed over the session |
| 🧊 / 🏗️ | Cache read tokens / cache write tokens, summed over the session |
| 🎯 hit | `cache read ÷ (cache read + input)` |
| ✍️ write | `cache write ÷ (input + cache read + cache write)` |
| 🚦 / 🔄 | 5-hour and 7-day rate limits and when they reset (subscription plans only) |

Bars are green under 70%, yellow from 70%, and red from 90%. A field with no data yet is hidden. Token totals count the main conversation only (not subagents) and start over on `/clear`. Bars shrink to 10 cells when the terminal is narrower than 100 columns.

Run `/hud` to hide or show the band.

## Settings

| Setting | Values | Default |
| --- | --- | --- |
| **Show HUD in** (`showIn`) | `everywhere`, `desktop` (the Code tab of the Claude Desktop app only), `terminal` (the terminal only) | `everywhere` |

Change it in `/config`. Set it to `desktop` if you already have a terminal status line and only want the HUD in the Desktop app.

## Install

```bash
claude plugin marketplace add RaDeleon/Claude-Code-Ultimate-Setup
claude plugin install ultimate-hud@ultimate-setup
```

## Develop

```bash
claude --plugin-dir ./mods/ultimate-hud   # loads it for one session, hot-reloads on save
claude plugin validate ./mods/ultimate-hud
cd mods/ultimate-hud && claude plugin test
```

Tested with Claude Code 2.1.288. Mods need Claude Code 2.1.287 or later.
