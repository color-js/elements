import Color from "colorjs.io";
import NudeElement from "nude-element";
import { states } from "nude-element/plugins";
import { defer, wait, dynamicAll, noOpTemplateTag as css } from "./util.js";

const baseGlobalStyles = css`
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}

	:state(color-element) {
		&:state(loading) {
			content-visibility: hidden;
			opacity: 0;

			&,
			* {
				transition-property: opacity !important;
			}
		}

		&:not(:state(loading)) {
			animation: fade-in 300ms both;
		}
	}
`;

const Self = class ColorElement extends NudeElement {
	static url = import.meta.url;
	// TODO make lazy
	static Color;
	static all = {};
	static dependencies = new Set();

	/** @type {Map<string, string>} */
	static #resolvedColors = new Map();

	static globalStyles = [{ css: baseGlobalStyles }];
	static plugins = [states];

	constructor () {
		super();

		let Self = this.constructor;

		if (Self.shadowTemplate !== undefined) {
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = Self.shadowTemplate;
		}

		this.toggleState("color-element", true);
		this.toggleState("loading", true);
		Self.whenReady.then(() => {
			this.toggleState("loading");
		});
	}

	static ready = [defer()];
	static whenReady = dynamicAll(this.ready);

	static async define () {
		// Overwrite static properties, otherwise they will be shared across subclasses
		this.ready = [defer()];
		this.whenReady = dynamicAll(this.ready);

		if (!Object.hasOwn(this, "dependencies")) {
			this.dependencies = new Set();
		}

		Self.all[this.tagName] = this;
		let colorTags = Object.keys(Self.all);

		if (this.shadowTemplate) {
			// TODO find dependencies
			let colorTagRegex = RegExp(`(?<=</)(${colorTags.join("|")})(?=>)`, "g");
			(this.shadowTemplate.match(colorTagRegex) ?? []).forEach(tag => {
				this.dependencies ??= new Set();
				this.dependencies.add(tag);
			});
		}

		if (this.dependencies.size > 0) {
			let whenDefined = [...this.dependencies].map(tag =>
				customElements.whenDefined(tag).then(Class => Class.whenReady));
			this.ready.push(...whenDefined);
		}

		// Give other code a chance to overwrite Self.Color
		await wait();

		Self.Color ??= Color;

		customElements.define(this.tagName, this);

		this.ready[0].resolve();
	}

	/**
	 * Resolve a color value and cache it.
	 * @param {string} value Color value to resolve.
	 * @param {Element} element Element to get computed style from to resolve the color value.
	 * @returns {Color | null} Resolved color value or null if the value cannot be resolved.
	 */
	static resolveColor (value, element) {
		try {
			return Self.Color.get(value);
		}
		catch {}

		// Color.js can't parse the color value; possibly one of the values we can handle gracefully
		if (Self.#resolvedColors.has(value)) {
			let color = Self.#resolvedColors.get(value);
			return Self.Color.get(color);
		}

		if (!globalThis.CSS?.supports("color", value) || !element) {
			// Not supported/invalid value, or no element to resolve the color value from
			return null;
		}

		// One of the supported color values; resolve and cache it
		let backgroundColor = element.style.backgroundColor;
		element.style.backgroundColor = value;
		let color = getComputedStyle(element).backgroundColor;
		element.style.backgroundColor = backgroundColor;

		let resolvedColor = Self.resolveColor(color);
		if (resolvedColor) {
			Self.#resolvedColors.set(value, color);
		}

		return resolvedColor;
	}
};

export default Self;
