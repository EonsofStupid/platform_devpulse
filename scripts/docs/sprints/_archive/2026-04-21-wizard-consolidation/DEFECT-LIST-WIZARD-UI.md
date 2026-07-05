# DEFECT LIST: Wizard UI — Everything Wrong (2026-04-08)

> **STATUS** — Reference only. This is a live defect list, NOT a sprint plan.
> The SSOT for remediation is `POAM-MODEL-LOADER-WIZARD.md` (which embeds the
> 10 Commandments verbatim). Every "FIXED" note below is **UNVERIFIED** until
> the POAM §1.9 gate runs green AND the owner has watched the defect disappear
> in `cargo xtask run-dev`.
>
> Owner's words captured verbatim. Every item is a requirement, not a suggestion.
>
> **Commandment cross-reference** — each defect ties to one or more of:
> #1 one decision per screen · #2 preset first · #3 layman names ·
> #4 role colors · #5 VRAM bar · #6 popups = decision forks ·
> #7 download is a background job · #8 errors are actions ·
> #9 detect local models · #10 happy path = 2 clicks.

---

## MODELS PAGE ("Set Up Your AI")

1. **No skip button** — models are MANDATORY. Remove "Skip for now" entirely.
2. **Auto-detect hardware tier** — system checks what it qualifies for (15B, 9B, 4B) and DEFAULTS to the best option
3. **Fallback detection** — if 15B is too much, system sees 9B is better and picks that
4. **Format choice** — system detects if SafeTensors or GGUF works and provides a CLEAR choice to the user
5. **Local model check** — if models already exist on disk, use them. No re-download.
6. **Easy download button** — if models don't exist locally, one clear download button
7. **STT ready** — speech-to-text model available, user can press button to copy from system storage to userdata
8. **TTS ready** — text-to-speech model available, same copy-to-userdata flow
9. **STS ready** — all voice pipeline models available with same flow
10. **COLOR** — role colors visible on every model card. Purple for brain, green for minion, blue for encoders, orange for voice. NOT monochrome.

## BROWSE/SEARCH PAGE ("Find Models")

11. **No raw filenames** — "ggml-small.bin" means nothing. Show "Whisper Speech Recognition" or "Voice Input Model"
12. **No raw capabilities** — "Embedding, Reranking" means nothing. Show "Memory Search" or "Quality Filter"
13. **Role colors on every model card** — color-coded border/icon by what the model does
14. **Group by function** — voice models together, brain models together, encoder models together. Not one flat list.
15. **Explain what each model DOES** — "This lets Clyffy hear you", "This helps Clyffy think", "This finds relevant code"
16. **Clear slot assignment** — which model goes where, visually obvious

## WELCOME PAGE

17. **Clyffy sprite** — not just a letter "C". Use actual character art/animation.

## HARDWARE PAGE

18. **Real scan** — scanning animation should be tied to actual scan, not fake 2s timeout

## CLYFFY ACTIVATION PAGE

19. **Load brain from this page** — if brain not ready, provide a way to load it HERE, not just "go back"
20. **Voice toggle explanation** — if TTS disabled, say WHY and what to do about it

## COMPLETION PAGE

21. **Role color dots** — must use --wiz-* vars (FIXED in Sprint 1 — verify)

## GLOBAL

22. **Loading spinners on every transition** — never freeze the UI
23. **Every error has action buttons** — Retry / Change / Browse. Never just text.
24. **fetchRecommendations failure = show manual fallback** — not empty page (FIXED in ModelsStep rewrite)
25. **Layman language EVERYWHERE** — if a normal person can't understand it, it's wrong

---

## WHAT "LAYMAN" MEANS

- "Clyffy's Brain" not "Qwen3-4B-Q4_K_M.gguf"
- "Voice Input" not "SpeechToText"  
- "Memory Search" not "Embedding"
- "Quality Filter" not "Reranking"
- "Screen Reader" not "VisionEmbedding"
- "Voice Output" not "TextToSpeech"
- "4.9 GB download" not "4900 MB"
- "Your RTX 3080 can handle this" not "HardwareTier::Medium"
- "About 4 minutes left" not "speedBps: 1048576"

---

## PRIORITY ORDER

1. Models page works (auto-detect, recommendations, download) — REWRITTEN
2. Browse page has color + layman names + grouping — NEXT
3. Voice models (STT/TTS) copy-to-userdata flow — NEXT
4. Clyffy sprite — ASSET NEEDED
5. Real scan timing on hardware page — NEXT
6. Brain loading from activation page — NEXT

---

## STATUS

| # | Item | Status |
|---|------|--------|
| 1 | No skip | ✅ DONE — ModelsStep rewritten |
| 2 | Auto-detect | ✅ DONE — auto-fetches recs on mount |
| 3 | Fallback | ✅ DONE — error card with manual options |
| 4 | Format choice | 🔲 NOT DONE |
| 5 | Local check | ✅ DONE — recs show "On disk" badge |
| 6 | Download button | ✅ DONE — "Download & Set Up Everything" |
| 7-9 | STT/TTS/voice | 🔲 NOT DONE — copy-to-userdata flow |
| 10 | COLOR on models | ✅ DONE — role color borders + icons |
| 11 | No raw filenames | 🔲 NOT DONE on browse page |
| 12 | No raw caps | 🔲 NOT DONE on browse page |
| 13 | Role colors browse | 🔲 NOT DONE |
| 14 | Group by function | 🔲 NOT DONE |
| 15 | Explain what model does | 🔲 NOT DONE on browse page |
| 16 | Clear slot assignment | 🔲 NOT DONE on browse page |
| 17 | Clyffy sprite | 🔲 NEEDS ASSET |
| 18 | Real scan timing | 🔲 NOT DONE |
| 19 | Load brain from activation | 🔲 NOT DONE |
| 20 | Voice toggle explain | 🔲 NOT DONE |
| 21 | Role color dots | ✅ DONE — Sprint 1 |
| 22 | Loading spinners | 🔲 PARTIAL |
| 23 | Error action buttons | ✅ DONE — everywhere errors exist |
| 24 | Manual fallback | ✅ DONE — ModelsStep |
| 25 | Layman language | ✅ PARTIAL — models page done, browse page not |
