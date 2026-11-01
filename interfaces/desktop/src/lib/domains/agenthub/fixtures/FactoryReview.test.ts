import { expect, it } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import "../../../../app.css";
import FactoryReview from "./FactoryReview.svelte";

const reviewTicket = () =>
	page.getByRole("button", { name: "DP-42: Keep shared context coherent across workers" });
const criterionOne = () =>
	page.getByRole("checkbox", { name: "Both contributions retain their author and revision" });
const criterionTwo = () =>
	page.getByRole("checkbox", { name: "Conflicting updates require a fresh review" });

it("requires criteria, invalidates a checklist after policy changes and records acceptance", async () => {
	render(FactoryReview);
	await reviewTicket().click();
	await expect.element(page.getByRole("button", { name: "Accept outcome" })).toBeDisabled();
	await criterionOne().click();
	await criterionTwo().click();
	await expect.element(page.getByRole("button", { name: "Accept outcome" })).toBeEnabled();
	await page.getByRole("button", { name: /Guide each step/ }).click();
	await expect.element(criterionOne()).not.toBeChecked();
	await expect.element(page.getByRole("button", { name: "Accept outcome" })).toBeDisabled();
	await criterionOne().click();
	await criterionTwo().click();
	await page.getByRole("button", { name: "Accept outcome" }).click();
	await expect.element(page.getByText("You accepted proposal r4.", { exact: true })).toBeVisible();
	await expect
		.element(
			page
				.getByRole("region", { name: "Done tickets", exact: true })
				.getByRole("button", { name: /DP-42:/ }),
		)
		.toBeInTheDocument();
});

it("keeps a human correction across the next proposal without carrying acceptance forward", async () => {
	render(FactoryReview);
	await reviewTicket().click();
	await expect.element(page.getByRole("button", { name: "Request changes" })).toBeDisabled();
	await criterionOne().click();
	await page
		.getByRole("textbox", { name: "Review note or correction" })
		.fill("Show how a stale worker reconciles its contribution.");
	await page.getByRole("button", { name: "Request changes" }).click();
	await expect
		.element(
			page
				.getByRole("region", { name: "Working tickets", exact: true })
				.getByRole("button", { name: /DP-42:/ }),
		)
		.toBeInTheDocument();
	await page.getByRole("button", { name: "Load revised sample proposal" }).click();
	await expect
		.element(
			page.getByText("Show how a stale worker reconciles its contribution.", { exact: true }),
		)
		.toBeVisible();
	await expect.element(criterionOne()).not.toBeChecked();
	await expect.element(page.getByRole("button", { name: "Accept outcome" })).toBeDisabled();
});

it("configures Council in chat, enforces vendor independence and retains saved seats", async () => {
	render(FactoryReview);
	await reviewTicket().click();
	await page.getByRole("button", { name: "Open Council in chat" }).click();
	await expect
		.element(page.getByRole("region", { name: "Chat Council configuration" }))
		.toBeVisible();
	await expect.element(page.getByRole("heading", { name: "Council", exact: true })).toBeVisible();
	await page.getByRole("combobox", { name: "Answerer 1 role" }).click();
	await page.getByRole("option", { name: "Skeptic", exact: true }).click();
	await page.getByRole("combobox", { name: "Selector provider" }).click();
	await page.getByRole("option", { name: "Codex · sample", exact: true }).click();
	await expect.element(page.getByRole("alert")).toHaveTextContent("different vendor");
	await expect
		.element(page.getByRole("button", { name: "Save Council assignment" }))
		.toBeDisabled();
	await page.getByRole("combobox", { name: "Selector provider" }).click();
	await page.getByRole("option", { name: "Claude · sample", exact: true }).click();
	await page.getByRole("button", { name: "Save Council assignment" }).click();
	await expect
		.element(page.getByRole("region", { name: "Ticket DP-42", exact: true }))
		.toBeVisible();
	await page.getByRole("button", { name: "Open Council in chat" }).click();
	await expect
		.element(page.getByRole("combobox", { name: "Answerer 1 role" }))
		.toHaveTextContent("Skeptic");
});

it("creates an intake ticket with criteria and resets only preview state", async () => {
	render(FactoryReview);
	await page.getByRole("button", { name: "New ticket" }).click();
	await expect.element(page.getByRole("button", { name: "Create sample ticket" })).toBeDisabled();
	await page.getByRole("textbox", { name: "Ticket goal" }).fill("Review the recovery path");
	await page
		.getByRole("textbox", { name: "Acceptance criteria" })
		.fill("The checkpoint survives restart\nExternal actions are not replayed");
	await page.getByRole("button", { name: "Create sample ticket" }).click();
	await expect
		.element(
			page
				.getByRole("region", { name: "Intake tickets", exact: true })
				.getByRole("button", { name: /DP-46:/ }),
		)
		.toBeInTheDocument();
	await expect
		.element(page.getByRole("button", { name: "Accept outcome" }))
		.not.toBeInTheDocument();
	await page.getByRole("button", { name: "Reset preview" }).click();
	await expect.element(page.getByRole("button", { name: /DP-46:/ })).not.toBeInTheDocument();
});

it("renders real generated styles at desktop and narrow widths and supports keyboard activation", async () => {
	render(FactoryReview);
	for (const width of [1440, 1024, 390]) {
		await page.viewport(width, 1000);
		expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
		const column = document.querySelector('[data-ui="agenthub-factory-board"][data-slot="column"]');
		if (!column) throw new Error("Factory column did not render");
		expect(getComputedStyle(column).borderRadius).toBe("12px");
		await page.screenshot({
			path: `../../../../../../../.userdata/proof/factory-board-${width}.png`,
		});
	}
	await page.viewport(1440, 1000);
	(reviewTicket().element() as HTMLButtonElement).focus();
	await userEvent.keyboard("{Enter}");
	await expect
		.element(page.getByRole("region", { name: "Ticket DP-42", exact: true }))
		.toBeVisible();
	await page.screenshot({
		path: "../../../../../../../.userdata/proof/factory-ticket-1440.png",
	});
	await page.getByRole("button", { name: "Open Council in chat" }).click();
	await page.screenshot({
		path: "../../../../../../../.userdata/proof/factory-council-1440.png",
	});
	await page.getByRole("button", { name: "Back to ticket" }).click();
	await page.viewport(390, 1000);
	await expect
		.element(page.getByRole("region", { name: "Ticket DP-42", exact: true }))
		.toBeVisible();
	await page.screenshot({
		path: "../../../../../../../.userdata/proof/factory-ticket-390.png",
	});
	expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
});
