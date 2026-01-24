<!--
  @file primitives/Form.svelte
  @layer primitives

  Form element with error summary ARIA linking.
  Exposes ref for programmatic submit.

  A11y Acceptance: Error summary linked via aria-describedby
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { OmitStyle, BaseProps } from "./types.js";
  import { stripStyleProp } from "./types.js";

  interface Props extends OmitStyle<HTMLFormElement>, BaseProps {
    /** Form ID */
    id?: string;
    /** ID of error summary element */
    errorSummaryId?: string;
    /** Prevent default form submission */
    preventDefault?: boolean;
    /** Form content */
    children?: Snippet;
    /** Submit handler */
    onSubmit?: (e: SubmitEvent) => void;
  }

  let {
    id: formId,
    errorSummaryId,
    preventDefault = true,
    children,
    onSubmit,
    class: className = "",
    "data-id": dataId,
    ...rest
  }: Props = $props();

  stripStyleProp(rest, "Form");

  let formRef = $state<HTMLFormElement>();

  function handleSubmit(e: SubmitEvent) {
    if (preventDefault) {
      e.preventDefault();
    }
    onSubmit?.(e);
  }

  export function submit() {
    formRef?.requestSubmit();
  }

  export function reset() {
    formRef?.reset();
  }
</script>

<form
  bind:this={formRef}
  id={formId}
  aria-describedby={errorSummaryId}
  class={className}
  data-kind="primitive"
  data-name="Form"
  data-part="root"
  data-id={dataId}
  onsubmit={handleSubmit}
  {...rest}
>
  {@render children?.()}
</form>
