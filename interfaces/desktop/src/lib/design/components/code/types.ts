/**
 * @file Code Component Types
 * @kind code
 * @layer components
 *
 * Code display component — inline <code> or block <pre><code>.
 * Component layer owns styling — primitive provides semantic <code>.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";

export type CodeLanguage = "typescript" | "javascript" | "rust" | "html" | "css" | "json" | "shell" | "text";

/** Code component props — inline or block code display */
export interface CodeComponentProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps {
	children?: Snippet;
	/** Render as inline <code> or block <pre><code> */
	inline?: boolean;
	/** Language hint for syntax highlighting (data attribute) */
	language?: CodeLanguage;
}
