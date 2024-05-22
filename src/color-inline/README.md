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
| (default) | The element's main content—the color to be shown. Placed next to the color swatch. |

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `color` | `color` | `Color` &#124; `null` | - | The current color value. `null` for invalid colors. |
| `value` | `value` | `string` &#124; `undefined` | - | The current value. `undefined` if the `value` attribute is not set. |


### CSS variables

| Variable | Type | Description |
|----------|---------------|-------------|
| `--transparency-grid` | `<image>` | Gradient used as a background for transparent parts of the swatch. |
| `--transparency-tile-size` | `<length>` | The size of the tiles in the transparency grid. |
| `--border-width` | `<length>` | The width of the border around the swatch. |
| `--box-shadow-blur` | `<length>` | The blur radius of the box shadow around the swatch. |
| `--box-shadow-color` | `<color>` | The color of the box shadow around the swatch. |
| `--color-image` | `<image>` | The image used to render the swatch. Will override the image that depends on the actual color, so you should rarely use this directly. |

### Parts

| Name | Description |
|------|-------------|
| `swatch-wrapper` | The component’s base wrapper. |
| `swatch` | An internal element used to provide a visual preview of the current color. |