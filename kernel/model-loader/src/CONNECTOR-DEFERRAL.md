# Connector Deferral — authoritative spec

> **Sprint 00 deliverable.** This doc consolidates the
> capability/connector deferral pattern previously scattered across
> [`config/slots.default.toml`](config/slots.default.toml),
> [`src/traits/capability.rs`](src/traits/capability.rs), and the
> SPRINT-VISION-PIXVIX-FOUNDATION conversation. It is the single
> authoritative answer to: **when does platform-managed
> vision/voice/embedding DROP because the loaded brain has it
> native, and what does the user see?**
>
> **Status:** Locked.
> **Owner:** Jesse.
> **Authored:** 2026-05-09.
> **Cross-references:**
> [`ONBOARDING-CASCADE.md`](../../../interfaces/desktop/src/lib/design/ONBOARDING-CASCADE.md),
> [`COMPOSITION-CONTRACT.md`](../../../interfaces/desktop/src/lib/design/COMPOSITION-CONTRACT.md),
> [`TRUTH.md`](../../../interfaces/desktop/src/lib/design/TRUTH.md),
> locked memory `project_vision_backend_hot_swap.md`.

## What "connector deferral" means

A **connector** is a slot that owns a single capability —
`vision.embedder` produces image embeddings, `voice.tts` produces
audio, `voice.stt` produces transcripts, `chat.vision` produces
vision-language responses. Each connector defaults to a small
specialist model bundled with the platform (SigLIP2 for embedding,
Kokoro for TTS, Whisper-tiny for STT, Qwen3-VL for VL chat).

A connector **defers** when the user loads a `chat.brain` that has the
same capability built in. The most expensive case is omni models
(Phi-4-multimodal, Qwen3-VL-30B-A3B-Omni, Gemma-3-omni) — one
30 GB load that already does vision encoding, image-language reasoning,
TTS, and STT. Loading separate specialists alongside it would burn VRAM
on capability the brain already has.

Deferral is the platform telling each connector: *the brain covers
you; stand down*. Override stays available. The user is told what
happened.

## The capability map

The kernel exposes these capabilities (see
[`src/traits/capability.rs`](src/traits/capability.rs) for the trait
shapes — embedding, reranking, vision-encoding):

| Capability | Bundled connector | Possible omni override |
|---|---|---|
| `TextGeneration` | `chat.brain` itself | (none — this IS the brain) |
| `VisionEmbedding` | `vision.embedder` (SigLIP2) | omni brain w/ native vision tower |
| `VisionLanguage` | `chat.vision` (Qwen3-VL family) | omni brain w/ VL output |
| `TextToSpeech` | `voice.tts` (Kokoro) | omni brain w/ audio output (rare) |
| `SpeechToText` | `voice.stt` (Whisper-tiny) | omni brain w/ audio input |
| `EmbeddingDense` | `rag.encoder` (Qwen3-Embedding) | rarely native — keep specialist |
| `Reranking` | `rag.reranker` (Qwen3-Reranker) | rarely native — keep specialist |

A brain advertising a capability does NOT automatically force defer.
The platform consults the **deferral table** (next section) before
flipping a slot to integrated mode.

## The deferral table

Two-axis decision: brain capability × slot disposition.

| Brain has | Slot defers? | Why |
|---|---|---|
| `VisionEmbedding` only (e.g. Idefics-2) | YES — `vision.embedder` integrates | The brain produces image embeddings as a side effect of forward; running SigLIP2 separately is duplicate work. |
| `VisionLanguage` only (e.g. Qwen3-VL-2B alone) | YES — `chat.vision` integrates | The brain IS the VL model. |
| `VisionLanguage` AND `chat.brain` is also that model | YES — `chat.vision` ref-counts the same load | One copy in VRAM, two slot ids via [`backends/pool.rs`](src/backends/pool.rs) ref-counting. |
| `TextToSpeech` (e.g. omni) | NO by default — `voice.tts` keeps Kokoro | Audio quality on omni TTS is currently lower than dedicated TTS; cost of running both is small (Kokoro is CPU). User can flip in Voice Lab. |
| `SpeechToText` (e.g. omni) | YES — `voice.stt` integrates | Latency wins; Whisper-tiny is already quantized small. |
| Multiple of the above (omni model) | EACH slot evaluates independently | No "all or nothing" — the user might have a vision-omni brain but want a separate TTS voice. |

## D6 — Omni Override Warning (locked rule)

When a slot defers, the slot card in the UI shows:

```
[Vision integrated]
Using AI Assistant's built-in vision.
                                          [Override...]
```

Clicking **Override** opens the **D6 Omni Override Warning** dialog.
This is a locked rule from `slots.default.toml:130` — the user MUST
see the warning before forcing a separate model load alongside an
omni brain. The dialog states (verbatim, in `wizard_copy.toml`):

> Your AI Assistant already does this. Loading a second model uses
> extra memory without adding capability. Continue only if you have
> a specific reason — different language, fine-tuned style, or a
> known quality difference for your use case.

Confirming the override:
- Loads the specialist model alongside the brain.
- Sets `slot.user_override = true` in slot config.
- Future omni-brain swaps respect the override and re-load the
  specialist; the user only sees the dialog once per slot per session.

Removing the override (slot card shows **Defer** action when
`user_override = true`):
- Releases the specialist load via [`pool.release()`](src/backends/pool.rs#L130).
- Clears the override flag.
- The slot returns to integrated mode.

## The voice fallback chain

Voice has its own cascade beyond simple deferral
(`slots.default.toml:213`). Three modes the user can pick in Voice Lab:

```
Cascaded (default):     wake → voice.stt → chat.fast → voice.tts
Full-duplex (Moshi):    voice.brain (single STS model, 180ms latency)
Omni-integrated:        wake → chat.brain (handles STT+TTS) — only when
                        omni brain has BOTH SpeechToText AND TextToSpeech
```

Selection rule (computed in
[`src/slots/voice_pool.rs`](src/backends/voice_pool.rs)):

1. If `voice.brain` slot is enabled and Moshi loads successfully → **full-duplex**.
2. Else if `chat.brain` advertises BOTH `SpeechToText` AND `TextToSpeech` AND
   user has not overridden → **omni-integrated**.
3. Else → **cascaded** (always works, fallback for any brain).

The fallback is automatic and silent UNLESS the user explicitly
selected one mode and it failed to load — then the slot card shows:

```
Voice mode dropped to cascaded.
Reason: Moshi requires CUDA/Metal; CPU not supported.
                                      [Try again]  [Use cascaded]
```

## The integration message rule

When a slot defers, the slot card NEVER says:
- "Vision disabled" — wrong, vision works
- "No vision model loaded" — wrong, brain has vision
- "Slot empty" — wrong, slot is integrated

It says exactly:
- `Vision integrated — using AI Assistant's built-in vision.`
- `Voice integrated — handled by AI Assistant.`
- `Speech-to-text integrated — handled by AI Assistant.`

The verb is **integrated**, not "enabled" or "active." This wording
is enforced by [`coldlight-curator`](../../../.claude/agents/coldlight-curator.md)
at audit time.

## Detection

`detect_omni_capabilities(brain_model)` is implemented at
`src/slots/omni_detection.rs` (Sprint 03 — does not exist yet). Until
then, deferral is detected via the registry's
`compatible_capabilities` field on the brain's `ModelRegistryEntry`.
The Sprint 03 implementation must:

- Pattern-match against known omni archs (Phi-4-multimodal,
  Qwen3-VL-* family, Gemma-3-omni, Idefics-2, etc.).
- Support manual capability tags in `kernel_terms.toml` so a new
  omni model registered after release can flag itself without code.
- Return `Vec<ModelCapability>` so the slot loop can iterate.
- Be queryable from the wizard's preset apply path (Sprint 04).

## Detection failures

If the brain advertises a capability but inference at that capability
fails (model malformed, capability mis-tagged, runtime mismatch), the
slot does NOT silently fall back. It surfaces:

```
Vision integration failed.
Reason: AI Assistant returned an empty embedding tensor.
                                      [Load SigLIP2]  [Report issue]
```

User can **Load SigLIP2** to load the specialist and continue.
**Report issue** captures the brain id + capability + error and
writes a markdown file at `<root>/.userdata/diagnostics/<timestamp>.md`
the user can attach to a GitHub issue.

## Override persistence

Overrides are written to user config at
`<root>/.userdata/preferences.toml` under `[slots.<slot_id>.overrides]`
so they persist across app restarts:

```toml
[slots."vision.embedder".overrides]
forced_specialist = true
reason = "user-typed-on-2026-05-08"  # or "missing" if not provided
warned_about_omni = true
```

The `warned_about_omni` field tracks whether the user has seen the
D6 dialog for this slot. Re-warning on every session start would be
nagging; once the user confirms once, they own the choice.

## Anti-patterns this spec refuses

- "Vision enabled" toggle in slot card. The slot is COMPUTED from the
  loaded brain, not toggled.
- Loading a connector at startup before the brain is loaded. Connectors
  are evaluated AFTER `chat.brain` finishes loading, in the same swap
  sequence (see `service.rs::swap_model`).
- Fallback to "no vision" on integration failure. Always offer the
  specialist as the next step.
- Hardcoded "vision works" assumption in Svelte UI. The UI reads
  `slot_should_defer(slot_id, brain_caps)` from the engine; never
  guesses from model name strings.
- A "skip the warning" preference — D6 is not optional. The user can
  acknowledge once per slot, but the explanation is required the
  first time.
