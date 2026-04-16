<!--
	@file /devtools/libsql — LibSQL devtool
	@route /devtools/libsql
	@window DevTools (Ctrl+Shift+Z)

	System + User relational store administration.
	Connection health, WAL status, table inventory, query console.
-->
<script lang="ts">
import { Database, FileSearch, HeartPulse, Terminal } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
</script>

<div class="flex flex-col h-full overflow-y-auto p-4">
	<div class={stack({ gap: "4" })}>
		<header class={stack({ gap: "1" })}>
			<div class="flex items-center gap-2">
				<Database size={18} class="text-[var(--color-teal-400)]" />
				<Text size="lg" weight="semibold">LibSQL</Text>
			</div>
			<Text size="xs" color="muted">
				Embedded relational store. System DB (platform.db) + User DB (user.db).
			</Text>
		</header>

		<section class="grid grid-cols-1 md:grid-cols-2 gap-3">
			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<HeartPulse size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Connection health</Text>
					<Text size="xs" color="muted">
						Ping both databases, WAL checkpoint status, file size, last write.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<FileSearch size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Table inventory</Text>
					<Text size="xs" color="muted">
						List tables, row counts, schema inspection per database.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>

			<div class="flex items-start gap-3 p-3 rounded-lg border border-dashed border-[var(--border-subtle)]">
				<Terminal size={16} class="text-[var(--color-teal-400)]" />
				<div class={stack({ gap: "1" })}>
					<Text size="sm" weight="semibold">Query console</Text>
					<Text size="xs" color="muted">
						Execute raw SQL against system or user DB. Results as table.
					</Text>
					<Text size="xs" color="muted">Not wired yet.</Text>
				</div>
			</div>
		</section>
	</div>
</div>
