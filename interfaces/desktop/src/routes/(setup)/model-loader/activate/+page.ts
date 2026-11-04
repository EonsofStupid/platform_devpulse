/** What this route folder says about itself (plan 0008): a step in the setup flow, not a menu entry. */

import { MessageCircle } from "lucide-svelte";
import type { RouteNav } from "$lib/sys/routing/index.js";

export const _nav: RouteNav = { icon: MessageCircle, placement: "hidden" };
