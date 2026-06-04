<!--
	@component SwapPrimaryBrainButton
	@domain platform/_shared

	Single-click swap of whatever model backs a slot (default `chat.brain`).
	While the Tauri command runs (unload → reassign → load), a
	full-viewport Clyffy overlay with rotating DYK/KDROPS/T&T card keeps
	the user informed. Logging + try/catch guard every step.

	# Usage

	```svelte
	<SwapPrimaryBrainButton
		newModelId="phi-4-reasoning-vision-15b"
		label="Make Phi the primary brain"
	/>
	```

	# Lifecycle

	1. Click → `logInfo("swap.primary", "begin", …)` → overlay opens.
	2. `await commands.swapSlotModel(slotId, newModelId)` — kernel runs
	   the atomic unload → reassign → load sequence.
	3. On `ok`: `logInfo` complete, toast success, refresh `modelsState`,
	   fire optional `onComplete(true)` callback.
	4. On `error`: `logInfo` failed, toast error, fire optional
	   `onComplete(false, errorText)`. The overlay closes either way.

	The kernel also emits the `model:swap-started`, `model:swap-complete`,
	`model:swap-failed` Tauri events for OTHER listeners (status bars,
	telemetry). This component does not need them — Promise resolution
	carries the final outcome.
-->
<script lang="ts">
import { BrainCog } from "lucide-svelte";
import { Button, type ButtonPreset } from "$lib/design/components/button/index.js";
import { LoadingBlock } from "$lib/design/components/spinner/index.js";
import { modelsState } from "$lib/domains/app/models/index.js";
import { commands } from "$lib/sys/generated/bindings.js";
import { logInfo } from "$lib/sys/logger.js";

interface Props {
	/** Model id to assign to the slot. */
	newModelId: string;
	/** Slot to swap. Defaults to `chat.brain` — the primary brain slot. */
	slotId?: string;
	/** Button label. Default: "Make primary brain". */
	label?: string;
	/** Size of the inner Button. */
	size?: "sm" | "md" | "lg";
	/** Visual preset forwarded to the inner Button. */
	preset?: ButtonPreset;
	/** Disable the button (e.g. when the target model is already primary). */
	disabled?: boolean;
	/**
	 * Callback fired after the swap resolves. `ok=true` on success,
	 * `ok=false` with `error` text on failure. Use this to refresh
	 * parent state beyond `modelsState` or to update local flags.
	 */
	onComplete?: (ok: boolean, error?: string) => void;
}

let {
	newModelId,
	slotId = "chat.brain",
	label = "Make primary brain",
	size = "sm",
	preset = "primary",
	disabled = false,
	onComplete,
}: Props = $props();

let pending = $state(false);

async function handleClick(): Promise<void> {
	if (pending || disabled) return;

	pending = true;
	logInfo("swap.primary", `begin slot=${slotId} newModelId=${newModelId}`);
	const start = performance.now();

	try {
		const result = await commands.swapSlotModel(slotId, newModelId);
		const time_ms = Math.round(performance.now() - start);

		if (result.status === "ok") {
			logInfo(
				"swap.primary",
				`complete slot=${slotId} newModelId=${newModelId} time_ms=${time_ms}`,
			);
			// Refresh slot + status state so consumers re-render.
			await modelsState.refresh();
			try {
				const { toast } = await import("svelte-sonner");
				toast.success(`Primary brain swapped to ${newModelId}`);
			} catch {
				// toast failure is non-fatal
			}
			onComplete?.(true);
		} else {
			const errorText =
				typeof result.error === "string" ? result.error : JSON.stringify(result.error);
			logInfo(
				"swap.primary",
				`failed slot=${slotId} newModelId=${newModelId} error=${errorText} time_ms=${time_ms}`,
			);
			try {
				const { toast } = await import("svelte-sonner");
				toast.error(`Swap failed: ${errorText}`);
			} catch {
				// toast failure is non-fatal
			}
			onComplete?.(false, errorText);
		}
	} catch (e) {
		const errorText = e instanceof Error ? e.message : String(e);
		const time_ms = Math.round(performance.now() - start);
		logInfo(
			"swap.primary",
			`threw slot=${slotId} newModelId=${newModelId} error=${errorText} time_ms=${time_ms}`,
		);
		try {
			const { toast } = await import("svelte-sonner");
			toast.error(`Swap threw: ${errorText}`);
		} catch {
			// toast failure is non-fatal
		}
		onComplete?.(false, errorText);
	} finally {
		pending = false;
	}
}
</script>

<Button {preset} {size} onclick={handleClick} disabled={disabled || pending}>
	<BrainCog size={14} />
	{label}
</Button>

{#if pending}
	<!-- Full-viewport overlay. Mounted at the component site — Svelte
	     hoists it out of layout flow via `position: fixed`, so the
	     overlay covers the whole window regardless of where the button
	     was clicked. Z-index 100 sits above nav chrome + modals. -->
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center"
		style="background: color-mix(in oklch, var(--surface-base) 80%, transparent); backdrop-filter: blur(var(--blur-md));"
		role="alertdialog"
		aria-live="assertive"
		aria-label="Swapping primary brain"
	>
		<div class="max-w-md w-full mx-4">
			<LoadingBlock
				title="Swapping primary brain…"
				subtitle={`Safely loading ${newModelId} into VRAM — sit tight.`}
				showContent
				contentKind="dyk"
			/>
		</div>
	</div>
{/if}
