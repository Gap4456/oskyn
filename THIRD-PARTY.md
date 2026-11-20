# Third-party notices

The original Onionskyn MIT licence and Dylan Papp copyright are preserved unchanged in [LICENSE](LICENSE). The application and source retain their existing library headers and attribution comments.

| Component | Attribution | Licence text |
|---|---|---|
| opentype.js 1.3.4 | Frederik De Bleser and contributors | [MIT](licenses/opentype-LICENSE) |
| tiny-inflate, bundled with opentype.js | Devon Govett | [MIT](licenses/tiny-inflate-LICENSE) |
| string.prototype.codepointat, bundled with opentype.js | Mathias Bynens | [MIT](licenses/codepointat-LICENSE) |
| polygon-clipping 0.15.7 | Mike Fogel; portions by Alexander Milevski | [MIT](licenses/polygon-clipping.LICENSE.md) |
| splay-tree, bundled with polygon-clipping | Alexander Milevski | [MIT](licenses/splay-tree-LICENSE) |
| JSZip 3.10.1 | Stuart Knightley, David Duponchel, Franz Buchinger, António Afonso | [MIT option](licenses/JSZip-LICENSE.markdown) |
| pako, bundled with JSZip | Vitaly Puzrin and Andrei Tuputcyn | [MIT](licenses/pako-LICENSE) |
| tslib helper embedded in polygon-clipping | Microsoft Corporation | [Apache 2.0](licenses/Apache-2.0.txt), [notice](licenses/tslib-NOTICE.txt) |

## Existing curve-dragging reference

The current node editor includes an attribution comment citing Inkscape's `curve-drag-point.cpp` (GPL-2.0-or-later) for its curve-dragging weighting approach. This reference is preserved in `source/src/app2.js`; it is not removed or relabelled by the original project's MIT licence. The cited licence is included in `licenses/GPL-2.0.txt`. This repository does not claim ownership of the cited upstream implementation or that the root MIT licence replaces third-party terms.

## Desktop packages

When distributing an Electron package, also retain Electron's own licence and Chromium third-party notices supplied by Electron. They are not bundled here because this repository does not contain an Electron distribution.
