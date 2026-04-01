# CLAUDE KNOWLEDGE BASE — DevPulse Platform

| Field | Value |
|-------|-------|
| **Status** | `ACTIVE` |
| **Version** | `1.1.0` |
| **Created** | `2026-03-31` |
| **Owner** | `@jesse` |
| **Context** | Claude Code v2.1.88 leak + Anthropic published research |

---

## Structure

```
claude.kb/
├── INDEX.md                              ← You are here
├── CONSOLIDATED_REFERENCE.md             ← All docs condensed (~150 lines)
├── DIFF_CURRENT_VS_PROPOSED.md           ← Review doc: current vs baseline
│
├── countermeasures/
│   └── CLAUDE_CODE_COUNTERMEASURES.md    ← 14 confirmed issues + overrides
│
├── tactics/
│   └── TACTICAL_REFERENCE.md            ← Keywords, effort, hooks, domains
│
├── user-tiers/
│   └── TIERS_AND_PAIN_POINTS.md         ← 4-tier model, Anthropic data
│
├── gotchas/
│   └── OBVIOUS_GOTCHAS.md              ← 20 gotchas sorted by effort
│
├── product/
│   └── EMOTIONAL_TRANSLATION_LAYER.md   ← PSYCH middleware (product moat)
│
├── build-queue/
│   └── BUILDABLE_TOOLS.md              ← 10 tools, 4 weeks, distribution
│
└── baselines/
    ├── generic/                         ← Any-project template
    │   ├── CLAUDE.md.template           ← Fill-in-the-blank (51 lines)
    │   ├── settings.json.template       ← 4 hooks pre-wired
    │   ├── rules/countermeasures.md     ← Universal CC overrides
    │   └── hooks/
    │       ├── auto-format.js           ← Polyglot (Rust/TS/Svelte/Python)
    │       └── verify-on-stop.js        ← Polyglot verification gate
    │
    └── devpulse/                        ← DevPulse-specific
        ├── CLAUDE.md                    ← 54 lines (down from 104)
        ├── COLDLIGHT_CHILD_CLAUDE.md    ← Saves ~30 instruction slots
        ├── SETTINGS_MERGE_REFERENCE.json← What to add to existing settings
        ├── rules/
        │   ├── claude-code-countermeasures.md
        │   ├── rust.md (4→11 rules)
        │   ├── svelte.md (5→11 rules)
        │   └── preflight-trimmed.md (138→60 lines)
        └── hooks/
            ├── verify-on-stop.js        ← Per-crate targeting
            └── psych-translator.js      ← CC-009 frustration translation
```

All hooks are Node.js (.js) for Windows compatibility.
All bash (.sh) versions are preserved as fallback for Unix systems.

---

## Key Numbers

| Metric | Value | Source |
|--------|-------|--------|
| Instruction budget | ~150-200 total, system eats ~50 | HumanLayer + community |
| False claims rate | 29-30% (Capybara v8) | Leaked source |
| Prompt ↔ output quality | 0.92 correlation | Economic Index Jan 2026 |
| Skill loss with AI delegation | -17% | Anthropic RCT |
| Fully delegatable (even experts) | 0-20% | Agentic Coding 2026 |
| Iterate but don't verify | 85.7% iterate, LOW verify | AI Fluency Index |
| CLAUDE.md compliance | ~80% | Anthropic docs + community |
| Hook compliance | 100% (deterministic) | Architecture |
| Claude Code ARR | ~$2.5B | VentureBeat/Fortune |

## Deployment

See `DIFF_CURRENT_VS_PROPOSED.md` for:
- 10-step deployment order (additive first, replacements last)
- Budget analysis (current ~179/200 → proposed ~177/200 better distributed)
- 5 questions for Jesse before risky steps
- Risk rating per step

Steps 1-6 are additive (safe). Steps 7-8 are replacements (need review).

## Next Actions

1. Delete PLACE_DOWNLOAD_HERE.md placeholders (6 files)
2. Execute deployment steps 1-6 in Claude Code session
3. Answer 5 questions in DIFF doc
4. Execute steps 7-10 after review
5. Test: full session, /memory verify, hook firing
