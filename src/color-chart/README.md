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
	<color-scale colors="Red 50: #fef2f2, Red 100: #fee2e2, Red 200: #fecaca, Red 300: #fca5a5, Red 400: #f87171, Red 500: #ef4444, Red 600: #dc2626, Red 700: #b91c1c, Red 800: #991b1b, Red 900: #7f1d1d, Red 950: #450a0a"></color-scale>
	<color-scale colors="Orange 50: #fff7ed, Orange 100: #ffedd5, Orange 200: #fed7aa, Orange 300: #fdba74, Orange 400: #fb923c, Orange 500: #f97316, Orange 600: #ea580c, Orange 700: #c2410c, Orange 800: #9a3412, Orange 900: #7c2d12, Orange 950: #431407"></color-scale>
	<color-scale colors="Yellow 50: #fefce8, Yellow 100: #fef9c3, Yellow 200: #fef08a, Yellow 300: #fde047, Yellow 400: #facc15, Yellow 500: #eab308, Yellow 600: #ca8a04, Yellow 700: #a16207, Yellow 800: #854d0e, Yellow 900: #713f12, Yellow 950: #422006"></color-scale>
</color-chart>
```

_(Colors courtesy of Tailwind)_

### Plotting hues { #hues}

Hues will be shifted as needed to produce a better result:

```html
<color-chart y="hsl.h">
	<color-scale colors="hsl(5 50% 50%), hsl(355 50% 50%), hsl(10 50% 50%), hsl(-10 50% 50%)"></color-scale>
</color-chart>
```

```html
<color-chart y="oklch.h">
	<color-scale colors="05: #2c0110, 10: #41031a, 20: #67082e, 30: #890e3f, 40: #ac1450, 50: #e01d6b, 60: #f2638c, 70: #fb8ea8, 80: #ffb4c5, 90: #ffdce3, 95: #ffeef1"></color-scale>
	<color-scale colors="05 (WA) / 05: #26050c, 10 (WA) / 10: #3e0817, 20 (WA) / 20: #630d29, 30 (WA) / 30: #88123b, 40 (WA) / 40: #ab174e, 50 (WA) / 50: #de1d6a, 60 (WA) / 60: #ee669b, 70 (WA) / 70: #f391b9, 80 (WA) / 80: #f7b8d3, 90 (WA) / 90: #fbdeeb, 95 (WA) / 95: #fdeef5"></color-scale>
</color-chart>
```

### The `info` attribute

You can use the `info` attribute to show information about the color scale points. Currently, the only type of information supported is color coords (in any color space), but more will be added in the future.

The format of this attribute is analogous to the one of [`<color-swatch>`](../color-swatch/#the-info-attribute).

```html
<color-chart y="oklch.c" info="L: oklch.l, C: oklch.c, H: oklch.h">
	<color-scale colors="50: #eff6ff, 100: #dbeafe, 200: #bfdbfe, 300: #93c5fd, 400: #60a5fa, 500: #3b82f6, 600: #2563eb, 700: #1d4ed8, 800: #1e40af, 900: #1e3a8a, 950: #172554"></color-scale>
	<color-scale colors="50: #ecfeff, 100: #cffafe, 200: #a5f3fc, 300: #67e8f9, 400: #22d3ee, 500: #06b6d4, 600: #0891b2, 700: #0e7490, 800: #155e75, 900: #164e63, 950: #083344"></color-scale>
	<color-scale colors="50: #f0fdfa, 100: #ccfbf1, 200: #99f6e4, 300: #5eead4, 400: #2dd4bf, 500: #14b8a6, 600: #0d9488, 700: #0f766e, 800: #115e59, 900: #134e4a, 950: #042f2e"></color-scale>
</color-chart>
```

Reactively changing the Y coordinate:

```html
<button onclick="this.nextElementSibling.y = 'hwb.w'">
	Switch to “HWB Whiteness”
</button>
<color-chart y="oklch.l">
	<color-scale colors="Red 50: #fef2f2, Red 100: #fee2e2, Red 200: #fecaca, Red 300: #fca5a5, Red 400: #f87171, Red 500: #ef4444, Red 600: #dc2626, Red 700: #b91c1c, Red 800: #991b1b, Red 900: #7f1d1d, Red 950: #450a0a"></color-scale>
	<color-scale colors="Orange 50: #fff7ed, Orange 100: #ffedd5, Orange 200: #fed7aa, Orange 300: #fdba74, Orange 400: #fb923c, Orange 500: #f97316, Orange 600: #ea580c, Orange 700: #c2410c, Orange 800: #9a3412, Orange 900: #7c2d12, Orange 950: #431407"></color-scale>
	<color-scale colors="Yellow 50: #fefce8, Yellow 100: #fef9c3, Yellow 200: #fef08a, Yellow 300: #fde047, Yellow 400: #facc15, Yellow 500: #eab308, Yellow 600: #ca8a04, Yellow 700: #a16207, Yellow 800: #854d0e, Yellow 900: #713f12, Yellow 950: #422006"></color-scale>
</color-chart>
```

Reactively setting/changing the colors:
```html
<label>Colors:
	<select onchange="this.parentNode.nextElementSibling.firstElementChild.colors = this.value">
		<option selected value="">None</option>
		<option value="Yellow 50: #fefce8, Yellow 100: #fef9c3, Yellow 200: #fef08a, Yellow 300: #fde047, Yellow 400: #facc15, Yellow 500: #eab308, Yellow 600: #ca8a04, Yellow 700: #a16207, Yellow 800: #854d0e, Yellow 900: #713f12, Yellow 950: #422006">Yellow</option>
		<option value="Orange 50: #fff7ed, Orange 100: #ffedd5, Orange 200: #fed7aa, Orange 300: #fdba74, Orange 400: #fb923c, Orange 500: #f97316, Orange 600: #ea580c, Orange 700: #c2410c, Orange 800: #9a3412, Orange 900: #7c2d12, Orange 950: #431407">Orange</option>
		<option value="Red 50: #fef2f2, Red 100: #fee2e2, Red 200: #fecaca, Red 300: #fca5a5, Red 400: #f87171, Red 500: #ef4444, Red 600: #dc2626, Red 700: #b91c1c, Red 800: #991b1b, Red 900: #7f1d1d, Red 950: #450a0a">Red</option>
	</select>
</label>
<color-chart y="oklch.l">
	<color-scale></color-scale>
</color-chart>
```

## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `x` | `x` | `string` | `null` | The coord to plot on the X axis, if any |
| `y` | `y` | `string` | `"oklch.l"` | The coord to plot on the Y axis, if any |
| `info` | `info` | `string` | - | Comma-separated list of coords of the color point to be shown. |

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
