//! Smoke test: `ConnectomeBurnAdapter<EmbedderCpuBackend>` satisfies the
//! `cag::Embedder` trait contract (`dimension` + dyn-castability).
//!
//! Does NOT exercise `embed()` — that requires a real safetensors file
//! the test fixture doesn't ship. The smoke test catches the regression
//! "trait impl got dropped or its bounds drift" by trying to construct
//! `Arc<dyn Embedder>` from `Arc<ConnectomeBurnAdapter<...>>`.

#![cfg(feature = "burn-cpu")]

use std::sync::Arc;

use burn::prelude::Device;
use devpulse_clyffy::connectome::cag::Embedder;
use devpulse_clyffy::connectome::persistence::burn::{ConnectomeBurnAdapter, EmbedderCpuBackend};

#[test]
fn burn_adapter_implements_cag_embedder_trait_and_reports_harrier_dimension() {
    // Construct the adapter with the Harrier 0.6B preset — same shape
    // engine boot uses. `burn::prelude::Device<B>` is the canonical type
    // alias for `<B as Backend>::Device` in Burn 0.21+, picked because it
    // keeps the test agnostic to the concrete backend the connectome
    // abstraction selects (`Flex` today, `Cuda` / `Wgpu` tomorrow).
    let device: Device<EmbedderCpuBackend> = Default::default();
    let adapter: Arc<ConnectomeBurnAdapter<EmbedderCpuBackend>> = Arc::new(
        ConnectomeBurnAdapter::<EmbedderCpuBackend>::harrier_0_6b(device),
    );

    // The cast is what's load-bearing: if the `impl Embedder for
    // ConnectomeBurnAdapter<B>` block ever loses its bounds (or the trait's
    // signature drifts), this coercion stops compiling.
    let as_dyn: Arc<dyn Embedder> = adapter.clone();

    // Harrier 0.6B reports hidden_size = 1024 — the trait surfaces
    // that without needing a loaded encoder.
    assert_eq!(as_dyn.dimension(), 1024);
}
