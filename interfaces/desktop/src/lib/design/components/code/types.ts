/**
 * @file Code Types
 * @kind code
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { BaseProps } from "$lib/design/primitives/types.js";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

export type CodeLanguage = "typescript" | "javascript" | "rust" | "html" | "css" | "json" | "shell" | "text";

export interface CodeProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children">, BaseProps, ColdLightProps {
	children?: Snippet;
	inline?: boolean;
	language?: CodeLanguage;
}
