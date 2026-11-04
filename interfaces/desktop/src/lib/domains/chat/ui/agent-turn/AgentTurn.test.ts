import { expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import "../../../../../app.css";
import AgentTurn from "./AgentTurn.svelte";

it("emits the provider's choice ID, explicit refusal and cancellation", async () => {
	const onAnswer = vi.fn();
	const onCancel = vi.fn();
	const { getByRole, rerender } = await render(AgentTurn, {
		props: {
			message: "Permission requested:",
			permission: {
				title: "Run checks",
				choices: [{ id: "provider-choice", label: "Allow once", allows: true }],
			},
			cancelLabel: "Stop",
			refuseLabel: "Refuse",
			onAnswer,
			onCancel,
		},
	});
	const allowStyle = getComputedStyle(getByRole("button", { name: "Allow once" }).element());
	expect(allowStyle.paddingInlineStart).toBe("12px");
	expect(allowStyle.borderRadius).toBe("8px");
	await getByRole("button", { name: "Allow once" }).click();
	expect(onAnswer).toHaveBeenLastCalledWith("provider-choice");
	await getByRole("button", { name: "Refuse" }).click();
	expect(onAnswer).toHaveBeenLastCalledWith(null);
	await rerender({ permission: null, message: "Running checks" });
	await getByRole("button", { name: "Stop" }).click();
	expect(onCancel).toHaveBeenCalledOnce();
});
