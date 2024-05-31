# `<color-scale>`

## Examples

### Basic usage

Colors via attribute:

```html
<color-scale space="oklch" colors="#e3fafc, #c5f6fa, #99e9f2, #66d9e8, #3bc9db"></color-scale>
```

You can also give them optional names:

```html
<color-scale space="oklch" colors="
	Gray 50: #f9fafb,
	Gray 100: #f3f4f6,
	Gray 200: #e5e7eb,
	Gray 300: #d1d5db,
	Gray 400: #9ca3af,
	Gray 500: #6b7280,
	Gray 600: #4b5563,
	Gray 700: #374151,
	Gray 800: #1f2937,
	Gray 900: #111827,
	Gray 850: #1a202c
"></color-scale>
```


You can only specify your core colors, and insert steps via interpolation:

```html
<color-scale colors="#e3fafc, #0b7285" steps="4" space="oklch"></color-scale>
```

If you have more than 2 colors listed, this will insert steps between each pair.

<!--
If you want to insert interpolated colors only in specific places, you can use empty values:

```html
<color-scale space="oklch" colors="#e3fafc, , , , , , , , , #0b7285"></color-scale>
``` -->
