# Color Elements

These are some **highly experimental** color-related web components.
Use at your own risk, the API can change at any point.

## All elements

- [`<color-picker>`](src/color-picker/)
- [`<color-scale>`](src/color-scale)
- [`<color-chart>`](src/color-chart/)
- [`<color-slider>`](src/color-slider/)
- [`<channel-slider>`](src/channel-slider/)
- [`<color-swatch>`](src/color-swatch/)
- [`<color-inline>`](src/color-inline/)
- [`<gamut-badge>`](src/gamut-badge/)

### Upcoming:

- `<color-plane>`

## Usage

### CDN

To include all components at once:

```html
<script src="https://elements.colorjs.io/index.js"></script>
```

To cherry-pick individual components, follow the instructions within the component’s page, but it generally looks like this:

```html
<script src="https://elements.colorjs.io/src/COMPONENT_NAME/COMPONENT_NAME.js"></script>
```

Each component imports its own dependencies and styles.

### NPM

As usual:

```bash
npm i color-elements
```

and then:

```js
import "color-elements";
```

You can also import individual components:

```js
import "color-elements/COMPONENT_NAME";
```
