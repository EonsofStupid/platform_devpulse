<script lang="ts">
import { BUTTON_VARIANTS, Button } from "@devpulse/coldlight/components/button";
import { CARD_VARIANTS, Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Text } from "@devpulse/coldlight/components/text";
import { AgentTurn, SessionRow } from "$lib/domains/chat/index.js";
import type { ComponentPreviewProps } from "./component-preview.types.js";

let { family, selected, onSelect, onAction }: ComponentPreviewProps = $props();
</script>

<section data-surface={family} aria-label={`${family} surface family`} class="flex min-w-0 flex-col gap-4">
	<Heading level={2} size="md">{family}</Heading>
	<Card variant="elevated" class="gap-4 p-4">
		<Text weight="semibold">Actions</Text>
		<div class="flex flex-wrap gap-2">
			{#each BUTTON_VARIANTS as variant}
				<Button {variant} size="sm" onclick={() => onAction(`${family}: ${variant}`)}>{variant}</Button>
			{/each}
		</div>
		<div class="flex flex-wrap gap-2">
			<Button size="sm" disabled>Disabled</Button>
			<Button size="sm" loading>Loading</Button>
			<Button size="sm" variant="secondary" defaultPressed={true}>Pressed</Button>
		</div>
	</Card>
	<Card variant="elevated" class="gap-3 p-4">
		<Text weight="semibold">Surface roles</Text>
		{#each CARD_VARIANTS as variant}
			<Card {variant} class="p-3"><Text size="sm">{variant}</Text></Card>
		{/each}
		<Card surface="glass" variant="deep" class="gap-2 p-3">
			<Text size="sm">Nested glass override</Text>
			<Card variant="elevated" class="p-2"><Text size="xs">This child inherits glass</Text></Card>
		</Card>
	</Card>
	<Card variant="elevated" class="gap-3 p-4">
		<Text weight="semibold">Real chat session row</Text>
		<SessionRow session={{ id: `${family}-review`, title: "Review AgentHub implementation", updatedAt: 0 }} active={selected} onClick={onSelect} />
		<SessionRow session={{ id: `${family}-long`, title: "A longer session title that should stay inside its column without breaking the layout", updatedAt: 0 }} active={false} onClick={() => onAction(`${family}: long session selected`)} />
		<SessionRow session={{ id: `${family}-disabled`, title: "Unavailable session", updatedAt: 0 }} active={false} disabled onClick={() => onAction("Unexpected disabled activation")} />
	</Card>
	<AgentTurn
		message="Agent requests permission:"
		permission={{ title: "Run the project checks", choices: [{ id: "allow-once", label: "Allow once", allows: true }] }}
		cancelLabel="Stop"
		refuseLabel="Refuse"
		onAnswer={(choice) => onAction(`${family}: ${choice ?? "refused"} (preview only)`)}
		onCancel={() => onAction(`${family}: stopped (preview only)`)}
	/>
	<AgentTurn
		message="Running project checks (preview)"
		permission={null}
		cancelLabel="Stop"
		refuseLabel="Refuse"
		onAnswer={() => {}}
		onCancel={() => onAction(`${family}: stopped (preview only)`)}
	/>
</section>
