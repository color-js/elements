# `<channel-slider>`

A [`<color-slider>`](../color-slider) for a specific channel, intended for color picking.

## Usage

This is a higher level component than `<color-slider>` for the cases where you want to control a single channel of a color space.
It offers many conveniences for these cases:
- It takes care of applying the right `min` and `max` values to the slider
- It automatically generates the start and end colors,
- It can provide an editable tooltip as a tooltip that both shows and edits the current value

Example:

```html
<color-slider space="oklch" channel="h" color="oklch(50 50% 180)"></color-slider>
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

All attributes from [`<color-slider>`](../color-slider) are available, plus the following:

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `channel` | `channel` | `string` | `h` | The component to use for the gradient. |
| `min` | `min` | `number` | `0` | The minimum value for the slider. |
| `max` | `max` | `number` | `1` | The maximum value for the slider. |
| `value` | `value` | `number` | `0` | The current value of the slider. |
| `color` | `color` | `Color` %7C `string` | `oklch(50 50% 180)` | The current color value. |
| `mincolor` | `minColor` | `Color` &#124; `string` | `oklch(0 50% 180)` | The minimum color value. |
| `maxcolor` | `maxColor` | `Color` &#124; `string` | `oklch(100 50% 180)` | The maximum color value. |