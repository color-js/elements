# `<color-swatch>`

## Examples

### Static

```html
<color-swatch>oklch(70% 0.25 138)</color-swatch>
```

```html
<color-swatch swatch="large">oklch(70% 0.25 138)</color-swatch>
```

### Editable

```html
<color-swatch>
	<input value="oklch(70% 0.25 138)" />
</color-swatch>
```

```html
<color-swatch swatch="large">
	<input value="oklch(70% 0.25 138)" />
</color-swatch>
```

### With name

```html
<color-swatch>
	<label slot="before" for=c1>Accent color:</label>
	<input value="oklch(70% 0.25 138)" id=c1 />
</color-swatch>
```

```html
<color-swatch swatch="large">
	<label slot="before" id=c2>Accent color:</label>
	<input value="oklch(70% 0.25 138)" id=c2 />
</color-swatch>
```

### Bound to CSS property

```html
<color-swatch swatch="large" property="--color-red">
	<input />
</color-swatch>
```

### Update via JS

#### Static

<color-swatch id="dynamic_static">oklch(70% 0.25 138)</color-swatch>
<script type="module">
	dynamic_static.color = "oklch(60% 0.15 0)"
</script>

### Editable

<color-swatch id="dynamic_editable">
	<input value="oklch(70% 0.25 138)" />
</color-swatch>
<script type="module">
	dynamic_editable.color = "oklch(60% 0.15 0)"
</script>