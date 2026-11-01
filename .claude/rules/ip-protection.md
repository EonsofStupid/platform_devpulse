---
paths:
  - "kernel/**/*.rs"
  - "systems/devpulse-engine/**/*.rs"
  - "interfaces/desktop/**/*.ts"
  - "interfaces/desktop/**/*.svelte"
  - "interfaces/desktop/src-tauri/**/*.rs"
---

# Included Kernel and UI Terminology

**Owner decision, 2026-11-01:** the kernel is included; nothing about the
product implementation is hidden for IP protection. The old secrecy rule
misunderstood the request for a layman-friendly UI. This decision replaces
this file's former vocabulary bans, one-sided public registry doctrine,
prompt-recipe secrecy and developer-only access to technical detail.

## Ownership

- Kernel owns AI configuration, providers and execution.
- Engine owns platform services and orchestration of platform lifecycle.
- Tauri exposes typed service commands and events to the owning UI domains.
- ColdLight owns reusable presentation components and generated styling.

These boundaries organize the implementation. They must not suppress kernel
terminology, prompt recipes, configuration, capabilities or diagnostics.
Keep existing service owners rather than duplicate implementations merely
to expose a feature. Kernel functionality is included in the shipped product;
local and remote AI runtimes remain configurable endpoint integrations.

## Presentation

The simple UI uses clear, layman-friendly labels. The advanced UI exposes
available technical names, values, relationships and controls in the same
shipped application. A runtime presentation preference selects detail; a
production build must not strip advanced content or require a developer build.

Use `systems/devpulse-engine/ip/kernel_terms.toml` as the existing label map.
Keep generated Rust/TypeScript dictionaries and cheap lookups. Preserve raw
identifiers and full underlying data; translation changes presentation, not
stored state, command identity or the meaning of an event. Do not irreversibly
replace technical data before advanced UI consumers can access it. Unknown
terms remain visible rather than being dropped. No AI call is needed to
translate these known UI labels.

`signals.registry.yaml` and `signals.narrations.yaml` define typed events and
narration. They do not define the only vocabulary allowed in the product.
Kernel terminology and prompt recipes may appear in UI, logs, source and docs.
The dictionary is useful infrastructure, not deprecated material to delete.

## Enforcement and verification

Vocabulary enforcement stays off. Do not enable term blacklists, remove
advanced controls, or introduce stripped customer builds to protect IP.
Dependency checks should validate architecture and included functionality,
not secrecy. Preserve credential handling and access authorization: those
protect user access and data, not product implementation vocabulary.

Plan 0009 records the implemented runtime/code alignment and its verification.
Keep generated output derived from its source. Simple and advanced presentations
share the same underlying service state, and advanced detail is available in
release. The persisted Settings display preference changes presentation only;
it never grants endpoint access or changes service readiness. Run terminology
tests and `cargo xtask verify-architecture` to check this contract.

Historical sprint documents remain records of earlier decisions. They do not
override this owner correction. Do not delete recovered code or documentation
because it implements an older presentation policy; restore it to its owner
and align its behavior.
