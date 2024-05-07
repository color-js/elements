/**
 * Base class for all elements
 */
import Props from "../common/Props.js";
import defineFormAssociated from "./defineFormAssociated.js";
import defineEvents from "./defineEvents.js";

const Self = class NudeElement extends HTMLElement {
	static postConstruct = [];
	#initialized = false;

	constructor () {
		super();
		this.constructor.init();

		if (this.propChangedCallback && this.constructor.props) {
			this.addEventListener("propchange", this.propChangedCallback);
		}

	}

	connectedCallback () {
		if (!this.#initialized) {
			this.initializeProps?.();

			this.#initialized = true;
		}
	}


	static init () {
		// One time stuff
		if (this._initialized) {
			return;
		}

		if (this.events) {
			defineEvents(this)
		}

		if (this.props) {
			Props.create(this);
		}

		if (this.formAssociated) {
			defineFormAssociated(this);
		}

		this._initialized = true;
	}
}

export default Self;