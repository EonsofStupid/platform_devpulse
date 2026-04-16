<!--
	@file /devtools/mongodb — MongoDB devtool (stub)
	@route /devtools/mongodb
	@window DevTools (Ctrl+Shift+Z)

	Document store for docs/images (GridFS). NOT YET IMPLEMENTED.
	Stubbed out so the route exists and the devtools nav shows it.
-->
<script lang="ts">
import { FileText, Lock } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<FileText size={18} class="text-[var(--color-muted)]" />
				<Text size="lg" weight="semibold" color="muted">MongoDB</Text>
			</div>
			<Text size="xs" color="muted">
				Document store for documentation and images (GridFS). Not yet integrated.
			</Text>
		</header>

		<section class="flex items-center gap-3 p-4 rounded-lg border border-dashed border-[var(--border-subtle)]">
			<Lock size={16} class="text-[var(--color-muted)]" />
			<div class={stack({ gap: "1" })}>
				<Text size="sm" weight="semibold" color="muted">Planned — not active</Text>
				<Text size="xs" color="muted">
					MongoDB will handle large documentation sets and image storage via GridFS.
					This service will be added after the core platform services are stable.
				</Text>
			</div>
		</section>
	</div>
</div>
