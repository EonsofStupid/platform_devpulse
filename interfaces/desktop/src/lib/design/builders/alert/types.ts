/**
 * @file builders/alert/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the Alert builder.
 * Contract: role="alert" (implicit aria-live="assertive").
 * Optional dismiss action via Synced<boolean> for visible state.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Semantic variant for the alert tone. */
export type AlertVariant = "info" | "success" | "warning" | "error";

/** Constructor config for Alert builder. */
export type AlertProps = {
	/** Whether the alert is visible. Getter = controlled, static = uncontrolled. @default true */
	visible?: MaybeGetter<boolean | undefined>;
	/** Called when visible state changes (e.g. on dismiss). */
	onVisibleChange?: (visible: boolean) => void;
	/** Semantic variant. @default "info" */
	variant?: MaybeGetter<AlertVariant | undefined>;
	/** Accessible label for the alert region. */
	"aria-label"?: MaybeGetter<string | undefined>;
	/** ID of element that labels the alert. */
	"aria-labelledby"?: MaybeGetter<string | undefined>;
};
