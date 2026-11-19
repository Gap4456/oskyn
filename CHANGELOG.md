# Changelog

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
