# Claude-Code-Ultimate-Setup

Fully decked out Claude Code configuration for people who spend a lot of time in Claude Code in the terminal.

## Purpose

This repo collects a complete, opinionated Claude Code setup: statusline, settings, hooks, and related config, so it can be version-controlled, shared, and restored on any machine.

## Repo layout

- `README.md` — project overview
- `setup.md` — working spec/prompt describing the statusline (main + subagent) configuration: layout, emoji HUD style, terminal-compatibility modes (universal/iTerm2/Terax/plain), and testing requirements
- `LICENSE` — Apache License 2.0
- `.claude-plugin/marketplace.json` — makes the repo a plugin marketplace named `ultimate-setup`
- `mods/<name>/` — one Claude Code mod per directory (`.claude-plugin/plugin.json`, `hooks/hooks.json`, `hooks/register.tsx`, `types/`, `tests/`)

## Conventions

- Treat `setup.md` as the source of truth for statusline behavior when generating or editing `~/.claude/statusline.sh`, `~/.claude/subagent-statusline.sh`, and related wrapper scripts.
- Scripts referenced by this setup live under `~/.claude/` (the user's global Claude Code config directory), not inside this repo, unless explicitly copied in here. Mods are the exception: they live in this repo under `mods/` and are installed through the marketplace.
- For each new mod, add an entry to `.claude-plugin/marketplace.json` whose `name` matches the mod's `plugin.json` name. Mod names must not start with `claude-`.
- Before committing a mod change, run `claude plugin validate .`, `claude plugin validate ./mods/<name>`, and `claude plugin test` from the mod's directory, and bump `version` in its `plugin.json`.
- Keep changes backwards compatible with existing MCP config, hooks, and permissions in `~/.claude/settings.json` — never remove them wholesale.
- Back up any `~/.claude/*` file before editing it (timestamped backups), per `setup.md`.
