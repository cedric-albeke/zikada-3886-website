// AAA-Quality Shader Effects for Enhanced Visual Fidelity
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

class AAAShaders {
    constructor() {
        this.shaders = {};
        this.passes = {};
        this.uniforms = {};
        this.time = 0;
    }

    init() {
        this.createShaders();
        console.log('🎨 AAA Shaders initialized');
    }

    createShaders() {
        // Enhanced Chromatic Aberration with RGB Shift
        this.shaders.chromaticAberration = {
            uniforms: {
                tDiffuse: { value: null },
                amount: { value: 0.003 },
                angle: { value: 0.0 },
                time: { value: 0.0 }
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
                uniform float angle;
                uniform float time;
                varying vec2 vUv;

                void main() {
                    vec2 offset = amount * vec2(cos(angle), sin(angle));

                    // Dynamic offset based on position and time
                    float dynamicAmount = amount * (1.0 + 0.5 * sin(time * 2.0));
                    vec2 dynamicOffset = dynamicAmount * vec2(
                        cos(angle + vUv.x * 3.14),
                        sin(angle + vUv.y * 3.14)
                    );

                    vec4 cr = texture2D(tDiffuse, vUv + dynamicOffset);
                    vec4 cga = texture2D(tDiffuse, vUv);
                    vec4 cb = texture2D(tDiffuse, vUv - dynamicOffset);

                    gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);
                }
            `
        };

        // Digital Glitch Displacement
        this.shaders.digitalGlitch = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                distortion: { value: 1.0 },
                distortion2: { value: 1.0 },
                speed: { value: 0.2 },
                rollSpeed: { value: 0.0 }
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
                uniform float time;
                uniform float distortion;
                uniform float distortion2;
                uniform float speed;
                uniform float rollSpeed;
                varying vec2 vUv;

                vec3 mod289(vec3 x) {
                    return x - floor(x * (1.0 / 289.0)) * 289.0;
                }

                vec2 mod289(vec2 x) {
                    return x - floor(x * (1.0 / 289.0)) * 289.0;
                }

                vec3 permute(vec3 x) {
                    return mod289(((x*34.0)+1.0)*x);
                }

                float snoise(vec2 v) {
                    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
                    vec2 i = floor(v + dot(v, C.yy));
                    vec2 x0 = v - i + dot(i, C.xx);
                    vec2 i1;
                    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                    vec4 x12 = x0.xyxy + C.xxzz;
                    x12.xy -= i1;
                    i = mod289(i);
                    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
                    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
                    m = m*m;
                    m = m*m;
                    vec3 x = 2.0 * fract(p * C.www) - 1.0;
                    vec3 h = abs(x) - 0.5;
                    vec3 ox = floor(x + 0.5);
                    vec3 a0 = x - ox;
                    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                    vec3 g;
                    g.x = a0.x * x0.x + h.x * x0.y;
                    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                    return 130.0 * dot(m, g);
                }

                void main() {
                    vec2 p = vUv;
                    float ty = time * speed;
                    float yt = p.y - ty;

                    // Glitch offset
                    float offset = snoise(vec2(yt * 3.0, 0.0)) * 0.2;
                    offset = pow(offset * distortion, 3.0) / distortion;
                    offset += snoise(vec2(yt * 50.0, 0.0)) * distortion2 * 0.001;

                    // RGB shift
                    vec4 cr = texture2D(tDiffuse, vec2(p.x + offset * 0.02, p.y));
                    vec4 cga = texture2D(tDiffuse, vec2(p.x, p.y));
                    vec4 cb = texture2D(tDiffuse, vec2(p.x - offset * 0.02, p.y));

                    // Mix with original
                    vec4 texel = vec4(cr.r, cga.g, cb.b, cga.a);
                    vec4 color = mix(texture2D(tDiffuse, p), texel, 0.5);

                    // Scanlines
                    float scanline = sin(p.y * 800.0) * 0.04;
                    color -= scanline;

                    // Rolling bars
                    float roll = sin((p.y + rollSpeed) * 30.0) * 0.03;
                    color += roll;

                    gl_FragColor = color;
                }
            `
        };

        // Holographic Interference Pattern
        this.shaders.holographic = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                intensity: { value: 0.5 }
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
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;

                vec3 hueShift(vec3 color, float hue) {
                    const vec3 k = vec3(0.57735, 0.57735, 0.57735);
                    float cosAngle = cos(hue);
                    return vec3(color * cosAngle + cross(k, color) * sin(hue) + k * dot(k, color) * (1.0 - cosAngle));
                }

                void main() {
                    vec2 p = vUv;
                    vec4 texel = texture2D(tDiffuse, p);

                    // Holographic interference
                    float interference = sin(p.x * 100.0 + time * 2.0) *
                                       sin(p.y * 100.0 - time * 2.0) *
                                       intensity;

                    // Color shifting
                    vec3 shifted = hueShift(texel.rgb, interference * 3.14);

                    // Iridescent effect
                    float iridescence = sin(p.x * 50.0 + p.y * 50.0 + time) * 0.1;
                    shifted += vec3(
                        sin(iridescence * 2.0),
                        sin(iridescence * 3.0),
                        sin(iridescence * 4.0)
                    ) * intensity * 0.5;

                    gl_FragColor = vec4(shifted, texel.a);
                }
            `
        };

        // Energy Field Distortion
        this.shaders.energyField = {
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0.0 },
                strength: { value: 0.5 },
                frequency: { value: 10.0 }
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
                uniform float time;
                uniform float strength;
                uniform float frequency;
                varying vec2 vUv;

                void main() {
                    vec2 p = vUv;

                    // Energy wave distortion
                    float wave1 = sin(p.x * frequency + time * 2.0) * strength * 0.01;
                    float wave2 = cos(p.y * frequency - time * 1.5) * strength * 0.01;

                    vec2 distorted = p + vec2(wave1, wave2);

                    // Sample with distortion
                    vec4 color = texture2D(tDiffuse, distorted);

                    // Energy glow
                    float glow = abs(wave1 + wave2) * 10.0;
                    color.rgb += vec3(0.0, glow * 0.5, glow) * strength;

                    // Pulse effect
                    float pulse = sin(time * 5.0) * 0.5 + 0.5;
                    color.rgb *= 1.0 + pulse * strength * 0.2;

                    gl_FragColor = color;
                }
            `
        };

        // Cyberpunk Neon Glow
        this.shaders.neonGlow = {
            uniforms: {
                tDiffuse: { value: null },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                intensity: { value: 1.0 }
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
                uniform vec2 resolution;
                uniform float intensity;
                varying vec2 vUv;

                void main() {
                    vec4 color = texture2D(tDiffuse, vUv);

                    // Extract bright areas
                    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));

                    // Neon glow for bright areas
                    if (brightness > 0.5) {
                        vec3 neon = color.rgb;

                        // Enhance specific colors
                        if (neon.r > 0.5) neon.r = pow(neon.r, 0.5) * 1.5;
                        if (neon.g > 0.5) neon.g = pow(neon.g, 0.5) * 1.5;
                        if (neon.b > 0.5) neon.b = pow(neon.b, 0.5) * 1.5;

                        // Add bloom
                        float bloom = pow(brightness, 2.0) * intensity;
                        neon += bloom * 0.5;

                        color.rgb = mix(color.rgb, neon, intensity);
                    }

                    // Edge detection for outline
                    vec2 texelSize = 1.0 / resolution;
                    vec4 edge = abs(texture2D(tDiffuse, vUv + vec2(texelSize.x, 0.0)) - color) +
                               abs(texture2D(tDiffuse, vUv + vec2(-texelSize.x, 0.0)) - color) +
                               abs(texture2D(tDiffuse, vUv + vec2(0.0, texelSize.y)) - color) +
                               abs(texture2D(tDiffuse, vUv + vec2(0.0, -texelSize.y)) - color);

                    // Add edge glow
                    color.rgb += edge.rgb * intensity * 0.5;

                    gl_FragColor = color;
                }
            `
        };
    }

    createPasses(composer) {
        // Create shader passes
        this.passes.chromaticAberration = new ShaderPass(this.shaders.chromaticAberration);
        this.passes.digitalGlitch = new ShaderPass(this.shaders.digitalGlitch);
        this.passes.holographic = new ShaderPass(this.shaders.holographic);
        this.passes.energyField = new ShaderPass(this.shaders.energyField);
        this.passes.neonGlow = new ShaderPass(this.shaders.neonGlow);

        // Initially disable some for performance
        this.passes.digitalGlitch.enabled = false;
        this.passes.holographic.enabled = false;

        // Add to composer
        composer.addPass(this.passes.chromaticAberration);
        composer.addPass(this.passes.energyField);
        composer.addPass(this.passes.neonGlow);

        return this.passes;
    }

    update(deltaTime) {
        this.time += deltaTime;

        // Update time-based uniforms
        if (this.passes.chromaticAberration) {
            this.passes.chromaticAberration.uniforms.time.value = this.time;
            this.passes.chromaticAberration.uniforms.angle.value = Math.sin(this.time * 0.5) * Math.PI;
        }

        if (this.passes.digitalGlitch && this.passes.digitalGlitch.enabled) {
            this.passes.digitalGlitch.uniforms.time.value = this.time;
            this.passes.digitalGlitch.uniforms.rollSpeed.value = Math.sin(this.time * 0.1) * 0.1;
        }

        if (this.passes.holographic && this.passes.holographic.enabled) {
            this.passes.holographic.uniforms.time.value = this.time;
        }

        if (this.passes.energyField) {
            this.passes.energyField.uniforms.time.value = this.time;
            this.passes.energyField.uniforms.strength.value = 0.5 + Math.sin(this.time * 0.5) * 0.3;
        }
    }

    setQuality(quality) {
        switch (quality) {
            case 'low':
                this.passes.digitalGlitch.enabled = false;
                this.passes.holographic.enabled = false;
                this.passes.neonGlow.uniforms.intensity.value = 0.5;
                break;
            case 'medium':
                this.passes.digitalGlitch.enabled = false;
                this.passes.holographic.enabled = true;
                this.passes.neonGlow.uniforms.intensity.value = 0.75;
                break;
            case 'high':
                this.passes.digitalGlitch.enabled = true;
                this.passes.holographic.enabled = true;
                this.passes.neonGlow.uniforms.intensity.value = 1.0;
                break;
        }
    }

    triggerGlitch(duration = 1000) {
        this.passes.digitalGlitch.enabled = true;
        this.passes.digitalGlitch.uniforms.distortion.value = 5.0;
        this.passes.digitalGlitch.uniforms.distortion2.value = 5.0;

        setTimeout(() => {
            this.passes.digitalGlitch.enabled = false;
        }, duration);
    }

    destroy() {
        // Clean up shader passes
        Object.values(this.passes).forEach(pass => {
            if (pass.dispose) pass.dispose();
        });
    }
}

export default new AAAShaders();