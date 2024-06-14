# `<color-chart>`

Display lists of colors as a scatterplot or line chart.

## Features

- Plot any coordinate, in any color space

## Examples

### Basic usage

Plotting a single color scale:

```html
<color-chart y="oklch.l">
	<color-scale colors="50: #e3f2fd, 100: #bbdefb, 200: #90caf9, 300: #64b5f6, 400: #42a5f5, 500: #2196f3, 600: #1e88e5, 700: #1976d2, 800: #1565c0, 900: #0d47a1"></color-scale>
</color-chart>
```

By default, the other coordinate would be the index of the color in the list, but you can specify it explicitly:

```html
<color-chart y="oklch.l">
	<color-scale colors="50: #e3f2fd, 100: #bbdefb, 200: #90caf9, 300: #64b5f6, 400: #42a5f5, 500: #2196f3, 600: #1e88e5, 700: #1976d2, 800: #1565c0, 900: #0d47a1"></color-scale>
</color-chart>
```

You can optionally specify a label for a data point by  dividing it from the other coordinate with `/` (slash):

```html
<color-chart y="oklch.l">
	<color-scale colors="
		Blue 50 / 50: #e3f2fd,
		Blue 100 / 100: #bbdefb,
		Blue 200 / 200: #90caf9,
		Blue 300 / 300: #64b5f6,
		Blue 400 / 400: #42a5f5,
		Blue 500 / 500: #2196f3,
		Blue 600 / 600: #1e88e5,
		Blue 700 / 700: #1976d2,
		Blue 800 / 800: #1565c0,
		Blue 900 / 900: #0d47a1
	"></color-scale>
</color-chart>
```

Plot multiple color scales:

```html
<color-chart y="oklch.l">
	<color-scale colors="
		Blue 50 / 50: #e3f2fd,
		Blue 100 / 100: #bbdefb,
		Blue 200 / 200: #90caf9,
		Blue 300 / 300: #64b5f6,
		Blue 400 / 400: #42a5f5,
		Blue 500 / 500: #2196f3,
		Blue 600 / 600: #1e88e5,
		Blue 700 / 700: #1976d2,
		Blue 800 / 800: #1565c0,
		Blue 900 / 900: #0d47a1
	"></color-scale>
	<color-scale colors="
		Teal 50 / 50: #f0fdfa,
		Teal 100 / 100: #ccfbf1,
		Teal 200 / 200: #99f6e4,
		Teal 300 / 300: #5eead4,
		Teal 400 / 400: #2dd4bf,
		Teal 500 / 500: #14b8a6,
		Teal 600 / 600: #0d9488,
		Teal 700 / 700: #0f766e,
		Teal 800 / 800: #115e59,
		Teal 900 / 900: #134e4a
	"></color-scale>
</color-chart>
```