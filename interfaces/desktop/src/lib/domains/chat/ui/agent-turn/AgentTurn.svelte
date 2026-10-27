<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import type { AgentTurnProps } from "./agent-turn.types.js";

let { message, permission, cancelLabel, refuseLabel, onAnswer, onCancel }: AgentTurnProps =
	$props();
</script>

<Card variant="minimal" class="gap-2 p-3" data-ui="chat-agent-turn">
	{#if permission}
		<Text size="sm" weight="semibold">{message} {permission.title}</Text>
		<div class="flex flex-wrap items-center gap-2">
			{#each permission.choices as choice (choice.id)}
				<Button size="sm" variant={choice.allows ? "primary" : "secondary"} onclick={() => onAnswer(choice.id)}>{choice.label}</Button>
			{/each}
			<Button size="sm" variant="ghost" onclick={() => onAnswer(null)}>{refuseLabel}</Button>
		</div>
	{:else}
		<div class="flex flex-wrap items-center gap-2" role="status">
			<Spinner size="xs" />
			<Text size="xs">{message}</Text>
			<Button size="sm" variant="ghost" onclick={onCancel}>{cancelLabel}</Button>
		</div>
	{/if}
</Card>
