import "../color-scale/color-scale.js";
import "../channel-picker/channel-picker.js";
import ColorElement from "../common/color-element.js";

const Self = class ColorChart extends ColorElement {
	static tagName = "color-chart";
	static url = import.meta.url;
	static styles = "./color-chart.css";
	static globalStyles = "./color-chart-global.css";
	static shadowTemplate = `
		<slot name="color-channel">
			<channel-picker id="channel_picker" part="color-channel"></channel-picker>
		</slot>
		<div id="chart-container">
			<div id="chart">
				<slot></slot>
			</div>
		</div>
		<div class="axis" id="y_axis">
			<div class="label" part="y label"></div>
			<div class="ticks" part="y ticks"></div>
		</div>
		<div class="axis" id="x_axis">
			<div class="label" part="x label"></div>
			<div class="ticks" part="x ticks"></div>
		</div>`;
	static dependencies = new Set(["color-scale"]);

	constructor () {
		super();

		this._el = {
			slot:   this.shadowRoot.querySelector("slot:not([name])"),
			channel_picker: this.shadowRoot.getElementById("channel_picker"),
			chart:  this.shadowRoot.getElementById("chart"),
			xTicks: this.shadowRoot.querySelector("#x_axis .ticks"),
			yTicks: this.shadowRoot.querySelector("#y_axis .ticks"),
			xLabel: this.shadowRoot.querySelector("#x_axis .label"),
			yLabel: this.shadowRoot.querySelector("#y_axis .label"),
		};

		this._slots = {
			color_channel: this.shadowRoot.querySelector("slot[name=color-channel]"),
		};
	}

	connectedCallback () {
		super.connectedCallback();
		this._el.chart.addEventListener("colorschange", this, {capture: true});
		this._slots.color_channel.addEventListener("input", this);
	}

	disconnectedCallback () {
		this._el.chart.removeEventListener("colorschange", this, {capture: true});
		this._slots.color_channel.removeEventListener("input", this);
	}

	handleEvent (evt) {
		let source = evt.target;
		if (source.tagName === "COLOR-SCALE" && evt.name === "computedColors") {
			this.render(evt);
		}

		if (this._el.channel_picker === source || this._slots.color_channel.assignedElements().includes(source)) {
			this.y = source.value;
		}
	}

	series = new WeakMap();

	render (evt) {
		let colorScales = this.querySelectorAll("color-scale");

		if (colorScales.length === 0) {
			return;
		}

		let minX = Infinity, maxX = -Infinity;
		let minY = Infinity, maxY = -Infinity;

		for (let colorScale of colorScales) {
			let scale = this.series.get(colorScale);

			if (!scale || !evt || evt.target === colorScale || evt.target.nodeName !== "COLOR-SCALE") {
				scale = this.renderScale(colorScale);
			}

			if (!scale) {
				continue;
			}

			minX = Math.min(scale.x.min, minX);
			maxX = Math.max(scale.x.max, maxX);
			minY = Math.min(scale.y.min, minY);
			maxY = Math.max(scale.y.max, maxY);
		}

		if (isFinite(minX) && isFinite(maxX)) {
			let xAxis = getAxis(minX, maxX, 10);
			this._el.chart.style.setProperty("--min-x", xAxis.min);
			this._el.chart.style.setProperty("--max-x", xAxis.max);
			this._el.chart.style.setProperty("--steps-x", xAxis.steps);
			this._el.xTicks.innerHTML = Array(xAxis.steps).fill().map((_, i) => "<div part='x tick'>" + +(xAxis.min + i * xAxis.step).toPrecision(15) + "</div>").join("\n");
		}

		minY = this.yMin === "auto" || this.yMinAsNumber === undefined || Number.isNaN(this.yMinAsNumber) ? minY : this.yMinAsNumber;
		maxY = this.yMax === "auto" || this.yMaxAsNumber === undefined || Number.isNaN(this.yMaxAsNumber) ? maxY : this.yMaxAsNumber;

		if (isFinite(minY) && isFinite(maxY)) {
			let yAxis = getAxis(minY, maxY, 10);

			this._el.chart.style.setProperty("--min-y", yAxis.min);
			this._el.chart.style.setProperty("--max-y", yAxis.max);
			this._el.chart.style.setProperty("--steps-y", yAxis.steps);
			this._el.yTicks.innerHTML = Array(yAxis.steps).fill().map((_, i) => "<div part='y tick'>" + +(yAxis.min + i * yAxis.step).toPrecision(15) + "</div>").reverse().join("\n");
			this._el.yLabel.textContent = this.space.name + " " + this.yResolved.name;
		}
	}

	renderScale (colorScale) {
		if (!colorScale.computedColors) {
			// Not yet initialized
			return;
		}

		let ret = {
			element: colorScale,
			swatches: new WeakMap(),
			x: {min: Infinity, max: -Infinity, values: new WeakMap() },
			y: {min: Infinity, max: -Infinity, values: new WeakMap()},
			colors: colorScale.computedColors?.slice() ?? [],
		};

		colorScale.style.setProperty("--color-count", ret.colors.length);

		let yAll = ret.colors.map(({color}) => color.to(this.space).get(this.y));
		let yMin = this.yMin === "auto" || this.yMinAsNumber === undefined || Number.isNaN(this.yMinAsNumber) ? -Infinity : this.yMinAsNumber;
		let yMax = this.yMax === "auto" || this.yMaxAsNumber === undefined || Number.isNaN(this.yMaxAsNumber) ? Infinity : this.yMaxAsNumber;

		if (this.yResolved.type === "angle") {
			// First, normalize
			yAll = normalizeAngles(yAll);
		}

		let index = 0;
		for (let {name, color} of ret.colors) {
			let swatch = colorScale._el.swatches.children[index];
			ret.colors[index] = color = color.to(this.space);
			ret.swatches.set(color, swatch);

			// It's not always possible to use the last number in the color label as the X-coord;
			// for example, the number “9” can't be interpreted as the X-coord in the “#90caf9” label.
			// It might cause bugs with color order (see https://github.com/color-js/elements/issues/103).
			// We expect the valid X-coord to be the only number in the color label (e.g., 50)
			// or separated from the previous text with a space (e.g., Red 50 or Red / 50).
			let x = name.match(/(?:^|\s)-?\d*\.?\d+$/)?.[0];
			if (x !== undefined) {
				// Transform `Label / X-coord` to `Label`
				// (there should be at least one space before and after the slash so the number is treated as an X-coord)
				let label = name.slice(0, -x.length).trim();
				if (label.endsWith("/")) {
					name = label.slice(0, -1).trim();
				}

				swatch.label = name;

				x = Number(x);
			}
			else {
				x = index;
			}

			let y = yAll[index];

			ret.x.values.set(color, x);
			ret.y.values.set(color, y);

			let outOfRange = (isFinite(yMin) && y < yMin) || (isFinite(yMax) && y > yMax);
			if (!outOfRange) {
				// Only swatches that are in range participate in the min/max calculation
				ret.x.min = Math.min(ret.x.min, x);
				ret.x.max = Math.max(ret.x.max, x);
				ret.y.min = Math.min(ret.y.min, y);
				ret.y.max = Math.max(ret.y.max, y);
			}

			swatch.style.setProperty("--x", x);
			swatch.style.setProperty("--y", y);
			swatch.style.setProperty("--index", index);

			if (HTMLElement.prototype.hasOwnProperty("popover") && !swatch._el.wrapper.hasAttribute("popover")) {
				// The Popover API is supported
				let popover = swatch._el.wrapper;
				popover.setAttribute("popover", "");

				// We need these for the popover to be correctly activated and positioned,
				// otherwise, it won't be on the top layer
				swatch.addEventListener("pointerenter", evt => {
					// Position the popover relative to the parent swatch
					// (instead of the center of the viewport by default)
					let rect = swatch.getBoundingClientRect();
					popover.style.setProperty("--_popover-left", rect.left + rect.width / 2 + "px");
					popover.style.setProperty("--_popover-top", rect.top - rect.height / 2 + "px");

					popover.showPopover();
				});
				swatch.addEventListener("pointerleave", evt => popover.hidePopover());
			}

			index++;
		}

		// Sort colors by X (ascending)
		ret.colors.sort((a, b) => ret.x.values.get(a) - ret.x.values.get(b));

		let prevColor;
		for (let color of ret.colors) {
			let swatch = ret.swatches.get(color);

			if (prevColor !== undefined) {
				prevColor.style.setProperty("--next-color", swatch.style.getPropertyValue("--color"));
				prevColor.style.setProperty("--next-x", ret.x.values.get(color));
				prevColor.style.setProperty("--next-y", ret.y.values.get(color));
			}

			prevColor = swatch;
		}

		if (prevColor !== undefined) {
			// When we update colors, and we have fewer colors than before,
			// we need to make sure the last swatch is not connected to the non-existent next swatch
			["--next-color", "--next-x", "--next-y"].forEach(prop => prevColor.style.removeProperty(prop));
		}

		this.series.set(colorScale, ret);

		return ret;
	}

	propChangedCallback (evt) {
		let {name, prop, detail: change} = evt;

		if (["yResolved", "yMinAsNumber", "yMaxAsNumber"].includes(name)) {
			// Re-render swatches
			this.render(evt);
		}

		if (name === "info") {
			for (let colorScale of this.children) {
				colorScale.info = this.info;
			}
		}
	}

	static props = {
		y: {
			default: "oklch.l",
			convert (value) {
				// Try setting the value to the channel picker. The picker will handle possible erroneous values.
				this._el.channel_picker.value = value;

				// If the value is not set, that means it's invalid.
				// In that case, we are falling back to the picker's current value.
				if (this._el.channel_picker.value !== value) {
					return this._el.channel_picker.value;
				}

				return value;
			},
		},

		yResolved: {
			get () {
				return Self.Color.Space.resolveCoord(this.y, "oklch");
			},
			// rawProp: "coord",
		},

		yMin: {
			default: "auto",
			changed (change) {
				let { value } = change;

				if (value === "auto") {
					// `this.yMinAsNumber` will become `undefined` (i.e., get a new value), and the chart will be re-rendered
					this._el.chart.style.removeProperty("--min-y");
				}
			},
			reflect: {
				from: "ymin",
			},
		},

		yMinAsNumber: {
			get () {
				if (this.yMin === "coord") {
					let range = this.yResolved.refRange ?? this.yResolved.range ?? [0, 100];
					return range[0];
				}
				else if (this.yMin === "auto") {
					let minY = this._el.chart.style.getPropertyValue("--min-y");

					if (minY !== "") {
						return Number(minY);
					}

					// Intermediate state (the chart is not rendered yet)
					return;
				}

				return Number(this.yMin);
			},
			set (value) {
				value = Number(value);

				if (Number.isNaN(value)) {
					this.yMin = "auto";
				}
				else {
					this.yMin = value.toString();
				}

			},
		},

		yMax: {
			default: "auto",
			changed (change) {
				let { value } = change;

				if (value === "auto") {
					// `this.yMaxAsNumber` will become `undefined` (i.e., get a new value), and the chart will be re-rendered
					this._el.chart.style.removeProperty("--max-y");
				}
			},
			reflect: {
				from: "ymax",
			},
		},

		yMaxAsNumber: {
			get () {
				if (this.yMax === "coord") {
					let range = this.yResolved.refRange ?? this.yResolved.range ?? [0, 100];
					return range[1];
				}
				else if (this.yMax === "auto") {
					let maxY = this._el.chart.style.getPropertyValue("--max-y");

					if (maxY !== "") {
						return Number(maxY);
					}

					// Intermediate state (the chart is not rendered yet)
					return;
				}

				return Number(this.yMax);

			},
			set (value) {
				value = Number(value);

				if (Number.isNaN(value)) {
					this.yMax = "auto";
				}
				else {
					this.yMax = value.toString();
				}

			},
		},

		space: {
			default: "oklch",
			get () {
				return this.yResolved.space;
			},
		},

		info: {},
	};
};

Self.define();

export default Self;

function getAxis (min, max, initialSteps) {
	let range = max - min;
	let step = range / initialSteps;
	let magnitude = Math.floor(Math.log10(step));
	let base = Math.pow(10, magnitude);
	let candidates = [base, base * 2, base * 5, base * 10];

	for (let i = 0; i < candidates.length; i++) {
		if (candidates[i] > step) {
			step = candidates[i];
			break;
		}
	}

	let start = Math.floor(min / step) * step;
	let end = Math.ceil(max / step) * step;
	let steps = Math.round((end - start) / step);

	let ret = {min: start, max: end, step, steps};
	for (let prop in ret) {
		ret[prop] = +ret[prop].toPrecision(15);
	}
	return ret;
}

function normalizeAngles (angles) {
	// First, normalize
	angles = angles.map(h => ((h % 360) + 360) % 360);

	// Remove top and bottom 25% and find average
	let averageHue = angles.toSorted((a, b) => a - b).slice(angles.length / 4, -angles.length / 4).reduce((a, b) => a + b, 0) / angles.length;

	for (let i = 0; i < angles.length; i++) {
		let h = angles[i];
		let prevHue = angles[i - 1];
		let delta = h - prevHue;

		if (Math.abs(delta) > 180) {
			let equivalent = [h + 360, h - 360];
			// Offset hue to minimize difference in the direction that brings it closer to the average
			if (Math.abs(equivalent[0] - averageHue) <= Math.abs(equivalent[1] - averageHue)) {
				angles[i] = equivalent[0];
			}
			else {
				angles[i] = equivalent[1];
			}
		}
	}

	return angles;
}
