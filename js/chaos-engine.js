import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';
import { FilmPass } from 'three/examples/jsm/postprocessing/FilmPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { createNoise3D } from 'simplex-noise';
import gsap from 'gsap';

// Safe GSAP wrapper to prevent null target errors
function safeGsapTo(targets, vars) {
    const arr = Array.isArray(targets) ? targets.filter(Boolean) : (targets ? [targets] : []);
    if (!arr.length) {
        if (typeof console !== 'undefined') console.debug('[ZIKADA][GSAP] Skipped gsap.to(): no valid targets');
        return null;
    }
    return gsap.to(arr, vars);
}

function safeGsapTimeline(options) {
    return gsap.timeline(options);
}

function safeGsapSet(targets, vars) {
    const arr = Array.isArray(targets) ? targets.filter(Boolean) : (targets ? [targets] : []);
    if (!arr.length) {
        if (typeof console !== 'undefined') console.debug('[ZIKADA][GSAP] Skipped gsap.set(): no valid targets');
        return null;
    }
    return gsap.set(arr, vars);
}

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
        this.particleCount = 800; // Reduced from 2000 for better performance
        this.frameCounter = 0;
        this.updateFrequency = 2; // Update particles every N frames
        this.performanceMode = 'high';
        this.originalPositions = null;
        
        // Three.js resource lifecycle tracking
        this.resources = {
            geometries: [],
            materials: [],
            textures: [],
            meshes: [],
            lights: []
        };
        
        // Resource counters for monitoring
        this.resourceCounters = {
            created: {
                geometries: 0,
                materials: 0,
                textures: 0,
                meshes: 0,
                lights: 0
            },
            disposed: {
                geometries: 0,
                materials: 0,
                textures: 0,
                meshes: 0,
                lights: 0
            }
        };

        // Listen for performance adjustments
        window.addEventListener('adjustParticles', (e) => this.adjustParticleCount(e.detail.count));
        window.addEventListener('adjustPostProcessing', (e) => this.adjustPostProcessing(e.detail.quality));
    }
    
    // Three.js resource tracking helper methods
    trackGeometry(geometry) {
        this.resources.geometries.push(geometry);
        this.resourceCounters.created.geometries++;
        return geometry;
    }
    
    trackMaterial(material) {
        this.resources.materials.push(material);
        this.resourceCounters.created.materials++;
        return material;
    }
    
    trackTexture(texture) {
        this.resources.textures.push(texture);
        this.resourceCounters.created.textures++;
        return texture;
    }
    
    trackMesh(mesh) {
        this.resources.meshes.push(mesh);
        this.resourceCounters.created.meshes++;
        return mesh;
    }
    
    trackLight(light) {
        this.resources.lights.push(light);
        this.resourceCounters.created.lights++;
        return light;
    }
    
    // Get resource statistics
    getResourceStats() {
        return {
            active: {
                geometries: this.resources.geometries.length,
                materials: this.resources.materials.length,
                textures: this.resources.textures.length,
                meshes: this.resources.meshes.length,
                lights: this.resources.lights.length
            },
            counters: this.resourceCounters
        };
    }

    init(forceRestart = false) {
        // Allow reinitialization for emergency restart (simulates F5)
        if (this.isInitialized && !forceRestart) return;
        
        // If forcing restart, destroy first
        if (this.isInitialized && forceRestart) {
            console.log('🔄 Force restarting Chaos Engine...');
            this.destroy();
        }

        this.setupRenderer();

        // Initialize Three.js Particle Optimizer early with renderer before creating particles
        try {
            const opt = window.THREEJS_PARTICLE_OPTIMIZER;
            if (opt && typeof opt.initialize === 'function' && !opt.enabled) {
                opt.initialize(this.renderer);
            }
        } catch (_) {}

        this.setupScene();
        this.setupCamera();
        this.setupLights();
        this.createGeometry();
        this.createParticles();
        this.setupPostProcessing();
        this.setupAnimations();
        this.animate();

        // Adaptive performance based on shared FPS bus
        this.setupPerformanceAdaptive();

        this.isInitialized = true;
        
        if (forceRestart) {
            console.log('✅ Chaos Engine force restart completed');
        }
    }

    setupPerformanceAdaptive() {
        try {
            this.basePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
            this.currentPixelRatio = this.basePixelRatio;
            this._currentProfile = 'high';
            const thresholds = {
                // Enter thresholds (hysteresis): leave/add buffers to avoid oscillation
                highUp: 53,   // need >= 53 avgFPS to climb to high
                highDown: 45, // drop below -> to medium
                medUp: 46,    // need >= 46 to climb from low to medium
                medDown: 33,  // drop below -> to low
            };
            const applyProfile = (profile) => {
                switch (profile) {
                    case 'low':
                        this.updateFrequency = 4;
                        this.adjustPostProcessing('low');
                        this.setPixelRatio(1);
                        break;
                    case 'medium':
                        this.updateFrequency = 3;
                        this.adjustPostProcessing('medium');
                        this.setPixelRatio(Math.min(1.25, this.basePixelRatio));
                        break;
                    default:
                        this.updateFrequency = 2;
                        this.adjustPostProcessing('high');
                        this.setPixelRatio(this.basePixelRatio);
                        break;
                }
                this._currentProfile = profile;
            };

            // Subscribe to performance bus if available
            if (window.performanceBus && typeof window.performanceBus.subscribe === 'function') {
                this._perfUnsub = window.performanceBus.subscribe(({ avgFPS }) => {
                    const cur = this._currentProfile;
                    if (cur === 'high') {
                        if (avgFPS < thresholds.highDown) applyProfile('medium');
                        else applyProfile('high');
                    } else if (cur === 'medium') {
                        if (avgFPS < thresholds.medDown) applyProfile('low');
                        else if (avgFPS >= thresholds.highUp) applyProfile('high');
                        else applyProfile('medium');
                    } else { // low
                        if (avgFPS >= thresholds.medUp) applyProfile('medium');
                        else applyProfile('low');
                    }
                });
            }
        } catch (_) {}
    }

    setPixelRatio(value) {
        const v = Math.max(0.75, Math.min(2, Number(value) || 1));
        if (Math.abs(v - this.currentPixelRatio) < 0.05) return;
        this.currentPixelRatio = v;
        try {
            this.renderer.setPixelRatio(v);
            // Trigger a resize to update composer targets
            this.handleResize();
        } catch (_) {}
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
        this.trackLight(ambientLight);

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
            this.trackLight(light);
        });
    }

    createGeometry() {
        // Create multiple geometric shapes
        const geometries = [
            this.trackGeometry(new THREE.IcosahedronGeometry(8, 1)),
            this.trackGeometry(new THREE.TorusKnotGeometry(6, 2, 100, 16)),
            this.trackGeometry(new THREE.OctahedronGeometry(7, 0)),
            this.trackGeometry(new THREE.TetrahedronGeometry(8, 2))
        ];

        const baseMaterial = this.trackMaterial(new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            wireframe: true,
            emissive: 0x001111,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.3
        }));

        geometries.forEach((geo, i) => {
            const material = this.trackMaterial(baseMaterial.clone());
            const mesh = new THREE.Mesh(geo, material);
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
            this.trackMesh(mesh);
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
        
        // Try to optimize particle system with instancing
        if (window.THREEJS_PARTICLE_OPTIMIZER && window.THREEJS_PARTICLE_OPTIMIZER.enabled) {
            try {
                console.log('🚀 Optimizing particle system for performance...');
                const optimizedParticles = window.THREEJS_PARTICLE_OPTIMIZER.optimizeParticleSystem(
                    this.particles, 
                    this.particleCount
                );
                
                if (optimizedParticles !== this.particles) {
                    console.log('✅ Using optimized instanced particle system');
                    this.particles = optimizedParticles;
                } else {
                    console.debug('Using fallback Points particle system');
                }
            } catch (error) {
                console.error('Particle optimization failed, using fallback:', error);
            }
        }
        
        this.scene.add(this.particles);
        
        // Track resources for cleanup
        this.trackGeometry(geometry);
        this.trackMaterial(material);
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

        // Glitch pass (lazy-initialized when needed)
        this.glitchPass = null;

        // Film grain pass (lazy-initialized)
        this.filmPass = null;
        /* const filmPass = new FilmPass(
            0.35,   // noise intensity
            0.025,  // scanline intensity
            648,    // scanline count
            false   // grayscale
        );
        filmPass.enabled = false; this.composer.addPass(filmPass); this.filmPass = filmPass; */

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

        // Periodic glitch triggers (only if glitch pass is available)
        if (this.glitchPass) {
            gsap.timeline({ repeat: -1 })
                .to(this.glitchPass, {
                    duration: 0.1,
                    enabled: true,
                    delay: 3,
                    onComplete: () => {
                        setTimeout(() => {
                            if (this.glitchPass) this.glitchPass.enabled = false;
                        }, Math.random() * 200 + 100);
                    }
                })
                .to(this.glitchPass, {
                    duration: 0.1,
                    enabled: true,
                    delay: 5,
                    onComplete: () => {
                        setTimeout(() => {
                            if (this.glitchPass) this.glitchPass.enabled = false;
                        }, Math.random() * 300 + 100);
                    }
                });
        }

        // Chromatic aberration pulsing (only if pass is available)
        if (this.chromaticAberrationPass && this.chromaticAberrationPass.uniforms && this.chromaticAberrationPass.uniforms.amount) {
            gsap.to(this.chromaticAberrationPass.uniforms.amount, {
                value: 0.01,
                duration: 2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut"
            });
        }
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

        // Skip heavy work in hidden tabs (browser will throttle rAF anyway)
        if (document.hidden) return;

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
            // Check if particles are optimized instanced mesh
            const isInstancedMesh = this.particles.isInstancedMesh;
            
            if (isInstancedMesh && typeof this.particles.updateParticles === 'function') {
                // Use optimized instanced particle update
                this.particles.updateParticles(time, delta);
            } else {
                // Legacy Points particle system
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

                    if (positions && originalPositions) {
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
                }

                // Pulse particle size for Points materials
                if (this.particles.material && this.particles.material.size !== undefined) {
                    this.particles.material.size = 0.5 + Math.sin(time * 2) * 0.2;
                }
            }
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

        // Render: short-circuit composer when no active post-processing
        if (this.hasActivePostProcessing()) {
            this.composer.render(delta);
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }

    hasActivePostProcessing() {
        const glitch = !!(this.glitchPass && this.glitchPass.enabled);
        const chromaAmt = this.chromaticAberrationPass?.uniforms?.amount?.value || 0;
        const chroma = chromaAmt > 0.001;
        const film = !!(this.filmPass && this.filmPass.enabled);
        return glitch || chroma || film;
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
        // console.log(`⚡ Adjusted particle count to: ${count}`);
    }

    adjustPostProcessing(quality) {
        if (!this.composer) return;

        switch (quality) {
            case 'low':
                if (this.glitchPass) this.glitchPass.enabled = false;
                this.chromaticAberrationPass.uniforms.amount.value = 0.0005;
                if (this.filmPass) this.filmPass.enabled = false;
                break;
            case 'medium':
                if (!this.glitchPass) { this.glitchPass = new GlitchPass(); this.glitchPass.enabled = true; this.composer.addPass(this.glitchPass); }
                else this.glitchPass.enabled = true;
                this.chromaticAberrationPass.uniforms.amount.value = 0.002;
                if (this.filmPass) this.filmPass.enabled = false;
                break;
            case 'high':
                if (!this.glitchPass) { this.glitchPass = new GlitchPass(); this.glitchPass.enabled = true; this.composer.addPass(this.glitchPass); }
                else this.glitchPass.enabled = true;
                this.chromaticAberrationPass.uniforms.amount.value = 0.005;
                if (!this.filmPass) { const fp = new FilmPass(0.35, 0.025, 648, false); fp.enabled = true; this.composer.addPass(fp); this.filmPass = fp; }
                else this.filmPass.enabled = true;
                break;
        }
        
        // Adjust particle optimizer quality as well
        if (window.THREEJS_PARTICLE_OPTIMIZER) {
            window.THREEJS_PARTICLE_OPTIMIZER.setQualityLevel(quality);
        }
        
        // Adjust pixel ratio based on quality level
        if (window.WEBGL_RESOURCE_MANAGER) {
            let targetPixelRatio;
            switch (quality) {
                case 'low':
                    targetPixelRatio = 0.75;
                    break;
                case 'medium':
                    targetPixelRatio = 1.0;
                    break;
                case 'high':
                default:
                    targetPixelRatio = window.WEBGL_RESOURCE_MANAGER.basePixelRatio;
                    break;
            }
            window.WEBGL_RESOURCE_MANAGER.setPixelRatio(targetPixelRatio);
        }
        
        this.performanceMode = quality;
    }

    destroy() {
        // Remove event listeners
        window.removeEventListener('adjustParticles', this.adjustParticleCount);
        window.removeEventListener('adjustPostProcessing', this.adjustPostProcessing);

        // Dispose tracked geometries
        this.trackedGeometries.forEach(geometry => {
            if (geometry && typeof geometry.dispose === 'function') {
                geometry.dispose();
            }
        });
        this.trackedGeometries = [];
        this.geometryCount = 0;

        // Dispose tracked materials
        this.trackedMaterials.forEach(material => {
            if (material && typeof material.dispose === 'function') {
                material.dispose();
            }
        });
        this.trackedMaterials = [];
        this.materialCount = 0;

        // Dispose tracked textures
        this.trackedTextures.forEach(texture => {
            if (texture && typeof texture.dispose === 'function') {
                texture.dispose();
            }
        });
        this.trackedTextures = [];
        this.textureCount = 0;

        // Remove tracked meshes from scene
        this.trackedMeshes.forEach(mesh => {
            if (mesh && mesh.parent) {
                mesh.parent.remove(mesh);
            }
        });
        this.trackedMeshes = [];
        this.meshCount = 0;

        // Remove tracked lights from scene
        this.trackedLights.forEach(light => {
            if (light && light.parent) {
                light.parent.remove(light);
            }
        });
        this.trackedLights = [];
        this.lightCount = 0;

        // Remove all remaining children from scene
        const childrenToRemove = [...this.scene.children];
        childrenToRemove.forEach(child => {
            if (child) {
                this.scene.remove(child);
            }
        });

        // Dispose post-processing components
        if (this.composer) {
            this.composer.dispose();
            this.composer = null;
        }
        
        // Dispose main renderer
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        // Clear arrays and references
        this.meshes = [];
        this.lights = [];
        this.particles = null;
        this.originalPositions = null;
        this.scene = null;
        this.camera = null;
        
        // Cleanup particle optimizer
        if (window.THREEJS_PARTICLE_OPTIMIZER) {
            try {
                window.THREEJS_PARTICLE_OPTIMIZER.dispose();
            } catch (error) {
                console.warn('Particle optimizer cleanup failed:', error);
            }
        }
        
        // Cleanup WebGL resource manager
        if (window.WEBGL_RESOURCE_MANAGER) {
            try {
                window.WEBGL_RESOURCE_MANAGER.dispose();
            } catch (error) {
                console.warn('WebGL resource manager cleanup failed:', error);
            }
        }

        this.isInitialized = false;
        
        console.log('ChaosEngine: Cleanup completed - all resources disposed');
    }
}

// Initialize and export
const chaosEngine = new ChaosEngine();

// Expose globally so other modules (e.g. vj-receiver, control panel) can access
if (typeof window !== 'undefined') {
    window.chaosEngine = chaosEngine;
}

export default chaosEngine;
