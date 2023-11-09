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

    // const size = 10;
    // const divisions = 10;

    // const gridHelper = new THREE.GridHelper( size, divisions );
    // this.scene.add( gridHelper );

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
      2.3, 2.3, 2.3,
      2.3, 2.3, 2.3
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
    this.uLineX = this.makeLine(
      this.uLineAxisMaterial,
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(-1, 1, 0)
    )
    this.uLineY = this.makeLine(
      this.uLineAxisMaterial,
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-1, 1, 0)
    )
    this.uLineZ = this.makeLine(
      this.uLineAxisMaterial,
      new THREE.Vector3(-1, 1, 0),
      new THREE.Vector3(-1, 1, 1)
    )

    this.alpha = 1.5
    end.multiplyScalar(this.alpha);
    start.set(-1, 1, 1);
    this.uAlphaLine = this.makeLine(this.uAlphaLineMaterial, start, end);
    this.uAlphaSphere = this.makeSphere(this.uAlphaMaterial, end);
    this.uAlphaLineX = this.makeLine(
      this.uAlphaLineAxisMaterial,
      new THREE.Vector3(end.x, 0, 0),
      new THREE.Vector3(end.x, end.y, 0)
    )
    this.uAlphaLineY = this.makeLine(
      this.uAlphaLineAxisMaterial,
      new THREE.Vector3(0, end.y, 0),
      new THREE.Vector3(end.x, end.y, 0)
    )
    this.uAlphaLineZ = this.makeLine(
      this.uAlphaLineAxisMaterial,
      new THREE.Vector3(end.x, end.y, 0),
      new THREE.Vector3(end.x, end.y, end.z)
    )

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
    // console.log("oldPositions", oldPositions);
    let x = oldPositions.x;
    let y = oldPositions.y;
    let z = oldPositions.z;
    // console.log("x, y, z", x, y, z);

    // Update the specific component (x, y, or z) based on the slider value
    const sliderValueDisplay = document.getElementById(component.concat("-slider-value"));
    // console.log(sliderValueDisplay);
    if (component === "x") {
      x = (sliderValue  / 50.0) - 1.0;
      sliderValueDisplay.textContent = `${Math.round(100*x)/100}`
    } else if (component === "y") {
      y = (sliderValue  / 50.0) - 1.0;
      sliderValueDisplay.textContent = `${Math.round(100*y)/100}`
    } else if (component === "z") {
      z = (sliderValue  / 50.0) - 1.0;
      sliderValueDisplay.textContent = `${Math.round(100*z)/100}`
    } else if (component === "alpha") {
      this.alpha = (sliderValue / 12.5) - 4.0;
      sliderValueDisplay.textContent = `${Math.round(100*this.alpha)/100}`
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
      2.3, 2.3, 2.3,
      2.3, 2.3, 2.3
    ];
    // this.uLine.geometry = new LineGeometry();
    this.uLine.geometry.setPositions( points );
    this.uLine.geometry.setColors( colors );
    this.uLine.geometry.attributes.position.needsUpdate = true;
    this.uSphere.position.set(x, y, z);

    points[0] = 0;
    points[1] = y;
    points[2] = 0;
    points[3] = x;
    points[4] = y;
    points[5] = 0;
    this.uLineX.geometry.setPositions( points );
    this.uLineX.geometry.setColors( colors );
    this.uLineX.computeLineDistances();
    this.uLineX.geometry.attributes.position.needsUpdate = true;

    points[0] = x;
    points[1] = 0;
    points[2] = 0;
    points[3] = x;
    points[4] = y;
    points[5] = 0;
    this.uLineY.geometry.setPositions( points );
    this.uLineY.geometry.setColors( colors );
    this.uLineY.computeLineDistances();
    this.uLineY.geometry.attributes.position.needsUpdate = true;

    points[0] = x;
    points[1] = y;
    points[2] = 0;
    points[3] = x;
    points[4] = y;
    points[5] = z;
    this.uLineZ.geometry.setPositions( points );
    this.uLineZ.geometry.setColors( colors );
    this.uLineZ.computeLineDistances();
    this.uLineZ.geometry.attributes.position.needsUpdate = true;


    // Set the new position of the end point for uAlphaLine
    let xAlpha = x * this.alpha;
    let yAlpha = y * this.alpha;
    let zAlpha = z * this.alpha;
    points[3] = xAlpha;
    points[4] = yAlpha;
    points[5] = zAlpha;

    // Set line start depending on alpha
    if (this.alpha >= 1) {
      points[0] = x;
      points[1] = y;
      points[2] = z;
    } else if (this.alpha <= 0) {
      points[0] = 0;
      points[1] = 0;
      points[2] = 0;
    } else {
      points[0] = xAlpha;
      points[1] = yAlpha;
      points[2] = zAlpha;
    }
    // this.uAlphaLine.geometry.attributes.position.setXYZ(1, x, y, z);
    this.uAlphaLine.geometry = new LineGeometry();
    this.uAlphaLine.geometry.setPositions( points );
    this.uAlphaLine.geometry.setColors( colors );
    this.uAlphaLine.geometry.attributes.position.needsUpdate = true;
    this.uAlphaSphere.position.set(xAlpha, yAlpha, zAlpha);

    points[0] = 0;
    points[1] = yAlpha;
    points[2] = 0;
    points[3] = xAlpha;
    points[4] = yAlpha;
    points[5] = 0;
    this.uAlphaLineX.geometry.setPositions( points );
    this.uAlphaLineX.geometry.setColors( colors );
    this.uAlphaLineX.computeLineDistances();
    this.uAlphaLineX.geometry.attributes.position.needsUpdate = true;

    points[0] = xAlpha;
    points[1] = 0;
    points[2] = 0;
    points[3] = xAlpha;
    points[4] = yAlpha;
    points[5] = 0;
    this.uAlphaLineY.geometry.setPositions( points );
    this.uAlphaLineY.geometry.setColors( colors );
    this.uAlphaLineY.computeLineDistances();
    this.uAlphaLineY.geometry.attributes.position.needsUpdate = true;

    points[0] = xAlpha;
    points[1] = yAlpha;
    points[2] = 0;
    points[3] = xAlpha;
    points[4] = yAlpha;
    points[5] = zAlpha;
    this.uAlphaLineZ.geometry.setPositions( points );
    this.uAlphaLineZ.geometry.setColors( colors );
    this.uAlphaLineZ.computeLineDistances();
    this.uAlphaLineZ.geometry.attributes.position.needsUpdate = true;
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
      vertexColors: false,
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
      vertexColors: false,
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
      vertexColors: false,
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
      vertexColors: false,
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
      vertexColors: false,
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
      color: "#c99400",
      wireframe: false,
      emissive: "#c99400",
      flatShading: false,
      emissiveIntensity: 0.5,
      roughness: 0,
      metalness: 0,
    });
    this.uLineMaterial = new LineMaterial( {
      color: 0xc99400,
      linewidth: 3, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );
    this.uLineAxisMaterial = new LineMaterial( {
      color: 0xc99400,
      linewidth: 2, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      //resolution:  // to be set by renderer, eventually
      dashed: true,
      dashSize: 0.15,
      gapSize: 0.15,
      dashScale: 1,
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
      linewidth: 3, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,
    } );
    this.uAlphaLineAxisMaterial = new LineMaterial( {
      color: 0x800080,
      linewidth: 2, // in world units with size attenuation, pixels otherwise
      vertexColors: true,
      //resolution:  // to be set by renderer, eventually
      dashed: true,
      dashSize: 0.15,
      gapSize: 0.15,
      dashScale: 1,
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
