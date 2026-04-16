<!--
	@file /devtools/devforge — DevForge devtool
	@route /devtools/devforge
	@window DevTools (Ctrl+Shift+Z)

	DevForge REH server management.
	Process health, connection URL, extension list, update channel, user data.
-->
<script lang="ts">
import { Code, HeartPulse, Package, RefreshCw } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Code size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">DevForge</Text>
			</div>
			<Text size="xs" color="muted">
				Managed REH web server. Full VS Code with extension support. Layer 1 platform service.
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<HeartPulse size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Process health</Text>
					<Text size="xs" color="muted">
						REH server status, port, PID, connection URL, uptime.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Package size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Extensions</Text>
					<Text size="xs" color="muted">
						Installed extensions list, enable/disable, DevPulse bridge extensions status.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<RefreshCw size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Update channel</Text>
					<Text size="xs" color="muted">
						Current version, pinned manifest, check for updates, apply update.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>
