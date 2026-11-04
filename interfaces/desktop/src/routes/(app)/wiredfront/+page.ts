/** What this route folder says about itself (plan 0008). */

import { Radio } from "lucide-svelte";
import { WIREDFRONT_DOMAIN } from "#lib/sys/contracts/index.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Radio, order: WIREDFRONT_DOMAIN.order };
