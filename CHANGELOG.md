# Changelog

## Unreleased

- Draw regular Stars without holding Shift, reorder the tool palette, and simplify the Skew icon to a plain parallelogram.

- Defaulted the desktop toolbar to two columns and added a dedicated lightweight vector Skew tool with unchanged node topology, gradients, group support and single-drag Undo.
- Added desktop Timeline edge resizing, conditional striped grip, full collapse/expansion and double-click reset without changing canvas view.
- Expanded the in-page script editor to support frame and instance scripts, large scrolling code pages, live shared edits and ActionScript-aware syntax checking.

## 1.0.3 — 2026-11-20

- Added Deform frame beside Mirror: one-time curve flattening, projective corner dragging, persistent editor guides and Shape Tween for paths inside groups. Removing the frame preserves the deformed vector artwork.
- Protected incoming/outgoing Shape Tween endpoints from Simplify, optimized dense node matching and subdivision, and coalesced deformation pointer updates.
- Added opt-in cross-layer Invisibility Mask and cut-edge strokes, with recipient locked-layer immunity and consistent Preview/export behaviour. Widened the exact stroke-width field.
- Added Text → Convert to paths with local static TTF/OTF files, separate letter objects and Undo; Electron can automatically find matching installed fonts.
- Added Duplicate as unique and Duplicate with nested symbols, preserving shared references within each copied symbol graph and one-step Undo.
- Added Ctrl-click selection toggling, contrasting Node Edit group bounds and taller symbol action buttons.
- Updated application and Electron package metadata to 1.0.3. Project file format remains version 3; existing projects stay compatible. Rebuild `app.asar` to update the Electron application.

## 1.0.2 — 2026-11-19

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
