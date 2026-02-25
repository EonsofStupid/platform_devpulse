# Interface: CheckboxRootProps

Defined in: [primitives/checkbox/types.ts:37](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/checkbox/types.ts#L37)

Base props for primitives that EXTEND OmitStyle<HTMLElement>.
These already get `class` from HTMLAttributes - do NOT redefine it here.

## Extends

- `Omit`\<`HTMLButtonAttributes`, `"style"` \| `"children"`\>.[`BaseProps`](BaseProps.md)

## Indexable

\[`key`: `symbol`\]: `false` \| `Attachment`\<`HTMLButtonElement`\> \| `null` \| `undefined`

\[`key`: `` `data-${string}` ``\]: `any`

## Properties

### checked?

> `optional` **checked**: `boolean`

Defined in: [primitives/checkbox/types.ts:40](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/checkbox/types.ts#L40)

Controlled checked state

***

### children?

> `optional` **children**: `Snippet`\<\[\]\>

Defined in: [primitives/checkbox/types.ts:38](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/checkbox/types.ts#L38)

***

### data-id?

> `optional` **data-id**: `string`

Defined in: [primitives/types.ts:100](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/types.ts#L100)

User-defined stable ID for tooling

#### Inherited from

[`BaseProps`](BaseProps.md).[`data-id`](BaseProps.md#data-id)

***

### indeterminate?

> `optional` **indeterminate**: `boolean`

Defined in: [primitives/checkbox/types.ts:42](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/checkbox/types.ts#L42)

Indeterminate (mixed) state
