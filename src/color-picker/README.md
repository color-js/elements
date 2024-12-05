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

If no color space or color is provided, the default ones will be used: `oklch` for the space and `oklch(50% 50% 180)` for the color.

```html
<color-picker></color-picker>
```

### The `alpha` attribute

Colors with the alpha channel are also supported. Add the `alpha` boolean attribute to show the alpha channel:

```html
<color-picker space="oklch" color="oklch(60% 30% 180 / 0.6)" alpha></color-picker>
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

or your own form element instead of the default space picker:

```html
<color-picker space="oklab" color="oklab(60% -0.12 0)">
	<select slot="color-space" size="4">
		<optgroup label="Rectangular Spaces">
			<option value="lab">Lab</option>
			<option value="oklab" selected>Oklab</option>
			<option value="prophoto">ProPhoto</option>
		</optgroup>
	</select>
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
<color-picker space="oklch" color="oklch(60% 30% 180)" id="dynamic_picker">
	<fieldset slot="color-space">
		<legend>Polar Spaces</legend>

		<label>
			<input type="radio" name="space" value="oklch" checked /> OKLCh
		</label>
		<label>
			<input type="radio" name="space" value="hwb" /> HWB
		</label>
		<label>
			<input type="radio" name="space" value="hsl" /> HSL
		</label>
	</fieldset>
</color-picker>

<script>
	let radios = dynamic_picker.querySelectorAll("input[name=space]");
	radios.forEach(radio => radio.addEventListener("change", evt => dynamic_picker.spaceId = evt.target.value));
</script>

<style>
	label + label {
		margin-inline-start: .3em;
	}
</style>
```

```html
<label>
	<input type="checkbox" onchange="this.parentElement.nextElementSibling.alpha = this.checked" /> Alpha channel
</label>
<color-picker></color-picker>
```

## Reference

### Slots

| Name | Description |
|------|-------------|
| (default) | The color picker's main content. Goes into the swatch. |
| `color-space` | An element to display (and if writable, also set) the current color space. If not provided, a [`<space-picker>`](../space-picker/) is used. |
| `swatch` | An element used to provide a visual preview of the current color. |

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `spaceId` | `string` | `oklch` | The color space to use for interpolation. |
| – | `space` | `ColorSpace` | `OKLCh` | Color space object corresponding to the `space` attribute. |
| `color` | `color` | `Color` &#124; `string` | `oklch(50% 50% 180)` | The current color value. |
| `alpha` | `alpha` | `boolean` &#124; `undefined` | `undefined` | Whether to show the alpha channel slider or not. |

### Events

| Name | Description |
|------|-------------|
| `input` | Fired when the color changes due to user action, such as adjusting the sliders, entering a color in the swatch's text field, or choosing a different color space. |
| `change` | Fired when the color changes due to user action, such as adjusting the sliders, entering a color in the swatch's text field, or choosing a different color space. |
| `colorchange` | Fired when the color changes for any reason, and once during initialization. |

### CSS variables

The styling of `<color-picker>` is fully customizable via CSS variables provided by the [`<color-slider>`](../color-slider/#css-variables) and [`<color-swatch>`](../color-swatch/#css-variables).

### Parts

| Name | Description |
|------|-------------|
| `color-space` | The default [`<space-picker>`](../space-picker/) element, used if the `color-space` slot has no slotted elements. |
| `color-space-base` | The internal `<select>` element of the default [`<space-picker>`](../space-picker/) element. |
| `swatch` | The default [`<color-swatch>`](../color-swatch/) element, used if the `swatch` slot has no slotted elements. |
