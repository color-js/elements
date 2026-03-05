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

### CDN

To include all components at once:

```html
<script src="https://esm.sh/color-elements" type="module"></script>
```

To cherry-pick individual components, follow the instructions within the component’s page, but it generally looks like this:

```html
<script src="https://esm.sh/color-elements/src/COMPONENT_NAME/COMPONENT_NAME.js" type="module"></script>
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
