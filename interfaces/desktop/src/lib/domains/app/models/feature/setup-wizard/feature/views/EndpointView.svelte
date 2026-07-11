<!--
	@file EndpointView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/endpoint

	Wizard connect step — links standalone DevPulse (Tier-1) to a Clyffy
	endpoint so the AI layer lights up. Two modes surface here:

	  - Local — Clyffy on this machine or another box on the home network
	  - GB10  — the operator's box over their private mesh (manual address;
	    mDNS can't cross the mesh, so GB10 stays typed-in by design)

	The mode cards are layman guidance only — both resolve to the same
	address input, because a Clyffy endpoint IS a URL wherever it lives.
	The address is always operator-entered (discovery lands later, B8);
	nothing here ships or assumes an endpoint.

	## Parse-from-connection

	Connect fires the real `connectClyffy(url)` command (re-points the
	probe loop, no restart); every status cue then reads the
	`clyffyConnection` rune — `connecting` / `connected` / back to
	`disconnected` — exactly what the probe computed from the live
	capability handshake. Nothing in this view fabricates a state.

	Skip is a first-class choice: the app stays standalone (a mode,
	never an error) and the no-AI indicators stay on. `skip_hint` tells
	the customer the badge brings them back here anytime.

	## Token + design discipline

	  - Zero hardcoded strings — every visible string is `copy.*`
	    ([connect] table in wizard_copy.default.toml, Rust SSOT)
	  - Composes OverlayShell + Badge/Button/Heading/Spinner/Text only
	  - Scoped style is layout-only; fluid via cqi (inside .shell-root's
	    container context, S1.C); blue CTA via the `--cta-*` role alias
	    (Lock #6); mode cards tint with `--glass-blue` when selected
-->
<script lang="ts">
import { Check, Home, Server } from "lucide-svelte";
import { ClyffyMascot } from "$lib/design/blocks/clyffy/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { clyffyConnection } from "$lib/domains/clyffy/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import type { EndpointViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let { copy, busy, callbacks }: EndpointViewProps = $props();

/** Which mode card is highlighted — guidance only, both feed the same input. */
let mode = $state<"local" | "gb10">("local");
let urlInput = $state("");
let working = $state(false);
let errorMessage = $state<string | null>(null);
/** Set once the user pressed Connect — gates the failed-status hint so we
 *  never show "couldn't reach it" for an endpoint they haven't tried. */
let attempted = $state(false);

// Live wire state — capability-computed by the probe loop.
$effect(() => clyffyConnection.subscribe());

const connectionState = $derived(clyffyConnection.state.state);
const showFailed = $derived(attempted && !working && connectionState === "disconnected");

async function connect(): Promise<void> {
	const trimmed = urlInput.trim();
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

		<!-- Exclusive toggle pair (aria-pressed), not a hand-rolled radio
		     group — no roving-tabindex obligation, and ColdLight owns the
		     richer ARIA patterns. Guidance only: both feed the one input.
		     Chrome comes from the wizard-elevated preset; scoped CSS adds
		     ONLY layout + the selected/focus accent overlay. -->
		<div class="mode-row">
			<Card
				as="button"
				preset="wizard-elevated"
				class="mode-card"
				aria-pressed={mode === "local"}
				data-selected={mode === "local" ? "true" : undefined}
				onclick={() => {
					mode = "local";
				}}
			>
				<Home size={18} class="mode-icon" />
				<Heading level={3} size="sm">{copy?.mode_local_label ?? ""}</Heading>
				<Text size="xs" color="muted">{copy?.mode_local_hint ?? ""}</Text>
			</Card>
			<Card
				as="button"
				preset="wizard-elevated"
				class="mode-card"
				aria-pressed={mode === "gb10"}
				data-selected={mode === "gb10" ? "true" : undefined}
				onclick={() => {
					mode = "gb10";
				}}
			>
				<Server size={18} class="mode-icon" />
				<Heading level={3} size="sm">{copy?.mode_gb10_label ?? ""}</Heading>
				<Text size="xs" color="muted">{copy?.mode_gb10_hint ?? ""}</Text>
			</Card>
		</div>

		<Card preset="wizard-elevated" class="address-panel">
			<div class="address-head">
				<Heading level={3} size="sm">{copy?.url_label ?? ""}</Heading>
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
			<div class="address-row">
				<input
					class="address-input"
					type="text"
					placeholder={copy?.url_placeholder ?? ""}
					aria-label={copy?.url_aria ?? ""}
					bind:value={urlInput}
					disabled={working || busy}
					autocomplete="off"
					spellcheck="false"
				/>
				<Button
					preset="primary"
					size="md"
					aria-label={copy?.connect_aria ?? ""}
					onclick={connect}
					disabled={working || busy || urlInput.trim().length === 0}
				>
					{#if working || connectionState === "connecting"}<Spinner size="xs" tone="accent" />{/if}
					{copy?.connect_cta ?? ""}
				</Button>
			</div>
			{#if errorMessage}
				<Text size="xs" class="error-line">{errorMessage}</Text>
			{/if}
			{#if showFailed}
				<Text size="xs" color="muted">{copy?.status_failed ?? ""}</Text>
			{/if}
		</Card>

		<Text size="xs" color="muted">{copy?.skip_hint ?? ""}</Text>
	</div>

	{#snippet footer()}
		<Button preset="ghost" size="sm" onclick={callbacks.onBack} disabled={busy}>
			{copy?.back_label ?? ""}
		</Button>
		<Button
			preset="ghost"
			size="sm"
			aria-label={copy?.skip_aria ?? ""}
			onclick={callbacks.onSkip}
			disabled={busy}
		>
			{copy?.skip_label ?? ""}
		</Button>
		<div class="footer-spacer"></div>
		<Button preset="primary" size="md" onclick={callbacks.onNext} disabled={busy}>
			{copy?.continue_label ?? ""}
		</Button>
	{/snippet}
</OverlayShell>

<style>
	/* Layout-only; fluid via cqi (container = .shell-root, S1.C).
	   Surface chrome lives on the wizard-elevated preset — scoped CSS
	   adds layout + the ONE sanctioned selected/focus accent overlay. */
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

	/* `:global()` — classes land on child <Card> roots. Layout + accent
	   overlay only; bg/border/shadow/radius come from wizard-elevated. */
	.endpoint-view :global(.mode-card) {
		flex-direction: column;
		align-items: flex-start;
		gap: clamp(0.375rem, 0.8cqi, 0.5rem);
		padding: clamp(0.875rem, 1.6cqi, 1.125rem);
		text-align: left;
		cursor: pointer;
	}
	.endpoint-view :global(.mode-card[data-selected]) {
		/* Blue-tinted glass + CTA-blue edge — Lock #6 connect identity. */
		background-color: var(--glass-blue);
		border-color: color-mix(in oklch, var(--cta-main) 55%, var(--border-subtle));
		box-shadow: 0 0.1875rem 0.75rem 0 oklch(0 0 0 / 0.4), 0 0 1.25rem 0 var(--accent-blue-glow, oklch(0.68 0.14 240 / 0.35));
	}
	.endpoint-view :global(.mode-card:focus-visible) {
		outline: var(--border-width-thin) solid var(--cta-main);
		outline-offset: var(--outline-offset-md);
	}
	.endpoint-view :global(.mode-icon) {
		color: var(--cta-main);
	}

	.endpoint-view :global(.address-panel) {
		flex-direction: column;
		gap: clamp(0.5rem, 1cqi, 0.75rem);
		padding: clamp(0.875rem, 1.6cqi, 1.125rem);
	}

	.address-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.address-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.address-input {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: var(--font-size-sm);
		color: var(--text-default);
		background: var(--surface-inset);
		border: var(--border-width-hairline) solid var(--border-subtle);
		border-radius: 0.375rem;
		transition: border-color 120ms ease;
	}
	.address-input:focus {
		outline: none;
		border-color: var(--cta-main);
	}

	.endpoint-view :global(.error-line) {
		color: var(--accent-danger-main);
	}

	.footer-spacer {
		flex: 1;
	}
</style>
