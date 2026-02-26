import { render } from "vitest-browser-svelte";
import { expect, test, describe } from "vitest";
import { contract } from "./contract.js";
import InputGroup from "./InputGroup.svelte";

describe("input-group component — contract", () => {
	test("contract.kind is 'input-group'", () => {
		expect(contract.kind).toBe("input-group");
	});

	test("contract requires root slot", () => {
		expect(contract.slots.required).toContain("root");
	});

	test("contract declares group role for root slot", () => {
		expect(contract.slotContracts.root.aria.role).toBe("group");
	});

	test("contract declares no modal interaction", () => {
		expect(contract.interactions.modal).toBe(false);
	});
});

describe("input-group component — ARIA", () => {
	test("renders with role='group' on root", async () => {
		const { container } = render(InputGroup, {
			"aria-label": "Email field",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root).not.toBeNull();
		expect(root?.getAttribute("role")).toBe("group");
	});

	test("renders aria-label on root", async () => {
		const { container } = render(InputGroup, {
			"aria-label": "Email address",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root?.getAttribute("aria-label")).toBe("Email address");
	});

	test("renders data-disabled when disabled", async () => {
		const { container } = render(InputGroup, {
			disabled: true,
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root?.hasAttribute("data-disabled")).toBe(true);
	});
});

describe("input-group component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { container } = render(InputGroup, {
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root?.className).toContain("inline-flex");
		expect(root?.className).toContain("rounded-md");
	});

	test("applies size variant classes", async () => {
		const { container } = render(InputGroup, {
			size: "sm",
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='input-group']");
		expect(root?.className).toContain("h-8");
	});
});
