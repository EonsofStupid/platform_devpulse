<!-- @file Named connection and explicit model for one speech role; no network work on render. -->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { fill } from "#lib/sys/copy/index.js";
import type { SpeechEndpointPickerProps } from "./speech-endpoint.types.js";

let {
	copy,
	title,
	noneLine,
	slotNote,
	binding,
	connections,
	busy,
	onChoose,
	onStopUsing,
}: SpeechEndpointPickerProps = $props();

/** What you picked here; the saved choice until you do. */
let pickedConnection = $state<string | null>(null);
let pickedModel = $state<string | null>(null);

const connection = $derived(
	connections.find((item) => item.id === (pickedConnection ?? binding?.connectionId)),
);
const models = $derived(connection?.check?.models ?? []);
const typedModel = $derived(pickedModel ?? binding?.model ?? "");
const model = $derived(typedModel.trim());
const listedModel = $derived(models.some((item) => item.id === model) ? model : "");
const unchanged = $derived(
	binding?.state === "current" &&
		binding.connectionId === connection?.id &&
		binding.revision === connection?.revision &&
		binding.model === model,
);
</script>

<Card variant="minimal">
	<section class="p-4 flex flex-col gap-3" aria-label={title}>
		<Text size="sm" weight="semibold">{title}</Text>

		{#if !binding}
			<Text size="sm" color="muted">{noneLine}</Text>
		{:else if binding.state === "connectionChanged"}
			<InlineMessage tone="warning">{fill(copy.changed, { label: binding.label })}</InlineMessage>
		{:else if binding.state === "connectionRemoved"}
			<InlineMessage tone="warning">{fill(copy.removed, { label: binding.label })}</InlineMessage>
		{:else}
			<Text size="sm">{fill(copy.using, { label: binding.label, model: binding.model })}</Text>
			<Text size="sm" color="muted">{slotNote}</Text>
		{/if}

		<div class="flex flex-wrap items-end gap-3">
			<div class="flex flex-col gap-1">
				<Text size="sm">{copy.connection}</Text>
				<Select
					value={connection?.id ?? ""}
					onValueChange={(value: string) => {
						pickedConnection = value;
						pickedModel = "";
					}}
					disabled={busy || connections.length === 0}
				>
					<SelectTrigger aria-label={copy.connection}>
						{connection?.label ?? copy.connection}
					</SelectTrigger>
					<SelectContent>
						{#each connections as item (item.id)}
							<SelectItem value={item.id}>{item.label}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
			{#if models.length > 0}
				<div class="flex flex-col gap-1">
					<Text size="sm">{copy.model}</Text>
					<Select
						value={listedModel}
						onValueChange={(value: string) => (pickedModel = value)}
						disabled={busy}
					>
						<SelectTrigger aria-label={copy.model}>{listedModel || copy.model}</SelectTrigger>
						<SelectContent>
							{#each models as item (item.id)}
								<SelectItem value={item.id}>{item.id}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>
			{/if}
			<TextField
				label={copy.model_typed}
				value={typedModel}
				onValueChange={(value: string) => (pickedModel = value)}
				size="sm"
				disabled={busy || !connection}
			/>
		</div>

		{#if connections.length === 0}
			<Text size="sm" color="muted">{copy.empty}</Text>
		{:else}
			<Text size="sm" color="muted">{copy.model_hint}</Text>
		{/if}
		<Text size="sm" color="muted">{copy.disclosure}</Text>

		<div class="flex items-center gap-2">
			<Button
				size="sm"
				variant="secondary"
				disabled={busy || !connection || !model || unchanged}
				onclick={() => {
					if (connection && model) void onChoose(connection, model);
				}}
			>
				{copy.use_connection}
			</Button>
			{#if binding}
				<Button size="sm" variant="ghost" disabled={busy} onclick={() => void onStopUsing()}>
					{copy.stop_using}
				</Button>
			{/if}
		</div>
	</section>
</Card>
