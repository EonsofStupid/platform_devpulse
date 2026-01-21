<!--
  @file primitives/button/Button.test.svelte
  @layer primitives

  Test wrapper for Button primitive.
  Converts string `label` prop to children snippet for testing.
  Extends full ButtonProps to allow testing all attributes.
-->
<script lang="ts">
  import Button from "./Button.svelte";
  import type { ButtonProps } from "./types.js";

  /**
   * Test wrapper props - extends ButtonProps minus children (we provide label instead)
   */
  interface TestWrapperProps extends Omit<ButtonProps, "children"> {
    /** String content converted to children snippet */
    label?: string;
  }

  let { label = "Button", ...rest }: TestWrapperProps = $props();
</script>

<Button {...rest}>
  {label}
</Button>
