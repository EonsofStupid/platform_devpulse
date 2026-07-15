# 00 — ColdLight census REFRESH (Pass 1, read-only) — 2026-07-14

> Second full census, run on the 2026-07-14 tree (branch `refactor/coldlight-recovery`,
> HEAD `ad26270e`). Supersedes the facts in `00-census.md` wherever the tree has moved;
> the original stays on disk as the citation target of `01-rulings.md`. FACTS ONLY —
> zero proposals, zero destinations. Every claim carries file:line or command output.
> Chain: [census] → /coldlight-rulings → /coldlight-slices → /coldlight-execute → /coldlight-verify.

## Step 0 — Tree state gate

`git status --porcelain` output: **(empty — exit 0, tree clean)**
HEAD: `ad26270e Merge branch 'revert-27-refactor/coldlight-recovery' …` (all wizard R-slice
work committed as `a268c09d`, pushed; upstream = `origin/revert-27-refactor/coldlight-recovery`).
GATE PASSES — census proceeds on a clean tree.

## Locked design boundary (operator ruling 2026-07-12, restated verbatim from the skill)

1. ALL runtime CSS lives under `styles/` (SD5-emitted layers).
2. Each base component lives in its own NAMED folder, typed.
3. Variants are COLOCATED in that component's folder, typed.
4. NO middle layers. NO bucket directories (`_shared`, `common`, `shared`, `utils`-as-dump, `helpers`, `misc`).
5. `domains/common` banned (VERIFIED ABSENT this pass — no such directory exists).
6. Tokens bind through the role vocabulary (`--accent-{role}-{main,glow,fill}`), never raw literals/keyword fallbacks.

## Headline counts (this pass)

- Bucket directories found: **7 real** (+ `.cowlevel/typedoc/utils` = vendored docs artifact, excluded)
- Bucket modules read IN FULL: **~100 files** (~5.6k LOC); only ServiceDevtoolShell.svelte (507) needed CC-004 chunking
- Duplicate/overlap pairs recorded: **16** (F1-F8 design-tier + D1-D9 devtools-tier − overlaps)
- Dead exports (zero consumers): **8** (ariaAnnounce, idGen†, clampFluid, FLUID_SPACE/SIZE/PADDING, tokenResolve, slotMerge, useRovingFocus, useActiveDescendant, useLiveRegion) † idGen has exactly 1 consumer (blocks/factory.ts)
- Token audit: 3363 defined / 461 consumed / **2941 DEAD / 768 CONTESTED / 39 UNDEFINED** custom properties; **382 out-of-gamut** emitted oklch
- CLAUDE.md-vs-CLAUDE.md vocabulary conflict recorded (primitives/ vs behaviors/)

# Census Step 1 — Filetrees, verbatim (git ls-files, tree clean so tracked = complete)

## interfaces/desktop/src/lib/design/ (1285 files)
```
interfaces/desktop/src/lib/design/.agent/INSTRUCTIONS.md
interfaces/desktop/src/lib/design/.claude/ARCHITECTURE.md
interfaces/desktop/src/lib/design/.claude/CLAUDE.md
interfaces/desktop/src/lib/design/.claude/COLDLIGHT_CATALOG.md
interfaces/desktop/src/lib/design/.claude/MASTER_SPRINT_PLAN.md
interfaces/desktop/src/lib/design/.claude/RECOVERY_LOG.md
interfaces/desktop/src/lib/design/.claude/RESUME-COMPONENT-LAYER.md
interfaces/desktop/src/lib/design/.claude/settings.json
interfaces/desktop/src/lib/design/.generated/.gitkeep
interfaces/desktop/src/lib/design/.generated/coldlight.manifest.json
interfaces/desktop/src/lib/design/.generated/imports.gen.ts
interfaces/desktop/src/lib/design/ADR-001-RENDER-FORGE.md
interfaces/desktop/src/lib/design/AUTHORING.md
interfaces/desktop/src/lib/design/CHANGELOG.md
interfaces/desktop/src/lib/design/CLASS_COMPOSITION.md
interfaces/desktop/src/lib/design/CLAUDE.md
interfaces/desktop/src/lib/design/COMPOSITION-CONTRACT.md
interfaces/desktop/src/lib/design/DesignArchitecture.md
interfaces/desktop/src/lib/design/MACRO-LAW.md
interfaces/desktop/src/lib/design/MASTER-PLAN.md
interfaces/desktop/src/lib/design/ONBOARDING-CASCADE.md
interfaces/desktop/src/lib/design/PARKING-LOT.md
interfaces/desktop/src/lib/design/PROP_TAXONOMY_CAPTURE.md
interfaces/desktop/src/lib/design/README.md
interfaces/desktop/src/lib/design/REFERENCE-AUDIT.md
interfaces/desktop/src/lib/design/REFERENCES/CHAT-REFERENCE-01.png
interfaces/desktop/src/lib/design/REFERENCES/CHAT-REFERENCE-02.png
interfaces/desktop/src/lib/design/REFERENCES/DASHBOARD-REFERENCE-01.png
interfaces/desktop/src/lib/design/REFERENCES/Gemini_Generated_Image_ (10).png
interfaces/desktop/src/lib/design/REFERENCES/Gemini_Generated_Image_ (11).png
interfaces/desktop/src/lib/design/REFERENCES/Gemini_Generated_Image_ (12).png
interfaces/desktop/src/lib/design/REFERENCES/Gemini_Generated_Image_ (13).png
interfaces/desktop/src/lib/design/REFERENCES/Gemini_Generated_Image_ (14).png
interfaces/desktop/src/lib/design/REFERENCES/Gemini_Generated_Image_ (8).png
interfaces/desktop/src/lib/design/REFERENCES/Gemini_Generated_Image_ (9).png
interfaces/desktop/src/lib/design/REFERENCES/lovable-prompts/01-AUDIT.md
interfaces/desktop/src/lib/design/REFERENCES/reference-cag.png
interfaces/desktop/src/lib/design/REFERENCES/reference-dashboard.png
interfaces/desktop/src/lib/design/REFERENCES/reference-liquid-metal.png
interfaces/desktop/src/lib/design/REFERENCES/refernece-dashboard2.png
interfaces/desktop/src/lib/design/REFERENCES/refernece-dashboard3.png
interfaces/desktop/src/lib/design/REFERENCES/refernece-dashboard4.png
interfaces/desktop/src/lib/design/REFERENCES/refernece-dashboard5.png
interfaces/desktop/src/lib/design/REFERENCES/refrence-liquid.png
interfaces/desktop/src/lib/design/RENDERFORGE.md
interfaces/desktop/src/lib/design/SEED-PRESETS.md
interfaces/desktop/src/lib/design/SPRINT-PRIMITIVES.md
interfaces/desktop/src/lib/design/STYLE_GUIDE.md
interfaces/desktop/src/lib/design/TOKEN_PIPELINE.md
interfaces/desktop/src/lib/design/TRUTH.md
interfaces/desktop/src/lib/design/VISUAL-LANGUAGE.md
interfaces/desktop/src/lib/design/VITE_PLUGIN_SPEC.md
interfaces/desktop/src/lib/design/behaviors/_internal/utils/data-attr.ts
interfaces/desktop/src/lib/design/behaviors/_internal/utils/index.ts
interfaces/desktop/src/lib/design/behaviors/_internal/utils/kbd.ts
interfaces/desktop/src/lib/design/behaviors/_internal/utils/uid.ts
interfaces/desktop/src/lib/design/behaviors/_shared/active-descendant/active-descendant.svelte.ts
interfaces/desktop/src/lib/design/behaviors/_shared/active-descendant/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/active-descendant/types.ts
interfaces/desktop/src/lib/design/behaviors/_shared/dismiss-layer/dismiss-layer.svelte.ts
interfaces/desktop/src/lib/design/behaviors/_shared/dismiss-layer/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/dismiss-layer/types.ts
interfaces/desktop/src/lib/design/behaviors/_shared/escape-layer/escape-layer.svelte.ts
interfaces/desktop/src/lib/design/behaviors/_shared/escape-layer/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/escape-layer/types.ts
interfaces/desktop/src/lib/design/behaviors/_shared/focus-trap/focus-trap.svelte.ts
interfaces/desktop/src/lib/design/behaviors/_shared/focus-trap/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/focus-trap/types.ts
interfaces/desktop/src/lib/design/behaviors/_shared/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/live-region/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/live-region/live-region.ts
interfaces/desktop/src/lib/design/behaviors/_shared/live-region/types.ts
interfaces/desktop/src/lib/design/behaviors/_shared/presence/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/presence/presence.svelte.ts
interfaces/desktop/src/lib/design/behaviors/_shared/presence/types.ts
interfaces/desktop/src/lib/design/behaviors/_shared/roving-focus/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/roving-focus/roving-focus.svelte.ts
interfaces/desktop/src/lib/design/behaviors/_shared/roving-focus/types.ts
interfaces/desktop/src/lib/design/behaviors/_shared/scroll-lock/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/scroll-lock/scroll-lock.svelte.ts
interfaces/desktop/src/lib/design/behaviors/_shared/scroll-lock/types.ts
interfaces/desktop/src/lib/design/behaviors/_shared/typeahead/index.ts
interfaces/desktop/src/lib/design/behaviors/_shared/typeahead/typeahead.ts
interfaces/desktop/src/lib/design/behaviors/_shared/typeahead/types.ts
interfaces/desktop/src/lib/design/behaviors/display/alert/index.ts
interfaces/desktop/src/lib/design/behaviors/display/alert/use-alert.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/avatar/avatar.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/avatar/avatar.types.ts
interfaces/desktop/src/lib/design/behaviors/display/avatar/index.ts
interfaces/desktop/src/lib/design/behaviors/display/avatar/use-avatar.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/badge/badge.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/badge/badge.types.ts
interfaces/desktop/src/lib/design/behaviors/display/badge/index.ts
interfaces/desktop/src/lib/design/behaviors/display/badge/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/badge/use-badge.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/banner/index.ts
interfaces/desktop/src/lib/design/behaviors/display/banner/use-banner.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/card/card.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/card/card.types.ts
interfaces/desktop/src/lib/design/behaviors/display/card/index.ts
interfaces/desktop/src/lib/design/behaviors/display/card/use-card.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/content/content.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/content/content.types.ts
interfaces/desktop/src/lib/design/behaviors/display/content/index.ts
interfaces/desktop/src/lib/design/behaviors/display/content/use-content.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/description-list/description-list.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/description-list/index.ts
interfaces/desktop/src/lib/design/behaviors/display/description-list/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/description-list/use-description-list.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/empty-state/empty-state.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/empty-state/index.ts
interfaces/desktop/src/lib/design/behaviors/display/empty-state/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/heading/heading.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/heading/heading.types.ts
interfaces/desktop/src/lib/design/behaviors/display/heading/index.ts
interfaces/desktop/src/lib/design/behaviors/display/heading/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/heading/use-heading.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/index.ts
interfaces/desktop/src/lib/design/behaviors/display/inline-message/index.ts
interfaces/desktop/src/lib/design/behaviors/display/inline-message/use-inline-message.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/kbd/index.ts
interfaces/desktop/src/lib/design/behaviors/display/kbd/kbd.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/kbd/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/label/index.ts
interfaces/desktop/src/lib/design/behaviors/display/label/label.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/label/label.types.ts
interfaces/desktop/src/lib/design/behaviors/display/label/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/label/use-label.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/list/index.ts
interfaces/desktop/src/lib/design/behaviors/display/list/list.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/list/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/list/use-list.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/loading-overlay/index.ts
interfaces/desktop/src/lib/design/behaviors/display/loading-overlay/loading-overlay.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/loading-overlay/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/loading-overlay/use-loading-overlay.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/meter/index.ts
interfaces/desktop/src/lib/design/behaviors/display/meter/meter.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/meter/meter.types.ts
interfaces/desktop/src/lib/design/behaviors/display/meter/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/meter/use-meter.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/progress-circle/index.ts
interfaces/desktop/src/lib/design/behaviors/display/progress-circle/progress-circle.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/progress-circle/progress-circle.types.ts
interfaces/desktop/src/lib/design/behaviors/display/progress-circle/use-progress-circle.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/progress/index.ts
interfaces/desktop/src/lib/design/behaviors/display/progress/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/progress/progress.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/progress/progress.types.ts
interfaces/desktop/src/lib/design/behaviors/display/progress/use-progress.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/prose/index.ts
interfaces/desktop/src/lib/design/behaviors/display/prose/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/prose/prose.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/separator/index.ts
interfaces/desktop/src/lib/design/behaviors/display/separator/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/separator/separator.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/separator/separator.types.ts
interfaces/desktop/src/lib/design/behaviors/display/separator/use-separator.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/skeleton/index.ts
interfaces/desktop/src/lib/design/behaviors/display/skeleton/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/skeleton/skeleton.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/skeleton/use-skeleton.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/spinner/index.ts
interfaces/desktop/src/lib/design/behaviors/display/spinner/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/spinner/spinner.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/spinner/use-spinner.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/steps/index.ts
interfaces/desktop/src/lib/design/behaviors/display/steps/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/steps/steps.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/steps/use-steps.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/tag-group/index.ts
interfaces/desktop/src/lib/design/behaviors/display/tag-group/tag-group.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/tag-group/tag-group.types.ts
interfaces/desktop/src/lib/design/behaviors/display/tag-group/use-tag-group.svelte.ts
interfaces/desktop/src/lib/design/behaviors/display/text/index.ts
interfaces/desktop/src/lib/design/behaviors/display/text/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/display/text/text.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/display/text/text.types.ts
interfaces/desktop/src/lib/design/behaviors/display/text/use-text.svelte.ts
interfaces/desktop/src/lib/design/behaviors/filter/filter.types.ts
interfaces/desktop/src/lib/design/behaviors/filter/index.ts
interfaces/desktop/src/lib/design/behaviors/filter/use-filter.ts
interfaces/desktop/src/lib/design/behaviors/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/button/button.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/button/button.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/button/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/button/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/button/use-button.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/calendar/calendar.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/calendar/calendar.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/calendar/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/calendar/use-calendar.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/checkbox/checkbox.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/checkbox/checkbox.spec.ts
interfaces/desktop/src/lib/design/behaviors/inputs/checkbox/checkbox.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/checkbox/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/checkbox/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/checkbox/use-checkbox.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-area/color-area.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-area/color-area.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-area/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-area/use-color-area.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-field/color-field.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-field/color-field.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-field/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-field/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-field/use-color-field.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-slider/color-slider.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-slider/color-slider.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-slider/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-slider/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-slider/use-color-slider.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-wheel/color-wheel.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-wheel/color-wheel.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-wheel/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/color-wheel/use-color-wheel.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/combobox/combobox.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/combobox/combobox.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/combobox/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/combobox/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/combobox/use-combobox.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/field/field.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/field/field.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/field/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/field/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/field/use-field.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/file-trigger/file-trigger.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/file-trigger/file-trigger.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/file-trigger/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/file-trigger/use-file-trigger.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/form-field/form-field.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/form-field/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/form-field/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/form-field/use-form-field.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/form/form.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/form/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/form/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/form/use-form.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/input-group/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/input-group/input-group.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/input-group/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/input-group/use-input-group.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/listbox/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/listbox/listbox.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/listbox/listbox.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/listbox/use-listbox.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/number-field/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/number-field/number-field.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/number-field/number-field.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/number-field/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/number-field/use-number-field.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/pin-input/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/pin-input/pin-input.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/pin-input/pin-input.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/pin-input/use-pin-input.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/radio-group/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/radio-group/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/radio-group/radio-group.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/radio-group/radio-group.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/radio-group/use-radio-group.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/search-field/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/search-field/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/search-field/search-field.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/search-field/search-field.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/search-field/use-search-field.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/select/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/select/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/select/select.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/select/select.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/select/use-select.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/slider/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/slider/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/slider/slider.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/slider/slider.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/slider/use-slider.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/switch/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/switch/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/switch/switch.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/switch/switch.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/switch/use-switch.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/text-field/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/text-field/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/text-field/text-field.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/text-field/text-field.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/text-field/use-text-field.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/textarea/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/textarea/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/textarea/textarea.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/textarea/use-textarea.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle-group/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle-group/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle-group/toggle-group.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle-group/use-toggle-group.svelte.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle/index.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle/toggle.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle/toggle.types.ts
interfaces/desktop/src/lib/design/behaviors/inputs/toggle/use-toggle.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/drag-and-drop/drag-and-drop.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/interaction/drag-and-drop/drag-and-drop.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/drag-and-drop/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/drag-and-drop/use-drag-and-drop.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/drop-zone/drop-zone.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/interaction/drop-zone/drop-zone.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/drop-zone/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/drop-zone/use-drop-zone.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus-ring/focus-ring.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus-ring/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus-ring/use-focus-ring.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus-within/focus-within.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus-within/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus-within/use-focus-within.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus/focus.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/focus/use-focus.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/hover/hover.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/hover/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/hover/use-hover.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/keyboard-handler/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/keyboard-handler/keyboard-handler.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/keyboard-handler/use-keyboard.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/long-press/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/long-press/long-press.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/long-press/use-long-press.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/move/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/move/move.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/move/use-move.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/press/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/press/press.types.ts
interfaces/desktop/src/lib/design/behaviors/interaction/press/use-press.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/scroll-area/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/scroll-area/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/interaction/scroll-area/scroll-area.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/interaction/scroll-area/use-scroll-area.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/virtualizer/index.ts
interfaces/desktop/src/lib/design/behaviors/interaction/virtualizer/use-virtualizer.svelte.ts
interfaces/desktop/src/lib/design/behaviors/interaction/virtualizer/virtualizer.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/interaction/virtualizer/virtualizer.types.ts
interfaces/desktop/src/lib/design/behaviors/locale/index.ts
interfaces/desktop/src/lib/design/behaviors/locale/locale.types.ts
interfaces/desktop/src/lib/design/behaviors/locale/use-locale.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/accordion/accordion.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/accordion/accordion.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/accordion/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/accordion/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/accordion/use-accordion.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/breadcrumbs/breadcrumbs.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/breadcrumbs/breadcrumbs.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/breadcrumbs/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/breadcrumbs/use-breadcrumbs.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/data-table/data-table.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/data-table/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/data-table/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/data-table/use-data-table.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/grid-list/grid-list.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/grid-list/grid-list.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/grid-list/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/grid-list/use-grid-list.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/link-preview/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/link-preview/use-link-preview.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/link/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/link/link.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/link/link.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/link/use-link.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/menu/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/menu/menu.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/menu/menu.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/menu/use-menu.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/pagination/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/pagination/pagination.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/pagination/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/pagination/use-pagination.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/sidebar/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/sidebar/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/sidebar/sidebar.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/sidebar/use-sidebar.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/skip-link/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/skip-link/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/skip-link/skip-link.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table-of-contents/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table-of-contents/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table-of-contents/table-of-contents.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table-of-contents/use-table-of-contents.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table/table.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table/table.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/table/use-table.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tabs/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tabs/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tabs/tabs.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tabs/tabs.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tabs/use-tabs.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/toolbar/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/toolbar/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/toolbar/toolbar.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/toolbar/toolbar.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/toolbar/use-toolbar.svelte.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tree/index.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tree/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tree/tree.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tree/tree.types.ts
interfaces/desktop/src/lib/design/behaviors/navigation/tree/use-tree.svelte.ts
interfaces/desktop/src/lib/design/behaviors/overlays/alert-dialog/alert-dialog.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/overlays/alert-dialog/alert-dialog.types.ts
interfaces/desktop/src/lib/design/behaviors/overlays/alert-dialog/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/alert-dialog/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/overlays/alert-dialog/use-alert-dialog.svelte.ts
interfaces/desktop/src/lib/design/behaviors/overlays/dialog/dialog.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/overlays/dialog/dialog.types.ts
interfaces/desktop/src/lib/design/behaviors/overlays/dialog/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/dialog/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/overlays/dialog/use-dialog.svelte.ts
interfaces/desktop/src/lib/design/behaviors/overlays/disclosure/disclosure.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/overlays/disclosure/disclosure.types.ts
interfaces/desktop/src/lib/design/behaviors/overlays/disclosure/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/disclosure/use-disclosure.svelte.ts
interfaces/desktop/src/lib/design/behaviors/overlays/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/notification-center/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/notification-center/notification-center.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/overlays/notification-center/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/overlays/notification-center/use-notification-center.svelte.ts
interfaces/desktop/src/lib/design/behaviors/overlays/popover/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/popover/popover.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/overlays/popover/popover.types.ts
interfaces/desktop/src/lib/design/behaviors/overlays/popover/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/overlays/popover/use-popover.svelte.ts
interfaces/desktop/src/lib/design/behaviors/overlays/sheet/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/sheet/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/overlays/sheet/sheet.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/overlays/sheet/sheet.types.ts
interfaces/desktop/src/lib/design/behaviors/overlays/sheet/use-sheet.svelte.ts
interfaces/desktop/src/lib/design/behaviors/overlays/toaster/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/toaster/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/overlays/toaster/toaster.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/overlays/toaster/use-toaster.svelte.ts
interfaces/desktop/src/lib/design/behaviors/overlays/tooltip/index.ts
interfaces/desktop/src/lib/design/behaviors/overlays/tooltip/primitive-props.ts
interfaces/desktop/src/lib/design/behaviors/overlays/tooltip/tooltip.anatomy.ts
interfaces/desktop/src/lib/design/behaviors/overlays/tooltip/tooltip.types.ts
interfaces/desktop/src/lib/design/behaviors/overlays/tooltip/use-tooltip.svelte.ts
interfaces/desktop/src/lib/design/blocks/README.md
interfaces/desktop/src/lib/design/blocks/carousels/README.md
interfaces/desktop/src/lib/design/blocks/chat/ChatInput.svelte
interfaces/desktop/src/lib/design/blocks/chat/ChatPanel.svelte
interfaces/desktop/src/lib/design/blocks/chat/ChatThread.svelte
interfaces/desktop/src/lib/design/blocks/chat/README.md
interfaces/desktop/src/lib/design/blocks/chat/ThreadList.svelte
interfaces/desktop/src/lib/design/blocks/chat/index.ts
interfaces/desktop/src/lib/design/blocks/chat/types.ts
interfaces/desktop/src/lib/design/blocks/clyffy/ClyffyHeadshot.svelte
interfaces/desktop/src/lib/design/blocks/clyffy/ClyffyKnowledgeNudge.svelte
interfaces/desktop/src/lib/design/blocks/clyffy/ClyffyMascot.svelte
interfaces/desktop/src/lib/design/blocks/clyffy/index.ts
interfaces/desktop/src/lib/design/blocks/community/CommunityFeedList.svelte
interfaces/desktop/src/lib/design/blocks/community/index.ts
interfaces/desktop/src/lib/design/blocks/cta/README.md
interfaces/desktop/src/lib/design/blocks/dashboards/README.md
interfaces/desktop/src/lib/design/blocks/devtools/SubsystemTile.svelte
interfaces/desktop/src/lib/design/blocks/devtools/index.ts
interfaces/desktop/src/lib/design/blocks/dialogs/ConfirmDialog.svelte
interfaces/desktop/src/lib/design/blocks/dialogs/FormDialog.svelte
interfaces/desktop/src/lib/design/blocks/dialogs/PickerDialog.svelte
interfaces/desktop/src/lib/design/blocks/dialogs/index.ts
interfaces/desktop/src/lib/design/blocks/factory.ts
interfaces/desktop/src/lib/design/blocks/features/README.md
interfaces/desktop/src/lib/design/blocks/governance/GovernanceControls.svelte
interfaces/desktop/src/lib/design/blocks/governance/index.ts
interfaces/desktop/src/lib/design/blocks/governance/types.ts
interfaces/desktop/src/lib/design/blocks/heroes/README.md
interfaces/desktop/src/lib/design/blocks/index.ts
interfaces/desktop/src/lib/design/blocks/kinds.ts
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeDeck.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeDykCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeFrustCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeGlossCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeInsightCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeKdropCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeMultipleChoiceCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeOrderCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeOrderingCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeQuizCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeRankCard.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeTerm.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/KnowledgeTermStrip.svelte
interfaces/desktop/src/lib/design/blocks/knowledge/index.ts
interfaces/desktop/src/lib/design/blocks/latest/LatestUpdateCard.svelte
interfaces/desktop/src/lib/design/blocks/latest/index.ts
interfaces/desktop/src/lib/design/blocks/navigation/README.md
interfaces/desktop/src/lib/design/blocks/schema.ts
interfaces/desktop/src/lib/design/blocks/widgets/Widget.svelte
interfaces/desktop/src/lib/design/blocks/widgets/WidgetContent.svelte
interfaces/desktop/src/lib/design/blocks/widgets/WidgetFooter.svelte
interfaces/desktop/src/lib/design/blocks/widgets/WidgetHeader.svelte
interfaces/desktop/src/lib/design/blocks/widgets/WidgetTabs.svelte
interfaces/desktop/src/lib/design/blocks/widgets/index.ts
interfaces/desktop/src/lib/design/blocks/widgets/types.ts
interfaces/desktop/src/lib/design/coldlight.config.ts
interfaces/desktop/src/lib/design/components/.claude/ADR.md
interfaces/desktop/src/lib/design/components/.claude/CHECKLIST.md
interfaces/desktop/src/lib/design/components/.claude/MASTER_SPRINT_PLAN.md
interfaces/desktop/src/lib/design/components/.claude/WORKFLOW.md
interfaces/desktop/src/lib/design/components/README.md
interfaces/desktop/src/lib/design/components/_base/index.ts
interfaces/desktop/src/lib/design/components/_base/schema.ts
interfaces/desktop/src/lib/design/components/_base/types.ts
interfaces/desktop/src/lib/design/components/accordion/Accordion.svelte
interfaces/desktop/src/lib/design/components/accordion/Accordion.test.ts
interfaces/desktop/src/lib/design/components/accordion/AccordionContent.svelte
interfaces/desktop/src/lib/design/components/accordion/AccordionIndicator.svelte
interfaces/desktop/src/lib/design/components/accordion/AccordionItem.svelte
interfaces/desktop/src/lib/design/components/accordion/AccordionTrigger.svelte
interfaces/desktop/src/lib/design/components/accordion/context.ts
interfaces/desktop/src/lib/design/components/accordion/index.ts
interfaces/desktop/src/lib/design/components/accordion/types.ts
interfaces/desktop/src/lib/design/components/alert-dialog/AlertDialog.svelte
interfaces/desktop/src/lib/design/components/alert-dialog/AlertDialogAction.svelte
interfaces/desktop/src/lib/design/components/alert-dialog/AlertDialogCancel.svelte
interfaces/desktop/src/lib/design/components/alert-dialog/AlertDialogContent.svelte
interfaces/desktop/src/lib/design/components/alert-dialog/AlertDialogDescription.svelte
interfaces/desktop/src/lib/design/components/alert-dialog/AlertDialogOverlay.svelte
interfaces/desktop/src/lib/design/components/alert-dialog/AlertDialogTitle.svelte
interfaces/desktop/src/lib/design/components/alert-dialog/AlertDialogTrigger.svelte
interfaces/desktop/src/lib/design/components/alert-dialog/context.ts
interfaces/desktop/src/lib/design/components/alert-dialog/index.ts
interfaces/desktop/src/lib/design/components/alert-dialog/types.ts
interfaces/desktop/src/lib/design/components/alert/Alert.svelte
interfaces/desktop/src/lib/design/components/alert/Alert.test.ts
interfaces/desktop/src/lib/design/components/alert/AlertAction.svelte
interfaces/desktop/src/lib/design/components/alert/AlertDescription.svelte
interfaces/desktop/src/lib/design/components/alert/AlertIcon.svelte
interfaces/desktop/src/lib/design/components/alert/AlertTitle.svelte
interfaces/desktop/src/lib/design/components/alert/context.ts
interfaces/desktop/src/lib/design/components/alert/index.ts
interfaces/desktop/src/lib/design/components/alert/types.ts
interfaces/desktop/src/lib/design/components/avatar-group/AvatarGroup.svelte
interfaces/desktop/src/lib/design/components/avatar-group/context.ts
interfaces/desktop/src/lib/design/components/avatar-group/index.ts
interfaces/desktop/src/lib/design/components/avatar-group/types.ts
interfaces/desktop/src/lib/design/components/avatar/Avatar.svelte
interfaces/desktop/src/lib/design/components/avatar/Avatar.test.ts
interfaces/desktop/src/lib/design/components/avatar/AvatarFallback.svelte
interfaces/desktop/src/lib/design/components/avatar/AvatarImage.svelte
interfaces/desktop/src/lib/design/components/avatar/avatar.types.ts
interfaces/desktop/src/lib/design/components/avatar/context.ts
interfaces/desktop/src/lib/design/components/avatar/index.ts
interfaces/desktop/src/lib/design/components/avatar/schema.ts
interfaces/desktop/src/lib/design/components/avatar/tokens.ts
interfaces/desktop/src/lib/design/components/background-scene/BackgroundScene.svelte
interfaces/desktop/src/lib/design/components/background-scene/index.ts
interfaces/desktop/src/lib/design/components/background-scene/types.ts
interfaces/desktop/src/lib/design/components/badge/Badge.svelte
interfaces/desktop/src/lib/design/components/badge/Badge.test.ts
interfaces/desktop/src/lib/design/components/badge/badge.types.ts
interfaces/desktop/src/lib/design/components/badge/index.ts
interfaces/desktop/src/lib/design/components/badge/schema.ts
interfaces/desktop/src/lib/design/components/badge/tokens.ts
interfaces/desktop/src/lib/design/components/banner/Banner.svelte
interfaces/desktop/src/lib/design/components/banner/Banner.test.ts
interfaces/desktop/src/lib/design/components/banner/index.ts
interfaces/desktop/src/lib/design/components/banner/types.ts
interfaces/desktop/src/lib/design/components/button/Button.svelte
interfaces/desktop/src/lib/design/components/button/button.types.ts
interfaces/desktop/src/lib/design/components/button/index.ts
interfaces/desktop/src/lib/design/components/button/schema.ts
interfaces/desktop/src/lib/design/components/button/tokens.ts
interfaces/desktop/src/lib/design/components/calendar/Calendar.svelte
interfaces/desktop/src/lib/design/components/calendar/CalendarCell.svelte
interfaces/desktop/src/lib/design/components/calendar/CalendarGrid.svelte
interfaces/desktop/src/lib/design/components/calendar/CalendarHeader.svelte
interfaces/desktop/src/lib/design/components/calendar/context.ts
interfaces/desktop/src/lib/design/components/calendar/index.ts
interfaces/desktop/src/lib/design/components/calendar/types.ts
interfaces/desktop/src/lib/design/components/callout/Callout.svelte
interfaces/desktop/src/lib/design/components/callout/Callout.test.ts
interfaces/desktop/src/lib/design/components/callout/index.ts
interfaces/desktop/src/lib/design/components/callout/types.ts
interfaces/desktop/src/lib/design/components/card/Card.svelte
interfaces/desktop/src/lib/design/components/card/Card.test.ts
interfaces/desktop/src/lib/design/components/card/card.types.ts
interfaces/desktop/src/lib/design/components/card/index.ts
interfaces/desktop/src/lib/design/components/card/schema.ts
interfaces/desktop/src/lib/design/components/card/tokens.ts
interfaces/desktop/src/lib/design/components/chat-bubble/ChatBubble.svelte
interfaces/desktop/src/lib/design/components/chat-bubble/index.ts
interfaces/desktop/src/lib/design/components/chat-bubble/types.ts
interfaces/desktop/src/lib/design/components/chat-context-panel/ChatContextPanel.svelte
interfaces/desktop/src/lib/design/components/chat-context-panel/index.ts
interfaces/desktop/src/lib/design/components/chat-context-panel/types.ts
interfaces/desktop/src/lib/design/components/chat-dashboard/ChatDashboard.svelte
interfaces/desktop/src/lib/design/components/chat-dashboard/index.ts
interfaces/desktop/src/lib/design/components/chat-dashboard/types.ts
interfaces/desktop/src/lib/design/components/chat-footer/ChatFooter.svelte
interfaces/desktop/src/lib/design/components/chat-footer/ChatFooter.test.ts
interfaces/desktop/src/lib/design/components/chat-footer/index.ts
interfaces/desktop/src/lib/design/components/chat-footer/types.ts
interfaces/desktop/src/lib/design/components/chat-frame/ChatFrame.svelte
interfaces/desktop/src/lib/design/components/chat-frame/ChatFrame.test.ts
interfaces/desktop/src/lib/design/components/chat-frame/index.ts
interfaces/desktop/src/lib/design/components/chat-frame/types.ts
interfaces/desktop/src/lib/design/components/chat-sidebar/ChatSidebar.svelte
interfaces/desktop/src/lib/design/components/chat-sidebar/ChatSidebar.test.ts
interfaces/desktop/src/lib/design/components/chat-sidebar/index.ts
interfaces/desktop/src/lib/design/components/chat-sidebar/types.ts
interfaces/desktop/src/lib/design/components/chat-topbar/ChatTopBar.svelte
interfaces/desktop/src/lib/design/components/chat-topbar/index.ts
interfaces/desktop/src/lib/design/components/chat-topbar/types.ts
interfaces/desktop/src/lib/design/components/checkbox/Checkbox.contract.test.ts
interfaces/desktop/src/lib/design/components/checkbox/Checkbox.svelte
interfaces/desktop/src/lib/design/components/checkbox/Checkbox.test.ts
interfaces/desktop/src/lib/design/components/checkbox/index.ts
interfaces/desktop/src/lib/design/components/checkbox/types.ts
interfaces/desktop/src/lib/design/components/code/Code.test.ts
interfaces/desktop/src/lib/design/components/code/CodeBlock.svelte
interfaces/desktop/src/lib/design/components/code/CodeBlockContent.svelte
interfaces/desktop/src/lib/design/components/code/CodeBlockCopyButton.svelte
interfaces/desktop/src/lib/design/components/code/CodeBlockHeader.svelte
interfaces/desktop/src/lib/design/components/code/InlineCode.svelte
interfaces/desktop/src/lib/design/components/code/coldlight-shiki-theme.ts
interfaces/desktop/src/lib/design/components/code/context.ts
interfaces/desktop/src/lib/design/components/code/highlighter.ts
interfaces/desktop/src/lib/design/components/code/index.ts
interfaces/desktop/src/lib/design/components/code/types.ts
interfaces/desktop/src/lib/design/components/collapsible/Collapsible.svelte
interfaces/desktop/src/lib/design/components/collapsible/Collapsible.test.ts
interfaces/desktop/src/lib/design/components/collapsible/CollapsibleContent.svelte
interfaces/desktop/src/lib/design/components/collapsible/CollapsibleTrigger.svelte
interfaces/desktop/src/lib/design/components/collapsible/context.ts
interfaces/desktop/src/lib/design/components/collapsible/index.ts
interfaces/desktop/src/lib/design/components/collapsible/types.ts
interfaces/desktop/src/lib/design/components/color-area/ColorArea.svelte
interfaces/desktop/src/lib/design/components/color-area/ColorAreaGradient.svelte
interfaces/desktop/src/lib/design/components/color-area/ColorAreaThumb.svelte
interfaces/desktop/src/lib/design/components/color-area/color-utils.ts
interfaces/desktop/src/lib/design/components/color-area/context.ts
interfaces/desktop/src/lib/design/components/color-area/index.ts
interfaces/desktop/src/lib/design/components/color-area/types.ts
interfaces/desktop/src/lib/design/components/color-area/use-color-area-drag.svelte.ts
interfaces/desktop/src/lib/design/components/color-field/ColorField.svelte
interfaces/desktop/src/lib/design/components/color-field/ColorFieldDescription.svelte
interfaces/desktop/src/lib/design/components/color-field/ColorFieldErrorMessage.svelte
interfaces/desktop/src/lib/design/components/color-field/ColorFieldInput.svelte
interfaces/desktop/src/lib/design/components/color-field/ColorFieldLabel.svelte
interfaces/desktop/src/lib/design/components/color-field/context.ts
interfaces/desktop/src/lib/design/components/color-field/index.ts
interfaces/desktop/src/lib/design/components/color-field/types.ts
interfaces/desktop/src/lib/design/components/color-slider/ColorSlider.svelte
interfaces/desktop/src/lib/design/components/color-slider/ColorSliderThumb.svelte
interfaces/desktop/src/lib/design/components/color-slider/ColorSliderTrack.svelte
interfaces/desktop/src/lib/design/components/color-slider/context.ts
interfaces/desktop/src/lib/design/components/color-slider/index.ts
interfaces/desktop/src/lib/design/components/color-slider/types.ts
interfaces/desktop/src/lib/design/components/color-slider/use-slider-drag.svelte.ts
interfaces/desktop/src/lib/design/components/color-swatch-picker/ColorSwatchPicker.svelte
interfaces/desktop/src/lib/design/components/color-swatch-picker/ColorSwatchPickerItem.svelte
interfaces/desktop/src/lib/design/components/color-swatch-picker/context.ts
interfaces/desktop/src/lib/design/components/color-swatch-picker/index.ts
interfaces/desktop/src/lib/design/components/color-swatch-picker/types.ts
interfaces/desktop/src/lib/design/components/color-swatch/ColorSwatch.svelte
interfaces/desktop/src/lib/design/components/color-swatch/index.ts
interfaces/desktop/src/lib/design/components/color-swatch/types.ts
interfaces/desktop/src/lib/design/components/color-wheel/ColorWheel.svelte
interfaces/desktop/src/lib/design/components/color-wheel/ColorWheelThumb.svelte
interfaces/desktop/src/lib/design/components/color-wheel/ColorWheelTrack.svelte
interfaces/desktop/src/lib/design/components/color-wheel/context.ts
interfaces/desktop/src/lib/design/components/color-wheel/index.ts
interfaces/desktop/src/lib/design/components/color-wheel/types.ts
interfaces/desktop/src/lib/design/components/color-wheel/use-wheel-drag.svelte.ts
interfaces/desktop/src/lib/design/components/combobox/Combobox.svelte
interfaces/desktop/src/lib/design/components/combobox/Combobox.test.ts
interfaces/desktop/src/lib/design/components/combobox/ComboboxAnnounce.svelte
interfaces/desktop/src/lib/design/components/combobox/ComboboxContent.svelte
interfaces/desktop/src/lib/design/components/combobox/ComboboxEmpty.svelte
interfaces/desktop/src/lib/design/components/combobox/ComboboxGroup.svelte
interfaces/desktop/src/lib/design/components/combobox/ComboboxInput.svelte
interfaces/desktop/src/lib/design/components/combobox/ComboboxItem.svelte
interfaces/desktop/src/lib/design/components/combobox/ComboboxLabel.svelte
interfaces/desktop/src/lib/design/components/combobox/ComboboxTrigger.svelte
interfaces/desktop/src/lib/design/components/combobox/context.ts
interfaces/desktop/src/lib/design/components/combobox/index.ts
interfaces/desktop/src/lib/design/components/combobox/types.ts
interfaces/desktop/src/lib/design/components/contextual-help/ContextualHelp.svelte
interfaces/desktop/src/lib/design/components/contextual-help/ContextualHelpContent.svelte
interfaces/desktop/src/lib/design/components/contextual-help/ContextualHelpFooter.svelte
interfaces/desktop/src/lib/design/components/contextual-help/ContextualHelpHeading.svelte
interfaces/desktop/src/lib/design/components/contextual-help/context.ts
interfaces/desktop/src/lib/design/components/contextual-help/index.ts
interfaces/desktop/src/lib/design/components/contextual-help/types.ts
interfaces/desktop/src/lib/design/components/data-table/DataTable.svelte
interfaces/desktop/src/lib/design/components/data-table/DataTable.test.ts
interfaces/desktop/src/lib/design/components/data-table/index.ts
interfaces/desktop/src/lib/design/components/data-table/types.ts
interfaces/desktop/src/lib/design/components/date-field/DateField.svelte
interfaces/desktop/src/lib/design/components/date-field/DateFieldSegment.svelte
interfaces/desktop/src/lib/design/components/date-field/context.ts
interfaces/desktop/src/lib/design/components/date-field/index.ts
interfaces/desktop/src/lib/design/components/date-field/types.ts
interfaces/desktop/src/lib/design/components/date-picker/DatePicker.svelte
interfaces/desktop/src/lib/design/components/date-picker/DatePickerCalendar.svelte
interfaces/desktop/src/lib/design/components/date-picker/DatePickerContent.svelte
interfaces/desktop/src/lib/design/components/date-picker/DatePickerField.svelte
interfaces/desktop/src/lib/design/components/date-picker/DatePickerTrigger.svelte
interfaces/desktop/src/lib/design/components/date-picker/context.ts
interfaces/desktop/src/lib/design/components/date-picker/index.ts
interfaces/desktop/src/lib/design/components/date-picker/types.ts
interfaces/desktop/src/lib/design/components/date-range-field/DateRangeField.svelte
interfaces/desktop/src/lib/design/components/date-range-field/DateRangeFieldEnd.svelte
interfaces/desktop/src/lib/design/components/date-range-field/DateRangeFieldSegment.svelte
interfaces/desktop/src/lib/design/components/date-range-field/DateRangeFieldStart.svelte
interfaces/desktop/src/lib/design/components/date-range-field/context.ts
interfaces/desktop/src/lib/design/components/date-range-field/index.ts
interfaces/desktop/src/lib/design/components/date-range-field/types.ts
interfaces/desktop/src/lib/design/components/date-range-picker/DateRangePicker.svelte
interfaces/desktop/src/lib/design/components/date-range-picker/DateRangePickerCalendar.svelte
interfaces/desktop/src/lib/design/components/date-range-picker/DateRangePickerContent.svelte
interfaces/desktop/src/lib/design/components/date-range-picker/DateRangePickerField.svelte
interfaces/desktop/src/lib/design/components/date-range-picker/DateRangePickerPresetTrigger.svelte
interfaces/desktop/src/lib/design/components/date-range-picker/DateRangePickerTrigger.svelte
interfaces/desktop/src/lib/design/components/date-range-picker/context.ts
interfaces/desktop/src/lib/design/components/date-range-picker/index.ts
interfaces/desktop/src/lib/design/components/date-range-picker/types.ts
interfaces/desktop/src/lib/design/components/description-list/DescriptionList.svelte
interfaces/desktop/src/lib/design/components/description-list/DescriptionList.test.ts
interfaces/desktop/src/lib/design/components/description-list/index.ts
interfaces/desktop/src/lib/design/components/description-list/types.ts
interfaces/desktop/src/lib/design/components/dialog/Dialog.svelte
interfaces/desktop/src/lib/design/components/dialog/Dialog.test.ts
interfaces/desktop/src/lib/design/components/dialog/Dialog.trap.test.ts
interfaces/desktop/src/lib/design/components/dialog/DialogClose.svelte
interfaces/desktop/src/lib/design/components/dialog/DialogContent.svelte
interfaces/desktop/src/lib/design/components/dialog/DialogDescription.svelte
interfaces/desktop/src/lib/design/components/dialog/DialogFocus.fixture.svelte
interfaces/desktop/src/lib/design/components/dialog/DialogFooter.svelte
interfaces/desktop/src/lib/design/components/dialog/DialogHeader.svelte
interfaces/desktop/src/lib/design/components/dialog/DialogOverlay.svelte
interfaces/desktop/src/lib/design/components/dialog/DialogTitle.svelte
interfaces/desktop/src/lib/design/components/dialog/DialogTrigger.svelte
interfaces/desktop/src/lib/design/components/dialog/context.ts
interfaces/desktop/src/lib/design/components/dialog/index.ts
interfaces/desktop/src/lib/design/components/dialog/types.ts
interfaces/desktop/src/lib/design/components/dynamic-background/DynamicBackground.svelte
interfaces/desktop/src/lib/design/components/dynamic-background/index.ts
interfaces/desktop/src/lib/design/components/dynamic-background/types.ts
interfaces/desktop/src/lib/design/components/empty-state/EmptyState.svelte
interfaces/desktop/src/lib/design/components/empty-state/EmptyState.test.ts
interfaces/desktop/src/lib/design/components/empty-state/index.ts
interfaces/desktop/src/lib/design/components/empty-state/types.ts
interfaces/desktop/src/lib/design/components/field/Field.svelte
interfaces/desktop/src/lib/design/components/field/index.ts
interfaces/desktop/src/lib/design/components/field/types.ts
interfaces/desktop/src/lib/design/components/file-upload/FileUpload.svelte
interfaces/desktop/src/lib/design/components/file-upload/index.ts
interfaces/desktop/src/lib/design/components/file-upload/types.ts
interfaces/desktop/src/lib/design/components/form-field/FormField.svelte
interfaces/desktop/src/lib/design/components/form-field/FormField.test.ts
interfaces/desktop/src/lib/design/components/form-field/index.ts
interfaces/desktop/src/lib/design/components/form-field/types.ts
interfaces/desktop/src/lib/design/components/form/Form.svelte
interfaces/desktop/src/lib/design/components/form/Form.test.ts
interfaces/desktop/src/lib/design/components/form/index.ts
interfaces/desktop/src/lib/design/components/form/types.ts
interfaces/desktop/src/lib/design/components/heading/Heading.svelte
interfaces/desktop/src/lib/design/components/heading/Heading.test.ts
interfaces/desktop/src/lib/design/components/heading/heading.types.ts
interfaces/desktop/src/lib/design/components/heading/index.ts
interfaces/desktop/src/lib/design/components/heading/schema.ts
interfaces/desktop/src/lib/design/components/heading/tokens.ts
interfaces/desktop/src/lib/design/components/index.ts
interfaces/desktop/src/lib/design/components/inline-message/InlineMessage.svelte
interfaces/desktop/src/lib/design/components/inline-message/InlineMessage.test.ts
interfaces/desktop/src/lib/design/components/inline-message/index.ts
interfaces/desktop/src/lib/design/components/inline-message/types.ts
interfaces/desktop/src/lib/design/components/input-group/InputGroup.svelte
interfaces/desktop/src/lib/design/components/input-group/InputGroup.test.ts
interfaces/desktop/src/lib/design/components/input-group/index.ts
interfaces/desktop/src/lib/design/components/input-group/types.ts
interfaces/desktop/src/lib/design/components/kbd/Kbd.svelte
interfaces/desktop/src/lib/design/components/kbd/Kbd.test.ts
interfaces/desktop/src/lib/design/components/kbd/index.ts
interfaces/desktop/src/lib/design/components/kbd/types.ts
interfaces/desktop/src/lib/design/components/key-value/KeyValue.svelte
interfaces/desktop/src/lib/design/components/key-value/index.ts
interfaces/desktop/src/lib/design/components/key-value/key-value.types.ts
interfaces/desktop/src/lib/design/components/label/Label.svelte
interfaces/desktop/src/lib/design/components/label/Label.test.ts
interfaces/desktop/src/lib/design/components/label/index.ts
interfaces/desktop/src/lib/design/components/label/types.ts
interfaces/desktop/src/lib/design/components/link-preview/LinkPreview.svelte
interfaces/desktop/src/lib/design/components/link-preview/index.ts
interfaces/desktop/src/lib/design/components/link-preview/types.ts
interfaces/desktop/src/lib/design/components/list/List.svelte
interfaces/desktop/src/lib/design/components/list/List.test.ts
interfaces/desktop/src/lib/design/components/list/index.ts
interfaces/desktop/src/lib/design/components/list/types.ts
interfaces/desktop/src/lib/design/components/loading-overlay/LoadingOverlay.svelte
interfaces/desktop/src/lib/design/components/loading-overlay/LoadingOverlay.test.ts
interfaces/desktop/src/lib/design/components/loading-overlay/index.ts
interfaces/desktop/src/lib/design/components/loading-overlay/types.ts
interfaces/desktop/src/lib/design/components/menubar/Menubar.svelte
interfaces/desktop/src/lib/design/components/menubar/MenubarContent.svelte
interfaces/desktop/src/lib/design/components/menubar/MenubarItem.svelte
interfaces/desktop/src/lib/design/components/menubar/MenubarMenu.svelte
interfaces/desktop/src/lib/design/components/menubar/MenubarSeparator.svelte
interfaces/desktop/src/lib/design/components/menubar/MenubarTrigger.svelte
interfaces/desktop/src/lib/design/components/menubar/context.ts
interfaces/desktop/src/lib/design/components/menubar/index.ts
interfaces/desktop/src/lib/design/components/menubar/types.ts
interfaces/desktop/src/lib/design/components/meter/Meter.svelte
interfaces/desktop/src/lib/design/components/meter/index.ts
interfaces/desktop/src/lib/design/components/meter/types.ts
interfaces/desktop/src/lib/design/components/nav/Nav.svelte
interfaces/desktop/src/lib/design/components/nav/Nav.test.ts
interfaces/desktop/src/lib/design/components/nav/index.ts
interfaces/desktop/src/lib/design/components/nav/types.ts
interfaces/desktop/src/lib/design/components/navigation-menu/NavigationMenu.svelte
interfaces/desktop/src/lib/design/components/navigation-menu/NavigationMenuContent.svelte
interfaces/desktop/src/lib/design/components/navigation-menu/NavigationMenuItem.svelte
interfaces/desktop/src/lib/design/components/navigation-menu/NavigationMenuLink.svelte
interfaces/desktop/src/lib/design/components/navigation-menu/NavigationMenuTrigger.svelte
interfaces/desktop/src/lib/design/components/navigation-menu/context.ts
interfaces/desktop/src/lib/design/components/navigation-menu/index.ts
interfaces/desktop/src/lib/design/components/navigation-menu/types.ts
interfaces/desktop/src/lib/design/components/notification-center/NotificationCenter.svelte
interfaces/desktop/src/lib/design/components/notification-center/NotificationCenter.test.ts
interfaces/desktop/src/lib/design/components/notification-center/index.ts
interfaces/desktop/src/lib/design/components/notification-center/types.ts
interfaces/desktop/src/lib/design/components/number-field/NumberField.svelte
interfaces/desktop/src/lib/design/components/number-field/index.ts
interfaces/desktop/src/lib/design/components/number-field/types.ts
interfaces/desktop/src/lib/design/components/pagination/Pagination.svelte
interfaces/desktop/src/lib/design/components/pagination/index.ts
interfaces/desktop/src/lib/design/components/pagination/types.ts
interfaces/desktop/src/lib/design/components/pin-input/PinInput.svelte
interfaces/desktop/src/lib/design/components/pin-input/index.ts
interfaces/desktop/src/lib/design/components/pin-input/types.ts
interfaces/desktop/src/lib/design/components/popover/Popover.svelte
interfaces/desktop/src/lib/design/components/popover/context.ts
interfaces/desktop/src/lib/design/components/popover/index.ts
interfaces/desktop/src/lib/design/components/popover/types.ts
interfaces/desktop/src/lib/design/components/progress/Progress.svelte
interfaces/desktop/src/lib/design/components/progress/Progress.test.ts
interfaces/desktop/src/lib/design/components/progress/index.ts
interfaces/desktop/src/lib/design/components/progress/progress.types.ts
interfaces/desktop/src/lib/design/components/progress/schema.ts
interfaces/desktop/src/lib/design/components/progress/tokens.ts
interfaces/desktop/src/lib/design/components/prose/Prose.svelte
interfaces/desktop/src/lib/design/components/prose/Prose.test.ts
interfaces/desktop/src/lib/design/components/prose/index.ts
interfaces/desktop/src/lib/design/components/prose/types.ts
interfaces/desktop/src/lib/design/components/radial-gauge/RadialGauge.svelte
interfaces/desktop/src/lib/design/components/radial-gauge/index.ts
interfaces/desktop/src/lib/design/components/radial-gauge/radial-gauge.types.ts
interfaces/desktop/src/lib/design/components/radio-group/RadioGroup.svelte
interfaces/desktop/src/lib/design/components/radio-group/RadioGroupItem.svelte
interfaces/desktop/src/lib/design/components/radio-group/RadioGroupLabel.svelte
interfaces/desktop/src/lib/design/components/radio-group/context.ts
interfaces/desktop/src/lib/design/components/radio-group/index.ts
interfaces/desktop/src/lib/design/components/radio-group/types.ts
interfaces/desktop/src/lib/design/components/range-calendar/RangeCalendar.svelte
interfaces/desktop/src/lib/design/components/range-calendar/RangeCalendarCell.svelte
interfaces/desktop/src/lib/design/components/range-calendar/RangeCalendarGrid.svelte
interfaces/desktop/src/lib/design/components/range-calendar/RangeCalendarHeader.svelte
interfaces/desktop/src/lib/design/components/range-calendar/context.ts
interfaces/desktop/src/lib/design/components/range-calendar/index.ts
interfaces/desktop/src/lib/design/components/range-calendar/types.ts
interfaces/desktop/src/lib/design/components/scroll-area/ScrollArea.svelte
interfaces/desktop/src/lib/design/components/scroll-area/ScrollArea.test.ts
interfaces/desktop/src/lib/design/components/scroll-area/index.ts
interfaces/desktop/src/lib/design/components/scroll-area/types.ts
interfaces/desktop/src/lib/design/components/search-field/SearchField.svelte
interfaces/desktop/src/lib/design/components/search-field/index.ts
interfaces/desktop/src/lib/design/components/search-field/types.ts
interfaces/desktop/src/lib/design/components/section/Section.svelte
interfaces/desktop/src/lib/design/components/section/index.ts
interfaces/desktop/src/lib/design/components/section/section.types.ts
interfaces/desktop/src/lib/design/components/select/Select.svelte
interfaces/desktop/src/lib/design/components/select/Select.test.ts
interfaces/desktop/src/lib/design/components/select/SelectContent.svelte
interfaces/desktop/src/lib/design/components/select/SelectGroup.svelte
interfaces/desktop/src/lib/design/components/select/SelectItem.svelte
interfaces/desktop/src/lib/design/components/select/SelectLabel.svelte
interfaces/desktop/src/lib/design/components/select/SelectTrigger.svelte
interfaces/desktop/src/lib/design/components/select/context.ts
interfaces/desktop/src/lib/design/components/select/index.ts
interfaces/desktop/src/lib/design/components/select/types.ts
interfaces/desktop/src/lib/design/components/separator/Separator.svelte
interfaces/desktop/src/lib/design/components/separator/Separator.test.ts
interfaces/desktop/src/lib/design/components/separator/index.ts
interfaces/desktop/src/lib/design/components/separator/types.ts
interfaces/desktop/src/lib/design/components/sheet/Sheet.svelte
interfaces/desktop/src/lib/design/components/sheet/Sheet.test.ts
interfaces/desktop/src/lib/design/components/sheet/index.ts
interfaces/desktop/src/lib/design/components/sheet/types.ts
interfaces/desktop/src/lib/design/components/sidebar/Sidebar.svelte
interfaces/desktop/src/lib/design/components/sidebar/Sidebar.test.ts
interfaces/desktop/src/lib/design/components/sidebar/index.ts
interfaces/desktop/src/lib/design/components/sidebar/types.ts
interfaces/desktop/src/lib/design/components/skeleton/Skeleton.svelte
interfaces/desktop/src/lib/design/components/skeleton/Skeleton.test.ts
interfaces/desktop/src/lib/design/components/skeleton/index.ts
interfaces/desktop/src/lib/design/components/skeleton/types.ts
interfaces/desktop/src/lib/design/components/skip-link/SkipLink.svelte
interfaces/desktop/src/lib/design/components/skip-link/SkipLink.test.ts
interfaces/desktop/src/lib/design/components/skip-link/index.ts
interfaces/desktop/src/lib/design/components/skip-link/types.ts
interfaces/desktop/src/lib/design/components/slider/Slider.svelte
interfaces/desktop/src/lib/design/components/slider/SliderRange.svelte
interfaces/desktop/src/lib/design/components/slider/SliderThumb.svelte
interfaces/desktop/src/lib/design/components/slider/SliderTrack.svelte
interfaces/desktop/src/lib/design/components/slider/context.ts
interfaces/desktop/src/lib/design/components/slider/index.ts
interfaces/desktop/src/lib/design/components/slider/types.ts
interfaces/desktop/src/lib/design/components/spark-line/SparkLine.svelte
interfaces/desktop/src/lib/design/components/spark-line/index.ts
interfaces/desktop/src/lib/design/components/spark-line/spark-line.types.ts
interfaces/desktop/src/lib/design/components/spinner/LoadingBlock.svelte
interfaces/desktop/src/lib/design/components/spinner/Spinner.svelte
interfaces/desktop/src/lib/design/components/spinner/Spinner.test.ts
interfaces/desktop/src/lib/design/components/spinner/SpinnerRow.svelte
interfaces/desktop/src/lib/design/components/spinner/index.ts
interfaces/desktop/src/lib/design/components/spinner/types.ts
interfaces/desktop/src/lib/design/components/stat/Stat.svelte
interfaces/desktop/src/lib/design/components/stat/Stat.test.ts
interfaces/desktop/src/lib/design/components/stat/index.ts
interfaces/desktop/src/lib/design/components/stat/schema.ts
interfaces/desktop/src/lib/design/components/stat/stat.types.ts
interfaces/desktop/src/lib/design/components/stat/tokens.ts
interfaces/desktop/src/lib/design/components/status-dot/StatusDot.svelte
interfaces/desktop/src/lib/design/components/status-dot/index.ts
interfaces/desktop/src/lib/design/components/status-dot/schema.ts
interfaces/desktop/src/lib/design/components/status-dot/status-dot.types.ts
interfaces/desktop/src/lib/design/components/status-dot/tokens.ts
interfaces/desktop/src/lib/design/components/steps/Steps.svelte
interfaces/desktop/src/lib/design/components/steps/Steps.test.ts
interfaces/desktop/src/lib/design/components/steps/index.ts
interfaces/desktop/src/lib/design/components/steps/types.ts
interfaces/desktop/src/lib/design/components/switch/Switch.svelte
interfaces/desktop/src/lib/design/components/switch/Switch.test.ts
interfaces/desktop/src/lib/design/components/switch/index.ts
interfaces/desktop/src/lib/design/components/switch/types.ts
interfaces/desktop/src/lib/design/components/table-of-contents/TableOfContents.svelte
interfaces/desktop/src/lib/design/components/table-of-contents/TableOfContents.test.ts
interfaces/desktop/src/lib/design/components/table-of-contents/index.ts
interfaces/desktop/src/lib/design/components/table-of-contents/types.ts
interfaces/desktop/src/lib/design/components/table/Table.svelte
interfaces/desktop/src/lib/design/components/table/Table.test.ts
interfaces/desktop/src/lib/design/components/table/index.ts
interfaces/desktop/src/lib/design/components/table/types.ts
interfaces/desktop/src/lib/design/components/tabs/Tabs.svelte
interfaces/desktop/src/lib/design/components/tabs/TabsContent.svelte
interfaces/desktop/src/lib/design/components/tabs/TabsList.svelte
interfaces/desktop/src/lib/design/components/tabs/TabsTrigger.svelte
interfaces/desktop/src/lib/design/components/tabs/context.ts
interfaces/desktop/src/lib/design/components/tabs/index.ts
interfaces/desktop/src/lib/design/components/tabs/types.ts
interfaces/desktop/src/lib/design/components/text-field/TextField.svelte
interfaces/desktop/src/lib/design/components/text-field/index.ts
interfaces/desktop/src/lib/design/components/text-field/schema.ts
interfaces/desktop/src/lib/design/components/text-field/text-field.types.ts
interfaces/desktop/src/lib/design/components/text-field/tokens.ts
interfaces/desktop/src/lib/design/components/text/Text.svelte
interfaces/desktop/src/lib/design/components/text/Text.test.ts
interfaces/desktop/src/lib/design/components/text/index.ts
interfaces/desktop/src/lib/design/components/text/schema.ts
interfaces/desktop/src/lib/design/components/text/text.types.ts
interfaces/desktop/src/lib/design/components/text/tokens.ts
interfaces/desktop/src/lib/design/components/textarea/Textarea.svelte
interfaces/desktop/src/lib/design/components/textarea/Textarea.test.ts
interfaces/desktop/src/lib/design/components/textarea/index.ts
interfaces/desktop/src/lib/design/components/textarea/types.ts
interfaces/desktop/src/lib/design/components/toaster/Toaster.svelte
interfaces/desktop/src/lib/design/components/toaster/index.ts
interfaces/desktop/src/lib/design/components/toaster/types.ts
interfaces/desktop/src/lib/design/components/toggle-group/ToggleGroup.svelte
interfaces/desktop/src/lib/design/components/toggle-group/ToggleGroup.test.ts
interfaces/desktop/src/lib/design/components/toggle-group/index.ts
interfaces/desktop/src/lib/design/components/toggle-group/types.ts
interfaces/desktop/src/lib/design/components/toggle/Toggle.svelte
interfaces/desktop/src/lib/design/components/toggle/index.ts
interfaces/desktop/src/lib/design/components/toggle/types.ts
interfaces/desktop/src/lib/design/components/toolbar/Toolbar.svelte
interfaces/desktop/src/lib/design/components/toolbar/Toolbar.test.ts
interfaces/desktop/src/lib/design/components/toolbar/index.ts
interfaces/desktop/src/lib/design/components/toolbar/types.ts
interfaces/desktop/src/lib/design/components/tooltip/Tooltip.svelte
interfaces/desktop/src/lib/design/components/tooltip/Tooltip.test.ts
interfaces/desktop/src/lib/design/components/tooltip/TooltipContent.svelte
interfaces/desktop/src/lib/design/components/tooltip/TooltipTrigger.svelte
interfaces/desktop/src/lib/design/components/tooltip/context.ts
interfaces/desktop/src/lib/design/components/tooltip/index.ts
interfaces/desktop/src/lib/design/components/tooltip/types.ts
interfaces/desktop/src/lib/design/components/tree/index.ts
interfaces/desktop/src/lib/design/components/tree/types.ts
interfaces/desktop/src/lib/design/components/types.ts
interfaces/desktop/src/lib/design/config/coldlight/adapters.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/attributes.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/components.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/enforcement.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/generation.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/identity.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/index.ts
interfaces/desktop/src/lib/design/config/coldlight/roots.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/styledictionary/DTCG-COMPLIANCE-AUDIT.md
interfaces/desktop/src/lib/design/config/coldlight/styledictionary/SD5-OKLCH.md
interfaces/desktop/src/lib/design/config/coldlight/styledictionary/SD5-REFERENCE.md
interfaces/desktop/src/lib/design/config/coldlight/testing.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/tokens.cfg.ts
interfaces/desktop/src/lib/design/config/coldlight/types.ts
interfaces/desktop/src/lib/design/config/coldlight/vocabularies.cfg.ts
interfaces/desktop/src/lib/design/debug/TokenDebugOverlay.svelte
interfaces/desktop/src/lib/design/docs/BEHAVIORS-ORPHAN-HOOKS.md
interfaces/desktop/src/lib/design/docs/BLUEPRINTS.md
interfaces/desktop/src/lib/design/docs/DESIGN_BOOK.md
interfaces/desktop/src/lib/design/docs/DTCG-REFERENCE.md
interfaces/desktop/src/lib/design/docs/GENERATOR.md
interfaces/desktop/src/lib/design/docs/GIT_DISCIPLINE.md
interfaces/desktop/src/lib/design/docs/LAWS.md
interfaces/desktop/src/lib/design/docs/S2-STYLE-MACRO-REFERENCE.md
interfaces/desktop/src/lib/design/docs/TERMINOLOGY.md
interfaces/desktop/src/lib/design/docs/notes.md
interfaces/desktop/src/lib/design/docs/primitives.md
interfaces/desktop/src/lib/design/docs/recipes.md
interfaces/desktop/src/lib/design/docs/styledictionary/00-overview.md
interfaces/desktop/src/lib/design/docs/styledictionary/01-dtcg-tokens.md
interfaces/desktop/src/lib/design/docs/styledictionary/02-transforms.md
interfaces/desktop/src/lib/design/docs/styledictionary/03-transform-groups.md
interfaces/desktop/src/lib/design/docs/styledictionary/04-formats.md
interfaces/desktop/src/lib/design/docs/styledictionary/05-hooks-lifecycle.md
interfaces/desktop/src/lib/design/docs/styledictionary/06-filters.md
interfaces/desktop/src/lib/design/docs/styledictionary/07-advanced-patterns.md
interfaces/desktop/src/lib/design/docs/styledictionary/08-migration-v3-to-v5.md
interfaces/desktop/src/lib/design/docs/styledictionary/09-sd5-complete-reference.md
interfaces/desktop/src/lib/design/docs/styledictionary/tailwind-presets/00-tw4-overview.md
interfaces/desktop/src/lib/design/docs/styledictionary/tailwind-presets/01-theme-directive.md
interfaces/desktop/src/lib/design/docs/styledictionary/tailwind-presets/02-sd5-to-tw4-pipeline.md
interfaces/desktop/src/lib/design/docs/styledictionary/tailwind-presets/03-dark-mode-tokens.md
interfaces/desktop/src/lib/design/docs/taxonomy.md
interfaces/desktop/src/lib/design/docs/techrefs/bits-ui-cold-light-spec.md
interfaces/desktop/src/lib/design/docs/techrefs/bits-ui-v2.15.4-complete.md
interfaces/desktop/src/lib/design/docs/tokens.md
interfaces/desktop/src/lib/design/generated/coldlight.manifest.json
interfaces/desktop/src/lib/design/generated/diagonal-blends.css
interfaces/desktop/src/lib/design/generated/focus.css
interfaces/desktop/src/lib/design/generated/keyframes.css
interfaces/desktop/src/lib/design/generated/render-base.css
interfaces/desktop/src/lib/design/generated/scrollbars.css
interfaces/desktop/src/lib/design/generated/token-manifest.json
interfaces/desktop/src/lib/design/generated/typography.css
interfaces/desktop/src/lib/design/index.css
interfaces/desktop/src/lib/design/overlays/MinionOverlay.svelte
interfaces/desktop/src/lib/design/overlays/SpriteAnimator.svelte
interfaces/desktop/src/lib/design/overlays/index.ts
interfaces/desktop/src/lib/design/overlays/types.ts
interfaces/desktop/src/lib/design/package.json
interfaces/desktop/src/lib/design/patterns/README.md
interfaces/desktop/src/lib/design/patterns/data/README.md
interfaces/desktop/src/lib/design/patterns/data/index.ts
interfaces/desktop/src/lib/design/patterns/forms/README.md
interfaces/desktop/src/lib/design/patterns/forms/index.ts
interfaces/desktop/src/lib/design/patterns/index.ts
interfaces/desktop/src/lib/design/patterns/search/README.md
interfaces/desktop/src/lib/design/patterns/search/index.ts
interfaces/desktop/src/lib/design/plugins/parasite/Parasite.svelte
interfaces/desktop/src/lib/design/plugins/parasite/index.ts
interfaces/desktop/src/lib/design/plugins/parasite/parasite.css
interfaces/desktop/src/lib/design/presets/catalog.ts
interfaces/desktop/src/lib/design/presets/families.ts
interfaces/desktop/src/lib/design/presets/ids.ts
interfaces/desktop/src/lib/design/presets/index.ts
interfaces/desktop/src/lib/design/presets/schema.ts
interfaces/desktop/src/lib/design/provider/ColdLightProvider.svelte
interfaces/desktop/src/lib/design/provider/context.svelte.ts
interfaces/desktop/src/lib/design/provider/index.ts
interfaces/desktop/src/lib/design/provider/types.ts
interfaces/desktop/src/lib/design/renderforge/css-var-string.ts
interfaces/desktop/src/lib/design/renderforge/generated/kind-families.ts
interfaces/desktop/src/lib/design/renderforge/index.ts
interfaces/desktop/src/lib/design/renderforge/intent.ts
interfaces/desktop/src/lib/design/renderforge/render.ts
interfaces/desktop/src/lib/design/renderforge/resolve.test.ts
interfaces/desktop/src/lib/design/renderforge/types.ts
interfaces/desktop/src/lib/design/renderforge/var-to-family.ts
interfaces/desktop/src/lib/design/schema/a11y.schema.ts
interfaces/desktop/src/lib/design/schema/anatomy.schema.ts
interfaces/desktop/src/lib/design/schema/enforce.ts
interfaces/desktop/src/lib/design/schema/index.ts
interfaces/desktop/src/lib/design/schema/primitive.schema.ts
interfaces/desktop/src/lib/design/sprints/PARKING_LOT.md
interfaces/desktop/src/lib/design/sprints/SPRINT-COLDLIGHT-CENTRALIZATION.md
interfaces/desktop/src/lib/design/sprints/SPRINT-COLDLIGHT-FOUNDATION.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-COLDLIGHT-SOLE-PROVIDER.md
interfaces/desktop/src/lib/design/sprints/SPRINT-COLDLIGHT-SOLE-PROVIDER.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-COMPONENT-FOUNDATION.md
interfaces/desktop/src/lib/design/sprints/SPRINT-COMPONENT-FOUNDATION.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-DESIGN-SYSTEM-ENFORCEMENT.md
interfaces/desktop/src/lib/design/sprints/SPRINT-DESIGN-SYSTEM-ENFORCEMENT.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-LEFTHOOK-HARDENING.md
interfaces/desktop/src/lib/design/sprints/SPRINT-LEFTHOOK-HARDENING.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-PREFIX-PURGE.md
interfaces/desktop/src/lib/design/sprints/SPRINT-PRIMITIVES-FOUNDATION.md
interfaces/desktop/src/lib/design/sprints/SPRINT-PRIMITIVES-FOUNDATION.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-SD5-FOUNDATION.md
interfaces/desktop/src/lib/design/sprints/SPRINT-SD5-FOUNDATION.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-SD5-PIPELINE.md
interfaces/desktop/src/lib/design/sprints/SPRINT-SD5-PIPELINE.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-TAXONOMY-FOUNDATION.md
interfaces/desktop/src/lib/design/sprints/SPRINT-TAXONOMY-FOUNDATION.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-TAXONOMY-SIMPLIFICATION.md
interfaces/desktop/src/lib/design/sprints/SPRINT-TAXONOMY-SIMPLIFICATION.research.md
interfaces/desktop/src/lib/design/sprints/SPRINT-TOKEN-BRIDGE.md
interfaces/desktop/src/lib/design/sprints/SPRINT-TOKENS-PREFIX-FIX.md
interfaces/desktop/src/lib/design/sprints/SPRINT-VISUAL-SCAFFOLDING.md
interfaces/desktop/src/lib/design/sprints/SPRINT-VISUAL-SCAFFOLDING.research.md
interfaces/desktop/src/lib/design/styles/base-state.svelte.ts
interfaces/desktop/src/lib/design/styles/components/components.generated.css
interfaces/desktop/src/lib/design/styles/index.css
interfaces/desktop/src/lib/design/styles/index.ts
interfaces/desktop/src/lib/design/styles/macro-mappings.ts
interfaces/desktop/src/lib/design/styles/primitives/bevel.css
interfaces/desktop/src/lib/design/styles/primitives/blur.css
interfaces/desktop/src/lib/design/styles/primitives/border-width.css
interfaces/desktop/src/lib/design/styles/primitives/color.css
interfaces/desktop/src/lib/design/styles/primitives/glow.css
interfaces/desktop/src/lib/design/styles/primitives/gradient.css
interfaces/desktop/src/lib/design/styles/primitives/layout.css
interfaces/desktop/src/lib/design/styles/primitives/motion.css
interfaces/desktop/src/lib/design/styles/primitives/radius.css
interfaces/desktop/src/lib/design/styles/primitives/shadow.css
interfaces/desktop/src/lib/design/styles/primitives/spacing.css
interfaces/desktop/src/lib/design/styles/primitives/surface.css
interfaces/desktop/src/lib/design/styles/primitives/typography.css
interfaces/desktop/src/lib/design/styles/semantic/accent.css
interfaces/desktop/src/lib/design/styles/semantic/backdrop.css
interfaces/desktop/src/lib/design/styles/semantic/border.css
interfaces/desktop/src/lib/design/styles/semantic/chat.css
interfaces/desktop/src/lib/design/styles/semantic/claude.css
interfaces/desktop/src/lib/design/styles/semantic/elevation.css
interfaces/desktop/src/lib/design/styles/semantic/interaction.css
interfaces/desktop/src/lib/design/styles/semantic/overlay.css
interfaces/desktop/src/lib/design/styles/semantic/role.css
interfaces/desktop/src/lib/design/styles/semantic/scrollbar.css
interfaces/desktop/src/lib/design/styles/semantic/signal.css
interfaces/desktop/src/lib/design/styles/semantic/surface.css
interfaces/desktop/src/lib/design/styles/semantic/text-styles.css
interfaces/desktop/src/lib/design/styles/semantic/text.css
interfaces/desktop/src/lib/design/styles/semantic/transition.css
interfaces/desktop/src/lib/design/styles/semantic/wizard.css
interfaces/desktop/src/lib/design/surface.config.ts
interfaces/desktop/src/lib/design/svg/_schema/schema.ts
interfaces/desktop/src/lib/design/svg/_schema/types.ts
interfaces/desktop/src/lib/design/svg/blanks/SvgBlank.svelte
interfaces/desktop/src/lib/design/svg/blanks/index.ts
interfaces/desktop/src/lib/design/svg/blanks/shapes/circle.ts
interfaces/desktop/src/lib/design/svg/blanks/shapes/hexagon.ts
interfaces/desktop/src/lib/design/svg/blanks/shapes/index.ts
interfaces/desktop/src/lib/design/svg/blanks/shapes/pill.ts
interfaces/desktop/src/lib/design/svg/blanks/shapes/rect.ts
interfaces/desktop/src/lib/design/svg/filters/SvgFilters.svelte
interfaces/desktop/src/lib/design/svg/filters/definitions/bevel.ts
interfaces/desktop/src/lib/design/svg/filters/definitions/glow.ts
interfaces/desktop/src/lib/design/svg/filters/definitions/index.ts
interfaces/desktop/src/lib/design/svg/filters/definitions/noise.ts
interfaces/desktop/src/lib/design/svg/filters/filters.css
interfaces/desktop/src/lib/design/svg/filters/index.ts
interfaces/desktop/src/lib/design/svg/filters/registry.ts
interfaces/desktop/src/lib/design/svg/index.ts
interfaces/desktop/src/lib/design/svg/presets/svg-presets.generated.css
interfaces/desktop/src/lib/design/svg/resolve-svg-macro.ts
interfaces/desktop/src/lib/design/svg/surfaces/NeuFrame.svelte
interfaces/desktop/src/lib/design/svg/surfaces/NeuGauge.svelte
interfaces/desktop/src/lib/design/svg/surfaces/NeuPanel.svelte
interfaces/desktop/src/lib/design/svg/surfaces/index.ts
interfaces/desktop/src/lib/design/svg/svg-accent-defaults.css
interfaces/desktop/src/lib/design/svg/svg-macro-base.css
interfaces/desktop/src/lib/design/svg/svg-macro-mappings.ts
interfaces/desktop/src/lib/design/svg/svg-types.ts
interfaces/desktop/src/lib/design/theme/accent.css
interfaces/desktop/src/lib/design/theme/backdrop.css
interfaces/desktop/src/lib/design/theme/bevel.css
interfaces/desktop/src/lib/design/theme/blur.css
interfaces/desktop/src/lib/design/theme/border.css
interfaces/desktop/src/lib/design/theme/color.css
interfaces/desktop/src/lib/design/theme/elevation.css
interfaces/desktop/src/lib/design/theme/gradient.css
interfaces/desktop/src/lib/design/theme/index.css
interfaces/desktop/src/lib/design/theme/interaction.css
interfaces/desktop/src/lib/design/theme/motion.css
interfaces/desktop/src/lib/design/theme/overlay.css
interfaces/desktop/src/lib/design/theme/radius.css
interfaces/desktop/src/lib/design/theme/role.css
interfaces/desktop/src/lib/design/theme/scrollbar.css
interfaces/desktop/src/lib/design/theme/shadow.css
interfaces/desktop/src/lib/design/theme/signal.css
interfaces/desktop/src/lib/design/theme/spacing.css
interfaces/desktop/src/lib/design/theme/surface.css
interfaces/desktop/src/lib/design/theme/text-composed.css
interfaces/desktop/src/lib/design/theme/text-style.css
interfaces/desktop/src/lib/design/theme/text.css
interfaces/desktop/src/lib/design/theme/transition.css
interfaces/desktop/src/lib/design/theme/typography.css
interfaces/desktop/src/lib/design/tsdoc.json
interfaces/desktop/src/lib/design/typedoc.json
interfaces/desktop/src/lib/design/types/accent.d.ts
interfaces/desktop/src/lib/design/types/backdrop.d.ts
interfaces/desktop/src/lib/design/types/blur.d.ts
interfaces/desktop/src/lib/design/types/border.d.ts
interfaces/desktop/src/lib/design/types/color.d.ts
interfaces/desktop/src/lib/design/types/component.d.ts
interfaces/desktop/src/lib/design/types/elevation.d.ts
interfaces/desktop/src/lib/design/types/gradient.d.ts
interfaces/desktop/src/lib/design/types/index.d.ts
interfaces/desktop/src/lib/design/types/interaction.d.ts
interfaces/desktop/src/lib/design/types/motion.d.ts
interfaces/desktop/src/lib/design/types/role.d.ts
interfaces/desktop/src/lib/design/types/shadow.d.ts
interfaces/desktop/src/lib/design/types/signal.d.ts
interfaces/desktop/src/lib/design/types/spacing.d.ts
interfaces/desktop/src/lib/design/types/surface.d.ts
interfaces/desktop/src/lib/design/types/system.ts
interfaces/desktop/src/lib/design/types/text.d.ts
interfaces/desktop/src/lib/design/types/typography.d.ts
interfaces/desktop/src/lib/design/utils/ariaAnnounce.ts
interfaces/desktop/src/lib/design/utils/aspect-ratio/aspect-ratio.types.ts
interfaces/desktop/src/lib/design/utils/aspect-ratio/index.ts
interfaces/desktop/src/lib/design/utils/aspect-ratio/use-aspect-ratio.ts
interfaces/desktop/src/lib/design/utils/box/box.types.ts
interfaces/desktop/src/lib/design/utils/box/index.ts
interfaces/desktop/src/lib/design/utils/box/use-box.ts
interfaces/desktop/src/lib/design/utils/center/center.types.ts
interfaces/desktop/src/lib/design/utils/center/index.ts
interfaces/desktop/src/lib/design/utils/center/use-center.ts
interfaces/desktop/src/lib/design/utils/clamp/clamp.ts
interfaces/desktop/src/lib/design/utils/clamp/index.ts
interfaces/desktop/src/lib/design/utils/cn.ts
interfaces/desktop/src/lib/design/utils/container/container.types.ts
interfaces/desktop/src/lib/design/utils/container/index.ts
interfaces/desktop/src/lib/design/utils/container/use-container.ts
interfaces/desktop/src/lib/design/utils/divider/divider.types.ts
interfaces/desktop/src/lib/design/utils/divider/index.ts
interfaces/desktop/src/lib/design/utils/divider/use-divider.ts
interfaces/desktop/src/lib/design/utils/flex/flex.types.ts
interfaces/desktop/src/lib/design/utils/flex/index.ts
interfaces/desktop/src/lib/design/utils/flex/use-flex.ts
interfaces/desktop/src/lib/design/utils/grid-layout/grid-layout.types.ts
interfaces/desktop/src/lib/design/utils/grid-layout/index.ts
interfaces/desktop/src/lib/design/utils/grid-layout/use-grid-layout.ts
interfaces/desktop/src/lib/design/utils/hstack/hstack.types.ts
interfaces/desktop/src/lib/design/utils/hstack/index.ts
interfaces/desktop/src/lib/design/utils/hstack/use-hstack.ts
interfaces/desktop/src/lib/design/utils/idGen.ts
interfaces/desktop/src/lib/design/utils/index.ts
interfaces/desktop/src/lib/design/utils/slotMerge.ts
interfaces/desktop/src/lib/design/utils/spacer/index.ts
interfaces/desktop/src/lib/design/utils/spacer/spacer.types.ts
interfaces/desktop/src/lib/design/utils/spacer/use-spacer.ts
interfaces/desktop/src/lib/design/utils/stack/index.ts
interfaces/desktop/src/lib/design/utils/stack/stack.types.ts
interfaces/desktop/src/lib/design/utils/stack/use-stack.ts
interfaces/desktop/src/lib/design/utils/sticky/index.ts
interfaces/desktop/src/lib/design/utils/sticky/sticky.types.ts
interfaces/desktop/src/lib/design/utils/sticky/use-sticky.ts
interfaces/desktop/src/lib/design/utils/tokenResolve.ts
interfaces/desktop/src/lib/design/utils/visually-hidden/index.ts
interfaces/desktop/src/lib/design/utils/visually-hidden/use-visually-hidden.ts
interfaces/desktop/src/lib/design/utils/visually-hidden/visually-hidden.types.ts
interfaces/desktop/src/lib/design/visual/axes.ts
interfaces/desktop/src/lib/design/visual/index.ts
interfaces/desktop/src/lib/design/visual/intent-map.ts
interfaces/desktop/src/lib/design/visual/kind-names.ts
interfaces/desktop/src/lib/design/visual/preset-definition.ts
interfaces/desktop/src/lib/design/visual/preset-families.ts
interfaces/desktop/src/lib/design/visual/preset-id.ts
interfaces/desktop/src/lib/design/visual/presets/chat.ts
interfaces/desktop/src/lib/design/visual/presets/chrome.ts
interfaces/desktop/src/lib/design/visual/presets/flat.ts
interfaces/desktop/src/lib/design/visual/presets/glass.ts
interfaces/desktop/src/lib/design/visual/presets/index.ts
interfaces/desktop/src/lib/design/visual/presets/neuro.ts
interfaces/desktop/src/lib/design/visual/presets/retro.ts
interfaces/desktop/src/lib/design/visual/presets/stark.ts
interfaces/desktop/src/lib/design/visual/sizes.ts
```

## interfaces/desktop/src/lib/domains/ (196 files)
```
interfaces/desktop/src/lib/domains/app/community/data-access/community.service.ts
interfaces/desktop/src/lib/domains/app/community/data-access/community.state.svelte.ts
interfaces/desktop/src/lib/domains/app/community/data-access/index.ts
interfaces/desktop/src/lib/domains/app/community/index.ts
interfaces/desktop/src/lib/domains/app/community/util/community.types.ts
interfaces/desktop/src/lib/domains/app/community/util/index.ts
interfaces/desktop/src/lib/domains/app/devforge/data-access/devforge.state.svelte.ts
interfaces/desktop/src/lib/domains/app/devforge/data-access/devforge.svc.ts
interfaces/desktop/src/lib/domains/app/devforge/feature/dashboard/DevForgeDashboard.svelte
interfaces/desktop/src/lib/domains/app/devforge/feature/friends/pages/UserDashboard.svelte
interfaces/desktop/src/lib/domains/app/devforge/feature/friends/pages/UserFrame.svelte
interfaces/desktop/src/lib/domains/app/devforge/index.ts
interfaces/desktop/src/lib/domains/app/devforge/util/devforge.types.ts
interfaces/desktop/src/lib/domains/app/devpulse/data-access/devpulse.service.ts
interfaces/desktop/src/lib/domains/app/devpulse/data-access/devpulse.state.svelte.ts
interfaces/desktop/src/lib/domains/app/devpulse/data-access/profile-settings.state.svelte.ts
interfaces/desktop/src/lib/domains/app/devpulse/feature/community/components/Carousel.svelte
interfaces/desktop/src/lib/domains/app/devpulse/feature/community/pages/CommunityDashboard.svelte
interfaces/desktop/src/lib/domains/app/devpulse/feature/dashboard/DevPulseDashboard.svelte
interfaces/desktop/src/lib/domains/app/devpulse/feature/profile/pages/ProfileDashboard.svelte
interfaces/desktop/src/lib/domains/app/devpulse/index.ts
interfaces/desktop/src/lib/domains/app/devpulse/util/devpulse.types.ts
interfaces/desktop/src/lib/domains/app/index.ts
interfaces/desktop/src/lib/domains/app/knowledge/data-access/index.ts
interfaces/desktop/src/lib/domains/app/knowledge/data-access/knowledge-context.svelte.ts
interfaces/desktop/src/lib/domains/app/knowledge/data-access/knowledge.service.ts
interfaces/desktop/src/lib/domains/app/knowledge/data-access/knowledge.state.svelte.ts
interfaces/desktop/src/lib/domains/app/knowledge/index.ts
interfaces/desktop/src/lib/domains/app/knowledge/util/index.ts
interfaces/desktop/src/lib/domains/app/knowledge/util/knowledge.types.ts
interfaces/desktop/src/lib/domains/app/minions/data-access/overlay.state.svelte.ts
interfaces/desktop/src/lib/domains/app/minions/index.ts
interfaces/desktop/src/lib/domains/app/minions/ui/MinionCard.svelte
interfaces/desktop/src/lib/domains/app/minions/ui/MinionGrid.svelte
interfaces/desktop/src/lib/domains/app/models/data-access/baseline.state.svelte.ts
interfaces/desktop/src/lib/domains/app/models/data-access/download-bootstrap.ts
interfaces/desktop/src/lib/domains/app/models/data-access/hardware.state.svelte.ts
interfaces/desktop/src/lib/domains/app/models/data-access/inference.service.ts
interfaces/desktop/src/lib/domains/app/models/data-access/models.state.svelte.ts
interfaces/desktop/src/lib/domains/app/models/data-access/narration.state.svelte.ts
interfaces/desktop/src/lib/domains/app/models/feature/components/SwapOverlay.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/ModelDownloaderOverlay.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/data-access/downloader.state.svelte.ts
interfaces/desktop/src/lib/domains/app/models/feature/downloader/data-access/index.ts
interfaces/desktop/src/lib/domains/app/models/feature/downloader/feature/DownloaderConfirmPanel.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/feature/DownloaderProgressPanel.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/feature/DownloaderSearchPanel.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/feature/DownloaderTokenStrip.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/feature/index.ts
interfaces/desktop/src/lib/domains/app/models/feature/downloader/index.ts
interfaces/desktop/src/lib/domains/app/models/feature/downloader/ui/AuroraGradientBackdrop.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/ui/BundleFileRow.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/ui/ModelResultCard.svelte
interfaces/desktop/src/lib/domains/app/models/feature/downloader/ui/index.ts
interfaces/desktop/src/lib/domains/app/models/feature/downloader/util/downloader.types.ts
interfaces/desktop/src/lib/domains/app/models/feature/downloader/util/index.ts
interfaces/desktop/src/lib/domains/app/models/feature/downloader/util/slot-tagging.ts
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/download-bootstrap.ts
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/OverlayShell.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/CapabilityView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/ClyffyCollabView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/CompleteView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/EndpointView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/HardwareView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/InstallingView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/PresetView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/SlotSaveView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/feature/views/WelcomeView.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/index.ts
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/scan.state.svelte.ts
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/ui/AnatomyConstellation.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/ui/AnatomyTile.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/ui/FoundEndpointCard.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/ui/ManualEntry.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/ui/ModeCard.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/ui/SaveSlotCard.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/ui/ScanPanel.svelte
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/util/wizard.types.ts
interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.ts
interfaces/desktop/src/lib/domains/app/models/index.ts
interfaces/desktop/src/lib/domains/app/models/ui/ClyffyNarration.svelte
interfaces/desktop/src/lib/domains/app/models/ui/ContextGauge.svelte
interfaces/desktop/src/lib/domains/app/models/ui/GpuUtilGauge.svelte
interfaces/desktop/src/lib/domains/app/models/ui/ModelEventCard.svelte
interfaces/desktop/src/lib/domains/app/models/ui/VramBar.svelte
interfaces/desktop/src/lib/domains/app/models/ui/VramGauge.svelte
interfaces/desktop/src/lib/domains/app/models/util/format.ts
interfaces/desktop/src/lib/domains/app/models/util/roles.ts
interfaces/desktop/src/lib/domains/app/models/util/slots.ts
interfaces/desktop/src/lib/domains/app/models/util/types.ts
interfaces/desktop/src/lib/domains/app/overmind/OVERMIND_SPEC.md
interfaces/desktop/src/lib/domains/app/overmind/README.md
interfaces/desktop/src/lib/domains/app/overmind/feature/dashboard/Canvas.svelte
interfaces/desktop/src/lib/domains/app/overmind/feature/dashboard/OvermindDashboard.svelte
interfaces/desktop/src/lib/domains/app/overmind/feature/dashboard/OvermindFrame.svelte
interfaces/desktop/src/lib/domains/app/overmind/index.ts
interfaces/desktop/src/lib/domains/app/projects/data-access/projects.state.svelte.ts
interfaces/desktop/src/lib/domains/app/projects/feature/ProjectReferences.svelte
interfaces/desktop/src/lib/domains/app/projects/feature/ProjectSwitcher.svelte
interfaces/desktop/src/lib/domains/app/projects/index.ts
interfaces/desktop/src/lib/domains/app/ui-demo/feature/dashboard/UiDemoDashboard.svelte
interfaces/desktop/src/lib/domains/app/ui-demo/index.ts
interfaces/desktop/src/lib/domains/app/ui-demo/ui/GlassButton.svelte
interfaces/desktop/src/lib/domains/app/ui-demo/ui/GlassCard.svelte
interfaces/desktop/src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
interfaces/desktop/src/lib/domains/app/ui-demo/ui/GlassInput.svelte
interfaces/desktop/src/lib/domains/app/ui-demo/ui/GlassTypography.svelte
interfaces/desktop/src/lib/domains/app/updates/data-access/index.ts
interfaces/desktop/src/lib/domains/app/updates/data-access/updates.service.ts
interfaces/desktop/src/lib/domains/app/updates/data-access/updates.state.svelte.ts
interfaces/desktop/src/lib/domains/app/updates/index.ts
interfaces/desktop/src/lib/domains/app/updates/util/index.ts
interfaces/desktop/src/lib/domains/app/updates/util/updates.types.ts
interfaces/desktop/src/lib/domains/app/wiredfront/feature/connectorhub/pages/ConnectionHub.svelte
interfaces/desktop/src/lib/domains/app/wiredfront/feature/dashboard/WiredfrontDashboard.svelte
interfaces/desktop/src/lib/domains/app/wiredfront/feature/gallery/pages/MediaGallery.svelte
interfaces/desktop/src/lib/domains/app/wiredfront/feature/viziwizi/pages/ViziWiziDashboard.svelte
interfaces/desktop/src/lib/domains/app/wiredfront/feature/viziwizi/pages/ViziWiziEditor.svelte
interfaces/desktop/src/lib/domains/app/wiredfront/index.ts
interfaces/desktop/src/lib/domains/auth/data-access/auth.state.svelte.ts
interfaces/desktop/src/lib/domains/auth/data-access/supabase.client.ts
interfaces/desktop/src/lib/domains/auth/feature/LoginShell.svelte
interfaces/desktop/src/lib/domains/auth/index.ts
interfaces/desktop/src/lib/domains/chat/CHECKLIST.md
interfaces/desktop/src/lib/domains/chat/README.md
interfaces/desktop/src/lib/domains/chat/data-access/chat.service.ts
interfaces/desktop/src/lib/domains/chat/data-access/chat.state.svelte.ts
interfaces/desktop/src/lib/domains/chat/data-access/export.service.ts
interfaces/desktop/src/lib/domains/chat/data-access/index.ts
interfaces/desktop/src/lib/domains/chat/data-access/sessions.state.svelte.ts
interfaces/desktop/src/lib/domains/chat/data-access/suggest.state.svelte.ts
interfaces/desktop/src/lib/domains/chat/feature/ChatActionsMenu.svelte
interfaces/desktop/src/lib/domains/chat/feature/ChatComposer.svelte
interfaces/desktop/src/lib/domains/chat/feature/ChatModeSelector.svelte
interfaces/desktop/src/lib/domains/chat/feature/ChatRoot.svelte
interfaces/desktop/src/lib/domains/chat/feature/ChatSessionList.svelte
interfaces/desktop/src/lib/domains/chat/feature/ChatStream.svelte
interfaces/desktop/src/lib/domains/chat/feature/CortexMemoryStrip.svelte
interfaces/desktop/src/lib/domains/chat/feature/DecisionCard.svelte
interfaces/desktop/src/lib/domains/chat/feature/DeleteConfirmDialog.svelte
interfaces/desktop/src/lib/domains/chat/feature/ExportDialog.svelte
interfaces/desktop/src/lib/domains/chat/feature/SuggestionDropdown.svelte
interfaces/desktop/src/lib/domains/chat/feature/VoiceOrb.svelte
interfaces/desktop/src/lib/domains/chat/feature/index.ts
interfaces/desktop/src/lib/domains/chat/index.ts
interfaces/desktop/src/lib/domains/chat/ui/EmptyChatState.svelte
interfaces/desktop/src/lib/domains/chat/ui/MessageAvatar.svelte
interfaces/desktop/src/lib/domains/chat/ui/MessageBubble.svelte
interfaces/desktop/src/lib/domains/chat/ui/ModePill.svelte
interfaces/desktop/src/lib/domains/chat/ui/SessionRow.svelte
interfaces/desktop/src/lib/domains/chat/ui/StatusDotNeuron.svelte
interfaces/desktop/src/lib/domains/chat/ui/TypingIndicator.svelte
interfaces/desktop/src/lib/domains/chat/ui/index.ts
interfaces/desktop/src/lib/domains/chat/util/chat.contract.ts
interfaces/desktop/src/lib/domains/chat/util/chat.types.ts
interfaces/desktop/src/lib/domains/chat/util/format.ts
interfaces/desktop/src/lib/domains/chat/util/index.ts
interfaces/desktop/src/lib/domains/clyffy/README.md
interfaces/desktop/src/lib/domains/clyffy/index.ts
interfaces/desktop/src/lib/domains/clyffy/learning/LoadingContentCard.svelte
interfaces/desktop/src/lib/domains/clyffy/learning/learning.state.svelte.ts
interfaces/desktop/src/lib/domains/clyffy/learning/loading-content.ts
interfaces/desktop/src/lib/domains/clyffy/status/ClyffyStatusOrb.svelte
interfaces/desktop/src/lib/domains/clyffy/status/clyffy.state.svelte.ts
interfaces/desktop/src/lib/domains/clyffy/status/connection.state.svelte.ts
interfaces/desktop/src/lib/domains/clyffy/tools/ToolsBrowser.svelte
interfaces/desktop/src/lib/domains/clyffy/tools/tools.service.ts
interfaces/desktop/src/lib/domains/infra/duckdb/data-access/duckdb.state.svelte.ts
interfaces/desktop/src/lib/domains/infra/duckdb/data-access/duckdb.svc.ts
interfaces/desktop/src/lib/domains/infra/duckdb/index.ts
interfaces/desktop/src/lib/domains/infra/duckdb/util/duckdb.types.ts
interfaces/desktop/src/lib/domains/infra/libsql/data-access/libsql.state.svelte.ts
interfaces/desktop/src/lib/domains/infra/libsql/data-access/libsql.svc.ts
interfaces/desktop/src/lib/domains/infra/libsql/index.ts
interfaces/desktop/src/lib/domains/infra/libsql/util/libsql.types.ts
interfaces/desktop/src/lib/domains/infra/ollama/data-access/sidecar.state.svelte.ts
interfaces/desktop/src/lib/domains/infra/ollama/data-access/sidecar.svc.ts
interfaces/desktop/src/lib/domains/infra/ollama/index.ts
interfaces/desktop/src/lib/domains/infra/sherpa/data-access/sherpa.state.svelte.ts
interfaces/desktop/src/lib/domains/infra/sherpa/data-access/sherpa.svc.ts
interfaces/desktop/src/lib/domains/infra/sherpa/index.ts
interfaces/desktop/src/lib/domains/infra/surreal/data-access/sidecar.state.svelte.ts
interfaces/desktop/src/lib/domains/infra/surreal/data-access/sidecar.svc.ts
interfaces/desktop/src/lib/domains/infra/surreal/data-access/surreal.state.svelte.ts
interfaces/desktop/src/lib/domains/infra/surreal/data-access/surreal.svc.ts
interfaces/desktop/src/lib/domains/infra/surreal/index.ts
interfaces/desktop/src/lib/domains/infra/surreal/util/surreal.types.ts
interfaces/desktop/src/lib/domains/infra/telemetry/data-access/telemetry.state.svelte.ts
interfaces/desktop/src/lib/domains/infra/telemetry/data-access/telemetry.svc.ts
interfaces/desktop/src/lib/domains/infra/telemetry/index.ts
interfaces/desktop/src/lib/domains/infra/telemetry/util/telemetry.types.ts
interfaces/desktop/src/lib/domains/notify/index.ts
interfaces/desktop/src/lib/domains/profile/data-access/profile.state.svelte.ts
interfaces/desktop/src/lib/domains/profile/feature/EmbedderPicker.svelte
interfaces/desktop/src/lib/domains/profile/index.ts
```

## interfaces/desktop/src/lib/sys/ (87 files)
```
interfaces/desktop/src/lib/sys/ErrorOverlay.svelte
interfaces/desktop/src/lib/sys/action-bus.svelte.ts
interfaces/desktop/src/lib/sys/action-ids.ts
interfaces/desktop/src/lib/sys/activity-hud/ActivityHud.svelte
interfaces/desktop/src/lib/sys/activity-hud/DownloadPanel.svelte
interfaces/desktop/src/lib/sys/activity-hud/InstallPanel.svelte
interfaces/desktop/src/lib/sys/activity-hud/download.state.svelte.ts
interfaces/desktop/src/lib/sys/activity-hud/install.state.svelte.ts
interfaces/desktop/src/lib/sys/activity-hud/knowledge-drops.ts
interfaces/desktop/src/lib/sys/bindings/_shared/index.ts
interfaces/desktop/src/lib/sys/bindings/candle/index.ts
interfaces/desktop/src/lib/sys/bindings/chat/index.ts
interfaces/desktop/src/lib/sys/bindings/claude/index.ts
interfaces/desktop/src/lib/sys/bindings/cloud/index.ts
interfaces/desktop/src/lib/sys/bindings/credentials/index.ts
interfaces/desktop/src/lib/sys/bindings/devclyffy/index.ts
interfaces/desktop/src/lib/sys/bindings/devforge/index.ts
interfaces/desktop/src/lib/sys/bindings/devpulse/index.ts
interfaces/desktop/src/lib/sys/bindings/knowledge/index.ts
interfaces/desktop/src/lib/sys/bindings/llama-cpp-embedded/index.ts
interfaces/desktop/src/lib/sys/bindings/llama/index.ts
interfaces/desktop/src/lib/sys/bindings/models/index.ts
interfaces/desktop/src/lib/sys/bindings/ollama/index.ts
interfaces/desktop/src/lib/sys/bindings/pixvix/index.ts
interfaces/desktop/src/lib/sys/bindings/projects/index.ts
interfaces/desktop/src/lib/sys/bindings/providers/index.ts
interfaces/desktop/src/lib/sys/bindings/sherpa/index.ts
interfaces/desktop/src/lib/sys/bindings/surreal/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/action-log/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/analytics/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/boot/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/cache/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/config/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/grammar/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/guard/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/logger/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/metrics/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/project-db/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/relational/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/rro/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/scoped-log/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/telemetry/index.ts
interfaces/desktop/src/lib/sys/bindings/sys/vector/index.ts
interfaces/desktop/src/lib/sys/bindings/thinkclyffy/index.ts
interfaces/desktop/src/lib/sys/bindings/voice/index.ts
interfaces/desktop/src/lib/sys/bindings/window/index.ts
interfaces/desktop/src/lib/sys/bindings/wiredfront/index.ts
interfaces/desktop/src/lib/sys/cfg/maestro/general.ts
interfaces/desktop/src/lib/sys/data-access/rrd/phase-labels.ts
interfaces/desktop/src/lib/sys/data-access/rrd/rrd.state.svelte.ts
interfaces/desktop/src/lib/sys/data-access/rro/brain.svc.ts
interfaces/desktop/src/lib/sys/data-access/rro/encoder.svc.ts
interfaces/desktop/src/lib/sys/data-access/rro/rro.state.svelte.ts
interfaces/desktop/src/lib/sys/data-access/rro/rro.svc.ts
interfaces/desktop/src/lib/sys/data-access/rro/rro.trace.ts
interfaces/desktop/src/lib/sys/data-access/rro/rroState.svc.ts
interfaces/desktop/src/lib/sys/debug/DEBUG_FLAG.ts
interfaces/desktop/src/lib/sys/debug/index.ts
interfaces/desktop/src/lib/sys/events/capability-channel.svelte.ts
interfaces/desktop/src/lib/sys/events/index.ts
interfaces/desktop/src/lib/sys/fatal-error.svelte.ts
interfaces/desktop/src/lib/sys/generated/.gitkeep
interfaces/desktop/src/lib/sys/generated/README.md
interfaces/desktop/src/lib/sys/generated/bindings.ts
interfaces/desktop/src/lib/sys/generated/boot.types.ts
interfaces/desktop/src/lib/sys/generated/chat.types.ts
interfaces/desktop/src/lib/sys/generated/dashboard.types.ts
interfaces/desktop/src/lib/sys/generated/health.types.ts
interfaces/desktop/src/lib/sys/generated/init.types.ts
interfaces/desktop/src/lib/sys/generated/service-manifest.ts
interfaces/desktop/src/lib/sys/generated/terminology-icons.ts
interfaces/desktop/src/lib/sys/generated/terminology.ts
interfaces/desktop/src/lib/sys/index.ts
interfaces/desktop/src/lib/sys/init.ts
interfaces/desktop/src/lib/sys/logger.ts
interfaces/desktop/src/lib/sys/retry.ts
interfaces/desktop/src/lib/sys/routing/child-routes.ts
interfaces/desktop/src/lib/sys/runes/_shared.ts
interfaces/desktop/src/lib/sys/runes/global.svelte.ts
interfaces/desktop/src/lib/sys/runes/index.ts
interfaces/desktop/src/lib/sys/runes/platformState.svelte.ts
interfaces/desktop/src/lib/sys/runes/usePoll.svelte.ts
interfaces/desktop/src/lib/sys/runes/useTauriEvent.svelte.ts
interfaces/desktop/src/lib/sys/runes/useTauriQuery.svelte.ts
interfaces/desktop/src/lib/sys/streams/.gitkeep
interfaces/desktop/src/lib/sys/streams/README.md
interfaces/desktop/src/lib/sys/streams/tauri-event.svelte.ts
```

## interfaces/desktop/src/routes/ (50 files)
```
interfaces/desktop/src/routes/(app)/+error.svelte
interfaces/desktop/src/routes/(app)/+layout.svelte
interfaces/desktop/src/routes/(app)/clyffy/+page.svelte
interfaces/desktop/src/routes/(app)/devforge/+page.svelte
interfaces/desktop/src/routes/(app)/devpulse/+page.svelte
interfaces/desktop/src/routes/(app)/devpulse/community/+page.svelte
interfaces/desktop/src/routes/(app)/devpulse/models/+page.svelte
interfaces/desktop/src/routes/(app)/devpulse/projects/+page.svelte
interfaces/desktop/src/routes/(app)/devpulse/settings/+page.svelte
interfaces/desktop/src/routes/(app)/devpulse/stats/+page.svelte
interfaces/desktop/src/routes/(app)/latest/+page.svelte
interfaces/desktop/src/routes/(app)/overmind/+page.svelte
interfaces/desktop/src/routes/(app)/ui-demo/+page.svelte
interfaces/desktop/src/routes/(app)/wiredfront/+page.svelte
interfaces/desktop/src/routes/(chat)/+layout.svelte
interfaces/desktop/src/routes/(chat)/chat/+page.svelte
interfaces/desktop/src/routes/(devtools)/+layout.svelte
interfaces/desktop/src/routes/(devtools)/devtools/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/ears/streaming-asr/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/ears/sts/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/ears/stt/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/eyes/vision/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/governance/policy/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/memory/cortex/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/memory/intelligence/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/memory/persona-graph/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/mouth/tts/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/providers/claude/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/reasoning/rrd/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/clyffy/reasoning/rro/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/runtimes/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/runtimes/inference/candle/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/runtimes/inference/llama-cpp/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/runtimes/inference/ollama/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/runtimes/orchestrator/slots/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/system/caches/moka/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/system/datastores/duckdb/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/system/datastores/libsql/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/system/datastores/project-db/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/system/datastores/qdrant/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/system/datastores/surrealdb/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/system/ide/devforge/+page.svelte
interfaces/desktop/src/routes/(devtools)/devtools/system/observability/telemetry/+page.svelte
interfaces/desktop/src/routes/(devtools)/logs/+page.svelte
interfaces/desktop/src/routes/+error.svelte
interfaces/desktop/src/routes/+layout.svelte
interfaces/desktop/src/routes/+layout.ts
interfaces/desktop/src/routes/+page.svelte
interfaces/desktop/src/routes/+page.ts
interfaces/desktop/src/routes/profile/+page.svelte
```

## Bucket directories under src (find, Step 2 targets)
```
lib/design/behaviors/_internal(/utils)  lib/design/behaviors/_shared  lib/design/utils
lib/devtools/_shared  lib/devtools/clyffy/reasoning/_shared  lib/devtools/system/datastores/_shared
lib/sys/bindings/_shared  (.cowlevel/typedoc/utils = vendored docs, excluded)
```

## Emitted-layer location (Step 1.5)

Runtime CSS emitted under `src/lib/design/styles/` (primitives/, semantic/, components/components.generated.css) imported via app.css → design/index.css → styles/index.css. Byte-dup at `src/lib/design/theme/spacing.css` (liveness UNVERIFIED).

# Census Step 2 — design-tier buckets (behaviors/_shared, behaviors/_internal, design/utils)

All files read IN FULL this session (2026-07-14). No file exceeded 500 LOC; no chunking needed.

## Bucket: `lib/design/behaviors/_shared/` (9 families + barrel, 31 files, ~830 LOC)

Barrel `index.ts:1-23` exports all nine families grouped as Overlay/Selection/Navigation/Search/Announcement patterns.

| Module | Exports | Capabilities (file:line) |
| --- | --- | --- |
| focus-trap/focus-trap.svelte.ts | `useFocusTrap(config)` | 15-item FOCUSABLE_SELECTOR (:16-32); visibility filter (:40-42); initialFocus → [autofocus] → first focusable → container tabindex=-1 fallback (:53-71); Tab/Shift+Tab wrap (:88-98); restoreFocus on cleanup w/ isConnected guard (:105-107); `contain:false` opt-out (:74) |
| roving-focus/roving-focus.svelte.ts | `createRovingHandler` AND `useRovingFocus` | **TWO implementations in one file.** createRovingHandler (:43-71): RTL-aware PER KEYSTROKE via `config.dir?.() ?? getDocumentDir()` (:49), consolidated 2026-07-11 per header (:20-22), container/item selector based, focus-element indexed (:65). useRovingFocus (:73-126): $effect-based, `dir` default hardcoded "ltr" (:75), own key computation (:100-118), valueAttr/disabledAttr config, onActiveChange callback. INTERNAL DUPLICATE of the same APG pattern. |
| active-descendant/active-descendant.svelte.ts | `useActiveDescendant` | aria-activedescendant highlight model, $state highlightedId (:20); arrows/home/end/enter (:56-73); scrollIntoView nearest (:40); returns getter + highlightFirst/Last/clear (:80-95) |
| dismiss-layer/dismiss-layer.svelte.ts | `useDismissLayer` | module-level `layerStack: Set<symbol>` (:12); top-layer-only dismissal (:22-25); pointerdown/up capture-phase pair (:70-71); text-selection guard (:54-58); child `dialog[open]` guard (:60-64) |
| escape-layer/escape-layer.svelte.ts | `useEscapeLayer` | module-level `escapeStack` (:11); top-layer-only Escape (:24-25); preventDefault+stopPropagation (:27-28) |
| live-region/live-region.ts | `announce`, `useLiveRegion` | TWO persistent module-level regions polite+assertive (:14-15); role=status/alert semantics (:24); rAF re-set for re-announcement (:39-41); isConnected re-create guard (:19) |
| presence/presence.svelte.ts | `usePresence` | waits transitionend/animationend before present=false (:48-49); computed-style detection (:31-33); once:true + manual cleanup both (:48-54) |
| scroll-lock/scroll-lock.svelte.ts | `useScrollLock` | ref-counted ScrollLocker class (:15-55); iOS position:fixed workaround (:28-33); scrollbar-width padding compensation (:36); cssText save/restore (:25,46) |
| typeahead/typeahead.ts | `useTypeahead` | buffer + 500ms default timeout (:13); case-insensitive startsWith (:44-45); wrap-around search from active anchor (:42-49); single-char advance offset (:43) |

Per-family `types.ts` + `index.ts` files read; types-only, no logic.

## Bucket: `lib/design/behaviors/_internal/utils/` (4 files, ~114 LOC)

| Module | Exports | Notes |
| --- | --- | --- |
| kbd.ts | `kbd` const map, `KbdKey`, `Direction`, `Orientation`, `getNextKey`, `getPrevKey` | APG keyboard constants; RTL/orientation-aware next/prev key resolution (:30-51) |
| data-attr.ts | `dataAttr` (3 overloads), `disabledAttr` | true→"" / false→undefined convention (:16-20); aria-disabled uses boolean true (:23-25) |
| uid.ts | `uid`, `createIds`, `resetIdCounter` | monotonic counter; `{kind}-{part}-{instance}` scheme (:19-29); test-only reset (:32-34) |
| index.ts | barrel re-exports all of the above | |

## Bucket: `lib/design/utils/` (44 files, ~1000 LOC)

Barrel `index.ts` (86 lines) exports: ariaAnnounce, useAspectRatio, box, center, clamp family (clampFluid/clampValue/FLUID_SPACE/FLUID_SIZE/FLUID_PADDING), cn, container, useDivider, flex, gridLayout, hstack, idGen/idGenPair, slotMerge, useSpacer, stack, useSticky, tokenResolve, useVisuallyHidden.

| Module | Exports | Capabilities |
| --- | --- | --- |
| ariaAnnounce.ts | `ariaAnnounce(message, priority)` | SINGLE module-level region; mutates aria-live attr per call (:23); forced reflow via offsetHeight (:26); NO role attribute |
| idGen.ts | `idGen`, `idGenPair` | monotonic counter; trigger/content pair helper (:14-17) |
| cn.ts | `cn`, `BaseProps`, re-export ClassValue | clsx wrapper |
| slotMerge.ts | `slotMerge(kind, slot, className, rest)` | builds data-kind/data-slot spread |
| tokenResolve.ts | `tokenResolve(...path)` | `var(--{path.join('-')})` string builder |
| clamp/clamp.ts | `clampValue`, `clampFluid`, FLUID_SPACE (10 presets), FLUID_SIZE (5), FLUID_PADDING (8) + CSS-property types | **VIEWPORT-based fluid: `100vw` in preferred expression (:47) — NOT cqi/container-based**; linear interpolation 320→1536px defaults (:41-42) |
| box / center / container / flex / grid-layout / hstack / stack | plain functions returning Tailwind class strings | token-backed via `--space-*`/`--size-*` arbitrary values |
| aspect-ratio / divider / spacer / sticky / visually-hidden | `use*` hooks returning objects | divider carries ARIA attrs (:31-33); sticky uses `--z-index-*` |

### Bucket-internal facts (recorded, zero proposals)

- F1. **Announcement duplicate**: behaviors/_shared/live-region (announce/useLiveRegion) vs utils/ariaAnnounce — same concern, different capability sets (dual persistent regions + role semantics + rAF vs single mutated region + reflow trick).
- F2. **ID-generation duplicate**: _internal/utils/uid (uid/createIds/resetIdCounter, `{kind}-{part}-{instance}`) vs utils/idGen (idGen/idGenPair, `{prefix}-{n}` + pair). Two monotonic counters, two schemes.
- F3. **Layout-builder triplication**: flex() (:use-flex.ts:42-56) vs hstack() (:use-hstack.ts:35-44) vs stack() (:use-stack.ts:35-43) — hstack ≡ flex({direction:row}) minus padding, plus wrap boolean; stack ≡ flex({direction:column}) minus wrap/padding. Three parallel class-builders for one concern.
- F4. **Internal duplicate in roving-focus**: createRovingHandler vs useRovingFocus (see table) — the 2026-07-11 consolidation landed BESIDE the thing it consolidated, not replacing it.
- F5. **Naming drift inside utils/**: files named `use-*.ts` export NON-hook plain functions (box, center, container, flex, gridLayout, hstack, stack); true hooks return objects with INCONSISTENT keys — `classes` (aspect-ratio :31, divider :29, spacer :20) vs `className` (sticky :19, visually-hidden :15). Param naming split: `priority` (ariaAnnounce :21) vs `politeness` (live-region :36).
- F6. **Fluid sizing authority conflict candidate**: utils/clamp is 100vw-viewport-based while the ColdLight directive (shell-anchored, container-fluid cqi) is container-based. Recorded as fact for Step 5 cross-check; consumers mapped in Step 3.
- F7. behaviors/_shared/index.ts:1-23 barrel — a BUCKET barrel (boundary rule 4 relevance; destination decided in rulings, not here).
- F8. `lib/sys/bindings/_shared/index.ts` (16 lines): re-exports 4 types (ChatMessage, CommandError, ProviderId, Result) from generated bindings; header says "shared bindings primitives that cross every domain".

## CLAUDE.md vocabulary conflict (recorded during reads)

- `src/lib/design/CLAUDE.md` says behavior layer = `primitives/{kind}/` ("Primitives — Pure behavior. WAI-ARIA APG"), while `src/lib/design/.claude/CLAUDE.md` says behavior layer = `behaviors/{kind}/` and bans `.svelte` in primitives. The tree has BOTH `design/primitives/` (with `_archive`, per biome excludes) AND `design/behaviors/`. Doc-vs-doc conflict, recorded as fact.

# Census Step 2 — devtools-tier buckets + sys/bindings (all files read IN FULL, 2026-07-14)

ServiceDevtoolShell.svelte (507 LOC) read in TWO chunks (1-260, 260-508) per CC-004. All others single-read.

## Bucket: `lib/devtools/_shared/` (17 files, ~2900 LOC)

| Module | Exports/role | Capabilities + notable facts (file:line) |
| --- | --- | --- |
| ServiceDevtoolShell.svelte (507) | THE 5-tab devtool chrome | Snippet-driven tabs, tab omitted when snippet absent (:207-215); Ctrl/Cmd+1..N (:228-235); capture Copy/Export w/ 256KiB guard (:239-278); `--accent-service-*` scoping via serviceAccentStyle (:283, :299); BackgroundScene backdrop opt-in (:302-310); health dot map hardcoded to signal vars (:285-292). ARIA deviation: `role="tab"`+`aria-selected` on buttons but NO `role="tablist"` on nav, NO `role="tabpanel"` on main (:406-471) — does NOT compose design/components/tabs. Hardcoded English chrome ("Back to devtools" :317, tab labels :209-213, Copy/Export/Copied :373-398). Sizing: `h-full` root (:298), fixed `h-10` header (:313), `flex-1` main + p-4 (:457); zero cqi. |
| serviceAccents.ts (318) | BrandAccent (16 names), DEFAULT_SERVICE_ACCENT, SERVICE_ACCENTS (24 ids), serviceAccent(), ServiceBackdrop, SERVICE_BACKDROPS (24 ids), serviceBackdrop(), accentToBackdropPalette(), serviceAccentStyle() | Manual mirror of accent.tokens.json names (:54-70 — sync comment :52); id keys MUST match registry.ts DevtoolMeta.id (:16-19); `cortex` id still present (:136, :241); accent→BG palette collapse map (:272-300). |
| types.ts (72) | ServiceAxis, HealthState, HealthBadge, CapturePayload, ExtraTab | ServiceAxis = runtime/stores/runtimes/capabilities/integrations (:14). |
| README.md (126) | golden-pattern playbook | 5-tab schema table (:16-22); shipped-primitive table (:26-41); adapter table (:48-56) declaring ScopedLogPanel **DEPRECATED** (:56); migration-status table (:99-107) — 5 devtools still on deprecated ScopedLogPanel; claims tabs are "WAI-ARIA APG-validated" (:10) — contradicted by shell's missing tablist/tabpanel roles. |
| DevtoolLogsTab.svelte (157) | Logs-tab body | Composes design Tabs (real tablist) + TauriQuery + queryScopedLog (:66-68); level→color map (:80-93); EmptyState no-data (:122-131); supersedes ScopedLogPanel (header :13-15). |
| ScopedLogPanel.svelte (115) | single-target log tail | DEPRECATED per README:56; own load() state mgmt (:50-62) — duplicate concern vs DevtoolLogsTab/TauriQuery ("Always pass a query, never raw state" README:79 violated by its own sibling). |
| CommandErrorAlert.svelte (113) | CommandError→Alert+Badge adapter | 13-kind label+variant maps (:40-70); string shim documented migration-only (:18-20). |
| DevtoolRefreshButton.svelte (44) | query-bound refresh | TauriQuery/PolledQuery consumer (:22). |
| DevtoolBentoGrid.svelte (57) | 2/3/4-col bento grid | Tailwind sm:/lg: VIEWPORT breakpoints (:47-49) — S1-FLUID spec:573-575 says zone content must respond to container, viewport variants = drift. Overlaps concern of design/utils gridLayout(). |
| DevtoolBentoTile.svelte (47) | Card preset="glass" + col-span | sm:/lg: viewport spans (:37-42). |
| LiveSubsystemStrip.svelte (412) | dashboard live-subsystems strip | Domain composer (modelsState, rroState) over design SubsystemTile block (:19-28 header explains placement rationale); cortex vocabulary throughout (:96-126 cortexState, tile label "Cortex" route /devtools/clyffy/memory/cortex :332-340); slotState() maps slot+status→tone (:46-82); rro verbs Gather/Purge/Fork (:295-320); grid `repeat(auto-fit, minmax(16rem, 1fr))` static rem (:407-410); hardcoded English everywhere (labels/blurbs/status strings). `window.location.assign` hard nav (:211). |
| RepoDownloadButton.svelte (381) | 1-click HF repo→slot install | Raw `invoke()` calls NOT generated bindings (:44, :111, :117, :172, :189); local RepoFile type pending regen (resolve-primary-file.ts:26-30); stage machine idle/listing/confirming/starting/done/error (:93); modal `role="dialog" aria-modal` with NO focus trap / NO escape-layer / NO dismiss-layer composition (:255-262) — behaviors/_shared unused here. |
| HfSearchDialog.svelte (204) | slot-scoped HF search modal | Debounced search (:51-85); Escape via own onkeydown (:87-92) NOT useEscapeLayer; `role="dialog" aria-modal` no focus trap (:104-113); raw `<input>` + `<select>`-style native elements w/ inline style rather than design Input (:135-142). |
| SwapPrimaryBrainButton.svelte (161) | slot swap w/ overlay | swapSlotModel via generated commands (:83); full-viewport fixed overlay `role="alertdialog"` (:145-151) no focus trap; toast via dynamic svelte-sonner import (:94). |
| resolve-primary-file.ts (130) | pure primary-file heuristic | 5-rule GGUF/safetensors resolution (:51-115); formatBytes (:118-123) — DUPLICATE of ServiceDevtoolShell.formatBytes (:246-250, B/KiB/MiB variant) — two byte formatters in the same folder. |
| voice-contracts.ts (22) | re-export 7 voice types from generated bindings | IP-boundary compliant re-export pattern (:10-11). |
| voice-selection.state.svelte.ts (19) | cross-devtool selected-voice rune | class w/ $state fields, singleton export (:11-19). |

## Bucket: `lib/devtools/clyffy/reasoning/_shared/` (2 files, 503 LOC)

- index.ts (13): barrel; header declares itself "the ONLY _shared allowed under reasoning/" (:6-9) — bucket self-ratification text.
- ReasoningTopology.svelte (490): RRO 4-node SVG topology. **Scoped `@keyframes particle-flow` (:464-479)** — universal-effects law violation. Raw values in scoped CSS: `border-radius: 12px` (:368), `border: 1px solid` (:370), `backdrop-filter: blur(6px)` (:371), `border-radius: 8px` (:403), `outline: 1px` (:421), `translateX(var(--travel-x, 100px))` (:476) — contradicts its own header claim "no raw hex, no raw px in layout" (:27). Phase-substring tone matching mirroring RrdDevtool:66 (:105-115). rrdState consumer (:52, :70-73).

## Bucket: `lib/devtools/system/datastores/_shared/` (5 files, ~560 LOC)

- index.ts (20): barrel; same "ONLY _shared allowed under system/datastores/" self-ratification (:11-14).
- EmptyStatePoster.svelte (116): empty-state w/ logTarget diagnostic pointer (devtools-are-diagnostics rule cited in header :10-12); accentVar string-prop pattern `--accent-gold-main` passed as raw string (:44-46); raw `1px` borders (:91, :114). OVERLAPPING CONCERN with design/components/empty-state (README devtools/_shared:36 says use design EmptyState).
- HealthSignal.svelte (111): **scoped `@keyframes breathing` + `@keyframes pulse-fast` (:93-100)** — universal-effects violations (has reduced-motion guard :106-110). Header admits it replaces a pattern "the existing DuckDB / libSQL / SurrealDB devtools render six different ways" (:6-8). OVERLAPPING CONCERN with design/components/status-dot (StatusDot) AND ServiceDevtoolShell's inline health dot (:285-292, :350-354) — ≥3 health-dot implementations.
- LiveActivityPulse.svelte (126): tick-counter blip; `Date.now()` in $effect (:53) + setTimeout decay (:57-59); accentVar raw-string pattern.
- StoreHeroCard.svelte (189): hero card w/ accent stripe; raw `1px` borders (:126, :159, :187); accentVar contract doc (:20-30) admits bare hue names "silently fall to the fallback".

## Bucket: `lib/sys/bindings/_shared/` (1 file, 16 LOC)

- index.ts: re-exports ChatMessage, CommandError, ProviderId, Result from generated bindings; "canonical re-export to avoid ad-hoc cross-domain imports" (:6-9).

## Cross-bucket duplicate/overlap facts (recorded; destinations = rulings pass)

- D1. formatBytes ×2 in devtools/_shared: resolve-primary-file.ts:118-123 (B/KB/MB/GB) vs ServiceDevtoolShell.svelte:246-250 (B/KiB/MiB) — different unit bases.
- D2. Health-dot visual language ×≥3: HealthSignal (datastores/_shared), design/components/status-dot (consumed by ReasoningTopology:50), ServiceDevtoolShell inline healthDotColor map. Plus SubsystemTile's own tones (design/blocks/devtools, not read this pass — Step 4 target).
- D3. Log-tail panel ×2: ScopedLogPanel (deprecated) vs DevtoolLogsTab; 5 devtools still on deprecated one (README:99-107).
- D4. Modal/dialog pattern hand-rolled ×3 (RepoDownloadButton, HfSearchDialog, SwapPrimaryBrainButton) with zero composition of behaviors/_shared focus-trap/escape-layer/dismiss-layer/scroll-lock — the behavior bucket's overlay stack has no consumer in these overlays.
- D5. Empty-state ×2: EmptyStatePoster vs design/components/empty-state.
- D6. Grid layout ×3 concern: DevtoolBentoGrid (viewport breakpoints) vs design/utils gridLayout() vs raw grid CSS in strips/pages.
- D7. Scoped @keyframes in buckets: ReasoningTopology (particle-flow), HealthSignal (breathing, pulse-fast) — vs keyframes SSOT law.
- D8. Byte/latency formatters: HealthSignal.fmtLatency (:38-42) — no other latency formatter seen yet; Step 4 sweep to confirm.
- D9. Raw invoke() vs generated bindings: RepoDownloadButton uses `invoke("list_repo_files"|"recommend_primary_for_slot"|"install_to_slot"|"download_model")` while sibling modules use generated `commands.*` — two IPC idioms in one bucket.

## Creation commits (git log --follow, first commit per bucket file)
```
lib/design/behaviors/_internal/utils/data-attr.ts | cb87c4c5 2026-03-16 wtf
lib/design/behaviors/_internal/utils/index.ts | cb87c4c5 2026-03-16 wtf
lib/design/behaviors/_internal/utils/kbd.ts | cb87c4c5 2026-03-16 wtf
lib/design/behaviors/_internal/utils/uid.ts | cb87c4c5 2026-03-16 wtf
lib/design/behaviors/_shared/active-descendant/active-descendant.svelte.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/active-descendant/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/active-descendant/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/dismiss-layer/dismiss-layer.svelte.ts | db047d5a 2026-02-04 feat(coldlight): adding primitives removing bad documentation
lib/design/behaviors/_shared/dismiss-layer/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/dismiss-layer/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/escape-layer/escape-layer.svelte.ts | db047d5a 2026-02-04 feat(coldlight): adding primitives removing bad documentation
lib/design/behaviors/_shared/escape-layer/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/escape-layer/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/focus-trap/focus-trap.svelte.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/focus-trap/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/focus-trap/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/index.ts | cb87c4c5 2026-03-16 wtf
lib/design/behaviors/_shared/live-region/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/live-region/live-region.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/live-region/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/presence/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/presence/presence.svelte.ts | db047d5a 2026-02-04 feat(coldlight): adding primitives removing bad documentation
lib/design/behaviors/_shared/presence/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/roving-focus/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/roving-focus/roving-focus.svelte.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/roving-focus/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/scroll-lock/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/scroll-lock/scroll-lock.svelte.ts | db047d5a 2026-02-04 feat(coldlight): adding primitives removing bad documentation
lib/design/behaviors/_shared/scroll-lock/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/typeahead/index.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/typeahead/typeahead.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/behaviors/_shared/typeahead/types.ts | fd7ddea8 2026-03-16 a11y foundation
lib/design/utils/ariaAnnounce.ts | 65037819 2026-02-24 feat: add 10 Svelte actions + 8 utility functions
lib/design/utils/aspect-ratio/aspect-ratio.types.ts | a9264bab 2026-03-20 go
lib/design/utils/aspect-ratio/index.ts | a9264bab 2026-03-20 go
lib/design/utils/aspect-ratio/use-aspect-ratio.ts | a9264bab 2026-03-20 go
lib/design/utils/box/box.types.ts | a9264bab 2026-03-20 go
lib/design/utils/box/index.ts | a9264bab 2026-03-20 go
lib/design/utils/box/use-box.ts | a9264bab 2026-03-20 go
lib/design/utils/center/center.types.ts | a9264bab 2026-03-20 go
lib/design/utils/center/index.ts | a9264bab 2026-03-20 go
lib/design/utils/center/use-center.ts | a9264bab 2026-03-20 go
lib/design/utils/clamp/clamp.ts | a9264bab 2026-03-20 go
lib/design/utils/clamp/index.ts | a9264bab 2026-03-20 go
lib/design/utils/cn.ts | 65037819 2026-02-24 feat: add 10 Svelte actions + 8 utility functions
lib/design/utils/container/container.types.ts | a9264bab 2026-03-20 go
lib/design/utils/container/index.ts | a9264bab 2026-03-20 go
lib/design/utils/container/use-container.ts | a9264bab 2026-03-20 go
lib/design/utils/divider/divider.types.ts | a9264bab 2026-03-20 go
lib/design/utils/divider/index.ts | a9264bab 2026-03-20 go
lib/design/utils/divider/use-divider.ts | a9264bab 2026-03-20 go
lib/design/utils/flex/flex.types.ts | a9264bab 2026-03-20 go
lib/design/utils/flex/index.ts | a9264bab 2026-03-20 go
lib/design/utils/flex/use-flex.ts | a9264bab 2026-03-20 go
lib/design/utils/grid-layout/grid-layout.types.ts | a9264bab 2026-03-20 go
lib/design/utils/grid-layout/index.ts | a9264bab 2026-03-20 go
lib/design/utils/grid-layout/use-grid-layout.ts | a9264bab 2026-03-20 go
lib/design/utils/hstack/hstack.types.ts | a9264bab 2026-03-20 go
lib/design/utils/hstack/index.ts | a9264bab 2026-03-20 go
lib/design/utils/hstack/use-hstack.ts | a9264bab 2026-03-20 go
lib/design/utils/idGen.ts | 65037819 2026-02-24 feat: add 10 Svelte actions + 8 utility functions
lib/design/utils/index.ts | 65037819 2026-02-24 feat: add 10 Svelte actions + 8 utility functions
lib/design/utils/slotMerge.ts | 65037819 2026-02-24 feat: add 10 Svelte actions + 8 utility functions
lib/design/utils/spacer/index.ts | a9264bab 2026-03-20 go
lib/design/utils/spacer/spacer.types.ts | a9264bab 2026-03-20 go
lib/design/utils/spacer/use-spacer.ts | a9264bab 2026-03-20 go
lib/design/utils/stack/index.ts | a9264bab 2026-03-20 go
lib/design/utils/stack/stack.types.ts | a9264bab 2026-03-20 go
lib/design/utils/stack/use-stack.ts | a9264bab 2026-03-20 go
lib/design/utils/sticky/index.ts | a9264bab 2026-03-20 go
lib/design/utils/sticky/sticky.types.ts | a9264bab 2026-03-20 go
lib/design/utils/sticky/use-sticky.ts | a9264bab 2026-03-20 go
lib/design/utils/tokenResolve.ts | 65037819 2026-02-24 feat: add 10 Svelte actions + 8 utility functions
lib/design/utils/visually-hidden/index.ts | a9264bab 2026-03-20 go
lib/design/utils/visually-hidden/use-visually-hidden.ts | a9264bab 2026-03-20 go
lib/design/utils/visually-hidden/visually-hidden.types.ts | a9264bab 2026-03-20 go
lib/devtools/_shared/CommandErrorAlert.svelte | fb0945fb 2026-04-25 feat(coldlight): devtool primitive components + library convention (F-3)
lib/devtools/_shared/DevtoolBentoGrid.svelte | fa80bb10 2026-04-26 feat(coldlight): devtool golden pattern — shipped primitives + bento + cosmic backdrop
lib/devtools/_shared/DevtoolBentoTile.svelte | fa80bb10 2026-04-26 feat(coldlight): devtool golden pattern — shipped primitives + bento + cosmic backdrop
lib/devtools/_shared/DevtoolLogsTab.svelte | fb0945fb 2026-04-25 feat(coldlight): devtool primitive components + library convention (F-3)
lib/devtools/_shared/DevtoolRefreshButton.svelte | fb0945fb 2026-04-25 feat(coldlight): devtool primitive components + library convention (F-3)
lib/devtools/_shared/HfSearchDialog.svelte | d117ea47 2026-05-05 feat(desktop): per-slot install entry point — HfSearchDialog
lib/devtools/_shared/LiveSubsystemStrip.svelte | 3cacfe68 2026-05-14 feat(desktop): LiveSubsystemStrip on devtools dashboard
lib/devtools/_shared/README.md | fb0945fb 2026-04-25 feat(coldlight): devtool primitive components + library convention (F-3)
lib/devtools/_shared/RepoDownloadButton.svelte | 8a0ff81a 2026-04-22 chore(devpulse): rro state panel + biome batch 3 + rust fmt
lib/devtools/_shared/resolve-primary-file.ts | 8a0ff81a 2026-04-22 chore(devpulse): rro state panel + biome batch 3 + rust fmt
lib/devtools/_shared/ScopedLogPanel.svelte | 74ee5cb3 2026-04-24 feat(desktop): devtool cleanup pass — no more stub Actions, live logs, Planned section
lib/devtools/_shared/serviceAccents.ts | ac37402f 2026-04-24 feat(coldlight): per-devtool accent registry + ServiceDevtoolShell accent prop
lib/devtools/_shared/ServiceDevtoolShell.svelte | cda3aefc 2026-04-21 chore: biome alignment + lefthook/vscode wiring + accumulated platform work
lib/devtools/_shared/SwapPrimaryBrainButton.svelte | 049b21fe 2026-04-21 refactor: extract rro devtool into $lib/domains/sys/rro + biome batch 2
lib/devtools/_shared/types.ts | cda3aefc 2026-04-21 chore: biome alignment + lefthook/vscode wiring + accumulated platform work
lib/devtools/_shared/voice-contracts.ts | c77e4e78 2026-05-09 refactor(desktop): absorb voice lab surfaces into stt/sts/tts devtools
lib/devtools/_shared/voice-selection.state.svelte.ts | c77e4e78 2026-05-09 refactor(desktop): absorb voice lab surfaces into stt/sts/tts devtools
lib/devtools/clyffy/reasoning/_shared/index.ts | 14110893 2026-05-10 feat(desktop): RRD reasoning topology + swap dialog + shared overview
lib/devtools/clyffy/reasoning/_shared/ReasoningTopology.svelte | 14110893 2026-05-10 feat(desktop): RRD reasoning topology + swap dialog + shared overview
lib/devtools/system/datastores/_shared/EmptyStatePoster.svelte | 7bbac7b8 2026-05-11 feat(desktop): shared visual primitives for datastore devtools
lib/devtools/system/datastores/_shared/HealthSignal.svelte | 7bbac7b8 2026-05-11 feat(desktop): shared visual primitives for datastore devtools
lib/devtools/system/datastores/_shared/index.ts | 7bbac7b8 2026-05-11 feat(desktop): shared visual primitives for datastore devtools
lib/devtools/system/datastores/_shared/LiveActivityPulse.svelte | 7bbac7b8 2026-05-11 feat(desktop): shared visual primitives for datastore devtools
lib/devtools/system/datastores/_shared/StoreHeroCard.svelte | 7bbac7b8 2026-05-11 feat(desktop): shared visual primitives for datastore devtools
lib/sys/bindings/_shared/index.ts | 9551cf5d 2026-04-25 feat(xtask): tee dev-server stdio + frontend global error capture (F-4)
```

# Census Step 3 — Importer map (multi-class per CC-007)

Search classes run: (a) path-fragment grep incl. `$lib/` + relative forms, (b) symbol-name
grep, (c) barrel chains read directly, (d) type-only imports included in (a)/(b) patterns,
(e) tests/mocks included via *.ts glob, (f) config files (*.json/*.mjs) included in sweep.
Raw lists: scratchpad `importers-*.txt` (this session).

| Bucket | Refs | Files | Notes |
| --- | --- | --- | --- |
| `behaviors/_shared` ($lib form) | 1 | 1 | SOLE $lib-form importer: `domains/chat/data-access/chat.state.svelte.ts:6` (`announce`) — a domain reaching into a design bucket directly |
| `behaviors/_shared` (relative `../../_shared/` form) | consumers per family below | | behaviors/{category}/{kind} hooks import via relative paths — the first sweep missed these until symbol-level pass (CC-007 vindicated) |
| `_internal/utils` | 121 | 60 | kbd/dataAttr/uid heavily consumed across behaviors tier |
| `design/utils` | 265 | 240 | dominated by `cn` imports |
| `devtools/_shared` | 21 | 18 | |
| `reasoning/_shared` | 2 | 2 | RRD + RRO devtools |
| `datastores/_shared` | 8 | 8 | |
| `sys/bindings/_shared` | 8 | 7 | |

## Per-symbol consumers (outside the defining bucket)

| Symbol | Consumer files | Status |
| --- | --- | --- |
| useFocusTrap | 2 | live |
| createRovingHandler | 4 | live (the 2026-07-11 consolidation) |
| useRovingFocus | **0** | **DEAD — the pre-consolidation duplicate it was meant to replace** |
| useActiveDescendant | **0** | **DEAD** |
| useDismissLayer | 6 | live |
| useEscapeLayer | 4 | live |
| useLiveRegion | **0** | DEAD (but `announce` live: behaviors/display/progress/use-progress.svelte.ts:58 + domains/chat/data-access/chat.state.svelte.ts:118,149,154) |
| usePresence | 7 | live |
| useScrollLock | 3 | live |
| useTypeahead | 2 | live |
| ariaAnnounce (utils) | **0** | **DEAD duplicate of announce** |
| idGen/idGenPair | 1 (design/blocks/factory.ts) | near-dead duplicate of uid/createIds |
| clampFluid/clampValue/FLUID_SPACE/FLUID_SIZE/FLUID_PADDING | **0** | **DEAD — entire fluid-preset module unconsumed** (matches 01-rulings.md:158,400 keep-deferred) |
| tokenResolve | **0** | DEAD |
| slotMerge | **0** | DEAD |

# Census Step 4 — Duplicate hunt (whole tree)

## Confirmed duplicate/parallel implementations

| # | Concern | Copy A | Copy B(+) | Capability diff (facts) |
| --- | --- | --- | --- | --- |
| 1 | SR announcement | behaviors/_shared/live-region/live-region.ts (dual persistent regions, role=status/alert, rAF re-set) | design/utils/ariaAnnounce.ts (single mutated region, forced reflow, no role) | A: politeness-per-region + role semantics; B: reflow trick. B has 0 consumers |
| 2 | ID generation | behaviors/_internal/utils/uid.ts (`uid`, `createIds` kind-part-instance, `resetIdCounter`) | design/utils/idGen.ts (`idGen`, `idGenPair` trigger/content) | A: multi-part + test reset; B: pair helper. B has 1 consumer |
| 3 | Roving keyboard nav (INTERNAL, same file) | roving-focus.svelte.ts `createRovingHandler` (:43-71, RTL-aware per keystroke via getDocumentDir) | same file `useRovingFocus` (:73-126, hardcoded "ltr" default, own key math) | consolidation landed BESIDE its target; old impl now 0-consumer dead code |
| 4 | Flex layout class-builders | utils/flex/use-flex.ts `flex()` | utils/hstack `hstack()` + utils/stack `stack()` | hstack ≡ flex({direction:row}) − padding + wrap:boolean; stack ≡ flex({direction:column}) − wrap/padding |
| 5 | Wizard/devtools component copies | domains/app/models/feature/setup-wizard/ui/{AnatomyTile,SaveSlotCard,AnatomyConstellation}.svelte | lib/devtools/runtimes/orchestrator/slots/ui/{same three} | per coldlight-fubar-audit.md:70 wizard copies migrated to cqi; devtools copies still vw (this pass verified existence of all 6 files) |
| 6 | Byte formatter | devtools/_shared/resolve-primary-file.ts formatBytes (:118-123, KB/MB/GB) | devtools/_shared/ServiceDevtoolShell.svelte formatBytes (:246-250, KiB/MiB) | different unit bases IN THE SAME FOLDER |
| 7 | Health-dot visual language | datastores/_shared/HealthSignal.svelte (scoped keyframes) | design/components/status-dot StatusDot; ServiceDevtoolShell inline healthDotColor map (:285-292) | ≥3 implementations; HealthSignal header itself documents "six different ways" prior state |
| 8 | Log-tail panel | devtools/_shared/DevtoolLogsTab.svelte | devtools/_shared/ScopedLogPanel.svelte (deprecated per README:56; 5 devtools still consume per README:99-107) | LogsTab: multi-target Tabs + TauriQuery; Panel: hand-rolled load state |
| 9 | Empty state | design/components/empty-state | datastores/_shared/EmptyStatePoster.svelte | Poster adds logTarget diagnostic pointer + accentVar string prop |
| 10 | Grid layout | design/utils gridLayout() | devtools/_shared/DevtoolBentoGrid.svelte (viewport sm:/lg: breakpoints — S1-FLUID:573-575 calls viewport variants in zone content drift) | plus raw grid CSS in LiveSubsystemStrip:407-410 |
| 11 | Escape handling | behaviors/_shared/escape-layer (stacked, top-layer-only; 4 consumers) | 14 files hand-roll `key === "Escape"`: use-tooltip, SubsystemTile, KnowledgeTerm, DatePickerContent, DateRangePickerContent, MenubarContent, NavigationMenuContent+Trigger, HfSearchDialog, SwapDialog (rrd), SlotsDevtool, ModelDownloaderOverlay, ChatComposer, TopBar | hand-rolled versions have no layer stacking — nested-overlay close order unguaranteed |
| 12 | Modal overlay pattern | behaviors/_shared focus-trap/dismiss-layer/escape-layer/scroll-lock stack | RepoDownloadButton (:255-262), HfSearchDialog (:104-113), SwapPrimaryBrainButton (:145-151) hand-roll `role="dialog"/"alertdialog"` with NO trap/dismiss/scroll-lock | keyboard user can Tab out of these modals; no dismiss layering |
| 13 | Accent var-name computation outside token pipeline | tokens emit `--accent-{name}-{main,glow,fill}` | 11 files template-construct accent var names: serviceAccents.ts (+serviceAccentStyle), SubsystemTile, Section, EngineFoundationCard, both AnatomyTile+SaveSlotCard copies, EmptyStatePoster/LiveActivityPulse/StoreHeroCard accentVar string props | cssvars audit: bare `--accent-` consumed-but-undefined in SubsystemTile/Section/DevPulseDashboard (template split) |
| 14 | Scoped @keyframes vs keyframes SSOT | generated/keyframes.css (SSOT, `cl-*`) | ReasoningTopology `particle-flow` (:464-479); HealthSignal `breathing`+`pulse-fast` (:93-100) | universal-effects law: component @keyframes = 0 |
| 15 | IPC idioms | generated `commands.*` (typed) | RepoDownloadButton raw `invoke()` ×4 (:111,117,172,189) | same bucket, two idioms; local RepoFile type pending regen |
| 16 | Viewport-fluid vs container-fluid authority | utils/clamp clampFluid = 100vw-based (:47) | SD5 spacing tokens = cqi-based; typography larger sizes = vw; xs/sm/2xs = CONSTANTS | three fluidity regimes coexist (see sizing audit, 11-route-truth-audit.md §sizing) |

## Cleared concerns (no duplicates found)

- Body scroll-lock: ZERO ad-hoc `document.body.style` manipulation outside scroll-lock.
- aria-live region creation: exactly the 2 known implementations (dup #1), no third.
- `attachments/` focus logic (2026-07 known suspect): NO `attachments/` directory exists under src (bucket enumeration, Step 1) — cleared.
- Typeahead: no parallel implementation found outside behaviors/_shared.

# Census Step 5 — Token-alignment audits (read-only, run 2026-07-14)

Commands: `pnpm audit:cssvars`, `pnpm audit:color`, `pnpm audit:presetmap` (raw outputs
appended at document end).

- **cssvars**: defined 3363 · consumed 461 · **UNDEFINED 39** (consumed, never defined — silent render failures) · **DEAD 2941** (defined, never consumed) · **CONTESTED 768** (defined in 2+ files — cascade fights).
  - UNDEFINED highlights: `--accent-` bare fragment (SubsystemTile, Section, DevPulseDashboard — template-string construction split across lines); `--accent-service-fill/-main` consumed in StsDevtool/TtsDevtool/SttDevtool/PickerDialog/ServiceDevtoolShell (defined only via inline style at shell runtime — the audit sees no static definition); `--active-filter`, `--focus-ring`, `--focus-offset` consumed by generated/render-base.css and NEVER defined; `--bevel-raised`, `--bevel-raised-deep`, `--border-rise-soft/-subtle`, `--ease-out` consumed by ui-demo Glass* components, undefined; `--dynamic-background-{overlay-blend,overlay-opacity,video-blend}` consumed by DynamicBackground, undefined; `--font-weight-semibold` consumed by LiveSubsystemStrip:397, undefined.
- **color**: 3013 props harvested · **382 emitted oklch() outside sRGB** · WCAG contrast section in raw output · hex-fallback drift 0.
- **presetmap**: drift rows for `retro-*` and `wizard-*` presets — seed oklch values with nearest-token ΔE 6-13 (raw output appended; these are token-source SEEDS, recorded not judged).

## Sizing/fluidity facts folded from the S1 evidence chain (verified by sizing agent, cited to source)

- `--font-size-2xs/xs/sm` emitted as CONSTANTS (typography.css:8-10) despite "fluid clamp" comments; larger sizes vw-based; only spacing/size tokens are cqi.
- components.generated.css contains 0 cqi occurrences; sd.config.mjs:363-369 `basis==='container' ? 'cqi' : 'vw'`.
- Devtools window declares `devtools` container seam ((devtools)/+layout.svelte:10) with ZERO cqi consumers under lib/devtools.
- `.shell-root` (the directive's anchor) exists ONLY in the wizard OverlayShell (:99,110-111); Frame root intentionally container-free (Frame.svelte:48-55); 9 container-type declarations total.
- Shell chrome static rem: layout.css:7-11 (topbar 4.125rem, sidebar 3.75/15rem, context 25rem, statusbar 3.25rem).
- `styles/primitives/spacing.css` and `theme/spacing.css` are byte-identical duplicates (import chain points at styles/; theme/ liveness UNVERIFIED).

# UNVERIFIED (never silently promoted to fact)

1. Whether `theme/spacing.css` is loaded anywhere (byte-dup of styles/primitives/spacing.css) — import chain not exhaustively walked.
2. Slot Orchestrator "content in top strip" runtime cause — statically consistent with sparse content in `main.flex-1` (SlotsDevtool status snippet root = plain block flow :471); needs running-app DOM confirmation (/coldlight-verify).
3. Runtime OS display-scale factor (affects perceived density on the 2560-wide display) — not in repo.
4. Full clyffyConnection importer census beyond StatusBar/TopBar/Frame (route agent's grep was scoped) — additional readers possible.
5. cortex→connectome vocabulary total: ~80 grep hits paginated; representative list recorded, complete inventory not enumerated.
6. Devtool feature components (~22 dirs) internals not exhaustively read this pass (route shells + strip + shared buckets were; per-devtool internals are Pass-2 rulings inputs where touched).
7. One initial Glob over `interfaces/desktop/**` timed out (large vendored devforge tree) — all facts above re-verified via scoped find/grep; nothing claimed absent from the timed-out search.

# APPENDIX — raw audit outputs (verbatim)

## pnpm audit:cssvars
```

> devpulse-desktop@2.0.1 audit:cssvars D:\localdev\platform_devpulse\interfaces\desktop
> node scripts/audit/css-var-audit.mjs

[css-var-audit] ColdLight custom-property chain
  defined:   3363
  consumed:  461
  UNDEFINED (consumed, never defined): 39
  DEAD      (defined, never consumed): 2941
  CONTESTED (defined in 2+ files):     768

── UNDEFINED (broken chains — silent render failures) ──
  --accent-
      <- src/lib/design/blocks/devtools/SubsystemTile.svelte
      <- src/lib/design/components/section/Section.svelte
      <- src/lib/domains/app/devpulse/feature/dashboard/DevPulseDashboard.svelte
  --accent-service-fill
      <- src/lib/devtools/clyffy/ears/sts/feature/StsDevtool.svelte
      <- src/lib/devtools/clyffy/mouth/tts/feature/TtsDevtool.svelte
      <- src/lib/devtools/_shared/ServiceDevtoolShell.svelte
  --accent-service-main
      <- src/lib/design/blocks/dialogs/PickerDialog.svelte
      <- src/lib/devtools/clyffy/ears/sts/feature/StsDevtool.svelte
      <- src/lib/devtools/clyffy/ears/stt/feature/SttDevtool.svelte
  --active-filter
      <- src/lib/design/generated/render-base.css
  --bevel-raised
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassCard.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
  --bevel-raised-deep
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassCard.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
  --border-rise-soft
      <- src/lib/domains/app/ui-demo/ui/GlassCard.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
  --border-rise-subtle
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassInput.svelte
  --dynamic-background-overlay-blend
      <- src/lib/design/components/dynamic-background/DynamicBackground.svelte
  --dynamic-background-overlay-opacity
      <- src/lib/design/components/dynamic-background/DynamicBackground.svelte
  --dynamic-background-video-blend
      <- src/lib/design/components/dynamic-background/DynamicBackground.svelte
  --ease-out
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassCard.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassInput.svelte
  --focus-offset
      <- src/lib/design/generated/render-base.css
  --focus-ring
      <- src/lib/design/generated/render-base.css
  --font-weight-semibold
      <- src/lib/devtools/_shared/LiveSubsystemStrip.svelte
  --foo
      <- src/lib/design/debug/TokenDebugOverlay.svelte
  --gap
      <- src/lib/design/generated/render-base.css
  --glass-deep-blur
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassInput.svelte
  --glass-frost-blur
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
  --glass-light-blur
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
  --glass-standard-blur
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassCard.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
  --gradient-bg-1
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
  --gradient-bg-2
      <- src/lib/domains/app/ui-demo/ui/GlassContainer.svelte
  --hover-filter
      <- src/lib/design/generated/render-base.css
  --purple-500
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
  --purple-600
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
  --shadow-bevel
      <- src/stories/shards/Button.stories.svelte
  --shadow-depth
      <- src/stories/shards/Button.stories.svelte
  --shadow-frame
      <- src/stories/shards/Button.stories.svelte
  --shadow-purple-2
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
  --shadow-purple-3
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
  --surface-2
      <- src/lib/design/blocks/community/CommunityFeedList.svelte
  --teal-400
      <- src/lib/domains/app/ui-demo/ui/GlassInput.svelte
  --teal-600
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
  --text-base
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
      <- src/lib/domains/app/ui-demo/ui/GlassInput.svelte
  --text-lg
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
  --text-sm
      <- src/lib/domains/app/ui-demo/ui/GlassButton.svelte
  --z
      <- src/lib/design/generated/render-base.css
  --z-dropdown
      <- src/lib/layouts/app/Sidebar.svelte

── CONTESTED (top 25 — cascade fights) ──
  --accent-electric-main  (5 definers)
      = src/lib/design/styles/semantic/accent.css
      = src/lib/design/theme/accent.css
      = src/lib/devtools/system/datastores/_shared/EmptyStatePoster.svelte
      = src/lib/devtools/system/datastores/_shared/LiveActivityPulse.svelte
  --accent-teal-main  (4 definers)
      = src/lib/design/styles/semantic/accent.css
      = src/lib/design/theme/accent.css
      = src/lib/devtools/runtimes/orchestrator/slots/data-access/slot-anatomy.ts
      = src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte
  --accent-purple-main  (4 definers)
      = src/lib/design/styles/semantic/accent.css
      = src/lib/design/theme/accent.css
      = src/lib/devtools/runtimes/orchestrator/slots/data-access/slot-anatomy.ts
      = src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte
  --accent-cyan-main  (4 definers)
      = src/lib/design/styles/semantic/accent.css
      = src/lib/design/theme/accent.css
      = src/lib/devtools/runtimes/orchestrator/slots/data-access/slot-anatomy.ts
      = src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte
  --accent-hotpink-main  (4 definers)
      = src/lib/design/styles/semantic/accent.css
      = src/lib/design/theme/accent.css
      = src/lib/devtools/runtimes/orchestrator/slots/data-access/slot-anatomy.ts
      = src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte
  --accent-blue-main  (4 definers)
      = src/lib/design/styles/semantic/accent.css
      = src/lib/design/theme/accent.css
      = src/lib/devtools/runtimes/orchestrator/slots/data-access/slot-anatomy.ts
      = src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte
  --surface-inset  (4 definers)
      = src/lib/design/styles/semantic/surface.css
      = src/lib/design/theme/surface.css
      = src/lib/domains/app/models/feature/setup-wizard/feature/views/HardwareView.svelte
      = src/lib/domains/app/models/feature/setup-wizard/feature/views/InstallingView.svelte
  --slot-accent  (4 definers)
      = src/lib/devtools/runtimes/orchestrator/slots/ui/AnatomyTile.svelte
      = src/lib/devtools/runtimes/orchestrator/slots/ui/SaveSlotCard.svelte
      = src/lib/domains/app/models/feature/setup-wizard/ui/AnatomyTile.svelte
      = src/lib/domains/app/models/feature/setup-wizard/ui/SaveSlotCard.svelte
  --box-shadow  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --border-color  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --gradient  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --border-width  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --border-style  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --border-radius  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --color  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --font-family  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --font-size  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --font-weight  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --tracking  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --opacity  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --animation  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --transition-duration  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --transition-timing  (3 definers)
      = src/lib/design/renderforge/render.ts
      = src/lib/design/renderforge/var-to-family.ts
      = src/lib/design/styles/macro-mappings.ts
  --padding-xs-y  (3 definers)
      = src/lib/design/styles/primitives/spacing.css
      = src/lib/design/theme/spacing.css
      = src/lib/design/utils/clamp/clamp.ts
  --padding-xs-x  (3 definers)
      = src/lib/design/styles/primitives/spacing.css
      = src/lib/design/theme/spacing.css
      = src/lib/design/utils/clamp/clamp.ts
```

## pnpm audit:color
```

> devpulse-desktop@2.0.1 audit:color D:\localdev\platform_devpulse\interfaces\desktop
> node scripts/audit/color-audit.mjs

[color-audit] ColdLight color science
  custom properties harvested: 3013

── GAMUT: 382 emitted oklch() outside sRGB ──
  oklch(0.9 0.25 150)  (in-gamut C ≤ 0.1815)
      @ src/lib/design/styles/components/components.generated.css
  oklch(0.7 0.25 150)  (in-gamut C ≤ 0.1927)
      @ src/lib/design/styles/components/components.generated.css
  oklch(0.75 0.25 330 / 0.4)  (in-gamut C ≤ 0.2472)
      @ src/lib/design/styles/components/components.generated.css
  oklch(0.75 0.25 330 / 0.15)  (in-gamut C ≤ 0.2472)
      @ src/lib/design/styles/components/components.generated.css
  oklch(0.75 0.25 330)  (in-gamut C ≤ 0.2472)
      @ src/lib/design/styles/components/components.generated.css
  oklch(0.97 0.22 215)  (in-gamut C ≤ 0.0232)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.89 0.22 215)  (in-gamut C ≤ 0.0875)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.81 0.22 215)  (in-gamut C ≤ 0.1431)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.73 0.22 215)  (in-gamut C ≤ 0.1289)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.65 0.22 215)  (in-gamut C ≤ 0.1148)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.55 0.22 215)  (in-gamut C ≤ 0.0971)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.46 0.22 215)  (in-gamut C ≤ 0.0812)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.37 0.22 215)  (in-gamut C ≤ 0.0653)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.28 0.22 215)  (in-gamut C ≤ 0.0494)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.19 0.22 215)  (in-gamut C ≤ 0.0335)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.12 0.22 215)  (in-gamut C ≤ 0.0212)
      @ src/lib/design/styles/primitives/color.css
  oklch(0.97 0.22 355)  (in-gamut C ≤ 0.0165)
      @ src/lib/design/styles/primitives/color.css
      @ src/lib/design/theme/color.css
  oklch(0.89 0.22 355)  (in-gamut C ≤ 0.0651)
      @ src/lib/design/styles/primitives/color.css
      @ src/lib/design/theme/color.css
  oklch(0.81 0.22 355)  (in-gamut C ≤ 0.122)
      @ src/lib/design/styles/primitives/color.css
      @ src/lib/design/theme/color.css
  oklch(0.73 0.22 355)  (in-gamut C ≤ 0.1897)
      @ src/lib/design/styles/primitives/color.css
      @ src/lib/design/theme/color.css

── CONTRAST (WCAG 2.1, alpha composited) ──
  PASS        18.01:1  --text-primary on --color-void-base  (body text, needs 4.5:1)
  PASS         8.43:1  --text-secondary on --color-void-base  (body text, needs 4.5:1)
  FAIL         3.49:1  --text-muted on --color-void-base  (body text, needs 4.5:1)
  PASS         4.35:1  --primary-main on --color-void-base  (UI component, needs 3:1)
  PASS         6.08:1  --secondary-main on --color-void-base  (UI component, needs 3:1)
  PASS         4.77:1  --danger-main on --color-void-base  (UI component, needs 3:1)
  PASS         6.89:1  --success-main on --color-void-base  (UI component, needs 3:1)
  PASS         9.24:1  --warning-main on --color-void-base  (UI component, needs 3:1)
  PASS         6.62:1  --info-main on --color-void-base  (UI component, needs 3:1)
  PASS         6.55:1  --accent-muted-main on --color-void-base  (UI component, needs 3:1)
  FAIL         4.14:1  --primary-fg on --primary-main  (on-role text, needs 4.5:1)
  FAIL         3.78:1  --danger-fg on --danger-main  (on-role text, needs 4.5:1)
  FAIL         2.61:1  --success-fg on --success-main  (on-role text, needs 4.5:1)
  PASS         9.15:1  --warning-fg on --warning-main  (on-role text, needs 4.5:1)

── HEX-FALLBACK DRIFT: 0 DTCG entries disagree (ΔE00 > 5) ──
```

## pnpm audit:presetmap
```

> devpulse-desktop@2.0.1 audit:presetmap D:\localdev\platform_devpulse\interfaces\desktop
> node scripts/audit/preset-map.mjs

[preset-map] candidate pool: 562 palette/semantic vars

── Per-family verdicts (EXACT bind / NEAR bind / SEED parameterize) ──
  chrome     2 literals → 0 exact, 0 near, 2 seed
  flat       1 literals → 0 exact, 0 near, 1 seed
  glass      6 literals → 0 exact, 0 near, 6 seed
  neuro      2 literals → 0 exact, 0 near, 2 seed
  retro     15 literals → 0 exact, 0 near, 15 seed
  wizard    10 literals → 0 exact, 5 near, 5 seed

── SEED literals (no palette equivalent — the real family parameters) ──
  chrome   chrome-elevated.border-color                         oklch(0.6 0.02 250 / 0.4)  (nearest --color-void-400 ΔE 6.8)
  chrome   chrome-glow.color                                    oklch(0.85 0.08 240)  (nearest --color-azure-100 ΔE 6.2)
  flat     flat-glow.color                                      oklch(0.92 0.04 180)  (nearest --color-teal-100 ΔE 8.7)
  glass    glass-deep.border-color                              oklch(0.5 0.06 200 / 0.15)  (nearest --color-frost-600 ΔE 7.9)
  glass    glass-deep-hover.border-color                        oklch(0.55 0.07 200 / 0.22)  (nearest --color-cyan-500 ΔE 6.3)
  glass    glass-solid.border-color                             oklch(0.6 0.05 200 / 0.2)  (nearest --accent-muted-fill ΔE 6.8)
  glass    glass-solid-hover.border-color                       oklch(0.65 0.06 200 / 0.28)  (nearest --accent-muted-glow ΔE 6.9)
  glass    glass-glow-hover.background-color                    oklch(0.2 0.05 190 / 0.4)  (nearest --color-mint-950 ΔE 6.1)
  glass    glass-glow-disabled.border-color                     oklch(0.5 0.03 180 / 0.1)  (nearest --muted-main ΔE 7.4)
  neuro    neuro-elevated-hover.border-color                    oklch(0.6 0.12 180 / 0.3)  (nearest --accent-teal-glow ΔE 6.7)
  neuro    neuro-glow-active.border-color                       oklch(0.8 0.2 180 / 0.6)  (nearest --text-accent ΔE 7.6)
  retro    retro-elevated.background-color                      oklch(0.25 0.08 280)  (nearest --color-purple-800 ΔE 6.2)
  retro    retro-elevated.color                                 oklch(0.95 0.05 90)  (nearest --color-amber-50 ΔE 13.5)
  retro    retro-elevated-active.background-color               oklch(0.2 0.06 280)  (nearest --color-purple-950 ΔE 7.1)
  retro    retro-elevated-disabled.color                        oklch(0.6 0.02 280)  (nearest --color-neutral-400 ΔE 8.7)
  retro    retro-deep.box-shadow                                oklch(0.3 0.05 150 / 0.3)  (nearest --color-teal-800 ΔE 9)
  retro    retro-deep-hover.color                               oklch(0.9 0.25 150)  (nearest --color-green-100 ΔE 7.1)
  retro    retro-deep-hover.border-color                        oklch(0.7 0.25 150)  (nearest --color-green-300 ΔE 7.4)
  retro    retro-minimal.color                                  oklch(0.85 0.04 260)  (nearest --color-purple-100 ΔE 9.4)
  retro    retro-minimal.border-color                           oklch(0.6 0.1 260)  (nearest --color-royal-400 ΔE 6.5)
  retro    retro-minimal-hover.background-color                 oklch(0.25 0.04 260)  (nearest --color-sky-950 ΔE 7.3)
  retro    retro-solid-hover.background-color                   oklch(0.6 0.22 160)  (nearest --color-brand-green-400 ΔE 7.3)
  retro    retro-solid-disabled.background-color                oklch(0.3 0.05 160)  (nearest --color-teal-800 ΔE 7.1)
  retro    retro-glow.box-shadow                                oklch(0.75 0.25 330 / 0.4)  (nearest --color-rose-300 ΔE 9.2)
  retro    retro-glow.box-shadow                                oklch(0.75 0.25 330 / 0.15)  (nearest --color-rose-300 ΔE 9.2)
  retro    retro-glow.border-color                              oklch(0.75 0.25 330)  (nearest --color-rose-300 ΔE 9.2)
  wizard   wizard-solid.background-color                        oklch(0.2 0.045 300 / 0.96)  (nearest --color-magenta-950 ΔE 7.9)
  wizard   wizard-solid.gradient                                oklch(0.22 0.05 300)  (nearest --color-magenta-950 ΔE 7.8)
  wizard   wizard-solid.gradient                                oklch(0.15 0.045 300)  (nearest --color-sky-950 ΔE 8.8)
  wizard   wizard-elevated.background-color                     oklch(0.24 0.04 195 / 0.94)  (nearest --color-cyan-900 ΔE 7.5)
  wizard   wizard-elevated.gradient                             oklch(0.26 0.045 195)  (nearest --color-cyan-900 ΔE 7.3)
```
