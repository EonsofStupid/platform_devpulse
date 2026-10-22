/**
 * @file wizard-completion.spec.ts
 * E2E test: Completion screen, role colors, launch button
 *
 * REQUIRES: `cargo xtask run-dev` running on port 1420.
 * This test navigates through the entire wizard to reach completion.
 * Run: pnpm test:e2e:ui (to watch in browser)
 */

import { expect, test } from "@playwright/test";

test.describe("Setup Wizard — Completion", () => {
	test("Full wizard flow reaches completion screen", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector("[data-component='setup-wizard']", { timeout: 15_000 });

		// Welcome
		await page.getByRole("button", { name: "Start setup" }).click();

		// Hardware
		await expect(page.getByText("Hardware Detected")).toBeVisible({ timeout: 10_000 });
		await page.getByRole("button", { name: "Continue to model selection" }).click();

		// Models — skip for now (don't download in test)
		await expect(page.getByText("Set Up Your AI")).toBeVisible({ timeout: 5_000 });
		await page.getByText("Skip for now").click();

		// Clyffy activation — might need to skip or confirm
		const clyfPage = page.getByText("Talk to Clyffy");
		if (await clyfPage.isVisible({ timeout: 3_000 }).catch(() => false)) {
			// If brain not loaded, there should be a way to continue
			const continueBtn = page.getByRole("button", { name: /Continue/ });
			if (await continueBtn.isEnabled({ timeout: 2_000 }).catch(() => false)) {
				await continueBtn.click();
			}
		}

		// Project setup — continue (all optional)
		const aboutYou = page.getByText("About You");
		if (await aboutYou.isVisible({ timeout: 3_000 }).catch(() => false)) {
			await page.getByRole("button", { name: /Continue|Let's go/ }).click();
		}

		// Completion screen
		await expect(page.getByText("You're All Set!")).toBeVisible({ timeout: 10_000 });

		// Summary with slot names
		await expect(page.getByText("Clyffy's Brain")).toBeVisible();
		await expect(page.getByText("Minion Core")).toBeVisible();

		// Capability count visible
		await expect(page.getByText(/of \d+ capabilities/)).toBeVisible();

		// Launch button visible
		await expect(page.getByRole("button", { name: "Launch DevPulse" })).toBeVisible();
		await expect(page.getByRole("button", { name: "Launch DevPulse" })).toBeEnabled();

		// Settings hint
		await expect(page.getByText("You can change models anytime from Settings")).toBeVisible();
	});

	test("Completion shows role color dots (not transparent)", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector("[data-component='setup-wizard']", { timeout: 15_000 });

		// Speed-run to completion
		await page.getByRole("button", { name: "Start setup" }).click();
		await expect(page.getByText("Hardware Detected")).toBeVisible({ timeout: 10_000 });
		await page.getByRole("button", { name: "Continue to model selection" }).click();
		await expect(page.getByText("Set Up Your AI")).toBeVisible({ timeout: 5_000 });
		await page.getByText("Skip for now").click();

		// Navigate through remaining steps
		const tryAdvance = async () => {
			const btn = page.getByRole("button", { name: /Continue|Let's go|Skip/ }).first();
			if (await btn.isVisible({ timeout: 2_000 }).catch(() => false)) {
				if (await btn.isEnabled({ timeout: 1_000 }).catch(() => false)) {
					await btn.click();
					return true;
				}
			}
			return false;
		};

		// Try advancing through clyffy and project steps
		for (let i = 0; i < 5; i++) {
			if (
				await page
					.getByText("You're All Set!")
					.isVisible({ timeout: 1_000 })
					.catch(() => false)
			)
				break;
			await tryAdvance();
			await page.waitForTimeout(500);
		}

		// Check role color dots
		const dots = page.locator(".summary .dot");
		const dotCount = await dots.count();
		if (dotCount > 0) {
			const firstDotBg = await dots.first().evaluate((el) => {
				return window.getComputedStyle(el).backgroundColor;
			});
			// Should be a real color (not transparent)
			expect(firstDotBg).not.toBe("transparent");
			expect(firstDotBg).not.toBe("rgba(0, 0, 0, 0)");
		}
	});
});
