# Third-party assets — attribution

`front.svg`, `back.svg` (and the `front.json`/`back.json` manifests extracted from them) come
from **muscle_mapper** (https://github.com/suryamolly/muscle_mapper), `minimal` style,
pinned to commit `8350dcaea79cd1013a140887ae4f0a3369bc4b73`.

Licensed under the **MIT License** (see `LICENSE.md` in this directory) — no visible in-app
attribution is legally required for this style. Havit deliberately does not use muscle_mapper's
`advanced` style, which is separately licensed CC BY 4.0 and would require a mandatory visible
credit to its illustrator (Ryan Graves) on the anatomy screen itself.

Only the raw SVG artwork and its muscle-group ID taxonomy were reused — muscle_mapper's own
package code is a Flutter/Dart library and isn't used here; `components/anatomy/muscleAnatomyView.tsx`
is a from-scratch `react-native-svg` implementation built against this vendored artwork.
