import ColorElement from "../common/color-element.js";
import { getStep } from "../common/util.js";

// Radial resolution of the painted disc: concentric layers whose outer edge maps
// to their channel value. More layers = smoother radial banding. Only repainted
// when the space / channel / held coord change — never during a drag.
const LAYERS = 60;

// Hue waypoints per gradient. With native interpolation the space draws the hue
// arc itself, so a few cardinal stops suffice; with the oklch fallback we sample
// more finely so the (approximate) arc stays smooth.
const STOPS = { native: 6, fallback: 12 };

/** Does CSS interpolate gradients in this space? (oklch/lch/hsl/hwb today.) */
function supportsInterp (cssId) {
	return CSS?.supports("background", `conic-gradient(in ${cssId}, red, tan)`);
}

const Self = class HueWheel extends ColorElement {
	static tagName = "hue-wheel";
	static url = import.meta.url;
	static styles = import("./hue-wheel.css", { with: { type: "css" } }).catch(
		() => new URL("./hue-wheel.css", import.meta.url),
	);
	static globalStyles = import("./hue-wheel-global.css", { with: { type: "css" } }).catch(
		() => new URL("./hue-wheel-global.css", import.meta.url),
	);
	static shadowTemplate = `
		<div id="wheel" part="wheel">
			<div id="disc" part="disc"></div>
			<div id="marker" part="marker" hidden tabindex="0" role="slider" aria-label="Color"></div>
			<slot></slot>
		</div>`;

	constructor () {
		super();

		this._el = {
			wheel: this.shadowRoot.getElementById("wheel"),
			disc: this.shadowRoot.getElementById("disc"),
			marker: this.shadowRoot.getElementById("marker"),
			slot: this.shadowRoot.querySelector("slot"),
		};
	}

	connectedCallback () {
		super.connectedCallback?.();

		for (let type of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
			this._el.wheel.addEventListener(type, this);
		}
		this._el.marker.addEventListener("keydown", this);

		// Slotted <color-swatch>/<color-scale> are the extra points. Re-place them
		// when the set changes or when a scale recomputes its colors.
		this._el.slot.addEventListener("slotchange", this);
		this._el.wheel.addEventListener("colorschange", this, { capture: true });
		this._el.wheel.addEventListener("colorchange", this, { capture: true });
	}

	disconnectedCallback () {
		super.disconnectedCallback?.();
		this.#dragging = false;

		for (let type of ["pointerdown", "pointermove", "pointerup", "pointercancel"]) {
			this._el.wheel.removeEventListener(type, this);
		}
		this._el.marker.removeEventListener("keydown", this);
		this._el.slot.removeEventListener("slotchange", this);
		this._el.wheel.removeEventListener("colorschange", this, { capture: true });
		this._el.wheel.removeEventListener("colorchange", this, { capture: true });
	}

	// ───────────────────────── Coordinate model (from metadata) ─────────────────────────

	/**
	 * The resolved color space. Always polar: non-polar values are rejected by
	 * `spaceId`'s converter (and the `space` setter), so this never throws and is
	 * safe to read from any render path.
	 */
	get space () {
		return Self.Color.Space.get(this.spaceId);
	}

	set space (value) {
		let space = value instanceof Self.Color.Space ? value : Self.Color.Space.get(value);
		this.spaceId = Self.assertPolar(space).id;
	}

	/** Guard that a space is polar (has a hue axis); throws otherwise. */
	static assertPolar (space) {
		if (!space?.isPolar) {
			throw new TypeError(`<hue-wheel>: color space "${space?.id}" is not polar.`);
		}
		return space;
	}

	/**
	 * The wheel's axis assignment for the current space + channel: which coord is
	 * the hue (angular axis), which is the radial channel (or null), and which are
	 * held constant — plus each one's value range. Derived from space metadata and
	 * cached, since some render paths read it hundreds of times per paint; it only
	 * changes when `spaceId` or `channel` does.
	 */
	get axes () {
		let key = `${this.spaceId}|${this.channel ?? ""}`;
		if (key !== this.#axesKey) {
			this.#axesKey = key;
			this.#axes = this.#computeAxes();
		}
		return this.#axes;
	}

	#axes = null;
	#axesKey = null;

	#computeAxes () {
		let coords = this.space.coords;
		let ids = Object.keys(coords);
		// A coord reduced to what the wheel needs: its id, name and value range.
		let meta = (id, coord = coords[id]) => ({
			id,
			name: coord.name ?? id,
			type: coord.type,
			range: coord.refRange ?? coord.range ?? [0, 100],
		});

		// A polar space always has exactly one angle coord.
		let hue = meta(ids.find(id => coords[id].type === "angle"));

		let channel = null;
		if (this.channel) {
			try {
				let coord = Self.Color.Space.resolveCoord(this.channel, this.space);
				if (coord.type === "angle") {
					console.warn(
						`<hue-wheel> channel "${this.channel}" is the hue and can't be the radial axis.`,
					);
				}
				else {
					channel = meta(coord.id, coord);
				}
			}
			catch (error) {
				console.warn(`<hue-wheel> ${error.message}`);
			}
		}

		let exclude = new Set([hue.id, channel?.id]);
		let held = ids.filter(id => !exclude.has(id)).map(id => meta(id));

		return { hue, channel, held, order: ids };
	}

	/** The angle coord — the angular axis. */
	get hueCoord () {
		return this.axes.hue;
	}

	/** The radial-axis coord, or null when `channel` is unset/invalid. */
	get channelCoord () {
		return this.axes.channel;
	}

	/** Coords that are neither hue nor channel — held constant, sourced from `color`. */
	get heldCoords () {
		return this.axes.held;
	}

	/** A coord's value: from `color` when present, else the midpoint of its range. */
	#valueOf (coord) {
		if (this.color) {
			return this.color.get(coord.id);
		}

		let [min, max] = coord.range;
		return (min + max) / 2;
	}

	// ───────────────────────── Building colors ─────────────────────────

	/** Ordered coord array for `new Color(space, …)` from an `{id: value}` map. */
	#coordArray (values) {
		return this.axes.order.map(id => values[id]);
	}

	/** A fresh color at the held coords' current values + given hue/channel. */
	#colorAt (hue, channel) {
		let values = {};
		for (let coord of this.heldCoords) {
			values[coord.id] = this.#valueOf(coord);
		}
		values[this.hueCoord.id] = hue;
		if (this.channelCoord) {
			values[this.channelCoord.id] = channel;
		}
		return new Self.Color(this.space, this.#coordArray(values));
	}

	/**
	 * Write a single coord, producing a new Color so change-detection fires.
	 * No-op without a color: hueValue/channelValue describe the current color, and
	 * `#fromPointer` is the only path that creates one from nothing.
	 */
	#setCoord (id, value) {
		if (this.readonly || !this.color) {
			return;
		}

		let color = this.color.clone();
		color.set(id, value);
		this.color = color;
	}

	// ───────────────────────── Rendering ─────────────────────────

	updated ({ changed }) {
		if (changed.has("spaceId")) {
			// Keep `color` in this.space.
			if (this.color && !this.color.space.equals(this.space)) {
				this.color = this.color.to(this.space);
			}
		}

		if (changed.has("spaceId") || changed.has("channel")) {
			this.#updateGeometry();
		}

		if (changed.has("spaceId") || changed.has("channel") || changed.has("color")) {
			// Repaint the disc only when its inputs (space, channel, held values) move.
			let key = this.#discKey();
			if (key !== this.#discKeyCache) {
				this.#discKeyCache = key;
				this.#renderDisc();
			}

			this.#updateMarker();
		}

		if (changed.has("readonly")) {
			this.#updateMarker();
		}
	}

	/** Reflect the channel axis into CSS and switch between disc and ring modes. */
	#updateGeometry () {
		let channel = this.channelCoord;
		this._el.wheel.classList.toggle("ring", !channel);
		// Host attribute so global styles can place slotted points on the ring.
		this.toggleAttribute("ring", !channel);

		if (channel) {
			let [min, max] = channel.range;
			this.style.setProperty("--channel-min", min);
			this.style.setProperty("--channel-max", max);
		}

		this.#placePoints();
	}

	/** Identity of the painted disc: repaint only when this string changes. */
	#discKey () {
		let held = this.heldCoords.map(c => this.#valueOf(c)).join(",");
		return `${this.space.id}|${this.channelCoord?.id ?? ""}|${held}`;
	}

	#discKeyCache = null;

	/**
	 * Paint the hue field. With a channel: LAYERS concentric conic-gradient discs,
	 * each at its own channel value, the outer-most largest (like the gamut app).
	 * Without one: a single conic-gradient, masked to a ring in CSS.
	 */
	#renderDisc () {
		let cssId = this.space.cssId;
		let native = supportsInterp(cssId);
		let interp = native ? cssId : "oklch";
		let stops = native ? STOPS.native : STOPS.fallback;
		let channel = this.channelCoord;

		// The held coords are constant across the whole disc — compute them once.
		let base = {};
		for (let coord of this.heldCoords) {
			base[coord.id] = this.#valueOf(coord);
		}

		if (!channel) {
			this._el.disc.replaceChildren();
			this._el.disc.style.background = this.#gradient(base, interp, stops);
			return;
		}

		this._el.disc.style.background = "";
		let [min, max] = channel.range;
		let layers = this.#ensureLayers();

		for (let i = 0; i < LAYERS; i++) {
			// Layer 0 is the outer edge (channel max); inner layers paint on top.
			let fraction = (LAYERS - i) / LAYERS;
			let value = min + fraction * (max - min);
			layers[i].style.setProperty("--fraction", fraction);
			layers[i].style.background = this.#gradient(
				{ ...base, [channel.id]: value },
				interp,
				stops,
			);
		}
	}

	#ensureLayers () {
		let disc = this._el.disc;
		while (disc.children.length < LAYERS) {
			disc.append(Object.assign(document.createElement("div"), { className: "layer" }));
		}
		while (disc.children.length > LAYERS) {
			disc.lastElementChild.remove();
		}
		return disc.children;
	}

	/**
	 * A `conic-gradient(...)` sweeping hue, with all non-hue coords fixed by `base`.
	 * Hue 0° sits at 3 o'clock and runs counter-clockwise — matching the pointer math.
	 */
	#gradient (base, interp, stops) {
		let hueId = this.hueCoord.id;
		let parts = [];
		for (let k = 0; k <= stops; k++) {
			let g = (k / stops) * 360; // gradient angle
			let h = (360 - g) % 360; // math hue at that angle
			let color = new Self.Color(this.space, this.#coordArray({ ...base, [hueId]: h }));
			parts.push(`${color.display()} ${g}deg`);
		}

		return `conic-gradient(from 90deg in ${interp}, ${parts.join(", ")})`;
	}

	/** Position the marker from the current color and toggle its visibility/editability. */
	#updateMarker () {
		let marker = this._el.marker;
		let color = this.color;

		marker.hidden = !color;
		if (!color) {
			return;
		}

		marker.style.setProperty("--hue", `${this.hueValue ?? 0}deg`);
		if (this.channelCoord) {
			marker.style.setProperty("--channel", this.channelValue);
		}
		marker.style.background = color.display();

		// Expose the hue as the slider value. The radial axis isn't a second slider
		// yet (a known a11y gap), so fold its value into aria-valuetext alongside the
		// hue so screen-reader users still hear what ↑↓ changes.
		let [hueMin, hueMax] = this.hueCoord.range;
		marker.setAttribute("aria-valuemin", hueMin);
		marker.setAttribute("aria-valuemax", hueMax);
		marker.setAttribute("aria-valuenow", Math.round(this.hueValue ?? 0));

		let valueText = `${this.hueCoord.name} ${Math.round(this.hueValue ?? 0)}`;
		if (this.channelCoord) {
			valueText += `, ${this.channelCoord.name} ${+this.channelValue.toPrecision(3)}`;
		}
		marker.setAttribute("aria-valuetext", valueText);

		let editable = !this.readonly;
		// Editable marker is in the tab order; read-only is still programmatically
		// focusable (so its value is exposed) but skipped by Tab.
		marker.setAttribute("tabindex", editable ? "0" : "-1");
		marker.setAttribute("aria-readonly", String(!editable));
	}

	// ───────────────────────── Extra points (slotted swatches) ─────────────────────────

	/** Place every slotted point (and wire its tooltip) from its color's hue/channel. */
	#placePoints () {
		for (let el of this._el.slot.assignedElements()) {
			if (el.localName === "color-swatch") {
				this.#placeSwatch(el);
			}
			else if (el.localName === "color-scale") {
				// NOTE reaches into color-scale's private swatches (same as color-chart).
				// A scale's first slotchange precedes its colors; the colorschange
				// capture listener re-places once they're computed.
				for (let swatch of el._el?.swatches.children ?? []) {
					this.#placeSwatch(swatch);
				}
			}
		}
	}

	#placeSwatch (swatch) {
		let color = swatch.color;
		if (!color) {
			return;
		}

		color = color.to(this.space);
		swatch.style.setProperty("--hue", `${color.get(this.hueCoord.id) || 0}deg`);
		if (this.channelCoord) {
			swatch.style.setProperty("--channel", color.get(this.channelCoord.id));
		}
	}

	// ───────────────────────── Interaction ─────────────────────────

	#dragging = false;

	handleEvent (event) {
		switch (event.type) {
			case "slotchange":
			case "colorschange":
			case "colorchange":
				this.#placePoints();
				return;
			case "keydown":
				this.#onKey(event);
				return;
		}

		// Pointer events below — all suppressed while read-only.
		if (this.readonly) {
			return;
		}

		switch (event.type) {
			case "pointerdown":
				if (event.button !== 0) {
					return;
				}
				event.preventDefault();
				this.#dragging = true;
				// Capture only for the drag, so slotted points still get their own
				// hover events (for their tooltips) the rest of the time.
				this._el.wheel.setPointerCapture(event.pointerId);
				this.#fromPointer(event);
				this.#emit("input");
				break;
			case "pointermove":
				if (this.#dragging) {
					this.#fromPointer(event);
					this.#emit("input");
				}
				break;
			case "pointerup":
			case "pointercancel":
				if (this.#dragging) {
					this.#dragging = false;
					this._el.wheel.releasePointerCapture?.(event.pointerId);
					this.#emit("change");
				}
				break;
		}
	}

	/** Map a pointer position to hue (angle) + channel (radius) and commit them. */
	#fromPointer (event) {
		let rect = this._el.wheel.getBoundingClientRect();
		let radius = rect.width / 2;
		let dx = event.clientX - rect.left - radius;
		let dy = event.clientY - rect.top - radius;
		let r = Math.min(Math.hypot(dx, dy) / radius, 1);
		let hue = (Math.atan2(-dy, dx) * 180) / Math.PI;
		hue = (hue + 360) % 360;

		let channel = this.channelValue;
		if (this.channelCoord) {
			let [min, max] = this.channelCoord.range;
			channel = min + r * (max - min);
		}

		this.color = this.#colorAt(hue, channel);
	}

	/** Arrow keys nudge the focused marker: ←→ hue, ↑↓ channel. */
	#onKey (event) {
		if (this.readonly || !this.color) {
			return;
		}

		let hueCoord = this.hueCoord;
		let channelCoord = this.channelCoord;
		let hueStep = getStep(...hueCoord.range);
		let delta = event.shiftKey ? 10 : 1;
		let handled = true;

		switch (event.key) {
			case "ArrowRight":
				this.hueValue = (this.hueValue + hueStep * delta) % 360;
				break;
			case "ArrowLeft":
				this.hueValue = (this.hueValue - hueStep * delta + 360) % 360;
				break;
			case "ArrowUp":
			case "ArrowDown": {
				if (!channelCoord) {
					handled = false;
					break;
				}
				let [min, max] = channelCoord.range;
				let step = getStep(min, max) * delta * (event.key === "ArrowUp" ? 1 : -1);
				this.channelValue = Math.max(min, Math.min(max, this.channelValue + step));
				break;
			}
			default:
				handled = false;
		}

		if (handled) {
			event.preventDefault();
			this.#emit("input");
			this.#emit("change");
		}
	}

	#emit (type) {
		this.dispatchEvent(new Event(type, { bubbles: true }));
	}

	static props = {
		spaceId: {
			default: "oklch",
			// Resolve and validate here so `get space()` (read from every render path)
			// always sees a known, polar space. Non-polar or unknown values are
			// rejected with a warning, keeping the previous space.
			convert (value) {
				if (value === null || value === undefined) {
					return value;
				}

				let space;
				try {
					space = value instanceof Self.Color.Space ? value : Self.Color.Space.get(value);
				}
				catch (error) {
					console.warn(`<hue-wheel>: ${error.message}`);
					return this.spaceId ?? "oklch";
				}

				if (!space.isPolar) {
					console.warn(`<hue-wheel>: color space "${space.id}" is not polar; ignoring.`);
					return this.spaceId ?? "oklch";
				}

				return space.id;
			},
			reflect: { from: "space" },
		},

		channel: {
			default: null,
			convert (value) {
				return value == null || value === "" ? null : value + "";
			},
		},

		color: {
			get type () {
				return Self.Color;
			},
			default: null,
			convert (color) {
				if (!color) {
					return null;
				}
				color = color instanceof Self.Color ? color : Self.Color.get(color);
				return color.space.equals(this.space) ? color : color.to(this.space);
			},
			reflect: { from: true },
		},

		hueValue: {
			type: Number,
			get () {
				return this.color?.get(this.hueCoord.id);
			},
			set (value) {
				this.#setCoord(this.hueCoord.id, value);
			},
			dependencies: ["color", "spaceId"],
			reflect: false,
		},

		channelValue: {
			type: Number,
			get () {
				return this.channelCoord ? this.color?.get(this.channelCoord.id) : undefined;
			},
			set (value) {
				if (this.channelCoord) {
					this.#setCoord(this.channelCoord.id, value);
				}
			},
			dependencies: ["color", "spaceId", "channel"],
			reflect: false,
		},

		readonly: {
			parse (value) {
				return value === "" || value === "readonly" || value === true || value === "true";
			},
			default: false,
			reflect: { from: true },
		},
	};

	static events = {
		colorchange: {
			propchange: "color",
		},
	};
};

Self.define();

export default Self;
