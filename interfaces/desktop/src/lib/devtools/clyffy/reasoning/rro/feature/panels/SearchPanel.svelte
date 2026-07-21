<!--
	@component SearchPanel
	@kind sys.rro.feature
	@layer feature
	@description "Try It" — encode a query, search a collection, show results with quality feedback.
-->
<script lang="ts">
import { Search } from "@lucide/svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "$lib/design/components/select/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { TextField } from "$lib/design/components/text-field/index.js";
import { rroState } from "$lib/sys/data-access/rro/rro.state.svelte.js";
import { CapabilityHeader, ErrorCallout } from "../../ui/index.js";
import { bucketBgClass, formatMs, scoreBuckets, scoreVariant } from "../../util/rro.format.js";

const buckets = $derived(scoreBuckets(rroState.searchResults));
const totalLatency = $derived(
	rroState.embedLatencyMs !== null && rroState.searchLatencyMs !== null
		? rroState.embedLatencyMs + rroState.searchLatencyMs
		: null,
);
</script>

<Card preset="glass">
	<div class="p-3 space-y-3">
		{#snippet icon()}
			<Search size={14} class="text-[var(--accent-service-main)]" />
		{/snippet}
		<CapabilityHeader
			title="Ask a question"
			subtitle="Type a question, see what matches. Results come from the selected knowledge store."
			{icon}
		/>

		{#if !rroState.encoderReady}
			<Text size="xs" preset="stark">Load the encoder first (Encoder tab).</Text>
		{:else if rroState.collections.length === 0}
			<Text size="xs" preset="stark">
				No knowledge stores yet. Create one in the Knowledge Stores tab.
			</Text>
		{:else}
			<div class="space-y-2">
				<Select
					value={rroState.searchCollection}
					onValueChange={(v) => (rroState.searchCollection = v)}
				>
					<SelectTrigger
						class="w-full px-3 py-1.5 text-xs rounded border border-[var(--border-subtle)] bg-[var(--surface-base)] text-left"
					>
						{rroState.searchCollection || "Select a store..."}
					</SelectTrigger>
					<SelectContent>
						{#each rroState.collections as col}
							<SelectItem value={col}>{col}</SelectItem>
						{/each}
					</SelectContent>
				</Select>

				<div class="flex gap-2">
					<div class="flex-1">
						<TextField
							value={rroState.searchQuery}
							onValueChange={(v) => (rroState.searchQuery = v)}
							placeholder="What do you want to find?"
							size="sm"
							aria-label="Search query"
						/>
					</div>
					<Button
						preset="primary"
						size="sm"
						onclick={() => rroState.runSearch()}
						disabled={rroState.searchLoading}
					>
						{rroState.searchLoading ? "Searching..." : "Search"}
					</Button>
				</div>
			</div>

			<ErrorCallout prefix="Search failed" message={rroState.searchError} />

			{#if rroState.searchResults.length > 0}
				<!-- Quality feedback -->
				<div class="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
					<div class="flex items-center gap-2 flex-wrap">
						<Badge variant="accent" size="sm" fillStyle="subtle">
							{rroState.searchResults.length} matches
						</Badge>
						{#if rroState.config}
							<Badge variant="neutral" size="sm" fillStyle="outline">
								Depth {rroState.config.top_k}
							</Badge>
							<Badge variant="neutral" size="sm" fillStyle="outline">
								Floor {rroState.config.score_threshold.toFixed(2)}
							</Badge>
						{/if}
						{#if totalLatency !== null}
							<Badge variant="informative" size="sm" fillStyle="subtle">
								{formatMs(totalLatency)} total
							</Badge>
						{/if}
					</div>

					<!-- Score distribution -->
					<div class="space-y-0.5">
						<div class="flex h-1.5 rounded overflow-hidden gap-px">
							{#each buckets as count, i}
								{#if count > 0}
									<div
										class="rounded-sm opacity-80 {bucketBgClass(i as 0 | 1 | 2 | 3 | 4)}"
										style:flex-grow={count}
									></div>
								{/if}
							{/each}
						</div>
						<div class="flex justify-between">
							<Text size="xs" preset="flat">Weak</Text>
							<Text size="xs" preset="flat">Strong</Text>
						</div>
					</div>
				</div>

				<!-- Results list -->
				<div class="space-y-1 max-h-80 overflow-y-auto">
					{#each rroState.searchResults as result}
						<Card preset="flat">
							<div class="flex items-center gap-2 p-2">
								<Badge variant={scoreVariant(result.score)} size="sm" fillStyle="bold">
									{result.score.toFixed(2)}
								</Badge>
								<div class="flex-1 truncate">
									<Text size="xs" preset="flat">
										{result.payload_json.slice(0, 120) || "(no content)"}
									</Text>
								</div>
								<Text size="xs" preset="flat">{result.id}</Text>
							</div>
						</Card>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</Card>
