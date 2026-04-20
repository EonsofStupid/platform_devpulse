

---

## 3. The 8 Recipe Categories + 3-Tier Gating

**8 categories** (for Recipe Browser organization, orthogonal to task types):
codegen, design, content, refactor, debug, planning, review, custom

**3 tiers** (gating):
- **community** — free, ships with app
- **pro** — paid tier
- **full** — platform/enterprise

One task archetype (BUILD/FIX/etc.) maps to one recipe template. Recipes
belong to categories for browsing. A BUILD recipe can exist in `codegen`
or `design` or `content` category.

---

## 4. Recipe Schema (ArkType — NOT Zod anymore)

```typescript
const PromptRecipeSchema = type({
  id: "string",
  version: "string",
  name: "string",
  description: "string",
  category: "'codegen'|'design'|'content'|'refactor'|'debug'|'planning'|'review'|'custom'",
  tier: "'community'|'pro'|'full'",
  dimensions: "COSTARDimension[]",
  autoContext: {
    "includeProjectConfig?": "boolean",
    "includeActiveTokens?": "boolean",
    "includeComponentContracts?": "string[]",
    "includeUserProfile?": "boolean",
    "includeConversationHistory?": "number",
  },
  "outputFormat?": "'costar-block'|'narrative'|'xml-structured'|'json'",
  "tags?": "string[]",
  "author?": "string",
  created: "string",
  modified: "string",
});
```


---

## 5. COSTARDimension — per-field config

```typescript
const COSTARDimensionSchema = type({
  key: "'context'|'objective'|'style'|'tone'|'audience'|'response'",
  gatherStrategy: "'ask'|'infer'|'template'|'hybrid'",
  label: "string",           // Layman question: "What are you building?"
  technicalLabel: "string",  // Technical: "Context"
  inferFrom: "string[]",     // e.g. ['project.config', 'minion.guardian']
  "defaultValue?": "string",
  examples: [{ layman: "string", converted: "string" }, "[]"],
});
```

---

## 6. The 6 COSTAR Dimensions + Auto-Fill Sources (THE KILLER INSIGHT)

**4 of 6 dimensions need ZERO user input.** This is what makes "1–2
sentences total" viable.

| Dim | Full name | Default strategy | Auto-fill source |
|-----|-----------|------------------|------------------|
| **C** | Context | infer | GUARDIAN + DIARY + REPO signals — project state, history, recent changes |
| **O** | Objective | ask (sometimes hybrid) | Fox intent classification + translation memory. **Only dimension requiring user typing in most flows.** |
| **S** | Style | infer | REPO pattern index — how this codebase writes things |
| **T** | Tone | infer | PSYCH frustration level + TEACHER competency depth |
| **A** | Audience | infer | TEACHER assessment + target model config (Claude vs GPT vs local) |
| **R** | Response | template | Task type default (BUILD→code, FIX→diff+explanation, PLAN→checklist, etc.) |

**Most user flows need typing only in O (Objective).** Everything else
is inferred. User sees the inferences on-screen and can tweak any of
them with one click.


---

## 7. Gathering Strategies (4 per dimension)

Every dimension declares HOW its value gets populated:

| Strategy | How it works | User effort | When to use |
|----------|-------------|-------------|-------------|
| **ask** | Recipe's `label` field IS the layman question, rendered as a2ui form field | Highest | Missing critical info no signal can supply |
| **infer** | Pull from 12+ sources (see below) | Zero | Well-established projects, known patterns |
| **template** | Recipe default value, used as-is | Zero | Standard patterns (Response format for BUILD is always a code block) |
| **hybrid** | Infer → show user → accept/adjust/reject. **Auto-promotion to pure infer after 3 accepted inferences at >0.8 confidence** | Low | First time for this pattern with this user |

**Hybrid flow:**
```
System infers: "Based on your project, I think the context is:
React 18 app, TypeScript, auth module, matching SignupForm.tsx"

User sees:  [✓ Looks right]  [✏️ Let me adjust]  [❌ Wrong]

✓ → auto-applied, no further questions
✏️ → editable field appears for that dimension only
❌ → falls back to 'ask' for that dimension
```

---

## 8. The 12 Infer Sources

| Source | What it provides | Storage |
|--------|-----------------|---------|
| `project.config` | Stack, framework, language | libSQL (project metadata) |
| `project.tokens` | Design tokens, theme config | ColdLight token pipeline |
| `project.contracts` | Component interfaces, API shapes | Qdrant (code patterns) |
| `user.profile` | Competency, preferences | libSQL (user profile) |
| `user.history` | Past prompt patterns, vocabulary | libSQL (translation_memory) |
| `conversation.context` | Current session state, recent msgs | Moka (session cache) |
| `minion.diary` | "We were working on X yesterday" | libSQL (diary entries) |
| `minion.guardian` | Active files, recent changes, drift | Qdrant + libSQL |
| `minion.psych` | Frustration level, urgency | In-memory (current state) |
| `minion.teacher` | Depth, domain mastery, terms known | libSQL |
| `minion.scribe` (Fox) | Translation patterns, vocabulary | libSQL (translation_memory) |
| `minion.vision` | What user is looking at (SigLIP2) | Qdrant (vision captures) |


---

## 9. The Canonical UI Layout

```
┌──────────────────────────────────────────────────────┐
│  CLYFFY PROMPT STUDIO                    [≡] [×]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  WHAT DO YOU NEED?                                   │
│  ┌──────────────────────────────────────────────┐   │
│  │ [Build] [Fix] [Plan] [Explore] [Explain]     │   │
│  └──────────────────────────────────────────────┘   │
│         ↑                                            │
│    Clyffy avatar changes here based on selection     │
│                                                      │
│  QUICK DESCRIBE (1-2 sentences):                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ "add user auth with google login"            │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ── CLYFFY AUTO-FILLS ──────────────────────────    │
│                                                      │
│  PROJECT:    [DevPulse ▼]      (from project.config) │
│  TARGET:     [interfaces/desktop ▼]   (from guardian)│
│  PATTERN:    [Match existing auth ▼]  (from scribe)  │
│  DEPTH:      [━━━━━●━━] Medium        (from teacher) │
│  URGENCY:    [━●━━━━━━] Low           (from psych)   │
│  TOOL:       [Cursor ▼] [Lovable ▼] [Claude ▼]      │
│                                                      │
│  ── TRANSFORMATION VIEW ────────────────────────    │
│  ┌────────────────────┬─────────────────────────┐   │
│  │ WHAT YOU SAID      │ WHAT CLYFFY RECEIVES    │   │
│  │ "add user auth     │ Context: React 18 app,  │   │
│  │  with google       │ TypeScript, existing     │   │
│  │  login"            │ auth in src/features/... │   │
│  │                    │                          │   │
│  │                    │ Objective: Implement     │   │
│  │                    │ Google OAuth 2.0 flow... │   │
│  │                    │ [6 COSTAR fields shown]  │   │
│  └────────────────────┴─────────────────────────┘   │
│                                                      │
│  [✏️ Edit] [📋 Copy] [🚀 Execute] [📝 Plan First]  │
│  [💾 Save as Recipe]                                 │
└──────────────────────────────────────────────────────┘
```


---

## 10. The 5 Action Buttons

| Button | What happens |
|--------|-------------|
| **Edit** | COSTAR+ fields become fully editable. **Teaching moment** — user learns structure by editing. |
| **Copy** | Full COSTAR+ prompt on clipboard. User pastes into Bolt/Lovable/Cursor. |
| **Execute** | Clyffy sends to local chat.brain (7B–14B) or API (per slot config). Response appears in chat tab. |
| **Plan First** | Clyffy decomposes into phases. Numbered checklist. Approve phase-by-phase before execute. |
| **Save as Recipe** | Current config saved as reusable template. User marks which dimensions are fixed (template) vs variable (ask/hybrid). |

---

## 11. The "Save as Recipe" Flow (LOCKED — Apr 6 2026)

**The agents/skills concept applied to prompt engineering.**

1. User crafts a prompt via the Studio (bare-minimum input → Clyffy auto-fills)
2. User clicks **Save as Recipe**
3. System persists the COSTAR+ configuration:
   - id, name, category, tier, dimensions (each with gatherStrategy),
     autoContext settings, outputFormat, tags
4. Next time user has similar task → recipe pre-fills everything,
   user makes slight alterations on `ask`/`hybrid` fields only
5. Template dimensions stay fixed across uses.
   Ask/hybrid dimensions prompt per-use.

**The 5 shipped templates** (BUILD→costar_plus, FIX→trace,
EXPLORE→create, PLAN→rodes, EXPLAIN→risen) are the defaults.
Users create their own via this flow.

**Custom Recipe Creator (P2)** — Pro users build recipes from scratch
with a dedicated editor: declare which dimensions are fixed vs
variable, what auto-context to include, what examples to show.


---

## 12. The Auto-Conversion Pipeline (8 Steps)

```
1. User types layman input in "Quick Describe" field
        ↓
2. Fox (SCRIBE) runs intent classification
   → TaskType enum (BUILD|FIX|EXPLORE|PLAN|EXPLAIN) + confidence
        ↓
3. Recipe selection
   → High confidence (>0.8) = auto-select recipe
   → Lower confidence = show top 1-3 recipe chips, user picks
   → No match = fall back to generic COSTAR composer
        ↓
4. Dimension extraction (per recipe.dimensions[])
   → For each dimension, run its gatherStrategy:
     infer: pull from sources listed in inferFrom[]
     ask: generate layman-friendly question, render a2ui form field
     template: use recipe.defaultValue
     hybrid: infer → show → let user accept/adjust/reject
        ↓
5. Layman → Technical transformation
   → Clyffy (local 0.6B or API) converts each layman answer
     into technical COSTAR language
        ↓
6. Teaching Moment (Transformation View)
   → Left pane: what user said (verbatim)
   → Right pane: what Clyffy receives (full COSTAR+ prompt)
        ↓
7. User acknowledgment
   → Edit: manual COSTAR mode, teaching moment
   → Copy: clipboard
   → Execute: Clyffy runs it
   → Plan First: decompose into checklist
   → Save as Recipe: persist as reusable template
        ↓
8. Delivery (per button chosen)
```


---

## 13. Clyffy Avatar — Category-Aware State Machine

**Tech stack (LOCKED):** Rive for animation. State machine in Rive
editor, triggered from Rust via Tauri commands. WASM runtime ~50KB.
Cel-shaded flat fills = Rive's sweet spot.

**Avatar behavior per task type:**

| Task type selected | Avatar state | Motion hint |
|-------------------|-------------|-------------|
| BUILD | Focused | Hands ready, slight nod when auto-fills complete |
| FIX | Concerned → A-ha | Magnifying glass, shifts to realization when classified |
| EXPLORE | Smug | Playful grin, subtle bounce |
| PLAN | Focused | Blueprint pose, steady hands |
| EXPLAIN | Teacher | Patient lean-forward, nodding |

**Transition timing:** 150–250ms ease-out when user clicks a task type
chip. Clyffy animates in before the form updates underneath.

**Additional states not tied to task type:**
- Pixelated retro Clyffy — Konami code easter egg for session
- Matrix rain — click avatar 5x
- ROTI celebration — on milestone hit
- First successful translation — achievement badge

**Avatar component name:** `ClyffyMascot.svelte` with prop
`state: TaskType | 'idle' | 'processing' | 'celebrating'`

---

## 14. a2ui Integration (LOCKED)

Interactions library: **a2ui**, forked from
`github.com/google/A2UI` (Agent-to-User Interface protocol).

**What a2ui does:** Clyffy emits declarative a2ui JSON instead of
plain text responses. The client renders a2ui using ColdLight
primitives as the component catalog.

**a2ui interaction types used in Prompt Studio:**

| a2ui type | When used in Studio | Example |
|-----------|---------------------|---------|
| `multiple_choice` | Ambiguous intent classification | "Did you mean: (A) Login (B) Signup (C) Both?" |
| `example_preview` | Pattern matching from REPO | "Which pattern? [SignupForm] [ProfileForm]" |
| `text_input` | Missing specific detail | "OAuth provider? [Google] [GitHub]" |
| `slider` | Degree/intensity (DEPTH, URGENCY) | Teacher depth, Psych urgency |
| `confirmation` | Before Execute | "Ready to execute? Here's the plan:" |
| `internet_ref` | External context needed | Show relevant docs/examples |

The `hybrid` gatherStrategy uses `confirmation` + `example_preview`
to show the inference and collect user approval.


---

## 15. COSTAR Gate (Context Adequacy — 3 Levels)

Not every user input has enough signal to auto-fill. The gate
determines whether to proceed or ask.

| Level | Color | Meaning | Action |
|-------|-------|---------|--------|
| **RED** | `#EF4444` | Insufficient context | MUST ask clarifying questions via a2ui |
| **TEAL** | `#14B8A6` | Usable but incomplete | Can proceed with caution, warning shown |
| **GREEN** | `#22C55E` | Full context | Execute with confidence |

Gate color surfaces in the UI as a thin status line under the
Transformation View.

---

## 16. Continuation Flow ("still ongoing" / "same issue")

**Trigger:** User types any of: "still ongoing", "continue", "same
issue", "last time", "you were helping" — OR clicks dedicated
**"Continue Last"** button next to Execute.

**Pipeline:**
1. Fox detects continuation phrase OR button clicked
2. DIARY fetches last 3–5 prompts from current session
3. Fox synthesizes unresolved thread: original issue + attempts + outcomes
4. UI shows **Verify Card** with checkboxes:
   ```
   Continuing from your last thread:

   ☑ Original issue: [summary]
   ☑ Tried: [attempt 1 + outcome]
   ☑ Tried: [attempt 2 + outcome]
   ☐ Still blocked on: [user fills this]
   ```
5. User confirms / edits / removes lines
6. System builds continuation COSTAR:
   - Context = synthesized recap (GREEN auto-fill)
   - Objective = user's new angle (freshly typed)
   - Style/Tone/Audience/Response = inherited from prior prompt
7. Standard action buttons available

**Both the keyword AND the button exist.** Keyword for natural flow,
button for deliberate intent.


---

## 17. COSTAR Assembly Function (Rust pseudocode)

This is what actually runs when the user hits Execute or Copy:

```rust
fn assemble_costar(
    psych: PsychOutput,
    scribe: ScribeOutput,  // Fox
    teacher: TeacherOutput,
    diary: DiaryOutput,
    repo: RepoOutput,
    vision: VisionOutput,
) -> CostarPrompt {
    // 1. Select recipe template based on task type
    let recipe = match scribe.task {
        BUILD   => load_recipe("costar_plus.md"),
        FIX     => load_recipe("trace.md"),
        EXPLORE => load_recipe("create.md"),
        PLAN    => load_recipe("rodes.md"),
        EXPLAIN => load_recipe("risen.md"),
    };

    // 2. CONTEXT: repo + diary
    let context = repo.project_summary()
        + repo.active_patterns()
        + repo.recent_changes(5)
        + diary.session_summary();

    // 3. OBJECTIVE: Fox's translation output
    let objective = scribe.out.val;

    // 4. STYLE: repo patterns, overridden by frustration
    let style = if psych.fru >= HIGH {
        "Direct. No preamble. Root cause first."
    } else {
        repo.style_guidance()
    };

    // 5. TONE: teacher.depth × psych.frustration matrix
    let tone = match (teacher.dep, psych.fru) {
        (_, RAGE)  => "URGENT. Skip explanations. Fix immediately.",
        (_, HIGH)  => "Direct. Brief context. Then fix.",
        (ELI5, _)  => "Explain like I'm 5. Analogies. No jargon.",
        (BEG, _)   => "Simple terms. Define technical words.",
        (INT, _)   => "Standard technical.",
        (ADV, _)   => "Full technical. Industry terms OK.",
        (TECH, _)  => "Expert. Skip basics.",
    };

    // 6. AUDIENCE: target model + llguidance constraints
    let audience = build_audience(teacher, target_model_config());

    // 7. RESPONSE: per task type defaults
    let response = recipe.response_format();

    // 8. Compile final structured prompt
    CostarPrompt { context, objective, style, tone, audience, response }
}
```


---

## 18. Storage Locations (LOCKED)

| Data | Storage | Path |
|------|---------|------|
| Shipped recipes | Filesystem | `shared/src/prompts/recipes/*.md` |
| User recipes | libSQL | `user_recipes` table |
| Translation memory | libSQL | `translation_memory` table |
| DIARY entries | libSQL | `diary_entries` table |
| PSYCH state | In-memory | Moka (ephemeral) |
| TEACHER profile | libSQL | `user_profile` table |
| GUARDIAN signals | Qdrant + libSQL | vector index + metadata |
| VISION captures | Qdrant | vector index |
| Fox training pairs | DuckDB | `fox_training.jsonl` |
| Session cache | Moka | In-memory, TTL |

---

## 19. Architecture Boundary

**Svelte = dumb UI.** Renders a2ui, dispatches button clicks, shows
state. No business logic.

**Tauri/Rust = everything else.** Recipe schema validation, Fox
classification, dimension inference, COSTAR assembly, delivery
routing, training pair capture.

**Why this matters:** When a button click doesn't do what the user
expects, the bug is in Rust. Svelte is literally just rendering.

---

## 20. What Makes This Different From Other Prompt Builders

Other tools: "Fill out these 12 fields to build a COSTAR prompt."
User quits at field 4.

**DevPulse Prompt Studio:** User types 1–2 sentences. 4 of 6 COSTAR
dimensions auto-fill from minion signals. User sees the
transformation visually. One of four action buttons. Optionally
saves as recipe for next time.

**The teaching moment is the product.** Users learn prompting by
watching the delta between "what I said" and "what AI receives," not
by reading docs.

**Every Studio interaction generates supervised training pairs** —
layman input → Clyffy's structured output → user accept/edit/reject.
Cleanest training signal in the system.


---

## 21. Open Items / P2+ Work

These are captured but NOT shipped-day-one:

- **Custom Recipe Creator** — Pro-tier dedicated editor where
  users build recipes from scratch declaring fixed vs variable
  dimensions, auto-context rules, examples shown
- **Recipe sharing / marketplace** — Export recipes as files, share
  via URL, import from community (discussed Apr 2026, not locked)
- **Voice-driven flow** — Talk instead of type, Rosetta cleans the
  transcript, structures on the fly (discussed, not sequenced)
- **External tool handoff UI** — Scribe tab pipeline (Draft → Plan
  → Pack → Preview → Execute) for pushing prompts to Cursor /
  Bolt / Lovable via automation layer
- **Recipe-to-Skill promotion** — Auto-suggest turning a
  frequently-used recipe into a proper agent/skill

---

## 22. Sessions consolidated into this spec

Each row cites a conversation where this was discussed:

| Date | Session | What was locked |
|------|---------|-----------------|
| Dec 2025 | Renaming coordinator to orchestrator | 5 task archetypes (BUILD/FIX/EXPLORE/PLAN/EXPLAIN), recipe file names, intent classification pipeline |
| Mar 27 2026 | ColdLight VPB and configuration system | Recipe schema (Zod initially), teaching philosophy, 4 gather strategies |
| Mar 29 2026 | A2UI fork + Clyffy rename | a2ui library, Clyffy persona name, prompt management UI as separate surface |
| Apr 1 2026 | Vibe coder education + pain points | Rive chosen for avatar animation, cel-shaded style confirmed |
| Apr 6 2026 | Verification of authenticity | Third window, Prompt Studio layout, 4 action buttons, COSTAR gate levels |
| Apr 15 2026 | effing.ai scrape + refresh | Save as Recipe flow, pixelated easter egg, ArkType migration, 12 infer sources, 3-tier gating |

---

*End of consolidated spec. When this conflicts with session memory
or older spec docs, THIS file wins. Next action: build the
`interfaces/desktop/src/lib/domains/prompt-studio/` module following
this contract.*
