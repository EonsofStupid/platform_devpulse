/**
 * @file builders/banner/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Banner builder.
 * Contract: role="alert" with optional aria-live.
 * Dismissible via Synced<boolean> for visible state.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Constructor config for Banner builder. */
export type BannerProps = {
	/** Whether the banner is visible. Getter = controlled, static = uncontrolled. @default true */
	visible?: MaybeGetter<boolean | undefined>;
	/** Called when visible state changes (e.g. on dismiss). */
	onVisibleChange?: (visible: boolean) => void;
	/** Accessible label for the banner. */
	"aria-label"?: MaybeGetter<string | undefined>;
	/** Live region politeness. @default undefined (role="alert" implies assertive) */
	"aria-live"?: MaybeGetter<"polite" | "assertive" | "off" | undefined>;
};
