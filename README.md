# oskyn

A browser-based vector animation editor developed by Gap4456 from Dylan Papp's Onionskyn. Draw vectors, edit nodes, animate keyframes, use Bone IK and soft-body controls, work with bitmap masks, and export animations.

## Run

Download this repository and open **oskyn.html** (or **index.html**) in a current Chromium-based browser. The application is self-contained; no server or build step is required to use it. Platform support for audio, video export and desktop colour picking can vary.

Save projects explicitly with **Save project** (`.oskyn.json`). On supported desktop Edge/Chrome/Brave browsers, each Save or Ctrl+S opens the system **Save As** dialog: choose a folder, enter a name or select an existing file and confirm replacement. The previous file location/name is suggested for each open project during the session. Firefox and other desktop browsers without the picker use a direct download without an extra oskyn naming form. Enable the browser’s “Always ask where to save files” option to choose a folder or replace an existing file; automatic downloads may still produce numbered copies. Mobile retains its project-name form. Cancelling keeps unsaved work open. Legacy Onionskyn/FlashCraft project formats remain supported. Browser project autosave and persistent application settings are disabled in this version.

## Symbols and node editing

Inside a symbol, **Preview symbol** beneath the scene/symbol path previews only that symbol, including its own timeline and nested symbols. Restart repeats that preview; closing it keeps the editor at the same symbol and frame. The main Preview button continues to preview the scene.

The color palette includes a crossed **None** swatch after project colors. For Fill or Stroke it removes that paint from the selection and disables it for subsequent shapes; picking a color restores it. None is disabled for background and other color-only settings.

Double-click a symbol in Selection or Node edit to enter it; the current tool is retained. Double-click an ordinary figure in Selection to edit its nodes. Node edit distinguishes symbols from groups and explains how to continue. Repeating the same blocked action grows one warning and makes its text progressively redder, up to a fixed size limit. It resets after five seconds or a successful action; routine notices do not escalate.

## Mobile preview

**Experimental mobile preview with significant bugs and usability limitations. It is currently suitable for viewing projects and trying the interface. It is not yet ready for serious animation work; use the desktop version for that.**

A separate touch interface is available in **[mobile/index.html](mobile/index.html)**, using the same animation core and project format. It includes scrollable edge panels, visible Preview/Delete, persistent Undo/Redo, Shift/Control/Alt buttons, drag-to-record, larger frame cells and touch access to Node/Bone tools.

[Mobile instructions and phone/PC testing](mobile/README.md). To rebuild it from the main folder: `node mobile/build.cjs`. To test over local Wi-Fi: `npm.cmd --prefix mobile run serve`. The preview has automated Chromium multi-touch coverage; real iPhone/Android testing is still required. The desktop layout is unchanged. For a public phone link, enable GitHub Pages from `main` / `(root)` as described in the [publishing steps](mobile/README.md#publish-directly-from-github).

## Multiple open projects

**File → Open project** adds another project without replacing the current one. Click the narrow handle at the right edge of the stage to reveal the project buttons, then choose a name to switch projects. The menu starts collapsed; the handle grows taller as more projects are opened. Click the handle again (or press Escape while focused in the menu) to hide it; **+** creates another blank project. Opened projects show their filename; changing the project name in Doc updates the button immediately. Long labels use an ellipsis, with the full name on hover. Each project keeps its playhead, view, symbol-editing context and Undo/Redo history. The buttons are editor controls and do not appear in exports.

Select objects, press **Ctrl+C**, switch projects and press **Ctrl+V**. Referenced symbols (including their timelines), bitmap pixels and symbol sounds travel with the objects. Existing destination assets are preserved when names collide. Copy/Paste also works between separate oskyn windows through the system clipboard. This copies the selected objects at the current frame; it does not copy their outer timeline animation. Use the existing Copy Frames / Paste Frames commands for timeline work; layer copying has not changed.

Use **×** beside a project name to choose **Save**, **Don’t save** or **Cancel**. Projects remain in memory until you close the editor: save each project explicitly to keep it. Asterisks mark unsaved changes, including on inactive projects. Object-file export/import is deferred.

## Windows: build app.asar

This builds the current editor and Electron wrapper for updating an existing Windows Electron installation. It does not create a new `.exe` or include the Electron runtime.

1. Install [Node.js LTS](https://nodejs.org/).
2. Download **Code → Download ZIP** from this repository and extract it.
3. Open the extracted **oskyn-main** folder containing `desktop`, `source` and `oskyn.html`. Type `cmd` in File Explorer's address bar and press Enter. Run these commands from that main folder, not from `source`:

   ```cmd
   npm.cmd --prefix desktop ci
   npm.cmd --prefix desktop run build
   ```

4. The generated file is **`desktop\dist\app.asar`**. To open its folder from the same terminal:

   ```cmd
   explorer desktop\dist
   ```

5. Close your existing oskyn desktop app. In its folder (beside the `.exe`), open **`resources`**, back up the old `app.asar` and replace it with the new one.
6. Launch the `.exe` and verify drawing, saving and the window **× → Save / Don't Save / Cancel** dialog. Keep the Electron runtime files and all licence notices alongside the app. Run from an extracted folder, not from inside a ZIP viewer.

For the next update, download the latest source and repeat these steps. More details: [desktop/README.md](desktop/README.md).

## Develop and test the HTML version

The editable source lives in [`source/src`](source/src). Build instructions and tests: [source/building.md](source/building.md).

```sh
cd source
npm install
npm run build
npx playwright install chromium
npm test
```

The build reproduces `index.html` and `oskyn.html` from source without changing the application version (`1.0.1`). Edit the source and rebuild rather than editing generated HTML alone.

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

In Selection mode, hold **Shift before grabbing an already selected object** to hide scale/rotation handles, the pivot and parametric controls, and drag freely. Releasing Shift restores them. In Node mode, hold **Ctrl+Shift** while dragging an anchor or curve handle to constrain movement horizontally or vertically. Anchors also snap to nearby coordinates of other unselected anchors in the same object. Ctrl alone retains marquee selection. Shift still adds an unselected object to the selection; Node and Star tool modifiers retain their own behaviour.

Brush and Fluid Brush share the last explicitly chosen drawing colour, including Fill, Stroke, eyedropper and either brush's colour field. Switching tools no longer resets their ink to the initial dark colour.

## Bone HUD and experimental soft contours

Configured joint actions (pin, rigid group, attached drawing/soft body and angle limits) use darker button backgrounds when their menu appears. Open Pose actions and enabled influence-zone/adaptive controls are also marked.

Open a joint's **Soft body** submenu and click **≈** to enable the **experimental adaptive contour** for its attached editable soft bodies. It refits the posed outline with fewer cubic nodes and removes small new backtracking loops and short side zigzags, while protecting original corners and retaining the bind geometry. Click again to return to the original deformation. The setting is saved on the current keyframe, inserts a key when needed, supports Undo/Redo, and follows the animation into exports. It starts off for existing/new soft bodies; the toggle is disabled during Record.

This remains experimental: deep folds, large limb crossings and complex silhouettes can still need manual adjustment. Branched-body overlap order and internal joins are retained; each repaired outer run is shared by its fill and stroke. Influence-zone colours are clipped to the normal silhouette and the normal stroke is drawn over them. The original bind nodes are never replaced with the automatically generated contour.

## Report a problem

**File → Report a problem → Report on GitHub** opens a prefilled issue in [Gap4456/oskyn](https://github.com/Gap4456/oskyn/issues). The user reviews and submits it on GitHub; no issue is posted automatically and the original author's support email is not used. **Copy report** copies the description and diagnostic details for manual posting.

## Bitmap erasing: frame by frame

Bitmap Eraser masks do **not** interpolate through Shape tweens. They stay at their keyframe state until the next keyframe; object transforms can still animate normally. Erasing a held bitmap frame inserts a keyframe at that frame instead of changing its earlier exposure. Using Eraser marks that bitmap's masks across the current layer's keyframes for this held behaviour.

Original bitmap pixels remain unchanged and erased masks remain node-editable. Manually edited masks on bitmaps not treated with Eraser keep their existing Shape tween support. The experimental animated Eraser-mask interpolation has been paused. For projects saved before this change, the first new Eraser edit enables the held-mask behaviour for that bitmap across its layer.

## Known limitations

Bitmap masks can still show a thin seam in some edge-overlap situations. A separate animated covering/mask object can be used as a workaround. This is not claimed to be fixed. Tests cover selected workflows, not every feature or operating system.

## Desktop distribution

The [Electron wrapper and build instructions](desktop/README.md) produce an `app.asar` with the current editor and a native Save / Don’t Save / Cancel close dialog. It waits for every unsaved project to finish saving before closing. The Electron runtime and packaged executables are separate; keep desktop release ZIPs in GitHub Releases and include the original project and dependency licences with them.

## Origin and notices

Original project: [papptimus/Onionskyn](https://github.com/papptimus/Onionskyn), Copyright (c) 2026 Dylan Papp. Imported from the Onionskyn-main.zip supplied by the maintainer; this repository does not reproduce upstream Git history. The original MIT licence is preserved unchanged in [LICENSE](LICENSE). Additional notices and the existing Inkscape curve-dragging reference are documented in [THIRD-PARTY.md](THIRD-PARTY.md).

The original documentation and changelog are retained in [docs/upstream](docs/upstream) as historical references. Their names, shortcuts and build instructions may differ from this version. Report oskyn issues in this repository rather than to the original author's support address.

oskyn is not affiliated with Adobe or Inkscape.
