import NudeElement from "../../node_modules/nude-element/src/Element.js";
import { getType, wait } from "./util.js";

const Self = class ColorElement extends NudeElement {
	// TODO make lazy
	static Color;
	static all = [];

	static async define () {
		Self.all.push(this);

		// Hide elements before they are defined
		let style = document.getElementById("color-element-styles")
		          ?? Object.assign(document.createElement("style"), {id: "color-element-styles"});
		style.textContent = `:is(${ Self.all.map(cls => cls.tagName).join(",") }):not(:defined) {display: none}`;
		if (!style.parentNode) {
			document.head.append(style);
		}

		await wait(); // Give other code a chance to overwrite Self.Color

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
