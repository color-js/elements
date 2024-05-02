---
layout: component
css: "style.css"
---

# `<color-inline>`

Basic use:

<html-demo adjust="font-size">

```html
<color-inline>lch(50% 40 30)</color-inline>
```
</html-demo>

Editable:
```html
<color-inline contentEditable>lch(50% 40 30)</color-inline>
```

Semi-transparent color:
```html
<color-inline>hsl(340 90% 50% / .25)</color-inline>
```

Invalid color:

```html
<color-inline>foobar</color-inline>
```