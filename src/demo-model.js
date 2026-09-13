export const demoModel = {
  meta:{name:'SAPUDOM V1 Demo Portal Frame',units:'N-m-Pa'},
  materials:{
    C25:{E:25e9,nu:0.2}
  },
  sections:{
    C300x300:{A:0.09,Iy:0.000675,Iz:0.000675,J:0.00135},
    B250x450:{A:0.1125,Iy:0.0018984375,Iz:0.0005859375,J:0.002484375}
  },
  nodes:[
    {id:'N1',x:0,y:0,z:0}, {id:'N2',x:5,y:0,z:0},
    {id:'N3',x:0,y:0,z:3}, {id:'N4',x:5,y:0,z:3}
  ],
  members:[
    {id:'C1',i:'N1',j:'N3',material:'C25',section:'C300x300'},
    {id:'C2',i:'N2',j:'N4',material:'C25',section:'C300x300'},
    {id:'B1',i:'N3',j:'N4',material:'C25',section:'B250x450'}
  ],
  supports:[
    {node:'N1',UX:true,UY:true,UZ:true,RX:true,RY:true,RZ:true},
    {node:'N2',UX:true,UY:true,UZ:true,RX:true,RY:true,RZ:true}
  ],
  nodalLoads:[
    {node:'N3',Fx:10000,Fy:0,Fz:0,Mx:0,My:0,Mz:0}
  ],
  memberLoads:[
    {member:'B1',qz:-15000}
  ]
};
