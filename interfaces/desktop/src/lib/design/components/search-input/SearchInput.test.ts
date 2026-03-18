import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-svelte";
import { contract } from "./contract.js";
import SearchInput from "./SearchInput.svelte";

describe("search-input component — contract", () => {
	test("contract.kind is 'search-input'", () => {
		expect(contract.kind).toBe("search-input");
	});

	test("contract requires root and input slots", () => {
		expect(contract.slots.required).toContain("root");
		expect(contract.slots.required).toContain("input");
	});

	test("contract declares search role for root slot", () => {
		expect(contract.slotContracts.root.aria.role).toBe("search");
	});

	test("contract declares searchbox role for input slot", () => {
		expect(contract.slotContracts.input.aria.role).toBe("searchbox");
	});

	test("contract declares editable interaction", () => {
		expect(contract.interactions.editable).toBe(true);
	});
});

describe("search-input component — ARIA", () => {
	test("renders with role='search' on root", async () => {
		const { container } = render(SearchInput, {
			"aria-label": "Site search",
		});
		const root = container.querySelector("[data-kind='search-input']");
		expect(root).not.toBeNull();
		expect(root?.getAttribute("role")).toBe("search");
	});

	test("renders searchbox input", async () => {
		const { container } = render(SearchInput, {
			"aria-label": "Site search",
		});
		const input = container.querySelector("[role='searchbox']");
		expect(input).not.toBeNull();
	});

	test("renders decorative icon with aria-hidden", async () => {
		const { container } = render(SearchInput, {
			"aria-label": "Site search",
		});
		const icon = container.querySelector("[aria-hidden='true']");
		expect(icon).not.toBeNull();
	});

	test("renders clear button with aria-label", async () => {
		const { container } = render(SearchInput, {
			"aria-label": "Site search",
		});
		const clearBtn = container.querySelector("button[aria-label='Clear search']");
		expect(clearBtn).not.toBeNull();
	});
});

describe("search-input component — recipe", () => {
	test("applies recipe base classes", async () => {
		const { container } = render(SearchInput, {
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='search-input']");
		expect(root?.className).toContain("inline-flex");
		expect(root?.className).toContain("rounded-md");
	});

	test("applies size variant classes", async () => {
		const { container } = render(SearchInput, {
			size: "sm",
			"aria-label": "Test",
		});
		const root = container.querySelector("[data-kind='search-input']");
		expect(root?.className).toContain("h-8");
	});
});
