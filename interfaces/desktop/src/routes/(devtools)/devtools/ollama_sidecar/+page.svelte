<!--
	@file /devtools/ollama_sidecar — Ollama sidecar runtime devtool
	@route /devtools/ollama_sidecar

	TODO(reality-gap 2026-04-21): Backend service not yet authored.
	See SPRINT-REALITY-GAP-CLOSE.md Phase 1 for the 8-artifact charter
	authoring plan (ollama_sidecar_start/stop/restart/health +
	OllamaSidecarService + config TOML + platform holder + specta
	bindings + svelte rune + preflight check).
-->
<script lang="ts">
import { Boxes } from "lucide-svelte";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { type HealthBadge, ServiceDevtoolShell } from "$lib/domains/platform/index.js";

const badge: HealthBadge = {
	state: "unknown",
	label: "Not built yet \u2014 pending Phase 1 authoring",
};
</script>

<ServiceDevtoolShell
	title="Ollama (sidecar)"
	description="External Ollama process · HTTP API"
	icon={Boxes}
	axis="runtimes"
	health={badge}
>
	{#snippet status()}
		<Text size="sm" color="muted">
			Ollama sidecar health: process PID, HTTP endpoint reachability, loaded
			model count. Wires up with <code>ollama_sidecar_health</code>.
		</Text>
	{/snippet}

	{#snippet config()}
		<Text size="sm" color="muted">
			Binary path, bind host / port, auto-start policy — wires up with
			<code>ollama_sidecar_save_config</code>. TOML:
			<span class="font-mono text-[10px]">
				config/platform/runtimes/ollama_sidecar.toml
			</span>
			.
		</Text>
	{/snippet}

	{#snippet logs()}
		<Text size="sm" color="muted">
			Sidecar stdout / stderr stream wires up with
			<code>ollama_sidecar_export_logs</code>.
		</Text>
	{/snippet}

	{#snippet actions()}
		<div class="space-y-2">
			<Text size="sm" color="muted">
				Start / stop / restart the sidecar process. Pull a model, remove a
				model — the Model Loader window covers the downloading workflow;
				this tab manages the runtime.
			</Text>
			<div class="flex gap-2 opacity-50">
				<Button preset="default" size="sm" disabled>Start</Button>
				<Button preset="default" size="sm" disabled>Stop</Button>
				<Button preset="default" size="sm" disabled>Restart</Button>
			</div>
		</div>
	{/snippet}
</ServiceDevtoolShell>
