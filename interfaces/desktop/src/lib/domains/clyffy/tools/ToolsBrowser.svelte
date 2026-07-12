<!--
	@file ToolsBrowser - layman catalog of what Clyffy can do.
	@domain clyffy

	Reads `listCapabilities()` and groups them by category. Each tile
	renders layman copy only — no algorithm names, no config, no
	kernel terminology. Config of each capability lives in devtools.

	@defaults {
		"background-color": "oklch(0.0901 0.017 224.61 / 0)",
		"gap": "0.75rem"
	}
-->
<script lang="ts">
import { Brain, Ear, Eye, MessageCircle, Search, Wrench } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import {
	type ClyffyCapability,
	type ClyffyCapabilityGroup,
	groupCapabilities,
	listCapabilities,
} from "./tools.service.js";

let capabilities = $state<readonly ClyffyCapability[]>([]);
let loading = $state<boolean>(true);
let error = $state<string | null>(null);

$effect(() => {
	let cancelled = false;
	loading = true;
	error = null;
	listCapabilities()
		.then((list) => {
			if (cancelled) return;
			capabilities = list;
			loading = false;
		})
		.catch((e) => {
			if (cancelled) return;
			error = e instanceof Error ? e.message : String(e);
			loading = false;
		});
	return () => {
		cancelled = true;
	};
});

const grouped = $derived(groupCapabilities(capabilities));

const groupMeta: Record<ClyffyCapabilityGroup, { label: string; icon: typeof Brain }> = {
	thinking: { label: "Thinking", icon: Brain },
	memory: { label: "Memory", icon: Search },
	voice: { label: "Voice", icon: Ear },
	vision: { label: "Vision", icon: Eye },
	tools: { label: "Tools", icon: Wrench },
};

const orderedGroups: ClyffyCapabilityGroup[] = ["thinking", "memory", "voice", "vision", "tools"];
</script>

<div class={stack({ gap: "4" })} data-kind="clyffy-tools-browser" data-slot="root">
	{#if loading}
		<Text size="sm" color="muted">Loading capabilities...</Text>
	{:else if error}
		<Text size="sm" color="muted">Could not load capabilities: {error}</Text>
	{:else}
		{#each orderedGroups as group (group)}
			{@const items = grouped[group]}
			{#if items.length > 0}
				{@const meta = groupMeta[group]}
				<section class={stack({ gap: "2" })}>
					<div class="flex items-center gap-2">
						<meta.icon size={16} class="text-[var(--color-teal-400)]" />
						<Text size="sm" weight="semibold" color="secondary">{meta.label}</Text>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
						{#each items as cap (cap.id)}
							<div
								class="flex items-start gap-3 p-3 rounded-lg border"
								data-kind="capability-tile"
								data-available={cap.available ? "true" : "false"}
								style="background: var(--surface-raised); border-color: var(--border-subtle); opacity: {cap.available
									? 1
									: 0.55};"
							>
								<MessageCircle size={18} class="mt-0.5 text-[var(--color-teal-400)]" />
								<div class={stack({ gap: "1" })}>
									<Text size="sm" weight="semibold">{cap.label}</Text>
									<Text size="xs" color="muted">{cap.description}</Text>
									{#if !cap.available}
										<Text size="xs" color="muted">Not yet available</Text>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	{/if}
</div>
