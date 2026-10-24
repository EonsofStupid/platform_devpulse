/**
 * @file What a devtools route folder says about itself (plan 0008).
 * @module @devpulse/devtools
 *
 * The devtools live under one route folder: its children are tiers, theirs
 * are buckets, theirs are the devtools. Each folder carries the generic
 * `_nav` (icon, order) and, next to it, `_devtool` for the devtools-only
 * facts below. A tier or bucket declares them in its `+layout.ts`, a devtool
 * in its `+page.ts`:
 *
 * ```ts
 * export const _nav: RouteNav = { icon: Database, order: 10 };
 * export const _devtool: DevtoolNav = { accent: "blue" };
 * ```
 *
 * Every text — name, tile line, page subtitle, glossary term — is copy
 * (`[nav."<path>"]`); nothing here names a route.
 */

import type { BrandAccent, ServiceBackdrop } from "./_shared/serviceAccents.js";

/** Lifecycle — `planned` renders the tile dashed and dimmed. */
export type DevtoolStatus = "ready" | "planned";

/** A tier section's tone on the dashboard. */
export type DevtoolTone = "primary" | "secondary" | "success" | "warning" | "muted";

/** The devtools-only facts a folder declares. */
export interface DevtoolNav {
	/** Tier folders: the section tone. */
	tone?: DevtoolTone;
	/** Devtools: the brand accent of its page chrome and tile. */
	accent?: BrandAccent;
	/** Devtools: `planned` when the page is a placeholder. */
	status?: DevtoolStatus;
	/** Devtools: the runtime the page documents (runtimes overview). */
	runtimeId?: string;
	/** Devtools: the slot capability the page drives (`voice.stt`). */
	capability?: string;
	/** Devtools: the page's ambient backdrop; none when absent. */
	backdrop?: ServiceBackdrop;
}
