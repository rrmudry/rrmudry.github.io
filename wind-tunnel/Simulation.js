import * as THREE from 'three';

export class WindSimulation {
    constructor(scene, tunnelSize) {
        this.scene = scene;
        this.tunnelSize = tunnelSize;
        
        this.particleCount = 5000;
        this.trailLength = 10; // Number of segments in trail
        this.windSpeed = 15;
        this.model = null;
        this.modelBBox = new THREE.Box3();
        
        this.mode = 'particles'; // 'particles' or 'streamlines'
        
        this.initParticles();
    }

    initParticles() {
        if (this.points) this.scene.remove(this.points);
        if (this.lines) this.scene.remove(this.lines);

        // Particle Positions
        const posData = new Float32Array(this.particleCount * 3);
        const trailData = new Float32Array(this.particleCount * this.trailLength * 3);
        
        for (let i = 0; i < this.particleCount; i++) {
            this.resetParticle(i, posData);
            // Initialize trail at the same spot
            for (let j = 0; j < this.trailLength; j++) {
                trailData[(i * this.trailLength + j) * 3] = posData[i * 3];
                trailData[(i * this.trailLength + j) * 3 + 1] = posData[i * 3 + 1];
                trailData[(i * this.trailLength + j) * 3 + 2] = posData[i * 3 + 2];
            }
        }

        // Points Representation
        const pointGeom = new THREE.BufferGeometry();
        pointGeom.setAttribute('position', new THREE.BufferAttribute(posData, 3));
        const pointMat = new THREE.PointsMaterial({
            color: 0x00f2ff,
            size: 0.08,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.points = new THREE.Points(pointGeom, pointMat);

        // Lines Representation (Streamlines)
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.BufferAttribute(trailData, 3));
        
        // Indices for lines (connecting trail points)
        const indices = [];
        for (let i = 0; i < this.particleCount; i++) {
            for (let j = 0; j < this.trailLength - 1; j++) {
                indices.push(i * this.trailLength + j, i * this.trailLength + j + 1);
            }
        }
        lineGeom.setIndex(indices);

        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00f2ff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        this.lines = new THREE.LineSegments(lineGeom, lineMat);

        this.scene.add(this.points);
        this.scene.add(this.lines);
        
        this.posData = posData;
        this.trailData = trailData;
        
        this.updateVisibility();
    }

    resetParticle(i, positions) {
        positions[i * 3] = (Math.random() - 0.5) * this.tunnelSize.width;
        positions[i * 3 + 1] = (Math.random() - 0.5) * this.tunnelSize.height;
        positions[i * 3 + 2] = -this.tunnelSize.length / 2;
    }

    setModel(model) {
        this.model = model;
        this.modelBBox.setFromObject(model);
        this.modelBBox.expandByScalar(0.5);
    }

    update(deltaTime) {
        const positions = this.posData;
        const trails = this.trailData;
        
        for (let i = 0; i < this.particleCount; i++) {
            let x = positions[i * 3];
            let y = positions[i * 3 + 1];
            let z = positions[i * 3 + 2];
            
            let vx = 0;
            let vy = 0;
            let vz = this.windSpeed;

            // Simple Flow Field around model
            if (this.model) {
                const dx = x - 0; // Assuming model at center
                const dy = y - 0;
                const dz = z - 0;
                const distSq = dx*dx + dy*dy + dz*dz;
                
                // If close to model, divert
                if (distSq < 16) { // 4 units radius
                    const dist = Math.sqrt(distSq);
                    const force = (1.0 - dist/4.0) * 15.0;
                    vx += (dx / dist) * force;
                    vy += (dy / dist) * force;
                    vz *= (dist / 4.0); // Slow down Z as it hits
                }
            }

            // Update position
            positions[i * 3] += vx * deltaTime;
            positions[i * 3 + 1] += vy * deltaTime;
            positions[i * 3 + 2] += vz * deltaTime;

            // Update trails (shift older positions)
            for (let j = this.trailLength - 1; j > 0; j--) {
                const idxCurr = (i * this.trailLength + j) * 3;
                const idxPrev = (i * this.trailLength + j - 1) * 3;
                trails[idxCurr] = trails[idxPrev];
                trails[idxCurr + 1] = trails[idxPrev + 1];
                trails[idxCurr + 2] = trails[idxPrev + 2];
            }
            // Set first trail point to current position
            trails[i * this.trailLength * 3] = positions[i * 3];
            trails[i * this.trailLength * 3 + 1] = positions[i * 3 + 1];
            trails[i * this.trailLength * 3 + 2] = positions[i * 3 + 2];

            // Reset
            if (positions[i * 3 + 2] > this.tunnelSize.length / 2) {
                this.resetParticle(i, positions);
                // Reset trail too
                for (let j = 0; j < this.trailLength; j++) {
                    trails[(i * this.trailLength + j) * 3] = positions[i * 3];
                    trails[(i * this.trailLength + j) * 3 + 1] = positions[i * 3 + 1];
                    trails[(i * this.trailLength + j) * 3 + 2] = positions[i * 3 + 2];
                }
            }
        }
        
        this.points.geometry.attributes.position.needsUpdate = true;
        this.lines.geometry.attributes.position.needsUpdate = true;
    }

    setVisualMode(mode) {
        this.mode = mode;
        this.updateVisibility();
    }

    updateVisibility() {
        if (this.mode === 'particles') {
            this.points.visible = true;
            this.lines.visible = false;
        } else {
            this.points.visible = false;
            this.lines.visible = true;
        }
    }

    setParticleCount(count) {
        this.particleCount = Math.min(count, 20000); // Cap for performance
        this.initParticles();
    }

    setWindSpeed(speed) {
        this.windSpeed = speed;
    }
}
