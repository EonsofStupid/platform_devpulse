/** What this route folder says about itself (plan 0008). */

import { Home } from "lucide-svelte";
import { DEVPULSE_DOMAIN } from "#lib/sys/contracts/index.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Home, order: DEVPULSE_DOMAIN.order };
