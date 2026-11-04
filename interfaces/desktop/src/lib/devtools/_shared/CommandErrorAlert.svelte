<!--
	@file CommandErrorAlert
	@domain platform/_shared

	Single canonical surface for command failures inside any devtool tab.
	Thin adapter — composes the shipped `Alert` primitive (variant=error,
	WAI-ARIA APG `alert` role) with a `Badge` mapping the `CommandError.kind`
	to a tone-coloured chip + display label so users tell rate-limited
	from auth-failed at a glance without substring matching.

	# Usage

	```svelte
	<CommandErrorAlert error={query.error} />
	<CommandErrorAlert error={lastError} dismissible onDismiss={() => (lastError = null)} />
	```

	Accepts `CommandError | string | null`. String form is a migration
	shim for unmigrated commands that still throw bare strings; new
	commands should always return Result<T, CommandError>.
-->
<script lang="ts">
import * as Alert from "@devpulse/coldlight/components/alert";
import type { BadgeVariant } from "@devpulse/coldlight/components/badge";
import { Badge } from "@devpulse/coldlight/components/badge";
import { Text } from "@devpulse/coldlight/components/text";
import type { CommandError, ErrorKind } from "#lib/sys/generated/bindings.js";

interface Props {
	/** Discriminated `CommandError`, a bare string, or null (renders nothing). */
	error: CommandError | string | null;
	/** When true, renders the Alert's built-in dismiss button. */
	dismissible?: boolean;
	/** Fired when user clicks dismiss. */
	onDismiss?: () => void;
}

let { error, dismissible = false, onDismiss }: Props = $props();

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
			label: KIND_LABEL[error.kind],
			variant: KIND_VARIANT[error.kind],
			message: error.message,
			context: error.context,
		};
	}
	return {
		label: null as string | null,
		variant: null as BadgeVariant | null,
		message: error,
		context: null as string | null,
	};
});
</script>

{#if display}
	<Alert.Root variant="error" {dismissible} onOpenChange={(d) => !d.open && onDismiss?.()}>
		<div class="flex flex-col gap-[var(--space-1)] p-[var(--space-3)]">
			<div class="flex items-center gap-[var(--space-2)] flex-wrap">
				{#if display.label && display.variant}
					<Badge variant={display.variant} size="sm">{display.label}</Badge>
				{/if}
				<Alert.Title>
					<Text size="xs" weight="semibold">{display.message}</Text>
				</Alert.Title>
			</div>
			{#if display.context}
				<Alert.Description>
					<Text size="xs" color="muted" class="font-mono break-all">{display.context}</Text>
				</Alert.Description>
			{/if}
		</div>
	</Alert.Root>
{/if}
