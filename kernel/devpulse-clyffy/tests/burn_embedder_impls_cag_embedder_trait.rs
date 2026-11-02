//! Smoke test: `CortexBurnAdapter<EmbedderCpuBackend>` satisfies the
//! `cag::Embedder` trait contract (`dimension` + dyn-castability).
//!
//! Does NOT exercise `embed()` — that requires a real safetensors file
//! the test fixture doesn't ship. The smoke test catches the regression
//! "trait impl got dropped or its bounds drift" by trying to construct
//! `Arc<dyn Embedder>` from `Arc<CortexBurnAdapter<...>>`.

#![cfg(feature = "burn-cpu")]

use std::sync::Arc;

use burn::prelude::Device;
use devpulse_clyffy::cortex::cag::Embedder;
use devpulse_clyffy::cortex::persistence::burn::{CortexBurnAdapter, EmbedderCpuBackend};

#[test]
fn burn_adapter_implements_cag_embedder_trait_and_reports_harrier_dimension() {
    // Construct the adapter with the Harrier 0.6B preset — same shape
    // engine boot uses. `burn::prelude::Device<B>` is the canonical type
    // alias for `<B as Backend>::Device` in Burn 0.21+, picked because it
    // keeps the test agnostic to the concrete backend the cortex
    // abstraction selects (`Flex` today, `Cuda` / `Wgpu` tomorrow).
    let device = Device::<EmbedderCpuBackend>::default();
    let adapter: Arc<CortexBurnAdapter<EmbedderCpuBackend>> = Arc::new(CortexBurnAdapter::<
        EmbedderCpuBackend,
    >::harrier_0_6b(device));

    // The cast is what's load-bearing: if the `impl Embedder for
    // CortexBurnAdapter<B>` block ever loses its bounds (or the trait's
    // signature drifts), this coercion stops compiling.
    let as_dyn: Arc<dyn Embedder> = adapter.clone();

    // Harrier 0.6B reports hidden_size = 1024 — the trait surfaces
    // that without needing a loaded encoder.
    assert_eq!(as_dyn.dimension(), 1024);
}
