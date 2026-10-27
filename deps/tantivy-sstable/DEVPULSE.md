# Dependency source patch

Source: the published `tantivy-sstable` 0.7.0 crate, upstream commit
`9e63fc508153ef770f9ff980c8fa2f11e8e2e6db` (`sstable/`).
The source, tests and benchmarks are copied without changes. The original
manifest remains in `Cargo.toml.orig`. Cargo's registry cache markers and
the standalone package lockfile are not part of this source patch.

The only build change is `[dependencies.zstd].version = "0.14.3"` in the
normalized manifest. This follows upstream's dependency update in
<https://github.com/quickwit-oss/tantivy/commit/dd0bc2336080ccb5b078fab6e8e21f99eca56fbd>
and requires the patched zstd release. The workspace lockfile selects
zstd-safe 8.2.0 and zstd-sys 2.1.2.

This resolves RUSTSEC-2026-0391, RUSTSEC-2026-0398, RUSTSEC-2026-0403 and
RUSTSEC-2026-0410 while preserving Turso's full-text search feature.
Turso 0.8.3 requires Tantivy 0.26.2, whose dictionary calls differ from the
unreleased snapshot at the dependency-update commit. There are no API
adapters or copied application implementations here: Cargo builds this
single patched source in place of the registry package.

When Turso supports the released Tantivy line with fixed compression
dependencies, update that dependency and verify database/index round trips
before retiring this source patch. Owner: plan 0009's push-gate repair.
