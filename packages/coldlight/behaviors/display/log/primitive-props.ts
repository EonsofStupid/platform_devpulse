import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { LogLevel } from "./log.types.js";

/** One entry of a log. Only `text` is required; the other parts show when present. */
export interface LogLine {
	/** Stable key. Without one a line is keyed by its position, which holds because a log only appends. */
	id?: string | number;
	/** The entry's message. */
	text: string;
	/** When it happened, as its source wrote it. */
	time?: string;
	level?: LogLevel;
	/** What wrote it: a target, a module, an action. */
	source?: string;
}

/**
 * Structural props for the Log primitive: lines in order, newest last, in a
 * named live region that keeps to the newest line until you scroll away.
 *
 * @example
 * ```svelte
 * <Log label="Today's actions" lines={[{ text: "models.refresh ok", level: "info", time: "10:02" }]} />
 * ```
 */
export interface LogPrimitiveProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "role" | "tabindex"> {
	/** The entries, oldest first. */
	lines: readonly LogLine[];
	/** Accessible name; `role="log"` requires one unless `aria-labelledby` names it. */
	label?: string;
	/** Controlled: whether the log keeps to the newest line; `undefined` leaves it to the log. */
	following?: boolean;
	/** Starting value when uncontrolled. Default: true. */
	defaultFollowing?: boolean;
	/** Following stopped (scrolled up) or resumed (back at the end). */
	onFollowingChange?: (following: boolean) => void;
	/** Shown in place of the list while there are no lines. */
	empty?: Snippet;
	/** Additional classes on the root (layout only). */
	class?: string;
}
