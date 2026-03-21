/**
 * @file Code Component Contract
 * @kind code
 * @layer components
 *
 * Two components share this contract:
 *   - InlineCode — simple <code> span (slot: inline)
 *   - CodeBlock — compound (slots: root, header, content, copyButton)
 *
 * No complex ARIA. Purely structural.
 */

import type { ComponentContract } from "$lib/design/components/_schema/contract.js";

export const contract = {
	kind: "code",
	description:
		"Code display component. InlineCode renders <code> spans. CodeBlock is a compound component with header (filename/language), content (<pre><code> with Shiki integration), and copy button. Purely structural.",

	slots: {
		required: ["root"],
		optional: ["inline", "header", "content", "copyButton"],
	},

	slotContracts: {
		root: {
			name: "root",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "code", slot: "root", states: [] },
		},
		inline: {
			name: "inline",
			element: "code",
			aria: { required: [], optional: [] },
			data: { kind: "code", slot: "inline", states: [] },
		},
		header: {
			name: "header",
			element: "div",
			aria: { required: [], optional: [] },
			data: { kind: "code", slot: "header", states: [] },
		},
		content: {
			name: "content",
			element: "pre",
			aria: { required: [], optional: [] },
			data: { kind: "code", slot: "content", states: [] },
		},
		copyButton: {
			name: "copyButton",
			element: "button",
			aria: {
				required: [{ attr: "aria-label", valueType: "aria-label" }],
				optional: [],
			},
			data: { kind: "code", slot: "copy-button", states: [] },
		},
	},

	accessibleName: {
		required: false,
		sources: ["content"],
	},

	focus: {
		strategy: "none",
	},

	keyboard: {
		global: [],
	},

	states: {
		all: [],
	},

	interactions: {
		modal: false,
		selectable: false,
		editable: false,
		expandable: false,
	},

	primitiveKind: "code",
} as const satisfies ComponentContract;
