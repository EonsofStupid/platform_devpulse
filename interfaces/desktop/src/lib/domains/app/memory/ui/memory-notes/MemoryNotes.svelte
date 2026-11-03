<!--
    @file MemoryNotes.svelte
    @module @devpulse/domains/app/memory/ui/memory-notes

    One place's notes: read them, add one, change one, delete one after saying
    what that does. A note's name is its identity, so saving a new note under a
    name in use is stopped here rather than overwriting the other note.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Text } from "@devpulse/coldlight/components/text";
import { TextField } from "@devpulse/coldlight/components/text-field";
import { Textarea } from "@devpulse/coldlight/components/textarea";
import { fill } from "$lib/sys/copy/index.js";
import type { MemoryNote } from "$lib/sys/generated/bindings.js";
import type { MemoryNotesProps } from "./memory-notes.types.js";

let { copy, notes, busy, onSave, onRemove }: MemoryNotesProps = $props();

/** The form: `null` closed, `{ adding: true }` a new note, else the note edited. */
let form = $state<{ adding: boolean; limit: number | null } | null>(null);
let name = $state("");
let body = $state("");
let removing = $state<string | null>(null);

const trimmed = $derived(name.trim());
const taken = $derived(
	form?.adding === true && notes.some((note) => note.label === trimmed) ? trimmed : null,
);
const limit = $derived(form?.limit ?? 5000);
const used = $derived([...body].length);

function add(): void {
	name = "";
	body = "";
	form = { adding: true, limit: null };
}

function edit(note: MemoryNote): void {
	name = note.label;
	body = note.body;
	form = { adding: false, limit: note.charLimit };
}

async function save(event: SubmitEvent): Promise<void> {
	event.preventDefault();
	if (taken || !trimmed) return;
	if (await onSave(trimmed, body)) form = null;
}

async function remove(label: string): Promise<void> {
	if (await onRemove(label)) removing = null;
}
</script>

<div class="flex flex-col gap-3">
    {#if notes.length === 0 && !form}<Text size="sm" color="muted">{copy.empty}</Text>{/if}
    {#each notes as note (note.label)}
        <Card>
            <div class="flex flex-col gap-2 p-3">
                <Text weight="semibold">{note.label}</Text>
                <Text as="p" size="sm" class="whitespace-pre-wrap">{note.body}</Text>
                <div class="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" disabled={busy} onclick={() => edit(note)}>{copy.edit}</Button>
                    <Button size="sm" variant="ghost" disabled={busy} onclick={() => (removing = note.label)}>{copy.remove}</Button>
                </div>
                {#if removing === note.label}
                    <InlineMessage tone="warning">{fill(copy.remove_confirm, { name: note.label })}</InlineMessage>
                    <div class="flex gap-2">
                        <Button size="sm" variant="secondary" disabled={busy} onclick={() => remove(note.label)}>{copy.remove_yes}</Button>
                        <Button size="sm" variant="ghost" disabled={busy} onclick={() => (removing = null)}>{copy.keep}</Button>
                    </div>
                {/if}
            </div>
        </Card>
    {/each}
    {#if form}
        <Card>
            <form class="flex flex-col gap-3 p-3" onsubmit={save}>
                <TextField
                    label={copy.name}
                    description={form.adding ? copy.name_hint : undefined}
                    bind:value={name}
                    required
                    disabled={busy || !form.adding}
                />
                {#if taken}<InlineMessage tone="warning">{fill(copy.name_taken, { name: taken })}</InlineMessage>{/if}
                <Textarea label={copy.body} bind:value={body} rows={5} disabled={busy} />
                <Text size="sm" color={used > limit ? "danger" : "muted"}>{fill(copy.characters, { used: String(used), limit: String(limit) })}</Text>
                <div class="flex gap-2">
                    <Button type="submit" variant="primary" disabled={busy || !trimmed || taken !== null || used > limit}>{copy.save}</Button>
                    <Button type="button" variant="secondary" disabled={busy} onclick={() => (form = null)}>{copy.cancel}</Button>
                </div>
            </form>
        </Card>
    {:else}
        <div><Button size="sm" variant="secondary" disabled={busy} onclick={add}>{copy.add}</Button></div>
    {/if}
</div>
