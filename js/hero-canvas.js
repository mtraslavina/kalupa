/**
 * Kalupa – Laboratorio Digital
 * ─────────────────────────────────────────────────────────────────────────────
 * HERO CANVAS ENGINE v24 — Interactive Minimalist Dot Matrix Grid
 * ─────────────────────────────────────────────────────────────────────────────
 * - Design: Elegant, clean, uniform grid matrix of glowing purple dots (#5E17EB / #7C3AED)
 * - Mouse Physics: Gentle, organic spring displacement ("se mueven solo un poquito")
 * - Ambient Life: Subtle undulating micro-wave across the plane
 * - Performance: High-precision 60 FPS WebGL Three.js engine with crisp 2D Fallback
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function () {
    'use strict';

    /* ── Interaction Coordinates ── */
    let mxRaw = 0, myRaw = 0;
    let mxSmooth = 0, mySmooth = 0;
    let mouseActive = false;
    let mouseTimeout = null;

    document.addEventListener('DOMContentLoaded', () => {
        const canvas = document.getElementById('hero-canvas');
        const hero   = document.querySelector('.hero');
        if (!canvas || !hero) return;

        function updateRawMouse(clientX, clientY) {
            const r = canvas.getBoundingClientRect();
            mxRaw = ((clientX - r.left) / r.width)  * 2 - 1;
            myRaw = -(((clientY - r.top)  / r.height) * 2 - 1);
            mouseActive = true;

            clearTimeout(mouseTimeout);
            mouseTimeout = setTimeout(() => {
                mouseActive = false;
            }, 3000);
        }

        window.addEventListener('mousemove', e => updateRawMouse(e.clientX, e.clientY), { passive: true });

        // Touch interaction for Mobile devices
        window.addEventListener('touchstart', e => {
            if (e.touches.length > 0) updateRawMouse(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        window.addEventListener('touchmove', e => {
            if (e.touches.length > 0) updateRawMouse(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });

        if (typeof THREE === 'undefined') {
            init2DFallback(canvas, hero);
            return;
        }

        initDotMatrixScene(canvas, hero);
    });

    /* ═══════════════════════════════════════════════════════════════════════
       GLOWING PURPLE DOT SPRITE TEXTURE (#5E17EB & #9E17EB Vivid Accent)
       ═══════════════════════════════════════════════════════════════════════ */
    function createPurpleDotTexture(size) {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');

        const center = size / 2;
        const radius = size / 2;

        const g = ctx.createRadialGradient(center, center, 0, center, center, radius);
        g.addColorStop(0.0,  'rgba(245, 235, 255, 1.0)');  // Intense bright white-lavender core
        g.addColorStop(0.28, 'rgba(180, 70, 255, 1.0)');   // High-luminance vivid purple
        g.addColorStop(0.62, 'rgba(94, 23, 235, 0.95)');   // Kalupa #5E17EB Brand Purple
        g.addColorStop(0.88, 'rgba(94, 23, 235, 0.35)');   // Soft glowing outer ring
        g.addColorStop(1.0,  'rgba(0, 0, 0, 0.0)');

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);

        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }

    /* ═══════════════════════════════════════════════════════════════════════
       THREE.JS MAIN SCENE (INTERACTIVE DOT MATRIX GRID)
       ═══════════════════════════════════════════════════════════════════════ */
    function initDotMatrixScene(canvasEl, container) {
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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
        renderer.toneMapping         = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;

        if (renderer.outputColorSpace !== undefined) {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        } else {
            renderer.outputEncoding = THREE.sRGBEncoding;
        }

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); // Fondo 100% negro puro

        const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 500);
        camera.position.set(0, 0, 24);

        /* ── Grid Parameters Calculation ── */
        let gridMesh, particleGeo, particleMat;
        let particlesData = [];

        const dotTexture = createPurpleDotTexture(64);

        function buildGrid() {
            if (gridMesh) {
                scene.remove(gridMesh);
                particleGeo.dispose();
                particleMat.dispose();
            }

            // Visible world dimensions at z = 0
            const vFOV = THREE.MathUtils.degToRad(camera.fov);
            const visibleHeight = 2 * Math.tan(vFOV / 2) * camera.position.z;
            const visibleWidth  = visibleHeight * camera.aspect;

            // Spacing between dots in world units
            const spacing = isMobile ? 0.90 : 0.80;

            // Add margin around edges so during parallax / waves no edges are visible
            const margin = isMobile ? 8.0 : 12.0;
            const totalWidth  = visibleWidth  + margin * 2;
            const totalHeight = visibleHeight + margin * 2;

            const cols = Math.floor(totalWidth  / spacing);
            const rows = Math.floor(totalHeight / spacing);
            const totalParticles = cols * rows;

            const positions = new Float32Array(totalParticles * 3);
            const alphas    = new Float32Array(totalParticles);
            const sizes     = new Float32Array(totalParticles);
            const colors    = new Float32Array(totalParticles * 3);

            particlesData = [];

            const startX = -((cols - 1) * spacing) / 2;
            const startY = -((rows - 1) * spacing) / 2;

            const brandPurple = new THREE.Color(0x8B5CF6);
            const accentPurple = new THREE.Color(0x5E17EB);

            let idx = 0;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const ox = startX + c * spacing;
                    const oy = startY + r * spacing;
                    const oz = 0;

                    const i3 = idx * 3;
                    positions[i3]     = ox;
                    positions[i3 + 1] = oy;
                    positions[i3 + 2] = oz;

                    alphas[idx] = 0.95; // Pelotitas más notorias y nítidas
                    sizes[idx]  = isMobile ? 0.30 : 0.34; // Tamaño más notorio y visible

                    const col = (r + c) % 2 === 0 ? brandPurple : accentPurple;
                    colors[i3]     = col.r;
                    colors[i3 + 1] = col.g;
                    colors[i3 + 2] = col.b;

                    particlesData.push({
                        origX: ox,
                        origY: oy,
                        origZ: oz,
                        offsetX: 0,
                        offsetY: 0,
                        offsetZ: 0,
                        vx: 0,
                        vy: 0,
                        vz: 0,
                        phase: (ox * 0.3 + oy * 0.3)
                    });

                    idx++;
                }
            }

            particleGeo = new THREE.BufferGeometry();
            particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            particleGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(alphas, 1));
            particleGeo.setAttribute('aSize',    new THREE.BufferAttribute(sizes, 1));
            particleGeo.setAttribute('aColor',   new THREE.BufferAttribute(colors, 3));

            const vertexShader = `
                attribute float aSize;
                attribute float aAlpha;
                attribute vec3  aColor;

                varying float vAlpha;
                varying vec3  vColor;

                uniform float uPixelRatio;

                void main() {
                    vAlpha = aAlpha;
                    vColor = aColor;

                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = clamp(aSize * (340.0 / -mvPosition.z) * uPixelRatio, 2.5, 60.0);
                    gl_Position  = projectionMatrix * mvPosition;
                }
            `;

            const fragmentShader = `
                uniform sampler2D uTexture;
                varying float vAlpha;
                varying vec3  vColor;

                void main() {
                    vec4 tex = texture2D(uTexture, gl_PointCoord);
                    if (tex.a < 0.02) discard;
                    gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha);
                }
            `;

            particleMat = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    uTexture:    { value: dotTexture },
                    uPixelRatio: { value: renderer.getPixelRatio() }
                },
                transparent: true,
                depthWrite:  false,
                blending:    THREE.AdditiveBlending
            });

            gridMesh = new THREE.Points(particleGeo, particleMat);
            scene.add(gridMesh);
        }

        buildGrid();

        /* ── Resize Handler ── */
        window.addEventListener('resize', () => {
            W = container.clientWidth  || window.innerWidth;
            H = container.clientHeight || window.innerHeight;
            isMobile = W < 768 || (W / H < 1.0);

            renderer.setSize(W, H);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
            camera.aspect = W / H;
            camera.updateProjectionMatrix();

            buildGrid();
        });

        /* ══ MAIN ANIMATION LOOP (GENTLE SUBTLE MOUSE REACTION) ══ */
        const clock = new THREE.Clock();
        const raycaster  = new THREE.Raycaster();
        const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const mouseWorld = new THREE.Vector3();
        const mouseNDC   = new THREE.Vector2();

        function animate() {
            requestAnimationFrame(animate);

            const elapsedTime = clock.getElapsedTime();

            /* Smooth Mouse Coordinates */
            mxSmooth += (mxRaw - mxSmooth) * 0.08;
            mySmooth += (myRaw - mySmooth) * 0.08;

            /* Project Mouse to 3D Plane */
            mouseNDC.set(mxSmooth, mySmooth);
            raycaster.setFromCamera(mouseNDC, camera);
            raycaster.ray.intersectPlane(mousePlane, mouseWorld);

            /* Subtle Camera Parallax */
            camera.position.x += (mxSmooth * 0.6 - camera.position.x) * 0.04;
            camera.position.y += (mySmooth * 0.4 - camera.position.y) * 0.04;
            camera.lookAt(0, 0, 0);

            if (!particleGeo) return;

            const posArr   = particleGeo.attributes.position.array;
            const alphaArr = particleGeo.attributes.aAlpha.array;
            const len      = particlesData.length;

            // Influence radius: ~3.8 units in world space
            const influenceRadius = isMobile ? 3.2 : 3.8;
            // Maximum displacement is strictly gentle & subtle ("solo un poquito"): 0.35 units
            const maxDisplacement = isMobile ? 0.28 : 0.36;

            for (let i = 0; i < len; i++) {
                const p = particlesData[i];
                const i3 = i * 3;

                let targetOffsetX = 0;
                let targetOffsetY = 0;
                let targetOffsetZ = 0;
                let hoverIntensity = 0;

                if (mouseActive) {
                    const dx = p.origX - mouseWorld.x;
                    const dy = p.origY - mouseWorld.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < influenceRadius && dist > 0.01) {
                        // Smooth cosine falloff from center of cursor
                        const factor = Math.cos((dist / influenceRadius) * (Math.PI * 0.5));
                        const force = factor * maxDisplacement;

                        const dirX = dx / dist;
                        const dirY = dy / dist;

                        // Repel smoothly away from mouse cursor
                        targetOffsetX = dirX * force;
                        targetOffsetY = dirY * force;
                        targetOffsetZ = factor * 0.22; // Very slight Z lift
                        hoverIntensity = factor;
                    }
                }

                /* Elastic Spring Physics to return cleanly and softly to grid */
                const springStiffness = 0.12;
                const springDamping   = 0.82;

                p.vx += (targetOffsetX - p.offsetX) * springStiffness;
                p.vy += (targetOffsetY - p.offsetY) * springStiffness;
                p.vz += (targetOffsetZ - p.offsetZ) * springStiffness;

                p.vx *= springDamping;
                p.vy *= springDamping;
                p.vz *= springDamping;

                p.offsetX += p.vx;
                p.offsetY += p.vy;
                p.offsetZ += p.vz;

                /* Very subtle ambient breathing wave across the plane */
                const ambientWave = Math.sin(elapsedTime * 0.9 + p.phase) * 0.04;

                posArr[i3]     = p.origX + p.offsetX;
                posArr[i3 + 1] = p.origY + p.offsetY;
                posArr[i3 + 2] = p.origZ + p.offsetZ + ambientWave;

                // Subtle alpha breathing (0.75 base, 0.98 on gentle hover)
                alphaArr[i] = 0.75 + Math.sin(elapsedTime * 1.5 + p.phase) * 0.08 + hoverIntensity * 0.18;
            }

            particleGeo.attributes.position.needsUpdate = true;
            particleGeo.attributes.aAlpha.needsUpdate   = true;

            renderer.render(scene, camera);
        }

        animate();
    }

    /* ═══════════════════════════════════════════════════════════════════════
       2D CANVAS FALLBACK (IDENTICAL PURPLE DOT MATRIX)
       ═══════════════════════════════════════════════════════════════════════ */
    function init2DFallback(canvasEl, container) {
        const ctx = canvasEl.getContext('2d');
        let W = canvasEl.width  = container.clientWidth  || window.innerWidth;
        let H = canvasEl.height = container.clientHeight || window.innerHeight;

        let dots2D = [];
        const spacing = 36;

        function build2DDots() {
            dots2D = [];
            const cols = Math.ceil(W / spacing) + 2;
            const rows = Math.ceil(H / spacing) + 2;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const ox = c * spacing;
                    const oy = r * spacing;
                    dots2D.push({
                        origX: ox,
                        origY: oy,
                        x: ox,
                        y: oy,
                        vx: 0,
                        vy: 0,
                        phase: (ox + oy) * 0.05
                    });
                }
            }
        }

        build2DDots();

        window.addEventListener('resize', () => {
            W = canvasEl.width  = container.clientWidth  || window.innerWidth;
            H = canvasEl.height = container.clientHeight || window.innerHeight;
            build2DDots();
        });

        let mouseX = -1000, mouseY = -1000;
        window.addEventListener('mousemove', e => {
            const r = canvasEl.getBoundingClientRect();
            mouseX = e.clientX - r.left;
            mouseY = e.clientY - r.top;
        }, { passive: true });

        let time = 0;
        function draw() {
            time += 0.02;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, W, H);

            const influence = 120;
            const maxPush = 10;

            dots2D.forEach(d => {
                const dx = d.origX - mouseX;
                const dy = d.origY - mouseY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                let targetX = d.origX;
                let targetY = d.origY;

                if (dist < influence && dist > 0) {
                    const factor = (1 - dist / influence);
                    targetX = d.origX + (dx / dist) * factor * maxPush;
                    targetY = d.origY + (dy / dist) * factor * maxPush;
                }

                d.vx += (targetX - d.x) * 0.12;
                d.vy += (targetY - d.y) * 0.12;
                d.vx *= 0.82;
                d.vy *= 0.82;
                d.x += d.vx;
                d.y += d.vy;

                ctx.beginPath();
                ctx.arc(d.x, d.y, 3.2, 0, Math.PI * 2);
                ctx.fillStyle = '#8B5CF6';
                ctx.shadowColor = '#5E17EB';
                ctx.shadowBlur = 6;
                ctx.fill();
            });

            requestAnimationFrame(draw);
        }
        draw();
    }

})();
