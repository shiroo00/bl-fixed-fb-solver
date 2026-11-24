import {
    FB_ORDER,
    cubeOrbits,
    fatMoveReplace,
    rotations,
    stickerToCode,
    codeToSticker
} from './tables.js';


export const FIXED_BL_STICKER = 'BL-L';

export const FULL_FB_ORDER = [
    FIXED_BL_STICKER,
    ...FB_ORDER
];


const pieceType = {
    1: 'center',
    2: 'edge',
    3: 'corner'
};

const stickerBaseNum = {
    center: 6,
    edge: 22,
    corner: 24
};


// ============================================================================
// Basic state creation
// ============================================================================

export function createSolvedFBState(includeFixedBL = true) {
    const order = includeFixedBL
        ? FULL_FB_ORDER
        : FB_ORDER;

    return new Map(
        order.map(sticker => [sticker, sticker])
    );
}


export function projectState(state, order = FB_ORDER) {
    const result = new Map();

    for (const sticker of order) {
        const location = state.get(sticker);

        if (location === undefined) {
            throw new Error(
                `State does not contain sticker: ${sticker}`
            );
        }

        result.set(sticker, location);
    }

    return result;
}


export function withFixedBL(state) {
    const result = new Map([
        [FIXED_BL_STICKER, FIXED_BL_STICKER]
    ]);

    for (const [sticker, location] of state) {
        if (sticker === FIXED_BL_STICKER) continue;

        result.set(sticker, location);
    }

    return result;
}


// ============================================================================
// Alg parsing
// ============================================================================

export function parseInput(alg) {
    if (alg === undefined || alg === null) {
        return [];
    }

    if (typeof alg === 'string') {
        const text = alg
            .replace(/[()]/g, '')
            .trim();

        if (!text) return [];

        return text
            .split(/\s+/)
            .filter(Boolean);
    }

    if (Array.isArray(alg)) {
        return alg
            .map(move =>
                String(move).replace(/[()]/g, '')
            )
            .filter(Boolean);
    }

    throw new TypeError(
        'Alg must be a string or an array of moves'
    );
}


export function algToString(alg) {
    return parseInput(alg).join(' ');
}


export function invertMove(move) {
    if (move.endsWith('2')) {
        return move;
    }

    if (move.endsWith("'")) {
        return move.slice(0, -1);
    }

    return move + "'";
}


export function invertAlg(alg) {
    return parseInput(alg)
        .reverse()
        .map(invertMove);
}


// ============================================================================
// Move application
// ============================================================================

function getMoveAmount(move) {
    if (move.length === 1) {
        return 1;
    }

    if (move.length === 2) {
        if (move[1] === '2') return 2;
        if (move[1] === "'") return 3;
    }

    throw new Error(`Invalid move: ${move}`);
}


export function applyMove(locationName, move) {
    const orbit = cubeOrbits[move[0]];

    if (!orbit) {
        throw new Error(`Unknown move: ${move}`);
    }

    const currentIndex = orbit.indexOf(locationName);

    if (currentIndex === -1) {
        return locationName;
    }

    const amount = getMoveAmount(move);

    return orbit[currentIndex + amount];
}


export function expandAlg(alg) {
    return parseInput(alg)
        .flatMap(move =>
            fatMoveReplace[move] ?? [move]
        );
}


export function applyAlg(state, alg) {
    const result = new Map(state);
    const moves = expandAlg(alg);

    if (!moves.length) {
        return result;
    }

    for (const [stickerName, locationName] of result) {
        let location = locationName;

        for (const move of moves) {
            location = applyMove(location, move);
        }

        result.set(stickerName, location);
    }

    return result;
}


// ============================================================================
// State checks
// ============================================================================

export function isSolved(state) {
    for (const [stickerName, locationName] of state) {
        if (stickerName !== locationName) {
            return false;
        }
    }

    return true;
}


// ============================================================================
// State ID encoding / decoding
// ============================================================================

export function getStickerType(sticker) {
    const piece = sticker.split('-')[0];
    const type = pieceType[piece.length];

    if (!type) {
        throw new Error(
            `Cannot determine sticker type: ${sticker}`
        );
    }

    return type;
}


export function getStickerBaseNum(sticker) {
    return stickerBaseNum[getStickerType(sticker)];
}


export function encodeState(order, state) {
    let id = 0;

    for (const sticker of order) {
        const location = state.get(sticker);

        if (location === undefined) {
            throw new Error(
                `State does not contain sticker: ${sticker}`
            );
        }

        const code = stickerToCode[location];

        if (code === undefined) {
            throw new Error(
                `Cannot encode location: ${location}`
            );
        }

        id =
            id * getStickerBaseNum(sticker)
            + code;
    }

    return id;
}


export function decodeState(order, id) {
    if (!Number.isInteger(id) || id < 0) {
        throw new Error(`Invalid state ID: ${id}`);
    }

    let temp = id;

    const locations = new Array(order.length);

    for (
        let index = order.length - 1;
        index >= 0;
        index--
    ) {
        const sticker = order[index];
        const base = getStickerBaseNum(sticker);

        const code = temp % base;

        temp = Math.floor(temp / base);

        const type = getStickerType(sticker);
        const location = codeToSticker[type][code];

        if (location === undefined) {
            throw new Error(
                `Cannot decode state ID ${id}`
            );
        }

        locations[index] = location;
    }

    if (temp !== 0) {
        throw new Error(
            `State ID is too large for this order: ${id}`
        );
    }

    const state = new Map();

    for (let i = 0; i < order.length; i++) {
        state.set(
            order[i],
            locations[i]
        );
    }

    return state;
}


export function encodeFBState(state) {
    return encodeState(
        FB_ORDER,
        state
    );
}


export function decodeFBState(id) {
    return decodeState(
        FB_ORDER,
        id
    );
}


export function decodeFullFBState(id) {
    return withFixedBL(
        decodeFBState(id)
    );
}


// ============================================================================
// Cube rotations
// ============================================================================

export function getRotation(
    locationName,
    destinationName
) {
    const state = new Map([
        [destinationName, locationName]
    ]);

    return rotations.filter(rotation =>
        isSolved(
            applyAlg(state, rotation)
        )
    );
}


export function getBLFixRotation(state) {
    const location =
        state.get(FIXED_BL_STICKER);

    if (location === undefined) {
        throw new Error(
            `State does not contain ${FIXED_BL_STICKER}`
        );
    }

    if (location === FIXED_BL_STICKER) {
        return '';
    }

    const matchingRotations = getRotation(
        location,
        FIXED_BL_STICKER
    );

    if (!matchingRotations.length) {
        throw new Error(
            `Cannot rotate ${location} to ${FIXED_BL_STICKER}`
        );
    }

    return matchingRotations[0];
}


// ============================================================================
// Manual scramble -> BL-fixed state
// ============================================================================

export function readScramble(scramble) {
    const inputMoves = parseInput(scramble);

    const solvedState =
        createSolvedFBState(true);

    let fullState = applyAlg(
        solvedState,
        inputMoves
    );

    const rotation =
        getBLFixRotation(fullState);

    const finalMoves = [
        ...inputMoves
    ];

    if (rotation) {
        const rotationMoves =
            parseInput(rotation);

        finalMoves.push(
            ...rotationMoves
        );

        fullState = applyAlg(
            fullState,
            rotationMoves
        );
    }

    const fbState = projectState(
        fullState,
        FB_ORDER
    );

    const id = encodeFBState(
        fbState
    );

    return {
        originalMoves: inputMoves,
        originalAlg: inputMoves.join(' '),

        rotation,

        moves: finalMoves,
        alg: finalMoves.join(' '),

        fullState,
        fbState,

        id
    };
}