# CRYSTAL DESIGN SYSTEM - HSL/OKLCH TOKEN REFERENCE
> **Color Format**: HSL/OKLCH ONLY (no hex/rgba unless necessary)
> **Location**: `src/lib/design/tokens/aligned to self-describing named json.`

## Color Primitives
```css
--color-black: hsla(187, 66%, 10%, 1.00);
--color-void:  hsla(249, 43%, 25%, 0.72);
--signal-teal: hsl(168, 100%, 50%);
--signal-purple: hsl(275, 100%, 50%);
--mode-color: var(--signal-teal); /* Dynamic */
```

## Bevel System (Thick Depth)
| Token | Effect |
|-------|--------|
| `--bevel-outset-subtle` | 1px raised |
| `--bevel-outset-soft` | 2px raised |
| `--bevel-outset-medium` | 4px raised |
| `--bevel-outset-thick` | 6px raised, heavy 3D |
| `--bevel-inset-deep` | Pressed recess |

## Surface Fills
```css
--surface-glass-void: hsla(240, 20%, 4%, 0.75);
--surface-glass-deep: hsla(240, 15%, 6%, 0.65);
--surface-solid-void: hsl(240, 20%, 4%);
```

## Shadow Depth
```css
--shadow-z1 → --shadow-z5  /* Drop shadows */
--shadow-glow-mode         /* Mode-colored glow */
--shadow-glow-teal/purple/ember
```

## Surface Component
```svelte
<Surface 
    variant="glass | solid | mode"
    bevel="none | subtle | soft | medium | thick"
    depth={0-5}
    blur="none | xs | sm | md | lg | xl | 2xl"
    border="none | subtle | soft | medium | strong | mode"
    glow="none | mode | teal | purple | ember"
    radius="sm | md | lg | xl | 2xl | full"
    modeColor="hsl(168, 100%, 50%)"
>
    content
</Surface>
```

## Widget Builder Example
```svelte
<Surface 
    variant="mode" 
    bevel="thick" 
    depth={4} 
    glow="mode"
    modeColor="hsl(275, 100%, 50%)"
>
    <h2>My Custom Widget</h2>
</Surface>
```
