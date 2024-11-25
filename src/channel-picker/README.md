# `<channel-picker>`

## Usage

### Basic usage

```html
<channel-picker value="oklab.a"></channel-picker>
```

If no color channel is provided (via the `value` attribute/property), the
default `oklch.l` will be used:

```html
<channel-picker></channel-picker>
```

You can hide the `color-space` part with CSS to show only the coordinates of the
specified space:

```html
<channel-picker id="picker" value="hsl.h"></channel-picker>

<style>
	#picker::part(color-space) {
		display: none;
	}
</style>
```

### Events

You can listen to the `valuechange` event to get the current value (the `value`
property). When a new color space is selected, the channel will be either
preserved (if it is in the new space) or reset to the first available one:

```html
<channel-picker
	onvaluechange="this.nextElementSibling.textContent = this.value"
></channel-picker>
<output></output>
```

### Dynamic

All properties are reactive and can be set programmatically:

```html
<button onclick="this.nextElementSibling.value = 'p3.b'">
	Switch to P3 Blue
</button>
<channel-picker></channel-picker>
```

`<channel-picker>` plays nicely with other color elements, like
[`<channel-slider>`](../channel-slider):

```html
<channel-picker id="channel_picker" value="oklch.c"></channel-picker>
<channel-slider id="channel_slider" color="oklch(50% 50% 180)"></channel-slider>

<style>
	#channel_picker::part(color-space) {
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
| --------- | -------- | ------------- | ------------- | -------------------------------- |
| `value`   | `value`  | `string`      | `oklch.l`     | The current value of the picker. |

### Getters

These properties are read-only.

| Property          | Type         | Description                                                         |
| ----------------- | ------------ | ------------------------------------------------------------------- |
| `selectedSpace`   | `ColorSpace` | Color space object corresponding to the space picker current value. |
| `selectedChannel` | `object`     | The current channel metadata.                                       |

### Events

| Name          | Description                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| `input`       | Fired when the color space or channel changes due to user action.            |
| `change`      | Fired when the color space or channel changes due to user action.            |
| `valuechange` | Fired when the value changes for any reason, and once during initialization. |

### Parts

| Name               | Description                                                              |
| ------------------ | ------------------------------------------------------------------------ |
| `wrapper`          | The component's wrapper element.                                         |
| `color-space`      | The internal [`<space-picker>`](../space-picker/) element.               |
| `color-space-base` | The internal `<select>` element of [`<space-picker>`](../space-picker/). |
| `channels`         | The container that wraps the current color space channels.               |
