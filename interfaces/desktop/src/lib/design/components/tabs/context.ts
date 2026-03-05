/**
 * @file Tabs Context — Svelte context for compound component communication
 * @kind tabs
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 */

import { getContext, setContext } from "svelte";
import type { ColdLightTabs } from "$lib/design/api/dsadapters/coldlight/_internal/tabs/tabs.svelte.js";

const TABS_CTX = Symbol("coldlight-tabs");

export function setTabsContext(tabs: ColdLightTabs): void {
	setContext(TABS_CTX, tabs);
}

export function getTabsContext(): ColdLightTabs {
	return getContext<ColdLightTabs>(TABS_CTX);
}
