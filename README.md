# oskyn

A browser-based vector animation editor developed by Gap4456 from Dylan Papp's Onionskyn. Draw vectors, edit nodes, animate keyframes, use Bone IK and soft-body controls, work with bitmap masks, and export animations.

[Authors and AI assistance](CREDITS.md): Gap4456, Dylan Papp, ChatGPT (OpenAI), Codex (OpenAI) and Claude (Anthropic).

## Run

Download this repository and open **oskyn.html** (or **index.html**) in a current Chromium-based browser. The application is self-contained; no server or build step is required to use it. Platform support for audio, video export and desktop colour picking can vary.

Save projects explicitly with **Save project** (`.oskyn.json`). On supported desktop Edge/Chrome/Brave browsers, each Save or Ctrl+S opens the system **Save As** dialog: choose a folder, enter a name or select an existing file and confirm replacement. The previous file location/name is suggested for each open project during the session. Firefox and other desktop browsers without the picker use a direct download without an extra oskyn naming form. Enable the browser’s “Always ask where to save files” option to choose a folder or replace an existing file; automatic downloads may still produce numbered copies. Mobile retains its project-name form. Cancelling keeps unsaved work open. Legacy Onionskyn/FlashCraft project formats remain supported. Browser project autosave is disabled. The colour theme is remembered locally between launches; other application settings and shape presets stay within the current session.

## Selection toolbar

Selection mode shows compact **b f B F G U** buttons after Flip/Rotate: lower/raise one step, send to bottom/bring to top within the current layer, Group and Ungroup. Hover for descriptions and shortcuts; unavailable actions are dimmed. Node edit keeps its own operations. The Pen icon has a plus and a node square to distinguish drawing nodes from editing them.

## Editor visibility and grid

Selection mode adds **H** (Hide) and **S** (Show) buttons; no new keyboard shortcuts are assigned. H hides the selected set as one step, or the next front visible object on the current unlocked layer when nothing is selected. S restores the last hidden set first, without selecting it. A dashed-outline button appears after H/S only while actual hidden objects exist in this editing context. Click it to show/hide thin non-interactive outlines; its dimmed icon and subtle background indicate outlines are on. Right-click S still offers **Show all hidden** and the same outline toggle. Each open project and scene/symbol editing context has its own temporary stack. Hiding changes only the editor view and picking; saved artwork, layer order, Preview and exports retain the objects. Show them again before closing if you want to inspect them; the hide stack is not saved in project files.

The grid starts at **0.5 cm**; the existing Grid size controls remain available.

## Symbols and node editing

In **Node edit**, Shift-click another ordinary vector path away from its nodes/handles to open it alongside the current paths. Shift-click anchors to toggle them, or drag a selection box across the open paths (Shift adds). Ctrl+A selects their anchors. Dragging selected anchors moves them by the same canvas distance even across rotated, mirrored or differently scaled objects; arrows nudge them. Node operations and Delete work across the selection with one Undo. Paths stay separate and locked/hidden layers are excluded. Symbols, groups, bitmap masks and Bone/soft-body controls retain their existing single-object workflows. Record also supports a selected set of anchors across these vector objects: arm Record, hold Q and drag a selected anchor. A pass freezes its objects/anchors, shares one clock and Undo, and creates/reuses one Take per source layer. Unselected node coordinates, handles, transforms and other objects keep their prior animation. Later anchor passes can overdub the same Takes; multi-curve and multi-handle recording are not supported.

Click an already-selected anchor without dragging to toggle its curve handles; hidden handles are neither drawn nor picked. Shift-click keeps its selection behaviour, and dragging does not toggle handle visibility. Double-clicking a segment can add a node even beneath a nearby handle. The nearest anchor wins in crowded areas. Adding a node preserves the exact existing curve; outside Record, its first anchor drag straightens only the adjacent segments and keeps handles hidden. The curve before the preceding stop anchor stays intact. Dragging a segment creates its curve controls and reveals them; existing anchor and Record workflows remain available. These handle-visibility choices are temporary editor state.

Inside a symbol, **Preview symbol** beneath the scene/symbol path previews only that symbol, including its own timeline and nested symbols. Restart repeats that preview; closing it keeps the editor at the same symbol and frame. The main Preview button continues to preview the scene.

The color palette includes a crossed **None** swatch after project colors. For Fill or Stroke it removes that paint from the selection and disables it for subsequent shapes; picking a color restores it. None is disabled for background and other color-only settings.

Double-click a symbol in Selection or Node edit to enter it; the current tool is retained. Double-click an ordinary figure in Selection to edit its nodes. Node edit distinguishes symbols from groups and explains how to continue. Repeating the same blocked action grows one warning and makes its text progressively redder, up to a fixed size limit. It resets after five seconds or a successful action; routine notices do not escalate. Paste Frames, Record, Mirror and full Custom-palette constraint notices share this system. Unavailable Group/Ungroup actions are disabled in both toolbar and Align; their keyboard commands do nothing instead of generating warnings.

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

The build reproduces `index.html` and `oskyn.html` from source without changing the application version (`1.0.4`). Edit the source and rebuild rather than editing generated HTML alone.

Ctrl-click an object with the Selection tool to remove it from or add it to the selection. Ctrl-drag retains rectangle selection; Ctrl-click empty space leaves the current selection intact. In Node Edit, selected groups use contrasting white/dark dashed bounds. These bounds are editor overlays and never appear in exports.

## Animated symbols in groups

Grouping an animated symbol with other artwork preserves its animation, including inside nested groups. Groups add transforms and organization without creating a new timeline. Graphic symbols keep their Loop / Play once / Single frame settings. Movie Clips retain independent playback and instance scripts in Preview and HTML export, including on a one-frame main timeline.

## Shaper / Edit shape

The **Shaper** toolbar switch and **Object → Edit shape** toggle the same parametric controls. Shaper stays pressed alongside Rectangle, Ellipse or Star. Star starts enabled; Ellipse and Rectangle start disabled. Enabling it on an eligible selected shape also activates that shape’s drawing tool. Entering Node mode does not bake a shape; changing its actual node geometry does, preserving the artwork and restoring its parameters with Undo.

For rectangles, hover near a corner to reveal its small round handle. Drag inward to round all corners; **Shift** affects one corner, **Alt** its horizontal pair, **Ctrl** its vertical pair, and **Ctrl+Shift** its diagonal pair. Unaffected corners stay unchanged. Maximum rounding makes a square circular and a long rectangle capsule-shaped. Existing simple rectangles from older projects can also use these controls.

Turning Shaper off remembers the selected Star’s proportions or the Rectangle’s corner settings for repeated drawing in that project session. A new ellipse always starts whole, without a remembered sector cut. **Reset shape**, or double-clicking Shaper, resets only the selected shape while keeping its placement, transform and paint. With no selection it resets the active tool’s drawing preset. Reset is undoable for existing artwork. New projects start with default presets; project switching retains each open project’s session presets. These presets are not saved to browser storage.

## Skew tool

The toolbar defaults to **two columns**. Its layout toggle still switches to one column for the current session.

Select ordinary vector paths or vector-only groups and choose **Skew** beside Deform. Drag the top/bottom edge handles horizontally, or the left/right handles vertically. The opposite edge stays fixed. Skew transforms existing anchors, Bézier handles and gradient coordinates, retaining node counts and identities; it does not flatten curves or create a persistent effect. Each completed drag uses one Undo. Escape cancels an in-progress drag and returns to Selection, whose rotation/resize handles are unchanged.

This first version supports visible unlocked vector paths and nested vector-only groups. Text, symbol instances, bitmaps, live mirrors, masked groups and bone/soft-body-bound artwork are excluded. Parametric stars/ellipses become ordinary paths on an actual skew. Shape Tween can interpolate the baked geometry, including group children; no additional export format or rasterization is involved.

## Workspace layout

On desktop web and Electron, drag the **upper edge of the Timeline** to resize it. It can extend over the canvas and side panels up to the top toolbar, or collapse to an 8px grip at the bottom. A static diagonal stripe appears only away from the default height. Double-click the edge/grip to reset; dragging close to the default height snaps back and hides the stripe. Resizing changes only the workspace layout, without changing the document, undo history or canvas zoom/pan. Sizes last for the session and are not stored in projects. Mobile retains its existing panel layout.

Double-click the **Frame script** or **Object → Script** field, or press its **Expand** button, to open a large editor within the same page. Frame scripts and Movie clip/Button instance scripts use the same editor with a target-specific title. The code page has line numbers, scrolling and a full-width toggle; its header and close button stay visible for long scripts. Edits update the project immediately; close with **×** or Escape and save the project normally. Syntax checks follow **Doc → Scripts** (JavaScript or ActionScript 1/2). **F9** continues to open the current keyframe script.

## Deform frame

Use **Deform frame** beside Mirror in the left toolbar. Drag a rectangle on the canvas (or drag the tool onto the canvas), then resize/move that rectangle before pressing the green **✓**. Only fully enclosed ordinary vector paths or vector-only groups on the current visible unlocked layer are captured, regardless of their stacking order. Geometry exactly on the rectangle boundary is included; partially intersecting objects are excluded. Text, symbol instances, bitmaps, live mirrors, masked groups and bone-bound/soft-body artwork are not supported in this first version.

The check prepares curve geometry once as short straight segments, retains straight edges, and assigns stable node identities. Drag the four corners for a projective deformation, or drag inside the frame with the tool active to move the whole captured geometry. The rectangle stays axis-aligned until confirmed; afterwards it stays convex and corners cannot cross. Each drag is calculated from its starting geometry, uses one Undo, and can be cancelled with Escape or a cancelled pointer gesture.

Prepare nodes **before** making the later keyframes. Duplicate that prepared keyframe and use **Shape Tween** to interpolate the resulting path nodes, including paths inside groups. Motion Tween can move/rotate/scale the artwork, but does not interpolate this node deformation. Existing older keyframes are not automatically densified. **Simplify** is never run automatically. It refuses paths participating in an incoming or outgoing Shape Tween before making any changes; simplify before creating the tween, or remove those tween spans first. Static-path Simplify remains available. Dense morphs use identity matching and heap-based subdivision instead of quadratic rescans, and deformation pointer bursts are coalesced to one update per animation frame.

The dashed frame is saved with the project and remains an editor guide when changing tools. Its **×** removes that controller from every keyframe of its layer, preserving all deformed artwork. The frame is excluded from picking, ordinary selection, rendering and SVG/PNG/GIF/video/HTML preview output; the artwork stays ordinary editable vector paths. Fill/stroke styles remain unchanged. Confirmation is limited to 50,000 nodes per frame operation to keep extreme inputs bounded.

## Independent symbol copies

Select one symbol instance and open **Object**:

- **Duplicate as unique** creates a second instance backed by a new symbol definition. Its nested symbols remain shared with the original.
- **Duplicate with nested symbols** also copies all structurally referenced nested symbols, including references inside groups and later keyframes. Repeated uses of a nested symbol share one new definition within the copied graph.

The copy appears directly above the original in the same position and keeps its transform, playback settings, opacity, instance name and scripts. New definitions receive collision-free `copy` names in the existing Library. Images and sounds remain shared project assets. Each action uses one Undo; ordinary **Duplicate / Ctrl+D** keeps its existing linked-instance behaviour. The buttons are available for one symbol on a visible unlocked layer outside Record mode, including while editing another symbol.

## Text to paths

Select one text object, open **Text** and choose **Convert to paths**. In a browser, supply the matching static `.ttf` or `.otf` file for every font/style used by that text, then confirm conversion. The updated Electron wrapper automatically finds matching installed static fonts and offers manual file selection if lookup fails. Font files are parsed locally and reused for the current session; they are not uploaded or included in saved projects. Using a different font, or replacing a font the browser had substituted, can change the letter shapes.

Each visible letter becomes a separate filled vector path. Counters and accents stay in the same object; spaces produce no objects. Layout, colour, opacity and transforms are retained, and one Undo restores the editable text. Converting on a held frame inserts a keyframe there, leaving earlier frames unchanged. The resulting paths work with Node Edit, Difference and exports without needing the font. Difference still requires two filled paths on the same layer.

The initial implementation supports static TrueType/OpenType outlines and ordinary left-to-right lettering, including Latvian accents. Ligatures are separated into letters. Variable fonts, joined-script shaping and emoji sequences are not supported. Missing glyphs or invalid font files leave the text unchanged.

## Invisibility masks

Select a vector path and enable **Invisibility Mask** in Object properties. It cuts earlier objects in its own layer. Two optional checkboxes become available:

- **Affect lower layers** also cuts artwork on lower layers. Locked recipient layers are immune to masks from other layers, but their own masks still work. Locking the mask's source layer does not disable it; hiding that layer does. These rules apply in the editor, Preview and exports at every frame.
- **Outline cut edges** uses each covered vector shape's stroke colour, width, opacity, cap/join and dash style on the cut boundary. Shapes without a stroke receive no new outline. It works independently of the lower-layer option.

Both options default to off, preserving existing projects. Masks inside symbols stay inside that symbol; external masks can cut symbol instances. Multiple cuts combine. The existing timeline **Mask** button and legacy reveal-mask behaviour remain available.

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

## Authors and AI assistance

- **Gap4456** — oskyn maintainer, design direction, testing and development.
- **Dylan Papp (papptimus)** — original Onionskyn author.
- **ChatGPT (OpenAI)** — ideas, planning and discussions about oskyn development, including before Codex was used.
- **Codex (OpenAI)** — AI coding assistant for oskyn implementation, fixes, automated checks and documentation.
- **Claude (Anthropic)** — AI assistance in the original Onionskyn development, as reported by the maintainer.

See [CREDITS.md](CREDITS.md) for attribution details. AI assistants are credited for their assistance; the original copyright and licence notices remain intact.

## Origin and notices

Original project: [papptimus/Onionskyn](https://github.com/papptimus/Onionskyn), Copyright (c) 2026 Dylan Papp. Imported from the Onionskyn-main.zip supplied by the maintainer; this repository does not reproduce upstream Git history. The original MIT licence is preserved unchanged in [LICENSE](LICENSE). Additional notices and the existing Inkscape curve-dragging reference are documented in [THIRD-PARTY.md](THIRD-PARTY.md).

The original documentation and changelog are retained in [docs/upstream](docs/upstream) as historical references. Their names, shortcuts and build instructions may differ from this version. Report oskyn issues in this repository rather than to the original author's support address.

oskyn is not affiliated with Adobe or Inkscape.
