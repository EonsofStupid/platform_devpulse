<!--
	@file YouView.svelte
	@module @devpulse/domains/app/onboarding/feature/first-run

	Stage 2 — your name, email and projects folder. The form comes from Rust
	(schema + stored values + what this machine suggests) and renders through
	the SchemaForm block; Rust validates what you save and names any field it
	refuses. Text from the copy catalog.
-->
<script lang="ts">
import { untrack } from "svelte";
import { SchemaForm, type SchemaFormSuggestion } from "$lib/design/blocks/schema-form/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { InlineMessage } from "$lib/design/components/inline-message/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { FormErrorsCopy, YouCopy } from "$lib/sys/bindings/copy/index.js";
import type { FieldError, FieldSuggestion } from "$lib/sys/bindings/onboarding/index.js";
import { fill } from "$lib/sys/copy/index.js";
import { repoScan } from "../../../data-access/repo-scan.state.svelte.js";
import { youForm } from "../../../data-access/you-form.state.svelte.js";
import { RepoList } from "../../../ui/repo-list/index.js";

let { copy, errorCopy }: { copy: YouCopy; errorCopy: FormErrorsCopy } = $props();

$effect(() => {
	void youForm.load();
});

const folder = $derived(youForm.draft.projectsRoot?.trim() ?? "");

// A folder you already saved is scanned once, when the form arrives —
// not on every keystroke (typing a path scans when you ask).
$effect(() => {
	const view = youForm.view;
	untrack(() => {
		if (view && folder && repoScan.folder === null) void repoScan.scan(folder);
	});
});

function change(field: string, value: string): void {
	youForm.set(field, value);
	const suggested = youForm.view?.suggestions[field]?.some((s) => s.value === value);
	if (field === "projectsRoot" && suggested) void repoScan.scan(value);
}

async function browse(field: string): Promise<void> {
	await youForm.browse(field, copy.picker_title);
	if (field === "projectsRoot" && folder) void repoScan.scan(folder);
}

const labels = $derived({
	displayName: { label: copy.name_label, hint: copy.name_hint },
	email: { label: copy.email_label, hint: copy.email_hint },
	projectsRoot: { label: copy.projects_label, hint: copy.projects_hint },
});

const ERROR_KEY: Record<FieldError["code"], keyof FormErrorsCopy> = {
	required: "required",
	tooShort: "too_short",
	tooLong: "too_long",
	email: "email",
	notAFolder: "not_a_folder",
	unknown: "unknown",
	invalid: "invalid",
};

const errors = $derived(
	Object.fromEntries(
		youForm.errors.map((e) => [
			e.field,
			fill(errorCopy[ERROR_KEY[e.code]], { limit: e.limit ?? "" }),
		]),
	),
);

function label(s: FieldSuggestion): string {
	return s.source === "gitConfig"
		? `${s.value} · ${copy.from_git}`
		: `${s.value} · ${fill(copy.folder_repos, { count: s.detail ?? "" })}`;
}

const suggestions = $derived(
	Object.fromEntries(
		Object.entries(youForm.view?.suggestions ?? {}).map(([field, list]) => [
			field,
			(list ?? []).map((s): SchemaFormSuggestion => ({ value: s.value, label: label(s) })),
		]),
	),
);
</script>

<div class="flex flex-col gap-[clamp(1rem,2.5vh,1.75rem)]">
	<div class="flex flex-col gap-[var(--space-2)]">
		<Heading level={1} size="2xl">{copy.title}</Heading>
		<Text as="p" size="base" style="color: var(--text-secondary);">{copy.subtitle}</Text>
	</div>

	{#if youForm.problem}
		<InlineMessage tone="error">{youForm.problem}</InlineMessage>
	{/if}

	{#if youForm.view}
		<SchemaForm
			schema={youForm.view.schema}
			order={youForm.view.fields}
			values={youForm.draft}
			{labels}
			{errors}
			{suggestions}
			browseLabel={copy.browse}
			disabled={youForm.saving}
			onChange={change}
			onBrowse={browse}
			onSubmit={youForm.saveAndContinue}
		/>
	{:else if youForm.loading}
		<Spinner size="md" tone="accent" />
	{/if}

	{#if folder}
		<section class="flex flex-col gap-[var(--space-2)]" aria-label={copy.repos_heading}>
			<div class="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
				<div class="flex flex-col">
					<Text size="sm" weight="semibold">{copy.repos_heading}</Text>
					<Text size="xs" style="color: var(--text-muted);">{copy.repos_hint}</Text>
				</div>
				<Button
					preset="secondary"
					size="sm"
					type="button"
					onclick={() => repoScan.scan(folder)}
					disabled={repoScan.scanning || repoScan.registering}
				>
					{repoScan.scanning ? copy.repos_finding : copy.repos_find}
				</Button>
			</div>

			{#if repoScan.problem}
				<InlineMessage tone="error">{repoScan.problem}</InlineMessage>
			{/if}

			{#if repoScan.missing && repoScan.folder === folder}
				<Text size="sm" style="color: var(--signal-warning);">{errorCopy.not_a_folder}</Text>
			{:else if repoScan.repos && repoScan.folder === folder}
				{#if repoScan.repos.length === 0}
					<Text size="sm" style="color: var(--text-secondary);">{copy.repos_none}</Text>
				{:else}
					<RepoList
						repos={repoScan.repos}
						picked={repoScan.picked}
						results={repoScan.results}
						text={{ devpulse: copy.repo_devpulse, registered: copy.repo_registered, added: copy.repo_added }}
						disabled={repoScan.registering}
						onToggle={(path) => repoScan.toggle(path)}
					/>
					{#if repoScan.picked.length > 0}
						<div class="flex justify-end">
							<Button
								preset="primary"
								size="md"
								type="button"
								onclick={repoScan.register}
								disabled={repoScan.registering}
							>
								{fill(copy.repos_add, { count: repoScan.picked.length })}
							</Button>
						</div>
					{/if}
				{/if}
			{:else if repoScan.scanning}
				<Spinner size="sm" tone="accent" />
			{/if}
		</section>
	{/if}
</div>
