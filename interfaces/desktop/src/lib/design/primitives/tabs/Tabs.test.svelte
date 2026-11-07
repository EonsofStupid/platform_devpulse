<!--
  @file primitives/tabs/Tabs.test.svelte
  @layer primitives

  Test wrapper for Tabs primitive.
  Composes all slot components into a complete tabs for testing.
-->
<script lang="ts">
  import Tabs from "./Tabs.svelte";
  import TabsList from "./TabsList.svelte";
  import TabsTrigger from "./TabsTrigger.svelte";
  import TabsContent from "./TabsContent.svelte";

  interface Props {
    /** Default selected tab */
    defaultValue?: string;
    /** Orientation */
    orientation?: "horizontal" | "vertical";
    /** Activation mode */
    activationMode?: "automatic" | "manual";
    /** Loop keyboard navigation */
    loop?: boolean;
    /** Whether to include a disabled tab */
    withDisabled?: boolean;
  }

  let {
    defaultValue = "tab1",
    orientation = "horizontal",
    activationMode = "automatic",
    loop = true,
    withDisabled = false,
  }: Props = $props();
</script>

<Tabs {defaultValue} {orientation} {activationMode} {loop}>
  <TabsList>
    <TabsTrigger value="tab1">Tab One</TabsTrigger>
    <TabsTrigger value="tab2">Tab Two</TabsTrigger>
    <TabsTrigger value="tab3" disabled={withDisabled}>Tab Three</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content for tab one</TabsContent>
  <TabsContent value="tab2">Content for tab two</TabsContent>
  <TabsContent value="tab3">Content for tab three</TabsContent>
</Tabs>
