import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { createNoise3D } from 'simplex-noise';
import gsap from 'gsap';

class ChaosEngine {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.composer = null;
        this.clock = new THREE.Clock();
        this.noise3D = createNoise3D();
        this.meshes = [];
        this.particles = null;
        this.glitchPass = null;
        this.chromaticAberrationPass = null;
        this.animationPhase = 0;
        this.isInitialized = false;

        // Performance optimizations
        this.particleCount = 2000;
        this.frameCounter = 0;
        this.updateFrequency = 2; // Update particles every N frames
        this.performanceMode = 'high';
        this.originalPositions = null;

        // Listen for performance adjustments
        window.addEventListener('adjustParticles', (e) => this.adjustParticleCount(e.detail.count));
        window.addEventListener('adjustPostProcessing', (e) => this.adjustPostProcessing(e.detail.quality));
    }

    init() {
        if (this.isInitialized) return;

        this.setupRenderer();
        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.createGeometry();
        this.createParticles();
        this.setupPostProcessing();
        this.setupAnimations();
        this.animate();

        this.isInitialized = true;
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        // Insert canvas behind pre-loader content
        const canvas = this.renderer.domElement;
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.zIndex = '0';
        canvas.id = 'chaos-canvas';

        const preLoader = document.querySelector('.pre-loader');
        if (preLoader) {
            preLoader.style.position = 'relative';
            preLoader.style.zIndex = '1';
            document.body.insertBefore(canvas, preLoader);
        }
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000000, 0.001);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 30;
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x0a0a0a);
        this.scene.add(ambientLight);

        // Animated point lights
        this.lights = [];
        const colors = [0xff0080, 0x00ff80, 0x80ff00, 0x8000ff];

        colors.forEach((color, i) => {
            const light = new THREE.PointLight(color, 2, 50);
            light.position.set(
                Math.sin(i * Math.PI / 2) * 20,
                Math.cos(i * Math.PI / 2) * 20,
                10
            );
            this.scene.add(light);
            this.lights.push(light);
        });
    }

    createGeometry() {
        // Create multiple geometric shapes
        const geometries = [
            new THREE.IcosahedronGeometry(8, 1),
            new THREE.TorusKnotGeometry(6, 2, 100, 16),
            new THREE.OctahedronGeometry(7, 0),
            new THREE.TetrahedronGeometry(8, 2)
        ];

        const material = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            wireframe: true,
            emissive: 0x001111,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.3
        });

        geometries.forEach((geo, i) => {
            const mesh = new THREE.Mesh(geo, material.clone());
            mesh.position.set(
                (i - 1.5) * 15,
                Math.random() * 10 - 5,
                Math.random() * 10 - 5
            );
            mesh.userData = {
                originalPosition: mesh.position.clone(),
                rotationSpeed: Math.random() * 0.02 + 0.01,
                floatSpeed: Math.random() * 0.5 + 0.5,
                floatAmplitude: Math.random() * 2 + 1
            };
            this.scene.add(mesh);
            this.meshes.push(mesh);
        });
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        // Store original positions for efficient updates
        this.originalPositions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount * 3; i += 3) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;

            positions[i] = x;
            positions[i + 1] = y;
            positions[i + 2] = z;

            // Store original positions
            this.originalPositions[i] = x;
            this.originalPositions[i + 1] = y;
            this.originalPositions[i + 2] = z;
            positions[i + 1] = (Math.random() - 0.5) * 100;
            positions[i + 2] = (Math.random() - 0.5) * 100;

            // Techno colors - cyan, magenta, yellow
            const colorChoice = Math.random();
            if (colorChoice < 0.33) {
                colors[i] = 0; colors[i + 1] = 1; colors[i + 2] = 1;
            } else if (colorChoice < 0.66) {
                colors[i] = 1; colors[i + 1] = 0; colors[i + 2] = 1;
            } else {
                colors[i] = 1; colors[i + 1] = 1; colors[i + 2] = 0;
            }
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);

        // Render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom pass
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.5, // strength
            0.4, // radius
            0.85  // threshold
        );
        this.composer.addPass(bloomPass);

        // Glitch pass
        this.glitchPass = new GlitchPass();
        this.glitchPass.enabled = false; // Will be triggered periodically
        this.composer.addPass(this.glitchPass);

        // Film grain pass
        const filmPass = new FilmPass(
            0.35,   // noise intensity
            0.025,  // scanline intensity
            648,    // scanline count
            false   // grayscale
        );
        this.composer.addPass(filmPass);

        // Chromatic Aberration shader
        this.chromaticAberrationPass = new ShaderPass({
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: 0.002 }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float amount;
                varying vec2 vUv;

                void main() {
                    vec2 offset = amount * vec2(1.0, 0.0);
                    vec4 cr = texture2D(tDiffuse, vUv + offset);
                    vec4 cga = texture2D(tDiffuse, vUv);
                    vec4 cb = texture2D(tDiffuse, vUv - offset);
                    gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
                }
            `
        });
        this.composer.addPass(this.chromaticAberrationPass);
    }

    setupAnimations() {
        // Phase 1: Slow build-up (0-10 seconds)
        gsap.timeline({ repeat: -1 })
            .to(this, {
                animationPhase: 1,
                duration: 10,
                ease: "power2.inOut",
                onUpdate: () => this.updatePhase()
            })
            // Phase 2: Intensity increase (10-20 seconds)
            .to(this, {
                animationPhase: 2,
                duration: 10,
                ease: "power3.in",
                onUpdate: () => this.updatePhase()
            })
            // Phase 3: Chaos (20-30 seconds)
            .to(this, {
                animationPhase: 3,
                duration: 10,
                ease: "none",
                onUpdate: () => this.updatePhase()
            })
            // Phase 4: Cool down (30-40 seconds)
            .to(this, {
                animationPhase: 0,
                duration: 10,
                ease: "power2.out",
                onUpdate: () => this.updatePhase()
            });

        // Periodic glitch triggers
        gsap.timeline({ repeat: -1 })
            .to(this.glitchPass, {
                duration: 0.1,
                enabled: true,
                delay: 3,
                onComplete: () => {
                    setTimeout(() => {
                        this.glitchPass.enabled = false;
                    }, Math.random() * 200 + 100);
                }
            })
            .to(this.glitchPass, {
                duration: 0.1,
                enabled: true,
                delay: 5,
                onComplete: () => {
                    setTimeout(() => {
                        this.glitchPass.enabled = false;
                    }, Math.random() * 300 + 100);
                }
            });

        // Chromatic aberration pulsing
        gsap.to(this.chromaticAberrationPass.uniforms.amount, {
            value: 0.01,
            duration: 2,
            yoyo: true,
            repeat: -1,
            ease: "sine.inOut"
        });
    }

    updatePhase() {
        // Update intensity based on animation phase
        const intensity = this.animationPhase / 3;

        // Update mesh materials
        this.meshes.forEach(mesh => {
            mesh.material.emissiveIntensity = 0.5 + intensity * 0.5;
            mesh.material.opacity = 0.3 + intensity * 0.4;
        });

        // Update particle opacity
        if (this.particles) {
            this.particles.material.opacity = 0.6 + intensity * 0.3;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = this.clock.getElapsedTime();
        const delta = this.clock.getDelta();

        // Animate meshes
        this.meshes.forEach((mesh, i) => {
            const userData = mesh.userData;

            // Rotation
            mesh.rotation.x += userData.rotationSpeed * (1 + this.animationPhase);
            mesh.rotation.y += userData.rotationSpeed * 0.7 * (1 + this.animationPhase);

            // Floating motion
            mesh.position.y = userData.originalPosition.y +
                Math.sin(time * userData.floatSpeed) * userData.floatAmplitude;

            // Noise-based distortion
            const noiseValue = this.noise3D(
                mesh.position.x * 0.01,
                mesh.position.y * 0.01,
                time * 0.1
            );
            mesh.position.z = userData.originalPosition.z + noiseValue * 5 * this.animationPhase;

            // Scale pulsing
            const scale = 1 + Math.sin(time * 2 + i) * 0.1 * (1 + this.animationPhase);
            mesh.scale.set(scale, scale, scale);
        });

        // Animate particles - optimized with frame skipping
        if (this.particles) {
            // Continuous rotation
            this.particles.rotation.x += 0.001;
            this.particles.rotation.y += 0.0015;
            this.particles.rotation.z += 0.0005;

            // Update particles only every N frames for performance
            this.frameCounter++;
            if (this.frameCounter % this.updateFrequency === 0) {
                // Dynamic particle wave effect
                const positions = this.particles.geometry.attributes.position.array;
                const originalPositions = this.originalPositions;

                // Optimized loop with caching
                const timeHalf = time * 0.5;
                const timeThird = time * 0.3;
                const phaseFactor = 1 + this.animationPhase;

                for (let i = 0; i < positions.length; i += 3) {
                    const origX = originalPositions[i];
                    const origY = originalPositions[i + 1];
                    const origZ = originalPositions[i + 2];

                    // Cache calculations
                    const factor1 = origY * 0.1;
                    const factor2 = origX * 0.1;

                    // Multiple wave effects for continuous motion
                    positions[i] = origX + Math.sin(timeHalf + factor1) * 2;
                    positions[i + 1] = origY + Math.cos(timeThird + factor2) * 2;
                    positions[i + 2] = origZ + Math.sin(time + factor2 + factor1) * 3 * phaseFactor;
                }
                this.particles.geometry.attributes.position.needsUpdate = true;
            }

            // Pulse particle size
            this.particles.material.size = 0.5 + Math.sin(time * 2) * 0.2;
        }

        // Animate lights
        this.lights.forEach((light, i) => {
            const angle = time * 0.5 + (i * Math.PI / 2);
            light.position.x = Math.sin(angle) * 20;
            light.position.y = Math.cos(angle) * 20;
            light.position.z = Math.sin(angle * 2) * 10;
            light.intensity = 2 + Math.sin(time * 3 + i) * 0.5 * (1 + this.animationPhase);
        });

        // Camera movement
        this.camera.position.x = Math.sin(time * 0.1) * 5;
        this.camera.position.y = Math.cos(time * 0.1) * 3;
        this.camera.lookAt(0, 0, 0);

        // Render
        this.composer.render(delta);
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
        this.composer.setSize(width, height);
    }

    // Performance adjustment methods
    adjustParticleCount(count) {
        if (!this.particles || count === this.particleCount) return;

        // Remove old particles
        this.scene.remove(this.particles);
        this.particles.geometry.dispose();
        this.particles.material.dispose();

        // Create new particles with adjusted count
        this.particleCount = count;
        this.createParticles();
        console.log(`⚡ Adjusted particle count to: ${count}`);
    }

    adjustPostProcessing(quality) {
        if (!this.composer) return;

        switch (quality) {
            case 'low':
                this.glitchPass.enabled = false;
                this.chromaticAberrationPass.uniforms.amount.value = 0.001;
                break;
            case 'medium':
                this.glitchPass.enabled = true;
                this.chromaticAberrationPass.uniforms.amount.value = 0.002;
                break;
            case 'high':
                this.glitchPass.enabled = true;
                this.chromaticAberrationPass.uniforms.amount.value = 0.005;
                break;
        }
        this.performanceMode = quality;
    }

    destroy() {
        // Remove event listeners
        window.removeEventListener('adjustParticles', this.adjustParticleCount);
        window.removeEventListener('adjustPostProcessing', this.adjustPostProcessing);

        // Clean up resources
        this.meshes.forEach(mesh => {
            mesh.geometry.dispose();
            mesh.material.dispose();
        });

        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }

        this.renderer.dispose();
        this.isInitialized = false;
    }
}

// Initialize and export
const chaosEngine = new ChaosEngine();
export default chaosEngine;