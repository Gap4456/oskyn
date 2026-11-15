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

## Star / Cog tool

Choose **Star / Cog (U)** beside Rectangle and Ellipse, then drag to create a five-ray star. Rectangle remains directly available.

- Drag the outer and inner rings to set ray length and valley depth.
- In **Star / Cog mode**, hold **Shift** while dragging either ring to turn that set of points independently.
- Drag the third ring/its handle inward to flatten tooth tips.
- Drag either square at the nearby tooth tip around the trim ring or inward. That corner adjustment repeats on every tooth, independently of the opposite corner, for saw-blade profiles.
- Drag the nearby valley handle around the inner ring to widen every valley.
- Change the ray/tooth count in the central number box. Its dotted grip moves the box aside; each new shape starts with its box centred.
- Drag one side, flattened tip or widened valley edge to repeat its curvature on the corresponding edges of every tooth. Opposite sides are independent.
- Double-click the shape to bake its current appearance into an ordinary path in Node edit. Undo restores its Star/Cog parameters.

The number box and control rings are editor controls and are not exported. Star/Cog parameters interpolate between keyframes with matching tooth counts. Change to Selection for normal transforms. Parametric controls are not recorded by Hold-Q; ordinary transforms still use the existing recording tools.

An ellipse/Pac-Man now uses two stages: the first double-click ends angle editing and leaves Selection active; the next double-click enters Node edit.

## Selection and drawing colour

In Selection mode, hold **Shift before grabbing an already selected object** to hide scale/rotation handles, the pivot and parametric controls, and drag freely. Releasing Shift restores them. Shift still adds an unselected object to the selection; Node and Star tool modifiers retain their own behaviour.

Brush and Fluid Brush share the last explicitly chosen drawing colour, including Fill, Stroke, eyedropper and either brush's colour field. Switching tools no longer resets their ink to the initial dark colour.

## Bitmap erasing: frame by frame

Bitmap Eraser masks do **not** interpolate through Shape tweens. They stay at their keyframe state until the next keyframe; object transforms can still animate normally. Erasing a held bitmap frame inserts a keyframe at that frame instead of changing its earlier exposure. Using Eraser marks that bitmap's masks across the current layer's keyframes for this held behaviour.

Original bitmap pixels remain unchanged and erased masks remain node-editable. Manually edited masks on bitmaps not treated with Eraser keep their existing Shape tween support. The experimental animated Eraser-mask interpolation has been paused. For projects saved before this change, the first new Eraser edit enables the held-mask behaviour for that bitmap across its layer.

## Known limitations

Bitmap masks can still show a thin seam in some edge-overlap situations. A separate animated covering/mask object can be used as a workaround. This is not claimed to be fixed. Tests cover selected workflows, not every feature or operating system.

## Desktop distribution

Electron wrappers and packaged executables are not included in this initial source repository. Keep desktop release ZIPs in GitHub Releases and include the original project and dependency licences with them.

## Origin and notices

Original project: [papptimus/Onionskyn](https://github.com/papptimus/Onionskyn), Copyright (c) 2026 Dylan Papp. Imported from the Onionskyn-main.zip supplied by the maintainer; this repository does not reproduce upstream Git history. The original MIT licence is preserved unchanged in [LICENSE](LICENSE). Additional notices and the existing Inkscape curve-dragging reference are documented in [THIRD-PARTY.md](THIRD-PARTY.md).

The original documentation and changelog are retained in [docs/upstream](docs/upstream) as historical references. Their names, shortcuts and build instructions may differ from this version. Report oskyn issues in this repository rather than to the original author's support address.

oskyn is not affiliated with Adobe or Inkscape.
