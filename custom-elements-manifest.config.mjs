function skipInternals () {
	// These class members (and also all private ones) are internal and should not be included in the manifest file
	const fields = ["innerHTML", "_el", "props", "events"];
	const methods = ["render", "handleEvent", "propChangedCallback"];

	let members = [...fields, ...methods];

	return {
		name: "color-elements-skip-internals-plugin",

		// Runs for each color element module; after the analysis phase, all information about the module is now available
		moduleLinkPhase ({ moduleDoc }) {
			let classes = moduleDoc.declarations?.filter(declaration => declaration.kind === "class") ?? [];

			for (let Class of classes) {
				if (!Class.members) {
					continue;
				}

				Class.members = Class.members.filter(member => member.privacy !== "private" && !members.includes(member.name));
			}
		},
	};
}

function addTagName () {
	return {
		name: "color-elements-tag-name-plugin",

		// Runs for each color element module
		analyzePhase ({ ts, node, moduleDoc, context }) {
			if (node.kind === ts.SyntaxKind.ClassDeclaration) {
				let className = node.name.getText();
				let Class = moduleDoc.declarations.find(declaration => declaration.name === className);

				if (!Class) {
					return;
				}

				for (let member of node.members) {
					let name = member.name?.getText();

					if (name === "tagName") { // static tagName = "..."
						let tagName = member.initializer?.text;
						if (tagName) {
							Class.tagName = tagName;
						}
					}
				}
			}
		},
	};
}

function defineProps () {
	return {
		name: "color-elements-define-props-plugin",

		// Runs for each color element module
		analyzePhase ({ ts, node, moduleDoc, context }) {
			if (node.kind === ts.SyntaxKind.ClassDeclaration) {
				let className = node.name.getText();
				let Class = moduleDoc.declarations.find(declaration => declaration.name === className);

				if (!Class) {
					return;
				}

				for (let member of node.members) {
					let name = member.name?.getText();

					if (name === "props") { // static props = { ... }
						let classProps = [];

						let props = member.initializer?.properties ?? [];
						props = props.filter(prop => prop.jsDoc?.length); // we are interested in props with JSDoc only (it's a flag that they should be added to the manifest)

						for (let prop of props) {
							let propName = prop.name.getText();
							let spec = prop.initializer?.properties ?? [];
							let jsDoc = prop.jsDoc[0]; // all info about the prop should be in the first JSDoc block
							let tags = jsDoc.tags;
							let description = jsDoc.comment ?? ""; // the prop description is provided without a tag

							let ret = { kind: "field", name: propName, description };

							// === Type ===
							// Find the prop type (if any) in the @type tag
							let type = tags?.find(tag => tag.tagName.getText() === "type")?.typeExpression?.type.getText() ?? "";
							if (!type) {
								// If the @type tag is not provided, try to get the type from the prop's spec
								let typeProp = spec.find(prop => prop.name.getText() === "type");
								type = typeProp?.initializer?.getText() ?? "";
							}

							if (type) {
								ret.type = { text: type };
							}

							// === Default ===
							// Find the prop default value (if any) in the @default tag
							let defaultValue = tags?.find(tag => tag.tagName.getText() === "default")?.comment ?? "";
							if (!defaultValue) {
								// If the @default tag is not provided, try to get the default value from the prop's spec (if it's not a function)
								let defaultProp = spec.find(prop => prop.name.getText() === "default" && (prop.initializer?.kind !== ts.SyntaxKind.ArrowFunction));
								let kind = defaultProp?.initializer?.kind;
								if (kind === ts.SyntaxKind.NumericLiteral) {
									defaultValue = Number(defaultProp?.initializer?.text);
								}
								else if (kind === ts.SyntaxKind.StringLiteral) {
									defaultValue = defaultProp?.initializer?.text ?? "";
								}
								else {
									defaultValue = defaultProp?.initializer?.getText() ?? "";
								}
							}

							if (defaultValue) {
								ret.default = defaultValue;
							}

							// === Reflect ===
							let reflect;
							let reflectProp = spec.find(prop => prop.name.getText() === "reflect");

							// By default, reflect is true unless get is also specified, in which case it defaults to false
							if (!reflectProp && !spec.find(prop => prop.name.getText() === "get")) {
								reflect = true;
							}
							else if (reflectProp) {
								let kind = reflectProp.initializer?.kind;
								if (kind === ts.SyntaxKind.TrueKeyword) {
									// Reflect to/from an attribute with the same name as the prop
									reflect = true;
								}
								else if (kind === ts.SyntaxKind.StringLiteral) {
									// Reflect to/from an attribute with the given name
									reflect = reflectProp.initializer.text;
								}
								else if (kind === ts.SyntaxKind.ObjectLiteralExpression) {
									let from = reflectProp.initializer.properties.find(prop => prop.name.getText() === "from");
									let fromKind = from.initializer.kind;
									if (fromKind === ts.SyntaxKind.StringLiteral) {
										// Reflect from an attribute with the given name
										reflect = from.initializer.text;
									}
									else if (fromKind === ts.SyntaxKind.TrueKeyword) {
										// Reflect from an attribute with the same name as the prop
										reflect = true;
									}
								}
							}

							if (reflect) {
								ret.reflects = true;
								ret.attribute = typeof reflect === "boolean" ? propName : reflect;
							}

							classProps.push(ret);
						}

						if (classProps.length) {
							(Class.members ??= []).push(...classProps);
						}
					}
				}
			}
		},
	};
}

function defineEvents () {
	return {
		name: "color-elements-define-events-plugin",

		// Runs for each color element module
		analyzePhase ({ ts, node, moduleDoc, context }) {
			if (node.kind === ts.SyntaxKind.ClassDeclaration) {
				let className = node.name.getText();
				let Class = moduleDoc.declarations.find(declaration => declaration.name === className);

				if (!Class) {
					return;
				}

				for (let member of node.members) {
					let name = member.name?.getText();

					if (name === "events") { // static events = { ... }
						let events = member.initializer?.properties ?? [];
						let classEvents = [];

						for (let event of events) {
							let eventName = event.name.getText();
							let jsDoc = event.jsDoc;

							if (!jsDoc?.length) {
								// Event doesn't have JSDoc, so we can't get any information about it, except its name
								classEvents.push({ name: eventName });
								continue;
							}

							jsDoc = jsDoc[0]; // all info about the event should be in the first JSDoc block
							let description = jsDoc?.comment ?? ""; // the event description is provided without a tag

							// Find the event type (if any) in the @type tag
							let tags = jsDoc.tags;
							let type = tags?.find(tag => tag.tagName.getText() === "type")?.typeExpression?.type.getText() ?? "";

							let ret = { name: eventName, description };
							if (type) {
								ret.type = { text: type };
							}
							classEvents.push(ret);
						}

						if (classEvents.length) {
							// We define the events described in the events property only.
							// We can use the comment line below if we are interested in all events (including those dispatched with this.dispatchEvent).
							// (Class.events ??= []).push(...classEvents);
							Class.events = classEvents;
						}
					}
				}
			}
		},
	};
}

function defineAttributes () {
	return {
		name: "color-elements-define-attributes-plugin",

		// Runs for each color element module; after the analysis phase, all information about the module is now available
		moduleLinkPhase ({ moduleDoc }) {
			let classes = moduleDoc.declarations?.filter(declaration => declaration.kind === "class") ?? [];

			for (let Class of classes) {
				if (!Class.members) {
					continue;
				}

				let props = Class.members.filter(member => member.reflects);
				for (let prop of props) {
					let {attribute: name, default: defaultValue, name: fieldName} = prop;
					let ret = { name, type: {text: "string"}, fieldName };
					if (defaultValue !== undefined) {
						ret.default = defaultValue;
					}

					(Class.attributes ??= []).push(ret);
				}
			}
		},
	};
}

export default {
	globs: ["src/**/*.js"],
	exclude: ["src/common", "src/*.njk"],
	outdir: ".",
	plugins: [addTagName(), defineProps(), defineEvents(), skipInternals(), defineAttributes()],
};
