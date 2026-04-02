<!--
	@component CodeBlock (Root)
	@kind code
	@layer components

	ColdLight CodeBlock Root — compound code display container.
	Sets context for sub-components (Header, Content, CopyButton).
	Shiki integration point: consumer renders Shiki output inside Content.

	API follows Ark UI / Zag conventions:
	  - ids for composition
	  - dir for RTL
	  - disabled state
	  - onCopy callback with details
-->
<script lang="ts">
import { cssVarString, renderForge } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setCodeBlockContext } from "./context.js";
import type { CodeBlockRootProps } from "./types.js";

let {
	ids,
	language,
	filename,
	lineNumbers = false,
	highlightLines,
	dir = "ltr",
	disabled = false,
	onCopy,
	children,
	preset = "default",
	class: className,
	...rest
}: CodeBlockRootProps = $props();

function copyCode(value?: string) {
	if (disabled) return;
	const text = value ?? "";
	if (text) {
		navigator.clipboard.writeText(text);
		onCopy?.({ value: text });
	}
}

setCodeBlockContext({
	get ids() {
		return ids ?? {};
	},
	get dir() {
		return dir;
	},
	get language() {
		return language;
	},
	get filename() {
		return filename;
	},
	get lineNumbers() {
		return lineNumbers;
	},
	get disabled() {
		return disabled;
	},
	copyCode,
});

const m = $derived(renderForge({ kind: "code", preset }));
</script>

<div
	id={ids?.root}
	{dir}
	{...m.dataAttrs}
	data-slot="root"
	data-language={language || undefined}
	style={cssVarString(m.cssVars)}
	class={cn(disabled ? "opacity-60" : undefined, className)}
	{...rest}
>
	{@render children?.()}
</div>
