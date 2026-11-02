# Dependency source patch

Published source: candle-core 0.9.2 from crates.io.
Archive SHA-256: `c15b675b80d994b2eadb20a4bbe434eabeb454eac3ee5e2b4cf6f147ee9be091`.
Upstream: https://github.com/huggingface/candle

Published tests, fixtures, benchmarks and licenses are retained byte-for-byte.
The zip requirement changes from `7.2.0` to `9.2.1` in normalized Cargo.toml.
`src/npy.rs` and `src/pickle.rs` apply upstream Candle's direct migration to
fallible archive names: propagate ZipError and own decoded names. No error is
ignored and no wrapper API is added. `src/cpu/erf.rs` drops the deprecated
std::f64 module import so existing infinity constants resolve on the primitive
type; arithmetic is unchanged. All other published source is unchanged.
The additional devpulse_archive_tests target exercises eager/lazy named tensor
round trips, legacy CP437 filename decoding, and truncated-archive errors.
Cargo.toml.orig and upstream VCS provenance remain unchanged. The standalone package lockfile and registry
cache markers are omitted; the platform workspace lockfile owns resolution.

This removes zip 7 from the resolved graph and addresses extraction advisories
RUSTSEC-2026-0367, 0368, 0369 and 0429 without advisory exceptions or API adapters.
Candle main also uses zip 9; this patch retains the model libraries' existing
Candle API versions while applying the fixed archive dependency directly.
Sources:
- https://rustsec.org/advisories/RUSTSEC-2026-0429
- https://github.com/huggingface/candle/blob/main/Cargo.toml
- https://github.com/huggingface/candle/blob/main/candle-core/src/npy.rs
- https://github.com/huggingface/candle/blob/main/candle-core/src/pickle.rs

The two patched Candle versions are already required by the graph: Qwen uses
0.9 and Mistral/the platform use 0.10. Cargo builds each patched crate in place
of its registry copy. Remove the corresponding patch when its callers support
an upstream release with zip >=9, after tensor archive regression tests pass.
Owner: plan 0009's restoration push-gate repair, 2026-11-02.
