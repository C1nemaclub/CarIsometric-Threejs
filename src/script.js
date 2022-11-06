import './style.css';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { PMREMGenerator } from 'three/src/extras/PMREMGenerator.js';
import { GUI } from 'dat.gui';

// Canvas
const canvas = document.querySelector('canvas.webgl');
const gui = new GUI();

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x59cfff);
const params = {
  color: '#59cfff',
};
const color = 0x89cff0;
const density = 0.1;
scene.fog = new THREE.FogExp2(color, density);

/**
 * Objects
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});

const camera = new THREE.OrthographicCamera(
  sizes.width / -50,
  sizes.width / 50,
  sizes.height / 50,
  sizes.height / -50,
  -500,
  1000
);
camera.position.set(1.5, 1, 1.5);
camera.zoom = 3.5;
camera.lookAt(0, 0, 0);
camera.updateProjectionMatrix();

scene.add(camera);
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.render(scene, camera);
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

let manager = new THREE.LoadingManager();
manager.onStart = function (url, itemsLoaded, itemsTotal) {
  console.log(
    'Started loading file: ' +
      url +
      '.\nLoaded ' +
      itemsLoaded +
      ' of ' +
      itemsTotal +
      ' files.'
  );
};
manager.onLoad = function () {
  console.log('Loading complete!');
};
const fbxLoader = new FBXLoader(manager);

let modelReady = false;
let carModel;
let mixer;
const FloatType = THREE.FloatType;
let envmap;
let ground;
const asyncloading = async () => {
  let pmrem = new PMREMGenerator(renderer);
  let envmapTexture = await new RGBELoader()
    .setDataType(FloatType)
    .loadAsync('/assets/envmap.hdr');
  envmap = pmrem.fromEquirectangular(envmapTexture).texture;

  fbxLoader.load('assets/Jeep_done.fbx', (fbx) => {
    carModel = fbx;
    carModel.scale.set(0.01, 0.01, 0.01);
    carModel.position.set(0, 1, 0);
    carModel.children.forEach((child) => {
      child.castShadow = true;
      if (child.material.length > 0) {
        child.material.forEach((mat) => {
          mat.metalness = 0;
          mat.roughness = 1;
        });
      }
    });
    mixer = new THREE.AnimationMixer(fbx);
    const anim = mixer.clipAction(fbx.animations[0]);
    anim.play();
    scene.add(fbx);
    modelReady = true;
  });

  ground = new THREE.Mesh(
    new THREE.BoxGeometry(50, 1, 50),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x59cfff)
        .convertSRGBToLinear()
        .convertSRGBToLinear(),
      envMap: envmap,
      envMapIntensity: 1,
      metalness: 0,
      roughness: 1,
      flatShading: true,
    })
  );
  ground.position.set(0, 0, 0);
  ground.receiveShadow = true;
  scene.add(ground);
};
asyncloading();
gui.addColor(params, 'color').onChange(function (value) {
  scene.background.set(value).convertSRGBToLinear().convertSRGBToLinear(),
    (scene.fog = new THREE.FogExp2(value, density));
  ground.material.color = new THREE.Color(value)
    .convertSRGBToLinear()
    .convertSRGBToLinear();
});

//89cff0

/**
 * Sizes
 */

/**
 * Camera
 */

window.addEventListener('resize', () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Renderer
 */

//Conrtols
const controls = new OrbitControls(camera, canvas);
controls.autoRotate = true;
//controls.autoRotateSpeed = 0.1;
controls.enablePan = false;
controls.enableZoom = false;
controls.maxPolarAngle = Math.PI / 3;
controls.minPolarAngle = Math.PI / 3;

//Light

const AmbientLight = new THREE.AmbientLight(0xfffdd1, 0.2, 200);
scene.add(AmbientLight);

const light = new THREE.PointLight(
  new THREE.Color('#fffdd1').convertSRGBToLinear().convertSRGBToLinear(),
  80,
  100
);
light.castShadow = true;
light.position.set(19.4, 20, 6.6);
scene.add(light);

const lightParams = {
  LightColor: '#fffdd1',
};

const controlParams = {
  enableRotate: true,
};

gui.add(controlParams, 'enableRotate').onChange((value) => {
  controls.autoRotate = value;
});

gui.addColor(lightParams, 'LightColor').onChange(function (value) {
  light.color = new THREE.Color(value)
    .convertSRGBToLinear()
    .convertSRGBToLinear();
});

const Light = gui.addFolder('Light');
Light.add(light.position, 'x', -20, 20);
Light.add(light.position, 'y', -20, 20);
Light.add(light.position, 'z', -20, 20);
Light.add(light, 'intensity', 0, 300);
Light.open();

var clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  if (modelReady) {
    mixer.update(clock.getDelta());
    //carModel.rotateY(0.003);
  }
  controls.update();

  renderer.render(scene, camera);
}

animate();
