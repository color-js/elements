import NudeElement from "../../node_modules/nude-element/src/Element.js";
import { getType, wait } from "./util.js";

const Self = class ColorElement extends NudeElement {
	// TODO make lazy
	static Color;
	static all = {};
	static dependencies = new Set();

	constructor () {
		super();

		if (this.constructor.shadowTemplate !== undefined) {
			this.attachShadow({mode: "open"});
			this.shadowRoot.innerHTML = this.constructor.shadowTemplate;
		}
	}

	static async define () {
		Self.all[this.tagName] = this;
		let colorTags = Object.keys(Self.all);

		if (this.shadowTemplate) {
			// TODO find dependencies
			let colorTagRegex = RegExp(`(?<=</)(${ colorTags.join("|") })(?=>)`, "g");
			(this.shadowTemplate.match(colorTagRegex) ?? []).forEach(tag => {
				this.dependencies ??= new Set();
				this.dependencies.add(tag);
			});

			if (this.shadowStyle) {
				let url = this.shadowStyle;
				url = url === true ? `./${this.tagName}.css` : url;
				url = new URL(url, this.url);
				this.shadowTemplate = `<link rel="stylesheet" href="${ url }" />` + "\n" + this.shadowTemplate;
			}
		}

		// Hide elements before they are defined
		let style = document.getElementById("color-element-styles")
		          ?? Object.assign(document.createElement("style"), {id: "color-element-styles"});
		style.textContent = `:is(${ colorTags.join(", ") }):not(:defined) {display: none}`;
		if (!style.parentNode) {
			document.head.append(style);
		}

		if (this.dependencies.size > 0) {
			await Promise.all([...this.dependencies].map(tag => customElements.whenDefined(tag)));
		}
		else {
			// Give other code a chance to overwrite Self.Color
			await wait();
		}

		if (!Self.Color) {
			let specifier;

			try {
				// Is already loaded? (e.g. via an import map, or if we're in Node)
				import.meta.resolve("colorjs.io");
				specifier = "colorjs.io";
			}
			catch (e) {
				// specifier = "../../node_modules/colorjs.io/dist/color.js";
				specifier = "https://colorjs.io/dist/color.js";
			}

			Self.Color = import(specifier).then(module => module.default);
		}

		// We can't just use top level await, see https://bugs.webkit.org/show_bug.cgi?id=242740
		if (getType(Self.Color) === "Promise") {
			let ColorPending = Self.Color;
			let Color = await ColorPending;

			if (Self.Color === ColorPending) {
				// Hasn't changed
				Self.Color = Color;
			}
		}

		customElements.define(this.tagName, this);
	}
};

export default Self;
