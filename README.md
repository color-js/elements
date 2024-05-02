# Color Elements

These are some highly experimental color-related web components.
Use at your own risk, the API can change at any point.

## Usage

To include all components at once:

```html
<script src="https://elements.colorjs.io/index.js"></script>
```

or if using a bundler:

```bash
npm i color-elements
```

and then:

```js
import "color-elements";
```

To cherry-pick individual components, follow the instructions within the component’s page, but it generally looks like this:

```html
<script src="https://elements.colorjs.io/src/COMPONENT_NAME/COMPONENT_NAME.js"></script>
```

or

```js
import "color-elements/COMPONENT_NAME";
```


Then just start using it!

## All elements

- [`<color-inline>`](src/color-inline/)
- [`<css-color>`](src/css-color/)
- [`<color-gamut>`](src/color-gamut/)

### Upcoming:

- [`<color-slider>`](src/color-slider/)
- `<color-picker>`
- `<color-plane>`