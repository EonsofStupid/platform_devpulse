/**
 * @file ColdLight Component Folder Configuration
 * @package @devpulse/coldlight
 *
 * Declares the component (styled semantic) folder structure.
 * Every taxonomy kind that has a styled component gets a named folder
 * under components/ with the required files.
 *
 * Scanner enforces parity: taxonomy contract exists → component folder MUST exist
 * with all required files.
 */

export const COMPONENTS = {
	/** Root path for styled component folders */
	root: "src/lib/design/components",
	/** Every component folder MUST contain these files */
	requiredFiles: ["{Name}.svelte", "types.ts", "schema.ts", "{Name}.test.ts", "index.ts"],
	/** Scanner enforces component folder parity with taxonomy */
	scannerEnforced: true,
} as const;
