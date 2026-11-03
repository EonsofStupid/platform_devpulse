<!-- @file Named connection and explicit model selection; no network work on render. -->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import type { EndpointPickerProps } from "./endpoint-picker.types.js";

let { copy, connections, busy, onStart }: EndpointPickerProps = $props();
let selected = $state("");
let selectedModel = $state("");
const connection = $derived(connections.find((item) => item.id === selected));
const models = $derived(connection?.check?.models ?? []);
const model = $derived(models.some((item) => item.id === selectedModel) ? selectedModel : "");
</script>

<section class="flex flex-col gap-2" aria-label={copy.title}>
    <Text size="xs" weight="semibold">{copy.title}</Text>
    <Select value={connection?.id ?? ""} onValueChange={(value) => { selected = value; selectedModel = ""; }} disabled={busy || connections.length === 0}>
        <SelectTrigger aria-label={copy.connection}>{connection?.label ?? copy.connection}</SelectTrigger>
        <SelectContent>
            {#each connections as item (item.id)}<SelectItem value={item.id}>{item.label}</SelectItem>{/each}
        </SelectContent>
    </Select>
    <Select value={model} onValueChange={(value) => selectedModel = value} disabled={busy || models.length === 0}>
        <SelectTrigger aria-label={copy.model}>{model || copy.model}</SelectTrigger>
        <SelectContent>
            {#each models as item (item.id)}<SelectItem value={item.id}>{item.id}</SelectItem>{/each}
        </SelectContent>
    </Select>
    {#if models.length === 0}<Text size="xs" color="muted">{copy.empty}</Text>{/if}
    <Text size="xs" color="muted">{copy.disclosure}</Text>
    <Button size="sm" variant="secondary" disabled={busy || !connection || !model} onclick={() => { if (connection && model) void onStart(connection, model); }}>{copy.start}</Button>
</section>
