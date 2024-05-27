<script src="gamut-badge.js" type="module"></script>
# &lt;gamut-badge>

Gamut indicator. Used internally by `<color-swatch>`

## Usage

Static (only read once):
```html
<gamut-badge color="red"></gamut-badge>
```

Invalid color:
```html
<gamut-badge color="poop"></gamut-badge>
```
Missing color:
```html
<gamut-badge></gamut-badge>
```

Dynamic:
```html
<gamut-badge id="cg_1" color="red"></gamut-badge>
<script>cg_1.color = "oklch(50% 0.5 180)";</script>
```

## Demo
<style>
	#params {
		background: linear-gradient(to right, var(--start-color), var(--end-color)) no-repeat top / 100% 1em;
		padding-top: 1.5em;
	}

	#colors_container_h {
		display: flex;
		height: 1em;
		margin-bottom: 1em;

		gamut-badge {
			flex: 1;
			border-radius: 0;

			&::part(label) {
				display: none;
			}
		}
	}
</style>
<form id=params>
<code>oklch(<input type=number id=l value=50>% <input type=number id=min_c value=30>&ndash;<input type=number id=max_c value=40>% <input type=number id=h value=50>)</code>
<p><label>Chroma increments: <input type=number id=c_step value="0.2" min="0">%</label>
</form>

<script type=module>
params.addEventListener("input", e => {
	let c_range = {min: Number(min_c.value), max: Number(max_c.value)};
	let step = Number(c_step.value);
	if (step <= 0) {
		step = 1;
	}
	let colors = [];
	let start = `oklch(${l.value}% ${c_range.min.toLocaleString("en")}% ${h.value})`;
	let end = `oklch(${l.value}% ${c_range.max.toLocaleString("en")}% ${h.value})`;

	params.style.setProperty("--start-color", start);
	params.style.setProperty("--end-color", end);

	for (let c = c_range.min; c<= c_range.max; c+=step) {
		colors.push(`oklch(${l.value}% ${c.toLocaleString("en")}% ${h.value})`);
	}

	let html = colors.map(color => `
		<gamut-badge title="${color}" color="${color}"></gamut-badge>`).join("\n");
	colors_container_h.innerHTML = html;
	colors_container.innerHTML = html;
});
params.dispatchEvent(new Event("input"));
</script>

No label:

<div id=colors_container_h></div>

Default display:
<div id=colors_container></div>

## Reference

### Attributes & Properties

| Attribute | Property | Property type | Default value | Description |
|-----------|----------|---------------|---------------|-------------|
| `gamuts` | `gamuts` | `string` &#124; `Array<string>` &#124; `object` | `["srgb", "p3", "rec2020", "prophoto"]` | A list of gamuts to use. |
| `color` | `color` | `Color` &#124; `string` | - | The current color value. |

### Events

| Name | Description |
|------|-------------|
| `gamutchange` | Fired when the gamut changes for any reason, and once during initialization. |

### Slots

| Slot | Description |
|------|-------------|
| _(default)_ | Custom content |

### CSS variables

| Variable | Type | Default value | Description |
|----------|------|---------------|-------------|
| `--color-green` | `<color>` | | Starting color of the background color scale. Used when the color is within the first gamut. |
| `--color-yellow` | `<color>` | | Yellow color to be used at around 33.3% of the color scale Will be used for the second gamut if there are four total. |
| `--color-orange` | `<color>` | | Orange color to be used at around 66.6% of the color scale. Will be used for the third gamut if there are four total. |
| `--color-red` | `<color>` | | Red color to be used as the last stop of the color scale. Used when the color is within the last gamut. |
| `--color-red-dark` | `<color>` | | Dark red background color of gamut indicator. Used when the provided color fits none of the specified gamuts. |
| `--color-invalid` | `<color>` | | Background color of gamut indicator when the provided color is invalid. |

#### Output-only CSS variables

These variables are set by the component.
You can write CSS that reacts to them, but you should not set them yourself unless you *really* know what you’re doing.

| Variable | Type | Default value | Description |
|----------|------|---------------|-------------|
| `--gamut-color` | `<color>` | | Background color of gamut indicator. Will override the color that depends on the actual gamut, so you should rarely use this directly. |
| `--gamut-level` | `<integer>` | - | The index of the gamut the current color fits in, starting from 0. You can use this in styling, but don’t overwrite it. |

### CSS Parts

| Part | Description |
|------|-------------|
| `label` | The label of the gamut indicator. Does not apply if the element has content. |

