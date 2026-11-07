/**
 * @file builders/inline-message/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the ColdLight InlineMessage builder.
 *
 * Contract: `role="status"`, `aria-live="polite"` -- inline validation/help feedback.
 */

import type { MaybeGetter } from "../../builders/types.js";

/** Semantic tone for the inline message. */
export type InlineMessageTone = "info" | "success" | "warning" | "error" | "help";

/** Constructor config for the {@link InlineMessage} builder. */
export type InlineMessageProps = {
	/**
	 * Semantic tone controlling the message's visual appearance.
	 *
	 * @default "info"
	 */
	tone?: MaybeGetter<InlineMessageTone | undefined>;

	/**
	 * Override the `aria-live` politeness level.
	 *
	 * - `"polite"` -- announced after current speech (default).
	 * - `"assertive"` -- interrupts current speech immediately.
	 * - `"off"` -- suppresses live announcements.
	 *
	 * @default "polite"
	 */
	"aria-live"?: MaybeGetter<"polite" | "assertive" | "off" | undefined>;
};
