import {
    FB_ORDER,
    BlFixedCodeToMove,
    moveOrbitsNum,
    moveType,
    moveAxis,
    stickerToCodeGlobal,
    globalCodeToLocal,
    globalCodeToBaseNum
} from './tables.js';

import {
    encodeFBState,
    decodeFBState,
    decodeFullFBState,
    invertAlg
} from './state.js';


// ============================================================================
// fb-dist.bin
// ============================================================================

let fbDist = null;
let idsByDist = [];
let initPromise = null;

const FB_BASES = FB_ORDER.map(sticker => {
    const globalCode = stickerToCodeGlobal[sticker];
    return globalCodeToBaseNum[globalCode];
});


const SOLVED_NUM_STATE = FB_ORDER.map(
    sticker => stickerToCodeGlobal[sticker]
);


// ============================================================================
// Initialization
// ============================================================================

export function initSolver() {
    if (fbDist) {
        return Promise.resolve();
    }

    if (initPromise) {
        return initPromise;
    }

    initPromise = loadSolverData().catch(error => {
        initPromise = null;
        throw error;
    });

    return initPromise;
}


async function loadSolverData() {
    const url =
        `${import.meta.env.BASE_URL}bins/fb-dist.bin`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(
            `Failed to load fb-dist.bin: ${response.status}`
        );
    }

    fbDist = new Uint8Array(
        await response.arrayBuffer()
    );

    buildIdsByDist();

    const solvedId =
        encodeNumState(SOLVED_NUM_STATE);

    if (
        solvedId >= fbDist.length ||
        fbDist[solvedId] !== 0
    ) {
        throw new Error(
            'fb-dist.bin does not match the current FB encoding'
        );
    }

    console.log(
        'fb-dist loaded:',
        fbDist.length,
        'entries'
    );

    console.log(
        'FB distance distribution:',
        idsByDist.map(ids => ids?.length ?? 0)
    );
}


// ============================================================================
// Build ID lists by distance
// ============================================================================

function buildIdsByDist() {
    let maxDist = 0;

    const counts = [];

    for (
        let id = 0;
        id < fbDist.length;
        id++
    ) {
        const dist = fbDist[id];

        if (dist === 255) {
            continue;
        }

        counts[dist] =
            (counts[dist] ?? 0) + 1;

        if (dist > maxDist) {
            maxDist = dist;
        }
    }

    idsByDist = Array.from(
        { length: maxDist + 1 },
        (_, dist) =>
            new Uint32Array(
                counts[dist] ?? 0
            )
    );

    const positions =
        new Uint32Array(maxDist + 1);

    for (
        let id = 0;
        id < fbDist.length;
        id++
    ) {
        const dist = fbDist[id];

        if (dist === 255) {
            continue;
        }

        idsByDist[dist][
            positions[dist]++
        ] = id;
    }
}


// ============================================================================
// Public distance / ID helpers
// ============================================================================

function requireReady() {
    if (!fbDist) {
        throw new Error(
            'Solver is not initialized. Call await initSolver() first.'
        );
    }
}


export function getAvailableDistances() {
    requireReady();

    const result = [];

    for (
        let dist = 0;
        dist < idsByDist.length;
        dist++
    ) {
        if (idsByDist[dist].length > 0) {
            result.push(dist);
        }
    }

    return result;
}


export function getIdsByDistance(dist) {
    requireReady();

    if (
        !Number.isInteger(dist) ||
        dist < 0 ||
        !idsByDist[dist]
    ) {
        return new Uint32Array(0);
    }

    return idsByDist[dist];
}


export function getRandomIdByDistance(dist) {
    const ids =
        getIdsByDistance(dist);

    if (!ids.length) {
        throw new Error(
            `No FB states found at distance ${dist}`
        );
    }

    const index =
        Math.floor(
            Math.random() * ids.length
        );

    return ids[index];
}


export function getDistanceById(id) {
    requireReady();

    if (
        !Number.isInteger(id) ||
        id < 0 ||
        id >= fbDist.length
    ) {
        throw new Error(
            `Invalid FB state ID: ${id}`
        );
    }

    const dist = fbDist[id];

    if (dist === 255) {
        return null;
    }

    return dist;
}


export function getDistance(state) {
    const id =
        encodeFBState(state);

    return getDistanceById(id);
}


// ============================================================================
// Numeric FB state
// ============================================================================

function stateToNumState(state) {
    const result =
        new Array(FB_ORDER.length);

    for (
        let i = 0;
        i < FB_ORDER.length;
        i++
    ) {
        const sticker =
            FB_ORDER[i];

        const location =
            state.get(sticker);

        if (location === undefined) {
            throw new Error(
                `State does not contain ${sticker}`
            );
        }

        const code =
            stickerToCodeGlobal[location];

        if (code === undefined) {
            throw new Error(
                `Unknown sticker location: ${location}`
            );
        }

        result[i] = code;
    }

    return result;
}


function encodeNumState(numState) {
    let id = 0;

    for (
        let i = 0;
        i < numState.length;
        i++
    ) {
        const globalCode =
            numState[i];

        const localCode =
            globalCodeToLocal[globalCode];

        id =
            id * FB_BASES[i]
            + localCode;
    }

    return id;
}


function applyMoveNumTo(
    numState,
    moveCode,
    out
) {
    const moveTable =
        moveOrbitsNum[moveCode];

    for (
        let i = 0;
        i < numState.length;
        i++
    ) {
        out[i] =
            moveTable[numState[i]];
    }

    return out;
}


// ============================================================================
// Move rules
// ============================================================================

const allowedAxisPairs =
    new Set([
        'Ff',
        'Rr',
        'UD'
    ]);

const forbiddenAxisPairs =
    new Set([
        "UD'",
        "U'D",
        'U2D2',

        "Rr'",
        "R'r",
        'R2r2',

        "Ff'",
        "F'f",
        'F2f2'
    ]);


function violatesEarlyMoveRule(
    prevMoveCode,
    moveCode
) {
    if (prevMoveCode === -1) {
        return false;
    }

    if (
        moveType[prevMoveCode]
        === moveType[moveCode]
    ) {
        return false;
    }

    const prevMove =
        BlFixedCodeToMove[
            prevMoveCode
        ];

    const move =
        BlFixedCodeToMove[
            moveCode
        ];

    const a = prevMove[0];
    const b = move[0];

    if (
        moveAxis[a]
        !== moveAxis[b]
    ) {
        return false;
    }

    if (
        !allowedAxisPairs.has(a + b)
    ) {
        return true;
    }

    if (
        forbiddenAxisPairs.has(
            prevMove + move
        )
    ) {
        return true;
    }

    return false;
}


function isSameMoveType(
    prevMoveCode,
    moveCode
) {
    if (prevMoveCode === -1) {
        return false;
    }

    return (
        moveType[prevMoveCode]
        === moveType[moveCode]
    );
}


// ============================================================================
// Small seen helper
// ============================================================================

function hasSeenId(seenIds, id) {
    for (
        let i = 0;
        i < seenIds.length;
        i++
    ) {
        if (seenIds[i] === id) {
            return true;
        }
    }

    return false;
}


// ============================================================================
// Search ALL solutions at exactly targetDepth
// ============================================================================

export function searchExactDepth(
    state,
    targetDepth
) {
    requireReady();

    if (
        !Number.isInteger(targetDepth) ||
        targetDepth < 0
    ) {
        throw new Error(
            `Invalid target depth: ${targetDepth}`
        );
    }

    const startNumState =
        stateToNumState(state);

    const startId =
        encodeNumState(startNumState);

    const lowerBound =
        fbDist[startId];

    if (
        lowerBound === 255 ||
        lowerBound > targetDepth
    ) {
        return [];
    }

    const solutions = [];

    const stateBuffers =
        Array.from(
            {
                length:
                    targetDepth + 1
            },
            () =>
                new Array(
                    FB_ORDER.length
                )
        );

    const seenBuffers =
        Array.from(
            {
                length:
                    targetDepth + 1
            },
            () => []
        );

    const pathBuffer =
        new Array(targetDepth);


    function dfs(
        numState,
        depthLeft,
        currentId,
        prevMoveCode
    ) {
        if (
            fbDist[currentId] === 255 ||
            fbDist[currentId] > depthLeft
        ) {
            return;
        }

        if (depthLeft === 0) {
            if (
                fbDist[currentId] === 0
            ) {
                solutions.push(
                    pathBuffer.map(
                        code =>
                            BlFixedCodeToMove[
                                code
                            ]
                    )
                );
            }

            return;
        }

        const ply =
            targetDepth - depthLeft;

        const nextDepthLeft =
            depthLeft - 1;

        const nextState =
            stateBuffers[
                nextDepthLeft
            ];

        const seenIds =
            seenBuffers[depthLeft];

        seenIds.length = 0;


        for (
            let moveCode = 0;
            moveCode
                < BlFixedCodeToMove.length;
            moveCode++
        ) {
            if (
                violatesEarlyMoveRule(
                    prevMoveCode,
                    moveCode
                )
            ) {
                continue;
            }

            applyMoveNumTo(
                numState,
                moveCode,
                nextState
            );

            const nextId =
                encodeNumState(
                    nextState
                );

            // 该 move 对 FB state 无影响
            if (
                nextId === currentId
            ) {
                continue;
            }

            // 同一个 parent 下，
            // 多个 move 得到相同 FB state
            if (
                hasSeenId(
                    seenIds,
                    nextId
                )
            ) {
                continue;
            }

            // 注意：
            // 先进入 seen，再检查 same type。
            seenIds.push(nextId);

            if (
                isSameMoveType(
                    prevMoveCode,
                    moveCode
                )
            ) {
                continue;
            }

            const nextDist =
                fbDist[nextId];

            if (
                nextDist === 255 ||
                nextDist
                    > nextDepthLeft
            ) {
                continue;
            }

            pathBuffer[ply] =
                moveCode;

            dfs(
                nextState,
                nextDepthLeft,
                nextId,
                moveCode
            );
        }
    }


    dfs(
        startNumState,
        targetDepth,
        startId,
        -1
    );

    return solutions;
}


// ============================================================================
// Search ONE solution at exactly targetDepth
// ============================================================================

export function searchOneExactDepth(
    state,
    targetDepth
) {
    requireReady();

    if (
        !Number.isInteger(targetDepth) ||
        targetDepth < 0
    ) {
        throw new Error(
            `Invalid target depth: ${targetDepth}`
        );
    }

    const startNumState =
        stateToNumState(state);

    const startId =
        encodeNumState(startNumState);

    const lowerBound =
        fbDist[startId];

    if (
        lowerBound === 255 ||
        lowerBound > targetDepth
    ) {
        return null;
    }

    const stateBuffers =
        Array.from(
            {
                length:
                    targetDepth + 1
            },
            () =>
                new Array(
                    FB_ORDER.length
                )
        );

    const seenBuffers =
        Array.from(
            {
                length:
                    targetDepth + 1
            },
            () => []
        );

    const pathBuffer =
        new Array(targetDepth);


    function dfs(
        numState,
        depthLeft,
        currentId,
        prevMoveCode
    ) {
        if (
            fbDist[currentId] === 255 ||
            fbDist[currentId] > depthLeft
        ) {
            return false;
        }

        if (depthLeft === 0) {
            return (
                fbDist[currentId] === 0
            );
        }

        const ply =
            targetDepth - depthLeft;

        const nextDepthLeft =
            depthLeft - 1;

        const nextState =
            stateBuffers[
                nextDepthLeft
            ];

        const seenIds =
            seenBuffers[depthLeft];

        seenIds.length = 0;


        for (
            let moveCode = 0;
            moveCode
                < BlFixedCodeToMove.length;
            moveCode++
        ) {
            if (
                violatesEarlyMoveRule(
                    prevMoveCode,
                    moveCode
                )
            ) {
                continue;
            }

            applyMoveNumTo(
                numState,
                moveCode,
                nextState
            );

            const nextId =
                encodeNumState(
                    nextState
                );

            if (
                nextId === currentId
            ) {
                continue;
            }

            if (
                hasSeenId(
                    seenIds,
                    nextId
                )
            ) {
                continue;
            }

            seenIds.push(nextId);

            if (
                isSameMoveType(
                    prevMoveCode,
                    moveCode
                )
            ) {
                continue;
            }

            const nextDist =
                fbDist[nextId];

            if (
                nextDist === 255 ||
                nextDist
                    > nextDepthLeft
            ) {
                continue;
            }

            pathBuffer[ply] =
                moveCode;

            if (
                dfs(
                    nextState,
                    nextDepthLeft,
                    nextId,
                    moveCode
                )
            ) {
                return true;
            }
        }

        return false;
    }


    const found =
        dfs(
            startNumState,
            targetDepth,
            startId,
            -1
        );

    if (!found) {
        return null;
    }

    return pathBuffer.map(
        code =>
            BlFixedCodeToMove[code]
    );
}


// ============================================================================
// Solution sorting
// ============================================================================

function getSolutionScore(moves) {
    let sliceMove = 0;
    let goodUD = 0;

    let prevMove = null;

    for (const move of moves) {
        if (
            'MSV'.includes(move[0])
        ) {
            sliceMove++;
        }

        if (prevMove !== null) {
            const pair =
                prevMove + move;

            if (
                pair === 'UD' ||
                pair === "U'D'" ||
                pair === 'U2D2'
            ) {
                goodUD++;
            }
        }

        prevMove = move;
    }

    return {
        sliceMove,
        goodUD
    };
}


export function sortSolutions(
    solutions
) {
    return [...solutions].sort(
        (a, b) => {
            const scoreA =
                getSolutionScore(a);

            const scoreB =
                getSolutionScore(b);

            if (
                scoreA.goodUD
                !== scoreB.goodUD
            ) {
                return (
                    scoreB.goodUD
                    - scoreA.goodUD
                );
            }

            if (
                scoreA.sliceMove
                !== scoreB.sliceMove
            ) {
                return (
                    scoreA.sliceMove
                    - scoreB.sliceMove
                );
            }

            return 0;
        }
    );
}


// ============================================================================
// Solve one FB case
// ============================================================================

export function solveFBState(state) {
    requireReady();

    const id =
        encodeFBState(state);

    const dist =
        getDistanceById(id);

    if (dist === null) {
        throw new Error(
            'Invalid or unreachable FB state'
        );
    }

    const optimal =
        sortSolutions(
            searchExactDepth(
                state,
                dist
            )
        );

    const plusOne =
        sortSolutions(
            searchExactDepth(
                state,
                dist + 1
            )
        );

    return {
        id,
        dist,
        optimal,
        plusOne
    };
}


export function solveFBId(id) {
    requireReady();

    const state =
        decodeFBState(id);

    return {
        state,
        fullState:
            decodeFullFBState(id),

        ...solveFBState(state)
    };
}


// ============================================================================
// Scramble generation
// ============================================================================

export function generateScrambleForState(
    state,
    {
        minExtra = 1,
        maxDepth = 20
    } = {}
) {
    requireReady();

    const id =
        encodeFBState(state);

    const dist =
        getDistanceById(id);

    if (dist === null) {
        throw new Error(
            'Invalid or unreachable FB state'
        );
    }

    const firstDepth =
        dist + Math.max(1, minExtra);

    for (
        let depth = firstDepth;
        depth <= maxDepth;
        depth++
    ) {
        const solution =
            searchOneExactDepth(
                state,
                depth
            );

        if (!solution) {
            continue;
        }

        const scrambleMoves =
            invertAlg(solution);

        return {
            solutionDepth: depth,

            solution,

            scrambleMoves,

            scramble:
                scrambleMoves.join(' ')
        };
    }

    throw new Error(
        `Could not generate a scramble between depth ${firstDepth} and ${maxDepth}`
    );
}


// ============================================================================
// Random case
// ============================================================================

export function createRandomCase(
    dist,
    options = {}
) {
    requireReady();

    const id =
        getRandomIdByDistance(dist);

    const state =
        decodeFBState(id);

    const fullState =
        decodeFullFBState(id);

    const scrambleInfo =
        generateScrambleForState(
            state,
            options
        );

    const solutionInfo =
        solveFBState(state);

    return {
        id,
        dist,

        state,
        fullState,

        scramble:
            scrambleInfo.scramble,

        scrambleMoves:
            scrambleInfo.scrambleMoves,

        scrambleLength:
            scrambleInfo.solutionDepth,

        optimal:
            solutionInfo.optimal,

        plusOne:
            solutionInfo.plusOne
    };
}


// ============================================================================
// Small display helpers
// ============================================================================

export function algArrayToString(
    moves
) {
    return moves.join(' ');
}


export function solutionsToStrings(
    solutions
) {
    return solutions.map(
        moves => moves.join(' ')
    );
}