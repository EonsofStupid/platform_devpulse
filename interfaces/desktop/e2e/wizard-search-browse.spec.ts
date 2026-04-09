/**
 * @file wizard-search-browse.spec.ts
 * E2E test: Search HuggingFace, browse local models, import
 *
 * REQUIRES: `cargo xtask run-dev` running on port 1420.
 * Run: pnpm test:e2e:ui (to watch in browser)
 */

import { expect, test } from "@playwright/test";

test.describe("Setup Wizard — Search & Browse", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector("[data-component='setup-wizard']", { timeout: 15_000 });

		// Navigate to Models step first
		await page.getByRole("button", { name: "Start setup" }).click();
		await expect(page.getByText("Hardware Detected")).toBeVisible({ timeout: 10_000 });
		await page.getByRole("button", { name: "Continue to model selection" }).click();
		await expect(page.getByText("Set Up Your AI")).toBeVisible({ timeout: 5_000 });
	});

	test("Browse or import models → SearchBrowseStep with prominent tabs", async ({ page }) => {
		// Click "Browse or import models"
		await page.getByText("Browse or import models").click();

		// Should show Find Models header
		await expect(page.getByText("Find Models")).toBeVisible({ timeout: 5_000 });

		// Two tabs visible — both prominent, equal weight
		const localTab = page.getByRole("button", { name: /On Your Computer/ });
		const onlineTab = page.getByRole("button", { name: /Search HuggingFace/ });
		await expect(localTab).toBeVisible();
		await expect(onlineTab).toBeVisible();

		// Local tab active by default
		await expect(localTab).toHaveClass(/active/);

		// Import button visible
		await expect(page.getByText("Import Model from File")).toBeVisible();
	});

	test("Search Online tab shows search UI with suggestions", async ({ page }) => {
		await page.getByText("Browse or import models").click();
		await expect(page.getByText("Find Models")).toBeVisible({ timeout: 5_000 });

		// Click Search HuggingFace tab
		await page.getByRole("button", { name: /Search HuggingFace/ }).click();

		// Search input visible
		const searchInput = page.getByPlaceholder(/Search for models/);
		await expect(searchInput).toBeVisible();

		// Search button visible
		await expect(page.getByRole("button", { name: "Search HuggingFace" })).toBeVisible();

		// Welcome state with suggestions visible
		await expect(page.getByText("Search for AI models to download")).toBeVisible();
		await expect(page.getByText("Try one of these:")).toBeVisible();

		// Suggestion chips visible
		await expect(page.getByRole("button", { name: "Qwen3" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Llama" })).toBeVisible();

		// Format help visible
		await expect(page.getByText("What are GGUF and SafeTensors?")).toBeVisible();
	});

	test("Search for Qwen3 shows results", async ({ page }) => {
		await page.getByText("Browse or import models").click();
		await expect(page.getByText("Find Models")).toBeVisible({ timeout: 5_000 });

		// Switch to online tab
		await page.getByRole("button", { name: /Search HuggingFace/ }).click();

		// Type search query
		await page.getByPlaceholder(/Search for models/).fill("Qwen3");

		// Click search
		await page.getByRole("button", { name: "Search HuggingFace" }).click();

		// Should show searching state
		await expect(page.getByText(/Searching HuggingFace/)).toBeVisible({ timeout: 5_000 });

		// Wait for results (real network call)
		await expect(page.locator(".result-card").first()).toBeVisible({ timeout: 30_000 });

		// Results should have model name and download button
		const firstResult = page.locator(".result-card").first();
		await expect(firstResult.locator(".result-name")).toBeVisible();
		await expect(firstResult.getByRole("button", { name: /Download/ })).toBeVisible();

		// Format tabs visible
		await expect(page.getByRole("button", { name: "All Formats" })).toBeVisible();
		await expect(page.getByRole("button", { name: "GGUF" })).toBeVisible();
	});

	test("Click suggestion chip triggers search", async ({ page }) => {
		await page.getByText("Browse or import models").click();
		await expect(page.getByText("Find Models")).toBeVisible({ timeout: 5_000 });
		await page.getByRole("button", { name: /Search HuggingFace/ }).click();

		// Click a suggestion chip
		await page.getByRole("button", { name: "Llama" }).click();

		// Should start searching
		await expect(page.getByText(/Searching HuggingFace/)).toBeVisible({ timeout: 5_000 });
	});

	test("Import button shows loading state", async ({ page }) => {
		await page.getByText("Browse or import models").click();
		await expect(page.getByText("Find Models")).toBeVisible({ timeout: 5_000 });

		// Import button should exist
		const importBtn = page.getByText("Import Model from File");
		await expect(importBtn).toBeVisible();

		// Click it — opens native file dialog
		// We can't interact with the native dialog in Playwright,
		// but we can verify the button exists and is clickable
		await expect(importBtn).toBeEnabled();
	});

	test("VramBar visible on browse page", async ({ page }) => {
		await page.getByText("Browse or import models").click();
		await expect(page.getByText("Find Models")).toBeVisible({ timeout: 5_000 });

		// VramBar should be visible
		await expect(page.locator(".vram-bar-wrap")).toBeVisible();
	});

	test("Done button returns to models step", async ({ page }) => {
		await page.getByText("Browse or import models").click();
		await expect(page.getByText("Find Models")).toBeVisible({ timeout: 5_000 });

		// Click Done
		await page.getByRole("button", { name: "Done" }).click();

		// Should return to Models step
		await expect(page.getByText("Set Up Your AI")).toBeVisible({ timeout: 5_000 });
	});
});
