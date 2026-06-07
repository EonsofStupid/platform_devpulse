# Changelog

## [0.2.1](https://github.com/EonsofStupid/platform_devpulse/compare/coldlight-v0.2.0...coldlight-v0.2.1) (2026-06-04)


### Bug Fixes

* **desktop:** post-API-alignment cleanup across Rust + frontend ([#8](https://github.com/EonsofStupid/platform_devpulse/issues/8)) ([4071c1a](https://github.com/EonsofStupid/platform_devpulse/commit/4071c1a8e10aea58be164bde34bfe00f76e814ab))

## [0.2.0](https://github.com/EonsofStupid/platform_devpulse/compare/coldlight-v0.1.0...coldlight-v0.2.0) (2026-05-21)


### Features

* **a11y:** add scroll lock behavior for modals and overlays ([46f8120](https://github.com/EonsofStupid/platform_devpulse/commit/46f812074dcc3adc808642887371c6d09d044011))
* **a11y:** introduce typeahead behavior for enhanced list navigation ([46f8120](https://github.com/EonsofStupid/platform_devpulse/commit/46f812074dcc3adc808642887371c6d09d044011))
* add DynamicBackground ColdLight component ([2bda6c0](https://github.com/EonsofStupid/platform_devpulse/commit/2bda6c037a164121d90f69bb0d030ea0bc1ee81f))
* add resource mapping for devforge and update related configurations ([927b726](https://github.com/EonsofStupid/platform_devpulse/commit/927b726e0a4ea18333862d1c8a185155f8aebb22))
* add SetupWizardOverlay component for first-run wizard experience ([37f54b6](https://github.com/EonsofStupid/platform_devpulse/commit/37f54b65ab5e65822e87f2c7b6c14b17d1fc542e))
* add structural primitives for UI components ([0bb757c](https://github.com/EonsofStupid/platform_devpulse/commit/0bb757c4a9453b5354c5b92ba96db3c9c273424e))
* add tooltip and tree primitive components with accessibility support ([20f0423](https://github.com/EonsofStupid/platform_devpulse/commit/20f0423558072413ad829489c4e8d757ab75fabd))
* align all 62 components to intent prop + $derived styleId ([a419d08](https://github.com/EonsofStupid/platform_devpulse/commit/a419d08ce992f2ad8fbc70f0bdce067df373e1c2))
* **chat:** add tokenized shell and session tooling ([2275926](https://github.com/EonsofStupid/platform_devpulse/commit/2275926114cdde941063c7cfa15a1646c0c13148))
* **chat:** consolidate chat components and implement new layout ([21ebf6d](https://github.com/EonsofStupid/platform_devpulse/commit/21ebf6de912b6bc019d6c9da97637756d73886d3))
* **chat:** type-time intellisense pipeline + devforge config view ([c4a6430](https://github.com/EonsofStupid/platform_devpulse/commit/c4a6430c6d01f8cae9bca888ca08ec4d2e2a09c5))
* **clyffy:** add tools service for capability catalog ([b2779f9](https://github.com/EonsofStupid/platform_devpulse/commit/b2779f9ecba99f1a3863689359ded00c3d3d987c))
* **clyffy:** Clyffy dashboard page ([b2779f9](https://github.com/EonsofStupid/platform_devpulse/commit/b2779f9ecba99f1a3863689359ded00c3d3d987c))
* **clyffy:** wire model-loader into platform boot with hf search ([9747e69](https://github.com/EonsofStupid/platform_devpulse/commit/9747e69eccb3e176ec72291068f5f828c47cf388))
* **coldlight:** add visual preset system and align 91 components to macro architecture ([cdad2a3](https://github.com/EonsofStupid/platform_devpulse/commit/cdad2a319053f28c2dcad206cebb84647685629a))
* **coldlight:** APG dialog blocks — Confirm, Form, Picker, Wizard ([5ab1036](https://github.com/EonsofStupid/platform_devpulse/commit/5ab10367ce93016936c7a3d5a41227606af44f1b))
* **coldlight:** Clyffy persona blocks — KnowledgeNudge + Mascot ([573fc55](https://github.com/EonsofStupid/platform_devpulse/commit/573fc55a0e476567cbcdd6bb7a99b86a98761bad))
* **coldlight:** DTCG 2025.10 primitives/semantic trees + behavior hooks + SD5 regenerated outputs ([cff73d1](https://github.com/EonsofStupid/platform_devpulse/commit/cff73d18c7e0003a0fb7d22d6caec064fdc3373a))
* **coldlight:** ModelChangePopup + VoiceLabPanel + BackgroundScene + idle timer + zero warnings ([90560b3](https://github.com/EonsofStupid/platform_devpulse/commit/90560b3b80eba952896f53e0fc462dd42622e242))
* **coldlight:** organize behaviors into 5 wai-aria apg families, fix auto_config presets ([c1f4567](https://github.com/EonsofStupid/platform_devpulse/commit/c1f4567618b6509417c20da6ce4f9e8052c9a70a))
* **coldlight:** role accent track + heading slot for cross-cutting roles ([564da51](https://github.com/EonsofStupid/platform_devpulse/commit/564da51688c8f056b9f22c7e5714628a5f9871fd))
* **coldlight:** semantic intent roles — primary/secondary/tertiary accent tokens ([9c43e11](https://github.com/EonsofStupid/platform_devpulse/commit/9c43e11dbe8184c135feef1db2fb65ad93cf2f8e))
* **coldlight:** SubsystemTile block for the devtool dashboard ([277eb66](https://github.com/EonsofStupid/platform_devpulse/commit/277eb66e89cbde0b358fe3eca054ef12d755d9fb))
* **coldlight:** vision devtool — friendly model name + extend Stat accent palette ([658b23a](https://github.com/EonsofStupid/platform_devpulse/commit/658b23a25750753b08fe4502d40fa3d9eadd3790))
* **components:** create KeyValue component for inline label-value pairs ([46f8120](https://github.com/EonsofStupid/platform_devpulse/commit/46f812074dcc3adc808642887371c6d09d044011))
* consolidate chat into ColdLight central library ([297a947](https://github.com/EonsofStupid/platform_devpulse/commit/297a947d5069abf2f6efd5ad721205e9451495b2))
* create enrich-presets script for StyleMacro axes ([084f44a](https://github.com/EonsofStupid/platform_devpulse/commit/084f44abe5907cb343c4f0ba9dca554f10073eca))
* **desktop:** Clyffy mascot + headshot + chat thread touchups ([b1f64a7](https://github.com/EonsofStupid/platform_devpulse/commit/b1f64a79fe37082f2fa3780b4d77ede54485adc1))
* **desktop:** community frontend — design block + domain state + route ([060c6fc](https://github.com/EonsofStupid/platform_devpulse/commit/060c6fc0fec258a81ff5ccdafccd879a61f66391))
* **desktop:** cosmic-galaxy backdrop + smooth sidebar toggle ([71ba522](https://github.com/EonsofStupid/platform_devpulse/commit/71ba5229aefaaed77cbfc97a20b5a850c82eb3ff))
* **desktop:** devtool shared shell touchups + per-tile accent additions ([7896891](https://github.com/EonsofStupid/platform_devpulse/commit/789689115581de7570530f80ec862874e58705ab))
* **desktop:** dynamic background component, setup wizard polish, dist refresh ([a601e43](https://github.com/EonsofStupid/platform_devpulse/commit/a601e43cca6e3395ce58a1e793252389d366e08c))
* **desktop:** implement boot-halt wizard, model control dialog, minion progress scene ([7187e3b](https://github.com/EonsofStupid/platform_devpulse/commit/7187e3b33eb0169cf09e8b2ffbac482f2fbfa1da))
* **desktop:** knowledge frontend — design blocks + context rune + util types ([3d65d8d](https://github.com/EonsofStupid/platform_devpulse/commit/3d65d8d0f826bfbb09f451189b46d674c4912305))
* **desktop:** latest route + updates rune + sidebar entry ([a7f96ee](https://github.com/EonsofStupid/platform_devpulse/commit/a7f96eea931d842e8543368025b4ea1033854469))
* **desktop:** model-loader ux — import, voice, search logging, chat input ([388e569](https://github.com/EonsofStupid/platform_devpulse/commit/388e5694a16df62e2baa56ab964284261fcc3cd8))
* **desktop:** rewrite setup wizard — 8 sequential steps, per-role model assignment ([06de6cc](https://github.com/EonsofStupid/platform_devpulse/commit/06de6cc548bb1c77cb4199f777baff0f705afaa6))
* **desktop:** setup wizard rework, model priming pipeline, sd5 token expansion ([9f8d7ed](https://github.com/EonsofStupid/platform_devpulse/commit/9f8d7ed0548be3a709db5d997e7b9668fad53475))
* **devpulse:** add clyffy dashboard and signal registry ([696926e](https://github.com/EonsofStupid/platform_devpulse/commit/696926e65f7f7a3501bdbf5b42d6eb70b11ac917))
* **devpulse:** reauthor setup wizard and devforge flow ([528412f](https://github.com/EonsofStupid/platform_devpulse/commit/528412f05c0f5f450525a77d9d53d8f80a73e6e3))
* **engine:** add model-loader crate, layman ui, remove outlines-core ([bee6f11](https://github.com/EonsofStupid/platform_devpulse/commit/bee6f11182689ae38ae0fed7b7db040300f44fd3))
* **engine:** rename maestro to clyffy, add visual system, align components ([9243ab9](https://github.com/EonsofStupid/platform_devpulse/commit/9243ab9a5daf072f708f854a3aab220e0a6391bf))
* **engine:** restructure voice slots — kokoro primary, orpheus secondary ([0bf578f](https://github.com/EonsofStupid/platform_devpulse/commit/0bf578fae3c0f813f56818b2e4b3aba71bcb2d24))
* **engine:** sidecars, runtime configs, streaming ASR, fluid clamp ([ea96621](https://github.com/EonsofStupid/platform_devpulse/commit/ea9662170d8c4438c2b1ba9b672230489fa01b6c))
* enrich surface tokens and CSS variables; add primary surface token ([084f44a](https://github.com/EonsofStupid/platform_devpulse/commit/084f44abe5907cb343c4f0ba9dca554f10073eca))
* **model-loader:** add compatibility registry and devtools ([2dc22c6](https://github.com/EonsofStupid/platform_devpulse/commit/2dc22c6efdc2c2c96074461c358d3cbc6d1f96d1))
* **model-loader:** HF token secrets + bundle download + wizard token modal ([d421d7f](https://github.com/EonsofStupid/platform_devpulse/commit/d421d7f68099296abaf65f846ff5439824e510a2))
* **model-loader:** implement swap overlay for model load/unload operations ([312e595](https://github.com/EonsofStupid/platform_devpulse/commit/312e595e178912c667abeb7b1936a99a84a465c3))
* Refactor design primitives for improved structure and semantics ([7869bf7](https://github.com/EonsofStupid/platform_devpulse/commit/7869bf791042dfef72795fa711f36740a1c3775e))
* **signals:** seed narration and registry for signals ([b2779f9](https://github.com/EonsofStupid/platform_devpulse/commit/b2779f9ecba99f1a3863689359ded00c3d3d987c))
* **style:** refactor style imports and add StyleMacro component with mappings ([f6cf7cb](https://github.com/EonsofStupid/platform_devpulse/commit/f6cf7cb65274cdcf9540b23ff0edf28093671fb0))
* **tauri-event:** reusable event stream wrapper for Tauri events ([b2779f9](https://github.com/EonsofStupid/platform_devpulse/commit/b2779f9ecba99f1a3863689359ded00c3d3d987c))
* **tokens:** add electric + azure to semantic accent palette ([e89c6af](https://github.com/EonsofStupid/platform_devpulse/commit/e89c6afec51966908b6e9a6e34b1dbffa7b8af27))
* **tokens:** rebind primary CTA role to brand-blue ([0c95256](https://github.com/EonsofStupid/platform_devpulse/commit/0c95256a642ac3387e5b443b3e8b495310905696))
* update default styles for various components and layouts ([c2ca448](https://github.com/EonsofStupid/platform_devpulse/commit/c2ca44832aa4213b0d88afbb260849823e451021))
* update typography and text styles with fluid scaling and Tailwind integration ([8d0f6bc](https://github.com/EonsofStupid/platform_devpulse/commit/8d0f6bcce104f21a997e86f5ec707a859cd2759c))


### Bug Fixes

* Calendar getter syntax, zero warnings across 5580 files. ([90560b3](https://github.com/EonsofStupid/platform_devpulse/commit/90560b3b80eba952896f53e0fc462dd42622e242))
* **coldlight:** dtcg token alignment, fix sd5 build pipeline ([69da300](https://github.com/EonsofStupid/platform_devpulse/commit/69da300e2786c8db7fbd1d4e6592b6296b3ea33c))
* **coldlight:** fix style resolution, chat domain, dashboard rendering ([d85b949](https://github.com/EonsofStupid/platform_devpulse/commit/d85b949fc500c172058cb8d58045d960cb5c4dae))
* **coldlight:** update index.css import for render-base.css rename ([840309e](https://github.com/EonsofStupid/platform_devpulse/commit/840309e923735c6718a9ef127e12065c8d521acb))
* **deps:** ignore transitive advisory warnings, fix chat input type error ([9a1283f](https://github.com/EonsofStupid/platform_devpulse/commit/9a1283ff762970a86f5644928166072a3c583014))
* **desktop:** align Button/Text/StatusDot/InlineMessage usage with new prop APIs ([f90beb2](https://github.com/EonsofStupid/platform_devpulse/commit/f90beb27ba2dca2c583f191640dbf5d8184ca868))
* **model-loader:** sd5 wizard tokens, a11y compliance, domain boundaries, 4b brain min ([6e54723](https://github.com/EonsofStupid/platform_devpulse/commit/6e54723433b8877bbd2b231c10102316b4346cb8))
* resolve CSS variable references against the element's computed styles instead of :root ([e72c8e6](https://github.com/EonsofStupid/platform_devpulse/commit/e72c8e6cb438d79d6d60315346a3fd1d5e1f64a9))


### Documentation

* add SPRINT-VISUAL-PIPELINE-FIX plan and research ([084f44a](https://github.com/EonsofStupid/platform_devpulse/commit/084f44abe5907cb343c4f0ba9dca554f10073eca))
* **coldlight:** add dtcg type column and composite expansion table to macro-law ([85d0787](https://github.com/EonsofStupid/platform_devpulse/commit/85d0787ef88d8a5e2098dc638497a43acb51a8d0))
* **coldlight:** Lovable prompt references — Phase 1 audit prompt ([9cc0a53](https://github.com/EonsofStupid/platform_devpulse/commit/9cc0a53d2f86a4296a5070f913e3a8e9fd15e7b7))
* **coldlight:** PARKING-LOT.md — 8 deliberately-deferred design-system decisions ([3a85117](https://github.com/EonsofStupid/platform_devpulse/commit/3a8511796c2fc38fc41d878648a86e2a7bfc405e))
* **coldlight:** PROGRAM-COLDLIGHT plan + Sprint 00 foundation specs ([df6d3d3](https://github.com/EonsofStupid/platform_devpulse/commit/df6d3d3e4a7a8524f6b9b7bdbcc55ac3048a0516))
* **coldlight:** update macro-law to canonical axis names, add tailwind ownership table ([6dc2e83](https://github.com/EonsofStupid/platform_devpulse/commit/6dc2e83953d63ed15909f6a469a08b1b67546f0c))
* **docs:** add pending design system + chat-modes drafts + moshi candle patch ([34163bd](https://github.com/EonsofStupid/platform_devpulse/commit/34163bd6cb3071f9a2b818dabcfc3392f4fae7f3))
* **sprint-signals:** draft golden pattern for signals capability ([b2779f9](https://github.com/EonsofStupid/platform_devpulse/commit/b2779f9ecba99f1a3863689359ded00c3d3d987c))
