# Interface: AspectRatioProps

Defined in: [behaviorsaspect-ratio/types.ts:52](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/behaviorsct-ratio/types.ts#L52)

AspectRatioProps — props for the aspect-ratio primitive.

Zero ARIA. Zero state logic. Zero styling.
The component layer applies ARIA + data-state + recipe classes.
The `class` prop receives recipe-generated strings from the component layer.

## Extends

- `Omit`\<`HTMLAttributes`\<`HTMLDivElement`\>, `"style"` \| `"children"`\>.[`BaseProps`](BaseProps.md)

## Indexable

\[`key`: `symbol`\]: `false` \| `Attachment`\<`HTMLDivElement`\> \| `null` \| `undefined`

\[`key`: `` `data-${string}` ``\]: `any`

## Properties

### children?

> `optional` **children**: `Snippet`\<\[\]\>

Defined in: [behaviorses.ts:53](https://github.com/EonsofStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/behaviors

***

### data-id?

> `optional` **data-id**: `string`

Defined in: [behaviorsStupid/platform_devpulse/blob/67216c2b467cf993e9f2044f8cbec2e66dc2fcf0/interfaces/desktop/src/lib/design/primitives/types.ts#L100)

User-defined stable ID for tooling

#### Inherited from

[`BaseProps`](BaseProps.md).[`data-id`](BaseProps.md#data-id)
