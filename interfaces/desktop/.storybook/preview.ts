import type { Preview } from "@storybook/sveltekit";

// Use the product entry once: Tailwind establishes the layer order before
// ColdLight. Importing ColdLight separately first lets base resets win.
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
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: "todo",
		},
	},
};

export default preview;
