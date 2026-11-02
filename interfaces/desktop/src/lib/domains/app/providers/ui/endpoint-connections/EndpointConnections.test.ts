/**
 * @file EndpointConnections.test.ts
 * @module @devpulse/domains/app/providers/ui/endpoint-connections
 * Browser interactions at the endpoint presentation/intent boundary.
 */
import "@devpulse/coldlight/index.css";
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import EndpointConnections from "./EndpointConnections.svelte";
import type { EndpointConnectionsProps } from "./endpoint-connections.types.js";

function props(): EndpointConnectionsProps {
	return {
		copy: {
			title: "Your AI servers",
			description: "Discovery is not an inference check.",
			unavailable: "Database unavailable",
			empty: "No servers",
			add: "Add a connection",
			edit: "Edit",
			name: "Connection name",
			provider: "API format",
			endpoint: "API base URL",
			credential: "API key",
			keep_key: "Keep current key",
			replace_key: "Set a key",
			clear_key: "Use no key",
			key: "New API key",
			key_hint: "Stored securely",
			key_saved: "Key saved",
			save: "Save connection",
			cancel: "Cancel",
			check: "Check models",
			unchecked: "Not checked",
			checked: "Model list received: {count} at {time}",
			remove: "Remove",
			remove_confirm: "Remove {name}?",
		},
		state: { items: [], problem: null },
		options: [
			{
				provider: "ollama",
				name: "Compatible server",
				suggestedEndpoint: "http://localhost:11434/v1",
			},
		],
		busy: false,
		onSave: vi.fn().mockResolvedValue(true),
		onCheck: vi.fn().mockResolvedValue(undefined),
		onRemove: vi.fn().mockResolvedValue(undefined),
	};
}

test("saves the user's endpoint and label with explicit credential intent, without probing", async () => {
	const p = props();
	const screen = render(EndpointConnections, { props: p });
	await screen.getByRole("button", { name: "Add a connection" }).click();
	await screen.getByRole("textbox", { name: "Connection name" }).fill("Remote Clyffy");
	await screen
		.getByRole("textbox", { name: "API base URL" })
		.fill("https://my-server.example/custom/v1");
	await screen.getByRole("button", { name: "Save connection", exact: true }).click();
	expect(p.onSave).toHaveBeenCalledExactlyOnceWith({
		id: null,
		label: "Remote Clyffy",
		provider: "ollama",
		endpoint: "https://my-server.example/custom/v1",
		credential: { action: "keep" },
	});
	expect(p.onCheck).not.toHaveBeenCalled();
	await expect
		.element(screen.getByRole("textbox", { name: "Connection name" }))
		.not.toBeInTheDocument();
});

test("editing keeps the stable identity and a rejected save keeps the form open", async () => {
	const p = props();
	p.onSave = vi.fn().mockResolvedValue(false);
	p.state = {
		problem: null,
		items: [
			{
				id: "existing",
				label: "My server",
				provider: "ollama",
				endpoint: "http://localhost:12400/v1",
				hasCredential: true,
				check: null,
			},
		],
	};
	const screen = render(EndpointConnections, { props: p });
	await screen.getByRole("button", { name: "Edit", exact: true }).click();
	await screen.getByRole("textbox", { name: "Connection name" }).fill("Renamed");
	await screen.getByRole("button", { name: "Save connection", exact: true }).click();
	expect(p.onSave).toHaveBeenCalledWith(
		expect.objectContaining({ id: "existing", label: "Renamed", credential: { action: "keep" } }),
	);
	await expect
		.element(screen.getByRole("textbox", { name: "Connection name" }))
		.toHaveValue("Renamed");
	expect(p.onCheck).not.toHaveBeenCalled();
});

test("checking and removing address only the selected connection; removal needs confirmation", async () => {
	const p = props();
	p.state = {
		problem: null,
		items: [
			{
				id: "saved",
				label: "My server",
				provider: "ollama",
				endpoint: "http://localhost:12400/v1",
				hasCredential: false,
				check: null,
			},
		],
	};
	const screen = render(EndpointConnections, { props: p });
	await screen.getByRole("button", { name: "Check models" }).click();
	expect(p.onCheck).toHaveBeenCalledExactlyOnceWith("saved");
	await screen.getByRole("button", { name: "Remove", exact: true }).click();
	expect(p.onRemove).not.toHaveBeenCalled();
	await expect.element(screen.getByText("Remove My server?")).toBeVisible();
	await screen.getByRole("button", { name: "Cancel", exact: true }).click();
	expect(p.onRemove).not.toHaveBeenCalled();
});

test("an unavailable user store cannot create a pretend saved connection", async () => {
	const p = props();
	p.state = null;
	const screen = render(EndpointConnections, { props: p });
	await expect.element(screen.getByRole("button", { name: "Add a connection" })).toBeDisabled();
	await expect.element(screen.getByText("Database unavailable")).toBeVisible();
	expect(p.onSave).not.toHaveBeenCalled();
});

test("a failed save clears the typed secret and keeps the connection draft", async () => {
	const p = props();
	p.onSave = vi.fn().mockResolvedValue(false);
	const screen = render(EndpointConnections, { props: p });
	await screen.getByRole("button", { name: "Add a connection" }).click();
	await screen.getByRole("textbox", { name: "Connection name" }).fill("Keyed server");
	await screen.getByRole("combobox", { name: "API key", exact: true }).click();
	await screen.getByRole("option", { name: "Set a key" }).click();
	await screen.getByLabelText(/^New API key/).fill("test-only-secret");
	await screen.getByRole("button", { name: "Save connection", exact: true }).click();
	expect(p.onSave).toHaveBeenCalledWith(
		expect.objectContaining({
			credential: { action: "replace", value: "test-only-secret" },
		}),
	);
	await expect.element(screen.getByLabelText(/^New API key/)).toHaveValue("");
	await expect
		.element(screen.getByRole("textbox", { name: "Connection name" }))
		.toHaveValue("Keyed server");
});
