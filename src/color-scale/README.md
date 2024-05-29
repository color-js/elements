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

<!-- Colors via children:

```html
<color-scale space="oklch">
	<color-swatch>
		<span slot="before">Cyan 0</span>
		#e3fafc
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 1</span>
		#c5f6fa
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 2</span>
		#99e9f2
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 3</span>
		#66d9e8
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 4</span>
		#3bc9db
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 5</span>
		#22b8cf
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 6</span>
		#15aabf
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 7</span>
		#1098ad
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 8</span>
		#0c8599
	</color-swatch>
	<color-swatch>
		<span slot="before">Cyan 9</span>
		#0b7285
	</color-swatch>
</color-scale>
```

Colors via interpolation:

```html
<color-scale space="oklch" colors="#e3fafc, #0b7285" steps="8"></color-scale>
```

```html
<color-scale space="oklch" colors="#e3fafc, , , , , , , , , #0b7285"></color-scale>
``` -->

Questions:
- What happens when we have *both* nested swatches and the `colors` attribute?

Future:
- `sort` attribute?