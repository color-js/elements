let specifier;

if (import.meta.resolve("colorjs.io")) {
	specifier = "colorjs.io";
}
else {
	specifier = "../node_modules/colorjs.io/dist/color.js";
}

export default await import(specifier);