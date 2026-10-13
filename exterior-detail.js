// Geometric finishing parts for the existing shop. Both returned groups use world coordinates.
export function createExteriorDetails(THREE, surfaces) {
  const group=new THREE.Group();group.name='Exterior crafted details';
  const roofDetails=new THREE.Group();roofDetails.name='Roof seams, fixings and drainage';
  const world=new Map(),roof=new Map();
  const fallback=new Map();
  const material=(kind,color)=>surfaces?.[kind]?surfaces[kind](color):fallback.get(`${kind}${color}`)||(()=>{const m=new THREE.MeshStandardMaterial({color,metalness:kind==='metal'?.72:.025,roughness:kind==='metal'?.36:.68});fallback.set(`${kind}${color}`,m);return m;})();
  const steel=material('metal',0xa8b8b7),darkSteel=material('metal',0x536872),pale=material('enamel',0xbdd4ce);
  const deep=material('enamel',0x263b45),rubber=material('concrete',0x26333b),roofPaint=material('enamel',0x49636b);
  const cache=new Map();
  const vendingFrame=new THREE.Matrix4().compose(new THREE.Vector3(2.72,.29,-.67),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),.2),new THREE.Vector3(1,1,1));
  const identity=new THREE.Matrix4();
  const reuse=(key,build)=>{if(!cache.has(key))cache.set(key,build());return cache.get(key);};
  function add(geo,mat,p=[0,0,0],rotation=[0,0,0],scale=[1,1,1],frame=identity,bucket=world){
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(...p),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),new THREE.Vector3(...scale));
    matrix.premultiply(frame);
    const transformed=geo.clone().applyMatrix4(matrix);
    if(!bucket.has(mat.uuid))bucket.set(mat.uuid,{material:mat,geometries:[]});bucket.get(mat.uuid).geometries.push(transformed);
  }
  function roundedBox(w,h,d,r=.008){
    r=Math.min(r,w*.24,h*.24,d*.24);const bevel=r*.52;
    return reuse(`r${w}/${h}/${d}/${r}`,()=>{
      const hw=w/2-bevel,hh=h/2-bevel,corner=Math.max(.0005,r-bevel),s=new THREE.Shape();
      s.moveTo(-hw+corner,-hh);s.lineTo(hw-corner,-hh);s.quadraticCurveTo(hw,-hh,hw,-hh+corner);
      s.lineTo(hw,hh-corner);s.quadraticCurveTo(hw,hh,hw-corner,hh);s.lineTo(-hw+corner,hh);
      s.quadraticCurveTo(-hw,hh,-hw,hh-corner);s.lineTo(-hw,-hh+corner);s.quadraticCurveTo(-hw,-hh,-hw+corner,-hh);
      const g=new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,steps:1,bevelEnabled:true,bevelSegments:3,bevelThickness:bevel,bevelSize:bevel,curveSegments:5});
      g.translate(0,0,-d/2+bevel);return g;
    });
  }
  const box=(w,h,d,mat,p,frame=identity,bucket=world,r=.008,rotation=[0,0,0])=>add(roundedBox(w,h,d,r),mat,p,rotation,[1,1,1],frame,bucket);
  const cylinder=(r,h,mat,p,frame=identity,bucket=world,rotation=[0,0,0],segments=24)=>add(reuse(`c${r}/${h}/${segments}`,()=>new THREE.CylinderGeometry(r,r,h,segments)),mat,p,rotation,[1,1,1],frame,bucket);
  const ring=(r,t,mat,p,frame=identity,bucket=world,rotation=[0,0,0])=>add(reuse(`t${r}/${t}`,()=>new THREE.TorusGeometry(r,t,8,40)),mat,p,rotation,[1,1,1],frame,bucket);
  function rod(a,b,r,mat,frame=identity,bucket=world){
    const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),direction=bv.clone().sub(av),q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
    const geometry=reuse(`rod${r}`,()=>new THREE.CylinderGeometry(r,r,1,12));
    const matrix=new THREE.Matrix4().compose(av.add(bv).multiplyScalar(.5),q,new THREE.Vector3(1,direction.length(),1));matrix.premultiply(frame);
    if(!bucket.has(mat.uuid))bucket.set(mat.uuid,{material:mat,geometries:[]});bucket.get(mat.uuid).geometries.push(geometry.clone().applyMatrix4(matrix));
  }
  function screw(p,frame=identity,bucket=world,axis='z',size=.009){
    const rot=axis==='y'?[0,0,0]:axis==='x'?[0,0,Math.PI/2]:[Math.PI/2,0,0];
    cylinder(size*1.50,.0028,steel,p,frame,bucket,rot,24);
    const head=[...p];head[axis==='x'?0:axis==='y'?1:2]+=.0032;
    cylinder(size,.006,steel,head,frame,bucket,rot,6);
  }
  function canvasTexture(w,h,draw,name){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.name=name;t.anisotropy=4;return t;}
  const palette=['#a6ccb2','#dbc084','#cb9187','#8faecc','#d6d6bf'];
  const atlas=canvasTexture(256,256,(ctx)=>{
    const titles=['抹茶','柚子','珈琲','天然水','ミルク'];
    for(let i=0;i<16;i++){const x=i%4*64,y=Math.floor(i/4)*64;ctx.fillStyle=palette[i%5];ctx.fillRect(x,y,64,64);
      ctx.fillStyle='rgba(255,255,246,.86)';ctx.fillRect(x+3,y+5,58,2);ctx.fillRect(x+3,y+54,58,2);
      ctx.textAlign='center';ctx.fillStyle='#284b55';ctx.font='7px sans-serif';ctx.fillText('TSUKI • SELECT',x+32,y+18);
      ctx.font='bold 15px "Yu Gothic",sans-serif';ctx.fillText(titles[i%5],x+32,y+38);ctx.font='7px sans-serif';ctx.fillText(i%3?'COLD  190 ml':'FRESH  250 ml',x+32,y+49);
    }
  },'Small printed drink labels');
  const labelMat=new THREE.MeshBasicMaterial({map:atlas,color:0xffffff});
  const priceTexture=canvasTexture(128,32,(c,w,h)=>{c.fillStyle='#e4e7d7';c.fillRect(0,0,w,h);c.fillStyle='#354c57';c.font='bold 21px sans-serif';c.textAlign='center';c.fillText('¥ 130',w/2,24);},'Vending price');
  const priceMat=new THREE.MeshBasicMaterial({map:priceTexture});
  const bottleColors=palette.map(c=>material('enamel',new THREE.Color(c).getHex()));
  for(let row=0;row<3;row++)for(let col=0;col<5;col++){
    const x=-.32+col*.123,y=.73+row*.32,z=.406,id=row*5+col;
    cylinder(.0376,.152,bottleColors[(row+col)%5],[x,y,z],vendingFrame);
    ring(.035,.0024,steel,[x,y-.068,z],vendingFrame,world,[Math.PI/2,0,0]);
    const wrapper=new THREE.CylinderGeometry(.038,.038,.102,28,1,true,-Math.PI*.44,Math.PI*.88);
    const uv=wrapper.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,(id%4+uv.getX(i))/4,(3-Math.floor(id/4)+uv.getY(i))/4);
    add(wrapper,labelMat,[x,y-.007,z],[0,0,0],[1,1,1],vendingFrame);wrapper.dispose();
    if(id%3===0){
      const shoulder=new THREE.CylinderGeometry(.026,.0376,.036,24);add(shoulder,bottleColors[(row+col)%5],[x,y+.092,z],[0,0,0],[1,1,1],vendingFrame);shoulder.dispose();
      cylinder(.025,.021,pale,[x,y+.116,z],vendingFrame);cylinder(.027,.018,steel,[x,y+.132,z],vendingFrame);
      for(let a=0;a<12;a++){const angle=a*Math.PI/6;cylinder(.0014,.014,darkSteel,[x+Math.sin(angle)*.0265,y+.132,z+Math.cos(angle)*.0265],vendingFrame,world,[0,0,0],6);}
    }else{
      cylinder(.033,.008,steel,[x,y+.079,z],vendingFrame);ring(.028,.0016,darkSteel,[x,y+.084,z],vendingFrame,world,[Math.PI/2,0,0]);
      add(reuse('pulltab',()=>new THREE.TorusGeometry(.006,.0017,5,16)),steel,[x,y+.086,z+.004],[Math.PI/2,0,0],[.72,1.3,1],vendingFrame);
    }
    ring(.023,.0042,steel,[x,y-.110,.482],vendingFrame);cylinder(.018,.008,pale,[x,y-.110,.480],vendingFrame,world,[Math.PI/2,0,0]);
    const priceGeo=new THREE.PlaneGeometry(.060,.017);add(priceGeo,priceMat,[x,y-.147,.461],[0,0,0],[1,1,1],vendingFrame);priceGeo.dispose();
  }
  // Layered display surround, cabinet seams, payment controls and a recessed pickup flap.
  for(const x of [-.430,.282])box(.018,1.142,.035,steel,[x,1.023,.457],vendingFrame);
  for(const y of [.453,1.593])box(.713,.018,.035,steel,[-.074,y,.457],vendingFrame);
  const displayGlass=new THREE.MeshPhysicalMaterial({color:0xcfe8e7,roughness:.12,metalness:0,transparent:true,opacity:.040,depthWrite:false,clearcoat:.35});
  box(.693,1.117,.006,displayGlass,[-.074,1.023,.474],vendingFrame,world,.001);
  for(const x of [-.450,.450])box(.014,1.722,.024,pale,[x,.900,.330],vendingFrame);
  for(const y of [.105,1.610])box(.888,.012,.020,darkSteel,[0,y,.329],vendingFrame);
  for(const y of [.34,.87,1.42]){box(.046,.064,.018,steel,[-.443,y,.344],vendingFrame);cylinder(.012,.061,steel,[-.465,y,.353],vendingFrame);screw([-.439,y,.357],vendingFrame,world,'z',.0045);}
  for(const x of [-.33,.33])for(const z of [-.215,.215]){cylinder(.043,.026,rubber,[x,.011,z],vendingFrame);cylinder(.025,.016,steel,[x,.030,z],vendingFrame);}
  box(.115,.366,.018,steel,[.343,.904,.366],vendingFrame,world,.007);
  box(.073,.118,.011,deep,[.343,.982,.380],vendingFrame,world,.006);
  ring(.023,.003,steel,[.343,.877,.386],vendingFrame);cylinder(.019,.003,deep,[.343,.877,.385],vendingFrame,world,[Math.PI/2,0,0]);
  box(.004,.028,.006,steel,[.343,.877,.388],vendingFrame,world,.001);
  cylinder(.014,.009,pale,[.343,.818,.389],vendingFrame,world,[Math.PI/2,0,0]);
  for(const y of [.738,1.070])screw([.343,y,.378],vendingFrame,world,'z',.004);
  for(const x of [-.345,.345])box(.028,.225,.063,steel,[x,.292,.383],vendingFrame);
  for(const y of [.184,.403])box(.715,.026,.063,steel,[0,y,.383],vendingFrame);
  box(.607,.137,.014,deep,[0,.286,.401],vendingFrame,world,.016);
  box(.602,.058,.018,darkSteel,[0,.326,.425],vendingFrame,world,.007,[-.24,0,0]);
  box(.597,.020,.133,steel,[0,.199,.420],vendingFrame,world,.007);
  for(const x of [-.30,.30])screw([x,.403,.420],vendingFrame,world,'z',.005);

  // Soft grounding only: no extra lights, bloom or exposure changes.
  const shadowTexture=canvasTexture(128,128,(c)=>{const g=c.createRadialGradient(64,64,8,64,64,63);g.addColorStop(0,'rgba(10,19,25,.24)');g.addColorStop(.55,'rgba(10,19,25,.13)');g.addColorStop(1,'rgba(10,19,25,0)');c.fillStyle=g;c.fillRect(0,0,128,128);},'Soft equipment contact shadow');
  const shadowMat=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  add(new THREE.PlaneGeometry(1.15,.84),shadowMat,[0,.002,.015],[-Math.PI/2,0,0],[1,1,1],vendingFrame);

  // Fixed entrance fittings. Nothing is attached to the independently sliding leaves.
  for(const x of [.205,1.900])for(const y of [.415,2.625])screw([x,y,.883],identity,world,'z',.0065);
  for(const z of [.845,.947])rod([.165,.374,z],[1.945,.374,z],.004,steel);
  for(const z of [.860,.940])rod([.19,2.737,z],[1.73,2.737,z],.007,steel);
  for(const x of [.18,1.74])box(.065,.103,.142,steel,[x,2.73,.90],identity,world,.010);
  box(.134,.040,.056,deep,[.96,2.793,1.001],identity,world,.009);
  cylinder(.011,.007,darkSteel,[.943,2.793,1.033],identity,world,[Math.PI/2,0,0]);
  for(const x of [-3.77,-2.48,-1.17])for(const y of [.625,2.604])screw([x,y,.884],identity,world,'z',.0055);
  // Lightbox face clips and subtle trim joints, kept clear of the lettering.
  for(const x of [-3.86,1.98])for(const y of [2.785,3.325])screw([x,y,1.127],identity,world,'z',.007);
  for(const x of [-3.62,-.98,1.73]){
    box(.052,.082,.100,steel,[x,3.391,1.127],identity,world,.008);
    screw([x,3.381,1.182],identity,world,'z',.006);
  }
  for(const z of [-3.49,-1.50,.78]){
    box(.072,.105,.058,darkSteel,[2.177,3.389,z],identity,world,.008);
    rod([2.182,3.335,z],[2.264,3.430,z],.010,steel);
  }

  // Air-conditioner: actual disks, five curved blades, concentric guards and housing bolts.
  function fan(center,radius,axis='z'){
    const frame=new THREE.Matrix4().compose(new THREE.Vector3(...center),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),axis==='x'?-Math.PI/2:0),new THREE.Vector3(1,1,1));
    cylinder(radius,.014,deep,[0,0,0],frame,world,[Math.PI/2,0,0],40);
    const bladeShape=new THREE.Shape();bladeShape.moveTo(.02,-.025);bladeShape.quadraticCurveTo(.13,-.10,.177,-.048);bladeShape.quadraticCurveTo(.19,.00,.125,.04);bladeShape.quadraticCurveTo(.073,.028,.02,.018);
    const bladeGeometry=new THREE.ExtrudeGeometry(bladeShape,{depth:.007,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2,curveSegments:10});
    for(let a=0;a<5;a++)add(bladeGeometry,darkSteel,[0,0,.012],[0,0,a*Math.PI*2/5],[radius/.22,radius/.22,1],frame);
    bladeGeometry.dispose();
    cylinder(radius*.19,.027,steel,[0,0,.025],frame,world,[Math.PI/2,0,0],24);
    for(const proportion of [.27,.48,.70,.92,1])ring(radius*proportion,.0044,steel,[0,0,.041],frame);
    for(let a=0;a<8;a++){const angle=a*Math.PI/4;rod([0,0,.045],[Math.sin(angle)*radius,.0+Math.cos(angle)*radius,.045],.0038,steel,frame);}
    for(const sx of [-1,1])for(const sy of [-1,1])screw([sx*radius*.83,sy*radius*.83,.040],frame,world,'z',.006);
  }
  fan([-4.245,.783,-2.502],.224,'z');fan([-4.607,.787,-2.734],.172,'x');
  for(let i=0;i<7;i++)box(.101,.011,.013,darkSteel,[-3.844,.645+i*.051,-2.508],identity,world,.003);
  for(const x of [-4.56,-3.73])for(const y of [.503,1.054])screw([x,y,-2.505],identity,world,'z',.007);
  for(const x of [-4.47,-3.93]){
    box(.105,.035,.489,steel,[x,.425,-2.735],identity,world,.009);
    box(.094,.038,.103,rubber,[x,.453,-2.711],identity,world,.009);
    rod([x,.414,-2.72],[-3.886,.414,-2.72],.015,steel);
  }
  for(const y of [1.47,1.91]){
    ring(.039,.006,steel,[-3.90,y,-2.30],identity,world,[Math.PI/2,0,0]);
    box(.065,.052,.026,steel,[-3.862,y,-2.30],identity,world,.006);screw([-3.906,y,-2.267],identity,world,'z',.005);
  }

  // Roof panel overlap seams and fasteners, returned separately for the cutaway view.
  for(const z of [-2.29,-.69]){
    box(5.99,.012,.037,roofPaint,[-.96,3.701,z],identity,roof,.004);
    for(let x=-3.83;x<2.0;x+=.44)screw([x,3.710,z],identity,roof,'y',.009);
  }
  for(const x of [-3.975,2.062])for(let z=-3.62;z<.88;z+=.58)screw([x,3.746,z],identity,roof,'y',.008);
  // Front rain channel has a basin and two rounded lips; its end caps are individually visible.
  box(6.15,.018,.131,darkSteel,[-.97,3.430,1.193],identity,roof,.006);
  for(const z of [1.127,1.257])rod([-4.025,3.461,z],[2.099,3.461,z],.012,steel,identity,roof);
  for(const x of [-4.027,2.100])box(.026,.068,.151,steel,[x,3.456,1.191],identity,roof,.007);
  for(const x of [-3.84,-2.62,-1.4,-.18,1.04,1.98]){
    box(.046,.045,.184,roofPaint,[x,3.421,1.192],identity,roof,.006);screw([x,3.459,1.270],identity,roof,'z',.006);
  }
  for(const x of [-3.958,2.025]){
    cylinder(.067,.009,deep,[x,3.715,-3.674],identity,roof);
    ring(.073,.010,steel,[x,3.722,-3.674],identity,roof,[Math.PI/2,0,0]);
    for(const d of [-.025,0,.025])rod([x-.052,3.730,-3.674+d],[x+.052,3.730,-3.674+d],.0035,steel,identity,roof);
  }
  // Raised service cover, corner tabs and vent weather collars supply a finer roof scale.
  box(.432,.026,.310,roofPaint,[-.28,3.717,-2.86],identity,roof,.018);
  for(const x of [-.459,-.101])for(const z of [-2.969,-2.751])screw([x,3.736,z],identity,roof,'y',.007);
  ring(.306,.013,steel,[.64,3.726,-2.75],identity,roof,[Math.PI/2,0,0]);
  for(const x of [-2.734,-1.766])for(const z of [-2.43,-1.77])screw([x,4.335,z],identity,roof,'y',.007);

  function finish(bucket,target){
    for(const {material,geometries} of bucket.values()){
      const positions=[],normals=[],uvs=[];
      for(const source of geometries){const geo=source.index?source.toNonIndexed():source;
        positions.push(...geo.attributes.position.array);normals.push(...geo.attributes.normal.array);
        if(geo.attributes.uv)uvs.push(...geo.attributes.uv.array);else uvs.push(...new Float32Array(geo.attributes.position.count*2));
        if(geo!==source)geo.dispose();source.dispose();
      }
      const merged=new THREE.BufferGeometry();merged.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      merged.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));merged.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));merged.computeBoundingSphere();
      const mesh=new THREE.Mesh(merged,material);mesh.name=`Finishing parts — ${material.name||material.type}`;
      mesh.castShadow=!material.transparent&&!material.isMeshBasicMaterial;mesh.receiveShadow=!material.isMeshBasicMaterial;
      target.add(mesh);
    }
  }
  finish(world,group);finish(roof,roofDetails);
  return {group,roofDetails};
}
