<!--
  @file ErrorOverlay.svelte
  @module @devpulse/sys/ErrorOverlay

  Last-resort fault panel. Renders when either:
  - `<svelte:boundary>` caught a synchronous error in a child component
    (mount-phase rune throws, import-time failures) — `error` prop is set.
  - `fatalErrorState.current` became non-null via the global handlers in
    `logger.ts` (uncaught exceptions, unhandled promise rejections).

  Why plain HTML + inline token vars instead of ColdLight components:
  the whole point of this overlay is to render when the rest of the
  stack failed. A design-system component that itself throws on mount
  would keep the user in black-screen land. The only runtime dependency
  here is CSS custom properties, and those are defined in the generated
  tokens layer that loads before any SvelteKit bundle.

  Colors use `oklch()` fallbacks so this renders correctly even if the
  ColdLight token layer never loaded.
-->
<script lang="ts">
import { clearFatal, fatalErrorState } from "./fatal-error.svelte.js";

interface Props {
	/** Error caught by `<svelte:boundary>` — takes priority over the fatal rune. */
	error?: unknown;
	/** Reset callback from `<svelte:boundary>`'s `failed` snippet. */
	reset?: () => void;
}

let { error, reset }: Props = $props();

const display = $derived.by(() => {
	if (error !== undefined && error !== null) {
		if (error instanceof Error) {
			return {
				message: error.message,
				stack: error.stack ?? null,
				origin: "boundary" as const,
			};
		}
		return {
			message: String(error),
			stack: null,
			origin: "boundary" as const,
		};
	}
	const fatal = fatalErrorState.current;
	if (fatal) {
		return {
			message: fatal.message,
			stack: fatal.stack,
			origin: fatal.origin,
		};
	}
	return null;
});

function copy() {
	if (!display) return;
	const text = [
		`DevPulse fatal error (${display.origin})`,
		display.message,
		"",
		display.stack ?? "(no stack)",
	].join("\n");
	navigator.clipboard?.writeText(text).catch(() => {
		// Clipboard API can reject in some webview contexts; silent fallback.
	});
}

function reload() {
	window.location.reload();
}

function dismiss() {
	clearFatal();
	reset?.();
}
</script>

{#if display}
	<div class="overlay" role="alertdialog" aria-labelledby="fatal-title" aria-describedby="fatal-msg">
		<div class="panel">
			<div class="bar" aria-hidden="true"></div>
			<h1 id="fatal-title" class="title">DevPulse failed to start</h1>
			<p class="origin">captured via <code>{display.origin}</code></p>
			<pre id="fatal-msg" class="message">{display.message}</pre>
			{#if display.stack}
				<pre class="stack">{display.stack}</pre>
			{/if}
			<div class="actions">
				<button type="button" class="btn btn-primary" onclick={reload}>Reload</button>
				<button type="button" class="btn" onclick={copy}>Copy details</button>
				<button type="button" class="btn btn-ghost" onclick={dismiss}>Dismiss</button>
			</div>
			<p class="hint">
				Details already sent to the Rust tracing pipeline. A session JSONL exists even if
				reload does not recover the app.
			</p>
		</div>
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 2147483647;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: var(--color-neutral-950, oklch(0.1 0.02 270 / 0.92));
		backdrop-filter: blur(0.5rem);
		color: var(--color-neutral-50, oklch(0.97 0.01 270));
		font-family:
			var(--font-family-sans, system-ui),
			-apple-system,
			sans-serif;
	}

	.panel {
		position: relative;
		width: min(56rem, 100%);
		max-height: 90vh;
		overflow: auto;
		padding: 2rem;
		border-radius: 0.75rem;
		background: var(--color-neutral-900, oklch(0.16 0.02 270));
		border: 0.0625rem solid var(--color-red-700, oklch(0.45 0.17 25));
		box-shadow: 0 1rem 3rem oklch(0 0 0 / 0.6);
	}

	.bar {
		position: absolute;
		inset: 0 0 auto 0;
		height: 0.25rem;
		border-top-left-radius: 0.75rem;
		border-top-right-radius: 0.75rem;
		background: var(--color-red-500, oklch(0.62 0.22 25));
	}

	.title {
		margin: 0 0 0.25rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-red-400, oklch(0.7 0.2 25));
	}

	.origin {
		margin: 0 0 1rem 0;
		font-size: 0.8125rem;
		opacity: 0.7;
	}

	.origin code {
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		background: var(--color-neutral-800, oklch(0.22 0.02 270));
		font-family: var(--font-family-mono, ui-monospace, monospace);
	}

	.message {
		margin: 0 0 1rem 0;
		padding: 0.75rem 1rem;
		border-radius: 0.5rem;
		background: var(--color-neutral-800, oklch(0.22 0.02 270));
		border-left: 0.1875rem solid var(--color-red-500, oklch(0.62 0.22 25));
		font-family: var(--font-family-mono, ui-monospace, monospace);
		font-size: 0.875rem;
		line-height: 1.5;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.stack {
		margin: 0 0 1.5rem 0;
		padding: 0.75rem 1rem;
		max-height: 20rem;
		overflow: auto;
		border-radius: 0.5rem;
		background: var(--color-neutral-950, oklch(0.1 0.02 270));
		border: 0.0625rem solid var(--color-neutral-800, oklch(0.22 0.02 270));
		font-family: var(--font-family-mono, ui-monospace, monospace);
		font-size: 0.75rem;
		line-height: 1.6;
		opacity: 0.85;
		white-space: pre;
	}

	.actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.btn {
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: 0.0625rem solid var(--color-neutral-700, oklch(0.3 0.02 270));
		background: var(--color-neutral-800, oklch(0.22 0.02 270));
		color: inherit;
		font: inherit;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 120ms ease;
	}

	.btn:hover {
		background: var(--color-neutral-700, oklch(0.3 0.02 270));
	}

	.btn-primary {
		background: var(--color-red-600, oklch(0.54 0.2 25));
		border-color: var(--color-red-500, oklch(0.62 0.22 25));
	}

	.btn-primary:hover {
		background: var(--color-red-500, oklch(0.62 0.22 25));
	}

	.btn-ghost {
		background: transparent;
	}

	.hint {
		margin: 0;
		font-size: 0.75rem;
		opacity: 0.55;
	}
</style>
