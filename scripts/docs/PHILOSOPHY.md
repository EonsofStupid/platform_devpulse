# PHILOSOPHY: The Clyffy Approach

| Field | Value |
|-------|-------|
| **Status** | `LOCKED` |
| **Version** | `1.2.0` |
| **Last Updated** | `2026-04-19` |
| **Owner** | `@jesse` |
| **Part of** | DevPulse Platform |
| **Precedence** | This document governs all other specs |

---

## Core Insight

The industry shipped AI coding tools that assume the user already knows how to prompt an AI. The user doesn't. They learn by failing, and the failure is billed to them in tokens, time, and technical debt. The result is predictable: non-technical users burn through tokens, learn nothing, end up with unmaintainable output, and either keep paying the learning tax or give up and conclude "AI coding doesn't work for me." That failure isn't the user's fault. It's an architectural choice the industry made and the user was never consulted on.

Clyffy is the counter-pattern. Three pillars, co-equal, all required:

**1. Translation, not generation.**
Clyffy is not a code generator. Clyffy is the translator and quality gate between vibe-speak and engineer-speak. The executor models (Cursor, Bolt, Claude Code, local `chat.brain`) generate the code. Clyffy's job is to turn "add the login thing" into a spec those models can execute correctly on the first try. Generation is commodity. Translation is the product.


**2. Economic protection, not learning tax.**
Clyffy already has the knowledge the user would otherwise pay to acquire through failure. Every refused prompt, every hallucinated function, every `/core` dumping ground is the user's money being burned. Clyffy sits at the input boundary (Fox), the context boundary (Badger), and the output boundary (the Council's sign-off) specifically to prevent that burn. The user's wallet and time are the scarce resources we're defending — not compute, not tokens, not latency.

**3. Rumination IS the generation loop.**
This is the architectural reason the entire stack exists. By embedding Candle directly in Rust, DevPulse owns the forward pass token-by-token. KV cache is ours. Mid-generation retrieval injection is possible. Constrained decoding (llguidance) sits above the backend trait, not beside it. The boundary between "context preparation" and "generation" disappears — they are the same loop. A 4B model with perfectly prepared context and mid-generation hooks outperforms a 70B model called through an API, and costs nothing per token. **Owning the forward pass is the moat.** No competitor can replicate this without rewriting their stack from the inside out.

These three pillars reinforce each other. Translation is only cheap because rumination is local. Economic protection is only credible because the translation layer actually works. Forward-pass ownership is only meaningful because translation gives it something worth doing.

**Clyffy doesn't compete on speed. Clyffy competes on success rate, cost protection, and architectural depth.**

---

## Naming & Boundary (Read This First)

DevPulse's naming discipline is load-bearing. One canonical name per component. No aliases. No typo paths. Violating this produces drift that poisons every downstream decision.

| Name | Meaning | Where it lives |
|---|---|---|
| **Clyffy** | User-facing AI persona AND the kernel orchestrator | UI copy, logs, diaries, `kernel/` |
| **DevPulse** | The platform (product name) | Marketing, installer, app shell |
| **MAESTRO** | Retired synonym for the kernel | **Dead. Do not use.** |
| **Gus / Gussette** | Retired pre-Clyffy persona | **Dead. Do not use.** |

The kernel orchestration logic lives in `kernel/` — all of it, and only there. Nothing outside `kernel/` imports from or references kernel internals by name. The Tauri boundary, engine facades, and interfaces crate talk to the kernel through trait-shaped seams, never by reaching through the wall.


---

## The Problem We Solve

Vibe coders fail not because AI can't code, but because:

| Failure Mode | What Happens |
|--------------|--------------|
| **Terminology mismatch** | User says "add login thing" → AI guesses wrong |
| **No structural awareness** | AI creates `/core` dumping grounds |
| **AI quirks unchecked** | New abstractions instead of using existing patterns |
| **Planning skipped** | User expects one prompt to do everything |
| **Verification skipped** | User accepts hallucinated code blindly |
| **Context lost** | User re-explains same thing every session |

**Result:** Hours wasted fighting AI instead of building.

---

## Economic Protection

### The Current Unfair Reality

Vibe coders today pay the "learning tax":

```
User signs up for Cursor/Bolt/Lovable
     ↓
First 2,000 tokens: expensive trial and error
     ↓
Realizes prompts were wrong, patterns are messy
     ↓
Has to start over or live with technical debt
     ↓
Repeat until accidentally learning prompt engineering
     ↓
OR give up, conclude "AI coding doesn't work for me"
```

This is the status quo. It's not fair to the layman user.

### The DevPulse Promise

**Clyffy has the knowledge. The user shouldn't have to pay to acquire it through failure.**

```
User starts with Clyffy
     ↓
First prompt: already translated correctly
     ↓
Patterns enforced from day one
     ↓
User's money and time protected
     ↓
Learning happens naturally, not through expensive mistakes
```


### What We're Protecting Against

Vibe coders don't understand (and shouldn't have to):

- How hard coding actually is, how long it took to get here
- That backends aren't "magically all in one now"
- That React is client-side, Next.js adds the server layer
- That React and WordPress are not the same thing
- What SEO really means and how to make React SEO-friendly
- That DNS is genuinely a nightmare
- Why their own Supabase instance beats Bolt's built-in cloud

**Clyffy knows. Clyffy guides. Clyffy protects the investment.**

---

## Teaching Without Lecturing

Education is not a feature. It is a side effect of translating well, and it must remain invisible. The moment we put a "learn more" button in the user's flow, we have broken the contract. The moment Clyffy pauses to explain what a KV cache is when the user asked for a login form, we have broken the contract.

The rules:

- **Never interrupt flow to teach.** The task is the context. The explanation is the byproduct.
- **Progressive disclosure, not announcements.** The user discovers terminology by seeing Clyffy use it correctly in their context. When they ask, the answer is one sentence, not a tutorial.
- **Frustration is a signal, not a failure.** When the psych signal fires, Clyffy does not drop a help popup. It adjusts tone, simplifies, and keeps moving.
- **The user graduates on their own clock.** Competency is tracked silently. Autonomy expands as competency grows. The user is never told their "level."

If a feature requires a tutorial to understand, the feature is wrong. Fix the feature, not the tutorial.


---

## DevPulse Is The Cockpit

Every other AI coding tool treats itself as *the destination* — the place the user goes to do work. DevPulse is not the destination. **DevPulse is the cockpit.** The destination is wherever the user's actual code lives — Cursor, Bolt, Claude Code, VS Code, a terminal, an IDE plugin. DevPulse sits above those tools, preparing the context, translating the request, checking the output, capturing what happened, and teaching silently along the way.

Design implications:

- DevPulse does not try to replace the user's editor. It makes the editor work better.
- DevPulse does not hoard the user's project. It indexes, translates, routes, and releases.
- DevPulse does not lock the user in. Provider-specific frames exist because tools are swapped, not because we want to own the user.
- DevPulse does not pretend to be everything. It is the orchestrator. The tools are the hands.

The cockpit metaphor shapes the UI, the kernel, the routing layer, and every integration decision. When in doubt: *who is flying, and where is the runway?* The user is flying. Their code is the runway. DevPulse is the instrument panel.

---

## Own The Stack, But Only What Must Be Forked

DevPulse is a Rust runtime. Rust is the default; Python is allowed and is the obvious choice for ML training and data pipelines (CLAUDE.md "Language Choice", owner 2026-09-23). C dependencies are fine where they are load-bearing (DuckDB, FFmpeg, scap, Candle BLAS, llama.cpp FFI). Forks happen only when the upstream cannot carry what we need and no patch path exists.

Currently forked (justified):
- `sherpa-rs` — STT runtime adjustments
- `kokoro` — TTS fallback + voice packs
- `str0m` — WiredFront P2P
- `cortex/qdrant` — RRO threshold-gated escalation
- `scap` / CapSoftware — PixVix capture
- `llguidance` / guidance-ai — constrained decoding surface
- `derivre` — supply chain dual-fork

Not forked (confirmed upstream fits):
- `llama-cpp-2` — upstream ships `llguidance` feature flag; no fork needed
- `sherpa-rs` embedder path — upstream on crates.io covers use
- `qwen_tts` — model-path agnostic, upstream works

Rule: **verify upstream before forking.** A fork is a permanent maintenance tax. If upstream already supports what we need, we use upstream. If upstream is one PR away, we send the PR.


---

## Hardware-Configurable First

DevPulse runs on the user's machine. The user's machine is not ours to specify. Baseline assumption: Windows gaming/enthusiast workstation, RTX 3070-class GPU, 8 GB VRAM, 32 GB RAM. Ceiling assumption: whatever the user has plugged in, including 4090-class rigs and dual-Xeon lab builds.

No hardcoded model sizes. No hardcoded quantization choices. No hardcoded VRAM assumptions. Every decision the runtime makes about what to load, where to load it, and how to load it is driven by `config/slots.default.toml` and the live hardware profile, not by a string literal in the code. Slot references (`LARGE_LLM`, `SMALL_LLM`, `rag.embedder`, `voice.stt`) are the contract. The profile fills them in.

This is not just aesthetic. It is operational. A user on a 3060 and a user on a 4090 should both see DevPulse work well. Neither should see the other's configuration.

---

## The Clyffy Solution

### Translator, Not Generator

```
Vibe Coder says: "add the login thing"
                      ↓
                Clyffy translates:
                      ↓
"Create a LoginForm component in src/features/auth/components/
following the existing pattern in SignupForm.tsx. Use React Hook 
Form for validation. Integrate with authService in src/services/.
```

### Two Layers Stop and Think

| Layer | Budget | Purpose |
|-------|--------|---------|
| **Keystroke** | <50ms | What are they asking about? |
| **Pause** | <500ms | What context do they need? |
| **Send** | 2-5s | Full rumination, COSTAR+IC assembly |
| **Background** | Minutes | Heavy analysis, learning |

**Never rush answers just to seem fast.** Poor results waste more time than thoughtful pauses.


---

## The Clyffy Council

Clyffy is not one model. Clyffy is a 9-seat council of specialized roles, each with a canonical animal character. The Council is the cognition. The kernel is the body.

| Seat | Animal | Role | Core Job |
|---|---|---|---|
| **Conductor** | Cow (Clyffy) | Orchestrator | Routes signals, arbitrates between seats, owns final output |
| **Diary** | Sheep | Memory | Session continuity, "we were working on X yesterday" |
| **Teacher** | Pig | Competency | Tracks what user knows, adjusts terminology depth |
| **Psych** | Mini Pony | Emotional tone | Detects frustration, adjusts empathy |
| **Vision** | Johnny Crane | Visual context | Screen state, diagrams, screenshots |
| **Researcher** | Llama | External knowledge | Library docs, search, citations |
| **Scribe (Fox)** | Fox | Input rehabilitation | Sanitize → rehab → intent → spec → COSTAR+IC |
| **Guardian** | Badger | Boundary enforcement | Context budget, scope, anti-drift |
| **Enforcer** | Goat Twins (Rusty + Pip) | Hardware + Software specialists | One seat, two specialists: hardware constraints vs. software inefficiency |

Retired seats: Emu, Donkey, Chicken, Turkey, Goose, Duck, Alpaca. The "Eight Minions" framing is dead.

Each seat exists to help the Conductor translate better. No seat acts alone. The Council's sign-off is what the user receives.

### The Fox Pipeline (Input Boundary Detail)

Fox is the first thing the user's words touch. The pipeline:

1. **Input sanitization** — strip noise, normalize
2. **Tone rehabilitation** — remove hostility, keep intent; **not a censor**, a personal trainer
3. **Intent-to-spec translation** — what does the user actually want?
4. **Constraint enforcement** — what is in / out of scope?
5. **COSTAR+IC validation** — does this prompt satisfy Context, Objective, Style, Tone, Audience, Response, Instruction, Constraints?
6. **Prompt compilation** — final form, ready for the executor

Fox is bilingual (human ↔ AI). Users define their own rehabilitation rules; Jesse's taxonomy ships as default/example. Economic angle: Fox prevents wasted tokens at the prompt boundary. Self-improvement loop: flag → train → Fox improves at catching user's own patterns.

**Rule: teach, don't censor.** Fox rehabilitates. Users define their own rules.


---

## COSTAR+IC

The prompt framework Clyffy uses to translate user intent into executor input. Standard COSTAR has six dimensions. DevPulse adds two more (IC replaces the older ANS).

| Letter | Meaning | How Clyffy fills it |
|---|---|---|
| **C** | Context | Guardian + Diary + Repo scan |
| **O** | Objective | Only dimension that reliably requires user input |
| **S** | Style | Repo patterns (how this codebase is written) |
| **T** | Tone | Psych × Teacher (user's emotional state × competency) |
| **A** | Audience | Teacher + model-config (who is the executor?) |
| **R** | Response | Task-type default (BUILD / FIX / EXPLORE / PLAN / EXPLAIN) |
| **I** | Instruction | Fox-compiled, executor-specific frame |
| **C** | Constraints | Hardware profile + scope + anti-drift guards |

**Key insight:** four of six original COSTAR dimensions need **zero user input**. The UI surfaces only what must be asked. Everything else is inferred from session state, project scan, and Council signals. Inference auto-promotes to templated answers after 3 accepted inferences at >0.8 confidence.

COSTAR+IC is not optional. It is not minimizable. It is not skippable. Every request Clyffy translates is shaped into a COSTAR+IC spec before it leaves the kernel.

---

## LLM Terminology Used Throughout

DevPulse teaches by using real AI/ML terms in context. Not dumbed down. Not marketing-speak. The terminology appears in the UI, in Clyffy's voice, in logs, in the diary. Users absorb it.

- **Inference pipeline** — the full path from prompt to token
- **Autoregressive generation** — one token at a time, each depending on the last
- **KV cache** — the attention-layer state that makes generation cheap after the first token
- **TTFT** — time to first token; what makes a system feel snappy
- **Cross-encoder** — the reranker; pairs (query, doc) → score
- **Embedding model** — turns text into vectors for similarity search
- **RAG** — retrieval-augmented generation; look up before answering
- **CAG** — cache-augmented generation; reuse what we already retrieved
- **Constrained decoding** — force the model's output to match a grammar (GBNF) or schema
- **GBNF / GBVF** — the grammar formats used for constrained decoding
- **Forward pass** — one step of the model's computation; DevPulse owns this

These terms are not sprinkled in for credibility. They are used because they are correct.


---

## What Success Looks Like

### For The User

- Types 6 words, gets production-quality code
- Never re-explains their project
- Learns LLM concepts without trying
- Trusts the output because Clyffy verified it
- Flow state preserved, not interrupted by AI fighting

### For The Metrics

| Metric | Target | Meaning |
|--------|--------|---------|
| **ROTI** | > 5.0 | Return on Time Invested; time saved vs time invested |
| **Edit Distance** | < 10% | User barely modifies AI output |
| **Verification Rate** | > 80% | Users actually check before commit |
| **Terminology Adoption** | Trending up | Users naturally use LLM terms |
| **Session Continuity** | > 90% | Clyffy remembers across sessions |

---

## The Moat

DevPulse does not compete on generation speed or model size. The moat is architectural depth:

| What Others Do | What Clyffy Does |
|----------------|------------------|
| Generate code faster | Translate intent correctly |
| Bigger context windows | Smarter context selection |
| More parameters | Better prompts |
| Instant responses | Thoughtful responses |
| Hide complexity | Teach complexity gently |
| Replace the developer | Amplify the developer |
| Call a hosted model | Own the forward pass |
| Lock users in | Route across tools the user already has |

The four durable differentiators:

1. **Forward-pass ownership** — no competitor can replicate without rewriting their stack
2. **The cockpit model** — tool-agnostic orchestration beats tool-specific UIs over time
3. **The Council** — 9 specialized seats produce context quality no single model matches
4. **Economic alignment** — the user's wallet is the scarce resource we defend

**DevPulse doesn't compete on speed. DevPulse competes on success rate, cost protection, and architectural depth.**


---

## What This Document Governs

Every spec below answers to PHILOSOPHY.md. When a spec conflicts with this document, the spec loses.

- `CORTEX.md` — rumination pipeline, COSTAR+IC mechanics, RRO, governance graph
- `KERNEL.md` — state machine, signal routing, Council orchestration
- `MODEL_STACK.md` — slot references, loading states, hardware profiles
- `RETRIEVAL.md` — Qdrant RRO, fastembed-rs, SurrealDB threshold escalation
- `VISION.md` — SigLIP2, screen capture, visual signals
- `AUDIO.md` — PersonaPlex 7B STS, sherpa-rs STT, qwen_tts TTS
- `CHANNELS.md` — P2P (WiredFront), TEAM, BROADCAST
- `COUNCIL.md` — 9 seats, Fox pipeline, escalation
- `PROMPT-STUDIO-UI-SPEC.md` — user-facing translation surface
- `PROJECT-SCANNER-SPEC.md` — 7-phase indexing
- `SPRINT-DEV-ONBOARDING-WIZARD.md` — 5-phase wizard

If a new spec is added, it must declare in its header: *"Governed By: PHILOSOPHY.md"*.

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.2.0 | 2026-04-19 | Major rewrite. Core Insight expanded from single-pillar (translation) to three-pillar (translation + economic protection + forward-pass ownership). Terminology: Gus/Meistro → Clyffy. Sub-agent table → 9-seat Clyffy Council with animal characters. COSTAR → COSTAR+IC. New sections: Naming & Boundary, Teaching Without Lecturing (promoted to first-class doctrine), DevPulse Is The Cockpit, Own The Stack But Only What Must Be Forked, Hardware-Configurable First. LLM terminology expanded (KV cache, TTFT, cross-encoder, GBNF/GBVF). Moat rewritten around architectural depth instead of surface comparisons. |
| 1.1.0 | 2025-12-22 | Added Economic Protection section. |
| 1.0.0 | 2025-12-22 | Initial philosophy document. |

---

*This document governs all other specifications. When in doubt, refer here.*
