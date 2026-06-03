# `<color-slider>`

Creates a slider with a gradient background, primarily intended for color picking.

## Usage

There are many ways to use this component, depending on what you need.
E.g. if all you need is styling sliders with arbitrary gradients you don’t even need a component,
you can just [use the CSS file](#css-only-usage) and a few classes and CSS variables to style regular HTML sliders.

The actual component does a lot more:
- It provides a `color` property with the actual color value
- It takes care of even displaying colors in unsupported color spaces
- Editable tooltip showing the current value or progress _(optional)_
- Convenient events like `colorchange` and `valuechange` that fire even when the value changes programmatically

Basic example:

```html
<color-slider space="hsl"
              stops="oklch(90% 50% 100), darkcyan, indigo"></color-slider>
```

You can listen to the `colorchange` event and grab the `color` property to get the current color value:

```html
<color-slider space="hsl"
              stops="red, yellow, lime, aqua, blue, magenta, red"
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<output></output>
```

In fact, you can combine it with a [`<color-inline>`](../color-inline/) or [`<color-swatch>`](../color-swatch/) element to display the color in a more visual way:

```html
<color-slider space="oklch"
              stops="oklch(80% 50% 70), oklch(65% 50% 180)"
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

Colors and color spaces not supported by the browser also work:

```html
<color-slider space="okhsl" stops="gold, color(--okhsl 180 100% 50%)"></color-slider>
```

You can set the `value` attribute to specify an initial color other than the midpoint:

```html
<color-slider space="oklch"
              stops="oklch(85% 50% 80), oklch(65% 50% 180)"
			  value="0.1"
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

You can use a different min and max value and it’s just linearly mapped to the stops:

```html
<color-slider space="oklch"
              stops="oklch(85% 50% 80), oklch(65% 50% 180)"
			  min="-50" max="50" value="20"
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

You can add an editable tooltip by simply using the `tooltip` attribute:

```html
<color-slider space="oklch"
              stops="oklch(85% 50% 80), oklch(65% 50% 180)"
			  min="-50" max="50" value="20"
              tooltip
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

By default, the tooltip will show the slider value as a number.
If you want to show the progress instead, you can specify `"progress"` as the attribute value:

```html
<color-slider space="oklch"
              stops="oklch(85% 50% 80), oklch(65% 50% 180)"
			  min="-50" max="50" value="20"
              tooltip="progress"
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

Set a `gamut` to mark the colors the gamut can't reproduce: out-of-gamut portions of the band are overlaid with gray. This is handy for showing which colors of a wide-gamut space are actually reachable in, say, sRGB:

```html
<color-slider space="oklch"
              stops="oklch(65% 0.2 0), oklch(65% 0.2 120), oklch(65% 0.2 240), oklch(65% 0.2 360)"
              gamut="srgb"
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

The overlay color is customizable via `--oog-color` — use a translucent color to dim rather than hide the out-of-gamut colors:

```html
<color-slider space="oklch"
              stops="oklch(65% 0.2 0), oklch(65% 0.2 120), oklch(65% 0.2 240), oklch(65% 0.2 360)"
              gamut="srgb"
              style="--oog-color: oklch(50% 0 0 / 0.6)"></color-slider>
```

All properties are reactive and can be set programmatically:

```html
<button onclick="this.nextElementSibling.value = Math.random()">Random color</button>
<color-slider space="oklch"
              stops="gold, darkcyan, indigo"
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<color-swatch></color-swatch>
```

You can style it to look quite different:

```html
<style>
.lr-slider {
    --slider-height: .3em;
    --slider-thumb-width: 1em;
    --slider-thumb-height: 1em;
    --slider-thumb-radius: 1em;
    --slider-thumb-border: 3px solid oklab(50% 0 0);
}
</style>
<color-slider class="lr-slider" space="oklch"
              stops="yellowgreen, gold, red"></color-slider>
```


### CSS-only usage

If you just want the styling of `<color-slider>` and not any of the API (or are fine dealing with the lower level details on your own),
you *can* just use the CSS file.

If using a local-first dependency manager (e.g. [Nudeps](https://nudeps.dev)), you can import the CSS file using a plain local URL:

```css
@import "/client_modules/color-elements/color-slider.css";
```

Or with a bundler that supports CSS imports:

```css
@import "color-elements/color-slider.css";
```

Otherwise, use a CDN:

```css
@import url("https://esm.sh/color-elements/color-slider.css");
```

This is perfect for when the gradient is more of a visual aid than a functional part of your UI,
e.g. when picking a temperature:

```html
<style>
    @import url("color-slider.css");
</style>
<label>
    Temperature:
    <input type="range" class="color-slider" min="-20" max="50" value="15"
           style="--slider-color-stops: oklch(65% 0.1 250), yellowgreen, gold, orange, red, darkred" />
</label>
```

Then use a `color-slider` class on your slider element, and use [CSS variables](#css-variables) to set the gradient (either directly via `--slider-gradient` or generated via `--slider-color-stops` + `--color-space`).

## Reference

### Slots

| Name | Description |
|------|-------------|
| _(default)_ | Content placed after the color slider. |
| `tooltip` | An element used as a tooltip. |

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `space` | `ColorSpace` &#124; `string` | `oklch` | The color space to use for interpolation. |
| `color` | `color` | `Color` &#124; `string` | `oklch(50% 50% 180)` | The current color value. |
| `stops` | `stops` | `String` &#124; `Array<Color>` | - | Comma-separated list of color stops. |
| `gamut` | `gamut` | `string` | `""` | A color gamut id (`srgb`, `p3`, `rec2020`), or `auto` to follow the display's gamut (detected via the `color-gamut` media query, and updated if the display changes). When set, the portions of the band whose color falls outside this gamut are overlaid with [`--oog-color`](#css-variables), with a hard edge at each gamut boundary. Empty or `none` disables it. |
| `min` | `min` | `number` | 0 | The minimum value for the slider. |
| `max` | `max` | `number` | 1 | The maximum value for the slider. |
| `step` | `step` | `number` | Computed automatically based on `this.min` and `this.max`. | The granularity that the slider's current value must adhere to. |
| `value` | `value` | `number` | `(this.min + this.max) / 2` | The current value of the slider. |

### CSS variables

If you’re using the component, these are mostly set automatically.
If you’re only using the CSS file, you should set these yourself.

| Variable | Type | Description |
|----------|---------------|-------------|
| `--slider-color-stops` | `<color>#` | Comma-separated list of color stops. |
| `--color-space` | `<ident>` | The color space to use for interpolation. |
| `--hue-interpolation` | `[shorter` &#124; `longer` &#124; `increasing` &#124; `decreasing] hue` | The hue interpolation method to use. |
| `--transparency-grid` | `<image>` | Gradient used as a background for transparent parts of the slider. |
| `--transparency-cell-size` | `<length>` | The size of the cells of the transparency gradient. |
| `--transparcency-background` | `<color>` | The background color of the transparency gradient. |
| `--transparency-darkness` | `<percentage>` | The opacity of the black color used for dark parts of the transparency gradient. |
| `--slider-gradient` | `<image>` | The gradient to use as the background. |
| `--slider-height` | `<length>` | Height of the slider track. |
| `--slider-thumb-width` | `<length>` | Width of the slider thumb. |
| `--slider-thumb-height` | `<length>` | Height of the slider thumb. |
| `--slider-thumb-height-offset` | `<length>` | Offset the thumb height from the track height. |
| `--slider-thumb-radius` | `<length>` | Radius of the slider thumb. |
| `--slider-thumb-background` | `<color>` | Background color of the slider thumb. |
| `--slider-thumb-border` | `<line-width>` &#124;&#124; `<line-style>` &#124;&#124; `<color>` | Border of the slider thumb. |
| `--slider-thumb-border-active` | `<line-width>` &#124;&#124; `<line-style>` &#124;&#124; `<color>` | Border of the slider thumb in active state. |
| `--slider-thumb-scale-active` | `<number>` | Scale transform applied to the slider thumb in active state. |
| `--oog-color` | `<color>` | Color overlaid on the out-of-[`gamut`](#attributes--properties) parts of the band. Defaults to a light/dark-adaptive neutral gray. |
| `--tooltip-background` | `<color>` | Background color of the tooltip. |
| `--tooltip-border-radius` | `<length>` | Border radius of the tooltip. |
| `--tooltip-pointer-height` | `<length>` | Height of the tooltip pointer triangle. |
| `--tooltip-pointer-angle` | `<angle>` | Angle of the tooltip pointer triangle. |

### Getters

These properties are read-only.

| Property | Type | Description |
|----------|------|-------------|
| `progress` | `number` | The slider value converted to a 0-1 number with `0` corresponding to the min of the range and `1` to the max. |
| `inGamut` | `boolean` | Whether the currently selected `color` is inside the target [`gamut`](#attributes--properties). Always `true` when no gamut is set. |
| `oogRanges` | `Array<[number, number]>` | The out-of-[`gamut`](#attributes--properties) ranges of the whole band, as `[start, end]` pairs in 0–1 progress (sorted, merged). Empty when no gamut is set or the band is entirely in gamut. |
| `displayGamut` | `string` | The display's gamut (`srgb`, `p3`, or `rec2020`), detected via the `color-gamut` media query and kept up to date. This is what `gamut="auto"` resolves to. |


### Events

| Name | Description |
|------|-------------|
| `input` | Fired when the color changes due to user action. |
| `change` | Fired when the color changes due to user action. |
| `valuechange` | Fired when the value changes for any reason, and once during initialization. |
| `colorchange` | Fired when the color changes for any reason, and once during initialization. |
| `ingamutchange` | Fired when the current color's in/out-of-gamut status changes, and once during initialization. |

### States

These [custom states](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet) can be targeted via the `:state()` pseudo-class.

| Name | Description |
|------|-------------|
| `in-gamut` | Present while the currently selected `color` is inside the target [`gamut`](#attributes--properties) (and when no gamut is set). |

### Parts

| Name | Description |
|------|-------------|
| `slider` | The internal `<input type="range">` element. |
| `spinner` | The default `tooltip` slot content (an `<input type="number">` element). Please note that if an element is slotted in the `tooltip` slot, this will not match anyhing. |

## Planned features

- Discrete scales & steps
