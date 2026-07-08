# Claude Code Masterclass: The Complete Setup Guide

> **Audience**: Anyone. No coding experience required to follow the steps.
> **Goal**: Configure Claude Code so it understands your project, remembers your preferences, has reusable workflows, and gets smarter the more you use it.
> **Version**: Living document. Grow it as you build.

---

## Table of Contents

1. [Before You Start Anything](#1-before-you-start-anything)
2. [How Claude Code Reads Instructions](#2-how-claude-code-reads-instructions)
3. [Layer 1: Global Memory](#3-layer-1-global-memory)
4. [Layer 2: Project Memory](#4-layer-2-project-memory)
5. [Layer 3: Rules](#5-layer-3-rules)
6. [Layer 4: Settings](#6-layer-4-settings)
7. [Layer 5: Skills](#7-layer-5-skills)
8. [Layer 6: Hooks](#8-layer-6-hooks)
9. [Layer 7: MCP Servers](#9-layer-7-mcp-servers)
10. [Layer 8: Keybindings](#10-layer-8-keybindings)
11. [Gotchas, Pitfalls, and Hard-Won Lessons](#11-gotchas)
12. [The Complete File Tree](#12-the-complete-file-tree)
13. [Troubleshooting Quick Reference](#13-troubleshooting)

---

## 1. Before You Start Anything

Claude Code is an AI assistant that runs in your terminal or in VS Code. Out of the box it's smart but generic — it doesn't know your project, preferences, or workflows.

This guide turns it into a **custom-fitted assistant** through text files in specific folders. No coding required.

### What You Need Installed

Before touching any configuration, confirm these are working:

**Step 1: Confirm Claude Code is installed.**

Open your terminal (or VS Code terminal) and type:

```bash
claude --version
```

**What you should see:** A version number like `1.0.x` or higher.

**If it failed:** Install Claude Code first. Visit https://code.claude.com and follow the install instructions for your OS.

**Step 2: Confirm you know your home directory.**

This is where your global (all-projects) config lives. Run:

```bash
# Windows (Git Bash / MSYS2):
echo "$USERPROFILE"
# Mac / Linux:
echo "$HOME"
```

**What you should see:** A path like `C:\Users\jesse` or `/Users/jesse` or `/home/jesse`.

**Write this down.** Every time this guide says `~/.claude/`, it means `[YOUR_HOME_PATH]/.claude/`. On Windows with Git Bash, `~` works in the terminal but some tools need the full path.

**Step 3: Confirm the .claude folder exists in your home directory.**

```bash
ls ~/.claude/
```

**What you should see:** A folder listing. Might be mostly empty — that's fine.

**If it failed (folder doesn't exist):** Create it:

```bash
mkdir -p ~/.claude/rules ~/.claude/skills
```

**Step 4: Confirm you're in a project folder (for project-level config).**

```bash
# Should show your project's files
ls
# Should show a git repository
git status
```

**If git status fails:** You're not in a git repo. Navigate to your project first with `cd /path/to/your/project`.

### The Mental Model

Think of it like training a new employee:

| What you do for a human | What you do for Claude Code |
|---|---|
| Give them the employee handbook | Write a `CLAUDE.md` file |
| Tell them "we do things THIS way here" | Add files to `.claude/rules/` |
| Give them access badges | Configure `.claude/settings.json` |
| Teach them standard procedures | Create skills in `.claude/skills/` |
| Set up their desk with the right tools | Connect MCP servers |

### Pre-Flight Checklist

Before moving to Section 2, confirm ALL of these:

```
[ ] claude --version shows a version number
[ ] I know my home directory path: _______________
[ ] ~/.claude/ folder exists
[ ] I am inside a project folder with git initialized
[ ] I have a text editor I'm comfortable with (VS Code, Notepad, vim, anything)
```

**Do not skip this checklist.** If any box is unchecked, fix it before continuing.

---

## 2. How Claude Code Reads Instructions

When you start a Claude Code session, it automatically looks for instruction files in a specific order. It reads ALL of them, layered on top of each other.

### The Loading Order (Top = Broadest, Bottom = Most Specific)

```
1. ~/.claude/CLAUDE.md          <- YOUR personal defaults (all projects)
2. ~/.claude/rules/*.md         <- YOUR personal rules (all projects)
3. ./CLAUDE.md                  <- THIS PROJECT's shared instructions
4. ./.claude/CLAUDE.md          <- Alternative location (same as above)
5. ./.claude/rules/*.md         <- THIS PROJECT's rules
6. ./CLAUDE.local.md            <- YOUR private notes for this project
```

**What this means in plain English:**

- **Step 1-2** = "This is how I like to work, everywhere"
- **Step 3-5** = "This is how THIS project works"
- **Step 6** = "My personal notes about this specific project"

Claude reads them all, every session, automatically. You never need to paste instructions.

### Where These Files Live

**Your home folder** (personal, follows you everywhere):
```
Windows:  C:\Users\YOUR_USERNAME\.claude\
Mac:      /Users/YOUR_USERNAME/.claude/
Linux:    /home/YOUR_USERNAME/.claude/
```

**Your project folder** (shared with your team via git):
```
your-project/
├── CLAUDE.md                    <- Main project instructions
├── CLAUDE.local.md              <- Your private notes (auto-gitignored)
└── .claude/
    ├── settings.json            <- Team permissions (committed to git)
    ├── settings.local.json      <- Your personal permissions (not committed)
    ├── rules/                   <- Rule files
    └── skills/                  <- Slash command definitions
```

### How to Verify Claude Loaded Your Files

After creating ANY file in this guide, verify Claude actually sees it.

**In your next Claude session, type:**

```
/memory
```

**What you should see:** A list of all loaded memory files with their paths. Every file you created should appear.

**If a file is missing:** Check the path. The most common mistake is putting the file in the wrong folder. Restart the Claude session — files are loaded at session start.

---

## 3. Layer 1: Global Memory

> **What**: A file that tells Claude your personal preferences across ALL projects.
> **Where**: `~/.claude/CLAUDE.md`
> **Who sees it**: Only you. Not committed to any project.

### Before You Start

Confirm the folder exists:

```bash
ls ~/.claude/
```

If it doesn't, create it: `mkdir -p ~/.claude`

### Step-by-Step Setup

**Step 1: Open Claude Code and give it this prompt.**

Copy-paste this exactly. Do not modify it. Claude will ask you questions, you answer them, and it writes the file based on your real answers.

```
I need you to create my global CLAUDE.md at ~/.claude/CLAUDE.md.

Before writing anything, ask me these questions one at a time.
Wait for my answer to each before asking the next:

1. What programming languages do I primarily work with?
2. What's my preferred coding style? (naming conventions, formatting, tabs vs spaces)
3. How do I like commit messages formatted? (conventional commits? free-form?)
4. Do I prefer detailed explanations or just the code with no chatter?
5. What are my HARD rules — things you must NEVER do? (e.g., never force push, never use any, never amend commits)
6. What build tools and package managers do I use? (npm, pnpm, cargo, pip, etc.)

After I answer ALL questions, write the CLAUDE.md with these constraints:
- UNDER 80 lines total. This is a hard limit.
- Every single line must be an actionable instruction. No descriptions, no filler.
- Use bullet points, not paragraphs.
- For hard rules, use the words NEVER, ALWAYS, or MUST — these get Claude's attention.
- Do NOT include vague advice like "write clean code" or "be thorough."
- Group into sections: Communication, Code Style, Git, Workflow, Hard Rules

After writing, show me the final line count.
```

**Step 2: Answer Claude's questions honestly.**

There are no wrong answers here. This is YOUR preference file. Examples of strong answers:

- "I work in TypeScript and Rust" (specific)
- "I use conventional commits: feat:, fix:, refactor:" (specific format)
- "Never force push to main, never amend unless I say amend" (clear boundary)
- "Just give me the code, skip the explanations unless I ask" (clear preference)

Weak answers that produce vague config: "I like clean code" / "be careful with git" / "normal style"

**Step 3: Verify the file exists and check its length.**

```bash
# Check the file exists
cat ~/.claude/CLAUDE.md

# Count the lines — must be under 80
wc -l ~/.claude/CLAUDE.md
```

**What you should see:** The file contents printed, and a line count under 80.

**If the file doesn't exist:** Claude may have written it to the wrong path. Check if it created `CLAUDE.md` in your current project folder instead. If so, move it:

```bash
mv ./CLAUDE.md ~/.claude/CLAUDE.md
```

**Step 4: Verify Claude loads it in a new session.**

Start a NEW Claude session (close and reopen, or type `/clear`), then type:

```
/memory
```

**What you should see:** Your `~/.claude/CLAUDE.md` file listed as a loaded memory file.

**If it's not listed:**
- The file path is wrong. Run `ls ~/.claude/CLAUDE.md` to confirm it exists.
- On Windows, `~` might not resolve correctly. Try using the full path: `C:\Users\YOUR_NAME\.claude\CLAUDE.md`

**Step 5: Test that Claude actually follows the instructions.**

Ask Claude something that should trigger one of your preferences. For example, if you wrote "NEVER use `any` in TypeScript", ask:

```
Write a simple TypeScript function that adds two numbers.
```

**What you should see:** Claude following your style preferences (explicit return types, no `any`, whatever you specified).

**If Claude ignores your preferences:** The file is either too long (Claude loses focus past ~80 lines), the instructions are too vague, or the file didn't load (re-check `/memory`).

### Why the 80-Line Limit Matters

Claude processes ~150 instructions reliably per session. The system prompt uses ~50 of those. Your global CLAUDE.md, project CLAUDE.md, all rules files, and all skill descriptions share the remaining ~100. If your global memory file is 200 lines, it's drowning out everything else.

This isn't a soft guideline. Past 80 lines, instructions at the bottom start getting ignored randomly.

### Verification Checklist

Run these commands and confirm each result:

```bash
# 1. File exists
ls ~/.claude/CLAUDE.md
# Expected: file listed, no error

# 2. Line count is under 80
wc -l ~/.claude/CLAUDE.md
# Expected: number under 80

# 3. No vague instructions (should return nothing)
grep -i "clean code\|be careful\|best practices\|write good" ~/.claude/CLAUDE.md
# Expected: no output (no matches)

# 4. Has strong emphasis words
grep -c "NEVER\|ALWAYS\|MUST\|IMPORTANT" ~/.claude/CLAUDE.md
# Expected: at least 3-5 matches
```

If any check fails, edit the file and fix it before moving to Section 4.

---

## 4. Layer 2: Project Memory

> **What**: A file that teaches Claude about THIS specific project.
> **Where**: `CLAUDE.md` in your project's root folder.
> **Who sees it**: Everyone on your team (it gets committed to git).

### Step-by-Step Setup

**Step 1**: Navigate to your project folder.

**Step 2**: Give Claude this exact prompt:

```
I need you to create a CLAUDE.md file at the project root.

IMPORTANT: Read these files FIRST before writing anything:
- README.md (or README)
- package.json OR Cargo.toml OR pyproject.toml (whichever exists)
- The top-level folder structure (ls the root, ls each top folder)

Based on what you actually find, write a CLAUDE.md that covers:
1. Project structure — the real folder tree, top 2 levels only
2. Tech stack — languages, frameworks, and versions from the config files
3. Build/run commands — copy them from the config, don't guess
4. Architecture patterns — only include these if they're non-obvious
5. Gotchas — anything weird about this project a new dev would trip on

Rules for the file:
- UNDER 60 lines. Link to other docs with @imports for detail.
- Only include facts you verified from the actual files. Do NOT guess.
- Use bullet points, not paragraphs.
- Include the build/test/lint commands exactly as they work.
```

**Step 3**: Review what Claude writes. Fix anything wrong.

**Step 4**: Create a private companion file:

```
Create a CLAUDE.local.md at the project root. Just a header and a
placeholder "Notes:" section. This is for my personal notes.
```

### The @Import System

Your CLAUDE.md can pull in other files instead of duplicating content:

```markdown
# My Project

Architecture: @docs/architecture.md
API reference: @docs/api.md
```

**Rules for @imports:**
- Max depth: 5 hops (imports can import other files, up to 5 deep)
- Invalid paths fail silently (no error, just skipped)
- NOT evaluated inside code blocks (triple backticks)
- Can use home directory paths: `@~/.claude/my-prefs.md`

**IMPORTANT — Do NOT @import your entire docs folder.** Each imported file adds to the context window. Only import files Claude needs EVERY session. For files it sometimes needs, just mention the path and say "read this when working on [topic]."

### Strict Setup Checklist

```
[ ] File exists at ./CLAUDE.md (project root)
[ ] UNDER 60 lines
[ ] Build commands were copied from actual config, not guessed
[ ] Tech stack versions match the real config files
[ ] Folder structure matches reality (ls verified)
[ ] @imports only for files needed EVERY session
[ ] Does NOT duplicate content that's in rules/ or skills/
[ ] CLAUDE.local.md exists for private notes (gitignored)
[ ] Verified with /memory that both files load
```

---

## 5. Layer 3: Rules

> **What**: Individual instruction files that activate based on what files you're working on.
> **Where**: `.claude/rules/` in your project OR `~/.claude/rules/` for global rules.
> **Who sees it**: Project rules = team. Global rules = just you.

### Why Rules Instead of Cramming Everything Into CLAUDE.md

Rules let you say: *"Only apply these when working on Python files."* This keeps Claude focused. It also keeps your CLAUDE.md short (which matters — see Gotchas).

### Strict File Format

```markdown
---
paths:
  - "src/**/*.ts"
  - "src/**/*.svelte"
---

# Rule Title

- Instruction one
- Instruction two
```

**The `---` block (frontmatter) is OPTIONAL.** Rules without it apply to all files unconditionally. If you use `paths:`, the frontmatter with `---` markers is REQUIRED.

### Valid Glob Patterns

| Pattern | What it matches |
|---|---|
| `src/**/*.ts` | Any .ts file anywhere under src/ |
| `*.py` | Python files in project root only |
| `**/*.rs` | Any Rust file anywhere |
| `{src,lib}/**/*.tsx` | .tsx files under src/ OR lib/ |
| `src/components/*.svelte` | .svelte files directly in components/ |
| `docs/**/*.md` | Markdown files anywhere under docs/ |

**What does NOT work:** Regex syntax. Only glob patterns.

### Step-by-Step: Create a Project Rule

**Prompt:**

```
Create a rule file at .claude/rules/frontend.md that ONLY activates
for files matching "src/**/*.svelte" and "src/**/*.ts".

The file MUST have this exact structure:
1. YAML frontmatter between --- markers with a paths: array
2. A markdown heading
3. Bullet-point rules (actionable, specific)

Rules to include:
- Use Svelte 5 runes ($state, $derived, $effect), NEVER legacy stores
- Use TailwindCSS utility classes, NEVER inline style objects
- All TypeScript imports MUST use .js extension
- Components MUST have ARIA attributes where needed

Keep it under 20 lines.
```

### Step-by-Step: Create Global Rules

**These apply to every project, every session. Create them once.**

**Prompt 1 — Git Safety:**
```
Create ~/.claude/rules/git-safety.md (no paths frontmatter — applies
everywhere) with these EXACT rules:

- NEVER force push to main or master
- NEVER run git reset --hard without explicit user instruction
- NEVER run git clean -fd without explicit user instruction
- ALWAYS create NEW commits — NEVER amend unless user says "amend"
- ALWAYS stage specific files by name — NEVER use git add -A or git add .
- NEVER commit files matching: .env, .credentials.json, *.pem, *.key

Keep it under 15 lines.
```

**Prompt 2 — Code Quality:**
```
Create ~/.claude/rules/code-quality.md (no paths frontmatter) with:

- NEVER add comments, docstrings, or type annotations to code you didn't change
- NEVER add error handling for scenarios that cannot happen
- NEVER create abstractions for one-time operations
- If something is unused, DELETE it completely. No _unused variables.
- ALWAYS verify the code compiles/type-checks before reporting done
- Three similar lines of code are better than a premature abstraction

Under 15 lines.
```

**Prompt 3 — Security:**
```
Create ~/.claude/rules/security.md (no paths frontmatter) with:

- NEVER read, write, or display .env, .credentials.json, *.pem, *.key files
- NEVER include secrets, API keys, or tokens in code or commit messages
- ALWAYS use parameterized queries for database operations
- NEVER use eval(), new Function(), or innerHTML with dynamic data
- NEVER construct shell commands from user-provided input

Under 10 lines.
```

### Strict Setup Checklist

```
[ ] Files end in .md extension
[ ] Frontmatter (if used) has valid --- markers on their own lines
[ ] paths: values are quoted strings in a YAML array
[ ] Glob patterns use ** and * only (not regex)
[ ] Each rule is a bullet point, not a paragraph
[ ] Each rule uses MUST, NEVER, or ALWAYS for critical items
[ ] No rule exceeds 20 lines (shorter = more reliable)
[ ] Subdirectories work if used (rules/frontend/svelte.md is valid)
[ ] Rules without paths: have NO frontmatter at all
[ ] Verified rules load with /memory command
```

---

## 6. Layer 4: Settings

> **What**: JSON files controlling what Claude can do without asking permission.
> **Where**: `.claude/settings.json` (team) and `.claude/settings.local.json` (you only).

### The Two Files

| File | Committed to git? | Purpose |
|---|---|---|
| `.claude/settings.json` | Yes — team | Safe commands + hooks |
| `.claude/settings.local.json` | No — you only | Your write permissions |

### Permission Evaluation Order

This matters: **deny is checked first, then ask, then allow.**

1. If a command matches a `deny` rule, it's blocked. Period.
2. If it matches an `ask` rule, Claude asks you.
3. If it matches an `allow` rule, it runs automatically.
4. If it matches nothing, Claude asks you.

### Permission Pattern Syntax

The format is: `"ToolName(pattern)"` where `:*` means "with any arguments."

**Valid Tool Names:**

| Tool | Pattern | Example |
|---|---|---|
| `Bash` | Command text | `"Bash(pnpm build:*)"` |
| `Read` | File path glob | `"Read(src/**/*.ts)"` |
| `Edit` | File path glob | `"Edit(src/**/*.ts)"` |
| `Write` | File path glob | `"Write(src/**/*.ts)"` |
| `WebFetch` | Domain filter | `"WebFetch(domain:github.com)"` |
| `WebSearch` | (no pattern) | `"WebSearch"` |
| `MCP` | Server name | `"MCP(github)"` |
| `Task` | Agent type | `"Task(Explore)"` |
| `Skill` | Skill name | `"Skill(review)"` |

**Wildcard rules:**
- `:*` matches everything after the command
- `*` inside a pattern is a glob wildcard
- Spaces matter: `git log:*` is different from `gitlog:*`

### Step-by-Step: Create Team Settings

**Prompt:**

```
Create .claude/settings.json with this EXACT JSON structure.
Do not add any fields beyond permissions.

Team allow list (safe, read-only commands):
- pnpm dev, build, check, install, svelte-check, audit, ds:tokens:build
- npx svelte-check
- cargo build, check, clippy, test
- git log, diff, diff-index, status, branch
- ls

Team deny list (block these always):
- rm -rf with any root path
- git push --force
- git reset --hard
- git clean -fd

Use the exact Bash(command:*) format for each entry.
```

**Prompt for personal settings:**

```
Create .claude/settings.local.json with my personal write permissions:

Allow:
- git add, git commit, git push, git checkout, git mv
- WebFetch for github.com and deepwiki.com

Nothing else. Keep it minimal and clean.
```

### Strict Setup Checklist

```
[ ] File is valid JSON (no trailing commas, proper quoting)
[ ] Top-level key is "permissions" (not "permission")
[ ] "allow" and "deny" are arrays of strings
[ ] Every entry uses the format: "ToolName(pattern:*)"
[ ] Deny list checked first — destructive commands are denied
[ ] Team settings.json has ONLY read-safe commands in allow
[ ] Personal settings.local.json has write commands
[ ] settings.local.json is NOT committed to git
[ ] No duplicate entries between the two files
[ ] Tested: Claude auto-runs an allowed command without asking
[ ] Tested: Claude blocks a denied command
```

---

## 7. Layer 5: Skills

> **What**: Reusable workflows triggered by `/skillname`.
> **Where**: `.claude/skills/NAME/SKILL.md` (project) or `~/.claude/skills/NAME/SKILL.md` (global).

### How Skills Work

A skill is a markdown file with:
1. **Frontmatter** (the `---` block) — metadata about the skill
2. **Body** — the instructions Claude follows when the skill is invoked

When you type `/skillname`, Claude loads and follows the instructions.

### Frontmatter Fields Reference

```yaml
---
name: my-skill                     # What you type after / (REQUIRED if different from folder name)
description: What this skill does  # Claude reads this to decide when to suggest it
user-invocable: true               # YOU can trigger it with /name (default: true)
disable-model-invocation: true     # Claude CANNOT trigger it on its own (default: false)
allowed-tools: Read, Grep, Bash    # Tools the skill can use without asking
argument-hint: "<what to type>"    # Hint shown in autocomplete menu
model: sonnet                      # Model override: sonnet, opus, haiku, or inherit
context: fork                      # "fork" = runs in a separate subagent (isolated)
agent: Explore                     # Which subagent type (only matters if context: fork)
---
```

**Valid values for each field:**

| Field | Valid Values | Default |
|---|---|---|
| `name` | lowercase, hyphens, max 64 chars | Folder name |
| `user-invocable` | `true`, `false` | `true` |
| `disable-model-invocation` | `true`, `false` | `false` |
| `allowed-tools` | Comma-separated: Read, Glob, Grep, Edit, Write, Bash, Task, TodoWrite, WebFetch, WebSearch | All tools |
| `model` | `sonnet`, `opus`, `haiku`, `inherit` | `inherit` |
| `context` | `fork` or omit entirely | Inline (main context) |
| `agent` | `Explore`, `Plan`, `general-purpose`, custom agent name | `general-purpose` |

### Dynamic Context Injection

**This is the power feature.** Inside a skill body, you can inject live system data:

```markdown
Current branch: !`git branch --show-current`
Recent commits: !`git log --oneline -5`
Changed files: !`git diff --name-only`
Folder structure: !`ls -la`
```

The `!` backtick syntax runs the shell command BEFORE Claude sees the prompt. The output replaces the placeholder. Claude gets fresh, real-time data every invocation.

**Rules:**
- Uses backticks (`` ` ``), NOT single quotes
- Runs before the skill instructions are sent to Claude
- Multiple commands allowed in one skill
- If the command fails, the error output is shown to Claude
- Cannot nest `!` commands inside each other

### Variable Substitutions

| Variable | What it contains | Example |
|---|---|---|
| `$ARGUMENTS` | Everything typed after `/skillname` | `/review src/auth.ts` -> `src/auth.ts` |
| `$0`, `$1`, `$2` | Individual arguments by position | `/deploy staging fast` -> `$0`=staging, `$1`=fast |
| `${CLAUDE_SESSION_ID}` | Current session ID | For logging or tracking |

### Invocation Control (Critical to Understand)

| Setting | Who can trigger | Use case |
|---|---|---|
| Both defaults | You AND Claude | General knowledge, always available |
| `disable-model-invocation: true` | Only you | Side effects: deploy, commit, send messages |
| `user-invocable: false` | Only Claude | Background knowledge Claude applies automatically |

**IMPORTANT:** If you have many skills, their descriptions eat into the context window. Default budget is 15,000 characters for all skill descriptions combined. Check with `/context` for warnings about excluded skills. To increase: set `SLASH_COMMAND_TOOL_CHAR_BUDGET` environment variable.

### Step-by-Step: Create a Skill

**Prompt (copy-paste this exactly, replacing the bracketed parts):**

```
Create a skill at [LOCATION: .claude/skills/NAME/SKILL.md or ~/.claude/skills/NAME/SKILL.md]

This skill needs these EXACT frontmatter fields:
---
name: [NAME]
description: [ONE SENTENCE - when should this skill be used?]
user-invocable: true
disable-model-invocation: true
allowed-tools: [COMMA SEPARATED LIST]
argument-hint: "[WHAT THE USER TYPES AFTER /NAME]"
---

The body of the skill must include:
1. Dynamic context injection using !`command` syntax for: [LIST WHAT LIVE DATA YOU WANT]
2. A "## Steps" section with numbered steps Claude must follow
3. A "## Output Format" section defining exactly what the output looks like
4. A "## Rules" section with constraints (what NOT to do)

The skill body must be UNDER 100 lines.
Every instruction must be specific and testable (not vague like "review carefully").
```

### Skill Prompts to Create

**These are the exact prompts. Give them to Claude one at a time.**

**1. Code Review (project skill):**
```
Create a skill at .claude/skills/review/SKILL.md

Frontmatter:
---
name: review
description: Review code for bugs, security issues, and quality problems
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Task, Bash
argument-hint: "[file path, folder, or 'staged']"
---

Dynamic context (use !`command` syntax in the body):
- Current git branch
- List of files changed vs main branch

Steps:
1. If $ARGUMENTS is "staged", get git diff --cached. Otherwise read the specified file/folder.
2. For EACH file, check these categories:
   - Correctness: Does the logic do what the function/variable names claim?
   - Edge cases: What inputs break this? (null, empty, boundary values)
   - Security: SQL injection, XSS, command injection, auth bypass
   - Performance: N+1 queries, unbounded loops, memory leaks
   - Readability: Could a new dev understand this in 60 seconds?
3. Score each file: PASS, WARN, FAIL

Output format per issue:
- Severity: Critical / Warning / Nit
- Location: file:line
- Issue: one sentence
- Fix: one sentence

End with summary: total issues by severity, overall verdict.

Rules:
- Do NOT suggest style changes unless they affect correctness
- Do NOT rewrite code — only identify issues
- Do NOT review generated files, node_modules, or lock files
```

**2. Architecture Planner (global skill):**
```
Create a skill at ~/.claude/skills/architect/SKILL.md

Frontmatter:
---
name: architect
description: Design architecture for a feature before writing any code
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Task, TodoWrite
argument-hint: "<feature or module to design>"
---

Dynamic context:
- Project folder structure (ls top level)
- Contents of package.json or Cargo.toml (whichever exists)

Steps:
1. Read CLAUDE.md to understand project patterns
2. Search for existing similar features and study their structure
3. Propose architecture:
   - File tree showing new and modified files
   - Data flow: how data moves through the system
   - Interfaces: TypeScript types or Rust traits that define contracts
   - Dependencies: what existing code to reuse, what's new
4. Present 2-3 approaches with pros/cons table
5. Recommend one approach with reasoning
6. Provide numbered implementation checklist

Rules:
- Do NOT write any code. This is design only.
- Do NOT propose dependencies that don't exist in the project already
  unless absolutely necessary (and flag them explicitly)
- Every file in the proposed tree must have a one-line purpose note
```

**3. Deep Debugger (global skill):**
```
Create a skill at ~/.claude/skills/debug-deep/SKILL.md

Frontmatter:
---
name: debug-deep
description: Deep investigation of a bug or error - traces root cause without fixing
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Task, Bash
argument-hint: "<error message or symptom description>"
---

Dynamic context:
- Current git branch
- git status --short
- Last 5 commits (git log --oneline -5)

Steps:
1. Parse the error message or symptom from $ARGUMENTS
2. Search codebase for the error text, function names, or file names
3. Read each relevant file. Trace the call chain BACKWARDS from the
   error to the root cause. Document each hop as: file:line -> file:line
4. Check git blame on the suspicious lines — when was this introduced?
5. Form exactly 3 hypotheses for the root cause
6. For each hypothesis: search for evidence for AND against
7. Rank hypotheses by evidence strength

Output format:
## Root Cause
[Most likely hypothesis with file:line reference]

## Evidence Chain
[The call chain traced in step 3]

## Why It Happens
[Plain English explanation]

## Suggested Fix
[Minimal, targeted change — one sentence]

## Prevention
[How to prevent this class of bug]

Rules:
- Do NOT fix anything. Investigate and report ONLY.
- Do NOT guess. Every claim must reference a specific file:line.
- If you can't determine the root cause, say so and list what
  additional information you'd need.
```

**4. Project Onboarder (global skill):**
```
Create a skill at ~/.claude/skills/onboard/SKILL.md

Frontmatter:
---
name: onboard
description: Set up Claude Code configuration for a new project
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Task, Write, TodoWrite, Bash
argument-hint: "(no arguments needed)"
---

Dynamic context:
- Current directory name and contents (ls -la)
- Whether CLAUDE.md exists (ls CLAUDE.md 2>/dev/null)

Steps:
1. Read README, package.json/Cargo.toml/pyproject.toml, and scan folder structure
2. Identify: tech stack, build system, key dependencies, primary languages
3. Create a TodoWrite checklist of what needs to be created
4. For each missing item, create it:

   a. CLAUDE.md (if missing):
      - Under 60 lines
      - Real folder structure, real commands, real tech stack
      - No guessing — only facts from files you read

   b. .claude/settings.json (if missing):
      - Allow: build/check/test/lint commands for THIS project's tools
      - Deny: rm -rf, git push --force, git reset --hard

   c. .claude/rules/ (if missing):
      - One rule file per primary language found
      - With paths: frontmatter targeting the right file extensions
      - 5-10 rules per file, project-appropriate

5. Report what was created and what the user should review/customize

Rules:
- NEVER guess commands. Read them from config files.
- NEVER create rules for languages not present in the project.
- Ask the user before creating anything if you're unsure.
```

**5. Explainer (global skill):**
```
Create a skill at ~/.claude/skills/explain/SKILL.md

Frontmatter:
---
name: explain
description: Explain code in plain English for non-technical audiences
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Task
argument-hint: "<file path or concept name>"
---

Steps:
1. Read the file or find the concept in the codebase
2. Explain what it does in plain English a non-programmer can understand

Rules:
- ZERO jargon. Define technical terms in parentheses if unavoidable.
- Use analogies: offices, kitchens, libraries, mail systems, restaurants.
- Start with WHAT it does for the user, then HOW it works.
- Numbered steps for processes.
- Max 3 sentences per paragraph.
- End with: "In short: [one sentence summary]"
```

### Strict Setup Checklist

```
[ ] Skill folder exists at .claude/skills/NAME/ or ~/.claude/skills/NAME/
[ ] SKILL.md file is inside the folder (not loose)
[ ] Frontmatter between --- markers is valid YAML
[ ] name: is lowercase, hyphens only, max 64 characters
[ ] name: matches the folder name
[ ] description: is one sentence (Claude uses this to decide relevance)
[ ] user-invocable: true if you want to type /name to trigger it
[ ] disable-model-invocation: true for skills with side effects
[ ] allowed-tools: lists ONLY the tools the skill actually needs
[ ] argument-hint: shows what the user should type
[ ] Body has numbered Steps section
[ ] Body has Output Format section
[ ] Body has Rules section (what NOT to do)
[ ] Dynamic context uses !`command` with backticks, not single quotes
[ ] $ARGUMENTS placeholder is used if skill takes input
[ ] Total body is under 100 lines
[ ] Tested: /name shows up in autocomplete
[ ] Tested: /name actually runs and produces expected output
[ ] Tested: /name with arguments passes them correctly
```

---

## 8. Layer 6: Hooks

> **What**: Shell commands that run automatically when events happen. Unlike CLAUDE.md rules which are *advisory*, hooks are *deterministic* — they ALWAYS run.
> **Where**: Inside `settings.json` (project or global).

### The Critical Difference: Rules vs Hooks

| | CLAUDE.md / Rules | Hooks |
|---|---|---|
| **How it works** | Claude reads it, weighs it against other context, maybe follows it | Script runs, exit code determines outcome, 100% deterministic |
| **Reliability** | Advisory — Claude might ignore it under pressure | Guaranteed — code runs every time, no exceptions |
| **Use for** | Style preferences, approach guidance | Security gates, formatting, blocking dangerous ops |

**Rule of thumb:** If it MUST happen every time, use a hook. If it's a preference, use a rule.

### Hook Events

| Event | When it fires | Can it block? |
|---|---|---|
| `PreToolUse` | Before Claude runs a tool | YES (exit code 2) |
| `PostToolUse` | After a tool succeeds | No |
| `PostToolUseFailure` | After a tool fails | No |
| `Stop` | When Claude finishes responding | YES (can force retry) |
| `SessionStart` | Session starts/resumes | No |
| `UserPromptSubmit` | You send a message | YES |
| `PreCompact` | Before context compaction | No |
| `Notification` | Notification sent | No |
| `SubagentStart` | Subagent launches | No |
| `SubagentStop` | Subagent finishes | No |

### Exit Code Contract

| Exit Code | Meaning | What happens |
|---|---|---|
| `0` | Success | Action proceeds. If stdout has JSON, it's parsed. |
| `2` | Block | Action is PREVENTED. Stderr message is sent to Claude as feedback. |
| Any other | Error | Action proceeds anyway. Stderr logged in verbose mode. |

**IMPORTANT:** Exit code 0 and exit code 2 are the only ones that matter. Don't use exit code 1 to block — it won't work.

### Matcher Syntax

The `matcher` field uses regex to match tool names:

| Matcher | What it matches |
|---|---|
| `"Bash"` | Any Bash command |
| `"Edit\|Write"` | Edit OR Write tools |
| `"mcp__.*"` | Any MCP tool |
| `"mcp__github__.*"` | Tools from the github MCP server |
| `""` or omitted | Everything |

### Hook JSON Input

Every hook receives JSON on stdin with this structure:

```json
{
  "session_id": "abc123",
  "cwd": "/path/to/project",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /tmp/something",
    "description": "Delete temporary files"
  }
}
```

Your script reads stdin, inspects the data, and exits with 0 (allow) or 2 (block).

### Step-by-Step: Add Hooks

**Prompt:**

```
I need you to add hooks to my .claude/settings.json WITHOUT removing the
existing permissions section.

Add these hooks to the JSON:

1. PostToolUse hook:
   - Matcher: "Edit|Write"
   - Purpose: After any file edit, run prettier to auto-format
   - Command: reads the file_path from stdin JSON using jq,
     runs npx prettier --write on it, silently ignores failures
   - Should work on Windows (use bash -c wrapper)

2. PreToolUse hook:
   - Matcher: "Bash"
   - Purpose: Block commands that contain "rm -rf /"
   - Command: reads the command from stdin JSON using jq,
     checks for the dangerous pattern, exits 2 with stderr message if found

The hooks section goes at the top level of the JSON, alongside "permissions".
Show me the complete file after editing.
```

### Hook Script Template

Save this as a reference for writing hook scripts:

```bash
#!/bin/bash
# Hook script template
# Receives JSON on stdin, exits 0 (allow) or 2 (block)

INPUT=$(cat)

# Extract fields with jq
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Your logic here
if [[ "$COMMAND" == *"rm -rf /"* ]]; then
  echo "BLOCKED: Destructive command not allowed" >&2
  exit 2
fi

exit 0
```

### Strict Setup Checklist

```
[ ] Hooks are in settings.json under the "hooks" top-level key
[ ] Each event name is spelled exactly right (case-sensitive)
[ ] Matcher is a valid regex string
[ ] "hooks" array inside each matcher contains objects with "type" and "command"
[ ] Hook commands work when run manually in the terminal
[ ] jq is installed (hooks that parse JSON need it)
[ ] Exit code 2 is used for blocking (not exit 1)
[ ] Stderr (not stdout) is used for block messages
[ ] PostToolUse hooks end with || true to prevent cascade failures
[ ] Tested: trigger the hook and verify it runs (check verbose mode with Ctrl+O)
[ ] Known limitation: PreToolUse exit 2 may not block Write/Edit (known bug)
```

---

## 9. Layer 7: MCP Servers

> **What**: Connections to external tools (GitHub, databases, Notion, etc.)
> **Where**: `~/.claude.json` (personal) or `.mcp.json` (project).

### What MCP Does (Plain English)

Without MCP, Claude can only: read/write local files and run terminal commands.
With MCP, Claude can also: talk to GitHub, query databases, read Notion pages, post to Slack — anything with an MCP server.

### Transport Types

| Type | What it means | When to use |
|---|---|---|
| `http` | Connects to a web URL | Remote services (GitHub, Notion) |
| `stdio` | Runs a local program | Local tools (database, filesystem) |
| `sse` | Server-Sent Events (deprecated) | Avoid — use http instead |

### Step-by-Step: Add MCP Server

**Prompt for GitHub:**
```
Run this exact command in the terminal to add the GitHub MCP server:
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

Then tell me to type /mcp in my next session to authenticate.
```

**Prompt for a local database:**
```
Run this command to add a database MCP server (replace the connection string):
claude mcp add --transport stdio database --env DB_URL="postgresql://localhost:5432/mydb" -- npx -y @bytebase/dbhub
```

**Prompt for project-wide (team shares it):**
```
Run this command with --scope project to create a .mcp.json that the team shares:
claude mcp add --scope project --transport http github https://api.githubcopilot.com/mcp/
```

### The .mcp.json Format

```json
{
  "mcpServers": {
    "server-name": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "package-name"],
      "env": {
        "API_KEY": "${MY_API_KEY}",
        "PORT": "${PORT:-5432}"
      }
    }
  }
}
```

Environment variables support `${VAR}` expansion and `${VAR:-default}` fallbacks.

### Context Window Warning

**IMPORTANT:** Each MCP server adds its tool descriptions to Claude's context. Too many servers can shrink your usable context from 200k tokens to 70k. Only enable servers you're actively using. Disable unused ones:

```json
{
  "disabledMcpjsonServers": ["server-name-to-disable"]
}
```

### Strict Setup Checklist

```
[ ] Server added via claude mcp add (not by hand-editing JSON)
[ ] Correct transport type: http for remote, stdio for local
[ ] For stdio: command and args are correct, program is installed
[ ] For http: URL is correct and accessible
[ ] Environment variables are set (or have ${VAR:-default} fallbacks)
[ ] /mcp shows the server as connected
[ ] Server tools appear when Claude lists available tools
[ ] Not too many servers enabled at once (check /context for token usage)
[ ] Project .mcp.json uses ${ENV_VAR} for secrets (never hardcode)
```

---

## 10. Layer 8: Keybindings

> **What**: Custom keyboard shortcuts.
> **Where**: `~/.claude/keybindings.json` (only in terminal mode, not VS Code).

### Step-by-Step Setup

**Prompt:**

```
Create ~/.claude/keybindings.json with these keyboard shortcuts:

- In Chat context:
  - Ctrl+E: open external editor
  - Ctrl+K Ctrl+S: stash prompt (chord — press Ctrl+K, release, then Ctrl+S)

- In Global context:
  - Ctrl+Shift+T: toggle todo list

Use the exact JSON schema with "bindings" array containing context objects.
```

### Format

```json
{
  "bindings": [
    {
      "context": "Chat",
      "bindings": {
        "ctrl+e": "chat:externalEditor",
        "ctrl+k ctrl+s": "chat:stash"
      }
    },
    {
      "context": "Global",
      "bindings": {
        "ctrl+shift+t": "app:toggleTodos"
      }
    }
  ]
}
```

### Key Actions Quick Reference

| Action | What it does | Default key |
|---|---|---|
| `chat:submit` | Send message | Enter |
| `chat:cancel` | Cancel input | Escape |
| `chat:externalEditor` | Edit in VS Code/vim | Ctrl+G |
| `chat:stash` | Save prompt for later | Ctrl+S |
| `chat:cycleMode` | Switch permission mode | Shift+Tab |
| `chat:thinkingToggle` | Toggle extended thinking | Alt+T |
| `app:interrupt` | Stop Claude mid-response | Escape |
| `app:toggleTodos` | Show/hide task list | Ctrl+T |
| `app:toggleTranscript` | Show verbose output | Ctrl+O |

**Reserved (cannot rebind):** Ctrl+C, Ctrl+D

### Strict Setup Checklist

```
[ ] File is at ~/.claude/keybindings.json (not in project)
[ ] Valid JSON with "bindings" array
[ ] Each entry has "context" and "bindings" object
[ ] Context names are exact (case-sensitive): Chat, Global, Autocomplete, etc.
[ ] Action names are exact: chat:submit, app:toggleTodos, etc.
[ ] Chords use space between keys: "ctrl+k ctrl+s" (not "ctrl+k+s")
[ ] Set to null to unbind: "ctrl+s": null
[ ] Not trying to rebind Ctrl+C or Ctrl+D (reserved)
```

---

## 11. Gotchas, Pitfalls, and Hard-Won Lessons

These come from Anthropic's official best practices, community battle-testing, and real-world debugging. Read this section before spending time on configuration.

### CLAUDE.md Pitfalls

**1. The Bloat Trap**
> Claude can reliably follow ~150 instructions total. The system prompt uses ~50. Every instruction you add competes for attention. If your CLAUDE.md is a novel, Claude starts ignoring things randomly.

**Fix:** Keep CLAUDE.md under 60 lines. Use `@imports` sparingly. Move detailed knowledge to skills (loaded only when needed) instead of memory (loaded every session).

**2. Negative-Only Rules**
> "Never use the --foo flag" with no alternative leaves Claude stuck. It wants to complete the task but you've blocked the only path it sees.

**Fix:** Always provide an alternative. "NEVER use --foo. Use --bar instead."

**3. @Import Overload**
> Every @imported file adds to the context window. Importing your entire docs folder wastes thousands of tokens every session even when you're doing something unrelated.

**Fix:** Only @import files Claude needs EVERY session. For the rest, write "Read @docs/auth.md when working on authentication" — Claude will read it on demand.

**4. Not Iterating**
> Treat CLAUDE.md like code. When Claude does something wrong despite having a rule against it, the file is probably too long and the rule is getting lost.

**Fix:** When a mistake happens, check if the rule exists. If it does, the file is too long — prune it. If it doesn't, add the rule and add emphasis (IMPORTANT, NEVER, MUST).

### Context Window Management

**5. Context Compaction Makes Claude Dumber**
> After compaction, Claude doesn't know what files it was looking at. It needs to re-read them. It will repeat mistakes you already corrected earlier in the session.

**Fix:** Use `/clear` when starting a new topic. Don't let old context accumulate from unrelated tasks. One session = one focus area.

**6. The Kitchen Sink Session**
> You start with one task, ask something unrelated, then go back. The mixed context confuses Claude.

**Fix:** `/clear` between unrelated tasks. Start fresh.

**7. MCP Tool Overload**
> Each MCP server adds tool descriptions to context. Too many enabled servers can shrink usable context from 200k to 70k tokens.

**Fix:** Only enable MCP servers you're actively using. Disable the rest.

### Behavioral Gotchas

**8. Claude Changes Tests Instead of Fixing Code**
> When tests fail, Claude sometimes modifies the test to match the (broken) output rather than fixing the code. This is easier for it and technically makes tests pass.

**Fix:** Add to CLAUDE.md: "NEVER modify test expectations to make tests pass. Fix the code under test instead. The test defines the correct behavior."

**9. Claude Forgets How to Compile**
> Even with build commands in CLAUDE.md, Claude can get confused after context compaction and forget the correct compilation steps.

**Fix:** Put build commands in CLAUDE.md with emphasis: "IMPORTANT: To verify code compiles, ALWAYS run: `pnpm svelte-check` (not tsc, not other commands)"

**10. Claude Leaves Dead Code**
> After refactoring, Claude often leaves the old code around — commented out, renamed with underscores, or re-exported "for backwards compatibility."

**Fix:** Add to rules: "If something is unused after a change, DELETE it completely. No _unused vars, no re-exports, no commented-out code, no // removed comments."

**11. Claude Over-Engineers**
> Ask for a simple function, get a class hierarchy with interfaces, factory methods, and error handling for impossible cases.

**Fix:** Add to rules: "Minimum viable change. Only change what is asked. Three similar lines are better than an abstraction. Don't add features, error handling, or configurability beyond what was requested."

### Skills Pitfalls

**12. Skill Description Budget**
> All skill descriptions (from ALL skills) share a default 15,000 character budget. If you have many skills, some get excluded silently.

**Fix:** Keep descriptions to one sentence. Check `/context` for warnings. Set `SLASH_COMMAND_TOOL_CHAR_BUDGET` to increase if needed.

**13. Skills with Side Effects**
> If `disable-model-invocation` is false (default), Claude might auto-trigger your `/deploy` skill when it thinks deployment is relevant.

**Fix:** ALWAYS set `disable-model-invocation: true` for skills that deploy, commit, send messages, or have any real-world side effects.

### Hooks Pitfalls

**14. PreToolUse Exit 2 May Not Block Write/Edit**
> There is a known bug where PreToolUse hooks returning exit code 2 properly block Bash commands but may not block Write/Edit operations.

**Fix:** Use the `deny` permission in settings.json as the primary block for file operations. Use hooks as a secondary safety net.

**15. JSON vs Exit Code Confusion**
> You must choose ONE approach per hook: either exit codes alone, or exit 0 with JSON output. If you exit 2 AND output JSON, the JSON is ignored.

**Fix:** For simple block/allow: use exit codes (0 or 2). For structured control (modifying inputs, adding context): exit 0 with JSON on stdout.

---

## 12. Putting It All Together

### The Complete File Tree

```
~/.claude/                              <- GLOBAL (follows you everywhere)
|-- CLAUDE.md                           <- Your personal preferences
|-- settings.json                       <- Your global permissions
|-- keybindings.json                    <- Your keyboard shortcuts
|-- rules/
|   |-- git-safety.md                   <- Git safety (all projects)
|   |-- code-quality.md                 <- Code standards (all projects)
|   +-- security.md                     <- Security rules (all projects)
+-- skills/
    |-- onboard/SKILL.md                <- /onboard: configure new projects
    |-- architect/SKILL.md              <- /architect: design before code
    |-- debug-deep/SKILL.md             <- /debug-deep: investigate bugs
    |-- explain/SKILL.md                <- /explain: layman explanations
    +-- test-plan/SKILL.md              <- /test-plan: plan tests

your-project/                           <- PER PROJECT
|-- CLAUDE.md                           <- Project architecture
|-- CLAUDE.local.md                     <- Your private notes (gitignored)
|-- .mcp.json                           <- MCP servers (team shares)
+-- .claude/
    |-- settings.json                   <- Team permissions + hooks
    |-- settings.local.json             <- Your personal permissions
    |-- rules/
    |   |-- frontend.md                 <- Svelte/TS rules (path-scoped)
    |   +-- backend.md                  <- Rust rules (path-scoped)
    +-- skills/
        |-- review/SKILL.md             <- /review: code review
        |-- scan/SKILL.md               <- /scan: project health
        +-- sprint/SKILL.md             <- /sprint: execute sprint plans
```

### How to Clone This to Any New Project

1. **Your global stuff is already done** — it follows you to every project.
2. Open the new project in Claude Code.
3. Type `/onboard` — it creates CLAUDE.md, settings, and rules automatically.
4. Create any project-specific skills you need.
5. Add MCP servers if needed.

---

## 13. Starter Prompts

### Skills (Type These Directly)
```
/onboard                     Set up Claude config for a new project
/architect auth system       Design before coding
/debug-deep "TypeError..."   Investigate a bug
/review staged               Review git staged changes
/review src/auth.ts          Review a specific file
/explain src/scanner.ts      Explain code in plain English
```

### Everyday Prompts (No Skills Needed)

**Fix a broken build:**
```
The build is failing. Read the error, trace the root cause, fix it,
and verify it compiles. Do not change tests to match broken code.
```

**Summarize changes:**
```
Show me all changes on this branch compared to main. Group by file
and explain what each change does in one sentence.
```

**Find tech debt:**
```
Find all TODO, FIXME, HACK, XXX comments. List with file:line.
Categorize by severity.
```

**Understand unfamiliar code:**
```
I'm looking at [FILE]. Walk me through what this code does,
function by function, as if I'm new to this codebase.
```

**Context management:**
```
/clear                       Clear context for a fresh start
/context                     Check token usage and excluded items
/memory                      See all loaded memory files
/compact                     Manually compact context
```

---

## 14. Troubleshooting

### "Claude ignores my instructions"
1. Run `/memory` — is your CLAUDE.md loaded?
2. Is the file too long? Prune to under 60 lines.
3. Add emphasis: change "use strict mode" to "IMPORTANT: ALWAYS use strict mode"

### "My skill doesn't show up"
1. File must be at: `.claude/skills/NAME/SKILL.md` (inside a folder)
2. `user-invocable: true` must be in frontmatter
3. Restart the Claude session (skills load at start)
4. Check `/context` — skills may be excluded if too many exist

### "Claude keeps asking permission for the same command"
Add it to settings: `"Bash(the-command:*)"` in the allow array.

### "My hook doesn't run"
1. Check verbose mode (Ctrl+O) for hook output
2. Run the hook command manually to test it
3. Matcher is regex — `Edit|Write` not `Edit or Write`
4. jq must be installed for hooks that parse JSON

### "Claude is slow / running out of context"
1. `/clear` between unrelated tasks
2. Disable unused MCP servers
3. Keep CLAUDE.md short, use @imports sparingly
4. Check `/context` for token usage

### "Claude forgot what we were doing"
Context was compacted. Re-read key files:
```
Re-read the files we were working on and continue from where we left off.
Check the todo list for current progress.
```

---

## 15. Sources and References

**Official:**
- [Anthropic: Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Claude Code Docs: Best Practices](https://code.claude.com/docs/en/best-practices)
- [Claude Code Docs: Skills](https://code.claude.com/docs/en/skills)
- [Claude Code Docs: Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Anthropic: How to Configure Hooks](https://claude.com/blog/how-to-configure-hooks)
- [Anthropic: Building Skills Guide](https://claude.com/blog/complete-guide-to-building-skills-for-claude)
- [Claude Code Sandboxing](https://www.anthropic.com/engineering/claude-code-sandboxing)
- [2026 Agentic Coding Trends Report (PDF)](https://resources.anthropic.com/hubfs/2026%20Agentic%20Coding%20Trends%20Report.pdf)

**Community:**
- [The Complete Guide to CLAUDE.md](https://www.builder.io/blog/claude-md-guide)
- [How I Use Every Claude Code Feature](https://blog.sshh.io/p/how-i-use-every-claude-code-feature)
- [Claude Code Gotchas (DoltHub)](https://www.dolthub.com/blog/2025-06-30-claude-code-gotchas/)
- [Understanding Claude Code Full Stack](https://alexop.dev/posts/understanding-claude-code-full-stack/)
- [Claude Code Hooks Mastery](https://github.com/disler/claude-code-hooks-mastery)
- [Everything Claude Code (Config Collection)](https://github.com/affaan-m/everything-claude-code)
- [Awesome Claude Code (Curated List)](https://github.com/hesreallyhim/awesome-claude-code)
- [45 Claude Code Tips](https://github.com/ykdojo/claude-code-tips)
- [The Advanced Claude Code Setup Guide](https://blog.devgenius.io/the-advanced-claude-code-setup-guide-358f7b69334d)
- [Claude Code Mastery](https://github.com/TheDecipherist/claude-code-mastery)

---

*This is a living document. When you discover a new pattern, gotcha, or skill that works — add it.*
