import NudeElement from "../../node_modules/nude-element/src/Element.js";
import { getType, defer, wait, dynamicAll, noOpTemplateTag as css } from "./util.js";

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

	constructor () {
		super();

		let Self = this.constructor;

		if (Self.shadowTemplate !== undefined) {
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = Self.shadowTemplate;
		}

		this._internals ??= this.attachInternals?.();
		if (this._internals.states) {
			this._internals.states.add("color-element");

			this._internals.states.add("loading");
			Self.whenReady.then(() => {
				this._internals.states.delete("loading");
			});
		}
	}

	static init () {
		let wasInitialized = super.init();

		if (!wasInitialized) {
			return wasInitialized;
		}

		if (this.fetchedStyles) {
			this.ready.push(...this.fetchedStyles);
		}

		if (this.fetchedGlobalStyles) {
			this.ready.push(...this.fetchedGlobalStyles);
		}

		this.ready[0].resolve();

		return wasInitialized;
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
