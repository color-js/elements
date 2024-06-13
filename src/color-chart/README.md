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