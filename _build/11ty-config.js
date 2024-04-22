import { exec } from 'child_process';

const SOURCE_REPO = "https://github.com/color-js/color.js";
const PATHS_TO_COPY = [
	"_includes",
	"_data",
	"_build/eleventy.js"
];

let commands = [
	`git clone ${ SOURCE_REPO } _build/colorjs.io-temp`,
	...PATHS_TO_COPY.map(path => `cp -r _build/colorjs.io-temp/${ path } ../${ path }`),
	"rm -rf _build/colorjs.io-temp"
];

exec(commands.join(" && "), (err, stdout, stderr) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	else {
		console.log(stdout);
	}
});