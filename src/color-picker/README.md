# `<color-picker>`

## Usage

### Basic usage

```html
<color-picker space="oklch" color="oklch(60% 30% 180)"></color-picker>
```

Color spaces not supported by the browser also work:

```html
<color-picker space="okhsl" color="color(--okhsl 180 50% 50%)"></color-picker>
```

### Slots

```html
<color-picker space="oklch" color="oklch(50% 50% 180)">
	Element content goes into the swatch
</color-picker>
```

You can use your component instead of the default color swatch:

```html
<color-picker space="oklch" color="oklch(50% 50% 180)"
              oncolorchange="this.firstElementChild.textContent = this.color">
	<color-inline slot="swatch" style="place-self: center; min-inline-size: fit-content"></color-inline>
</color-picker>
```

### Events

As with other components, you can listen to the `colorchange` event:

```html
<color-picker space="oklch" color="oklch(50% 50% 180)"
              oncolorchange="this.firstElementChild.textContent = this.color.oklch.join(' ')">
	<div class="coords"></div>
</color-picker>
```

### Dynamic

All attributes are reactive:

```html
<label>
	Space:
	<select id="space_select" size="3"></select>
</label>

<color-picker id="dynamic_picker" space="oklch" color="oklch(60% 30% 180)"></color-picker>

<script type="module">
	import Color from "https://colorjs.io/dist/color.js";

	space_select.innerHTML = Object.entries(Color.spaces)
		.map(([id, space]) => `<option value="${id}">${space.name}</option>`)
		.join('\n');

	space_select.value = "oklch";

	space_select.oninput = () => dynamic_picker.space = space_select.value;
</script>
```

## Reference

### Slots

| Name | Description |
|------|-------------|
| (default) | The color picker's main content. Goes into the swatch. |
| `swatch` | An element used to provide a visual preview of the current color. |

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `space` | `ColorSpace` &#124; `string` | `oklch` | The color space to use for interpolation. |
| `color` | `color` | `Color` &#124; `string` | `oklch(50% 50% 180)` | The current color value. |

### Events

| Name | Description |
|------|-------------|
| `input` | Fired when the color changes due to user action, either with the sliders or the color swatch's input field. |
| `change` | Fired when the color changes due to user action, either with the sliders or the color swatch's input field. |
| `colorchange` | Fired when the color changes for any reason, and once during initialization. |

### CSS variables

The styling of `<color-picker>` is fully customizable via CSS variables provided by the [`<color-slider>`](../color-slider/#css-variables) and [`<color-swatch>`](../color-swatch/#css-variables).

### Parts

| Name | Description |
|------|-------------|
| `swatch` | The default `<color-swatch>` element, used if the `swatch` slot has no slotted elements. |

## Planned features

- Alpha