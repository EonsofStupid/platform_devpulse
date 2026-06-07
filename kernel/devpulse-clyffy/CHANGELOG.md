# Changelog

## [1.0.1](https://github.com/EonsofStupid/platform_devpulse/compare/devpulse-clyffy-v1.0.0...devpulse-clyffy-v1.0.1) (2026-06-04)


### Bug Fixes

* **desktop:** post-API-alignment cleanup across Rust + frontend ([#8](https://github.com/EonsofStupid/platform_devpulse/issues/8)) ([4071c1a](https://github.com/EonsofStupid/platform_devpulse/commit/4071c1a8e10aea58be164bde34bfe00f76e814ab))

## [1.0.0](https://github.com/EonsofStupid/platform_devpulse/compare/devpulse-clyffy-v0.1.0...devpulse-clyffy-v1.0.0) (2026-05-26)


### ⚠ BREAKING CHANGES

* **clyffy:** SurrealDB sidecar -> embedded kv-surrealkv

### refactor

* **clyffy:** SurrealDB sidecar -&gt; embedded kv-surrealkv ([251b0a5](https://github.com/EonsofStupid/platform_devpulse/commit/251b0a52460673f1860926636821bfb5318febba))


### Features

* add SetupWizardOverlay component for first-run wizard experience ([37f54b6](https://github.com/EonsofStupid/platform_devpulse/commit/37f54b65ab5e65822e87f2c7b6c14b17d1fc542e))
* **backend:** add profile knowledge and routing services ([828aefa](https://github.com/EonsofStupid/platform_devpulse/commit/828aefa60a25e558d1f308bd420a03049a33b910))
* **chat:** add tokenized shell and session tooling ([2275926](https://github.com/EonsofStupid/platform_devpulse/commit/2275926114cdde941063c7cfa15a1646c0c13148))
* **chat:** type-time intellisense pipeline + devforge config view ([c4a6430](https://github.com/EonsofStupid/platform_devpulse/commit/c4a6430c6d01f8cae9bca888ca08ec4d2e2a09c5))
* **clyffy:** abstract intelligence layer + SurrealDB connector ([6219236](https://github.com/EonsofStupid/platform_devpulse/commit/6219236b574432213acd963075fd7d89e76942a2))
* **clyffy:** Burn 0.21 + BF16 CPU via Flex backend + cag::Embedder bridge ([caa01cf](https://github.com/EonsofStupid/platform_devpulse/commit/caa01cf2e7fb1877e4c542d7c887065375d91a5b))
* **clyffy:** burn-backed Qwen3 encoder for RRO embedder ([901617c](https://github.com/EonsofStupid/platform_devpulse/commit/901617c2c96c147293fb5ffaf9e0ddc2f473c0fb))
* **clyffy:** cortex community module — cache + types ([96c3a42](https://github.com/EonsofStupid/platform_devpulse/commit/96c3a42a4fef17170662ce52db58c2a05d7ecb1c))
* **clyffy:** cortex governance module + persona-graph devtool surface ([da920aa](https://github.com/EonsofStupid/platform_devpulse/commit/da920aae7311b309471a600981cac24326679bde))
* **clyffy:** cortex intelligence module + pipeline + spec ([276fde9](https://github.com/EonsofStupid/platform_devpulse/commit/276fde92427b4914f82bbc0125fff3423ed9ddf2))
* **clyffy:** cortex sidecar adapters — port allocator, Ollama, SurrealDB ([15f60f0](https://github.com/EonsofStupid/platform_devpulse/commit/15f60f084bce6463609347918927aeb9066ea1c9))
* **clyffy:** DuckDB diagnostics harness + JSON heap-corruption regression test ([8de1de1](https://github.com/EonsofStupid/platform_devpulse/commit/8de1de1bb0f43f99ba2d709fcc9b18167e7d4b13))
* **clyffy:** estates schema in reasoning namespace ([980fb84](https://github.com/EonsofStupid/platform_devpulse/commit/980fb846f44431b9637631c9ee8b2df163b9a836))
* **clyffy:** impl HotUpdateable for BurnEmbedder — safetensors loader ([a601e3a](https://github.com/EonsofStupid/platform_devpulse/commit/a601e3aae606c1d4ff9d1a68a56f6c606d716cb8))
* **clyffy:** interactions module + welcome-back template ([cfcb852](https://github.com/EonsofStupid/platform_devpulse/commit/cfcb852cdae65ea095156e95b7cd9a71345dc1da))
* **clyffy:** knowledge library data + manifest + MD-to-JSON build pipeline ([fb750fc](https://github.com/EonsofStupid/platform_devpulse/commit/fb750fc4ce0ccd4b265dc8d35466d3570f6e5078))
* **clyffy:** knowledge module — content packs + sync pipeline ([c9225de](https://github.com/EonsofStupid/platform_devpulse/commit/c9225de729a980ef6dbca40fb7ff1fdaba8104eb))
* **clyffy:** scaffold tree-sitter safety adapter with 7-language support ([36c5407](https://github.com/EonsofStupid/platform_devpulse/commit/36c5407ad25993fbface33ae74a812eef0761cae))
* **clyffy:** SurrealDB client API expansion ([201115f](https://github.com/EonsofStupid/platform_devpulse/commit/201115fea5dcfdb26730451d2b12211c8ad75849))
* **clyffy:** swap_blocking on BurnEncoderAdapter + RRD-driven impl ([4d29bbb](https://github.com/EonsofStupid/platform_devpulse/commit/4d29bbb14b95c6f060b741452ddcc009f9513bfe))
* **clyffy:** tokenizer wiring, embed API, RRD daemon construction ([e39c855](https://github.com/EonsofStupid/platform_devpulse/commit/e39c855fc307c24b1035f5fe22c81027a3a2ae85))
* **clyffy:** wire model-loader into platform boot with hf search ([9747e69](https://github.com/EonsofStupid/platform_devpulse/commit/9747e69eccb3e176ec72291068f5f828c47cf388))
* **engine:** add model-loader crate, layman ui, remove outlines-core ([bee6f11](https://github.com/EonsofStupid/platform_devpulse/commit/bee6f11182689ae38ae0fed7b7db040300f44fd3))
* **model-loader:** BackendType::Burn — Harrier loads through Burn, not Candle ([a708da9](https://github.com/EonsofStupid/platform_devpulse/commit/a708da96db1d27a60e7722ede070520ad5bf40be))
* **model-loader:** kernel ssot + setup wizard overlay absorption ([a75ced3](https://github.com/EonsofStupid/platform_devpulse/commit/a75ced3524a97570cc66ac2b3eb209abe995a74e))
* **model-loader:** voice pipeline phases 1-4, deps, snac ort, coupled lifecycle ([85fea87](https://github.com/EonsofStupid/platform_devpulse/commit/85fea8710c8f546ddc3f751519312158513a1f94))
* **xtask:** seamless GPU+CPU acceleration auto-detect at build time ([c198f66](https://github.com/EonsofStupid/platform_devpulse/commit/c198f66e06da78ab79419618d0befedf4159a70b))


### Bug Fixes

* **clyffy:** establish Burn as real cortex — slots, geometry, UI ([1a73358](https://github.com/EonsofStupid/platform_devpulse/commit/1a73358966f66edb1cdc359fbb8ac8bf212c2484))
* **clyffy:** knowledge selector + persistence trait updates ([b650582](https://github.com/EonsofStupid/platform_devpulse/commit/b650582135872f4354c2bf7899150ea24f41a065))
* **clyffy:** restore outlines feature gate for build compatibility ([b0c1191](https://github.com/EonsofStupid/platform_devpulse/commit/b0c1191f81de4b52986dd41df7c1bdd9990c1de0))
* **clyffy:** surreal.rs adapter follow-up ([1d0b11f](https://github.com/EonsofStupid/platform_devpulse/commit/1d0b11f33d537b805a352007df13e97c39a8414a))
* **clyffy:** surrealdb_sidecar.rs follow-up (+5 lines) ([515bf01](https://github.com/EonsofStupid/platform_devpulse/commit/515bf0148a9e9a3d8feb46facebc6ccda0c0e060))
* **engine:** align model loader and devforge boot paths ([317d9aa](https://github.com/EonsofStupid/platform_devpulse/commit/317d9aaa22cfca16c55ac5b2a08d9ae50beba10e))
* zero compile warnings across all crates ([de33611](https://github.com/EonsofStupid/platform_devpulse/commit/de33611b06afc1ae395005ef220411ba122ab1fc))


### Documentation

* **engine:** tidy stale _sidecar paths in doc comments after Phase 1.5 rename ([8062814](https://github.com/EonsofStupid/platform_devpulse/commit/80628146ed4bafd56cbc2f61cb74bc17d7873eb8))
