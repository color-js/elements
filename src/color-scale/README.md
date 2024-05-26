# `<color-scale>`

## Examples

### Basic usage

Colors via attribute:

```html
<color-scale space="oklch" colors="#e3fafc, #c5f6fa, #99e9f2, #66d9e8, #3bc9db"></color-scale>
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