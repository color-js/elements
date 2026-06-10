import ColorElement from "../common/color-element.js";
import "../gamut-badge/gamut-badge.js";

let importIncrementable;

const SUPPORTS_POPOVER = "popover" in HTMLElement.prototype;

const Self = class ColorSwatch extends ColorElement {
	static tagName = "color-swatch";
	static url = import.meta.url;
	static dependencies = new Set(["gamut-badge"]);
	static styles = import("./color-swatch.css", { with: { type: "css" } }).catch(
		() => new URL("./color-swatch.css", import.meta.url),
	);
	static shadowTemplate = `
		<slot name="swatch">
			<div id="swatch" part="swatch">
				<slot name="swatch-content"></slot>
			</div>
		</slot>
		<div id="wrapper" part="details">
			<slot name="before"></slot>
			<div part="label"></div>
			<div part="color">
				<slot></slot>
			</div>
			<slot name="after"></slot>
		</div>`;

	constructor () {
		super();

		this._el = {
			wrapper: this.shadowRoot.querySelector("#wrapper"),
			label: this.shadowRoot.querySelector("[part=label]"),
			colorWrapper: this.shadowRoot.querySelector("[part=color]"),
		};

		this._slots = {
			default: this.shadowRoot.querySelector("slot:not([name])"),
			swatch: this.shadowRoot.querySelector("slot[name=swatch]"),
		};

		this._el.swatch =
			this._slots.swatch.assignedElements()[0] ?? this._slots.swatch.firstElementChild;

		this.#updateStatic();
		this._slots.default.addEventListener("slotchange", evt => this.#updateStatic());
	}

	connectedCallback () {
		super.connectedCallback();

		if (SUPPORTS_POPOVER) {
			// Focus as well as hover, so the tooltip works by keyboard too (WCAG
			// 1.4.13: content on hover *or focus*) if the consumer makes the swatch
			// focusable.
			for (let type of ["pointerenter", "pointerleave", "focusin", "focusout"]) {
				this.addEventListener(type, this);
			}
		}
	}

	/** Whether the details are presented compactly (as a hover/focus tooltip). */
	get #compact () {
		return getComputedStyle(this).getPropertyValue("--details-style").trim() === "compact";
	}

	handleEvent (evt) {
		let popover = this._el.wrapper;

		if (!this.#compact) {
			popover.removeAttribute("popover");
			return;
		}

		if (!popover.hasAttribute("popover")) {
			popover.setAttribute("popover", "hint");
		}

		// Show while hovered or focused; dismiss once neither holds. On a leave/blur
		// event we check the *other* modality, so the tooltip stays open if the user
		// is still hovering or still focused.
		let show = this.matches(":focus-within, :hover");
		popover.togglePopover({ force: show, source: this._el.swatch });
	}

	#updateStatic () {
		let previousInput = this._el.input;
		let input = (this._el.input = this.querySelector("input"));

		this.static = !input;

		// This should eventually be a custom state
		this._el.wrapper.classList.toggle("static", this.static);

		if (input && input !== previousInput) {
			importIncrementable ??= import("incrementable").then(m => m.default).catch();
			importIncrementable?.then(Incrementable => new Incrementable(input));

			input.addEventListener("input", evt => {
				this.value = evt.target.value;
			});
		}
	}

	get gamut () {
		return this._el.gamutIndicator.gamut;
	}

	get swatchTextContent () {
		// Children that are not assigned to another slot
		return [...this.childNodes]
			.filter(n => !n.slot)
			.map(n => n.textContent)
			.join("")
			.trim();
	}

	propChangedCallback ({ name }) {
		// Synchronous so consumers (e.g., color-chart) can read --color in the same propchange cycle
		if (name === "color") {
			this.style.setProperty("--color", this.color?.display());
		}
	}

	updated ({ changed }) {
		let input = this._el.input;

		if (changed.has("gamuts")) {
			if (this.gamuts === "none") {
				this._el.gamutIndicator?.remove();
				this._el.gamutIndicator = null;
			}
			else if (this.gamuts) {
				if (!this._el.gamutIndicator) {
					this._el.gamutIndicator = Object.assign(document.createElement("gamut-badge"), {
						id: "gamut",
						part: "gamut",
						exportparts: "label: gamutLabel",
						gamuts: this.gamuts,
						color: this.color,
					});

					this.shadowRoot.append(this._el.gamutIndicator);

					this._el.gamutIndicator.addEventListener("gamutchange", evt => {
						let gamut = evt.value;
						this.setAttribute("gamut", gamut);
						this.dispatchEvent(new evt.constructor("gamutchange", { value: gamut }));
					});
				}
				else {
					this._el.gamutIndicator.gamuts = this.gamuts;
				}
			}
		}

		if (changed.has("value")) {
			if (input && (!input.value || input.value !== this.value)) {
				input.value = this.value;
			}
		}

		if (changed.has("label")) {
			if (this.label.length && this.label !== this.swatchTextContent) {
				this._el.label.textContent = this.label;
				this._el.label.title = this.label;
			}
			else {
				this._el.label.textContent = "";
				this._el.label.title = "";
			}
		}

		if (changed.has("color")) {
			let isValid = this.color !== null || !this.value;

			input?.setCustomValidity(isValid ? "" : "Invalid color");

			if (this._el.gamutIndicator) {
				this._el.gamutIndicator.color = this.color;
			}
		}

		if (changed.has("colorInfo")) {
			if (!this.colorInfo) {
				return;
			}

			this._el.info ??= Object.assign(document.createElement("dl"), { part: "info" });
			if (!this._el.info.parentNode) {
				this._el.colorWrapper.after(this._el.info);
			}

			let info = [];
			for (let coord of this.info) {
				let [label, channel] = Object.entries(coord)[0];

				let value = this.colorInfo[channel];
				if (value === undefined) {
					continue;
				}

				value = typeof value === "number" ? Number(value.toPrecision(4)) : value;

				info.push(`<div class="coord"><dt>${label}</dt><dd>${value}</dd></div>`);
			}

			this._el.info.innerHTML = info.join("\n");
		}
	}

	static props = {
		size: {},
		open: {},
		gamuts: {
			default: "srgb, p3, rec2020: P3+, prophoto: PP",
		},
		value: {
			type: String,
			default () {
				if (this._el.input) {
					return this._el.input.value;
				}

				return this.swatchTextContent;
			},
			reflect: {
				from: true,
			},
		},
		label: {
			type: String,
			default () {
				return this.swatchTextContent;
			},
			convert (value) {
				return value.trim();
			},
		},
		color: {
			get type () {
				return ColorSwatch.Color;
			},
			get () {
				if (!this.value) {
					return null;
				}

				return ColorSwatch.Color.get(this.value);
			},
			set (value) {
				this.value = ColorSwatch.Color.get(value)?.display();
			},
			reflect: false,
		},
		info: {
			type: {
				is: Array,
				values: {
					is: Object,
					defaultKey: (coord, i) => ColorSwatch.Color.Space.resolveCoord(coord)?.name,
				},
			},
			default: [],
			reflect: {
				from: true,
			},
		},
		colorInfo: {
			get () {
				if (!this.info.length || !this.color) {
					return;
				}

				let ret = {};
				for (let coord of this.info) {
					let [label, channel] = Object.entries(coord)[0];
					try {
						ret[channel] = this.color.get(channel);
					}
					catch (e) {
						console.error(e);
					}
				}

				return ret;
			},
		},
	};

	static events = {
		colorchange: {
			propchange: "color",
		},
		valuechange: {
			propchange: "value",
		},
	};
};

Self.define();

export default Self;
