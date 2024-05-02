# `<color-slider>`

Creates a slider with a gradient background, primarily intended for color picking.

## Usage

There are many ways to use this component, depending on what you need.
E.g. if all you need is styling sliders with arbitrary gradients you don’t even need a component,
you can just [use the CSS file](#css-only) and a few classes and CSS variables to style regular HTML sliders.

The actual component does a lot more:
- It provides a `color` property with the actual color value.
- It takes care of displaying even colors in unsupported color spaces

Basic example:

```html
<color-slider space="hsl"
              stops="oklch(90% 50% 100), darkcyan, indigo"></color-slider>
```

You can listen to the `input` event and grab the `color` property to get the current color value:

```html
<color-slider space="hsl"
              stops="red, yellow, lime, aqua, blue, magenta, red"
              oninput="this.nextElementSibling.textContent = this.color"></color-slider>
<output></output>
```

In fact, you can combine it with a [`<color-inline>`](../color-inline/) or [`<css-color>`](../css-color/) element to display the color in a more visual way:

```html
<color-slider space="oklch"
              stops="oklch(80% 50% 70), oklch(65% 50% 180)"
              oninput="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

You can set the `value` attribute to specify an initial color other than the midpoint:

```html
<color-slider space="oklch"
              stops="oklch(85% 50% 80), oklch(65% 50% 180)"
			  value="0.1"
              oninput="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

You can use a different min and max value and it’s just linearly mapped to the stops:

```html
<color-slider space="oklch"
              stops="oklch(85% 50% 80), oklch(65% 50% 180)"
			  min="-50" max="50" value="20"
              oninput="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

You can add an editable tooltip by simply using the `tooltip` attribute:

```html
<color-slider space="oklch"
              stops="oklch(85% 50% 80), oklch(65% 50% 180)"
			  min="-50" max="50" value="20"
              tooltip
              oninput="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

By default, the tooltip will show the slider value as a number.
If you want to show the progress instead, you can specify `"progress"` as the attribute value:

```html
<color-slider space="oklch"
              stops="oklch(85% 50% 80), oklch(65% 50% 180)"
			  min="-50" max="50" value="20"
              tooltip="progress"
              oninput="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

### CSS-only usage

If you just want the styling and are fine dealing with the lower level details on your own, you *can* just use the CSS file:

```css
@import url("https://elements.colorjs.io/src/color-slider/color-slider.css");
```

```html
<style>
    @import url("color-slider.css");
</style>
<input type="range" class="color-slider" style="--slider-color-stops: oklch(85% 50% 180), gold" />
```

Then use a `color-slider` class on your slider element, and use [CSS variables](#css-variables) to set the gradient (either directly via `--gradient` or generated via `--stops` + `--color-space` or `--gradient`).

## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `space` | `ColorSpace` &#124; `string` | `oklch` | The color space to use for interpolation. |
| `color` | `color` | `Color` &#124; `string` | `oklch(50 50% 180)` | The current color value. |
| `stops` | `stops` | `String` &#124; `Array<Color>` | - | Comma-separated list of color stops |
| `min` | `min` | `number` | 0 | The minimum value for the slider. |
| `max` | `max` | `number` | 1 | The maximum value for the slider. |
| `value` | `value` | `number` | `(this.min + this.max) / 2` | The current value of the slider. |

### CSS variables

If you’re using the component, these are mostly set automatically.
If you’re only using the CSS file, you should set these yourself.

| Variable | Type | Description |
|----------|---------------|-------------|
| `--slider-color-stops` | `<color>#` | Comma-separated list of color stops |
| `--color-space` | `<ident>` | The color space to use for interpolation |
| `--hue-interpolation` | `[shorter &#124; longer &#124; increasing &#124; decreasing] hue` | The color space to use for interpolation |
| `--slider-gradient` | `<image>` | The gradient to use as the background |

### Events

| Name | Description |
|------|-------------|
| `input` | Fired when the color changes and once during initialization |

## Planned features

- Discrete scales & steps