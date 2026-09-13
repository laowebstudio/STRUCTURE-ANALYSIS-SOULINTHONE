# SAPUDOM Analysis Engine V1

Standalone clean-room MVP for SAPUDOM structural analysis.

## V1 capabilities
- 3D space-frame element, 6 DOF/node and 12 DOF/member
- Linear elastic static analysis
- Local/global coordinate transformation
- Global stiffness assembly and boundary conditions
- Nodal forces/moments
- Uniform member loads in local x/y/z
- Nodal displacements, support reactions, member local end forces N/Vy/Vz/T/My/Mz
- JSON model import/export
- Browser model/deformed-shape viewer

Recommended consistent units: N, m, Pa.

## Run
Because ES modules are used, serve the folder over a local HTTP server:

```bash
npm run serve
```

Then open http://localhost:8080

## Test
```bash
npm test
```

## Next planned V1.x
1. End releases and offsets
2. Load cases and combinations
3. P-Delta
4. Modal/eigenvalue analysis
5. Shell/plate slab FEM and mesh
6. Result diagrams/contours
7. RC design interface

## Reference note
The project was designed as a new SAPUDOM codebase. The architecture was informed by general FEM practice and review of the MIT-licensed Awatif project supplied by the user; Awatif source code is not bundled in this package.
