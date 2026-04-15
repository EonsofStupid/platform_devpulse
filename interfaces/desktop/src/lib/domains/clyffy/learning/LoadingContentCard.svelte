<!--
	@file LoadingContentCard - rotating DYK / KDROPS / T&T card.
	@domain clyffy/learning

	Embeds anywhere you want a rotating "Did You Know" / "Knowledge
	Drop" / "Tip" to show during a wait. Reads from the shared
	`loadingContent` rotator — if rotation hasn't been started yet,
	this component starts it on mount and stops on destroy.

	Usage examples:
	  - No props: cycles through all kinds at 8s default
	  - kind prop ("dyk" | "kdrops" | "tnt"): bias to one kind
	  - tag prop ("gguf", "voice", etc.): topic-specific picker
	  - rotateEveryMs prop (number): override rotation speed
-->
<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { loadingContent } from "./learning.state.svelte.js";
import type { LoadingContentKind } from "./loading-content.js";

interface Props {
	kind?: LoadingContentKind;
	tag?: string;
	rotateEveryMs?: number;
	class?: string;
}

let { kind, tag, rotateEveryMs = 8000, class: className = "" }: Props = $props();

let teardown: (() => void) | null = null;

onMount(() => {
	teardown = loadingContent.start({ rotateEveryMs, kind, tag });
});

onDestroy(() => {
	teardown?.();
});

const entry = $derived(loadingContent.current);
const kindVariant = $derived.by(() => {
	switch (entry?.kind) {
		case "dyk":
			return "accent" as const;
		case "kdrops":
			return "positive" as const;
		case "tnt":
			return "neutral" as const;
		default:
			return "neutral" as const;
	}
});
</script>

{#if entry}
	<div
		class="flex items-start gap-3 p-4 rounded-lg motion-reduce:animate-none animate-[cl-fade-in_0.4s_ease-out_forwards]
			[background:var(--surface-glass-deep)]
			[box-shadow:var(--glow-teal),inset_0_0_0.5rem_var(--bevel-subtle)]
			border border-[var(--border-subtle)]
			{className}"
		data-kind="loading-content-card"
		data-slot="root"
		data-content-kind={entry.kind}
		data-entry-id={entry.id}
		aria-live="polite"
		aria-atomic="true"
	>
		<div class={stack({ gap: "2" })}>
			<Badge variant={kindVariant} size="sm">{entry.label}</Badge>
			<Text as="p" size="sm" color="primary">{entry.content}</Text>
			{#if entry.detail}
				<Text as="p" size="xs" color="muted">{entry.detail}</Text>
			{/if}
		</div>
	</div>
{/if}
