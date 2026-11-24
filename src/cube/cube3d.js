import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
    DEFAULT_COLOR_SCHEME,
    palette,
    stickerNameToModelIndex,
    faceMap,
    colorSchemes
} from './modelTables.js';


// ============================================================================
// Constants
// ============================================================================

const DEFAULT_STICKER_COLOR = '#81858d';

const DEFAULT_STICKER_OPACITY = 0.12;
const FADED_STICKER_OPACITY = 0.09;
const FADED_COLORED_OPACITY = 0.3;

const BACKGROUND_COLOR = '#b0b3b6';

const DEFAULT_CAMERA_POSITION = {
    x: 0.22/1.1,
    y: 0.115/1.1,
    z: 0.4/1.1
};


// ============================================================================
// Create cube viewer
// ============================================================================

export async function createCube3D(
    container,
    {
        initialState = new Map(),
        colorScheme = DEFAULT_COLOR_SCHEME
    } = {}
) {
    if (!(container instanceof HTMLElement)) {
        throw new Error(
            'createCube3D() requires an HTMLElement container'
        );
    }

    if (!colorSchemes[colorScheme]) {
        throw new Error(
            `Unknown color scheme: ${colorScheme}`
        );
    }


    // ========================================================================
    // Scene
    // ========================================================================

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
        25/1.5,
        1,
        0.1,
        1000
    );

    camera.position.set(
        DEFAULT_CAMERA_POSITION.x,
        DEFAULT_CAMERA_POSITION.y,
        DEFAULT_CAMERA_POSITION.z
    );


    // ========================================================================
    // Renderer
    // ========================================================================

    const renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false
    });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    renderer.setClearColor(
        BACKGROUND_COLOR
    );

    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';

    container.appendChild(
        renderer.domElement
    );


    // ========================================================================
    // Controls
    // ========================================================================

    const controls = new OrbitControls(
        camera,
        renderer.domElement
    );

    controls.target.set(
        0,
        0,
        0
    );

    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.4;

    controls.minPolarAngle =
        Math.PI * -1;

    controls.maxPolarAngle =
        Math.PI * 0.9;

    controls.minAzimuthAngle =
        Math.PI * -0.45;

    controls.maxAzimuthAngle =
        Math.PI * 0.9;


    // ========================================================================
    // Lighting
    // ========================================================================

    const ambientLight =
        new THREE.AmbientLight(
            '#ffffff',
            4
        );

    scene.add(
        ambientLight
    );


    const headLight =
        new THREE.DirectionalLight(
            '#ffffff',
            0.7
        );

    scene.add(
        headLight
    );


    // ========================================================================
    // Sticker material
    // ========================================================================

    const stickerMaterialDefault =
        new THREE.MeshStandardMaterial({
            color: DEFAULT_STICKER_COLOR,
            roughness: 0.9,
            metalness: 0.1,
            transparent: true,
            opacity:
                DEFAULT_STICKER_OPACITY,
            side: THREE.DoubleSide
        });


    // Index = model sticker index.
    //
    // This is deliberately an indexed Array rather than simply push(),
    // because modelTables.js expects sticker 0..53 to have fixed meanings.
    const stickerModels =
        new Array(54);


    // ========================================================================
    // Load GLB
    // ========================================================================

    const loader =
        new GLTFLoader();

    const modelUrl =
        `${import.meta.env.BASE_URL}models/stickers.glb`;

    const gltf =
        await loader.loadAsync(
            modelUrl
        );

    const model =
        gltf.scene;


    let fallbackIndex = 0;

    model.traverse(obj => {
        if (!obj.isMesh) {
            return;
        }

        obj.material =
            stickerMaterialDefault.clone();

        // Your original GLB uses names whose final section
        // contains the sticker model index.
        //
        // e.g. sticker_0, sticker_1, ...
        const match =
            obj.name.match(/(\d+)$/);

        if (match) {
            const index =
                Number(match[1]);

            if (
                Number.isInteger(index) &&
                index >= 0 &&
                index < stickerModels.length
            ) {
                stickerModels[index] =
                    obj;

                return;
            }
        }

        // Fallback in case a mesh does not contain an index in its name.
        while (
            fallbackIndex
                < stickerModels.length &&
            stickerModels[fallbackIndex]
                !== undefined
        ) {
            fallbackIndex++;
        }

        if (
            fallbackIndex
            < stickerModels.length
        ) {
            stickerModels[
                fallbackIndex
            ] = obj;

            fallbackIndex++;
        }
    });

    scene.add(
        model
    );


    // ========================================================================
    // Internal state
    // ========================================================================

    let currentState =
        new Map(initialState);

    let currentColorSchemeName =
        colorScheme;


    // ========================================================================
    // Material helpers
    // ========================================================================

    function resetWholeCube() {
        for (
            const sticker
            of stickerModels
        ) {
            if (!sticker) {
                continue;
            }

            sticker.material.color.set(
                stickerMaterialDefault.color
            );

            sticker.material.roughness =
                stickerMaterialDefault.roughness;

            sticker.material.metalness =
                stickerMaterialDefault.metalness;

            sticker.material.transparent =
                stickerMaterialDefault.transparent;

            sticker.material.opacity =
                stickerMaterialDefault.opacity;
        }
    }


    function setSticker(
        stickerName,
        color
    ) {
        const index =
            stickerNameToModelIndex[
                stickerName
            ];

        if (index === undefined) {
            throw new Error(
                `Unknown model sticker: ${stickerName}`
            );
        }

        const sticker =
            stickerModels[index];

        if (!sticker) {
            return;
        }

        sticker.material.color.set(
            color
        );

        sticker.material.opacity = 1;
    }


    function parseStickerName(name) {
        const [
            piece,
            face
        ] = name.split('-');

        if (
            !piece ||
            !face
        ) {
            throw new Error(
                `Invalid sticker name: ${name}`
            );
        }

        const orientationIndex =
            piece.indexOf(face);

        if (
            orientationIndex === -1
        ) {
            throw new Error(
                `Invalid sticker orientation: ${name}`
            );
        }

        return {
            piece,
            face,
            orientationIndex
        };
    }


    function setWholePiece(
        stickerName,
        locationName
    ) {
        const stickerInfo =
            parseStickerName(
                stickerName
            );

        const locationInfo =
            parseStickerName(
                locationName
            );

        const locationPiece =
            locationInfo.piece;

        const numOfStickers =
            locationPiece.length;

        const scheme =
            colorSchemes[
                currentColorSchemeName
            ];


        for (
            let i = 0;
            i < numOfStickers;
            i++
        ) {
            const sourceFace =
                stickerInfo.piece[
                    (
                        stickerInfo.orientationIndex
                        + i
                    )
                    % numOfStickers
                ];

            const destinationFace =
                locationPiece[
                    (
                        locationInfo.orientationIndex
                        + i
                    )
                    % numOfStickers
                ];

            const destinationSticker =
                locationPiece
                + '-'
                + destinationFace;

            const colorCode =
                scheme[sourceFace];

            const color =
                palette[colorCode];

            setSticker(
                destinationSticker,
                color
            );
        }
    }


    function setStateSticker(
        state
    ) {
        resetWholeCube();

        for (
            const [
                stickerName,
                locationName
            ]
            of state
        ) {
            setWholePiece(
                stickerName,
                locationName
            );
        }
    }


    // ========================================================================
    // Face fading
    // ========================================================================

    function fadeSticker(
        stickerIndex
    ) {
        const sticker =
            stickerModels[
                stickerIndex
            ];

        if (!sticker) {
            return;
        }

        // A colored FB sticker has opacity 1.
        //
        // A normal unused sticker has the default opacity.
        if (
            sticker.material.opacity
            !== DEFAULT_STICKER_OPACITY
        ) {
            sticker.material.opacity =
                FADED_COLORED_OPACITY;
        } else {
            sticker.material.opacity =
                FADED_STICKER_OPACITY;
        }
    }


    function fadeFaces() {
        const faces = [];

        const pos =
            camera.position;

        const table = {
            x: ['L', 'R'],
            y: ['D', 'U'],
            z: ['B', 'F']
        };

        const threshold = 0;


        for (
            const axis
            of Object.keys(table)
        ) {
            if (
                pos[axis]
                > threshold
            ) {
                faces.push(
                    table[axis][0]
                );
            }

            if (
                pos[axis]
                < -threshold
            ) {
                faces.push(
                    table[axis][1]
                );
            }
        }


        for (
            const face
            of faces
        ) {
            for (
                const stickerIndex
                of faceMap[face]
            ) {
                fadeSticker(
                    stickerIndex
                );
            }
        }
    }


    // ========================================================================
    // Resize
    // ========================================================================

    function resize() {
        const rect =
            container.getBoundingClientRect();

        const width =
            Math.max(
                1,
                Math.round(rect.width)
            );

        const height =
            Math.max(
                1,
                Math.round(rect.height)
            );

        renderer.setSize(
            width,
            height,
            false
        );

        camera.aspect =
            width / height;

        camera.updateProjectionMatrix();
    }


    const resizeObserver =
        new ResizeObserver(
            resize
        );

    resizeObserver.observe(
        container
    );

    resize();


    // ========================================================================
    // Render loop
    // ========================================================================

    function animate() {
        controls.update();

        // Restore the normal state first,
        // then apply fading according to the current camera angle.
        setStateSticker(
            currentState
        );

        fadeFaces();

        // Kept from the old viewer because Safari could otherwise
        // occasionally restore the canvas with the wrong clear color.
        renderer.setClearColor(
            BACKGROUND_COLOR
        );

        headLight.position.copy(
            camera.position
        );

        renderer.render(
            scene,
            camera
        );
    }


    renderer.setAnimationLoop(
        animate
    );


    // ========================================================================
    // Public API
    // ========================================================================

    function setState(state) {
        if (!(state instanceof Map)) {
            throw new TypeError(
                'Cube state must be a Map'
            );
        }

        currentState =
            new Map(state);
    }


    function getState() {
        return new Map(
            currentState
        );
    }


    function setColorScheme(
        schemeName
    ) {
        if (
            !colorSchemes[
                schemeName
            ]
        ) {
            throw new Error(
                `Unknown color scheme: ${schemeName}`
            );
        }

        currentColorSchemeName =
            schemeName;
    }


    function getColorScheme() {
        return (
            currentColorSchemeName
        );
    }


    function resetCamera() {
        camera.position.set(
            DEFAULT_CAMERA_POSITION.x,
            DEFAULT_CAMERA_POSITION.y,
            DEFAULT_CAMERA_POSITION.z
        );

        controls.target.set(
            0,
            0,
            0
        );

        controls.update();
    }


    function dispose() {
        renderer.setAnimationLoop(
            null
        );

        resizeObserver.disconnect();

        controls.dispose();

        model.traverse(obj => {
            if (!obj.isMesh) {
                return;
            }

            obj.geometry?.dispose();

            if (
                Array.isArray(
                    obj.material
                )
            ) {
                for (
                    const material
                    of obj.material
                ) {
                    material.dispose();
                }
            } else {
                obj.material?.dispose();
            }
        });

        renderer.dispose();

        renderer.domElement.remove();
    }


    return {
        setState,
        getState,

        setColorScheme,
        getColorScheme,

        resetCamera,
        resize,
        dispose,

        camera,
        controls,
        renderer
    };
}