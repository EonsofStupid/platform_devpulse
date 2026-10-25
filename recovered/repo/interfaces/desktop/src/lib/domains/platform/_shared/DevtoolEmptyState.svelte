<!--
	@file DevtoolEmptyState
	@domain platform/_shared

	Empty / waiting placeholder for any tab whose data hasn't materialized
	yet. Replaces the per-devtool `<Text size="sm" color="muted">No
	entries…</Text>` sentinel.

	# Usage

	```svelte
	<DevtoolEmptyState
		icon={FolderOpen}
		title="No models loaded"
		description="Assign a model in Settings, then return here to load it."
	>
		{#snippet cta()}
			<Button preset="button-primary" size="sm" onclick={openWizard}>
				Open setup wizard
			</Button>
		{/snippet}
	</DevtoolEmptyState>
	```
-->
<script lang="ts">
import type { Component, Snippet } from "svelte";
import { Text } from "$lib/design/components/text/index.js";

interface Props {
	/** Lucide icon component (e.g. `FolderOpen`). */
	// biome-ignore lint/suspicious/noExplicitAny: lucide icons share a well-known props shape.
	icon?: Component<any>;
	/** Headline — one short sentence. */
	title: string;
	/** Sub-line explaining what to do. */
	description?: string;
	/** Optional CTA — typically a Button or link cluster. */
	cta?: Snippet;
}

let { icon: Icon, title, description, cta }: Props = $props();
</script>

<div
	class="flex flex-col items-center justify-center text-center gap-3 py-8 px-4 rounded-lg"
	style="background: var(--surface-base); border: var(--border-width-hairline) dashed var(--border-subtle);"
>
	{#if Icon}
		<Icon size={28} style="color: var(--text-muted);" />
	{/if}
	<div class="flex flex-col gap-1">
		<Text size="sm" weight="semibold">{title}</Text>
		{#if description}
			<Text size="xs" color="muted">{description}</Text>
		{/if}
	</div>
	{#if cta}
		<div class="mt-1">{@render cta()}</div>
	{/if}
</div>
