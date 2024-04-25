# `<css-color>`

## Examples

### Static

```html
<css-color>oklch(70% 0.25 138)</css-color>
```

```html
<css-color swatch="large">oklch(70% 0.25 138)</css-color>
```

### Editable

```html
<css-color>
	<input value="oklch(70% 0.25 138)" />
</css-color>
```

```html
<css-color swatch="large">
	<input value="oklch(70% 0.25 138)" />
</css-color>
```

### With name

```html
<css-color>
	<label slot="before" for=c1>Accent color:</label>
	<input value="oklch(70% 0.25 138)" id=c1 />
</css-color>
```

```html
<css-color swatch="large">
	<label slot="before" id=c2>Accent color:</label>
	<input value="oklch(70% 0.25 138)" id=c2 />
</css-color>
```

### Bound to CSS property

```html
<css-color swatch="large" property="--color-red">
	<input />
</css-color>
```

### Update via JS

#### Static

<css-color id="dynamic_static">oklch(70% 0.25 138)</css-color>
<script type="module">
	dynamic_static.color = "oklch(60% 0.15 0)"
</script>

### Editable

<css-color id="dynamic_editable">
	<input value="oklch(70% 0.25 138)" />
</css-color>
<script type="module">
	dynamic_editable.color = "oklch(60% 0.15 0)"
</script>