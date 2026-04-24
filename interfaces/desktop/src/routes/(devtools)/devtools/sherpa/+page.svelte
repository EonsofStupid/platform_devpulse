<!--
	@file /devtools/sherpa — Sherpa streaming ASR devtool
	@route /devtools/sherpa

	Live streaming-ASR surface powered by `sherpa-onnx` on the Rust
	side. Mic stream → 16 kHz mono f32 chunks → `sherpa_feed_audio`
	→ partial transcript surfaced back into the `sherpaState` rune.

	Feature-gated: the backend returns "feature not enabled" on
	default builds. This page checks `sherpa_compile_info` and renders
	a clear banner instead of silently failing.
-->
<script lang="ts">
import { Ear, Mic, Play, RefreshCw, StopCircle, Trash2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { sherpaState } from "$lib/domains/infra/sherpa/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/index.js";

// ── Mic-stream plumbing ──────────────────────────────────
let audioCtx: AudioContext | null = null;
let micStream: MediaStream | null = null;
let processorNode: ScriptProcessorNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
let micSelected = $state<string>("");

// ── Mount: load compile info + models ────────────────────
$effect(() => {
	void sherpaState.loadCompileInfo();
	void sherpaState.loadModels();
});

const badge = $derived<HealthBadge>(
	sherpaState.compileInfo === null
		? { state: "unknown", label: "Checking…" }
		: !sherpaState.featureEnabled
			? { state: "stopped", label: "`sherpa` feature not compiled in" }
			: sherpaState.streaming
				? { state: "up", label: "Streaming (mic)" }
				: sherpaState.models.length > 0
					? { state: "stopped", label: `${sherpaState.models.length} model(s) installed` }
					: { state: "stopped", label: "No models installed" },
);

function prettySize(bytes: number): string {
	if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
	if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
	if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
	return `${bytes} B`;
}

async function startMic(modelId: string): Promise<void> {
	if (!sherpaState.featureEnabled) {
		sherpaState.sessionError = "Sherpa feature not compiled in. Rebuild with `--features sherpa`.";
		return;
	}

	await sherpaState.start(modelId);
	if (!sherpaState.sessionId) return;

	try {
		// Target 16 kHz — Sherpa's streaming models expect exactly this.
		// AudioContext honours sampleRate on most modern browsers; if not,
		// `processorNode.onaudioprocess` still fires at the context's rate
		// and the recognizer will downmix or refuse — surfaced as an error.
		audioCtx = new AudioContext({ sampleRate: 16_000 });
		micStream = await navigator.mediaDevices.getUserMedia({
			audio: micSelected ? { deviceId: { exact: micSelected } } : true,
		});
		sourceNode = audioCtx.createMediaStreamSource(micStream);
		// ScriptProcessor is deprecated but still universally supported.
		// AudioWorklet is the replacement — we'll migrate when the rest
		// of the voice stack (recording / playback) moves.
		processorNode = audioCtx.createScriptProcessor(4096, 1, 1);
		sourceNode.connect(processorNode);
		processorNode.connect(audioCtx.destination);
		processorNode.onaudioprocess = (e) => {
			const channel = e.inputBuffer.getChannelData(0);
			// Copy — ScriptProcessor reuses the Float32Array buffer.
			void sherpaState.feedSamples(new Float32Array(channel));
		};
	} catch (e) {
		sherpaState.sessionError = e instanceof Error ? e.message : String(e);
		await stopMic();
	}
}

async function stopMic(): Promise<void> {
	if (processorNode) {
		processorNode.disconnect();
		processorNode.onaudioprocess = null;
		processorNode = null;
	}
	if (sourceNode) {
		sourceNode.disconnect();
		sourceNode = null;
	}
	if (micStream) {
		for (const t of micStream.getTracks()) t.stop();
		micStream = null;
	}
	if (audioCtx) {
		await audioCtx.close();
		audioCtx = null;
	}
	await sherpaState.finish();
}
</script>

<ServiceDevtoolShell
	title="Sherpa (streaming ASR)"
	description="Real-time speech-to-text · zipformer streaming · sherpa-onnx"
	icon={Ear}
	axis="capabilities"
	health={badge}
>
	{#snippet status()}
		<div class="space-y-4">
			{#if sherpaState.compileInfo && !sherpaState.featureEnabled}
				<div
					class="p-4 rounded-lg"
					style="background: var(--signal-warn-subtle, #3b2a1a); border: 1px solid var(--signal-warn, #d97706); color: var(--text-primary);"
				>
					<Text size="sm" weight="bold">
						Not available in this build
					</Text>
					<Text size="xs">
						The <code>sherpa</code> cargo feature is disabled. Rebuild with
						<code>cargo xtask run-dev --features sherpa</code>. The crate's
						build script downloads ~100 MB of prebuilt native binaries on
						first compile.
					</Text>
				</div>
			{/if}

			<div class="flex items-center justify-between">
				<Text size="sm" weight="semibold">Active sessions</Text>
				{#if sherpaState.streaming}
					<Badge tone="positive" size="sm">Live</Badge>
				{:else}
					<Badge tone="neutral" size="sm">Idle</Badge>
				{/if}
			</div>

			{#if sherpaState.streaming}
				<div
					class="p-3 rounded-lg"
					style="background: var(--surface-raised); border: 1px solid var(--border-subtle);"
				>
					<div class="flex items-center justify-between">
						<Text size="xs" weight="bold">Session</Text>
						<Text size="xs" color="muted">
							<span class="font-mono">{sherpaState.sessionId}</span>
						</Text>
					</div>
					<Text size="xs" color="muted">
						Model: <span class="font-mono">{sherpaState.sessionModel}</span> ·
						Samples fed: {sherpaState.samplesFed.toLocaleString()}
					</Text>
				</div>
			{/if}

			{#if sherpaState.transcript}
				<div
					class="p-3 rounded-lg"
					style="background: var(--surface-base); border: 1px solid var(--border-subtle);"
				>
					<Text size="xs" weight="bold" color="muted">Transcript</Text>
					<Text size="sm">{sherpaState.transcript}</Text>
				</div>
			{/if}

			{#if sherpaState.sessionError}
				<div
					class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400"
				>
					{sherpaState.sessionError}
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet config()}
		<div class="space-y-3">
			<Text size="sm" weight="semibold">Installed models</Text>
			<div class="flex items-center justify-between">
				<Text size="xs" color="muted">
					Store:
					<span class="font-mono text-[10px]">{sherpaState.modelsDir ?? "—"}</span>
				</Text>
				<Button
					preset="ghost"
					size="sm"
					onclick={() => void sherpaState.loadModels()}
					disabled={sherpaState.modelsLoading}
				>
					{#if sherpaState.modelsLoading}
						<Spinner size="xs" tone="accent" />
					{:else}
						<RefreshCw size={14} />
					{/if}
					Refresh
				</Button>
			</div>

			{#if sherpaState.modelsError}
				<div class="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
					{sherpaState.modelsError}
				</div>
			{/if}

			{#if sherpaState.models.length === 0}
				<Text size="xs" color="muted">
					No models installed. Drop a sherpa-onnx streaming-zipformer model
					directory (encoder / decoder / joiner .onnx + tokens.txt) into the
					store path above — the scanner picks up new dirs on the next
					Refresh. A guided download flow is a follow-up.
				</Text>
			{:else}
				<div
					class="rounded-lg border border-[var(--border-subtle)] overflow-hidden"
				>
					<table class="w-full text-xs">
						<thead>
							<tr
								class="bg-[var(--surface-raised)] border-b border-[var(--border-subtle)]"
							>
								<th class="text-left px-3 py-2">Model</th>
								<th class="text-right px-3 py-2">Size</th>
								<th class="text-right px-3 py-2"></th>
							</tr>
						</thead>
						<tbody>
							{#each sherpaState.models as m (m.id)}
								<tr class="border-b border-[var(--border-subtle)]">
									<td class="px-3 py-2 font-mono">{m.id}</td>
									<td class="px-3 py-2 text-right font-mono"
										>{prettySize(m.size_bytes)}</td
									>
									<td class="px-3 py-2 text-right">
										<Button
											preset="ghost"
											size="sm"
											onclick={() => void sherpaState.deleteModel(m.id)}
											disabled={!sherpaState.featureEnabled ||
												sherpaState.streaming}
										>
											<Trash2 size={12} />
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			Sherpa log lines flow through the platform's tracing layer. Use the
			Telemetry devtool's scoped-log view with the prefix
			<code>devpulse_engine::platform::services::sherpa_streaming</code> to
			tail them. A per-service tail inside this panel arrives when the
			shared scoped-log widget gains a prefix filter.
		</Text>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-4">
			<div class="space-y-2">
				<Text size="sm" weight="bold">Mic stream</Text>
				<Text size="xs" color="muted">
					Pick a model, click Start. Mic audio is captured at 16 kHz mono
					and fed directly into a streaming recognizer — partial transcripts
					appear on the Status tab as you speak.
				</Text>

				{#if sherpaState.models.length > 0 && !sherpaState.streaming}
					<div class="flex flex-wrap items-center gap-2">
						{#each sherpaState.models as m (m.id)}
							<Button
								preset="button-primary"
								size="sm"
								onclick={() => void startMic(m.id)}
								disabled={!sherpaState.featureEnabled || sherpaState.starting}
							>
								{#if sherpaState.starting}
									<Spinner size="xs" />
									Starting…
								{:else}
									<Mic size={12} />
									Start with {m.id}
								{/if}
							</Button>
						{/each}
					</div>
				{:else if sherpaState.streaming}
					<div class="flex items-center gap-2">
						<Button
							preset="button-ghost"
							size="sm"
							onclick={() => void stopMic()}
							disabled={sherpaState.stopping}
						>
							{#if sherpaState.stopping}
								<Spinner size="xs" />
								Stopping…
							{:else}
								<StopCircle size={12} />
								Stop + finalize
							{/if}
						</Button>
					</div>
				{:else}
					<Text size="xs" color="muted">
						Install a model first (see Config tab).
					</Text>
				{/if}
			</div>

			<div class="space-y-2 pt-2 border-t border-[var(--border-subtle)]">
				<Text size="xs" weight="bold" color="muted">Notes</Text>
				<Text size="xs" color="muted">
					<strong>16 kHz:</strong> AudioContext is constructed at exactly
					16 kHz. If the browser refuses that rate the recognizer errors
					loud. A resample path lands when the frontend audio stack
					migrates to AudioWorklet.
				</Text>
				<Text size="xs" color="muted">
					<strong>ScriptProcessor:</strong> deprecated but universal. The
					replacement (AudioWorklet + SharedArrayBuffer for zero-copy
					sample transport) is tracked with the rest of the voice stack.
				</Text>
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>
