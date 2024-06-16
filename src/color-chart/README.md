# `<color-chart>`

Display lists of colors as a scatterplot or line chart.

## Features

- Plot any coordinate, in any color space

## Examples

### Basic usage

Plotting a single color scale:

```html
<color-chart y="oklch.l">
	<color-scale colors="#e3f2fd, #bbdefb, #90caf9, #64b5f6, #42a5f5, #2196f3, #1e88e5, #1976d2, #1565c0, #0d47a1"
	info="L: oklch.l, C: oklch.c, H: oklch.h"></color-scale>
</color-chart>
```

By default, the other coordinate would be the index of the color in the list, but you can specify it explicitly:

```html
<color-chart y="oklch.l">
	<color-scale colors="50: #e3f2fd, 100: #bbdefb, 200: #90caf9, 300: #64b5f6, 400: #42a5f5, 500: #2196f3, 600: #1e88e5, 700: #1976d2, 800: #1565c0, 900: #0d47a1"></color-scale>
</color-chart>
```

You can also specify a whole label, and if it contains a number, the number will become the X coordinate:

```html
<color-chart y="oklch.c">
	<color-scale colors="Red 50: #fef2f2, Red 100: #fee2e2, Red 200: #fecaca, Red 300: #fca5a5, Red 400: #f87171, Red 500: #ef4444, Red 600: #dc2626, Red 700: #b91c1c, Red 800: #991b1b, Red 900: #7f1d1d, 950: #450a0a"></color-scale>
	<color-scale colors="Orange 50: #fff7ed, Orange 100: #ffedd5, Orange 200: #fed7aa, Orange 300: #fdba74, Orange 400: #fb923c, Orange 500: #f97316, Orange 600: #ea580c, Orange 700: #c2410c, Orange 800: #9a3412, Orange 900: #7c2d12, Orange 950: #431407"></color-scale>
	<color-scale colors="Yellow 50: #fefce8, Yellow 100: #fef9c3, Yellow 200: #fef08a, Yellow 300: #fde047, Yellow 400: #facc15, Yellow 500: #eab308, Yellow 600: #ca8a04, Yellow 700: #a16207, Yellow 800: #854d0e, Yellow 900: #713f12, Yellow 950: #422006"></color-scale>
</color-chart>
```

_(Colors courtesy of Tailwind)_

Reactivity:

```html
<label>Coord:
	<select onchange="this.parentNode.nextElementSibling.y = this.value">
		<option selected>oklch.l</option>
		<option>oklch.c</option>
		<option>oklch.h</option>
	</select>
</label>
<color-chart y="oklch.l">
	<color-scale colors="Red 50: #fef2f2, Red 100: #fee2e2, Red 200: #fecaca, Red 300: #fca5a5, Red 400: #f87171, Red 500: #ef4444, Red 600: #dc2626, Red 700: #b91c1c, Red 800: #991b1b, Red 900: #7f1d1d, 950: #450a0a"></color-scale>
	<color-scale colors="Orange 50: #fff7ed, Orange 100: #ffedd5, Orange 200: #fed7aa, Orange 300: #fdba74, Orange 400: #fb923c, Orange 500: #f97316, Orange 600: #ea580c, Orange 700: #c2410c, Orange 800: #9a3412, Orange 900: #7c2d12, Orange 950: #431407"></color-scale>
	<color-scale colors="Yellow 50: #fefce8, Yellow 100: #fef9c3, Yellow 200: #fef08a, Yellow 300: #fde047, Yellow 400: #facc15, Yellow 500: #eab308, Yellow 600: #ca8a04, Yellow 700: #a16207, Yellow 800: #854d0e, Yellow 900: #713f12, Yellow 950: #422006"></color-scale>
</color-chart>
```

## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `x` | `x` | `string` | `null` | The coord to plot on the X axis, if any |
| `y` | `x` | `string` | `"oklch.l"` | The coord to plot on the Y axis, if any |

### Events

| Name | Description |
|------|-------------|

### CSS variables

| Name | Type | Description |
|------|------|-------------|
| `--color-scale-type` | `discrete` or `normal` | Whether to draw lines between consecutive points. Works on individual color swatches (to prevent drawing a line to the *next* point), entire color scales, or the entire chart. |

### Parts

| Name | Description |
|------|-------------|
| `axis` | The axis line |
| `ticks` | The container of ticks |
| `tick` | A tick mark |
| `label` | A label on the axis |
