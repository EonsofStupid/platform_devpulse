/**
 * @file Banner Component Barrel
 * @kind banner
 * @layer components
 *
 * Components layer — ARIA + state. ZERO visual.
 * For styled banner, import from ui/banner/.
 */

export { default as Banner } from "./Banner.svelte";
export { contract as bannerComponentContract } from "./contract.js";
export { bannerRecipe } from "./recipe.js";
export type { BannerComponentProps, BannerIntent } from "./types.js";
