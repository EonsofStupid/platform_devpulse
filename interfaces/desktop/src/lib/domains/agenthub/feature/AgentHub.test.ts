/** @file Render the complete AgentHub journey using typed IPC fixtures and real CSS. */
import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import "../../../../app.css";
import type { FoundSession } from "$lib/sys/generated/bindings.js";

const mocks = vi.hoisted(() => ({ sessions: vi.fn(), transcript: vi.fn(), openWindow: vi.fn() }));
vi.mock("$app/state", () => ({
	page: { url: new URL("http://localhost/overmind/agenthub?conversation=live") },
}));
vi.mock("../data-access/agenthub.service.js", () => mocks);
vi.mock("../data-access/agenthub.state.svelte.js", () => ({
	agenthubState: {
		ready: true,
		error: null,
		connect: async () => {},
		current: {
			conversations: [
				{
					sessionId: "live",
					place: null,
					providerId: "codex",
					projectId: "project",
					activity: "waitingForYou",
					permissions: [{ title: "Approve the workspace review" }],
					error: null,
					text: "",
				},
			],
		},
	},
}));
vi.mock("$lib/domains/app/projects/index.js", () => ({
	projectsState: { ready: true, projects: [{ id: "project", name: "DevPulse" }] },
}));
vi.mock("$lib/domains/app/providers/index.js", () => ({
	providersState: {
		start: () => () => {},
		current: {
			report: {
				providers: [
					{ id: "codex", name: "Codex" },
					{ id: "claude-code", name: "Claude Code" },
				],
			},
		},
	},
}));
vi.mock("$lib/sys/bindings/window/index.js", () => ({ openWindow: mocks.openWindow }));
vi.mock("$lib/sys/routing/index.js", () => ({
	routeAt: (path: string) => ({ path }),
	hrefOf: (node: { path: string }) => node.path,
	routeCopy: () => ({ label: "AgentHub" }),
}));

import AgentHub from "./AgentHub.svelte";

it("browses a parent and child, reads older messages, filters providers and opens chat", async () => {
	const parent: FoundSession = {
		providerId: "codex",
		locator: "parent",
		nativeId: "parent",
		title: "Establish the chat and AgentHub experience",
		kind: "userStarted",
		parentLocator: null,
		parentNativeId: null,
		parentResolution: "notApplicable",
		workspace: "D:/localdev/platform_devpulse",
		startedAt: "",
		modifiedAt: 1793275200000,
		bytes: 1024,
	};
	const child: FoundSession = {
		...parent,
		locator: "child",
		nativeId: "child",
		title: "Review the generated component styles",
		kind: "subAgent",
		parentLocator: "parent",
		parentNativeId: "parent",
		parentResolution: "resolved",
	};
	mocks.sessions.mockResolvedValue({
		sessions: [
			parent,
			child,
			{ ...parent, providerId: "claude-code", locator: "claude", title: "Review provider setup" },
		],
		sources: [
			{
				providerId: "codex",
				sessions: 2,
				problem: null,
				truncated: false,
				present: true,
				root: null,
			},
			{
				providerId: "claude-code",
				sessions: 1,
				problem: null,
				truncated: false,
				present: true,
				root: null,
			},
		],
	});
	mocks.transcript.mockImplementation(
		async (providerId: string, locator: string, cursor: string | null) => ({
			providerId,
			locator,
			events: [
				{
					id: cursor ? "old" : "new",
					kind: "assistant_message",
					presentation: "conversation",
					text: cursor
						? "Earlier context is preserved."
						: "The session browser uses the retained catalog. Sub-agents stay attached to their parent and the transcript opens without sending a prompt.",
				},
			],
			nextCursor: cursor ? null : "older",
			truncatedBefore: !cursor,
		}),
	);
	mocks.openWindow.mockResolvedValue({ status: "ok", data: {} });
	await page.viewport(1440, 900);
	const { container } = render(AgentHub);
	await expect.element(page.getByText("Conversation from chat", { exact: true })).toBeVisible();
	// Give the feature the same bounded content slot as the app shell.
	container.style.height = "860px";
	await page.getByRole("button", { name: /Establish the chat/ }).click();
	await expect.element(page.getByText("Read only", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Show older messages" }).click();
	await expect.element(page.getByText("Earlier context is preserved.")).toBeVisible();
	await page.getByText("1 sub-agent", { exact: true }).click();
	await page.getByRole("button", { name: /Review the generated/ }).click();
	expect(mocks.transcript).toHaveBeenLastCalledWith("codex", "child", null);
	await page.getByRole("button", { name: "Open chat", exact: true }).click();
	expect(mocks.openWindow).toHaveBeenCalledWith("Chat");
	for (const width of [1440, 1024]) {
		await page.viewport(width, 900);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
		await page.screenshot({
			path: `../../../../../../../.userdata/proof/agenthub-browser-${width}.png`,
		});
	}
	await page.getByRole("button", { name: "Claude Code · 1", exact: true }).click();
	await expect.element(page.getByRole("button", { name: /Review provider setup/ })).toBeVisible();
	await expect
		.element(page.getByRole("button", { name: /Establish the chat/ }))
		.not.toBeInTheDocument();
});
