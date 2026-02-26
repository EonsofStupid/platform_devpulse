/**
 * @file builders/inline-message/types.ts
 * @package @devpulse/coldlight
 *
 * Props for the InlineMessage builder.
 * Contract: role="status", aria-live="polite" — inline validation/help feedback.
 */

import type { MaybeGetter } from "../_internal/types.js";

/** Semantic tone for the inline message. */
export type InlineMessageTone = "info" | "success" | "warning" | "error" | "help";

/** Constructor config for InlineMessage builder. */
export type InlineMessageProps = {
	/** Semantic tone. @default "info" */
	tone?: MaybeGetter<InlineMessageTone | undefined>;
	/** Override aria-live politeness. @default "polite" */
	"aria-live"?: MaybeGetter<"polite" | "assertive" | "off" | undefined>;
};
