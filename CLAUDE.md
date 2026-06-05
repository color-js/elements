# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Color Elements is a web components library for working with color, built on [Color.js](https://colorjs.io/). Pure ESM, no bundler, no build step for the components themselves. The Eleventy build is only for the documentation site.

**Status:** Highly experimental — the API can change at any point.

## Commands

| Task | Command |
|---|---|
| Dev server (docs site) | `npm run serve` |
| Build docs site | `npm run build` |
| Lint | `npx eslint .` |
| Lint + fix | `npx eslint . --fix` |
| Install/update client deps | `npx nudeps` |

No test framework is set up — `npm test` exits with an error.

## Architecture

### Component Hierarchy

All components extend `ColorElement` (`src/common/color-element.js`), which extends `NudeElement` (from [nude-element](https://nude.js.org/)).

`NudeElement` provides the reactive props system, prop change callbacks, and custom element registration. `ColorElement` adds: shadow DOM setup, CSS loading, dependency tracking between components (`static dependencies`), loading states via CSS custom states (`:state(loading)`), and a shared `Color` class reference from colorjs.io.

### Component Pattern

Each component lives in `src/<name>/` and follows this structure:

```
src/color-swatch/
  color-swatch.js    # Component class
  color-swatch.css   # Shadow DOM styles
  index.html         # Demo/docs page (Eleventy template)
  README.md          # API docs
  color-swatch.webp  # Screenshot for main page
```

Non-obvious aspects of the component class pattern:
- `static globalStyles` — (optional) document-scope CSS, same loading pattern as `static styles`. Needed when a component slots light-DOM children and must style their `::part()` pseudo-elements — `::slotted()` can't chain with `::part()`, so those rules must live outside the shadow DOM. Currently used by `color-chart`. Components with global styles have two CSS files: `<name>-shadow.css` and `<name>-global.css`.
- Each component self-registers at module load via `Self.define()`

### Key Conventions

- Components are assigned to `const Self` and reference `Self` internally (not `this.constructor`)
- Shadow DOM elements are cached in `this._el` (by id/part) and `this._slots`
- CSS custom properties bridge shadow DOM styling (e.g., `--color`, `--progress`, `--details-style`)
- CSS custom states (`:state()`) expose component states for external styling
- `noOpTemplateTag` aliased as `css` for syntax highlighting of CSS-in-JS template literals

### Shared Utilities

- `src/common/util.js` — async helpers, step calculation, object utilities
- `src/common/dom.js` — shadow DOM element/slot querying helpers

### Dependency Management

[Nudeps](https://nudeps.dev) resolves bare module specifiers without a bundler. Dependencies are cached in `client_modules/` and mapped via `importmap.js` (auto-generated — do not edit). Run `npx nudeps` after changing dependencies.

### Documentation Site

Eleventy (`_build/eleventy.js`) builds the docs from component `index.html` files (Nunjucks templates) and `README.md` files. Component metadata lives in `data/components.json`. The main `README.md` is also a Nunjucks template (uses `{% for %}` loops over component data).

On component pages, `HTMLDemoElement.wrapAll()` (`assets/js/index.js`) automatically wraps every HTML code block in a live `<html-demo>` element. Do **not** wrap examples in `<html-demo>` manually in README files — it would double-wrap them.

## Code Style

Style is enforced by ESLint (`eslint.config.js`) and Prettier (`.prettierrc`) — read those for specifics. Run Prettier on modified files once at the end, not after every edit.

## Dependencies

| Package | Role |
|---|---|
| `colorjs.io` | Color manipulation, color spaces, gamut mapping |
| `nude-element` | Base web component class with reactive props system |

## Entry Points

- `index.js` — re-exports all components (named exports)
- `color-elements/<name>` — individual component via package exports
- `color-elements/<name>.css` — standalone CSS (CSS-only usage for some components)

## Maintaining This File

Keep this file in sync with the codebase. Update it when adding components, changing architecture, or modifying build/tooling — don't wait to be asked.
