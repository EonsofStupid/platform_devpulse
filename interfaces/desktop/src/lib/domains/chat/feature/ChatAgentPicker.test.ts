/** @file Chat selection follows kernel availability, including stale login flags. */
import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import ChatAgentPicker from "./ChatAgentPicker.svelte";

const start = vi.hoisted(() => vi.fn().mockResolvedValue(null));
vi.mock("$lib/domains/app/projects/index.js", () => ({ projectsState: { activeProjectId: "p" } }));
vi.mock("$lib/domains/app/providers/index.js", () => ({
	providersState: {
		start: () => () => {},
		current: {
			report: {
				providers: [
					{
						id: "codex",
						name: "Codex",
						kind: "subscription_agent",
						installed: true,
						signedIn: "yes",
						availability: { chat: "connectorRequired" },
					},
					{
						id: "gemini-cli",
						name: "Gemini",
						kind: "subscription_agent",
						installed: true,
						signedIn: "unknown",
						availability: { chat: "signInUnverified" },
					},
					{
						id: "claude-code",
						name: "Claude Code",
						kind: "subscription_agent",
						availability: { chat: "readyToConnect" },
					},
				],
			},
		},
	},
}));
vi.mock("$lib/sys/copy/index.js", () => ({
	copyState: {
		catalog: {
			chat: { agents: { new_thread: "New thread", none_ready: "No agent ready" } },
			onboarding: {
				your_ai: {
					ready_to_connect: "Ready to connect",
					not_installed: "Not installed",
					signed_out: "Sign in required",
					signed_in_unknown: "Check sign-in",
					connector_needed: "Install connector",
					conversation_unsupported: "Chat unavailable",
				},
			},
		},
	},
}));
vi.mock("../data-access/agents.state.svelte.js", () => ({ agentsState: { start, error: null } }));
vi.mock("../data-access/chat.state.svelte.js", () => ({ chatState: {} }));
vi.mock("../data-access/sessions.state.svelte.js", () => ({ sessionsState: {} }));

it("blocks missing prerequisites and selects only the kernel-approved provider", async () => {
	const view = render(ChatAgentPicker);
	await view.getByRole("combobox").click();
	await expect
		.element(view.getByRole("option", { name: "Codex — Install connector" }))
		.toHaveAttribute("aria-disabled", "true");
	await expect
		.element(view.getByRole("option", { name: "Gemini — Check sign-in" }))
		.toHaveAttribute("aria-disabled", "true");
	expect(start).not.toHaveBeenCalled();
	await view.getByRole("option", { name: "Claude Code", exact: true }).click();
	expect(start).toHaveBeenCalledExactlyOnceWith("p", "claude-code");
});
