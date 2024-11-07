# `<channel-picker>`

## Usage

### Basic usage

```html
<channel-picker value="oklab.a"></channel-picker>
```

If no color channel is provided (via the `value` attribute/property),
the default `oklch.l` will be used:

```html
<channel-picker></channel-picker>
```

You can hide the `space_picker` part with CSS to show only the coordinates of the specified space:

```html
<channel-picker id="picker" value="hsl.h"></channel-picker>

<style>
	#picker::part(space_picker) {
		display: none;
	}
</style>
```

### Events

You can listen to the `valuechange` event to get the current value (the `value` property). When a new color space is selected,
the channel will be either preserved (if it is in the new space) or reset to the first available one:

```html
<channel-picker onvaluechange="this.nextElementSibling.textContent = this.value"></channel-picker>
<output></output>
```

### Dynamic

All properties are reactive and can be set programmatically:

```html
<button onclick="this.nextElementSibling.value = 'p3.b'">Switch to P3 Blue</button>
<channel-picker></channel-picker>
```

`<channel-picker>` plays nicely with other color elements, like [`<color-chart>`](../color-chart):

```html
<label>Coord:
	<channel-picker onvaluechange="this.parentNode.nextElementSibling.y = this.value"></channel-picker>
</label>
<color-chart>
	<color-scale colors="Red 50: #fef2f2, Red 100: #fee2e2, Red 200: #fecaca, Red 300: #fca5a5, Red 400: #f87171, Red 500: #ef4444, Red 600: #dc2626, Red 700: #b91c1c, Red 800: #991b1b, Red 900: #7f1d1d, Red 950: #450a0a"></color-scale>
	<color-scale colors="Orange 50: #fff7ed, Orange 100: #ffedd5, Orange 200: #fed7aa, Orange 300: #fdba74, Orange 400: #fb923c, Orange 500: #f97316, Orange 600: #ea580c, Orange 700: #c2410c, Orange 800: #9a3412, Orange 900: #7c2d12, Orange 950: #431407"></color-scale>
	<color-scale colors="Yellow 50: #fefce8, Yellow 100: #fef9c3, Yellow 200: #fef08a, Yellow 300: #fde047, Yellow 400: #facc15, Yellow 500: #eab308, Yellow 600: #ca8a04, Yellow 700: #a16207, Yellow 800: #854d0e, Yellow 900: #713f12, Yellow 950: #422006"></color-scale>
</color-chart>
```

or [`<channel-slider>`](../channel-slider):

```html
<channel-picker id="channel_picker" value="oklch.c"></channel-picker>
<channel-slider id="channel_slider" color="oklch(50% 50% 180)"></channel-slider>

<style>
	#channel_picker::part(space_picker) {
		display: none;
	}
</style>

<script>
	function updateSlider() {
		let [space, channel] = channel_picker.value.split(".");
		channel_slider.space = space;
		channel_slider.channel = channel;
	}
	
	channel_picker.onvaluechange = updateSlider;
</script>
```

## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description                      |
|-----------|----------|---------------|---------------|----------------------------------|
| `value`   | `value`  | `string`      | `oklch.l`     | The current value of the picker. |

### Getters

These properties are read-only.

| Property | Type | Description |
|----------|------|-------------|
| `selectedSpace` | `ColorSpace` | Color space object corresponding to the space picker current value. |
| `selectedChannel` | `object` | The current channel metadata.|

### Events

| Name            | Description                                                                    |
|-----------------|--------------------------------------------------------------------------------|
| `input`         | Fired when the color space or channel changes due to user action.              |
| `change`        | Fired when the color space or channel changes due to user action.              |
| `valuechange`   | Fired when the value changes for any reason, and once during initialization.   |

### Parts

| Name           | Description                                          |
|----------------|------------------------------------------------------|
| `space_picker` | The internal `<space-picker>` element.               |
| `space_select` | The internal `<select>` element of `<space-picker>`. |
| `picker`       | The internal `<select>` element.                     |
