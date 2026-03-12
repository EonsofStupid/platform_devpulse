#!/usr/bin/env npx tsx
/**
 * @file build.ts
 * @package @devpulse/coldlight
 *
 * Runs the Style Dictionary v5 build pipeline.
 * Usage: npx tsx scripts/build/styledictionary/build.ts
 */

import StyleDictionary from 'style-dictionary';
import config from './sd.config.js';

async function build() {
	console.log('[SD5] Starting token build...');
	const sd = new StyleDictionary(config);
	await sd.buildAllPlatforms();
	console.log('[SD5] Build complete. Output in tokens/build/');
}

build().catch((err) => {
	console.error('[SD5] Build failed:', err);
	process.exit(1);
});
