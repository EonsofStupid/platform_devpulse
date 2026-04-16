<!--
	@file /devtools/surreal — SurrealDB devtool
	@route /devtools/surreal
	@window DevTools (Ctrl+Shift+Z)

	Knowledge graph administration.
	Three namespaces (system/engine, user/profile, global/knowledge).
	Health, namespace browser, SurrealQL console, HTTP API status.
-->
<script lang="ts">
import { Globe, HeartPulse, Network, Terminal } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Network size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">SurrealDB</Text>
			</div>
			<Text size="xs" color="muted">
				Knowledge graph. 3 namespaces: system/engine, user/profile, global/knowledge. HTTP on :8822.
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<HeartPulse size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Connection health</Text>
					<Text size="xs" color="muted">
						Ping each namespace. HTTP API status. WAL flush state. Auth credential verification.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Globe size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Namespace browser</Text>
					<Text size="xs" color="muted">
						Browse tables per namespace. Record counts, schema, sample data.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Terminal size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">SurrealQL console</Text>
					<Text size="xs" color="muted">
						Execute queries against any namespace. Scope selector. JSON result view.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>
