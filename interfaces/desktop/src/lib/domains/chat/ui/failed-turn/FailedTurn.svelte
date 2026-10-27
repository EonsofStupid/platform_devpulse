<!-- @component FailedTurn — retained output after an agent turn fails. -->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Text } from "@devpulse/coldlight/components/text";
import type { FailedTurnProps } from "./failed-turn.types.js";

let { title, note, message, text, dismissLabel, onDismiss }: FailedTurnProps = $props();
</script>

<Card variant="deep" class="gap-3 p-4" data-ui="chat-failed-turn">
	<Text weight="semibold">{title}</Text>
	<div role="alert"><Text as="p">{message}</Text></div>
	<Text as="p" size="sm">{note}</Text>
	{#if text}<Text as="p" class="whitespace-pre-wrap break-words select-text">{text}</Text>{/if}
	<div class="flex justify-end"><Button variant="ghost" size="sm" onclick={onDismiss}>{dismissLabel}</Button></div>
</Card>
