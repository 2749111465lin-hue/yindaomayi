import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// Independently implemented lighting; visual reference: ektogamat/threejs-conference.
export function createLook(THREE,renderer,scene,camera){
  const studio=new THREE.Scene();
  const shell=new THREE.Mesh(new THREE.BoxGeometry(30,30,30),new THREE.MeshBasicMaterial({color:0x192c43,side:THREE.BackSide}));studio.add(shell);
  for(const p of [
    {c:0xc0ddff,k:2.1,pos:[-8,9,4],scale:[3,6,5]},
    {c:0xffd6a4,k:3.4,pos:[0,5,-8],scale:[8,2,1]},
    {c:0x94e1dc,k:2.6,pos:[9,3,2],scale:[1,4,3]},
    {c:0xd3dfeb,k:1.1,pos:[2,12,0],scale:[10,1,5]}
  ]){const m=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:new THREE.Color(p.c).multiplyScalar(p.k),toneMapped:false}));m.position.set(...p.pos);m.scale.set(...p.scale);studio.add(m);}
  const pmrem=new THREE.PMREMGenerator(renderer);const target=pmrem.fromScene(studio,.09,.1,50);pmrem.dispose();
  studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
  scene.environment=target.texture;scene.environmentIntensity=.34;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d');const gradient=ctx.createRadialGradient(256,214,24,256,244,354);gradient.addColorStop(0,'#304154');gradient.addColorStop(.58,'#1d2c3d');gradient.addColorStop(1,'#111e2e');ctx.fillStyle=gradient;ctx.fillRect(0,0,512,512);
  const background=new THREE.CanvasTexture(canvas);background.colorSpace=THREE.SRGBColorSpace;scene.background=background;
  const renderTarget=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:2});
  const composer=new EffectComposer(renderer,renderTarget);composer.setPixelRatio(Math.min(devicePixelRatio,1.5));composer.setSize(innerWidth,innerHeight);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.055,.22,2.1);bloom.materialHighPassFilter.fragmentShader=bloom.materialHighPassFilter.fragmentShader.replace('vec4 texel = texture2D( tDiffuse, vUv );','vec4 texel = texture2D( tDiffuse, vUv ); texel.rgb = min(texel.rgb, vec3(3.0));');composer.addPass(bloom);composer.addPass(new OutputPass());
  return {composer,envMap:target.texture,bloom,resize(w,h){composer.setSize(w,h);},render(dt){composer.render(dt);}};
}
