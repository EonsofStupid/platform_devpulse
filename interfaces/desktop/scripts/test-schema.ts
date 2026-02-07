#!/usr/bin/env npx tsx

/**
 * Test the Zod schema validation for contracts.
 * Run: npx tsx scripts/test-schema.ts
 */

import { contract as accordionContract } from "../src/lib/design/taxonomy/kinds/primitives/accordion/contract.js";
import { contract as comboboxContract } from "../src/lib/design/taxonomy/kinds/primitives/combobox/contract.js";
import { contract as dialogContract } from "../src/lib/design/taxonomy/kinds/primitives/dialog/contract.js";
import { contract as dropdownMenuContract } from "../src/lib/design/taxonomy/kinds/primitives/dropdown-menu/contract.js";
import { contract as selectContract } from "../src/lib/design/taxonomy/kinds/primitives/select/contract.js";
import { contract as tabsContract } from "../src/lib/design/taxonomy/kinds/primitives/tabs/contract.js";
import { validateContract } from "../src/lib/design/taxonomy/schema.js";

console.log("=== ColdLight Schema Validation Test ===\n");

// All APG gold-standard contracts
const contracts = [
	{ name: "dialog", contract: dialogContract },
	{ name: "tabs", contract: tabsContract },
	{ name: "combobox", contract: comboboxContract },
	{ name: "accordion", contract: accordionContract },
	{ name: "select", contract: selectContract },
	{ name: "dropdown-menu", contract: dropdownMenuContract },
];

console.log("APG Gold-Standard Contract Validation:\n");

let allValid = true;
for (const { name, contract } of contracts) {
	const result = validateContract(contract);
	const status = result.valid ? "✅" : "❌";
	console.log(`${status} ${name}`);
	console.log(`   slotRelationships: ${contract.slotRelationships?.length ?? 0}`);
	console.log(`   keyboardMap: ${contract.keyboardMap?.length ?? 0}`);
	console.log(`   focus: ${contract.focus?.strategy ?? "legacy"}`);
	if (!result.valid) {
		console.log(`   errors: ${result.errors.join(", ")}`);
		allValid = false;
	}
	console.log();
}

// Test: Invalid contract should fail
console.log("Invalid contract detection:");
const invalidContract = {
	kind: "test",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: [], forbidden: [] },
	slotSpec: {
		root: { element: "div", children: "snippet", aria: { required: [], optional: [] } },
	},
	states: { shared: ["hover"], specific: [] },
	slotStates: { root: ["hover"] },
	slotActions: { root: [] },
	aria: { role: "NOT_A_REAL_ROLE", requiredAttrs: [], optionalAttrs: [] }, // Invalid!
	keyboard: ["Enter"],
	focusStrategy: "none",
	compound: false,
};

const invalidResult = validateContract(invalidContract);
if (!invalidResult.valid) {
	console.log("   ✅ Correctly rejected invalid contract");
} else {
	console.log("   ❌ Should have failed validation");
	allValid = false;
}

console.log(`\n=== ${allValid ? "All tests passed" : "Some tests FAILED"} ===`);
