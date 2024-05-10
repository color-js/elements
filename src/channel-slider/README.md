# `<channel-slider>`

A [`<color-slider>`](../color-slider) for a specific channel, intended for color picking.

## Usage

This is a higher level component than `<color-slider>` for the cases where you want to control a single channel of a color space.
It offers many conveniences for these cases:
- It takes care of applying the right `min` and `max` values to the slider
- It automatically generates the start and end colors,
- It can provide an editable tooltip as a tooltip that both shows and edits the current value
- Already includes a suitable label

### Static

Basic example:

```html
<channel-slider space="oklch" channel="h"></channel-slider>
```

In most cases you’d also want to set a color to set the other channels and the initial value:

```html
<channel-slider space="oklch" channel="h" color="oklch(80% 20% 130)"></channel-slider>
```

This will automatically use the whole reference range of that component in the specified color space,
and use the current value of the component as the starting value (unless `value` is also specified).

---

The color does not actually need to be in the same color space, it will be converted if needed:

```html
<channel-slider space="oklch" channel="h" color="deeppink"></channel-slider>
```

Colors and color spaces not supported by the browser also work:

```html
<color-slider space="okhsl" channel="h" color="color(--okhsl 180 100% 50%)"></color-slider>
```


If you don’t want to show the whole range you can also specify `min` and `max` attributes.

```html
<channel-slider space="oklch" channel="l" color="red" min=".3" max=".95"></channel-slider>
```

### Dynamic

You can listen to the `colorchange` event and grab the `color` property to get the current color value.
Here we are using a [`<color-swatch>`](../color-swatch/) to not just display the CSS code but also the actual color:

```html
<channel-slider space="oklch" channel="h" color="oklch(50% 50% 180)"
                oncolorchange="this.nextElementSibling.textContent = this.color"></channel-slider>
<color-swatch></color-swatch>
```

All attributes are reactive:

```html
<label>
    Space:
    <select size=3 onchange="
              dynamic_slider.space = this.value;
              channel_select.innerHTML = Object.keys(dynamic_slider.space.coords).map(c => `<option>${c}</option>`).join('\n')">
        <option>oklch</option>
        <option>oklab</option>
        <option>okhsl</option>
        <option>lab</option>
        <option>lch</option>
        <option>hsl</option>
        <option>srgb</option>
    </select>
</label>
<label>
    Channel:
    <select id="channel_select" size=3 onchange="dynamic_slider.channel = this.value">
        <option>l</option>
        <option>c</option>
        <option>h</option>
    </select>
</label>

<channel-slider id="dynamic_slider" space="oklch" channel="h" color="oklch(50% 50% 180)"
                oncolorchange="this.nextElementSibling.textContent = this.color"></channel-slider>
<color-swatch></color-swatch>
```


## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `space` | `ColorSpace` &#124; `string` | `oklch` | The color space to use for interpolation. |
| `channel` | `channel` | `string` | `h` | The component to use for the gradient. |
| `min` | `min` | `number` | `this.refRange[0]` | The minimum value for the slider. |
| `max` | `max` | `number` | `this.refRange[1]` | The maximum value for the slider. |
| `value` | `value` | `number` | `(this.min + this.max) / 2` | The current value of the slider. |
| `color` | `color` | `Color` &#124; `string` | `oklch(50 50% 180)` | The current color value. |
| - | `minColor` | `Color` | `oklch(0 50% 180)` | The minimum color value _(read-only)_. |
| - | `maxColor` | `Color` | `oklch(100 50% 180)` | The maximum color value _(read-only)_. |