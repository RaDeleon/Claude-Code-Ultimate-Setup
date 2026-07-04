Update my existing Claude Code statusline setup.

Context:
I already have a custom Claude Code statusline setup. I want to update it so it works cleanly in any modern terminal, while keeping the full emoji HUD style I already like.

This update is specifically for:

* The main Claude Code statusline
* The subagent statusline
* Terminal compatibility across Terax, iTerm2, and other modern terminals

Important:

* Keep the emoji style.
* Do not make this plain text.
* Do not remove my current HUD-style layout.
* Do not break my existing Claude Code settings.
* Do not remove existing MCP settings.
* Do not remove existing hooks.
* Do not remove existing permissions.
* Back up files before editing.
* Use Bash + jq.
* Make all scripts executable.
* Hide missing fields gracefully instead of showing null/undefined/NaN.

Files to update:

* ~/.claude/statusline.sh
* ~/.claude/subagent-statusline.sh
* ~/.claude/settings.json

Back up before editing:

* ~/.claude/statusline.sh
* ~/.claude/subagent-statusline.sh
* ~/.claude/settings.json

Use timestamped backups.

Main statusline goal:
Keep the statusline as a polished multi-line emoji HUD.

Use these emojis:

* 🤖 model
* 📁 project/repo
* 🌿 git branch
* 🧠 reasoning/thinking
* 📊 context usage
* 🪙 total tokens
* ⬆️ input tokens
* ⬇️ output tokens
* 🧊 cache read tokens
* 🏗️ cache creation/write tokens
* 🎯 cache hit percentage
* 📏 context window size
* ⏱️ session duration/runtime
* 💰 cost
* 📝 lines changed
* 🚦 rate limit usage
* 🔄 reset time
* 🧩 subagent/task
* ⚙️ status
* 🔢 token count
* 🖥️ terminal mode

Main layout:

Line 1:
🤖 Model | 📁 Project/Repo | 🌿 Branch | 🧠 Effort/Thinking | 🖥️ Terminal Mode | 🧩 Agent if available

Line 2:
📊 Context [20-character progress bar] percent | 🪙 total/context window | ⬆️ input | ⬇️ output | 🧊 cache read | 🏗️ cache creation | 🎯 cache hit %

Line 3:
⏱️ Session duration | 💰 Estimated cost | 📝 Lines added/removed

Line 4:
🚦 5h Claude.ai rate limit [20-character progress bar] percent | 🔄 Reset time if available

Line 5:
🚦 7d Claude.ai rate limit [20-character progress bar] percent | 🔄 Reset time if available

Example output:
🤖 Opus 4.8 | 📁 TheOne | 🌿 main | 🧠 High | 🖥️ Terax | 🧩 main
📊 Context [███░░░░░░░░░░░░░░░░░] 16% | 🪙 155.1k/1M | ⬆️ 120k | ⬇️ 8k | 🧊 25k | 🏗️ 2k | 🎯 91%
⏱️ 2h 14m | 💰 $3.42 | 📝 +420/-88
🚦 5h [██████░░░░░░░░░░░░░░] 31% | 🔄 resets 1:42pm
🚦 7d [██░░░░░░░░░░░░░░░░░░] 12% | 🔄 resets Monday

Progress bars:

* Use a 20-character bar in full layout.
* Filled character: █
* Empty character: ░
* Use green under 70%.
* Use yellow from 70% to 89%.
* Use red at 90%+.
* In plain mode, use ASCII bars instead:
  [######--------------]

Token display:
Show:

* 🪙 total tokens/context window
* ⬆️ input tokens
* ⬇️ output tokens
* 🧊 cache read tokens if available
* 🏗️ cache creation/write tokens if available
* 🎯 cache hit percentage if available

If detailed token fields are missing, fall back to:
📊 Context [████░░░░░░░░░░░░░░░░] 20% | 🪙 200k/1M tokens

Do not show broken values.

Token formatting:

* 950 → 950
* 1200 → 1.2k
* 155100 → 155.1k
* 1000000 → 1M
* 1250000 → 1.25M

Cache hit calculation:
Only calculate cache hit percentage if cache read tokens and input tokens are available.

Formula:
cache_hit_percentage = cache_read_tokens / (cache_read_tokens + input_tokens) * 100

Only show 🎯 if the denominator is greater than zero.

Rate limits:
Show rate limit rows only if Claude Code provides the fields.

Check:

* .rate_limits.five_hour.used_percentage
* .rate_limits.five_hour.reset_at
* .rate_limits.seven_day.used_percentage
* .rate_limits.seven_day.reset_at

If missing, hide those rows completely.

Terminal compatibility requirement:
Make this statusline work in any modern terminal first, then add optional terminal-specific behavior for iTerm2 and Terax.

Default universal mode:
The main script should be:
~/.claude/statusline.sh

This must work in:

* macOS Terminal
* iTerm2
* Terax
* Warp
* Ghostty
* WezTerm
* Alacritty
* VS Code terminal
* Any standard ANSI-compatible terminal

Default universal behavior:

* Use standard ANSI color codes only.
* Preserve emojis.
* Avoid terminal-specific escape sequences in the default mode.
* Avoid OSC sequences in the default mode.
* Avoid anything that breaks copy/paste.
* Avoid assuming a specific terminal width.
* Detect terminal width with `tput cols` when available.
* Fall back safely if `tput` is unavailable.
* Hide optional sections if space is limited.
* Never print null/undefined/NaN.

Terminal detection:
Detect terminal mode using safe environment variables such as:

* $TERM_PROGRAM
* $TERM
* $COLORTERM
* $ITERM_SESSION_ID
* $TERAX_SESSION_ID if available
* $TERAX if available
* $WT_SESSION if available
* $WEZTERM_PANE if available
* $VSCODE_INJECTION if available

Do not assume Terax exposes a specific environment variable unless confirmed locally.

Manual terminal mode override:
Support this environment variable:
CLAUDE_STATUSLINE_TERMINAL_MODE

Allowed values:

* auto
* universal
* iterm2
* terax
* plain

Behavior:

* auto: detect terminal and choose best mode
* universal: standard ANSI + emojis
* iterm2: iTerm2-friendly ANSI + emojis
* terax: Terax-friendly ANSI + emojis
* plain: minimal output, no colors, safest symbols

Default:
If missing, use:
CLAUDE_STATUSLINE_TERMINAL_MODE=auto

Show the detected/selected terminal mode on Line 1:
🖥️ Terax
🖥️ iTerm2
🖥️ Universal
🖥️ Plain

Create optional wrapper scripts:

* ~/.claude/statusline-universal.sh
* ~/.claude/statusline-iterm2.sh
* ~/.claude/statusline-terax.sh
* ~/.claude/statusline-plain.sh

Wrappers should call the main script with the mode set.

Examples:
~/.claude/statusline-iterm2.sh:
CLAUDE_STATUSLINE_TERMINAL_MODE=iterm2 ~/.claude/statusline.sh

~/.claude/statusline-terax.sh:
CLAUDE_STATUSLINE_TERMINAL_MODE=terax ~/.claude/statusline.sh

~/.claude/statusline-universal.sh:
CLAUDE_STATUSLINE_TERMINAL_MODE=universal ~/.claude/statusline.sh

~/.claude/statusline-plain.sh:
CLAUDE_STATUSLINE_TERMINAL_MODE=plain ~/.claude/statusline.sh

iTerm2 mode:
When mode is iterm2:

* Use standard ANSI colors.
* Keep emojis.
* Assume strong Unicode support.
* Keep 20-character bars if width allows.
* Use compact layout if narrow.
* Do not use iTerm2 proprietary features unless harmless.
* Make it look clean on dark themes.

Terax mode:
When mode is terax:

* Use standard ANSI colors.
* Keep emojis.
* Assume modern xterm-style rendering.
* Avoid risky escape sequences.
* Do not depend on Terax internals.
* Do not depend on undocumented Terax environment variables.
* Make output clean in tabs and split panes.
* Use compact layout if narrow.

Plain mode:
When mode is plain:

* Disable ANSI colors.
* Use minimal or no emojis if needed.
* Use ASCII bars.
* Example:
  Model Opus 4.8 | Project TheOne | Branch main | Terminal Plain
  Context [######--------------] 31% | Tokens 155.1k/1M
  Duration 2h 14m | Cost $3.42 | Lines +420/-88

Terminal width behavior:
Adapt layout based on width.

Suggested behavior:

* 120+ columns:
  Full 5-line emoji HUD.
* 90–119 columns:
  Compact 4-line emoji HUD.
* 70–89 columns:
  Hide detailed cache fields and show total tokens only.
* Under 70 columns:
  Minimal 2-line layout:
  Line 1: 🤖 model | 📁 repo | 🌿 branch | 🖥️ mode
  Line 2: 📊 context % | 🪙 tokens | ⏱️ duration | 💰 cost

Subagent statusline:
Keep/create:
~/.claude/subagent-statusline.sh

It should read the Claude Code subagent JSON object from stdin and output one JSON line per task:

{"id":"<task id>","content":"<formatted row body>"}

Each subagent row should use emojis:
🧩 Agent/task name | ⚙️ Status | 📝 Label/description | 🔢 Token count | ⏱️ Runtime | 📁 Current project folder

Example:
{"id":"task_123","content":"🧩 frontend-agent | ⚙️ working | 📝 Building dashboard card | 🔢 42.1k | ⏱️ 12m | 📁 TheOne"}

Subagent requirements:

* Output valid JSON lines only.
* Escape strings correctly.
* Skip broken/malformed tasks.
* Omit task ids that cannot be safely rendered so Claude Code falls back to default rendering.
* Do not show null/undefined/NaN.

Claude Code settings:
Keep ~/.claude/settings.json pointed at the universal auto-detecting script:

{
"statusLine": {
"type": "command",
"command": "~/.claude/statusline.sh",
"padding": 2,
"refreshInterval": 5
},
"subagentStatusLine": {
"type": "command",
"command": "~/.claude/subagent-statusline.sh"
}
}

Do not point Claude Code directly at iTerm2/Terax wrappers unless I ask.
The main script should auto-detect or use CLAUDE_STATUSLINE_TERMINAL_MODE override.

Testing:
Create mock JSON files if needed:

* ~/.claude/statusline-mock-full.json
* ~/.claude/statusline-mock-minimal.json
* ~/.claude/statusline-mock-no-cache.json
* ~/.claude/statusline-mock-no-rate-limits.json
* ~/.claude/subagent-statusline-mock.json

Test:

1. Auto mode
2. Universal mode
3. iTerm2 mode
4. Terax mode
5. Plain mode
6. Narrow terminal behavior
7. Missing token fields
8. Missing cache fields
9. Missing rate limit fields
10. Missing git branch
11. Minimal JSON payload
12. Subagent JSON rendering

Add optional test aliases:
alias cc-status-test='~/.claude/statusline.sh < ~/.claude/statusline-mock-full.json'
alias cc-status-universal='CLAUDE_STATUSLINE_TERMINAL_MODE=universal ~/.claude/statusline.sh < ~/.claude/statusline-mock-full.json'
alias cc-status-iterm2='CLAUDE_STATUSLINE_TERMINAL_MODE=iterm2 ~/.claude/statusline.sh < ~/.claude/statusline-mock-full.json'
alias cc-status-terax='CLAUDE_STATUSLINE_TERMINAL_MODE=terax ~/.claude/statusline.sh < ~/.claude/statusline-mock-full.json'
alias cc-status-plain='CLAUDE_STATUSLINE_TERMINAL_MODE=plain ~/.claude/statusline.sh < ~/.claude/statusline-mock-full.json'

After implementation, show me:

* Files backed up
* Updated ~/.claude/statusline.sh
* Updated ~/.claude/subagent-statusline.sh
* Wrapper scripts
* Updated settings.json statusLine/subagentStatusLine sections
* Example output for auto/universal mode
* Example output for iTerm2 mode
* Example output for Terax mode
* Example output for plain mode
* How to force terminal mode manually
* Test results with mock JSON

Do not remove existing Claude Code settings.
Do not overwrite unrelated settings.
Do not remove existing MCP config.
Do not remove existing hooks.
Do not remove existing permissions.
Only update the statusline/subagent statusline pieces needed for this setup.
