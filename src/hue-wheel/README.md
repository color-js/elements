---
layout: component
---

# `<hue-wheel>`

A polar color wheel: hue around the circle, and (optionally) a second channel along the radius.
Works in **any** polar color space: nothing is hardcoded, everything is derived from the space's metadata.

Basic use (just hue, rendered as a ring):

```html
<hue-wheel space="oklch"></hue-wheel>
```

Add a radial axis with `channel` (here, chroma) and a starting `color`:

```html
<hue-wheel space="oklch" channel="c" color="oklch(0.7 0.15 200)"></hue-wheel>
```

Any polar space works:

```html
<hue-wheel space="hsl" channel="s" color="hsl(200 80% 50%)"></hue-wheel>
```

Click or drag to set the color (or to add one if none is present); once the marker is focused, arrow keys nudge it (←→ hue, ↑↓ channel). Use `readonly` to display without editing:

```html
<hue-wheel space="lch" channel="c" color="lch(60 50 120)" readonly></hue-wheel>
```

## Extra points

Slot `<color-swatch>` or `<color-scale>` elements to plot additional (non-editable) points, positioned by their own hue and channel. Hovering a point reveals its details as a tooltip.

```html
<hue-wheel space="oklch" channel="c" color="oklch(0.7 0.15 200)">
	<color-scale space="oklch"
		colors="oklch(0.6 0.2 20), oklch(0.7 0.25 140), oklch(0.5 0.18 300)"></color-scale>
	<color-swatch>oklch(0.8 0.1 90)</color-swatch>
</hue-wheel>
```

## Notes

- `space` must be **polar** (have a hue/angle coordinate); it throws otherwise.
- The marker color, the painted field, and the radial axis are all expressed in `space`. `color` is always returned in `space`.
- For color spaces the browser can't interpolate gradients in, the hue field is tessellated and interpolated in `oklch`, so the wheel still renders smoothly.

## Reference

### Slots

| Name | Description |
|------|-------------|
| _(default)_ | Overlay content rendered on top of the wheel (used to build `<gamut-wheel>`). Slotted `<color-swatch>` / `<color-scale>` elements are also plotted as extra points. |

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `space` | `spaceId` / `space` | `string` / `ColorSpace` | `oklch` | The polar color space of the wheel. The attribute and the `space` property accept a space id or `ColorSpace`; the `spaceId` property is always the id string. Throws if the space is not polar. |
| `channel` | `channel` | `string` &#124; `null` | `null` | Coordinate shown on the radial axis. When omitted, the wheel shows only hue (as a ring). |
| `color` | `color` | `Color` &#124; `null` | `null` | The current color (always in `space`). `null` when no color is set. |
| - | `hueValue` | `number` | - | The current hue value. Read/write. |
| - | `channelValue` | `number` &#124; `undefined` | - | The current channel value, if `channel` is set. Read/write. |
| `readonly` | `readonly` | `boolean` | `false` | When set, the color cannot be added or edited. |

### Events

| Name | Description |
|------|-------------|
| `input` | Fired continuously while the color is being changed (drag, click, arrow keys). |
| `change` | Fired when a change is committed (pointer release, or each arrow keypress). |
| `colorchange` | Fired whenever the `color` property changes, for any reason. |

### CSS variables

| Variable | Type | Description |
|----------|------|-------------|
| `--size` | `<length>` | The diameter of the wheel. Defaults to `320px`. |
| `--ring-thickness` | `<number>` | In ring mode (no `channel`), the ring's thickness as a fraction of the radius. Defaults to `0.35`. |
| `--point-size` | `<length>` | The diameter of the extra points. Defaults to `0.7em`. |

### Parts

| Name | Description |
|------|-------------|
| `wheel` | The circular wheel container. |
| `disc` | The painted hue/channel field. |
| `marker` | The draggable marker showing the current color. |
