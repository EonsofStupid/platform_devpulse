# Type Alias: OmitStyle\<T\>

> **OmitStyle**\<`T`\> = `Omit`\<`HTMLAttributes`\<`T`\>, `"style"` \| `"children"`\>

Defined in: [primitives/types.ts:92](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/types.ts#L92)

Omit 'style' and 'children' props from HTML attributes.
- style: enforces "no inline styles" at the type level
- children: allows primitives to define custom Snippet signatures

## Type Parameters

### T

`T` *extends* `HTMLElement`
