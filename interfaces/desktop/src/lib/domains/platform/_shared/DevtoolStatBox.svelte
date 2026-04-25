<!--
	@file DevtoolStatBox
	@domain platform/_shared

	Single-stat tile used inside Status / Config / Debug tabs. Replaces the
	hand-rolled `<div style="background: var(--surface-base); border: 1px
	solid var(--border-subtle); ...">` blocks scattered across devtools.

	# Usage

	```svelte
	<DevtoolStatBox label="Tools served" value={toolCount} />
	<DevtoolStatBox label="Latency" value="12ms" tone="success" />
	<DevtoolStatBox label="Slot" value="voice.stt">
		<Badge variant="positive" size="sm">Loaded</Badge>
	</DevtoolStatBox>
	```
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { Text } from "$lib/design/components/text/index.js";

type Tone = "default" | "muted" | "accent" | "success" | "warning" | "error";

interface Props {
	/** Caption above the value. Always rendered, never wrapped. */
	label: string;
	/** Primary value text — formatted by the caller. */
	value: string | number;
	/** Optional ColdLight signal/text token applied to the value. */
	tone?: Tone;
	/** Optional trailing slot — typically a Badge or icon. */
	children?: Snippet;
}

let { label, value, tone = "default", children }: Props = $props();

const TONE_COLOR: Record<Tone, string> = {
	default: "var(--text-primary)",
	muted: "var(--text-muted)",
	accent: "var(--accent-service-main)",
	success: "var(--signal-success)",
	warning: "var(--signal-warning)",
	error: "var(--signal-error)",
};
</script>

<div
	class="rounded-lg p-3 flex flex-col gap-1"
	style="background: var(--surface-base); border: var(--border-width-hairline) solid var(--border-subtle);"
>
	<Text size="xs" color="muted">{label}</Text>
	<div class="flex items-center gap-2">
		<span class="text-sm font-semibold" style={`color: ${TONE_COLOR[tone]};`}>
			{value}
		</span>
		{@render children?.()}
	</div>
</div>
