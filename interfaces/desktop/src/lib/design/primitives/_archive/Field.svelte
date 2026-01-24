<!--
  @file primitives/Field.svelte
  @layer primitives

  Form field wrapper that auto-links label, input, and error via ARIA.
  Generates IDs automatically for proper aria-describedby linking.

  A11y Acceptance: Input ALWAYS linked to error/help by aria-describedby
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends Omit<OmitStyle<HTMLDivElement>, "children">, BaseProps {
    /** Field name (used for ID generation) */
    name: string;
    /** Error message */
    error?: string;
    /** Help/description text */
    description?: string;
    /** Label slot */
    label?: Snippet<[{ id: string; htmlFor: string }]>;
    /** Input slot - receives IDs for ARIA linking */
    children?: Snippet<[{
      inputId: string;
      describedBy: string;
      invalid: boolean;
    }]>;
    /** Error slot */
    errorSlot?: Snippet<[{ id: string; message: string }]>;
    /** Description slot */
    descriptionSlot?: Snippet<[{ id: string; text: string }]>;
  }

  let {
    name,
    error,
    description,
    label,
    children,
    errorSlot,
    descriptionSlot,
    class: className = "",
    "data-id": id,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Field");

  // Generate stable IDs (reactive to name prop)
  const inputId = $derived(`field-${name}-input`);
  const errorId = $derived(`field-${name}-error`);
  const descriptionId = $derived(`field-${name}-description`);

  // Build describedBy string
  let describedBy = $derived.by(() => {
    const ids: string[] = [];
    if (error) ids.push(errorId);
    if (description) ids.push(descriptionId);
    return ids.join(" ") || undefined;
  });

  const hasError = $derived(!!error);
</script>

<div
  class={className}
  data-kind="primitive"
  data-name="Field"
  data-part="root"
  data-id={id}
  data-invalid={hasError || undefined}
  {...rest}
>
  {#if label}
    {@render label({ id: `field-${name}-label`, htmlFor: inputId })}
  {/if}

  {#if children}
    {@render children({
      inputId,
      describedBy: describedBy ?? "",
      invalid: hasError
    })}
  {/if}

  {#if description && descriptionSlot}
    {@render descriptionSlot({ id: descriptionId, text: description })}
  {:else if description}
    <div id={descriptionId} data-part="description">{description}</div>
  {/if}

  {#if error && errorSlot}
    {@render errorSlot({ id: errorId, message: error })}
  {:else if error}
    <div id={errorId} data-part="error" role="alert">{error}</div>
  {/if}
</div>
