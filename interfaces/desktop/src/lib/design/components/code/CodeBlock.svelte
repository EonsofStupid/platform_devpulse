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
import { StyleMacro } from "$lib/design/style/index.js";
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
	get ids() { return ids ?? {}; },
	get dir() { return dir; },
	get language() { return language; },
	get filename() { return filename; },
	get lineNumbers() { return lineNumbers; },
	get disabled() { return disabled; },
	copyCode,
});

const styleId = "code-default";
</script>

<StyleMacro kind="code" style={styleId}>
	<div
		id={ids?.root}
		{dir}
		data-kind="code"
		data-slot="root"
		data-language={language || undefined}
		class={cn(disabled ? "opacity-60" : undefined, className)}
		{...rest}
	>
		{@render children?.()}
	</div>
</StyleMacro>
