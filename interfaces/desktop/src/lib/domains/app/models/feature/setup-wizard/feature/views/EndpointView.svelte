<!--
	@file EndpointView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/endpoint

	Wizard connect step — THIN composition, zero chrome of its own.
	Recoded 2026-07-14 (08/R4): every surface is a typed colocated
	variant from ../../ui/ wearing the build-generated runtime CSS by
	preset reference; this file owns layout divs, the command calls,
	and nothing else (Rust = brain, Svelte = dumb UI).

	Render story (two chrome tiers total, operator ruling):
	  shell (OverlayShell, wizard-deep)
	    ├─ mode row        → 2× ModeCard          (wizard-elevated wells)
	    ├─ discover row    → Button + live badges
	    ├─ scan surface    → ScanPanel            (wizard-inset well) —
	    │                    pops on scan start, renders ONLY
	    │                    signal-proven attempts (NO-MOCK LAW)
	    ├─ found list      → FoundEndpointCard(s) (wizard-elevated) —
	    │                    wire-truth capability, Confirm fires the
	    │                    real connectClyffy
	    └─ manual fallback → ManualEntry           (wizard-inset well)

	Discovery is READ-ONLY; the probe loop stays the sole
	connection-state writer. Skip is a first-class choice (standalone
	is a mode, never an error). Zero hardcoded English — every string
	is `copy.*` ([connect] table, Rust SSOT). Tooltips on every
	interactive element. Fluid via cqi (container = .shell-root, S1.C).
-->
<script lang="ts">
import { Check, Home, Radar, Server } from "@lucide/svelte";
import { onMount } from "svelte";
import { ClyffyMascot } from "$lib/design/blocks/clyffy/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/design/components/tooltip/index.js";
import { clyffyConnection } from "$lib/domains/clyffy/index.js";
import { commands, events } from "$lib/sys/generated/bindings.js";
import { scanState } from "../../scan.state.svelte.js";
import FoundEndpointCard from "../../ui/FoundEndpointCard.svelte";
import ManualEntry from "../../ui/ManualEntry.svelte";
import ModeCard from "../../ui/ModeCard.svelte";
import ScanPanel from "../../ui/ScanPanel.svelte";
import type { EndpointViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let { copy, busy, callbacks }: EndpointViewProps = $props();

/** Which mode card is highlighted — guidance only; discovery covers all
 *  modes today. 09/C4 makes this a real ConnectionMode filter. */
let mode = $state<"local" | "gb10">("local");

// ── Manual fallback ───────────────────────────────────────────────
let manualOpen = $state(false);
let working = $state(false);
let errorMessage = $state<string | null>(null);
/** Set once a connect was attempted — gates the failed-status hint so we
 *  never show "couldn't reach it" for an endpoint they haven't tried. */
let attempted = $state(false);

// Live wire state — capability-computed by the probe loop.
$effect(() => clyffyConnection.subscribe());

const connectionState = $derived(clyffyConnection.state.state);
const showFailed = $derived(attempted && !working && connectionState === "disconnected");

/** The operator confirmed an endpoint and the probe loop settled it to
 *  `connected` — their intent completed, so the step completes: advance to
 *  the capability view (wire truth renders there). Gated to fire ONCE per
 *  attempt; never fires for a pre-existing connection the operator didn't
 *  just make (attempted stays false until their click). */
let autoAdvanced = $state(false);
$effect(() => {
	if (attempted && !autoAdvanced && connectionState === "connected") {
		autoAdvanced = true;
		callbacks.onNext();
	}
});

// Every discovery signal folds into scanState — the panel renders only
// what these REAL events prove (source_scanned / candidate_probed /
// found / finished).
onMount(() => {
	let unlisten: (() => void) | undefined;
	void events.clyffyDiscoveryProgress
		.listen(({ payload }) => {
			scanState.ingest(payload.event);
		})
		.then((un) => {
			unlisten = un;
		});
	return () => unlisten?.();
});

async function discover(): Promise<void> {
	scanState.begin();
	const r = await commands.discoverClyffy();
	if (r.status === "ok") {
		// Authoritative final list — union with the streamed truth.
		scanState.reconcile(r.data);
	} else {
		scanState.fail(String(r.error));
	}
}

async function connect(url: string): Promise<void> {
	const trimmed = url.trim();
	if (trimmed.length === 0) {
		errorMessage = copy?.error_empty ?? "";
		return;
	}
	working = true;
	errorMessage = null;
	try {
		const r = await commands.connectClyffy(trimmed);
		if (r.status === "ok") {
			attempted = true;
		} else {
			errorMessage = String(r.error);
		}
	} finally {
		working = false;
	}
}
</script>

<OverlayShell
	label={copy?.title ?? ""}
	step={1}
	totalSteps={2}
	title={copy?.title ?? ""}
>
	{#snippet mascot()}
		<!-- ClyffyMascot is LOCKED on wizard steps (mascot ≠ brain icon). -->
		<ClyffyMascot pose="pointing" size="lg" />
	{/snippet}

	<div class="endpoint-view">
		<Text size="base" color="muted">{copy?.subtitle ?? ""}</Text>

		<!-- Mode guidance — typed ModeCard variants (aria-pressed pair). -->
		<div class="mode-row">
			<ModeCard
				icon={Home}
				label={copy?.mode_local_label ?? ""}
				hint={copy?.mode_local_hint ?? ""}
				tooltip={copy?.mode_local_tooltip ?? ""}
				selected={mode === "local"}
				disabled={busy}
				onselect={() => {
					mode = "local";
				}}
			/>
			<ModeCard
				icon={Server}
				label={copy?.mode_gb10_label ?? ""}
				hint={copy?.mode_gb10_hint ?? ""}
				tooltip={copy?.mode_gb10_tooltip ?? ""}
				selected={mode === "gb10"}
				disabled={busy}
				onselect={() => {
					mode = "gb10";
				}}
			/>
		</div>

		<!-- ── Turnkey discovery — the primary path ─────────────────── -->
		<div class="discover-row">
			<Tooltip>
				<TooltipTrigger>
					<Button
						preset="primary"
						size="md"
						aria-label={copy?.discover_aria ?? ""}
						onclick={discover}
						disabled={busy || scanState.phase === "searching"}
					>
						{#if scanState.phase === "searching"}
							<Spinner size="xs" tone="accent" />
							{copy?.discovering ?? ""}
						{:else}
							<Radar size={16} />
							{copy?.discover_cta ?? ""}
						{/if}
					</Button>
				</TooltipTrigger>
				<TooltipContent preset="stark">{copy?.discover_tooltip ?? ""}</TooltipContent>
			</Tooltip>
			{#if connectionState === "connected"}
				<Badge variant="positive" size="sm">
					<Check size={12} />
					{copy?.status_connected ?? ""}
				</Badge>
			{:else if connectionState === "connecting"}
				<Badge variant="neutral" size="sm">
					<Spinner size="xs" tone="accent" />
					{copy?.status_connecting ?? ""}
				</Badge>
			{/if}
		</div>

		<!-- The live scan surface — pops on scan start, truth only. -->
		<ScanPanel
			{copy}
			phase={scanState.phase}
			rungs={scanState.rungs}
			probes={scanState.probes}
			probedTotal={scanState.probedTotal}
			foundTotal={scanState.foundTotal}
			error={scanState.error}
		/>

		{#if scanState.found.length > 0}
			<section class="found-list" aria-label={copy?.found_title ?? ""}>
				<Text size="sm">{copy?.found_title ?? ""}</Text>
				{#each scanState.found as endpoint (endpoint.url)}
					<FoundEndpointCard
						{endpoint}
						working={working || busy}
						confirmLabel={copy?.confirm_cta ?? ""}
						confirmTooltip={copy?.confirm_tooltip ?? ""}
						onConfirm={connect}
					/>
				{/each}
				<!-- Confirm-path failures were only visible in ManualEntry before —
				     honest feedback belongs beside the card that failed too. -->
				{#if errorMessage && !manualOpen}
					<Text size="xs" class="error-line">{errorMessage}</Text>
				{/if}
			</section>
		{:else if scanState.phase === "done" && !scanState.error}
			<Text size="xs" color="muted">{copy?.none_found ?? ""}</Text>
			<Text size="xs" color="muted">{copy?.degraded_hint ?? ""}</Text>
		{/if}

		<!-- ── Manual fallback — always reachable, never the front door ── -->
		{#if !manualOpen}
			<div>
				<Tooltip>
					<TooltipTrigger>
						<Button
							preset="ghost"
							size="sm"
							onclick={() => {
								manualOpen = true;
							}}
							disabled={busy}
						>
							{copy?.manual_reveal ?? ""}
						</Button>
					</TooltipTrigger>
					<TooltipContent preset="stark">{copy?.manual_tooltip ?? ""}</TooltipContent>
				</Tooltip>
			</div>
		{:else}
			<ManualEntry
				label={copy?.url_label ?? ""}
				placeholder={copy?.url_placeholder ?? ""}
				inputAria={copy?.url_aria ?? ""}
				inputTooltip={copy?.url_tooltip ?? ""}
				connectLabel={copy?.connect_cta ?? ""}
				connectAria={copy?.connect_aria ?? ""}
				{working}
				disabled={busy}
				errorText={errorMessage}
				{showFailed}
				failedHint={copy?.status_failed ?? ""}
				onConnect={connect}
			/>
		{/if}

		<Text size="xs" color="muted">{copy?.skip_hint ?? ""}</Text>
	</div>

	{#snippet footer()}
		<Tooltip>
			<TooltipTrigger>
				<Button preset="ghost" size="sm" onclick={callbacks.onBack} disabled={busy}>
					{copy?.back_label ?? ""}
				</Button>
			</TooltipTrigger>
			<TooltipContent preset="stark">{copy?.back_tooltip ?? ""}</TooltipContent>
		</Tooltip>
		<Tooltip>
			<TooltipTrigger>
				<Button
					preset="ghost"
					size="sm"
					aria-label={copy?.skip_aria ?? ""}
					onclick={callbacks.onSkip}
					disabled={busy}
				>
					{copy?.skip_label ?? ""}
				</Button>
			</TooltipTrigger>
			<TooltipContent preset="stark">{copy?.skip_tooltip ?? ""}</TooltipContent>
		</Tooltip>
		<div class="footer-spacer"></div>
		<Tooltip>
			<TooltipTrigger>
				<Button preset="primary" size="md" onclick={callbacks.onNext} disabled={busy}>
					{copy?.continue_label ?? ""}
				</Button>
			</TooltipTrigger>
			<TooltipContent preset="stark">{copy?.continue_tooltip ?? ""}</TooltipContent>
		</Tooltip>
	{/snippet}
</OverlayShell>

<style>
	/* LAYOUT ONLY — every chrome/effect lives in the preset chains the
	   colocated variants wear. Fluid via cqi (S1.C). */
	.endpoint-view {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2cqi, 1.5rem);
		min-width: 0;
		max-width: 44rem;
		margin-inline: auto;
	}

	.mode-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: clamp(0.75rem, 1.4cqi, 1rem);
	}

	.discover-row {
		display: flex;
		align-items: center;
		gap: clamp(0.5rem, 1cqi, 0.75rem);
	}

	.found-list {
		display: flex;
		flex-direction: column;
		gap: clamp(0.5rem, 1cqi, 0.75rem);
		min-width: 0;
	}

	.footer-spacer {
		flex: 1;
	}
</style>
