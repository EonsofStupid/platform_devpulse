/**
 * @file .dependency-cruiser.cjs
 * Dependency mapping + hygiene rules for the desktop app.
 * Run: pnpm audit:deps        (rule validation)
 *      pnpm audit:deps:graph  (mermaid graph of $lib/design)
 */
module.exports = {
	forbidden: [
		{
			name: 'no-circular',
			severity: 'error',
			comment: 'Circular imports break Vite chunking and hide load-order bugs.',
			from: {},
			to: { circular: true },
		},
		{
			name: 'no-orphans',
			severity: 'warn',
			comment: 'Module imported by nothing — dead weight or a broken wiring chain.',
			from: {
				orphan: true,
				pathNot: [
					'\\.d\\.ts$',
					'(^|/)\\.[^/]+', // dotfiles/config
					'\\.(test|spec|stories)\\.(ts|js|svelte)$',
					'(^|/)(app\\.html|hooks\\.(client|server)\\.ts)$',
					'(^|/)routes/.+\\+(page|layout|error|server)', // SvelteKit route files are framework-wired
				],
			},
			to: {},
		},
		{
			name: 'design-owns-styling',
			severity: 'warn',
			comment: 'Nothing inside $lib/design may depend on app domains — the design system is a leaf library.',
			from: { path: '^src/lib/design' },
			to: { path: '^src/(routes|lib/domains)' },
		},
	],
	options: {
		doNotFollow: { path: 'node_modules' },
		exclude: { path: ['\\.svelte-kit', 'storybook-static', 'node_modules'] },
		tsConfig: { fileName: 'tsconfig.json' },
		tsPreCompilationDeps: true,
		enhancedResolveOptions: {
			exportsFields: ['exports'],
			conditionNames: ['import', 'require', 'node', 'default', 'svelte'],
			mainFields: ['svelte', 'module', 'main', 'types'],
			extensions: ['.ts', '.js', '.svelte', '.d.ts', '.json'],
		},
		reporterOptions: {
			dot: { collapsePattern: 'node_modules/[^/]+' },
			text: { highlightFocused: true },
		},
	},
};
