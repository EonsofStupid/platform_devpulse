import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebars: SidebarsConfig = {
	docs: [
		"intro",
		{
			type: "category",
			label: "ColdLight Design System",
			items: [
				"coldlight/overview",
				"coldlight/architecture",
				"coldlight/inventory",
				{
					type: "category",
					label: "Behaviors",
					items: [
						"coldlight/behaviors/index",
						"coldlight/behaviors/contracts",
						"coldlight/behaviors/testing",
					],
				},
				{
					type: "category",
					label: "Tokens",
					items: ["coldlight/tokens/index"],
				},
				{
					type: "category",
					label: "Recipes & Components",
					items: ["coldlight/recipes/index"],
				},
			],
		},
		{
			type: "category",
			label: "Platform",
			items: [
				"platform/namespaces",
				"platform/header-compliance",
			],
		},
		{
			type: "category",
			label: "Sprints",
			items: ["sprints/index"],
		},
	],
};

export default sidebars;
