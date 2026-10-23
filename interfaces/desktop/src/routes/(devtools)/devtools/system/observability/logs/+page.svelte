<!--
  @file +page.svelte (devtools /logs)
  @description Live tail of action.jsonl with filter + open folder.
-->
<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { commands } from "$lib/sys/generated/bindings.js";
import { routeCopy, routeHere } from "$lib/sys/routing/index.js";

const here = $derived(routeHere());
const heading = $derived(here ? routeCopy(here) : undefined);

let filter = $state("");
let lines = $state<string[]>([]);
let offset = $state(0);
let poll: ReturnType<typeof setInterval> | null = null;

function unwrap<T>(r: { status: "ok"; data: T } | { status: "error"; error: unknown }): T {
	if (r.status === "error") {
		const msg = typeof r.error === "string" ? r.error : String(r.error);
		throw new Error(msg);
	}
	return r.data;
}

async function tailOnce(): Promise<void> {
	try {
		const tail = unwrap(await commands.tailActionLog(offset));
		offset = tail.next_offset;
		if (tail.lines.length > 0) {
			lines = [...lines, ...tail.lines];
		}
	} catch {
		/* offline / no file yet */
	}
}

async function openFolder(): Promise<void> {
	try {
		unwrap(await commands.openActionLogsFolder());
	} catch {
		/* ignore */
	}
}

onMount(() => {
	void tailOnce();
	poll = setInterval(() => void tailOnce(), 500);
});

onDestroy(() => {
	if (poll) clearInterval(poll);
});

const filtered = $derived.by(() => {
	const q = filter.trim().toLowerCase();
	if (!q) return lines;
	return lines.filter((l) => l.toLowerCase().includes(q));
});
</script>

<div class="mx-auto flex max-w-5xl flex-col gap-4 p-6 font-sans text-sm">
	<header class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-lg font-semibold">{heading?.label}</h1>
			<p class="text-[var(--text-muted)]">
				Tailing <code class="rounded bg-black/30 px-1">.userdata/logs/action-*.jsonl</code> (today).
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<button
				type="button"
				class="rounded border border-[var(--border-soft)] px-3 py-1.5 hover:bg-white/5"
				onclick={() => openFolder()}
			>
				Open folder
			</button>
		</div>
	</header>

	<label class="flex flex-col gap-1">
		<span class="text-xs text-[var(--text-muted)]">Filter (substring)</span>
		<input
			class="rounded border border-[var(--border-soft)] bg-black/20 px-3 py-2 font-mono text-xs"
			bind:value={filter}
			placeholder="e.g. models.refresh or error"
			autocomplete="off"
		/>
	</label>

	<div
		class="max-h-[70vh] overflow-auto rounded border border-[var(--border-soft)] bg-black/25 p-3 font-mono text-xs leading-relaxed"
		role="log"
		aria-live="polite"
	>
		{#if filtered.length === 0}
			<p class="text-[var(--text-muted)]">No lines yet — trigger a wrapped action from the app.</p>
		{:else}
			<ul class="space-y-1">
				{#each filtered as line, i (i)}
					<li class="whitespace-pre-wrap break-all">{line}</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
