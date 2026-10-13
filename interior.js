import * as THREE from 'three';

// All fittings share the scene's metre-scale origin; the room floor is y = .33.
export function createInterior() {
  const group = new THREE.Group();
  group.name = 'Warm, fully stocked convenience store interior';
  const colliders = [];
  const boxes = [], cylinders = [], edges = [];
  const bottleBodies=[],bottleCaps=[],drinkCans=[],sealRings=[],pillowPackets=[],beveledPackets=[];
  const contactPositions=[],contactUVs=[],contactStrengths=[];
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const gradient = new THREE.DataTexture(new Uint8Array([74, 150, 212, 255]), 4, 1, THREE.RedFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  const toon = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradient });
  const glow = new THREE.MeshBasicMaterial({ color: 0xffebbf });
  const coolGlow = new THREE.MeshBasicMaterial({ color: 0xe7fff9 });
  const glass = new THREE.MeshBasicMaterial({color: 0xa8eee2, transparent: true, opacity: .08, depthWrite: false, side: THREE.DoubleSide});
  const C = {
    ivory: '#ede4cf', cream: '#f8efd9', shelf: '#e2d9c8', navy: '#384450',
    dark: '#273340', metal: '#8d9a9b', edge: '#343948', coral: '#d48371',
    mint: '#86bca5', gold: '#dda667', rose: '#e7a5a6', white: '#fff5df'
  };
  let seed = 14807;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function outlineBox(x,y,z,w,h,d,rotation=0) {
    const cs=Math.cos(rotation), sn=Math.sin(rotation);
    const vertices=[];
    for (let i=0;i<8;i++) {
      const px=(i&1 ? .5 : -.5)*w, py=(i&2 ? .5 : -.5)*h, pz=(i&4 ? .5 : -.5)*d;
      vertices.push([x+px*cs+pz*sn,y+py,z-px*sn+pz*cs]);
    }
    for (let i=0;i<8;i++) for (const bit of [1,2,4]) if (!(i&bit)) edges.push(...vertices[i],...vertices[i|bit]);
  }
  function box(x,y,z,w,h,d,color=C.ivory,edge=false,rotation=0) {
    boxes.push({x,y,z,w,h,d,color,rotation});
    if (edge) outlineBox(x,y,z,w,h,d,rotation);
  }
  function cyl(x,y,z,r,h,color,rotation=0,rotationX=0) { cylinders.push({x,y,z,r,h,color,rotation,rotationX}); }
  function litBox(x,y,z,w,h,d,mat=glow) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    mesh.position.set(x,y,z); group.add(mesh); return mesh;
  }
  function collider(x,z,w,d) { colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2}); }
  const fonts='"Yu Gothic", "Hiragino Kaku Gothic ProN", "Meiryo", sans-serif';
  function label(text,x,y,z,w,h,options={}) {
    const canvas=document.createElement('canvas'); canvas.width=512; canvas.height=Math.max(80,Math.round(512*h/w));
    const ctx=canvas.getContext('2d');
    ctx.fillStyle=options.bg || '#f8efd8'; ctx.fillRect(0,0,canvas.width,canvas.height);
    if(options.border!==false) {ctx.strokeStyle=options.borderColor || '#c8b994';ctx.lineWidth=6;ctx.strokeRect(4,4,canvas.width-8,canvas.height-8);}
    if (options.stripe) {ctx.fillStyle=options.stripe;ctx.fillRect(0,0,canvas.width,canvas.height*.13);}
    ctx.fillStyle=options.fg || '#42545a'; ctx.textAlign='center';ctx.textBaseline='middle';
    const lines=String(text).split('\n');
    lines.forEach((line,i)=>{
      let fontSize=Math.min(canvas.height/(lines.length+ .65),canvas.width/Math.max(2.3,line.length*.96));
      if (i>0 && options.smallSecond) fontSize*=.64;
      ctx.font=`${i===0?'700':'500'} ${fontSize}px ${fonts}`;
      ctx.fillText(line,canvas.width*.5,canvas.height*(i+.5)/lines.length,canvas.width*.91);
    });
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
    mesh.position.set(x,y,z);mesh.rotation.y=options.rotation || 0; group.add(mesh);return mesh;
  }
  // One painted atlas supplies hundreds of legible package fronts and price tags.
  // Coordinates and shelf footprints remain unchanged; these are surface details.
  const decalPositions=[],decalUVs=[],foodPieces=[];
  const atlasCanvas=document.createElement('canvas');atlasCanvas.width=atlasCanvas.height=1024;
  const atlasCtx=atlasCanvas.getContext('2d'),cell=256;
  const packaging=[
    ['ポテト','うすしお','#e6be78','snack'],['ビスケット','BUTTER BISCUITS','#dca681','cookie'],
    ['いちご','MILK CANDY','#d8a5aa','berry'],['しょうゆ','CUP NOODLES','#b5c3a2','noodle'],
    ['やわらか','TISSUE 150','#b6c6ba','tissue'],['暮らし','CLEAN CARE','#aabdc7','leaf'],
    ['緑茶','JAPANESE TEA','#94b5a0','leaf'],['珈琲','BLACK COFFEE','#b4a08a','bean'],
    ['牛乳','FRESH MILK','#dde0ce','milk'],['天然水','NATURAL WATER','#acc5cf','water'],
    ['おにぎり','鮭・梅・昆布','#d9ddbf','rice'],['手づくり','本日のお弁当','#e3c1a1','bento'],
    ['おすすめ','税込 ¥128','#f1dfa7','price'],['月灯り','24 H  KONBINI','#f3ecd9','receipt'],
    ['お支払い','CASH / IC / QR','#dce5d2','payment'],['入荷しました','KEEP DRY  /  12 PCS','#c9ad85','parcel']
  ];
  for(let id=0;id<packaging.length;id++){
    const [title,sub,bg,kind]=packaging[id],ox=(id%4)*cell,oy=Math.floor(id/4)*cell;
    atlasCtx.save();atlasCtx.translate(ox,oy);atlasCtx.fillStyle=bg;atlasCtx.fillRect(0,0,cell,cell);
    atlasCtx.strokeStyle='rgba(64,71,61,.35)';atlasCtx.lineWidth=3;atlasCtx.strokeRect(8,8,240,240);
    atlasCtx.fillStyle='#f4ebd6';atlasCtx.fillRect(16,18,224,55);atlasCtx.textAlign='center';atlasCtx.textBaseline='middle';
    atlasCtx.fillStyle='#4e6257';atlasCtx.font=`700 ${title.length>5?29:38}px ${fonts}`;atlasCtx.fillText(title,128,46,215);
    atlasCtx.font=`600 ${sub.length>15?13:17}px ${fonts}`;atlasCtx.fillText(sub,128,218,225);
    atlasCtx.fillStyle='#f8efd8';atlasCtx.beginPath();atlasCtx.ellipse(128,139,77,57,0,0,Math.PI*2);atlasCtx.fill();
    if(kind==='snack'||kind==='cookie'){
      for(let i=0;i<3;i++){atlasCtx.fillStyle=kind==='snack'?'#c99b52':'#b78a58';atlasCtx.beginPath();atlasCtx.ellipse(93+i*32,137+(i%2)*8,26,kind==='snack'?40:27,-.4+i*.4,0,Math.PI*2);atlasCtx.fill();if(kind==='cookie'){atlasCtx.fillStyle='#715a42';for(let j=0;j<4;j++){atlasCtx.beginPath();atlasCtx.arc(83+i*32+(j%2)*16,127+(i%2)*8+Math.floor(j/2)*16,3,0,Math.PI*2);atlasCtx.fill();}}}
    }else if(kind==='leaf'){
      atlasCtx.strokeStyle='#5d8067';atlasCtx.lineWidth=5;atlasCtx.beginPath();atlasCtx.moveTo(103,176);atlasCtx.lineTo(149,109);atlasCtx.stroke();
      for(let i=0;i<4;i++){atlasCtx.fillStyle=i%2?'#749979':'#8ba682';atlasCtx.beginPath();atlasCtx.ellipse(107+i*10,151-i*12,24,11,i%2?.5:-.5,0,Math.PI*2);atlasCtx.fill();}
    }else if(kind==='bean'){
      for(const [x,y,a] of [[109,134,-.3],[149,146,.4]]){atlasCtx.fillStyle='#705a46';atlasCtx.beginPath();atlasCtx.ellipse(x,y,21,30,a,0,Math.PI*2);atlasCtx.fill();atlasCtx.strokeStyle='#d0b08a';atlasCtx.lineWidth=3;atlasCtx.beginPath();atlasCtx.moveTo(x+4,y-20);atlasCtx.quadraticCurveTo(x-8,y,x+1,y+22);atlasCtx.stroke();}
    }else if(kind==='berry'){
      atlasCtx.fillStyle='#bb7880';atlasCtx.beginPath();atlasCtx.moveTo(92,119);atlasCtx.quadraticCurveTo(130,91,162,123);atlasCtx.quadraticCurveTo(158,166,130,181);atlasCtx.quadraticCurveTo(93,163,92,119);atlasCtx.fill();atlasCtx.fillStyle='#79906d';for(let i=0;i<4;i++){atlasCtx.beginPath();atlasCtx.ellipse(111+i*10,114,18,7,(i-1.5)*.4,0,Math.PI*2);atlasCtx.fill();}
      atlasCtx.fillStyle='#e2cda4';for(let i=0;i<8;i++){atlasCtx.beginPath();atlasCtx.arc(107+(i%3)*18,130+Math.floor(i/3)*15,2.3,0,Math.PI*2);atlasCtx.fill();}
    }else if(kind==='rice'){
      atlasCtx.fillStyle='#5d6454';atlasCtx.beginPath();atlasCtx.moveTo(78,175);atlasCtx.lineTo(129,99);atlasCtx.lineTo(181,175);atlasCtx.closePath();atlasCtx.fill();atlasCtx.fillStyle='#ede6d2';atlasCtx.beginPath();atlasCtx.moveTo(88,167);atlasCtx.lineTo(129,110);atlasCtx.lineTo(169,167);atlasCtx.closePath();atlasCtx.fill();atlasCtx.fillStyle='#42624e';atlasCtx.fillRect(116,143,27,38);
    }else if(kind==='milk'||kind==='water'||kind==='tissue'){
      atlasCtx.fillStyle=kind==='milk'?'#a4bab8':kind==='water'?'#8dafa9':'#a8b7a3';atlasCtx.fillRect(94,112,68,69);atlasCtx.fillStyle='#e9ead8';atlasCtx.fillRect(102,124,52,42);atlasCtx.fillStyle='#7e9e9b';atlasCtx.fillRect(98,99,60,17);atlasCtx.fillStyle='#557770';atlasCtx.font=`700 28px ${fonts}`;atlasCtx.fillText(kind==='milk'?'MILK':kind==='water'?'水':'柔',128,146);
    }else if(kind==='noodle'||kind==='bento'){
      atlasCtx.fillStyle='#687967';atlasCtx.fillRect(69,107,119,72);atlasCtx.fillStyle='#d7c694';atlasCtx.fillRect(76,114,106,58);atlasCtx.strokeStyle='#a27c54';atlasCtx.lineWidth=5;
      for(let i=0;i<5;i++){atlasCtx.beginPath();atlasCtx.moveTo(84+i*19,118);atlasCtx.bezierCurveTo(68+i*19,132,108+i*19,148,84+i*19,166);atlasCtx.stroke();}atlasCtx.fillStyle='#8f9c64';atlasCtx.fillRect(143,119,24,16);
    }else if(kind==='price'){
      atlasCtx.fillStyle='#a76a4c';atlasCtx.font=`700 75px ${fonts}`;atlasCtx.fillText('128',128,142);atlasCtx.font=`600 21px ${fonts}`;atlasCtx.fillText('円',200,161);atlasCtx.fillStyle='#e5b57f';atlasCtx.fillRect(21,82,65,6);
    }else if(kind==='payment'){
      for(let i=0;i<3;i++){atlasCtx.fillStyle=['#7a9c8a','#879baa','#c09579'][i];atlasCtx.fillRect(40+i*59,103,49,33);atlasCtx.fillStyle='#edeada';atlasCtx.fillRect(46+i*59,112,14,10);}
      atlasCtx.fillStyle='#647b69';atlasCtx.font=`700 21px ${fonts}`;atlasCtx.fillText('タッチできます',128,165);
    }else if(kind==='receipt'){
      atlasCtx.fillStyle='#f3ecdc';atlasCtx.fillRect(32,80,192,124);atlasCtx.fillStyle='#7c8070';for(let j=0;j<5;j++){atlasCtx.fillRect(47,89+j*17,78+(j%2)*21,3);atlasCtx.fillRect(163,89+j*17,42,3);}atlasCtx.fillRect(43,181,169,5);
    }else if(kind==='parcel'){
      atlasCtx.strokeStyle='#7e7960';atlasCtx.lineWidth=7;atlasCtx.beginPath();atlasCtx.moveTo(83,153);atlasCtx.lineTo(83,109);atlasCtx.lineTo(68,128);atlasCtx.moveTo(83,109);atlasCtx.lineTo(98,128);atlasCtx.moveTo(159,153);atlasCtx.lineTo(159,109);atlasCtx.lineTo(144,128);atlasCtx.moveTo(159,109);atlasCtx.lineTo(174,128);atlasCtx.stroke();atlasCtx.fillStyle='#756e55';atlasCtx.fillRect(65,172,119,7);
    }
    // Different tiny bars on each package make the silhouette read as retail print.
    atlasCtx.fillStyle='#64705c';for(let k=0;k<17;k++)atlasCtx.fillRect(71+k*7,232,2+(k+id)%3,11);
    atlasCtx.restore();
  }
  const atlasTexture=new THREE.CanvasTexture(atlasCanvas);atlasTexture.colorSpace=THREE.SRGBColorSpace;atlasTexture.anisotropy=8;
  const decalRotation=new THREE.Euler(),decalPoint=new THREE.Vector3();
  function decal(tile,x,y,z,w,h,ry=0,rx=0,curve=0){
    const subdivisions=curve?6:1;
    const vertex=(u,v)=>{
      const px=(u-.5)*w,py=(v-.5)*h,pz=curve?Math.sqrt(Math.max(.00001,curve*curve-px*px))-curve:0;
      decalPoint.set(px,py,pz).applyEuler(decalRotation.set(rx,ry,0));decalPositions.push(x+decalPoint.x,y+decalPoint.y,z+decalPoint.z);
      decalUVs.push(((tile%4)+(2+u*252)/256)/4,1-(Math.floor(tile/4)+(2+(1-v)*252)/256)/4);
    };
    for(let i=0;i<subdivisions;i++){const a=i/subdivisions,b=(i+1)/subdivisions;vertex(a,0);vertex(b,0);vertex(b,1);vertex(a,0);vertex(b,1);vertex(a,1);}
  }
  function food(x,y,z,sx,sy,sz,color,rotation=0){foodPieces.push({x,y,z,sx,sy,sz,color,rotation});}
  function ring(x,y,z,r,color){sealRings.push({x,y,z,r,color});}
  function contact(x,y,z,w,d,strength=.24){
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
      contactPositions.push(x+(u-.5)*w,y,z+(v-.5)*d);contactUVs.push(u,v);contactStrengths.push(strength);
    }
  }
  const bagRows=[[-.50,.13],[-.455,.17],[-.36,.88],[-.12,1],[.18,.98],[.38,.82],[.46,.17],[.50,.13]];
  function bagPuff(y){
    const q=THREE.MathUtils.clamp(y,-.5,.5);let i=1;while(i<bagRows.length-1&&q>bagRows[i][0])i++;
    const a=bagRows[i-1],b=bagRows[i],t=(q-a[0])/(b[0]-a[0]);return THREE.MathUtils.lerp(a[1],b[1],t);
  }
  function packageFront(tile,cx,cy,cz,w,h,d,side){
    const vertex=(u,v)=>{
      const py=(v-.5)*.86,zz=(u-.5)*.90;
      const halfDepth=.5*w*bagPuff(py)*Math.pow(Math.max(0,1-Math.pow(Math.abs(zz*2),3.3333)),.3);
      decalPositions.push(cx+side*(halfDepth+.0017),cy+py*h,cz-side*zz*d);
      decalUVs.push(((tile%4)+(2+u*252)/256)/4,1-(Math.floor(tile/4)+(2+(1-v)*252)/256)/4);
    };
    for(let iy=0;iy<8;iy++)for(let ix=0;ix<8;ix++){
      const a=ix/8,b=(ix+1)/8,c=iy/8,d=(iy+1)/8;vertex(a,c);vertex(b,c);vertex(b,d);vertex(a,c);vertex(b,d);vertex(a,d);
    }
  }
  // An enamel-like warm tile floor, small grout joints, and a dark perimeter skirting.
  box(-.93,.339,-1.42,5.64,.025,4.40,'#c2bdaa');
  for(let ix=0;ix<12;ix++) for(let iz=0;iz<10;iz++)
    box(-3.50+ix*.467,.357,-3.395+iz*.435,.458,.012,.426, (ix+iz)%3===0?'#eee7d5':'#e6dfcc');

  box(-.93,.44,-3.61,5.60,.14,.06,C.navy);
  box(-3.70,.44,-1.43,.06,.14,4.35,C.navy);

  // The rear bank of illuminated drinks refrigerators. Individual caps, bottles,
  // labels and tins are instanced, so the densely stocked wall is inexpensive.
  const fridgeX=.10;
  box(fridgeX,1.53,-3.43,3.24,2.25,.51,C.navy,true);
  box(fridgeX,1.49,-3.15,3.14,2.03,.065,'#d2e6d8',true);
  box(fridgeX,2.61,-3.38,3.32,.22,.63,C.cream,true);
  label('DRINKS   /   お飲みもの',fridgeX,2.61,-3.051,2.96,.135,{fg:'#487267',border:false});
  const drinkPalette=['#93bca1','#eca999','#c4b98b','#8bbac5','#e6d7ad','#b7a6c4'];
  for(let door=0;door<4;door++) {
    const x=-1.075+door*.785;
    box(x,1.50,-3.11,.745,1.95,.05,'#6b8581');
    box(x,1.50,-3.075,.665,1.85,.037,'#d0e3d5');
    for(let row=0;row<4;row++) {
      const y=.58+row*.43;
      box(x,y,-3.08,.68,.045,.40,C.shelf,true);
      for(let divider=0;divider<6;divider++)box(x-.312+divider*.123,y+.038,-3.084,.003,.030,.355,'#acbda7');
      box(x,y-.030,-3.078,.620,.012,.346,'#a0b09a');
      box(x,y-.013,-2.856,.68,.055,.026,'#eef1d9');
      box(x,y-.014,-2.839,.54,.018,.006,row%2?'#b2cba9':'#ecbf9d');
      for(const dx of [-.21,0,.21])decal(12,x+dx,y-.014,-2.821,.116,.046);
      for(let col=0;col<5;col++) {
        const px=x-.25+col*.123, color=drinkPalette[(col+row+door)%drinkPalette.length];
        // back row is visible between the front bottles.
        for(let depth=0;depth<2;depth++) {
          const pz=-3.19+depth*.16;
          decal(6+(door+row)%4,px,y+.137,pz+.049,.076,.083,0,0,.049);
          contact(px,y+.024,pz,.102,.100,.22);
          if(row===3 && door<2) {
            drinkCans.push({x:px,y,z:pz,color});
            ring(px,y+.029,pz,.047,'#d3d7cf');ring(px,y+.246,pz,.0475,'#d3d7cf');
            cyl(px,y+.245,pz,.043,.007,'#b4bfad');
            box(px,y+.251,pz+.010,.019,.003,.010,'#738579');
            cyl(px,y+.138,pz,.049,.065,door===0?'#ebefdc':'#e5d7a4');
          } else {
            bottleBodies.push({x:px,y,z:pz,color});
            bottleCaps.push({x:px,y,z:pz,color:(door+col)%3===0?'#f0d6a2':'#f1eee0'});
            ring(px,y+.039,pz,.0408,color);ring(px,y+.054,pz,.0420,color);
            ring(px,y+.258,pz,.0240,'#ccd2b7');ring(px,y+.267,pz,.0245,'#dde0c6');
            ring(px,y+.279,pz,.0275,'#dbdec7');
            cyl(px,y+.125,pz,.043,.080,'#f5ecd6');
          }
        }
      }
    }
    // Slim mint door jambs, glass and a sculpted vertical handle.
    box(x-.375,1.49,-2.833,.027,1.97,.032,'#6c9190');
    box(x+.375,1.49,-2.833,.027,1.97,.032,'#6c9190');
    box(x,2.463,-2.833,.77,.033,.032,'#6c9190');
    box(x,.518,-2.833,.77,.033,.032,'#6c9190');
    // The recessed rubber seal and hinge knuckles separate the glass from the frame.
    for(const dx of [-.354,.354])box(x+dx,1.49,-2.851,.010,1.91,.010,'#52766e');
    for(const yy of [.541,2.439])box(x,yy,-2.851,.710,.010,.010,'#52766e');
    for(const yy of [.70,2.28]){box(x-.382,yy,-2.833,.027,.061,.039,'#a7b5a2');cyl(x-.382,yy,-2.809,.009,.053,'#ccd0b9');}
    box(x+.287,1.45,-2.791,.028,.41,.045,C.ivory,true);
    const pane=new THREE.Mesh(new THREE.PlaneGeometry(.716,1.90),glass);pane.position.set(x,1.49,-2.824);group.add(pane);
    litBox(x-.337,1.5,-2.853,.018,1.87,.016,coolGlow);
  }
  // Include the front handles, not only the refrigerator cabinet shell.
  collider(fridgeX,-3.24,3.33,.96);
  // A continuous base joins the front feet to the glazed cabinet instead of leaving isolated supports.
  box(fridgeX,.461,-3.23,3.25,.091,.89,'#546c65',true);
  for(const x of [-1.36,-.40,.58,1.53])for(const z of [-3.53,-2.96])cyl(x,.391,z,.035,.051,'#475f59');
  contact(.10,.3665,-3.23,3.40,.99,.30);

  // Back-room access, a clock, and small handwritten reminders.
  box(-2.67,1.44,-3.614,1.06,2.10,.055,'#5b7772',true);
  box(-2.67,1.44,-3.575,.91,1.97,.034,'#a8b5a2',true);
  box(-2.29,1.38,-3.54,.055,.12,.043,'#5b695f',true);
  label('STAFF ONLY',-2.67,1.79,-3.550,.65,.105,{bg:'#e5e0c9',border:false});
  label('関係者以外\n立入禁止',-2.67,1.48,-3.548,.38,.29,{bg:'#e5e0c9',fg:'#607568',smallSecond:true});
  label('今日もおつかれさま。',-2.63,2.79,-3.55,1.0,.14,{bg:'#f3dca7',fg:'#807455',border:false});
  {
    const can=document.createElement('canvas');can.width=can.height=256;const cx=can.getContext('2d');
    cx.clearRect(0,0,256,256);cx.fillStyle='#f5eedc';cx.beginPath();cx.arc(128,128,119,0,Math.PI*2);cx.fill();
    cx.strokeStyle='#5c6c69';cx.lineWidth=10;cx.stroke();cx.lineWidth=5;
    for(let i=0;i<12;i++) {const a=i*Math.PI/6;cx.beginPath();cx.moveTo(128+Math.sin(a)*96,128-Math.cos(a)*96);cx.lineTo(128+Math.sin(a)*105,128-Math.cos(a)*105);cx.stroke();}
    cx.lineWidth=8;cx.lineCap='round';cx.beginPath();cx.moveTo(128,128);cx.lineTo(86,101);cx.stroke();cx.lineWidth=5;cx.beginPath();cx.moveTo(128,128);cx.lineTo(173,60);cx.stroke();
    const tex=new THREE.CanvasTexture(can);tex.colorSpace=THREE.SRGBColorSpace;
    const clock=new THREE.Mesh(new THREE.PlaneGeometry(.37,.37),new THREE.MeshBasicMaterial({map:tex,transparent:true}));clock.position.set(-3.31,2.81,-3.543);group.add(clock);
  }

  // Two low, double-sided gondolas maintain long views into the shop.
  const packetPalette=['#d99979','#eccb7e','#82aaa4','#dcadb2','#adb686','#939ab0','#ddbd95'];
  for(let aisle=0;aisle<2;aisle++) {
    const x=aisle===0?-2.03:-.40, z=-1.58;
    box(x,.43,z,.77,.15,1.39,C.navy,true);
    box(x,1.0,z,.049,1.1,1.31,'#d1c9b5',true);
    for(const dz of [-.675,.675]) box(x,1.00,z+dz,.72,1.0,.027,'#bdc1ad',true);
    for(const dx of [-.345,.345])for(const dz of [-.635,.635]){
      box(x+dx,1.031,z+dz,.018,1.12,.023,'#a5b1a0');
      for(let slot=0;slot<10;slot++)box(x+dx, .613+slot*.082,z+dz+.014,.008,.022,.003,'#7e9382');
    }
    contact(x,.3665,z,.94,1.55,.28);
    for(let level=0;level<3;level++) {
      const y=.57+level*.333;
      box(x,y,z,.76,.041,1.37,C.shelf,true);
      box(x,y-.028,z,.674,.011,1.25,'#b1b7a4');
      for(const side of [-1,1]){
        for(let divider=0;divider<7;divider++)box(x+side*.197,y+.037,z-.489+divider*.163,.313,.028,.003,'#b8c0aa');
        for(const end of [-.61,.61])box(x+side*.327,y-.047,z+end,.089,.037,.018,'#9cae9b');
      }
      for(const side of [-1,1]) {
        box(x+side*.378,y-.022,z,.021,.068,1.36,C.cream);
        box(x+side*.39,y-.023,z,.007,.023,1.13,aisle===0?'#9eb49b':'#ddb993');
        for(let i=0;i<8;i++) {
          const pz=z-.57+i*.163;
          const py=y+.12;
          const pc=packetPalette[(i+level*2+aisle*3)%packetPalette.length];
          const h=.165+random()*.060;
          // Inflated, pinched foil bags alternate with softly beveled paper cartons.
          const packet={x:x+side*.23,y:y+h/2+.025,z:pz,w:.174,h,d:.135,color:pc};
          contact(packet.x,y+.023,pz,.191,.145,.20);
          if(aisle===0){
            pillowPackets.push(packet);packageFront((i+level)%4,packet.x,packet.y,pz,.174,h,.135,side);
            for(const seamY of [y+.028,y+h+.022]){
              box(packet.x,seamY,pz,.027,.012,.138,'#e7d4ad');
              for(let crimp=0;crimp<6;crimp++)box(packet.x,seamY+.0065,pz-.059+crimp*.024,.028,.002,.002,'#c2ae89');
            }
          }else{
            beveledPackets.push(packet);decal(4+(i%2),x+side*.320,packet.y,pz,.116,h*.81,side*Math.PI/2);
            box(packet.x,y+h+.025,pz,.154,.003,.111,'#e7d4ad');
          }
          if(i%2===0)decal(12,x+side*.402,y-.024,pz,.126,.044,side*Math.PI/2);
        }
      }
    }
    box(x,1.59,z,.79,.13,1.41,C.cream,true);
    box(x,1.67,z,.80,.033,1.42,aisle===0?C.mint:C.coral,true);
    label(aisle===0?'お菓子':'日用品',x,1.59,z+.716,.61,.085,{bg:'#f7efdc',fg:aisle===0?'#577e70':'#9e7061',border:false});
    label(aisle===0?'SNACKS':'EVERYDAY',x,1.17,z+.695,.52,.24,{bg:aisle===0?'#d8e0c5':'#eac7ad',fg:'#5d6760',border:false});
    label(aisle===0?'¥ 128':'¥ 198',x,.84,z+.697,.36,.12,{bg:'#f4e8c9',fg:'#977357',border:false});
    collider(x,z,.83,1.44);
  }

  // Bento/onigiri shelving along the left wall, facing the window and main aisle.
  box(-3.44,1.12,-1.98,.46,1.48,1.94,C.navy,true);
  box(-3.189,1.14,-1.98,.024,1.31,1.83,'#d8d1b5');
  box(-3.40,1.91,-1.98,.55,.17,2.00,C.cream,true);
  label('お弁当・おにぎり',-3.098,1.91,-1.98,1.77,.105,{rotation:Math.PI/2,fg:'#738462',border:false});
  const triangularRice=new THREE.Shape();triangularRice.moveTo(-.067,0);triangularRice.lineTo(.067,0);triangularRice.quadraticCurveTo(.085,.01,.067,.04);triangularRice.lineTo(.016,.145);triangularRice.quadraticCurveTo(0,.165,-.016,.145);triangularRice.lineTo(-.067,.04);triangularRice.quadraticCurveTo(-.085,.01,-.067,0);
  const riceGeo=new THREE.ExtrudeGeometry(triangularRice,{depth:.062,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.008,bevelThickness:.006});
  const riceMat=new THREE.MeshToonMaterial({color:'#f4efdc',gradientMap:gradient});
  const riceInstances=new THREE.InstancedMesh(riceGeo,riceMat,20);let riceCount=0;
  for(let row=0;row<3;row++) {
    const y=.58+row*.415;
    box(-3.32,y,-1.98,.67,.045,1.89,C.shelf,true);
    box(-2.97,y-.019,-1.98,.022,.067,1.89,C.cream);
    for(let ticket=0;ticket<6;ticket++)decal(12,-2.956,y-.020,-2.73+ticket*.29,.14,.050,Math.PI/2);
    for(let i=0;i<6;i++) {
      const z=-2.73+i*.29;
      if(row===2) {
        for(let depth=0;depth<2;depth++) {
          position.set(-3.12-depth*.17,y+.027,z);quaternion.setFromEuler(new THREE.Euler(0,Math.PI/2,0));scale.set(1,1,1);matrix.compose(position,quaternion,scale);
          riceInstances.setMatrixAt(riceCount++,matrix);
          box(-3.045-depth*.17,y+.069,z,.014,.078,.045,'#415849');
          decal(10,-3.035-depth*.17,y+.115,z,.084,.047,Math.PI/2);
          for(let grain=0;grain<7;grain++)food(-3.047-depth*.17,y+.037+grain*.013,z+(grain%2?-.042:.037)*(1-grain*.08),.004,.006,.003,'#f7f0d8');
          // Folded clear wrapper seams, printed with a small pull-tab marker.
          box(-3.043-depth*.17,y+.029,z,.012,.006,.144,'#c8cdbc');
          box(-3.043-depth*.17,y+.162,z,.012,.015,.029,'#be8a76');
        }
      } else {
        box(-3.21,y+.055,z,.33,.06,.235,'#374a40');
        box(-3.20,y+.094,z,.29,.033,.207,'#eee4c9');
        // Rice, sesame and umeboshi occupy their own side of each divided tray.
        box(-3.285,y+.116,z,.109,.027,.178,'#eee5c7');
        for(let grain=0;grain<24;grain++)food(-3.322+(grain%4)*.024+(random()-.5)*.008,y+.133,z-.067+Math.floor(grain/4)*.026,.009,.0035,.004,'#faf0d5',(random()-.5)*.8);
        food(-3.281,y+.140,z-.011,.017,.006,.015,'#b27370');
        for(let sesame=0;sesame<5;sesame++)food(-3.315+random()*.074,y+.139,z-.06+random()*.12,.0025,.0016,.0017,'#867b5d');
        box(-3.220,y+.122,z,.008,.043,.194,'#b0a781');
        const meal=(i+row)%3;
        if(meal===0){
          // A salmon fillet with the pale diagonal grain of the flesh.
          food(-3.136,y+.132,z-.046,.058,.016,.034,'#d5977e',-.18);
          for(let stripe=0;stripe<4;stripe++)box(-3.175+stripe*.025,y+.149,z-.046,.003,.003,.054,'#e9bc95',false,-.3);
        }else if(meal===1){
          // Breaded katsu cut into four pieces, on shredded pale cabbage.
          for(let slice=0;slice<4;slice++){box(-3.179+slice*.028,y+.133,z-.043,.023,.035,.067,'#c89d62');box(-3.179+slice*.028,y+.153,z-.043,.023,.006,.060,'#b98c54');}
          for(let crumb=0;crumb<8;crumb++)food(-3.190+random()*.11,y+.159,z-.064+random()*.04,.004,.0028,.003,'#dfbe83');
        }else{
          // Rolled tamagoyaki with a nori garnish and a little sausage.
          for(let slice=0;slice<3;slice++)box(-3.169+slice*.033,y+.135,z-.049,.028,.040,.061,'#dfc178');
          food(-3.133,y+.134,z+.018,.042,.015,.016,'#bc8070');
        }
        for(let broccoli=0;broccoli<3;broccoli++)food(-3.177+(broccoli%2)*.024,y+.130+Math.floor(broccoli/2)*.014,z+.055,.021,.017,.019,broccoli===2?'#72966f':'#7e9e70');
        food(-3.104,y+.133,z+.052,.022,.015,.021,'#c47c6a');
        box(-3.207,y+.150,z+.018,.047,.004,.101,'#e9dfc0');
        decal(11,-3.207,y+.153,z+.018,.044,.095,0,-Math.PI/2);
        // Clear lid rim, stacking lip and tiny snap tabs.
        outlineBox(-3.21,y+.148,z,.340,.077,.245,0);
        box(-3.033,y+.109,z,.013,.013,.058,'#afbba7');
      }
    }
  }
  riceInstances.count=riceCount;riceInstances.castShadow=true;riceInstances.receiveShadow=true;group.add(riceInstances);
  collider(-3.35,-1.98,.82,2.01);
  contact(-3.35,.3665,-1.98,.88,2.08,.26);

  // Low checkout: wooden accents, a little oden pan, register and coffee corner.
  box(-2.69,.900,-.04,1.78,.760,.68,'#91a390',true);
  box(-2.69,1.30,-.04,1.86,.085,.74,'#e5d7bb',true);
  box(-2.69,.88,.317,1.64,.60,.02,'#d9cda8',true);
  for(let i=0;i<8;i++)box(-3.40+i*.205,.88,.337,.014,.54,.012,'#baac8e');
  box(-2.69,.445,-.04,1.78,.15,.68,C.navy,true);
  label('いつもの、ほっと。',-2.64,.94,.352,1.09,.185,{fg:'#6b7c67',bg:'#e6d9b5',border:false});
  label('24H   CASHLESS / 現金',-2.59,.63,.352,.93,.075,{fg:'#596b62',bg:'#d9cda8',border:false});
  // The screen faces the customer; its feet and keypad remain proper geometry.
  box(-2.41,1.38,-.01,.40,.065,.33,C.navy,true);
  box(-2.41,1.53,-.08,.055,.27,.055,C.navy);
  box(-2.41,1.67,-.067,.41,.28,.05,C.navy,true);
  label('WELCOME\nいらっしゃいませ',-2.41,1.677,-.036,.365,.235,{bg:'#abcdb6',fg:'#4c7164',border:false,smallSecond:true});
  box(-2.03,1.374,.038,.17,.035,.20,'#6a8080',true);
  for(let row=0;row<3;row++)for(let i=0;i<3;i++)box(-2.085+i*.041,1.397,-.018+row*.05,.029,.008,.032,'#c8d5c3');
  // Small receipt, card reader and a tiny change tray.
  box(-2.02,1.406,.026,.112,.016,.025,'#e6e4cd');
  box(-2.73,1.365,.11,.23,.022,.17,'#6b887d',true);
  box(-2.73,1.383,.11,.17,.007,.116,'#a0b49d');
  cyl(-2.72,1.392,.09,.024,.008,'#d5b67c');cyl(-2.77,1.392,.14,.02,.008,'#b5b1a0');
  // Compact physical checkout props: a scanner, printed receipt and payment stand.
  cyl(-2.155,1.365,.193,.057,.025,'#7e9182');
  cyl(-2.155,1.449,.193,.017,.16,'#53685f');
  box(-2.155,1.528,.200,.095,.073,.060,'#506b62',true);
  box(-2.155,1.532,.232,.078,.043,.006,'#323f44');
  box(-2.155,1.534,.236,.053,.003,.002,'#cd887e');
  box(-1.913,1.414,-.190,.19,.14,.151,'#82968a',true);
  box(-1.913,1.468,-.104,.136,.026,.018,'#445d56');
  box(-1.913,1.451,-.085,.088,.006,.063,'#f4edd8');
  decal(13,-1.913,1.456,-.078,.079,.092,0,-Math.PI/2);
  // A little curl at the tear-off edge of the receipt.
  box(-1.913,1.445,-.014,.088,.025,.008,'#f3ecd7');
  box(-1.883,1.371,.238,.208,.021,.108,'#59766b',true);
  box(-1.883,1.527,.264,.207,.297,.018,'#59766b',true);
  decal(14,-1.883,1.527,.275,.189,.278);
  box(-2.610,1.403,-.236,.111,.10,.087,'#809687',true);
  for(let pen=0;pen<3;pen++)cyl(-2.645+pen*.028,1.513,-.236,.006,.164,['#586e71','#b78070','#718d77'][pen]);
  box(-2.266,1.375,-.207,.13,.055,.099,'#bcc4a8',true);
  decal(13,-2.266,1.405,-.207,.105,.074,0,-Math.PI/2);
  // Coffee machine with three-dimensional tap, buttons and paper cup.
  box(-3.31,1.68,-.05,.40,.69,.40,C.navy,true);
  box(-3.31,1.73,.164,.34,.43,.017,'#60716b',true);
  box(-3.31,1.61,.177,.20,.21,.018,'#263b3a');
  box(-3.31,1.46,.22,.34,.025,.21,'#9ea697',true);
  cyl(-3.31,1.70,.224,.035,.07,'#bcc4b6');
  cyl(-3.31,1.52,.247,.045,.098,C.cream);cyl(-3.31,1.577,.247,.048,.014,C.white);
  label('COFFEE',-3.31,1.934,.158,.29,.072,{bg:'#394d4d',fg:'#e8d9b8',border:false});
  for(let i=0;i<3;i++)box(-3.41+i*.10,1.828,.179,.036,.021,.009,i===0?'#d4c087':'#b3bfb0');
  // Nested takeaway cups and a bean hopper make the coffee corner feel used.
  for(let cup=0;cup<5;cup++){
    cyl(-3.423,2.072+cup*.020,-.063,.040,.086,'#efe5cc');
    cyl(-3.423,2.117+cup*.020,-.063,.043,.010,'#faf0d8');
  }
  decal(7,-3.423,2.085,-.019,.063,.058,0,0,.043);
  const beanGlass=new THREE.Mesh(new THREE.CylinderGeometry(.057,.054,.17,16),new THREE.MeshBasicMaterial({color:'#d8c3a2',transparent:true,opacity:.13,depthWrite:false}));
  beanGlass.position.set(-3.233,2.136,-.064);group.add(beanGlass);
  cyl(-3.233,2.222,-.064,.061,.022,'#465b56');
  cyl(-3.233,2.049,-.064,.055,.018,'#617267');
  for(let bean=0;bean<35;bean++){
    const a=random()*Math.PI*2,radius=Math.sqrt(random())*.043;
    food(-3.233+Math.cos(a)*radius,2.066+random()*.125,-.064+Math.sin(a)*radius,.010,.006,.006,bean%3===0?'#9b7850':'#78634b',a);
  }
  decal(7,-3.233,2.119,-.008,.081,.064,0,0,.058);
  box(-3.570,1.43,-.123,.098,.174,.135,'#aab6a0',true);
  for(let stirrer=0;stirrer<5;stirrer++)box(-3.603+stirrer*.016,1.572,-.130,.007,.20,.007,'#cdbf94');
  box(-3.566,1.493,-.006,.117,.042,.084,'#e6ddc2',true);
  for(let napkin=0;napkin<4;napkin++)box(-3.566,1.518+napkin*.006,-.006,.095,.004,.069,'#f4ead3');
  // Oden: six compartments and recognizable eggs, tofu and fish cakes.
  box(-2.85,1.367,-.086,.40,.09,.43,'#8e9787',true);
  box(-2.85,1.424,-.086,.35,.025,.38,'#a98350');
  box(-2.85,1.451,-.086,.015,.031,.38,'#c3c2a9');
  for(const dz of [-.061,.073])box(-2.85,1.451,-.086+dz,.35,.031,.012,'#c3c2a9');
  food(-2.934,1.474,-.214,.030,.019,.043,'#ecddae',.2);
  food(-2.949,1.474,-.081,.034,.016,.024,'#c7a975',-.3);
  cyl(-2.761,1.472,-.214,.040,.020,'#e5d0a0');
  cyl(-2.761,1.484,-.214,.024,.008,'#d3bc8c');
  for(let fishBall=0;fishBall<3;fishBall++)food(-2.972+fishBall*.035,1.482,.049,.017,.015,.020,'#d5ba89');
  box(-2.936,1.470,.049,.126,.005,.005,'#a28658');
  box(-2.761,1.478,-.082,.063,.023,.071,'#d8c6a0',false,.13);
  for(let speck=0;speck<7;speck++)food(-2.781+random()*.041,1.492,-.108+random()*.047,.0023,.0012,.0015,'#8b8970');
  for(const x of [-3.016,-2.684])box(x,1.477,-.086,.012,.007,.363,'#c2baa0');
  box(-2.940,1.438,.117,.015,.008,.09,'#c5b58e');
  food(-2.940,1.438,.163,.031,.006,.027,'#9fa58b');
  label('おでん',-2.85,1.427,.139,.31,.076,{bg:'#eee0b9',fg:'#846e48',border:false});
  collider(-2.69,-.04,1.92,.80);
  contact(-2.69,.3665,-.04,2.015,.885,.32);

  // A small island freezer beside the rear staff door, with a clear lid.
  box(-3.39,.72,-3.08,.56,.71,.71,'#b2c6bb',true);
  // The lid is now an actual inset window inside a four-piece rounded frame.
  for(const x of [-3.676,-3.104])box(x,1.09,-3.08,.038,.07,.76,'#e5e7d3',true);
  for(const z of [-3.441,-2.719])box(-3.39,1.09,z,.54,.07,.038,'#e5e7d3',true);
  box(-3.39,1.079,-3.08,.525,.008,.672,'#789d91');
  for(const x of [-3.649,-3.131])box(x,1.107,-3.08,.012,.013,.673,'#6d8e80');
  for(const z of [-3.408,-2.752])box(-3.39,1.107,z,.524,.013,.012,'#6d8e80');
  for(const x of [-3.513,-3.267]){
    const lidPane=new THREE.Mesh(new THREE.PlaneGeometry(.230,.643),glass);lidPane.rotation.x=-Math.PI/2;lidPane.position.set(x,1.118,-3.08);group.add(lidPane);
    box(x,1.124,-2.799,.112,.018,.025,'#b3c5b0',true);
  }
  box(-3.39,1.119,-3.08,.018,.018,.659,'#dae2c9');
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)box(-3.56+i*.17,1.095,-3.29+j*.19,.12,.022,.15,packetPalette[(i+j)%packetPalette.length]);
  for(const z of [-3.302,-2.858]){
    box(-3.686,1.105,z,.039,.048,.099,'#9bb3a2',true);
    cyl(-3.690,1.123,z,.012,.101,'#c2cdb4',0,Math.PI/2);
    for(const zz of [z-.037,z+.037])box(-3.661,1.104,zz,.033,.025,.019,'#c7d1b8');
  }
  for(const x of [-3.651,-3.126])for(const z of [-3.377,-2.783]){
    cyl(x,.389,z,.033,.049,'#49675d');ring(x,.400,z,.033,'#a6b6a0');
  }
  contact(-3.39,.3665,-3.08,.73,.87,.31);
  label('ICE',-3.093,.86,-3.08,.37,.18,{rotation:Math.PI/2,bg:'#b2c6bb',fg:'#4f7873',border:false});
  collider(-3.39,-3.08,.67,.78);

  // Magazine rack under the right-hand window. Sloped covers are printed on a
  // single atlas so legible little covers do not cost a material per book.
  box(1.55,.81,-1.09,.43,.87,.75,'#72908a',true);
  box(1.31,.82,-1.09,.043,.78,.77,C.cream,true);
  for(let row=0;row<2;row++) {
    const y=.64+row*.36;
    box(1.245,y,-1.09,.18,.045,.73,C.shelf,true);
    for(let i=0;i<3;i++) {
      const z=-1.33+i*.24;
      box(1.239,y+.13,z,.052,.26,.205,['#d6ab99','#b8c4a4','#9ab9ba'][i],true);
      label(['暮らし','旅','夜の本'][i],1.204,y+.162,z,.169,.14,{rotation:-Math.PI/2,bg:['#d6ab99','#b8c4a4','#9ab9ba'][i],fg:'#526561',border:false});
      box(1.195,y+.054,z,.012,.028,.213,'#dee0c7');
    }
  }
  label('MAGAZINE',1.301,1.258,-1.09,.68,.085,{rotation:-Math.PI/2,bg:'#e5e6d0',fg:'#617c73',border:false});
  // The magazine tray overhangs the cabinet toward the aisle.
  collider(1.465,-1.09,.66,.82);
  contact(1.465,.3665,-1.09,.70,.88,.24);

  // Warm light fittings remain visible if the roof is faded for inspection.
  for(const x of [-2.6,.50]) {
    box(x,3.325,-1.40,.32,.057,2.20,'#aab5a5',true);
    litBox(x,3.287,-1.40,.25,.026,2.12);
  }
  // Compact hanging wayfinding cards, with their wire hangers.
  for(const marker of [
    {x:-2.01,z:-2.20,text:'01  お菓子',color:'#d5dfc4'},
    {x:-.39,z:-2.20,text:'02  日用品',color:'#e6c7ad'}
  ]) {
    box(marker.x,2.52,marker.z,.82,.245,.045,C.ivory,true);
    label(marker.text,marker.x,2.52,marker.z+.026,.755,.182,{bg:marker.color,fg:'#5f766b',border:false});
    for(const dx of [-.30,.30])box(marker.x+dx,2.94,marker.z,.009,.62,.009,'#62746c');
  }
  // Side-wall notices and a large comforting illustrated seasonal poster.
  {
    const can=document.createElement('canvas');can.width=384;can.height=512;const cx=can.getContext('2d');
    cx.fillStyle='#edd5ae';cx.fillRect(0,0,384,512);cx.fillStyle='#b6c8aa';cx.fillRect(16,16,352,480);
    cx.fillStyle='#f5e2b9';cx.beginPath();cx.arc(192,241,123,0,Math.PI*2);cx.fill();
    cx.fillStyle='#7b9477';cx.beginPath();cx.ellipse(192,329,105,25,0,0,Math.PI*2);cx.fill();
    cx.fillStyle='#e9d6af';cx.fillRect(120,208,142,121);cx.fillStyle='#6b6954';cx.beginPath();cx.ellipse(191,208,71,19,0,0,Math.PI*2);cx.fill();
    cx.strokeStyle='#f5e8cb';cx.lineWidth=7;cx.lineCap='round';for(const dx of [-37,0,37]){cx.beginPath();cx.moveTo(192+dx,169);cx.bezierCurveTo(171+dx,144,211+dx,130,192+dx,104);cx.stroke();}
    cx.textAlign='center';cx.fillStyle='#4b6d5e';cx.font=`bold 40px ${fonts}`;cx.fillText('ほっと、ひと息。',192,71);cx.font=`bold 25px ${fonts}`;cx.fillText('淹れたて珈琲',192,395);cx.font=`20px ${fonts}`;cx.fillText('HOT COFFEE  ¥120',192,440);
    const tex=new THREE.CanvasTexture(can);tex.colorSpace=THREE.SRGBColorSpace;
    const poster=new THREE.Mesh(new THREE.PlaneGeometry(.63,.84),new THREE.MeshBasicMaterial({map:tex}));poster.position.set(-3.659,2.60,-.73);poster.rotation.y=Math.PI/2;group.add(poster);
    box(-3.678,2.60,-.73,.035,.89,.68,'#918f72',true);
  }
  label('雨の日も\nお気をつけて。',-3.649,2.5,-2.43,.49,.38,{rotation:Math.PI/2,bg:'#efe3bd',fg:'#7a8a6b',smallSecond:true});
  label('新発売\n季節のお弁当',-3.649,2.47,-1.75,.46,.54,{rotation:Math.PI/2,bg:'#d09c86',fg:'#fff0ce',smallSecond:true});
  // Floor arrows are part of the shop rather than screen-space controls.
  for(const z of [-.18,-1.65]) {
    const arrow=new THREE.Shape();arrow.moveTo(-.055,-.12);arrow.lineTo(.055,-.12);arrow.lineTo(.055,.02);arrow.lineTo(.15,.02);arrow.lineTo(0,.18);arrow.lineTo(-.15,.02);arrow.lineTo(-.055,.02);arrow.closePath();
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(arrow),new THREE.MeshBasicMaterial({color:'#93aa90',transparent:true,opacity:.6,side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.set(.67,.369,z);group.add(mesh);
  }
  // A discreet shopping-basket stack in the clear front-right corner.
  box(1.43,.49,.27,.35,.23,.33,'#738e80',true);
  for(let row=0;row<4;row++)box(1.43,.411+row*.046,.27,.373,.017,.35,'#bec8a9',true);
  box(1.43,.61,.27,.29,.012,.26,'#4d7268');
  collider(1.43,.27,.41,.39);
  contact(1.43,.3665,.27,.47,.45,.25);

  // Restocking parcels sit entirely inside the already blocked basket footprint.
  box(1.425,.748,.258,.291,.252,.267,'#b99d72',true);
  box(1.425,.882,.258,.301,.017,.277,'#c8ae83',true);
  box(1.425,.893,.258,.047,.005,.274,'#dbca9c');
  box(1.425,.748,.397,.045,.251,.004,'#d0bc8e');
  decal(15,1.425,.760,.398,.214,.159);
  decal(15,1.270,.760,.259,.184,.153,-Math.PI/2);
  // A folded stock trolley leans behind the carton without extending into an aisle.
  for(const x of [1.295,1.570]){
    box(x,.756,.435,.014,.678,.014,'#7e9992');
    cyl(x,.417,.352,.031,.025,'#415b56',Math.PI/2);
  }
  box(1.433,1.089,.435,.287,.021,.021,'#75938a',true);
  box(1.433,.425,.323,.303,.016,.169,'#729288',true);
  // Compose all opaque fittings and products into two draw calls.
  const boxMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),toon,boxes.length);
  const color=new THREE.Color();
  boxes.forEach((b,i)=>{
    position.set(b.x,b.y,b.z);quaternion.setFromEuler(new THREE.Euler(0,b.rotation,0));scale.set(b.w,b.h,b.d);matrix.compose(position,quaternion,scale);
    boxMesh.setMatrixAt(i,matrix);boxMesh.setColorAt(i,color.set(b.color));
  });
  boxMesh.castShadow=true;boxMesh.receiveShadow=true;boxMesh.instanceMatrix.needsUpdate=true;boxMesh.instanceColor.needsUpdate=true;boxMesh.name='Instanced tiles, packages and shop fittings';group.add(boxMesh);
  const cylinderMesh=new THREE.InstancedMesh(new THREE.CylinderGeometry(1,1,1,10),toon,cylinders.length);
  cylinders.forEach((b,i)=>{
    position.set(b.x,b.y,b.z);quaternion.setFromEuler(new THREE.Euler(b.rotationX||0,0,b.rotation));scale.set(b.r,b.h,b.r);matrix.compose(position,quaternion,scale);
    cylinderMesh.setMatrixAt(i,matrix);cylinderMesh.setColorAt(i,color.set(b.color));
  });
  cylinderMesh.castShadow=true;cylinderMesh.receiveShadow=true;cylinderMesh.instanceMatrix.needsUpdate=true;cylinderMesh.instanceColor.needsUpdate=true;cylinderMesh.name='Instanced chilled drinks and coffee details';group.add(cylinderMesh);
  // Rotational profiles replace the former stacked drink cylinders.
  function latheProfile(points,segments=24){return new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),segments);}
  function detailBatch(geometry,records,name,kind='drink'){
    const instanced=new THREE.InstancedMesh(geometry,toon,records.length);
    records.forEach((p,i)=>{
      position.set(p.x,p.y,p.z);quaternion.set(0,0,0,1);scale.set(1,1,1);
      if(kind==='packet')scale.set(p.w,p.h,p.d);
      if(kind==='ring'){scale.set(p.r,p.r,p.r);quaternion.setFromEuler(new THREE.Euler(Math.PI/2,0,0));}
      matrix.compose(position,quaternion,scale);instanced.setMatrixAt(i,matrix);instanced.setColorAt(i,color.set(p.color));
    });
    instanced.name=name;instanced.castShadow=true;instanced.receiveShadow=true;instanced.instanceMatrix.needsUpdate=true;instanced.instanceColor.needsUpdate=true;group.add(instanced);return instanced;
  }
  const bottleProfile=[[0,.027],[.030,.027],[.038,.030],[.041,.037],[.042,.052],[.042,.190],[.041,.209],[.037,.229],[.030,.242],[.024,.252],[.0225,.260],[.0225,.284],[0,.284]];
  detailBatch(latheProfile(bottleProfile,28),bottleBodies,'Rounded bottle shoulders and recessed heels');
  const capGeometry=latheProfile([[0,.280],[.025,.280],[.028,.283],[.028,.297],[.026,.301],[0,.301]],36);
  const capPositions=capGeometry.attributes.position;
  for(let i=0;i<capPositions.count;i++){
    const x=capPositions.getX(i),z=capPositions.getZ(i),y=capPositions.getY(i),r=Math.hypot(x,z);
    if(r>.026&&y>.281&&y<.299){const corr=1+.032*Math.cos(Math.atan2(z,x)*18);capPositions.setXYZ(i,x*corr,y,z*corr);}
  }
  capGeometry.computeVertexNormals();detailBatch(capGeometry,bottleCaps,'Eighteen-rib screw caps');
  detailBatch(latheProfile([[0,.025],[.041,.025],[.046,.028],[.048,.036],[.048,.231],[.046,.241],[.043,.246],[0,.246]],28),drinkCans,'Rolled-shoulder beverage cans');
  detailBatch(new THREE.TorusGeometry(1,.026,4,24),sealRings,'Bottle threads, tamper seals and heel rings','ring');

  // A reusable sealed pillow mesh gives the snack aisle a soft foil silhouette.
  const bagVertices=[],bagIndices=[],bagSegments=24;
  for(const [y,puff] of bagRows)for(let j=0;j<=bagSegments;j++){
    const a=j/bagSegments*Math.PI*2,c=Math.cos(a),s=Math.sin(a);
    bagVertices.push(Math.sign(c)*Math.pow(Math.abs(c),.6)*.5*puff,y,Math.sign(s)*Math.pow(Math.abs(s),.6)*.5);
  }
  const stride=bagSegments+1;
  for(let row=0;row<bagRows.length-1;row++)for(let j=0;j<bagSegments;j++){
    const a=row*stride+j;bagIndices.push(a,a+stride,a+1,a+1,a+stride,a+stride+1);
  }
  const bottomCenter=bagVertices.length/3;bagVertices.push(0,-.5,0);const topCenter=bagVertices.length/3;bagVertices.push(0,.5,0);
  for(let j=0;j<bagSegments;j++){bagIndices.push(bottomCenter,j,j+1);const a=(bagRows.length-1)*stride+j;bagIndices.push(topCenter,a+1,a);}
  const bagGeometry=new THREE.BufferGeometry();bagGeometry.setAttribute('position',new THREE.Float32BufferAttribute(bagVertices,3));bagGeometry.setIndex(bagIndices);bagGeometry.computeVertexNormals();
  detailBatch(bagGeometry,pillowPackets,'Pinched, inflated snack pouches','packet');
  const cartonGeometry=new THREE.BoxGeometry(1,1,1,4,4,4),cartonPositions=cartonGeometry.attributes.position,roundedNormal=new THREE.Vector3(),roundedCore=new THREE.Vector3();
  for(let i=0;i<cartonPositions.count;i++){
    roundedNormal.fromBufferAttribute(cartonPositions,i);roundedCore.copy(roundedNormal).clampScalar(-.425,.425);
    roundedNormal.sub(roundedCore).normalize();roundedCore.addScaledVector(roundedNormal,.075);cartonPositions.setXYZ(i,roundedCore.x,roundedCore.y,roundedCore.z);
    cartonGeometry.attributes.normal.setXYZ(i,roundedNormal.x,roundedNormal.y,roundedNormal.z);
  }
  detailBatch(cartonGeometry,beveledPackets,'Softly beveled paper retail cartons','packet');

  // All large and small contact shadows use one clean, soft-edged geometry batch.
  const contactGeometry=new THREE.BufferGeometry();contactGeometry.setAttribute('position',new THREE.Float32BufferAttribute(contactPositions,3));
  contactGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(contactUVs,2));contactGeometry.setAttribute('aStrength',new THREE.Float32BufferAttribute(contactStrengths,1));
  const contactMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,
    vertexShader:`attribute float aStrength;varying vec2 vLocal;varying float vStrength;void main(){vLocal=uv*2.0-1.0;vStrength=aStrength;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader:`varying vec2 vLocal;varying float vStrength;void main(){float q=pow(pow(abs(vLocal.x),5.0)+pow(abs(vLocal.y),5.0),.2);float a=(1.0-smoothstep(.49,1.0,q))*vStrength;if(a<.003)discard;gl_FragColor=vec4(.10,.155,.135,a);}`
  });
  const contactMesh=new THREE.Mesh(contactGeometry,contactMaterial);contactMesh.name='Soft fixture and product contact shadows';contactMesh.renderOrder=1;group.add(contactMesh);

  const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(edges,3));
  const lines=new THREE.LineSegments(lineGeometry,new THREE.LineBasicMaterial({color:'#293b40',transparent:true,opacity:.48}));group.add(lines);
  const foodMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,8),toon,foodPieces.length);
  foodPieces.forEach((p,i)=>{
    position.set(p.x,p.y,p.z);quaternion.setFromEuler(new THREE.Euler(0,p.rotation,0));scale.set(p.sx,p.sy,p.sz);matrix.compose(position,quaternion,scale);
    foodMesh.setMatrixAt(i,matrix);foodMesh.setColorAt(i,color.set(p.color));
  });
  foodMesh.castShadow=true;foodMesh.receiveShadow=true;foodMesh.instanceMatrix.needsUpdate=true;foodMesh.instanceColor.needsUpdate=true;
  foodMesh.name='Instanced rice, sesame, salmon, vegetables and coffee beans';group.add(foodMesh);
  const decalGeometry=new THREE.BufferGeometry();
  decalGeometry.setAttribute('position',new THREE.Float32BufferAttribute(decalPositions,3));
  decalGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(decalUVs,2));decalGeometry.computeVertexNormals();
  const packagePrint=new THREE.Mesh(decalGeometry,new THREE.MeshBasicMaterial({map:atlasTexture,side:THREE.DoubleSide}));
  packagePrint.name='Single-atlas packaging, prices and physical shop cards';group.add(packagePrint);

  // Twelve soft puffs share one point draw call and stay above the oden pan.
  const steamCount=12,steamPositions=new Float32Array(steamCount*3),steamPhases=new Float32Array(steamCount);
  for(let i=0;i<steamCount;i++){steamPositions[i*3]=-2.94+(i%3)*.09;steamPositions[i*3+1]=1.48;steamPositions[i*3+2]=-.20+(Math.floor(i/3)%3)*.115;steamPhases[i]=i/steamCount;}
  const steamGeometry=new THREE.BufferGeometry();steamGeometry.setAttribute('position',new THREE.BufferAttribute(steamPositions,3));steamGeometry.setAttribute('aPhase',new THREE.BufferAttribute(steamPhases,1));
  const steamMaterial=new THREE.ShaderMaterial({
    uniforms:{uTime:{value:0}},transparent:true,depthWrite:false,toneMapped:false,
    vertexShader:`attribute float aPhase;uniform float uTime;varying float vFade;
      void main(){float age=fract(aPhase+uTime*.205);vec3 p=position;
      p.y+=age*.46;p.x+=sin(aPhase*31.0+uTime*.8)*age*.055;p.z+=cos(aPhase*19.0+uTime*.6)*age*.028;
      vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp((.035+age*.11)*510.0/max(.1,-mv.z),1.0,48.0);
      vFade=sin(age*3.14159265)*.21;}`,
    fragmentShader:`varying float vFade;void main(){vec2 q=gl_PointCoord*2.0-1.0;float d=dot(q,q);
      float alpha=vFade*exp(-3.8*d)*(1.0-smoothstep(.5,1.0,d));
      if(alpha<.002)discard;gl_FragColor=vec4(.93,.91,.84,alpha);}`
  });
  const steam=new THREE.Points(steamGeometry,steamMaterial);steam.name='Subtle oden steam';steam.frustumCulled=false;group.add(steam);
  function update(dt,time){steamMaterial.uniforms.uTime.value=Number.isFinite(time)?time:steamMaterial.uniforms.uTime.value+(Number.isFinite(dt)?dt:0);}
  const lightA=new THREE.PointLight('#ffdca0',5.0,8,2);lightA.position.set(-2.4,2.93,-.60);group.add(lightA);
  const lightB=new THREE.PointLight('#ffedb9',4.0,7,2);lightB.position.set(.50,2.9,-2.3);group.add(lightB);
  group.userData.detailCounts={boxes:boxes.length,bottles:cylinders.length,riceBalls:riceCount,foodPieces:foodPieces.length,printedTriangles:decalPositions.length/9,atlasTiles:16,steamPuffs:steamCount,roundedBottles:bottleBodies.length,ribbedCaps:bottleCaps.length,rolledCans:drinkCans.length,bottleRings:sealRings.length,pillowPackets:pillowPackets.length,beveledPackets:beveledPackets.length,contactShadows:contactStrengths.length/6};
  return {group,colliders,update};
}
