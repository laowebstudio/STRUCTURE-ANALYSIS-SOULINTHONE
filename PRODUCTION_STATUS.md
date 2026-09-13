# SAPUDOM Analysis Platform V1 — Production Status

## Included and local
- Geometry and component data model
- 3D viewer and result display
- Frame/shell mesh workflow
- Point/distributed loads, supports, releases, local axes
- Linear C++/WebAssembly analysis solver
- Reactions, displacements and internal-force recovery
- Design/report components present in the upstream engineering core

## Requires SAPUDOM-owned service before production use
- Nonlinear analysis. The upstream client called an external hosted endpoint. SAPUDOM V1 deliberately removes that implicit dependency and requires `VITE_SAPUDOM_NL_SOLVE_ENDPOINT`.

## Validation required before engineering sign-off
This codebase must be benchmarked against hand calculations and trusted structural-analysis software for every supported element/load/design path before results are used for safety-critical engineering decisions. Rebranding does not constitute numerical verification or code certification.

## Deployment
The app is a Vite browser application. Build output can be hosted statically after dependencies are installed and the test/build pipeline passes in the target environment.
