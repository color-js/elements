import ColorElement from "../common/color-element.js";
import { getStep } from "../common/util.js";
import { getGamutBoundaries } from "./gamut-boundaries.js";

let supports = {
	inSpace: CSS?.supports("background", "linear-gradient(in oklab, red, tan)"),
	fieldSizing: CSS?.supports("field-sizing", "content"),
};

// Detect the display's color gamut via the color-gamut media query. The values are cumulative
// (a wider display also matches narrower queries), so the widest match wins.
function getDisplayGamut () {
	let mm = globalThis.matchMedia;

	if (mm?.("(color-gamut: rec2020)")?.matches) {
		return "rec2020";
	}

	if (mm?.("(color-gamut: p3)")?.matches) {
		return "p3";
	}

	return "srgb";
}

const Self = class ColorSlider extends ColorElement {
	static tagName = "color-slider";
	static url = import.meta.url;
	static styles = import("./color-slider.css", { with: { type: "css" } }).catch(
		() => new URL("./color-slider.css", import.meta.url),
	);
	static shadowTemplate = `
		<input type="range" class="color-slider" part="slider" min="0" max="1" step="0.01" />
			<slot name="tooltip" class="slider-tooltip">
				<input type="number" part="spinner" min="0" max="1" step="0.01" />
			</slot>
		<slot></slot>`;

	constructor () {
		super();

		this._el = {
			slider: this.shadowRoot.querySelector(".color-slider"),
			spinner: this.shadowRoot.querySelector("input[type=number]"),
		};
	}

	connectedCallback () {
		super.connectedCallback?.();

		this._el.slider.addEventListener("input", this);
		this._el.spinner.addEventListener("input", this);
	}

	disconnectedCallback () {
		this._el.slider.removeEventListener("input", this);
		this._el.spinner.removeEventListener("input", this);
	}

	handleEvent (event) {
		if (event.type === "input") {
			if (this.tooltip === "progress" && event.target === this._el.spinner) {
				// Convert to value
				let value = this._el.spinner.value;
				this.value = this.valueAt(value / 100);
			}
			else {
				this.value = event.target.value;
			}

			this.dispatchEvent(new event.constructor(event.type, { ...event }));
		}
	}

	updated ({ changed }) {
		for (let name of ["min", "max", "step", "value", "defaultValue"]) {
			if (!changed.has(name)) {
				continue;
			}

			this._el.slider[name] = this[name];

			let value = this[name];
			if (this.tooltip === "progress") {
				if (name === "value" || name === "defaultValue") {
					value = +(this.progress * 100).toPrecision(4);
				}
				else {
					// Spinner values when tooltip is "progress"
					value = { min: 1, max: 100, step: 1 }[name];
				}
			}
			this._el.spinner[name] = +(+value).toPrecision(4);
		}

		if (changed.has("stops")) {
			// FIXME will fail if there are none values
			let stops = this.stops;
			let supported = stops.every(color => CSS.supports("color", color));

			// CSS does not support (yet?) a raw hue interpolation,
			// so we need to fake it with tessellateStops() in cases of polar space and far-apart stops.
			let farApart = false;
			let space = this.space;
			if (space.isPolar) {
				for (let i = 1; i < stops.length; i++) {
					// Even though space is polar, color stops might be in non-polar spaces
					let first = stops[i - 1].to(space);
					let second = stops[i].to(space);

					let firstHue = first.get("h");
					let secondHue = second.get("h");

					if (Math.abs(firstHue - secondHue) >= 180) {
						farApart = true;
						break;
					}
				}
			}

			if (!supported || farApart) {
				stops = this.tessellateStops({ steps: 3 });
			}

			stops = stops.map(color => color.display()).join(", ");

			this.style.setProperty("--slider-color-stops", stops);
		}

		// Paint a separate overlay over the parts of the band that fall outside the target gamut.
		// The color band itself is left untouched; this just layers the out-of-gamut color on top.
		// Set on the slider (not the host) so the nested var(--_oog-color) in the overlay
		// resolves where it's defined.
		if (changed.has("stops") || changed.has("space") || changed.has("gamut")) {
			let overlay = this.#buildGamutOverlay();

			if (overlay) {
				this._el.slider.style.setProperty("--slider-gamut-overlay", overlay);
			}
			else {
				this._el.slider.style.removeProperty("--slider-gamut-overlay");
			}
		}

		// Reflect whether the currently selected color is within the target gamut,
		// so it can be styled via :state(in-gamut).
		if (changed.has("inGamut")) {
			this.toggleState("in-gamut", this.inGamut);
		}

		if (changed.has("space") && supports.inSpace) {
			let space = this.space;
			let spaceId = space.id;
			let supported = CSS.supports("background", `linear-gradient(in ${spaceId}, red, tan)`);

			if (!supported) {
				spaceId = this.space.isPolar ? "oklch" : "oklab";
			}

			this.style.setProperty("--color-space", spaceId);
		}

		if (changed.has("color") || changed.has("defaultColor")) {
			let color = this.color;

			if (color) {
				let displayedColor = color.display();
				this.style.setProperty("--color", displayedColor);
			}
		}

		if (changed.has("value") || changed.has("min") || changed.has("max")) {
			this.style.setProperty("--progress", this.progress);

			if (changed.has("value") && !supports.fieldSizing) {
				let valueStr = this.value + "";
				this._el.spinner.style.setProperty("--value-length", valueStr.length);
			}
		}

		if (changed.has("tooltip")) {
			if (this.tooltip !== undefined) {
				let values = this;
				if (this.tooltip === "progress") {
					values = {
						min: 1,
						max: 100,
						step: 1,
						value: +(this.progress * 100).toPrecision(4),
					};
				}

				["min", "max", "step", "value"].forEach(name => {
					this._el.spinner[name] = values[name];
				});
			}
		}
	}

	tessellateStops (options = {}) {
		let stops = this.stops;
		let tessellated = [];

		for (let i = 1; i < stops.length; i++) {
			let start = stops[i - 1];
			let end = stops[i];
			let steps = start.steps(end, { space: this.space, ...options });
			tessellated.push(...steps);

			if (i < stops.length - 1) {
				tessellated.pop();
			}
		}

		return tessellated;
	}

	/**
	 * Build the value of the `--slider-gamut-overlay` custom property from {@link ColorSlider#oogRanges}:
	 * `--_oog-color` over each out-of-gamut range, transparent in between, with a hard edge at each
	 * gamut boundary.
	 *
	 * @returns {string | null} Comma-separated overlay color stops, or null when nothing is out of gamut.
	 */
	#buildGamutOverlay () {
		let oogRanges = this.oogRanges;

		// The whole band is in gamut (or no gamut set): nothing to paint.
		if (oogRanges.length === 0) {
			return null;
		}

		// Paint --_oog-color over each out-of-gamut range, transparent in between.
		// Adjacent stops at the same position produce the hard edge at each boundary.
		let pos = p => `${+(p * 100).toPrecision(4)}%`;
		let stops = [];
		let cursor = 0;

		for (let [start, end] of oogRanges) {
			if (start > cursor) {
				stops.push(`transparent ${pos(cursor)} ${pos(start)}`);
			}
			stops.push(`var(--_oog-color) ${pos(start)} ${pos(end)}`);
			cursor = end;
		}

		if (cursor < 1) {
			stops.push(`transparent ${pos(cursor)} 100%`);
		}

		return stops.join(", ");
	}

	get progress () {
		return this.progressAt(this.value);
	}

	progressAt (value) {
		return (value - this.min) / (this.max - this.min);
	}

	valueAt (progress) {
		return this.min + progress * (this.max - this.min);
	}

	colorAt (value) {
		let progress = this.progressAt(value);
		return this.colorAtProgress(progress);
	}

	colorAtProgress (progress) {
		let bands = this.scales?.length;

		if (bands <= 0) {
			return null;
		}

		// FIXME the values outside of [0, 1] should be scaled
		if (progress >= 1) {
			return this.scales.at(-1)(progress);
		}
		else if (progress <= 0) {
			return this.scales[0](progress);
		}

		let band = 1 / bands;
		let scaleIndex = Math.max(0, Math.min(Math.floor(progress / band), bands - 1));
		let scale = this.scales[scaleIndex];
		let color = scale((progress % band) * bands);

		return color;
	}

	static props = {
		min: {
			type: Number,
			default: 0,
		},
		max: {
			type: Number,
			default: 1,
		},
		step: {
			type: Number,
			default () {
				return getStep(this.max, this.min, { minSteps: 100 });
			},
		},
		stops: {
			type: {
				is: Array,
				get values () {
					return Self.Color;
				},
			},
			default: el => [],
		},
		defaultValue: {
			type: Number,
			default () {
				return (this.min + this.max) / 2;
			},
			reflect: {
				from: "value",
			},
		},
		value: {
			type: Number,
			defaultProp: "defaultValue",
			reflect: false,
		},

		space: {
			default () {
				return this.stops[0]?.space ?? "oklab";
			},
			parse (value) {
				if (value instanceof Self.Color.Space || value === null || value === undefined) {
					return value;
				}

				value += "";

				return Self.Color.Space.get(value);
			},
			stringify (value) {
				return value?.id;
			},
		},

		gamut: {
			type: String,
			default: "",
			// Resolve "auto" to the display's gamut, once, when the value is set.
			convert (value) {
				return value === "auto" ? getDisplayGamut() : value;
			},
		},

		color: {
			get type () {
				return Self.Color;
			},
			get () {
				return this.colorAt(this.value);
			},
			dependencies: ["scales", "value"],
		},
		inGamut: {
			get () {
				if (!this.gamut || this.gamut === "none" || !this.color) {
					return true;
				}

				try {
					return this.color.inGamut(this.gamut);
				}
				catch (error) {
					// NOTE: invalid gamut id; treat the color as in-gamut.
					return true;
				}
			},
			dependencies: ["color", "gamut"],
		},
		scales: {
			get () {
				let stops = this.stops;
				let scales = [];

				for (let i = 1; i < stops.length; i++) {
					let start = stops[i - 1];
					let end = stops[i];
					let range = start.range(end, { space: this.space });
					scales.push(range);
				}

				return scales;
			},
			dependencies: ["stops", "space"],
		},
		oogRanges: {
			get () {
				let scales = this.scales;
				let bands = scales.length;
				let gamut = this.gamut;

				if (bands === 0 || !gamut) {
					return [];
				}

				// Scan each band (one interpolation between two stops) independently. A non-polar one is
				// ~monotone, so its endpoints + midpoint (samples = 2) suffice; a polar one can weave in
				// and out of gamut, so it needs dense sampling.
				// NOTE: an out-of-gamut → in → out island that misses the midpoint is still under-sampled.
				let samples = this.space.isPolar ? 100 : 2;
				let ranges = [];

				for (let i = 0; i < bands; i++) {
					let bandRanges = getGamutBoundaries(gamut, scales[i], { samples });

					if (!bandRanges) {
						// gamut is "none" or an unknown id: nothing out of gamut.
						return [];
					}

					// Place each band-local [0, 1] range into its slot in the whole track, merging with
					// the previous range when they touch across a band boundary (both out of gamut there).
					for (let [start, end] of bandRanges) {
						let from = (i + start) / bands;
						let to = (i + end) / bands;
						let last = ranges.at(-1);

						if (last && last[1] === from) {
							last[1] = to;
						}
						else {
							ranges.push([from, to]);
						}
					}
				}

				return ranges;
			},
			dependencies: ["scales", "gamut"],
		},

		tooltip: {
			type: String,
		},
	};

	static events = {
		change: {
			from () {
				return this._el.slider;
			},
		},
		valuechange: {
			propchange: "value",
		},
		colorchange: {
			propchange: "color",
		},
		ingamutchange: {
			propchange: "inGamut",
		},
	};

	static formBehavior = {
		like: el => el._el.slider,
		role: "slider",
		valueProp: "value",
		changeEvent: "valuechange",
	};
};

Self.define();

export default Self;
