<script lang="ts">
import "../app.css";
// Style presets compiled via SD5 DTCG pipeline → components.generated.css
// Loaded via app.css → design/index.css → css/index.css import chain
import { invoke } from "@tauri-apps/api/core";
import { onMount } from "svelte";
import TokenDebugOverlay from "$lib/design/debug/TokenDebugOverlay.svelte";
import SvgFilters from "$lib/design/svg/filters/SvgFilters.svelte";
import { bootstrapDownloadBridge } from "$lib/domains/app/models/index.js";
import { clyffyStatus } from "$lib/domains/clyffy/index.js";
import BootOverlay from "$lib/layouts/app/BootOverlay.svelte";
import { installGlobalHandlers, logError, logInfo } from "$lib/sys/logger.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let { children } = $props();

onMount(() => {
	// Capture ALL frontend errors, warnings, promise rejections from the very start.
	// Everything goes to the Rust tracing pipeline → session JSONL.
	installGlobalHandlers();
	logInfo("layout", "Root layout mounted");
	// biome-ignore lint/suspicious/noExplicitAny: Tauri injects __TAURI_INTERNALS__ on window
	logInfo("layout", `__TAURI_INTERNALS__: ${typeof (window as any).__TAURI_INTERNALS__}`);

	// Single subscription point for every kernel model-loader event —
	// downloads, loads, cancels. Routes through wizardState rune methods
	// so the overlay reflects live state whether it is currently open or
	// dismissed. Attached here (root layout) so downloads started before
	// the overlay opens still populate when the overlay mounts.
	let detachDownloadBridge: (() => void) | null = null;
	bootstrapDownloadBridge()
		.then((detach) => {
			detachDownloadBridge = detach;
			logInfo("layout", "download-bridge attached");
		})
		.catch((e) => {
			logError("layout", `download-bridge FAILED to attach: ${e}`);
		});

	// Hardware telemetry is ref-counted via `createTauriEvent("model:hardware")`.
	// Components that need live metrics call `hardwareState.subscribe(reason)`
	// inside an `$effect` block — the listener attaches on the first subscriber
	// and detaches when the last one drops. Honors the 2026-04-20 no-auto-load
	// directive: no listener exists unless a mounted component explicitly asks.
	platformState
		.init()
		.then(() => {
			logInfo("layout", `platformState.init() complete — phase: ${platformState.phase}`);
		})
		.catch((e) => {
			logError("layout", `platformState.init() FAILED: ${e}`);
		});

	// Clyffy presence — mood runes derived from platform + model events.
	// Owns its own $effect.root internally; returns a teardown fn.
	const stopClyffyStatus = clyffyStatus.start();

	// ── Idle auto-minimize ─────────────────────────────────
	// Track last pointer/keyboard activity. When the window has been
	// idle for N seconds (read from assistant.toml via the kernel),
	// minimize to the system tray. Default 300s = 5 min.
	let lastActivity = Date.now();
	let idleTimeoutSecs = 300;

	function markActive() {
		lastActivity = Date.now();
	}
	document.addEventListener("pointermove", markActive, { passive: true });
	document.addEventListener("keydown", markActive, { passive: true });

	// Fetch the configured timeout from the kernel (non-blocking).
	invoke<{ window: { idle_timeout_secs: number } }>("get_assistant_config")
		.then((cfg) => {
			if (cfg?.window?.idle_timeout_secs > 0) {
				idleTimeoutSecs = cfg.window.idle_timeout_secs;
			}
		})
		.catch(() => {});

	const idleInterval = setInterval(async () => {
		if (idleTimeoutSecs <= 0) return;
		const elapsed = (Date.now() - lastActivity) / 1000;
		if (elapsed >= idleTimeoutSecs) {
			try {
				const { getCurrentWindow } = await import("@tauri-apps/api/window");
				await getCurrentWindow().minimize();
				logInfo("layout", `idle ${Math.round(elapsed)}s — minimized`);
				lastActivity = Date.now();
			} catch (e) {
				logError("layout", `idle minimize failed: ${e}`);
			}
		}
	}, 30_000);

	return () => {
		detachDownloadBridge?.();
		stopClyffyStatus();
		document.removeEventListener("pointermove", markActive);
		document.removeEventListener("keydown", markActive);
		clearInterval(idleInterval);
		platformState.destroy();
	};
});
</script>

<SvgFilters />
<BootOverlay />
<TokenDebugOverlay />
{@render children()}
