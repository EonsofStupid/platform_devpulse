import type { Preview } from "@storybook/sveltekit";

// app.css imports tailwindcss + the full ColdLight entry
// ($lib/design/index.css — tokens, theme, glue). The old direct
// design/css/index.css import pointed at a directory that no longer
// exists (the pipeline emits styles/, not css/).
import "../src/app.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},

		a11y: {
			// 'error' — a11y violations FAIL the storybook test run.
			// Flipped from 'todo' 2026-07-11 (a11y audit Gap 8): the gate
			// existed but was surface-only. Violations are defects, not
			// backlog decoration.
			test: "error",
		},
	},
};

export default preview;
