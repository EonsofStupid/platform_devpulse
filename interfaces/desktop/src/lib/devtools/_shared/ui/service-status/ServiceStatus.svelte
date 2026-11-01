<script lang="ts">
import { Badge } from "@devpulse/coldlight/components/badge";
import { Text } from "@devpulse/coldlight/components/text";
import type { ServiceStatusSnapshot } from "$lib/sys/generated/bindings.js";
import type { ServiceStatusProps } from "./ServiceStatus.types.js";

let { service }: ServiceStatusProps = $props();
const runtimeLabels: Record<ServiceStatusSnapshot["runtime_state"], string> = {
	"not-compiled": "Not compiled",
	"config-disabled": "Disabled in config",
	stopped: "Stopped",
	running: "Present",
	starting: "Starting",
	stopping: "Stopping",
	failed: "Failed",
	unknown: "Unknown",
};
const readiness = $derived(service.observation.readiness);
const issue = $derived(service.observation.issue);
const evidence = $derived(
	service.observation.evidence === "service-probe"
		? "Service check"
		: service.observation.evidence === "protocol-handshake"
			? "Protocol handshake"
			: "No readiness check",
);
</script>

<Text size="xs" color="muted">{runtimeLabels[service.runtime_state]} · {service.service_id}</Text>
<Badge size="sm" variant={readiness === "ready" ? "positive" : issue && issue.code !== "unverified" ? "negative" : "neutral"}>
	{readiness === "ready" ? "Service check passed" : readiness === "not-ready" ? "Not ready" : "Readiness unverified"}
</Badge>
<Text size="xs" color="muted">{evidence} · observed {new Date(service.observation.observed_at_ms).toLocaleTimeString()}</Text>
{#if issue}<Text size="xs" color="muted">{issue.message}</Text>{/if}
