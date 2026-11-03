<!--
    @file YourMemory.svelte
    @module @devpulse/domains/app/memory/feature

    Your own notes and one project's, and what goes to your agents: wires the
    memory state and your projects to the notes UI.
-->
<script lang="ts">
import { Heading } from "@devpulse/coldlight/components/heading";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import { projectsState } from "$lib/domains/app/projects/index.js";
import type { MemoryCopy } from "$lib/sys/generated/bindings.js";
import { memoryState } from "../data-access/memory.state.svelte.js";
import { MemoryNotes } from "../ui/memory-notes/index.js";
import { MemorySendingPanel } from "../ui/memory-sending/index.js";

let { copy }: { copy: MemoryCopy } = $props();

/** The project you picked here; until then, the one you are working in. */
let picked = $state<string | null>(null);
const projects = $derived(projectsState.projects);
const shown = $derived(picked ?? projectsState.activeProjectId ?? projects[0]?.id ?? null);
const shownName = $derived(projects.find((project) => project.id === shown)?.name);

$effect(() => {
	if (projectsState.ready) void memoryState.loadYours();
});

$effect(() => {
	if (projectsState.ready) void memoryState.chooseProject(shown);
});
</script>

{#if memoryState.unavailable}
    <InlineMessage tone="warning">{copy.unavailable}</InlineMessage>
{:else}
    {#if memoryState.problem}<InlineMessage tone="error">{memoryState.problem}</InlineMessage>{/if}
    <section class="flex flex-col gap-3" aria-label={copy.yours_title}>
        <Heading level={2} size="lg">{copy.yours_title}</Heading>
        <Text size="sm" color="muted">{copy.yours_description}</Text>
        <MemoryNotes
            {copy}
            notes={memoryState.yours}
            busy={memoryState.busy}
            onSave={(label, body, expected, include) => memoryState.save(null, label, body, expected, include)}
            onInclude={(label, version, include) => memoryState.setIncluded(null, label, version, include)}
            onRemove={(label) => memoryState.remove(null, label)}
        />
    </section>
    <section class="flex flex-col gap-3" aria-label={copy.project_title}>
        <Heading level={2} size="lg">{copy.project_title}</Heading>
        <Text size="sm" color="muted">{copy.project_description}</Text>
        {#if projects.length === 0}
            <Text size="sm" color="muted">{copy.no_projects}</Text>
        {:else}
            <Select value={shown ?? ""} onValueChange={(id: string) => (picked = id)} disabled={memoryState.busy}>
                <SelectTrigger aria-label={copy.project_label}>{shownName ?? copy.project_label}</SelectTrigger>
                <SelectContent>
                    {#each projects as project (project.id)}
                        <SelectItem value={project.id}>{project.name}</SelectItem>
                    {/each}
                </SelectContent>
            </Select>
            {#if shown}
                {#key shown}
                    <MemoryNotes
                        {copy}
                        notes={memoryState.project}
                        busy={memoryState.busy}
                        onSave={(label, body, expected, include) => memoryState.save(shown, label, body, expected, include)}
                        onInclude={(label, version, include) => memoryState.setIncluded(shown, label, version, include)}
                        onRemove={(label) => memoryState.remove(shown, label)}
                    />
                {/key}
            {/if}
        {/if}
    </section>
    {#if memoryState.sending}
        <section class="flex flex-col gap-3" aria-label={copy.sending_title}>
            <Heading level={2} size="lg">{copy.sending_title}</Heading>
            <MemorySendingPanel {copy} sending={memoryState.sending} />
        </section>
    {/if}
{/if}
