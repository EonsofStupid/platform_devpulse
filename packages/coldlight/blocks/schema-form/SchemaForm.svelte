<!--
	@file SchemaForm.svelte
	@module @devpulse/design/blocks/schema-form

	Renders a form from a JSON Schema: a text field per string property (an
	email field for `format: email`, a field plus a folder picker for
	`x-devpulse-input: folder`), the suggestions offered for each field, and
	the error messages it is given. Holds no text and no validation of its own.
-->
<script lang="ts">
import { Button } from "#coldlight/components/button/index.js";
import { TextField } from "#coldlight/components/text-field/index.js";
import { readFields, type SchemaFormProps } from "./schema-form.types.js";

let {
	schema,
	order,
	values,
	labels,
	errors = {},
	suggestions = {},
	browseLabel,
	disabled = false,
	onChange,
	onBrowse,
	onSubmit,
}: SchemaFormProps = $props();

const fields = $derived(readFields(schema, order));
</script>

<form
	class="flex flex-col gap-[clamp(1rem,2.5vh,1.5rem)]"
	onsubmit={(e) => {
		e.preventDefault();
		onSubmit?.();
	}}
>
	{#each fields as field (field.name)}
		{@const text = labels[field.name]}
		{@const error = errors[field.name]}
		<div class="flex flex-col gap-[var(--space-2)]">
			<div class="flex items-end gap-[var(--space-2)]">
				<TextField
					class="flex-1"
					name={field.name}
					type={field.input === "email" ? "email" : "text"}
					label={text?.label}
					description={text?.hint}
					error={error}
					invalid={error !== undefined}
					required={field.required}
					value={values[field.name] ?? ""}
					onValueChange={(v) => onChange(field.name, v)}
					{disabled}
				/>
				{#if field.input === "folder" && onBrowse}
					<Button preset="secondary" size="md" type="button" onclick={() => onBrowse(field.name)} {disabled}>
						{browseLabel}
					</Button>
				{/if}
			</div>
			{#if suggestions[field.name]?.length}
				<div class="flex flex-wrap gap-[var(--space-2)]">
					{#each suggestions[field.name] as suggestion (suggestion.value)}
						<Button
							preset="ghost"
							size="sm"
							type="button"
							aria-pressed={values[field.name] === suggestion.value}
							onclick={() => onChange(field.name, suggestion.value)}
							{disabled}
						>
							{suggestion.label}
						</Button>
					{/each}
				</div>
			{/if}
		</div>
	{/each}
</form>
