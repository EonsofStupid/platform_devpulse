import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
	title: "DevPulse",
	tagline: "Platform documentation — ColdLight design system, architecture, API reference",
	favicon: "img/favicon.ico",

	url: "https://devpulse.app",
	baseUrl: "/docs/",

	onBrokenLinks: "warn",
	onBrokenMarkdownLinks: "warn",

	i18n: {
		defaultLocale: "en",
		locales: ["en"],
	},

	markdown: {
		format: "md",
		mermaid: true,
	},

	themes: ["@docusaurus/theme-mermaid"],

	presets: [
		[
			"classic",
			{
				docs: {
					sidebarPath: "./sidebars.ts",
					routeBasePath: "/",
				},
				blog: false,
				theme: {
					customCss: "./src/css/custom.css",
				},
			} satisfies Preset.Options,
		],
	],

	plugins: [
		[
			"docusaurus-plugin-typedoc",
			{
				entryPoints: [
					"../../interfaces/desktop/src/lib/design/index.ts",
					"../../interfaces/desktop/src/lib/design/tokens/tokens.ts",
					"../../interfaces/desktop/src/lib/design/primitives/index.ts",
					"../../interfaces/desktop/src/lib/design/actions/index.ts",
					"../../interfaces/desktop/src/lib/design/utils/index.ts",
				],
				tsconfig: "../../interfaces/desktop/tsconfig.json",
				out: "api",
				sidebar: {
					categoryLabel: "API Reference",
					position: 5,
				},
				plugin: ["typedoc-plugin-markdown"],
				excludePrivate: true,
				excludeInternal: true,
				exclude: [
					"**/node_modules/**",
					"**/.cowlevel/**",
					"**/*.test.ts",
					"**/*.spec.ts",
					"**/_internal/**",
				],
				skipErrorChecking: true,
			},
		],
	],

	themeConfig: {
		navbar: {
			title: "DevPulse",
			items: [
				{
					type: "docSidebar",
					sidebarId: "docs",
					position: "left",
					label: "Docs",
				},
				{
					href: "https://github.com/devpulse",
					label: "GitHub",
					position: "right",
				},
			],
		},
		footer: {
			style: "dark",
			links: [
				{
					title: "Documentation",
					items: [
						{ label: "ColdLight", to: "/coldlight/overview" },
						{ label: "API Reference", to: "/api" },
						{ label: "Sprints", to: "/sprints" },
					],
				},
			],
			copyright: `Copyright ${new Date().getFullYear()} DevPulse. Built with Docusaurus.`,
		},
		prism: {
			theme: prismThemes.github,
			darkTheme: prismThemes.dracula,
			additionalLanguages: ["rust", "bash", "json"],
		},
		mermaid: {
			theme: { light: "neutral", dark: "dark" },
		},
	} satisfies Preset.ThemeConfig,
};

export default config;
