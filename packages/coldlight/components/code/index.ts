// InlineCode — simple <code> span

// CodeBlock — compound component
export { default as Root } from "./CodeBlock.svelte";
export { default as Content } from "./CodeBlockContent.svelte";
export { default as CopyButton } from "./CodeBlockCopyButton.svelte";
export { default as Header } from "./CodeBlockHeader.svelte";
export { default as InlineCode } from "./InlineCode.svelte";

// Contract

// Theme + Highlighter
export {
	COLDLIGHT_SHIKI_ANSI_VARS,
	COLDLIGHT_SHIKI_CSS_VARS,
	COLDLIGHT_SHIKI_FALLBACKS,
	coldlightShikiCss,
	coldlightTheme,
} from "./coldlight-shiki-theme.js";
export {
	type ColdLightHighlighter,
	type CreateHighlighterOptions,
	createColdLightHighlighter,
} from "./highlighter.js";
// Types
export type {
	CodeBlockContentProps,
	CodeBlockCopyButtonProps,
	CodeBlockCopyDetails,
	CodeBlockCopyErrorDetails,
	CodeBlockHeaderProps,
	CodeBlockIds,
	CodeBlockRootProps,
	CodeLanguage,
	CodePreset,
	InlineCodeProps,
} from "./types.js";
