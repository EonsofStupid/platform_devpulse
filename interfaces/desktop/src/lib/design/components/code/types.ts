/**
 * @file Code Component Types
 * @kind code
 * @layer components
 *
 * ARIA + state only. ZERO visual.
 * Visual props (ColdLightProps) belong in ui/code/.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type CodeLanguage = "typescript" | "javascript" | "rust" | "html" | "css" | "json" | "shell" | "text";

/** Code component props — ARIA + behavioral. ZERO visual. */
export interface CodeComponentProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Render as inline <code> or block <pre><code> */
	inline?: boolean;
	/** Language hint for syntax highlighting (data attribute) */
	language?: CodeLanguage;
}
