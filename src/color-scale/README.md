# `<color-scale>`

Display a list of colors.

## Features

- Specify colors directly, via interpolation in any color space, or a mix of both
- Display color coordinates, in any color space (or multiple!)
- Coming soon: display deltas between consecutive colors

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

### Customizing the color swatches

Under the hood, `<color-scale>` generates and uses a series of [`<color-swatch>`](../color-swatch/) elements.

You can specify the `info` attribute to show additional information about the colors, and it will be passed to the generated `<color-swatch`> instances:

```html
<color-scale space="oklch" info="L: oklch.l, C: oklch.c, H: oklch.h"
             colors="#e3fafc, #c5f6fa, #99e9f2, #66d9e8, #3bc9db"></color-scale>
```

You can also create compact color scales, by simply setting `--details-style: compact`:

```html
<color-scale space="oklch" info="L: oklch.l, C: oklch.c, H: oklch.h"
             style="--details-style: compact"
             colors="#e3fafc, #c5f6fa, #99e9f2, #66d9e8, #3bc9db"></color-scale>
```

Issue: How to make them focusable??

<!--
If you want to insert interpolated colors only in specific places, you can use empty values:

```html
<color-scale space="oklch" colors="#e3fafc, , , , , , , , , #0b7285"></color-scale>
``` -->

## Reference

### Attributes & Properties

| Attribute | Property | Property type                         | Default value | Description                                                                                                                  |
| --------- | -------- | ------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `colors`  | `colors` | `{ [string]: Color }` &#124; `string` | -             | Object or comma-separated string defining the colors and their optional names.                                               |
| `space`   | `space`  | `ColorSpace` &#124; `string`          | `oklch`       | The color space to use for interpolation.                                                                                    |
| `steps`   | `steps`  | `number`                              | `0`           | Number of interpolated steps to insert between each pair of colors.                                                          |
| `info`    | `info`   | `string`                              | -             | Comma-separated list of coords of the colors to be shown. Passed to generated [`<color-swatch>`](../color-swatch/) elements. |

### Getters

These properties are read-only.

| Property         | Type                                                | Description                                                                                                          |
| ---------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `computedColors` | `Array<{name: string, color: Color}>` &#124; `null` | The array of color objects after processing interpolation and steps. Returns `null` if `this.colors` is not defined. |

### CSS variables

The styling of `<color-scale>` is fully customizable via CSS variables provided by the [`<color-swatch>`](../color-swatch/#css-variables) elements it generates.

| Name              | Type                                | Description                                                                                                    |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `--details-style` | `compact` &#124; `normal` (default) | Controls how color information is displayed. Inherited by child [`<color-swatch>`](../color-swatch/) elements. |

### Parts

| Name           | Description                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `color-swatch` | Each individual [`<color-swatch>`](../color-swatch/) element generated for the colors in the scale. |

The component also exports parts from its child `<color-swatch>` elements: `swatch`, `info`, `gamut`, and `swatch-label` (exported as `label`). See the [`<color-swatch>` parts table](../color-swatch/#parts) for details.

### Events

| Name           | Description                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------ |
| `colorschange` | Fired when the computed colors change for any reason, and once during initialization.                              |
| `colorchange`  | Fired when any individual color swatch changes (bubbled from child [`<color-swatch>`](../color-swatch/) elements). |
