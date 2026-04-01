import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';

// --- Scene Setup ---
const canvasContainer = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a); 

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.layers.enable(1); // Enable rendering of Virtual Objects on Layer 1
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
canvasContainer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(scene).texture;

// --- Rendering Pipeline Setup (Optics) ---
// 1. Grid Table (Order 0)
function createGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
  for(let i=0; i<=512; i+=32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    // Darker normal lines
    if(i === 256) { ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 4; }
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = '#334155';
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(4, 4);
  return tex;
}

const table = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: createGridTexture(), roughness: 0.8 }));
table.rotation.x = -Math.PI/2; table.renderOrder = 0;
scene.add(table);

const glassDepth = 5;
const glassHeight = 1.25;
const glassWidth = 16;

const stencilGeo = new THREE.PlaneGeometry(glassWidth, glassHeight);

// FRONT Window (looking at red pins) -> Writes Stencil 1
const stencilFrontMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
stencilFrontMat.stencilWrite = true; stencilFrontMat.stencilRef = 1; stencilFrontMat.stencilFunc = THREE.AlwaysStencilFunc; stencilFrontMat.stencilZPass = THREE.ReplaceStencilOp;
const winFront = new THREE.Mesh(stencilGeo, stencilFrontMat);
winFront.position.set(0, glassHeight / 2, glassDepth / 2 + 0.001);
winFront.renderOrder = 1; scene.add(winFront);

// BACK Window (looking at blue pins) -> Writes Stencil 2
const stencilBackMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
stencilBackMat.stencilWrite = true; stencilBackMat.stencilRef = 2; stencilBackMat.stencilFunc = THREE.AlwaysStencilFunc; stencilBackMat.stencilZPass = THREE.ReplaceStencilOp;
const winBack = new THREE.Mesh(stencilGeo, stencilBackMat);
winBack.rotation.y = Math.PI; 
winBack.position.set(0, glassHeight / 2, -glassDepth / 2 - 0.001);
winBack.renderOrder = 1; scene.add(winBack);

// TOP Window (looking down) -> Writes Stencil dynamically based on angle
const stencilTopMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
stencilTopMat.stencilWrite = true; stencilTopMat.stencilRef = 0; stencilTopMat.stencilFunc = THREE.AlwaysStencilFunc; stencilTopMat.stencilZPass = THREE.ReplaceStencilOp;
const winTop = new THREE.Mesh(new THREE.PlaneGeometry(glassWidth, glassDepth), stencilTopMat);
winTop.rotation.x = -Math.PI / 2;
winTop.position.set(0, glassHeight + 0.001, 0);
winTop.renderOrder = 1; scene.add(winTop);

// INNER CEILING Window (looking UP) -> Masks physical space for TIR hallucination
const stencilCeilMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
stencilCeilMat.stencilWrite = true; stencilCeilMat.stencilRef = 3; stencilCeilMat.stencilFunc = THREE.AlwaysStencilFunc; stencilCeilMat.stencilZPass = THREE.ReplaceStencilOp;
const winCeiling = new THREE.Mesh(new THREE.PlaneGeometry(glassWidth, glassDepth), stencilCeilMat);
winCeiling.rotation.x = Math.PI / 2; // Face strictly downwards
winCeiling.position.set(0, glassHeight - 0.001, 0);
winCeiling.renderOrder = 1; scene.add(winCeiling);

// OVERHEAD Exterior Reflection (Fresnel Polished Glass Surface)
const externalReflectorGeo = new THREE.PlaneGeometry(glassWidth, glassDepth);
const externalReflector = new Reflector(externalReflectorGeo, {
  clipBias: 0.003, textureWidth: window.innerWidth * window.devicePixelRatio, textureHeight: window.innerHeight * window.devicePixelRatio, color: 0xffffff
});
externalReflector.rotation.x = -Math.PI / 2; // Face UP
externalReflector.position.set(0, glassHeight + 0.001, 0);
externalReflector.renderOrder = 3; 
externalReflector.material.transparent = true;
externalReflector.material.opacity = 0.2; 
scene.add(externalReflector);

// 3. Lab Prism (Order 4)
// Real-world lab glass often has "frosted" or opaque side walls, with only the functional faces polished clear.
// This prevents confusing edge-reflections. We will make Left/Right opaque, and Top clear for the Top-Down validation view.
const matFrosted = new THREE.MeshStandardMaterial({
  color: 0xf1f5f9, roughness: 1.0, metalness: 0.0, transparent: false,
  side: THREE.DoubleSide
});
const matTransparent = new THREE.MeshStandardMaterial({
  color: 0xe2e8f0, transparent: true, opacity: 0.15, roughness: 0, metalness: 0.1,
});

const glassMats = [
  matFrosted,     // 0: Right (+X)
  matFrosted,     // 1: Left (-X)
  matTransparent, // 2: Top (+Y)
  matTransparent, // 3: Bottom (-Y)
  matTransparent, // 4: Front (+Z)
  matTransparent  // 5: Back (-Z)
];

const glassBlock = new THREE.Mesh(new THREE.BoxGeometry(glassWidth, glassHeight, glassDepth), glassMats);
glassBlock.position.set(0, glassHeight / 2, 0);
glassBlock.renderOrder = 4;
scene.add(glassBlock);

// --- Materials for Stencil Optics ---
const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
const needleGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8);

function createPinMats(color, type) {
  const mHead = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3 });
  const mNeedle = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
  
  const setupOptics = (m) => {
    if (type.startsWith('APP')) {
      // Apparent pins are transparent (opacity 1) so they are IGNORED by the Off-Axis transmission shader, avoiding artifacts!
      m.transparent = true; m.opacity = 1.0; m.depthWrite = true;
      m.stencilWrite = true;
      m.stencilRef = type.includes('RED') ? 1 : 2;
      m.stencilFunc = THREE.EqualStencilFunc;
    }
  };
  setupOptics(mHead); setupOptics(mNeedle);
  return { mHead, mNeedle };
}

function spawnPin(mats, x, z, order, isDraggable = false, layer = 0) {
  const group = new THREE.Group();
  const needle = new THREE.Mesh(needleGeo, mats.mNeedle); needle.position.y = 1.0;
  const head = new THREE.Mesh(headGeo, mats.mHead); head.position.y = 2.0;
  group.add(needle, head); group.position.set(x, 0, z);
  group.traverse(child => { if (child.isMesh) { child.renderOrder = order; child.layers.set(layer); } });
  
  if (isDraggable) {
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.y = 2.0; hit.userData = { parentPin: group };
    group.add(hit); draggablePins.push(hit);
  }
  scene.add(group);
  return group;
}

const draggablePins = [];
const reflectedPins = [];

function spawnReflectedPin(sourcePin, order) {
  const group = sourcePin.clone();
  group.position.y = glassHeight * 2; // Perfect mathematical mirror across the ceiling Y 
  group.scale.y = -1; // Invert geometry 
  
  // Isolate drawing region strictly to ceiling stencil
  group.traverse(child => {
     if (child.isMesh) {
         child.material = child.material.clone();
         child.material.stencilRef = 3;
         child.material.stencilFunc = THREE.EqualStencilFunc;
     }
  });

  scene.add(group);
  reflectedPins.push({ source: sourcePin, mirror: group });
  return group;
}

// Real pins get Order 2 (Drawn before Glass) so the Off-Axis transmission shader captures and refracts them.
const matsRealRed = createPinMats(0xef4444, 'REAL_RED');
const matsAppRed = createPinMats(0xef4444, 'APP_RED');
const realP1_z = -5.0; const realP2_z = -3.5;
const pin1 = spawnPin(matsRealRed, -2.5, realP1_z, 2);
const pin2 = spawnPin(matsRealRed, -1.0, realP2_z, 2);
const appPin1 = spawnPin(matsAppRed, 0, realP1_z, 3, false, 1);
const appPin2 = spawnPin(matsAppRed, 0, realP2_z, 3, false, 1);

const matsRealBlue = createPinMats(0x3b82f6, 'REAL_BLUE');
const matsAppBlue = createPinMats(0x3b82f6, 'APP_BLUE');
const pin3 = spawnPin(matsRealBlue, 1.5, 4.5, 2, true);
const pin4 = spawnPin(matsRealBlue, 3.5, 7.0, 2, true);
const appPin3 = spawnPin(matsAppBlue, 0, 4.5, 3, false, 1);
const appPin4 = spawnPin(matsAppBlue, 0, 7.0, 3, false, 1);

// Generate Algorithmic Ghost Mirrors for TIR optical hallucination
spawnReflectedPin(appPin1, 3);
spawnReflectedPin(appPin2, 3);
spawnReflectedPin(appPin3, 3);
spawnReflectedPin(appPin4, 3);


// --- Full Bidirectional Ray Math ---
let realRayLine = null, appRayLine = null, exitRayLine = null, innerRayLine = null, appBlueRayLine = null;
let showRay = false;
let showVirtualRay = false;
let currentDeltaX = 0;

function rebuildRays() {
  [realRayLine, appRayLine, exitRayLine, innerRayLine, appBlueRayLine].forEach(l => {
    if (l) { scene.remove(l); l.geometry.dispose(); l.material.dispose(); }
  });

  // 1. Calculate Incident Ray from FIXED Red Pins
  const p1 = new THREE.Vector2(pin1.position.x, pin1.position.z);
  const p2 = new THREE.Vector2(pin2.position.x, pin2.position.z);
  const dirIn = new THREE.Vector2().subVectors(p2, p1).normalize();
  
  const zEnter = -glassDepth / 2;
  const xEnter = p1.x + dirIn.x * ((zEnter - p1.y) / dirIn.y);
  
  // 2. Calculate Strict Snell's Law True Internal Path (Answer Key)
  const thetaIn = Math.atan2(Math.abs(dirIn.x), Math.abs(dirIn.y));
  const n1 = 1.0, n2 = 1.5;
  const thetaOut = Math.asin((n1 / n2) * Math.sin(thetaIn));
  const refDir = new THREE.Vector2(Math.sin(thetaOut) * Math.sign(dirIn.x), Math.cos(thetaOut) * Math.sign(dirIn.y));
  
  const zExit = glassDepth / 2;
  const xExit = xEnter + refDir.x * ((zExit - zEnter) / refDir.y);
  
  // 3. Apparent Pin shifts (Optical Illusion translation)
  const xUnbent = xEnter + dirIn.x * ((zExit - zEnter) / dirIn.y);
  currentDeltaX = xExit - xUnbent;

  appPin1.position.x = pin1.position.x + currentDeltaX;
  appPin2.position.x = pin2.position.x + currentDeltaX;
  appPin3.position.x = pin3.position.x - currentDeltaX;
  appPin3.position.z = pin3.position.z;
  appPin4.position.x = pin4.position.x - currentDeltaX;
  appPin4.position.z = pin4.position.z;

  reflectedPins.forEach(r => {
    r.mirror.position.x = r.source.position.x;
    r.mirror.position.z = r.source.position.z;
  });

  if (!showRay && !showVirtualRay) return;

  const mRealRed = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 }); 
  const mRealExit = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 }); 
  const mAppRed = new THREE.LineDashedMaterial({ color: 0xef4444, linewidth: 2, transparent: true, opacity: 0.5, dashSize: 0.5, gapSize: 0.2 }); 
  const mAppExit = new THREE.LineDashedMaterial({ color: 0xef4444, linewidth: 2, transparent: true, opacity: 0.5, dashSize: 0.5, gapSize: 0.2 }); 

  const mInner = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 }); 
  mInner.stencilWrite = true; mInner.stencilRef = 0; mInner.stencilFuncMask = 3; mInner.stencilFunc = THREE.EqualStencilFunc;

  if (currentMode === 'front') {
    mRealRed.stencilWrite=true; mRealRed.stencilRef=0; mRealRed.stencilFuncMask = 1; mRealRed.stencilFunc=THREE.EqualStencilFunc;
    mAppRed.stencilWrite=true; mAppRed.stencilRef=1; mAppRed.stencilFunc=THREE.EqualStencilFunc;
  } else if (currentMode === 'back') {
    mRealExit.stencilWrite=true; mRealExit.stencilRef=0; mRealExit.stencilFuncMask = 2; mRealExit.stencilFunc=THREE.EqualStencilFunc;
    mAppExit.stencilWrite=true; mAppExit.stencilRef=2; mAppExit.stencilFunc=THREE.EqualStencilFunc;
  }

  // Final Exit Ray geometry (Resumes incident slope)
  const exitDir = dirIn.clone();
  const xFinal = xExit + exitDir.x * ((15 - zExit) / exitDir.y);

  if (showRay) {
    // True Physics Ray
    const zSource = -15;
    const xSource = p1.x + dirIn.x * ((zSource - p1.y) / dirIn.y);
    realRayLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(xSource, 0.05, zSource), new THREE.Vector3(xEnter, 0.05, zEnter) ]), mRealRed); realRayLine.renderOrder = 2; scene.add(realRayLine);
    innerRayLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(xEnter, 0.05, zEnter), new THREE.Vector3(xExit, 0.05, zExit) ]), mInner); innerRayLine.renderOrder = 2; scene.add(innerRayLine);
    exitRayLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(xExit, 0.05, zExit), new THREE.Vector3(xFinal, 0.05, 15) ]), mRealExit); exitRayLine.renderOrder = 2; scene.add(exitRayLine);
  }

  if (showVirtualRay) {
    // Virtual Light Path is geometrically constructed throughout the background expanse, but is optically limited to existing only within the window portals.
    if (currentMode === 'front') {
      const appSourceZ = -15;
      const appSourceX = xExit + exitDir.x * ((appSourceZ - zExit) / exitDir.y);
      appRayLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(appSourceX, 0.05, appSourceZ), new THREE.Vector3(xExit, 0.05, 2.5) ]), mAppRed); 
      appRayLine.computeLineDistances(); appRayLine.renderOrder = 2; appRayLine.layers.set(1); scene.add(appRayLine);
    }
    if (currentMode === 'back') {
      const appFinalZ = 15;
      const appFinalX = xEnter + dirIn.x * ((appFinalZ - zEnter) / dirIn.y);
      appBlueRayLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(xEnter, 0.05, -2.5), new THREE.Vector3(appFinalX, 0.05, appFinalZ) ]), mAppExit); 
      appBlueRayLine.computeLineDistances(); appBlueRayLine.renderOrder = 2; appBlueRayLine.layers.set(1); scene.add(appBlueRayLine);
    }
  }
}

rebuildRays();


// --- Interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggedMesh = null;
let dragOffset = new THREE.Vector3();
const dragPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 100).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({visible: false}));
scene.add(dragPlane);

window.addEventListener('mousedown', (e) => {
  if (e.target !== renderer.domElement) return;
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(draggablePins);
  if (hits.length > 0) { 
    controls.enabled = false; 
    draggedMesh = hits[0].object.userData.parentPin; 
    const pz = raycaster.intersectObject(dragPlane);
    if (pz.length > 0) dragOffset.copy(pz[0].point).sub(draggedMesh.position);
    else dragOffset.set(0, 0, 0);
  }
});
window.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  if (draggedMesh) {
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(dragPlane);
    if (hits.length > 0) {
      const targetPoint = hits[0].point.clone().sub(dragOffset);
      draggedMesh.position.x = targetPoint.x;
      draggedMesh.position.z = Math.max(glassDepth/2 + 0.5, targetPoint.z);
      
      appPin3.position.x = pin3.position.x - currentDeltaX;
      appPin3.position.z = pin3.position.z;
      appPin4.position.x = pin4.position.x - currentDeltaX;
      appPin4.position.z = pin4.position.z;
      
      reflectedPins.forEach(r => {
        r.mirror.position.x = r.source.position.x;
        r.mirror.position.z = r.source.position.z;
      });
    }
  }
});
window.addEventListener('mouseup', () => { controls.enabled = true; draggedMesh = null; });

// --- UI & Camera Restrictions ---
let camTargetPos = new THREE.Vector3(0, 1.5, 14), camTargetLook = new THREE.Vector3(0, 1.0, 0);
let camTransition = false, currentMode = 'front';

controls.minDistance = 5;
controls.maxDistance = 25;
controls.enablePan = false;

function applyViewBounds() {
  if (currentMode === 'front') {
    controls.minAzimuthAngle = -Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI / 4;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
  } else if (currentMode === 'back') {
    controls.minAzimuthAngle = Math.PI - Math.PI / 4;
    controls.maxAzimuthAngle = Math.PI + Math.PI / 4;
    controls.minPolarAngle = Math.PI / 4;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
  } else if (currentMode === 'top') {
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.minPolarAngle = 0;
    controls.maxPolarAngle = Math.PI / 8;
  }
}
applyViewBounds();
applyDynamicMasks();

function applyDynamicMasks() {
  const maskRed = (currentMode === 'front');  // Red is background in Front view
  const maskBlue = (currentMode === 'back');  // Blue is background in Back view
  
  [matsRealRed.mHead, matsRealRed.mNeedle].forEach(m => {
    if (maskRed) { m.stencilWrite = true; m.stencilRef = 0; m.stencilFuncMask = 1; m.stencilFunc = THREE.EqualStencilFunc; }
    else { m.stencilWrite = false; m.stencilFunc = THREE.AlwaysStencilFunc; }
  });

  [matsRealBlue.mHead, matsRealBlue.mNeedle].forEach(m => {
    if (maskBlue) { m.stencilWrite = true; m.stencilRef = 0; m.stencilFuncMask = 2; m.stencilFunc = THREE.EqualStencilFunc; }
    else { m.stencilWrite = false; m.stencilFunc = THREE.AlwaysStencilFunc; }
  });
  rebuildRays();
}

function setView(mode, btnId) {
  camTransition = true;
  currentMode = mode;
  controls.enabled = false;
  
  applyDynamicMasks();

  // Turn off portals that are mathematically incorrect for the active perspective.
  winFront.visible = (mode === 'front');
  winBack.visible = (mode === 'back');
  winCeiling.visible = (mode !== 'top'); // Ceiling mirror is exclusively for horizontal TIR simulation
  externalReflector.visible = (mode !== 'top'); // Disable glossy top surface reflection to prioritize internal optical clarity
  
  // The Top portal permanently maintains Stencil = 0 (unmasked physics) so the internal Answer Key is accessible from ALL top-down angles.
  winTop.visible = true;
  winTop.material.stencilRef = 0;

  controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity;
  controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI;

  document.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  if (document.getElementById(btnId)) document.getElementById(btnId).classList.add('active');
  
  if (mode === 'front') { camTargetPos.set(0, 1.0, 14); camTargetLook.set(0, 1.0, 0); }
  else if (mode === 'back') { camTargetPos.set(0, 1.0, -14); camTargetLook.set(0, 1.0, 0); }
  else if (mode === 'top') { camTargetPos.set(0, 16, 0.1); camTargetLook.set(0, 0, 0); }
}

document.getElementById('btn-eye-front').onclick = () => setView('front', 'btn-eye-front');
document.getElementById('btn-eye-back').onclick = () => setView('back', 'btn-eye-back');
document.getElementById('btn-top-view').onclick = () => setView('top', 'btn-top-view');
document.getElementById('btn-toggle-ray').onclick = () => { showRay = !showRay; document.getElementById('btn-toggle-ray').classList.toggle('active', showRay); rebuildRays(); };
document.getElementById('btn-toggle-virtual').onclick = () => { showVirtualRay = !showVirtualRay; document.getElementById('btn-toggle-virtual').classList.toggle('active', showVirtualRay); rebuildRays(); };

window.addEventListener('resize', () => { camera.aspect = window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });

function animate() {
  requestAnimationFrame(animate);
  if (camTransition) {
    camera.position.lerp(camTargetPos, 0.08); controls.target.lerp(camTargetLook, 0.08);
    if (camera.position.distanceTo(camTargetPos) < 0.2) {
      camTransition = false;
      controls.enabled = true;
      applyViewBounds();
    }
  }
  controls.update(); renderer.render(scene, camera);
}
animate();
