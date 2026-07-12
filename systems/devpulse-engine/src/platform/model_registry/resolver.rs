//! # Compatibility resolver
//!
//! Pure function: given `(arch, format)` plus the installed backend
//! set, return either a concrete loader plan or an `Unsupported`
//! variant with alternatives ordered by tier.
//!
//! No IO, no allocation of heavy data — callable from the frontend
//! via the Tauri command layer and inline during the actual load
//! pass (Clyffy-side).

use super::architectures::{get as get_arch, ArchId, SupportTier};
use super::backends::{installed_backends, BackendId, ModelFormat};
use super::load_error::{Alternative, AlternativeKind, UnsupportedReason};
use serde::Serialize;

/// Resolver output. Either a concrete plan or a typed failure with
/// alternatives.
#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum Resolution {
    /// The registry has a backend that can load this `(arch, format)`
    /// in the current build.
    Ok {
        /// Backend chosen to satisfy the load request.
        backend: BackendId,
        /// Non-fatal advisories — e.g. "this is a legacy fallback
        /// backend, Qwen3 is recommended".
        notes: Vec<String>,
    },
    /// No loader is available. The frontend should show the reason
    /// and offer the alternatives.
    Unsupported {
        /// Architecture the caller requested.
        arch: ArchId,
        /// File format the caller requested.
        format: ModelFormat,
        /// Canonical reason no backend could satisfy the request.
        reason: UnsupportedReason,
        /// Ordered follow-up actions the UI can surface.
        alternatives: Vec<Alternative>,
    },
}

/// Resolve a `(arch, format)` query against the registry and the
/// installed backend matrix.
///
/// Algorithm:
///
/// 1. Walk the installed backends. For each, check if it declares
///    support for `(arch, format)`.
/// 2. If a match is found and the backend is installed, return
///    `Resolution::Ok` with any tier-based advisory notes.
/// 3. If a declaration exists but the backend is not installed,
///    record `BackendNotInstalled` and continue scanning.
/// 4. If no declaration exists, record `FormatNotWired`.
/// 5. Build the alternative list from same-format-other-arch and
///    other-format-same-arch entries in the registry.
#[must_use]
pub fn resolve_compatibility(arch: ArchId, format: ModelFormat) -> Resolution {
    let matrix = installed_backends();

    let Some(arch_spec) = get_arch(arch) else {
        return Resolution::Unsupported {
            arch,
            format,
            reason: UnsupportedReason::FormatNotWired {
                detail: "Architecture not in the registry".to_string(),
            },
            alternatives: Vec::new(),
        };
    };

    // Planned slots never resolve — the frontend renders them as
    // "coming soon" without attempting the load.
    if arch_spec.tier == SupportTier::Planned {
        return Resolution::Unsupported {
            arch,
            format,
            reason: UnsupportedReason::PlannedSlot,
            alternatives: collect_alternatives(arch, format, &matrix.backends),
        };
    }

    // Scan installed backends for a matching `(arch, format)` entry.
    let mut declared_but_uninstalled: Option<(BackendId, String)> = None;
    for backend in &matrix.backends {
        for support in backend.supports {
            if support.arch == arch && support.format == format {
                if backend.installed {
                    let mut notes = Vec::new();
                    if arch_spec.tier == SupportTier::Legacy {
                        notes.push(
                            "This architecture is deprecated — Qwen3 is the \
                             recommended replacement."
                                .to_string(),
                        );
                    }
                    if arch_spec.tier == SupportTier::Secondary {
                        notes.push(
                            "This architecture is a fallback loader — the \
                             primary path is a different backend."
                                .to_string(),
                        );
                    }
                    return Resolution::Ok {
                        backend: backend.id,
                        notes,
                    };
                }
                // Declared but not installed — remember the first one
                // and keep scanning in case another backend offers a
                // working path.
                if declared_but_uninstalled.is_none() {
                    declared_but_uninstalled = Some((backend.id, backend.feature_flag.to_string()));
                }
            }
        }
    }

    let reason = if let Some((backend, feature_flag)) = declared_but_uninstalled {
        UnsupportedReason::BackendNotInstalled {
            backend,
            feature_flag,
        }
    } else {
        UnsupportedReason::FormatNotWired {
            detail: format!("No backend declares support for {arch:?} in {format:?} format",),
        }
    };

    Resolution::Unsupported {
        arch,
        format,
        reason,
        alternatives: collect_alternatives(arch, format, &matrix.backends),
    }
}

/// Build the alternative suggestion list for an unsupported request.
///
/// Order:
///
/// 1. Same arch, different format (GGUF alternative for a failed
///    safetensors request, and vice versa).
/// 2. Same family, different arch (Qwen3 for a failed Qwen2 request).
/// 3. Connect hint if any backend declares support but isn't served
///    locally (loading is Clyffy's, over the wire).
///
/// Suggestions derive from DECLARATIONS, not local installs — the
/// engine is the management layer and compiles no backend; whether a
/// suggested path actually loads is computed from the connected Clyffy
/// capability at a different layer.
fn collect_alternatives(
    arch: ArchId,
    format: ModelFormat,
    backends: &[super::backends::BackendInfo],
) -> Vec<Alternative> {
    let mut alternatives = Vec::new();

    // Same arch, different format
    for backend in backends {
        for support in backend.supports {
            if support.arch == arch && support.format != format {
                alternatives.push(Alternative {
                    kind: AlternativeKind::SwitchFormat,
                    repo_id: None,
                    filename: None,
                    reason: format!(
                        "The same model is loadable via {:?} format. The same repo \
                         usually has this file.",
                        support.format
                    ),
                });
            }
        }
    }

    // Same family, different arch (in tier order). The architectures
    // array is already ordered Primary → Secondary → Legacy → Planned,
    // so we walk it and suggest the first non-Planned same-family
    // candidate that has any declared backend coverage.
    //
    // The format is NOT required to match the original request: when
    // the requested format is unsupported across the board (e.g. a
    // legacy Pytorch checkpoint), the user needs both a `SwitchFormat`
    // hint (already pushed above for the requested arch) AND a
    // `SwitchModel` hint (pushed here) to find a working path. Forcing
    // the candidate to support the requested format would silently
    // drop the upgrade suggestion in exactly the case the user most
    // needs it.
    let Some(arch_spec) = get_arch(arch) else {
        return alternatives;
    };
    for candidate in super::architectures::ALL {
        if candidate.id == arch || candidate.family != arch_spec.family {
            continue;
        }
        if candidate.tier == SupportTier::Planned {
            continue;
        }
        let declared = backends
            .iter()
            .any(|b| b.supports.iter().any(|s| s.arch == candidate.id));
        if declared {
            let tier_descriptor = match candidate.tier {
                SupportTier::Primary => "primary tier",
                SupportTier::Secondary => "secondary fallback",
                SupportTier::Legacy => "legacy fallback",
                SupportTier::Planned => continue,
            };
            alternatives.push(Alternative {
                kind: AlternativeKind::SwitchModel,
                repo_id: None,
                filename: None,
                reason: format!(
                    "Consider {} — same family, {tier_descriptor}.",
                    candidate.display
                ),
            });
            break;
        }
    }

    // Connect hint — the combination is declared but nothing serves it
    // locally: loading happens on Clyffy, over the wire.
    let has_declared_uninstalled = backends.iter().any(|b| {
        !b.installed
            && b.supports
                .iter()
                .any(|s| s.arch == arch && s.format == format)
    });
    if has_declared_uninstalled {
        alternatives.push(Alternative {
            kind: AlternativeKind::UpgradeBuild,
            repo_id: None,
            filename: None,
            reason: "This model type is served by your AI assistant — connect \
                     the AI layer to load it."
                .to_string(),
        });
    }

    alternatives
}

// ── Tests ─────────────────────────────────────────────────────────
//
// The engine is the model MANAGEMENT layer — it compiles no inference
// backend, so `installed` is uniformly false and every declared
// `(arch, format)` combination resolves to `BackendNotInstalled`
// naming the backend that WOULD satisfy it (live availability is
// computed from the connected Clyffy capability over the wire). These
// tests assert that management-level truth; the installed/Ok path is
// exercised where backends actually load — Clyffy-side.

#[cfg(test)]
mod tests {
    use super::*;

    /// The registry DECLARES the arch-native Qwen3 safetensors loader
    /// and reports it uninstalled locally (it is Clyffy's).
    #[test]
    fn qwen3_safetensors_declares_candle_qwen3_uninstalled() {
        let result = resolve_compatibility(ArchId::Qwen3, ModelFormat::Safetensors);
        match result {
            Resolution::Unsupported {
                reason: UnsupportedReason::BackendNotInstalled { backend, .. },
                ..
            } => assert_eq!(
                backend,
                BackendId::CandleSafetensorsQwen3,
                "Qwen3 safetensors must surface the arch-native loader as the missing backend"
            ),
            other => panic!("expected BackendNotInstalled, got {other:?}"),
        }
    }

    /// Qwen3 GGUF → the arch-native quantized loader is the declared path.
    #[test]
    fn qwen3_gguf_declares_quantized_qwen3_uninstalled() {
        let result = resolve_compatibility(ArchId::Qwen3, ModelFormat::Gguf);
        match result {
            Resolution::Unsupported {
                reason: UnsupportedReason::BackendNotInstalled { backend, .. },
                ..
            } => assert_eq!(backend, BackendId::CandleQuantizedQwen3),
            other => panic!("expected BackendNotInstalled, got {other:?}"),
        }
    }

    /// Phi-3 safetensors is a declared first-class combination.
    #[test]
    fn phi3_safetensors_is_declared() {
        let result = resolve_compatibility(ArchId::Phi3, ModelFormat::Safetensors);
        assert!(
            matches!(
                result,
                Resolution::Unsupported {
                    reason: UnsupportedReason::BackendNotInstalled { .. },
                    ..
                }
            ),
            "Phi-3 safetensors must be a declared combination, got {result:?}"
        );
    }

    /// Phi-3 `MoE` — both formats are declared combinations.
    #[test]
    fn phi3_moe_both_formats_are_declared() {
        for format in [ModelFormat::Safetensors, ModelFormat::Gguf] {
            let result = resolve_compatibility(ArchId::Phi3Moe, format);
            assert!(
                matches!(
                    result,
                    Resolution::Unsupported {
                        reason: UnsupportedReason::BackendNotInstalled { .. },
                        ..
                    }
                ),
                "Phi-3 MoE {format:?} must be declared, got {result:?}"
            );
        }
    }

    /// Qwen2 is legacy but stays a declared combination — the registry
    /// keeps the routing knowledge. (The deprecation advisory attaches
    /// on the installed/Ok path, which lives Clyffy-side.)
    #[test]
    fn qwen2_legacy_is_still_declared() {
        let result = resolve_compatibility(ArchId::Qwen2, ModelFormat::Safetensors);
        assert!(
            matches!(
                result,
                Resolution::Unsupported {
                    reason: UnsupportedReason::BackendNotInstalled { .. },
                    ..
                }
            ),
            "Qwen2 safetensors must remain declared, got {result:?}"
        );
    }

    /// Qwen 3.5 is a planned slot — must return Unsupported with
    /// `PlannedSlot` and alternatives pointing at current primary
    /// options.
    #[test]
    fn qwen35_planned_slot_returns_planned_unsupported() {
        let result = resolve_compatibility(ArchId::Qwen35, ModelFormat::Safetensors);
        match result {
            Resolution::Unsupported {
                reason: UnsupportedReason::PlannedSlot,
                ..
            } => {}
            other => panic!("Qwen 3.5 must return PlannedSlot, got {other:?}"),
        }
    }

    /// Unknown format combo returns Unsupported and the alternatives
    /// list should surface the arch-native loader for the OTHER
    /// format (format switch is the primary suggestion kind).
    #[test]
    fn alternatives_include_format_switch() {
        // Ask for Qwen3 in a format we don't load (Pytorch) — the
        // alternatives should include SwitchFormat pointing at
        // Safetensors and/or GGUF.
        let result = resolve_compatibility(ArchId::Qwen3, ModelFormat::Pytorch);
        if let Resolution::Unsupported { alternatives, .. } = result {
            // Alternatives derive from DECLARATIONS, not local installs —
            // they hold unconditionally in the management layer.
            assert!(
                alternatives
                    .iter()
                    .any(|a| matches!(a.kind, AlternativeKind::SwitchFormat)),
                "Unsupported format must suggest switching to a wired format"
            );
        } else {
            panic!("Qwen3 Pytorch must be unsupported");
        }
    }

    /// Same-family alternative suggestion: asking for Qwen2 legacy
    /// should include a `SwitchModel` alternative pointing at Qwen3.
    #[test]
    fn alternatives_include_same_family_upgrade_for_legacy() {
        // Build a synthetic uninstalled scenario by requesting a
        // format the installed backends don't support for Qwen2.
        // Because Qwen2 HAS safetensors support, use Pytorch as the
        // unwired format.
        let result = resolve_compatibility(ArchId::Qwen2, ModelFormat::Pytorch);
        if let Resolution::Unsupported { alternatives, .. } = result {
            // The family walk visits Qwen3 first (primary) so a
            // SwitchModel alternative should be present — declarations
            // drive alternatives, independent of local installs.
            let has_family_upgrade = alternatives
                .iter()
                .any(|a| matches!(a.kind, AlternativeKind::SwitchModel));
            assert!(
                has_family_upgrade,
                "Legacy arch in unwired format should suggest a same-family upgrade"
            );
        } else {
            panic!("Qwen2 Pytorch must be unsupported");
        }
    }
}
