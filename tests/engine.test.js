import assert from 'node:assert/strict';
import { analyze } from '../src/engine.js';

// Cantilever along global X, tip Fx: delta = PL/EA
const E=200e9,A=.01,L=2,P=10000;
const m={
 materials:{S:{E,nu:.3}},sections:{R:{A,Iy:8e-6,Iz:8e-6,J:1.6e-5}},
 nodes:[{id:1,x:0,y:0,z:0},{id:2,x:L,y:0,z:0}],members:[{id:'M',i:1,j:2,material:'S',section:'R'}],
 supports:[{node:1,UX:true,UY:true,UZ:true,RX:true,RY:true,RZ:true}],nodalLoads:[{node:2,Fx:P}],memberLoads:[]
};
const r=analyze(m); const expected=P*L/(E*A);
assert.ok(Math.abs(r.displacements[1].UX-expected)<1e-12,`axial displacement ${r.displacements[1].UX} vs ${expected}`);
assert.ok(Math.abs(r.reactions[0].Fx+P)<1e-6,'reaction equilibrium');

// Cantilever tip load in global Y: v = PL^3/(3 E Iz)
const m2=structuredClone(m);m2.nodalLoads=[{node:2,Fy:P}];
const r2=analyze(m2); const ey=P*L**3/(3*E*8e-6);
assert.ok(Math.abs(r2.displacements[1].UY-ey)/ey<1e-9,`bending displacement ${r2.displacements[1].UY} vs ${ey}`);
console.log('SAPUDOM Engine V1 tests passed.');
