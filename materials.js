/**
 * Restrained, deterministic PBR surfaces for a clean anime miniature.
 * No imports or external images: call createSurfaceLibrary(THREE, environmentTexture).
 * All generated images are 256 px and all data maps explicitly use NoColorSpace.
 */
export function createSurfaceLibrary(THREE, envMap = null) {
  const SIZE = 256;
  const fract = x => x - Math.floor(x);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = v => v * v * (3 - 2 * v);
  function seeded(seed) {
    let state = seed >>> 0;
    return () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }
  function noiseGrid(width, height, seed) {
    const random = seeded(seed), data = new Float32Array(width * height);
    for (let i = 0; i < data.length; i++) data[i] = random();
    return (u, v) => {
      const x = fract(u) * width, y = fract(v) * height;
      const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
      const x1 = (ix + 1) % width, y1 = (iy + 1) % height;
      const a = data[iy * width + ix], b = data[iy * width + x1];
      const c = data[y1 * width + ix], d = data[y1 * width + x1];
      return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy;
    };
  }
  const broad = noiseGrid(4, 4, 4103);
  const medium = noiseGrid(16, 16, 8911);
  const fine = noiseGrid(64, 64, 12007);
  const grain = noiseGrid(128, 128, 14891);
  const brushed = noiseGrid(128, 4, 22027);
  const rainWear = noiseGrid(8, 8, 30931);

  function textureFromPixels(pixels, name, color = false, repeat = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    const image = ctx.createImageData(SIZE, SIZE);
    image.data.set(pixels); ctx.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.name = name;
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeat);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }
  function grayMap(fn, name, color = false, repeat = 1) {
    const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const value = Math.round(255 * clamp(fn(x / SIZE, y / SIZE))), i = (y * SIZE + x) * 4;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = value; pixels[i + 3] = 255;
    }
    return textureFromPixels(pixels, name, color, repeat);
  }
  function normalMap(heightAt, strength, name, repeat = 1) {
    const heights = new Float32Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) heights[y * SIZE + x] = heightAt(x / SIZE, y / SIZE);
    const pixels = new Uint8ClampedArray(SIZE * SIZE * 4);
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const left = heights[y * SIZE + (x + SIZE - 1) % SIZE];
      const right = heights[y * SIZE + (x + 1) % SIZE];
      const up = heights[((y + SIZE - 1) % SIZE) * SIZE + x];
      const down = heights[((y + 1) % SIZE) * SIZE + x];
      // CanvasTexture uploads flipped in Y; encode a tangent-space OpenGL normal.
      let nx = (left - right) * strength, ny = (down - up) * strength;
      const invLength = 1 / Math.sqrt(nx * nx + ny * ny + 1);
      nx *= invLength; ny *= invLength;
      const i = (y * SIZE + x) * 4;
      pixels[i] = Math.round((nx * .5 + .5) * 255);
      pixels[i + 1] = Math.round((ny * .5 + .5) * 255);
      pixels[i + 2] = Math.round((invLength * .5 + .5) * 255);
      pixels[i + 3] = 255;
    }
    return textureFromPixels(pixels, name, false, repeat);
  }

  // Long, shallow brushing changes highlight width without drawing dark scratches.
  const metalRoughness = grayMap((u, v) => .79 + .15 * (brushed(u, v) - .5) + .035 * (grain(u, v) - .5), 'Brushed metal roughness', false, 3);
  const metalNormal = normalMap((u, v) => .026 * brushed(u, v) + .003 * fine(u, v), 5.5, 'Subtle brushed metal normals', 3);
  // Almost imperceptible orange peel keeps painted enamel from looking like a mirror.
  const enamelRoughness = grayMap((u, v) => .91 + .045 * (fine(u, v) - .5), 'Clean enamel roughness', false, 2);
  const enamelNormal = normalMap((u, v) => .010 * fine(u, v) + .002 * grain(u, v), 4, 'Clean enamel micro normals', 2);
  // Low-contrast broad shifts and tiny grains, with no stains, cracks or dirt decals.
  const concreteColor = grayMap((u, v) => .948 + .035 * (broad(u, v) - .5) + .025 * (medium(u, v) - .5) + .025 * (grain(u, v) - .5), 'Concrete neutral color variation', true, 2);
  const concreteRoughness = grayMap((u, v) => .93 + .055 * (medium(u, v) - .5) + .045 * (grain(u, v) - .5), 'Concrete roughness', false, 2);
  const concreteNormal = normalMap((u, v) => .036 * grain(u, v) + .010 * fine(u, v) + .008 * medium(u, v), 5, 'Concrete fine aggregate normals', 2);
  // Wet patches remain smooth; drier grains provide restrained local relief.
  const wetness = (u, v) => smooth(clamp((rainWear(u, v) - .29) / .43));
  const asphaltRoughness = grayMap((u, v) => .32 + .43 * (1 - wetness(u, v)) + .035 * (fine(u, v) - .5), 'Wet asphalt roughness', false, 5);
  const asphaltNormal = normalMap((u, v) => {
    const relief = .32 + .68 * (1 - wetness(u, v));
    return relief * (.025 * grain(u, v) + .015 * fine(u, v)) + .009 * medium(u, v);
  }, 5.5, 'Wet asphalt normals', 5);

  const caches = {metal: new Map(), enamel: new Map(), concrete: new Map()};
  function memoized(kind, inputColor, build) {
    const color = new THREE.Color(inputColor);
    const key = color.getHexString();
    if (!caches[kind].has(key)) {
      const material = build(color);
      material.name = `${kind} #${key}`;
      material.userData.surfaceLibrary = true;
      caches[kind].set(key, material);
    }
    return caches[kind].get(key);
  }
  function metal(color = 0xabb9c2) {
    return memoized('metal', color, c => new THREE.MeshPhysicalMaterial({
      color: c, metalness: .44, roughness: .58, roughnessMap: metalRoughness,
      normalMap: metalNormal, normalScale: new THREE.Vector2(.24, .15),
      anisotropy: .25, anisotropyRotation: 0,
      clearcoat: .08, clearcoatRoughness: .34,
      envMap, envMapIntensity: .22
    }));
  }
  function enamel(color = 0xf2f2e9) {
    return memoized('enamel', color, c => new THREE.MeshPhysicalMaterial({
      color: c, metalness: .035, roughness: .36, roughnessMap: enamelRoughness,
      normalMap: enamelNormal, normalScale: new THREE.Vector2(.20, .20),
      clearcoat: .68, clearcoatRoughness: .24,
      clearcoatNormalMap: enamelNormal, clearcoatNormalScale: new THREE.Vector2(.12, .12),
      envMap, envMapIntensity: .30
    }));
  }
  function concrete(color = 0xa3a7ae) {
    return memoized('concrete', color, c => new THREE.MeshStandardMaterial({
      color: c, map: concreteColor, metalness: 0, roughness: .91,
      roughnessMap: concreteRoughness, normalMap: concreteNormal,
      normalScale: new THREE.Vector2(.28, .28), envMap, envMapIntensity: .18
    }));
  }
  return {metal, enamel, concrete, asphaltNormal, asphaltRoughness};
}
