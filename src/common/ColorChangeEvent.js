export default class ColorChangeEvent extends CustomEvent {
	constructor (type, { color, ...options } = {}) {
		super(type, options);

		this.color = color;
	}
}