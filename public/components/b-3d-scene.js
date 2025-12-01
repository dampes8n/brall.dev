/**
 * b-3d-scene Web Component
 * 3D scene component using Three.js for background rendering
 */

class B3DScene extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // Set up base styles
        this.style.position = 'absolute';
        this.style.top = '0';
        this.style.left = '0';
        this.style.width = '100%';
        this.style.height = '100%';
        this.style.pointerEvents = 'none';
        this.style.zIndex = '1';

        this.init();
    }

    async init() {
    // Load Three.js if not available
    if (typeof THREE === 'undefined') {
        if (window.loadThreeJs) {
            try {
                await window.loadThreeJs();
            } catch (e) {
                console.error('Failed to load Three.js:', e);
                return;
            }
        } else {
            console.error('Three.js is not loaded and loadThreeJs is not available');
            return;
        }
    }

    /*
    * A speed-improved perlin and simplex noise algorithms for 2D.
    *
    * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
    * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
    * Better rank ordering method by Stefan Gustavson in 2012.
    * Converted to Javascript by Joseph Gentle.
    *
    * Version 2012-03-09
    *
    * This code was placed in the public domain by its original author,
    * Stefan Gustavson. You may use it as you see fit, but
    * attribution is appreciated.
    *
    */

    (function (global) {
        var module = global.noise = {};

        function Grad(x, y, z) {
            this.x = x; this.y = y; this.z = z;
        }

        Grad.prototype.dot2 = function (x, y) {
            return this.x * x + this.y * y;
        };

        Grad.prototype.dot3 = function (x, y, z) {
            return this.x * x + this.y * y + this.z * z;
        };

        var grad3 = [new Grad(1, 1, 0), new Grad(-1, 1, 0), new Grad(1, -1, 0), new Grad(-1, -1, 0),
        new Grad(1, 0, 1), new Grad(-1, 0, 1), new Grad(1, 0, -1), new Grad(-1, 0, -1),
        new Grad(0, 1, 1), new Grad(0, -1, 1), new Grad(0, 1, -1), new Grad(0, -1, -1)];

        var p = [151, 160, 137, 91, 90, 15,
            131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
            190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
            88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
            77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
            102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
            135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
            5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
            223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
            251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
            49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
            138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180];
        // To remove the need for index wrapping, double the permutation table length
        var perm = new Array(512);
        var gradP = new Array(512);

        // This isn't a very good seeding function, but it works ok. It supports 2^16
        // different seed values. Write something better if you need more seeds.
        module.seed = function (seed) {
            if (seed > 0 && seed < 1) {
                // Scale the seed out
                seed *= 65536;
            }

            seed = Math.floor(seed);
            if (seed < 256) {
                seed |= seed << 8;
            }

            for (var i = 0; i < 256; i++) {
                var v;
                if (i & 1) {
                    v = p[i] ^ (seed & 255);
                } else {
                    v = p[i] ^ ((seed >> 8) & 255);
                }

                perm[i] = perm[i + 256] = v;
                gradP[i] = gradP[i + 256] = grad3[v % 12];
            }
        };

        module.seed(0);

        /*
        for(var i=0; i<256; i++) {
        perm[i] = perm[i + 256] = p[i];
        gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
        }*/

        // Skewing and unskewing factors for 2, 3, and 4 dimensions
        var F2 = 0.5 * (Math.sqrt(3) - 1);
        var G2 = (3 - Math.sqrt(3)) / 6;

        var F3 = 1 / 3;
        var G3 = 1 / 6;

        // 2D simplex noise
        module.simplex2 = function (xin, yin) {
            var n0, n1, n2; // Noise contributions from the three corners
            // Skew the input space to determine which simplex cell we're in
            var s = (xin + yin) * F2; // Hairy factor for 2D
            var i = Math.floor(xin + s);
            var j = Math.floor(yin + s);
            var t = (i + j) * G2;
            var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
            var y0 = yin - j + t;
            // For the 2D case, the simplex shape is an equilateral triangle.
            // Determine which simplex we are in.
            var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
            if (x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
                i1 = 1; j1 = 0;
            } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
                i1 = 0; j1 = 1;
            }
            // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
            // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
            // c = (3-sqrt(3))/6
            var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
            var y1 = y0 - j1 + G2;
            var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
            var y2 = y0 - 1 + 2 * G2;
            // Work out the hashed gradient indices of the three simplex corners
            i &= 255;
            j &= 255;
            var gi0 = gradP[i + perm[j]];
            var gi1 = gradP[i + i1 + perm[j + j1]];
            var gi2 = gradP[i + 1 + perm[j + 1]];
            // Calculate the contribution from the three corners
            var t0 = 0.5 - x0 * x0 - y0 * y0;
            if (t0 < 0) {
                n0 = 0;
            } else {
                t0 *= t0;
                n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
            }
            var t1 = 0.5 - x1 * x1 - y1 * y1;
            if (t1 < 0) {
                n1 = 0;
            } else {
                t1 *= t1;
                n1 = t1 * t1 * gi1.dot2(x1, y1);
            }
            var t2 = 0.5 - x2 * x2 - y2 * y2;
            if (t2 < 0) {
                n2 = 0;
            } else {
                t2 *= t2;
                n2 = t2 * t2 * gi2.dot2(x2, y2);
            }
            // Add contributions from each corner to get the final noise value.
            // The result is scaled to return values in the interval [-1,1].
            return 70 * (n0 + n1 + n2);
        };

        // 3D simplex noise
        module.simplex3 = function (xin, yin, zin) {
            var n0, n1, n2, n3; // Noise contributions from the four corners

            // Skew the input space to determine which simplex cell we're in
            var s = (xin + yin + zin) * F3; // Hairy factor for 2D
            var i = Math.floor(xin + s);
            var j = Math.floor(yin + s);
            var k = Math.floor(zin + s);

            var t = (i + j + k) * G3;
            var x0 = xin - i + t; // The x,y distances from the cell origin, unskewed.
            var y0 = yin - j + t;
            var z0 = zin - k + t;

            // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
            // Determine which simplex we are in.
            var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
            var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
            if (x0 >= y0) {
                if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
                else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
                else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
            } else {
                if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
                else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
                else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            }
            // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
            // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
            // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
            // c = 1/6.
            var x1 = x0 - i1 + G3; // Offsets for second corner
            var y1 = y0 - j1 + G3;
            var z1 = z0 - k1 + G3;

            var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
            var y2 = y0 - j2 + 2 * G3;
            var z2 = z0 - k2 + 2 * G3;

            var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
            var y3 = y0 - 1 + 3 * G3;
            var z3 = z0 - 1 + 3 * G3;

            // Work out the hashed gradient indices of the four simplex corners
            i &= 255;
            j &= 255;
            k &= 255;
            var gi0 = gradP[i + perm[j + perm[k]]];
            var gi1 = gradP[i + i1 + perm[j + j1 + perm[k + k1]]];
            var gi2 = gradP[i + i2 + perm[j + j2 + perm[k + k2]]];
            var gi3 = gradP[i + 1 + perm[j + 1 + perm[k + 1]]];

            // Calculate the contribution from the four corners
            var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
            if (t0 < 0) {
                n0 = 0;
            } else {
                t0 *= t0;
                n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
            }
            var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
            if (t1 < 0) {
                n1 = 0;
            } else {
                t1 *= t1;
                n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
            }
            var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
            if (t2 < 0) {
                n2 = 0;
            } else {
                t2 *= t2;
                n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
            }
            var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
            if (t3 < 0) {
                n3 = 0;
            } else {
                t3 *= t3;
                n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
            }
            // Add contributions from each corner to get the final noise value.
            // The result is scaled to return values in the interval [-1,1].
            return 32 * (n0 + n1 + n2 + n3);

        };

        // ##### Perlin noise stuff

        function fade(t) {
            return t * t * t * (t * (t * 6 - 15) + 10);
        }

        function lerp(a, b, t) {
            return (1 - t) * a + t * b;
        }

        // 2D Perlin Noise
        module.perlin2 = function (x, y) {
            // Find unit grid cell containing point
            var X = Math.floor(x), Y = Math.floor(y);
            // Get relative xy coordinates of point within that cell
            x = x - X; y = y - Y;
            // Wrap the integer cells at 255 (smaller integer period can be introduced here)
            X = X & 255; Y = Y & 255;

            // Calculate noise contributions from each of the four corners
            var n00 = gradP[X + perm[Y]].dot2(x, y);
            var n01 = gradP[X + perm[Y + 1]].dot2(x, y - 1);
            var n10 = gradP[X + 1 + perm[Y]].dot2(x - 1, y);
            var n11 = gradP[X + 1 + perm[Y + 1]].dot2(x - 1, y - 1);

            // Compute the fade curve value for x
            var u = fade(x);

            // Interpolate the four results
            return lerp(
                lerp(n00, n10, u),
                lerp(n01, n11, u),
                fade(y));
        };

        // 3D Perlin Noise
        module.perlin3 = function (x, y, z) {
            // Find unit grid cell containing point
            var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
            // Get relative xyz coordinates of point within that cell
            x = x - X; y = y - Y; z = z - Z;
            // Wrap the integer cells at 255 (smaller integer period can be introduced here)
            X = X & 255; Y = Y & 255; Z = Z & 255;

            // Calculate noise contributions from each of the eight corners
            var n000 = gradP[X + perm[Y + perm[Z]]].dot3(x, y, z);
            var n001 = gradP[X + perm[Y + perm[Z + 1]]].dot3(x, y, z - 1);
            var n010 = gradP[X + perm[Y + 1 + perm[Z]]].dot3(x, y - 1, z);
            var n011 = gradP[X + perm[Y + 1 + perm[Z + 1]]].dot3(x, y - 1, z - 1);
            var n100 = gradP[X + 1 + perm[Y + perm[Z]]].dot3(x - 1, y, z);
            var n101 = gradP[X + 1 + perm[Y + perm[Z + 1]]].dot3(x - 1, y, z - 1);
            var n110 = gradP[X + 1 + perm[Y + 1 + perm[Z]]].dot3(x - 1, y - 1, z);
            var n111 = gradP[X + 1 + perm[Y + 1 + perm[Z + 1]]].dot3(x - 1, y - 1, z - 1);

            // Compute the fade curve value for x, y, z
            var u = fade(x);
            var v = fade(y);
            var w = fade(z);

            // Interpolate
            return lerp(
                lerp(
                    lerp(n000, n100, u),
                    lerp(n001, n101, u), w),
                lerp(
                    lerp(n010, n110, u),
                    lerp(n011, n111, u), w),
                v);
        };

    })(window);

    this.wr = 1;
    this.setWr = () => {
        this.wr = (window.innerWidth / 1000);
        if (this.wr > 2.1) {
            this.wr = 2.1;
        }
        if (this.wr < 0.7) {
            this.wr = 0.7;
        }
    };
    this.setWr();

    this.mobile = window.matchMedia("(pointer: coarse)").matches;
    
    // Check for reduced motion preference
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    
    // Only render one frame if mobile or reduced motion is on
    this.singleFrameMode = this.mobile || this.prefersReducedMotion;

    this.scene = new THREE.Scene();
    // Use window dimensions (backgrounds container is full viewport)
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    // Use window dimensions (backgrounds container is full viewport)
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.top = '0';
    this.renderer.domElement.style.left = '0';
    this.appendChild(this.renderer.domElement);

    const geometry = new THREE.PlaneBufferGeometry(60, 60, 20, 20);
    const material = new THREE.MeshPhongMaterial();
    
    // Configure for softer, less contrasty lighting
    material.specular = new THREE.Color(0x000000); // Remove specular highlights
    material.shininess = 0; // No shininess for smoother shading

    var repeat = 10;

    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
        // Mark textures as loaded
        // Ensure material is updated after all textures are loaded
        material.needsUpdate = true;
        this.texturesLoaded = true;
        
        // Render initial frame once textures are loaded (use requestAnimationFrame to ensure renderer is ready)
        requestAnimationFrame(() => {
            if (!this.hasRenderedInitialFrame && this.renderer && this.scene && this.camera) {
                this.renderer.render(this.scene, this.camera);
                this.hasRenderedInitialFrame = true;
            }
        });
        
        if (!this.backgroundRendering) {
            this.stopRendering();
        }
        // Textures loaded, render loop already started
    };

    // Get texture folder from attribute, default to 'obsidian'
    const textureFolder = this.getAttribute('texture') || 'obsidian';
    const textureBase = `img/${textureFolder}`;

    // Parse texture scroll speeds from attributes (units per second)
    this.textureScrollX = parseFloat(this.getAttribute('texture-scroll-x') || '0');
    this.textureScrollY = parseFloat(this.getAttribute('texture-scroll-y') || '0');
    
    // Parse element selector for scroll-based texture scrolling
    this.textureScrollXElement = this.getAttribute('texture-scroll-x-element') || null;
    this.textureScrollXScale = parseFloat(this.getAttribute('texture-scroll-x-scale') || '0.0005'); // Scale factor for scroll pixels to texture offset
    this.textureScrollYElement = this.getAttribute('texture-scroll-y-element') || null;
    this.textureScrollYScale = parseFloat(this.getAttribute('texture-scroll-y-scale') || '0.0005'); // Scale factor for scroll pixels to texture offset
    
    // Parse texture scale from attribute (divisor for repeat value - higher scale = bigger texture)
    this.textureScale = parseFloat(this.getAttribute('texture-scale') || '1');
    this.baseRepeat = repeat;
    
    // Store all textures in an array for scrolling
    this.textures = [];
    
    // Function to calculate compensated repeat value based on window width (1920px is baseline)
    this.getCompensatedRepeat = () => {
        const baseScaledRepeat = this.baseRepeat / this.textureScale;
        const widthCompensation = 1920 / window.innerWidth;
        return baseScaledRepeat * widthCompensation;
    };
    
    // Function to update all texture repeats
    this.updateTextureRepeats = () => {
        const compensatedRepeat = this.getCompensatedRepeat();
        this.textures.forEach(texture => {
            if (texture) {
                texture.repeat.set(compensatedRepeat, compensatedRepeat);
            }
        });
    };

    const compensatedRepeat = this.getCompensatedRepeat();

    // Load manifest.json to see which textures are available
    const manifestUrl = `${textureBase}/manifest.json`;
    let availableTextures = new Set();
    
    // Try to load manifest, fall back to loading all textures if manifest doesn't exist
    fetch(manifestUrl)
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            // If manifest doesn't exist, assume all standard textures are available
            return { textures: ['albedo.jpg', 'normal.jpg', 'height.jpg', 'roughness.jpg', 'metallic.jpg', 'ao.jpg'] };
        })
        .then(manifest => {
            // Create a set of available texture filenames for quick lookup
            if (manifest && manifest.textures) {
                manifest.textures.forEach(textureFile => {
                    availableTextures.add(textureFile);
                });
            }
            
            // Load textures based on manifest (all through the manager for proper tracking)
            if (availableTextures.has('albedo.jpg')) {
                const texture = new THREE.TextureLoader(manager).load(`${textureBase}/albedo.jpg`);
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(compensatedRepeat, compensatedRepeat);
                material.map = texture;
                material.needsUpdate = true;
                this.textures.push(texture);
            }

            if (availableTextures.has('height.jpg')) {
                const heightTexture = new THREE.TextureLoader(manager).load(`${textureBase}/height.jpg`);
                heightTexture.wrapS = THREE.RepeatWrapping;
                heightTexture.wrapT = THREE.RepeatWrapping;
                heightTexture.repeat.set(compensatedRepeat, compensatedRepeat);
                material.heightMap = heightTexture;
                material.needsUpdate = true;
                this.textures.push(heightTexture);
            }

            if (availableTextures.has('normal.jpg')) {
                const normal = new THREE.TextureLoader(manager).load(`${textureBase}/normal.jpg`);
                normal.wrapS = THREE.RepeatWrapping;
                normal.wrapT = THREE.RepeatWrapping;
                normal.repeat.set(compensatedRepeat, compensatedRepeat);
                material.normalMap = normal;
                material.needsUpdate = true;
                this.textures.push(normal);
            }

            if (availableTextures.has('roughness.jpg')) {
                const roughness = new THREE.TextureLoader(manager).load(`${textureBase}/roughness.jpg`);
                roughness.wrapS = THREE.RepeatWrapping;
                roughness.wrapT = THREE.RepeatWrapping;
                roughness.repeat.set(compensatedRepeat, compensatedRepeat);
                material.roughnessMap = roughness;
                material.needsUpdate = true;
                this.textures.push(roughness);
            }

            // Metalness texture is optional - only load if in manifest
            if (availableTextures.has('metallic.jpg')) {
                const metalnessLoader = new THREE.TextureLoader(manager);
                metalnessLoader.load(
                    `${textureBase}/metallic.jpg`,
                    (metalness) => {
                        metalness.wrapS = THREE.RepeatWrapping; 
                        metalness.wrapT = THREE.RepeatWrapping;
                        const currentCompensatedRepeat = this.getCompensatedRepeat();
                        metalness.repeat.set(currentCompensatedRepeat, currentCompensatedRepeat);
                        material.metalnessMap = metalness;
                        material.needsUpdate = true;
                        this.textures.push(metalness);
                    },
                    undefined,
                    () => {
                        // Error loading metalness texture - it's optional, so just skip it
                    }
                );
            }

            // Ambient occlusion texture is optional - only load if in manifest
            if (availableTextures.has('ao.jpg')) {
                const aoLoader = new THREE.TextureLoader(manager);
                aoLoader.load(
                    `${textureBase}/ao.jpg`,
                    (ao) => {
                        ao.wrapS = THREE.RepeatWrapping; 
                        ao.wrapT = THREE.RepeatWrapping;
                        const currentCompensatedRepeat = this.getCompensatedRepeat();
                        ao.repeat.set(currentCompensatedRepeat, currentCompensatedRepeat);
                        material.aoMap = ao;
                        material.needsUpdate = true;
                        this.textures.push(ao);
                    },
                    undefined,
                    () => {
                        // Error loading AO texture - it's optional, so just skip it
                    }
                );
            }
        })
        .catch(() => {
            // If manifest fetch fails, load standard required textures as fallback
            const texture = new THREE.TextureLoader(manager).load(`${textureBase}/albedo.jpg`);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(compensatedRepeat, compensatedRepeat);
            material.map = texture;
            material.needsUpdate = true;
            this.textures.push(texture);

            const heightTexture = new THREE.TextureLoader(manager).load(`${textureBase}/height.jpg`);
            heightTexture.wrapS = THREE.RepeatWrapping;
            heightTexture.wrapT = THREE.RepeatWrapping;
            heightTexture.repeat.set(compensatedRepeat, compensatedRepeat);
            material.heightMap = heightTexture;
            material.needsUpdate = true;
            this.textures.push(heightTexture);

            const normal = new THREE.TextureLoader(manager).load(`${textureBase}/normal.jpg`);
            normal.wrapS = THREE.RepeatWrapping;
            normal.wrapT = THREE.RepeatWrapping;
            normal.repeat.set(compensatedRepeat, compensatedRepeat);
            material.normalMap = normal;
            material.needsUpdate = true;
            this.textures.push(normal);

            const roughness = new THREE.TextureLoader(manager).load(`${textureBase}/roughness.jpg`);
            roughness.wrapS = THREE.RepeatWrapping;
            roughness.wrapT = THREE.RepeatWrapping;
            roughness.repeat.set(compensatedRepeat, compensatedRepeat);
            material.roughnessMap = roughness;
            material.needsUpdate = true;
            this.textures.push(roughness);
        });

    this.plane = new THREE.Mesh(geometry, material);
    // Get initial rotation from attribute (in degrees), default to 0
    const planeRotationInitial = parseFloat(this.getAttribute('plane-rotation-initial') || '0');
    // Get rotation speed from attribute (degrees per second), default to 0
    this.planeRotationSpeed = parseFloat(this.getAttribute('plane-rotation') || '0');
    this.plane.rotation.z = planeRotationInitial * (Math.PI / 180); // Set initial rotation

    // Apply plane displacement based on attribute (0 = flat, >0 = ragged/displaced)
    const planeDisplacement = parseFloat(this.getAttribute('plane-displacement') || '0');
    if (planeDisplacement !== 0) {
        window.noise.seed(0.4);
        const vs = this.plane.geometry.attributes.position;
        for (var i = 0; i < vs.count; i++) {
            let x = vs.getX(i);
            let y = vs.getY(i);
            let z = vs.getZ(i);

            z = (window.noise.perlin2(x / 3.05, y / 3.05) * -planeDisplacement);

            vs.setXYZ(i, x, y, z);
        }
        // Mark position attribute as needing update
        vs.needsUpdate = true;
        // Recalculate normals so lighting reflects the vertex changes
        this.plane.geometry.computeVertexNormals();
    }

    this.scene.add(this.plane);

    // Helper function to get attribute with default
    const getAttr = (name, defaultValue) => {
        const value = this.getAttribute(name);
        return value !== null ? value : defaultValue;
    };

    // Helper function to parse hex color
    const parseColor = (colorStr) => {
        if (colorStr.startsWith('#')) {
            return parseInt(colorStr.substring(1), 16);
        }
        return parseInt(colorStr, 16);
    };

    // Helper function to parse float
    const parseFloatAttr = (str, defaultValue) => {
        const parsed = Number.parseFloat(str);
        return isNaN(parsed) ? defaultValue : parsed;
    };

    // Create lights with attributes
    this.lights = [];
    const lightDefaults = [
        { color: '0xf5f3c4', intensity: 0.5, x: 0, y: 20, z: 10, min: 0.3, max: 0.6, default: 0.5 },
        { color: '0xf2f1d8', intensity: 0.3, x: 10, y: 20, z: 10, min: 0.15, max: 0.35, default: 0.3 },
        { color: '0xdedca9', intensity: 0.3, x: -5, y: 20, z: 10, min: 0.3, max: 0.6, default: 0.3 },
        { color: '0x19a3d1', intensity: 0.2, x: 9, y: 0, z: 8, min: 0.05, max: 0.3, default: 0.15 },
        { color: '0xc7361e', intensity: 0.3, x: -9, y: -15, z: 8, min: 0.15, max: 0.4, default: 0.25 }
    ];

    for (let i = 0; i < 5; i++) {
        const num = i + 1;
        const defaults = lightDefaults[i];
        
        // Check if light is active (default to true)
        const activeAttr = getAttr(`light-${num}-active`, 'true');
        const isActive = activeAttr !== 'false' && activeAttr !== '0';
        
        const color = parseColor(getAttr(`light-${num}-color`, defaults.color));
        const intensity = parseFloatAttr(getAttr(`light-${num}-intensity`, defaults.intensity.toString()), defaults.intensity);
        const x = parseFloatAttr(getAttr(`light-${num}-position-x`, defaults.x.toString()), defaults.x);
        const y = parseFloatAttr(getAttr(`light-${num}-position-y`, defaults.y.toString()), defaults.y);
        let z = parseFloatAttr(getAttr(`light-${num}-position-z`, defaults.z.toString()), defaults.z);
        
        // Handle x positions that use wr multiplier (lights 4 and 5)
        let finalX = x;
        if (num === 4 || num === 5) {
            finalX = x * this.wr;
        }
        
        const minIntensity = parseFloatAttr(getAttr(`light-${num}-intensity-min`, defaults.min.toString()), defaults.min);
        const maxIntensity = parseFloatAttr(getAttr(`light-${num}-intensity-max`, defaults.max.toString()), defaults.max);
        
        // Parse flicker rate from attribute (default based on light number: 250 for 1-3, 200 for 4-5)
        const defaultFlickerRate = num <= 3 ? 250 : 200;
        const flickerRate = parseFloatAttr(getAttr(`light-${num}-flicker-rate`, defaultFlickerRate.toString()), defaultFlickerRate);

        const light = new THREE.PointLight(color, intensity);
        light.position.set(finalX, y, z);
        light.minIntensity = minIntensity;
        light.maxIntensity = maxIntensity;
        light.flickerRate = flickerRate;
        light.castShadow = true;
        light.lightNumber = num; // Store light number for reference
        
        // Only add to scene and array if active
        if (isActive) {
            this.scene.add(light);
            this.lights.push(light);
        }
    }

    // Add ambient light to brighten shadows (configurable via attribute, only if intensity > 0)
    const ambientIntensity = parseFloat(this.getAttribute('ambient-light-intensity') || '0.15');
    if (ambientIntensity > 0) {
        const ambientColorStr = this.getAttribute('ambient-light-color') || '0xffffff';
        const ambientColor = parseColor(ambientColorStr);
        const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
        this.scene.add(ambientLight);
    }

    this.camera.position.z = 5 * this.wr;

    window.noise.seed(Math.random());
    this.lightFlicker = (light, frame, offset, rate) => {
        light.intensity = window.noise.perlin2(offset, frame / rate) * (light.maxIntensity - light.minIntensity) + light.minIntensity;
    };
    
    // Initialize all lights with randomized flicker values
    this.lights.forEach((light) => {
        const offset = 3000 + (light.lightNumber * 1000);
        const rate = light.flickerRate || (light.lightNumber <= 3 ? 250 : 200);
        // Use frame 0 to get an initial randomized value
        this.lightFlicker(light, 0, offset, rate);
    });

    const reportWindowSize = () => {
        this.setWr();
        const width = window.innerWidth;
        const height = window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.position.z = 5 * this.wr;
        
        // Update light positions that use wr multiplier (lights 4 and 5)
        // Find lights 4 and 5 in the active lights array
        const light4 = this.lights.find(l => l.lightNumber === 4);
        const light5 = this.lights.find(l => l.lightNumber === 5);
        if (light4) {
            const light4X = parseFloatAttr(getAttr('light-4-position-x', '9'), 9) * this.wr;
            light4.position.x = light4X;
        }
        if (light5) {
            const light5X = parseFloatAttr(getAttr('light-5-position-x', '-9'), -9) * this.wr;
            light5.position.x = light5X;
        }
        
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.screenResized = true;
        
        // Update texture repeats to compensate for width changes
        if (this.updateTextureRepeats) {
            this.updateTextureRepeats();
        }
    };
    this.handleResize = reportWindowSize.bind(this);
    window.addEventListener('resize', this.handleResize, false);

    this.clock = new THREE.Clock();
    this.interval = 50;
    this.maxFrameSkipsPerInterval = 10;
    this.maxSlowdownTolerance = 3;
    this.targetTimePerFrame = 1 / this.interval;
    this.upperTimePerFrame = this.targetTimePerFrame;
    this.lowerTimePerFrame = 1 / (this.interval + 5);
    this.frameSkips = 0;
    this.currFrameSkips = 0;
    this.currDelta = 0;
    this.currDeltaCount = 0;
    this.frame = 0;
    this.backgroundRendering = true;
    this.screenResized = false;
    this.hasRenderedInitialFrame = false; // Track if we've rendered the initial frame on load
    this.texturesLoaded = false; // Track if textures have finished loading

    this.handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            // Reset delta counter.
            this.clock.getDelta();
        }
    };
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.render = () => {
        // Check focus state
        const hasFocus = document.hasFocus();
        const isInitialFrame = !this.hasRenderedInitialFrame;
        
        // Always render the very first frame (even if backgroundRendering is false), but only after textures load
        // Then check focus for subsequent frames
        // In single frame mode, only render the initial frame
        const shouldRender = (isInitialFrame && this.texturesLoaded) || (this.backgroundRendering && hasFocus && !this.singleFrameMode);
        
        if (shouldRender) {
            // Get delta time once per frame (only when actually updating)
            const deltaTime = this.clock.getDelta();
            
            if (hasFocus || isInitialFrame) {
                // Update frame counter and animations only when focused or on initial frame
                this.frame++;
                
                // Update texture scrolling
                if (this.textures) {
                    // Helper function to reset offset when it exceeds one repeat distance
                    const normalizeOffset = (offset) => {
                        // Reset to origin when offset exceeds one full repeat (1.0) in either direction
                        if (offset >= 1.0) {
                            return offset - Math.floor(offset);
                        } else if (offset <= -1.0) {
                            return offset - Math.ceil(offset);
                        }
                        return offset;
                    };
                    
                    // Check if we're using element-based scrolling
                    const hasElementScrolling = this.textureScrollXElement || this.textureScrollYElement;
                    
                    if (hasElementScrolling) {
                        // Handle X element-based scrolling
                        let textureOffsetX = null;
                        if (this.textureScrollXElement) {
                            const scrollElementX = document.querySelector(this.textureScrollXElement);
                            if (scrollElementX) {
                                const scrollTopX = scrollElementX.scrollTop;
                                // Use actual scroll position in pixels, scaled to texture offset
                                // Negative to scroll down as we scroll down
                                textureOffsetX = -scrollTopX * this.textureScrollXScale;
                                // Normalize to prevent large accumulated values
                                textureOffsetX = normalizeOffset(textureOffsetX);
                            }
                        }
                        
                        // Handle Y element-based scrolling
                        let textureOffsetY = null;
                        if (this.textureScrollYElement) {
                            const scrollElementY = document.querySelector(this.textureScrollYElement);
                            if (scrollElementY) {
                                const scrollTopY = scrollElementY.scrollTop;
                                // Use actual scroll position in pixels, scaled to texture offset
                                // Negative to scroll down as we scroll down
                                textureOffsetY = -scrollTopY * this.textureScrollYScale;
                                // Normalize to prevent large accumulated values
                                textureOffsetY = normalizeOffset(textureOffsetY);
                            }
                        }
                        
                        // Apply scroll-based offsets
                        this.textures.forEach((tex) => {
                            if (tex) {
                                if (textureOffsetX !== null) {
                                    tex.offset.x = textureOffsetX;
                                } else if (this.textureScrollX !== 0) {
                                    // Fall back to time-based X scrolling if no element-based X
                                    tex.offset.x += this.textureScrollX * deltaTime;
                                    // Normalize to prevent large accumulated values
                                    tex.offset.x = normalizeOffset(tex.offset.x);
                                }
                                
                                if (textureOffsetY !== null) {
                                    tex.offset.y = textureOffsetY;
                                } else if (this.textureScrollY !== 0) {
                                    // Fall back to time-based Y scrolling if no element-based Y
                                    tex.offset.y += this.textureScrollY * deltaTime;
                                    // Normalize to prevent large accumulated values
                                    tex.offset.y = normalizeOffset(tex.offset.y);
                                }
                            }
                        });
                    } else if (this.textureScrollX !== 0 || this.textureScrollY !== 0) {
                        // Use time-based scrolling
                        this.textures.forEach((tex) => {
                            if (tex) {
                                tex.offset.x += this.textureScrollX * deltaTime;
                                tex.offset.y += this.textureScrollY * deltaTime;
                                // Normalize to prevent large accumulated values
                                tex.offset.x = normalizeOffset(tex.offset.x);
                                tex.offset.y = normalizeOffset(tex.offset.y);
                            }
                        });
                    }
                }
                // Update frame counter and animations only when focused or on initial frame
                this.frame++;
                
                // Update plane rotation (degrees per second)
                if (this.planeRotationSpeed !== 0) {
                    this.plane.rotation.z += (this.planeRotationSpeed * (Math.PI / 180)) * deltaTime;
                }
                
                // Flicker all active lights based on their light number
                this.lights.forEach((light) => {
                    const offset = 3000 + (light.lightNumber * 1000);
                    const rate = light.flickerRate || (light.lightNumber <= 3 ? 250 : 200);
                    this.lightFlicker(light, this.frame, offset, rate);
                });
                
                // Update performance tracking only when focused
                if (hasFocus) {
                    this.currDelta += deltaTime;
                    this.currDeltaCount++;
                }
            }
            
            // Render the scene - always render initial frame, otherwise respect frame skipping
            if (isInitialFrame || this.currFrameSkips === 0) {
                if (!isInitialFrame) {
                    this.currFrameSkips = this.frameSkips;
                }
                this.renderer.render(this.scene, this.camera);
                
                // Mark that we've rendered the initial frame immediately after first render
                // Only set the flag if textures are loaded (ensures initial frame has textures)
                if (isInitialFrame && this.texturesLoaded) {
                    this.hasRenderedInitialFrame = true;
                }
            } else {
                this.currFrameSkips--;
            }
        }
        
        // Only schedule next frame if not in single frame mode
        if (!this.singleFrameMode) {
            requestAnimationFrame(() => this.render());
        }
    };

    this.performanceInterval = null;
    if (this.backgroundRendering) {
        this.performanceInterval = setInterval(() => this.measurePerformance(), 5000);
    }
    this.slowCount = 0;
    this.measurePerformance = () => {
        if (this.currDeltaCount <= 0) { return; }
        let avgTimePerFrame = (this.currDelta / this.currDeltaCount);
        // console.log({currDelta, currDeltaCount, frameSkips});
        if (avgTimePerFrame > this.upperTimePerFrame) {
            // Slower than target
            let frames = Math.min(Math.ceil(avgTimePerFrame / this.targetTimePerFrame), this.maxFrameSkipsPerInterval);
            // console.log(`Slow. Adding ${frames} frames`);
            this.frameSkips += frames;
        } else if (this.frameSkips > 0 && avgTimePerFrame < this.lowerTimePerFrame) {
            let frames = Math.ceil((1 - (avgTimePerFrame / this.targetTimePerFrame)) * this.frameSkips);
            // console.log(`Fast. Subtracing ${frames} frames`);
            this.frameSkips -= Math.min(frames, this.frameSkips);
        }
        if (this.frameSkips >= this.maxFrameSkipsPerInterval) {
            this.slowCount++;
        } else {
            this.slowCount = 0;
        }

        if (this.slowCount >= this.maxSlowdownTolerance) {
            if (this.backgroundRendering) {
                this.stopRendering();
                window.clearInterval(this.performanceInterval);
            }
            this.slowCount = 0;
        }
        this.currDelta = 0;
        this.currDeltaCount = 0;
    };

    this.stopRendering = () => {
        this.backgroundRendering = false;

        // Set lights to randomized values when stopping
        this.lights.forEach(light => {
            const offset = 3000 + (light.lightNumber * 1000);
            const rate = light.flickerRate || (light.lightNumber <= 3 ? 250 : 200);
            // Use current frame to get a randomized value
            this.lightFlicker(light, this.frame, offset, rate);
        });

        // Final Render
        this.renderer.render(this.scene, this.camera);
    };

    // Start rendering loop (initial frame will render after textures load)
    this.render();
    }

    disconnectedCallback() {
        // Clean up event listeners
        if (this.handleResize) {
            window.removeEventListener('resize', this.handleResize);
        }
        if (this.handleVisibilityChange) {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        }
        if (this.performanceInterval) {
            window.clearInterval(this.performanceInterval);
        }
    }
}

customElements.define('b-3d-scene', B3DScene);