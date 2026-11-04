<!--
    @file MemorySendingPanel.svelte
    @module @devpulse/domains/app/memory/ui/memory-sending

    What goes to your agents with every new conversation: how much, what did not
    fit, and the exact text.
-->
<script lang="ts">
import { Button } from "@devpulse/coldlight/components/button";
import { Card } from "@devpulse/coldlight/components/card";
import { InlineMessage } from "@devpulse/coldlight/components/inline-message";
import { Text } from "@devpulse/coldlight/components/text";
import { fill } from "#lib/sys/copy/index.js";
import type { MemorySendingPanelProps } from "./memory-sending.types.js";

let { copy, sending }: MemorySendingPanelProps = $props();

let showing = $state(false);
</script>

<div class="flex flex-col gap-3">
    <Text size="sm" color="muted">{copy.sending_description}</Text>
    {#if sending.text === null}
        <Text size="sm" color="muted">{copy.sending_none}</Text>
    {:else}
        <Text size="sm">{fill(copy.sending_used, { used: String(sending.used), limit: String(sending.limit) })}</Text>
    {/if}
    {#if sending.leftOut.length > 0}
        <InlineMessage tone="warning">{fill(copy.sending_left_out, { names: sending.leftOut.join(", ") })}</InlineMessage>
    {/if}
    {#if sending.text !== null}
        <div>
            <Button size="sm" variant="secondary" aria-expanded={showing} onclick={() => (showing = !showing)}>
                {showing ? copy.sending_hide : copy.sending_show}
            </Button>
        </div>
        {#if showing}
            <Card>
                <div class="p-3">
                    <Text as="p" size="sm" class="whitespace-pre-wrap">{sending.text}</Text>
                </div>
            </Card>
        {/if}
    {/if}
</div>
