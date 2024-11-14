# `<space-picker>`

## Usage

### Basic usage

```html
<space-picker value="oklab"></space-picker>
```

If no color space is provided (via the `value` attribute/property),
the first one will be used:

```html
<space-picker></space-picker>
```

You can specify what color spaces to use:
```html
<space-picker spaces="oklch, p3, srgb" value="p3"></space-picker>
```

Unknown color spaces also work:
```html
<space-picker spaces="bar, oklch, p3, srgb, foo" value="foo"></space-picker>
```

### Grouping the color spaces

You can group the color spaces the way you like by specifying the `groupBy` property. Its value is a function
accepting a color space as an argument and returning the name of a group the color space should be added to:

```html
<space-picker id="space_picker" spaces="oklch, p3, srgb" value="p3"></space-picker>
<script>
    space_picker.groupBy = (space) => {
        let isPolar = space.coords.h?.type === "angle";
        return isPolar ? "Polar" : "Rectangular";
    };
</script>
```

### Events

You can listen to the `spacechange` event to get either the id of the current color space (the `value` property)
or the color space object itself (the `selectedSpace` property):

```html
<space-picker onspacechange="this.nextElementSibling.textContent = this.value"></space-picker>
<output></output>
```

### Dynamic

All properties are reactive and can be set programmatically:
```html
<button onclick="this.nextElementSibling.value = 'oklch'">Switch to OKLCh</button>
<space-picker value="p3"></space-picker>
```

`<space-picker>` plays nicely with other color elements:
```html
<label style="display: block; margin-block-end: .5em">
    Space:
    <space-picker value="oklch" oninput="this.parentElement.nextElementSibling.space = this.selectedSpace"></space-picker>
</label>
<color-slider space="oklch"
              stops="oklch(80% 50% 70), oklch(65% 50% 180)"
              oncolorchange="this.nextElementSibling.textContent = this.color"></color-slider>
<color-inline></color-inline>
```

## Reference

### Attributes & Properties

| Attribute | Property  | Property type                       | Default value                           | Description                                                                                               |
|-----------|-----------|-------------------------------------|-----------------------------------------|-----------------------------------------------------------------------------------------------------------|
| `value`   | `value`   | `string`                            | The first color space in `this.spaces`. | The current value of the picker.                                                                          |
| `spaces`  | `spaces`  | `string` &#124; `Array<ColorSpace>` | All known color spaces.                 | Comma-separated list of color spaces to use.                                                              |
| —         | `groupBy` | `Function`                          | —                                       | Function to group the color spaces. Takes a color space object as an argument and returns the group name. |

### Getters

These properties are read-only.

| Property        | Type         | Description                                                                                                                                                                                |
|-----------------|--------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `selectedSpace` | `ColorSpace` | Color space object corresponding to the picker current value.                                                                                                                              |
| `groups`        | `Object`     | Object containing the color spaces grouped by the `groupBy()` function. Keys are group names, values are objects with space ids as keys, and corresponding color space objects are values. |


### Events

| Name          | Description                                                                  |
|---------------|------------------------------------------------------------------------------|
| `input`       | Fired when the space changes due to user action.                             |
| `change`      | Fired when the space changes due to user action.                             |
| `valuechange` | Fired when the value changes for any reason, and once during initialization. |
| `spacechange` | Fired when the space changes for any reason, and once during initialization. |

### Parts

| Name     | Description                      |
|----------|----------------------------------|
| `picker` | The internal `<select>` element. |
