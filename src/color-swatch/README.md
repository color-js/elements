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

### With slot content

Before and after:

```html
<color-swatch>
	<label slot="before" for=c1>Accent color:</label>
	<input value="oklch(70% 0.25 138)" id=c1 />
</color-swatch>
```

```html
<color-swatch size="large">
	<label slot="before" id=c2>Accent color:</label>
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
| `value` | `value` | `string` | - | The current value of the swatch. |
| `size` | - | `large` | - | The size of the swatch. Currently, it is used only to make a large swatch. |
| `property` | `property` | `string` | - | CSS property to bind to. |
| `scope` | `scope` | `string` | `:root` | CSS selector to use as the scope for the specified CSS property. |
| `gamuts` | `gamuts` | `string` | `srgb, p3, rec2020: P3+, prophoto: PP` | Comma-separated list of gamuts to be used by the gamut indicator. |

### CSS variables

| Variable | Type | Description |
|----------|---------------|-------------|
| `--transparcency` | `<image>` | Gradient used as a background for transparent parts of the swatch. |
| `--transparency-cell-size` | `<length>` | The size of the cells of the transparency gradient. |
| `--transparcency-background` | `<color>` | The background color of the transparency gradient. |
| `--transparency-darkness` | `<percentage>` | The opacity of the black color used for dark parts of the transparency gradient. |

### Events

| Name | Description |
|------|-------------|
| `valuechange` | Fired when the value changes for any reason, and once during initialization. |
| `colorchange` | Fired when the color changes for any reason, and once during initialization. |
| `gamutchange` | Fired when the gamut changes for any reason, and once during initialization. |