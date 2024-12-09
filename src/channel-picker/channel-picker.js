import ColorElement from "../common/color-element.js";
import "../space-picker/space-picker.js";
import * as dom from "../common/dom.js";

const Self = class ChannelPicker extends ColorElement {
	static tagName = "channel-picker";
	static url = import.meta.url;
	static shadowStyle = true;
	static shadowTemplate = `
		<space-picker part="color-space" exportparts="base: color-space-base" id="space_picker"></space-picker>
		<select id="picker" part="color-channel-base"></select>`;

	constructor () {
		super();

		this._el = dom.named(this);

		// We need to start listening for this event as soon as the <space-picker> is created
		this._el.space_picker.addEventListener("spacechange", this);

		// We need to render the picker as soon as possible so as not to choke on invalid initial values
		this.#render();
	}

	connectedCallback () {
		super.connectedCallback?.();

		this._el.picker.addEventListener("change", this);
	}

	disconnectedCallback () {
		super.disconnectedCallback?.();

		this._el.space_picker.removeEventListener("spacechange", this);
		this._el.picker.removeEventListener("change", this);
	}

	get selectedSpace () {
		return this._el.space_picker.selectedSpace;
	}

	get selectedChannel () {
		return this.selectedSpace.coords?.[this._el.picker.value];
	}

	/**
	 * Previously selected channels for each space.
	 * Keys are space IDs. Values are coords.
	 */
	#history = {};

	#render () {
		let space = this.selectedSpace;
		let coords = space.coords;

		if (space && !coords) {
			console.warn(`Color space "${ space.name }" has no coordinates.`);
			return;
		}

		this._el.picker.innerHTML = Object.entries(coords)
			.map(([id, coord]) => `<option value="${ id }">${ coord.name }</option>`)
			.join("\n");

		let [prevSpace, prevChannel] = this.value?.split(".") ?? [];
		if (prevSpace && prevChannel) {
			let prevChannelName = this._el.space_picker.spaces[prevSpace].coords[prevChannel].name;
			let currentChannelName = coords[prevChannel]?.name;
			if (prevChannelName === currentChannelName) {
				// Preserve the channel if it exists in the new space and has the same name ("b" in "oklab" is not the same as "b" in "p3")
				this._el.picker.value = prevChannel;
			}
			else if (this.#history?.[space.id]) {
				// Otherwise, try to restore the last channel used
				this._el.picker.value = this.#history[space.id];
			}
		}
	}

	handleEvent (event) {
		if (event.type === "spacechange") {
			this.#render();
		}

		if ([this._el.space_picker, this._el.picker].includes(event.target)) {
			let value = `${ this._el.space_picker.value }.${ this._el.picker.value }`;
			if (value !== this.value) {
				this.value = value;
			}
		}
	}

	propChangedCallback ({name, prop, detail: change}) {
		if (name === "value" && this.value) {
			let [space, channel] = (this.value + "").split(".");

			let currentSpace = this._el.space_picker.value;
			let currentCoord = this._el.picker.value;
			let currentValue = `${ currentSpace }.${ currentCoord }`;

			if (!space || !channel) {
				console.warn(`Invalid value "${ this.value }". Expected format: "space.channel". Falling back to "${ currentValue }".`);
				this.value = currentValue;
			}
			else {
				let spaces = Object.keys(this._el.space_picker.spaces);

				if (!spaces.includes(space)) {
					console.warn(`No "${ space }" color space found. Choose one of the following: ${ spaces.join(", ") }. Falling back to "${ currentSpace }".`);
					this.value = currentValue;
				}
				else {
					if (currentSpace !== space) {
						this._el.space_picker.value = space;
					}

					if (currentCoord && currentCoord !== channel) {
						let coords = Object.keys(this.selectedSpace.coords ?? {});

						if (coords.includes(channel)) {
							this._el.picker.value = channel;
						}
						else {
							currentCoord = coords.includes(currentCoord) ? currentCoord : coords[0];

							let message = `Color space "${ space }" has no coordinate "${ channel }".`;
							if (coords.length) {
								message += ` Choose one of the following: ${ coords.join(", ") }.`;
							}
							message += ` Falling back to "${ currentCoord }".`;
							console.warn(message);
							this.value = `${ space }.${ currentCoord }`;
							channel = currentCoord;
						}
					}

					this.#history[space] = channel;
				}
			}
		}
	}

	static props = {
		value: {
			default: "oklch.l",
		},
	};

	static events = {
		change: {
			from () {
				return [this._el.space_picker, this._el.picker];
			},
		},
		input: {
			from () {
				return [this._el.space_picker, this._el.picker];
			},
		},
		valuechange: {
			propchange: "value",
		},
	};
};

Self.define();

export default Self;
