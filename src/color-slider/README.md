# `<color-slider>`

Creates a slider with a gradient background, primarily intended for color picking.

## Usage

There are many ways to use this component, depending on what you need.
E.g. if all you need is styling sliders with arbitrary gradients you don’t even need a component,
you can just use the CSS file and a few classes and CSS variables.

The actual component does a lot more:
- It takes care of applying the right `min` and `max` values to the slider
- It automatically generates the start and end colors,
- It provides a `color` property with the actual color value.
- It can provide an editable tooltip as a tooltip that both shows and edits the current value

<script src="./color-slider.js" type="module"></script>
<style>@import url("style.css");</style>

### Zero hassle, little control

You get the most value out of this component when using it to control a single component:

```html
<color-slider space="oklch" component="h" colorvalue="oklch(50 50% 180)"></color-slider>
```

This will automatically use the whole reference range of that component in the specified color space,
and use the current value of the component as the starting value (unless `value` is also specified).
If you don’t want to show the whole range you can also specify `min` and `max` attributes.

```html
<color-slider space="oklch" component="l" colorvalue="red" min=".3" max=".95"></color-slider>
```

### Minimal hassle, more control

If your use case does not involve interpolating across a single component, or you already have the colors you want to plot from and to, you can also do that:

```html
<color-slider space="oklch" colormin="gold" colormax="oklch(65% 0.15 210)"></color-slider>
```

### Styling-only usage

If you just want the styling and are fine dealing with the lower level details on your own, you *can* just use the CSS file:

```css
@import url("https://colorjs.io/elements/color-slider/style.css");
```

Then use a `color-slider` class on your slider element, and the following CSS variables:

- `--start-color`: the start color of the gradient
- `--end-color`: the end color of the gradient
- `--color-space`: the color space of the gradient (default: `oklch`)
- `--intermediate-colors`: _(optional)_ any intermediate colors.

OR:
- `--gradient` if you want to override the whole gradient.


