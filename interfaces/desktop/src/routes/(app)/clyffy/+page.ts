/** What this route folder says about itself (plan 0008). */

import { Sparkles } from "lucide-svelte";
import { CLYFFY_DOMAIN } from "#lib/sys/contracts/index.js";
import type { RouteNav } from "#lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: Sparkles, order: CLYFFY_DOMAIN.order };
