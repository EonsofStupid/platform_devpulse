# Interface: AlertProps

Defined in: [behaviorsalert/types.ts:32](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/behaviorsalert/types.ts#L32)

Base props for behaviorsthat EXTEND OmitStyle<HTMLElement>.
These already get `class` from HTMLAttributes - do NOT redefine it here.

## Extends

- `Omit`\<`HTMLAttributes`\<`HTMLDivElement`\>, `"style"` \| `"children"`\>.[`BaseProps`](BaseProps.md)

## Indexable

\[`key`: `symbol`\]: `false` \| `Attachment`\<`HTMLDivElement`\> \| `null` \| `undefined`

\[`key`: `` `data-${string}` ``\]: `any`

## Properties

### children?

> `optional` **children**: `Snippet`\<\[\]\>

Defined in: [behaviorslert/types.ts:33](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/behaviorstypes.ts#L33)

***

### data-id?

> `optional` **data-id**: `string`

Defined in: [behaviors](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/behaviors

User-defined stable ID for tooling

#### Inherited from

[`BaseProps`](BaseProps.md).[`data-id`](BaseProps.md#data-id)
