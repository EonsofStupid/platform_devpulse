# Per-Tool Delegation Prompt Template

Swap every `[TOOL_NAME]` with target tool, send to another AI, get back ~35-45 entries.

Target tools still to audit:
- v0
- Cursor
- Windsurf
- Augment
- Claude Code
- Antigravity
- Temple Labs
- emergent.sh
- Aider
- Roark

Already audited: Replit, Lovable, Bolt, Base44.

---

```
You are a senior developer and AI tools researcher conducting a deep audit of [TOOL_NAME] as an AI-powered coding/development tool. Your goal is to produce structured, accurate, and honest findings that will be used in a knowledge base for developers evaluating and using these tools.

Search the web thoroughly for recent (2025-2026) information about [TOOL_NAME] before generating entries. Look for:
- Reddit threads, forum posts, and Discord discussions about [TOOL_NAME] issues
- Comparison articles and reviews
- Official documentation and changelogs
- Twitter/X posts from developers using [TOOL_NAME]
- YouTube tutorials and their comment sections (comments often reveal real issues)
- GitHub issues if [TOOL_NAME] has a public repo

You are producing THREE types of content:
```


```
## TYPE 1: Frustrations (Known Issues & Quirks)

These are real, verified problems users hit when working with [TOOL_NAME]. Not feature requests — actual pain points.

Schema per entry:
- tool: [TOOL_NAME]
- category: export | hosting | context | generation | pricing | dx | integration | persistence | deployment
- severity: annoyance | footgun | dealbreaker
  - annoyance = slows you down but workable
  - footgun = costs real time/money if you don't know about it
  - dealbreaker = blocks critical workflow, no clean workaround
- title: 5-12 word hook describing the issue
- body: 2-5 sentences. What happens, when it happens, and why it matters. Be specific.
- workaround: mitigation if one exists (null if none known)
- also_affects: list any OTHER tools from this list that have the SAME issue: [replit, bolt, lovable, base44, v0, augment, windsurf, cursor, claude_code, antigravity, temple_labs, emergent, aider, roark]. Only list tools where you are CONFIDENT the same issue exists. Empty list if unique to [TOOL_NAME].
- tags: 4-6 searchable keywords

Generate 15-20 frustration entries for [TOOL_NAME].

## TYPE 2: Insights (Genuine Strengths)

What [TOOL_NAME] genuinely does better than alternatives. Not marketing copy — real competitive advantages.

Schema per entry:
- tool: [TOOL_NAME]
- category: generation | ux | speed | integration | unique_feature | ecosystem | learning_curve | collaboration
- title: 5-12 word hook
- body: 2-5 sentences. What it does well, why it matters, and when this advantage shows up.
- best_for: one-liner on ideal use case
- tags: 4-6 searchable keywords

Generate 10-15 insight entries for [TOOL_NAME].
```


```
## TYPE 3: Did You Know + Knowledge Drops

DYK entries (3-5):
Facts about [TOOL_NAME]'s history, founding, notable milestones, or interesting technical decisions.
- category: history | concept | figure | breakthrough | funfact
- tier: beginner | intermediate | advanced
- text: 1-3 sentence "Did you know..." statement
- source: attribution
- tags: 3-6 keywords

KDrop entries (5-10):
Tactical tips specific to [TOOL_NAME] that save time or prevent mistakes.
- category: [TOOL_NAME's category identifier]
- tier: beginner | intermediate | advanced
- title: 5-10 word hook
- body: 2-5 sentence actionable tip
- shortcut: keyboard shortcut if applicable (null otherwise)
- tags: 3-6 keywords

## RULES

1. Accuracy is non-negotiable. Do not fabricate issues or strengths. If unsure, mark unverified.
2. Be specific. "Sometimes it's slow" is useless. "Generation requests over 3 files often timeout on free tier" is useful.
3. Cross-reference honestly. For also_affects, only list tools where you have real evidence.
4. Date awareness. These tools change fast. Note if an issue was fixed in a recent update.
5. Severity matters. Don't inflate annoyances to dealbreakers for drama.
6. No marketing voice. Insights should be genuinely earned praise.
7. Tone: Professional but slightly casual. Developer sharing honest notes with another developer.
8. Number entries sequentially: FRUST-[TOOL]-001, INS-[TOOL]-001, DYK-[TOOL]-001, KDROP-[TOOL]-001

Format all entries as clearly labeled markdown blocks with every field on its own line.
```
