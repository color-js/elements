---
layout: component
css: "style.css"
---

# `<color-swatch>`

Basic use:

<html-demo adjust="font-size">

```html
<color-swatch>lch(50% 40 30)</color-swatch>
```
</html-demo>

Editable:
```html
<color-swatch contentEditable>lch(50% 40 30)</color-swatch>
```

Semi-transparent color:
```html
<color-swatch>hsl(340 90% 50% / .25)</color-swatch>
```

Invalid color:

```html
<color-swatch>foobar</color-swatch>
```