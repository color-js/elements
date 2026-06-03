/**
 * Find the ranges of a progress interval where a color is outside a given gamut.
 *
 * Gamut membership is a property of the interpolated color, which CSS can't express, so it has to be
 * evaluated in JS. The color can enter and leave the gamut any number of times (e.g. along a hue
 * ramp), so we sample uniformly to bracket every transition, then bisect each bracket (where a single
 * crossing is assumed) to pin the exact boundary.
 *
 * @param {string} gamut - A color.js gamut id (e.g. "srgb", "p3", "rec2020").
 * @param {(progress: number) => import("colorjs.io").default} range - Returns the color at a given
 *   progress, e.g. an interpolation function.
 * @param {object} [options]
 * @param {number} [options.min=0] @param {number} [options.max=1] - The progress interval to scan.
 * @param {number} [options.samples=100] - Number of uniform samples used to *detect* transitions
 *   (precision comes from the bisection, not from this). There must be at least one sample inside
 *   every in/out run; a value of 1 (endpoints only) suffices when membership is monotone over the
 *   interval.
 * @returns {number[][] | null} Sorted `[start, end]` out-of-gamut ranges within `[min, max]` (empty
 *   if entirely in gamut), or null when there is no gamut to apply (unset or "none").
 */
export function getGamutBoundaries (gamut, range, { min = 0, max = 1, samples = 100 } = {}) {
	if (!gamut || gamut === "none") {
		return null;
	}

	let inGamut = progress => Boolean(range(progress)?.inGamut(gamut));
	let at = k => min + (k / samples) * (max - min);
	let startsInside = inGamut(min);

	// Find every in/out transition, refined to a precise position.
	let crossings = [];
	let previous = startsInside;

	for (let k = 1; k <= samples; k++) {
		let inside = inGamut(at(k));
		if (inside === previous) {
			continue;
		}

		let lo = at(k - 1);
		let hi = at(k);
		for (let iteration = 0; iteration < 16; iteration++) {
			let mid = (lo + hi) / 2;
			if (inGamut(mid) === previous) {
				lo = mid;
			}
			else {
				hi = mid;
			}
		}

		crossings.push(hi);
		previous = inside;
	}

	// Pair up the segments delimited by the crossings, keeping the out-of-gamut ones.
	let edges = [min, ...crossings, max];
	let ranges = [];
	let inside = startsInside;

	for (let i = 0; i < edges.length - 1; i++) {
		if (!inside) {
			ranges.push([edges[i], edges[i + 1]]);
		}
		inside = !inside;
	}

	return ranges;
}
