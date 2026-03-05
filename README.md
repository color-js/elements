# Color Elements

These are some **highly experimental** color-related web components.
Use at your own risk, the API can change at any point.

## All elements

<section class="showcase">
{% for name, description in components -%}
<a href="{{ page | relative }}/src/{{ name }}/">
<figure>
	<img src="{{ page | relative }}/src/{{ name }}/{{ name }}.webp" alt="A screenshot showcasing the &lt;{{ name }}&gt; color element" />
	<figcaption>
		<h2>&lt;{{ name }}&gt;</h2>
		<p>{{ description | safe }}</p>
	</figcaption>
</figure>
</a>
{% endfor %}
</section>

### Upcoming

<section class="showcase upcoming">
{% for name in ["color-plane"] -%}
<figure>
	<figcaption>
		<h2>&lt;{{ name }}&gt;</h2>
	</figcaption>
</figure>
{% endfor %}
</section>

## Usage

### Via npm

```bash
npm i color-elements
```

To include all components at once:

```js
import "color-elements";
```

You can also import individual components:

```js
import "color-elements/COMPONENT_NAME";
```

Each component also exports a standalone CSS file (for [CSS-only usage](src/color-slider/#css-only-usage)):

```css
@import url("color-elements/COMPONENT_NAME.css");
```

### Via CDN

If you don’t use a bundler, you can use [esm.sh](https://esm.sh):

```html
<script src="https://esm.sh/color-elements" type="module"></script>
```

To cherry-pick individual components:

```html
<script src="https://esm.sh/color-elements/COMPONENT_NAME" type="module"></script>
```

Each component imports its own dependencies and styles.
