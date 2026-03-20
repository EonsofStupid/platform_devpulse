/**
 * Heading primitive types.
 *
 * Renders semantic <h1>-<h6> based on level prop.
 * Context-aware: parent components (Dialog, Card) can override level.
 * VPB reads data-kind="heading" + level to identify and edit.
 */

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface UseHeadingProps {
	/** Semantic heading level (1-6). Default: 2. */
	level?: HeadingLevel;
}

export interface UseHeadingReturn {
	/** Spread onto the heading element. */
	readonly root: Record<string, unknown>;
	/** The resolved heading level. */
	readonly level: HeadingLevel;
}
