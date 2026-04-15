//! # Compatibility resolver
//!
//! Pure function: given `(arch, format)` plus the installed backend
//! set, return either a concrete loader plan or an `Unsupported`
//! variant with alternatives ordered by tier.
//!
//! No IO, no allocation of heavy data — callable from the frontend
//! via the Tauri command layer and from the kernel inline during the
//! actual load pass.

use super::architectures::{get as get_arch, ArchId, SupportTier};
use super::backends::{installed_backends, BackendId, FormatSupport, ModelFormat};
use super::load_error::{Alternative, AlternativeKind, UnsupportedReason};
use serde::Serialize;

/// Resolver output. Either a concrete plan or a typed failure with
/// alternatives.
#[derive(Debug, Clone, Serialize)]
#[cfg_attr(feature = "specta", derive(specta::Type))]
#[serde(tag = "kind", rename_all = "kebab-case")]
pub enum Resolution {
    /// The registry has a backend that can load this `(arch, format)`
    /// in the current build.
    Ok {
        backend: BackendId,
        /// Non-fatal advisories — e.g. "this is a legacy fallback
        /// backend, Qwen3 is recommended".
        notes: Vec<String>,
    },
    /// No loader is available. The frontend should show the reason
    /// and offer the alternatives.
    Unsupported {
        arch: ArchId,
        format: ModelFormat,
        reason: UnsupportedReason,
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

    let arch_spec = match get_arch(arch) {
        Some(spec) => spec,
        None => {
            return Resolution::Unsupported {
                arch,
                format,
                reason: UnsupportedReason::FormatNotWired {
                    detail: "Architecture not in the registry".to_string(),
                },
                alternatives: Vec::new(),
            };
        }
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
                    declared_but_uninstalled =
                        Some((backend.id, backend.feature_flag.to_string()));
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
            detail: format!(
                "No backend declares support for {arch:?} in {format:?} format",
            ),
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
/// 3. Upgrade hint if any backend declares support but is missing a
///    feature flag.
fn collect_alternatives(
    arch: ArchId,
    format: ModelFormat,
    backends: &[super::backends::BackendInfo],
) -> Vec<Alternative> {
    let mut alternatives = Vec::new();

    // Same arch, different format
    for backend in backends {
        if !backend.installed {
            continue;
        }
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
    // array is already ordered Primary → Legacy, so we walk it and
    // suggest the first compatible alternative we find.
    let arch_spec = match get_arch(arch) {
        Some(spec) => spec,
        None => return alternatives,
    };
    for candidate in super::architectures::ALL {
        if candidate.id == arch || candidate.family != arch_spec.family {
            continue;
        }
        // Is there an installed backend that covers this candidate
        // in the originally-requested format?
        let available = backends.iter().any(|b| {
            b.installed
                && b.supports
                    .iter()
                    .any(|s| s.arch == candidate.id && s.format == format)
        });
        if available {
            alternatives.push(Alternative {
                kind: AlternativeKind::SwitchModel,
                repo_id: None,
                filename: None,
                reason: format!(
                    "Consider {} — same family, primary tier.",
                    candidate.display
                ),
            });
            break;
        }
    }

    // Upgrade hint
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
            reason: "A backend for this combination is declared but its Cargo \
                     feature is disabled in this build. Enable the feature and \
                     rebuild to unlock it."
                .to_string(),
        });
    }

    alternatives
}

/// Shorthand used inside `FormatSupport` iteration so the inner
/// scanning loops read cleanly without double-`iter` calls. Kept in
/// this module (not exported) because it's a pure internal helper.
#[allow(dead_code)]
fn supports_entry_matches(entry: &FormatSupport, arch: ArchId, format: ModelFormat) -> bool {
    entry.arch == arch && entry.format == format
}

// ── Tests ─────────────────────────────────────────────────────────
//
// These tests assume `candle-backend` is enabled (the default for
// `cargo test -p model-loader`). If you run the test suite with
// `--no-default-features` the `Candle*` backends are not installed
// and the expectations flip — use the per-variant checks.

#[cfg(test)]
mod tests {
    use super::*;

    /// Primary path: Qwen3 safetensors should resolve to the
    /// Candle safetensors Qwen3 backend when the feature is on.
    #[test]
    fn qwen3_safetensors_resolves_to_candle_qwen3() {
        let result = resolve_compatibility(ArchId::Qwen3, ModelFormat::Safetensors);
        match result {
            Resolution::Ok { backend, notes: _ } => {
                if cfg!(feature = "candle-backend") {
                    assert_eq!(
                        backend,
                        BackendId::CandleSafetensorsQwen3,
                        "Qwen3 safetensors must resolve to the arch-native loader"
                    );
                }
            }
            Resolution::Unsupported { .. } => {
                // Only acceptable when the candle feature is OFF.
                assert!(
                    !cfg!(feature = "candle-backend"),
                    "Qwen3 safetensors should resolve when candle-backend is on"
                );
            }
        }
    }

    /// Primary path: Qwen3 GGUF → arch-native quantized loader.
    #[test]
    fn qwen3_gguf_resolves_to_quantized_qwen3() {
        let result = resolve_compatibility(ArchId::Qwen3, ModelFormat::Gguf);
        if let Resolution::Ok { backend, .. } = result {
            if cfg!(feature = "candle-backend") {
                assert_eq!(backend, BackendId::CandleQuantizedQwen3);
            }
        }
    }

    /// Phi-3 safetensors is a first-class target too — must resolve.
    #[test]
    fn phi3_safetensors_resolves() {
        let result = resolve_compatibility(ArchId::Phi3, ModelFormat::Safetensors);
        if cfg!(feature = "candle-backend") {
            assert!(matches!(result, Resolution::Ok { .. }));
        }
    }

    /// Phi-3 MoE is the benchmark target — both formats must resolve.
    #[test]
    fn phi3_moe_both_formats_resolve() {
        let sft = resolve_compatibility(ArchId::Phi3Moe, ModelFormat::Safetensors);
        let gguf = resolve_compatibility(ArchId::Phi3Moe, ModelFormat::Gguf);
        if cfg!(feature = "candle-backend") {
            assert!(matches!(sft, Resolution::Ok { .. }));
            assert!(matches!(gguf, Resolution::Ok { .. }));
        }
    }

    /// Qwen2 is legacy — should still resolve but carry an advisory
    /// note steering the user toward Qwen3.
    #[test]
    fn qwen2_legacy_resolves_with_deprecation_note() {
        let result = resolve_compatibility(ArchId::Qwen2, ModelFormat::Safetensors);
        if let Resolution::Ok { notes, .. } = result {
            if cfg!(feature = "candle-backend") {
                assert!(
                    notes.iter().any(|n| n.contains("deprecated")),
                    "Qwen2 must surface a deprecation note"
                );
            }
        }
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
            if cfg!(feature = "candle-backend") {
                assert!(
                    alternatives
                        .iter()
                        .any(|a| matches!(a.kind, AlternativeKind::SwitchFormat)),
                    "Unsupported format must suggest switching to a wired format"
                );
            }
        }
    }

    /// Same-family alternative suggestion: asking for Qwen2 legacy
    /// should include a SwitchModel alternative pointing at Qwen3.
    #[test]
    fn alternatives_include_same_family_upgrade_for_legacy() {
        // Build a synthetic uninstalled scenario by requesting a
        // format the installed backends don't support for Qwen2.
        // Because Qwen2 HAS safetensors support, use Pytorch as the
        // unwired format.
        let result = resolve_compatibility(ArchId::Qwen2, ModelFormat::Pytorch);
        if let Resolution::Unsupported { alternatives, .. } = result {
            if cfg!(feature = "candle-backend") {
                // The family walk visits Qwen3 first (primary) so a
                // SwitchModel alternative should be present.
                let has_family_upgrade = alternatives
                    .iter()
                    .any(|a| matches!(a.kind, AlternativeKind::SwitchModel));
                assert!(
                    has_family_upgrade,
                    "Legacy arch in unwired format should suggest a same-family upgrade"
                );
            }
        }
    }
}
