import { exec } from 'child_process';
import { writeFileSync, readFileSync } from "fs";
import config from "./copy-config.json" with { type: "json" };

const TEMP_REPO = "_build/.colorjs.io";

// Cleanup past attempts
exec(`rm -rf ${ TEMP_REPO }`);

// Copy files from source repo
let commands = [
	`git clone ${ config.source } ${ TEMP_REPO }`,
	...config.paths.map(path => {
		let [current_path, new_path] = Array.isArray(path) ? path : [path, path];
		let new_path_dir = new_path.split("/").slice(0, -1).join("/");

		let commands = [
			`rm -rf ./${new_path}`,
			`cp -r ${TEMP_REPO}/${ current_path } ./${ new_path }`,
		];

		if (new_path_dir) {
			commands.splice(1, 0, `mkdir -p ./${new_path_dir}`);
		}

		return commands.join(" && ");
	}),
];

await new Promise(resolve => {
	exec(commands.join(" && "), (err, stdout, stderr) => {
		// Cleanup
		exec(`rm -rf ${ TEMP_REPO }`);

		if (err) {
			console.error(err);
			process.exit(1);
		}
		else {
			console.log(stdout);
			resolve();
		}
	});
});

// Make sure copied paths are in .gitignore
let gitignore = readFileSync(".gitignore", "utf8").split("\n");
let paths_added_to_gitignore = [];
let index;

for (let path of config.paths) {
	let [current_path, new_path] = Array.isArray(path) ? path : [path, path];
	let i = gitignore.indexOf(new_path);
	if (i > -1) {
		index = i;
	}
	else { // not found
		gitignore.push(new_path);
		paths_added_to_gitignore.push(new_path);
	}
}

if (paths_added_to_gitignore.length > 0) {
	writeFileSync(".gitignore", gitignore.join("\n"));
	console.log("Added paths to .gitignore: " + paths_added_to_gitignore.join(", "));
}

let source_package_json = JSON.parse(readFileSync(`${ TEMP_REPO }/package.json`, "utf8"));
let package_json = JSON.parse(readFileSync(`package.json`, "utf8"));

// Copy npm scripts
let scripts_copied = [];

for (let script of config.scripts) {
	if (source_package_json.scripts[script] && package_json.scripts[script] !== source_package_json.scripts[script]) {
		package_json.scripts[script] = source_package_json.scripts[script];
		scripts_copied.push(script);
	}
}

if (scripts_copied.length > 0) {
	console.warn("Copying npm scripts: " + scripts_copied.join(", "));
	writeFileSync("package.json", JSON.stringify(package_json, null, 2));
}

// Install missing packages
if (source_package_json.devDependencies) {
	let missing_packages = [];

	for (let name of config.packages) {
		if (source_package_json.devDependencies[name] && !package_json.devDependencies?.[name]) {
			missing_packages.push(name);
		}
	}

	if (missing_packages.length) {
		console.warn(`Installing packages: ${ missing_packages.join(", ") }`);
		exec(`npm install -D ${ missing_packages.join(" ") }`);
	}
}