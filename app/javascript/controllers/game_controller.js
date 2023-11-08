import { Controller } from "@hotwired/stimulus";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { makeNoise2D, makeNoise3D } from "open-simplex-noise";
import seedrandom from "seedrandom";
import { throttle } from 'lodash-es';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';

// Connects to data-controller="game"
export default class extends Controller {
  connect() {
    this.initThree();
    this.initResizeHandler()
    this.initMaterials();
    this.init3dSubspace(10);
    this.initVectors();
    // this.initResizeHandler();



    // this.geometry = new THREE.BoxGeometry();

    // this.scene.add(this.createCube(0, 0, 0, this.redMaterial));
    this.animate();
    // Handle window resizing
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.controls.update(1.0);
    this.renderer.render(this.scene, this.camera);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.canvasBack = document.getElementById("canvasBack");
    this.camera = new THREE.PerspectiveCamera(75, this.canvasBack.clientWidth / this.canvasBack.clientHeight, 0.1, 1000);
    this.camera.position.set(3, 3, 2);
    const upDirection = new THREE.Vector3(0, 0, 1);
    this.camera.up.copy(upDirection);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.element,
      antialias: true
    });
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setClearColor( 0x000000, 0.0 );
    this.renderer.setSize(this.canvasBack.clientWidth, this.canvasBack.clientHeight);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 25;
  }
  initResizeHandler() {
    const resizeUpdateInterval = 16; // 60 fps!
    const resizeHandler = throttle(() => {
      this.nWidth = this.canvasBack.clientWidth;
      this.nHeight = this.canvasBack.clientHeight;
      // console.log(this.element);
      // console.log(`New Width: ${this.nWidth}, New Height: ${this.nHeight}`);
      this.renderer.setSize(this.nWidth, this.nHeight);
      this.camera.aspect = this.nWidth / this.nHeight;
      this.camera.updateProjectionMatrix();
    }, resizeUpdateInterval, { trailing: true });
    window.addEventListener('resize', resizeHandler);
  }
  init3dSubspace(radius) {
    this.scene.background = new THREE.Color("#000000");
    // this.directionalLight = new THREE.DirectionalLight("#FF0000", 5.0);
    //this.directionalLight.position.set(0, 0, 0);

    this.orangeLight = new THREE.PointLight( 0xFFFFFF, 100, 100 );
    this.orangeLight.position.set( 0, 0, 5 );
    this.scene.add(this.orangeLight);

    this.purpleLight = new THREE.PointLight( 0xFFFFFF, 100, 100 );
    this.purpleLight.position.set( 0, 5, 0 );
    this.scene.add(this.purpleLight);

    this.yellowLight = new THREE.PointLight( 0xFFFFFF, 100, 100 );
    this.yellowLight.position.set( 5, 0, 0 );
    this.scene.add(this.yellowLight);

    this.makeAxis(radius);
    // this.makeXOrthogonalPlane(radius);
    // this.makeYOrthogonalPlane(radius);
    this.makeZOrthogonalPlane(radius);
    // this.makeHyperplane(radius);
  }

  makeAxis(radius) {
    // X-axis = red
    const start = new THREE.Vector3( -radius, 0, 0);
    const end = new THREE.Vector3( radius, 0, 0);
    this.makeLine(this.xAxisMaterial, start, end);
    // Y-axis = green
    start.set(0, -radius, 0);
    end.set(0, radius, 0);
    this.makeLine(this.yAxisMaterial, start, end);
    // Z-axis = red
    start.set(0, 0, -radius);
    end.set(0, 0, radius);
    this.makeLine(this.zAxisMaterial, start, end);
  }

  makeXOrthogonalPlane(radius) {
    const start = new THREE.Vector3( 0, 0, 0);
    const end = new THREE.Vector3( 0, 0, 0);
    for (let i = -radius; i <= radius; i++) {
      if (i==0) continue;
      start.set(0, i, -radius);
      end.set(0, i, radius);
      this.makeLine(this.planeLineMaterial, start, end);
      start.set(0, -radius, i);
      end.set(0, radius, i);
      this.makeLine(this.planeLineMaterial, start, end);
    }
  }

  makeYOrthogonalPlane(radius) {
    const start = new THREE.Vector3( 0, 0, 0);
    const end = new THREE.Vector3( 0, 0, 0);
    for (let i = -radius; i <= radius; i++) {
      if (i==0) continue;
      start.set(-radius, 0, i);
      end.set(radius, 0, i);
      this.makeLine(this.planeLineMaterial, start, end);
      start.set(i, 0, -radius);
      end.set(i, 0, radius);
      this.makeLine(this.planeLineMaterial, start, end);
    }
  }

  makeZOrthogonalPlane(radius) {
    const start = new THREE.Vector3( 0, 0, 0);
    const end = new THREE.Vector3( 0, 0, 0);
    for (let i = -radius; i <= radius; i++) {
      if (i==0) continue;
      start.set(-radius, i, 0);
      end.set(radius, i, 0);
      this.makeLine(this.hyperplaneLineMaterial, start, end);
      start.set(i, -radius, 0);
      end.set(i, radius, 0);
      this.makeLine(this.planeLineMaterial, start, end);
    }
  }

  makeHyperplane(radius) {
    const start = new THREE.Vector3( 0, 0, 0);
    const end = new THREE.Vector3( 0, 0, 0);
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (i==0 && j==0) continue;
        start.set(-radius, i, j);
        end.set(radius, i, j);
        this.makeLine(this.hyperplaneLineMaterial, start, end);
        start.set(i, -radius, j);
        end.set(i, radius, j);
        this.makeLine(this.hyperplaneLineMaterial, start, end);
        start.set(i, j, -radius);
        end.set(i, j, radius);
        this.makeLine(this.hyperplaneLineMaterial, start, end);
      }
    }
  }
  makeLine(material, start, end) {
    const points = [ 
      start.x, start.y, start.z,
      end.x, end.y, end.z
    ];
    const colors = [
      255, 255, 255,
      255, 255, 255
    ];
    const geometry = new LineGeometry();
    geometry.setPositions( points );
    geometry.setColors( colors );

    material.resolution.set( this.canvasBack.clientWidth, this.canvasBack.clientHeight );

    const line = new Line2( geometry, material );
    line.computeLineDistances();
		line.scale.set( 1, 1, 1 );
    this.scene.add( line );
    return line

  }
  makeSphere(material, position) {
    // Create a sphere geometry
    const geometry = new THREE.SphereGeometry(0.1, 64, 32);
    // Create a mesh by combining the geometry and material
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(position.x, position.y, position.z);
    // Add the sphere to the scene
    this.scene.add(sphere);
    return sphere
  }

  initVectors() {
    const start = new THREE.Vector3( 0, 0, 0);
    const end = new THREE.Vector3( -1, 1, 1);
    // Add event listeners to the sliders for X, Y, and Z
    this.uLine = this.makeLine(this.uLineMaterial, start, end);
    this.uSphere = this.makeSphere(this.uMaterial, end);
    this.alpha = 1.5
    end.multiplyScalar(this.alpha);
    this.uAlphaLine = this.makeLine(this.uAlphaLineMaterial, start, end);
    this.uAlphaSphere = this.makeSphere(this.uAlphaMaterial, end);

    this.initSlider("x-slider", "x");
    this.initSlider("y-slider", "y");
    this.initSlider("z-slider", "z");
    this.initSlider("alpha-slider", "alpha");
  }
  initSlider(sliderId, component) {
    const slider = document.getElementById(sliderId);
    slider.addEventListener("input", (event) => this.handleSliderChange(event, component));
  }
  handleSliderChange(event, component) {
    const sliderValue = parseFloat(event.target.value);
    const oldPositions = this.uSphere.position;
    console.log("oldPositions", oldPositions);
    let x = oldPositions.x;
    let y = oldPositions.y;
    let z = oldPositions.z;
    console.log("x, y, z", x, y, z);

    // Update the specific component (x, y, or z) based on the slider value
    if (component === "x") {
      x = (sliderValue  / 50.0) - 1.0;
    } else if (component === "y") {
      y = (sliderValue  / 50.0) - 1.0;
    } else if (component === "z") {
      z = (sliderValue  / 50.0) - 1.0;
    } else if (component === "alpha") {
      this.alpha = (sliderValue / 12.5) - 4.0;
    }

    // Set the new position of the end point for uLin
    // const positions = this.uLine.geometry.attributes.position.array;
    // positions[3] = x;  // Update the x coordinate
    // positions[4] = y;  // Update the y coordinate
    // positions[5] = z;  // Update the z coordinate

    const points = [ 
      0, 0, 0,
      x, y, z
    ];
    const colors = [
      255, 255, 255,
      255, 255, 255
    ];
    // this.uLine.geometry = new LineGeometry();
    this.uLine.geometry.setPositions( points );
    this.uLine.geometry.setColors( colors );
    this.uLine.geometry.attributes.position.needsUpdate = true;
    this.uSphere.position.set(x, y, z);

    // Set the new position of the end point for uAlphaLine
    x *= this.alpha;
    y *= this.alpha;
    z *= this.alpha;
    points[3] = x;
    points[4] = y;
    points[5] = z;
    // this.uAlphaLine.geometry.attributes.position.setXYZ(1, x, y, z);
    this.uAlphaLine.geometry = new LineGeometry();
    this.uAlphaLine.geometry.setPositions( points );
    this.uAlphaLine.geometry.setColors( colors );
    this.uAlphaLine.geometry.attributes.position.needsUpdate = true;
    this.uAlphaSphere.position.set(x, y, z);
  }

  initMaterials() {
    // Axis Lines
    // this.xAxisMaterial = new THREE.LineBasicMaterial( {
    //   color: "#FF0000",
    //   transparent: true,
    //   opacity: 0.8,
    // } );
    this.xAxisMaterial = new LineMaterial( {
      color: 0xFF0000,
      linewidth: 2, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );
    // this.yAxisMaterial = new THREE.LineBasicMaterial( {
    //   color: "#00FF00",
    //   transparent: true,
    //   opacity: 0.8,
    // } );
    this.yAxisMaterial = new LineMaterial( {
      color: 0x00FF00,
      linewidth: 2, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );
    // this.zAxisMaterial = new THREE.LineBasicMaterial( {
    //   color: "#0000FF",
    //   transparent: true,
    //   opacity: 0.8,
    // } );
    this.zAxisMaterial = new LineMaterial( {
      color: 0x0000FF,
      linewidth: 2, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );
    // this.planeLineMaterial = new THREE.LineBasicMaterial( {
    //   color: "#808080",
    //   transparent: true,
    //   opacity: 0.4,
    // } );
    this.planeLineMaterial = new LineMaterial( {
      color: 0x808080,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );
    // this.hyperplaneLineMaterial = new THREE.LineBasicMaterial( {
    //   color: "#808080",
    //   transparent: true,
    //   opacity: 0.3,
    // } );

    this.hyperplaneLineMaterial = new LineMaterial( {
      color: 0x808080,
      linewidth: 1, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );

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
    this.uMaterial = new THREE.MeshStandardMaterial({
      color: "#777777",
      wireframe: false,
      emissive: "#777777",
      flatShading: false,
      emissiveIntensity: 0.5,
      roughness: 0,
      metalness: 0,
    });
    this.uLineMaterial = new LineMaterial( {
      color: 0x777777,
      linewidth: 5, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );
    this.uAlphaMaterial = new THREE.MeshStandardMaterial({
      color: "#800080",
      wireframe: false,
      emissive: "#800080",
      flatShading: false,
      emissiveIntensity: 0.5,
      roughness: 0,
      metalness: 0,
    });
    this.uAlphaLineMaterial = new LineMaterial( {
      color: 0x800080,
      linewidth: 2, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );
    this.uLineMaterial.renderOrder = 1; 
    this.uAlphaLineMaterial.renderOrder = 0;
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

  
}
