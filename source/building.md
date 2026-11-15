# Building oskyn

Requires Node.js 18 or newer. No dependencies are needed for the build itself.

```sh
cd source
node build.cjs
node build.cjs --check
```

`manifest.json` specifies the exact assembly order, including script tags and whitespace. The outputs are `../oskyn.html`, `../index.html`, and the ignored `dist/oskyn.html`. The build checks the syntax of all five inline scripts. `--check` verifies that the checked-in HTML matches the source byte for byte.

## Source layout

- `src/head.html`, `src/page.html` and the small HTML fragments: existing markup and styles.
- `src/vendor/`: original bundled libraries, including their existing headers.
- `src/core.js`: document model, interpolation, rendering, geometry and imports/exports.
- `src/runtime.js`: exported animation player.
- `src/app1.js`: editor setup, state, rendering and history, including the opening shared scope.
- `src/app2.js`: tools, input and editing operations.
- `src/app3.js`: timeline, properties, menus, saving/export, initialization and existing extensions, including the closing shared scope.

The three app parts are concatenated without adding separators. This preserves the current standalone file exactly; it is not a JavaScript module refactor.

## Browser regression checks

```sh
npm install
npx playwright install chromium
npm test
```

To use an installed Chromium instead, set `CHROMIUM_PATH` to its executable path. The active suites exercise timeline controls and end handles, node editing, sparse brush silhouettes, vector/bitmap erasing, bitmap cutting and masks, erased-mask Shape tween with anchored corners, Hold-Q recording, project Save/Open, and standalone-player rendering.

`test/legacy/` preserves tests and fixtures from the supplied upstream archive. They are historical references, not part of `npm test`; several rely on unavailable old fixtures or paths. No claim is made that the complete upstream suite passes.

Keep compatibility identifiers such as `FCCore`, `flashcraft.*` and `onionskynDesktop` unless performing a deliberate migration. The build does not touch any Electron wrapper.
