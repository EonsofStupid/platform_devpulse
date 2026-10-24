# Signal Translation: Internal → Layman

> This document defines how orchestrator's internal signals get translated to user-friendly signals before leaving to the UI.

---

## The Translation Principle

**Inside orchestrator:** Rich, detailed, technical signals for debugging and analytics.

**Outside (to UI):** Simple, human-readable signals that communicate intent without exposing implementation.

```
┌─────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR                               │
│                                                                  │
│   InfraSignal::HopCompleted {                                   │
│       hop: 3,                                                   │
│       frame_id: "architect_7f3a",                               │
│       direction: Direction::Drill { focus: "error handling" }, │
│       confidence: 0.87,                                         │
│       latency_ms: 234,                                          │
│   }                                                             │
│                           │                                      │
│                           ▼                                      │
│                    ┌──────────────┐                             │
│                    │  Translator  │  (in engine facade)         │
│                    └──────────────┘                             │
│                           │                                      │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                         ENGINE                                   │
│                                                                  │
│   SignalKind::ThinkingProgress {                                │
│       step: "Diving deeper into error handling",                │
│       progress: 0.3,                                            │
│   }                                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼ Wire (Tauri events)
┌─────────────────────────────────────────────────────────────────┐
│                         DESKTOP                                  │
│                                                                  │
│   UI shows: "🔍 Diving deeper into error handling..."           │
│   Progress bar: 30%                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Signal Translation Table

### Rumination Signals

| Internal (InfraSignal) | External (SignalKind) | UI Display |
|------------------------|----------------------|------------|
| `HopStarted { hop: 1, frame_id: "architect_..." }` | `ThinkingStarted { mode: "analyzing" }` | "🧠 Thinking..." |
| `HopStarted { hop: 2+, frame_id: "..." }` | `ThinkingProgress { step: "...", progress: n/max }` | "🔄 Step 2 of ~10..." |
| `HopCompleted { direction: Drill { focus } }` | `ThinkingProgress { step: "Diving deeper into {focus}" }` | "🔍 Diving deeper..." |
| `HopCompleted { direction: Pivot { angle } }` | `ThinkingProgress { step: "Considering {angle}" }` | "↩️ Reconsidering..." |
| `HopCompleted { direction: Verify { claim } }` | `ThinkingProgress { step: "Verifying assumption" }` | "✓ Checking..." |
| `HopCompleted { direction: Synthesize }` | `ThinkingProgress { step: "Bringing it together" }` | "📝 Synthesizing..." |
| `ChainComplete { total_hops, outcome }` | `ThinkingComplete { }` | "✅ Ready" |
| `ChainAborted { reason }` | `ThinkingComplete { }` | (silent - just show result) |

### LLM Inference Signals

| Internal (InfraSignal) | External (SignalKind) | UI Display |
|------------------------|----------------------|------------|
| `LlmStarted { prompt_tokens, model_id }` | `GeneratingStarted { }` | "💬 Generating..." |
| `LlmToken { token, position }` | `StreamToken { token }` | (append to response) |
| `LlmCompleted { text, tokens, latency_ms }` | `GeneratingComplete { }` | (show final response) |
| `LlmError { error }` | `Error { message: "Generation failed" }` | "❌ Something went wrong" |

### Embedding/Reranking Signals (SILENT)

These NEVER leave orchestrator - they're for internal analytics only.

| Internal (InfraSignal) | External | Notes |
|------------------------|----------|-------|
| `EmbedStarted { text_len }` | ∅ | Analytics only |
| `EmbedCompleted { dimension, latency_ms }` | ∅ | Analytics only |
| `RerankStarted { query_len, doc_count }` | ∅ | Analytics only |
| `RerankCompleted { top_score, latency_ms }` | ∅ | Analytics only |

### Context Assembly Signals (SILENT)

| Internal (InfraSignal) | External | Notes |
|------------------------|----------|-------|
| `AssembledContext { chunks, candidates }` | ∅ | Internal only |
| `CacheHit { key }` | ∅ | Internal only |
| `CacheMiss { key }` | ∅ | Internal only |

### Expert/Sub-Agent Signals

| Internal (InfraSignal) | External (SignalKind) | UI Display |
|------------------------|----------------------|------------|
| `ExpertActivated { expert_id: "guardian" }` | `AgentActive { name: "Guardian" }` | "🛡️ Guardian watching" |
| `ExpertOutput { findings, confidence }` | `AgentInsight { summary }` | "💡 Found something" |
| `ExpertDeactivated { expert_id }` | ∅ | Silent |

### GitHub/Gus Signals

| Internal (InfraSignal) | External (SignalKind) | UI Display |
|------------------------|----------------------|------------|
| `GitHubPushReceived { repo, commit }` | `GusCheckingCommit { repo_name, commit_message }` | "🔍 Gus is checking..." |
| `GusValidationStarted { ... }` | ∅ | Silent (internal) |
| `GusValidationComplete { result }` | `GusCheckCompleted { simple_summary, detailed_summary }` | "✅ Gus approved" |
| `GusBlocked { reasons }` | `GusCheckCompleted { simple_summary: "🛡️ Blocked" }` | "🛡️ Gus blocked this" |

---

## The 3-Layer Disclosure Model

For complex results, we use progressive disclosure:

### Layer 1: Layman (Default UI)
Simple, friendly message. No technical details.

```
"✅ Gus approved this commit"
```

### Layer 2: Curious (Expand for details)
Educational explanation. What was checked.

```
"Checked: file patterns, secret detection, size limits
 All 47 files passed validation"
```

### Layer 3: Power User (Developer panel)
Full technical details. Available in Lab mode.

```json
{
  "files_checked": 47,
  "patterns_matched": ["*.rs", "*.toml"],
  "secrets_scanned": true,
  "ml_confidence": 0.94,
  "latency_ms": 234,
  "hop_trace": ["validator", "pattern_check", "secret_scan"]
}
```

---

## Translation Implementation

The translation happens in engine's facade layer. Here's the pattern:

```rust
// engine/src/facade/signals.rs

use orchestrator::types::InfraSignal;
use shared::SignalKind;

pub struct SignalTranslator;

impl SignalTranslator {
    /// Translate internal signal to layman version
    /// Returns None if signal should be silent (analytics only)
    pub fn translate(infra: &InfraSignal, max_hops: u8) -> Option<SignalKind> {
        match infra {
            // Rumination signals
            InfraSignal::HopStarted { hop: 1, .. } => {
                Some(SignalKind::ThinkingStarted {
                    mode: "analyzing".into()
                })
            }

            InfraSignal::HopStarted { hop, .. } => {
                Some(SignalKind::ThinkingProgress {
                    step: format!("Step {} of ~{}", hop, max_hops),
                    progress: *hop as f32 / max_hops as f32,
                })
            }

            InfraSignal::HopCompleted { direction, .. } => {
                let step = match direction {
                    Direction::Drill { focus } =>
                        format!("Diving deeper into {}", focus),
                    Direction::Pivot { new_angle } =>
                        format!("Considering {}", new_angle),
                    Direction::Verify { .. } =>
                        "Verifying assumption".into(),
                    Direction::Synthesize { .. } =>
                        "Bringing it together".into(),
                    Direction::Abort { .. } => return None,
                };
                Some(SignalKind::ThinkingProgress { step, progress: 0.0 })
            }

            InfraSignal::ChainComplete { .. } => {
                Some(SignalKind::ThinkingComplete {})
            }

            // LLM signals
            InfraSignal::LlmToken { token, .. } => {
                Some(SignalKind::StreamToken { token: token.clone() })
            }

            InfraSignal::LlmCompleted { .. } => {
                Some(SignalKind::GeneratingComplete {})
            }

            // Silent signals (analytics only)
            InfraSignal::EmbedStarted { .. } |
            InfraSignal::EmbedCompleted { .. } |
            InfraSignal::RerankStarted { .. } |
            InfraSignal::RerankCompleted { .. } => None,

            // ... other translations
        }
    }
}
```

---

## What Goes Where

### To Wire (UI via Tauri events)

- ThinkingStarted / ThinkingProgress / ThinkingComplete
- StreamToken (LLM streaming)
- GeneratingComplete
- GusCheckingCommit / GusCheckCompleted
- Error messages (user-friendly)
- AgentActive / AgentInsight

### To DuckDB (L5 Analytics - NEVER to UI)

- All EmbedStarted/Completed
- All RerankStarted/Completed
- LlmStarted (with token counts)
- HopStarted/Completed (with latencies)
- Full chain traces
- Confidence scores
- Model IDs

### To libSQL (L4 Durable - Summarized to UI)

- Session history (what user asked/received)
- Project state
- Turn summaries (not full chain details)

### Stays in moka (L2 Cache - NEVER persisted)

- Hot context (current session)
- Recent embeddings
- Reranker scores

---

## Signal Categories Summary

```
┌────────────────────────────────────────────────────────────────┐
│                    SIGNAL CATEGORIES                            │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🟢 PUBLIC (goes to UI)                                        │
│  ├── ThinkingStarted/Progress/Complete                         │
│  ├── StreamToken                                               │
│  ├── GeneratingComplete                                        │
│  ├── GusCheckingCommit/GusCheckCompleted                       │
│  ├── Error (user-friendly message only)                        │
│  └── AgentActive/AgentInsight                                  │
│                                                                 │
│  🟡 SUMMARIZED (persisted, simplified for UI)                  │
│  ├── Session turns (question → answer)                         │
│  ├── Project state changes                                     │
│  └── User preferences                                          │
│                                                                 │
│  🔴 PRIVATE (never leaves orchestrator)                        │
│  ├── EmbedStarted/Completed                                    │
│  ├── RerankStarted/Completed                                   │
│  ├── Full hop traces with frame_ids                            │
│  ├── Confidence scores                                         │
│  ├── Latency breakdowns                                        │
│  ├── Token counts per hop                                      │
│  ├── Model IDs                                                 │
│  └── Direction details                                         │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## Adding New Signals

When adding a new InfraSignal:

1. **Define it in orchestrator** (`types/infra_signal.rs`)
2. **Decide its category**: Public, Summarized, or Private
3. **If Public**: Add translation in `engine/src/facade/signals.rs`
4. **If Private**: Ensure it goes to DuckDB only
5. **Document here**: Add to the translation table

### Checklist for new signals

- [ ] Does the user NEED to see this? (most → no)
- [ ] Does it expose implementation details? (if yes → private)
- [ ] Is the language technical? (if yes → translate to layman)
- [ ] Does it contain metrics? (if yes → analytics only)

---

## Testing Translation

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hop_completed_translates_to_progress() {
        let infra = InfraSignal::HopCompleted {
            hop: 3,
            frame_id: "architect_7f3a".into(),
            direction: Direction::Drill { focus: "error handling".into() },
            confidence: 0.87,
        };

        let result = SignalTranslator::translate(&infra, 10);

        assert!(matches!(
            result,
            Some(SignalKind::ThinkingProgress { step, .. })
            if step.contains("error handling")
        ));
    }

    #[test]
    fn embed_signals_are_silent() {
        let infra = InfraSignal::EmbedCompleted {
            dimension: 1024,
            latency_ms: 45,
        };

        let result = SignalTranslator::translate(&infra, 10);

        assert!(result.is_none()); // Silent - analytics only
    }
}
```

---

## Future: Lab Mode

When Lab mode is enabled, power users can see raw InfraSignal stream:

```
[ Lab Panel ]
─────────────────────────────────────
09:42:01.234  HopStarted      hop=1 frame=architect_7f3a
09:42:01.456  EmbedCompleted  dim=1024 latency=45ms
09:42:01.512  RerankCompleted score=0.92 docs=20
09:42:01.789  HopCompleted    direction=Drill confidence=0.87
09:42:02.012  HopStarted      hop=2 frame=pragmatist_2b1c
...
```

This is OPTIONAL and disabled by default. Regular users see only the layman signals.

---

*This document defines the contract between orchestrator internals and external consumers.*
*Any new signal must be documented here with its translation.*
*Last updated: 2026-01-12*
