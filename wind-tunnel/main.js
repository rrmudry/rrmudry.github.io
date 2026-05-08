import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { WindSimulation } from './Simulation.js';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.tunnelSize = { width: 10, height: 10, length: 30 };
        
        this.initScene();
        this.initTunnel();
        this.initSimulation();
        this.initUI();
        this.animate();
        
        window.addEventListener('resize', () => this.onResize());
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x050505);
        this.scene.fog = new THREE.Fog(0x050505, 10, 50);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(15, 10, 20);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0x00f2ff, 1);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        const secondaryLight = new THREE.PointLight(0xffffff, 0.5);
        secondaryLight.position.set(-10, 5, -10);
        this.scene.add(secondaryLight);
    }

    initTunnel() {
        const tunnelGeom = new THREE.BoxGeometry(
            this.tunnelSize.width, 
            this.tunnelSize.height, 
            this.tunnelSize.length
        );
        const tunnelMat = new THREE.MeshPhongMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide,
            wireframe: false
        });
        const tunnel = new THREE.Mesh(tunnelGeom, tunnelMat);
        this.scene.add(tunnel);

        // Add wireframe outline
        const edges = new THREE.EdgesGeometry(tunnelGeom);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.2 }));
        this.scene.add(line);

        // Grid floor
        const grid = new THREE.GridHelper(30, 30, 0x00f2ff, 0x222222);
        grid.position.y = -this.tunnelSize.height / 2;
        this.scene.add(grid);
    }

    initSimulation() {
        this.simulation = new WindSimulation(this.scene, this.tunnelSize);
    }

    initUI() {
        const windSpeedInput = document.getElementById('wind-speed');
        windSpeedInput.addEventListener('input', (e) => {
            this.simulation.setWindSpeed(parseFloat(e.target.value) / 5);
        });

        const densityInput = document.getElementById('particle-density');
        densityInput.addEventListener('change', (e) => {
            const count = parseInt(e.target.value);
            this.simulation.setParticleCount(count);
            document.getElementById('particle-count').innerText = count.toLocaleString();
        });

        document.getElementById('reset-view').addEventListener('click', () => {
            this.camera.position.set(15, 10, 20);
            this.controls.target.set(0, 0, 0);
        });

        const visualMode = document.getElementById('visual-mode');
        visualMode.addEventListener('change', (e) => {
            this.simulation.setVisualMode(e.target.value);
        });

        // File Loading
        const fileInput = document.getElementById('file-input');
        const uploadBtn = document.getElementById('upload-btn');
        const dropZone = document.getElementById('drop-zone');

        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFile(e.target.files[0]));

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#00f2ff';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = 'rgba(0, 242, 255, 0.2)';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFile(e.dataTransfer.files[0]);
        });

        // Add Default Model
        this.addDefaultModel();
    }

    addDefaultModel() {
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8,
            roughness: 0.2
        });
        const sphere = new THREE.Mesh(geometry, material);
        this.scene.add(sphere);
        this.currentModel = sphere;
        this.simulation.setModel(sphere);
    }

    handleFile(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const contents = e.target.result;
            const loader = new GLTFLoader();
            loader.parse(contents, '', (gltf) => {
                if (this.currentModel) {
                    this.scene.remove(this.currentModel);
                }
                
                this.currentModel = gltf.scene;
                
                // Scale and center model
                const box = new THREE.Box3().setFromObject(this.currentModel);
                const size = box.getSize(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 5 / maxDim;
                this.currentModel.scale.set(scale, scale, scale);
                
                // Recenter
                const newBox = new THREE.Box3().setFromObject(this.currentModel);
                const center = newBox.getCenter(new THREE.Vector3());
                this.currentModel.position.sub(center);
                
                // Material override for visibility
                this.currentModel.traverse(child => {
                    if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0x888888,
                            metalness: 0.8,
                            roughness: 0.2
                        });
                    }
                });

                this.scene.add(this.currentModel);
                this.simulation.setModel(this.currentModel);
                
                console.log('Model loaded successfully');
            });
        };
        reader.readAsArrayBuffer(file);
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = 0.016; // Approx 60fps
        this.simulation.update(deltaTime);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        
        // Mock stats update
        if (this.currentModel) {
            document.getElementById('drag-val').innerText = (Math.random() * 0.1 + 0.5).toFixed(3);
            document.getElementById('lift-val').innerText = (Math.random() * 0.05 + 0.1).toFixed(3);
        }
    }
}

new App();
