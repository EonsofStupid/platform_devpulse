<!--
	@file SignInSteps.svelte
	@module @devpulse/domains/app/providers/ui

	Signing in to a subscription with its own tool, in three steps (plan 0001
	B3.7; owner 2026-10-24: "clear UI that they need to press copy here and
	paste here"): copy the vendor's own sign-in command, paste it into a
	terminal (or open one here), finish in the vendor's own prompt. Any code
	the vendor shows goes into its prompt, never into DevPulse — that is what
	keeps the subscription's sign-in the vendor's.

	Props in, callbacks out; no state of its own. Text is the copy catalog's.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import * as CodeBlock from "@devpulse/coldlight/components/code";
import { Heading } from "@devpulse/coldlight/components/heading";
import { Spinner } from "@devpulse/coldlight/components/spinner";
import { StatusDot } from "@devpulse/coldlight/components/status-dot";
import { Text } from "@devpulse/coldlight/components/text";
import type { YourAiCopy } from "$lib/sys/bindings/copy/index.js";
import { fill } from "$lib/sys/copy/index.js";

interface Props {
	copy: YourAiCopy;
	/** The provider's name. */
	agent: string;
	/** Its own sign-in command, as you would type it. */
	command: string;
	/** What the copy button did: nothing yet, copied, or refused by the clipboard. */
	copied: "idle" | "copied" | "failed";
	/** A terminal is being opened. */
	opening: boolean;
	/** The provider says you are signed in. */
	signedIn: boolean;
	/** DevPulse is still asking whether you are signed in. */
	watching: boolean;
	onCopied: (ok: boolean) => void;
	onOpenTerminal: () => void;
	onClose: () => void;
}

let {
	copy,
	agent,
	command,
	copied,
	opening,
	signedIn,
	watching,
	onCopied,
	onOpenTerminal,
	onClose,
}: Props = $props();
</script>

<section class="flex flex-col gap-3" aria-label={fill(copy.sign_in_heading, { agent })}>
	<Heading level={3} size="sm">{fill(copy.sign_in_heading, { agent })}</Heading>

	<ol class="flex flex-col gap-3">
		<li class="flex flex-col gap-2">
			<Text size="sm">1. {copy.step_copy}</Text>
			<CodeBlock.Root onCopy={() => onCopied(true)} onCopyError={() => onCopied(false)}>
				<CodeBlock.Content code={command} />
				<CodeBlock.CopyButton value={command}>{copied === "copied" ? copy.copied : copy.copy}</CodeBlock.CopyButton>
			</CodeBlock.Root>
			{#if copied === "failed"}
				<Text size="sm" color="muted">{copy.copy_failed}</Text>
			{/if}
		</li>
		<li class="flex flex-col gap-2">
			<Text size="sm">2. {copy.step_paste}</Text>
			<div>
				<Button variant="secondary" size="sm" onclick={onOpenTerminal} disabled={opening}>
					{#if opening}<Spinner size="xs" />{copy.opening}{:else}{copy.open_terminal}{/if}
				</Button>
			</div>
		</li>
		<li>
			<Text size="sm">3. {fill(copy.step_finish, { agent })}</Text>
		</li>
	</ol>

	<div class="flex flex-wrap items-center justify-between gap-2">
		<div class="flex items-center gap-2">
			{#if signedIn}
				<StatusDot status="ready" />
				<Text size="sm" weight="semibold">{fill(copy.now_active, { agent })}</Text>
			{:else if watching}
				<StatusDot status="loading" animate />
				<Text size="sm" color="muted">{copy.waiting}</Text>
			{:else}
				<StatusDot status="pending" />
				<Text size="sm" color="muted">{copy.waiting_stopped}</Text>
			{/if}
		</div>
		<Button variant="ghost" size="sm" onclick={onClose}>{copy.close}</Button>
	</div>
</section>
