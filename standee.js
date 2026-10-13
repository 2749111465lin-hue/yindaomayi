import * as THREE from 'three';
import uniformReference from './official-uniform-reference.png';

// Printed acrylic standee using the unmodified official image. Its base rests at y=0.
export function createStandee(){
  const group=new THREE.Group();group.name='Mai official illustration acrylic standee';
  const crop={x:390,y:1,width:268,height:898};
  const artHeight=1.70,unit=artHeight/crop.height,artWidth=crop.width*unit,foot=.061;
  const acrylic=new THREE.MeshPhysicalMaterial({color:0xc4e1e8,transparent:true,opacity:.25,
    roughness:.19,metalness:0,clearcoat:1,clearcoatRoughness:.12,side:THREE.DoubleSide,depthWrite:false});
  const edgeMaterial=new THREE.LineBasicMaterial({color:0xd6e8ed,transparent:true,opacity:.42,depthWrite:false});
  const baseMaterial=new THREE.MeshStandardMaterial({color:0x26333f,roughness:.35,metalness:.30});
  const rimMaterial=new THREE.MeshStandardMaterial({color:0x89999e,roughness:.26,metalness:.58});
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.278,.285,.050,64),baseMaterial);
  base.position.y=.025;base.scale.z=.69;base.castShadow=true;base.receiveShadow=true;group.add(base);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.280,.282,.009,64),rimMaterial);
  rim.position.y=.012;rim.scale.z=.69;group.add(rim);
  const socket=new THREE.Mesh(new THREE.BoxGeometry(.112,.020,.027),rimMaterial);
  socket.position.set(.002,.054,-.009);group.add(socket);

  // A clear rear brace makes the prop read as a physical printed stand, also from behind.
  const brace=new THREE.Mesh(new THREE.BoxGeometry(.057,.55,.014),acrylic);
  brace.position.set(0,.309,-.084);brace.rotation.x=-.27;group.add(brace);
  const rearFoot=new THREE.Mesh(new THREE.BoxGeometry(.095,.012,.125),acrylic);
  rearFoot.position.set(0,.056,-.124);group.add(rearFoot);

  const tex=new THREE.TextureLoader().load(uniformReference,loaded=>{
    const image=loaded.image;
    loaded.colorSpace=THREE.SRGBColorSpace;loaded.anisotropy=8;loaded.needsUpdate=true;
    // Trace a slightly expanded alpha mask into a thin solid acrylic outline.
    // Neither the original PNG nor its printed pixels are edited.
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
    const data=ctx.getImageData(crop.x,crop.y,crop.width,crop.height).data;
    const step=4,pad=2,w=Math.ceil(crop.width/step)+pad*2,h=Math.ceil(crop.height/step)+pad*2;
    const raw=new Uint8Array(w*h),mask=new Uint8Array(w*h);
    for(let y=pad;y<h-pad;y++)for(let x=pad;x<w-pad;x++){
      const sx=Math.min(crop.width-1,(x-pad)*step+2),sy=Math.min(crop.height-1,(y-pad)*step+2);
      raw[y*w+x]=data[(sy*crop.width+sx)*4+3]>96?1:0;
    }
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      let filled=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)filled|=raw[(y+dy)*w+x+dx];mask[y*w+x]=filled;
    }
    const edges=new Map(),key=(x,y)=>`${x},${y}`;
    const add=(ax,ay,bx,by)=>edges.set(key(ax,ay),[bx,by]);
    const occupied=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&mask[y*w+x];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(occupied(x,y)){
      if(!occupied(x,y-1))add(x,y,x+1,y);
      if(!occupied(x+1,y))add(x+1,y,x+1,y+1);
      if(!occupied(x,y+1))add(x+1,y+1,x,y+1);
      if(!occupied(x-1,y))add(x,y+1,x,y);
    }
    const paths=[];
    while(edges.size){
      const first=edges.keys().next().value;let current=first;const path=[];
      for(let guard=0;guard<w*h*4;guard++){
        const point=current.split(',').map(Number);path.push(point);
        const next=edges.get(current);if(!next)break;edges.delete(current);current=key(...next);if(current===first)break;
      }
      if(path.length>12)paths.push(path);
    }
    const area=path=>Math.abs(path.reduce((sum,p,i)=>{const q=path[(i+1)%path.length];return sum+p[0]*q[1]-q[0]*p[1];},0));
    paths.sort((a,b)=>area(b)-area(a));
    if(paths.length){
      let points=paths[0].map(([x,y])=>new THREE.Vector2(((x-pad)*step-crop.width/2)*unit,foot+(crop.height-(y-pad)*step)*unit));
      points=points.map((p,i)=>p.clone().multiplyScalar(.50).addScaledVector(points[(i+points.length-1)%points.length],.25).addScaledVector(points[(i+1)%points.length],.25));
      const shape=new THREE.Shape(points);
      const geo=new THREE.ExtrudeGeometry(shape,{depth:.010,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.0018,bevelThickness:.0016,curveSegments:2});
      const plate=new THREE.Mesh(geo,acrylic);plate.position.z=-.014;plate.name='Contoured transparent acrylic';group.add(plate);
      const loop=points.map(p=>new THREE.Vector3(p.x,p.y,-.002));loop.push(loop[0].clone());
      const outline=new THREE.Line(new THREE.BufferGeometry().setFromPoints(loop),edgeMaterial);group.add(outline);
    }
  });
  tex.colorSpace=THREE.SRGBColorSpace;
  const artGeometry=new THREE.PlaneGeometry(artWidth,artHeight);
  const uv=artGeometry.attributes.uv;
  for(let i=0;i<uv.count;i++){
    uv.setXY(i,(crop.x+uv.getX(i)*crop.width)/980,1-(crop.y+(1-uv.getY(i))*crop.height)/940);
  }
  uv.needsUpdate=true;
  const artMaterial=new THREE.MeshBasicMaterial({map:tex,transparent:true,alphaTest:.12,
    side:THREE.DoubleSide,toneMapped:false,depthWrite:true});
  const art=new THREE.Mesh(artGeometry,artMaterial);art.name='Unmodified official printed artwork';
  art.position.set(0,foot+artHeight/2,.002);art.castShadow=true;
  art.customDepthMaterial=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:tex,alphaTest:.12,side:THREE.DoubleSide});
  group.add(art);

  const labelCanvas=document.createElement('canvas');labelCanvas.width=256;labelCanvas.height=64;
  const labelCtx=labelCanvas.getContext('2d');labelCtx.fillStyle='#d2dcdd';labelCtx.textAlign='center';labelCtx.textBaseline='middle';
  labelCtx.font='28px sans-serif';labelCtx.fillText('月灯り',128,33);
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Mesh(new THREE.PlaneGeometry(.145,.036),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false,toneMapped:false}));
  label.position.set(0,.026,.195);group.add(label);
  return group;
}
