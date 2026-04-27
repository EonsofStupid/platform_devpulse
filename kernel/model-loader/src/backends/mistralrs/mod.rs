//! mistral.rs multimodal backend — pure-Rust inference for Phi-4
//! multimodal-instruct (and other vision-language Hugging Face repos
//! supported by `mistralrs::MultimodalModelBuilder`).
//!
//! See [`phi4mm::MistralRsPhi4MmBackend`] for the slot's load + chat
//! shape. The umbrella `mistralrs` crate version is pinned to `0.8.1`
//! at the workspace level; the `mistralrs-backend` Cargo feature
//! gates this whole module so default builds stay lean.

#[cfg(feature = "mistralrs-backend")]
pub mod phi4mm;

#[cfg(feature = "mistralrs-backend")]
pub use phi4mm::MistralRsPhi4MmBackend;
