/**
 * @file What a route folder says about itself.
 * @module @devpulse/sys/routing
 *
 * A route folder describes itself in its own `+page.ts` — or, for a folder
 * with no page of its own (a devtools tier or bucket), in its `+layout.ts`:
 *
 * ```ts
 * import type { RouteNav } from "$lib/sys/routing/index.js";
 * export const _nav: RouteNav = { icon: Database, order: 10 };
 * ```
 *
 * SvelteKit accepts any `_`-prefixed export in `+page.ts` / `+layout.ts`.
 * Nothing else names the route: its path is the folder, its label comes from
 * the copy catalog keyed by that path. Keep `+page.ts` light — the route
 * manifest imports every one of them at build.
 */

import type { HelpCircle } from "lucide-svelte";

/** Any lucide-svelte icon component (they share one signature). */
export type LucideIcon = typeof HelpCircle;

/**
 * Where a top-level page shows in the app sidebar.
 * - `primary` — the hub list (default for a top-level `(app)` page)
 * - `footer`  — pinned below the hubs
 * - `hidden`  — routed, but not listed (redirect targets, flows)
 */
export type RoutePlacement = "primary" | "footer" | "hidden";

/** The generic facts a route folder declares about itself. */
export interface RouteNav {
	/** Icon for nav entries, tiles and section headers. */
	icon?: LucideIcon;
	/** Sort key among siblings, ascending; unordered siblings follow by name. */
	order?: number;
	/** Sidebar placement (app pages; top-level ones default to `primary`). */
	placement?: RoutePlacement;
	/**
	 * Whether the nav entry shows an attention dot right now. Read inside the
	 * sidebar's render, so a function over `$state` stays reactive.
	 */
	badge?: () => boolean;
}
