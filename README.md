# SAPUDOM Analysis Platform V1

Production-oriented SAPUDOM fork for browser-based structural analysis and design.

## Current engine

- 3D geometry: points, frame lines, polygons
- Frame and shell meshing
- Linear C++/WebAssembly solver
- Loads, supports, releases and local axes
- Reactions, displacements and internal-force results
- Concrete/steel/timber/shell design components inherited from the upstream engineering core
- Three.js 3D viewer and result visualization

## Important production note

The nonlinear analysis client in the upstream project depended on a hosted service owned by the upstream project. SAPUDOM does not use that service. To enable nonlinear analysis, deploy a compatible SAPUDOM backend and set:

```bash
VITE_SAPUDOM_NL_SOLVE_ENDPOINT=https://your-domain.example/api/solve
```

Linear analysis remains local through the bundled C++/WASM solver.

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev
```

## Test and production build

```bash
npm test
npm run build
npm run preview
```

The production output is generated in `dist/` and can be deployed to GitHub Pages, Netlify, Vercel, or another static host. If deploying under a GitHub Pages repository subpath, configure Vite `base` before building.

## Licensing / attribution

SAPUDOM V1 is based substantially on Awatif by Mohamed Adil, licensed under MIT. See `LICENSE`, `SAPUDOM_NOTICE.md`, and `THIRD_PARTY_NOTICES.md`. These notices must remain with substantial copies of the software.
