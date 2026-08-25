/**
 * Kalupa – Laboratorio Digital
 * ─────────────────────────────────────────────────────────────────────────────
 * HERO CANVAS ENGINE v23 — Ultra-Interactive Kinetic Force Field & Shockwaves
 * ─────────────────────────────────────────────────────────────────────────────
 * - Interactive Mouse Physics: Kinetic Force Field + Velocity Trajectory Impulse
 * - Color Ignition: Particles disturbed by cursor temporarily ignite to #F8DF77 Yellow
 * - 3D Shockwave Pulse: Clicking or tapping anywhere triggers an explosive ring wave
 * - Brand Palette: Kalupa Yellow (#F8DF77), Brand Purple (#5E17EB) & Vivid Purple
 * - Full HD 100vh Screen Coverage & 60 FPS Ultra-Clean Render
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    /* ── Interaction State ── */
    let mxRaw = 0, myRaw = 0;
    let mxSmooth = 0, mySmooth = 0;
    let prevMX = 0, prevMY = 0;
    let mouseVel = 0;
    let isMouseDown = false;

    // Shockwave Ripples Array
    const shockwaves = [];

    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('hero-canvas');
        const hero   = document.querySelector('.hero');
        if (!canvas || !hero) return;

        function updateRawMouse(clientX, clientY) {
            const r = canvas.getBoundingClientRect();
            mxRaw = ((clientX - r.left) / r.width)  * 2 - 1;
            myRaw = -(((clientY - r.top)  / r.height) * 2 - 1);
        }

        function triggerShockwave(x, y) {
            shockwaves.push({
                x, y,
                radius: 0.1,
                maxRadius: 16.0,
                speed: 0.35,
                force: 0.28,
                life: 1.0
            });
            if (shockwaves.length > 6) shockwaves.shift();
        }

        window.addEventListener('mousemove', e => updateRawMouse(e.clientX, e.clientY), { passive: true });

        window.addEventListener('mousedown', e => {
            isMouseDown = true;
            triggerShockwave(mxSmooth, mySmooth);
        });
        window.addEventListener('mouseup', () => { isMouseDown = false; });

        // Touch interaction for Mobile / iPhone
        window.addEventListener('touchstart', e => {
            if (e.touches.length > 0) {
                updateRawMouse(e.touches[0].clientX, e.touches[0].clientY);
                triggerShockwave(mxRaw, myRaw);
            }
        }, { passive: true });

        window.addEventListener('touchmove', e => {
            if (e.touches.length > 0) updateRawMouse(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        if (typeof THREE === 'undefined') { init2DFallback(canvas, hero); return; }
        initKineticInteractiveScene(canvas, hero);
    });

    /* ═══════════════════════════════════════════════════════════════════════
       BRAND BOKEH SPRITE TEXTURE (#5E17EB Purple & #F8DF77 Yellow Accents)
       ═══════════════════════════════════════════════════════════════════════ */
    function createBrandBokehTexture(size) {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');

        const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        g.addColorStop(0.0,  'rgba(255, 255, 255, 1.0)');
        g.addColorStop(0.22, 'rgba(248, 223, 119, 0.95)');  // #F8DF77 Yellow Glow
        g.addColorStop(0.55, 'rgba(158, 23, 235, 0.75)');   // #9E17EB Vivid Purple
        g.addColorStop(0.82, 'rgba(94, 23, 235, 0.35)');    // #5E17EB Brand Purple
        g.addColorStop(1.0,  'rgba(0, 0, 0, 0.0)');

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);

        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       THREE.JS MAIN SCENE (ULTRA-INTERACTIVE KINETIC ENGINE)
       ═══════════════════════════════════════════════════════════════════════ */
    function initKineticInteractiveScene(canvasEl, container) {
        let W = container.clientWidth  || window.innerWidth;
        let H = container.clientHeight || window.innerHeight;

        let isMobile = W < 768 || (W / H < 1.0);

        const renderer = new THREE.WebGLRenderer({
            canvas: canvasEl,
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
            precision: 'highp'
        });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
        renderer.toneMapping         = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = isMobile ? 1.35 : 1.25;

        if (renderer.outputColorSpace !== undefined) {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        } else {
            renderer.outputEncoding = THREE.sRGBEncoding;
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0018);
        scene.fog = new THREE.FogExp2(0x0a0018, isMobile ? 0.012 : 0.015);

        const baseFOV = isMobile ? 65 : 48;
        const camera  = new THREE.PerspectiveCamera(baseFOV, W / H, 0.1, 900);
        camera.position.set(0, 0, 18);

        /* ══ LIGHTING SETUP ══ */
        scene.add(new THREE.AmbientLight(0x220538, isMobile ? 4.0 : 3.0));

        const centerLight = new THREE.PointLight(0x5e17eb, isMobile ? 50 : 40, 100);
        centerLight.position.set(0, 0, -25);
        scene.add(centerLight);

        const yellowAccentLight = new THREE.PointLight(0xf8df77, 30, 70);
        yellowAccentLight.position.set(0, 5, -12);
        scene.add(yellowAccentLight);

        const sideL = new THREE.PointLight(0x5e17eb, 25, 80);
        sideL.position.set(-15, 6, -8);
        scene.add(sideL);

        const sideR = new THREE.PointLight(0x9e17eb, 25, 80);
        sideR.position.set(15, -6, -8);
        scene.add(sideR);

        /* ══ SWARM SYSTEM: 35,000 KINETIC INTERACTIVE PARTICLES ═════════════ */
        const PARTICLE_COUNT = isMobile ? 25000 : 35000;
        const particleTex    = createBrandBokehTexture(128);

        const DEPTH_NEAR = -3.5;
        const DEPTH_FAR  = -95.0;

        function getSpreadRadius(z) {
            const aspectMult = isMobile ? Math.max(1.15, (H / W) * 0.65) : 1.0;
            return (2.5 + (1.0 - (z - DEPTH_NEAR) / (DEPTH_FAR - DEPTH_NEAR)) * 18.5) * aspectMult;
        }

        const particleVertShader = `
            attribute float aSize;
            attribute float aAlpha;
            attribute vec3  aColor;

            varying float vAlpha;
            varying vec3  vColor;
            varying float vDepth;

            uniform float uPixelRatio;
            uniform float uIsMobile;

            void main() {
                vAlpha = aAlpha;
                vColor = aColor;

                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vDepth = -mvPosition.z;

                float mobileBoost = uIsMobile > 0.5 ? 1.65 : 1.0;
                float bokehScale  = aSize * (205.0 / -mvPosition.z);
                gl_PointSize      = clamp(bokehScale * uPixelRatio * mobileBoost, 1.2, 310.0);

                gl_Position = projectionMatrix * mvPosition;
            }
        `;

        const particleFragShader = `
            uniform sampler2D uTexture;
            varying float vAlpha;
            varying vec3  vColor;
            varying float vDepth;

            void main() {
                vec4 tex = texture2D(uTexture, gl_PointCoord);
                if (tex.a < 0.01) discard;

                float bokehBlur = smoothstep(3.0, 22.0, vDepth);
                gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha * (0.55 + 0.45 * bokehBlur));
            }
        `;

        const particleGeo = new THREE.BufferGeometry();
        const pPositions  = new Float32Array(PARTICLE_COUNT * 3);
        const pSizes      = new Float32Array(PARTICLE_COUNT);
        const pAlphas     = new Float32Array(PARTICLE_COUNT);
        const pColors     = new Float32Array(PARTICLE_COUNT * 3);

        const particleVelocities = [];

        const colorPurple = new THREE.Color(0x5E17EB);
        const colorVivid  = new THREE.Color(0x9E17EB);
        const colorYellow = new THREE.Color(0xF8DF77);
        const colorRoyal  = new THREE.Color(0x7C3AED);
        const colorWhite  = new THREE.Color(0xFFFFFF);

        const colorPalette = [colorPurple, colorVivid, colorYellow, colorRoyal, colorWhite];

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const z = DEPTH_FAR + Math.random() * (DEPTH_NEAR - DEPTH_FAR);
            const spreadR = getSpreadRadius(z);
            const angle = Math.random() * Math.PI * 2;
            const dist  = Math.sqrt(Math.random()) * spreadR;

            pPositions[i * 3]     = Math.cos(angle) * dist;
            pPositions[i * 3 + 1] = Math.sin(angle) * dist * (isMobile ? 0.95 : 0.75);
            pPositions[i * 3 + 2] = z;

            const sizeRoll = Math.random();
            let baseSize;
            if (sizeRoll < 0.045) {
                baseSize = 2.6 + Math.random() * 3.0; // Foreground Bokeh Orbs
            } else if (sizeRoll < 0.22) {
                baseSize = 1.0 + Math.random() * 1.3;
            } else if (sizeRoll < 0.60) {
                baseSize = 0.45 + Math.random() * 0.50;
            } else {
                baseSize = 0.12 + Math.random() * 0.32; // Micro stardust
            }

            pSizes[i]  = baseSize;
            pAlphas[i] = (isMobile ? 0.30 : 0.22) + Math.random() * 0.65;

            const c = colorPalette[Math.floor(Math.random() * colorPalette.length)];
            pColors[i * 3]     = c.r;
            pColors[i * 3 + 1] = c.g;
            pColors[i * 3 + 2] = c.b;

            const outwardSpeed = 0.035 + Math.random() * 0.055;
            const outwardAngle = angle + (Math.random() - 0.5) * 0.2;

            particleVelocities.push({
                speedZ: outwardSpeed,
                outwardVx: Math.cos(outwardAngle) * (0.004 + Math.random() * 0.008),
                outwardVy: Math.sin(outwardAngle) * (0.004 + Math.random() * 0.008),
                pulsePhase: Math.random() * Math.PI * 2,
                baseSize,
                baseColor: c.clone(),
                vx: 0, vy: 0, vz: 0,
                heat: 0.0 // Interaction heat ignition timer
            });
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
        particleGeo.setAttribute('aSize',    new THREE.BufferAttribute(pSizes, 1));
        particleGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(pAlphas, 1));
        particleGeo.setAttribute('aColor',   new THREE.BufferAttribute(pColors, 3));

        const particleShaderMat = new THREE.ShaderMaterial({
            vertexShader:   particleVertShader,
            fragmentShader: particleFragShader,
            uniforms: {
                uTexture:    { value: particleTex },
                uPixelRatio: { value: renderer.getPixelRatio() },
                uIsMobile:   { value: isMobile ? 1.0 : 0.0 }
            },
            transparent: true,
            depthWrite:  false,
            blending:    THREE.AdditiveBlending,
        });

        const particleSwarm = new THREE.Points(particleGeo, particleShaderMat);
        scene.add(particleSwarm);

        /* ── Responsive Resize Listener ── */
        window.addEventListener('resize', () => {
            W = container.clientWidth  || window.innerWidth;
            H = container.clientHeight || window.innerHeight;
            isMobile = W < 768 || (W / H < 1.0);

            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.5));
            camera.fov = isMobile ? 65 : 48;
            camera.aspect = W / H;
            camera.updateProjectionMatrix();

            particleShaderMat.uniforms.uPixelRatio.value = renderer.getPixelRatio();
            particleShaderMat.uniforms.uIsMobile.value   = isMobile ? 1.0 : 0.0;
        });

        /* ══ MAIN ANIMATION LOOP (KINETIC FORCE FIELD + SHOCKWAVE BURSTS) ══ */
        const clock = new THREE.Clock();
        const raycaster  = new THREE.Raycaster();
        const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const mouseWorld = new THREE.Vector3();
        const mouseNDC   = new THREE.Vector2();

        function animate() {
            requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            /* Smooth Interaction Interpolation */
            mxSmooth += (mxRaw - mxSmooth) * 0.075;
            mySmooth += (myRaw - mySmooth) * 0.075;

            const dvx = mxSmooth - prevMX;
            const dvy = mySmooth - prevMY;
            mouseVel += (Math.sqrt(dvx * dvx + dvy * dvy) - mouseVel) * 0.18;
            prevMX = mxSmooth; prevMY = mySmooth;

            /* Project Interaction Vector to 3D World Space */
            mouseNDC.set(mxSmooth, mySmooth);
            raycaster.setFromCamera(mouseNDC, camera);
            raycaster.ray.intersectPlane(mousePlane, mouseWorld);

            /* Camera Parallax Tilt */
            camera.position.x += (mxSmooth * (isMobile ? 2.2 : 3.5) - camera.position.x) * 0.04;
            camera.position.y += (mySmooth * (isMobile ? 1.6 : 2.4) - camera.position.y) * 0.04;
            camera.lookAt(0, 0, 0);

            /* Update 3D Shockwaves */
            for (let s = shockwaves.length - 1; s >= 0; s--) {
                const sw = shockwaves[s];
                sw.radius += sw.speed;
                sw.life -= 0.035;
                if (sw.life <= 0 || sw.radius > sw.maxRadius) {
                    shockwaves.splice(s, 1);
                }
            }

            /* Update Particles with Kinetic Force Field + Heat Ignition */
            const posArr   = particleGeo.attributes.position.array;
            const sizeArr  = particleGeo.attributes.aSize.array;
            const alphaArr = particleGeo.attributes.aAlpha.array;
            const colArr   = particleGeo.attributes.aColor.array;

            const mouseRepRad   = isMobile ? 8.5 : 7.2;
            const mouseRepRadSq = mouseRepRad * mouseRepRad;

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const i3 = i * 3;
                const p  = particleVelocities[i];

                /* 1. KINETIC MOUSE FORCE FIELD & SWIRL */
                const pdz = posArr[i3 + 2] - mouseWorld.z;
                if (Math.abs(pdz) < 7.5) {
                    const pdx = posArr[i3]     - mouseWorld.x;
                    const pdy = posArr[i3 + 1] - mouseWorld.y;
                    const pdSq = pdx * pdx + pdy * pdy + pdz * pdz;

                    if (pdSq < mouseRepRadSq && pdSq > 0.01) {
                        const pd = Math.sqrt(pdSq);
                        const forceFactor = isMouseDown ? 2.5 : 1.0;
                        const pForce = ((mouseRepRad - pd) / mouseRepRad) * 0.16 * (1 + mouseVel * 20.0) * forceFactor;

                        // Kinetic impulse in direction of mouse move + radial push + vortex swirl
                        p.vx += (pdx / pd) * pForce + dvx * 0.25;
                        p.vy += (pdy / pd) * pForce + dvy * 0.25;
                        p.vz += (pdz / pd) * pForce * 0.4;

                        // Ignite heat state (particle glows bright yellow #F8DF77)
                        p.heat = Math.min(1.0, p.heat + 0.35);
                    }
                }

                /* 2. SHOCKWAVE RIPPLE BURST INTERACTION */
                shockwaves.forEach(sw => {
                    const swdx = posArr[i3] - (sw.x * 12.0);
                    const swdy = posArr[i3 + 1] - (sw.y * 8.0);
                    const swDist = Math.sqrt(swdx * swdx + swdy * swdy);
                    const diffR = Math.abs(swDist - sw.radius);

                    if (diffR < 2.5 && swDist > 0.1) {
                        const ringForce = (1.0 - diffR / 2.5) * sw.force * sw.life;
                        p.vx += (swdx / swDist) * ringForce;
                        p.vy += (swdy / swDist) * ringForce;
                        p.heat = Math.min(1.0, p.heat + ringForce * 2.0);
                    }
                });

                /* 3. DAMPING & KINETIC DISPLACEMENT */
                p.vx *= 0.90;
                p.vy *= 0.90;
                p.vz *= 0.90;

                posArr[i3]     += p.outwardVx + p.vx;
                posArr[i3 + 1] += p.outwardVy + p.vy;
                posArr[i3 + 2] += p.speedZ    + p.vz;

                /* 4. HEAT DISSIPATION & COLOR/SIZE IGNITION TRANSITION */
                if (p.heat > 0.01) {
                    p.heat *= 0.93; // Cool down smoothly

                    // Size expands when ignited by mouse
                    sizeArr[i] = p.baseSize * (1.0 + p.heat * 1.2);

                    // Interpolate color toward Kalupa Yellow #F8DF77
                    colArr[i3]     = THREE.MathUtils.lerp(p.baseColor.r, colorYellow.r, p.heat * 0.9);
                    colArr[i3 + 1] = THREE.MathUtils.lerp(p.baseColor.g, colorYellow.g, p.heat * 0.9);
                    colArr[i3 + 2] = THREE.MathUtils.lerp(p.baseColor.b, colorYellow.b, p.heat * 0.9);
                } else {
                    p.heat = 0;
                    sizeArr[i]     = p.baseSize;
                    colArr[i3]     = p.baseColor.r;
                    colArr[i3 + 1] = p.baseColor.g;
                    colArr[i3 + 2] = p.baseColor.b;
                }

                alphaArr[i] = ((isMobile ? 0.28 : 0.20) + Math.random() * 0.15) + Math.sin(elapsedTime * 2.8 + p.pulsePhase) * 0.10 + p.heat * 0.3;

                // Infinite loop recycling
                if (posArr[i3 + 2] > camera.position.z + 2) {
                    posArr[i3 + 2] = DEPTH_FAR + Math.random() * 6;
                    const sr = getSpreadRadius(posArr[i3 + 2]);
                    const sa = Math.random() * Math.PI * 2;
                    const sd = Math.sqrt(Math.random()) * sr;
                    posArr[i3]     = Math.cos(sa) * sd;
                    posArr[i3 + 1] = Math.sin(sa) * sd * (isMobile ? 0.95 : 0.75);
                    p.vx = 0; p.vy = 0; p.vz = 0; p.heat = 0;
                }
            }

            particleGeo.attributes.position.needsUpdate = true;
            particleGeo.attributes.aSize.needsUpdate    = true;
            particleGeo.attributes.aAlpha.needsUpdate   = true;
            particleGeo.attributes.aColor.needsUpdate   = true;

            renderer.render(scene, camera);
        }

        animate();
    }

    /* ═══════════════════════════════════════════════════════════════════════
       2D CANVAS FALLBACK
       ═══════════════════════════════════════════════════════════════════════ */
    function init2DFallback(canvasEl, container) {
        const ctx = canvasEl.getContext('2d');
        let W = canvasEl.width  = container.clientWidth  || window.innerWidth;
        let H = container.clientHeight || window.innerHeight;

        window.addEventListener('resize', () => {
            W = canvasEl.width  = container.clientWidth  || window.innerWidth;
            H = container.clientHeight || window.innerHeight;
        });

        const particles2D = Array.from({ length: 400 }, () => ({
            x: Math.random() * W, y: Math.random() * H,
            r: 1.5 + Math.random() * 3.5,
            vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
            alpha: 0.3 + Math.random() * 0.7,
        }));

        function draw() {
            ctx.fillStyle = '#0a0018';
            ctx.fillRect(0, 0, W, H);

            particles2D.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
                if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(248, 223, 119, ${p.alpha})`;
                ctx.fill();
            });
            requestAnimationFrame(draw);
        }
        draw();
    }

})();
