import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createStandee } from './standee.js';
import { createInterior } from './interior.js';
import { createSurfaceLibrary } from './materials.js';
import { createLook } from './look.js';
import { createExteriorDetails } from './exterior-detail.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const scene=new THREE.Scene();
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7)); renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.84; renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate=false; renderer.shadowMap.needsUpdate=true;
document.body.appendChild(renderer.domElement); renderer.domElement.tabIndex=0; renderer.domElement.focus();
const camera=new THREE.PerspectiveCamera(39,innerWidth/innerHeight,.045,120);
camera.position.set(13.4,10.7,16.2);
const controls=new OrbitControls(camera,renderer.domElement); controls.target.set(0,1.2,0);
controls.enableDamping=true; controls.dampingFactor=.07; controls.minDistance=1.4; controls.maxDistance=35;
controls.maxPolarAngle=Math.PI*.483; controls.minPolarAngle=.14; controls.enablePan=true; controls.update();
const look=createLook(THREE,renderer,scene,camera);const surfaces=createSurfaceLibrary(THREE,look.envMap);
const hemisphere=new THREE.HemisphereLight(0xb6ceff,0x273342,.80); scene.add(hemisphere);
const moon=new THREE.DirectionalLight(0x99bfff,.90); moon.position.set(-6,12,3); moon.castShadow=true;
moon.shadow.mapSize.set(1024,1024); Object.assign(moon.shadow.camera,{left:-9,right:9,top:9,bottom:-9,near:1,far:34});
moon.shadow.bias=-.0002; moon.shadow.normalBias=.035; scene.add(moon);
const keylight=new THREE.DirectionalLight(0xc0ceff,.32); keylight.position.set(8,6,-7); scene.add(keylight);
function light(col,intensity,d,x,y,z){const l=new THREE.PointLight(col,intensity,d,2);l.position.set(x,y,z);scene.add(l);return l;}
const roomLight=light(0xffcb91,7.8,9,-1.2,2.7,-1.55);light(0xffcd95,4.8,6,.6,2.7,.25);
light(0x83d8e2,.85,4,2.69,2.30,-.24);light(0xffbc73,9,8,-4.6,3.4,3.8);
const gradient=new THREE.DataTexture(new Uint8Array([74,74,74,150,150,150,210,210,210,255,255,255]),4,1,THREE.RGBFormat);
// RedFormat avoids unsupported RGB texture formats on newer WebGL implementations.
const toonRamp=new THREE.DataTexture(new Uint8Array([57,143,209,255]),4,1,THREE.RedFormat);toonRamp.needsUpdate=true;
toonRamp.minFilter=toonRamp.magFilter=THREE.NearestFilter;
const materials=new Map();
const metalColors=new Set([0x314f5a,0x253e4d,0x344554,0x4e6370,0x344f5b,0x839997,0x465b62,0x415760,0x66737a,0x4e6570,0xc0c9be,0xbec8bf,0xa3bbbd,0x809ca3,0x9dbeb8,0x9facad,0xa1b4b9,0xb8c2b0,0xb3bdb0,0x73888c,0xa2b3aa]);
const enamelColors=new Set([0x547778,0xc9e3de,0x327e84,0x93a7a6,0xc5cabc,0xb1b7ae,0xa8b1a5,0x94aaac,0x708c9a]);
const concreteColors=new Set([0x899195,0x929b98,0xb6b7ad,0xbcbcac,0xb0b7ab]);
function mat(c,emissive=0,e=0){let k=c+':'+emissive+':'+e;if(!materials.has(k)){const m=!emissive&&metalColors.has(c)?surfaces.metal(c):!emissive&&enamelColors.has(c)?surfaces.enamel(c):!emissive&&concreteColors.has(c)?surfaces.concrete(c):new THREE.MeshToonMaterial({color:c,gradientMap:toonRamp,emissive,emissiveIntensity:e});materials.set(k,m);}return materials.get(k);}
const outlineMat=new THREE.LineBasicMaterial({color:0x182337,transparent:true,opacity:.46});const outlineShell=new THREE.MeshBasicMaterial({color:0x243342,side:THREE.BackSide});
const unitBox=new THREE.BoxGeometry(1,1,1);
function box(w,h,d,c,x,y,z,parent=scene,edge=true){const material=typeof c==='number'?mat(c):c;const rounded=!material.transparent&&Math.min(w,h,d)>.055&&Math.max(w,h,d)>.12;const geometry=rounded?new RoundedBoxGeometry(w,h,d,2,Math.min(w,h,d)*.10):unitBox;let m=new THREE.Mesh(geometry,material);if(!rounded)m.scale.set(w,h,d);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(edge){if(rounded){const hull=new THREE.Mesh(geometry,outlineShell);hull.scale.set(1+.0028/w,1+.0028/h,1+.0028/d);m.add(hull);}else{const g=new THREE.EdgesGeometry(unitBox);const l=new THREE.LineSegments(g,outlineMat);m.add(l);}}return m;}
function cyl(r,rt,h,c,x,y,z,parent=scene,n=32){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,rt,h,n),typeof c==='number'?mat(c):c);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function orbShape(r,c,x,y,z,parent=scene,sx=1,sy=1,sz=1){const m=new THREE.Mesh(new THREE.SphereGeometry(r,32,24),typeof c==='number'?mat(c):c);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;}
function tube(points,r,c,parent=scene){let curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));let m=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*10),r,12,false),typeof c==='number'?mat(c):c);m.castShadow=true;parent.add(m);return m;}
function bar(a,b,r,c,parent=scene){const d=new THREE.Vector3().subVectors(new THREE.Vector3(...b),new THREE.Vector3(...a));let m=cyl(r,r,d.length(),c,...a,parent,20);m.position.addScaledVector(d,.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m;}
function canvasTex(w,h,paint){const cv=document.createElement('canvas');cv.width=w;cv.height=h;paint(cv.getContext('2d'),w,h);const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
function label(text,w,h,bg='#edead5',fg='#225356',font=76){return canvasTex(1024,256,(ctx)=>{ctx.fillStyle=bg;ctx.fillRect(0,0,1024,256);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${font}px "Yu Gothic", "Meiryo", sans-serif`;ctx.fillText(text,512,135,950);});}
function panel(tex,w,h,x,y,z,parent=scene,glow=.2){let m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:0xffffff,emissiveIntensity:glow,roughness:.5,side:THREE.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;}
function disc(r,c,x,y,z,parent=scene){let m=new THREE.Mesh(new THREE.CircleGeometry(r,48),typeof c==='number'?mat(c):c);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);parent.add(m);return m;}
let seed=72019;function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const glowTex=canvasTex(128,128,(c)=>{const g=c.createRadialGradient(64,64,1,64,64,64);g.addColorStop(0,'rgba(255,255,255,.66)');g.addColorStop(.2,'rgba(255,255,255,.15)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,128,128);});
function glow(x,y,z,color,size,opacity=.2){let s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending}));s.position.set(x,y,z);s.scale.setScalar(size);scene.add(s);return s;}

// The entire miniature lives on this one continuous square plinth.
box(12,.45,12,surfaces.enamel(0x172736),0,-.24,0);box(11.96,.07,11.96,0x41566b,0,-.025,0);
box(11.9,.025,11.9,0x223b4e,0,.019,0,scene,false);
const road=new Reflector(new THREE.PlaneGeometry(11.89,11.89),{color:0x566d8b,textureWidth:1024,textureHeight:1024,clipBias:0});
road.rotation.x=-Math.PI/2;road.position.y=.035;
road.material.vertexShader='varying vec2 groundUv;'+road.material.vertexShader.replace('vUv = textureMatrix','groundUv = position.xy; vUv = textureMatrix');
road.material.uniforms.time={value:0};road.material.uniforms.asphaltNormal={value:surfaces.asphaltNormal};road.material.uniforms.asphaltRoughness={value:surfaces.asphaltRoughness};
road.material.fragmentShader='varying vec2 groundUv;uniform float time;uniform sampler2D asphaltNormal;uniform sampler2D asphaltRoughness;'+road.material.fragmentShader;
road.material.fragmentShader=road.material.fragmentShader.replace('vec4 base = texture2DProj( tDiffuse, vUv );',
`vec2 gravelUv=groundUv*.72;
float rough=texture2D(asphaltRoughness,gravelUv).r;
float puddle=smoothstep(-.28,.58,sin(groundUv.x*.86+sin(groundUv.y*1.18))*sin(groundUv.y*.88+cos(groundUv.x*.63)));
vec2 grainNormal=texture2D(asphaltNormal,gravelUv).rg*2.-1.;
vec2 reflectUv=vUv.xy/vUv.w+grainNormal*.00010+vec2(sin(groundUv.y*5.+time*1.2),cos(groundUv.x*6.-time))*.00032;
float spread=(1.+(1.-puddle)*.6)/1024.;
vec4 base=vec4(0.);
for(int bx=-2;bx<=2;bx++){
  float wx=bx==0?6.:abs(bx)==1?4.:1.;
  for(int by=-2;by<=2;by++){
    float wy=by==0?6.:abs(by)==1?4.:1.;
    vec4 tap=texture2D(tDiffuse,reflectUv+vec2(float(bx),float(by))*spread);
    tap.rgb/=1.+max(max(tap.r,tap.g),tap.b)*.4;
    base+=tap*(wx*wy/256.);
  }
}`);
road.material.fragmentShader=road.material.fragmentShader.replace('vec4( blendOverlay( base.rgb, color ), 1.0 )','vec4(mix(vec3(.018,.029,.045)*(1.+rough*.12),(base.rgb/(1.+max(max(base.r,base.g),base.b)*.65))*vec3(.65,.75,.87),.18+.48*puddle),1.0)');scene.add(road);
// A fine, transparent road grain makes the reflection look rain-soaked instead of polished.
const grain=canvasTex(512,512,c=>{c.clearRect(0,0,512,512);for(let i=0;i<18000;i++){c.fillStyle=rand()>.5?'rgba(138,170,184,.055)':'rgba(8,20,34,.08)';c.fillRect(rand()*512,rand()*512,1,1);}});grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(5,5);
let grainMat=new THREE.MeshBasicMaterial({map:grain,transparent:true,depthWrite:false,opacity:.8});let grainPlane=new THREE.Mesh(new THREE.PlaneGeometry(11.89,11.89),grainMat);grainPlane.rotation.x=-Math.PI/2;grainPlane.position.y=.04;scene.add(grainPlane);
// Raised sidewalk, curb stones, and two connected roads.
box(6.55,.24,5.65,0x667782,-.9,.13,-1.43);box(6.35,.025,5.46,0x899195,-.9,.265,-1.43);
for(let x=-4.05;x<2.4;x+=.43)box(.405,.23,.18,0xb6b7ad,x,.17,1.4,scene,false);
for(let z=-4.1;z<1.42;z+=.43)box(.18,.23,.405,0xb6b7ad,2.31,.17,z,scene,false);
const tileLine=new THREE.LineBasicMaterial({color:0x697b84,transparent:true,opacity:.55});const tileVerts=[];
for(let x=-4.05;x<2.3;x+=.48)tileVerts.push(x,.285,-4.09,x,.285,1.3);
for(let z=-4.09;z<1.32;z+=.48)tileVerts.push(-4.05,.285,z,2.24,.285,z);
const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute(tileVerts,3));scene.add(new THREE.LineSegments(tg,tileLine));
for(let z=2.5;z<5.55;z+=.53)box(2.14,.002,.285,0xd5d6c9,3.85,.043,z,scene,false);
for(let x=-5.2;x<-1.5;x+=1.05)box(.54,.002,.055,0x9bada6,x,.043,4.35,scene,false);
// Parking bay and gutter details.
for(const x of [-4.95,-2.15])box(.045,.002,1.55,0xbebda2,x,.043,2.75,scene,false);
box(2.84,.002,.045,0xbebda2,-3.55,.043,3.53,scene,false);
for(let x=-3.9;x<2.3;x+=.82){box(.63,.012,.17,0x172a35,x,.045,1.63,scene,false);for(let i=0;i<6;i++)box(.035,.021,.14,0x697c83,x-.25+i*.095,.054,1.63,scene,false);}
for(let z=-3.7;z<1.2;z+=.8){box(.17,.012,.62,0x152c39,2.57,.045,z,scene,false);for(let i=0;i<6;i++)box(.13,.021,.025,0x5a7680,2.57,.054,z-.25+i*.095,scene,false);}
const mh=cyl(.33,.33,.010,0x1b3446,1.1,.041,3.2,scene,40);for(let a=0;a<Math.PI;a+=.4)bar([1.1+Math.cos(a)*.24,.049,3.2+Math.sin(a)*.24],[1.1-Math.cos(a)*.24,.049,3.2-Math.sin(a)*.24],.003,0x759091);
const parking=panel(label('P',1,1,'#203b50','#bac8c5',178),.42,.42,-3.6,.071,2.7);parking.rotation.x=-Math.PI/2;
// Store envelope. Separate roof group supports a clean architectural cutaway.
const building=new THREE.Group();scene.add(building);const roof=new THREE.Group();scene.add(roof);
box(5.85,.12,4.66,0xbcbcac,-.95,.27,-1.47,building);
box(5.77,3.1,.14,0xb0b7ab,-.95,1.88,-3.76,building);box(.14,3.1,4.5,0x76878a,-3.81,1.88,-1.47,building);
const glass=new THREE.MeshPhysicalMaterial({color:0xa5e0e3,roughness:.12,metalness:.05,transparent:true,opacity:.10,depthWrite:false,side:THREE.DoubleSide,specularIntensity:.8,clearcoat:.65,clearcoatRoughness:.10});
box(5.7,.21,.16,0x39565d,-.95,.48,.82,building);box(.16,.21,4.55,0x39565d,1.91,.48,-1.43,building);
// Window mullions are fine enough to preserve the interior sightline.
for(const x of [-3.8,-2.48,-1.17,.2,1.9])box(.047,2.1,.065,0x465b62,x,1.62,.84,building);
for(const z of [-3.7,-2.15,-.68,.82])box(.065,2.1,.047,0x415760,1.93,1.62,z,building);
box(3.95,2.05,.018,glass,-1.8,1.62,.865,building,false);
box(.018,2.05,4.5,glass,1.94,1.62,-1.45,building,false);
box(5.75,.055,.085,0x839997,-.95,2.67,.84,building);box(.08,.055,4.57,0x839997,1.93,2.67,-1.44,building);
for(let i=0;i<3;i++)box(1.15,.027,.023,0xc6d5d0,-3.14+i*1.35,1.39,.897,building,false);
const doorL=new THREE.Group(),doorR=new THREE.Group();building.add(doorL,doorR);doorL.position.set(.59,0,.883);doorR.position.set(1.34,0,.883);
for(const d of [doorL,doorR]){box(.73,2.25,.022,glass,0,1.52,0,d,false);for(const x of [-.365,.365])box(.035,2.30,.045,0xa3b8b6,x,1.525,0,d);for(const y of [.395,2.665,1.36])box(.73,.035,.045,0x8ca6a7,0,y,0,d);box(.025,.3,.05,0xd1d4c6,d===doorL?.25:-.25,1.38,.035,d);}
box(1.66,.11,.13,0x2c404b,.96,2.73,.9,building);box(.18,.055,.08,mat(0x29343e,0x37bb9c,.4),.96,2.79,.97,building);
// Custom Japanese lightbox: mint-white-amber, with a tiny crescent identity.
const signTex=canvasTex(1536,256,(c,w,h)=>{c.fillStyle='#e2ede2';c.fillRect(0,0,w,h);c.fillStyle='#32837f';c.fillRect(0,0,w,32);c.fillRect(0,h-25,w,25);c.fillStyle='#e9b96c';c.fillRect(0,36,w,6);c.fillStyle='#286e70';c.beginPath();c.arc(100,132,52,0,Math.PI*2);c.fill();c.fillStyle='#e2ede2';c.beginPath();c.arc(122,117,43,0,Math.PI*2);c.fill();c.fillStyle='#275d63';c.font='bold 91px "Yu Gothic",Meiryo,sans-serif';c.fillText('月 灯 り',206,158);c.font='500 37px sans-serif';c.fillText('K O N B I N I',775,117);c.fillStyle='#a67a49';c.font='24px sans-serif';c.fillText('OPEN 24 HOURS',775,162);c.font='bold 90px sans-serif';c.fillStyle='#357a77';c.fillText('24',1340,169);});
box(5.98,.69,.25,0x36525b,-.94,3.055,.99,building);const sign=panel(signTex,5.81,.58,-.94,3.066,1.124,building,1.15);
box(.25,.69,4.64,0x36525b,2.035,3.055,-1.45,building);const sideSign=panel(label('月灯り  /  KONBINI 24',1,1,'#dce9dd','#327a77',80),4.5,.57,2.164,3.066,-1.43,building,1);sideSign.rotation.y=Math.PI/2;
box(6.25,.16,4.99,0x344f5b,-.96,3.48,-1.41,roof);box(6.08,.12,4.84,0x547778,-.96,3.61,-1.41,roof);
for(let x=-3.9;x<2.1;x+=.22)box(.018,.025,4.69,0x314f5a,x,3.685,-1.4,roof,false);
for(const z of [-3.83,1.02])box(6.23,.13,.07,0x253e4d,-.96,3.68,z,roof);
box(6.29,.06,.17,0x344554,-.96,3.46,1.17,roof);box(.17,.06,5.02,0x344554,2.2,3.46,-1.34,roof);
// Warm tubes tucked under the rain canopy.
box(5.66,.027,.085,mat(0xffe4b0,0xffb86e,2),-.95,2.701,1.025,building,false);
box(.085,.028,3.99,mat(0xc7f2e3,0x8ddcbf,1),2.05,2.70,-1.5,building,false);
glow(-.9,3.05,1.3,0xa1ffdf,7,.095);
box(1.54,.084,.65,surfaces.concrete(0xa4aaa3),.94,.327,1.12,scene);box(1.3,.012,.6,0x274249,.94,.375,1.12,scene);for(let x=.39;x<1.55;x+=.075)box(.024,.004,.5,0x6a7f7e,x,.383,1.12,scene,false);
const welcome=panel(label('いらっしゃいませ',1,1,'#274249','#c5cbad',72),.88,.15,.94,.387,1.16);welcome.rotation.x=-Math.PI/2;
const interior=createInterior();scene.add(interior.group);

// An illuminated drink machine, built as a stocked cabinet rather than a flat poster.
const vending=new THREE.Group();vending.position.set(2.72,.29,-.67);vending.rotation.y=.2;scene.add(vending);
box(.92,1.78,.62,0xc9e3de,0,.89,0,vending);box(.85,.17,.64,0x327e84,0,1.70,.006,vending);
panel(label('つめたい   DRINKS',1,1,'#b7d9d6','#214f6b',81),.79,.13,0,1.70,.333,vending,.65);
box(.66,1.05,.025,mat(0x173a4d,0x215c77,.22),-.075,1.02,.33,vending);
for(let row=0;row<3;row++)box(.63,.035,.14,0xa2c8c5,-.075,.63+row*.32,.39,vending);
box(.105,.34,.027,0x1d4354,.345,.90,.33,vending);box(.052,.09,.025,mat(0x99dec6,0x65ffe0,1),.345,.975,.35,vending);box(.048,.018,.03,0x16272e,.345,.88,.35,vending);
box(.67,.21,.09,0x214755,0,.29,.328,vending);box(.57,.035,.02,0x627c86,0,.29,.388,vending);
box(.84,.065,.56,0x264557,0,.05,0,vending);glow(2.7,1.3,-.18,0x94e9ed,2.2,.12);
// Umbrella stand and two carefully curved handles.
const umbrellas=new THREE.Group();umbrellas.position.set(-.14,.24,1.02);scene.add(umbrellas);
box(.46,.05,.32,0x284a58,0,.07,0,umbrellas);for(const x of [-.2,.2])for(const z of [-.12,.12])bar([x,.06,z],[x,.52,z],.014,0x8caaa8,umbrellas);
for(const y of [.19,.46]){bar([-.22,y,-.13],[.22,y,-.13],.016,0x95aba6,umbrellas);bar([-.22,y,.13],[.22,y,.13],.016,0x95aba6,umbrellas);}
for(let i=0;i<3;i++){let x=-.14+i*.14;let um=cyl(.025,.07,.59,[0x6fa59e,0xdcb88e,0x798aa1][i],x,.43,0,umbrellas,9);um.rotation.z=.09-i*.07;bar([x,.72,0],[x,.94,0],.013,0xc0ccbd,umbrellas);tube([[x,.9,0],[x,.99,0],[x+.06,1.01,0],[x+.095,.96,0]],.02,0xc3bea1,umbrellas);}
// Three recycling bins, each with a separate lid and printed category.
for(let i=0;i<3;i++){let x=-3.51+i*.39;box(.33,.6,.35,[0xa8b1a5,0x94aaac,0x708c9a][i],x,.585,1.01);box(.355,.09,.37,0x344f5b,x,.925,1.01);box(.16,.06,.025,0x1b323b,x,.931,1.21);panel(label(['缶','びん','PET'][i],1,1,'#d7dfd2','#315267',100),.21,.17,x,.695,1.195);}
// Street bicycle: slender frame, spokes, chain guard, saddle, basket and kickstand.
const bike=new THREE.Group();bike.position.set(-4.6,.02,-.18);bike.rotation.y=.15;scene.add(bike);
const wheelMat=mat(0x132738);const rimMat=mat(0xa3bbbd);
for(const z of [-.56,.56]){const tire=new THREE.Mesh(new THREE.TorusGeometry(.33,.034,12,64),wheelMat);tire.rotation.y=Math.PI/2;tire.position.set(0,.35,z);bike.add(tire);const rim=new THREE.Mesh(new THREE.TorusGeometry(.297,.012,10,64),rimMat);rim.rotation.y=Math.PI/2;rim.position.set(.012,.35,z);bike.add(rim);for(let a=0;a<Math.PI;a+=Math.PI/8)bar([.018,.35+Math.sin(a)*.292,z+Math.cos(a)*.292],[.018,.35-Math.sin(a)*.292,z-Math.cos(a)*.292],.0055,0x809ca3,bike);orbShape(.045,0xbac6bc,0,.35,z,bike);}
const frame=0x9dbeb8;for(const [a,b] of [[[0,.35,-.56],[0,.40,.0]],[[0,.4,0],[0,.83,-.14]],[[0,.83,-.14],[0,.35,-.56]],[[0,.83,-.14],[0,.83,.41]],[[0,.83,.41],[0,.4,0]],[[0,.83,.41],[0,.35,.56]]])bar(a,b,.025,frame,bike);
bar([0,.4,0],[0,.98,-.2],.022,0x9facad,bike);box(.22,.06,.27,0x39474e,0,.995,-.22,bike);bar([0,.83,.41],[0,1.13,.45],.022,0xc0c9be,bike);tube([[-.24,1.12,.44],[-.19,1.15,.44],[.19,1.15,.44],[.24,1.1,.44]],.026,0xbec8bf,bike);
bar([0,.4,0],[.22,.38,.02],.018,0xa1b4b9,bike);box(.18,.027,.10,0x192f3b,.22,.38,.02,bike);bar([0,.43,0],[-.25,.05,-.12],.016,0x829799,bike);
box(.40,.04,.31,0x2f5061,0,.96,.71,bike);for(let x=-.18;x<.21;x+=.073)bar([x,.96,.57],[x,1.23,.57],.009,0x6c8f97,bike);for(let z=.57;z<.88;z+=.07)for(const x of [-.2,.2])bar([x,.96,z],[x,1.23,z],.009,0x6c8f97,bike);
for(const y of [1.05,1.15,1.23]){bar([-.2,y,.57],[.2,y,.57],.01,0x65858e,bike);bar([-.2,y,.87],[.2,y,.87],.01,0x65858e,bike);bar([-.2,y,.57],[-.2,y,.87],.01,0x65858e,bike);bar([.2,y,.57],[.2,y,.87],.01,0x65858e,bike);}
orbShape(.044,mat(0xffe1ae,0xffc866,1.1),0,.90,.50,bike);
// Lamp with a warm pool of light and a quiet, rounded cap.
cyl(.10,.145,.2,0x263d4b,-4.75,.15,3.74);cyl(.049,.075,3.45,0x3b5460,-4.75,1.89,3.74);
tube([[-4.75,3.49,3.74],[-4.75,3.88,3.74],[-4.57,4.02,3.74],[-4.18,4.02,3.74]],.053,0x4e6370);
cyl(.20,.33,.15,0x34505c,-4.16,3.96,3.74);orbShape(.15,mat(0xffe6b3,0xffce88,2),-4.16,3.88,3.74,scene,1,.4,1);glow(-4.16,3.87,3.74,0xffd3a0,2,.45);
// Compact corner safety rails.
for(const x of [2.96,4.16,5.42]){cyl(.028,.03,.65,0xb8c2b0,x,.38,1.88);cyl(.055,.08,.07,0x273e4e,x,.08,1.88);}
for(const y of [.38,.63])bar([2.95,y,1.88],[5.43,y,1.88],.029,0xb3bdb0);
for(const z of [-4.85,-3.85]){cyl(.04,.045,.66,0xb3bbac,5.47,.37,z);cyl(.042,.047,.10,0xd9a359,5.47,.59,z);}
// Utility poles, insulators, transformer, and sagging neighborhood wires.
const polePositions=[[-4.65,-4.66],[5.40,1.13]];
for(const [x,z] of polePositions){cyl(.083,.135,5.55,0x66737a,x,2.8,z,scene,12);box(.36,.54,.24,0x526877,x,2.70,z+.11);for(let y=.6;y<2.2;y+=.25)bar([x-.17,y,z],[x+.17,y,z],.015,0x789096);box(1.42,.09,.10,0x4e6570,x,5.08,z);for(const dx of [-.55,0,.55]){cyl(.04,.04,.24,0x9cb4b9,x+dx,5.23,z);for(let y=5.14;y<5.36;y+=.047)cyl(.065,.065,.019,0x8aa3b0,x+dx,y,z);}}
const wireGroup=new THREE.Group();scene.add(wireGroup);for(const dx of [-.55,0,.55])tube([[-4.65+dx,5.34,-4.66],[-.3+dx,4.58,-.3],[5.40+dx,5.34,1.13]],.012,0x1a2b3d,wireGroup);
tube([[-4.65,4.60,-4.66],[-2.8,3.89,-4.08],[-2.8,3.25,-3.78]],.012,0x192d3c,wireGroup);
// A neighborhood plate and a small traffic light whose colors gently change.
box(.76,.40,.045,0x315e76,5.40,2.14,1.25);panel(label('月見町 三丁目',1,1,'#315e76','#e0e4d0',85),.71,.31,5.40,2.15,1.279);
box(.79,.30,.25,0x1f3545,4.98,3.60,1.13);const signalBulbs=[];
for(let i=0;i<3;i++){let s=orbShape(.087,new THREE.MeshStandardMaterial({color:[0x577e68,0x9b8052,0x965764][i],emissive:[0x6db795,0xfac768,0xf58992][i],emissiveIntensity:i===0?2:.025}),4.73+i*.245,3.61,1.28,scene,1,1,.42);signalBulbs.push(s);}
bar([5.40,3.6,1.13],[5.01,3.6,1.13],.035,0x345267);
// Roof equipment and side-alley utility clutter.
box(1.12,.59,.81,0x93a7a6,-2.25,3.99,-2.1,roof);box(1.16,.06,.85,0xc5cabc,-2.25,4.30,-2.1,roof);
for(let i=0;i<10;i++)box(.86,.018,.025,0x435e66,-2.25,3.78+i*.047,-1.679,roof,false);
cyl(.25,.30,.32,0x73888c,.64,3.88,-2.75,roof);cyl(.33,.33,.05,0xa2b3aa,.64,4.06,-2.75,roof);
box(.92,.64,.43,0xb1b7ae,-4.14,.78,-2.73);const fan=new THREE.Mesh(new THREE.TorusGeometry(.20,.022,8,32),mat(0x4f6770));fan.rotation.y=-Math.PI/2;fan.position.set(-4.37,.8,-2.73);scene.add(fan);for(let a=0;a<Math.PI;a+=Math.PI/5)bar([-4.395,.8+Math.sin(a)*.19,-2.73+Math.cos(a)*.19],[-4.395,.8-Math.sin(a)*.19,-2.73-Math.cos(a)*.19],.009,0x506b72);
tube([[-4.12,.98,-2.64],[-4.20,1.1,-2.55],[-3.93,1.22,-2.30],[-3.90,2.2,-2.30]],.035,0xd2cfc0);
for(const x of [-4.05,2.14]){tube([[x,3.41,-3.81],[x,3.08,-3.85],[x,.38,-3.85]],.036,0x687d81);cyl(.06,.06,.12,0x9cafab,x,.55,-3.85);}
box(1.7,.32,.58,0x2f4853,-.25,.24,-4.7);for(let i=0;i<14;i++){const x=-.96+rand()*1.46,z=-4.91+rand()*.37;orbShape(.15+rand()*.10,[0x486d68,0x5c8273,0x77927b][i%3],x,.48+rand()*.16,z,scene,1,1.3,1);}
const poster=canvasTex(512,768,(c)=>{c.fillStyle='#d8c9a4';c.fillRect(0,0,512,768);c.fillStyle='#3e5c69';c.fillRect(28,28,456,712);c.fillStyle='#edd7aa';c.textAlign='center';c.font='bold 65px "Yu Gothic",sans-serif';c.fillText('月見まつり',256,119);c.fillStyle='#dab16f';c.beginPath();c.arc(256,310,108,0,Math.PI*2);c.fill();c.fillStyle='#637b7c';for(let i=0;i<7;i++){c.fillRect(40+i*65,475-i%2*45,45,180+i%2*45);}c.fillStyle='#e2d6b8';c.font='31px sans-serif';c.fillText('10.24  /  SATURDAY',256,697);});
box(.075,1.22,.89,0x3a4e58,-3.90,1.84,-1.6);const posterPanel=panel(poster,.81,1.14,-3.90,1.84,-1.6);posterPanel.rotation.y=-Math.PI/2;
const frontPoster=panel(label('おでん、あたたまる。',1,1,'#e9c487','#754d3e',76),1.03,.28,-3.13,.96,.901,building,.25);

const exteriorDetails=createExteriorDetails(THREE,surfaces);scene.add(exteriorDetails.group);roof.add(exteriorDetails.roofDetails);
// Fine rain is contained by the footprint of the miniature.
const dropCount=1400,rainCoords=new Float32Array(dropCount*6),dropSpeeds=new Float32Array(dropCount);
for(let i=0;i<dropCount;i++){rainCoords[i*6]=(rand()-.5)*11.8;rainCoords[i*6+1]=.1+rand()*7.2;rainCoords[i*6+2]=(rand()-.5)*11.8;dropSpeeds[i]=4.5+rand()*3.8;}
const rainGeo=new THREE.BufferGeometry();rainGeo.setAttribute('position',new THREE.BufferAttribute(rainCoords,3));
const rain=new THREE.LineSegments(rainGeo,new THREE.LineBasicMaterial({color:0xbedeea,transparent:true,opacity:.21,depthWrite:false}));rain.frustumCulled=false;scene.add(rain);
const rippleCount=65,rippleMesh=new THREE.InstancedMesh(new THREE.RingGeometry(.93,1,36),new THREE.MeshBasicMaterial({color:0x9cc8d1,transparent:true,opacity:.17,depthWrite:false,side:THREE.DoubleSide}),rippleCount);
scene.add(rippleMesh);const rippleData=[];const dummy=new THREE.Object3D();
function streetPoint(){let x,z;do{x=(rand()-.5)*11.55;z=(rand()-.5)*11.55;}while(x>-4.2&&x<2.4&&z>-4.2&&z<1.65);return{x,z};}
for(let i=0;i<rippleCount;i++)rippleData.push({...streetPoint(),age:rand()*2,life:1.2+rand()*1.4});
const dripPts=new Float32Array(40*6),dripGeo=new THREE.BufferGeometry();dripGeo.setAttribute('position',new THREE.BufferAttribute(dripPts,3));const drips=new THREE.LineSegments(dripGeo,new THREE.LineBasicMaterial({color:0xb7d7d7,transparent:true,opacity:.55}));scene.add(drips);
// Subtle, descending beads on both glass facades, rather than screen-space rain.
const glassDrops=new THREE.Group();scene.add(glassDrops);const beadMeshes=[];
for(let i=0;i<45;i++){const x=-3.7+rand()*3.8,y=.7+rand()*1.9;const m=bar([x,y,.912],[x+.006,y+.025+rand()*.09,.912],.0025,0xbcdddb,glassDrops);m.material=new THREE.MeshBasicMaterial({color:0xb9dcdb,transparent:true,opacity:.36});beadMeshes.push({mesh:m,startY:m.position.y,speed:.045+rand()*.08});}

const reflectedWeather=[rain,drips,rippleMesh,glassDrops];const reflectScene=road.onBeforeRender;
const reflectionMaterials=new Map();
road.onBeforeRender=function(...args){const visibility=reflectedWeather.map(o=>o.visible);for(const o of reflectedWeather)o.visible=false;const restore=[];
scene.traverse(o=>{const m=o.material;if(o.isMesh&&m?.isMeshPhysicalMaterial&&!m.transparent){if(!reflectionMaterials.has(m.uuid))reflectionMaterials.set(m.uuid,new THREE.MeshToonMaterial({color:m.color.clone(),gradientMap:toonRamp}));restore.push([o,m]);o.material=reflectionMaterials.get(m.uuid);}});
try{reflectScene.apply(this,args);}finally{for(const [o,m]of restore)o.material=m;reflectedWeather.forEach((o,i)=>o.visible=visibility[i]);}};
// Precisely fitted pavers leave physical joints around the storefront.
const pavingTiles=[];function tileStrip(x0,x1,z0,z1){const nx=Math.ceil((x1-x0)/.48),nz=Math.ceil((z1-z0)/.48),w=(x1-x0)/nx,d=(z1-z0)/nz;for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)pavingTiles.push({x:x0+(i+.5)*w,z:z0+(j+.5)*d,w:w-.012,d:d-.012});}
tileStrip(-4.08,3.40,.991,1.326);tileStrip(2.40,3.34,-1.27,.95);
const tileGeometry=new RoundedBoxGeometry(1,1,1,2,.045),tileMesh=new THREE.InstancedMesh(tileGeometry,surfaces.concrete(0xb2b6ad),pavingTiles.length),tileObject=new THREE.Object3D(),tileColor=new THREE.Color();
pavingTiles.forEach((p,i)=>{tileObject.position.set(p.x,.282,p.z);tileObject.scale.set(p.w,.015,p.d);tileObject.updateMatrix();tileMesh.setMatrixAt(i,tileObject.matrix);tileMesh.setColorAt(i,tileColor.set(0xffffff).multiplyScalar(.90+(i%5)*.018));});tileMesh.receiveShadow=true;scene.add(tileMesh);
for(const radius of [.29,.225,.14]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.0025,6,72),mat(0x759091));ring.rotation.x=-Math.PI/2;ring.position.set(1.1,.049,3.2);scene.add(ring);}
// Bake the many static details into material batches for smooth navigation.
function bakeGroup(group,except=[]){const buckets=new Map(),lines=new Map(),remove=[];group.updateWorldMatrix(true,true);const inv=group.matrixWorld.clone().invert();function visit(o){if(except.includes(o))return;if(o.isMesh&&!o.isInstancedMesh&&o.geometry&&!Array.isArray(o.material)&&!o.material.transparent&&!o.isReflector){const geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));let key=o.material.uuid;if(!buckets.has(key))buckets.set(key,{material:o.material,geos:[]});buckets.get(key).geos.push(geo.index?geo.toNonIndexed():geo);remove.push(o);}if(o.isLineSegments&&o.material===outlineMat){const geo=o.geometry.clone();geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(!lines.has(o.material))lines.set(o.material,[]);lines.get(o.material).push(geo.index?geo.toNonIndexed():geo);remove.push(o);}for(const ch of [...o.children])visit(ch);}for(const o of [...group.children])visit(o);for(const o of remove)o.removeFromParent();for(const {material,geos}of buckets.values()){for(const g of geos){for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);}const merged=mergeGeometries(geos,false);if(merged){const m=new THREE.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;group.add(m);}}for(const [material,geos]of lines){const merged=mergeGeometries(geos,false);if(merged)group.add(new THREE.LineSegments(merged,material));}}
bakeGroup(doorL);bakeGroup(doorR);bakeGroup(roof);bakeGroup(wireGroup);
bakeGroup(scene,[road,roof,doorL,doorR,interior.group,rain,rippleMesh,drips,glassDrops,wireGroup]);
panel(label('ATM   お酒・たばこ',1,1,'#d6e0d2','#47676c',86),.96,.135,-1.84,.80,.917,scene,.2);
panel(label('挽きたてコーヒー  ¥120',1,1,'#e9d5af','#765844',72),.85,.25,-3.10,1.98,.921,scene,.2);
// A widened sidewalk carries the vending machine and the illustration standee.
box(1.28,.24,2.82,0x697e86,2.80,.13,-.01);
box(1.20,.025,2.72,0x929b98,2.80,.265,-.01,scene,false);
for(let z=-1.37;z<1.4;z+=.43)box(.16,.23,.405,0xb6b7ad,3.44,.17,z,scene,false);
for(let x=2.39;x<3.45;x+=.43)box(.405,.23,.17,0xb6b7ad,x,.17,1.4,scene,false);
for(let x=.26;x<1.66;x+=.14){box(.10,.022,.21,0xc1a464,x,.30,1.29,scene,false);}
const standee=createStandee();standee.position.set(2.93,.285,.78);standee.rotation.y=.28;scene.add(standee);
// A small glazed ceramic orb is the only controllable subject.
const ball=new THREE.Group();scene.add(ball);ball.position.set(.94,.37,-.10);
const sphere=new THREE.Mesh(new THREE.SphereGeometry(.17,40,28),surfaces.enamel(0xb9d8d2));sphere.position.y=.18;sphere.castShadow=true;sphere.receiveShadow=true;ball.add(sphere);
for(const offset of [-.035,.035]){const ring=new THREE.Mesh(new THREE.TorusGeometry(Math.sqrt(.17*.17-offset*offset),.009,8,60),mat(0x385f6b));ring.rotation.x=Math.PI/2;ring.position.y=offset;sphere.add(ring);}
const centerRing=new THREE.Mesh(new THREE.TorusGeometry(.171,.0035,6,60),mat(0xdbbb80));centerRing.rotation.x=Math.PI/2;sphere.add(centerRing);
const ballShadow=new THREE.Mesh(new THREE.CircleGeometry(.22,40),new THREE.MeshBasicMaterial({color:0x081c25,transparent:true,opacity:.30,depthWrite:false}));ballShadow.rotation.x=-Math.PI/2;ballShadow.position.y=.006;ball.add(ballShadow);
const outdoorColliders=[
 {minX:-3.91,maxX:-3.68,minZ:-3.85,maxZ:.95},
 {minX:1.81,maxX:2.04,minZ:-3.86,maxZ:.95},
 {minX:-3.90,maxX:2.04,minZ:-3.87,maxZ:-3.61},
 {minX:-3.90,maxX:.19,minZ:.74,maxZ:.95},
 {minX:1.72,maxX:2.04,minZ:.74,maxZ:.95},
 {minX:2.15,maxX:3.32,minZ:-1.11,maxZ:-.16},
 {minX:2.58,maxX:3.28,minZ:.58,maxZ:.98},
 {minX:-4.94,maxX:-4.25,minZ:-.97,maxZ:.73},
 {minX:-3.70,maxX:-2.50,minZ:.80,maxZ:1.20},
 {minX:-.39,maxX:.12,minZ:.82,maxZ:1.22},
 {minX:2.88,maxX:5.50,minZ:1.83,maxZ:1.93},
 {minX:-4.92,maxX:-4.58,minZ:3.55,maxZ:3.92},
 {minX:5.27,maxX:5.53,minZ:.99,maxZ:1.27}
];
let camMode=2,cutaway=false,firstYaw=Math.PI,firstPitch=-.10,elapsed=0,doorOpen=0,hop=0,hopSpeed=0;
const keys=new Set();let pointerDown=false,lastPointerX=0,lastPointerY=0;
const orbitSaved={position:new THREE.Vector3(13.4,10.7,16.2),target:new THREE.Vector3(0,1.2,0)};
function changeMode(mode){camMode=mode;controls.enabled=mode!==1;ball.visible=mode!==1;standee.visible=true;wireGroup.visible=mode!==3;rain.visible=mode!==3;
 if(mode===1){firstYaw=Math.PI;firstPitch=-.10;roof.visible=false;}
 else if(mode===2){controls.target.copy(orbitSaved.target);camera.position.copy(orbitSaved.position);controls.minDistance=2;controls.maxDistance=90;const fit=Math.max(1,1.25/camera.aspect);camera.position.sub(controls.target).multiplyScalar(fit).add(controls.target);roof.visible=!cutaway;}
 else {controls.target.set(-.94,1.04,-1.40);camera.position.set(3.8,10.6,5.0);controls.minDistance=1;controls.maxDistance=25;const fit=Math.max(1,1.20/camera.aspect);camera.position.sub(controls.target).multiplyScalar(fit).add(controls.target);roof.visible=false;}
 controls.update();renderer.shadowMap.needsUpdate=true;
}
function groundAt(x,z){if(x>.17&&x<1.71&&z>.90&&z<1.455)return .37;if(x>-3.86&&x<1.98&&z>-3.8&&z<.96)return .37;if((x>-4.18&&x<2.39&&z>-4.24&&z<1.43)||(x>2.17&&x<3.44&&z>-1.43&&z<1.43))return .285;return .041;}
function isBlocked(x,z){const r=.17;if(Math.abs(x)>5.72||Math.abs(z)>5.72)return true;return [...interior.colliders,...outdoorColliders].some(c=>x>c.minX-r&&x<c.maxX+r&&z>c.minZ-r&&z<c.maxZ+r);}
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;
 if(e.code==='Digit1')changeMode(1);if(e.code==='Digit2')changeMode(2);if(e.code==='Digit3'||e.code==='KeyC')changeMode(3);
 if(e.code==='KeyR'){cutaway=!cutaway;roof.visible=!cutaway&&camMode===2;renderer.shadowMap.needsUpdate=true;}
 if(e.code==='Space'&&hop<.002){hopSpeed=2.15;}
 if(e.code==='Digit0'){ball.position.set(.94,.37,-.10);sphere.rotation.set(0,0,0);hop=hopSpeed=0;cutaway=false;keys.clear();changeMode(2);}
});
window.addEventListener('keyup',e=>keys.delete(e.code));window.addEventListener('blur',()=>{keys.clear();pointerDown=false;});document.addEventListener('visibilitychange',()=>{keys.clear();});
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown=true;lastPointerX=e.clientX;lastPointerY=e.clientY;renderer.domElement.focus();});window.addEventListener('pointerup',()=>pointerDown=false);
window.addEventListener('pointermove',e=>{if(camMode===1&&pointerDown){firstYaw-=(e.clientX-lastPointerX)*.004;firstPitch=THREE.MathUtils.clamp(firstPitch-(e.clientY-lastPointerY)*.004,-1.25,1.15);}lastPointerX=e.clientX;lastPointerY=e.clientY;});renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);look.resize(innerWidth,innerHeight);if(camMode!==1)changeMode(camMode);});
let prev=performance.now();const forward=new THREE.Vector3(),right=new THREE.Vector3(),motion=new THREE.Vector3(),rollAxis=new THREE.Vector3();
function animate(now){const dt=Math.min((now-prev)/1000,.05);prev=now;elapsed+=dt;const t=elapsed;
 const u=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0),v=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
 const p=ball.position;let moving=!!(u||v);const oldX=p.x,oldZ=p.z;
 if(camMode===1)forward.set(Math.sin(firstYaw),0,Math.cos(firstYaw));else{camera.getWorldDirection(forward);forward.y=0;forward.normalize();}right.set(-forward.z,0,forward.x);
 if(moving){motion.copy(forward).multiplyScalar(u).addScaledVector(right,v).normalize();const step=dt*(keys.has('ShiftLeft')?2.3:1.35);if(!isBlocked(p.x+motion.x*step,p.z))p.x+=motion.x*step;if(!isBlocked(p.x,p.z+motion.z*step))p.z+=motion.z*step;rollAxis.set(p.z-oldZ,0,oldX-p.x);const traveled=rollAxis.length();if(traveled>.00001)sphere.rotateOnWorldAxis(rollAxis.normalize(),traveled/.17);}
 if(camMode===1){if(keys.has('KeyQ'))firstYaw+=dt*1.6;if(keys.has('KeyE'))firstYaw-=dt*1.6;}
 if(hop>0||hopSpeed>0){hopSpeed-=6.8*dt;hop=Math.max(0,hop+hopSpeed*dt);if(hop===0)hopSpeed=0;}
 p.y=THREE.MathUtils.damp(p.y,groundAt(p.x,p.z),18,dt);sphere.position.y=.18+hop;ballShadow.material.opacity=.30/(1+hop*3);ballShadow.scale.setScalar(1+hop);
 if(camMode===1){camera.position.set(p.x,p.y+1.15+hop*.3,p.z);camera.lookAt(p.x+Math.sin(firstYaw)*Math.cos(firstPitch),camera.position.y+Math.sin(firstPitch),p.z+Math.cos(firstYaw)*Math.cos(firstPitch));}else controls.update();
 const doorTarget=(Math.hypot(p.x-.95,p.z-.83)<1.45||t%24>18)?1:0;doorOpen=THREE.MathUtils.damp(doorOpen,doorTarget,4,dt);doorL.position.x=.59-doorOpen*.66;doorR.position.x=1.34+doorOpen*.57;
 const flicker=1+.018*Math.sin(t*13)+.01*Math.sin(t*31);sign.material.emissiveIntensity=1.05*flicker;sideSign.material.emissiveIntensity=.92*flicker;road.material.uniforms.time.value=t;
 for(let i=0;i<dropCount;i++){const b=i*6;rainCoords[b]-=dt*.28;rainCoords[b+1]-=dropSpeeds[i]*dt;let underRoof=rainCoords[b]>-4.09&&rainCoords[b]<2.2&&rainCoords[b+2]>-3.93&&rainCoords[b+2]<1.17;const bottom=underRoof?3.72:.08;if(rainCoords[b+1]<bottom||rainCoords[b]<-5.95){rainCoords[b]=(rand()-.5)*11.8;rainCoords[b+1]=5.5+rand()*2.5;rainCoords[b+2]=(rand()-.5)*11.8;}rainCoords[b+3]=rainCoords[b]-.009;rainCoords[b+4]=rainCoords[b+1]+.12+dropSpeeds[i]*.006;rainCoords[b+5]=rainCoords[b+2];}rainGeo.attributes.position.needsUpdate=true;
 for(let i=0;i<rippleCount;i++){let r=rippleData[i];r.age+=dt;if(r.age>r.life){Object.assign(r,streetPoint());r.age=0;}const phase=r.age/r.life;dummy.position.set(r.x,.044,r.z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.setScalar(.035+phase*.20);dummy.updateMatrix();rippleMesh.setMatrixAt(i,dummy.matrix);rippleMesh.setColorAt(i,new THREE.Color(0x9cb9c6).multiplyScalar((1-phase)*.85));}rippleMesh.instanceMatrix.needsUpdate=true;if(rippleMesh.instanceColor)rippleMesh.instanceColor.needsUpdate=true;
 for(let i=0;i<40;i++){const b=i*6,y=3.44-((t*2.9+i*.311)%3.15);dripPts[b]=-3.99+(i/40)*6.16;dripPts[b+1]=y;dripPts[b+2]=1.19;dripPts[b+3]=dripPts[b];dripPts[b+4]=y+.065;dripPts[b+5]=1.19;}dripGeo.attributes.position.needsUpdate=true;drips.visible=roof.visible;
 for(const b of beadMeshes)b.mesh.position.y=.66+((b.startY-t*b.speed)%1.9+1.9)%1.9;
 const phase=t%20,active=phase<10?0:phase<12?1:2;signalBulbs.forEach((s,i)=>s.material.emissiveIntensity=i===active?1.8:.025);
 if(interior.update)interior.update(dt,t);
 if(moving||hop>0||t<1)renderer.shadowMap.needsUpdate=true;look.render(dt);requestAnimationFrame(animate);
}
window.__konbini={scene,camera,renderer,controls,ball,standee,interior,look,exteriorDetails,changeMode,isBlocked,groundAt,get state(){return{camMode,cutaway,position:ball.position.toArray(),doorOpen,hop};}};
changeMode(2);requestAnimationFrame(animate);
