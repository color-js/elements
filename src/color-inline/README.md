---
layout: component
css: "style.css"
---

# `<color-inline>`

Basic use:

<html-demo adjust="font-size">

```html
<color-inline>lch(50% 40 30)</color-inline>
```
</html-demo>

You can use `value` to set the color swatch while displaying something else as the content (or even nothing at all):

```html
<color-inline value="lch(50% 40 30)"></color-inline>
```

Editable:
```html
<color-inline contentEditable>lch(50% 40 30)</color-inline>
```

Semi-transparent color:
```html
<color-inline>hsl(340 90% 50% / .25)</color-inline>
```

Invalid color:

```html
<color-inline>foobar</color-inline>
```

## Reference

### Slots

| Name | Description |
|------|-------------|
| _(default)_ | The element's main content—the color to be shown. Placed next to the color swatch. |

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `color` | `color` | `Color` &#124; `null` | - | The current color value. `null` for invalid colors. |
| `value` | `value` | `string` | - | The textual form of the color. Will have a value even if the color is invalid. |


### CSS variables

| Variable | Type | Description |
|----------|---------------|-------------|
| `--transparency-grid` | `<image>` | Gradient used as a background for transparent parts of the swatch. |
| `--transparency-cell-size` | `<length>` | The size of the tiles in the transparency grid. This will not be used if you are overriding `--transparency-grid`. |
| `--transparcency-background` | `<color>` | The background color of the transparency gradient. |
| `--transparency-darkness` | `<percentage>` | The opacity of the black color used for dark parts of the transparency gradient. |
| `--border-width` | `<length>` | The width of the border around the swatch. |
| `--box-shadow-blur` | `<length>` | The blur radius of the box shadow around the swatch. |
| `--box-shadow-color` | `<color>` | The color of the box shadow around the swatch. |

### Parts

| Name | Description |
|------|-------------|
| `swatch-wrapper` | The component’s base wrapper. |
| `swatch` | An internal element used to provide a visual preview of the current color. |