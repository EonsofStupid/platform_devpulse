import type { HTMLAttributes, HTMLOlAttributes } from "svelte/elements";

/** A log line's level, as logs commonly write it. */
export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

/** The tone a level is drawn with: ColdLight's status tones, and muted for the quiet levels. */
export type LogTone = "error" | "warning" | "info" | "muted";

export interface UseLogProps {
	/** Accessible name; `role="log"` requires one unless `aria-labelledby` names it. */
	label?: string;
	/** Id of a visible element that names the log. */
	"aria-labelledby"?: string;
	/** How many lines are shown: when it grows while following, the log keeps to the end. */
	count: number;
	/** Controlled: whether the log keeps to the newest line; `undefined` leaves it to the log. */
	following?: boolean;
	/** Starting value when uncontrolled. Default: true. */
	defaultFollowing?: boolean;
	/** Following stopped (scrolled up) or resumed (back at the end). */
	onFollowingChange?: (following: boolean) => void;
}

export type LogRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "log";
	"data-slot": "root";
	role: "log";
	tabindex: 0;
	"data-following"?: "";
};

export type LogListAttrs = HTMLOlAttributes & {
	"data-kind": "log";
	"data-slot": "list";
};

export interface UseLogReturn {
	/** Whether the log keeps to the newest line. */
	readonly following: boolean;
	readonly root: LogRootAttrs;
	readonly list: LogListAttrs;
	/** Attach to the root element: follows the end, and tracks scrolling away from it. */
	attachRoot(node: HTMLElement): { destroy(): void };
}
