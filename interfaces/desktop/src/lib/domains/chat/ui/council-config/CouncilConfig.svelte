<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { Heading } from "@devpulse/coldlight/components/heading";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
} from "@devpulse/coldlight/components/select";
import { Text } from "@devpulse/coldlight/components/text";
import type { CouncilConfigProps } from "./council-config.types.js";

let {
	ticketId,
	seats,
	roles,
	providers,
	validation,
	onChange,
	onSave,
	onBack,
}: CouncilConfigProps = $props();
</script>

<section aria-label="Chat Council configuration" class="flex flex-col gap-6">
	<header class="flex flex-wrap items-start justify-between gap-4">
		<div class="flex flex-col gap-2">
			<Text size="sm">Chat / Council · linked to {ticketId}</Text>
			<Heading level={2} size="xl">Different perspectives. Independent judgment.</Heading>
			<Text size="sm">Choose premade roles and providers for this conversation.</Text>
		</div>
		<Button variant="secondary" size="sm" onclick={onBack}>Back to ticket</Button>
	</header>
	<Card variant="deep" class="gap-3 p-5">
		<Badge variant="informative">Council preset · one round</Badge>
		<Text size="sm">Three answerers work blind. A selector from another vendor reviews anonymized answers, can choose none, and retains the rationale and dissent.</Text>
		<Text size="sm">The ticket receives the selected structured output after review. Private answers are not shared between answerers.</Text>
	</Card>
	<div class="grid gap-4 md:grid-cols-2">
		{#each seats as seat (seat.id)}
			<Card variant={seat.kind === "selector" ? "glow" : "elevated"} class="gap-4 p-5">
				<div class="flex items-center justify-between gap-3">
					<Heading level={3} size="sm">{seat.label}</Heading>
					<Badge size="sm" variant={seat.kind === "selector" ? "notice" : "neutral"}>{seat.kind === "selector" ? "Independent" : "Blind answer"}</Badge>
				</div>
				<div class="flex flex-col gap-2">
					<Text size="sm">Premade role</Text>
					<Select value={seat.role} onValueChange={(value) => onChange(seat.id, "role", value)} disabled={seat.kind === "selector"} aria-label={`${seat.label} role`}>
						<SelectTrigger>{roles.find(role => role.id === seat.role)?.label ?? seat.role}</SelectTrigger>
						<SelectContent>{#each roles.filter(role => seat.kind === "selector" ? role.id === "selector@1" : role.id !== "selector@1") as role}<SelectItem value={role.id}>{role.label}</SelectItem>{/each}</SelectContent>
					</Select>
				</div>
				<div class="flex flex-col gap-2">
					<Text size="sm">Provider · sample connection</Text>
					<Select value={seat.provider} onValueChange={(value) => onChange(seat.id, "provider", value)} aria-label={`${seat.label} provider`}>
						<SelectTrigger>{providers.find(provider => provider.id === seat.provider)?.label ?? "Choose a provider"}</SelectTrigger>
						<SelectContent>{#each providers as provider}<SelectItem value={provider.id}>{provider.label}</SelectItem>{/each}</SelectContent>
					</Select>
				</div>
			</Card>
		{/each}
	</div>
	{#if validation}<div role="alert"><Text>{validation}</Text></div>{/if}
	<div class="flex flex-wrap items-center gap-4">
		<Button disabled={validation !== null} onclick={onSave}>Save Council assignment</Button>
		<Text size="sm">Preview only. Saving assigns these seats; it does not run the Council.</Text>
	</div>
</section>
