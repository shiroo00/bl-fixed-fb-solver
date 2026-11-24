export const DEFAULT_COLOR_SCHEME = 'yr';


export const palette = {
    b: 'hsl(209, 93%, 30%)',
    g: 'hsl(123, 100%, 27%)',
    r: 'hsl(5, 79%, 42%)',
    o: 'hsl(23, 92%, 48%)',
    y: 'hsl(46, 100%, 50%)',
    w: 'hsl(0, 0%, 84%)'
};


export const stickerNameToModelIndex = {
    'F-F': 0,
    'URF-U': 1,
    'D-D': 2,
    'B-B': 3,
    'R-R': 4,
    'L-L': 5,

    'UBR-U': 6,
    'UFL-U': 7,
    'ULB-U': 8,
    'UR-U': 9,
    'UL-U': 10,
    'UF-U': 11,
    'UB-U': 12,
    'U-U': 13,

    'DFR-F': 14,
    'URF-F': 15,
    'DLF-F': 16,
    'UFL-F': 17,
    'FR-F': 18,
    'FL-F': 19,
    'DF-F': 20,
    'UF-F': 21,

    'DFR-R': 22,
    'DRB-R': 23,
    'URF-R': 24,
    'UBR-R': 25,
    'DR-R': 26,
    'UR-R': 27,
    'FR-R': 28,
    'BR-R': 29,

    'DFR-D': 30,
    'DRB-D': 31,
    'DLF-D': 32,
    'DBL-D': 33,
    'DR-D': 34,
    'DL-D': 35,
    'DF-D': 36,
    'DB-D': 37,

    'UBR-B': 38,
    'DRB-B': 39,
    'ULB-B': 40,
    'DBL-B': 41,
    'BR-B': 42,
    'BL-B': 43,
    'UB-B': 44,
    'DB-B': 45,

    'DLF-L': 46,
    'DBL-L': 47,
    'UFL-L': 48,
    'ULB-L': 49,
    'DL-L': 50,
    'UL-L': 51,
    'FL-L': 52,
    'BL-L': 53
};


export const modelIndexToStickerName = [
    'F-F',
    'URF-U',
    'D-D',
    'B-B',
    'R-R',
    'L-L',

    'UBR-U',
    'UFL-U',
    'ULB-U',
    'UR-U',
    'UL-U',
    'UF-U',
    'UB-U',
    'U-U',

    'DFR-F',
    'URF-F',
    'DLF-F',
    'UFL-F',
    'FR-F',
    'FL-F',
    'DF-F',
    'UF-F',

    'DFR-R',
    'DRB-R',
    'URF-R',
    'UBR-R',
    'DR-R',
    'UR-R',
    'FR-R',
    'BR-R',

    'DFR-D',
    'DRB-D',
    'DLF-D',
    'DBL-D',
    'DR-D',
    'DL-D',
    'DF-D',
    'DB-D',

    'UBR-B',
    'DRB-B',
    'ULB-B',
    'DBL-B',
    'BR-B',
    'BL-B',
    'UB-B',
    'DB-B',

    'DLF-L',
    'DBL-L',
    'UFL-L',
    'ULB-L',
    'DL-L',
    'UL-L',
    'FL-L',
    'BL-L'
];


export const faceMap = {
    U: [
        1,
        6, 7, 8,
        9, 10, 11, 12,
        13
    ],

    F: [
        0,
        14, 15, 16, 17,
        18, 19, 20, 21
    ],

    R: [
        4,
        22, 23, 24, 25,
        26, 27, 28, 29
    ],

    D: [
        2,
        30, 31, 32, 33,
        34, 35, 36, 37
    ],

    B: [
        3,
        38, 39, 40, 41,
        42, 43, 44, 45
    ],

    L: [
        5,
        46, 47, 48, 49,
        50, 51, 52, 53
    ]
};


export const colorSchemes = {
    gr: {
        U: 'g',
        D: 'b',
        F: 'r',
        B: 'o',
        R: 'w',
        L: 'y'
    },

    rw: {
        U: 'r',
        D: 'o',
        F: 'w',
        B: 'y',
        R: 'g',
        L: 'b'
    },

    wg: {
        U: 'w',
        D: 'y',
        F: 'g',
        B: 'b',
        R: 'r',
        L: 'o'
    },

    rg: {
        U: 'r',
        D: 'o',
        F: 'g',
        B: 'b',
        R: 'y',
        L: 'w'
    },

    gy: {
        U: 'g',
        D: 'b',
        F: 'y',
        B: 'w',
        R: 'r',
        L: 'o'
    },

    yr: {
        U: 'y',
        D: 'w',
        F: 'r',
        B: 'o',
        R: 'g',
        L: 'b'
    },

    rb: {
        U: 'r',
        D: 'o',
        F: 'b',
        B: 'g',
        R: 'w',
        L: 'y'
    },

    bw: {
        U: 'b',
        D: 'g',
        F: 'w',
        B: 'y',
        R: 'r',
        L: 'o'
    },

    wr: {
        U: 'w',
        D: 'y',
        F: 'r',
        B: 'o',
        R: 'b',
        L: 'g'
    },

    br: {
        U: 'b',
        D: 'g',
        F: 'r',
        B: 'o',
        R: 'y',
        L: 'w'
    },

    ry: {
        U: 'r',
        D: 'o',
        F: 'y',
        B: 'w',
        R: 'b',
        L: 'g'
    },

    yb: {
        U: 'y',
        D: 'w',
        F: 'b',
        B: 'g',
        R: 'r',
        L: 'o'
    },

    bo: {
        U: 'b',
        D: 'g',
        F: 'o',
        B: 'r',
        R: 'w',
        L: 'y'
    },

    ow: {
        U: 'o',
        D: 'r',
        F: 'w',
        B: 'y',
        R: 'b',
        L: 'g'
    },

    wb: {
        U: 'w',
        D: 'y',
        F: 'b',
        B: 'g',
        R: 'o',
        L: 'r'
    },

    ob: {
        U: 'o',
        D: 'r',
        F: 'b',
        B: 'g',
        R: 'y',
        L: 'w'
    },

    by: {
        U: 'b',
        D: 'g',
        F: 'y',
        B: 'w',
        R: 'o',
        L: 'r'
    },

    yo: {
        U: 'y',
        D: 'w',
        F: 'o',
        B: 'r',
        R: 'b',
        L: 'g'
    },

    og: {
        U: 'o',
        D: 'r',
        F: 'g',
        B: 'b',
        R: 'w',
        L: 'y'
    },

    gw: {
        U: 'g',
        D: 'b',
        F: 'w',
        B: 'y',
        R: 'o',
        L: 'r'
    },

    wo: {
        U: 'w',
        D: 'y',
        F: 'o',
        B: 'r',
        R: 'g',
        L: 'b'
    },

    go: {
        U: 'g',
        D: 'b',
        F: 'o',
        B: 'r',
        R: 'y',
        L: 'w'
    },

    oy: {
        U: 'o',
        D: 'r',
        F: 'y',
        B: 'w',
        R: 'g',
        L: 'b'
    },

    yg: {
        U: 'y',
        D: 'w',
        F: 'g',
        B: 'b',
        R: 'o',
        L: 'r'
    }
};