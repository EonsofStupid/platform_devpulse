<!--
    @file EndpointTextTest.svelte
    @module @devpulse/domains/app/providers/ui/endpoint-connections
    An explicit model test and its actual kernel-owned operation evidence.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import { fill } from "#lib/sys/copy/index.js";
import type { EndpointTextTestProps } from "./endpoint-connections.types.js";

let { copy, connection, busy, onTest }: EndpointTextTestProps = $props();
let selected = $state("");
const models = $derived(connection.check?.models ?? []);
const model = $derived(models.some((m) => m.id === selected) ? selected : (models[0]?.id ?? ""));
</script>

<div class="flex flex-col gap-2">
    <Text size="xs" color="muted">{copy.try_description}</Text>
    <Text size="sm">{copy.try_prompt}</Text>
    <Select value={model} onValueChange={(value) => selected = value} disabled={busy || models.length === 0}>
        <SelectTrigger aria-label={`${copy.try_model}: ${connection.label}`}>{model || copy.try_model}</SelectTrigger>
        <SelectContent>
            {#each models as item, index (index)}<SelectItem value={item.id}>{item.id}</SelectItem>{/each}
        </SelectContent>
    </Select>
    <Button size="sm" variant="secondary" disabled={busy || !model} onclick={() => onTest(connection.id, model)}>{copy.try_action}</Button>
    {#if connection.textTest?.error}
        <InlineMessage tone="error">{connection.textTest.error}</InlineMessage>
    {:else if connection.textTest?.answer}
        <Text size="xs" color="muted">{fill(copy.try_answered, { model: connection.textTest.model, time: new Date(connection.textTest.checkedAtMs).toLocaleString() })}</Text>
        <Text size="xs" color="muted">{connection.textTest.prompt}</Text>
        <Text size="sm" class="whitespace-pre-wrap break-words">{connection.textTest.answer.text}</Text>
    {/if}
</div>
