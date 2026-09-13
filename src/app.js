import { analyze } from './engine.js';
import { demoModel } from './demo-model.js';

const $ = s => document.querySelector(s);
let model = structuredClone(demoModel);
let results = null;

function fmt(v){
  if(!Number.isFinite(v)) return '—';
  const a=Math.abs(v); if(a===0) return '0';
  if(a<1e-3 || a>=1e6) return v.toExponential(4);
  return v.toLocaleString(undefined,{maximumFractionDigits:5});
}

function updateEditor(){ $('#modelJson').value=JSON.stringify(model,null,2); draw(); updateCounts(); }
function updateCounts(){
  $('#nodeCount').textContent=model.nodes?.length||0;
  $('#memberCount').textContent=model.members?.length||0;
  $('#loadCount').textContent=(model.nodalLoads?.length||0)+(model.memberLoads?.length||0);
}

function run(){
  try{
    model=JSON.parse($('#modelJson').value);
    results=analyze(model);
    $('#status').textContent='Analysis completed'; $('#status').className='status ok';
    renderResults(); draw();
  }catch(e){
    $('#status').textContent=e.message; $('#status').className='status error';
    console.error(e);
  }
}

function renderResults(){
  if(!results) return;
  $('#summary').innerHTML=`<div><b>${results.freeDofs}</b><span>Free DOF</span></div><div><b>${results.restrainedDofs}</b><span>Restrained DOF</span></div><div><b>${results.displacements.length}</b><span>Nodes solved</span></div><div><b>${results.memberForces.length}</b><span>Members solved</span></div>`;
  $('#dispBody').innerHTML=results.displacements.map(r=>`<tr><td>${r.node}</td><td>${fmt(r.UX)}</td><td>${fmt(r.UY)}</td><td>${fmt(r.UZ)}</td><td>${fmt(r.RX)}</td><td>${fmt(r.RY)}</td><td>${fmt(r.RZ)}</td></tr>`).join('');
  $('#reactBody').innerHTML=results.reactions.map(r=>`<tr><td>${r.node}</td><td>${fmt(r.Fx)}</td><td>${fmt(r.Fy)}</td><td>${fmt(r.Fz)}</td><td>${fmt(r.Mx)}</td><td>${fmt(r.My)}</td><td>${fmt(r.Mz)}</td></tr>`).join('');
  $('#forceBody').innerHTML=results.memberForces.flatMap(r=>[
    `<tr><td>${r.member}</td><td>i</td><td>${fmt(r.i.N)}</td><td>${fmt(r.i.Vy)}</td><td>${fmt(r.i.Vz)}</td><td>${fmt(r.i.T)}</td><td>${fmt(r.i.My)}</td><td>${fmt(r.i.Mz)}</td></tr>`,
    `<tr><td>${r.member}</td><td>j</td><td>${fmt(r.j.N)}</td><td>${fmt(r.j.Vy)}</td><td>${fmt(r.j.Vz)}</td><td>${fmt(r.j.T)}</td><td>${fmt(r.j.My)}</td><td>${fmt(r.j.Mz)}</td></tr>`
  ]).join('');
}

function project(p, bounds, w,h){
  // Simple isometric projection (x horizontal, z vertical, y depth).
  const sx=(p.x-bounds.cx) - 0.45*(p.y-bounds.cy);
  const sy=(p.z-bounds.cz) + 0.25*(p.y-bounds.cy);
  const scale=bounds.scale; return [w/2+sx*scale,h/2-sy*scale];
}

function draw(){
  const c=$('#view'), ctx=c.getContext('2d');
  const rect=c.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  c.width=Math.max(600,rect.width*dpr); c.height=Math.max(360,rect.height*dpr); ctx.scale(dpr,dpr);
  const w=c.width/dpr,h=c.height/dpr; ctx.clearRect(0,0,w,h);
  ctx.fillStyle='#0c1320';ctx.fillRect(0,0,w,h);
  const nodes=model.nodes||[]; if(!nodes.length) return;
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y),zs=nodes.map(n=>n.z);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const span=Math.max(maxX-minX,maxY-minY,maxZ-minZ,1);
  const bounds={cx:(minX+maxX)/2,cy:(minY+maxY)/2,cz:(minZ+maxZ)/2,scale:Math.min(w,h)*0.65/span};
  const map=new Map(nodes.map(n=>[String(n.id),n]));
  ctx.lineWidth=5; ctx.lineCap='round';
  for(const m of (model.members||[])){
    const a=map.get(String(m.i)),b=map.get(String(m.j)); if(!a||!b) continue;
    const [x1,y1]=project(a,bounds,w,h),[x2,y2]=project(b,bounds,w,h);
    ctx.strokeStyle='#6dd6ff';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  }
  if(results){
    const disp=new Map(results.displacements.map(r=>[String(r.node),r]));
    let maxU=0; for(const r of results.displacements) maxU=Math.max(maxU,Math.hypot(r.UX,r.UY,r.UZ));
    const factor=maxU>0?Math.min(span*0.12/maxU,500):0;
    ctx.lineWidth=2;ctx.setLineDash([7,5]);
    for(const m of (model.members||[])){
      const a=map.get(String(m.i)),b=map.get(String(m.j)); const da=disp.get(String(m.i)),db=disp.get(String(m.j));
      if(!a||!b||!da||!db) continue;
      const aa={x:a.x+da.UX*factor,y:a.y+da.UY*factor,z:a.z+da.UZ*factor};
      const bb={x:b.x+db.UX*factor,y:b.y+db.UY*factor,z:b.z+db.UZ*factor};
      const [x1,y1]=project(aa,bounds,w,h),[x2,y2]=project(bb,bounds,w,h);
      ctx.strokeStyle='#ffb55e';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle='#ffb55e';ctx.fillText(`Deformed shape auto-scale ×${factor.toFixed(1)}`,14,24);
  }
  for(const n of nodes){
    const [x,y]=project(n,bounds,w,h);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#c6d4e6';ctx.font='12px system-ui';ctx.fillText(String(n.id),x+8,y-8);
  }
}

$('#runBtn').addEventListener('click',run);
$('#demoBtn').addEventListener('click',()=>{model=structuredClone(demoModel);results=null;updateEditor();$('#status').textContent='Demo loaded';$('#status').className='status';});
$('#formatBtn').addEventListener('click',()=>{try{model=JSON.parse($('#modelJson').value);updateEditor()}catch(e){alert(e.message)}});
$('#exportBtn').addEventListener('click',()=>{
  const blob=new Blob([$('#modelJson').value],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='sapudom-model.json';a.click();URL.revokeObjectURL(a.href);
});
$('#importInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;$('#modelJson').value=await f.text();try{model=JSON.parse($('#modelJson').value);results=null;updateCounts();draw()}catch(err){alert(err.message)}});
window.addEventListener('resize',draw);
updateEditor();run();
