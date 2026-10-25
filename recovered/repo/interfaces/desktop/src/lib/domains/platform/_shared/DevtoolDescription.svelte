<!--
	@file DevtoolDescription
	@domain platform/_shared

	"What is this thing" intro chip rendered at the top of a devtool tab.
	One sentence, layman friendly, never a paragraph.

	# Usage

	```svelte
	<DevtoolDescription
		text="Subprocess MCP — controls registration in Claude Code / Desktop config files. No long-running server inside this app."
	/>
	```

	For richer content (links, inline code) pass children instead:

	```svelte
	<DevtoolDescription>
		Reads the most recent <code>.userdata/logs/session-*.jsonl</code> —
		last 200 lines matching the selected target prefix.
	</DevtoolDescription>
	```
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	/** Plain-text description. Use `children` for richer markup. */
	text?: string;
	children?: Snippet;
}

let { text, children }: Props = $props();
</script>

<div
	class="rounded-md px-3 py-2"
	style="background: var(--surface-base); border-left: var(--border-width-thin) solid var(--accent-service-main);"
>
	<Text size="xs" color="muted">
		{#if children}
			{@render children()}
		{:else if text}
			{text}
		{/if}
	</Text>
</div>
