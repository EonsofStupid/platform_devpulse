import type { StorybookConfig } from "@storybook/sveltekit";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|ts|svelte)"],
	addons: [
		"@storybook/addon-svelte-csf",
		"@chromatic-com/storybook",
		"@storybook/addon-vitest",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"@storybook/addon-themes",
		"@storybook/addon-designs",
	],
	framework: "@storybook/sveltekit",
	// Domain barrels also expose native window helpers. Discover these before the
	// first story loads so Vite does not invalidate its imports during rendering.
	viteFinal: async (viteConfig) => ({
		...viteConfig,
		optimizeDeps: {
			...viteConfig.optimizeDeps,
			include: [
				...(viteConfig.optimizeDeps?.include ?? []),
				"@tauri-apps/api/webviewWindow",
				"@tauri-apps/api/window",
			],
		},
	}),
};
export default config;
