/** What this route folder says about itself (plan 0008). */

import { Bell } from "lucide-svelte";
import { updatesState } from "#lib/domains/app/updates/index.js";
import { LATEST_DOMAIN } from "#lib/sys/contracts/index.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = {
	icon: Bell,
	order: LATEST_DOMAIN.order,
	badge: () => updatesState.info?.available === true,
};
