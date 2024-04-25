# `<color-slider>`

Creates a slider with a gradient background, primarily intended for color picking.

## Usage

There are many ways to use this component, depending on what you need.
E.g. if all you need is styling sliders with arbitrary gradients you don’t even need a component,
you can just use the CSS file and a few classes and CSS variables.

The actual component does a lot more:
- It provides a `color` property with the actual color value.
- It can provide an editable tooltip as a tooltip that both shows and edits the current value

Basic example:

```html
<color-slider space="hsl"
              stops="red, yellow, lime, aqua, blue, magenta, red"
              oninput="this.nextElementSibling.textContent = this.color"></color-slider>
<output></output>
```

In fact, you can combine it with a [`<color-swatch>`](../color-swatch/):

```html
<color-slider space="hsl"
              stops="red, yellow, lime, aqua, blue, magenta, red"
              oninput="this.nextElementSibling.textContent = this.color"></color-slider>
<color-swatch></color-swatch>
```

### Styling-only usage

If you just want the styling and are fine dealing with the lower level details on your own, you *can* just use the CSS file:

```css
@import url("https://colorjs.io/elements/color-slider/color-slider.css");
```

Then use a `color-slider` class on your slider element, and the following CSS variables:

- `--stops`: the start color of the gradient
- `--color-space`: the color space of the gradient (default: `oklch`)

OR:
- `--gradient` if you want to override the whole gradient.


## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `space` | `ColorSpace` &#124; `string` | `oklch` | The color space to use for interpolation. |
| `color` | `color` | `Color` &#124; `string` | `oklch(50 50% 180)` | The current color value. |
| `stops` | `stops` | `String` &#124; `Array<Color>` | `oklch(0 50% 180)` | Comma-separated list of color stops |

## Planned features

- Discrete scales & steps