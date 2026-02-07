<!--
  @file primitives/dialog/Title.svelte
  @layer primitives

  Dialog title - accessible heading for the dialog.

  ColdLight OWNS:
  - id={titleId} (from context, linked to Content's aria-labelledby)
  - Native heading element (<h1>-<h6>) based on level prop

  meltui provides NOTHING for Title - pure ColdLight element.

  Data Attributes:
  - data-kind="dialog"
  - data-slot="title"
-->
<script lang="ts">
import { getContext } from "svelte";
import type { DialogContext, DialogTitleProps } from "./types.js";
import { DIALOG_CONTEXT_KEY } from "./types.js";

let { level = 2, children, class: className = "", "data-id": dataId }: DialogTitleProps = $props();

// ============================================
// COLDLIGHT GETS ID FROM CONTEXT
// ============================================
const ctx = getContext<DialogContext>(DIALOG_CONTEXT_KEY);
const { titleId } = ctx;
</script>

<!--
  ColdLight renders native heading element.
  ID is set explicitly by ColdLight, linked to Content's aria-labelledby.
  NO meltui involvement - pure native element.
-->
{#if level === 1}
  <h1
    id={titleId}
    class={className}
    data-kind="dialog"
    data-slot="title"
    data-id={dataId}
  >
    {#if children}{@render children()}{/if}
  </h1>
{:else if level === 2}
  <h2
    id={titleId}
    class={className}
    data-kind="dialog"
    data-slot="title"
    data-id={dataId}
  >
    {#if children}{@render children()}{/if}
  </h2>
{:else if level === 3}
  <h3
    id={titleId}
    class={className}
    data-kind="dialog"
    data-slot="title"
    data-id={dataId}
  >
    {#if children}{@render children()}{/if}
  </h3>
{:else if level === 4}
  <h4
    id={titleId}
    class={className}
    data-kind="dialog"
    data-slot="title"
    data-id={dataId}
  >
    {#if children}{@render children()}{/if}
  </h4>
{:else if level === 5}
  <h5
    id={titleId}
    class={className}
    data-kind="dialog"
    data-slot="title"
    data-id={dataId}
  >
    {#if children}{@render children()}{/if}
  </h5>
{:else}
  <h6
    id={titleId}
    class={className}
    data-kind="dialog"
    data-slot="title"
    data-id={dataId}
  >
    {#if children}{@render children()}{/if}
  </h6>
{/if}
