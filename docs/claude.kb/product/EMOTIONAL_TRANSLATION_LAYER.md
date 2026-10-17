# THE EMOTIONAL TRANSLATION LAYER — Product-Defining Insight

| Field | Value |
|-------|-------|
| **Status** | `REFERENCE` |
| **Created** | `2026-03-31` |
| **Connects** | CC-009 (frustration regex) → PSYCH agent → SCRIBE → COSTAR+ |
| **Why this matters** | Nobody else is building this. |

---

## THE PROBLEM (CONFIRMED)

Claude Code `userPromptKeywords.ts` contains regex detecting frustration/profanity.
When triggered: model shifts to apologetic/cautious mode. LESS precise. MORE hedging.
This is BACKWARDS. Frustration = moment user needs MAXIMUM precision.

Community advice: "Don't swear." That's telling users to change for the tool.
DevPulse exists to do the opposite.

---

## WHAT EVERY OTHER PRODUCT DOES

```
User: "this is fucking broken again"
  → frustration regex fires → apologetic mode
  → "I apologize for the confusion. Let me carefully..."
  → Band-aid fix, hedging → User MORE frustrated → Cycle repeats
```

## WHAT DEVPULSE DOES

```
User: "this is fucking broken again"
  → PSYCH intercepts BEFORE model sees it
  → Extracts: FRUSTRATION (high) + "again" = RECURRING + target = the code
  → SCRIBE translates: "Recurring failure in [DIARY context].
     Previous fix at [timestamp] didn't resolve root cause.
     Priority: structural fix. Skip preamble."
  → COSTAR+ assembled WITHOUT profanity triggers
  → Model receives: precise technical request + urgency signal
  → Model responds: direct root cause + structural fix
```

**The user NEVER has to modify their behavior for the tool.**

---

## PSYCH SIGNAL TAXONOMY

| Signal type | Examples | PSYCH interpretation |
|-------------|----------|---------------------|
| Profanity at tool | "fuck you", "you're useless" | Tool frustration. Extract technical need. |
| Profanity at code | "this is fucking broken" | Code frustration. Find what's broken. Fix it. |
| Resignation | "this sucks", "I give up" | Near-abandonment. Surface quick win first. |
| Escalating caps | "WHY IS THIS STILL BROKEN" | Urgency + repetition. Check DIARY for recurrence. |
| Sarcasm | "oh great, another one" | Fatigue. Acknowledge briefly, then fix. |
| Short hostile | "fix it" / "again" / "no" | Maximum frustration, minimum words. Context is obvious. |
| Confused frustration | "I don't even know what's wrong" | Lost. TEACHER moment. Explain WHAT's wrong. |

### NON-FRUSTRATION (do NOT intercept)

| Signal | Why leave alone |
|--------|----------------|
| "fuck yeah that worked" | Celebration |
| Error contains profanity | Literal, not emotional |
| Profanity in variable names | Humor |
| "holy shit this is cool" | Positive, amplify |

---

## COMPETITIVE GAP

| Product | How they handle frustration |
|---------|---------------------------|
| Claude Code | Regex → apologetic mode (WORSE) |
| Cursor | No detection. Ignores entirely. |
| Copilot | No detection. Pure autocomplete. |
| Bolt/Lovable | No detection. |
| **DevPulse** | **Intercepts → extracts need → amplifies precision** |

---

## PIPELINE

```
User Input → PSYCH (emotional extraction) → SCRIBE (technical translation)
→ ENFORCER (validation) → outbound prompt (clean, no triggers)
```

PSYCH is ALWAYS running. Not opt-in. Part of the signal processing chain.

## DATA CONNECTIONS

- 0.92 correlation (prompt quality ↔ output quality): Frustration DEGRADES prompt quality. PSYCH maintains it regardless of emotional state.
- -17% skill formation: Frustrated users delegate aggressively ("just fix it") → skill atrophy. PSYCH routes to TEACHER when appropriate.
- 85.7% iterate but LOW verify: ENFORCER forces verification regardless of user frustration level.

## PRE-DEVPULSE PARTIAL FIX (CLAUDE.md)

```
When user expresses frustration:
- Do NOT apologize or hedge
- Do NOT enter cautious mode
- Extract the technical need from the emotional signal
- Respond with DIRECT action: identify problem, state fix, implement
- Skip preamble. No "I understand your frustration." Just fix it.
- If recurring: say so, identify WHY previous fix failed
```

Can't fully strip profanity from reaching model. Only true middleware (DevPulse) can.

## ONE-LINER

**"Every other product tells users to stop being human. DevPulse translates being human into better results."**
