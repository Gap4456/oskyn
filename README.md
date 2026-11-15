# oskyn

A browser-based vector animation editor developed by Gap4456 from Dylan Papp's Onionskyn. Draw vectors, edit nodes, animate keyframes, use Bone IK and soft-body controls, work with bitmap masks, and export animations.

## Run

Download this repository and open **oskyn.html** (or **index.html**) in a current Chromium-based browser. The application is self-contained; no server or build step is required to use it. Platform support for audio, video export and desktop colour picking can vary.

Save projects explicitly with **Save project** (`.oskyn.json`). Legacy Onionskyn/FlashCraft project formats remain supported. Browser project autosave and persistent application settings are disabled in this version.

## Develop

The editable source lives in [`source/src`](source/src). Build instructions and tests: [source/building.md](source/building.md).

```sh
cd source
npm install
npm run build
npx playwright install chromium
npm test
```

The build reproduces `index.html` and `oskyn.html` from source without changing the application version (`0.14.2-beta`). Edit the source and rebuild rather than editing generated HTML alone.

## Included features

- Vector drawing, corner and curve node editing, transforms and selection. Adding a node preserves existing curves.
- Timeline keyframes, Shape/Motion tweening and Hold-Q performance recording.
- Bone IK, soft-body deformation and coloured bone influence zones.
- Animated mirror controls and bitmap path cutting/masking. The Eraser creates editable bitmap masks without deleting the source pixels.
- Brush and Fluid Brush produce filled silhouettes with reduced node counts; pressure, taper and other Fluid settings remain available.
- Timeline end dragging to extend frames or trim empty trailing frames.
- Project saving and export, including a standalone HTML animation player.

## Known limitations

Bitmap masks can still show a thin seam in some edge-overlap situations. A separate animated covering/mask object can be used as a workaround. This is not claimed to be fixed. Tests cover selected workflows, not every feature or operating system.

## Desktop distribution

Electron wrappers and packaged executables are not included in this initial source repository. Keep desktop release ZIPs in GitHub Releases and include the original project and dependency licences with them.

## Origin and notices

Original project: [papptimus/Onionskyn](https://github.com/papptimus/Onionskyn), Copyright (c) 2026 Dylan Papp. Imported from the Onionskyn-main.zip supplied by the maintainer; this repository does not reproduce upstream Git history. The original MIT licence is preserved unchanged in [LICENSE](LICENSE). Additional notices and the existing Inkscape curve-dragging reference are documented in [THIRD-PARTY.md](THIRD-PARTY.md).

The original documentation and changelog are retained in [docs/upstream](docs/upstream) as historical references. Their names, shortcuts and build instructions may differ from this version. Report oskyn issues in this repository rather than to the original author's support address.

oskyn is not affiliated with Adobe or Inkscape.
