<!--
	@file RepoList.svelte
	@module @devpulse/domains/app/onboarding/ui/repo-list

	The repositories Rust found in your projects folder: tick the ones to
	add. Each shows its top languages (tokei), DevPulse itself and repos
	already added are marked, and Rust's result after adding is shown per
	repo. Holds no text of its own.
-->
<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Checkbox } from "@devpulse/coldlight/components/checkbox";
import { Text } from "@devpulse/coldlight/components/text";
import type { RepoListProps } from "./repo-list.types.js";

let { repos, picked, results, text, disabled = false, onToggle }: RepoListProps = $props();

const lines = (n: number): string => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
</script>

<ul class="flex max-h-[clamp(12rem,32vh,22rem)] flex-col gap-[var(--space-1)] overflow-y-auto pr-[var(--space-1)]">
	{#each repos as repo (repo.path)}
		{@const result = results.find((r) => r.path === repo.path)}
		<li
			class="flex items-start gap-[var(--space-3)] rounded-lg p-[var(--space-2)]"
			style="background: var(--surface-raised); border: 0.0625rem solid var(--border-subtle);"
		>
			<Checkbox
				size="sm"
				checked={repo.registered || picked.includes(repo.path)}
				disabled={disabled || repo.registered}
				onCheckedChange={() => onToggle(repo.path)}
				aria-label={repo.name}
			/>
			<div class="flex min-w-0 flex-1 flex-col gap-[var(--space-1)]">
				<div class="flex flex-wrap items-center gap-[var(--space-2)]">
					<Text size="sm" weight="semibold">{repo.name}</Text>
					{#if repo.isDevpulse}
						<Badge size="sm" variant="accent" fillStyle="subtle">{text.devpulse}</Badge>
					{/if}
					{#if repo.registered}
						<Badge size="sm" variant="positive" fillStyle="subtle">
							{result?.projectId ? text.added : text.registered}
						</Badge>
					{/if}
					{#each repo.languages as lang (lang.name)}
						<Badge size="sm" variant="neutral" fillStyle="outline">{lang.name} · {lines(lang.lines)}</Badge>
					{/each}
				</div>
				<Text size="xs" class="truncate font-mono" style="color: var(--text-muted);" title={repo.path}>
					{repo.path}
				</Text>
				{#if result?.error}
					<Text size="xs" style="color: var(--signal-error);">{result.error}</Text>
				{/if}
			</div>
		</li>
	{/each}
</ul>
