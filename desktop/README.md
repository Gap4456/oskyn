# oskyn Electron wrapper

This wrapper provides the native window **Save / Don't Save / Cancel** dialog. Copying HTML into an arbitrary Electron wrapper does not install this behaviour: `main.cjs` and `preload.cjs` are required too.

Build from the repository root (Node.js 18 or newer):

```sh
npm --prefix desktop ci
npm --prefix desktop run build
```

The output is `desktop/dist/app.asar`, containing the latest editor, wrapper and project/dependency notices. To update an existing unpacked Electron application:

1. Close the application and keep a backup of its existing `resources/app.asar`.
2. Replace **that file** with the generated `app.asar`. Extract ZIP distributions before changing files; do not run the app from inside a ZIP viewer.
3. Keep the Electron distribution's `LICENSE.electron.txt`, `LICENSES.chromium.html` and other notices alongside the executable.
4. Start the executable, draw something and use the window ×. Verify Cancel, Don't Save, and Save on your OS before distributing.

When there are unsaved projects, window × shows the native dialog. **Save** starts one `.oskyn.json` save for each dirty open project and closes only after every download has completed. Cancelling/failing any save keeps the window open. **Don't Save** closes all projects; **Cancel** leaves them open. A clean session closes without prompting. The separate × beside a project name closes just that project.

The wrapper uses the existing `onionskynDesktop` bridge name for compatibility. Older wrappers can still save a single active project; they keep the window open if other unsaved projects need saving. Browser runs retain their ordinary unsaved-work close guard.

This directory supplies the app wrapper, not the Electron runtime or a signed installer. Replacing an asar in a signed/distributed application may require rebuilding and signing its package. The current automated checks exercise renderer/host close logic and cancelled/completed downloads; a Windows GUI run is still required for the final Windows distribution.

## Automatic text outlines

**Text → Convert to paths** looks up the exact installed font family and Regular/Bold/Italic style through Electron's native bridge. The first lookup indexes static `.ttf` and `.otf` files in the system and current-user font folders on Windows, macOS and Linux; later lookups reuse that index until the app closes. No font data is uploaded or stored in projects. Font filenames do not need to match family names.

If the exact face is missing, damaged, variable, or available only as a `.ttc` collection, the dialog keeps **Choose manually…** available. It does not silently substitute another font/style. New font installations require restarting oskyn. Browser builds keep manual file selection. Rebuild the whole `app.asar` to install this feature: updating HTML alone does not update the native bridge.

Automated checks cover font discovery, style matching, the renderer conversion flow, manual fallback and existing window-close saving. A real Windows/macOS Electron GUI run is still required to validate the platform distribution.
