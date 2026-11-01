# Interface: HeadingProps

Defined in: [primitives/heading/types.ts:30](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/heading/types.ts#L30)

Base props for primitives that EXTEND OmitStyle<HTMLElement>.
These already get `class` from HTMLAttributes - do NOT redefine it here.

## Extends

- `Omit`\<`HTMLAttributes`\<`HTMLHeadingElement`\>, `"style"` \| `"children"`\>.[`BaseProps`](BaseProps.md)

## Indexable

\[`key`: `symbol`\]: `false` \| `Attachment`\<`HTMLHeadingElement`\> \| `null` \| `undefined`

\[`key`: `` `data-${string}` ``\]: `any`

## Properties

### children?

> `optional` **children**: `Snippet`\<\[\]\>

Defined in: [primitives/heading/types.ts:31](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/heading/types.ts#L31)

***

### data-id?

> `optional` **data-id**: `string`

Defined in: [primitives/types.ts:100](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/types.ts#L100)

User-defined stable ID for tooling

#### Inherited from

[`BaseProps`](BaseProps.md).[`data-id`](BaseProps.md#data-id)

***

### level?

> `optional` **level**: [`HeadingLevel`](../type-aliases/HeadingLevel.md)

Defined in: [primitives/heading/types.ts:33](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/heading/types.ts#L33)

Semantic heading level — determines HTML tag (h1-h6)
