<!--
	@block ClyffyKnowledgeNudge
	@module @devpulse/design/blocks/clyffy

	The Clyffy knowledge-drop surface — the layman-friendly nudge
	that pulls a randomized DYK / kdrop / frust / insight / gloss
	from the kernel's affinity-weighted catalog and renders it as a
	dismissable inline card with helpful / not-helpful reactions.

	Locked product requirement #7 (model_loader_requirements.md):
	"First page = Clyffy knowledge-drop overlay surface · randomly
	pulls or extends the catalog · passive nudges on mouseover of
	technical links / actions."

	# Two trigger modes

	- **Auto (`mode="auto"`)** — fetches a fresh entry on mount and
	  shows it inline. Use on first-run surfaces (Welcome, Hardware,
	  Preset) where the nudge is the primary attention object.
	- **Hover (`mode="hover"`)** — wraps a trigger snippet; fetches
	  + shows on mouseover, dismisses on mouseleave or click-away.
	  Use on technical terms ("Phi-15B", "VRAM tier") so the user
	  gets a definition without leaving the page.

	# Wire-up — auto on a wizard step

	```svelte
	<ClyffyKnowledgeNudge
		mode="auto"
		entryType="kdrop"
		tool="wizard"
		dismissAfterMs={20000}
	/>
	```

	# Wire-up — hover nudge on a glossary term

	```svelte
	<ClyffyKnowledgeNudge mode="hover" entryType="gloss" tool="models">
		{#snippet trigger()}
			<span class="glossary-term">VRAM tier</span>
		{/snippet}
	</ClyffyKnowledgeNudge>
	```

	# ARIA contract

	- `role="status"` on the card so screen readers announce the
	  appearance non-disruptively (DYK content is informative, not
	  blocking).
	- Helpful / not-helpful buttons have explicit `aria-label`s
	  (the visible label is just an emoji-free word).
	- Dismiss button is `aria-label="Dismiss tip"` (not just an X).

	# Layman copy contract

	Labels (Helpful, Not helpful, Dismiss, the heading prefix per
	entryType) all flow in via props. No hardcoded English here — the
	caller resolves them from the cascade (typed `KnowledgeNudgeCopy`
	struct from `wizard_copy.toml`).
-->
<script lang="ts">
import type { Snippet } from "svelte";
import { onMount } from "svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Card } from "$lib/design/components/card/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { knowledgeState } from "$lib/domains/app/knowledge/data-access/knowledge.state.svelte.js";
import {
	hasTitleBody,
	isGlossary,
	type KnowledgeEntryType,
} from "$lib/domains/app/knowledge/util/knowledge.types.js";

interface NudgeCopy {
	/** "Helpful" button label. */
	helpfulLabel: string;
	/** "Not helpful" button label. */
	notHelpfulLabel: string;
	/** Dismiss icon button `aria-label`. */
	dismissAria: string;
	/** Prefix shown ahead of the entry title — e.g. "Did you know?". */
	headingPrefixDyk?: string;
	/** Prefix for kdrop entries. */
	headingPrefixKdrop?: string;
	/** Prefix for frustration-relief entries. */
	headingPrefixFrust?: string;
	/** Prefix for insight entries. */
	headingPrefixInsight?: string;
	/** Prefix for glossary entries (e.g. "Glossary"). */
	headingPrefixGloss?: string;
}

interface Props {
	/**
	 * Trigger mode. `auto` mounts the card inline + auto-fetches.
	 * `hover` wraps a trigger and shows on mouseover only.
	 */
	mode: "auto" | "hover";
	/** Which knowledge catalog to pull from. */
	entryType: KnowledgeEntryType;
	/**
	 * Tool context — affinity-weights selection toward entries
	 * tagged for this tool ("models", "wizard", "rro", …).
	 */
	tool?: string;
	/**
	 * Layman label strings. When omitted, falls back to a built-in
	 * minimal English set (escape hatch only — production callers
	 * MUST inject from the cascade).
	 */
	copy?: NudgeCopy;
	/**
	 * Auto-dismiss the card after N ms with no user interaction.
	 * Mode-only: `auto`. `hover` follows the trigger's mouseleave.
	 */
	dismissAfterMs?: number;
	/**
	 * Trigger element snippet — required when `mode="hover"`. The
	 * block wraps the snippet in a `<span>` with mouseenter /
	 * mouseleave / focus / blur handlers and announces the popover
	 * via `aria-describedby`.
	 */
	trigger?: Snippet;
}

const DEFAULT_COPY: NudgeCopy = {
	helpfulLabel: "Helpful",
	notHelpfulLabel: "Not helpful",
	dismissAria: "Dismiss tip",
	headingPrefixDyk: "Did you know?",
	headingPrefixKdrop: "Tip",
	headingPrefixFrust: "Heads up",
	headingPrefixInsight: "Insight",
	headingPrefixGloss: "Glossary",
};

let { mode, entryType, tool, copy, dismissAfterMs = 20000, trigger }: Props = $props();

const resolved = $derived<NudgeCopy>({ ...DEFAULT_COPY, ...copy });

const entry = $derived(knowledgeState.current);
const isOwnEntry = $derived(entry !== null && entry.entryType === entryType);

let hoverOpen = $state(false);
let autoDismissTimer: ReturnType<typeof setTimeout> | null = null;

const prefixForType = $derived.by(() => {
	switch (entryType) {
		case "dyk":
			return resolved.headingPrefixDyk;
		case "kdrop":
			return resolved.headingPrefixKdrop;
		case "frust":
			return resolved.headingPrefixFrust;
		case "insight":
			return resolved.headingPrefixInsight;
		case "gloss":
			return resolved.headingPrefixGloss;
	}
});

async function fetchEntry(): Promise<void> {
	await knowledgeState.fetchNext(entryType, tool);
	if (mode === "auto" && dismissAfterMs > 0) {
		armAutoDismiss();
	}
}

function armAutoDismiss(): void {
	if (autoDismissTimer !== null) clearTimeout(autoDismissTimer);
	autoDismissTimer = setTimeout(() => {
		knowledgeState.dismiss();
		autoDismissTimer = null;
	}, dismissAfterMs);
}

function cancelAutoDismiss(): void {
	if (autoDismissTimer !== null) {
		clearTimeout(autoDismissTimer);
		autoDismissTimer = null;
	}
}

async function handleReact(reaction: "helpful" | "not_helpful"): Promise<void> {
	cancelAutoDismiss();
	await knowledgeState.react(reaction);
}

function handleDismiss(): void {
	cancelAutoDismiss();
	knowledgeState.dismiss();
}

async function handleTriggerEnter(): Promise<void> {
	if (mode !== "hover") return;
	if (!entry || !isOwnEntry) {
		await fetchEntry();
	}
	hoverOpen = true;
}

function handleTriggerLeave(): void {
	if (mode !== "hover") return;
	hoverOpen = false;
}

onMount(() => {
	if (mode === "auto") {
		void fetchEntry();
	}
	return () => {
		cancelAutoDismiss();
	};
});
</script>

{#if mode === "hover"}
	<span
		class="clyffy-nudge__trigger"
		onmouseenter={handleTriggerEnter}
		onmouseleave={handleTriggerLeave}
		onfocusin={handleTriggerEnter}
		onfocusout={handleTriggerLeave}
		role="presentation"
	>
		{#if trigger}
			{@render trigger()}
		{/if}
	</span>

	{#if hoverOpen && entry && isOwnEntry}
		<div class="clyffy-nudge__hover-card" role="tooltip">
			<Card preset="glass" class="clyffy-nudge__card">
				{#if hasTitleBody(entry)}
					<header class="clyffy-nudge__header">
						<Text size="xs" weight="semibold" color="muted" as="p">
							{prefixForType}
						</Text>
						<Text size="sm" weight="semibold" as="p">{entry.payload.title}</Text>
					</header>
					<Text size="sm" as="p">{entry.payload.body}</Text>
				{:else if isGlossary(entry)}
					<header class="clyffy-nudge__header">
						<Text size="xs" weight="semibold" color="muted" as="p">
							{prefixForType}
						</Text>
						<Text size="sm" weight="semibold" as="p">{entry.payload.term}</Text>
					</header>
					<Text size="sm" as="p">{entry.payload.definition}</Text>
				{/if}
			</Card>
		</div>
	{/if}
{:else if entry && isOwnEntry}
	<div class="clyffy-nudge__auto" role="status" aria-live="polite">
		<Card preset="glass" class="clyffy-nudge__card">
			<header class="clyffy-nudge__header">
				<Text size="xs" weight="semibold" color="muted" as="p">{prefixForType}</Text>
				{#if hasTitleBody(entry)}
					<Text size="sm" weight="semibold" as="p">{entry.payload.title}</Text>
				{:else if isGlossary(entry)}
					<Text size="sm" weight="semibold" as="p">{entry.payload.term}</Text>
				{/if}
			</header>

			{#if hasTitleBody(entry)}
				<Text size="sm" as="p">{entry.payload.body}</Text>
			{:else if isGlossary(entry)}
				<Text size="sm" as="p">{entry.payload.definition}</Text>
			{/if}

			<footer class="clyffy-nudge__footer">
				<Button
					preset="ghost"
					size="sm"
					aria-label={resolved.helpfulLabel}
					onclick={() => handleReact("helpful")}
				>
					{resolved.helpfulLabel}
				</Button>
				<Button
					preset="ghost"
					size="sm"
					aria-label={resolved.notHelpfulLabel}
					onclick={() => handleReact("not_helpful")}
				>
					{resolved.notHelpfulLabel}
				</Button>
				<div class="clyffy-nudge__spacer"></div>
				<Button
					preset="ghost"
					size="sm"
					aria-label={resolved.dismissAria}
					onclick={handleDismiss}
				>
					×
				</Button>
			</footer>
		</Card>
	</div>
{/if}

<style>
	/* Inline trigger wrapper — no chrome, just event hooks. The
	   trigger snippet provides its own styling (e.g. underline on a
	   glossary term). */
	.clyffy-nudge__trigger {
		display: inline-flex;
		align-items: baseline;
	}

	/* Hover-mode floating card — positioned absolutely relative to
	   the trigger's offset parent. Caller controls page-level
	   layout; this block just owns the visual chrome. */
	.clyffy-nudge__hover-card {
		position: absolute;
		z-index: 70;
		margin-top: var(--space-5);
		max-width: 22rem;
		pointer-events: none;
	}

	.clyffy-nudge__auto {
		display: block;
		max-width: 32rem;
	}

	:global(.clyffy-nudge__card) {
		display: flex;
		flex-direction: column;
		gap: var(--space-7);
		padding: var(--space-9) var(--space-10);
	}

	.clyffy-nudge__header {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
	}

	.clyffy-nudge__footer {
		display: flex;
		align-items: center;
		gap: var(--space-5);
	}

	.clyffy-nudge__spacer {
		flex: 1;
	}
</style>
