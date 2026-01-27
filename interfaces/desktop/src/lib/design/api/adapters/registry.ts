/**
 * Registry shape for 2026 Inversion of Control
 */
export interface AdapterRegistry {
  // ColdLight is always the SSOT
  ssot: "coldlight";
  
  // Currently assigned behavior provider
  activeProvider: "meltui" | "coldlight_native"; 

  // Mapping of ColdLight Primitives to Provider Methods
  mappings: {
    [PrimitiveKind: string]: {
      providerSource: string; // e.g., "@melt-ui/svelte"
      internalPath: string;   // src/lib/design/api/adapter/meltui/_internal/
      requirements: {
        states: string[];     // ["open", "active", "disabled"]
        aria: string[];       // ["role", "aria-controls", "aria-expanded"]
      };
    };
  };
}