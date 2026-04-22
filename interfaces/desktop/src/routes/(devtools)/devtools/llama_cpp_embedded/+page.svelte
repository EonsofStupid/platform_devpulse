<!--
	@file /devtools/llama_cpp_embedded — In-process GGUF runtime via llama-cpp-2
	@route /devtools/llama_cpp_embedded

	TODO(reality-gap 2026-04-21): Renamed from `ollama_embedded` —
	Ollama is not a Rust library; the real in-process GGUF lane is the
	`llama-cpp-2` crate. This page stays as an honest placeholder until
	the backend service lands. Authoring plan: SPRINT-REALITY-GAP-CLOSE
	Phase 2 Option A.

	Candle does NOT subsume this gap. Candle has architecture-by-
	architecture Rust implementations (qwen3, phi3, llama). llama.cpp
	covers hundreds of GGUF architectures — the "bring any model"
	long tail.

	Depends on: llama-cpp-2 crate + new `InferenceBackend` impl +
	pool dispatch + `ArchId::LlamaCppEmbedded` registry entry.
-->
<script lang="ts">
import { PackageOpen } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/index.js";

const badge: HealthBadge = {
	state: "unknown",
	label: "Not built yet — deferred (see TODO)",
};
</script>

<ServiceDevtoolShell
	title="llama.cpp (embedded)"
	description="In-process GGUF runtime via llama-cpp-2"
	icon={PackageOpen}
	axis="runtimes"
	health={badge}
>
	{#snippet status()}
		<Text size="sm" color="muted">
			<strong>Not built yet.</strong> This lane would link the
			<code>llama-cpp-2</code> crate directly, covering the GGUF long tail
			Candle does not (Candle implements a handful of architectures in Rust —
			<code>qwen3</code>, <code>phi3</code>, <code>llama</code>). Until the
			backend authors this service, the page intentionally shows no fake
			green.
		</Text>
	{/snippet}

	{#snippet config()}
		<Text size="sm" color="muted">
			Will read
			<span class="font-mono text-[10px]">
				config/platform/runtimes/llama_cpp_embedded.toml
			</span>
			once the service lands. Wires up with
			<code>llama_cpp_embedded_save_config</code>.
		</Text>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			Runtime logs wire up with <code>llama_cpp_embedded_export_logs</code>.
		</Text>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-2">
			<Text size="sm" color="muted">
				Start / stop / restart wire up with the 4 charter verbs once the
				service exists. See <code>SPRINT-REALITY-GAP-CLOSE.md</code> Phase 2
				Option A for the authoring plan.
			</Text>
			<div class="flex gap-2 opacity-50">
				<Button preset="default" size="sm" disabled>Start</Button>
				<Button preset="default" size="sm" disabled>Stop</Button>
				<Button preset="default" size="sm" disabled>Restart</Button>
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>
