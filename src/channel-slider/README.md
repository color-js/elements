# `<channel-slider>`

A [`<color-slider>`](../color-slider) for a specific channel, intended for color picking.

## Usage

This is a higher level component than `<color-slider>` for the cases where you want to control a single channel of a color space.
It offers many conveniences for these cases:
- It takes care of applying the right `min` and `max` values to the slider
- It automatically generates the start and end colors
- It can provide an editable tooltip as a tooltip that both shows and edits the current value
- Already includes a suitable label

Basic example:

```html
<channel-slider space="oklch" channel="h"></channel-slider>
```

In most cases you’d also want to set a color to set the other channels and the initial value:

```html
<channel-slider space="oklch" channel="h" color="oklch(80% 20% 130)"></channel-slider>
```

You can listen to the `input` event and grab the `color` property to get the current color value.
Here we are using a [`<color-swatch>`](../color-swatch/) to not just display the CSS code but also the actual color:

```html
<channel-slider space="oklch" channel="h" color="oklch(50% 50% 180)"
                oninput="this.nextElementSibling.textContent = this.color"></channel-slider>
<color-swatch></color-swatch>
```

This will automatically use the whole reference range of that component in the specified color space,
and use the current value of the component as the starting value (unless `value` is also specified).
If you don’t want to show the whole range you can also specify `min` and `max` attributes.
<!--
```html
<color-slider space="oklch" channel="l" colorvalue="red" min=".3" max=".95"></color-slider>
```
-->


## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `space` | `ColorSpace` &#124; `string` | `oklch` | The color space to use for interpolation. |
| `channel` | `channel` | `string` | `h` | The component to use for the gradient. |
| `min` | `min` | `number` | `this.refRange[0]` | The minimum value for the slider. |
| `max` | `max` | `number` | `this.refRange[1]` | The maximum value for the slider. |
| `step` | `step` | `number` | `(this.max - this.min) / 1000` &#124; `1` | The granularity that the slider's current value must adhere to. |
| `value` | `value` | `number` | `(this.min + this.max) / 2` | The current value of the slider. |
| `color` | `color` | `Color` &#124; `string` | `oklch(50 50% 180)` | The current color value. |
| - | `minColor` | `Color` | `oklch(0 50% 180)` | The minimum color value _(read-only)_. |
| - | `maxColor` | `Color` | `oklch(100 50% 180)` | The maximum color value _(read-only)_. |