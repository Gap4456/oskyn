# Changelog

## 1.0.2 — 2026-11-19

- Prevented Simplify from changing active Shape Tween endpoints; optimized dense morph matching/subdivision and coalesced deformation drag updates.
- Added a persistent vector Deform frame with one-time curve flattening, projective corner dragging and grouped Shape Tween support.
- Added Text → Convert to paths using local static TTF/OTF files, with one object per letter and Undo.
- Added opt-in cross-layer invisibility masks, locked-layer immunity and inherited cut-edge strokes.
- Added Ctrl-click selection toggling and contrasting Node Edit group bounds.
- Added editor-only Hide/Show with a last-hidden-first-restored stack and a hidden-outline toggle.
- Added multi-object node editing and selected-anchor recording across vector objects.
- Improved node insertion, nearest-anchor picking, handle visibility and local straight-segment editing.
- Added compact Selection actions, symbol-only Preview and the None paint swatch.
- Improved desktop browser saving, selection contrast and repeated constraint notices.
- Updated the application and Electron package version to 1.0.2; project file format remains version 3.

Build your own Electron update from the repository root:

```cmd
npm.cmd --prefix desktop ci
npm.cmd --prefix desktop run build
```

The generated update is `desktop/dist/app.asar`. This repository does not include an Electron runtime or a prebuilt desktop installer. See [desktop/README.md](desktop/README.md).
