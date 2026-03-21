/**
 * @file Code Component Types
 * @kind code
 * @layer components
 *
 * Two components:
 *   - InlineCode — simple <code> span for inline use
 *   - CodeBlock — compound component (Root, Header, Content, CopyButton)
 *     with Shiki integration point for syntax highlighting
 *
 * Follows Ark UI / Zag API conventions:
 *   - ids for composition
 *   - dir for RTL
 *   - element render delegation on sub-components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// SHARED
// =============================================================================

/** Supported language hints. Extensible — Shiki supports 200+ grammars. */
export type CodeLanguage =
	| "typescript"
	| "javascript"
	| "rust"
	| "python"
	| "go"
	| "html"
	| "svelte"
	| "css"
	| "json"
	| "yaml"
	| "toml"
	| "sql"
	| "shell"
	| "bash"
	| "markdown"
	| "text"
	| (string & {});

// =============================================================================
// INLINE CODE
// =============================================================================

/** Props for InlineCode — a simple <code> span. */
export interface InlineCodeProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class" | "dir">,
		PreparedComponentProps {
	/** Element ID. */
	id?: string;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	children?: Snippet;
}

// =============================================================================
// CODE BLOCK — COMPOUND
// =============================================================================

/** Element IDs for composition. */
export interface CodeBlockIds {
	root?: string;
	header?: string;
	content?: string;
	copyButton?: string;
}

/** Details passed to onCopy callback. */
export interface CodeBlockCopyDetails {
	/** The code text that was copied. */
	value: string;
}

/** Props for CodeBlock.Root — the outer container. */
export interface CodeBlockRootProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class" | "dir">,
		PreparedComponentProps {
	/** Element IDs for composition. */
	ids?: Partial<CodeBlockIds>;
	/** Language hint — drives Shiki grammar + data attribute. */
	language?: CodeLanguage;
	/** Display filename in header. */
	filename?: string;
	/** Show line numbers. Default: false. */
	lineNumbers?: boolean;
	/** Highlight specific lines (1-indexed). */
	highlightLines?: number[];
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Whether the code block is disabled (copy disabled). */
	disabled?: boolean;
	/** Callback when code is copied. */
	onCopy?: (details: CodeBlockCopyDetails) => void;
	children?: Snippet;
}

/** Shared base for code block sub-component props. */
interface CodeBlockSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
	/** Render the element yourself. */
	element?: Snippet<[HTMLAttributes<HTMLElement>]>;
}

/** Props for CodeBlock.Header — filename/language label bar. */
export interface CodeBlockHeaderProps extends CodeBlockSlotProps {}

/** Props for CodeBlock.Content — the <pre><code> area where Shiki renders. */
export interface CodeBlockContentProps extends CodeBlockSlotProps {
	/** Raw code string — if provided, renders as text. Shiki can process this. */
	code?: string;
}

/** Props for CodeBlock.CopyButton — copies code to clipboard. */
export interface CodeBlockCopyButtonProps extends CodeBlockSlotProps {
	/** Override the text to copy. If omitted, copies from Content. */
	value?: string;
}
