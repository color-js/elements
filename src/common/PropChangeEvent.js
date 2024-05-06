export default class PropChangeEvent extends CustomEvent {
	constructor (type, { name, prop, ...options } = {}) {
		super(type, options);

		this.name = name;
		this.prop = prop;
	}
}
