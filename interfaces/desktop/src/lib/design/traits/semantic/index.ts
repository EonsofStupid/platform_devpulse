/**
 * @file ColdLight semantic traits — the golden role vocabulary.
 * @package @devpulse/coldlight
 *
 * A *semantic trait* names ONE golden building block of the shell's visual
 * language: a surface role ("what this layer IS") or an edge role. These are
 * the vocabulary that composite traits (../composite) assemble into full zone
 * patterns.
 *
 * The golden VALUES live once, in the token SSOT
 * (scripts/build/styledictionary/tokens/src/semantic/**), and reach the DOM as
 * the generated `--surface-*` / `--border-*` ingredient vars. This module is
 * the *typed contract* over those roles — it never re-declares the values, so
 * there is no second source to drift. A component never hand-types
 * `var(--surface-*)`; it wears a composite trait keyed by these roles.
 */

/**
 * Surface role — what a shell layer IS. Mirrors the named surface aliases in
 * `generated/styles/semantic/surface.css` (`--surface-<role>`).
 *
 * - `base` — app background, the deepest surface in the stacking order.
 * - `raised` — card / panel over base.
 * - `overlay` — hovering surface (dialogs, dropdowns, the shell's deep bars).
 * - `frosted` — frosted toolbar / header tint.
 * - `subtle` — subtle raised area (the sidebar rail).
 */
export type SurfaceRole = "base" | "raised" | "overlay" | "frosted" | "subtle";

/**
 * Edge role — a container hairline. Mirrors `generated/styles/semantic/border.css`
 * (`--border-<role>`).
 *
 * - `soft` — soft teal-tinted divider (shell bar edges).
 * - `subtle` — whisper divider (rail / panel edges).
 */
export type EdgeRole = "soft" | "subtle";
