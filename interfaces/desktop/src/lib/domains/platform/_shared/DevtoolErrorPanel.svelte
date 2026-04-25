<!--
	@file DevtoolErrorPanel
	@domain platform/_shared

	Single canonical surface for command failures inside any devtool tab.
	Accepts the unified `CommandError` discriminated union (specta-emitted)
	OR a bare string for unmigrated callers. Renders:

	- `kind` as a tone-colored Badge (always rendered for CommandError)
	- `message` as the primary line
	- `context` as a secondary muted line (if present)

	# Usage

	```svelte
	<DevtoolErrorPanel error={query.error} />
	<DevtoolErrorPanel error={lastError} onDismiss={() => (lastError = null)} />
	```
-->
<script lang="ts">
import { X } from "lucide-svelte";
import type { BadgeVariant } from "$lib/design/components/badge/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import type { CommandError, ErrorKind } from "$lib/sys/generated/bindings.js";

interface Props {
	/** Discriminated `CommandError`, a bare string, or null (renders nothing). */
	error: CommandError | string | null;
	/** When provided, renders a small dismiss button in the corner. */
	onDismiss?: () => void;
}

let { error, onDismiss }: Props = $props();

const KIND_LABEL: Record<ErrorKind, string> = {
	"auth-failed": "Auth failed",
	"rate-limit": "Rate limited",
	"quota-exhausted": "Quota exhausted",
	network: "Network",
	server: "Server",
	parse: "Parse",
	"not-configured": "Not configured",
	"not-implemented": "Not implemented",
	"permission-denied": "Permission denied",
	"not-found": "Not found",
	"device-busy": "Device busy",
	"not-supported": "Not supported",
	internal: "Internal",
};

const KIND_VARIANT: Record<ErrorKind, BadgeVariant> = {
	"auth-failed": "negative",
	"rate-limit": "notice",
	"quota-exhausted": "negative",
	network: "notice",
	server: "negative",
	parse: "negative",
	"not-configured": "neutral",
	"not-implemented": "neutral",
	"permission-denied": "negative",
	"not-found": "neutral",
	"device-busy": "notice",
	"not-supported": "neutral",
	internal: "negative",
};

function isCommandError(e: CommandError | string): e is CommandError {
	return typeof e === "object" && e !== null && "kind" in e && "message" in e;
}

const display = $derived.by(() => {
	if (error === null) return null;
	if (isCommandError(error)) {
		return {
			kind: error.kind,
			label: KIND_LABEL[error.kind],
			variant: KIND_VARIANT[error.kind],
			message: error.message,
			context: error.context,
		};
	}
	return {
		kind: null,
		label: null,
		variant: null,
		message: error,
		context: null,
	};
});
</script>

{#if display}
	<div
		class="rounded-lg p-3 flex flex-col gap-1.5"
		style="background: var(--signal-error-subtle); border: var(--border-width-hairline) solid var(--signal-error);"
		role="alert"
	>
		<div class="flex items-center gap-2">
			{#if display.label && display.variant}
				<Badge variant={display.variant} size="sm">{display.label}</Badge>
			{/if}
			<Text size="xs" weight="semibold" class="flex-1 break-words">{display.message}</Text>
			{#if onDismiss}
				<button
					type="button"
					class="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
					aria-label="Dismiss error"
					onclick={onDismiss}
				>
					<X size={12} />
				</button>
			{/if}
		</div>
		{#if display.context}
			<Text size="xs" color="muted" class="font-mono break-all">{display.context}</Text>
		{/if}
	</div>
{/if}
