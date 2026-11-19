# oskyn Mobile preview

**Experimental mobile preview with significant bugs and usability limitations. It is currently suitable for viewing projects and trying the interface. It is not yet ready for serious animation work; use the desktop version for that.**

A separate touch layout built from the same editor, animation core and `.oskyn.json` format as desktop oskyn. The generated **[index.html](index.html)** is self-contained. The desktop HTML, Electron wrapper and existing projects are unchanged.

This is an experimental first mobile interface, not a separate animation engine. Automated Chromium touch tests pass; real iPhone Safari and Android testing is still needed, particularly photo picking, HEIC/EXIF orientation, the on-screen keyboard, audio and saving to Files. Existing advanced editor features remain available, but not every workflow has been validated on touch.

## Try it on a PC

Download **Code → Download ZIP**, extract it, then open `mobile/index.html` in a recent browser. In Firefox, **Ctrl+Shift+M** opens Responsive Design Mode; enable touch simulation to test a single finger. Edge/Chrome also have device emulation. A mouse can operate the controls; scroll panels with the mouse wheel, or drag a panel heading with the mouse to reposition it.

Single-mouse simulation does not prove a two-finger gesture works. The automated tests below send real simultaneous touch points through Chromium's DevTools protocol.

## Publish directly from GitHub

The repository includes `.nojekyll` so GitHub Pages serves the built HTML unchanged. A repository owner can enable hosting in GitHub:

1. Open **Gap4456/oskyn → Settings → Pages**.
2. Under **Build and deployment → Source**, select **Deploy from a branch**.
3. Choose branch **main**, folder **/ (root)**, and click **Save**.
4. Wait for the Pages deployment to finish. The mobile page will be **https://gap4456.github.io/oskyn/mobile/**; the desktop page will be **https://gap4456.github.io/oskyn/**.

After it is enabled, commits to `main` redeploy the committed HTML. Rebuild `mobile/index.html` when changing its source before pushing. No Node.js installation, local server or downloaded HTML is needed to use the hosted page on a phone. This publishes the static application; project/media files remain local until explicitly saved/exported. PWA installation and an offline service worker are not included.

## Try it on a phone over Wi-Fi

From the repository's main folder, with Node.js installed:

```cmd
npm.cmd --prefix mobile run serve
```

Open `http://localhost:8080` on that PC. On the phone, use `http://YOUR-PC-LAN-IP:8080` on the same Wi-Fi. Windows `ipconfig` shows the PC's LAN IPv4 address. If prompted by Windows Firewall, allow the local server on your private network. Ctrl+C stops the server.

The server serves only the mobile HTML; it does not upload projects. GitHub Pages hosting can be enabled using the steps above; PWA/offline installation is not included. Browser fonts may use Google's font service; project drawing/media data stays in the editor until explicitly saved or exported.

## Touch controls

- The canvas fills the screen. **Undo/Redo** stay visible at the bottom; **Edit** can move them to the other side.
- Edge handles reveal **Tools**, **Properties** or **Timeline**. Only one of those panels opens at a time. Tap outside to close it without drawing; selecting a tool also closes Tools.
- **Two fingers on the canvas** pan and pinch-zoom it. A second canvas finger cancels an unfinished one-finger edit, including an eraser operation or take. After lifting one navigation finger, the remaining finger cannot start drawing.
- **Swipe inside a panel** to scroll its contents normally. **Two fingers on its heading** move the whole panel; a mouse can drag the heading. **↑** scrolls to the start. Navigation strips have been removed. **Preview** and **Delete** are visible at the top. Delete removes selected objects or nodes; while Timeline is open it removes selected frames.
- **Tools** retains all shared tools, including Node, Bone and Star/Cog. **1 / 2** switches toolbar columns. **More** reveals the horizontally scrollable top commands: Path, Flip/Rotate, node operations, Grid/Snap, zoom, Help and themes. Node operations also appear in Edit when appropriate.
- **Shift / Control / Alt** can be tapped to latch, or held with one finger while another finger edits the canvas. Their dim reminders ignore pointer input. Control+Shift works with axis-constrained Node dragging.
- **REC** in Tools arms drag-to-record. Close the panel, then drag a selected object, node or Animate-mode bone. The counter reports actual sampled frames. Releasing the object stops the take while REC stays armed. Tap REC again to disarm. Only the armed REC indicator pulses; reduced-motion settings suppress the animation. Selected anchors can now span several ordinary vector figures in one take; curves/handles retain their single-object recording workflow. The shared 900-frame limit and existing Record restrictions still apply.
- Timeline cells start at **40 px wide, 44 px high**. Tap to select, use Shift for ranges, or **hold a frame** for Copy/Paste/Key/Blank and other actions. Swipe the toolbar horizontally to reach all actions; swipe the frames independently to navigate time and layers. A swipe does not drag keyframes. Drag the wide **Ⅱ** grip after the final frame to change animation length; content-bearing keys remain protected and Undo restores the previous length.
- **Double-tap a Star/Cog or Pac-Man figure** to finish its parametric editing, as with a desktop double-click.
- A tap on a **Bone joint** opens its existing radial HUD. Hold a canvas object for the Edit menu. The on-screen modifiers provide the desktop modifier combinations.
- The **Projects** handle stays at the right edge and can be moved vertically. Switching projects hides the list and retains each project's own view, frame and history. Project-list scrolling uses its normal scroll area.
- **File → Import image** uses the browser/phone file picker. **File → Save project** asks for a project name, updates its project-list label and downloads the shared `.oskyn.json` format; Cancel leaves the name unchanged. Save each project explicitly; browser autosave remains disabled.

## Build

No dependencies are needed for the HTML build. Run from the repository root:

```cmd
node mobile/build.cjs
```

Or:

```cmd
npm.cmd --prefix mobile run build
```

This reads `source/manifest.json`, uses the exact shared `fcCore` and runtime, adds `src/mobile.css` and injects `src/mobile.js` into the app scope. It enlarges timeline constants only in the mobile output and validates that integration point. It writes `mobile/index.html`; it never rebuilds the root desktop HTML or creates an Electron package.

## Tests

```sh
cd mobile
npm ci
npx playwright install chromium
npm test
```

An installed Chromium can be selected with `CHROMIUM_PATH`. Tests cover touch drawing, Undo/Redo, panel gesture ownership, modifiers, two-pointer pinch/pan rollback, automatic Record/frame counting, Bone HUD, Node constraints, long-press frame menus, portrait/landscape, image input, Save/Open and project switching. They also verify that the mobile core matches desktop and that no mobile adapter is present in the desktop build.

## Source and licences

Shared implementation: [`../source/src`](../source/src). Mobile-only adapter: [`src/mobile.js`](src/mobile.js), [`src/mobile.css`](src/mobile.css), and [`build.cjs`](build.cjs). Original authorship and dependency notices remain in [`../LICENSE`](../LICENSE) and [`../THIRD-PARTY.md`](../THIRD-PARTY.md); include them with redistributed source/application bundles.
