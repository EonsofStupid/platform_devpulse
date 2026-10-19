<!--
  @file ActivityHud.svelte
  @description Live HUD for in-flight user actions — intent, timer, knowledge drops, errors.
-->
<script lang="ts">
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { cssVarString, renderForge } from "@devpulse/coldlight/renderforge";
import { onDestroy } from "svelte";
import { commands } from "$lib/sys/generated/bindings.js";
import { actionBus } from "../action-bus.svelte.js";
import type { ActionId } from "../action-ids.js";
import { knowledgeLinesForAction } from "./knowledge-drops.js";

const card = $derived(renderForge({ kind: "chrome", preset: "neuro-solid" }));

let elapsedMs = $state(0);
let tick: ReturnType<typeof setInterval> | null = null;
let knowledgeIdx = $state(0);
let knowledgeTick: ReturnType<typeof setInterval> | null = null;

function unwrap<T>(r: { status: "ok"; data: T } | { status: "error"; error: unknown }): T {
	if (r.status === "error") {
		const msg = typeof r.error === "string" ? r.error : String(r.error);
		throw new Error(msg);
	}
	return r.data;
}

$effect(() => {
	const cur = actionBus.current;
	if (!cur) {
		elapsedMs = 0;
		if (tick) {
			clearInterval(tick);
			tick = null;
		}
		if (knowledgeTick) {
			clearInterval(knowledgeTick);
			knowledgeTick = null;
		}
		return;
	}

	const update = () => {
		elapsedMs = Math.round(performance.now() - cur.startedAt);
	};
	update();
	tick = setInterval(update, 250);

	return () => {
		if (tick) {
			clearInterval(tick);
			tick = null;
		}
	};
});

$effect(() => {
	const cur = actionBus.current;
	void elapsedMs;
	const lines = cur ? [...knowledgeLinesForAction(cur.id as ActionId)] : [];
	if (!cur || elapsedMs < 1000 || lines.length === 0) {
		if (knowledgeTick) {
			clearInterval(knowledgeTick);
			knowledgeTick = null;
		}
		return;
	}
	knowledgeIdx = 0;
	knowledgeTick = setInterval(() => {
		knowledgeIdx = (knowledgeIdx + 1) % lines.length;
	}, 3000);
	return () => {
		if (knowledgeTick) {
			clearInterval(knowledgeTick);
			knowledgeTick = null;
		}
	};
});

$effect(() => {
	const err = actionBus.lastError;
	if (!err) return;
	const t = setTimeout(() => {
		if (actionBus.lastError?.at === err.at) {
			actionBus.clearLastError();
		}
	}, 10_000);
	return () => clearTimeout(t);
});

onDestroy(() => {
	if (tick) clearInterval(tick);
	if (knowledgeTick) clearInterval(knowledgeTick);
});

const knowledgeLine = $derived.by(() => {
	const cur = actionBus.current;
	if (!cur || elapsedMs < 1000) return null;
	const lines = [...knowledgeLinesForAction(cur.id as ActionId)];
	if (lines.length === 0) return null;
	return lines[knowledgeIdx % lines.length];
});

async function openLogsFolder(): Promise<void> {
	try {
		unwrap(await commands.openActionLogsFolder());
	} catch {
		/* toast already visible */
	}
}

async function copyError(msg: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(msg);
	} catch {
		/* ignore */
	}
}
</script>

{#if actionBus.current}
	<div
		class="pointer-events-auto fixed bottom-6 right-6 z-[60] max-w-sm rounded-xl border p-4 shadow-lg"
		{...card.dataAttrs}
		style={cssVarString(card.cssVars)}
		data-kind="activity-hud"
		role="status"
		aria-live="polite"
		aria-busy="true"
	>
		<div class="flex items-start gap-3">
			<div class="mt-0.5 shrink-0" aria-hidden="true">
				<Spinner size="sm" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="text-sm font-medium leading-snug text-[var(--color)]">
					{actionBus.current.intent}
				</p>
				<p class="mt-1 font-mono text-[0.65rem] text-[var(--color)] opacity-60">
					{actionBus.current.id}
				</p>
				<p class="mt-1 text-xs tabular-nums opacity-80">
					{(elapsedMs / 1000).toFixed(1)}s
				</p>
				{#if knowledgeLine}
					<p class="mt-2 border-t border-[var(--border-color)] pt-2 text-xs leading-relaxed opacity-90">
						{knowledgeLine}
					</p>
				{/if}
			</div>
		</div>
	</div>
{/if}

{#if actionBus.lastError}
	<div
		class="pointer-events-auto fixed bottom-6 left-6 z-[60] max-w-md rounded-lg border border-red-500/40 bg-red-950/90 p-4 text-sm text-red-100 shadow-lg"
		role="alert"
	>
		<p class="font-medium">Action failed</p>
		<p class="mt-2 whitespace-pre-wrap break-words opacity-95">{actionBus.lastError.message}</p>
		<div class="mt-3 flex flex-wrap gap-2">
			<button
				type="button"
				class="rounded border border-red-400/50 px-2 py-1 text-xs hover:bg-red-900/50"
				onclick={() => copyError(actionBus.lastError?.message ?? "")}
			>
				Copy error
			</button>
			<button
				type="button"
				class="rounded border border-red-400/50 px-2 py-1 text-xs hover:bg-red-900/50"
				onclick={() => openLogsFolder()}
			>
				Open log folder
			</button>
		</div>
	</div>
{/if}
