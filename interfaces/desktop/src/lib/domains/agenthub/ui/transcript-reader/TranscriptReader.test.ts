import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import "../../../../../app.css";
import type { FoundSession } from "$lib/sys/generated/bindings.js";
import TranscriptReader from "./TranscriptReader.svelte";

it("renders transcript text safely, pages explicitly and exposes diagnostics only on request", async () => {
	const session: FoundSession = {
		providerId: "codex",
		locator: "artifact",
		nativeId: "native",
		kind: "userStarted",
		parentNativeId: null,
		parentLocator: null,
		parentResolution: "notApplicable",
		title: "Workspace review",
		workspace: "D:/project",
		startedAt: "",
		modifiedAt: 1,
		bytes: 12,
	};
	const onOlder = vi.fn();
	const { container, rerender } = render(TranscriptReader, {
		props: {
			session,
			providerName: "Codex",
			loading: false,
			error: null,
			hasOlder: true,
			truncatedBefore: true,
			onOlder,
			onReload: vi.fn(),
			events: [
				{
					id: "message",
					kind: "assistant_message",
					presentation: "conversation",
					text: "<script>unsafe()</script>",
				},
				{ id: "tool", kind: "tool_started", presentation: "activity", text: "Read source" },
			],
		},
	});
	expect(container.querySelector("script")).toBeNull();
	expect(container.textContent).toContain("<script>unsafe()</script>");
	expect(container.textContent).not.toContain("Read source");
	expect(container.querySelector("textarea")).toBeNull();
	await page.getByRole("button", { name: "Show older messages" }).click();
	expect(onOlder).toHaveBeenCalledOnce();
	await page.getByRole("button", { name: "Tools and diagnostics" }).click();
	expect(container.textContent).toContain("Read source");
	container.style.cssText = "height:400px;display:flex";
	await rerender({
		session: { ...session, locator: "long-session" },
		events: Array.from({ length: 20 }, (_, index) => ({
			id: `message-${index}`,
			kind: "assistant_message",
			presentation: "conversation",
			text: `Message ${index}\nThe entire message stays readable in the bounded transcript.`,
		})),
	});
	const reader = container.querySelector<HTMLElement>('[aria-label="Transcript messages"]');
	if (!reader) throw new Error("Missing transcript region");
	expect(reader.scrollHeight).toBeGreaterThan(reader.clientHeight);
	expect(reader.scrollTop + reader.clientHeight).toBeGreaterThanOrEqual(reader.scrollHeight - 1);
	const messages = reader.querySelectorAll<HTMLElement>('[data-slot="message"]');
	expect(messages).toHaveLength(20);
	expect(getComputedStyle(messages[0]).borderLeftWidth).toBe("2px");
	for (const message of messages)
		expect(message.getBoundingClientRect().height).toBeGreaterThan(40);
});
