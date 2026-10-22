<!--
	@file ClyffyCollabView.svelte
	@module @devpulse/domains/app/models/feature/setup-wizard/feature/views/clyffy-collab

	Wizard step where the customer brings their own Claude API key
	(or notes their existing Claude Code subscription) so the cortex
	reasoning router can escalate hard turns to Claude alongside the
	local llama.cpp brain.

	## What this view does

	1. Detects an existing Claude Code install via the existing
	   `detectClaudeInstalls` Tauri command (no duplication — the
	   detector already exists for the MCP integration path).
	2. Polls `anthropicKeyPresent` so the "currently configured"
	   indicator reflects keyring reality (not just session state).
	3. Lets the customer paste an Anthropic API key, calls
	   `storeApiKey("anthropic-api", key)` (which goes to the OS
	   keychain via the existing credentials surface), then re-polls
	   presence.
	4. Surfaces "Open Claude Code" if a Claude Code install was
	   detected — convenience, not a hard dependency.

	Skippable. Customer can move through without setting a key —
	the cortex reasoning router will simply never escalate to Claude
	and will route every turn through the local brain.

	## Token + design discipline

	  - Mirrors the other view files (`OverlayShell` + scoped style)
	  - Surface gradient blends an accent against
	    `--surface-raised`; uses `--accent-blue-main` to harmonise
	    with the Cortex brain tile (both "deep thinking" surfaces)
	  - All sizing via `clamp()` — no inline values
	  - Layman copy throughout, no "API" jargon in primary text
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { Text } from "@devpulse/coldlight/components/text";
import { Check, ExternalLink, KeyRound, Sparkles } from "lucide-svelte";
import { commands } from "$lib/sys/generated/bindings.js";
import type { ClyffyCollabViewProps } from "../../util/wizard.types.js";
import OverlayShell from "../OverlayShell.svelte";

let { busy, callbacks }: ClyffyCollabViewProps = $props();

let keyInput = $state("");
let keyPresent = $state<boolean | null>(null);
let claudeCodeDetected = $state<boolean | null>(null);
let working = $state(false);
let errorMessage = $state<string | null>(null);

/**
 * On mount + on every focus return, refresh both signals so the
 * UI stays honest if the customer left to set the key in another
 * tool. `$effect` runs once per render-pass; the `wizardState.view`
 * gate upstream ensures we only mount on the right step.
 */
$effect(() => {
	void refreshPresence();
	void refreshDetect();
});

async function refreshPresence(): Promise<void> {
	const r = await commands.anthropicKeyPresent();
	if (r.status === "ok") keyPresent = r.data;
}

async function refreshDetect(): Promise<void> {
	// `detect_claude_installs` returns `ClaudeInstalls` directly — no
	// Result wrapper because the command is infallible (best-effort
	// filesystem probe, missing installs are an empty struct, not an
	// error). Unlike the other `commands.*` calls in this file the
	// response IS the data.
	const installs = await commands.detectClaudeInstalls();
	// `ClaudeInstall.configExists` reflects whether the per-target
	// config file is present on disk — the closest signal we have to
	// "Claude is installed here" without an Add Custom flow.
	claudeCodeDetected = installs.code.configExists || installs.desktop.configExists;
}

async function saveKey(): Promise<void> {
	const trimmed = keyInput.trim();
	if (trimmed.length === 0) {
		errorMessage = "Paste a key first.";
		return;
	}
	working = true;
	errorMessage = null;
	try {
		const r = await commands.storeApiKey("anthropic-api", trimmed);
		if (r.status === "ok") {
			keyInput = "";
			await refreshPresence();
		} else {
			errorMessage = String(r.error);
		}
	} finally {
		working = false;
	}
}
</script>

<OverlayShell
	label="DevPulse setup — collaborate with Claude"
	step={5}
	totalSteps={6}
	title="Pull Claude in alongside Clyffy"
>
	<div class="collab-view">
		<header class="collab-head">
			<Sparkles size={26} class="collab-icon" />
			<Text size="base" color="muted">
				When Clyffy's local brain wants a second opinion, it can ask
				Claude. Drop in an Anthropic API key, or skip this — you can
				always come back later.
			</Text>
		</header>

		<section class="key-panel">
			<div class="key-status">
				<Heading level={3} size="sm">Anthropic API key</Heading>
				{#if keyPresent === true}
					<Badge variant="positive" size="sm">
						<Check size={12} />
						Configured
					</Badge>
				{:else if keyPresent === false}
					<Badge variant="neutral" size="sm">Not set</Badge>
				{:else}
					<Spinner size="xs" tone="accent" />
				{/if}
			</div>
			<div class="key-input-row">
				<KeyRound size={16} class="input-icon" />
				<input
					class="key-input"
					type="password"
					placeholder="sk-ant-..."
					bind:value={keyInput}
					disabled={working || busy}
					autocomplete="off"
				/>
				<Button
					preset="primary"
					size="md"
					onclick={saveKey}
					disabled={working || busy || keyInput.trim().length === 0}
				>
					{#if working}<Spinner size="xs" tone="accent" />{/if}
					Save key
				</Button>
			</div>
			{#if errorMessage}
				<Text size="xs" class="error-line">{errorMessage}</Text>
			{/if}
			<Text size="xs" color="muted">
				The key lives in your OS keychain — Windows Credential Manager,
				macOS Keychain, or Linux Secret Service. It never touches the
				filesystem in plain text.
			</Text>
		</section>

		<section class="cc-panel">
			<div class="cc-head-row">
				<Heading level={3} size="sm">Claude Code (already installed?)</Heading>
				{#if claudeCodeDetected === true}
					<Badge variant="positive" size="sm">
						<Check size={12} />
						Detected
					</Badge>
				{:else if claudeCodeDetected === false}
					<Badge variant="neutral" size="sm">Not detected</Badge>
				{:else}
					<Spinner size="xs" tone="accent" />
				{/if}
			</div>
			<Text size="sm" color="muted">
				If you already use Claude Code with a Claude subscription, the
				MCP integration on a later step lets Clyffy and Claude work in
				the same conversation. No extra key needed for that path.
			</Text>
			<a
				class="cc-link"
				href="https://claude.com/claude-code"
				target="_blank"
				rel="noreferrer"
			>
				<Text size="xs">Learn more about Claude Code</Text>
				<ExternalLink size={12} />
			</a>
		</section>
	</div>

	{#snippet footer()}
		<Button preset="ghost" size="sm" onclick={callbacks.onBack} disabled={busy}>
			Back
		</Button>
		<Button
			preset="ghost"
			size="sm"
			onclick={callbacks.onSkip}
			disabled={busy}
		>
			Skip — set it up later
		</Button>
		<div class="footer-spacer"></div>
		<Button preset="primary" size="md" onclick={callbacks.onNext} disabled={busy}>
			Continue
		</Button>
	{/snippet}
</OverlayShell>

<style>
	.collab-view {
		display: flex;
		flex-direction: column;
		gap: clamp(1rem, 2vw, 1.5rem);
		min-width: 0;
		max-width: 44rem;
		margin-inline: auto;
	}

	.collab-head {
		display: flex;
		gap: clamp(0.75rem, 1.4vw, 1rem);
		align-items: flex-start;
		padding: clamp(0.875rem, 1.6vw, 1.125rem);
		border-radius: clamp(0.5rem, 0.8vw, 0.75rem);
		background: color-mix(in oklch, var(--accent-blue-main) 8%, var(--surface-raised));
		border: 0.0625rem solid
			color-mix(in oklch, var(--accent-blue-main) 22%, var(--border-subtle));
	}
	.collab-view :global(.collab-icon) {
		color: var(--accent-blue-main);
		flex-shrink: 0;
	}

	.key-panel,
	.cc-panel {
		display: flex;
		flex-direction: column;
		gap: clamp(0.5rem, 1vw, 0.75rem);
		padding: clamp(0.875rem, 1.6vw, 1.125rem);
		border-radius: clamp(0.5rem, 0.8vw, 0.75rem);
		background: var(--surface-raised);
		border: 0.0625rem solid var(--border-subtle);
	}

	.key-status,
	.cc-head-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.key-input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.collab-view :global(.input-icon) {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.key-input {
		flex: 1;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 0.875rem;
		color: var(--text-default);
		background: var(--surface-inset);
		border: 0.0625rem solid var(--border-subtle);
		border-radius: 0.375rem;
		transition: border-color 120ms ease;
	}
	.key-input:focus {
		outline: none;
		border-color: var(--accent-blue-main);
	}

	.collab-view :global(.error-line) {
		color: var(--accent-danger-main);
	}

	.cc-link {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		text-decoration: none;
		color: var(--text-muted);
		transition: color 120ms ease;
	}
	.cc-link:hover {
		color: var(--accent-blue-main);
	}

	.footer-spacer {
		flex: 1;
	}
</style>
