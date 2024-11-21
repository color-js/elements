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

### The `editable` attribute

The `editable` attribute allows you to make the color scale editable, enabling the addition of new colors and editing or the removal of existing ones. You can specify whether the color names, color values, or both should be editable.

Editing colors (including adding and removing):

```html
<color-scale editable="color" space="oklch" colors="#e3fafc, #c5f6fa, #99e9f2, #66d9e8, #3bc9db"></color-scale>
```

Editing color names:

```html
<color-scale editable="name" space="oklch" colors="#c5f6fa, #99e9f2, #3bc9db"></color-scale>
```

Or both:

```html
<color-scale editable="name color" space="oklch" colors="
	Gray 300: #d1d5db,
	Gray 400: #9ca3af,
	Gray 500: #6b7280
"></color-scale>
```

There is a shorter way to achieve the same result—use `editable` as a boolean attribute (or set it to `true` programmatically):

```html
<color-scale editable space="oklch" colors="
	Gray 300: #d1d5db,
	Gray 400: #9ca3af,
	Gray 500: #6b7280
"></color-scale>
```

Keep in mind that interpolated colors are generated automatically and are not editable:

```html
<color-scale editable="color" colors="#e3fafc, #0b7285" steps="4" space="oklch"></color-scale>
```

The `editable` attribute is reactive and can be set programmatically:

```html
<label>
	<input type="checkbox" onchange="this.parentElement.nextElementSibling.editable = this.checked">Editable
</label>
<color-scale space="oklch" colors="Peach: #f6d6d6, Yellow: #f6f7c4, Mint: #a1eebd"></color-scale>
```

You can also add colors programmatically with the `addColor()` method, providing the color to add and, optionally, its name:

```html
<button onclick="this.nextElementSibling.addColor('#7bd3ea', 'Blue')">Add blue color</button>
<color-scale space="oklch" colors="Peach: #f6d6d6, Yellow: #f6f7c4, Mint: #a1eebd"></color-scale>
```

Or don't provide any of them. In that case, the added swatch will get the color of the last one:

```html
<button onclick="this.nextElementSibling.addColor()">Add default color</button>
<color-scale space="oklch" colors="Peach: #f6d6d6, Yellow: #f6f7c4, Mint: #a1eebd"></color-scale>
```

Don't want added swatches to get the color of the last one? No problem. You can change that, too.
Add the `defaultColor()` method to the color scale and return an object with the desired color and (optional) name from it:

```html
<button onclick="this.nextElementSibling.addColor()">Add my color</button>
<color-scale id="custom_color" space="oklch" colors="Peach: #f6d6d6, Yellow: #f6f7c4, Mint: #a1eebd"></color-scale>

<script>
	custom_color.defaultColor = () => ({ color: "#f06", name: "My awesome color" });
</script>
```

<!--
If you want to insert interpolated colors only in specific places, you can use empty values:

```html
<color-scale space="oklch" colors="#e3fafc, , , , , , , , , #0b7285"></color-scale>
``` -->
