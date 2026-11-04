/** What this route folder says about itself (plan 0008). */

import { Wrench } from "lucide-svelte";
import { DEVFORGE_DOMAIN } from "#lib/sys/contracts/index.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Wrench, order: DEVFORGE_DOMAIN.order };
