import './style.css';

import { createCube3D } from './cube/cube3d.js';

import {
  createSolvedFBState,
  readScramble,
  invertAlg
} from './solver/state.js';

import {
  initSolver,
  getAvailableDistances,
  createRandomCase,
  solveFBState,
  generateScrambleForState
} from './solver/solver.js';


// ============================================================================
// Prefix
// ============================================================================

const preRotationMap = {
  none: '',
  yo: '',
  yr: 'y2',
  yb: 'y',
  yg: "y'",
  wo: 'x2',
  wr: 'z2',
  wb: 'x2 y',
  wg: 'z2 y'
};

let selectedPrefix = 'none';


// ============================================================================
// DOM
// ============================================================================

const cubeViewer =
  document.getElementById('cubeViewer');

const resetCameraButton =
  document.getElementById('resetCameraButton');


const distSelect =
  document.getElementById('distSelect');

const randomButton =
  document.getElementById('randomButton');


const prefixControl =
  document.getElementById('prefixControl');

const prefixButton =
  document.getElementById('prefixButton');

const prefixMenu =
  document.getElementById('prefixMenu');

const prefixOptions =
  document.querySelectorAll('.prefix-option');


const scrambleInput =
  document.getElementById('scrambleInput');

const invertButton =
  document.getElementById('invertButton');

const clearButton =
  document.getElementById('clearButton');

const readButton =
  document.getElementById('readButton');


const currentOptimalLength =
  document.getElementById('currentOptimalLength');

const currentOptimalCount =
  document.getElementById('currentOptimalCount');

const scrambleDisplay =
  document.getElementById('scrambleDisplay');

const shortScrambleArea =
  document.getElementById('shortScrambleArea');

const shortScrambleDisplay =
  document.getElementById('shortScrambleDisplay');

const solveButton =
  document.getElementById('solveButton');


const solutionPanel =
  document.getElementById('solutionPanel');

const optimalHeading =
  document.getElementById('optimalHeading');

const optimalCount =
  document.getElementById('optimalCount');

const optimalSolutions =
  document.getElementById('optimalSolutions');

const plusOneButton =
  document.getElementById('plusOneButton');

const plusOneSection =
  document.getElementById('plusOneSection');

const plusOneHeading =
  document.getElementById('plusOneHeading');

const plusOneCount =
  document.getElementById('plusOneCount');

const plusOneSolutions =
  document.getElementById('plusOneSolutions');


const statusMessage =
  document.getElementById('statusMessage');


// ============================================================================
// App state
// ============================================================================

let cube = null;

let currentCase = null;

let appReady = false;
let busy = false;


// ============================================================================
// Status
// ============================================================================

function setStatus(
  message = '',
  isError = false
) {
  statusMessage.textContent =
    message;

  statusMessage.classList.toggle(
    'error',
    isError
  );
}


function setBusy(value) {
  busy = value;

  distSelect.disabled =
    value || !appReady;

  randomButton.disabled =
    value || !appReady;

  readButton.disabled =
    value || !appReady;

  solveButton.disabled =
    value ||
    !appReady ||
    currentCase === null;
}


function nextFrame() {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      resolve();
    });
  });
}


// ============================================================================
// Display notation
// ============================================================================

const displayMoveMap = {
  V: "(U D')",
  "V'": "(U' D)",
  V2: '(U2 D2)',

  W: "(R L')",
  "W'": "(R' L)",
  W2: '(R2 L2)',

  N: "(F B')",
  "N'": "(F' B)",
  N2: '(F2 B2)'
};


function formatMoves(moves) {
  return moves
    .map(move =>
      displayMoveMap[move] ??
      move
    )
    .join(' ');
}


function formatAlg(alg) {
  if (!alg) {
    return '';
  }

  if (Array.isArray(alg)) {
    return formatMoves(alg);
  }

  return formatMoves(
    alg
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  );
}


// ============================================================================
// Prefix UI
// ============================================================================

function createPrefixIcon(prefix) {
  const topColor =
    prefix[1];

  const bottomColor =
    prefix[0];

  const icon =
    document.createElement('span');

  icon.className =
    'fb-prefix-icon';

  const top =
    document.createElement('span');

  top.className =
    `fb-prefix-top face-${topColor}`;

  const bottom =
    document.createElement('span');

  bottom.className =
    `fb-prefix-bottom face-${bottomColor}`;

  icon.append(
    top,
    bottom
  );

  return icon;
}


function updatePrefixButton() {
  prefixButton.replaceChildren();

  if (selectedPrefix === 'none') {
    prefixButton.textContent =
      'No prefix';

    return;
  }

  const icon =
    createPrefixIcon(
      selectedPrefix
    );

  prefixButton.appendChild(
    icon
  );

  const rotation =
    preRotationMap[
    selectedPrefix
    ];

  if (rotation) {
    const text =
      document.createElement('span');

    text.textContent =
      rotation;

    prefixButton.appendChild(
      text
    );
  }
}

function openPrefixMenu() {
  prefixMenu.hidden = false;

  prefixButton.setAttribute(
    'aria-expanded',
    'true'
  );
}


function closePrefixMenu() {
  prefixMenu.hidden = true;

  prefixButton.setAttribute(
    'aria-expanded',
    'false'
  );
}


function togglePrefixMenu() {
  if (prefixMenu.hidden) {
    openPrefixMenu();
  } else {
    closePrefixMenu();
  }
}


function getSelectedPrefixAlg() {
  return (
    preRotationMap[
    selectedPrefix
    ] ?? ''
  );
}


// ============================================================================
// Distance selector
// ============================================================================

function fillDistanceSelector() {
  const distances =
    getAvailableDistances();

  distSelect.replaceChildren();

  for (const dist of distances) {
    if (dist > 1) {
      const option =
        document.createElement(
          'option'
        );

      option.value =
        String(dist);

      option.textContent =
        String(dist);

      distSelect.appendChild(
        option
      );
    }
  }

  if (distances.includes(5)) {
    distSelect.value = '5';
  } else if (distances.length) {
    distSelect.value =
      String(
        distances[
        distances.length - 1
        ]
      );
  }
}


// ============================================================================
// Solutions
// ============================================================================

function clearSolutions() {
  solutionPanel.hidden = true;

  optimalSolutions.replaceChildren();
  plusOneSolutions.replaceChildren();

  optimalCount.textContent = '';
  plusOneCount.textContent = '';

  plusOneButton.hidden = true;
  plusOneSection.hidden = true;
}


function renderSolutionList(
  container,
  solutions
) {
  container.replaceChildren();

  const fragment =
    document.createDocumentFragment();

  for (
    let i = 0;
    i < solutions.length;
    i++
  ) {
    const moves =
      solutions[i];

    const item =
      document.createElement(
        'div'
      );

    item.className =
      'solution-item';

    item.textContent =
      `${i + 1}. ${formatMoves(moves)}`;

    fragment.appendChild(
      item
    );
  }

  container.appendChild(
    fragment
  );
}


function showOptimalSolutions() {
  if (!currentCase) {
    return;
  }

  solveButton.disabled = true;
  
  solutionPanel.hidden = false;

  plusOneSection.hidden = true;

  optimalHeading.textContent =
    `${currentCase.dist} moves`;

  optimalCount.textContent =
    `(${currentCase.optimal.length})`;

  renderSolutionList(
    optimalSolutions,
    currentCase.optimal
  );

  plusOneButton.hidden =
    currentCase.plusOne.length === 0;
}


function showPlusOneSolutions() {
  if (!currentCase) {
    return;
  }

  plusOneSection.hidden = false;

  plusOneHeading.textContent =
    `${currentCase.dist + 1} moves`;

  plusOneCount.textContent =
    `(${currentCase.plusOne.length})`;

  renderSolutionList(
    plusOneSolutions,
    currentCase.plusOne
  );

  plusOneButton.hidden = true;
}


// ============================================================================
// Current case
// ============================================================================

function setCurrentCase(caseInfo) {
  currentCase =
    caseInfo;

  currentOptimalLength.textContent =
    String(caseInfo.dist);

  currentOptimalCount.textContent =
    String(
      caseInfo.optimal.length
    );

  scrambleDisplay.textContent =
    formatAlg(
      caseInfo.scramble
    ) || '—';


  if (caseInfo.shortScramble) {
    shortScrambleArea.hidden =
      false;

    shortScrambleDisplay.textContent =
      formatAlg(
        caseInfo.shortScramble
      );
  } else {
    shortScrambleArea.hidden =
      true;

    shortScrambleDisplay.textContent =
      '—';
  }


  cube.setState(
    caseInfo.fullState
  );

  clearSolutions();

  solveButton.disabled = false;
}


// ============================================================================
// Random case
// ============================================================================

async function generateRandomCase() {
  if (
    busy ||
    !appReady
  ) {
    return;
  }

  const dist =
    Number(
      distSelect.value
    );

  if (!Number.isInteger(dist)) {
    setStatus(
      'Select a valid optimal length.',
      true
    );

    return;
  }

  setBusy(true);

  setStatus(
    `Generating ${dist}-move case...`
  );

  await nextFrame();

  try {
    const caseInfo =
      createRandomCase(dist);

    setCurrentCase(
      caseInfo
    );

    setStatus('');
  } catch (error) {
    console.error(error);

    setStatus(
      error.message ||
      String(error),
      true
    );
  } finally {
    setBusy(false);
  }
}


// ============================================================================
// Manual scramble
// ============================================================================

async function readManualScramble() {
  if (
    busy ||
    !appReady
  ) {
    return;
  }

  const input =
    scrambleInput.value.trim().replace(/[()]/, "");

  if (!input) {
    setStatus(
      'Enter a scramble first.',
      true
    );

    return;
  }


  const prefix =
    getSelectedPrefixAlg();

  const algWithPrefix =
    [
      prefix,
      input
    ]
      .filter(Boolean)
      .join(' ');


  setBusy(true);

  setStatus(
    'Reading scramble and solving case...'
  );

  await nextFrame();


  try {
    const readResult =
      readScramble(
        algWithPrefix
      );


    const solutionInfo =
      solveFBState(
        readResult.fbState
      );


    let shortScramble = null;


    // 只检查用户真正输入的 scramble。
    // prefix 和自动补上的 BL rotation 不计入这 10 步。
    const inputMoveCount =
      input
        .split(/\s+/)
        .filter(Boolean)
        .length;


    if (inputMoveCount > 10) {
      const shortScrambleInfo =
        generateScrambleForState(
          readResult.fbState
        );

      shortScramble =
        shortScrambleInfo.scramble;
    }


    const caseInfo = {
      id:
        solutionInfo.id,

      dist:
        solutionInfo.dist,

      state:
        readResult.fbState,

      fullState:
        readResult.fullState,

      scramble:
        readResult.alg,

      scrambleMoves:
        readResult.moves,

      shortScramble,

      optimal:
        solutionInfo.optimal,

      plusOne:
        solutionInfo.plusOne
    };

    setCurrentCase(
      caseInfo
    );

    if (readResult.rotation) {
      setStatus(
        `BL fixed by appending ${readResult.rotation}`
      );
    } else {
      setStatus('');
    }

  } catch (error) {
    console.error(error);

    setStatus(
      error.message ||
      String(error),
      true
    );
  } finally {
    setBusy(false);
  }
}


// ============================================================================
// Input helpers
// ============================================================================

function invertScrambleInput() {
  const input =
    scrambleInput.value.trim();

  if (!input) {
    return;
  }

  try {
    readScramble(input);


    const inverted =
      invertAlg(input);

    scrambleInput.value =
      inverted.join(' ');

    scrambleInput.focus();

    setStatus('');
  } catch (error) {
    console.error(error);

    setStatus(
      error.message ||
      String(error),
      true
    );
  }
}


function clearScrambleInput() {
  scrambleInput.value = '';

  scrambleInput.focus();

  setStatus('');
}


// ============================================================================
// Events
// ============================================================================

randomButton.addEventListener(
  'click',
  generateRandomCase
);


readButton.addEventListener(
  'click',
  readManualScramble
);


invertButton.addEventListener(
  'click',
  invertScrambleInput
);


clearButton.addEventListener(
  'click',
  clearScrambleInput
);


scrambleInput.addEventListener(
  'keydown',
  event => {
    if (
      event.key === 'Enter' &&
      !readButton.disabled
    ) {
      event.preventDefault();

      readManualScramble();
    }
  }
);


solveButton.addEventListener(
  'click',
  showOptimalSolutions
);


plusOneButton.addEventListener(
  'click',
  showPlusOneSolutions
);


resetCameraButton.addEventListener(
  'click',
  () => {
    cube?.resetCamera();
  }
);


// Prefix button

prefixButton.addEventListener(
  'click',
  event => {
    event.stopPropagation();

    togglePrefixMenu();
  }
);


for (const option of prefixOptions) {
  option.addEventListener(
    'click',
    event => {
      event.stopPropagation();

      selectedPrefix =
        option.dataset.prefix;

      updatePrefixButton();

      closePrefixMenu();

      scrambleInput.focus();
    }
  );
}


document.addEventListener(
  'pointerdown',
  event => {
    if (
      !prefixMenu.hidden &&
      !prefixControl.contains(
        event.target
      )
    ) {
      closePrefixMenu();
    }
  }
);


document.addEventListener(
  'keydown',
  event => {
    if (
      event.key === 'Escape' &&
      !prefixMenu.hidden
    ) {
      closePrefixMenu();

      prefixButton.focus();
    }
  }
);


// ============================================================================
// Initialization
// ============================================================================

async function initialize() {
  setStatus(
    'Loading solver and 3D model...'
  );

  setBusy(true);

  try {
    const solvedState =
      createSolvedFBState(true);


    const [
      cubeResult
    ] = await Promise.all([
      createCube3D(
        cubeViewer,
        {
          initialState:
            solvedState
        }
      ),

      initSolver()
    ]);


    cube =
      cubeResult;

    fillDistanceSelector();

    updatePrefixButton();

    appReady = true;

    setStatus('');

    setBusy(false);

  } catch (error) {
    console.error(error);

    appReady = false;

    setBusy(false);

    distSelect.innerHTML =
      '<option>Error</option>';

    setStatus(
      error.message ||
      String(error),
      true
    );
  }
}


initialize();