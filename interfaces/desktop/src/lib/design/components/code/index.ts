// InlineCode — simple <code> span
export { default as InlineCode } from "./InlineCode.svelte";

// CodeBlock — compound component
export { default as Root } from "./CodeBlock.svelte";
export { default as Header } from "./CodeBlockHeader.svelte";
export { default as Content } from "./CodeBlockContent.svelte";
export { default as CopyButton } from "./CodeBlockCopyButton.svelte";

// Contract

// Types
export type {
	CodeLanguage,
	InlineCodeProps,
	CodeBlockIds,
	CodeBlockCopyDetails,
	CodeBlockRootProps,
	CodeBlockHeaderProps,
	CodeBlockContentProps,
	CodeBlockCopyButtonProps,
	CodePreset,
} from "./types.js";

// Theme + Highlighter
export {
	coldlightTheme,
	COLDLIGHT_SHIKI_CSS_VARS,
	COLDLIGHT_SHIKI_ANSI_VARS,
	COLDLIGHT_SHIKI_FALLBACKS,
	coldlightShikiCss,
} from "./coldlight-shiki-theme.js";
export {
	createColdLightHighlighter,
	type ColdLightHighlighter,
	type CreateHighlighterOptions,
} from "./highlighter.js";
