# Interface: SkipLinkProps

Defined in: [primitives/skip-link/types.ts:31](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/skip-link/types.ts#L31)

Base props for primitives that EXTEND OmitStyle<HTMLElement>.
These already get `class` from HTMLAttributes - do NOT redefine it here.

## Extends

- `Omit`\<`HTMLAnchorAttributes`, `"style"` \| `"children"`\>.[`BaseProps`](BaseProps.md)

## Indexable

\[`key`: `symbol`\]: `false` \| `Attachment`\<`HTMLAnchorElement`\> \| `null` \| `undefined`

\[`key`: `` `data-${string}` ``\]: `any`

## Properties

### children?

> `optional` **children**: `Snippet`\<\[\]\>

Defined in: [primitives/skip-link/types.ts:32](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/skip-link/types.ts#L32)

***

### data-id?

> `optional` **data-id**: `string`

Defined in: [primitives/types.ts:100](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/types.ts#L100)

User-defined stable ID for tooling

#### Inherited from

[`BaseProps`](BaseProps.md).[`data-id`](BaseProps.md#data-id)
