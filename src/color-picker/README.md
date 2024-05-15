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



## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `space` | `ColorSpace` &#124; `string` | `oklch` | The color space to use for interpolation. |
| `color` | `color` | `Color` &#124; `string` | `oklch(50 50% 180)` | The current color value. |

## To-Do

- Alpha