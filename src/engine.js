// SAPUDOM Analysis Engine V1
// Linear-elastic 3D space-frame solver (6 DOF/node, 12 DOF/member).
// Units are user-consistent. Recommended: N, m, Pa.

const EPS = 1e-12;

export function zeros(r, c) {
  return Array.from({ length: r }, () => Array(c).fill(0));
}

export function matVec(A, x) {
  return A.map(row => row.reduce((s, v, i) => s + v * x[i], 0));
}

export function transpose(A) {
  return A[0].map((_, j) => A.map(row => row[j]));
}

export function matMul(A, B) {
  const BT = transpose(B);
  return A.map(row => BT.map(col => row.reduce((s, v, i) => s + v * col[i], 0)));
}

export function addVec(a, b) { return a.map((v, i) => v + b[i]); }
export function subVec(a, b) { return a.map((v, i) => v - b[i]); }

function norm(v) { return Math.hypot(...v); }
function cross(a, b) {
  return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
}
function dot(a, b) { return a.reduce((s, v, i) => s + v*b[i], 0); }
function normalize(v) {
  const n = norm(v);
  if (n < EPS) throw new Error('Cannot normalize a near-zero vector.');
  return v.map(x => x/n);
}

export function localAxes(p1, p2, roll = 0) {
  const ex = normalize([p2.x-p1.x, p2.y-p1.y, p2.z-p1.z]);
  let ref = Math.abs(dot(ex, [0,0,1])) > 0.95 ? [0,1,0] : [0,0,1];
  let ey = normalize(cross(ref, ex));
  let ez = normalize(cross(ex, ey));
  if (Math.abs(roll) > EPS) {
    const c = Math.cos(roll), s = Math.sin(roll);
    const ey0 = ey, ez0 = ez;
    ey = ey0.map((v,i) => c*v + s*ez0[i]);
    ez = ez0.map((v,i) => -s*v + c*ez0[i]);
  }
  return { ex, ey, ez };
}

export function transform12(p1, p2, roll = 0) {
  const { ex, ey, ez } = localAxes(p1,p2,roll);
  // R maps global vector components to local components.
  const R = [ex, ey, ez];
  const T = zeros(12,12);
  for (let block=0; block<4; block++) {
    for (let i=0;i<3;i++) for (let j=0;j<3;j++) T[3*block+i][3*block+j] = R[i][j];
  }
  return T;
}

export function frameLocalStiffness({E,G,A,Iy,Iz,J,L}) {
  if (!(L > 0)) throw new Error('Member length must be > 0.');
  const k = zeros(12,12);
  const EA = E*A/L;
  const GJ = G*J/L;
  const a = 12*E*Iz/L**3, b = 6*E*Iz/L**2, c = 4*E*Iz/L, d = 2*E*Iz/L;
  const e = 12*E*Iy/L**3, f = 6*E*Iy/L**2, g = 4*E*Iy/L, h = 2*E*Iy/L;

  // axial u
  k[0][0]=EA; k[0][6]=-EA; k[6][0]=-EA; k[6][6]=EA;
  // torsion rx
  k[3][3]=GJ; k[3][9]=-GJ; k[9][3]=-GJ; k[9][9]=GJ;

  // bending in local x-y plane: v, rz (uses Iz)
  const idsY=[1,5,7,11];
  const ky=[
    [ a, b,-a, b],
    [ b, c,-b, d],
    [-a,-b, a,-b],
    [ b, d,-b, c],
  ];
  for(let i=0;i<4;i++) for(let j=0;j<4;j++) k[idsY[i]][idsY[j]]=ky[i][j];

  // bending in local x-z plane: w, ry (uses Iy)
  // sign convention consistent with right-handed local axes.
  const idsZ=[2,4,8,10];
  const kz=[
    [ e,-f,-e,-f],
    [-f, g, f, h],
    [-e, f, e, f],
    [-f, h, f, g],
  ];
  for(let i=0;i<4;i++) for(let j=0;j<4;j++) k[idsZ[i]][idsZ[j]]=kz[i][j];
  return k;
}

export function uniformLoadEquivalentLocal(L, qy=0, qz=0, qx=0) {
  // Consistent nodal load vector for constant distributed loads in local axes.
  const f = Array(12).fill(0);
  if (qx) { f[0]+=qx*L/2; f[6]+=qx*L/2; }
  if (qy) {
    f[1]+=qy*L/2; f[5]+=qy*L*L/12;
    f[7]+=qy*L/2; f[11]+=-qy*L*L/12;
  }
  if (qz) {
    f[2]+=qz*L/2; f[4]+=-qz*L*L/12;
    f[8]+=qz*L/2; f[10]+=qz*L*L/12;
  }
  return f;
}

function gaussianSolve(Ain, bin) {
  const n = bin.length;
  const A = Ain.map(r => r.slice());
  const b = bin.slice();
  for (let k=0;k<n;k++) {
    let p=k;
    for(let i=k+1;i<n;i++) if(Math.abs(A[i][k])>Math.abs(A[p][k])) p=i;
    if(Math.abs(A[p][k]) < 1e-14) throw new Error('Global stiffness matrix is singular/unstable. Check supports, connectivity, or releases.');
    [A[k],A[p]]=[A[p],A[k]]; [b[k],b[p]]=[b[p],b[k]];
    for(let i=k+1;i<n;i++) {
      const m=A[i][k]/A[k][k];
      if(Math.abs(m)<EPS) continue;
      A[i][k]=0;
      for(let j=k+1;j<n;j++) A[i][j]-=m*A[k][j];
      b[i]-=m*b[k];
    }
  }
  const x=Array(n).fill(0);
  for(let i=n-1;i>=0;i--){
    let s=b[i];
    for(let j=i+1;j<n;j++) s-=A[i][j]*x[j];
    x[i]=s/A[i][i];
  }
  return x;
}

function propsFor(member, materials, sections) {
  const mat = materials[member.material];
  const sec = sections[member.section];
  if(!mat) throw new Error(`Material '${member.material}' not found.`);
  if(!sec) throw new Error(`Section '${member.section}' not found.`);
  const E=Number(mat.E), nu=Number(mat.nu ?? 0.2), G=Number(mat.G ?? E/(2*(1+nu)));
  return {E,G,A:Number(sec.A),Iy:Number(sec.Iy),Iz:Number(sec.Iz),J:Number(sec.J)};
}

export function analyze(model) {
  const nodes = model.nodes || [];
  const members = model.members || [];
  if(nodes.length===0) throw new Error('No nodes in model.');
  const idToIndex = new Map(nodes.map((n,i)=>[String(n.id),i]));
  const ndof=nodes.length*6;
  const K=zeros(ndof,ndof), F=Array(ndof).fill(0);
  const memberCache=[];

  // Nodal loads
  for(const load of (model.nodalLoads||[])){
    const ni=idToIndex.get(String(load.node));
    if(ni===undefined) throw new Error(`Load references unknown node ${load.node}.`);
    const vals=[load.Fx||0,load.Fy||0,load.Fz||0,load.Mx||0,load.My||0,load.Mz||0].map(Number);
    for(let d=0;d<6;d++) F[ni*6+d]+=vals[d];
  }

  // Members + distributed load equivalent nodal forces
  const mlByMember = new Map();
  for(const ml of (model.memberLoads||[])){
    const key=String(ml.member); if(!mlByMember.has(key)) mlByMember.set(key,[]); mlByMember.get(key).push(ml);
  }

  for(const m of members){
    const i=idToIndex.get(String(m.i)), j=idToIndex.get(String(m.j));
    if(i===undefined||j===undefined) throw new Error(`Member ${m.id} references unknown node.`);
    const p1=nodes[i],p2=nodes[j];
    const L=Math.hypot(p2.x-p1.x,p2.y-p1.y,p2.z-p1.z);
    const prop=propsFor(m,model.materials||{},model.sections||{});
    const kl=frameLocalStiffness({...prop,L});
    const T=transform12(p1,p2,Number(m.roll||0));
    const kg=matMul(transpose(T),matMul(kl,T));
    const dofs=[...Array(6)].map((_,d)=>i*6+d).concat([...Array(6)].map((_,d)=>j*6+d));
    for(let a=0;a<12;a++) for(let b=0;b<12;b++) K[dofs[a]][dofs[b]]+=kg[a][b];

    let feqLocal=Array(12).fill(0);
    for(const ml of (mlByMember.get(String(m.id))||[])) {
      feqLocal=addVec(feqLocal,uniformLoadEquivalentLocal(L,Number(ml.qy||0),Number(ml.qz||0),Number(ml.qx||0)));
    }
    const feqGlobal=matVec(transpose(T),feqLocal);
    for(let a=0;a<12;a++) F[dofs[a]]+=feqGlobal[a];
    memberCache.push({m,i,j,L,prop,kl,T,dofs,feqLocal});
  }

  const restrained=new Set();
  for(const s of (model.supports||[])){
    const ni=idToIndex.get(String(s.node));
    if(ni===undefined) throw new Error(`Support references unknown node ${s.node}.`);
    const flags=[s.UX,s.UY,s.UZ,s.RX,s.RY,s.RZ];
    flags.forEach((v,d)=>{if(v) restrained.add(ni*6+d);});
  }
  const free=[]; for(let d=0;d<ndof;d++) if(!restrained.has(d)) free.push(d);
  if(free.length===0) throw new Error('All DOFs are restrained.');
  const Kff=free.map(r=>free.map(c=>K[r][c]));
  const Ff=free.map(d=>F[d]);
  const Uf=gaussianSolve(Kff,Ff);
  const U=Array(ndof).fill(0); free.forEach((d,k)=>U[d]=Uf[k]);
  const KU=matVec(K,U); const R=subVec(KU,F);

  const displacements=nodes.map((n,ni)=>({
    node:n.id, UX:U[ni*6], UY:U[ni*6+1], UZ:U[ni*6+2], RX:U[ni*6+3], RY:U[ni*6+4], RZ:U[ni*6+5]
  }));
  const reactions=[];
  for(const s of (model.supports||[])){
    const ni=idToIndex.get(String(s.node));
    reactions.push({node:s.node,Fx:R[ni*6],Fy:R[ni*6+1],Fz:R[ni*6+2],Mx:R[ni*6+3],My:R[ni*6+4],Mz:R[ni*6+5]});
  }
  const memberForces=memberCache.map(c=>{
    const ug=c.dofs.map(d=>U[d]);
    const ul=matVec(c.T,ug);
    const fl=subVec(matVec(c.kl,ul),c.feqLocal);
    return {
      member:c.m.id, length:c.L,
      i:{N:fl[0],Vy:fl[1],Vz:fl[2],T:fl[3],My:fl[4],Mz:fl[5]},
      j:{N:fl[6],Vy:fl[7],Vz:fl[8],T:fl[9],My:fl[10],Mz:fl[11]},
      localDisplacements:ul
    };
  });
  return {displacements,reactions,memberForces,globalDisplacement:U,globalLoad:F,freeDofs:free.length,restrainedDofs:restrained.size};
}

export function rectangularSection(b,h) {
  return { A:b*h, Iy:b*h**3/12, Iz:h*b**3/12, J:(b*h**3+h*b**3)/12 };
}
