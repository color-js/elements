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
};

export default Self;
