<script lang="ts">
import "../app.css";
// Style presets compiled via SD5 DTCG pipeline → components.generated.css
// Loaded via app.css → design/index.css → css/index.css import chain
import { TokenDebugOverlay } from "@devpulse/coldlight/debug";
import { SvgFilters } from "@devpulse/coldlight/svg/filters";
import { invoke } from "@tauri-apps/api/core";
import { onMount } from "svelte";
import { Toaster } from "svelte-sonner";
import { presentationState } from "$lib/domains/app/devpulse/index.js";
import { bootstrapDownloadBridge, ModelDownloaderOverlay } from "$lib/domains/app/models/index.js";
import { projectsState } from "$lib/domains/app/projects/index.js";
import { updatesState } from "$lib/domains/app/updates/index.js";
import { authState } from "$lib/domains/auth/index.js";
import { clyffyStatus } from "$lib/domains/clyffy/index.js";
import BootOverlay from "$lib/layouts/app/BootOverlay.svelte";
import { startMainNavigation } from "$lib/sys/bindings/window/index.js";
import { copyState } from "$lib/sys/copy/index.js";
import { HfTokenPanel, loadVisualPageBuilder } from "$lib/sys/debug/index.js";
import ErrorOverlay from "$lib/sys/ErrorOverlay.svelte";
import { fatalErrorState, setFatal } from "$lib/sys/fatal-error.svelte.js";
import { installGlobalHandlers, logError, logInfo } from "$lib/sys/logger.js";
import { platformState } from "$lib/sys/runes/platformState.svelte.js";

let { children } = $props();

// The Visual Page Builder comes with the Advanced display, in development and
// release; the Simple display never loads it.
const visualPageBuilder = $derived(presentationState.advanced ? loadVisualPageBuilder() : null);
$effect(() => {
	visualPageBuilder?.catch((e) => logError("layout", `Visual Page Builder FAILED to load: ${e}`));
});

onMount(() => {
	// Splash handoff: BootOverlay is already in the DOM by the time onMount
	// fires. Two rAFs let the browser commit the BootOverlay paint before
	// the app.html splash starts its fade, so users see a crossfade, not
	// a hard cut to a half-rendered overlay.
	requestAnimationFrame(() => {
		requestAnimationFrame(() => {
			const splash = document.getElementById("boot-splash");
			if (splash) {
				splash.classList.add("boot-splash-done");
				setTimeout(() => splash.remove(), 400);
			}
		});
	});

	// Capture ALL frontend errors, warnings, promise rejections from the very start.
	// Everything goes to the Rust tracing pipeline → session JSONL.
	installGlobalHandlers();
	logInfo("layout", "Root layout mounted");
	const stopMainNavigation = startMainNavigation((error) =>
		logError("window-navigation", String(error)),
	);
	// biome-ignore lint/suspicious/noExplicitAny: Tauri injects __TAURI_INTERNALS__ on window
	logInfo("layout", `__TAURI_INTERNALS__: ${typeof (window as any).__TAURI_INTERNALS__}`);

	// Single subscription point for every kernel model-loader event —
	// downloads, loads, cancels — into the model runes. Attached here
	// (root layout) so downloads started before the downloader overlay
	// opens still populate when it mounts.
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

	// UI copy catalog — every window's names and text (plan 0001 O1, 0008).
	// Loaded once here so menus, dashboards and devtool headers in any
	// window have their labels; `load()` shares the first load.
	copyState.load().catch((e) => logError("layout", `copyState.load() FAILED: ${e}`));

	// Clyffy presence — mood runes derived from platform + model events.
	// Owns its own $effect.root internally; returns a teardown fn.
	const stopClyffyStatus = clyffyStatus.start();

	// Projects — the list and the active project, as Rust publishes them.
	// Every window follows it, so chat and DevForge work in the same project
	// as the hub.
	const stopProjects = projectsState.start();

	// Auth subsystem — probes the persisted Supabase session, subscribes
	// to onAuthStateChange so subsequent sign-in/out events propagate.
	// `init()` is idempotent so the layout can call it freely.
	authState.init().catch((e) => logError("layout", `authState.init() FAILED: ${e}`));

	// Auto-updater rune — attaches the three plugin event listeners and
	// loads the persisted release channel. Network-free; the actual
	// `check_for_update` IPC fires lazily when the Latest tab mounts or
	// the user explicitly clicks "Check now."
	updatesState
		.bootstrap()
		.catch((e) => logError("layout", `updatesState.bootstrap() FAILED: ${e}`));

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
		stopMainNavigation();
		detachDownloadBridge?.();
		stopClyffyStatus();
		stopProjects();
		authState.destroy();
		updatesState.destroy();
		document.removeEventListener("pointermove", markActive);
		document.removeEventListener("keydown", markActive);
		clearInterval(idleInterval);
		platformState.destroy();
	};
});
</script>

<SvgFilters />

<svelte:boundary
	onerror={(err) => {
		const e = err instanceof Error ? err : new Error(String(err));
		logError("layout:boundary", `${e.message}\n${e.stack ?? ""}`);
		setFatal({
			message: e.message,
			stack: e.stack ?? null,
			origin: "boundary",
			capturedAt: Date.now(),
		});
	}}
>
	<BootOverlay />
	<TokenDebugOverlay>
		<HfTokenPanel />
	</TokenDebugOverlay>
	<!--
		Singleton Model Downloader overlay mounted at the app root.
		Any feature surface opens it via `modelDownloaderState.open(...)`;
		closing returns focus to whichever element opened it (APG
		dialog-modal focus contract — see ModelDownloaderOverlay.svelte).
	-->
	<ModelDownloaderOverlay />
	<!--
		Local-first render contract. `pending` falls through to the
		BootOverlay above (splash still covers the screen). Every other
		phase renders the routed children — DevPulse is local-first, so
		absence of Supabase cloud auth is the DEFAULT working state,
		never a blocking screen. Users reach LoginShell from settings
		if they explicitly want cloud sync; the app itself runs without
		it.
	-->
	{#if authState.phase !== "pending"}
		{@render children()}
		{#if visualPageBuilder}
			{#await visualPageBuilder then { VPBFrame }}
				<VPBFrame />
			{/await}
		{/if}
	{/if}

	{#snippet failed(error, reset)}
		<ErrorOverlay {error} {reset} />
	{/snippet}
</svelte:boundary>

{#if fatalErrorState.current}
	<ErrorOverlay />
{/if}

<Toaster
	position="bottom-right"
	richColors
	closeButton
	expand
	duration={4000}
	theme="dark"
/>
