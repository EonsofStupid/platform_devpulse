/**
 * @file Transport Action
 * @description ColdLight-branded DOM connector. Applies adapter slot store to element.
 * This is the ONLY place @melt-ui/svelte's melt action is imported.
 * Components use `connectSlot` — never `melt` directly.
 */

export { melt as connectSlot } from "@melt-ui/svelte";
