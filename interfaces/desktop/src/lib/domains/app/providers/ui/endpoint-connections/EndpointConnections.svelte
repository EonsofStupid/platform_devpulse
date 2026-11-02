<!--
    @file EndpointConnections.svelte
    @module @devpulse/domains/app/providers/ui/endpoint-connections

    Named endpoints and explicit model discovery. Credentials stay in the form
    only until submission; kernel decisions arrive through the providers state.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { StatusDot } from "@devpulse/coldlight/components/status-dot";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { fill } from "$lib/sys/copy/index.js";
import type {
	ConnectionCredential,
	ProviderId,
	SavedConnection,
} from "$lib/sys/generated/bindings.js";
import type { EndpointConnectionsProps } from "./endpoint-connections.types.js";

let {
	copy,
	state: connections,
	options,
	busy,
	onSave,
	onCheck,
	onRemove,
}: EndpointConnectionsProps = $props();
let editing = $state(false);
let id = $state<string | null>(null);
let label = $state("");
let provider = $state<ProviderId | null>(null);
let endpoint = $state("");
let keyAction = $state<ConnectionCredential["action"]>("keep");
let secret = $state("");
let removing = $state<string | null>(null);
const selected = $derived(options.find((option) => option.provider === provider));
const keyChoices = $derived([
	{ value: "keep", label: copy.keep_key },
	{ value: "replace", label: copy.replace_key },
	{ value: "clear", label: copy.clear_key },
]);

function edit(connection?: SavedConnection): void {
	id = connection?.id ?? null;
	label = connection?.label ?? "";
	provider = connection?.provider ?? options[0]?.provider ?? null;
	endpoint =
		connection?.endpoint ??
		options.find((option) => option.provider === provider)?.suggestedEndpoint ??
		"";
	keyAction = "keep";
	secret = "";
	editing = true;
}
function close(): void {
	secret = "";
	editing = false;
}
function chooseProvider(value: string): void {
	const option = options.find((item) => item.provider === value);
	if (option) {
		provider = option.provider;
		endpoint = option.suggestedEndpoint;
	}
}
function chooseKey(value: string): void {
	if (value === "keep" || value === "replace" || value === "clear") {
		keyAction = value;
		secret = "";
	}
}
async function save(event: SubmitEvent): Promise<void> {
	event.preventDefault();
	if (!provider) return;
	const credential: ConnectionCredential =
		keyAction === "replace" ? { action: "replace", value: secret } : { action: keyAction };
	secret = "";
	if (await onSave({ id, label, provider, endpoint, credential })) close();
}
</script>

<section class="flex flex-col gap-3" aria-label={copy.title}>
    <div class="flex flex-wrap items-center justify-between gap-2">
        <Heading level={2} size="lg">{copy.title}</Heading>
        <Button variant="secondary" size="sm" disabled={busy || !connections || options.length === 0} onclick={() => edit()}>{copy.add}</Button>
    </div>
    <Text size="sm" color="muted">{copy.description}</Text>
    {#if !connections}
        <InlineMessage tone="warning">{copy.unavailable}</InlineMessage>
    {:else}
        {#if connections.problem}<InlineMessage tone="warning">{connections.problem}</InlineMessage>{/if}
        {#if connections.items.length === 0}<Text size="sm" color="muted">{copy.empty}</Text>{/if}
        <div class="grid gap-3 sm:grid-cols-2">
            {#each connections.items as connection (connection.id)}
                <Card>
                    <div class="flex flex-col gap-2 p-3">
                        <div class="flex items-center gap-2">
                            <StatusDot status={!connection.check ? "pending" : connection.check.error ? "failed" : "ready"} />
                            <Text weight="semibold">{connection.label}</Text>
                        </div>
                        <Text size="xs" color="muted">{connection.endpoint}</Text>
                        {#if connection.hasCredential}<Text size="xs">{copy.key_saved}</Text>{/if}
                        {#if connection.check?.error}
                            <InlineMessage tone="error">{connection.check.error}</InlineMessage>
                        {:else if connection.check}
                            <Text size="sm">{fill(copy.checked, { count: String(connection.check.models.length), time: new Date(connection.check.checkedAtMs).toLocaleString() })}</Text>
                            <Text size="xs" color="muted">{connection.check.models.map((model) => model.id).join(", ")}</Text>
                        {:else}<Text size="sm" color="muted">{copy.unchecked}</Text>{/if}
                        <div class="flex flex-wrap gap-2">
                            <Button size="sm" variant="secondary" disabled={busy} onclick={() => onCheck(connection.id)}>{copy.check}</Button>
                            <Button size="sm" variant="secondary" disabled={busy} onclick={() => edit(connection)}>{copy.edit}</Button>
                            <Button size="sm" variant="ghost" disabled={busy} onclick={() => removing = connection.id}>{copy.remove}</Button>
                        </div>
                        {#if removing === connection.id}
                            <InlineMessage tone="warning">{fill(copy.remove_confirm, { name: connection.label })}</InlineMessage>
                            <div class="flex gap-2">
                                <Button size="sm" variant="secondary" disabled={busy} onclick={async () => { await onRemove(connection.id); removing = null; }}>{copy.remove}</Button>
                                <Button size="sm" variant="ghost" disabled={busy} onclick={() => removing = null}>{copy.cancel}</Button>
                            </div>
                        {/if}
                    </div>
                </Card>
            {/each}
        </div>
        {#if editing}
            <Card>
                <form class="flex flex-col gap-3 p-3" onsubmit={save}>
                    <TextField label={copy.name} bind:value={label} required disabled={busy} />
                    <div class="flex flex-col gap-1">
                        <Text size="sm">{copy.provider}</Text>
                        <Select value={provider ?? ""} onValueChange={chooseProvider} disabled={busy}>
                            <SelectTrigger aria-label={copy.provider}>{selected?.name ?? copy.provider}</SelectTrigger>
                            <SelectContent>{#each options as option (option.provider)}<SelectItem value={option.provider}>{option.name}</SelectItem>{/each}</SelectContent>
                        </Select>
                    </div>
                    <TextField label={copy.endpoint} bind:value={endpoint} type="url" required disabled={busy} />
                    <Select value={keyAction} onValueChange={chooseKey} disabled={busy}>
                        <SelectTrigger aria-label={copy.credential}>{keyChoices.find((choice) => choice.value === keyAction)?.label}</SelectTrigger>
                        <SelectContent>{#each keyChoices as choice (choice.value)}<SelectItem value={choice.value}>{choice.label}</SelectItem>{/each}</SelectContent>
                    </Select>
                    {#if keyAction === "replace"}<TextField label={copy.key} description={copy.key_hint} bind:value={secret} type="password" autocomplete="off" required disabled={busy} />{/if}
                    <div class="flex gap-2">
                        <Button type="submit" variant="primary" disabled={busy || !provider}>{copy.save}</Button>
                        <Button type="button" variant="secondary" disabled={busy} onclick={close}>{copy.cancel}</Button>
                    </div>
                </form>
            </Card>
        {/if}
    {/if}
</section>
