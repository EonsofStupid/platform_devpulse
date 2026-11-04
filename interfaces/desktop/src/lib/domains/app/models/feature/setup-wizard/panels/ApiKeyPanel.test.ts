import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import ApiKeyPanel from "./ApiKeyPanel.svelte";

vi.mock("#lib/sys/generated/bindings.js", () => ({
	commands: {
		getApiKeyStatus: vi.fn().mockResolvedValue({
			status: "ok",
			data: [
				{ provider: "ollama", displayName: "Ollama", stored: true, maskedPreview: "****" },
				{ provider: "lm-studio", displayName: "LM Studio", stored: false, maskedPreview: null },
			],
		}),
	},
}));

vi.mock("#lib/sys/logger.js", () => ({ logInfo: vi.fn(), logError: vi.fn() }));
vi.mock("#lib/sys/action-bus.svelte.js", () => ({ withAction: vi.fn() }));

it("shows local credentials without claiming a saved key establishes a connection", async () => {
	const { container } = await render(ApiKeyPanel);
	await expect.poll(() => container.textContent).toContain("Key saved");
	expect(container.textContent).toContain("Ollama");
	expect(container.textContent).toContain("LM Studio");
	expect(container.textContent).toContain("No key saved");
	expect(container.textContent).toContain("Saving a key does not test the connection.");
	expect(container.textContent).not.toContain("Connected");
});
