import { Controller } from "@hotwired/stimulus";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { makeNoise2D, makeNoise3D } from "open-simplex-noise";
import seedrandom from "seedrandom";
import { throttle } from 'lodash-es';

// Connects to data-controller="game"
export default class extends Controller {
  connect() {
    this.initScene();
    this.initCamera();
    this.initRenderer();
    this.initResizeHandler();


    this.geometry = new THREE.BoxGeometry();

    this.initMaterials();
    this.directionalLight = new THREE.DirectionalLight("#ffffff", 2.0);
    this.directionalLight.position.set(0.5, 1, 0.2);

    this.scene.add(this.directionalLight);
    this.scene.background = new THREE.Color("#87CEEB");

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    console.log("hello world", this.renderer.domElement);
    // this.createTerrain();


    const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
    const points = [];
    points.push( new THREE.Vector3( - 10, 0, 0 ) );
    points.push( new THREE.Vector3( 10, 0, 0 ) );


    const geometry = new THREE.BufferGeometry().setFromPoints( points );
    const line = new THREE.Line( geometry, material );
    this.scene.add( line );



    this.scene.add(this.createCube(0, 0, 0, this.redMaterial));
    this.animate();
    // Handle window resizing
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update(1.0);
    this.renderer.render(this.scene, this.camera);
  }

  initScene() {
    this.scene = new THREE.Scene();
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(3, 3, 3);
  }
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
  }
  initResizeHandler() {
    const resizeUpdateInterval = 16; // 60 fps!
    const resizeHandler = throttle(() => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      this.renderer.setSize(newWidth, newHeight);
      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
    }, resizeUpdateInterval, { trailing: true });
    window.addEventListener('resize', resizeHandler);
  }

  initMaterials() {
    this.grassMaterial = new THREE.MeshStandardMaterial({
      color: "#348c31",
      wireframe: false,
      emissive: "#348c31",
      flatShading: false,
      emissiveIntensity: 0.5,
    });
    this.dirtMaterial = new THREE.MeshStandardMaterial({
      color: "#9b7653",
      wireframe: false,
      emissive: "#9b7653",
      flatShading: false,
      emissiveIntensity: 0.5,
    });
    this.stoneMaterial = new THREE.MeshStandardMaterial({
      color: "#777777",
      wireframe: false,
      emissive: "#777777",
      flatShading: false,
      emissiveIntensity: 0.5,
    });
    this.trunkMaterial = new THREE.MeshStandardMaterial({
      color: "#9b7653",
      wireframe: false,
      emissive: "#9b7653",
      flatShading: false,
      emissiveIntensity: 0.5,
    });
    // Leaves material
    this.leavesMaterial = new THREE.MeshStandardMaterial({
      color: "#00ff00",
      wireframe: false,
      emissive: "#00ff00",
      flatShading: false,
      emissiveIntensity: 0.5,
      opacity: 0.5,
      transparent: true,
    });

    this.redMaterial = new THREE.MeshStandardMaterial({
      color: "#ff0000",
      wireframe: false,
      emissive: "#ff0000",
      flatShading: false,
      emissiveIntensity: 0.5,
    });
  }

  createCube(x, y, z, material) {
    const cube = new THREE.Mesh(this.geometry, material);
    cube.position.set(x, y, z);
    cube.name = `${x}-${y}-${z}`;

    return cube;
  }

  createTerrain() {
    const terrain = new THREE.Group();
    const frequency = 0.005;
    const amplitude = 50;
    const height = amplitude * 2;
    const width = 50;
    const noise2D = makeNoise2D(this.seed);
    const noise3D = makeNoise3D(this.seed);

    let prng = seedrandom(this.seed);

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        for (let z = 0; z < width; z++) {
          let value = noise2D(x * frequency, z * frequency) * amplitude;
          value = y - value;
          if (value < 20) {
            const cube = this.createCube(x, y, z, this.stoneMaterial);
            terrain.add(cube);
          } else if (value < 23) {
            const cube = this.createCube(x, y, z, this.dirtMaterial);
            terrain.add(cube);
          } else if (value < 25) {
            const cube = this.createCube(x, y, z, this.grassMaterial);
            terrain.add(cube);
            if (prng.quick() > 0.99) {
              const tree = this.createTreeFromRoot(x, y, z);
              terrain.add(tree);
            }
          }
        }
      }
    }

    const tunneledTerrain = this.createTunnel(
      width,
      height,
      width,
      frequency,
      amplitude,
      terrain
    );

    this.scene.add(tunneledTerrain);
  }

  createTreeFromRoot(x, y, z) {
    const tree = new THREE.Group();

    for (let i = 1; i < 4; i++) {
      const cube = this.createCube(x, y + i, z, this.trunkMaterial);
      tree.add(cube);
    }
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        for (let k = -1; k < 2; k++) {
          const cube = this.createCube(
            x + i,
            y + 4,
            z + j,
            this.leavesMaterial
          );
          tree.add(cube);
        }
      }
    }
    return tree;
  }
  createTunnel(width, height, depth, frequency, amplitude, terrain) {
    const noise3D = makeNoise3D(this.seed);

    for (let i = 0; i < width - 3; i++) {
      for (let j = 3; j < amplitude; j++) {
        for (let k = 0; k < depth - 3; k++) {
          let value =
            noise3D(i * frequency, j * frequency, k * frequency) * amplitude;

          if (value > 5 && value < 7) {
            const cube = terrain.getObjectByName(`${i}-${j}-${k}`);

            if (cube) {
              terrain.remove(cube);
            }
          }
        }
      }
    }
    return terrain;
  }
}
