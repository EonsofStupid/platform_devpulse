import { expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import type { ServiceStatusSnapshot } from "$lib/sys/generated/bindings.js";
import ServiceStatus from "./ServiceStatus.svelte";

function snapshot(): ServiceStatusSnapshot {
	return {
		service_id: "system.agenthub",
		role: "AgentHub",
		scope: "System",
		stage: 15,
		public_name: "AgentHub",
		group: "system",
		feature_gate: null,
		step_id: null,
		compiled_in: true,
		config_enabled: true,
		config_critical: false,
		runtime_state: "running",
		observation: {
			lifecycle: null,
			readiness: "unknown",
			evidence: "protocol-handshake",
			observed_at_ms: 1_800_000_000_000,
			latency_us: null,
			issue: { code: "unverified", message: "Ticket capabilities have not been verified." },
		},
	};
}

it("keeps connected presence distinct from verified capability readiness", () => {
	const { container } = render(ServiceStatus, { service: snapshot() });
	expect(container.textContent).toContain("Present");
	expect(container.textContent).toContain("system.agenthub");
	expect(container.textContent).toContain("Protocol handshake");
	expect(container.textContent).toContain("Readiness unverified");
	expect(container.textContent).not.toContain("Service check passed");
});

it("replaces successful probe status with the actual failure on refresh", async () => {
	const service = snapshot();
	service.observation = {
		...service.observation,
		readiness: "ready",
		evidence: "service-probe",
		issue: null,
	};
	const { container, rerender } = render(ServiceStatus, { service });
	expect(container.textContent).toContain("Service check passed");
	await rerender({
		service: {
			...service,
			observation: {
				...service.observation,
				readiness: "not-ready",
				issue: { code: "probe-timed-out", message: "Service check exceeded 2000 ms" },
			},
		},
	});
	expect(container.textContent).toContain("Not ready");
	expect(container.textContent).toContain("Service check exceeded 2000 ms");
	expect(container.textContent).not.toContain("Service check passed");
});
