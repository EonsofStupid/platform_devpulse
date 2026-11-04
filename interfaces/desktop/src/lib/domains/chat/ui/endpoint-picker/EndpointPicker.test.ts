/** Explicit connection/model choice and the person's Start action control Chat creation. */
import "@devpulse/coldlight/index.css";
import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import EndpointPicker from "./EndpointPicker.svelte";
import type { EndpointPickerProps } from "./endpoint-picker.types.js";

function props(): EndpointPickerProps {
	return {
		copy: {
			title: "Saved connection chat",
			connection: "Connection",
			model: "Model",
			start: "Start chat",
			stop: "Stop response",
			new_local: "New local chat",
			empty: "Check models in Your AI",
			disclosure: "This conversation is sent to your server.",
			read_only: "Archived",
		},
		connections: [
			{
				id: "remote",
				revision: 4,
				label: "Workshop",
				endpoint: "https://example.invalid/custom/v1",
				provider: "ollama",
				hasCredential: false,
				textTest: null,
				check: { checkedAtMs: 1, error: null, models: [{ id: "chosen-model", ownedBy: null }] },
			},
		],
		busy: false,
		onStart: vi.fn(),
	};
}
it("requires explicit choices and sends their unchanged saved identity only on Start", async () => {
	const p = props();
	const screen = await render(EndpointPicker, { props: p });
	expect(p.onStart).not.toHaveBeenCalled();
	await expect.element(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
	await screen.getByRole("combobox", { name: "Connection", exact: true }).click();
	await screen.getByRole("option", { name: "Workshop", exact: true }).click();
	await expect.element(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
	await screen.getByRole("combobox", { name: "Model", exact: true }).click();
	await screen.getByRole("option", { name: "chosen-model", exact: true }).click();
	expect(p.onStart).not.toHaveBeenCalled();
	await screen.getByRole("button", { name: "Start chat" }).click();
	expect(p.onStart).toHaveBeenCalledExactlyOnceWith(p.connections[0], "chosen-model");
});
it("shows setup guidance and cannot start without advertised models", async () => {
	const p = props();
	p.connections = [];
	const screen = await render(EndpointPicker, { props: p });
	await expect.element(screen.getByText("Check models in Your AI")).toBeVisible();
	await expect.element(screen.getByRole("button", { name: "Start chat" })).toBeDisabled();
	expect(p.onStart).not.toHaveBeenCalled();
});
