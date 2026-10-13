# NORMALIZER TRAINING DATA ARCHITECTURE
# How to build the translator that makes Clyffy see perfect prompts

| Field | Value |
|-------|-------|
| **Status** | `SPEC — TRAINING PIPELINE` |
| **Version** | `1.0.0` |
| **Created** | `2026-04-06` |
| **Connects** | PSYCH + SCRIBE + TEACHER → COSTAR+ → Clyffy brain |
| **Storage** | DuckDB (training pairs), Turso (translation memory), Qdrant (pattern vectors) |
| **Goal** | User types 6 angry words. Clyffy sees a perfect COSTAR+ spec. |

---

## THE CORE PROBLEM

```
What the user types:     "this is fucking broken again"
What CC-009 does:         triggers apologetic mode, precision drops
What Clyffy SHOULD see:   {
  context: "Recurring failure in auth module. Previous fix at 14:23 
            didn't resolve root cause. User has hit this 3 times.",
  objective: "Identify root cause of recurring auth failure, not 
              another patch",
  style: "Direct. No preamble. Show the fix.",
  tone: "URGENT — user frustration level HIGH",
  audience: "14B local model, structured output",
  response: "Root cause + structural fix + why previous fix failed"
}
```

**The normalizer is the function: raw_input → perfect_costar**

---

## ARCHITECTURE: THREE ENCODERS + ASSEMBLER

```
Raw User Input
    │
    ├──→ PSYCH Encoder (emotional signal extraction)
    │      Output: FrustrationLevel, EmotionTarget, Urgency, Recurrence
    │
    ├──→ SCRIBE Encoder (intent + vocabulary translation)  
    │      Output: TaskType, TranslatedObjective, MissingDimensions
    │
    ├──→ TEACHER Encoder (competency assessment)
    │      Output: Depth, Terminology level, Concepts to introduce
    │
    └──→ Context Aggregator
           │ DIARY: session history, recurrence detection
           │ REPO: active files, patterns, recent changes
           │ VISION: what user is looking at (if available)
           │
           ▼
    COSTAR+ Assembler (deterministic, not ML)
           │
           ▼
    Perfect prompt → Clyffy brain (14B or API)
```

### Key: The assembler is NOT ML. It's deterministic template hydration.
### The three ENCODERS are what get trained.

---

## ENCODER 1: PSYCH — Emotional Signal Extraction

### What it produces (per message)

```rust
pub struct PsychOutput {
    pub fru: FrustrationLevel,  // NONE|LOW|MED|HIGH|RAGE
    pub tgt: EmotionTarget,     // TOOL|CODE|SELF|OTHER
    pub urg: f32,               // 0.0-1.0 urgency
    pub rec: bool,              // recurring issue detected
    pub pos: bool,              // positive signal (celebration, not frustration)
}
```

### Training pair format (JSONL in DuckDB)

```jsonl
{"input":"this is fucking broken again","ctx":"auth.rs open, 3rd time today","output":{"fru":"RAGE","tgt":"CODE","urg":0.95,"rec":true,"pos":false}}
{"input":"WHY IS THIS STILL BROKEN","ctx":"same file, caps lock","output":{"fru":"HIGH","tgt":"CODE","urg":0.9,"rec":true,"pos":false}}
{"input":"fix it","ctx":"error dialog visible","output":{"fru":"MED","tgt":"CODE","urg":0.7,"rec":false,"pos":false}}
{"input":"fuck yeah that worked","ctx":"test passed","output":{"fru":"NONE","tgt":"CODE","urg":0.0,"rec":false,"pos":true}}
{"input":"I don't even know what's wrong","ctx":"no error, confused","output":{"fru":"MED","tgt":"SELF","urg":0.5,"rec":false,"pos":false}}
{"input":"add a login page","ctx":"new feature request","output":{"fru":"NONE","tgt":"OTHER","urg":0.3,"rec":false,"pos":false}}
{"input":"this sucks I give up","ctx":"4th failed attempt","output":{"fru":"RAGE","tgt":"TOOL","urg":1.0,"rec":true,"pos":false}}
```

### Frustration handling rules (NOT ML — hardcoded in assembler)

| FrustrationLevel | Assembler behavior |
|-----------------|-------------------|
| NONE | Normal COSTAR+ assembly |
| LOW | Add urgency flag, skip preamble |
| MED | Strip profanity from context, add "direct response" directive |
| HIGH | Strip ALL emotional content, inject "root cause" priority, no apologies |
| RAGE | Maximum translation: extract technical need only, add recurrence check, "fix it NOW" directive |

### What PSYCH tells the user (Clyffy narration, NOT suppressed)

| FrustrationLevel | Clyffy says |
|-----------------|-------------|
| NONE | (nothing, normal flow) |
| LOW | (nothing, just faster) |
| MED | "On it." (then fixes) |
| HIGH | "I hear you. Let me find the actual problem." (then fixes) |
| RAGE | "I know this keeps happening. Let me find WHY this time, not just patch it." |

**Critical design: Clyffy acknowledges the frustration BRIEFLY then pivots to action.**
**The user can disable this acknowledgment in settings. Toggle: `clyffy.acknowledge_frustration = true|false`**
**When disabled: Clyffy just fixes. No emotional acknowledgment at all.**

---

## ENCODER 2: SCRIBE — Intent Classification + Vocabulary Translation

### What it produces (per message)

```rust
pub struct ScribeOutput {
    pub mat: MatchStatus,        // HIT|SIM|NEW
    pub cfd: f32,                // match confidence
    pub inp: BoundedPhrase,      // user's vibe-speak
    pub out: BoundedPhrase,      // engineer-speak translation
    pub qty: TranslationQuality, // GOOD|FAIR|POOR|UNK
    pub task: TaskType,          // BUILD|FIX|EXPLORE|PLAN|EXPLAIN
    pub missing: Vec<CostarDim>, // which COSTAR dimensions need filling
}
```

### The 5 Task Archetypes (locked from Dec 2025 session)

| TaskType | Trigger signals | Recipe | Example raw input |
|----------|----------------|--------|-------------------|
| BUILD | "add", "create", "make", "implement" | COSTAR+ | "add a login page" |
| FIX | "fix", "broken", "error", profanity+technical | TRACE | "this garbage doesn't work" |
| EXPLORE | "how could", "what if", "brainstorm" | CREATE | "what are some ways to monetize" |
| PLAN | "plan", "steps", "roadmap", "architecture" | RODES | "plan out the auth system" |
| EXPLAIN | "what is", "how does", "explain" | RISEN | "what is an API" |

### Training pair format (JSONL in DuckDB)

```jsonl
{"input":"add the login thing","ctx":{"project":"react-app","recent_files":["SignupForm.tsx"]},"output":{"task":"BUILD","mat":"HIT","cfd":0.92,"inp":"add the login thing","out":"Create LoginForm component in src/features/auth/ matching SignupForm.tsx pattern","missing":[]}}
{"input":"fix it","ctx":{"error":"401 in auth.rs:42","recent":"auth refactor"},"output":{"task":"FIX","mat":"SIM","cfd":0.7,"inp":"fix it","out":"Debug 401 error in auth.rs line 42, likely borrow checker issue","missing":["style"]}}
{"input":"make it pretty","ctx":{"file":"Button.svelte"},"output":{"task":"BUILD","mat":"HIT","cfd":0.85,"inp":"make it pretty","out":"Apply ColdLight Tailwind styling with hover/focus states to Button.svelte","missing":[]}}
{"input":"hook it up","ctx":{"service":"authService","component":"LoginForm"},"output":{"task":"BUILD","mat":"HIT","cfd":0.88,"inp":"hook it up","out":"Integrate LoginForm with authService.login() using existing useAuth hook","missing":[]}}
```

### Translation Memory (Turso, persists across sessions)

```sql
CREATE TABLE translation_memory (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    vibe_phrase TEXT NOT NULL,       -- "the login thing"
    dev_translation TEXT NOT NULL,   -- "auth/login feature"
    confidence REAL DEFAULT 0.5,
    times_used INTEGER DEFAULT 1,
    times_accepted INTEGER DEFAULT 0,
    times_rejected INTEGER DEFAULT 0,
    last_used TEXT,
    context_tags TEXT,               -- JSON: ["auth", "react", "form"]
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Rule: After 3 accepted uses at >0.8 confidence, promote to "auto-apply" — SCRIBE stops asking for confirmation.**

---

## ENCODER 3: TEACHER — Competency + Terminology Calibration

### What it produces

```rust
pub struct TeacherOutput {
    pub dep: Depth,              // ELI5|BEG|INT|ADV|TECH
    pub dom: Domain,             // FE|BE|DB|AI|INF|GEN
    pub mas: Mastery,            // 0-3 (for this domain)
    pub got: Vec<BoundedTerm>,   // terms user has mastered (max 3)
    pub nxt: Vec<BoundedTerm>,   // terms to introduce next (max 3)
}
```

### How TEACHER calibrates the COSTAR+ tone dimension

| Depth | COSTAR+ tone | Example |
|-------|-------------|---------|
| ELI5 | "Explain like I'm 5. No jargon. Analogies." | Tier 0 user |
| BEG | "Use simple terms. Define technical words inline." | Tier 1 user |
| INT | "Standard technical. Assume basic framework knowledge." | Tier 2 user |
| ADV | "Full technical. Industry terminology OK." | Tier 3 user |
| TECH | "Expert. Skip basics. Focus on implementation." | Tier 3+ / Jesse |

### Training pairs (from real usage telemetry)

```jsonl
{"input":"what is an API","ctx":{"session_concepts":[]},"output":{"dep":"ELI5","dom":"GEN","mas":"0","got":[],"nxt":["API","endpoint","request"]}}
{"input":"the useEffect keeps firing","ctx":{"session_concepts":["hooks","state"]},"output":{"dep":"INT","dom":"FE","mas":"2","got":["hooks","state"],"nxt":["dependency array","cleanup"]}}
{"input":"borrow checker won't let me move this","ctx":{"session_concepts":["ownership","lifetimes"]},"output":{"dep":"ADV","dom":"BE","mas":"2","got":["ownership","lifetimes"],"nxt":["Pin","PhantomData"]}}
```

---

## THE COSTAR+ ASSEMBLER (Deterministic, not ML)

The assembler takes outputs from all 3 encoders + context sources and produces
the final prompt. This is template hydration, not inference.

### Recipe Templates (5 archetypes, stored as .md in shared/)

```
shared/src/prompts/recipes/
├── costar_plus.md    ← BUILD tasks
├── trace.md          ← FIX tasks
├── create.md         ← EXPLORE tasks
├── rodes.md          ← PLAN tasks
└── risen.md          ← EXPLAIN tasks
```

### Assembly flow (pseudocode)

```rust
fn assemble_costar(
    psych: &PsychOutput,
    scribe: &ScribeOutput,
    teacher: &TeacherOutput,
    diary: &DiaryContext,
    repo: &RepoContext,
    vision: Option<&VisionContext>,
) -> CostarPrompt {
    // 1. Select recipe template based on task type
    let recipe = match scribe.task {
        BUILD   => load_recipe("costar_plus.md"),
        FIX     => load_recipe("trace.md"),
        EXPLORE => load_recipe("create.md"),
        PLAN    => load_recipe("rodes.md"),
        EXPLAIN => load_recipe("risen.md"),
    };
    
    // 2. Hydrate CONTEXT dimension
    let context = format!(
        "{project_info}\n{repo_patterns}\n{recent_changes}\n{diary_session}",
        project_info = repo.project_summary(),
        repo_patterns = repo.active_patterns(),
        recent_changes = repo.recent_changes(5),
        diary_session = diary.session_summary(),
    );
    
    // 3. Hydrate OBJECTIVE dimension (SCRIBE's translation)
    let objective = scribe.out.val.clone();
    
    // 4. Hydrate STYLE dimension (from REPO + frustration override)
    let style = if psych.fru >= HIGH {
        "Direct. No preamble. Root cause first. Structural fix."
    } else {
        &repo.style_guidance()
    };
    
    // 5. Hydrate TONE dimension (from TEACHER + PSYCH)
    let tone = match (teacher.dep, psych.fru) {
        (_, RAGE)  => "URGENT. Skip explanations. Fix immediately.",
        (_, HIGH)  => "Direct. Brief context. Then fix.",
        (ELI5, _)  => "Explain like I'm 5. Analogies. No jargon.",
        (BEG, _)   => "Simple terms. Define technical words.",
        (INT, _)   => "Standard technical.",
        (ADV, _)   => "Full technical. Industry terms OK.",
        (TECH, _)  => "Expert. Skip basics.",
    };
    
    // 6. Hydrate AUDIENCE (which model, what constraints)
    let audience = format!("{model_info}\n{constraint_info}",
        model_info = current_model_context(),
        constraint_info = llguidance_schema_if_needed(),
    );
    
    // 7. Hydrate RESPONSE format
    let response = match scribe.task {
        BUILD => "Single file. Match existing patterns. Include types.",
        FIX   => "Root cause. Fix. Verification command.",
        PLAN  => "Numbered phases. Max 5 files per phase.",
        _     => recipe.default_response_format(),
    };
    
    // 8. Apply frustration overrides (CC-009 countermeasure)
    if psych.fru >= MED {
        prompt.prepend("Do NOT apologize. Do NOT hedge. Direct action.");
    }
    if psych.rec {
        prompt.prepend("RECURRING ISSUE. Find root cause, not patch.");
    }
    
    CostarPrompt { context, objective, style, tone, audience, response }
}
```

**The user NEVER sees this assembly.** They type 6 words. Clyffy responds with the result.
**The user CAN see it** if they want: "Show me what you translated" button in UI.
**This is the Teaching Without Lecturing moment:** user sees the translation, learns COSTAR naturally.

---

## TRAINING DATA COLLECTION (Self-Generating from Usage)

### The Loop (from Dec 2025 session, locked)

```
User interacts with Clyffy
    │
    ├── PSYCH logs: emotional signal + indicators
    ├── SCRIBE logs: vibe input + translation + task type
    ├── TEACHER logs: depth + domain + mastery assessment
    │
    ▼
Clyffy generates response via assembled COSTAR+
    │
    ▼
User reacts:
    ├── ACCEPTED (no edits, task succeeds) → positive training signal
    ├── EDITED (user modified output) → partial signal + correction pair
    ├── REJECTED (user said "no" or re-prompted) → negative signal
    ├── ABANDONED (user /cleared or left) → strong negative signal
    │
    ▼
Training pairs written to DuckDB:
    ├── psych_training:  input + context → emotional classification
    ├── scribe_training: input + context → intent + translation
    ├── teacher_training: input + context → depth + domain
    ├── assembly_quality: full COSTAR+ → outcome (accept/edit/reject)
    │
    ▼
Nightly: export → validate → train LoRA adapters (Python dev env only)
Weekly: promote best adapter if metrics improve
```

### DuckDB Training Tables

```sql
-- Every user message
CREATE TABLE raw_interactions (
    id TEXT PRIMARY KEY,
    session_id TEXT,
    timestamp TIMESTAMPTZ,
    raw_input TEXT,
    context_json JSON,         -- active files, errors, recent history
    psych_output JSON,         -- PsychOutput
    scribe_output JSON,        -- ScribeOutput  
    teacher_output JSON,       -- TeacherOutput
    assembled_costar JSON,     -- full COSTAR+ that was sent
    model_response TEXT,       -- what the model returned
    outcome TEXT,              -- ACCEPTED|EDITED|REJECTED|ABANDONED
    edit_description TEXT,     -- what user changed (if EDITED)
    roti_score REAL,           -- time saved estimate
    tokens_used INTEGER
);

-- PSYCH-specific training pairs (extracted from raw_interactions)
CREATE TABLE psych_training AS
SELECT 
    raw_input as input,
    context_json as ctx,
    psych_output as output,
    outcome,
    CASE WHEN outcome = 'ACCEPTED' THEN 1.0
         WHEN outcome = 'EDITED' THEN 0.7
         WHEN outcome = 'REJECTED' THEN 0.0
         ELSE -0.5 END as quality_score
FROM raw_interactions
WHERE psych_output IS NOT NULL;

-- SCRIBE translation pairs (the gold mine)
CREATE TABLE scribe_training AS
SELECT
    raw_input as input,
    context_json as ctx,
    scribe_output->>'out' as translation,
    scribe_output->>'task' as task_type,
    outcome,
    edit_description,  -- what user corrected = the REAL translation
    CASE WHEN outcome = 'ACCEPTED' THEN scribe_output->>'out'
         WHEN outcome = 'EDITED' THEN edit_description
         ELSE NULL END as ground_truth_translation
FROM raw_interactions
WHERE scribe_output IS NOT NULL;
```

### Critical Insight: EDITED interactions are the BEST training data

When a user EDITS the output, they're telling you exactly what the
translation SHOULD have been. The edit delta IS the correction signal.

```
SCRIBE translated: "Fix the auth error"
User edited to:    "Fix the token refresh timing in useAuth line 47"
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                    THIS is the ground truth. Train on this.
```

---

## FRUSTRATION-SPECIFIC TRAINING DATA

### What makes this unique (nobody else collects this)

Every other system discards emotional signals or treats them as noise.
DevPulse treats them as FEATURES in the training data.

```sql
-- Frustration → outcome correlation
SELECT 
    psych_output->>'fru' as frustration_level,
    COUNT(*) as interactions,
    AVG(CASE WHEN outcome='ACCEPTED' THEN 1.0 ELSE 0.0 END) as accept_rate,
    AVG(roti_score) as avg_roti
FROM raw_interactions
GROUP BY 1;
```

This query answers: "Does our frustration handling actually improve outcomes?"
If RAGE interactions have HIGHER accept rates than NONE interactions, the
normalizer is working — frustrated users are getting BETTER results because
PSYCH is translating their emotion into precision.

### The "rage and disable" feature

User settings in Turso:
```sql
CREATE TABLE user_preferences (
    user_id TEXT PRIMARY KEY,
    acknowledge_frustration BOOLEAN DEFAULT TRUE,
    -- TRUE: Clyffy says "I hear you. Let me find the actual problem."
    -- FALSE: Clyffy just fixes. Zero emotional acknowledgment.
    frustration_translation BOOLEAN DEFAULT TRUE,
    -- TRUE: PSYCH strips profanity, injects urgency (DEFAULT, recommended)  
    -- FALSE: raw input passes through to model (CC-009 will trigger)
    show_translation BOOLEAN DEFAULT FALSE
    -- TRUE: user sees the COSTAR+ assembly (teaching moment)
    -- FALSE: user just sees the result (default for Tier 0-1)
);
```

---

## SEED DATA STRATEGY (Before Real Users Exist)

### Phase 0: Synthetic pairs from this session's research

The CC-001 through CC-014 countermeasures, the 20 gotchas, and the tier
model give us KNOWN failure patterns. Generate synthetic training pairs:

| Source | Pair count | What it covers |
|--------|-----------|----------------|
| CC-009 frustration patterns | ~200 | Profanity → precision mapping |
| 20 gotchas × 10 variants | ~200 | Common user mistakes → correct response |
| 5 task types × 50 examples | ~250 | Intent classification baseline |
| 4 tiers × 25 competency signals | ~100 | TEACHER depth calibration |
| PHILOSOPHY.md examples | ~50 | "add login thing" → full COSTAR+ |
| **Total seed** | **~800 pairs** | Enough for initial LoRA |

### Phase 1: Jesse's own usage (first 2 weeks)

Jesse uses DevPulse daily. Every interaction generates training data.
At ~50 interactions/day × 14 days = 700 real pairs. Combined with
seed data = ~1,500 pairs. Enough for meaningful LoRA fine-tuning.

### Phase 2: AngryViber community (first month)

Community tools (claude-survival-kit) include opt-in telemetry.
Anonymized patterns only (not raw prompts). Expected: 5,000+ pairs
from diverse users across Tiers 0-3.

### Phase 3: Production users (ongoing)

Every DevPulse user generates training data. Local-first — stored on
their machine in DuckDB. Community-shared patterns only with explicit
opt-in. Never raw prompts.

---

## LORA TRAINING PIPELINE (Python dev env only, never ships in binary)

```python
# scripts/training/train_encoder.py
# Runs in Jesse's dev environment with Unsloth + PyTorch
# Produces GGUF adapter files that DevPulse loads at runtime

from unsloth import FastLanguageModel

def train_psych_adapter(training_pairs_path: str):
    """Train PSYCH emotional classification adapter"""
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="Qwen/Qwen3-0.6B",
        max_seq_length=512,  # PSYCH inputs are short
        load_in_4bit=True,
    )
    model = FastLanguageModel.get_peft_model(model,
        r=16, target_modules=["q_proj","v_proj"],
        lora_alpha=16, lora_dropout=0,
    )
    # ... standard Unsloth training loop
    # Export: model.save_pretrained_gguf("psych_adapter", quantization="q4_k_m")

def train_scribe_adapter(training_pairs_path: str):
    """Train SCRIBE intent + translation adapter"""
    # Same pattern, longer context (includes project state)
    # max_seq_length=1024 for SCRIBE (needs more context)
    
def train_teacher_adapter(training_pairs_path: str):
    """Train TEACHER competency assessment adapter"""
    # max_seq_length=512 (similar to PSYCH)
```

### Adapter loading at runtime (Rust, Candle)

```rust
// engine/src/minions/adapter.rs
pub struct MinionWithAdapter {
    base_model: ModelSlot,           // shared 0.6B
    adapter: Option<LoraAdapter>,    // per-minion LoRA weights
}

// Hot-swap: load new adapter without restarting
pub fn swap_adapter(&mut self, new_adapter_path: &Path) -> Result<()> {
    self.adapter = Some(LoraAdapter::load(new_adapter_path)?);
    Ok(())
}
```

---

## END-TO-END EXAMPLE: Rage → Perfect Prompt → Result

### User types:
```
"this is fucking broken again the auth keeps failing"
```

### Step 1: PSYCH encodes (0.6B, <50ms, CPU)
```json
{"fru":"RAGE","tgt":"CODE","urg":0.95,"rec":true,"pos":false}
```
Signals: profanity ("fucking"), repetition ("again"), specific target ("auth")

### Step 2: SCRIBE encodes (0.6B, <50ms, CPU)
```json
{
  "mat":"HIT","cfd":0.88,
  "inp":"auth keeps failing",
  "out":"Debug recurring auth failure — likely token refresh or session expiry",
  "task":"FIX","missing":["style"]
}
```
Translation memory: user said "auth" before → mapped to auth module.
"keeps failing" = recurring = root cause needed, not patch.

### Step 3: TEACHER encodes (0.6B, <50ms, CPU)
```json
{"dep":"ADV","dom":"BE","mas":"2","got":["auth","tokens"],"nxt":["refresh lifecycle"]}
```
User knows auth concepts. Skip basics. Can introduce refresh lifecycle.

### Step 4: Context aggregation (<100ms, cache + DB)
- DIARY: "auth was worked on at 14:23. Fix applied. Now broken again."
- REPO: "auth.rs modified 2hrs ago. 3 recent commits to auth module."
- VISION: (not available this interaction)

### Step 5: COSTAR+ Assembly (deterministic, <1ms)
```
Recipe: TRACE (FIX task)

Context: "Rust backend, auth.rs in systems/engine/src/auth/. Modified 
2hrs ago with token refresh fix that didn't hold. Third recurrence 
today. Previous fix at 14:23 patched symptoms, not root cause."

Objective: "Identify ROOT CAUSE of recurring auth failure. The token 
refresh fix from 14:23 did not resolve the underlying issue. Find WHY."

Style: "Direct. No preamble. Root cause first. Show the structural 
fix, not another patch. Match existing error handling patterns."

Tone: "URGENT. Skip explanations. Fix immediately. User is advanced 
(knows auth, tokens). Can introduce refresh lifecycle concept."

Audience: "14B local model via Candle. Structured output via llguidance."

Response: "Root cause with file:line reference. Structural fix. Why 
previous fix failed. Verification command."

[INJECTED] Do NOT apologize. Do NOT hedge. Direct action only.
[INJECTED] RECURRING ISSUE. Previous fix at 14:23 failed. Find WHY.
```

### Step 6: Clyffy responds to user
```
"This keeps breaking because the token refresh fires BEFORE the 
initial token is set. The fix at 14:23 added a retry delay, but 
the race condition is in the initialization order.

Root cause: auth.rs line 47 — refresh_interval starts on mount, 
but initial_token is set in an async callback that hasn't resolved.

Fix: Move refresh_interval.start() inside the initial_token callback.

[code block with actual fix]

Verify: cargo check -p devpulse-engine && cargo test -p devpulse-engine auth
"
```

### Step 7: Training data captured
```jsonl
{"raw":"this is fucking broken again the auth keeps failing","psych":{"fru":"RAGE"},"scribe":{"task":"FIX","out":"root cause auth failure"},"costar":"[full assembly]","outcome":"ACCEPTED","roti":4.2}
```

### What the user experienced:
1. Typed 9 angry words
2. Got a structural fix for a recurring problem
3. No apology. No hedging. No "I understand your frustration."
4. Clyffy found the root cause that the previous patch missed
5. Verification command included
6. Time saved: ~45 minutes of manual debugging

### What the user could optionally see:
"Show me what you translated" → side-by-side of their 9 words vs the full COSTAR+
This is the Teaching Without Lecturing moment. They learn COSTAR by seeing it work.
They learn "root cause vs patch" by watching Clyffy prioritize it.
They never had to study prompt engineering. It just happened.

---

## COMPLETE DATA COLLECTION MAP

| What | Where collected | Where stored | What trains |
|------|----------------|-------------|-------------|
| Raw user input | Every message | DuckDB raw_interactions | All 3 encoders |
| Emotional signals | PSYCH output per message | DuckDB psych_training | PSYCH LoRA adapter |
| Vibe→dev translations | SCRIBE output per message | DuckDB scribe_training + Turso translation_memory | SCRIBE LoRA adapter |
| User edits (GOLD) | When user modifies output | DuckDB scribe_training.ground_truth | SCRIBE LoRA (highest value) |
| Competency signals | TEACHER output per message | DuckDB teacher_training | TEACHER LoRA adapter |
| Full COSTAR+ assembly | Assembler output | DuckDB raw_interactions.assembled_costar | Assembly quality metrics |
| Outcome (accept/edit/reject) | User behavior after response | DuckDB raw_interactions.outcome | All encoders (reward signal) |
| ROTI score | Time saved estimate | DuckDB raw_interactions.roti_score | Product metrics |
| Translation patterns | Successful vibe→dev mappings | Turso translation_memory | SCRIBE fast-path (no ML needed) |
| Pattern vectors | Embedded translation pairs | Qdrant | Similarity search for new inputs |
| Session context | DIARY observations | Turso session_context | Context aggregator |
| File patterns | REPO observations | Qdrant + Turso | REPO retrieval quality |

---

## WHAT MAKES THIS DIFFERENT FROM EVERYONE ELSE

| What they do | What DevPulse does |
|-------------|-------------------|
| Discard emotional signals | PSYCH encodes them as features |
| One prompt format for everything | 5 recipe templates × tier calibration |
| User must learn prompt engineering | SCRIBE does it for them |
| Model sees raw user frustration | Model sees precision-translated COSTAR+ |
| No translation memory | SCRIBE remembers user's vocabulary across sessions |
| No competency tracking | TEACHER adapts depth per user per domain |
| Training data = generic internet | Training data = YOUR actual usage |
| Adapters trained on benchmarks | Adapters trained on YOUR accept/edit/reject signals |

---

## FILE SUMMARY

This doc lives at: `docs/claude.kb/training/NORMALIZER_TRAINING_SPEC.md`

Related specs:
- `docs/claude.kb/product/EMOTIONAL_TRANSLATION_LAYER.md` — PSYCH concept
- `docs/claude.kb/countermeasures/CLAUDE_CODE_COUNTERMEASURES.md` — CC-009
- `docs/claude.kb/user-tiers/TIERS_AND_PAIN_POINTS.md` — tier calibration
- Minion output structs: locked in April 2 session (PSYCH, SCRIBE, TEACHER Rust types)
- COSTAR+ recipe templates: locked in Dec 31 session (5 archetypes)
- Training loop: locked in Dec 25 session (LoRA pipeline from DuckDB)
- Translation memory: locked in Dec 23 session (SCRIBE vocabulary)
