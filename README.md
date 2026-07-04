# Claude-Code-Ultimate-Setup

Fully decked out Claude Code configuration. For people who spend lots of time in Claude Code in the terminal, this is for you.

## What's in here

- **`setup.md`** — a detailed spec for a polished, emoji-driven Claude Code statusline (main + subagent), with terminal-compatibility modes for universal ANSI, iTerm2, Terax, and plain-text terminals, plus a full test plan.
- **`CLAUDE.md`** — project instructions for Claude Code so it understands the repo's purpose and conventions when working here.

## Goal

Provide a reusable, shareable Claude Code setup — statusline, settings, hooks — that works cleanly across modern terminals (Terminal.app, iTerm2, Terax, Warp, Ghostty, WezTerm, Alacritty, VS Code) without sacrificing the full emoji HUD look.

## Setup

No install scripts to run — Claude Code does the installation for you.

1. Open [`setup.md`](setup.md) and copy its entire contents.
2. Start a Claude Code session (in any directory).
3. Paste the copied text as your prompt and send it.
4. Claude Code will back up your existing `~/.claude/statusline.sh`, `~/.claude/subagent-statusline.sh`, and `~/.claude/settings.json`, then create/update the statusline scripts, wrapper scripts, and settings described in the spec.
5. Review what Claude Code changed and try the test aliases it sets up (e.g. `cc-status-test`) to confirm the statusline renders correctly in your terminal.

## License

Apache License 2.0 — see [LICENSE](LICENSE).
