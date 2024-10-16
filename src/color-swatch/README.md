# `<color-swatch>`

## Examples

### Basic usage

<table>
<thead>
	<tr>
		<th></th>
		<th>Default</th>
		<th>Large</th>
	</tr>
</thead>
<tbody>
<tr>
<th>Static</th>
<td>

```html
<color-swatch>oklch(70% 0.25 138)</color-swatch>
```
</td>
<td>

```html
<color-swatch size="large">oklch(70% 0.25 138)</color-swatch>
```
</td>
</tr>
<tr>
<th>Editable</th>
<td>

```html
<color-swatch>
	<input value="oklch(70% 0.25 138)" />
</color-swatch>
```
</td>
<td>

```html
<color-swatch size="large">
	<input value="oklch(70% 0.25 138)" />
</color-swatch>
```
</td>
</tr>
</tbody>
</table>

You can use a `--details-style: compact` CSS property to only show the details on user interaction:

```html
<color-swatch style="--details-style: compact">oklch(70% 0.25 138)</color-swatch>
<color-swatch size="large" style="--details-style: compact">oklch(70% 0.25 138)</color-swatch>
```

Warning: This is not keyboard accessible by default.
To make the element focusable and also show the popup when it is focused, you need to add `tabindex="0"` to your element:

```html
<color-swatch size="large" style="--details-style: compact" tabindex="0">oklch(70% 0.25 138)</color-swatch>
```

By default, the popup will be shown when the element is hovered, focused, `:active`, or the target of the URL hash.
To circumvent user interaction and force the popup to be open use the `open` attribute.
You can also use `open="false"` to force it to be closed regardless of interaction:

```html
<div style="--details-style: compact">
	<color-swatch size="large">oklch(70% 0.25 138)</color-swatch>
	<color-swatch size="large" open>oklch(70% 0.25 138)</color-swatch>
	<color-swatch size="large" open="false">oklch(70% 0.25 138)</color-swatch>
</div>
```

### The `value` attribute

You can provide the color via the `value` attribute,
which can be more convenient when you have slotted content.

In that case, the content of the element is merely presentational
(unless it’s an `<input>`).
If you don’t specify any content, no text will be shown.

<table>
<thead>
	<tr>
		<th>Static</th>
		<th>Editable</th>
	</tr>
</thead>
<tbody>
<tr>

<td>

```html
<color-swatch value="oklch(70% 0.25 138)" size="large">red</color-swatch>
```

</td>
<td>

```html
<color-swatch value="oklch(70% 0.25 138)" size="large">
	<input />
</color-swatch>
```
</td>

</tr>
</tbody>
</table>

You can also use this as a property when creating color swatches dynamically:

```html
<div id="future_swatch_container"></div>
<script>
let swatch = document.createElement("color-swatch");
swatch.value = "oklch(65% 0.15 210)";
swatch.setAttribute("size", "large");
swatch.textContent = "Turquoise";
future_swatch_container.append(swatch);
</script>
```

### The `label` attribute

You can provide the color label via the `label` attribute.

<table>
<thead>
	<tr>
		<th></th>
		<th>Default</th>
		<th>Large</th>
	</tr>
</thead>
<tbody>
<tr>
<th>Static</th>
<td>

```html
<color-swatch label="Turquoise">oklch(65% 0.15 210)</color-swatch>
```
</td>
<td>

```html
<color-swatch label="Turquoise" size="large">oklch(65% 0.15 210)</color-swatch>
```
</td>
</tr>
<tr>
<th>Editable</th>
<td>

```html
<color-swatch label="Turquoise">
	<input value="oklch(65% 0.15 210)" />
</color-swatch>
```
</td>
<td>

```html
<color-swatch label="Turquoise" size="large">
	<input value="oklch(65% 0.15 210)" />
</color-swatch>
```
</td>
</tr>
</tbody>
</table>

If the attribute's value matches the element's content, no additional text with the label will be shown.

```html
<color-swatch label="Turquoise" value="oklch(65% 0.15 210)" size="large">Turquoise</color-swatch>
```

If used as a property and is not defined via the `label` attribute, its value is that of the element text content.

### The `info` attribute

You can use the `info` attribute to show information about the color.
Currently, the types of information supported are color coords (in any color space), the difference (delta) and contrast between the current color and another one (specified via [the `vs` attribute](./#the-vs-attribute)).

```html
<color-swatch info="oklch.l, oklch.c, oklch.h" size="large">
	oklch(70% 0.25 138)
</color-swatch>
```

By default, the label for each value will be determined automatically from the type of information (e.g. the full coord name if a coord),
but you can customize this by adding a label before the description of the data:

```html
<color-swatch info="L: oklch.l, C: oklch.c, H: oklch.h" size="large">
	oklch(70% 0.25 138)
</color-swatch>
```


The `info` attribute plays quite nicely with the `--details-style: compact` style:

```html
<color-swatch size="large" info="oklch.l, oklch.c, oklch.h" style="--details-style: compact">oklch(70% 0.25 138)</color-swatch>
```

### The `vs` attribute

You can calculate the difference (delta) and contrast between the current color and another one.
To do so, provide the new color via the `vs` attribute and specify one of the [supported algorithms for calculating the difference](https://colorjs.io/docs/color-difference#delta-e-e) ([contrast](https://colorjs.io/docs/contrast) or both) between two colors inside [the `info` attribute](./#the-info-attribute).

```html
<color-swatch info="deltaE2000, WCAG21: WCAG21 contrast" vs="white" size="large">
	oklch(70% 0.25 138)
</color-swatch>
```

If color coords are also specified, the deltas on a coord-by-coord basis will be shown:

```html
<color-swatch info="oklch.l, oklch.c, oklch.h, deltaE2000, WCAG21: WCAG21 contrast" vs="white" size="large">
	oklch(70% 0.25 138)
</color-swatch>
```

### With slot content

Before and after:

```html
<color-swatch>
	<label slot="before" for=c1>Accent color:</label>
	<input value="oklch(70% 0.25 138)" id=c1 />
</color-swatch>
```

```html
<color-swatch>
	<label slot="before" for=c1>Accent color:</label>
	oklch(70% 0.25 138)
</color-swatch>
```

```html
<color-swatch size="large">
	<label slot="before" for=c2>Accent color:</label>
	<input value="oklch(70% 0.25 138)" id=c2 />
	<small slot="after">Tip: Pick a bright medium color.</small>
</color-swatch>
```

Adding text within the default swatch:

```html
<color-swatch size="large">
	<div slot="swatch-content">Some text</div>
	<input value="oklch(70% 0.25 138)" id=c1 />
</color-swatch>
```

Note that the text color will automatically switch from black to white to remain readable (using [this technique](https://lea.verou.me/blog/2024/contrast-color/)).

----

Replacing the whole swatch with a custom element:

```html
<color-swatch size="large">
	<div slot="swatch">Some text</div>
	<input value="oklch(70% 0.25 138)" id=c1 />
</color-swatch>
```

<!--
### Bound to CSS property

You can automatically bind the color swatch to a CSS property by setting the `property` attribute.
Then you don’t need to provide an initial value, it will be read from the CSS property,
and updating the color will update the CSS property.

```html
<color-swatch size="large" property="--color-red">
	<input />
</color-swatch>
```

You can use `scope` to select the closest ancestor (via a CSS selector) on which the CSS property will be read from and written to.
If you don’t, the `<html>` element will be used.
-->

### Events

```html
<color-swatch size="large" oncolorchange="this.nextElementSibling.textContent = this.color">
	<input value="oklch(70% 0.25 138)" />
</color-swatch>
<color-inline></color-inline>
```

### Update via JS

#### Static

```html
<color-swatch id="dynamic_static">oklch(70% 0.25 138)</color-swatch>
<button onclick='dynamic_static.color = "oklch(60% 0.15 0)"'>Change color</button>
```

### Editable

```html
<color-swatch id="dynamic_editable">
	<input value="oklch(70% 0.25 138)" />
</color-swatch>
<button onclick='dynamic_editable.color = "oklch(60% 0.15 0)"'>Change color</button>
```

## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `color` | `color` | `Color` &#124; `string` | - | The current color value. |
| `info` | `info` | `string` | - | Comma-separated list of coords of the current color to be shown. |
| `value` | `value` | `string` | - | The current value of the swatch. |
| `label` | `label` | `string` | - | The label of the swatch (e.g., color name). Defaults to the element text content. |
| `size` | - | `large` | - | The size of the swatch. Currently, it is used only to make a large swatch. |
| `vs` | `vs` | `Color` &#124; `string` | - | The second color to use when calculating the difference (delta) and contrast with the current color. |
| `property` | `property` | `string` | - | CSS property to bind to. |
| `scope` | `scope` | `string` | `:root` | CSS selector to use as the scope for the specified CSS property. |
| `gamuts` | `gamuts` | `string` | `srgb, p3, rec2020: P3+, prophoto: PP` | Comma-separated list of gamuts to be used by the gamut indicator. |
| `open` | `open` | | `null` | Force the details popup open or closed. |

### Getters

These properties are read-only.

| Name | Type | Description |
|----------|------|-------------|
| `gamut` | `string` | The id of the current gamut (e.g. `srgb`). |

### CSS variables

| Name | Type | Description |
|----------|---------------|-------------|
| `--details-style` | `compact` &#124; `normal` (default) | |
| `--transparency-grid` | `<image>` | Gradient used as a background for transparent parts of the swatch. |
| `--transparency-cell-size` | `<length>` | The size of the cells of the transparency gradient. |
| `--transparcency-background` | `<color>` | The background color of the transparency gradient. |
| `--transparency-darkness` | `<percentage>` | The opacity of the black color used for dark parts of the transparency gradient. |
| `--positive-delta-color` | `<color>` | The color used for the positive color difference in color coords. |
| `--negative-delta-color` | `<color>` | The color used for the negative color difference in color coords. |

### Parts

| Name | Description |
|------|-------------|
| `swatch` | The swatch used to render the color. |
| `details` | Wrapper around all non-swatch content (color name, info, etc) |
| `label` | The label of the swatch |
| `color-wrapper` | Wrapper around the color name itself |
| `gamut` | Gamut indicator |
| `info` | Any info generateed by the `info` attribute |

### Events

| Name | Description |
|------|-------------|
| `valuechange` | Fired when the value changes for any reason, and once during initialization. |
| `colorchange` | Fired when the color changes for any reason, and once during initialization. |
| `gamutchange` | Fired when the gamut changes for any reason, and once during initialization. |