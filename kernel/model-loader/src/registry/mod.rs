//! # Architecture & backend registry
//!
//! Two cooperating registries plus a resolver:
//!
//! - [`architectures`] — every supported model architecture, its
//!   canonical id, aliases, family, context bounds, VRAM hints, and
//!   the set of format × backend combinations that can load it.
//! - [`backends`]      — every inference backend this build can
//!   actually instantiate. Populated from Cargo features at compile
//!   time so the resolver knows the intersection of *declared*
//!   support and *installed* support.
//! - [`resolver`]      — pure function: given `(arch, format, quant)`
//!   and the installed backend set, returns either a concrete plan
//!   (`backend` + notes) or an `Unsupported` variant with actionable
//!   alternatives ordered by tier.
//!
//! The registry is SSOT for what loaders exist today. When a new
//! architecture lands in `candle-transformers`, you add one row to
//! [`architectures::ALL`] and one branch in [`backends::load_dispatch`];
//! the resolver and every downstream consumer pick it up automatically.
//!
//! # Flow
//!
//! ```text
//!                 ┌────────────────────────────┐
//!   repo_id ─────▶│ fetch HF config.json       │
//!                 └──────────────┬─────────────┘
//!                                │  architectures[0], model_type
//!                                ▼
//!                 ┌────────────────────────────┐
//!                 │ architectures::classify()   │
//!                 └──────────────┬─────────────┘
//!                                │  ArchId
//!                                ▼
//!                 ┌────────────────────────────┐
//!                 │ resolver::resolve()         │
//!                 │  + installed backend set    │
//!                 └──────────────┬─────────────┘
//!                                │
//!                ┌───────────────┴────────────────┐
//!                ▼                                ▼
//!         Resolution::Ok                Resolution::Unsupported
//!         { backend, notes }            { reason, alternatives }
//! ```
//!
//! Frontend calls `list_backend_matrix` once at boot to populate a
//! `ModelCompatibilityCard` and `resolve_repo_compatibility` before
//! every download so the user sees the gate decision up front.

pub mod architectures;
pub mod backends;
pub mod load_error;
pub mod resolver;

pub use architectures::{
    ArchFamily, ArchId, ArchitectureSpec, SupportStatus, SupportTier, classify_arch_from_gguf,
    classify_arch_from_hf_config,
};
// Migration alias — delete after consumer sweep.
#[allow(deprecated)]
pub use architectures::classify_safetensors_arch;
pub use backends::{
    BackendId, BackendInfo, BackendMatrix, FormatSupport, ModelFormat, installed_backends,
};
pub use load_error::{Alternative, AlternativeKind, LoadError, UnsupportedReason};
pub use resolver::{Resolution, resolve_compatibility};
